#!/usr/bin/env python3
"""
Probe: Did Jesus and Paul preach the Data-Driven Christian way?

Method:
1. For each of the 13 theological concepts (from data_driven_theology.json),
   count how many verses in Jesus's words vs Paul's letters contain those
   Strong's numbers.
2. For Jesus: use Red-Letter books (Matthew, Mark, Luke, John) — specifically
   verses attributed to Jesus via speech markers.
   Practical approach: use the Gospels as Jesus-heavy corpus.
3. For Paul: use the 13 undisputed+disputed Pauline epistles.
4. Compare their emphasis distribution to the data-driven rankings
   AND to the modern evangelical sermon profile.
5. Also test: what topics did Jesus emphasize MOST vs Paul MOST?
"""

import sqlite3
import json
import math
import os

DB_PATH = "Bibledata/bible-search/bible.db"
OUT_DIR = "output"

db = sqlite3.connect(DB_PATH)
db.row_factory = sqlite3.Row

# ─── Define corpora ───────────────────────────────────────────────────────────

# Jesus corpus: the four Gospels (Jesus is the dominant speaker)
JESUS_BOOKS = ["Matthew", "Mark", "Luke", "John"]

# Paul corpus: all Pauline epistles (undisputed + disputed + pastoral)
PAUL_BOOKS = [
    "Romans", "1 Corinthians", "2 Corinthians", "Galatians",
    "Ephesians", "Philippians", "Colossians",
    "1 Thessalonians", "2 Thessalonians",
    "1 Timothy", "2 Timothy", "Titus", "Philemon"
]

# Get total verse counts for normalization
def get_verse_count(books):
    placeholders = ",".join(["?"] * len(books))
    cur = db.execute(f"SELECT COUNT(*) FROM verses WHERE book IN ({placeholders})", books)
    return cur.fetchone()[0]

jesus_total = get_verse_count(JESUS_BOOKS)
paul_total = get_verse_count(PAUL_BOOKS)
print(f"Jesus corpus (Gospels): {jesus_total} verses")
print(f"Paul corpus (Epistles): {paul_total} verses")

# ─── Define the 13 theological concepts with their Strong's numbers ──────────

# These match data_driven_theology.json concept definitions
CONCEPTS = {
    "divine_reign": {
        "label": "God's Reign / Cosmic Kingship",
        "hebrew": ["H4428", "H4467", "H3068", "H4899"],  # melek, mamlakah, YHWH, mashiach
        "greek": ["G0932", "G0935", "G2962", "G5547", "G2362"],  # basileia, basileus, kyrios, christos, thronos
    },
    "cosmic_scope": {
        "label": "Cosmic / Universal Scope",
        "hebrew": ["H1471", "H3605", "H0776", "H8064"],  # goy, kol, erets, shamayim
        "greek": ["G2889", "G3956", "G1484", "G2937"],  # kosmos, pas, ethnos, ktisis
    },
    "loyal_love": {
        "label": "Loyal Love / Covenant Faithfulness",
        "hebrew": ["H2617", "H0571", "H1285"],  # chesed, emunah, berith
        "greek": ["G5485", "G4102", "G1242"],  # charis, pistis, diatheke
    },
    "temple_sacred_space": {
        "label": "Temple / Sacred Space",
        "hebrew": ["H1004", "H4720", "H6944", "H1964"],  # bayit, miqdash, qodesh, heykal
        "greek": ["G3485", "G2411", "G0040"],  # naos, hieron, hagios
    },
    "spirit_community": {
        "label": "Spirit-Driven Community",
        "hebrew": ["H7307", "H5712", "H6951"],  # ruach, edah, qahal
        "greek": ["G4151", "G1577", "G2842"],  # pneuma, ekklesia, koinonia
    },
    "atonement_sacrifice": {
        "label": "Atonement / Sacrifice Mechanics",
        "hebrew": ["H3722", "H2077", "H5930", "H3725"],  # kaphar, zebach, olah, kopher
        "greek": ["G2435", "G4376", "G3083", "G0129"],  # hilasmos, prosphora, lutron, haima
    },
    "union_participation": {
        "label": "Union / Participation in God",
        "hebrew": ["H1692", "H3045"],  # dabaq, yada
        "greek": ["G1722", "G4862", "G3348"],  # en, syn, metecho
    },
    "restoration_after_judgment": {
        "label": "Restoration After Judgment",
        "hebrew": ["H7725", "H5162", "H1350"],  # shub, nacham, gaal
        "greek": ["G0600", "G2644", "G3340"],  # apokathistemi, katallasso, metanoeo
    },
    "life_resurrection": {
        "label": "Life / Resurrection / New Creation",
        "hebrew": ["H2421", "H2416"],  # chayah, chay
        "greek": ["G2222", "G0386", "G2537"],  # zoe, anastasis, kainos
    },
    "prophetic_justice": {
        "label": "Prophetic Justice / Righteousness",
        "hebrew": ["H6664", "H4941", "H3477"],  # tsedeq, mishpat, yashar
        "greek": ["G1343", "G2920"],  # dikaiosyne, krisis
    },
    "death_punishment": {
        "label": "Death / Eternal Punishment / Hell",
        "hebrew": ["H4194", "H7585"],  # mawet, sheol
        "greek": ["G2288", "G1067", "G0086"],  # thanatos, geenna, hades
    },
    "exile_lament": {
        "label": "Exile / Lament / Absence of God",
        "hebrew": ["H1540", "H5080"],  # galah, nadach
        "greek": ["G3997", "G2805"],  # penthos, klauthmos
    },
    "individual_salvation": {
        "label": "Individual Decision / Personal Salvation",
        "hebrew": ["H0977", "H3467"],  # bachar, yasha
        "greek": ["G4982", "G4991", "G1586"],  # sozo, soteria, eklegomai
    },
}

# ─── Count concept hits per corpus ────────────────────────────────────────────

def get_greek_count_in_books(strong_num, books):
    """Count Greek word occurrences in specific books."""
    num = strong_num[1:]  # strip G
    padded = f"G{num.zfill(4)}"
    placeholders = ",".join(["?"] * len(books))

    # Primary: search english column (G####=morph)
    cur = db.execute(
        f"SELECT COUNT(*) FROM step_greek_words WHERE book IN ({placeholders}) AND english LIKE ?",
        books + [f'{padded}=%']
    )
    c = cur.fetchone()[0]
    if c > 0:
        return c

    # Fallback: search dstrongs
    cur = db.execute(
        f"SELECT COUNT(*) FROM step_greek_words WHERE book IN ({placeholders}) AND dstrongs LIKE ?",
        books + [f'%{strong_num}%']
    )
    return cur.fetchone()[0]


def get_hebrew_count_in_books(strong_num, books):
    """Count Hebrew word occurrences in specific books (returns 0 for NT-only books)."""
    placeholders = ",".join(["?"] * len(books))
    cur = db.execute(
        f"SELECT COUNT(*) FROM step_hebrew_words WHERE book IN ({placeholders}) AND dstrongs LIKE ?",
        books + [f'%{strong_num}%']
    )
    return cur.fetchone()[0]


def count_concept_in_corpus(concept_def, books, corpus_type="mixed"):
    """Count total Strong's number hits for a concept in a set of books."""
    total = 0
    details = {}

    # Greek terms (present in all NT books)
    for g in concept_def.get("greek", []):
        c = get_greek_count_in_books(g, books)
        details[g] = c
        total += c

    # Hebrew terms (only relevant if OT books are in corpus — which they aren't here,
    # but we include for completeness)
    for h in concept_def.get("hebrew", []):
        c = get_hebrew_count_in_books(h, books)
        details[h] = c
        total += c

    return total, details


# ─── Run the counts ──────────────────────────────────────────────────────────

print("\n=== Counting concept hits in Jesus corpus (Gospels) ===")
jesus_counts = {}
for key, cdef in CONCEPTS.items():
    total, details = count_concept_in_corpus(cdef, JESUS_BOOKS)
    jesus_counts[key] = {"total": total, "details": details}
    print(f"  {cdef['label']}: {total}")

print(f"\n=== Counting concept hits in Paul corpus (Epistles) ===")
paul_counts = {}
for key, cdef in CONCEPTS.items():
    total, details = count_concept_in_corpus(cdef, PAUL_BOOKS)
    paul_counts[key] = {"total": total, "details": details}
    print(f"  {cdef['label']}: {total}")

# ─── Normalize and rank ──────────────────────────────────────────────────────

def normalize_and_rank(counts, total_verses):
    """Convert raw counts to per-1000-verse rates and rank."""
    rates = {}
    for key, data in counts.items():
        rates[key] = {
            "raw": data["total"],
            "per_1000": round(data["total"] / total_verses * 1000, 2),
            "details": data["details"],
        }

    # Sort by rate descending
    ranked = sorted(rates.items(), key=lambda x: x[1]["per_1000"], reverse=True)
    for i, (key, val) in enumerate(ranked):
        val["rank"] = i + 1

    return {k: v for k, v in ranked}

jesus_ranked = normalize_and_rank(jesus_counts, jesus_total)
paul_ranked = normalize_and_rank(paul_counts, paul_total)

print("\n=== JESUS EMPHASIS RANKING (per 1000 verses) ===")
for key, val in jesus_ranked.items():
    print(f"  #{val['rank']}: {CONCEPTS[key]['label']} — {val['per_1000']}/1000v (raw: {val['raw']})")

print("\n=== PAUL EMPHASIS RANKING (per 1000 verses) ===")
for key, val in paul_ranked.items():
    print(f"  #{val['rank']}: {CONCEPTS[key]['label']} — {val['per_1000']}/1000v (raw: {val['raw']})")

# ─── Compare to data-driven rankings ─────────────────────────────────────────

# Load the original rankings
with open(os.path.join(OUT_DIR, "data_driven_theology.json")) as f:
    ddt = json.load(f)

data_driven_order = [r["concept"] for r in ddt["rankings"]]
jesus_order = list(jesus_ranked.keys())
paul_order = list(paul_ranked.keys())

# Spearman rank correlation (simplified)
def rank_correlation(order_a, order_b):
    """Compute Spearman rank correlation between two orderings."""
    n = len(order_a)
    rank_a = {item: i+1 for i, item in enumerate(order_a)}
    rank_b = {item: i+1 for i, item in enumerate(order_b)}

    d_sq_sum = sum((rank_a[k] - rank_b[k])**2 for k in rank_a if k in rank_b)
    rho = 1 - (6 * d_sq_sum) / (n * (n**2 - 1))
    return round(rho, 4)

jesus_vs_data = rank_correlation(jesus_order, data_driven_order)
paul_vs_data = rank_correlation(paul_order, data_driven_order)
jesus_vs_paul = rank_correlation(jesus_order, paul_order)

print(f"\n=== RANK CORRELATIONS ===")
print(f"  Jesus vs Data-Driven whole-Bible: {jesus_vs_data}")
print(f"  Paul vs Data-Driven whole-Bible:  {paul_vs_data}")
print(f"  Jesus vs Paul:                    {jesus_vs_paul}")

# ─── Modern evangelical sermon profile comparison ────────────────────────────
# From our sermon probe: estimated % of typical sermon on each topic

MODERN_SERMON = {
    "individual_salvation": 35.0,
    "death_punishment": 12.0,
    "atonement_sacrifice": 10.0,
    "loyal_love": 8.0,
    "life_resurrection": 8.0,
    "prophetic_justice": 5.0,
    "spirit_community": 5.0,
    "divine_reign": 5.0,
    "restoration_after_judgment": 4.0,
    "temple_sacred_space": 3.0,
    "union_participation": 2.0,
    "cosmic_scope": 2.0,
    "exile_lament": 1.0,
}

# Compute Jesus/Paul emphasis as percentages
def to_percentages(ranked_dict):
    total = sum(v["raw"] for v in ranked_dict.values())
    if total == 0:
        return {k: 0 for k in ranked_dict}
    return {k: round(v["raw"] / total * 100, 1) for k, v in ranked_dict.items()}

jesus_pct = to_percentages(jesus_ranked)
paul_pct = to_percentages(paul_ranked)

print(f"\n=== COMPARISON TABLE: Jesus % vs Paul % vs Modern Sermon % ===")
print(f"{'Concept':<45} {'Jesus%':>7} {'Paul%':>7} {'Sermon%':>8} {'J-gap':>6} {'P-gap':>6}")
print("-" * 85)
for key in data_driven_order:
    if key not in CONCEPTS:
        continue
    label = CONCEPTS[key]["label"][:44]
    j = jesus_pct.get(key, 0)
    p = paul_pct.get(key, 0)
    s = MODERN_SERMON.get(key, 0)
    jgap = round(j - s, 1)
    pgap = round(p - s, 1)
    print(f"  {label:<43} {j:>7.1f} {p:>7.1f} {s:>8.1f} {jgap:>+6.1f} {pgap:>+6.1f}")

# ─── Biggest surprises: where Jesus/Paul differ most ─────────────────────────

print("\n=== WHERE JESUS AND PAUL DIVERGE MOST ===")
diffs = []
for key in CONCEPTS:
    j = jesus_pct.get(key, 0)
    p = paul_pct.get(key, 0)
    diffs.append((key, j, p, abs(j - p)))
diffs.sort(key=lambda x: x[3], reverse=True)
for key, j, p, diff in diffs[:5]:
    label = CONCEPTS[key]["label"]
    leader = "Jesus" if j > p else "Paul"
    print(f"  {label}: Jesus={j}%, Paul={p}% (gap={diff:.1f}%, {leader} leads)")

# ─── Specific red-letter analysis: Kingdom language ──────────────────────────
# Count basileia (kingdom) specifically — Jesus's signature word

print("\n=== KINGDOM (basileia) DEEP DIVE ===")
for corpus_name, books in [("Jesus/Gospels", JESUS_BOOKS), ("Paul/Epistles", PAUL_BOOKS)]:
    c = get_greek_count_in_books("G0932", books)
    total_v = get_verse_count(books)
    rate = round(c / total_v * 1000, 2)
    print(f"  {corpus_name}: {c} occurrences ({rate}/1000 verses)")

# Also check sozo/soteria (salvation words) — modern sermon's favorite
print("\n=== SALVATION (sozo+soteria) DEEP DIVE ===")
for corpus_name, books in [("Jesus/Gospels", JESUS_BOOKS), ("Paul/Epistles", PAUL_BOOKS)]:
    sozo = get_greek_count_in_books("G4982", books)
    soteria = get_greek_count_in_books("G4991", books)
    total_v = get_verse_count(books)
    rate = round((sozo + soteria) / total_v * 1000, 2)
    print(f"  {corpus_name}: sozo={sozo}, soteria={soteria}, total={sozo+soteria} ({rate}/1000 verses)")

# ─── Check metanoeo (repent) — Jesus's actual opening word ──────────────────
print("\n=== REPENTANCE (metanoeo+metanoia) ===")
for corpus_name, books in [("Jesus/Gospels", JESUS_BOOKS), ("Paul/Epistles", PAUL_BOOKS)]:
    metanoeo = get_greek_count_in_books("G3340", books)
    metanoia = get_greek_count_in_books("G3341", books)
    total = metanoeo + metanoia
    tv = get_verse_count(books)
    print(f"  {corpus_name}: metanoeo={metanoeo}, metanoia={metanoia}, total={total} ({round(total/tv*1000,2)}/1000v)")

# ─── Check euangelion (gospel/good news) usage ──────────────────────────────
print("\n=== GOSPEL/GOOD NEWS (euangelion + euangelizo) ===")
for corpus_name, books in [("Jesus/Gospels", JESUS_BOOKS), ("Paul/Epistles", PAUL_BOOKS)]:
    euangelion = get_greek_count_in_books("G2098", books)
    euangelizo = get_greek_count_in_books("G2097", books)
    total = euangelion + euangelizo
    tv = get_verse_count(books)
    print(f"  {corpus_name}: euangelion={euangelion}, euangelizo={euangelizo}, total={total} ({round(total/tv*1000,2)}/1000v)")

# ─── Build the semantic similarity test ──────────────────────────────────────
# Use embeddings to compare Jesus's most-discussed topics to Paul's most-discussed

print("\n=== EMBEDDING CENTROID COMPARISON ===")
# Get verse embeddings for signature passages
import struct

def get_embedding(book, chapter, verse_num):
    """Get embedding for a specific verse."""
    cur = db.execute("""
        SELECT ve.embedding FROM verse_embeddings ve
        JOIN verses v ON ve.verse_id = v.id
        WHERE v.book = ? AND v.chapter = ? AND v.verse = ?
        LIMIT 1
    """, (book, chapter, verse_num))
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

# Jesus's signature passages (kingdom proclamation, parables, sermon)
jesus_sig = [
    ("Matthew", 5, 3),   # Blessed are the poor in spirit (kingdom)
    ("Matthew", 6, 10),  # Thy kingdom come
    ("Matthew", 13, 31), # Kingdom like mustard seed
    ("Mark", 1, 15),     # Kingdom of God is at hand
    ("Luke", 4, 18),     # Spirit of the Lord upon me (Nazareth manifesto)
    ("Luke", 15, 4),     # Parable of lost sheep
    ("John", 3, 16),     # God so loved the world
    ("John", 10, 10),    # I came that they may have life
    ("Matthew", 25, 35), # I was hungry and you fed me
    ("Luke", 6, 20),     # Blessed are you who are poor
]

# Paul's signature passages (cosmic scope, union, reconciliation)
paul_sig = [
    ("Romans", 8, 38),      # Nothing can separate us
    ("Romans", 11, 36),     # From him and through him
    ("1 Corinthians", 15, 22), # In Christ all made alive
    ("2 Corinthians", 5, 19),  # God reconciling the world
    ("Galatians", 3, 28),   # Neither Jew nor Greek
    ("Ephesians", 1, 10),   # Unite all things in Christ
    ("Philippians", 2, 10), # Every knee shall bow
    ("Colossians", 1, 20),  # Reconcile all things
    ("Romans", 5, 18),      # One act of righteousness → justification for all
    ("1 Corinthians", 12, 13), # One Spirit, one body
]

jesus_embs = []
paul_embs = []

for book, ch, v in jesus_sig:
    emb = get_embedding(book, ch, v)
    if emb:
        jesus_embs.append(emb)

for book, ch, v in paul_sig:
    emb = get_embedding(book, ch, v)
    if emb:
        paul_embs.append(emb)

# Compute centroids
def centroid(embeddings):
    n = len(embeddings)
    dim = len(embeddings[0])
    c = [sum(e[i] for e in embeddings) / n for i in range(dim)]
    return c

if jesus_embs and paul_embs:
    jesus_centroid = centroid(jesus_embs)
    paul_centroid = centroid(paul_embs)
    sim = cosine_sim(jesus_centroid, paul_centroid)
    print(f"  Jesus signature ↔ Paul signature centroid similarity: {sim:.4f}")

    # Cross-match: how well does each Jesus verse match Paul's centroid?
    print("\n  Jesus verses vs Paul centroid:")
    for i, (book, ch, v) in enumerate(jesus_sig):
        if i < len(jesus_embs):
            s = cosine_sim(jesus_embs[i], paul_centroid)
            print(f"    {book} {ch}:{v} → Paul centroid: {s:.4f}")

    print("\n  Paul verses vs Jesus centroid:")
    for i, (book, ch, v) in enumerate(paul_sig):
        if i < len(paul_embs):
            s = cosine_sim(paul_embs[i], jesus_centroid)
            print(f"    {book} {ch}:{v} → Jesus centroid: {s:.4f}")

# ─── Build output JSON ───────────────────────────────────────────────────────

output = {
    "probe": "jesus_paul_preaching",
    "description": "Tests whether Jesus and Paul preached 'data-driven Christianity' by measuring their emphasis distribution across 13 theological concepts",
    "corpus_sizes": {
        "jesus_gospels": jesus_total,
        "paul_epistles": paul_total
    },
    "jesus_ranking": [
        {
            "concept": key,
            "label": CONCEPTS[key]["label"],
            "rank": val["rank"],
            "raw_count": val["raw"],
            "per_1000_verses": val["per_1000"],
            "percentage": jesus_pct.get(key, 0),
        }
        for key, val in jesus_ranked.items()
    ],
    "paul_ranking": [
        {
            "concept": key,
            "label": CONCEPTS[key]["label"],
            "rank": val["rank"],
            "raw_count": val["raw"],
            "per_1000_verses": val["per_1000"],
            "percentage": paul_pct.get(key, 0),
        }
        for key, val in paul_ranked.items()
    ],
    "rank_correlations": {
        "jesus_vs_data_driven": jesus_vs_data,
        "paul_vs_data_driven": paul_vs_data,
        "jesus_vs_paul": jesus_vs_paul,
    },
    "gap_analysis": [
        {
            "concept": key,
            "label": CONCEPTS[key]["label"],
            "jesus_pct": jesus_pct.get(key, 0),
            "paul_pct": paul_pct.get(key, 0),
            "modern_sermon_pct": MODERN_SERMON.get(key, 0),
            "jesus_gap_vs_sermon": round(jesus_pct.get(key, 0) - MODERN_SERMON.get(key, 0), 1),
            "paul_gap_vs_sermon": round(paul_pct.get(key, 0) - MODERN_SERMON.get(key, 0), 1),
        }
        for key in data_driven_order if key in CONCEPTS
    ],
    "divergences_jesus_paul": [
        {
            "concept": key,
            "label": CONCEPTS[key]["label"],
            "jesus_pct": j,
            "paul_pct": p,
            "gap": round(diff, 1),
            "leader": "Jesus" if j > p else "Paul",
        }
        for key, j, p, diff in diffs[:5]
    ],
    "deep_dives": {},
    "centroid_similarity": round(sim, 4) if jesus_embs and paul_embs else None,
}

# Add deep dives
for corpus_name, books in [("jesus", JESUS_BOOKS), ("paul", PAUL_BOOKS)]:
    basileia = get_greek_count_in_books("G0932", books)
    sozo = get_greek_count_in_books("G4982", books)
    soteria = get_greek_count_in_books("G4991", books)
    metanoeo = get_greek_count_in_books("G3340", books)
    metanoia = get_greek_count_in_books("G3341", books)
    euangelion = get_greek_count_in_books("G2098", books)
    euangelizo = get_greek_count_in_books("G2097", books)
    tv = get_verse_count(books)

    output["deep_dives"][corpus_name] = {
        "total_verses": tv,
        "basileia_kingdom": basileia,
        "basileia_per_1000": round(basileia/tv*1000, 2),
        "sozo_save": sozo,
        "soteria_salvation": soteria,
        "salvation_total": sozo + soteria,
        "salvation_per_1000": round((sozo+soteria)/tv*1000, 2),
        "metanoeo_repent": metanoeo,
        "metanoia_repentance": metanoia,
        "repentance_total": metanoeo + metanoia,
        "repentance_per_1000": round((metanoeo+metanoia)/tv*1000, 2),
        "euangelion_gospel": euangelion,
        "euangelizo_proclaim": euangelizo,
        "gospel_total": euangelion + euangelizo,
        "gospel_per_1000": round((euangelion+euangelizo)/tv*1000, 2),
    }

out_path = os.path.join(OUT_DIR, "jesus_paul_preaching.json")
with open(out_path, "w") as f:
    json.dump(output, f, indent=2)

print(f"\n✓ Output written to {out_path}")

db.close()
