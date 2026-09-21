import os
import tempfile
import threading
import time
import tkinter as tk
from tkinter import filedialog, messagebox, ttk

MODEL = "tts_models/multilingual/multi-dataset/xtts_v2"


class App(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Voice Clone Lab")
        self.geometry("520x420")
        self.minsize(460, 340)
        self.busy = False
        pad = {"padx": 12, "pady": 6}

        self.ref = tk.StringVar()
        tk.Label(self, text="Referenz-Audio").pack(anchor="w", **pad)
        row = tk.Frame(self)
        row.pack(fill="x", **pad)
        tk.Entry(row, textvariable=self.ref).pack(side="left", fill="x", expand=True)
        tk.Button(row, text="…", command=self.browse).pack(side="left", padx=(6, 0))

        tk.Label(self, text="Sprechtext").pack(anchor="w", **pad)
        self.text = tk.Text(self, height=10, wrap="word")
        self.text.pack(fill="both", expand=True, **pad)
        self.text.insert("1.0", "Meine sehr verehrten Damen und Herren.")

        self.status = tk.Label(self, text="MP3 erscheint neben dem Referenz-Audio.", anchor="w")
        self.status.pack(fill="x", **pad)
        self.bar = ttk.Progressbar(self, mode="indeterminate", length=120)
        self.bar.pack(**pad)
        self.gen = tk.Button(self, text="Erzeuge MP3", command=self.generate)
        self.gen.pack(**pad)

    def browse(self):
        p = filedialog.askopenfilename(
            filetypes=[("Audio", "*.mp3 *.wav *.ogg *.flac"), ("Alle Dateien", "*.*")]
        )
        if p:
            self.ref.set(p)

    def generate(self):
        if self.busy:
            return
        ref = self.ref.get().strip().strip('"')
        text = self.text.get("1.0", "end").strip()
        if not ref or not os.path.isfile(ref):
            messagebox.showerror("Fehler", "Referenz-Audiodatei wählen.")
            return
        if not text:
            messagebox.showerror("Fehler", "Sprechtext eingeben.")
            return
        self.busy = True
        self.gen.configure(state="disabled")
        self.bar.start(12)
        threading.Thread(target=self._run, args=(ref, text), daemon=True).start()

    def _run(self, ref, text):
        def st(msg):
            self.after(0, lambda: self.status.configure(text=msg))

        try:
            os.environ.setdefault("COQUI_TOS_AGREED", "1")
            import TTS.api
            st("Lade Modell (erster Start lädt ~1,9 GB) …")
            tts = TTS.api.TTS(MODEL).to("cpu")
            outdir = os.path.dirname(os.path.abspath(ref))
            stem = os.path.splitext(os.path.basename(ref))[0]
            with tempfile.TemporaryDirectory(prefix="vcl_", dir=outdir) as tmp:
                wav = os.path.join(tmp, "out.wav")
                st("Synthese … (CPU, dauert etwas)")
                tts.tts_to_file(text=text, speaker_wav=[ref], language="de", file_path=wav)
                st("Kodiere MP3 …")
                mp3 = os.path.join(outdir, f"{stem}-{time.strftime('%Y%m%d-%H%M%S')}.mp3")
                code = os.system(f'ffmpeg -y -loglevel error -i "{wav}" '
                                 f'-ac 1 -ar 22050 -b:a 64k "{mp3}"')
                if code != 0 or not os.path.isfile(mp3):
                    self.after(0, self._fail, "FFmpeg-Kodierung fehlgeschlagen.")
                    return
            size = os.path.getsize(mp3) // 1024
            self.after(0, self._done, f"Fertig: {mp3}  ({size} KB)")
        except Exception as e:
            self.after(0, self._fail, f"Fehler: {e}")

    def _done(self, msg):
        self.busy = False
        self.bar.stop()
        self.gen.configure(state="normal")
        self.status.configure(text=msg)

    def _fail(self, msg):
        self.busy = False
        self.bar.stop()
        self.gen.configure(state="normal")
        self.status.configure(text=msg)


if __name__ == "__main__":
    App().mainloop()