"""Silent, headless visual and gesture check for Bürgeramt call families."""

from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from time import sleep
import sys

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "phone-call-ui"
OUT.mkdir(parents=True, exist_ok=True)
LINK_STUB = """
class BuergeramtLink extends EventTarget {
  static fromHash() { return {room:'amt-test', secret:'test', stream:'amt-ticket-test'} }
  channel = {readyState:'open'};
  send(type, payload) {
    (window.__sent ||= []).push({type, payload});
    if (type === 'register') setTimeout(() => {
      this.dispatchEvent(new CustomEvent('message', {detail:{type:'call-arm',id:'grass'}}));
      this.dispatchEvent(new CustomEvent('message', {detail:{type:'call',id:'grass',
        line:'Wer hat diesen Antrag genehmigt?',ringAtPhoneMs:performance.now()+120,
        ringAtUtcMs:null,leadMs:2200}}));
    }, 0);
    return true;
  }
  close() {}
  async start() {
    queueMicrotask(() => this.dispatchEvent(new Event('connected')));
    setTimeout(() => this.dispatchEvent(new CustomEvent('message',
      {detail:{type:'ticket',number:'B-007'}})), 0);
  }
}
"""


def bounds(page):
    return page.evaluate("""() => {
      const box = id => { const r = document.querySelector(id).getBoundingClientRect();
        return {left:r.left,right:r.right,top:r.top,bottom:r.bottom} };
      const call = document.querySelector('#phone-call');
      return {viewport:innerWidth, pageWidth:document.documentElement.scrollWidth,
        callWidth:call.scrollWidth, callClient:call.clientWidth,
        answer:box('#phone-answer'), decline:box('#phone-decline'),
        icon:box('#phone-answer .call-icon'), choices:box('#phone-choices'),
        caller:box('#phone-caller'), fit:[...call.querySelectorAll('[data-pretext-fit]')]
          .map(el => [el.id, el.dataset.pretextFit])};
    }""")


def check_visible(page, label):
    geometry = bounds(page)
    assert geometry["pageWidth"] <= geometry["viewport"] + 1, (label, geometry)
    assert geometry["callWidth"] <= geometry["callClient"] + 1, (label, geometry)
    for key in ("answer", "decline", "icon", "choices", "caller"):
        rect = geometry[key]
        assert rect["left"] >= -1 and rect["right"] <= geometry["viewport"] + 1, (label, key, rect)
    assert geometry["icon"]["left"] >= geometry["answer"]["left"] - 1
    assert geometry["icon"]["right"] <= geometry["answer"]["right"] + 1
    assert not any(fit == "unavailable" for _, fit in geometry["fit"]), (label, geometry["fit"])
    return geometry


def open_call(browser, base, ui, width=390, height=844, english=False, zoom=1):
    context = browser.new_context(viewport={"width": width, "height": height}, locale="de-DE", reduced_motion="no-preference")
    context.route("**/buergeramt-link.js*", lambda route: route.fulfill(
        status=200, content_type="application/javascript", body=LINK_STUB))
    context.route("https://timeapi.io/**", lambda route: route.fulfill(
        status=200, content_type="application/json", body='{"year":2026,"month":10,"day":7,"hour":12,"minute":0,"seconds":0,"milliSeconds":0,"timeZone":"UTC"}',
        headers={"Access-Control-Allow-Origin": "*"}))
    page = context.new_page()
    page.set_default_timeout(5000)
    page.goto(f"{base}/buergeramt-phone.html?callUi={ui}#captions={'en' if english else 'de'}",
              wait_until="domcontentloaded")
    page.locator("#phone-number").wait_for(state="visible")
    page.locator("#phone-name").fill("Erika Mustermann")
    page.locator("#phone-submit").click()
    page.locator("#phone-call").wait_for(state="visible")
    if zoom != 1:
        page.evaluate("factor => document.documentElement.style.zoom = factor", zoom)
    page.evaluate("() => document.fonts.ready")
    sleep(.12)
    assert page.locator("#phone-caller").inner_text() == ("UNKNOWN" if english else "UNBEKANNT")
    assert page.locator("html").get_attribute("data-call-ui") == ui
    return context, page


def drag(page, selector, dx, dy=0):
    box = page.locator(selector).bounding_box()
    x, y = box["x"] + box["width"] / 2, box["y"] + box["height"] / 2
    page.mouse.move(x, y)
    page.mouse.down()
    page.mouse.move(x + dx, y + dy, steps=6)
    page.mouse.up()
    sleep(.05)


def decision(page):
    return page.evaluate("() => (window.__sent || []).filter(x => ['answer','decline'].includes(x.type)).map(x => x.type)")


def run():
    class QuietHandler(SimpleHTTPRequestHandler):
        def log_message(self, *_args):
            pass

    handler = partial(QuietHandler, directory=str(ROOT))
    server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
    Thread(target=server.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{server.server_port}"
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True, args=["--mute-audio"])
            try:
                if "--gestures-only" not in sys.argv:
                    for ui in ("ios", "google", "samsung", "generic"):
                        for width, height, zoom in ((390, 844, 1), (320, 700, 1), (320, 700, 2), (844, 390, 1)):
                            print(f"checking {ui} {width}x{height} zoom {zoom}", flush=True)
                            context, page = open_call(browser, base, ui, width, height, english=ui == "ios", zoom=zoom)
                            label = f"{ui}-{width}x{height}-z{zoom}"
                            for frame in range(4):
                                check_visible(page, f"{label}-frame{frame}")
                                sleep(.3)
                            if width == 390 or zoom == 2:
                                suffix = "" if width == 390 else "-320-zoom2"
                                page.screenshot(path=str(OUT / f"{ui}{suffix}.png"), full_page=False)
                            context.close()
                for ui, selector, dx, expected in (
                    ("ios", "#phone-answer", 0, "answer"),
                    ("generic", "#phone-decline", 0, "decline"),
                    ("google", "#phone-answer", 100, "answer"),
                    ("google", "#phone-answer", -100, "decline"),
                    ("samsung", "#phone-answer", 36, "answer"),
                    ("samsung", "#phone-decline", -36, "decline"),
                ):
                    print(f"checking gesture {ui} {expected}", flush=True)
                    context, page = open_call(browser, base, ui)
                    if dx:
                        drag(page, selector, dx)
                    else:
                        page.locator(selector).click()
                    assert decision(page) == [expected], (ui, expected, decision(page))
                    context.close()
                print("PASS: four call families, six decisions; layout matrix passed unless gestures-only")
                print(OUT)
            finally:
                browser.close()
    finally:
        server.shutdown()


if __name__ == "__main__":
    run()
