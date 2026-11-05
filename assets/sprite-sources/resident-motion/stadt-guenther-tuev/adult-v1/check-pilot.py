"""One bounded own contact/visible-lip endpoint pilot; no family expansion."""
from pathlib import Path
import importlib.util
HERE=Path(__file__).resolve().parent
def load(name,file):
 spec=importlib.util.spec_from_file_location(name,HERE/file);module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module);return module
load('guenther_exact_own_contact','test-contact-pilot.py').main()
load('guenther_actual_lip_endpoints','fit-adult-mouths.py').run()
