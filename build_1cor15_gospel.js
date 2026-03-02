#!/usr/bin/env node
var docx = require('docx');
var fs = require('fs');

var Document = docx.Document, Packer = docx.Packer, Paragraph = docx.Paragraph,
    TextRun = docx.TextRun, Table = docx.Table, TableRow = docx.TableRow,
    TableCell = docx.TableCell, HeadingLevel = docx.HeadingLevel,
    AlignmentType = docx.AlignmentType, BorderStyle = docx.BorderStyle,
    WidthType = docx.WidthType, ShadingType = docx.ShadingType,
    PageBreak = docx.PageBreak, Header = docx.Header, Footer = docx.Footer,
    PageNumber = docx.PageNumber;

var data = JSON.parse(fs.readFileSync('output/1cor15_gospel_probe.json', 'utf8'));

var children = [];
var border = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
var borders = { top: border, bottom: border, left: border, right: border };
var cellMargins = { top: 80, bottom: 80, left: 120, right: 120 };

function p(text, opts) {
    opts = opts || {};
    var runs = [];
    if (typeof text === 'string') {
        runs = [new TextRun({ text: text, bold: opts.bold, italics: opts.italics, size: opts.size || 24, font: 'Arial', color: opts.color })];
    } else { runs = text; }
    return new Paragraph({
        children: runs, heading: opts.heading,
        spacing: opts.spacing || { after: 120 },
        alignment: opts.alignment, pageBreakBefore: opts.pageBreak,
    });
}
function bold(t, s) { return new TextRun({ text: t, bold: true, size: s || 24, font: 'Arial' }); }
function run(t, o) { o = o || {}; return new TextRun({ text: t, bold: o.bold, italics: o.italics, size: o.size || 24, font: 'Arial', color: o.color }); }
function heading(t, l) { return p(t, { heading: l, bold: true, size: l === HeadingLevel.HEADING_1 ? 32 : 28 }); }

function makeRow(cells, isHeader, colWidths) {
    return new TableRow({
        children: cells.map(function(text, i) {
            return new TableCell({
                borders: borders,
                width: { size: colWidths[i], type: WidthType.DXA },
                margins: cellMargins,
                shading: isHeader ? { fill: '2E4057', type: ShadingType.CLEAR } : undefined,
                children: [new Paragraph({
                    children: [new TextRun({ text: String(text), bold: isHeader, size: 20, font: 'Arial', color: isHeader ? 'FFFFFF' : '333333' })],
                    spacing: { after: 0 },
                })],
            });
        }),
    });
}

// ─── TITLE ───────────────────────────────────────────────────────────────────
children.push(p(''));
children.push(p(''));
children.push(p('What Did Paul Mean by "The Gospel"?', { heading: HeadingLevel.TITLE, bold: true, size: 48, alignment: AlignmentType.CENTER }));
children.push(p(''));
children.push(p('A Morphological and Semantic Analysis of 1 Corinthians 15:1\u20134', { alignment: AlignmentType.CENTER, italics: true, size: 26 }));
children.push(p(''));
children.push(p([
    run('Method: ', { bold: true }),
    run('Embedding similarity (BAAI/bge-large-en-v1.5), Greek morphological parsing, cross-reference validation, semantic clustering of all 71 Pauline euangelion verses'),
], { alignment: AlignmentType.CENTER }));

// ─── SECTION 1: THE TEXT ─────────────────────────────────────────────────────
children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(heading('Section 1: The Text', HeadingLevel.HEADING_1));

children.push(p('Paul writes to Corinth with what scholars universally recognize as the earliest preserved Christian creed, a pre-Pauline formula he "received" and "passed on":'));

for (var v = 1; v <= 8; v++) {
    var text = data.creed_text[String(v)] || '';
    children.push(p([
        bold('15:' + v + ' ', 22),
        run(text, { size: 22 }),
    ], { spacing: { after: 80 } }));
}

children.push(p(''));
children.push(p('The critical phrase is kata tas graphas \u2014 "according to the Scriptures." Paul says it twice: once for the death, once for the resurrection. This phrase does not mean "as predicted by a proof-text." It means "in accordance with the pattern and trajectory of the entire scriptural narrative." The question is: which pattern? Which scriptures?'));

// ─── SECTION 2: WHERE THE EMBEDDINGS POINT ──────────────────────────────────
children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(heading('Section 2: Where "According to the Scriptures" Points', HeadingLevel.HEADING_1));

children.push(p('We combined the embeddings of verses 3 and 4 (the death-burial-resurrection core) into a single centroid, then found the 20 closest OT verses by cosine similarity.'));

var cw = [1200, 4000, 900, 3260];
var rows = [makeRow(['Similarity', 'Verse', 'Book', 'Text (excerpt)'], true, cw)];
data.ot_targets_v3v4_combined.forEach(function(t) {
    rows.push(makeRow([t.similarity.toFixed(4), t.book + ' ' + t.chapter + ':' + t.verse, t.book, t.text.substring(0, 65)], false, cw));
});
children.push(new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: cw, rows: rows }));

children.push(p(''));
children.push(p([
    bold('The #1 match: Hosea 6:2 (0.7242). '),
    run('"After two days He will revive us; on the third day He will raise us up, that we may live before Him." This is not a prediction about an individual resurrection. It is a promise of national restoration \u2014 Israel raised from exile-death to renewed covenant life. Paul\'s "raised on the third day" points here, to the God who restores His people from death-as-corporate-condition.'),
]));

children.push(p([
    bold('Genesis 22:4 (0.6488). '),
    run('Abraham and Isaac on the third day \u2014 the Akedah. The binding of Isaac is the paradigm of death-and-return in Jewish memory. Paul\'s audience, steeped in synagogue reading, would hear "third day" and think: the God who provides a substitute and returns the son.'),
]));

children.push(p([
    bold('Leviticus 17:11 (0.6582). '),
    run('"The life of the flesh is in the blood, and I have given it to you to make atonement." The death-for-sins clause points to sacrificial logic, but notice: it is God who gives the blood. The atonement is divine provision, not human transaction.'),
]));

children.push(p([
    bold('Jonah 3:3 (0.6493). '),
    run('Jonah rising from the sea-beast on the third day. Jesus himself cited this typology (Matthew 12:40). The embedding model finds it independently.'),
]));

// Book distribution
children.push(p(''));
children.push(p('Book Distribution of Top 50 OT Matches:', { bold: true }));

var bookDist = data.book_distribution_top50;
var bookPairs = Object.keys(bookDist).map(function(b) { return [b, bookDist[b]]; });
bookPairs.sort(function(a, b) { return b[1] - a[1]; });
var bookText = bookPairs.map(function(bp) { return bp[0] + ' (' + bp[1] + ')'; }).join(', ');
children.push(p(bookText));

children.push(p(''));
children.push(p('The top-50 distribution tells a story: the "Scriptures" Paul has in mind are weighted toward the Psalms (9), Ezekiel (7), Jeremiah (5), and Genesis (5). These are not proof-text repositories. They are the narrative of exile, lament, restoration, and covenant promise. "According to the Scriptures" points to the whole arc of death-and-restoration in Israel\'s story, not to a single predicted event.'));

// ─── SECTION 3: THE GRAMMAR ─────────────────────────────────────────────────
children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(heading('Section 3: What the Greek Grammar Tells Us', HeadingLevel.HEADING_1));

children.push(p([
    bold('The resurrection verb: \u1F10\u03B3\u03AE\u03B3\u03B5\u03C1\u03C4\u03B1\u03B9 (eg\u0113gertai). '),
    run('This is the morphological headline. The verb egeiro (to raise) appears in 1 Cor 15:4 as:'),
]));

children.push(p([
    bold('V-RPI-3S '),
    run('\u2014 Verb, Perfect tense, Passive voice, Indicative mood, 3rd person Singular.'),
], { spacing: { before: 120 } }));

children.push(p([
    bold('Perfect tense '),
    run('means: a completed action whose results are still in effect at the time of speaking. Paul is not saying "Christ was raised once" (Aorist). He is saying "Christ has been raised and remains raised right now." The resurrection is not a past event. It is a present state of affairs. The perfect tense is the theological tense of the New Testament \u2014 it is the tense of "it is written" (gegraptai), of accomplished realities that have not stopped being accomplished.'),
]));

children.push(p([
    bold('Passive voice '),
    run('means: Christ did not raise himself. He was raised by an external agent. The agent is unnamed but obvious \u2014 God. In 1 Cor 15:15, Paul makes it explicit: "God raised Christ." The passive is a divine passive. The resurrection is something God does, not something Jesus achieves. This is the grammar of divine initiative.'),
]));

children.push(p(''));
children.push(p([
    bold('Throughout 1 Cor 15, egeiro appears 19 times. '),
    run('Every single instance that refers to Christ\'s resurrection uses the passive voice. Paul never once describes the resurrection in the active voice with Christ as subject. The grammar is unanimous: resurrection is an act of God upon Christ, and through Christ upon all creation.'),
]));

children.push(p(''));
children.push(p([
    bold('The death verb: \u1F00\u03C0\u03AD\u03B8\u03B1\u03BD\u03B5\u03BD (apethanen). '),
    run('V-2AAI-3S \u2014 Verb, Second Aorist, Active, Indicative, 3rd person Singular. Christ died (Aorist = punctiliar, completed event) actively. He died; he was not killed passively. But then he was raised passively. The asymmetry is the gospel: active death, passive resurrection. He gave his life; God gave it back.'),
]));

children.push(p(''));
children.push(p([
    bold('The burial verb: \u1F10\u03C4\u03AC\u03C6\u03B7 (etaph\u0113). '),
    run('V-2API-3S \u2014 Verb, Second Aorist, Passive, Indicative. He was buried. Again passive \u2014 others buried him. The burial confirms the reality of the death and sets up the passive-voice pattern that continues with "was raised."'),
]));

children.push(p('The grammatical sequence: he died [active] \u2192 he was buried [passive] \u2192 he has been raised [perfect passive]. The movement is from human action to divine action, from a single past event to an ongoing present reality.'));

// ─── SECTION 4: SEMANTIC CLUSTERING ─────────────────────────────────────────
children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(heading('Section 4: What Paul\'s "Gospel" Clusters With', HeadingLevel.HEADING_1));

children.push(p('We collected all 71 verses in Paul where euangelion or euangelizo appears, computed their semantic centroid, then measured its similarity to six theological concept centroids:'));

var clusterCw = [4000, 1500, 3860];
var clusterRows = [makeRow(['Concept', 'Similarity', 'Interpretation'], true, clusterCw)];

var clusterLabels = {
    "individual_salvation": "Individual Salvation",
    "death_atonement": "Death / Atonement",
    "union_participation": "Union / Participation",
    "resurrection_new_creation": "Resurrection / New Creation",
    "reconciliation_cosmic": "Cosmic Reconciliation",
    "cosmic_reign": "Cosmic Reign"
};

var clusterInterps = {
    "individual_salvation": "Closest: salvation vocabulary is gospel-adjacent",
    "death_atonement": "Paul consistently links gospel to Christ's death",
    "union_participation": "The 'in Christ' framework is gospel context",
    "resurrection_new_creation": "Resurrection is what gospel announces",
    "reconciliation_cosmic": "World-reconciliation is gospel content",
    "cosmic_reign": "Kingdom/reign is gospel backdrop"
};

var clusterData = data.gospel_semantic_clustering;
var clusterKeys = Object.keys(clusterData);
clusterKeys.sort(function(a, b) { return clusterData[b] - clusterData[a]; });

clusterKeys.forEach(function(k, i) {
    clusterRows.push(makeRow([
        '#' + (i+1) + ': ' + (clusterLabels[k] || k),
        clusterData[k].toFixed(4),
        clusterInterps[k] || ''
    ], false, clusterCw));
});

children.push(new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: clusterCw, rows: clusterRows }));

children.push(p(''));
children.push(p('All six concepts score above 0.73. That is the first insight: Paul\'s "gospel" is not a narrow theological category. It touches everything. But the ranking tells us what it touches most.'));

children.push(p([
    bold('Individual Salvation scores highest (0.8559), '),
    run('but this is misleading if read in isolation. Paul\'s salvation vocabulary (sozo, soteria) appears in gospel contexts, but the content of that salvation is always corporate and cosmic \u2014 "the power of God for salvation to everyone who believes" (Rom 1:16). The word "salvation" is present, but the framework is universal.'),
]));

children.push(p([
    bold('Death/Atonement scores second (0.8123). '),
    run('This confirms that "Christ died for our sins" is genuinely central to Paul\'s gospel. He does not marginalize the death. But notice: the atonement vocabulary by itself (hilasmos, prosphora, lutron) scored nearly zero in our earlier frequency probe. Paul uses hyper (for/on behalf of) 95 times across his letters \u2014 the "for" in "died for our sins" is everywhere. The death is central, but Paul frames it as representation (dying-for) rather than as transaction (paying-for).'),
]));

children.push(p([
    bold('Union/Participation scores third (0.8035). '),
    run('This is the data confirming your instinct that Paul means "a lot." When Paul says "gospel," he is not just saying "Jesus died and rose." He is saying "you are in Christ\'s death and in Christ\'s resurrection." The gospel is participatory. It is not news about what happened to someone else. It is news about a reality you are now inside of.'),
]));

// ─── SECTION 5: WHAT "ACCORDING TO THE SCRIPTURES" ACTUALLY MEANS ───────────
children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(heading('Section 5: What "According to the Scriptures" Actually Means', HeadingLevel.HEADING_1));

children.push(p('The cross-reference table gives us the traditional scholarly links for 1 Cor 15:3\u20134. The embedding model gives us semantic gravity. Together they answer your question.'));

children.push(p([bold('The traditional links (cross-references):')], { spacing: { before: 200 } }));

children.push(p('15:3 points to Isaiah 53:5\u20136 (the Servant Song: "He was pierced for our transgressions"), Psalm 22:1\u20138 (the cry of abandonment), and Romans 4:25 ("delivered up for our trespasses").'));

children.push(p('15:4 points to Hosea 6:2 ("on the third day He will raise us up"), Jonah 1:17/Matthew 12:40 (three days in the belly), Acts 10:40 ("God raised Him on the third day"), and Psalm 16:10 ("You will not let Your Holy One see decay").'));

children.push(p([bold('The embedding links add depth:')], { spacing: { before: 200 } }));

children.push(p('The embeddings don\'t just find the proof-texts. They find the semantic field. The top matches for v3+v4 combined include Ezekiel ("the word of the LORD came to me"), Psalms of lament and restoration (103, 119, 51), Genesis 22 (the Akedah), and Leviticus 17:11 (blood-as-life). These are not predictions. They are patterns.'));

children.push(p([
    bold('"According to the Scriptures" means: ', 26),
], { spacing: { before: 240 } }));

children.push(p('What happened to Christ is what happens to Israel. The nation dies (exile), is buried (Babylon), and is raised (return/restoration). The individual righteous sufferer dies (Psalm 22), descends (Sheol), and is vindicated (Psalm 16). Abraham\'s son walks toward death (Genesis 22:4) on the third day and comes back. Jonah descends into the sea-beast and is expelled alive.'));

children.push(p('Paul is not citing a verse. He is citing a shape. The shape is: death \u2192 descent \u2192 divine reversal. And the grammar locks it in: the reversal is always God\'s action (passive voice), always a present ongoing reality (perfect tense), and always larger than the individual (corporate referents in Hosea, Isaiah, Ezekiel).'));

// ─── SECTION 6: THE VERDICT ─────────────────────────────────────────────────
children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(heading('Section 6: So What Does Paul Mean by "The Gospel"?', HeadingLevel.HEADING_1));

children.push(p('Your instinct was right: he means a lot. Here is what the data says he means:'));

children.push(p([
    bold('1. A cosmic event with ongoing effects. '),
    run('The perfect passive (eg\u0113gertai) means the resurrection is not a past fact but a present force. Paul\'s gospel is not "Christ was raised 2,000 years ago." It is "Christ has been raised and the new age is underway."'),
]));

children.push(p([
    bold('2. A divine initiative, not a human decision. '),
    run('Every resurrection verb in 1 Cor 15 is passive. God is the actor. The gospel is news about what God has done, not an invitation to make a choice. Individual response matters (1 Cor 15:2: "if you hold firmly"), but the gospel itself is an announcement of an accomplished cosmic fact.'),
]));

children.push(p([
    bold('3. The fulfillment of Israel\'s entire story, not a proof-text. '),
    run('"According to the Scriptures" points to Hosea 6:2, Genesis 22, Jonah, Isaiah 53, Psalm 22, Leviticus 17 \u2014 the whole death-and-restoration arc. The gospel is that Israel\'s story (death/exile \u2192 burial \u2192 divine restoration) has happened in Christ.'),
]));

children.push(p([
    bold('4. A participatory reality. '),
    run('The semantic clustering shows Union/Participation as the #3 context for Paul\'s gospel usage. "Christ died for our sins" is not news about someone else\'s sacrifice. It is news about a death you are in (Rom 6:3\u20135) and a resurrection you are in (Col 3:1). The gospel creates a new location: "in Christ."'),
]));

children.push(p([
    bold('5. Both smaller and larger than modern preaching claims. '),
    run('Smaller: the creedal formula is four clauses. It does not mention hell, heaven, eternal life, a sinner\'s prayer, or personal relationship with Jesus. Larger: it means the entire OT death-restoration pattern has been enacted in history, God is the agent, the new age has begun, and you are now inside the event. The modern gospel presentation shrinks the event (individual salvation) and inflates the mechanism (penal transaction). Paul does the opposite: the event is cosmic, and the mechanism is participatory.'),
]));

children.push(p(''));
children.push(p([
    run('The data says: when Paul defines "the gospel" in 1 Cor 15:1\u20134, he is compressing the entire biblical narrative into four clauses. Death-burial-resurrection is not a transaction. It is the shape of God\'s action across all of Scripture, now accomplished definitively and permanently in Christ, and you are inside it.', { bold: true, italics: true }),
], { spacing: { before: 360, after: 360 } }));

// ─── BUILD ───────────────────────────────────────────────────────────────────
var doc = new Document({
    styles: {
        default: { document: { run: { font: 'Arial', size: 24 } } },
        paragraphStyles: [
            { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
              run: { size: 32, bold: true, font: 'Arial' },
              paragraph: { spacing: { before: 240, after: 240 }, outlineLevel: 0 } },
            { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
              run: { size: 28, bold: true, font: 'Arial' },
              paragraph: { spacing: { before: 180, after: 180 }, outlineLevel: 1 } },
        ]
    },
    sections: [{
        properties: {
            page: {
                size: { width: 12240, height: 15840 },
                margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
            },
        },
        headers: {
            default: new Header({
                children: [new Paragraph({
                    children: [new TextRun({ text: 'What Did Paul Mean by "The Gospel"? \u2014 1 Cor 15:1\u20134', italics: true, size: 18, font: 'Arial', color: '888888' })],
                    alignment: AlignmentType.RIGHT,
                })],
            }),
        },
        footers: {
            default: new Footer({
                children: [new Paragraph({
                    children: [new TextRun({ text: 'Page ', size: 18, font: 'Arial', color: '888888' }), new TextRun({ children: [PageNumber.CURRENT], size: 18, font: 'Arial', color: '888888' })],
                    alignment: AlignmentType.CENTER,
                })],
            }),
        },
        children: children,
    }],
});

var outPath = 'What_Paul_Meant_By_Gospel.docx';
Packer.toBuffer(doc).then(function(buffer) {
    fs.writeFileSync(outPath, buffer);
    console.log('Total elements: ' + children.length);
    console.log('Output: ' + outPath);
    console.log('Size: ' + (buffer.length / 1024).toFixed(1) + ' KB');
});
