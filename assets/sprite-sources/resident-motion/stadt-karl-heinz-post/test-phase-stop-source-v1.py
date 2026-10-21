"""Small contract tests for Karl's held stop-field pilot."""
import importlib.util
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
SCRIPT = HERE / 'build-phase-stop-source-v1.py'


def load():
    spec = importlib.util.spec_from_file_location('karl_stop_pilot', SCRIPT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class KarlStopContract(unittest.TestCase):
    def test_upper_field_selection_uses_actual_branch_order(self):
        method = load()
        # The side overlay appends one upper call per frame after the limbs.
        sides = ['leg'] * 8 + ['side-upper-0', 'side-upper-1',
                               'side-upper-2', 'side-upper-3']
        self.assertEqual(method.upper_calls(sides, 4, True), sides[-4:])
        # Front/back animate the upper directly after each pair of legs.
        front = ['leg', 'leg', 'front-upper-0', 'leg', 'leg', 'front-upper-1',
                 'leg', 'leg', 'front-upper-2', 'leg', 'leg', 'front-upper-3']
        self.assertEqual(method.upper_calls(front, 4, False), front[2::3])
        with self.assertRaises(ValueError):
            method.upper_calls(front[:-1], 4, False)

    def test_bounded_phase_stage_selection_and_slot_mapping(self):
        method = load()
        self.assertEqual(method.PILOT_PHASES, (0, 4, 8, 12))
        self.assertEqual(method.PILOT_STAGES, (0, 3))
        self.assertEqual(method.slot(3, 12, 3), 243)
        with self.assertRaises(ValueError):
            method.slot(3, 16, 0)


if __name__ == '__main__':
    unittest.main()
