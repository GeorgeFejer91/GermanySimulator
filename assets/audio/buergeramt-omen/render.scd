// Bürgeramt Aktenkurier omen: two stationary, 16-second layers.
// Run from the repository root with the SuperCollider 3.14.1 sclang executable.
// NRT only: this file does not boot an audio device or play sound.
// The first 16 seconds warm the server filters; crop seconds 16..32 from each WAV.
(
var outputDir = File.getcwd +/+ "output/omen-audio";
var rate = 48000;
var renderSeconds = 32.0;
var options = ServerOptions.new;
var bedDef, tensionDef, render;
var serverProgram = "SC_SYNTH_PATH".getenv;

if(serverProgram.notNil) { Score.program = serverProgram; };

options.numInputBusChannels = 0;
options.numOutputBusChannels = 2;
options.sampleRate = rate;

bedDef = SynthDef(\amtOmenBed, {
    var swell, body, infra, hollow, cold, breath, left, right;
    // All oscillators and modulations complete an integer number of cycles in 16 s.
    // A one-eighth-Hz beating pair gives the drone a slow unstable centre.
    swell = 0.82 + (SinOsc.kr(0.0625, -pi / 2) * 0.10);
    infra = SinOsc.ar(55, 0, 0.080) + SinOsc.ar(55.125, 1.3, 0.061);
    body = SinOsc.ar(82.5, 0.7, 0.034) + SinOsc.ar(110, 1.8, 0.023);
    // Flattened second against the A pedal: present without becoming a melody.
    cold = SinOsc.ar(116.5, 0.2, 0.016) + SinOsc.ar(233.0, 0.9, 0.009);
    hollow = VarSaw.ar(55, 0, 0.43, 0.014);
    hollow = LPF.ar(hollow, 260 + (SinOsc.kr(0.125, 0.4) * 85));
    // Narrow, organ-like air avoids external samples and broadband noise seams.
    breath = Mix.fill(18, { |i|
        var f = 390 + (i * 73.25);
        SinOsc.ar(f, i * 0.73, 0.00090 / (1 + (i * 0.035)))
    });
    breath = HPF.ar(breath, 340);
    left = (infra + body + cold + hollow + breath) * swell;
    right = (infra * 0.96) + (body * 0.91) + (cold * 1.08)
        + (hollow * 0.89) + (breath * 0.82);
    right = right * (0.81 + (SinOsc.kr(0.0625, 0.5) * 0.10));
    Out.ar(0, (LeakDC.ar([left, right]) * 1.5).tanh);
});

tensionDef = SynthDef(\amtOmenTension, {
    var pulse, tremor, glass, scrape, haze, left, right;
    pulse = 0.76 + (SinOsc.kr(0.125, -0.7) * 0.13);
    tremor = 0.77 + (SinOsc.kr(0.375, 0.2) * 0.18);
    // Inharmonic but periodic metallic partials; small dissonances climb
    // above the low bed while leaving the spoken line a clear centre.
    glass = SinOsc.ar(587.3125, 0.6, 0.013)
        + SinOsc.ar(698.4375, 2.1, 0.009)
        + SinOsc.ar(1047.0625, 0.2, 0.007)
        + SinOsc.ar(1397.125, 1.4, 0.0048);
    scrape = Mix.fill(30, { |i|
        var f = 1470 + (i * 173.875);
        var a = 0.00058 / (1 + (i * 0.027));
        SinOsc.ar(f, i * 1.43, a)
    });
    haze = Mix.fill(14, { |i|
        var f = 910 + (i * 311.25);
        SinOsc.ar(f, i * 0.89, 0.00058)
    });
    scrape = HPF.ar(scrape, 1100) * tremor;
    haze = HPF.ar(haze, 760) * (0.55 + (SinOsc.kr(0.0625, 1.1) * 0.22));
    left = ((glass * 0.75) + scrape + haze) * pulse;
    right = ((glass * 0.67) + (scrape * 0.86) + (haze * 1.1))
        * (0.76 + (SinOsc.kr(0.125, 0.4) * 0.12));
    Out.ar(0, (LeakDC.ar([left, right]) * 8.8).tanh);
});

render = { |def, name, done|
    var score = Score([
        [0.0, [\d_recv, def.asBytes]],
        [0.01, [\s_new, def.name, 1001, 0, 0]],
        [renderSeconds, [\n_free, 1001]]
    ]);
    score.recordNRT(
        outputFilePath: outputDir +/+ (name ++ "-warm.wav"),
        sampleRate: rate,
        headerFormat: "WAV",
        sampleFormat: "float",
        options: options,
        duration: renderSeconds,
        action: { ("OMEN_RENDER_DONE " ++ name).postln; done.value; }
    );
};

render.value(bedDef, "bed", {
    render.value(tensionDef, "tension", { 0.exit; });
});
)
