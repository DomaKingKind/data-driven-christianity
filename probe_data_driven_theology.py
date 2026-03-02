#!/usr/bin/env python3
"""
Probe: Data-Driven Theological Framework
Ranks every major theological concept by three metrics:
  1. FREQUENCY — how often does the text talk about it?
  2. CROSS-TESTAMENT CONTINUITY — how well does it transfer OT→NT?
  3. SEMANTIC CENTRALITY — how many other concepts cluster around it?

The product of these three scores = the concept's "Theological Weight"
in the biblical text itself, with no doctrinal overlay.

Also maps concepts to Second Temple categories.
"""
import sqlite3, json, numpy as np, re
from collections import Counter

DB = "Bibledata/bible-search/bible.db"
db = sqlite3.connect(DB)

# ============================================================
# CONCEPT DEFINITIONS
# Each concept has Hebrew AND Greek terms that express it
# ============================================================
concepts = {
    'divine_reign': {
        'label': 'God\'s Reign / Cosmic Kingship',
        'second_temple': 'Cosmic enthronement — God as king over all powers and principalities',
        'hebrew': {'melek': 'H4428', 'mamlakah': 'H4467', 'yhdh': 'H3068', 'elohim': 'H430', 'mashiach': 'H4899'},
        'greek': {'basileia': 'G932', 'basileus': 'G935', 'kyrios': 'G2962', 'christos': 'G5547', 'thronos': 'G2362'},
    },
    'union_participation': {
        'label': 'Union / Participation / "In God"',
        'second_temple': 'Participation in divine life — the covenant bond as ontological union',
        'hebrew': {'dabaq': 'H1692', 'yada': 'H3045', 'berit': 'H1285'},
        'greek': {'meno': 'G3306', 'en_christo': None, 'koinonia': 'G2842', 'ginosko': 'G1097'},
    },
    'loyal_love': {
        'label': 'Loyal Love / Covenant Faithfulness',
        'second_temple': 'chesed as the defining attribute of YHWH — sung in the Psalter',
        'hebrew': {'chesed': 'H2617', 'ahav': 'H157', 'emeth': 'H571', 'aman': 'H539'},
        'greek': {'agape': 'G26', 'pistis': 'G4102', 'charis': 'G5485', 'aletheia': 'G225'},
    },
    'justice_righteousness': {
        'label': 'Justice as Right-Relationship',
        'second_temple': 'mishpat/tsedaqah as cosmic order — God setting things right',
        'hebrew': {'mishpat': 'H4941', 'tsedaqah': 'H6666', 'shaphat': 'H8199'},
        'greek': {'dikaiosyne': 'G1343', 'dikaioo': 'G1344', 'krisis': 'G2920', 'krima': 'G2917'},
    },
    'restoration_after_judgment': {
        'label': 'Restoration After Judgment',
        'second_temple': 'Judgment as purgative — the divine courtroom serves restoration',
        'hebrew': {'shub': 'H7725', 'gaal': 'H1350', 'padah': 'H6299', 'shalom': 'H7999'},
        'greek': {'apokathistemi': 'G600', 'katallasso': 'G2644', 'soteria': 'G4991', 'sozo': 'G4982', 'eirene': 'G1515'},
    },
    'spirit_community': {
        'label': 'Spirit-Driven Community',
        'second_temple': 'Prophetic movement — spirit-gifted, decentralized leadership',
        'hebrew': {'ruach': 'H7307', 'navi': 'H5030', 'qodesh': 'H6944'},
        'greek': {'pneuma': 'G4151', 'ekklesia': 'G1577', 'charisma': 'G5486', 'prophetes': 'G4396', 'apostolos': 'G652'},
    },
    'life_resurrection': {
        'label': 'Life / Resurrection / New Creation',
        'second_temple': 'Resurrection as cosmic renewal — not just afterlife but new age',
        'hebrew': {'chai': 'H2416', 'reshit': 'H7225'},
        'greek': {'zoe': 'G2222', 'anastasis': 'G386', 'egeiro': 'G1453', 'kainos': 'G2537'},
    },
    'atonement_sacrifice': {
        'label': 'Atonement / Sacrifice Mechanics',
        'second_temple': 'Temple ritual system — kaphar as institutional priestly act',
        'hebrew': {'kipper': 'H3722', 'dam': 'H1818', 'kohen': 'H3548', 'chatta': 'H2403'},
        'greek': {'haima': 'G129', 'hiereus': 'G2409', 'hilasmos': 'G2434', 'thusia': 'G2378'},
    },
    'torah_wisdom': {
        'label': 'Torah as Wisdom / Instruction',
        'second_temple': 'Torah as God\'s instruction for life — not legal code but wisdom path',
        'hebrew': {'torah': 'H8451', 'shamar': 'H8104'},
        'greek': {'nomos': 'G3551', 'logos': 'G3056', 'sophia': 'G4678', 'didache': 'G1322'},
    },
    'death_judgment': {
        'label': 'Death / Eternal Punishment / Hell',
        'second_temple': 'Sheol as poetic underworld — no systematic hell doctrine',
        'hebrew': {'maveth': 'H4194', 'sheol': 'H7585', 'avon': 'H5771', 'pesha': 'H6588'},
        'greek': {'thanatos': 'G2288', 'hades': 'G86', 'geenna': 'G1067', 'apollumi': 'G622', 'orge': 'G3709', 'kolasis': 'G2851'},
    },
    'cosmic_scope': {
        'label': 'Cosmic / Universal Scope',
        'second_temple': 'All nations, all creation — the scope of God\'s reign is total',
        'hebrew': {'kol': 'H3605', 'goy': 'H1471', 'erets': 'H776'},
        'greek': {'pas': 'G3956', 'kosmos': 'G2889', 'ktisis': 'G2937', 'ethnos': 'G1484'},
    },
    'individual_salvation': {
        'label': 'Individual Decision / Personal Salvation',
        'second_temple': 'Not a primary Second Temple category — salvation is communal/cosmic',
        'hebrew': {'bachar': 'H977', 'yeshua': 'H3468'},
        'greek': {'pisteus': 'G4100', 'metanoia': 'G3341', 'baptisma': 'G908'},
    },
    'temple_sacred_space': {
        'label': 'Temple / Sacred Space',
        'second_temple': 'Temple as axis mundi — heaven-earth intersection point',
        'hebrew': {'bayit': 'H1004', 'hekal': 'H1964', 'qodesh': 'H6944'},
        'greek': {'naos': 'G3485', 'hieron': 'G2411', 'oikos': 'G3624'},
    },
}
