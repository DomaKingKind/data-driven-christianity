#!/usr/bin/env python3
"""
Probe: What do actual recorded NT sermons look like?

Analyzes every major speech/sermon in the NT to see what they emphasize,
then compares against our 13-category data-driven framework and the
modern evangelical sermon profile.

Sermons analyzed:
  JESUS:
    - Sermon on the Mount (Matt 5-7)
    - Nazareth Manifesto (Luke 4:16-30)
    - Olivet Discourse (Matt 24-25)
    - Bread of Life Discourse (John 6:25-59)
    - Upper Room Discourse (John 14-16)
    - Sheep and Goats (Matt 25:31-46)

  PAUL:
    - Mars Hill / Areopagus (Acts 17:22-31)
    - Antioch Synagogue (Acts 13:16-41)
    - Miletus Farewell (Acts 20:17-35)
    - Before Agrippa (Acts 26:2-29)

  PETER:
    - Pentecost (Acts 2:14-36)
    - Solomon's Portico (Acts 3:12-26)

  STEPHEN:
    - Before the Sanhedrin (Acts 7:2-53)

  JOHN (via Gospel):
    - Prologue as theological sermon (John 1:1-18)

Method:
  1. Get embeddings for each sermon's verse range
  2. Compute sermon centroid
  3. Measure similarity to each of our 13 theological concept centroids
  4. Extract Greek morphological features (verb tenses, voices)
  5. Compare sermon profiles to data-driven framework and modern sermon
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

# ─── Define sermons ──────────────────────────────────────────────────────────

SERMONS = [
    # (label, speaker, book, start_chapter, start_verse, end_chapter, end_verse)
    ("Sermon on the Mount", "Jesus", "Matthew", 5, 1, 7, 29),
    ("Nazareth Manifesto", "Jesus", "Luke", 4, 16, 4, 30),
    ("Olivet Discourse", "Jesus", "Matthew", 24, 1, 25, 46),
    ("Bread of Life", "Jesus", "John", 6, 25, 6, 59),
    ("Upper Room Discourse", "Jesus", "John", 14, 1, 16, 33),
    ("Sheep and Goats", "Jesus", "Matthew", 25, 31, 25, 46),
    ("Mars Hill Address", "Paul", "Acts", 17, 22, 17, 31),
    ("Antioch Synagogue", "Paul", "Acts", 13, 16, 13, 41),
    ("Miletus Farewell", "Paul", "Acts", 20, 17, 20, 35),
    ("Before Agrippa", "Paul", "Acts", 26, 2, 26, 29),
    ("Pentecost", "Peter", "Acts", 2, 14, 2, 36),
    ("Solomon's Portico", "Peter", "Acts", 3, 12, 3, 26),
    ("Before Sanhedrin", "Stephen", "Acts", 7, 2, 7, 53),
    ("Prologue", "John", "John", 1, 1, 1, 18),
]

# ─── Define 13 concept centroids ─────────────────────────────────────────────

CONCEPT_VERSES = {
    "divine_reign": [
        ("Psalms", 93, 1), ("Psalms", 97, 1), ("Isaiah", 52, 7),
        ("Matthew", 6, 10), ("Revelation", 11, 15),
    ],
    "cosmic_scope": [
        ("Genesis", 12, 3), ("Isaiah", 49, 6), ("Psalms", 96, 1),
        ("Romans", 11, 36), ("Colossians", 1, 16),
    ],
    "loyal_love": [
        ("Psalms", 136, 1), ("Hosea", 2, 19), ("Micah", 6, 8),
        ("Romans", 5, 8), ("Ephesians", 2, 8),
    ],
    "temple_sacred_space": [
        ("Exodus", 25, 8), ("1 Kings", 8, 27), ("Psalms", 84, 1),
        ("John", 2, 19), ("1 Corinthians", 3, 16),
    ],
    "spirit_community": [
        ("Joel", 2, 28), ("Ezekiel", 37, 14), ("Acts", 2, 4),
        ("1 Corinthians", 12, 13), ("Galatians", 5, 22),
    ],
    "atonement_sacrifice": [
        ("Leviticus", 17, 11), ("Isaiah", 53, 5), ("Psalms", 51, 7),
        ("Romans", 3, 25), ("Hebrews", 9, 22),
    ],
    "union_participation": [
        ("Deuteronomy", 30, 20), ("Psalms", 73, 28), ("John", 15, 5),
        ("Romans", 6, 5), ("Galatians", 2, 20),
    ],
    "restoration_after_judgment": [
        ("Jeremiah", 30, 17), ("Hosea", 6, 1), ("Joel", 2, 25),
        ("Acts", 3, 21), ("Romans", 11, 26),
    ],
    "life_resurrection": [
        ("Ezekiel", 37, 5), ("Job", 19, 25), ("Daniel", 12, 2),
        ("John", 11, 25), ("1 Corinthians", 15, 22),
    ],
    "prophetic_justice": [
        ("Amos", 5, 24), ("Micah", 6, 8), ("Isaiah", 1, 17),
        ("Matthew", 23, 23), ("Romans", 2, 6),
    ],
    "death_punishment": [
        ("Proverbs", 14, 12), ("Ezekiel", 18, 4), ("Psalms", 6, 5),
        ("Romans", 6, 23), ("Revelation", 20, 14),
    ],
    "exile_lament": [
        ("Psalms", 137, 1), ("Lamentations", 1, 1), ("Psalms", 42, 9),
        ("Romans", 8, 22), ("2 Corinthians", 5, 2),
    ],
    "individual_salvation": [
        ("Psalms", 51, 10), ("Isaiah", 45, 22), ("Ezekiel", 18, 32),
        ("Romans", 10, 9), ("Ephesians", 2, 8),
    ],
}

# Build concept centroids
print("=== BUILDING CONCEPT CENTROIDS ===")
concept_centroids = {}
for concept, verses in CONCEPT_VERSES.items():
    embs = []
    for book, ch, v in verses:
        e = get_embedding(book, ch, v)
        if e:
            embs.append(e)
    if embs:
        concept_centroids[concept] = centroid(embs)
        print(f"  {concept}: {len(embs)} embeddings")

# ─── Analyze each sermon ─────────────────────────────────────────────────────

print("\n=== ANALYZING SERMONS ===")
sermon_results = []

for label, speaker, book, sch, sv, ech, ev in SERMONS:
    print(f"\n--- {label} ({speaker}, {book} {sch}:{sv}-{ech}:{ev}) ---")

    # Collect verse embeddings
    embs = []
    texts = []
    for ch in range(sch, ech + 1):
        v_start = sv if ch == sch else 1
        v_end = ev if ch == ech else 200  # generous upper bound
        for v in range(v_start, v_end + 1):
            e = get_embedding(book, ch, v)
            t = get_verse_text(book, ch, v)
            if e:
                embs.append(e)
                texts.append(f"{book} {ch}:{v}")

    if not embs:
        print(f"  No embeddings found!")
        continue

    sermon_centroid = centroid(embs)
    print(f"  {len(embs)} verse embeddings loaded")

    # Score against each concept
    concept_scores = {}
    for concept, cc in concept_centroids.items():
        sim = cosine_sim(sermon_centroid, cc)
        concept_scores[concept] = round(sim, 4)

    # Rank
    ranked = sorted(concept_scores.items(), key=lambda x: x[1], reverse=True)
    print(f"  Top 5 concepts:")
    for i, (c, s) in enumerate(ranked[:5]):
        print(f"    #{i+1}: {c} ({s})")

    # Greek morphology analysis for this sermon
    verb_analysis = {"active": 0, "passive": 0, "middle": 0, "aorist": 0, "perfect": 0, "present": 0, "imperative": 0, "total_verbs": 0}

    for ch in range(sch, ech + 1):
        v_start = sv if ch == sch else 1
        v_end = ev if ch == ech else 200
        cur = db.execute("""
            SELECT english FROM step_greek_words
            WHERE book = ? AND chapter = ? AND verse >= ? AND verse <= ?
            AND english LIKE 'G%=V-%'
        """, (book, ch, v_start, v_end))
        for row in cur:
            morph = row['english'].split('=')[1] if '=' in row['english'] else ''
            if morph.startswith('V'):
                verb_analysis["total_verbs"] += 1
                # Voice
                if 'A' == morph[3] if len(morph) > 3 else False:
                    verb_analysis["active"] += 1
                if 'P' == morph[3] if len(morph) > 3 else False:
                    verb_analysis["passive"] += 1
                if 'M' == morph[3] if len(morph) > 3 else False:
                    verb_analysis["middle"] += 1
                # Tense
                if 'A' == morph[2] if len(morph) > 2 else False:
                    verb_analysis["aorist"] += 1
                if 'R' == morph[2] if len(morph) > 2 else False:
                    verb_analysis["perfect"] += 1
                if 'P' == morph[2] if len(morph) > 2 else False:
                    verb_analysis["present"] += 1
                # Mood
                if len(morph) > 4 and morph[4] in ('M', 'D'):  # imperative
                    verb_analysis["imperative"] += 1

    print(f"  Verbs: {verb_analysis['total_verbs']} total, {verb_analysis['active']}A/{verb_analysis['passive']}P/{verb_analysis['middle']}M, Imp:{verb_analysis['imperative']}")

    # Compute similarity to modern sermon estimate
    # (Using concept scores as a profile vector)
    MODERN_PROFILE = {
        "individual_salvation": 0.35, "death_punishment": 0.12,
        "atonement_sacrifice": 0.10, "loyal_love": 0.08,
        "life_resurrection": 0.08, "prophetic_justice": 0.05,
        "spirit_community": 0.05, "divine_reign": 0.05,
        "restoration_after_judgment": 0.04, "temple_sacred_space": 0.03,
        "union_participation": 0.02, "cosmic_scope": 0.02,
        "exile_lament": 0.01,
    }

    sermon_results.append({
        "label": label,
        "speaker": speaker,
        "reference": f"{book} {sch}:{sv}-{ech}:{ev}",
        "verse_count": len(embs),
        "concept_ranking": [{"concept": c, "similarity": s} for c, s in ranked],
        "top_3": [c for c, s in ranked[:3]],
        "verb_analysis": verb_analysis,
    })

# ─── MARS HILL DEEP DIVE ─────────────────────────────────────────────────────

print("\n\n=== MARS HILL DEEP DIVE ===")

# Get each verse of Mars Hill with text
print("\nVerse-by-verse text:")
mars_hill_texts = []
for v in range(22, 32):
    text = get_verse_text("Acts", 17, v)
    mars_hill_texts.append({"verse": v, "text": text})
    print(f"  17:{v} — {text[:100]}")

# Greek word-by-word for Mars Hill
print("\nGreek morphology word-by-word:")
cur = db.execute("""
    SELECT verse, word_position, greek, english, dstrongs
    FROM step_greek_words
    WHERE book = 'Acts' AND chapter = 17 AND verse >= 22 AND verse <= 31
    ORDER BY verse, word_position
""")
mars_hill_words = []
key_terms = {}
for row in cur:
    morph = row['english'].split('=')[1] if '=' in row['english'] else ''
    ds = row['dstrongs'] or ''
    mars_hill_words.append({
        "verse": row['verse'], "pos": row['word_position'],
        "greek": row['greek'], "morph": morph, "dstrongs": ds
    })
    # Track theologically significant terms
    gloss = ds.split('=')[1] if '=' in ds else ds
    strong = row['english'].split('=')[0] if '=' in row['english'] else ''
    if strong in ['G2316', 'G2889', 'G0444', 'G1484', 'G2962', 'G3340', 'G2919', 'G0386', 'G4102']:
        label = gloss or strong
        key_terms[label] = key_terms.get(label, 0) + 1

print("\nKey theological terms in Mars Hill:")
for term, count in sorted(key_terms.items(), key=lambda x: x[1], reverse=True):
    print(f"  {term}: {count}")

# Mars Hill OT echo analysis
print("\nMars Hill OT embedding targets:")
mars_embs = []
for v in range(22, 32):
    e = get_embedding("Acts", 17, v)
    if e:
        mars_embs.append({"verse": v, "embedding": e})

# Load OT embeddings (reuse from earlier probes)
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

# For each Mars Hill verse, find top 3 OT matches
mars_hill_ot = []
for mv in mars_embs:
    scores = []
    for ot in ot_verses:
        sim = cosine_sim(mv["embedding"], ot["embedding"])
        scores.append((ot["book"], ot["chapter"], ot["verse"], ot["text"], sim))
    scores.sort(key=lambda x: x[4], reverse=True)
    top3 = scores[:3]
    mars_hill_ot.append({"verse": mv["verse"], "ot_matches": top3})
    print(f"\n  Acts 17:{mv['verse']}:")
    for book, ch, v, text, sim in top3:
        print(f"    {sim:.4f}  {book} {ch}:{v} — {text[:60]}")

# ─── Cross-sermon comparison ─────────────────────────────────────────────────

print("\n\n=== CROSS-SERMON COMPARISON ===")

# What's the #1 concept for each sermon?
print("\nTop concept by sermon:")
for sr in sermon_results:
    top = sr["concept_ranking"][0]
    print(f"  {sr['label']} ({sr['speaker']}): #{1} {top['concept']} ({top['similarity']})")

# Which concepts dominate across all sermons?
concept_avg = {}
for c in concept_centroids:
    scores = [next(cr["similarity"] for cr in sr["concept_ranking"] if cr["concept"] == c) for sr in sermon_results]
    concept_avg[c] = round(sum(scores) / len(scores), 4)

print("\nAverage concept score across ALL sermons:")
for c, avg in sorted(concept_avg.items(), key=lambda x: x[1], reverse=True):
    print(f"  {c}: {avg}")

# ─── Build output ────────────────────────────────────────────────────────────

output = {
    "probe": "actual_sermons_analysis",
    "description": "Analyzes every major recorded NT sermon against 13 theological categories",
    "sermons": sermon_results,
    "mars_hill_deep_dive": {
        "text": mars_hill_texts,
        "key_terms": key_terms,
        "ot_echoes": [
            {
                "verse": mho["verse"],
                "top_ot": [
                    {"ref": f"{b} {c}:{v}", "text": t[:80], "similarity": round(s, 4)}
                    for b, c, v, t, s in mho["ot_matches"]
                ]
            }
            for mho in mars_hill_ot
        ],
    },
    "cross_sermon_concept_averages": concept_avg,
}

out_path = os.path.join(OUT_DIR, "actual_sermons_probe.json")
with open(out_path, "w") as f:
    json.dump(output, f, indent=2)

print(f"\n✓ Output written to {out_path}")
db.close()
