"""Exact spoken-word and same-profile join gates, without loading authoring models."""
import copy
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import tempfile
from types import SimpleNamespace
import unittest

spec = importlib.util.spec_from_file_location('voice_builder', Path(__file__).with_name('build-knick-voice.py'))
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)


class OfficeVoiceGates(unittest.TestCase):
    def test_portrait_is_one_full_authored_synthesis_request(self):
        story=json.loads(subprocess.check_output(['node','-e','global.window={};require("./buergeramt-story.js");console.log(JSON.stringify(window.BuergeramtStory));'],cwd=builder.ROOT,encoding='utf-8'))
        voice=story['playerIdentity']['voiceId']
        profile=builder.read(builder.ROOT/'For-AI/VOICE-CAST.json')['productionVoices'][voice]['profileId']
        rows=story['presidentPortrait']['lines']
        job={'clipId':'player-president-portrait-1','actorId':'player','voiceId':voice,'profileId':profile,
             'text':' '.join(row['line'] for row in rows),'english':' '.join(row['english'] for row in rows),
             'sourceLocator':'buergeramt-story.js presidentPortrait.lines joined in authored order'}
        plan={'family':'office-monologue','publicAssetFamily':'assets/voices/player-replies','privateReviewFamily':'GermanySimulator president portrait review 2026-10-12',
              'sourceSha256':{name:builder.sha(builder.ROOT/name) for name in ('buergeramt-story.js','buergeramt.js')},'jobs':[job]}
        try:
            with tempfile.TemporaryDirectory() as directory:
                file=Path(directory)/'request.json';builder.write(file,plan)
                args=SimpleNamespace(voice_id=voice,request_file=file,ambient=False)
                builder.configure_request(args);self.assertEqual(builder.jobs(),[job])
                args.sentence_rescue=True
                with self.assertRaises(AssertionError):builder.configure_request(args)
                args.sentence_rescue=False
                plan['jobs']=[{**job,'text':row['line'],'english':row['english']} for row in rows]
                builder.write(file,plan);builder.configure_request(args)
                with self.assertRaises(AssertionError):builder.jobs()
        finally:
            builder.configure_request(SimpleNamespace(voice_id='amt-brunhilde-knick',request_file=None,ambient=False))

    def test_join_failure_authority_preserves_successful_part_truth_and_cap2(self):
        with tempfile.TemporaryDirectory() as directory:
            parent_root=Path(directory)
            private=parent_root/'sentence-rescue'
            job={'clipId':'named-part','text':'Exact words.','profileId':'saved-profile'}
            for root,name,content in [(private/'raw','named-part.wav',b'part raw'),(private/'encoded','named-part.mp3',b'part encoded'),
                                      (parent_root/'raw','failed-parent.wav',b'joined raw'),(parent_root/'encoded','failed-parent.mp3',b'joined encoded')]:
                root.mkdir(parents=True,exist_ok=True)
                (root/name).write_bytes(content)
            previous={**job,'synthesisAttempt':1,'rawSha256':builder.sha(private/'raw/named-part.wav')}
            checked={'asrWordExact':True,'sha256':builder.sha(private/'encoded/named-part.mp3')}
            parent={'asrWordExact':False,'rawSha256':builder.sha(parent_root/'raw/failed-parent.wav'),
                    'sha256':builder.sha(parent_root/'encoded/failed-parent.mp3'),
                    'rescueParts':[{'clipId':job['clipId'],'rawSha256':previous['rawSha256'],'encodedSha256':checked['sha256']}]}
            builder.write(parent_root/'encoded/failed-parent.json',parent)
            proof=parent_root/'independent-join-proof.json'
            builder.write(proof,{'asr':'Exact words plus unwanted tail.'})
            authority={**job,'maximumAdditionalTakes':1,'previousActualSynthesisAttempt':1,'authorizedActualSynthesisAttempt':2,
                       'previousRawSha256':previous['rawSha256'],'previousEncodedSha256':checked['sha256'],
                       'failedParentClipId':'failed-parent','failedParentRawSha256':parent['rawSha256'],'failedParentEncodedSha256':parent['sha256'],
                       'joinedAuditPath':str(proof),'joinedAuditSha256':builder.sha(proof),'joinOffsetsPath':str(proof),'joinOffsetsSha256':builder.sha(proof)}
            path=parent_root/'authority.json'
            builder.write(path,authority)
            args=SimpleNamespace(join_retake_authorization=path,join_retake_authorization_sha256=builder.sha(path))
            self.assertEqual(builder.authorized_join_part_retake(args,job,previous,checked,private)['authorizedActualSynthesisAttempt'],2)
            self.assertIsNone(builder.authorized_join_part_retake(SimpleNamespace(),job,previous,checked,private))
            for key,value in [('synthesisAttempt',2),('rawSha256','a'*64),('text','Wrong words.')]:
                with self.assertRaises(AssertionError):
                    builder.authorized_join_part_retake(args,job,{**previous,key:value},checked,private)
            with self.assertRaises(AssertionError):
                builder.authorized_join_part_retake(args,job,previous,{**checked,'asrWordExact':False},private)
            builder.write(parent_root/'encoded/failed-parent.json',{**parent,'asrWordExact':True})
            with self.assertRaises(AssertionError):
                builder.authorized_join_part_retake(args,job,previous,checked,private)

    def test_only_receipt_bound_named_third_take_is_authorized(self):
        job = {'clipId': 'player-registration-provider-2-part-01', 'text': 'Nur die Eigentümerin', 'profileId': 'selected-profile'}
        previous = {**job, 'synthesisAttempt': 2, 'rawSha256': 'a' * 64}
        checked = {'sha256': 'b' * 64}
        self.assertIsNone(builder.authorized_extra_take(SimpleNamespace(), job, previous, checked))
        authority = {**job, 'maximumAdditionalTakes': 1, 'previousActualSynthesisAttempt': 2,
                     'authorizedActualSynthesisAttempt': 3, 'previousRawSha256': 'a' * 64,
                     'previousEncodedSha256': 'b' * 64}
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'one-named-authority.json'
            builder.write(path, authority)
            args = SimpleNamespace(extra_take_authorization=path, extra_take_authorization_sha256=builder.sha(path))
            self.assertEqual(builder.authorized_extra_take(args, job, previous, checked)['authorizedActualSynthesisAttempt'], 3)
            self.assertIsNone(builder.authorized_extra_take(args, {**job, 'clipId': 'another-part'}, previous, checked))
            for key, value in [('synthesisAttempt', 3), ('rawSha256', 'c' * 64), ('text', 'Changed words')]:
                with self.assertRaises(AssertionError):
                    builder.authorized_extra_take(args, job, {**previous, key: value}, checked)
            with self.assertRaises(AssertionError):
                builder.authorized_extra_take(args, job, previous, {'sha256': 'c' * 64})
            path.write_text('{}', encoding='utf-8')
            with self.assertRaises(AssertionError):
                builder.authorized_extra_take(args, job, previous, checked)

    @unittest.skipUnless(os.name == 'nt', 'Windows long archive path regression')
    def test_long_archive_move_preserves_bytes_and_rejects_overwrite(self):
        test_base = builder.ROOT / 'output' / 'voice-archive-tests'
        test_base.mkdir(parents=True, exist_ok=True)
        self.assertTrue(test_base.resolve().is_relative_to(builder.ROOT.resolve()))
        with tempfile.TemporaryDirectory(dir=test_base) as directory:
            root = Path(directory).resolve()
            self.assertTrue(root.is_relative_to(test_base.resolve()))
            archive = root / ('nested-' + 'a' * 95)
            archive.mkdir()
            source = root / 'take.json'
            source.write_bytes(b'immutable failed receipt')
            destination = archive / ('eos-' + 'b' * 120 + '.json')
            self.assertGreater(len(str(destination)), 260)
            self.assertTrue(destination.parent.resolve().is_relative_to(root))
            digest = builder.sha(source)
            try:
                builder.archive_move(source, destination)
                self.assertFalse(source.exists())
                self.assertEqual(builder.sha(builder.native_archive_path(destination)), digest)
                source.write_bytes(b'different new receipt')
                with self.assertRaises(AssertionError):
                    builder.archive_move(source, destination)
                self.assertEqual(builder.sha(builder.native_archive_path(destination)), digest)
                self.assertEqual(source.read_bytes(), b'different new receipt')
                builder.write(test_base / 'last-test.json', {'destinationPathLength': len(str(destination)), 'sha256': digest, 'overwriteRejected': True, 'scope': 'Real Windows long-path regression in verified workspace output; generated temporary files removed'})
            finally:
                builder.native_archive_path(destination).unlink(missing_ok=True)

    def test_office_plan_rejects_changed_authored_words_and_wrong_actor(self):
        story = json.loads(subprocess.check_output(['node', '-e', 'global.window={};require("./buergeramt-story.js");console.log(JSON.stringify(window.BuergeramtStory));'], cwd=builder.ROOT, encoding='utf-8'))
        voice = 'spieler-hans-peter-mustermann'
        profile = builder.read(builder.ROOT / 'For-AI/VOICE-CAST.json')['productionVoices'][voice]['profileId']
        jobs = [{'clipId': f'player-registration-{key.lower()}-{index + 1}', 'actorId': 'player', 'voiceId': voice, 'profileId': profile, 'text': choice['label'], 'english': 'Authored test subtitle', 'sourceLocator': f'buergeramt-story.js registration.nodes.{key}.choices[{index}].label'} for key, node in story['registration']['nodes'].items() for index, choice in enumerate(node['choices'])]
        for key, text in [('phone-silent', 'Telefon auf lautlos schalten.'), ('phone-ignore', 'Nicht rangehen. Telefon weglegen.'), ('complete', 'Meldebestätigung und A38 mitnehmen.')]:
            jobs.append({'clipId': 'player-' + key, 'actorId': 'player', 'voiceId': voice, 'profileId': profile, 'text': text, 'english': 'Authored test subtitle', 'sourceLocator': 'buergeramt.js choice.label ' + key})
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'request.json'
            plan = {'family': 'office-replies', 'publicAssetFamily': 'assets/voices/player-replies', 'privateReviewFamily': 'GermanySimulator office replies review 2026-10-12', 'sourceSha256': {name: builder.sha(builder.ROOT / name) for name in ('buergeramt-story.js', 'buergeramt.js')}, 'jobs': jobs}
            path.write_text(json.dumps(plan), encoding='utf-8')
            builder.configure_request(SimpleNamespace(voice_id=voice, request_file=path, ambient=False))
            self.assertEqual(len(builder.jobs()), 107)
            for key, value in [('text', 'Changed source words.'), ('actorId', 'clerk')]:
                changed = copy.deepcopy(plan)
                changed['jobs'][0][key] = value
                path.write_text(json.dumps(changed), encoding='utf-8')
                builder.configure_request(SimpleNamespace(voice_id=voice, request_file=path, ambient=False))
                with self.assertRaises(AssertionError):
                    builder.jobs()
        builder.configure_request(SimpleNamespace(voice_id='amt-brunhilde-knick', request_file=None, ambient=False))

    def test_encoded_join_requires_every_word_and_the_same_voice(self):
        binding = {'voiceId': 'amt-brunhilde-knick', 'profileId': 'saved-id', 'referenceSha256': 'a' * 64, 'renderer': 'pinned-renderer', 'modelRevision': 'pinned-revision'}
        take = {**binding, 'text': 'Nicht weggehen. Formular A38.', 'decode': {'eosReached': True}, 'rescueParts': [
            {**binding, 'text': 'Nicht weggehen.', 'asr': 'Nicht weggehen.', 'asrWordExact': True, 'eosReached': True},
            {**binding, 'text': 'Formular A38.', 'asr': 'Formular A achtunddreißig.', 'asrWordExact': True, 'eosReached': True},
        ]}
        self.assertTrue(builder.generation_complete(take))
        for key, value in [('profileId', 'different-voice'), ('modelRevision', 'different-revision'), ('asr', 'Weggehen.'), ('eosReached', False)]:
            changed = copy.deepcopy(take)
            changed['rescueParts'][0][key] = value
            self.assertFalse(builder.generation_complete(changed))
        changed = copy.deepcopy(take)
        changed['rescueParts'].pop()
        self.assertFalse(builder.generation_complete(changed))

    def test_phonetic_symbols_preserve_exact_number_and_negation(self):
        self.assertTrue(builder.same_spoken_words('§ 17 und A38.', 'Paragraph siebzehn und A achtunddreißig.'))
        self.assertFalse(builder.same_spoken_words('§ 17 und A38.', 'Paragraph achtzehn und A achtunddreißig.'))
        self.assertFalse(builder.same_spoken_words('Telefon nicht weglegen.', 'Telefon weglegen.'))

    def test_edited_delivery_requires_whole_source_eos_and_a_silent_complete_prefix(self):
        take = {'text': 'Nicht weggehen.', 'decode': {'eosReached': True}, 'deliveryEditing': {
            'sourceNativeEos': True, 'sourceEosKind': 'analyzer-forced', 'authorization': 'Explicit bounded source review',
            'sourceFullRawSha256': 'a' * 64, 'sourceFullEncodedSha256': 'b' * 64, 'sourceEosTraceSha256': 'c' * 64,
            'sourceFullText': 'Nicht weggehen.', 'sourceFullAsr': 'Nicht weggehen. Nicht weggehen.',
            'startSample': 0, 'endSampleExclusive': 36000, 'sourceSampleRateHz': 24000, 'endSeconds': 1.5,
            'verifiedSilentIntervalSeconds': [1.1, 1.8], 'silenceThresholdDb': -38, 'minimumSilenceSeconds': .2,
            'lastScriptedWordEndSeconds': 1.0, 'nextUnwantedWordStartSeconds': 2.0, 'sourceFullGenerationDurationSeconds': 3.0,
            'preservedFullTakeArchiveRelative': 'rejected/take/full-original',
        }}
        self.assertTrue(builder.generation_complete(take))
        cases = [('sourceNativeEos', False), ('startSample', 1), ('sourceFullAsr', 'Weggehen. Nicht weggehen.'),
                 ('lastScriptedWordEndSeconds', 1.6), ('nextUnwantedWordStartSeconds', 1.4), ('endSampleExclusive', 36001)]
        samples = [take]
        for key, value in cases:
            changed = copy.deepcopy(take)
            changed['deliveryEditing'][key] = value
            self.assertFalse(builder.generation_complete(changed))
            samples.append(changed)
        source = 'import {knickGenerationComplete} from "./tools/curate-voice-library.mjs";console.log(JSON.stringify(' + json.dumps(samples) + '.map(knickGenerationComplete)));'
        results = json.loads(subprocess.check_output(['node', '--input-type=module', '-e', source], cwd=builder.ROOT, encoding='utf-8'))
        self.assertEqual(results, [True] + [False] * len(cases))

    def test_complete_encoded_segmented_recognition_is_named_hash_bound_and_contiguous(self):
        samples = []
        for clip, authority in builder.SEGMENTED_ASR_AUTHORITIES.items():
            parts = copy.deepcopy(authority['parts'])
            chunks = [{**part, 'sourcePartClipId': part['clipId'], 'expectedText': part['text'],
                       'sourcePartRawSha256': part['rawSha256'], 'sourcePartEncodedSha256': part['encodedSha256'],
                       'startSample': authority['boundaries'][index], 'endSampleExclusive': authority['boundaries'][index+1],
                       'decodedPcmSha256': authority['chunkPcmSha256'][index], 'scriptPrompt': None,
                       'readings': [authority['selectedReadings'][index]]} for index, part in enumerate(parts)]
            combined = ' '.join(chunk['readings'][-1]['transcript'] for chunk in chunks)
            proof = {key: authority[key] for key in ('authoritySha256','diagnosticSha256','encodedSha256','fullDecodedPcmSha256','modelSha256','originalEncodedReceiptSha256','boundaries')}
            proof.update(sampleRateHz=16000, decodedPcmDtype='IEEE754 little-endian float32', scriptPrompt=None,
                         totalDecodedSamples=authority['boundaries'][-1], chunks=chunks, combinedAsr=combined,
                         preservedOriginalEncodedReceiptRelative='immutable-original-receipt.json',
                         continuousFullLineReadings=[{'transcript':'Original conflicting reading retained.'}])
            take = {key: authority[key] for key in ('voiceId','profileId','referenceSha256','text')}
            take.update(clipId=clip,sha256=authority['encodedSha256'],rescueParts=parts,asr=combined,
                        asrWordExact=True,asrVerificationMode='full-encoded-contiguous-chunks',segmentedAsrProof=proof,
                        asrScriptPrompt=None,asrModelSha256=authority['modelSha256'])
            self.assertTrue(builder.recognition_complete(take))
            samples.append((take,True))
            missing_mode=copy.deepcopy(take);missing_mode.pop('asrVerificationMode')
            self.assertFalse(builder.recognition_complete(missing_mode))
            samples.append((missing_mode,False))
            cases = [(('asrVerificationMode',),'unknown'),(('asrVerificationMode',),None),
                     (('asrVerificationMode',),'full-file-continuous'),
                     (('clipId',),'unreviewed-line'),(('sha256',),'a'*64),(('profileId',),'wrong-owner'),
                     (('text',),'Changed words.'),(('asrScriptPrompt',),'expected text'),
                     (('segmentedAsrProof','authoritySha256'),'a'*64),
                     (('segmentedAsrProof','originalEncodedReceiptSha256'),'a'*64),
                     (('segmentedAsrProof','fullDecodedPcmSha256'),'a'*64),
                     (('segmentedAsrProof','modelSha256'),'a'*64),
                     (('segmentedAsrProof','preservedOriginalEncodedReceiptRelative'),''),
                     (('segmentedAsrProof','continuousFullLineReadings'),[]),
                     (('segmentedAsrProof','totalDecodedSamples'),authority['boundaries'][-1]-1),
                     (('segmentedAsrProof','chunks',0,'startSample'),1),
                     (('segmentedAsrProof','chunks',1,'startSample'),authority['boundaries'][1]-1),
                     (('segmentedAsrProof','chunks',0,'endSampleExclusive'),authority['boundaries'][1]-1),
                     (('segmentedAsrProof','chunks',0,'decodedPcmSha256'),'a'*64),
                     (('segmentedAsrProof','chunks',0,'scriptPrompt'),'expected'),
                     (('segmentedAsrProof','chunks',0,'sourcePartClipId'),parts[1]['clipId']),
                     (('segmentedAsrProof','chunks',0,'readings',0,'transcript'),'Wrong words.'),
                     (('rescueParts',0,'rawSha256'),'a'*64)]
            for path,value in cases:
                changed=copy.deepcopy(take)
                target=changed
                for key in path[:-1]: target=target[key]
                target[path[-1]]=value
                self.assertFalse(builder.recognition_complete(changed),path)
                samples.append((changed,False))
        # File-backed input avoids Windows command-length limits while exercising
        # the same JS gate against every independent Python rejection case.
        with tempfile.TemporaryDirectory(dir=builder.ROOT/'output') as directory:
            fixture=Path(directory)/'samples.json'
            builder.write(fixture,[take for take,_ in samples])
            js='import {readFileSync} from "node:fs";import {recognitionComplete} from "./tools/curate-voice-library.mjs";console.log(JSON.stringify(JSON.parse(readFileSync(process.argv[1],"utf8")).map(recognitionComplete)));'
            self.assertEqual(json.loads(subprocess.check_output(['node','--input-type=module','-e',js,str(fixture)],cwd=builder.ROOT,encoding='utf-8')),[valid for _,valid in samples])

    def test_distinct_post_speech_boundary_requires_exact_source_and_activity_proof(self):
        take={'text':'Einzugsdatum.','decode':{'eosReached':True},'deliveryEditing':{
            'kind':'post-speech-silence-boundary','sourceNativeEos':True,'sourceEosKind':'analyzer-forced',
            'authorization':'One named source/endpoint only','sourceFullRawSha256':'a'*64,
            'sourceFullEncodedSha256':'b'*64,'sourceEosTraceSha256':'c'*64,'sourceFullText':'Einzugsdatum.',
            'sourceFullAsr':'Einzugsdatum.','sourceFullAsrWordExact':True,'sourceSampleRateHz':24000,
            'startSample':0,'endSampleExclusive':28800,'endSeconds':1.2,'lastScriptedWordEndSeconds':.94,
            'verifiedSilentIntervalSeconds':[.934667,2.254542],'nextUnclassifiedActivityStartSeconds':2.254542,
            'sourceFullGenerationDurationSeconds':2.52,'silenceThresholdDb':-38,'minimumSilenceSeconds':.2,
            'preservedFullTakeArchiveRelative':'immutable-full-source-copy'}}
        self.assertTrue(builder.generation_complete(take))
        cases=[('sourceNativeEos',False),('sourceFullAsrWordExact',False),('sourceFullAsr','Einzugsdatum Datum.'),
               ('sourceFullAsr','Datum.'),('endSampleExclusive',28801),('startSample',1),
               ('lastScriptedWordEndSeconds',1.19),('nextUnclassifiedActivityStartSeconds',1.1),
               ('verifiedSilentIntervalSeconds',[1.3,2.254542]),('kind','unknown'),('preservedFullTakeArchiveRelative','')]
        samples=[take]
        for key,value in cases:
            changed=copy.deepcopy(take)
            changed['deliveryEditing'][key]=value
            self.assertFalse(builder.generation_complete(changed))
            samples.append(changed)
        legacy=copy.deepcopy(take)
        legacy['deliveryEditing'].pop('kind')
        legacy['deliveryEditing']['nextUnwantedWordStartSeconds']=2.254542
        self.assertFalse(builder.generation_complete(legacy))
        samples.append(legacy)
        source='import {knickGenerationComplete} from "./tools/curate-voice-library.mjs";console.log(JSON.stringify('+json.dumps(samples)+'.map(knickGenerationComplete)));'
        self.assertEqual(json.loads(subprocess.check_output(['node','--input-type=module','-e',source],cwd=builder.ROOT,encoding='utf-8')),[True]+[False]*(len(samples)-1))


if __name__ == '__main__':
    unittest.main()
