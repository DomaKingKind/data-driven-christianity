#!/usr/bin/env python3
"""
Six Extension Probes for Data-Driven Christianity:
1. Community Practices — what did the earliest community DO?
2. The Actual Enemy — cosmic powers vs individual sin
3. Ethics Shape — response to reign vs salvation requirement
4. Women and Power — leadership vocabulary patterns
5. Sacred Calendar — feast/sabbath/liturgical time continuity
6. Sermon Profile — proportional preaching by text emphasis
"""
import sqlite3, json, numpy as np, re
from collections import Counter

DB = "Bibledata/bible-search/bible.db"
db = sqlite3.connect(DB)

def get_embedding(book, chapter, verse):
    cur = db.execute("""
        SELECT ve.embedding FROM verse_embeddings ve
        JOIN verses v ON ve.verse_id = v.id
        WHERE v.book=? AND v.chapter=? AND v.verse=? AND v.translation='BSB'
    """, (book, chapter, verse))
    row = cur.fetchone()
    return np.frombuffer(row[0], dtype=np.float32) if row else None

def cosine(a, b):
    if a is None or b is None: return 0.0
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))

def count_verses_matching(pattern):
    """Count BSB verses containing a pattern."""
    cur = db.execute("SELECT COUNT(*) FROM verses WHERE translation='BSB' AND text LIKE ?", (f'%{pattern}%',))
    return cur.fetchone()[0]

def get_greek_count(search_term):
    """Count Greek word occurrences by english column Strong's number."""
    # English column format: G####=morph, with zero-padded 4-digit numbers
    # Convert G746 to G0746, G266 to G0266, etc.
    if search_term and search_term.startswith('G'):
        num = search_term[1:]
        padded = f"G{num.zfill(4)}"
        cur = db.execute("SELECT COUNT(*) FROM step_greek_words WHERE english LIKE ?", (f'{padded}=%',))
        c = cur.fetchone()[0]
        if c > 0: return c
    # Fallback: search dstrongs
    cur = db.execute("SELECT COUNT(*) FROM step_greek_words WHERE dstrongs LIKE ?", (f'%{search_term}%',))
    return cur.fetchone()[0]

def get_hebrew_count(strongs):
    cur = db.execute("SELECT COUNT(*) FROM step_hebrew_words WHERE dstrongs LIKE ?", (f'%{strongs}%',))
    return cur.fetchone()[0]

# ============================================================
# PROBE 1: COMMUNITY PRACTICES
# ============================================================
print("=" * 60)
print("PROBE 1: COMMUNITY PRACTICES — What Did They DO?")
print("=" * 60)

practices = {
    'prayer_worship': {
        'label': 'Prayer / Worship',
        'hebrew': {'palal': 'H6419', 'halal': 'H1984', 'yadah': 'H3034', 'zamar': 'H2167', 'shachah': 'H7812'},
        'greek': {'proseuche': 'G4335', 'proseuchomai': 'G4336', 'proskuneo': 'G4352', 'ainesis': 'G133'},
    },
    'meal_table': {
        'label': 'Shared Meal / Table Fellowship',
        'hebrew': {'lechem': 'H3899', 'yayin': 'H3196', 'shulchan': 'H7979'},
        'greek': {'artos': 'G740', 'oinos': 'G3631', 'deipnon': 'G1173', 'klao': 'G2806', 'trapeza': 'G5132'},
    },
    'healing_miracle': {
        'label': 'Healing / Miracles',
        'hebrew': {'rapha': 'H7495'},
        'greek': {'therapeuo': 'G2323', 'iaomai': 'G2390', 'dynamis': 'G1411', 'semeion': 'G4592'},
    },
    'teaching_instruction': {
        'label': 'Teaching / Instruction',
        'hebrew': {'lamad': 'H3925', 'torah': 'H8451'},
        'greek': {'didasko': 'G1321', 'didache': 'G1322', 'didaskalia': 'G1319', 'katecheo': 'G2727'},
    },
    'economic_sharing': {
        'label': 'Economic Sharing / Generosity',
        'hebrew': {'natan': 'H5414', 'tsedaqah': 'H6666'},
        'greek': {'koinonia': 'G2842', 'diakonia': 'G1248', 'eleemosyne': 'G1654', 'charis_gift': None},
    },
    'baptism_initiation': {
        'label': 'Baptism / Initiation',
        'hebrew': {},
        'greek': {'baptizo': 'G907', 'baptisma': 'G908'},
    },
    'proclamation': {
        'label': 'Proclamation / Announcement',
        'hebrew': {'qara': 'H7121', 'basar': 'H1319'},
        'greek': {'kerusso': 'G2784', 'euangelizo': 'G2097', 'martureo': 'G3140', 'katangello': 'G2605'},
    },
    'hospitality': {
        'label': 'Hospitality / Stranger-Welcome',
        'hebrew': {'ger': 'H1616'},
        'greek': {'philoxenia': 'G5381', 'xenos': 'G3581'},
    },
}

practice_results = []
for pkey, pdata in practices.items():
    total = 0
    details = {}
    for term, strongs in pdata.get('hebrew', {}).items():
        if strongs:
            c = get_hebrew_count(strongs)
            details[term] = c
            total += c
    for term, strongs in pdata.get('greek', {}).items():
        if strongs:
            c = get_greek_count(strongs)
            details[term] = c
            total += c

    practice_results.append({
        'key': pkey,
        'label': pdata['label'],
        'total': total,
        'details': details,
    })
    print(f"  {pdata['label']}: {total}")
    for t, c in sorted(details.items(), key=lambda x: -x[1])[:4]:
        print(f"    {t}: {c}")

practice_results.sort(key=lambda x: -x['total'])
print("\n  RANKED PRACTICES:")
for i, pr in enumerate(practice_results):
    print(f"  {i+1}. {pr['label']}: {pr['total']}")

# ============================================================
# PROBE 2: THE ACTUAL ENEMY
# ============================================================
print("\n" + "=" * 60)
print("PROBE 2: THE ACTUAL ENEMY — What's the Problem?")
print("=" * 60)

enemies = {
    'cosmic_powers': {
        'label': 'Cosmic Powers / Principalities / Death as Enemy',
        'hebrew': {'satan': 'H7854', 'maveth_enemy': 'H4194'},
        'greek': {'arche': 'G746', 'exousia': 'G1849', 'kosmokrator': 'G2888',
                  'diabolos': 'G1228', 'satanas': 'G4567', 'thanatos_enemy': 'G2288',
                  'daimonion': 'G1140', 'pneuma_akatharton': None},
        'verses': [
            ("Ephesians", 6, 12, "not against flesh and blood but against principalities"),
            ("1 Corinthians", 15, 26, "the last enemy to be destroyed is death"),
            ("Colossians", 2, 15, "disarming the rulers and authorities"),
            ("Romans", 8, 38, "neither death nor life nor angels nor principalities"),
            ("1 John", 3, 8, "destroy the works of the devil"),
            ("Hebrews", 2, 14, "destroy him who holds the power of death"),
        ],
    },
    'individual_sin': {
        'label': 'Individual Moral Failure / Personal Sin',
        'hebrew': {'chatta_sin': 'H2403', 'avon_iniq': 'H5771', 'pesha_trans': 'H6588'},
        'greek': {'hamartia': 'G266', 'hamartano': 'G264', 'paraptoma': 'G3900',
                  'parabasis': 'G3847', 'anomia': 'G458'},
        'verses': [
            ("Romans", 3, 23, "all have sinned"),
            ("Romans", 6, 23, "wages of sin is death"),
            ("1 John", 1, 8, "if we say we have no sin"),
            ("James", 1, 15, "sin when full-grown gives birth to death"),
            ("Galatians", 5, 19, "works of the flesh are evident"),
        ],
    },
    'structural_injustice': {
        'label': 'Structural Injustice / Systemic Oppression',
        'hebrew': {'chamac': 'H2555', 'oshek': 'H6233', 'shod': 'H7701'},
        'greek': {'adikia': 'G93', 'pleonexia': 'G4124'},
        'verses': [
            ("Amos", 5, 12, "you oppress the righteous and take bribes"),
            ("Isaiah", 10, 1, "woe to those who make unjust laws"),
            ("Micah", 2, 2, "they covet fields and seize them"),
            ("James", 5, 4, "wages you withheld cry out"),
        ],
    },
    'idolatry_false_worship': {
        'label': 'Idolatry / False Worship',
        'hebrew': {'pesel': 'H6459', 'elil': 'H457', 'bamah': 'H1116'},
        'greek': {'eidolon': 'G1497', 'eidololatria': 'G1495'},
        'verses': [
            ("Exodus", 20, 3, "no other gods before me"),
            ("Isaiah", 44, 9, "those who make idols are nothing"),
            ("1 Corinthians", 10, 14, "flee from idolatry"),
        ],
    },
}

enemy_results = []
for ekey, edata in enemies.items():
    total = 0
    details = {}
    for term, strongs in edata.get('hebrew', {}).items():
        if strongs:
            c = get_hebrew_count(strongs)
            details[term] = c
            total += c
    for term, strongs in edata.get('greek', {}).items():
        if strongs:
            c = get_greek_count(strongs)
            details[term] = c
            total += c

    enemy_results.append({
        'key': ekey,
        'label': edata['label'],
        'total': total,
        'details': details,
    })
    print(f"  {edata['label']}: {total}")
    for t, c in sorted(details.items(), key=lambda x: -x[1])[:5]:
        print(f"    {t}: {c}")

enemy_results.sort(key=lambda x: -x['total'])
print("\n  RANKED ENEMIES:")
for i, er in enumerate(enemy_results):
    print(f"  {i+1}. {er['label']}: {er['total']}")

# Semantic test: do NT "solution" passages cluster with cosmic-enemy or sin-enemy language?
print("\n  SOLUTION PASSAGES CLUSTERING:")
solution_verses = [
    ("Romans", 8, 2, "set free from law of sin and death"),
    ("Colossians", 1, 13, "rescued from dominion of darkness"),
    ("Galatians", 1, 4, "rescue us from present evil age"),
    ("1 Corinthians", 15, 57, "gives us victory through our Lord"),
    ("2 Corinthians", 5, 17, "new creation"),
    ("Revelation", 21, 4, "no more death or mourning"),
]

cosmic_verses = [e[0:3] for e in enemies['cosmic_powers']['verses']]
sin_verses = [e[0:3] for e in enemies['individual_sin']['verses']]

for book, ch, vs, desc in solution_verses:
    sol_emb = get_embedding(book, ch, vs)
    if sol_emb is None: continue

    avg_cosmic = np.mean([cosine(sol_emb, get_embedding(*cv)) for cv in cosmic_verses if get_embedding(*cv) is not None])
    avg_sin = np.mean([cosine(sol_emb, get_embedding(*sv)) for sv in sin_verses if get_embedding(*sv) is not None])
    delta = avg_cosmic - avg_sin
    leans = "COSMIC" if delta > 0 else "SIN"
    print(f"    {book} {ch}:{vs} ({desc}): cosmic={avg_cosmic:.4f} sin={avg_sin:.4f} → {leans}")

# ============================================================
# PROBE 3: ETHICS SHAPE
# ============================================================
print("\n" + "=" * 60)
print("PROBE 3: ETHICS SHAPE — Response to Reign vs Salvation Requirement")
print("=" * 60)

# Ethics-as-participation (response to kingdom)
participation_ethics = [
    ("Matthew", 5, 3, "blessed are the poor in spirit — kingdom of heaven is theirs"),
    ("Matthew", 5, 44, "love your enemies — be children of your Father"),
    ("Romans", 12, 1, "offer your bodies as living sacrifice — in view of God's mercy"),
    ("Galatians", 5, 22, "the fruit of the Spirit is love, joy, peace"),
    ("Ephesians", 4, 1, "walk worthy of the calling"),
    ("Philippians", 2, 5, "have this mind which was in Christ Jesus"),
    ("Colossians", 3, 1, "since you have been raised with Christ, set hearts on things above"),
    ("1 John", 4, 19, "we love because he first loved us"),
]

# Ethics-as-condition (requirement for salvation)
conditional_ethics = [
    ("Matthew", 7, 21, "not everyone who says Lord Lord will enter — only one who does will"),
    ("Matthew", 25, 46, "these will go away into eternal punishment, righteous into eternal life"),
    ("Romans", 2, 6, "God will repay each according to their deeds"),
    ("James", 2, 17, "faith without works is dead"),
    ("Hebrews", 10, 26, "if we deliberately go on sinning, no sacrifice left"),
    ("Revelation", 20, 12, "the dead were judged according to what they had done"),
    ("Galatians", 6, 7, "a man reaps what he sows"),
    ("2 Corinthians", 5, 10, "we must all appear before judgment seat"),
]

# Get all NT ethical instruction passages (imperative-heavy chapters)
ethical_chapters = [
    ("Matthew", 5, "Sermon on the Mount — beatitudes"),
    ("Matthew", 6, "Sermon — prayer, fasting, treasure"),
    ("Matthew", 7, "Sermon — judging, golden rule"),
    ("Romans", 12, "living sacrifice, body of Christ"),
    ("Romans", 13, "love as fulfillment of law"),
    ("Galatians", 5, "fruit of Spirit vs works of flesh"),
    ("Ephesians", 4, "unity, new self"),
    ("Ephesians", 5, "walk in love, light"),
    ("Colossians", 3, "raised with Christ — put on new self"),
    ("James", 2, "faith and works"),
    ("1 Peter", 2, "living stones, royal priesthood"),
    ("1 John", 3, "love one another"),
]

# Which cluster does each ethical chapter lean toward?
part_embs = []
for book, ch, vs, desc in participation_ethics:
    emb = get_embedding(book, ch, vs)
    if emb is not None: part_embs.append(emb)

cond_embs = []
for book, ch, vs, desc in conditional_ethics:
    emb = get_embedding(book, ch, vs)
    if emb is not None: cond_embs.append(emb)

ethics_results = []
for book, ch, desc in ethical_chapters:
    cur = db.execute("""
        SELECT v.verse, ve.embedding FROM verse_embeddings ve
        JOIN verses v ON ve.verse_id = v.id
        WHERE v.book=? AND v.chapter=? AND v.translation='BSB'
    """, (book, ch))
    ch_embs = [(vs, np.frombuffer(emb, dtype=np.float32)) for vs, emb in cur.fetchall()]

    if not ch_embs: continue

    avg_part = np.mean([np.mean([cosine(ce[1], pe) for pe in part_embs]) for ce in ch_embs])
    avg_cond = np.mean([np.mean([cosine(ce[1], ce2) for ce2 in cond_embs]) for ce in ch_embs])
    delta = avg_part - avg_cond
    leans = "PARTICIPATORY" if delta > 0 else "CONDITIONAL"

    ethics_results.append({
        'reference': f"{book} {ch}",
        'description': desc,
        'avg_participatory': round(float(avg_part), 4),
        'avg_conditional': round(float(avg_cond), 4),
        'delta': round(float(delta), 4),
        'leans': leans,
    })
    print(f"  {book} {ch} ({desc}): part={avg_part:.4f} cond={avg_cond:.4f} → {leans}")

# ============================================================
# PROBE 4: WOMEN AND POWER
# ============================================================
print("\n" + "=" * 60)
print("PROBE 4: WOMEN AND POWER — Leadership Vocabulary by Gender")
print("=" * 60)

# Count women in leadership roles in the text
women_leaders = [
    ("Exodus", 15, 20, "Miriam", "prophet"),
    ("Judges", 4, 4, "Deborah", "judge/prophet"),
    ("2 Kings", 22, 14, "Huldah", "prophet"),
    ("Luke", 2, 36, "Anna", "prophet"),
    ("Acts", 18, 26, "Priscilla", "teacher"),
    ("Romans", 16, 1, "Phoebe", "deacon"),
    ("Romans", 16, 7, "Junia", "apostle"),
    ("Acts", 16, 14, "Lydia", "church host/patron"),
    ("Acts", 21, 9, "Philip's daughters", "prophets"),
    ("Romans", 16, 3, "Priscilla", "co-worker"),
    ("Romans", 16, 6, "Mary", "hard worker"),
    ("Romans", 16, 12, "Tryphena/Tryphosa", "workers in the Lord"),
]

# Count restriction passages
restriction_passages = [
    ("1 Corinthians", 14, 34, "women should be silent"),
    ("1 Timothy", 2, 12, "I do not permit a woman to teach"),
    ("1 Corinthians", 11, 5, "woman who prays/prophesies — head covering"),
    ("Ephesians", 5, 22, "wives submit to husbands"),
    ("Colossians", 3, 18, "wives submit to husbands"),
    ("1 Peter", 3, 1, "wives be submissive"),
]

# Semantic test: do leadership words (apostolos, prophetes, diakonos, etc.)
# appear in contexts about women?
leadership_terms = ['apostle', 'prophet', 'deacon', 'minister', 'servant', 'teacher', 'worker', 'co-worker']

# Check Romans 16 specifically — Paul's most extensive leadership list
print("\n  Romans 16 — Paul's Leadership List:")
cur = db.execute("""
    SELECT verse, text FROM verses
    WHERE book='Romans' AND chapter=16 AND translation='BSB'
    ORDER BY verse
""")
rom16 = cur.fetchall()
women_mentioned = 0
men_mentioned = 0
women_with_titles = 0
men_with_titles = 0

# Known women in Rom 16
women_names = ['Phoebe', 'Priscilla', 'Prisca', 'Mary', 'Junia', 'Tryphena', 'Tryphosa', 'Persis', 'Julia', 'Nereus\'s sister', 'Rufus\'s mother']
for vs, text in rom16:
    has_woman = any(w in text for w in ['Phoebe','Priscilla','Mary','Junia','Tryphena','Tryphosa','Persis','Julia','mother','sister'])
    has_title = any(t in text.lower() for t in leadership_terms)
    if has_woman:
        women_mentioned += 1
        if has_title: women_with_titles += 1
        print(f"    v{vs}: {text[:100]}")

print(f"\n  Women in Rom 16 with leadership titles: {women_with_titles}")
print(f"  Total women mentioned in Rom 16: {women_mentioned}")

# Ratio: leadership passages about/including women vs restriction passages
women_power = {
    'women_in_leadership_passages': len(women_leaders),
    'restriction_passages': len(restriction_passages),
    'ratio': round(len(women_leaders) / len(restriction_passages), 2) if restriction_passages else 0,
    'rom16_women_mentioned': women_mentioned,
    'rom16_women_with_titles': women_with_titles,
}
print(f"\n  Leadership passages including women: {len(women_leaders)}")
print(f"  Restriction passages: {len(restriction_passages)}")
print(f"  Ratio: {women_power['ratio']}:1 leadership-to-restriction")

# Undisputed vs disputed Paulines
print("\n  By letter authorship:")
print("    Undisputed Paul (Rom, 1-2 Cor, Gal, Phil, 1 Thess, Phlm):")
print("      Women leaders: Phoebe, Junia, Priscilla, Mary, Tryphena, Tryphosa, Persis")
print("      Restrictions: 1 Cor 14:34 (possibly interpolated), 1 Cor 11:5 (head covering, not silence)")
print("    Disputed/Pastoral (1-2 Tim, Titus, Eph, Col):")
print("      Restrictions: 1 Tim 2:12, Eph 5:22, Col 3:18")

# ============================================================
# PROBE 5: SACRED CALENDAR
# ============================================================
print("\n" + "=" * 60)
print("PROBE 5: SACRED CALENDAR — Feast/Sabbath/Liturgical Time")
print("=" * 60)

calendar_terms = {
    'sabbath': {
        'hebrew': {'shabbat': 'H7676'},
        'greek': {'sabbaton': 'G4521'},
        'label': 'Sabbath/Rest',
    },
    'passover': {
        'hebrew': {'pesach': 'H6453'},
        'greek': {'pascha': 'G3957'},
        'label': 'Passover/Paschal',
    },
    'feast_general': {
        'hebrew': {'chag': 'H2282', 'moed': 'H4150'},
        'greek': {'heorte': 'G1859'},
        'label': 'Feast/Appointed Time',
    },
    'jubilee_release': {
        'hebrew': {'yobel': 'H3104', 'deror': 'H1865', 'shemittah': 'H8059'},
        'greek': {'aphesis_release': 'G859'},
        'label': 'Jubilee/Release/Forgiveness',
    },
    'firstfruits': {
        'hebrew': {'bikkurim': 'H1061'},
        'greek': {'aparche': 'G536'},
        'label': 'Firstfruits',
    },
    'new_moon': {
        'hebrew': {'chodesh': 'H2320'},
        'greek': {},
        'label': 'New Moon/Month',
    },
}

calendar_results = []
for ckey, cdata in calendar_terms.items():
    total = 0
    details = {}
    for term, strongs in cdata.get('hebrew', {}).items():
        c = get_hebrew_count(strongs)
        details[term] = c
        total += c
    for term, strongs in cdata.get('greek', {}).items():
        c = get_greek_count(strongs)
        details[term] = c
        total += c

    calendar_results.append({
        'key': ckey, 'label': cdata['label'], 'total': total, 'details': details
    })
    print(f"  {cdata['label']}: {total}")
    for t, c in sorted(details.items(), key=lambda x: -x[1]):
        print(f"    {t}: {c}")

calendar_results.sort(key=lambda x: -x['total'])
total_calendar = sum(cr['total'] for cr in calendar_results)
print(f"\n  Total calendar vocabulary: {total_calendar}")

# Cross-testament continuity for calendar concepts
print("\n  Calendar OT→NT continuity:")
cal_pairs = [
    ("Sabbath", ("Exodus", 20, 8), ("Mark", 2, 27)),
    ("Passover", ("Exodus", 12, 11), ("1 Corinthians", 5, 7)),
    ("Firstfruits", ("Leviticus", 23, 10), ("1 Corinthians", 15, 20)),
    ("Jubilee/Release", ("Leviticus", 25, 10), ("Luke", 4, 18)),
    ("Feast/Tabernacles", ("Leviticus", 23, 34), ("John", 7, 2)),
]
for label, ot, nt in cal_pairs:
    ot_emb = get_embedding(*ot)
    nt_emb = get_embedding(*nt)
    sim = cosine(ot_emb, nt_emb)
    print(f"    {label}: {ot[0]} {ot[1]}:{ot[2]} → {nt[0]} {nt[1]}:{nt[2]} = {sim:.4f}")

# ============================================================
# PROBE 6: SERMON PROFILE
# ============================================================
print("\n" + "=" * 60)
print("PROBE 6: SERMON PROFILE — Proportional Preaching")
print("=" * 60)

# Use the rankings from data_driven_theology.json
theology_data = json.load(open('output/data_driven_theology.json'))
ranked = theology_data['rankings']

total_freq = sum(r['frequency_raw'] for r in ranked)
print(f"  Total concept vocabulary: {total_freq} occurrences")
print(f"\n  If you preached proportionally to text emphasis:")
print(f"  {'Concept':<42s} {'Occurrences':>10s} {'% of Sermon':>12s} {'Min/40min':>10s}")
print(f"  {'-'*76}")

sermon_profile = []
for r in ranked:
    pct = r['frequency_raw'] / total_freq * 100
    minutes = pct / 100 * 40  # 40-minute sermon
    sermon_profile.append({
        'concept': r['label'],
        'occurrences': r['frequency_raw'],
        'percentage': round(pct, 1),
        'minutes_per_40': round(minutes, 1),
    })
    print(f"  {r['label']:<42s} {r['frequency_raw']:>10d} {pct:>11.1f}% {minutes:>9.1f} min")

# Compare to typical evangelical sermon profile (estimated)
print("\n  COMPARISON: Typical Evangelical Sermon vs Data-Driven Sermon")
typical = {
    'Individual Decision / Personal Salvation': 35,
    'Death / Eternal Punishment / Hell': 15,
    'Atonement / Sacrifice Mechanics': 20,
    "God's Reign / Cosmic Kingship": 5,
    'Loyal Love / Covenant Faithfulness': 10,
    'Life / Resurrection / New Creation': 5,
    'Restoration After Judgment': 0,
    'Cosmic / Universal Scope': 0,
    'Spirit-Driven Community': 5,
    'Torah as Wisdom / Instruction': 3,
    'Justice as Right-Relationship': 2,
    'Temple / Sacred Space': 0,
    'Union / Participation / "In God"': 0,
}

print(f"\n  {'Concept':<42s} {'Typical %':>10s} {'Data %':>10s} {'Gap':>10s}")
print(f"  {'-'*74}")
sermon_comparison = []
for sp in sermon_profile:
    typ = typical.get(sp['concept'], 0)
    gap = sp['percentage'] - typ
    sermon_comparison.append({
        'concept': sp['concept'],
        'typical_pct': typ,
        'data_pct': sp['percentage'],
        'gap': round(gap, 1),
    })
    direction = '\u2191' if gap > 0 else '\u2193' if gap < 0 else '='
    print(f"  {sp['concept']:<42s} {typ:>9d}% {sp['percentage']:>9.1f}% {gap:>+9.1f}% {direction}")

# ============================================================
# SAVE ALL RESULTS
# ============================================================
output = {
    'probe_1_practices': practice_results,
    'probe_2_enemies': enemy_results,
    'probe_3_ethics': ethics_results,
    'probe_4_women_power': women_power,
    'probe_4_women_leaders': [{'book': w[0], 'chapter': w[1], 'verse': w[2], 'name': w[3], 'role': w[4]} for w in women_leaders],
    'probe_5_calendar': calendar_results,
    'probe_5_calendar_total': total_calendar,
    'probe_6_sermon_profile': sermon_profile,
    'probe_6_sermon_comparison': sermon_comparison,
}

outpath = "output/six_extensions_probe.json"
with open(outpath, 'w') as f:
    json.dump(output, f, indent=2, default=str)
print(f"\nSaved to {outpath}")

db.close()
