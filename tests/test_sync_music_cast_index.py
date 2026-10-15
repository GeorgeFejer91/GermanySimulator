"""Exercise the real cast synchronizer using only synthetic OS-temp fixtures."""

import contextlib
import copy
import hashlib
import importlib.util
import io
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch


TOOL_PATH = Path(__file__).resolve().parents[1] / "tools/sync-music-cast-index.py"
SPEC = importlib.util.spec_from_file_location("sync_music_cast_index", TOOL_PATH)
SYNC = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(SYNC)

# Public historical identity contract, independent of the tool's allowlist.
HISTORICAL = (
    ("amt-erna-frist", "88c9f2638a954f59b33a74dc6ec48f10", "Erna Frist"),
    ("amt-ottilie-durchschlag", "1ec70124423e4b9c985866dc0b978a28", "Ottilie Durchschlag"),
    ("amt-hedwig-zustaendig", "5dfbf1a66def407fa5ec2a700c1fd311", "Hedwig Zuständig"),
)


def person(voice_id, nested_profile=False):
    row = {
        "voiceId": voice_id, "fullName": "Synthetic " + voice_id,
        "gender": "female", "generalDemeanor": "dry",
        "targetValence": 0.2, "targetArousal": 0.4, "status": "selected",
        "reference": {"workingReferenceSha256": "a" * 64, "emotionLabel": "neutral"},
    }
    if nested_profile:
        row["secretTunnel"] = {
            "profileId": "synthetic-role-profile",
            "candidateProfiles": [{"profileId": "synthetic-alternative", "note": "retain"}],
        }
    else:
        row["secretTunnelProfileId"] = "synthetic-character-profile"
    return row


def current_row(owner):
    return {
        "voiceId": owner["voiceId"], "fullName": owner["fullName"],
        "profileId": owner.get("secretTunnel", {}).get("profileId") or owner["secretTunnelProfileId"],
        "characterGender": owner["gender"],
        "referenceSha256": owner["reference"]["workingReferenceSha256"],
        "sourceEmotionLabel": owner["reference"]["emotionLabel"],
        "generalDemeanor": "stale", "targetValence": -1, "targetArousal": -1,
        "privateEvidence": {"take": "synthetic-retained", "scores": [0.1, 0.9]},
    }


class SyncMusicCastIndexTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="gs-cast-sync-test-")
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.game = self.root / "game"
        (self.game / "For-AI").mkdir(parents=True)
        self.music = self.root / "music"
        self.music.mkdir()
        self.cast_path = self.game / "For-AI/VOICE-CAST.json"
        self.index_path = self.music / "GERMANY-SIMULATOR-CAST-INDEX.json"
        character = person("synthetic-current-character")
        patron = person("amt-konrad-wohnungszettel", nested_profile=True)
        self.cast = {
            "characters": [character], "roleProfiles": [patron],
            "productionVoices": {
                character["voiceId"]: {"profileId": character["secretTunnelProfileId"]},
                "synthetic-special-binding": {"profileId": "synthetic-special-profile"},
            },
            "productionExceptions": [{"voiceId": "synthetic-exception", "reason": "retained"}],
            "preservedProfileIds": [HISTORICAL[0][1], HISTORICAL[1][1]],
            "retiredProfiles": [{"profileId": HISTORICAL[2][1], "reason": "historical only"}],
        }
        history = [
            {"voiceId": voice, "profileId": profile, "fullName": name,
             "characterGender": "historical", "generalDemeanor": "original",
             "sourceEmotionLabel": "old", "referenceSha256": "b" * 64,
             "corpusEvidence": {"takeIds": [f"synthetic-{i}", "keep"], "score": i / 10}}
            for i, (voice, profile, name) in enumerate(HISTORICAL)
        ]
        self.index = {
            "profileCount": 5,
            "profiles": [history[1], current_row(character), history[0], current_row(patron), history[2]],
            "corpusNote": {"unchanged": ["synthetic", 3]},
        }

    def persist(self):
        self.cast_path.write_text(json.dumps(self.cast, ensure_ascii=False), encoding="utf-8")
        self.index_path.write_text(json.dumps(self.index, ensure_ascii=False), encoding="utf-8")

    def invoke(self, check=False):
        argv = [str(TOOL_PATH), "--music-root", str(self.music)] + (["--check"] if check else [])
        out = io.StringIO()
        with patch.object(SYNC, "GAME", self.game), patch.object(sys, "argv", argv), contextlib.redirect_stdout(out):
            SYNC.main()
        return out.getvalue()

    def reject_without_write(self, expected):
        self.persist()
        before = self.index_path.read_bytes(), self.cast_path.read_bytes()
        with self.assertRaisesRegex(RuntimeError, expected):
            self.invoke()
        self.assertEqual((self.index_path.read_bytes(), self.cast_path.read_bytes()), before)

    def test_updates_current_projection_preserves_full_history_order_and_evidence(self):
        self.persist()
        before = copy.deepcopy(self.index)
        cast_bytes = self.cast_path.read_bytes()
        self.assertIn("Updated 2 current / 3 historical", self.invoke())
        actual = json.loads(self.index_path.read_text(encoding="utf-8"))
        self.assertEqual([r["voiceId"] for r in actual["profiles"]], [r["voiceId"] for r in before["profiles"]])
        for position in (0, 2, 4):
            self.assertEqual(actual["profiles"][position], before["profiles"][position])
        for position, owner in ((1, self.cast["characters"][0]), (3, self.cast["roleProfiles"][0])):
            row = actual["profiles"][position]
            for key in ("generalDemeanor", "targetValence", "targetArousal"):
                self.assertEqual(row[key], owner[key])
            self.assertEqual(row["privateEvidence"], before["profiles"][position]["privateEvidence"])
        self.assertEqual(actual["profiles"][3]["candidateProfiles"], self.cast["roleProfiles"][0]["secretTunnel"]["candidateProfiles"])
        self.assertEqual(actual["profiles"][3]["runtimeStatus"], "selected")
        self.assertEqual(actual["corpusNote"], before["corpusNote"])
        for key in ("productionVoices", "productionExceptions", "preservedProfileIds"):
            self.assertEqual(actual[key], self.cast[key])
        self.assertEqual(actual["retiredProfileIds"], [HISTORICAL[2][1]])
        self.assertEqual(actual["castSourceSha256"], hashlib.sha256(cast_bytes).hexdigest())
        self.assertEqual(actual["profilesStatus"], "historical primary references; use productionVoices for generation")
        self.assertEqual(self.cast_path.read_bytes(), cast_bytes)

    def test_write_and_repeated_check_are_idempotent(self):
        self.persist()
        self.invoke()
        expected = self.index_path.read_bytes()
        self.invoke()
        self.assertEqual(self.index_path.read_bytes(), expected)
        for _ in range(2):
            self.assertIn("Verified 2 current / 3 historical", self.invoke(check=True))
            self.assertEqual(self.index_path.read_bytes(), expected)

    def test_check_rejects_stale_index_without_writing(self):
        self.persist()
        before = self.index_path.read_bytes()
        with self.assertRaisesRegex(RuntimeError, "differs from the game cast"):
            self.invoke(check=True)
        self.assertEqual(self.index_path.read_bytes(), before)

    def test_rejects_duplicate_current_ids_across_cast_sections(self):
        self.cast["roleProfiles"].append(copy.deepcopy(self.cast["characters"][0]))
        self.reject_without_write("duplicate voice IDs")

    def test_rejects_duplicate_current_and_historical_index_ids(self):
        for position in (1, 0):
            with self.subTest(position=position):
                original = copy.deepcopy(self.index)
                self.index["profiles"].append(copy.deepcopy(self.index["profiles"][position]))
                self.index["profileCount"] += 1
                self.reject_without_write("duplicate voice ID")
                self.index = original

    def test_rejects_missing_current_identity(self):
        self.index["profiles"].pop(3)
        self.index["profileCount"] -= 1
        self.reject_without_write("missing a current game voice ID")

    def test_rejects_profile_count_mismatch(self):
        self.index["profileCount"] += 1
        self.reject_without_write("profileCount differs")

    def test_rejects_each_changed_current_identity_field_without_partial_write(self):
        for key in ("profileId", "fullName", "characterGender", "referenceSha256", "sourceEmotionLabel"):
            with self.subTest(field=key):
                original = self.index["profiles"][3][key]
                self.index["profiles"][3][key] = "changed"
                self.reject_without_write("identity or source changed")
                self.index["profiles"][3][key] = original

    def test_rejects_inexact_historical_uuid_name_or_voice_id(self):
        for position in (0, 2, 4):
            for key in ("profileId", "fullName", "voiceId"):
                with self.subTest(position=position, field=key):
                    original = self.index["profiles"][position][key]
                    self.index["profiles"][position][key] = "unverified"
                    self.reject_without_write("unverified historical voice ID")
                    self.index["profiles"][position][key] = original

    def test_rejects_missing_preserved_or_retired_historical_evidence(self):
        for key in ("preservedProfileIds", "retiredProfiles"):
            with self.subTest(evidence=key):
                original = self.cast[key]
                self.cast[key] = []
                self.reject_without_write("unverified historical voice ID")
                self.cast[key] = original

    def test_rejects_historical_identity_in_current_production_projection(self):
        for voice_id, profile_id, _ in HISTORICAL:
            with self.subTest(voice_id=voice_id):
                self.cast["productionVoices"][voice_id] = {"profileId": profile_id}
                self.reject_without_write("unverified historical voice ID")
                del self.cast["productionVoices"][voice_id]


if __name__ == "__main__":
    unittest.main()
