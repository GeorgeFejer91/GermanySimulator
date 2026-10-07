// A finite, silent-to-render 13 s review mix of the two authored WAV stems.
// No voice is synthesized here: 7.3..10.4 s reserves the existing line,
// “Wer die Finsternis sieht, hat sie selbst gewählt!”
// Run from repository root after render.scd and the 16 s WAV crops exist.
(
var outputDir = File.getcwd +/+ "output/omen-audio";
var options = ServerOptions.new;
var server, bedBuffer, tensionBuffer, mixDef, score;
var serverProgram = "SC_SYNTH_PATH".getenv;

if(serverProgram.notNil) { Score.program = serverProgram; };
options.numInputBusChannels = 0;
options.numOutputBusChannels = 2;
options.sampleRate = 48000;
server = Server(\omenNRT, options: options);
bedBuffer = Buffer.new(server);
tensionBuffer = Buffer.new(server);

mixDef = SynthDef(\amtOmenReviewMix, { |bedId = 0, tensionId = 1|
    var bed, tension, bedEnv, tensionEnv, humEnv, hum, mixed;
    bed = PlayBuf.ar(2, bedId, BufRateScale.kr(bedId), loop: 1);
    tension = PlayBuf.ar(2, tensionId, BufRateScale.kr(tensionId), loop: 1);
    // Room darkens and courier approaches; brief peak at his arrival.
    // The music then recedes for speech and leaves in 30 ms at the reset.
    bedEnv = EnvGen.kr(Env(
        [0.04, 0.10, 0.25, 0.48, 0.64, 0.23, 0.23, 0],
        [2.0, 2.5, 2.0, 0.7, 0.1, 3.1, 0.03],
        \lin
    ));
    tensionEnv = EnvGen.kr(Env(
        [0, 0.03, 0.16, 0.40, 0.68, 0.16, 0.16, 0],
        [2.0, 2.5, 2.0, 0.7, 0.1, 3.1, 0.03],
        \lin
    ));
    humEnv = EnvGen.kr(Env([0, 0, 1, 0.85], [10.42, 0.04, 2.54], \lin));
    hum = (SinOsc.ar(100, 0, 0.013) + SinOsc.ar(200, 0.8, 0.003)
        + SinOsc.ar(300, 1.3, 0.0009)) * humEnv;
    mixed = (bed * bedEnv) + (tension * tensionEnv) + (hum ! 2);
    Out.ar(0, LeakDC.ar(mixed));
});

score = Score([
    [0.0, bedBuffer.allocReadMsg(outputDir +/+ "bed.wav")],
    [0.0, tensionBuffer.allocReadMsg(outputDir +/+ "tension.wav")],
    [0.0, [\d_recv, mixDef.asBytes]],
    [0.10, [\s_new, \amtOmenReviewMix, 1002, 0, 0,
        \bedId, bedBuffer.bufnum, \tensionId, tensionBuffer.bufnum]],
    [13.10, [\n_free, 1002]]
]);
score.recordNRT(
    outputFilePath: outputDir +/+ "omen-choreography-preview.wav",
    sampleRate: 48000,
    headerFormat: "WAV",
    sampleFormat: "int16",
    options: options,
    duration: 13.10,
    action: {
        "OMEN_PREVIEW_DONE".postln;
        server.remove;
        0.exit;
    }
);
)
