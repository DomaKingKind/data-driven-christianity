#!/usr/bin/env python3
"""
Probe: What did Jesus mean by "the gospel"?

Unlike Paul (who defines it in 1 Cor 15:3-4), Jesus enacts it.
But he does use the word — and he has programmatic statements.

Method:
1. Find every euangelion/euangelizo occurrence in the Gospels
2. Identify Jesus's programmatic gospel-definition passages:
   - Mark 1:14-15 (opening announcement)
   - Luke 4:16-21 (Nazareth manifesto — Isaiah 61 citation)
   - Matthew 4:23 / 9:35 (summary statements)
   - Luke 7:22 / Matt 11:4-6 (answer to John the Baptist: "what do you see?")
   - Matthew 24:14 / Mark 13:10 ("this gospel of the kingdom")
   - Mark 10:29-30 ("for my sake and the gospel's")
3. Semantic embedding analysis: where do these point in OT?
4. Compare Jesus's gospel content to Paul's 1 Cor 15 gospel content
5. What theological categories do Jesus's gospel passages cluster with?
6. The Isaiah 61 question: Jesus's self-selected proof text
7. Kingdom vocabulary co-occurrence analysis
"""

import sqlite3
import json
import struct
import math
import os

DB_PATH = "Bibledata/bible-search/bible.db"
OUT_DIR = "output"

db = sqlite3.connect(DB_PATH)
db.row_factory = sqlite3.Row

def get_embedding(book, chapter, verse_num):
    cur = db.execute("""
        SELECT ve.embedding FROM verse_embeddings ve
        JOIN verses v ON ve.verse_id = v.id
        WHERE (v.book = ? OR v.book_abbrev = ?) AND v.chapter = ? AND v.verse = ?
        AND v.translation = 'BSB'
        LIMIT 1
    """, (book, book, chapter, verse_num))
    row = cur.fetchone()
    if row and row[0]:
        return list(struct.unpack(f'{len(row[0])//4}f', row[0]))
    return None

def get_verse_text(book, chapter, verse_num):
    cur = db.execute(
        "SELECT text FROM verses WHERE book=? AND chapter=? AND verse=? AND translation='BSB' LIMIT 1",
        (book, chapter, verse_num)
    )
    row = cur.fetchone()
    if row: return row[0]
    cur = db.execute(
        "SELECT text FROM verses WHERE book=? AND chapter=? AND verse=? LIMIT 1",
        (book, chapter, verse_num)
    )
    row = cur.fetchone()
    return row[0] if row else ""

def cosine_sim(a, b):
    dot = sum(x*y for x,y in zip(a,b))
    na = math.sqrt(sum(x*x for x in a))
    nb = math.sqrt(sum(x*x for x in b))
    if na == 0 or nb == 0: return 0
    return dot / (na * nb)

def centroid(embeddings):
    if not embeddings: return None
    n = len(embeddings)
    dim = len(embeddings[0])
    return [sum(e[i] for e in embeddings) / n for i in range(dim)]

# ─── 1. Find every euangelion/euangelizo in the Gospels ──────────────────────

GOSPEL_BOOKS = ["Matthew", "Mark", "Luke", "John"]

print("=== EUANGELION/EUANGELIZO IN THE GOSPELS ===")
gospel_word_verses = []
for book in GOSPEL_BOOKS:
    cur = db.execute("""
        SELECT DISTINCT book, chapter, verse
        FROM step_greek_words
        WHERE book = ? AND (english LIKE 'G2098=%' OR english LIKE 'G2097=%')
        ORDER BY chapter, verse
    """, (book,))
    for row in cur:
        text = get_verse_text(row['book'], row['chapter'], row['verse'])
        gospel_word_verses.append({
            "book": row['book'], "chapter": row['chapter'], "verse": row['verse'],
            "text": text
        })
        print(f"  {row['book']} {row['chapter']}:{row['verse']} — {text[:100]}")

print(f"\nTotal euangelion/euangelizo in Gospels: {len(gospel_word_verses)}")

# ─── 2. Jesus's programmatic gospel passages ─────────────────────────────────

JESUS_GOSPEL_PASSAGES = [
    ("Mark 1:14-15", "Mark", 1, 14, 1, 15, "Opening announcement: kingdom + repent + believe the gospel"),
    ("Luke 4:16-21", "Luke", 4, 16, 4, 21, "Nazareth manifesto: Isaiah 61 self-citation"),
    ("Matt 4:23", "Matthew", 4, 23, 4, 23, "Summary: teaching + proclaiming gospel of the kingdom + healing"),
    ("Matt 9:35", "Matthew", 9, 35, 9, 35, "Summary: teaching + proclaiming gospel of the kingdom + healing"),
    ("Luke 7:22", "Luke", 7, 22, 7, 22, "To John Baptist: 'the blind see, the lame walk, the poor hear good news'"),
    ("Matt 11:4-6", "Matthew", 11, 4, 11, 6, "To John Baptist: 'Go back and report what you hear and see'"),
    ("Matt 24:14", "Matthew", 24, 14, 24, 14, "'This gospel of the kingdom will be preached in the whole world'"),
    ("Mark 13:10", "Mark", 13, 10, 13, 10, "'The gospel must first be preached to all nations'"),
    ("Mark 10:29-30", "Mark", 10, 29, 10, 30, "'For my sake and the gospel's' — gospel as a thing worth losing everything for"),
    ("Luke 4:43", "Luke", 4, 43, 4, 43, "'I must proclaim the good news of the kingdom of God' — purpose statement"),
    ("Mark 1:1", "Mark", 1, 1, 1, 1, "The beginning of the gospel of Jesus Christ"),
]

print("\n\n=== JESUS'S PROGRAMMATIC GOSPEL PASSAGES ===")
passage_data = []
for label, book, sch, sv, ech, ev, desc in JESUS_GOSPEL_PASSAGES:
    print(f"\n--- {label}: {desc} ---")
    embs = []
    texts = []
    for ch in range(sch, ech + 1):
        vs = sv if ch == sch else 1
        ve = ev if ch == ech else 200
        for v in range(vs, ve + 1):
            t = get_verse_text(book, ch, v)
            e = get_embedding(book, ch, v)
            if t:
                texts.append({"ref": f"{book} {ch}:{v}", "text": t})
                print(f"  {book} {ch}:{v} — {t[:100]}")
            if e:
                embs.append(e)

    passage_data.append({
        "label": label, "desc": desc, "texts": texts, "embeddings": embs
    })

# ─── 3. The Nazareth Manifesto: Isaiah 61 deep dive ──────────────────────────

print("\n\n=== THE NAZARETH MANIFESTO: ISAIAH 61 DEEP DIVE ===")
# Jesus reads Isaiah 61:1-2a and says "Today this Scripture is fulfilled in your hearing"
# What does Isaiah 61 actually say?

print("\nIsaiah 61:1-3 (the text Jesus read):")
for v in range(1, 4):
    text = get_verse_text("Isaiah", 61, v)
    print(f"  Isa 61:{v} — {text}")

print("\nLuke 4:18-19 (Jesus's reading):")
for v in range(18, 20):
    text = get_verse_text("Luke", 4, v)
    print(f"  Luke 4:{v} — {text}")

print("\nLuke 4:21 (the claim):")
text = get_verse_text("Luke", 4, 21)
print(f"  Luke 4:21 — {text}")

# Embedding comparison: Isaiah 61 vs Luke 4
isa61_embs = [get_embedding("Isaiah", 61, v) for v in range(1, 4)]
isa61_embs = [e for e in isa61_embs if e]
luke4_embs = [get_embedding("Luke", 4, v) for v in range(18, 22)]
luke4_embs = [e for e in luke4_embs if e]

if isa61_embs and luke4_embs:
    isa_cent = centroid(isa61_embs)
    luke_cent = centroid(luke4_embs)
    sim = cosine_sim(isa_cent, luke_cent)
    print(f"\nIsaiah 61:1-3 ↔ Luke 4:18-21 centroid similarity: {sim:.4f}")

# What does Isaiah 61 contain? It's a JUBILEE text
# Count the concepts in Isaiah 61
print("\nIsaiah 61 concept analysis:")
isa61_concepts = {
    "liberation": ["prisoners", "captives", "freedom", "release"],
    "healing": ["brokenhearted", "comfort", "mourn"],
    "justice": ["righteousness", "justice", "oaks of righteousness"],
    "jubilee": ["year of the LORD's favor", "day of vengeance"],
    "restoration": ["rebuild", "restore", "ancient ruins", "devastations"],
    "cosmic_reversal": ["ashes → crown", "mourning → oil of joy", "despair → praise"],
}
for v in range(1, 12):
    text = get_verse_text("Isaiah", 61, v)
    if text:
        print(f"  Isa 61:{v} — {text[:100]}")

# ─── 4. Luke 7:22 — Jesus's answer to "Are you the one?" ────────────────────

print("\n\n=== LUKE 7:22 — THE GOSPEL DEFINED BY ITS EFFECTS ===")
# John the Baptist asks "Are you the one who is to come?"
# Jesus doesn't say "I died for your sins." He lists what's happening.

for v in range(20, 24):
    text = get_verse_text("Luke", 7, v)
    print(f"  Luke 7:{v} — {text}")

# What OT passages does Luke 7:22 point to?
luke722_emb = get_embedding("Luke", 7, 22)

# ─── 5. OT embedding targets for each programmatic passage ───────────────────

print("\n\n=== LOADING OT EMBEDDINGS ===")
OT_BOOKS = [
    "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy",
    "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel",
    "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles",
    "Ezra", "Nehemiah", "Esther", "Job", "Psalms", "Proverbs",
    "Ecclesiastes", "Song of Solomon", "Isaiah", "Jeremiah",
    "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel",
    "Amos", "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk",
    "Zephaniah", "Haggai", "Zechariah", "Malachi"
]

placeholders = ",".join(["?"] * len(OT_BOOKS))
cur = db.execute(f"""
    SELECT v.book, v.chapter, v.verse, v.text, ve.embedding
    FROM verse_embeddings ve
    JOIN verses v ON ve.verse_id = v.id
    WHERE v.book IN ({placeholders}) AND v.translation = 'BSB'
""", OT_BOOKS)

ot_verses = []
for row in cur:
    if row['embedding']:
        emb = list(struct.unpack(f"{len(row['embedding'])//4}f", row['embedding']))
        ot_verses.append({
            "book": row['book'], "chapter": row['chapter'], "verse": row['verse'],
            "text": row['text'], "embedding": emb
        })
print(f"  Loaded {len(ot_verses)} OT verse embeddings")

# For each programmatic passage, find top OT matches
print("\n=== OT TARGETS FOR EACH PROGRAMMATIC PASSAGE ===")
passage_ot_targets = []

for pd in passage_data:
    if not pd["embeddings"]:
        continue
    pc = centroid(pd["embeddings"])
    scores = []
    for ot in ot_verses:
        sim = cosine_sim(pc, ot["embedding"])
        scores.append((ot["book"], ot["chapter"], ot["verse"], ot["text"], sim))
    scores.sort(key=lambda x: x[4], reverse=True)
    top10 = scores[:10]

    print(f"\n--- {pd['label']}: {pd['desc']} ---")
    for b, c, v, t, s in top10:
        print(f"  {s:.4f}  {b} {c}:{v} — {t[:70]}")

    # Book distribution of top 30
    top30 = scores[:30]
    book_dist = {}
    for b, c, v, t, s in top30:
        book_dist[b] = book_dist.get(b, 0) + 1

    passage_ot_targets.append({
        "label": pd["label"],
        "top_10": [{"ref": f"{b} {c}:{v}", "text": t[:80], "sim": round(s, 4)} for b, c, v, t, s in top10],
        "book_distribution_top30": book_dist,
    })

# ─── 6. Theological concept clustering for Jesus's gospel ────────────────────

print("\n\n=== THEOLOGICAL CLUSTERING: JESUS'S GOSPEL ===")

CONCEPT_VERSES = {
    "divine_reign": [("Psalms", 93, 1), ("Psalms", 97, 1), ("Isaiah", 52, 7), ("Matthew", 6, 10), ("Revelation", 11, 15)],
    "cosmic_scope": [("Genesis", 12, 3), ("Isaiah", 49, 6), ("Psalms", 96, 1), ("Romans", 11, 36), ("Colossians", 1, 16)],
    "loyal_love": [("Psalms", 136, 1), ("Hosea", 2, 19), ("Micah", 6, 8), ("Romans", 5, 8), ("Ephesians", 2, 8)],
    "temple_sacred_space": [("Exodus", 25, 8), ("1 Kings", 8, 27), ("Psalms", 84, 1), ("John", 2, 19), ("1 Corinthians", 3, 16)],
    "spirit_community": [("Joel", 2, 28), ("Ezekiel", 37, 14), ("Acts", 2, 4), ("1 Corinthians", 12, 13), ("Galatians", 5, 22)],
    "atonement_sacrifice": [("Leviticus", 17, 11), ("Isaiah", 53, 5), ("Psalms", 51, 7), ("Romans", 3, 25), ("Hebrews", 9, 22)],
    "union_participation": [("Deuteronomy", 30, 20), ("Psalms", 73, 28), ("John", 15, 5), ("Romans", 6, 5), ("Galatians", 2, 20)],
    "restoration_after_judgment": [("Jeremiah", 30, 17), ("Hosea", 6, 1), ("Joel", 2, 25), ("Acts", 3, 21), ("Romans", 11, 26)],
    "life_resurrection": [("Ezekiel", 37, 5), ("Job", 19, 25), ("Daniel", 12, 2), ("John", 11, 25), ("1 Corinthians", 15, 22)],
    "prophetic_justice": [("Amos", 5, 24), ("Micah", 6, 8), ("Isaiah", 1, 17), ("Matthew", 23, 23), ("Romans", 2, 6)],
    "death_punishment": [("Proverbs", 14, 12), ("Ezekiel", 18, 4), ("Psalms", 6, 5), ("Romans", 6, 23), ("Revelation", 20, 14)],
    "exile_lament": [("Psalms", 137, 1), ("Lamentations", 1, 1), ("Psalms", 42, 9), ("Romans", 8, 22), ("2 Corinthians", 5, 2)],
    "individual_salvation": [("Psalms", 51, 10), ("Isaiah", 45, 22), ("Ezekiel", 18, 32), ("Romans", 10, 9), ("Ephesians", 2, 8)],
    # Additional concepts relevant to Jesus's gospel
    "jubilee_liberation": [("Leviticus", 25, 10), ("Isaiah", 61, 1), ("Isaiah", 42, 7), ("Luke", 4, 18), ("Isaiah", 58, 6)],
    "healing_wholeness": [("Isaiah", 35, 5), ("Isaiah", 53, 5), ("Psalms", 103, 3), ("Jeremiah", 30, 17), ("Malachi", 4, 2)],
    "economic_reversal": [("1 Samuel", 2, 8), ("Psalms", 113, 7), ("Isaiah", 61, 7), ("Luke", 1, 52), ("Luke", 6, 20)],
}

concept_centroids = {}
for concept, verses in CONCEPT_VERSES.items():
    embs = []
    for book, ch, v in verses:
        e = get_embedding(book, ch, v)
        if e: embs.append(e)
    if embs:
        concept_centroids[concept] = centroid(embs)

# Build Jesus's gospel centroid from all programmatic passages
all_gospel_embs = []
for pd in passage_data:
    all_gospel_embs.extend(pd["embeddings"])

if all_gospel_embs:
    jesus_gospel_centroid = centroid(all_gospel_embs)

    print("Jesus's gospel centroid similarity to theological concepts:")
    jesus_concept_scores = {}
    for concept, cc in concept_centroids.items():
        sim = cosine_sim(jesus_gospel_centroid, cc)
        jesus_concept_scores[concept] = round(sim, 4)

    ranked = sorted(jesus_concept_scores.items(), key=lambda x: x[1], reverse=True)
    for i, (c, s) in enumerate(ranked):
        print(f"  #{i+1}: {c} ({s})")

# ─── 7. Compare to Paul's gospel centroid ─────────────────────────────────────

print("\n\n=== JESUS vs PAUL GOSPEL COMPARISON ===")

# Load Paul's 1 Cor 15:3-4 creed
paul_creed_embs = []
for v in range(3, 5):
    e = get_embedding("1 Corinthians", 15, v)
    if e: paul_creed_embs.append(e)

# Load Paul's full euangelion centroid (all gospel verses)
PAUL_BOOKS = [
    "Romans", "1 Corinthians", "2 Corinthians", "Galatians",
    "Ephesians", "Philippians", "Colossians",
    "1 Thessalonians", "2 Thessalonians",
    "1 Timothy", "2 Timothy", "Titus", "Philemon"
]
paul_gospel_embs = []
for book in PAUL_BOOKS:
    cur = db.execute("""
        SELECT DISTINCT book, chapter, verse FROM step_greek_words
        WHERE book = ? AND (english LIKE 'G2098=%' OR english LIKE 'G2097=%')
    """, (book,))
    for row in cur:
        e = get_embedding(row['book'], row['chapter'], row['verse'])
        if e: paul_gospel_embs.append(e)

if paul_creed_embs and jesus_gospel_centroid:
    paul_creed_centroid = centroid(paul_creed_embs)
    sim = cosine_sim(jesus_gospel_centroid, paul_creed_centroid)
    print(f"  Jesus gospel centroid ↔ Paul 1 Cor 15:3-4 centroid: {sim:.4f}")

if paul_gospel_embs and jesus_gospel_centroid:
    paul_full_centroid = centroid(paul_gospel_embs)
    sim = cosine_sim(jesus_gospel_centroid, paul_full_centroid)
    print(f"  Jesus gospel centroid ↔ Paul full euangelion centroid: {sim:.4f}")

# Cross-match: each Jesus passage vs Paul's creed
if paul_creed_embs:
    paul_cc = centroid(paul_creed_embs)
    print("\n  Each Jesus gospel passage vs Paul's creed:")
    for pd in passage_data:
        if pd["embeddings"]:
            pc = centroid(pd["embeddings"])
            sim = cosine_sim(pc, paul_cc)
            print(f"    {pd['label']}: {sim:.4f}")

# ─── 8. What verbs does Jesus use in gospel contexts? ─────────────────────────

print("\n\n=== JESUS'S GOSPEL VERBS ===")
# Check the Greek verbs in Luke 7:22 and Luke 4:18-19

print("\nLuke 4:18-19 morphology:")
cur = db.execute("""
    SELECT verse, word_position, greek, english, dstrongs
    FROM step_greek_words
    WHERE book = 'Luke' AND chapter = 4 AND verse IN (18, 19)
    ORDER BY verse, word_position
""")
for row in cur:
    morph = row['english'].split('=')[1] if '=' in row['english'] else ''
    if morph.startswith('V'):
        print(f"  4:{row['verse']}.{row['word_position']} {row['greek']}: {row['dstrongs']} | {morph}")

print("\nLuke 7:22 morphology:")
cur = db.execute("""
    SELECT verse, word_position, greek, english, dstrongs
    FROM step_greek_words
    WHERE book = 'Luke' AND chapter = 7 AND verse = 22
    ORDER BY word_position
""")
for row in cur:
    morph = row['english'].split('=')[1] if '=' in row['english'] else ''
    if morph.startswith('V'):
        print(f"  7:22.{row['word_position']} {row['greek']}: {row['dstrongs']} | {morph}")

print("\nMark 1:14-15 morphology:")
cur = db.execute("""
    SELECT verse, word_position, greek, english, dstrongs
    FROM step_greek_words
    WHERE book = 'Mark' AND chapter = 1 AND verse IN (14, 15)
    ORDER BY verse, word_position
""")
for row in cur:
    morph = row['english'].split('=')[1] if '=' in row['english'] else ''
    if morph.startswith('V'):
        print(f"  1:{row['verse']}.{row['word_position']} {row['greek']}: {row['dstrongs']} | {morph}")

# ─── 9. Kingdom co-occurrence: what words appear with basileia? ───────────────

print("\n\n=== BASILEIA CO-OCCURRENCE IN GOSPELS ===")
# Find all verses with basileia, then check what other theological terms appear

basileia_verses = set()
for book in GOSPEL_BOOKS:
    cur = db.execute("""
        SELECT DISTINCT chapter, verse FROM step_greek_words
        WHERE book = ? AND english LIKE 'G0932=%'
    """, (book,))
    for row in cur:
        basileia_verses.add((book, row['chapter'], row['verse']))

print(f"  Total verses with basileia in Gospels: {len(basileia_verses)}")

# Check co-occurring theological terms
co_terms = {
    "dikaiosyne (righteousness)": "G1343",
    "eirene (peace)": "G1515",
    "zoe (life)": "G2222",
    "pneuma (spirit)": "G4151",
    "sozo (save)": "G4982",
    "metanoeo (repent)": "G3340",
    "pistis (faith)": "G4102",
    "euangelion (gospel)": "G2098",
    "dynamis (power)": "G1411",
    "exousia (authority)": "G1849",
    "therapeia (healing)": "G2322",
    "krisis (judgment)": "G2920",
}

print("\n  Co-occurrence with basileia:")
for label, strong in co_terms.items():
    co_count = 0
    padded = strong[:1] + strong[1:].zfill(4)
    for book, ch, v in basileia_verses:
        cur = db.execute("""
            SELECT COUNT(*) FROM step_greek_words
            WHERE book = ? AND chapter = ? AND verse = ? AND english LIKE ?
        """, (book, ch, v, f'{padded}=%'))
        if cur.fetchone()[0] > 0:
            co_count += 1
    if co_count > 0:
        print(f"    {label}: {co_count} verses (of {len(basileia_verses)} basileia verses)")

# ─── 10. The content of Jesus's "gospel of the kingdom" ──────────────────────

print("\n\n=== WHAT IS 'THE GOSPEL OF THE KINGDOM'? ===")
# Matt 4:23 and 9:35 use the phrase "gospel of the kingdom"
# What does Jesus DO when he preaches it? What's the content?

# The pattern in Matthew: teaching + proclaiming + healing
# Let's measure what activities co-occur with gospel proclamation

# Jesus's gospel activity in Matthew summary passages
activity_passages = [
    ("Matthew", 4, 23, "Teaching, proclaiming the gospel of the kingdom, healing every disease"),
    ("Matthew", 9, 35, "Teaching, proclaiming the gospel of the kingdom, healing every disease"),
    ("Matthew", 10, 7, "Commissioned: 'The kingdom of heaven is near'"),
    ("Matthew", 10, 8, "'Heal the sick, raise the dead, cleanse lepers, drive out demons'"),
    ("Matthew", 11, 5, "'Blind see, lame walk, lepers cleansed, deaf hear, dead raised, poor hear good news'"),
    ("Luke", 9, 2, "Sent to proclaim the kingdom of God and to heal the sick"),
    ("Luke", 10, 9, "'Heal the sick who are there and tell them: The kingdom of God is near you'"),
]

print("  Activity passages where Jesus defines the gospel by what it DOES:")
for book, ch, v, desc in activity_passages:
    text = get_verse_text(book, ch, v)
    print(f"    {book} {ch}:{v} — {text[:80]}")
    print(f"      → {desc}")

# ─── Build output ────────────────────────────────────────────────────────────

output = {
    "probe": "jesus_gospel_definition",
    "description": "Analyzes what Jesus meant by 'the gospel' through euangelion usage, programmatic passages, Isaiah 61, and kingdom-content analysis",
    "euangelion_in_gospels": [
        {"ref": f"{gv['book']} {gv['chapter']}:{gv['verse']}", "text": gv['text'][:100]}
        for gv in gospel_word_verses
    ],
    "programmatic_passages": [
        {"label": pd["label"], "desc": pd["desc"],
         "texts": pd["texts"], "verse_count": len(pd["embeddings"])}
        for pd in passage_data
    ],
    "ot_targets": passage_ot_targets,
    "concept_clustering": [
        {"concept": c, "similarity": s}
        for c, s in sorted(jesus_concept_scores.items(), key=lambda x: x[1], reverse=True)
    ] if all_gospel_embs else [],
    "jesus_vs_paul": {
        "jesus_vs_paul_creed": round(cosine_sim(jesus_gospel_centroid, centroid(paul_creed_embs)), 4) if paul_creed_embs and all_gospel_embs else None,
        "jesus_vs_paul_full_gospel": round(cosine_sim(jesus_gospel_centroid, centroid(paul_gospel_embs)), 4) if paul_gospel_embs and all_gospel_embs else None,
        "passage_vs_creed": [
            {"label": pd["label"], "similarity": round(cosine_sim(centroid(pd["embeddings"]), centroid(paul_creed_embs)), 4)}
            for pd in passage_data if pd["embeddings"]
        ] if paul_creed_embs else [],
    },
    "isaiah_61_similarity": round(cosine_sim(centroid(isa61_embs), centroid(luke4_embs)), 4) if isa61_embs and luke4_embs else None,
}

out_path = os.path.join(OUT_DIR, "jesus_gospel_probe.json")
with open(out_path, "w") as f:
    json.dump(output, f, indent=2)

print(f"\n✓ Output written to {out_path}")
db.close()
