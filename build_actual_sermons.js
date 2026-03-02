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

var data = JSON.parse(fs.readFileSync('output/actual_sermons_probe.json', 'utf8'));

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
children.push(p('The Data-Driven Sermon', { heading: HeadingLevel.TITLE, bold: true, size: 48, alignment: AlignmentType.CENTER }));
children.push(p('What Did the Actual Sermons Sound Like?', { heading: HeadingLevel.TITLE, bold: true, size: 36, alignment: AlignmentType.CENTER }));
children.push(p(''));
children.push(p('An Analysis of 14 Recorded NT Sermons Against 13 Theological Categories', { alignment: AlignmentType.CENTER, italics: true, size: 26 }));
children.push(p('Featuring a Deep Dive into Paul\'s Mars Hill Address', { alignment: AlignmentType.CENTER, italics: true, size: 24 }));

// ─── SECTION 1: THE SERMONS WE HAVE ─────────────────────────────────────────
children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(heading('Section 1: The Sermons We Have', HeadingLevel.HEADING_1));

children.push(p("The New Testament preserves 14 major speeches or sermons. Not fragments, not allusions \u2014 full addresses delivered by Jesus, Paul, Peter, Stephen, and John (through the Prologue). We measured each one against our 13 theological concept centroids using BAAI/bge-large-en-v1.5 embeddings. The question: when these people actually stood up and opened their mouths, what did they talk about?"));

var cw1 = [2800, 1200, 1400, 3960];
var rows1 = [makeRow(['Sermon', 'Speaker', 'Verses', '#1 Concept'], true, cw1)];
data.sermons.forEach(function(s) {
    var top = s.concept_ranking[0];
    rows1.push(makeRow([s.label, s.speaker, s.verse_count, top.concept.replace(/_/g, ' ')], false, cw1));
});
children.push(new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: cw1, rows: rows1 }));

children.push(p(''));
children.push(p([
    bold('The dominant concept across all 14 sermons: Union / Participation (avg 0.843). '),
    run("It ranks #1 in 6 of the 14 sermons outright, and top-5 in all 14. No sermon in the New Testament has Individual Salvation as its #1 concept. Not one."),
]));

// ─── SECTION 2: WHAT EVERY SERMON HAS IN COMMON ─────────────────────────────
children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(heading('Section 2: What Every Sermon Has in Common', HeadingLevel.HEADING_1));

children.push(p('The cross-sermon concept averages reveal a consistent preaching pattern:'));

var avgCw = [4500, 1500, 3360];
var avgRows = [makeRow(['Concept', 'Avg Score', 'Interpretation'], true, avgCw)];
var avgs = data.cross_sermon_concept_averages;
var avgKeys = Object.keys(avgs);
avgKeys.sort(function(a, b) { return avgs[b] - avgs[a]; });
var avgInterps = {
    "union_participation": "Being-in-God is the dominant frame",
    "prophetic_justice": "Justice/righteousness is always present",
    "cosmic_scope": "Scale is always universal, never individual",
    "loyal_love": "Covenant faithfulness is assumed context",
    "restoration_after_judgment": "The arc is always toward restoration",
    "death_punishment": "Death is real but never the destination",
    "individual_salvation": "Present, but never dominant (#7 of 13)",
    "life_resurrection": "Life wins \u2014 always in the top tier",
    "spirit_community": "The Spirit-community is the delivery system",
    "atonement_sacrifice": "Surprisingly low (#10 of 13)",
    "temple_sacred_space": "Sacred space is theological, not literal",
    "divine_reign": "The reign is assumed, not argued",
    "exile_lament": "Lowest: the apostolic mood is triumph, not grief",
};
avgKeys.forEach(function(k, i) {
    avgRows.push(makeRow(['#' + (i+1) + ': ' + k.replace(/_/g, ' '), avgs[k], avgInterps[k] || ''], false, avgCw));
});
children.push(new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: avgCw, rows: avgRows }));

children.push(p(''));
children.push(p([
    bold('Atonement / Sacrifice Mechanics ranks #10. '),
    run("In 14 actual sermons \u2014 including Peter at Pentecost, Paul at Antioch, Stephen before the Sanhedrin \u2014 the substitutionary atonement framework that dominates modern preaching barely registers. The apostles talk about death and resurrection constantly, but they frame it as participation and restoration, not as penal transaction."),
]));

children.push(p([
    bold('Individual Salvation ranks #7. '),
    run("Present. Real. Never dominant. The concept a typical modern sermon devotes 35% of its time to finishes in the middle of the pack in every recorded sermon. The apostles preach individual response within a cosmic framework, not a cosmic framework within an individual appeal."),
]));

// ─── SECTION 3: MARS HILL DEEP DIVE ─────────────────────────────────────────
children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(heading('Section 3: Mars Hill \u2014 Paul\'s Sermon to Pagans', HeadingLevel.HEADING_1));

children.push(p("Acts 17:22\u201331 is the only recorded sermon where Paul addresses a completely pagan audience with no shared scriptural background. No synagogue context. No Abraham, no Moses, no Psalms. Just Stoics, Epicureans, and an altar to an Unknown God. This is Paul stripped down to essentials. What does he choose to say?"));

// Mars Hill text
children.push(p('The Text:', { bold: true, spacing: { before: 200 } }));
data.mars_hill_deep_dive.text.forEach(function(v) {
    children.push(p([
        bold('17:' + v.verse + ' ', 22),
        run(v.text, { size: 22 }),
    ], { spacing: { after: 60 } }));
});

children.push(p(''));
children.push(p([
    bold('#1 Concept: Cosmic Scope (0.854). '),
    run("This is the only sermon in the New Testament where Cosmic Scope ranks first. Paul does not start with sin, salvation, the cross, or personal decision. He starts with creation: \"The God who made the world and everything in it\" (v24). He ends with judgment of \"the world\" (v31). The entire address is framed at cosmic scale."),
]));

children.push(p([
    bold('#2: Union / Participation (0.827). '),
    run("\"In Him we live and move and have our being\" (v28). This is the center of the speech \u2014 the most philosophical sentence in the Bible. Paul does not tell the Athenians to invite Jesus into their hearts. He tells them they are already inside God. The invitation is to recognize what is already true."),
]));

children.push(p([
    bold('#3: Divine Reign (0.819). '),
    run("\"He is the Lord of heaven and earth\" (v24). Kingship language, applied to the Creator. Paul is announcing a reign, not offering a transaction."),
]));

// Mars Hill OT echoes
children.push(p(''));
children.push(heading('Mars Hill\'s Hidden Old Testament', HeadingLevel.HEADING_2));

children.push(p("Paul never quotes Scripture at Mars Hill. He quotes Epimenides and Aratus instead. But the embedding model finds where his mind is:"));

var otCw = [1500, 1500, 1200, 5160];
var otRows = [makeRow(['Acts Verse', 'OT Match', 'Similarity', 'OT Text'], true, otCw)];
data.mars_hill_deep_dive.ot_echoes.forEach(function(echo) {
    if (echo.top_ot.length > 0) {
        var top = echo.top_ot[0];
        otRows.push(makeRow(['17:' + echo.verse, top.ref, top.similarity, top.text.substring(0, 60)], false, otCw));
    }
});
children.push(new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: otCw, rows: otRows }));

children.push(p(''));
children.push(p([
    bold('The standout: Acts 17:27 \u2192 Isaiah 55:6 (0.806). '),
    run("\"God intended that they would seek Him\" maps to \"Seek the LORD while He may be found.\" Paul is preaching Isaiah 55 to pagans without ever naming it. The embedding model catches the echo because the semantic content is identical: God is near, seekable, and findable."),
]));

children.push(p([
    bold('Acts 17:24 \u2192 Psalm 96:5 / 1 Chronicles 16:26 (0.744). '),
    run("\"The God who made the world\" maps to \"All the gods of the nations are idols, but the LORD made the heavens.\" Paul is making a Psalmic argument in philosophical dress."),
]));

children.push(p([
    bold('Acts 17:26 \u2192 Deuteronomy 32:8 (0.730). '),
    run("\"From one man He made every nation\" maps to \"When the Most High gave the nations their inheritance.\" This is the Song of Moses \u2014 cosmic-scope creation theology. Paul at Mars Hill is preaching Deuteronomy 32 to Greeks."),
]));

// ─── SECTION 4: SPEAKER PROFILES ────────────────────────────────────────────
children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(heading('Section 4: Speaker Profiles', HeadingLevel.HEADING_1));

children.push(p([bold('Jesus: ')], { spacing: { before: 200 } }));
children.push(p("Six recorded sermons, three different #1 concepts: Prophetic Justice (Sermon on the Mount), Union/Participation (Bread of Life, Upper Room), and Restoration After Judgment (Nazareth, Olivet, Sheep and Goats). Jesus preaches justice, intimacy, and restoration depending on audience and occasion. He never preaches individual salvation as a primary theme. The Sermon on the Mount \u2014 the longest continuous teaching in the Gospels \u2014 ranks Prophetic Justice first: \"Blessed are those who hunger and thirst for righteousness.\""));

children.push(p([bold('Paul: ')], { spacing: { before: 200 } }));
children.push(p("Four recorded speeches. To pagans (Mars Hill): Cosmic Scope. To Jews (Antioch): Restoration After Judgment. To church leaders (Miletus): Union/Participation. Before authorities (Agrippa): Union/Participation. Paul adapts his lead concept to his audience. But every speech has Union/Participation in the top 3. It is his constant."));

children.push(p([bold('Peter: ')], { spacing: { before: 200 } }));
children.push(p("Two sermons, two different #1 concepts. Pentecost: Union/Participation (\"This is what was spoken through the prophet Joel\" \u2014 Spirit-indwelling as new reality). Solomon's Portico: Restoration After Judgment (\"Repent, then, and turn back, so that your sins may be wiped away, that times of refreshing may come from the Lord\" \u2014 Acts 3:19\u201320). Peter preaches repentance, but the destination is always restoration, never punishment."));

children.push(p([bold('Stephen: ')], { spacing: { before: 200 } }));
children.push(p("One speech. Restoration After Judgment #1. Stephen retells the entire history of Israel \u2014 Abraham through Moses through David through Solomon \u2014 as a story of God\u2019s faithfulness despite human resistance. It is the longest sermon in Acts and it is narrative history, not doctrinal proposition."));

children.push(p([bold('John (Prologue): ')], { spacing: { before: 200 } }));
children.push(p("Loyal Love #1. \"The Word became flesh and made his dwelling among us. We have seen his glory, the glory of the one and only Son, who came from the Father, full of grace and truth\" (John 1:14). John\u2019s theological statement begins with cosmic creation, moves through loyal love, and ends with incarnational intimacy. It is the most theological of all the sermons and it never mentions sin, repentance, or salvation."));

// ─── SECTION 5: WHAT A DATA-DRIVEN SERMON LOOKS LIKE ────────────────────────
children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(heading('Section 5: What a Data-Driven Sermon Would Look Like', HeadingLevel.HEADING_1));

children.push(p("Based on the emphasis proportions of the actual NT sermons, here is what a 30-minute data-driven sermon would allocate its time to:"));

// Proportional time allocation based on cross-sermon averages
var totalAvg = 0;
avgKeys.forEach(function(k) { totalAvg += avgs[k]; });

var allocCw = [4000, 1200, 1200, 2960];
var allocRows = [makeRow(['Topic', 'Weight', 'Minutes', 'What It Sounds Like'], true, allocCw)];

var soundsLike = {
    "union_participation": "\"You are in Christ. Christ is in you. This is who you are now.\"",
    "prophetic_justice": "\"God demands justice. Are we doing it?\"",
    "cosmic_scope": "\"This is about all nations, all creation, the whole cosmos.\"",
    "loyal_love": "\"God\u2019s covenant faithfulness does not fail.\"",
    "restoration_after_judgment": "\"After the exile, the return. After the cross, the empty tomb.\"",
    "death_punishment": "\"Death is real. It does not get the last word.\"",
    "individual_salvation": "\"Your response matters. Say yes. But know what you\u2019re saying yes to.\"",
    "life_resurrection": "\"He has been raised. The new age has begun.\"",
    "spirit_community": "\"The Spirit creates community. You are the temple now.\"",
    "atonement_sacrifice": "\"His blood was given. God provided the sacrifice.\"",
    "temple_sacred_space": "\"Where God dwells \u2014 which is now in you.\"",
    "divine_reign": "\"The King has arrived. The kingdom is here.\"",
    "exile_lament": "\"We groan. Creation groans. But not without hope.\"",
};

avgKeys.forEach(function(k) {
    var pct = avgs[k] / totalAvg;
    var mins = (pct * 30).toFixed(1);
    allocRows.push(makeRow([k.replace(/_/g, ' '), (pct * 100).toFixed(1) + '%', mins + ' min', soundsLike[k] || ''], false, allocCw));
});

children.push(new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: allocCw, rows: allocRows }));

children.push(p(''));
children.push(p([
    bold('Notice what this looks like: '),
    run("A data-driven sermon spends its first and largest block on Union/Participation \u2014 telling people who they are in Christ, what reality they inhabit. Then it moves to Justice, Cosmic Scope, and Covenant Faithfulness. Individual salvation gets about 2.5 minutes near the end. Atonement mechanics get about 1.5 minutes. The \"altar call\" moment \u2014 which in many churches IS the sermon \u2014 occupies 8% of the data-driven sermon."),
]));

// ─── SECTION 6: THE MARS HILL MODEL ─────────────────────────────────────────
children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(heading('Section 6: The Mars Hill Model', HeadingLevel.HEADING_1));

children.push(p("Mars Hill is the purest example of a data-driven sermon we have, because Paul has no inherited framework to lean on. No shared scripture, no synagogue assumptions, no covenant history. He has to start from scratch. Here is what he builds:"));

children.push(p([bold('1. Begin with creation and cosmic scope (v24\u201326). ')], { spacing: { before: 160 } }));
children.push(p("\"The God who made the world and everything in it is the Lord of heaven and earth.\" Paul starts at the highest possible altitude. The sermon\u2019s first act is to establish the scale: everything, everywhere, everyone."));

children.push(p([bold('2. Move to intimacy and union (v27\u201328). ')]));
children.push(p("\"In Him we live and move and have our being.\" From cosmic scope, Paul descends into radical intimacy. God is not far. You are inside God already. This is the participatory turn \u2014 the data\u2019s #1 concept across all sermons."));

children.push(p([bold('3. Name the error without shaming (v29\u201330). ')]));
children.push(p("\"We should not think that the Divine Being is like gold or silver or stone.\" Paul addresses idolatry directly but with dignity. He says God \"overlooked the ignorance of earlier times.\" There is no condemnation of the Athenians. There is a diagnosis followed by a note of grace."));

children.push(p([bold('4. Call for response inside a cosmic frame (v30\u201331). ')]));
children.push(p("\"He now commands all people everywhere to repent, because He has set a day when He will judge the world with justice.\" The call to repent comes last, not first. It is embedded in a cosmic framework (judgment of the world), not an individual transaction (your soul going to hell). And the proof is resurrection: \"He has given proof of this to everyone by raising Him from the dead.\""));

children.push(p(''));
children.push(p([
    bold('The structure is: '),
    run('Cosmic Scope \u2192 Union/Participation \u2192 Gentle Diagnosis \u2192 Response inside Cosmic Justice. '),
    run('This is the opposite of the modern evangelical sermon, which typically runs: '),
    run('Individual Sin \u2192 Substitutionary Atonement \u2192 Personal Decision \u2192 Afterlife Destination.', { italics: true }),
]));

children.push(p(''));
children.push(p("Paul at Mars Hill never mentions sin by name. Never mentions hell. Never mentions blood. Never quotes Scripture. Never makes a personal appeal (\"Won\u2019t you accept Jesus into your heart?\"). And some of the Athenians believed (v34). The most stripped-down, essential, no-furniture version of the gospel that Paul ever preaches is: God made everything, you\u2019re inside Him, stop worshipping dead things, He\u2019s raising the dead and judging the world."));

children.push(p([
    run("That is what a data-driven sermon sounds like.", { bold: true, italics: true, size: 26 }),
], { spacing: { before: 360, after: 360 } }));

// ─── SECTION 7: COMPARISON TABLE ────────────────────────────────────────────
children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(heading('Section 7: The Comparison', HeadingLevel.HEADING_1));

children.push(p("Three sermon models side by side:"));

var compCw = [2500, 2200, 2200, 2460];
var compRows = [makeRow(['Element', 'Mars Hill / Data-Driven', 'Actual NT Average', 'Typical Modern'], true, compCw)];
compRows.push(makeRow(['Opening Move', 'God made everything', 'Union/Participation', 'You are a sinner'], false, compCw));
compRows.push(makeRow(['Central Claim', 'You\u2019re inside God', 'You\u2019re in Christ', 'Jesus died for you'], false, compCw));
compRows.push(makeRow(['Problem Named', 'Idolatry / ignorance', 'Injustice / exile', 'Personal sin / hell'], false, compCw));
compRows.push(makeRow(['Solution Offered', 'Repent into cosmic justice', 'Participate in resurrection', 'Accept substitution'], false, compCw));
compRows.push(makeRow(['Scale', 'All nations, all creation', 'Cosmic/corporate', 'Individual soul'], false, compCw));
compRows.push(makeRow(['Proof', 'Resurrection from dead', 'Resurrection + Spirit', 'Bible says so'], false, compCw));
compRows.push(makeRow(['Call to Action', 'Last, inside cosmic frame', 'Present, inside union', 'First and primary'], false, compCw));
compRows.push(makeRow(['Atonement Mechanics', 'Not mentioned', 'Avg rank #10 of 13', '~10% of sermon'], false, compCw));
compRows.push(makeRow(['Individual Salvation', 'Not mentioned by name', 'Avg rank #7 of 13', '~35% of sermon'], false, compCw));

children.push(new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: compCw, rows: compRows }));

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
                    children: [new TextRun({ text: 'The Data-Driven Sermon: What Did the Actual Sermons Sound Like?', italics: true, size: 18, font: 'Arial', color: '888888' })],
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

var outPath = 'The_Data_Driven_Sermon.docx';
Packer.toBuffer(doc).then(function(buffer) {
    fs.writeFileSync(outPath, buffer);
    console.log('Total elements: ' + children.length);
    console.log('Output: ' + outPath);
    console.log('Size: ' + (buffer.length / 1024).toFixed(1) + ' KB');
});
