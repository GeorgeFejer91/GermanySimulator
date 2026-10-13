"""Pack the selected trained Knick inference weights for browser delivery."""
import argparse
import hashlib
import json
from pathlib import Path
import gzip

import numpy as np
import onnx
from onnx import helper, numpy_helper, TensorProto


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def name_only(graph):
    """Retain sentence priors/flow, but run the vocoder only through the name.

    Sixteen right-context frames cover this Piper decoder's receptive field.
    The final waveform slice removes that context before fixed tails are joined.
    """
    graph.graph.input.append(helper.make_tensor_value_info('name_end', TensorProto.INT64, [1]))
    constants = {'name_zero': [0], 'name_axis': [2], 'name_step': [1],
                 'name_shape': [1], 'name_context': [16], 'name_hop': [256]}
    for key, value in constants.items():
        graph.graph.initializer.append(numpy_helper.from_array(np.asarray(value, dtype=np.int64), key))
    nodes = [
        helper.make_node('Slice', ['/Ceil_output_0', 'name_zero', 'name_end', 'name_axis', 'name_step'], ['name_durations']),
        helper.make_node('ReduceSum', ['name_durations'], ['name_frames_float'], keepdims=0),
        helper.make_node('Cast', ['name_frames_float'], ['name_frames_scalar'], to=TensorProto.INT64),
        helper.make_node('Reshape', ['name_frames_scalar', 'name_shape'], ['name_frames']),
        helper.make_node('Add', ['name_frames', 'name_context'], ['name_context_end']),
        helper.make_node('Slice', ['/Mul_7_output_0', 'name_zero', 'name_context_end', 'name_axis', 'name_step'], ['name_latent']),
    ]
    decoder = next(node for node in graph.graph.node if node.name == '/dec/conv_pre/Conv')
    assert decoder.input[0] == '/Mul_7_output_0'
    original_nodes = list(graph.graph.node)
    index = original_nodes.index(decoder)
    decoder.input[0] = 'name_latent'
    for node in original_nodes:
        for index_out, output in enumerate(node.output):
            if output == 'output': node.output[index_out] = 'name_with_context'
    axis = len(graph.graph.output[0].type.tensor_type.shape.dim) - 1
    graph.graph.initializer.append(numpy_helper.from_array(np.asarray([axis], dtype=np.int64), 'name_audio_axis'))
    nodes_after = [
        helper.make_node('Mul', ['name_frames', 'name_hop'], ['name_samples']),
        helper.make_node('Slice', ['name_with_context', 'name_zero', 'name_samples', 'name_audio_axis', 'name_step'], ['output']),
    ]
    del graph.graph.node[:]
    graph.graph.node.extend(original_nodes[:index] + nodes + original_nodes[index:] + nodes_after)
    onnx.checker.check_model(graph)
    return graph


def pack(source, target, private_root, step, checkpoint=None, preserve_duration=False, preserve_inputs=False, training_run=None, names_only=False):
    graph = onnx.load(source)
    if names_only: graph = name_only(graph)
    # Piper 1.8.0 exports [batch,1,1,time], but labels axis 2 as time.
    for output in graph.graph.output:
        shape = output.type.tensor_type.shape.dim
        if len(shape) == 4:
            shape[2].ClearField('dim_param'); shape[2].dim_value = 1
            shape[3].ClearField('dim_value'); shape[3].dim_param = 'time'
    replacements, decoders, count = [], [], 0
    for tensor in graph.graph.initializer:
        weights = numpy_helper.to_array(tensor)
        duration = preserve_duration and any('/dp/' in node.name and tensor.name in node.input for node in graph.graph.node)
        anchor = preserve_inputs and any(('/enc_p/emb/' in node.name or '/enc_p/proj/' in node.name) and tensor.name in node.input for node in graph.graph.node)
        if duration or anchor or tensor.data_type != TensorProto.FLOAT or weights.ndim < 2 or weights.size < 512:
            replacements.append(tensor)
            continue
        axes = tuple(range(1, weights.ndim))
        scale = np.maximum(np.max(np.abs(weights), axis=axes), 1e-8) / 127
        scale = scale.astype(np.float32)
        broadcast = scale.reshape((-1,) + (1,) * (weights.ndim - 1))
        quantized = np.clip(np.rint(weights / broadcast), -127, 127).astype(np.int8)
        stem = tensor.name + '__knick'
        replacements.extend([numpy_helper.from_array(quantized, stem + '_q'),
                             numpy_helper.from_array(scale, stem + '_scale'),
                             numpy_helper.from_array(np.zeros(scale.shape, dtype=np.int8), stem + '_zero')])
        decoders.append(helper.make_node('DequantizeLinear',
                        [stem + '_q', stem + '_scale', stem + '_zero'], [tensor.name], axis=0))
        count += weights.size
    assert count > 10_000_000, 'Expected the complete VITS inference weights'
    del graph.graph.initializer[:]
    graph.graph.initializer.extend(replacements)
    original_nodes = list(graph.graph.node)
    del graph.graph.node[:]
    graph.graph.node.extend(decoders + original_nodes)
    onnx.checker.check_model(graph)
    target.mkdir(parents=True, exist_ok=True)
    temporary = target / 'knick-int8.onnx'
    onnx.save(graph, temporary)
    digest = sha(temporary)
    model = target / ('knick-' + digest[:12] + '.onnx.bin')
    encoded = gzip.compress(temporary.read_bytes(), compresslevel=9, mtime=0)
    model.write_bytes(encoded)
    decoded_bytes = temporary.stat().st_size
    temporary.unlink()
    sources = json.loads((private_root / 'training-sources.json').read_text(encoding='utf-8'))
    assert sources['profileId'] == 'b080c7d95ecd418fb428282461d7fbe7'
    assert sources['referenceSha256'] == '901e9ad60eda5cbb36337b12864b6a2b0d133570acb90941b9eabd9888c16351'
    stages = sources.get('trainingStages', [])
    if training_run:
        run = json.loads(training_run.read_text(encoding='utf-8'))
        assert run['browserMetadataSha256'] == sources['browserMetadataSha256']
        assert run['baseCheckpointSha256'] == sha(private_root / 'base.ckpt')
        assert run['requestedGlobalSteps'] == step
        prefixes = ['model_g.enc_p.', 'model_g.dp.'] if run['freezePronunciation'] else []
        if run['freezeLatent']: prefixes.append('model_g.flow.')
        stages = [{'globalSteps': step, 'phonemizer': 'shipped WASM', 'optimizer': 'fresh AdamW (pinned Piper implementation)',
                   'generatorRate': run['generatorRate'], 'discriminatorRate': run['discriminatorRate'],
                   'restoredFrozenPrefixes': prefixes, 'baseCheckpointSha256': run['baseCheckpointSha256'],
                   'resumedFromCheckpointSha256': run.get('resumeCheckpointSha256')}]
    config = private_root / 'dataset/config.json'
    configuration = json.loads(config.read_text(encoding='utf-8'))
    configuration['inference'] = {'noise_scale': 0, 'length_scale': 1.2, 'noise_w': 0}
    (target / 'config.json').write_text(json.dumps(configuration, indent=2), encoding='utf-8', newline='\n')
    manifest = {key: sources[key] for key in ['voiceId', 'profileId', 'referenceSha256', 'originalSha256', 'teacher', 'teacherRevision']}
    manifest.update(schemaVersion=1, model=model.name, sha256=digest, bytes=decoded_bytes,
                    compression='gzip', downloadBytes=len(encoded), downloadSha256=sha(model),
                    sampleRate=22050, format='VITS ONNX opset 15; per-channel int8 stored weights',
                    runtime='onnxruntime-web 1.18.0 WASM SIMD single thread',
                    quantizedParameters=count, trainingTakes=len(sources['sources']),
                    trainingMinutes=sources['minutes'], trainingGlobalStep=step, seed=sources['seed'],
                    trainingSourcesSha256=sha(private_root / 'training-sources.json'),
                    baseRevision=(private_root / 'base-revision.txt').read_text().strip(),
                    baseCheckpointSha256=sha(private_root / 'base.ckpt'),
                    checkpointSha256=sha(checkpoint or private_root / f'checkpoints/knick-step={step}.ckpt'),
                    trainingStages=stages, trainingRunSha256=sha(training_run) if training_run else None,
                    inferenceScales=[0,1.2,0],
                    durationWeights='float32' if preserve_duration else 'int8 stored weights',
                    phonemeInputWeights='float32' if preserve_inputs else 'int8 stored weights',
                    browserPhonemizer=sources.get('browserPhonemizer'),
                    browserMetadataSha256=sources.get('browserMetadataSha256'),
                    sourceModelSha256=sha(source), fallback='captions', listening='not-performed')
    if names_only:
        manifest.update(synthesis='sentence priors; name-only vocoder; prerecorded counter tails',
                        nameContextFrames=16, contextSuffix=', bitte zu Schalter eins!')
    (target / 'manifest.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
    print(json.dumps({'sourceBytes': source.stat().st_size, 'bytes': manifest['bytes'],
                      'downloadBytes': len(encoded), 'quantizedParameters': count, 'model': model.name}), flush=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('target', type=Path)
    parser.add_argument('--private-root', type=Path, required=True)
    parser.add_argument('--step', type=int, required=True)
    parser.add_argument('--checkpoint', type=Path)
    parser.add_argument('--training-run', type=Path)
    parser.add_argument('--preserve-duration', action='store_true')
    parser.add_argument('--preserve-inputs', action='store_true')
    parser.add_argument('--names-only', action='store_true')
    args = parser.parse_args()
    pack(args.source, args.target, args.private_root, args.step, args.checkpoint, args.preserve_duration, args.preserve_inputs, args.training_run, args.names_only)
