// Bürgeramt Aktenkurier omen: two unresolved, stationary 16-second layers.
// No baked tempo/riser/payoff: buergeramt.js owns pulse, pressure and speech;
// the same life signal unfolds and contracts the player-facing Gaussian relief.
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
    var body, infra, brass, cold, left, right;
    // All oscillators and modulations complete an integer number of cycles in 16 s.
    // A one-eighth-Hz beating pair gives the drone a slow unstable centre.
    infra = SinOsc.ar(55, 0, 0.14) + SinOsc.ar(55.125, 1.3, 0.09);
    body = SinOsc.ar(82.5 + SinOsc.ar(55, 0, 12), 0.7, 0.075);
    // Flattened second/tritone, crushed brass and audible midrange on small speakers.
    cold = SinOsc.ar(77.8125, 0.2, 0.035) + SinOsc.ar(116.5, 0.9, 0.035);
    brass = VarSaw.ar([55, 58.25, 110.125], [0, 0.31, 0.67], 0.18).sum;
    brass = LPF.ar((brass * 2.8).tanh, 1800) * 0.11;
    left = infra + body + cold + brass;
    right = (infra * 0.96) + (body * 0.91) + (cold * 1.08) + (brass * 0.93);
    Out.ar(0, HPF.ar(LeakDC.ar([left, right] * 2.4).tanh, 32) * 0.24);
});

tensionDef = SynthDef(\amtOmenTension, {
    var glass, scrape, haze, metal, left, right;
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
    // Ring-modulated machinery and bowed-metal bands; no independent rhythmic pulse.
    metal = VarSaw.ar([174.625, 233.0625], [0.2, 0.7], 0.12).sum
        * SinOsc.ar(73.25, 0.3);
    metal = BPF.ar((metal * 3).tanh, [970, 1840, 3170], 0.24).sum * 0.085;
    scrape = HPF.ar(scrape, 1100);
    haze = HPF.ar(haze, 760);
    left = glass + (scrape * 1.6) + haze + metal;
    right = (glass * 0.92) + (scrape * 1.4) + (haze * 1.1) + (metal * 0.95);
    Out.ar(0, LeakDC.ar([left, right] * 18).tanh * 0.24);
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
