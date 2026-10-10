"""Inventory source-native Bürgeramt action poses for Gaussian arc authoring.

This offline helper does not alter the canonical sprite sources or atlases.
The contact sheets preserve source pixel dimensions and composite actual alpha
over light/dark backgrounds so hidden transparent RGB cannot be mistaken for art.
"""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets/sprite-sources/buergeramt"
EVIDENCE = ROOT / "output/amt-gaussian-arcs/assets"
ARCS = SOURCE / "gaussian-arcs"
MOVERS = (
    "aktenkurier", "archivbotin", "formularsammler", "nummernfluesterer",
    "nachtschichtmelderin", "pfandarchitektin", "kopiependler",
    "warteschlangenpoetin",
)
STATES = ("work", "gesture", "look", "flinch")
PATRONS = ("renter", "parent", "pensioner")
ORIGINAL_TWO_SHEET = ("aktenkurier", "archivbotin", "formularsammler")
DETAIL = ROOT / "assets/buergeramt/characters"
# Measured against the first authored painting in each family, never fitted per frame.
BRIDGE_SCALE = {"aktenkurier": 0.585, "archivbotin": 0.54,
                "formularsammler": 0.533,
                "nummernfluesterer": {(1024, 1536): 0.563,
                                      (2, (1024, 1536)): 0.54,
                                      (3, (1024, 1536)): 0.54},
                "nachtschichtmelderin": {(1526, 1030): 0.80, (1024, 1536): 0.515,
                                          (2, (1024, 1536)): 0.535},
                "pfandarchitektin": 0.54, "warteschlangenpoetin": 0.54,
                "kopiependler": 0.54}
BRIDGE_COUNT = {"aktenkurier": 3, "archivbotin": 3, "formularsammler": 3,
                "nummernfluesterer": 3, "nachtschichtmelderin": 3,
                "pfandarchitektin": 2, "warteschlangenpoetin": 2,
                "kopiependler": 3}
SHOE_BASELINE = 802
LANDMARK_KEYS = (
    "eye_right", "eye_left", "nose", "chin", "shoulder_right", "elbow_right",
    "grip_right", "stamp_knob", "stamp_base", "shoulder_left", "elbow_left",
    "hand_left", "hip_center", "skirt_hem_center", "foot_screen_left", "foot_screen_right",
)
# Manually read from native 640x832 grid composites. Anatomical right is screen-left.
AKTENKURIER_POINTS = {
    "work": [(335, 89), (365, 89), (352, 106), (353, 128), (280, 174), (190, 197),
             (263, 110), (279, 85), (268, 151), (407, 180), (450, 322),
             (370, 302), (350, 410), (348, 603), (260, 769), (410, 771)],
    "bridge1": [(330, 95), (357, 95), (344, 111), (346, 137), (282, 179), (187, 225),
                (253, 150), (270, 132), (263, 197), (405, 180), (452, 324),
                (359, 307), (352, 412), (350, 607), (255, 776), (414, 777)],
    "bridge2": [(315, 104), (343, 102), (333, 126), (333, 153), (275, 173), (185, 228),
                (313, 259), (333, 234), (302, 285), (405, 178), (449, 321),
                (365, 316), (345, 415), (345, 613), (262, 773), (410, 774)],
    "bridge3": [(285, 100), (313, 99), (299, 119), (305, 145), (234, 181), (222, 273),
                (344, 219), (359, 188), (365, 242), (391, 189), (442, 330),
                (345, 330), (337, 410), (336, 600), (207, 770), (386, 768)],
    "gesture": [(279, 96), (306, 94), (293, 116), (300, 143), (240, 182), (224, 283),
                (334, 248), (313, 211), (339, 286), (392, 190), (442, 329),
                (344, 325), (334, 411), (333, 600), (207, 770), (386, 766)],
}
ARCHIVBOTIN_POINTS = {
    "work": [(326, 130), (367, 131), (348, 148), (346, 168), (250, 207), (185, 312),
             (258, 338), (240, 220), (300, 365), (417, 207), (460, 315),
             (380, 264), (324, 425), (327, 585), (244, 776), (405, 777)],
    "bridge1": [(309, 104), (345, 104), (328, 123), (329, 147), (247, 190), (192, 305),
                (270, 318), (237, 220), (293, 368), (410, 192), (444, 316),
                (405, 330), (330, 427), (332, 585), (244, 776), (412, 776)],
    "bridge2": [(307, 99), (341, 96), (325, 117), (330, 145), (246, 187), (200, 316),
                (308, 285), (250, 211), (285, 377), (407, 190), (432, 322),
                (367, 330), (322, 420), (322, 587), (231, 775), (403, 775)],
    "bridge3": [(309, 93), (339, 94), (326, 114), (329, 143), (241, 183), (190, 309),
                (299, 279), (225, 196), (283, 357), (398, 182), (426, 320),
                (358, 344), (318, 421), (323, 586), (230, 774), (414, 774)],
    "gesture": [(304, 100), (336, 98), (322, 119), (329, 149), (237, 183), (184, 305),
                (290, 284), (219, 209), (273, 381), (392, 187), (422, 323),
                (351, 343), (321, 420), (319, 583), (244, 777), (404, 775)],
}
FORMULARSAMMLER_POINTS = {
    "work": [(333, 113), (365, 113), (351, 137), (351, 169), (257, 203), (187, 266),
             (265, 209), (298, 215), (412, 570), (419, 212), (448, 334),
             (378, 326), (348, 449), (350, 486), (255, 768), (402, 767)],
    "bridge1": [(342, 110), (371, 110), (356, 132), (355, 166), (265, 180), (207, 248),
                (285, 185), (320, 186), (397, 566), (432, 198), (445, 333),
                (371, 330), (350, 447), (346, 480), (253, 770), (409, 770)],
    "bridge2": [(348, 109), (378, 109), (365, 135), (367, 168), (275, 176), (227, 260),
                (340, 203), (366, 204), (432, 557), (438, 196), (461, 328),
                (391, 326), (345, 448), (342, 475), (193, 770), (396, 765)],
    "bridge3": [(352, 139), (382, 139), (366, 161), (366, 188), (284, 204), (250, 310),
                (375, 264), (400, 221), (436, 556), (436, 217), (446, 344),
                (372, 337), (346, 457), (335, 498), (225, 771), (401, 756)],
    "gesture": [(350, 116), (380, 116), (367, 133), (367, 166), (282, 192), (239, 285),
                (365, 230), (406, 194), (450, 553), (420, 199), (442, 333),
                (368, 329), (340, 451), (327, 496), (226, 768), (403, 754)],
}
NUMMERNFLUESTERER_POINTS = {
    "work": [(298, 104), (324, 105), (310, 124), (311, 147), (244, 168), (214, 280),
             (267, 197), (282, 180), (283, 191), (389, 170), (431, 319),
             (353, 357), (321, 430), (320, 400), (244, 774), (400, 774)],
    "bridge1": [(294, 85), (322, 86), (309, 108), (318, 140), (241, 163), (207, 263),
                (284, 197), (294, 161), (294, 181), (392, 168), (440, 320),
                (354, 355), (330, 430), (320, 400), (244, 774), (403, 775)],
    "bridge2": [(322, 70), (347, 72), (333, 93), (338, 117), (265, 150), (200, 217),
                (302, 205), (328, 171), (329, 196), (404, 164), (428, 262),
                (350, 200), (336, 420), (329, 392), (252, 773), (405, 766)],
    "bridge3": [(318, 75), (347, 74), (331, 98), (337, 125), (260, 151), (235, 283),
                (330, 338), (380, 148), (380, 174), (396, 158), (402, 260),
                (370, 176), (330, 420), (317, 392), (247, 771), (396, 765)],
    "gesture": [(310, 115), (337, 114), (323, 137), (326, 160), (255, 180), (230, 327),
                (326, 365), (372, 206), (370, 228), (384, 183), (407, 277),
                (367, 235), (323, 429), (314, 400), (253, 773), (390, 763)],
}
NACHTSCHICHTMELDERIN_POINTS = {
    "work": [(306, 117), (329, 115), (318, 136), (317, 153), (246, 194), (208, 300),
             (257, 231), (261, 209), (263, 242), (393, 197), (434, 326),
             (344, 309), (325, 457), (316, 439), (236, 770), (409, 772)],
    "bridge1": [(310, 130), (339, 129), (327, 151), (327, 176), (244, 204), (201, 327),
                (250, 280), (253, 250), (257, 286), (405, 215), (439, 333),
                (360, 318), (325, 457), (316, 439), (236, 770), (409, 772)],
    "bridge2": [(295, 101), (322, 102), (311, 122), (317, 146), (253, 182), (203, 310),
                (227, 342), (252, 334), (263, 359), (388, 180), (423, 312),
                (337, 277), (328, 443), (320, 425), (248, 757), (410, 772)],
    "bridge3": [(291, 99), (320, 99), (308, 120), (316, 145), (251, 201), (210, 365),
                (202, 436), (205, 447), (192, 494), (400, 174), (445, 281),
                (345, 266), (320, 432), (325, 412), (253, 755), (408, 771)],
    "gesture": [(293, 148), (324, 148), (311, 166), (315, 190), (265, 230), (227, 402),
                (210, 454), (216, 451), (204, 509), (395, 223), (442, 316),
                (342, 311), (327, 457), (329, 432), (270, 756), (404, 771)],
}
PFANDARCHITEKTIN_POINTS = {
    "work": [(288, 111), (325, 111), (306, 128), (307, 153), (247, 168), (190, 272),
             (257, 206), (279, 193), (332, 453), (394, 172), (448, 318),
             (398, 320), (320, 409), (320, 577), (246, 772), (397, 774)],
    "bridge1": [(279, 103), (315, 98), (299, 121), (302, 148), (236, 173), (182, 290),
                (247, 235), (268, 223), (310, 455), (401, 176), (450, 314),
                (379, 321), (320, 417), (312, 580), (242, 773), (392, 773)],
    "bridge2": [(269, 103), (304, 94), (286, 117), (294, 147), (230, 189), (183, 316),
                (229, 314), (265, 300), (314, 465), (377, 166), (389, 313),
                (275, 278), (311, 423), (323, 573), (253, 760), (401, 770)],
    "gesture": [(263, 144), (297, 140), (281, 161), (288, 190), (237, 218), (188, 327),
                (261, 332), (277, 325), (329, 459), (356, 210), (380, 313),
                (237, 281), (321, 430), (323, 570), (257, 763), (388, 765)],
}
KOPIEPENDLER_POINTS = {
    "work": [(334, 111), (366, 111), (349, 130), (350, 158), (254, 195), (199, 294),
             (277, 234), (385, 360), (392, 446), (414, 205), (447, 309),
             (319, 311), (321, 445), (318, 424), (247, 775), (402, 773)],
    "bridge1": [(309, 114), (341, 113), (325, 136), (329, 162), (249, 207), (209, 320),
                (312, 355), (387, 355), (397, 453), (411, 212), (445, 318),
                (339, 299), (320, 446), (320, 413), (239, 776), (399, 772)],
    "bridge2": [(280, 99), (312, 98), (293, 123), (298, 150), (245, 200), (225, 330),
                (320, 384), (325, 438), (329, 552), (417, 209), (459, 297),
                (356, 309), (329, 445), (328, 406), (168, 771), (468, 771)],
    "bridge3": [(238, 111), (266, 110), (253, 136), (256, 161), (209, 210), (205, 370),
                (256, 443), (253, 489), (250, 620), (384, 208), (429, 291),
                (340, 316), (316, 455), (311, 407), (268, 774), (445, 774)],
    "gesture": [(240, 151), (265, 151), (253, 174), (258, 199), (224, 239), (200, 382),
                (251, 432), (226, 474), (228, 590), (384, 238), (430, 318),
                (339, 340), (313, 470), (308, 425), (250, 771), (425, 762)],
}
WARTESCHLANGENPOETIN_POINTS = {
    "work": [(305, 130), (332, 129), (319, 150), (320, 177), (250, 205), (209, 296),
             (280, 252), (273, 214), (284, 247), (390, 206), (433, 306),
             (369, 271), (320, 395), (317, 511), (245, 766), (394, 767)],
    "bridge1": [(309, 113), (339, 112), (325, 132), (327, 157), (246, 191), (211, 278),
                (292, 242), (287, 197), (298, 231), (391, 193), (430, 303),
                (329, 265), (323, 397), (322, 510), (250, 770), (400, 768)],
    "bridge2": [(292, 121), (322, 119), (306, 141), (310, 170), (242, 182), (216, 294),
                (279, 230), (272, 182), (284, 219), (362, 181), (385, 315),
                (285, 262), (304, 406), (300, 515), (253, 770), (341, 766)],
    "gesture": [(285, 159), (313, 158), (300, 179), (300, 207), (244, 219), (220, 300),
                (282, 258), (273, 214), (286, 244), (353, 220), (380, 306),
                (286, 297), (305, 422), (299, 537), (260, 766), (341, 767)],
}
ALL_POINTS = {"aktenkurier": AKTENKURIER_POINTS, "archivbotin": ARCHIVBOTIN_POINTS,
              "formularsammler": FORMULARSAMMLER_POINTS,
              "nummernfluesterer": NUMMERNFLUESTERER_POINTS,
              "nachtschichtmelderin": NACHTSCHICHTMELDERIN_POINTS,
              "pfandarchitektin": PFANDARCHITEKTIN_POINTS,
              "kopiependler": KOPIEPENDLER_POINTS,
              "warteschlangenpoetin": WARTESCHLANGENPOETIN_POINTS}
ARC_NOTES = {
    "aktenkurier": ("buergeramt.js dialogue gesture and Aktenkurier omen",
                    "stamp_knob/base mark rigid wooden stamp ends",
                    "Stamp remains in anatomical right hand and paper bundle in left throughout. Head turns and torso leans gradually."),
    "archivbotin": ("buergeramt.js dialogue gesture",
                    "stamp_knob/base mark the book's upper and lower ends; anatomical left hand holds the keyring",
                    "Open ledger closes and is hugged by anatomical right arm while keys stay in left hand. Book closure changes occlusion; inspect sampled intermediate paint."),
    "formularsammler": ("buergeramt.js dialogue gesture",
                         "stamp_knob/base mark the top and bottom of the continuous accordion sheet chain",
                         "Anatomical right hand moves a top form toward the chest while the left arm keeps the long accordion stack; no detached/repeated paper segments."),
    "nummernfluesterer": ("buergeramt.js dialogue gesture",
                            "stamp_knob/base mark the small ticket top and bottom, regardless of carrying hand",
                            "Ticket passes from anatomical right hand to left at bridge2 where both hands meet. At bridge3 right hand supports the folder and left holds ticket. This transfer changes ownership; preview only until ordered motion verifies release and receipt."),
    "nachtschichtmelderin": ("buergeramt.js dialogue gesture",
                             "stamp_knob/base mark the phone's top and bottom in anatomical right hand",
                             "Phone descends from face through chest and waist to thigh in the same right hand; documents stay hugged in anatomical left arm."),
    "pfandarchitektin": ("buergeramt.js dialogue gesture",
                         "stamp_knob/base mark the upper and lower ends of the flexible receipt ribbon, not a rigid stamp",
                         "Receipt stays in anatomical right hand and hangs as one continuous strip; tied binder remains hugged by left arm as torso turns."),
    "kopiependler": ("buergeramt.js dialogue gesture",
                     "stamp_knob/base mark the top and bottom of one bicycle helmet; right hand takes its strap from the right hip",
                     "One helmet moves from belt at screen-right through center into right-hand grip at screen-left, while left arm retains papers. Exact source endpoint depicts a larger foreground helmet than work; inspect gradual apparent-size growth."),
    "warteschlangenpoetin": ("buergeramt.js dialogue gesture",
                             "stamp_knob/base mark the small ticket's top and bottom in anatomical right hand",
                             "Ticket remains in right hand while the left arm pulls loose papers to chest and the knees bend in recoil."),
}
PROP_OWNERSHIP = {
    "aktenkurier": {"type": "rigid_stamp", "owner": "anatomical_right_hand",
                    "secondary": "document_bundle_in_anatomical_left_arm"},
    "archivbotin": {"type": "folding_book", "owner": "anatomical_right_arm",
                   "secondary": "keyring_in_anatomical_left_hand"},
    "formularsammler": {"type": "flexible_accordion_forms", "owner": "anatomical_right_top_sheet_and_left_arm_stack"},
    "nummernfluesterer": {"type": "small_rigid_ticket", "owner": "right_hand_until_bridge2_then_left_hand",
                            "handoff_state": "bridge2", "secondary": "folder_moves_to_right_arm"},
    "nachtschichtmelderin": {"type": "rigid_phone", "owner": "anatomical_right_hand",
                             "secondary": "document_stack_in_anatomical_left_arm"},
    "pfandarchitektin": {"type": "flexible_receipt_ribbon", "owner": "anatomical_right_hand",
                         "rigid_transform": False, "secondary": "tied_binder_in_anatomical_left_arm"},
    "kopiependler": {"type": "rigid_bicycle_helmet", "owner": "belt_hanger_until_bridge1_then_anatomical_right_hand",
                     "secondary": "paper_stack_in_anatomical_left_arm"},
    "warteschlangenpoetin": {"type": "part2_brown_shoulder_bag", "owner": "shoulder_strap_and_back",
                            "secondary": "small_ticket_in_anatomical_right_hand_and_notes_in_anatomical_left_arm",
                            "occlusion": "bag passes behind torso at bridge1b; visible edge only"},
}
FORMULAR_PAPER = {
    "work": {"paper_polygon_xy": [(271, 198), (334, 199), (339, 225), (382, 238),
                                   (446, 210), (451, 311), (403, 335), (437, 355),
                                   (444, 576), (375, 582), (365, 392), (369, 347),
                                   (307, 292), (270, 237)],
             "paper_landmarks_xy": [(294, 220), (364, 267), (405, 399), (410, 555)]},
    "bridge1": {"paper_polygon_xy": [(288, 174), (355, 180), (357, 213), (385, 225),
                                      (444, 207), (451, 312), (403, 338), (431, 355),
                                      (435, 573), (357, 579), (354, 388), (351, 339),
                                      (313, 286), (289, 241)],
                "paper_landmarks_xy": [(322, 195), (371, 268), (397, 401), (399, 555)]},
    "bridge2": {"paper_polygon_xy": [(329, 187), (400, 190), (400, 215), (420, 229),
                                      (463, 209), (466, 310), (421, 341), (451, 357),
                                      (469, 574), (389, 581), (379, 393), (380, 348),
                                      (346, 291), (328, 244)],
                "paper_landmarks_xy": [(365, 214), (415, 274), (419, 406), (438, 554)]},
    "bridge3": {"paper_polygon_xy": [(363, 207), (435, 210), (442, 242), (451, 266),
                                      (454, 319), (414, 343), (427, 363), (470, 573),
                                      (377, 582), (354, 400), (354, 342), (365, 291)],
                "paper_landmarks_xy": [(401, 235), (399, 299), (397, 406), (439, 553)]},
    "gesture": {"paper_polygon_xy": [(364, 183), (438, 184), (450, 218), (456, 248),
                                      (456, 319), (410, 340), (427, 363), (481, 567),
                                      (390, 577), (362, 398), (349, 336), (361, 275)],
                "paper_landmarks_xy": [(404, 214), (399, 277), (403, 407), (446, 552)]},
}
PROP_REGIONS = {
    "nachtschichtmelderin": {
        "work": {"prop_polygon_xy": [(247, 202), (278, 201), (286, 245), (254, 252)],
                 "prop_landmarks_xy": [(257, 231), (263, 204), (265, 225), (266, 246)]},
        "bridge1": {"prop_polygon_xy": [(238, 244), (270, 245), (277, 284), (245, 292)],
                    "prop_landmarks_xy": [(250, 280), (253, 248), (257, 266), (261, 287)]},
        "bridge2": {"prop_polygon_xy": [(234, 326), (270, 328), (280, 362), (243, 368)],
                    "prop_landmarks_xy": [(227, 342), (251, 332), (256, 348), (263, 363)]},
        "bridge3": {"prop_polygon_xy": [(192, 437), (224, 446), (209, 498), (172, 492)],
                    "prop_landmarks_xy": [(202, 436), (211, 447), (199, 470), (185, 493)]},
        "gesture": {"prop_polygon_xy": [(203, 444), (230, 453), (216, 511), (178, 500)],
                    "prop_landmarks_xy": [(210, 454), (218, 453), (207, 478), (192, 505)]},
    },
    "kopiependler": {
        "work": {"prop_polygon_xy": [(367, 353), (410, 349), (438, 380), (440, 420),
                                      (414, 452), (373, 452), (345, 423), (347, 385)],
                 "prop_landmarks_xy": [(369, 362), (385, 360), (393, 399), (393, 447)]},
        "bridge1": {"prop_polygon_xy": [(367, 348), (412, 347), (441, 378), (443, 421),
                                         (416, 457), (371, 457), (346, 420), (351, 381)],
                    "prop_landmarks_xy": [(320, 362), (389, 356), (397, 403), (397, 455)]},
        "bridge2": {"prop_polygon_xy": [(309, 412), (351, 424), (372, 459), (368, 517),
                                         (348, 548), (324, 558), (293, 535), (278, 494),
                                         (287, 449)],
                    "prop_landmarks_xy": [(320, 384), (326, 438), (328, 487), (328, 552)]},
        "bridge3": {"prop_polygon_xy": [(243, 470), (282, 482), (300, 522), (298, 579),
                                         (267, 620), (225, 613), (202, 575), (202, 518)],
                    "prop_landmarks_xy": [(256, 443), (255, 488), (249, 546), (249, 618)]},
        "gesture": {"prop_polygon_xy": [(215, 456), (256, 468), (278, 507), (277, 551),
                                         (244, 589), (205, 587), (185, 555), (184, 507)],
                    "prop_landmarks_xy": [(251, 432), (227, 473), (228, 526), (228, 588)]},
    },
    "warteschlangenpoetin": {
        "work": {"prop_polygon_xy": [(210, 340), (237, 335), (266, 373), (257, 414),
                                      (224, 440), (192, 417), (190, 378)],
                 "prop_landmarks_xy": [(227, 350), (222, 348), (224, 393), (221, 433)]},
        "bridge1": {"prop_polygon_xy": [(210, 339), (245, 336), (269, 375), (260, 416),
                                         (226, 441), (191, 416), (190, 373)],
                    "prop_landmarks_xy": [(228, 348), (226, 345), (226, 395), (225, 437)]},
        "bridge2": {"prop_polygon_xy": [(394, 296), (431, 298), (460, 340), (460, 401),
                                         (443, 440), (402, 440), (377, 397), (378, 344)],
                    "prop_landmarks_xy": [(394, 327), (418, 303), (427, 378), (425, 438)]},
        "gesture": {"prop_polygon_xy": [(393, 320), (436, 321), (472, 358), (476, 414),
                                         (451, 451), (409, 449), (382, 408), (381, 356)],
                    "prop_landmarks_xy": [(399, 344), (424, 327), (436, 386), (434, 446)]},
    },
}

# Paper stacks are separate paint from pale trousers and dark jacket/legs.
# Ordered controls: visible stack center, left/top edge, right/top edge, bottom center.
DOCUMENT_REGIONS = {
    "nachtschichtmelderin": {
        "work": {"paper_polygon_xy": [[262, 253], [322, 251], [322, 218], [425, 217], [440, 239],
                                      [425, 385], [322, 385], [319, 327], [263, 325]],
                 "paper_landmarks_xy": [[348, 300], [266, 257], [424, 220], [371, 384]]},
        "bridge1": {"paper_polygon_xy": [[273, 278], [342, 277], [343, 235], [431, 232], [443, 253],
                                         [419, 399], [327, 397], [326, 346], [273, 346]],
                    "paper_landmarks_xy": [[358, 312], [275, 283], [433, 235], [374, 395]]},
        "bridge2": {"paper_polygon_xy": [[311, 206], [398, 190], [416, 211], [413, 349],
                                         [323, 352], [315, 321]],
                    "paper_landmarks_xy": [[365, 273], [315, 208], [405, 195], [370, 349]]},
        "bridge3": {"paper_polygon_xy": [[313, 207], [395, 180], [417, 199], [425, 338],
                                         [331, 344], [322, 306]],
                    "paper_landmarks_xy": [[369, 263], [317, 209], [403, 185], [375, 340]]},
        "gesture": {"paper_polygon_xy": [[315, 241], [404, 219], [421, 236], [422, 374],
                                         [333, 378], [326, 334]],
                    "paper_landmarks_xy": [[370, 298], [318, 242], [407, 224], [376, 374]]},
    },
    "kopiependler": {
        "work": {"paper_polygon_xy": [[273, 214], [302, 211], [420, 227], [426, 247],
                                      [412, 377], [273, 377], [271, 349], [281, 306]],
                 "paper_landmarks_xy": [[350, 294], [278, 217], [419, 231], [331, 374]]},
        "bridge1": {"paper_polygon_xy": [[303, 222], [420, 217], [435, 251], [426, 361],
                                         [323, 367], [301, 345], [304, 287]],
                    "paper_landmarks_xy": [[363, 293], [308, 226], [422, 222], [369, 362]]},
        "bridge2": {"paper_polygon_xy": [[306, 232], [381, 198], [424, 195], [434, 220],
                                         [466, 345], [450, 380], [368, 393], [326, 355]],
                    "paper_landmarks_xy": [[386, 290], [311, 232], [425, 199], [415, 386]]},
        "bridge3": {"paper_polygon_xy": [[268, 250], [351, 191], [388, 187], [403, 216],
                                         [441, 339], [416, 371], [354, 387], [302, 334]],
                    "paper_landmarks_xy": [[363, 291], [272, 250], [387, 191], [397, 383]]},
        "gesture": {"paper_polygon_xy": [[270, 282], [350, 220], [387, 216], [405, 245],
                                         [440, 359], [418, 394], [365, 418], [302, 365]],
                    "paper_landmarks_xy": [[364, 320], [275, 283], [387, 221], [394, 414]]},
    },
}

# Anatomic right sleeve/hand is dark paint that otherwise competes with dark
# trousers. Phone remains part2 and is applied after this part3 override.
ARM_REGIONS = {
    "nachtschichtmelderin": {
        "work": [[232, 168], [271, 181], [280, 207], [274, 261], [238, 284],
                 [222, 333], [193, 330], [188, 282], [204, 231]],
        "bridge1": [[226, 183], [262, 195], [269, 244], [279, 303], [270, 332],
                    [230, 347], [187, 352], [182, 314], [197, 251]],
        "bridge2": [[222, 189], [262, 211], [245, 271], [275, 332], [269, 368],
                    [218, 376], [185, 352], [185, 310], [201, 257]],
        "bridge3": [[235, 194], [272, 210], [260, 278], [232, 368], [228, 419],
                    [181, 465], [171, 446], [192, 389], [201, 289], [203, 234]],
        "gesture": [[239, 216], [274, 226], [269, 298], [243, 383], [239, 436],
                    [189, 469], [181, 449], [203, 392], [205, 286], [212, 239]],
    },
}


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def bbox(image: Image.Image) -> list[int] | None:
    pixels = np.asarray(image.convert("RGBA"))[:, :, 3]
    ys, xs = np.nonzero(pixels > 16)
    return [int(xs.min()), int(ys.min()), int(xs.max() + 1), int(ys.max() + 1)] if len(xs) else None


def premultiplied_resize(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    """Filter premultiplied color so transparent RGB cannot bleed into sprite edges."""
    pixels = np.asarray(image.convert("RGBA"), dtype=np.float32) / 255.0
    alpha = pixels[:, :, 3]
    pixels[:, :, :3] *= alpha[:, :, None]
    channels = [np.asarray(Image.fromarray(pixels[:, :, i], "F").resize(size, Image.Resampling.LANCZOS))
                for i in range(4)]
    out_alpha = np.clip(channels[3], 0, 1)
    out_rgb = np.stack(channels[:3], axis=2)
    out_rgb = np.divide(out_rgb, out_alpha[:, :, None], out=np.zeros_like(out_rgb),
                        where=out_alpha[:, :, None] > 1 / 255)
    out = np.dstack((np.clip(out_rgb, 0, 1), out_alpha))
    result = np.rint(out * 255).astype(np.uint8)
    result[result[:, :, 3] == 0, :3] = 0
    return Image.fromarray(result, "RGBA")


def register_knick_handoff() -> None:
    """Register two authored paper handoff paintings on Knick's 1024 canvas."""
    frames = [
        ("knick-stamp-handoff-mid-source.png", "knick-stamp-handoff1.webp", 0.71, 50,
         {"eye_right": [544, 147], "eye_left": [591, 160], "nose": [568, 172], "chin": [566, 212],
          "shoulder_right": [445, 229], "elbow_right": [344, 284], "grip_right": [394, 216],
          "stamp_knob": [430, 181], "stamp_base": [380, 274],
          "shoulder_left": [619, 251], "elbow_left": [675, 346], "hand_left": [751, 368],
          "hip_center": [519, 402], "skirt_hem_center": [520, 599],
          "foot_screen_left": [468, 781], "foot_screen_right": [620, 764]},
         [[724, 351], [860, 350], [870, 380], [814, 403], [726, 386]],
         [[798, 376], [728, 355], [859, 353], [809, 399]]),
        ("knick-stamp-handoff1-source.png", "knick-stamp-handoff2.webp", 0.71, 65,
         {"eye_right": [544, 144], "eye_left": [588, 156], "nose": [565, 169], "chin": [557, 213],
          "shoulder_right": [438, 230], "elbow_right": [342, 270], "grip_right": [380, 200],
          "stamp_knob": [418, 160], "stamp_base": [378, 248],
          "shoulder_left": [624, 249], "elbow_left": [690, 345], "hand_left": [649, 386],
          "hip_center": [520, 400], "skirt_hem_center": [521, 597],
          "foot_screen_left": [472, 782], "foot_screen_right": [608, 763]},
         [[533, 375], [666, 365], [676, 391], [562, 410], [534, 399]],
         [[604, 389], [540, 377], [665, 370], [601, 407]]),
    ]
    records = []
    for source_name, output_name, scale, left, landmarks, paper_polygon, paper_points in frames:
        source = ARCS / source_name
        pixels = np.asarray(Image.open(source).convert("RGBA")).copy()
        pixels[pixels[:, :, 3] <= 16] = 0
        image = Image.fromarray(pixels, "RGBA")
        original_box = bbox(image)
        assert original_box is not None
        top = round(798 - original_box[3] * scale)
        scaled = premultiplied_resize(image, (round(image.width * scale), round(image.height * scale)))
        target = Image.new("RGBA", (1024, 832), (0, 0, 0, 0))
        target.paste(scaled, (left, top))
        target_box = bbox(target)
        assert target_box and target_box[0] >= 8 and target_box[1] >= 8
        assert target_box[2] <= 1016 and target_box[3] <= 824
        assert np.all(np.asarray(target)[np.asarray(target)[:, :, 3] == 0, :3] == 0)
        destination = ARCS / output_name
        target.save(destination, "WEBP", lossless=True, exact=True, method=6)
        records.append({
            "id": output_name.removesuffix(".webp"),
            "file": destination.relative_to(ROOT).as_posix(),
            "sha256": sha256(destination),
            "source_file": source.relative_to(ROOT).as_posix(),
            "source_sha256": sha256(source),
            "source_crop_xyxy": original_box,
            "canvas_xy": [1024, 832],
            "scale": scale,
            "translation_xy": [left, top],
            "alpha_bbox_xyxy": target_box,
            "landmarks": landmarks,
            "source_landmarks_xy": {key: [round((point[0] - left) / scale, 1),
                                          round((point[1] - top) / scale, 1)]
                                    for key, point in landmarks.items()},
            "paper_polygon_xy": paper_polygon,
            "paper_landmarks_xy": paper_points,
        })
    existing_states = {
        "bridge-stamp-1": {
            "file": "assets/previews/knick-splats/bridge-stamp-1.webp",
            "paper_polygon_xy": [[823, 330], [990, 332], [998, 358], [930, 385], [823, 367]],
            "paper_landmarks_xy": [[909, 357], [826, 338], [990, 336], [923, 381]],
        },
        "bridge-stamp-2": {
            "file": "assets/previews/knick-splats/bridge-stamp-2.webp",
            "paper_polygon_xy": [[486, 374], [630, 370], [645, 387], [597, 405], [505, 405]],
            "paper_landmarks_xy": [[565, 388], [489, 378], [629, 374], [570, 402]],
        },
        "bridge-stamp-3": {
            "file": "assets/previews/knick-splats/bridge-stamp-3.webp",
            "paper_polygon_xy": [[446, 390], [607, 385], [629, 407], [589, 427], [470, 425]],
            "paper_landmarks_xy": [[535, 405], [451, 394], [608, 389], [535, 423]],
        },
        "anchor-contact": {
            "file": "assets/previews/knick-splats/anchor-2.webp", "source_canvas_xy": [384, 832],
            "source_to_canvas_translation_xy": [320, 0],
            "paper_polygon_xy": [[456, 405], [606, 392], [626, 414], [593, 438], [471, 442]],
            "paper_landmarks_xy": [[539, 417], [463, 410], [606, 397], [543, 439]],
        },
        "bridge-fold-1": {
            "file": "assets/previews/knick-splats/bridge-fold-1.webp",
            "paper_polygon_xy": [[469, 389], [632, 381], [650, 400], [605, 421], [486, 420]],
            "paper_landmarks_xy": [[555, 402], [473, 393], [632, 385], [553, 418]],
        },
        "bridge-fold-2": {
            "file": "assets/previews/knick-splats/bridge-fold-2.webp",
            "paper_polygon_xy": [[749, 378], [909, 379], [919, 397], [864, 417], [749, 411]],
            "paper_landmarks_xy": [[835, 397], [752, 382], [909, 382], [834, 414]],
        },
    }
    for item in existing_states.values():
        item["sha256"] = sha256(ROOT / item["file"])
    payload = {"version": 1, "paper_landmark_order": ["sheet_center", "sheet_left_top", "sheet_right_top", "sheet_bottom_center"],
               "paper_orientation_note": "The stack stays approximately horizontal while the anatomical-left hand changes support from its left to its right edge. Track stable sheet geometry around center; do not interpret grip migration as a 180-degree sheet rotation. Anatomical hand_left separately tracks the supporting hand. Mask stamp paint above paper where they overlap.",
               "frames": records, "existing_states": existing_states}
    (ARCS / "knick-stamp-handoff.json").write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    for tone, color in (("light", "#e1ded6"), ("dark", "#252b32")):
        sequence = [ROOT / "assets/previews/knick-splats/bridge-stamp-1.webp",
                    ARCS / "knick-stamp-handoff1.webp", ARCS / "knick-stamp-handoff2.webp",
                    ROOT / "assets/previews/knick-splats/bridge-stamp-2.webp"]
        contact = Image.new("RGB", (1024 * len(sequence), 832), color)
        for index, path in enumerate(sequence):
            sprite = Image.open(path).convert("RGBA")
            contact.paste(sprite, (1024 * index, 0), sprite)
        contact.resize((2048, 416), Image.Resampling.LANCZOS).save(EVIDENCE / f"knick-stamp-handoff-contact-{tone}.png")
    ordered = [(item["id"], item) for item in records] + list(existing_states.items())
    overlay = Image.new("RGB", (4 * 1024, 2 * 864), "#e1ded6")
    draw = ImageDraw.Draw(overlay)
    for index, (label, item) in enumerate(ordered):
        origin_x, origin_y = (index % 4) * 1024, (index // 4) * 864
        sprite = Image.open(ROOT / item["file"]).convert("RGBA")
        if sprite.width == 384:
            shifted = Image.new("RGBA", (1024, 832))
            shifted.paste(sprite, (320, 0))
            sprite = shifted
        overlay.paste(sprite, (origin_x, origin_y + 32), sprite)
        draw.text((origin_x + 12, origin_y + 8), label, fill="#111111")
        polygon = [(x + origin_x, y + origin_y + 32) for x, y in item["paper_polygon_xy"]]
        draw.line(polygon + [polygon[0]], fill="#f000e6", width=4)
        for point_index, (x, y) in enumerate(item["paper_landmarks_xy"]):
            px, py = x + origin_x, y + origin_y + 32
            draw.ellipse((px - 6, py - 6, px + 6, py + 6), outline="#00dcea", width=3)
            draw.text((px + 7, py - 12), str(point_index), fill="#005c70")
    overlay.resize((2048, 864), Image.Resampling.LANCZOS).save(EVIDENCE / "knick-paper-polygons.png")


def register_poetin_bag_mid() -> None:
    """Add one real behind-torso bag pose between the two poet paintings."""
    name = "warteschlangenpoetin"
    source = ARCS / f"{name}-bridge-transition-source.png"
    raw = np.asarray(Image.open(source).convert("RGBA")).copy()
    raw[raw[:, :, 3] <= 16] = 0
    image = Image.fromarray(raw, "RGBA")
    source_box = bbox(image)
    assert source_box is not None
    scale = 0.585
    left = round(320 - (source_box[0] + source_box[2]) * 0.5 * scale)
    top = round(802 - source_box[3] * scale)
    scaled = premultiplied_resize(image, (round(image.width * scale), round(image.height * scale)))
    target = Image.new("RGBA", (640, 832), (0, 0, 0, 0))
    target.paste(scaled, (left, top))
    box = bbox(target)
    assert box and box[0] >= 8 and box[1] >= 8 and box[2] <= 632 and box[3] <= 824
    destination = ARCS / f"{name}-bridge1b.webp"
    target.save(destination, "WEBP", lossless=True, exact=True, method=6)
    spec_path = ARCS / f"{name}-work-gesture.json"
    spec = json.loads(spec_path.read_text(encoding="utf-8"))
    spec["states"] = [state for state in spec["states"] if state["id"] != "bridge1b"]
    bridge = {
        "id": "bridge1b", "role": "transition", "file": destination.relative_to(ROOT).as_posix(),
        "source_file": source.relative_to(ROOT).as_posix(), "source_sha256": sha256(source),
        "source_crop_xyxy": source_box, "uniform_scale": scale, "translation_xy": [left, top],
        "alpha_bbox_xyxy": box,
        "landmarks": dict(zip(LANDMARK_KEYS, [
            [291, 113], [318, 112], [304, 130], [304, 159],
            [242, 184], [211, 282], [273, 234], [268, 196], [280, 228],
            [374, 184], [402, 291], [302, 265],
            [317, 397], [317, 513], [244, 768], [391, 768],
        ])),
        "prop_polygon_xy": [[384, 321], [410, 329], [429, 359], [433, 389], [421, 409], [397, 382]],
        "prop_landmarks_xy": [[392, 332], [407, 333], [419, 365], [423, 399]],
        "prop_occlusion": "The one brown bag is mostly behind the torso; only its screen-right edge is visible.",
    }
    spec["states"].insert(2, bridge)
    spec["arcs"][0]["keys"] = [
        {"state": "work", "time": 0}, {"state": "bridge1", "time": 0.65},
        {"state": "bridge1b", "time": 1.0}, {"state": "bridge2", "time": 1.35},
        {"state": "gesture", "time": 2.0},
    ]
    note = (" Bridge1b is a real painted behind-torso bag occlusion checkpoint; "
            "transport the visible bag through its occluded edge with body depth masking.")
    if note not in spec["compatibility"]:
        spec["compatibility"] += note
    spec_path.write_text(json.dumps(spec, indent=2) + "\n", encoding="utf-8")
    for tone, color in (("light", "#e1ded6"), ("dark", "#252b32")):
        canvas = Image.new("RGB", (640 * len(spec["states"]), 832), color)
        for index, state in enumerate(spec["states"]):
            sprite = Image.open(ROOT / state["file"]).convert("RGBA")
            if "crop_xywh" in state:
                x, y, w, h = state["crop_xywh"]
                sprite = sprite.crop((x, y, x + w, y + h))
            canvas.paste(sprite, (index * 640, 0), sprite)
        canvas.save(EVIDENCE / f"{name}-bag-handoff-{tone}.png")
    overlay = Image.open(EVIDENCE / f"{name}-bag-handoff-light.png")
    draw = ImageDraw.Draw(overlay)
    for index, state in enumerate(spec["states"]):
        polygon = [(x + index * 640, y) for x, y in state["prop_polygon_xy"]]
        draw.line(polygon + [polygon[0]], fill="#f000e6", width=3)
        for x, y in state["prop_landmarks_xy"]:
            cx = x + index * 640
            draw.ellipse((cx - 5, y - 5, cx + 5, y + 5), outline="#00dcea", width=2)
    overlay.save(EVIDENCE / f"{name}-bag-ownership.png")


def register_bridges(name: str) -> list[dict]:
    """Apply one family scale, preserving the drawn pose and its planted shoes."""
    if name not in BRIDGE_COUNT:
        return []
    family_scale = BRIDGE_SCALE[name]
    output = []
    for index in range(1, BRIDGE_COUNT[name] + 1):
        source_path = ARCS / f"{name}-bridge{index}-source.png"
        if not source_path.exists():
            continue
        image = Image.open(source_path).convert("RGBA")
        scale = (family_scale.get((index, image.size), family_scale.get(image.size))
                 if isinstance(family_scale, dict) else family_scale)
        assert scale is not None, (name, index, image.size)
        original = np.asarray(image).copy()
        original[original[:, :, 3] <= 16] = 0
        image = Image.fromarray(original, "RGBA")
        box = bbox(image)
        assert box is not None, source_path
        scaled_size = (round(image.width * scale), round(image.height * scale))
        scaled = premultiplied_resize(image, scaled_size)
        center_x = (box[0] + box[2]) / 2
        left = round(320 - center_x * scale)
        top = round(SHOE_BASELINE - box[3] * scale)
        assert left + round(box[0] * scale) >= 8
        assert left + round(box[2] * scale) <= 632
        assert top + round(box[1] * scale) >= 8
        assert top + round(box[3] * scale) <= 824
        target = Image.new("RGBA", (640, 832), (0, 0, 0, 0))
        target.paste(scaled, (left, top))
        path = ARCS / f"{name}-bridge{index}.webp"
        target.save(path, format="WEBP", lossless=True, method=6, exact=True)
        output.append({"id": f"bridge{index}", "file": path.relative_to(ROOT).as_posix(),
                       "sha256": sha256(path), "source_file": source_path.relative_to(ROOT).as_posix(),
                       "source_sha256": sha256(source_path), "source_canvas_xy": list(image.size),
                       "source_alpha_bbox_xyxy": box, "uniform_scale": scale,
                       "translation_xy": [left, top], "canvas_xy": [640, 832],
                       "encoded_alpha_bbox_xyxy": bbox(target)})
    return output


def contact_registered_arc(name: str) -> None:
    bridges = [ARCS / f"{name}-bridge{i}.webp" for i in range(1, BRIDGE_COUNT[name] + 1)]
    if not all(path.exists() for path in bridges):
        return
    detail = Image.open(DETAIL / f"{name}-detail.webp").convert("RGBA")
    images = [detail.crop((0, 0, 640, 832))]
    images += [Image.open(path).convert("RGBA") for path in bridges]
    images.append(detail.crop((1920, 0, 2560, 832)))
    labels = ["work"] + [f"bridge{i}" for i in range(1, len(bridges) + 1)] + ["gesture"]
    for tone, color, ink in (("light", "#e1ded6", "#17212c"),
                             ("dark", "#252b32", "#f3efe7")):
        canvas = Image.new("RGB", (640 * len(images), 864), color)
        draw = ImageDraw.Draw(canvas)
        for index, (label, image) in enumerate(zip(labels, images)):
            canvas.paste(image, (index * 640, 32), image)
            draw.text((index * 640 + 12, 8), f"{name} / {label}", fill=ink)
        canvas.save(EVIDENCE / f"{name}-registered-{tone}.png")
    for label, image in zip(labels, images):
        grid = Image.new("RGB", (640, 832), "#e1ded6")
        grid.paste(image, (0, 0), image)
        draw = ImageDraw.Draw(grid)
        for x in range(0, 640, 50):
            draw.line((x, 0, x, 831), fill="#777777", width=1)
            draw.text((x + 2, 1), str(x), fill="#101010")
        for y in range(0, 832, 50):
            draw.line((0, y, 639, y), fill="#777777", width=1)
            draw.text((2, y + 2), str(y), fill="#101010")
        grid.save(EVIDENCE / f"{name}-{label}-grid.png")


def emit_spec(name: str, bridge_rows: list[dict]) -> None:
    if name not in ALL_POINTS or len(bridge_rows) != BRIDGE_COUNT[name]:
        return
    detail = DETAIL / f"{name}-detail.webp"
    points = ALL_POINTS[name]
    states = []
    for state in ("work", *(f"bridge{i}" for i in range(1, BRIDGE_COUNT[name] + 1)), "gesture"):
        if state in ("work", "gesture"):
            item = {"id": state, "role": "main" if state == "work" else "terminal",
                    "file": detail.relative_to(ROOT).as_posix(),
                    "crop_xywh": [0 if state == "work" else 1920, 0, 640, 832]}
        else:
            row = bridge_rows[int(state[-1]) - 1]
            item = {"id": state, "role": "transition", "file": row["file"],
                    "source_file": row["source_file"], "source_sha256": row["source_sha256"],
                    "uniform_scale": row["uniform_scale"],
                    "translation_xy": row["translation_xy"]}
        assert len(points[state]) == len(LANDMARK_KEYS), (name, state)
        item["landmarks"] = dict(zip(LANDMARK_KEYS, points[state]))
        if name == "formularsammler":
            item.update(FORMULAR_PAPER[state])
        if name in DOCUMENT_REGIONS:
            item.update(DOCUMENT_REGIONS[name][state])
        if name in ARM_REGIONS:
            item["arm_polygon_xy"] = ARM_REGIONS[name][state]
            item["arm_landmarks_xy"] = [item["landmarks"][key] for key in
                                        ("shoulder_right", "elbow_right", "grip_right")]
        if name in PROP_REGIONS:
            item.update(PROP_REGIONS[name][state])
        states.append(item)
    times = (0, .4, .95, 1.5, 2.0) if len(states) == 5 else (0, .65, 1.35, 2.0)
    keys = [{"state": state["id"], "time": time} for state, time in zip(states, times)]
    owner, prop_note, compatibility = ARC_NOTES[name]
    spec = {"version": 1, "id": name, "canvas_xy": [640, 832],
            "source_authority": detail.relative_to(ROOT).as_posix(),
            "source_sha256": sha256(detail),
            "event_owner": owner + "; work/look/flinch and walking remain existing controllers",
            "prop_ownership": PROP_OWNERSHIP[name],
            "landmark_note": "Native 640x832 visual reading; anatomical right is screen-left. " + prop_note + ". Common shoe baseline; source resolution classes are registered with fixed scales.",
            "arcs": [{"id": "work-gesture", "from": "work", "to": "gesture",
                      "duration": 2.0, "keys": keys,
                      "reverse": "Traverse the same keys and matched Gaussian segments backwards over 2.0s, with no new paintings or holds."}],
            "states": states,
            "compatibility": compatibility + " Matched Gaussian correspondence must be reviewed through ordered playback; no unconstrained whole-body TPS."}
    if name == "formularsammler":
        spec["paper_landmark_order"] = ["grip_top", "first_bend", "mid_chain", "far_bottom"]
        spec["paper_region_note"] = ("Polygons bound the visible accordion chain; separate this light paper group "
                                     "from legs and shoe paint before matching. The four ordered points run top-to-bottom.")
    if name in DOCUMENT_REGIONS:
        spec["paper_landmark_order"] = ["stack_center", "left_top", "right_top", "bottom_center"]
        spec["paper_region_note"] = ("The full visible document stack is a paper-only group, separate from "
                                     "trouser paint. Hands may partly occlude paper; preserve anatomical arm controls.")
    if name in ARM_REGIONS:
        spec["arm_landmark_order"] = ["shoulder_right", "elbow_right", "grip_right"]
        spec["arm_region_note"] = ("Anatomical-right dark sleeve/hand is an explicit part3 group, "
                                   "separate from lower-body trousers. Apply arm before paper and phone masks, "
                                   "with phone part2 last at overlap.")
    if name in PROP_REGIONS:
        spec["prop_landmark_order"] = ["grip", "top", "center", "bottom"]
        spec["prop_region_note"] = ("Polygons bound the handset, helmet, or bag in native encoded cells. "
                                    "Keep this group separate from leg and coat matching; the ordered controls "
                                    "track grip, upper edge, center and lower edge.")
    if name == "nummernfluesterer":
        spec["promotion_requires"] = "encoded_ticket_handoff_motion_review"
    (ARCS / f"{name}-work-gesture.json").write_text(json.dumps(spec, indent=2) + "\n", encoding="utf-8")
    region_field = "paper" if name == "formularsammler" else "prop"
    if name == "formularsammler" or name in PROP_REGIONS:
        canvas = Image.new("RGB", (640 * len(states), 832), "#e1ded6")
        draw = ImageDraw.Draw(canvas)
        for index, state in enumerate(states):
            image = Image.open(ROOT / state["file"]).convert("RGBA")
            if "crop_xywh" in state:
                x, y, w, h = state["crop_xywh"]
                image = image.crop((x, y, x + w, y + h))
            canvas.paste(image, (index * 640, 0), image)
            polygon = [(x + index * 640, y) for x, y in state[f"{region_field}_polygon_xy"]]
            draw.line(polygon + [polygon[0]], fill="#f000e6", width=3)
            for x, y in state[f"{region_field}_landmarks_xy"]:
                cx = x + index * 640
                draw.ellipse((cx - 5, y - 5, cx + 5, y + 5), outline="#00dcea", width=2)
        canvas.save(EVIDENCE / f"{name}-{region_field}-polygons.png")
    if name in DOCUMENT_REGIONS or name in ARM_REGIONS:
        canvas = Image.new("RGB", (640 * len(states), 832), "#e1ded6")
        draw = ImageDraw.Draw(canvas)
        for index, state in enumerate(states):
            image = Image.open(ROOT / state["file"]).convert("RGBA")
            if "crop_xywh" in state:
                x, y, w, h = state["crop_xywh"]
                image = image.crop((x, y, x + w, y + h))
            canvas.paste(image, (index * 640, 0), image)
            for key, color in (("paper_polygon_xy", "#f000e6"), ("arm_polygon_xy", "#00dcea")):
                if key not in state:
                    continue
                polygon = [(x + index * 640, y) for x, y in state[key]]
                draw.line(polygon + [polygon[0]], fill=color, width=3)
        canvas.save(EVIDENCE / f"{name}-document-arm-polygons.png")


def emit_patron_plan(rows: dict) -> None:
    observations = {
        "renter": ["accepted idle, folders hugged", "walking stride, not planted",
                   "selects a page and looks down", "reaches free hand toward viewer"],
        "parent": ["accepted idle, bag and documents held", "walking stride, not planted",
                   "pulls a sheet to read", "looks up while hugging documents"],
        "pensioner": ["accepted idle, cane grounded and slip held", "walking stride, not planted",
                      "reads raised slip; glasses differ from idle", "lifts slip overhead with cane grounded"],
    }
    recommended_bridges = {"renter": [None, None, 2, 3],
                           "parent": [None, None, 2, 2],
                           "pensioner": [None, None, 3, 3]}
    patrons = []
    for name in PATRONS:
        source = rows[name]
        detail = DETAIL / f"{name}-detail.webp"
        patrons.append({
            "id": name, "source": source["source"], "source_sha256": source["sha256"],
            "source_canvas_xy": source["canvas_xy"],
            "accepted_idle": {"file": detail.relative_to(ROOT).as_posix(),
                              "sha256": sha256(detail), "canvas_xy": [384, 832],
                              "source_column": 0},
            "event_owner": "unwired candidate source; current Bürgeramt patron draw is static idle",
            "candidates": [{"column": i, "crop_xyxy": crop,
                            "observation": observations[name][i],
                            "status": "accepted_idle" if i == 0 else "unaccepted_source_candidate",
                            "suggested_bridge_paintings_from_idle": recommended_bridges[name][i]}
                           for i, crop in enumerate(source["column_crop_xyxy"])],
            "compatibility": ("Walking candidate changes planted-foot contract. "
                              "Paper/hand candidates need actual transition paintings before any Gaussian arc. "
                              + ("Glasses appear/shift between candidate poses and need discrete prop ownership review."
                                 if name == "pensioner" else "Preserve document/bag ownership.")),
        })
    plan = {"version": 1, "id": "buergeramt-patron-source-inventory",
            "scope": "source inspection only; these are not runtime arc specs",
            "patrons": patrons}
    (ARCS / "patrons-source-plan.json").write_text(json.dumps(plan, indent=2) + "\n", encoding="utf-8")


def audit_specs() -> None:
    report = {"specs": {}, "warnings": []}
    for name in MOVERS:
        spec = json.loads((ARCS / f"{name}-work-gesture.json").read_text(encoding="utf-8"))
        rows = []
        assert len(spec["states"]) == BRIDGE_COUNT[name] + 2 + (name == "warteschlangenpoetin")
        for state in spec["states"]:
            path = ROOT / state["file"]
            assert path.exists(), path
            image = Image.open(path).convert("RGBA")
            if "crop_xywh" in state:
                x, y, w, h = state["crop_xywh"]
                image = image.crop((x, y, x + w, y + h))
            assert image.size == (640, 832), (name, state["id"], image.size)
            rgba = np.asarray(image)
            alpha = rgba[:, :, 3]
            alpha_box = bbox(image)
            assert alpha_box is not None
            distances = {}
            for key, point in state["landmarks"].items():
                px, py = point
                assert 0 <= px < 640 and 0 <= py < 832
                y0, y1 = max(0, py - 64), min(832, py + 65)
                x0, x1 = max(0, px - 64), min(640, px + 65)
                yy, xx = np.nonzero(alpha[y0:y1, x0:x1] > 16)
                distance = (float(np.hypot(xx + x0 - px, yy + y0 - py).min())
                            if len(xx) else None)
                distances[key] = distance
                if distance is None or distance > 22:
                    report["warnings"].append({"id": name, "state": state["id"],
                                               "landmark": key, "distance_px": distance})
            hidden = int(np.count_nonzero(rgba[:, :, :3][alpha == 0]))
            if state["role"] == "transition":
                assert hidden == 0, (name, state["id"], "hidden RGB", hidden)
                assert min(alpha_box[0], alpha_box[1], 640 - alpha_box[2], 832 - alpha_box[3]) >= 8
            rows.append({"state": state["id"], "alpha_bbox_xyxy": alpha_box,
                         "hidden_rgb_at_alpha_zero": hidden, "landmark_distance_px": distances})
        report["specs"][name] = rows
    (EVIDENCE / "spec-audit.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print("spec audit:", len(report["specs"]), "movers,", len(report["warnings"]), "landmark warnings")


def contact_mover(name: str, tone: str, background: str, ink: str) -> list[dict]:
    canvas = Image.new("RGB", (512 * 4, 544), background)
    draw = ImageDraw.Draw(canvas)
    records = []
    for index, state in enumerate(STATES):
        path = SOURCE / name / f"{state}.png"
        image = Image.open(path).convert("RGBA")
        assert image.size == (512, 512), (path, image.size)
        canvas.paste(image, (index * 512, 32), image)
        draw.text((index * 512 + 12, 8), f"{name} / {state}", fill=ink)
        records.append({"state": state, "source": path.relative_to(ROOT).as_posix(),
                        "sha256": sha256(path), "canvas_xy": list(image.size),
                        "alpha_bbox_xyxy": bbox(image)})
    canvas.save(EVIDENCE / f"{name}-{tone}.png")
    return records


def contact_patron(name: str, tone: str, background: str, ink: str) -> dict:
    path = SOURCE / f"{name}-source.png"
    image = Image.open(path).convert("RGBA")
    assert image.size == (1536, 1024), (path, image.size)
    canvas = Image.new("RGB", (1536, 1056), background)
    canvas.paste(image, (0, 32), image)
    draw = ImageDraw.Draw(canvas)
    for column in range(4):
        draw.text((column * 384 + 12, 8), f"{name} / candidate {column}", fill=ink)
        if column:
            draw.line((column * 384, 32, column * 384, 1056), fill=ink, width=1)
    canvas.save(EVIDENCE / f"{name}-source-{tone}.png")
    return {"source": path.relative_to(ROOT).as_posix(), "sha256": sha256(path),
            "canvas_xy": list(image.size), "alpha_bbox_xyxy": bbox(image),
            "column_crop_xyxy": [[i * 384, 0, (i + 1) * 384, 1024] for i in range(4)]}


def contact_original(name: str, tone: str, background: str, ink: str) -> list[dict]:
    layouts = (
        (("action", ("work", "gesture"), 768),
         ("reaction", ("look", "flinch"), 768))
        if name in ORIGINAL_TWO_SHEET else
        (("action", ("work", "look", "flinch", "gesture"), 384),)
    )
    records = []
    for suffix, labels, width in layouts:
        path = SOURCE / f"{name}-{suffix}.png"
        image = Image.open(path).convert("RGBA")
        assert image.size == (1536, 1024), (path, image.size)
        canvas = Image.new("RGB", (1536, 1056), background)
        canvas.paste(image, (0, 32), image)
        draw = ImageDraw.Draw(canvas)
        for column, label in enumerate(labels):
            draw.text((column * width + 12, 8), f"{name} / {label} original", fill=ink)
            if column:
                draw.line((column * width, 32, column * width, 1056), fill=ink, width=1)
        canvas.save(EVIDENCE / f"{name}-{suffix}-original-{tone}.png")
        records.append({"states": list(labels), "source": path.relative_to(ROOT).as_posix(),
                        "sha256": sha256(path), "canvas_xy": list(image.size),
                        "state_crop_xyxy": {
                            state: [i * width, 0, (i + 1) * width, 1024]
                            for i, state in enumerate(labels)
                        }})
    return records


def main() -> None:
    EVIDENCE.mkdir(parents=True, exist_ok=True)
    ARCS.mkdir(parents=True, exist_ok=True)
    metadata = {"movers": {}, "patrons": {}, "registered_bridges": {}}
    for name in MOVERS:
        for tone, background, ink in (("light", "#e1ded6", "#17212c"),
                                      ("dark", "#252b32", "#f3efe7")):
            rows = contact_mover(name, tone, background, ink)
            if tone == "light":
                metadata["movers"][name] = rows
            original = contact_original(name, tone, background, ink)
            if tone == "light":
                metadata.setdefault("original_sources", {})[name] = original
        metadata["registered_bridges"][name] = register_bridges(name)
        if name in BRIDGE_COUNT:
            contact_registered_arc(name)
        emit_spec(name, metadata["registered_bridges"][name])
        if name == "warteschlangenpoetin":
            register_poetin_bag_mid()
    for name in PATRONS:
        for tone, background, ink in (("light", "#e1ded6", "#17212c"),
                                      ("dark", "#252b32", "#f3efe7")):
            row = contact_patron(name, tone, background, ink)
            if tone == "light":
                metadata["patrons"][name] = row
    emit_patron_plan(metadata["patrons"])
    if (ARCS / "knick-stamp-handoff-mid-source.png").exists() and (ARCS / "knick-stamp-handoff1-source.png").exists():
        register_knick_handoff()
    (EVIDENCE / "source-inventory.json").write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")
    audit_specs()
    print("source-native contacts:", len(MOVERS), "movers × 2 tones, original strips;", len(PATRONS), "patrons × 2 tones")


if __name__ == "__main__":
    main()
