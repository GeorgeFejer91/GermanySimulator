"""Frozen-pilot parity guard for Karl's full stop source exporter."""
import importlib.util
import json
import unittest
from pathlib import Path

from PIL import Image

HERE=Path(__file__).resolve().parent


def load():
    spec=importlib.util.spec_from_file_location('karl_full_stop',HERE/'build-phase-stop-full-v1.py')
    module=importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class FrozenPilotParity(unittest.TestCase):
    def test_pilot_pixel_parity_rejects_changed_frame(self):
        driver=load()
        pilot=json.loads((driver.PILOT_DIR/'pilot-source.json').read_text())
        record=next(entry for entry in pilot['records'] if entry['slot']==99)
        source=Image.open(driver.PILOT_DIR/record['working']['file']).convert('RGBA')
        desktop=Image.open(driver.PILOT_DIR/record['encoded']['desktop']['file']).convert('RGBA')
        mobile=Image.open(driver.PILOT_DIR/record['encoded']['mobile']['file']).convert('RGBA')
        driver.verify_pilot(record,source,{'desktop':desktop,'mobile':mobile})
        changed=source.copy()
        changed.putpixel((200,200),(255,0,0,255))
        with self.assertRaises(ValueError):
            driver.verify_pilot(record,changed,{'desktop':desktop,'mobile':mobile})


if __name__=='__main__':
    unittest.main()
