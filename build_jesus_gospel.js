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

var data = JSON.parse(fs.readFileSync('output/jesus_gospel_probe.json', 'utf8'));

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
    return new Paragraph({ children: runs, heading: opts.heading, spacing: opts.spacing || { after: 120 }, alignment: opts.alignment, pageBreakBefore: opts.pageBreak });
}
function bold(t, s) { return new TextRun({ text: t, bold: true, size: s || 24, font: 'Arial' }); }
function run(t, o) { o = o || {}; return new TextRun({ text: t, bold: o.bold, italics: o.italics, size: o.size || 24, font: 'Arial', color: o.color }); }
function heading(t, l) { return p(t, { heading: l, bold: true, size: l === HeadingLevel.HEADING_1 ? 32 : 28 }); }

function makeRow(cells, isHeader, colWidths) {
    return new TableRow({
        children: cells.map(function(text, i) {
            return new TableCell({
                borders: borders, width: { size: colWidths[i], type: WidthType.DXA }, margins: cellMargins,
                shading: isHeader ? { fill: '2E4057', type: ShadingType.CLEAR } : undefined,
                children: [new Paragraph({ children: [new TextRun({ text: String(text), bold: isHeader, size: 20, font: 'Arial', color: isHeader ? 'FFFFFF' : '333333' })], spacing: { after: 0 } })],
            });
        }),
    });
}

// ─── TITLE ───────────────────────────────────────────────────────────────────
children.push(p(''));
children.push(p(''));
children.push(p('What Did Jesus Mean by "The Gospel"?', { heading: HeadingLevel.TITLE, bold: true, size: 48, alignment: AlignmentType.CENTER }));
children.push(p(''));
children.push(p('Isaiah 61, the Kingdom Announcement, and the Gospel Defined by Its Effects', { alignment: AlignmentType.CENTER, italics: true, size: 26 }));

// ─── SECTION 1: THE PROBLEM ─────────────────────────────────────────────────
children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(heading('Section 1: The Problem', HeadingLevel.HEADING_1));

children.push(p("Paul defines the gospel in 1 Corinthians 15:3\u20134: Christ died for our sins, was buried, was raised. Four clauses. Clear. Creedal. Jesus never does this. He never sits down and says \"the gospel is X.\" Instead, he uses the word euangelion 23 times in the Gospels, and every time it is either: a thing he is doing (\"preaching the gospel of the kingdom\"), a thing he is living (\"for my sake and the gospel's\"), or a thing defined by its visible effects (\"the blind see, the lame walk, the poor hear good news\")."));

children.push(p("So how do you define something that is defined by enactment rather than proposition? You measure it. You collect every instance where Jesus uses the word, every programmatic statement where he explains what he is doing, and you run the embeddings, the morphology, and the cross-references. Here is what the data says."));

// ─── SECTION 2: MARK 1:14-15 ────────────────────────────────────────────────
children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(heading('Section 2: The Opening Line', HeadingLevel.HEADING_1));

children.push(p([bold('Mark 1:14\u201315: '), run('"The time is fulfilled, and the kingdom of God is near. Repent and believe in the gospel!"', { italics: true })]));

children.push(p("This is Jesus's first recorded public statement in Mark. It has four elements: (1) a time claim (the kairos has arrived), (2) a spatial claim (the kingdom has drawn near), (3) a command (repent), and (4) an invitation (believe in the gospel). Notice what is not here: no mention of sin, death, atonement, heaven, hell, or personal salvation. The gospel is identified with the kingdom's arrival."));

children.push(p([bold('The morphology reveals two perfect-tense verbs. '), run('pepl\u0113r\u014dtai (\u03C0\u03B5\u03C0\u03BB\u03AE\u03C1\u03C9\u03C4\u03B1\u03B9, V-RPI-3S) \u2014 "is fulfilled" \u2014 and \u0113ngiken (\u1F24\u03B3\u03B3\u03B9\u03BA\u03B5\u03BD, V-RAI-3S) \u2014 "has come near." Both are perfect tense: completed action with ongoing present results. The time has been fulfilled and remains fulfilled. The kingdom has drawn near and remains near. Jesus\'s opening line is not a future promise. It is a present-tense announcement of an accomplished reality.')]));

children.push(p([bold('The OT echo: Psalm 98:2 (0.735). '), run('"The LORD has proclaimed His salvation and revealed His righteousness to the nations." The embedding model finds Jesus\'s opening announcement sitting in the same semantic space as the Psalms of cosmic proclamation \u2014 God revealing His reign to all peoples. Mark 1:15 is a Psalm come to life.')]));

// ─── SECTION 3: THE NAZARETH MANIFESTO ───────────────────────────────────────
children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(heading('Section 3: The Nazareth Manifesto', HeadingLevel.HEADING_1));

children.push(p([bold('Luke 4:18\u201319: '), run('"The Spirit of the Lord is on Me, because He has anointed Me to preach good news to the poor. He has sent Me to proclaim liberty to the captives and recovery of sight to the blind, to release the oppressed, to proclaim the year of the Lord\'s favor."', { italics: true })]));

children.push(p([bold('Luke 4:21: '), run('"Today this Scripture is fulfilled in your hearing."', { italics: true })]));

children.push(p("This is the only time in the Gospels where Jesus picks up a text, reads it aloud, and says \"This is me. This is what I am doing.\" He chose Isaiah 61. Of all the texts in the Hebrew Bible, this is his self-selected proof text. So what is Isaiah 61?"));

children.push(p([bold('Isaiah 61 is a Jubilee text. '), run('It announces: good news to the poor, liberty to captives, sight to the blind, release for the oppressed, the year of the Lord\'s favor. That last phrase \u2014 "the year of the Lord\'s favor" \u2014 is Jubilee language (Leviticus 25:10). Jubilee is the year when debts are cancelled, slaves are freed, and land returns to its original owners. It is systemic economic and social restoration. It is not a spiritual metaphor. It is the liberation of actual poor people, actual prisoners, actual blind people.')]));

children.push(p([bold('The embedding similarity: Isaiah 61:1\u20133 \u2194 Luke 4:18\u201321 = 0.8328. '), run('This is an exceptionally high match, confirming that Jesus is not loosely alluding to Isaiah. He is inhabiting it. The semantic content is nearly identical.')]));

children.push(p([bold('What Jesus left out is as revealing as what he read. '), run('Isaiah 61:2 continues: "and the day of our God\'s vengeance." Jesus stops reading mid-verse. He reads the favor. He omits the vengeance. He then sits down and says "Today this is fulfilled." The Jubilee is here. The vengeance is not.')]));

children.push(p(''));
children.push(p([bold('The verbs in Luke 4:18\u201319 tell the whole story:')]));

var verbCw = [2200, 2500, 2000, 2660];
var verbRows = [makeRow(['Greek', 'Meaning', 'Morphology', 'What It Tells Us'], true, verbCw)];
verbRows.push(makeRow(['\u1F14\u03C7\u03C1\u03B9\u03C3\u03B5\u03BD', 'anointed', 'V-AAI-3S (Aorist Active)', 'God anointed \u2014 completed divine act'], false, verbCw));
verbRows.push(makeRow(['\u03B5\u1F50\u03B1\u03B3\u03B3\u03B5\u03BB\u03AF\u03C3\u03B1\u03C3\u03B8\u03B1\u03B9', 'preach good news', 'V-AMN (Aorist Middle)', 'Self-involved action: he himself brings the news'], false, verbCw));
verbRows.push(makeRow(['\u1F00\u03C0\u03AD\u03C3\u03C4\u03B1\u03BB\u03BA\u03B5\u03BD', 'has sent', 'V-RAI-3S (Perfect Active)', 'Sent and still on mission \u2014 ongoing commission'], false, verbCw));
verbRows.push(makeRow(['\u03BA\u03B7\u03C1\u03CD\u03BE\u03B1\u03B9', 'to proclaim', 'V-AAN (Aorist Active)', 'Definitive public announcement'], false, verbCw));
verbRows.push(makeRow(['\u1F00\u03C0\u03BF\u03C3\u03C4\u03B5\u1FD6\u03BB\u03B1\u03B9', 'to send/release', 'V-AAN (Aorist Active)', 'Liberation \u2014 the same word as apostolos'], false, verbCw));
children.push(new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: verbCw, rows: verbRows }));

children.push(p(''));
children.push(p('\u1F00\u03C0\u03AD\u03C3\u03C4\u03B1\u03BB\u03BA\u03B5\u03BD (apestalken) is Perfect tense again. God "has sent" Jesus and Jesus remains sent. The mission is ongoing. And notice the key verb: \u03B5\u1F50\u03B1\u03B3\u03B3\u03B5\u03BB\u03AF\u03C3\u03B1\u03C3\u03B8\u03B1\u03B9 (to preach good news) is Middle voice \u2014 Jesus is personally, bodily involved in bringing this news. It is not passive transmission. He is the news.'));

// ─── SECTION 4: THE GOSPEL BY ITS EFFECTS ───────────────────────────────────
children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(heading('Section 4: The Gospel Defined by Its Effects', HeadingLevel.HEADING_1));

children.push(p([bold('Luke 7:22: '), run('"Go back and report to John what you have seen and heard: The blind receive sight, the lame walk, the lepers are cleansed, the deaf hear, the dead are raised, and the good news is preached to the poor."', { italics: true })]));

children.push(p("John the Baptist sends messengers from prison: \"Are you the one who is to come?\" Jesus does not answer with a doctrine. He does not say \"I am the Son of God\" or \"I died for your sins\" (he hasn't yet). He says: look at what is happening. The gospel is defined by what it produces."));

children.push(p([bold('The morphology of Luke 7:22 is stunning. '), run('Every verb describing the gospel\'s effects is Present tense: anablepousin (blind see, Present Active), peripatousin (lame walk, Present Active), katharizontai (lepers cleansed, Present Passive), akouousin (deaf hear, Present Active), egeirontai (dead are raised, Present Passive), euangelizontai (poor hear good news, Present Passive). The gospel is not a past event or a future hope. It is a set of present-tense happenings. It is what is going on right now.')]));

children.push(p([bold('The passive voices are the giveaway: '), run('katharizontai (lepers are cleansed \u2014 by whom?), egeirontai (dead are raised \u2014 by whom?), euangelizontai (good news is preached \u2014 by whom?). The divine passive again. God is the unnamed agent. The gospel is what God is currently doing through Jesus.')]));

children.push(p([bold('The OT echo: Psalm 146:8 (0.727). '), run('"The LORD opens the eyes of the blind, the LORD lifts those who are weighed down." And Psalm 113:7: "He raises the poor from the dust." Jesus\'s answer to John is a Psalm 146/113 composite \u2014 a list of what God does when God reigns. The gospel = the reign of God enacted in healing, liberation, and reversal.')]));

// ─── SECTION 5: THE GOSPEL OF THE KINGDOM ───────────────────────────────────
children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(heading('Section 5: "The Gospel of the Kingdom"', HeadingLevel.HEADING_1));

children.push(p("The phrase Jesus uses most is not \"gospel of salvation\" or \"gospel of grace\" but \"gospel of the kingdom\" (Matthew 4:23, 9:35, 24:14). The gospel and the kingdom are the same announcement. So what does Jesus DO when he preaches the gospel of the kingdom?"));

children.push(p([bold('The Matthew pattern: Teaching + Proclaiming + Healing. '), run('Matthew 4:23 and 9:35 are identical summary verses: "Jesus went throughout Galilee, teaching in their synagogues, preaching the gospel of the kingdom, and healing every disease and sickness among the people." The gospel has three components, not one: instruction (teaching), announcement (proclaiming), and demonstration (healing). Remove any one and it is no longer the gospel of the kingdom.')]));

children.push(p([bold('When Jesus commissions the twelve, the pattern continues. '), run('"As you go, preach this message: \'The kingdom of heaven is near.\' Heal the sick, raise the dead, cleanse the lepers, drive out demons" (Matt 10:7\u20138). And again: "He sent them to proclaim the kingdom of God and to heal the sick" (Luke 9:2). And: "Heal the sick who are there and tell them, \'The kingdom of God is near you\'" (Luke 10:9). The kingdom announcement and the healing are a single act. They cannot be separated.')]));

children.push(p("The gospel of the kingdom is not information about how to get saved. It is the announcement that God's reign has arrived, accompanied by its evidence: the sick are healed, the dead are raised, the oppressed are freed, and the poor hear good news."));

// ─── SECTION 6: CONCEPT CLUSTERING ──────────────────────────────────────────
children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(heading('Section 6: What Jesus\'s Gospel Clusters With', HeadingLevel.HEADING_1));

children.push(p('We built a centroid from all 11 programmatic gospel passages and measured its similarity to 16 theological concepts (our standard 13 plus Jubilee/Liberation, Healing/Wholeness, and Economic Reversal):'));

var ccCw = [700, 4200, 1200, 3260];
var ccRows = [makeRow(['Rank', 'Concept', 'Similarity', 'What This Means'], true, ccCw)];
var conceptInterps = {
    "cosmic_scope": "The gospel is for everyone, everywhere",
    "individual_salvation": "Personal response is present but embedded in larger frame",
    "jubilee_liberation": "Jubilee \u2014 Jesus's self-selected frame (Isaiah 61)",
    "divine_reign": "The kingdom has arrived",
    "restoration_after_judgment": "The exile is ending; restoration is here",
    "loyal_love": "Covenant faithfulness is the ground of the gospel",
    "economic_reversal": "The poor are lifted; the hungry are fed",
    "spirit_community": "The Spirit is the agent of the gospel",
    "union_participation": "You are inside the kingdom reality",
    "prophetic_justice": "Justice and righteousness are gospel content",
    "life_resurrection": "The dead are raised \u2014 already",
    "healing_wholeness": "Healing is not metaphor; it IS the gospel in action",
    "death_punishment": "Death is named but not the destination",
    "atonement_sacrifice": "Present but low \u2014 Jesus enacts atonement, doesn't teach it",
    "temple_sacred_space": "Sacred space is being redefined",
    "exile_lament": "The time of lament is ending",
};
data.concept_clustering.forEach(function(c, i) {
    ccRows.push(makeRow(['#' + (i+1), c.concept.replace(/_/g, ' '), c.similarity, conceptInterps[c.concept] || ''], false, ccCw));
});
children.push(new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: ccCw, rows: ccRows }));

children.push(p(''));
children.push(p([bold('The top 3 tell the story: Cosmic Scope, Individual Salvation, and Jubilee/Liberation. '), run('Jesus\'s gospel is simultaneously universal in scope, personally addressed, and concretely liberating. It is not abstract. It is not merely spiritual. It is cosmic in reach, personal in address, and physical in effect.')]));

children.push(p([bold('Atonement/Sacrifice ranks #14 of 16. '), run('Jesus almost never explains atonement mechanics. He enacts them. He heals, forgives, liberates, and dies \u2014 but he does not teach a theory of how the cross works. That comes later, in Paul. Jesus\'s gospel is the announcement and demonstration of the kingdom, not the theological explanation of the mechanism.')]));

// ─── SECTION 7: JESUS vs PAUL ───────────────────────────────────────────────
children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(heading('Section 7: Jesus\'s Gospel vs. Paul\'s Gospel', HeadingLevel.HEADING_1));

children.push(p([bold('Overall centroid similarity: 0.9171. '), run('When we compare Jesus\'s full gospel centroid (all 11 programmatic passages) to Paul\'s full euangelion centroid (all 71 Pauline gospel verses), the similarity is 91.7%. They are preaching the same gospel. The vocabulary is different, the register is different, but the semantic content is nearly identical.')]));

children.push(p([bold('Jesus vs. Paul\'s creed (1 Cor 15:3\u20134): 0.7896. '), run('Lower, because the creed is a compressed formula and Jesus\'s gospel is an enacted panorama. But still 79% similar \u2014 the creed and the kingdom announcement occupy the same theological territory.')]));

children.push(p(''));
children.push(p('The divergence is real but it is a divergence of genre, not content:'));

var compCw = [2000, 3680, 3680];
var compRows = [makeRow(['Element', 'Jesus\'s Gospel', 'Paul\'s Gospel'], true, compCw)];
compRows.push(makeRow(['Form', 'Enacted: healing, parable, liberation', 'Declared: creedal formula, argument'], false, compCw));
compRows.push(makeRow(['Key Verb Tense', 'Present: "the blind see right now"', 'Perfect: "Christ has been raised"'], false, compCw));
compRows.push(makeRow(['Self-Citation', 'Isaiah 61 (Jubilee)', 'Isaiah 53 + Hosea 6:2 (Suffering/Restoration)'], false, compCw));
compRows.push(makeRow(['Core Metaphor', 'Kingdom arriving', 'New creation begun'], false, compCw));
compRows.push(makeRow(['Death Emphasis', 'Anticipated but not yet central', 'Central: "died for our sins"'], false, compCw));
compRows.push(makeRow(['Atonement Mechanics', 'Not explained', 'Named but not dominant'], false, compCw));
compRows.push(makeRow(['Scale', 'Cosmic (all nations)', 'Cosmic (all creation)'], false, compCw));
compRows.push(makeRow(['Response Invited', '"Repent and believe"', '"Be reconciled"'], false, compCw));
children.push(new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: compCw, rows: compRows }));

children.push(p(''));
children.push(p('Jesus preaches the gospel in present tense: the kingdom is here, look at what is happening. Paul preaches the gospel in perfect tense: Christ has been raised, look at what has been accomplished. Jesus demonstrates; Paul explains. But they are demonstrating and explaining the same reality: God\'s reign has arrived, the old age is ending, the new creation is underway, and you are invited in.'));

// ─── SECTION 8: THE VERDICT ─────────────────────────────────────────────────
children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(heading('Section 8: What Jesus Meant by "The Gospel"', HeadingLevel.HEADING_1));

children.push(p([bold('1. The Jubilee has arrived. '), run('Jesus\'s self-selected proof text is Isaiah 61: liberation, healing, debt cancellation, the year of the Lord\'s favor. The gospel is Jubilee \u2014 the systemic reversal of oppression, poverty, sickness, and captivity. It is not a metaphor for spiritual freedom. It is actual freedom announced and enacted.')]));

children.push(p([bold('2. The kingdom of God is here. '), run('Every summary statement links gospel to kingdom: "preaching the gospel of the kingdom." The gospel is the news that God\'s reign has arrived on earth. When Jesus says "repent and believe the gospel" (Mark 1:15), the content of the gospel is: the kingdom is near. That is the good news. God is king. Everything changes.')]));

children.push(p([bold('3. The gospel is defined by what it produces. '), run('When asked "Are you the one?", Jesus says: look at the effects. Blind see. Lame walk. Dead are raised. Poor hear good news. The gospel is not information to be believed. It is a reality to be entered, and you know it is real because the evidence is visible, physical, and present-tense.')]));

children.push(p([bold('4. The gospel is enacted, not explained. '), run('Jesus never gives an atonement theory. He never explains penal substitution, moral influence, Christus Victor, or any other model. He heals, liberates, forgives, includes, and then dies. The explanation is left to others. Jesus IS the gospel. His life, death, and resurrection are the content, not a theory about the content.')]));

children.push(p([bold('5. The gospel is cosmic in scope and physical in delivery. '), run('"This gospel of the kingdom will be preached in all the world" (Matt 24:14). "The gospel must first be preached to all nations" (Mark 13:10). The scale is universal. And the delivery is bodily: healing, feeding, touching, raising. The gospel is not a disembodied message about going to heaven. It is God\'s reign arriving in bodies and communities.')]));

children.push(p(''));
children.push(p([
    run('The data says: Jesus\'s gospel is the announcement and demonstration that God\'s Jubilee reign has arrived on earth, visible in healed bodies, liberated captives, and reversed fortunes, addressed to all nations, and still in effect. It is 91.7% semantically identical to what Paul later preaches \u2014 but where Paul explains a completed event (perfect tense), Jesus enacts a present one (present tense). Same gospel. Different tense. Both cosmic. Neither one is "accept Jesus into your heart so you can go to heaven when you die."', { bold: true, italics: true }),
], { spacing: { before: 360, after: 360 } }));

// ─── BUILD ───────────────────────────────────────────────────────────────────
var doc = new Document({
    styles: {
        default: { document: { run: { font: 'Arial', size: 24 } } },
        paragraphStyles: [
            { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
              run: { size: 32, bold: true, font: 'Arial' }, paragraph: { spacing: { before: 240, after: 240 }, outlineLevel: 0 } },
            { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
              run: { size: 28, bold: true, font: 'Arial' }, paragraph: { spacing: { before: 180, after: 180 }, outlineLevel: 1 } },
        ]
    },
    sections: [{
        properties: {
            page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } },
        },
        headers: { default: new Header({ children: [new Paragraph({ children: [new TextRun({ text: 'What Did Jesus Mean by "The Gospel"?', italics: true, size: 18, font: 'Arial', color: '888888' })], alignment: AlignmentType.RIGHT })] }) },
        footers: { default: new Footer({ children: [new Paragraph({ children: [new TextRun({ text: 'Page ', size: 18, font: 'Arial', color: '888888' }), new TextRun({ children: [PageNumber.CURRENT], size: 18, font: 'Arial', color: '888888' })], alignment: AlignmentType.CENTER })] }) },
        children: children,
    }],
});

var outPath = 'What_Jesus_Meant_By_Gospel.docx';
Packer.toBuffer(doc).then(function(buffer) {
    fs.writeFileSync(outPath, buffer);
    console.log('Total elements: ' + children.length);
    console.log('Output: ' + outPath);
    console.log('Size: ' + (buffer.length / 1024).toFixed(1) + ' KB');
});
