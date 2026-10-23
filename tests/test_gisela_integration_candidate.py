"""Check Gisela's selected adult source, owned stops, actions and mouth bindings."""
from pathlib import Path
import hashlib
import importlib.util
import json
import unittest

from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
ID='quiz-gisela-becker'
ASSETS=ROOT/'assets/characters/street-speakers'/ID/'delivery-adult-v1'
PERSON=json.loads((ROOT/'assets/characters/street/manifest.json').read_text())['characters'][ID]
SHA=lambda path:hashlib.sha256(Path(path).read_bytes()).hexdigest()


class GiselaIntegrationCandidate(unittest.TestCase):
    def test_adult_body_and_seven_states_have_owned_selected_sources(self):
        p=PERSON
        self.assertEqual((p['cell'],p['pivot'],p['grid'],p['figureWorldHeight']),
                         ([128,160],[64,150],[21,18],2.33))
        self.assertEqual(set(p['atlasMotion']['interactions']['states']),
                         {'greet','work','review','look','wait','success','failure'})
        self.assertEqual(p['atlasMotion']['neutral'],{'row':4,'col':2})
        self.assertEqual(p['atlasMotion']['interactions']['neutral'],{'row':4,'col':2})
        stops=set()
        for direction_index,direction in enumerate(('down','right','up','left')):
            phases=p['atlasMotion']['settles'][direction]
            self.assertEqual(set(phases),{str(i) for i in range(16)})
            for phase in range(16):
                sequence=phases[str(phase)]['frames']
                self.assertEqual(len(sequence),5)
                self.assertEqual(sequence[-1],{'row':4+direction_index,'col':2,'ms':70})
                for pose in sequence[:-1]:
                    slot=pose['row']*21+pose['col']
                    self.assertNotIn(slot,stops)
                    stops.add(slot)
        self.assertEqual(len(stops),256)
        for name in ('desktop','mobile'):
            path=ROOT/p['variants'][name]['file'][2:]
            self.assertEqual(SHA(path),p['variants'][name]['sha256'])
        self.assertEqual(SHA(ROOT/p['standing']['file'][2:]),p['standing']['sha256'])

    def test_exact_selected_paint_has_grounded_own_action_and_mouths(self):
        p=PERSON
        atlas=Image.open(ASSETS/'source-desktop.webp').convert('RGBA')
        self.assertEqual(atlas.size,(2016,2160))
        def cell(row,col):return atlas.crop((col*96,row*120,(col+1)*96,(row+1)*120))
        neutral=cell(4,2).tobytes()
        self.assertEqual(cell(13,0).tobytes(),neutral)
        self.assertEqual(cell(13,15).tobytes(),neutral)
        for direction in ('down','right','up','left'):
            for phase in range(16):
                pose=cell(p['atlasMotion']['walks'][direction]['row'],phase)
                box=pose.getchannel('A').point(lambda value:255 if value>=21 else 0).getbbox()
                self.assertIsNotNone(box)
                self.assertLessEqual(box[3],114)
                self.assertGreaterEqual(box[0],7)
                self.assertLessEqual(box[2],89)
        mouth=ASSETS/'mouths-v1.json'
        self.assertEqual(SHA(mouth),p['mouthPaint']['sha256'])
        definition=json.loads(mouth.read_text())
        self.assertEqual(definition['sources'],{
            'standing':SHA(ASSETS/'standing.webp'),
            'desktop':SHA(ASSETS/'source-desktop.webp'),
            'mobile':SHA(ASSETS/'source-mobile.webp'),
        })
        self.assertEqual((sum(v is not None for v in definition['frames']),
                          sum(v is None for v in definition['frames'])),(278,100))
        for phase in range(16):
            for pose in p['atlasMotion']['settles']['up'][str(phase)]['frames']:
                self.assertIsNone(definition['frames'][pose['row']*21+pose['col']])

    def test_packed_delivery_decodes_exact_selected_source(self):
        spec=importlib.util.spec_from_file_location('street_delivery',ROOT/'tools/build-street-motion-delivery.py')
        packer=importlib.util.module_from_spec(spec);spec.loader.exec_module(packer)
        record=packer.run(ROOT/'assets/characters/street/manifest.json',ID,ASSETS/'delivery',check=True,root=ROOT)
        self.assertEqual(sum(slot is not None for slot in record['packs']['movement']['slots']),348)
        self.assertEqual(sum(slot is not None for slot in record['packs']['reactions']['slots']),17)


if __name__=='__main__':unittest.main()
