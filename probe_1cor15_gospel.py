#!/usr/bin/env python3
"""
Probe: What does Paul mean by "the gospel" in 1 Cor 15:1-4?

Paul defines euangelion in four clauses:
  1. Christ died for our sins according to the scriptures
  2. He was buried
  3. He was raised on the third day according to the scriptures
  4. He appeared to Cephas, then to the twelve

The "according to the scriptures" (kata tas graphas) points backward.
This probe asks: WHERE does the embedding model say these verses point?

Method:
1. Get embeddings for 1 Cor 15:1-8 (the full creedal formula)
2. Find top OT matches for each verse (semantic similarity)
3. Cross-reference against known cross_references table
4. Check what theological categories the OT targets belong to
5. Test: does "the gospel" = individual salvation event, or something bigger?
6. Compare Paul's OTHER euangelion usages — what context does he put gospel in?
7. Greek morphology of 1 Cor 15:3-4 — what tenses/voices tell us
"""

import sqlite3
import json
import struct
import math
import re
import os

DB_PATH = "Bibledata/bible-search/bible.db"
OUT_DIR = "output"

db = sqlite3.connect(DB_PATH)
db.row_factory = sqlite3.Row

# ─── Embedding utilities ─────────────────────────────────────────────────────

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
        blob = row[0]
        return list(struct.unpack(f'{len(blob)//4}f', blob))
    return None

def cosine_sim(a, b):
    dot = sum(x*y for x,y in zip(a,b))
    na = math.sqrt(sum(x*x for x in a))
    nb = math.sqrt(sum(x*x for x in b))
    if na == 0 or nb == 0: return 0
    return dot / (na * nb)

def get_verse_text(book, chapter, verse_num):
    cur = db.execute(
        "SELECT text FROM verses WHERE book=? AND chapter=? AND verse=? AND translation='BSB' LIMIT 1",
        (book, chapter, verse_num)
    )
    row = cur.fetchone()
    if row:
        return row[0]
    # Fallback: any translation
    cur = db.execute(
        "SELECT text FROM verses WHERE book=? AND chapter=? AND verse=? LIMIT 1",
        (book, chapter, verse_num)
    )
    row = cur.fetchone()
    return row[0] if row else ""

# ─── 1. The creedal formula: 1 Cor 15:1-8 ────────────────────────────────────

print("=== 1 CORINTHIANS 15:1-8 TEXT ===")
creed_verses = []
for v in range(1, 9):
    text = get_verse_text("1 Corinthians", 15, v)
    emb = get_embedding("1Cor", 15, v)
    creed_verses.append({"verse": v, "text": text, "embedding": emb})
    print(f"  15:{v} — {text[:120]}")

# ─── 2. Find top OT matches for each verse ───────────────────────────────────

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

print("\n=== LOADING OT EMBEDDINGS ===")
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

# ─── 3. For each creedal verse, find top 10 OT matches ───────────────────────

print("\n=== TOP OT MATCHES FOR EACH CREEDAL VERSE ===")
creed_ot_matches = {}

for cv in creed_verses:
    if not cv["embedding"]:
        continue
    vnum = cv["verse"]
    scores = []
    for ot in ot_verses:
        sim = cosine_sim(cv["embedding"], ot["embedding"])
        scores.append((ot["book"], ot["chapter"], ot["verse"], ot["text"], sim))
    scores.sort(key=lambda x: x[4], reverse=True)
    top10 = scores[:10]
    creed_ot_matches[vnum] = top10

    print(f"\n  1 Cor 15:{vnum} — {cv['text'][:80]}...")
    for book, ch, v, text, sim in top10:
        print(f"    {sim:.4f}  {book} {ch}:{v} — {text[:70]}")

# ─── 4. Focus on the "according to the scriptures" verses (15:3-4) ───────────

print("\n=== FOCUSED: 'ACCORDING TO THE SCRIPTURES' (v3-4) ===")
# These are the two verses with "kata tas graphas"
# v3: "Christ died for our sins according to the Scriptures"
# v4: "He was buried, He was raised on the third day according to the Scriptures"

# Combine v3 and v4 into a centroid
v3_emb = creed_verses[2]["embedding"]  # index 2 = verse 3
v4_emb = creed_verses[3]["embedding"]  # index 3 = verse 4

if v3_emb and v4_emb:
    centroid = [(a+b)/2 for a,b in zip(v3_emb, v4_emb)]
    scores = []
    for ot in ot_verses:
        sim = cosine_sim(centroid, ot["embedding"])
        scores.append((ot["book"], ot["chapter"], ot["verse"], ot["text"], sim))
    scores.sort(key=lambda x: x[4], reverse=True)
    print("  Combined v3+v4 centroid top 20 OT targets:")
    combined_top20 = scores[:20]
    for book, ch, v, text, sim in combined_top20:
        print(f"    {sim:.4f}  {book} {ch}:{v} — {text[:70]}")

# ─── 5. Book distribution of top matches ─────────────────────────────────────

print("\n=== BOOK DISTRIBUTION (top 50 OT matches for v3+v4 centroid) ===")
top50 = scores[:50]
book_counts = {}
for book, ch, v, text, sim in top50:
    book_counts[book] = book_counts.get(book, 0) + 1
for book, count in sorted(book_counts.items(), key=lambda x: x[1], reverse=True):
    print(f"  {book}: {count}")

# ─── 6. Cross-reference validation ───────────────────────────────────────────

print("\n=== KNOWN CROSS-REFERENCES FROM 1 COR 15 ===")
cur = db.execute("""
    SELECT * FROM cross_references
    WHERE from_book = '1 Corinthians' AND from_chapter = 15 AND from_verse <= 8
    ORDER BY from_verse, votes DESC
""")
xrefs = cur.fetchall()
for xr in xrefs:
    text = get_verse_text(xr['to_book'], xr['to_chapter'], xr['to_verse'])
    print(f"  15:{xr['from_verse']} → {xr['to_book']} {xr['to_chapter']}:{xr['to_verse']} (votes: {xr['votes']}) — {text[:70]}")

# ─── 7. Paul's OTHER euangelion usages ───────────────────────────────────────

PAUL_BOOKS = [
    "Romans", "1 Corinthians", "2 Corinthians", "Galatians",
    "Ephesians", "Philippians", "Colossians",
    "1 Thessalonians", "2 Thessalonians",
    "1 Timothy", "2 Timothy", "Titus", "Philemon"
]

print("\n=== PAUL'S EUANGELION CONTEXT ===")
# Find all verses in Paul where euangelion (G2098) or euangelizo (G2097) appears
paul_gospel_verses = []
for book in PAUL_BOOKS:
    cur = db.execute("""
        SELECT DISTINCT book, chapter, verse FROM step_greek_words
        WHERE book = ? AND (english LIKE 'G2098=%' OR english LIKE 'G2097=%')
        ORDER BY chapter, verse
    """, (book,))
    for row in cur:
        text = get_verse_text(row['book'], row['chapter'], row['verse'])
        paul_gospel_verses.append({
            "book": row['book'], "chapter": row['chapter'], "verse": row['verse'],
            "text": text
        })

print(f"  Found {len(paul_gospel_verses)} verses with euangelion/euangelizo in Paul")
for pgv in paul_gospel_verses[:30]:
    print(f"    {pgv['book']} {pgv['chapter']}:{pgv['verse']} — {pgv['text'][:80]}")

# ─── 8. Semantic clustering: what does Paul's "gospel" cluster with? ─────────

print("\n=== SEMANTIC CLUSTERING OF PAUL'S GOSPEL VERSES ===")

# Get book abbreviation mapping for verse_embeddings
BOOK_ABBREV = {
    "Romans": "Rom", "1 Corinthians": "1Cor", "2 Corinthians": "2Cor",
    "Galatians": "Gal", "Ephesians": "Eph", "Philippians": "Phil",
    "Colossians": "Col", "1 Thessalonians": "1Thess", "2 Thessalonians": "2Thess",
    "1 Timothy": "1Tim", "2 Timothy": "2Tim", "Titus": "Titus", "Philemon": "Phlm"
}

gospel_embeddings = []
for pgv in paul_gospel_verses:
    abbrev = BOOK_ABBREV.get(pgv['book'], pgv['book'])
    emb = get_embedding(abbrev, pgv['chapter'], pgv['verse'])
    if not emb:
        # Try full name
        emb = get_embedding(pgv['book'], pgv['chapter'], pgv['verse'])
    if emb:
        gospel_embeddings.append(emb)

if gospel_embeddings:
    # Compute gospel centroid
    dim = len(gospel_embeddings[0])
    gospel_centroid = [sum(e[i] for e in gospel_embeddings) / len(gospel_embeddings) for i in range(dim)]

    # Define theological test concepts with representative verses
    test_concepts = {
        "individual_salvation": [
            ("Romans", "Rom", 10, 9),      # confess with your mouth
            ("Ephesians", "Eph", 2, 8),     # by grace through faith
            ("Philippians", "Phil", 2, 12), # work out your salvation
        ],
        "cosmic_reign": [
            ("Ephesians", "Eph", 1, 10),    # unite all things in Christ
            ("Colossians", "Col", 1, 16),    # all things created through him
            ("Philippians", "Phil", 2, 10),  # every knee shall bow
        ],
        "resurrection_new_creation": [
            ("Romans", "Rom", 6, 4),         # walk in newness of life
            ("1 Corinthians", "1Cor", 15, 22), # in Christ all made alive
            ("2 Corinthians", "2Cor", 5, 17),  # new creation
        ],
        "reconciliation_cosmic": [
            ("Romans", "Rom", 5, 10),        # reconciled through his death
            ("2 Corinthians", "2Cor", 5, 19), # God reconciling the world
            ("Colossians", "Col", 1, 20),     # reconcile all things
        ],
        "death_atonement": [
            ("Romans", "Rom", 3, 25),         # propitiation by his blood
            ("Romans", "Rom", 5, 8),           # Christ died for us
            ("Galatians", "Gal", 3, 13),       # became a curse for us
        ],
        "union_participation": [
            ("Romans", "Rom", 6, 5),          # united with him in death
            ("Galatians", "Gal", 2, 20),       # crucified with Christ
            ("Colossians", "Col", 3, 3),       # your life is hidden with Christ
        ],
    }

    print("  Gospel centroid similarity to theological concepts:")
    concept_scores = {}
    for concept, verses in test_concepts.items():
        embs = []
        for full_name, abbrev, ch, v in verses:
            e = get_embedding(abbrev, ch, v)
            if not e:
                e = get_embedding(full_name, ch, v)
            if e:
                embs.append(e)
        if embs:
            concept_centroid = [sum(e[i] for e in embs) / len(embs) for i in range(dim)]
            sim = cosine_sim(gospel_centroid, concept_centroid)
            concept_scores[concept] = sim
            print(f"    {concept}: {sim:.4f}")

    # Rank them
    ranked = sorted(concept_scores.items(), key=lambda x: x[1], reverse=True)
    print("\n  Gospel concept ranking:")
    for i, (concept, score) in enumerate(ranked):
        print(f"    #{i+1}: {concept} ({score:.4f})")

# ─── 9. Greek morphology of 1 Cor 15:3-4 ─────────────────────────────────────

print("\n=== GREEK MORPHOLOGY OF 1 COR 15:3-4 ===")
# Check what book name step_greek_words uses for 1 Corinthians
cur = db.execute("SELECT DISTINCT book FROM step_greek_words WHERE book LIKE '%Cor%'")
cor_books = [row[0] for row in cur.fetchall()]
print(f"  1 Cor book names in step_greek_words: {cor_books}")

for book_name in cor_books:
    if '1' in book_name:
        cur = db.execute("""
            SELECT word_position, verse, greek, english, dstrongs, grammar
            FROM step_greek_words
            WHERE book = ? AND chapter = 15 AND verse IN (3, 4)
            ORDER BY verse, id
        """, (book_name,))
        words = cur.fetchall()
        if words:
            print(f"\n  Using book name: {book_name}")
            for w in words:
                print(f"    15:{w['verse']}.{w['word_position']} | greek: {w['greek']} | english: {w['english']} | dstrongs: {w['dstrongs']} | grammar: {w['grammar'] or ''}")
            break

# ─── 10. What are the "raised" verbs — voice and tense? ──────────────────────

print("\n=== RESURRECTION VERB ANALYSIS ===")
# Find egeiro (G1453) in 1 Cor 15
for book_name in cor_books:
    if '1' in book_name:
        cur = db.execute("""
            SELECT verse, word_position, greek, english, dstrongs
            FROM step_greek_words
            WHERE book = ? AND chapter = 15 AND english LIKE 'G1453=%'
            ORDER BY verse, id
        """, (book_name,))
        for row in cur.fetchall():
            morph = row['english'].split('=')[1] if '=' in row['english'] else ''
            print(f"  15:{row['verse']}.{row['word_position']} ({row['greek']}): {row['dstrongs']} | morph: {morph}")
            # Parse the morphology
            if 'P' in morph:
                print(f"    → PASSIVE voice (God raised him — divine action)")
            elif 'M' in morph:
                print(f"    → MIDDLE voice (he raised himself)")
            elif 'A' in morph:
                print(f"    → ACTIVE voice")
            if 'R' in morph and morph.startswith('V'):
                print(f"    → PERFECT tense (completed action with ongoing results)")
            if 'A' in morph and morph[2] == 'A':
                print(f"    → AORIST tense (completed, punctiliar action)")
        break

# ─── 11. "Died" verbs — what does apothnesko tell us? ────────────────────────

print("\n=== DEATH VERB ANALYSIS (1 Cor 15:3) ===")
for book_name in cor_books:
    if '1' in book_name:
        cur = db.execute("""
            SELECT verse, word_position, greek, english, dstrongs
            FROM step_greek_words
            WHERE book = ? AND chapter = 15 AND verse = 3
            ORDER BY id
        """, (book_name,))
        for row in cur.fetchall():
            morph = row['english'].split('=')[1] if '=' in row['english'] else ''
            ds = row['dstrongs']
            print(f"  15:3.{row['word_position']} ({row['greek']}): {ds} | morph: {morph}")
        break

# ─── 12. "For our sins" — hyper (G5228) analysis across Paul ─────────────────

print("\n=== 'FOR' (hyper G5228) USAGE IN PAUL ===")
hyper_count = 0
hyper_contexts = []
for book in PAUL_BOOKS:
    cur = db.execute("""
        SELECT DISTINCT sgw.book, sgw.chapter, sgw.verse
        FROM step_greek_words sgw
        WHERE sgw.book = ? AND sgw.english LIKE 'G5228=%'
    """, (book,))
    for row in cur.fetchall():
        hyper_count += 1
        text = get_verse_text(row['book'], row['chapter'], row['verse'])
        if hyper_count <= 20:
            hyper_contexts.append(f"  {row['book']} {row['chapter']}:{row['verse']} — {text[:80]}")

print(f"  Total hyper (G5228) occurrences in Paul: {hyper_count}")
for ctx in hyper_contexts:
    print(ctx)

# ─── Build output ────────────────────────────────────────────────────────────

output = {
    "probe": "1cor15_gospel_definition",
    "description": "Analyzes what Paul means by 'the gospel' in 1 Cor 15:1-4 using embeddings, cross-references, morphology, and semantic clustering",
    "creed_text": {str(cv["verse"]): cv["text"] for cv in creed_verses},
    "ot_targets_v3v4_combined": [
        {"book": b, "chapter": c, "verse": v, "text": t[:100], "similarity": round(s, 4)}
        for b, c, v, t, s in combined_top20
    ] if v3_emb and v4_emb else [],
    "book_distribution_top50": book_counts,
    "cross_references": [
        {"from_verse": xr['from_verse'], "to": f"{xr['to_book']} {xr['to_chapter']}:{xr['to_verse']}",
         "votes": xr['votes']}
        for xr in xrefs
    ],
    "paul_gospel_verse_count": len(paul_gospel_verses),
    "gospel_semantic_clustering": {k: round(v, 4) for k, v in ranked} if gospel_embeddings else {},
    "gospel_verses_sample": [
        {"ref": f"{pgv['book']} {pgv['chapter']}:{pgv['verse']}", "text": pgv['text'][:100]}
        for pgv in paul_gospel_verses[:20]
    ],
    "hyper_count_in_paul": hyper_count,
}

out_path = os.path.join(OUT_DIR, "1cor15_gospel_probe.json")
with open(out_path, "w") as f:
    json.dump(output, f, indent=2)

print(f"\n✓ Output written to {out_path}")

db.close()
