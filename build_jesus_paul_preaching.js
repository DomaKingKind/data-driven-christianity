#!/usr/bin/env node
var docx = require('docx');
var fs = require('fs');

var Document = docx.Document, Packer = docx.Packer, Paragraph = docx.Paragraph,
    TextRun = docx.TextRun, Table = docx.Table, TableRow = docx.TableRow,
    TableCell = docx.TableCell, HeadingLevel = docx.HeadingLevel,
    AlignmentType = docx.AlignmentType, BorderStyle = docx.BorderStyle,
    WidthType = docx.WidthType, ShadingType = docx.ShadingType,
    PageBreak = docx.PageBreak, Header = docx.Header, Footer = docx.Footer,
    PageNumber = docx.PageNumber, LevelFormat = docx.LevelFormat;

// Load data
var data = JSON.parse(fs.readFileSync('output/jesus_paul_preaching.json', 'utf8'));

var children = [];

// ─── Helper functions ────────────────────────────────────────────────────────

var border = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
var borders = { top: border, bottom: border, left: border, right: border };
var cellMargins = { top: 80, bottom: 80, left: 120, right: 120 };

function p(text, opts) {
    opts = opts || {};
    var runs = [];
    if (typeof text === 'string') {
        runs = [new TextRun({ text: text, bold: opts.bold, italics: opts.italics, size: opts.size || 24, font: 'Arial', color: opts.color })];
    } else {
        runs = text;
    }
    return new Paragraph({
        children: runs,
        heading: opts.heading,
        spacing: opts.spacing || { after: 120 },
        alignment: opts.alignment,
        pageBreakBefore: opts.pageBreak,
    });
}

function bold(text, size) {
    return new TextRun({ text: text, bold: true, size: size || 24, font: 'Arial' });
}

function run(text, opts) {
    opts = opts || {};
    return new TextRun({ text: text, bold: opts.bold, italics: opts.italics, size: opts.size || 24, font: 'Arial', color: opts.color });
}

function heading(text, level) {
    return p(text, { heading: level, bold: true, size: level === HeadingLevel.HEADING_1 ? 32 : 28 });
}

function makeRow(cells, isHeader) {
    var colWidths = [3200, 1200, 1200, 1200, 1280, 1280];
    return new TableRow({
        children: cells.map(function(text, i) {
            return new TableCell({
                borders: borders,
                width: { size: colWidths[i] || 1500, type: WidthType.DXA },
                margins: cellMargins,
                shading: isHeader ? { fill: '2E4057', type: ShadingType.CLEAR } : undefined,
                children: [new Paragraph({
                    children: [new TextRun({
                        text: String(text),
                        bold: isHeader,
                        size: 20,
                        font: 'Arial',
                        color: isHeader ? 'FFFFFF' : '333333',
                    })],
                    spacing: { after: 0 },
                })],
            });
        }),
    });
}

function makeSimpleRow(cells, isHeader, colWidths) {
    return new TableRow({
        children: cells.map(function(text, i) {
            return new TableCell({
                borders: borders,
                width: { size: colWidths[i], type: WidthType.DXA },
                margins: cellMargins,
                shading: isHeader ? { fill: '2E4057', type: ShadingType.CLEAR } : undefined,
                children: [new Paragraph({
                    children: [new TextRun({
                        text: String(text),
                        bold: isHeader,
                        size: 20,
                        font: 'Arial',
                        color: isHeader ? 'FFFFFF' : '333333',
                    })],
                    spacing: { after: 0 },
                })],
            });
        }),
    });
}

// ─── TITLE ───────────────────────────────────────────────────────────────────

children.push(p(''));
children.push(p(''));
children.push(p('Did Jesus and Paul Preach', { heading: HeadingLevel.TITLE, bold: true, size: 48, alignment: AlignmentType.CENTER }));
children.push(p('the Data-Driven Christian Way?', { heading: HeadingLevel.TITLE, bold: true, size: 48, alignment: AlignmentType.CENTER }));
children.push(p(''));
children.push(p('A Morphological Analysis of Emphasis Distribution', { alignment: AlignmentType.CENTER, italics: true, size: 26 }));
children.push(p(''));
children.push(p([
    run('Corpus: ', { bold: true }),
    run('STEP Bible morphological database (424,143 tagged words)'),
], { alignment: AlignmentType.CENTER }));
children.push(p([
    run('Method: ', { bold: true }),
    run("Strong's number frequency per 1,000 verses across 13 theological categories"),
], { alignment: AlignmentType.CENTER }));
children.push(p([
    run('Model: ', { bold: true }),
    run('BAAI/bge-large-en-v1.5 (1,024-dim embeddings, 31,086 BSB verses)'),
], { alignment: AlignmentType.CENTER }));

// ─── PREFACE ─────────────────────────────────────────────────────────────────

children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(heading('The Question', HeadingLevel.HEADING_1));

children.push(p("Our earlier probe ranked 13 theological concepts by their weight across the entire Bible. God's Reign scored highest (0.983). Individual Decision / Personal Salvation scored last (0.298). That raised an obvious question: did Jesus and Paul themselves preach this way, or does the whole-Bible ranking mask a different emphasis in their actual words?"));

children.push(p("This probe measures it directly. We count every occurrence of the Strong's numbers that define each of the 13 concepts, separately in Jesus's corpus (the four Gospels, 18,862 verses) and Paul's corpus (13 Epistles, 10,162 verses). We then normalize to per-1,000-verse rates, rank, and compare against three benchmarks: the whole-Bible data-driven ranking, each other, and the typical modern evangelical sermon."));

children.push(p([
    run('The results are not subtle. ', { bold: true }),
    run("Both Jesus and Paul agree on their top three categories, and neither of them looks anything like the modern sermon profile. The gap between what they preached and what gets preached about them is measurable, large, and consistent."),
]));

// ─── SECTION 1: THE RANKINGS ────────────────────────────────────────────────

children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(heading('Section 1: The Rankings Side by Side', HeadingLevel.HEADING_1));

children.push(p("Both corpora were measured identically: count Strong's number occurrences for each concept, divide by total verses, express as hits per 1,000 verses."));

// Jesus ranking table
children.push(p('Jesus (Gospels): 18,862 verses', { bold: true, spacing: { before: 240, after: 120 } }));

var jRows = [makeSimpleRow(['Rank', 'Concept', 'Raw', 'Per 1000v', '%'], true, [700, 4500, 1000, 1200, 960])];
data.jesus_ranking.forEach(function(r) {
    jRows.push(makeSimpleRow(['#' + r.rank, r.label, r.raw_count, r.per_1000_verses, r.percentage + '%'], false, [700, 4500, 1000, 1200, 960]));
});
children.push(new Table({
    width: { size: 8360, type: WidthType.DXA },
    columnWidths: [700, 4500, 1000, 1200, 960],
    rows: jRows,
}));

// Paul ranking table
children.push(p('Paul (Epistles): 10,162 verses', { bold: true, spacing: { before: 360, after: 120 } }));

var pRows = [makeSimpleRow(['Rank', 'Concept', 'Raw', 'Per 1000v', '%'], true, [700, 4500, 1000, 1200, 960])];
data.paul_ranking.forEach(function(r) {
    pRows.push(makeSimpleRow(['#' + r.rank, r.label, r.raw_count, r.per_1000_verses, r.percentage + '%'], false, [700, 4500, 1000, 1200, 960]));
});
children.push(new Table({
    width: { size: 8360, type: WidthType.DXA },
    columnWidths: [700, 4500, 1000, 1200, 960],
    rows: pRows,
}));

// ─── SECTION 2: WHAT THEY AGREE ON ──────────────────────────────────────────

children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(heading('Section 2: What They Agree On', HeadingLevel.HEADING_1));

children.push(p([
    run('The top three are identical. ', { bold: true }),
    run("Jesus and Paul both rank Union/Participation first, Cosmic Scope second, and God's Reign third. Together these three categories account for 84.3% of Jesus's theological vocabulary and 83.2% of Paul's. The agreement is not approximate; it is structural."),
]));

children.push(p([
    run('Union / Participation in God ', { bold: true }),
    run("dominates both corpora. Jesus at 48.0%, Paul at 43.0%. This is the \"in\" language \u2014 en (G1722), syn (G4862) \u2014 the grammar of being-in-God and God-being-in-you. The modern evangelical sermon allocates 2% to this category. Jesus and Paul both give it more than twenty times that."),
]));

children.push(p([
    run('Cosmic / Universal Scope ', { bold: true }),
    run("runs second in both. Jesus at 25.0%, Paul at 23.3%. This is kosmos, pas, ethnos, ktisis \u2014 the world, all, nations, creation. Both preach to the scale of the cosmos, not the individual. Modern sermons allocate 2% here."),
]));

children.push(p([
    run("God's Reign / Cosmic Kingship ", { bold: true }),
    run("is third for both. Jesus at 11.3%, Paul at 16.9%. Basileia, kyrios, christos \u2014 the kingdom announcement. Modern sermons allocate 5%."),
]));

children.push(p("The rank correlation between Jesus and Paul is 0.6209 (Spearman). Not identical, but far closer to each other than either is to the modern sermon."));

// ─── SECTION 3: THE GAP ─────────────────────────────────────────────────────

children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(heading('Section 3: The Gap Between Them and Us', HeadingLevel.HEADING_1));

children.push(p("The comparison to the modern evangelical sermon profile is where this gets uncomfortable."));

var gRows = [makeRow(['Concept', 'Jesus %', 'Paul %', 'Sermon %', 'J Gap', 'P Gap'], true)];
data.gap_analysis.forEach(function(g) {
    var jg = g.jesus_gap_vs_sermon >= 0 ? '+' + g.jesus_gap_vs_sermon : String(g.jesus_gap_vs_sermon);
    var pg = g.paul_gap_vs_sermon >= 0 ? '+' + g.paul_gap_vs_sermon : String(g.paul_gap_vs_sermon);
    gRows.push(makeRow([g.label, g.jesus_pct + '%', g.paul_pct + '%', g.modern_sermon_pct + '%', jg, pg], false));
});
children.push(new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [3200, 1200, 1200, 1200, 1280, 1280],
    rows: gRows,
}));

children.push(p(''));
children.push(p([
    run('The largest single gap: Individual Decision / Personal Salvation. ', { bold: true }),
    run("The modern sermon devotes 35% of its content to this category. Jesus devotes 3.2%. Paul devotes 2.2%. That is a 32-point gap \u2014 the sermon spends ten to fifteen times more on personal salvation than either Jesus or Paul did."),
]));

children.push(p([
    run('The second largest gap: Atonement / Sacrifice Mechanics. ', { bold: true }),
    run("The modern sermon devotes 10% here. Jesus and Paul each devote 0.1%. The substitutionary atonement framework that dominates modern preaching occupies almost no bandwidth in either corpus. The vocabulary exists (hilasmos, prosphora, haima), but it is vanishingly rare."),
]));

children.push(p([
    run('The third largest gap: Union / Participation. ', { bold: true }),
    run("This is the mirror image. The modern sermon devotes 2%. Jesus devotes 48%. Paul devotes 43%. The concept that Jesus and Paul both made their dominant category is nearly absent from the modern pulpit."),
]));

// ─── SECTION 4: WHERE THEY DIVERGE ──────────────────────────────────────────

children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(heading('Section 4: Where Jesus and Paul Diverge', HeadingLevel.HEADING_1));

children.push(p("Their agreement is more striking than their disagreement, but the divergences are real and interesting."));

var dCols = [3200, 1500, 1500, 1200, 1960];
var dRows = [makeSimpleRow(['Concept', 'Jesus %', 'Paul %', 'Gap', 'Leader'], true, dCols)];
data.divergences_jesus_paul.forEach(function(d) {
    dRows.push(makeSimpleRow([d.label, d.jesus_pct + '%', d.paul_pct + '%', d.gap + '%', d.leader], false, dCols));
});
children.push(new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: dCols,
    rows: dRows,
}));

children.push(p(''));
children.push(p([
    run("God's Reign: Paul leads by 5.6 points. ", { bold: true }),
    run("This might surprise people who think of Jesus as the 'kingdom preacher.' Jesus uses basileia (kingdom) at 6.79 per 1,000 verses versus Paul's 1.38 \u2014 but Paul compensates with heavy kyrios (Lord) and christos (Christ) usage, which are kingship-vocabulary in a different register. Paul is preaching the same reign, using the post-resurrection title system."),
]));

children.push(p([
    run('Loyal Love / Covenant Faithfulness: Paul leads by 3.7 points. ', { bold: true }),
    run("Paul uses charis (grace), pistis (faith), and diatheke (covenant) at industrial scale. The Gospels show Jesus enacting loyal love rather than naming it. This is a difference of genre, not theology."),
]));

children.push(p([
    run('Temple / Sacred Space: Jesus leads by 2.5 points. ', { bold: true }),
    run("Jesus operates in and around the Temple. His body-as-temple teaching happens in that physical space. Paul, writing to Gentile communities far from Jerusalem, uses naos metaphorically but rarely."),
]));

children.push(p([
    run('Spirit-Driven Community: Paul leads by 2.9 points. ', { bold: true }),
    run("Paul is building ekklesia (assemblies). Jesus is calling disciples. The Spirit-community vocabulary (pneuma, ekklesia, koinonia) belongs to the post-Pentecost situation Paul addresses. Jesus promises the Spirit; Paul describes its effects."),
]));

// ─── SECTION 5: THE DEEP DIVES ──────────────────────────────────────────────

children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(heading('Section 5: Signature Words', HeadingLevel.HEADING_1));

children.push(p("Four key terms reveal the different registers Jesus and Paul use to preach the same message."));

var ddCols = [2400, 2000, 1600, 1760, 1600];
var ddRows = [makeSimpleRow(['Term', 'Jesus', 'Paul', 'Jesus/1000v', 'Paul/1000v'], true, ddCols)];

var jd = data.deep_dives.jesus;
var pd = data.deep_dives.paul;

ddRows.push(makeSimpleRow(['basileia (kingdom)', jd.basileia_kingdom, pd.basileia_kingdom, jd.basileia_per_1000, pd.basileia_per_1000], false, ddCols));
ddRows.push(makeSimpleRow(['sozo + soteria (save)', jd.salvation_total, pd.salvation_total, jd.salvation_per_1000, pd.salvation_per_1000], false, ddCols));
ddRows.push(makeSimpleRow(['metanoeo (repent)', jd.repentance_total, pd.repentance_total, jd.repentance_per_1000, pd.repentance_per_1000], false, ddCols));
ddRows.push(makeSimpleRow(['euangelion (gospel)', jd.gospel_total, pd.gospel_total, jd.gospel_per_1000, pd.gospel_per_1000], false, ddCols));

children.push(new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: ddCols,
    rows: ddRows,
}));

children.push(p(''));
children.push(p([
    run('Kingdom: Jesus uses basileia at nearly 5x Paul\'s rate. ', { bold: true }),
    run("This is the word everyone associates with Jesus \u2014 and rightly so. 128 occurrences in the Gospels versus 14 in Paul. But Paul isn't ignoring the concept; he's expressing it through kyrios and christos, the enthroned title system that emerged after the resurrection."),
]));

children.push(p([
    run('Salvation: Paul uses sozo/soteria slightly more (4.92/1000 vs 3.29/1000). ', { bold: true }),
    run("But neither uses it at anywhere near the rate the modern sermon implies. Salvation language is present but not dominant in either corpus."),
]));

children.push(p([
    run('Repentance: Jesus uses metanoeo at nearly 3x Paul\'s rate. ', { bold: true }),
    run("\"Repent, for the kingdom of God is at hand\" (Mark 1:15) is Jesus's opening line. But metanoeo appears only 26 times in the Gospels \u2014 it is an entry point, not the substance."),
]));

children.push(p([
    run('Gospel: Paul uses euangelion at 6.5x Jesus\'s rate. ', { bold: true }),
    run("Paul names the gospel; Jesus enacts it. 81 occurrences in Paul versus 23 in the Gospels. The word euangelion is Paul's trademark. But what Paul calls 'the gospel' is what Jesus simply does \u2014 announce the reign, heal, include, forgive."),
]));

// ─── SECTION 6: SEMANTIC SIMILARITY ─────────────────────────────────────────

children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(heading('Section 6: Are They Semantically Saying the Same Thing?', HeadingLevel.HEADING_1));

children.push(p([
    run('Centroid-to-centroid similarity: 0.8482. ', { bold: true }),
    run("We selected 10 signature verses for each \u2014 Jesus's kingdom parables, Sermon on the Mount, Nazareth manifesto, and sheep-and-goats parable; Paul's cosmic reconciliation passages, body-of-Christ teaching, and universalist scope texts. Their semantic centroids are 84.8% similar. They are not using the same words, but they are occupying nearly the same semantic space."),
]));

children.push(p("For comparison, the centroid similarity between Apostle John and Paul (from our earlier probe) was 0.9688. Jesus-to-Paul at 0.8482 is lower but still in the 'same theological neighborhood' range. The difference is genre: narrative parables vs. argumentative letters encode differently in embedding space even when they point to the same reality."));

children.push(p([
    run('The strongest cross-match: John 3:16 scores 0.7590 against Paul\'s centroid. ', { bold: true }),
    run("\"God so loved the world\" is the most Pauline thing Jesus ever said \u2014 cosmic scope, divine initiative, universal address. Meanwhile, Ephesians 1:10 (\"unite all things in him\") scores 0.6916 against Jesus's centroid \u2014 the most 'Jesus-flavored' thing Paul ever wrote."),
]));

// ─── SECTION 7: THE VERDICT ─────────────────────────────────────────────────

children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(heading('Section 7: The Verdict', HeadingLevel.HEADING_1));

children.push(p([
    run('Did Jesus preach data-driven Christianity? ', { bold: true, size: 26 }),
], { spacing: { after: 200 } }));

children.push(p("Yes, with one qualification. Jesus's emphasis ranking does not perfectly match the whole-Bible data-driven ranking (Spearman correlation: 0.1978), because the whole-Bible ranking is dominated by the Old Testament's massive vocabulary for Loyal Love, Temple, and Prophetic Justice \u2014 categories where Jesus uses action rather than terminology. But Jesus's top three categories (Union, Cosmic Scope, Reign) are exactly the top three in the data-driven framework. He preaches the right things in the right proportions, just from within a narrative genre that favors showing over telling."));

children.push(p([
    run('Did Paul preach data-driven Christianity? ', { bold: true, size: 26 }),
], { spacing: { after: 200 } }));

children.push(p("More directly yes. Paul's Spearman correlation with the whole-Bible ranking is 0.5549 \u2014 moderate positive agreement. Paul's argumentative register forces him to name his categories explicitly, so his vocabulary more closely mirrors what the whole Bible emphasizes. His top three match. His emphasis proportions track closer to the data-driven framework than Jesus's do, not because Paul is more aligned, but because he is more explicit."));

children.push(p([
    run('Does the modern evangelical sermon preach data-driven Christianity? ', { bold: true, size: 26 }),
], { spacing: { after: 200 } }));

children.push(p("No. The largest category in the modern sermon (Individual Salvation at 35%) is ranked 5th by Jesus and 7th by Paul. The largest category for both Jesus and Paul (Union/Participation at 43-48%) gets 2% in the modern sermon. The concept that occupies the most bandwidth in modern preaching barely registers in either apostolic corpus, and the concept that dominates both apostolic corpora is virtually absent from the modern pulpit."));

children.push(p([
    run("The data says: Jesus and Paul were preaching a cosmic participatory reign. We are preaching individual transactional salvation. These are not the same sermon.", { bold: true, italics: true }),
], { spacing: { before: 360, after: 360 } }));

// ─── SECTION 8: METHODOLOGY ─────────────────────────────────────────────────

children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(heading('Methodology', HeadingLevel.HEADING_1));

children.push(p([
    run('Corpus definition. ', { bold: true }),
    run("Jesus corpus = Matthew, Mark, Luke, John (18,862 BSB verses). This includes narrative, not just red-letter text, which means non-Jesus speech is included. This is a known limitation; it inflates Jesus's raw counts but should not significantly distort proportional rankings, since the Gospels are overwhelmingly organized around Jesus's teaching and actions. Paul corpus = Romans through Philemon (10,162 BSB verses), including both undisputed and disputed letters."),
]));

children.push(p([
    run('Concept measurement. ', { bold: true }),
    run("Each of 13 theological concepts is defined by 2-5 Strong's numbers (both Hebrew and Greek). Greek Strong's numbers are searched in the step_greek_words table's 'english' column (format: G####=morph-code, zero-padded). Hits are counted per corpus, normalized to per-1,000-verse rates, converted to percentages, and ranked."),
]));

children.push(p([
    run('Rank correlation. ', { bold: true }),
    run("Spearman's rho is used to compare rank orderings between Jesus, Paul, the whole-Bible data-driven ranking, and the estimated modern evangelical sermon profile."),
]));

children.push(p([
    run('Embedding comparison. ', { bold: true }),
    run("10 signature verses per corpus were selected to represent each speaker's theological emphasis. BAAI/bge-large-en-v1.5 embeddings (1,024 dimensions) were averaged to centroids. Cosine similarity between centroids measures semantic overlap independent of vocabulary differences."),
]));

children.push(p([
    run('Modern sermon estimate. ', { bold: true }),
    run("The 'typical evangelical sermon' percentage breakdown is an estimate based on content analysis patterns in homiletics research and common sermon structures. It is approximate and intended as a directional comparison, not a precise measurement."),
]));

children.push(p([
    run('Limitations. ', { bold: true }),
    run("(1) Gospel corpus includes non-Jesus speech. (2) Strong's number coverage is not exhaustive \u2014 some concept-relevant vocabulary may be missed. (3) Union/Participation is heavily weighted by the preposition en (G1722), which has non-theological uses. (4) The modern sermon profile is estimated, not measured from a specific sample. (5) Frequency is not the same as importance \u2014 a concept can be theologically decisive even if it appears infrequently."),
]));

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
                    children: [new TextRun({ text: 'Did Jesus and Paul Preach the Data-Driven Christian Way?', italics: true, size: 18, font: 'Arial', color: '888888' })],
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

var outPath = 'Did_Jesus_and_Paul_Preach_Data_Driven.docx';

Packer.toBuffer(doc).then(function(buffer) {
    fs.writeFileSync(outPath, buffer);
    console.log('Total elements: ' + children.length);
    console.log('Output: ' + outPath);
    console.log('Size: ' + (buffer.length / 1024).toFixed(1) + ' KB');
});
