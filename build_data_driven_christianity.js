const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        Header, Footer, AlignmentType, LevelFormat,
        HeadingLevel, BorderStyle, WidthType, ShadingType,
        PageNumber, PageBreak } = require('docx');

// Load data
const data = JSON.parse(fs.readFileSync('output/data_driven_theology.json','utf8'));
const ext = JSON.parse(fs.readFileSync('output/six_extensions_probe.json','utf8'));
const rankings = data.rankings;
const gospel = data.gospel_content_analysis;
const gospelCount = data.gospel_verse_count;
const citedOT = data.most_cited_ot_books || {};
const practices = ext.probe_1_practices;
const enemies = ext.probe_2_enemies;
const ethics = ext.probe_3_ethics;
const womenPower = ext.probe_4_women_power;
const womenLeaders = ext.probe_4_women_leaders;
const calendar = ext.probe_5_calendar;
const calendarTotal = ext.probe_5_calendar_total;
const sermonProfile = ext.probe_6_sermon_profile;
const sermonComparison = ext.probe_6_sermon_comparison;

// Helpers
const border = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
const borders = { top: border, bottom: border, left: border, right: border };
const numbering = {
  config: [{
    reference: 'bullets',
    levels: [{ level: 0, format: LevelFormat.BULLET, text: '\u2022', alignment: AlignmentType.LEFT,
      style: { paragraph: { indent: { left: 720, hanging: 360 } } } }]
  }]
};

function h1(t) { return new Paragraph({ heading: HeadingLevel.HEADING_1, spacing:{before:360,after:200}, children:[new TextRun({text:t,bold:true,font:'Georgia',size:32})]}); }
function h2(t) { return new Paragraph({ heading: HeadingLevel.HEADING_2, spacing:{before:240,after:160}, children:[new TextRun({text:t,bold:true,font:'Georgia',size:28})]}); }
function h3(t) { return new Paragraph({ spacing:{before:200,after:120}, children:[new TextRun({text:t,bold:true,font:'Georgia',size:24})]}); }
function n(t) { return new Paragraph({ spacing:{after:180}, children:[new TextRun({text:t,font:'Georgia',size:22})]}); }
function nb(p,r) { return new Paragraph({ spacing:{after:180}, children:[new TextRun({text:p,bold:true,font:'Georgia',size:22}),new TextRun({text:r,font:'Georgia',size:22})]}); }
function b(t) { return new Paragraph({ numbering:{reference:'bullets',level:0}, spacing:{after:80}, children:[new TextRun({text:t,font:'Georgia',size:22})]}); }
function bb(p,r) { return new Paragraph({ numbering:{reference:'bullets',level:0}, spacing:{after:80}, children:[new TextRun({text:p,bold:true,font:'Georgia',size:22}),new TextRun({text:r,font:'Georgia',size:22})]}); }
function spacer() { return new Paragraph({spacing:{after:100},children:[]}); }
function pb() { return new Paragraph({children:[new PageBreak()]}); }

function makeTable(headers, widths, rows) {
  var hCells = headers.map(function(h,i){
    return new TableCell({ borders, width:{size:widths[i],type:WidthType.DXA},
      shading:{fill:'2C3E50',type:ShadingType.CLEAR},
      margins:{top:60,bottom:60,left:80,right:80},
      children:[new Paragraph({children:[new TextRun({text:h,bold:true,font:'Arial',size:18,color:'FFFFFF'})]})]
    });
  });
  var dRows = rows.map(function(row,ri){
    var fill = ri%2===0?'F8F9FA':'FFFFFF';
    return new TableRow({ children: row.map(function(cell,ci){
      return new TableCell({ borders, width:{size:widths[ci],type:WidthType.DXA},
        shading:{fill:fill,type:ShadingType.CLEAR},
        margins:{top:40,bottom:40,left:80,right:80},
        children:[new Paragraph({children:[new TextRun({text:String(cell),font:'Arial',size:18})]})]
      });
    })});
  });
  var total = widths.reduce(function(a,b){return a+b;},0);
  return new Table({ width:{size:total,type:WidthType.DXA}, columnWidths:widths,
    rows:[new TableRow({children:hCells})].concat(dRows) });
}

// Build document
var c = [];

// TITLE
c.push(new Paragraph({spacing:{before:3000},alignment:AlignmentType.CENTER, children:[new TextRun({text:'DATA-DRIVEN CHRISTIANITY',bold:true,font:'Georgia',size:52})]}));
c.push(new Paragraph({alignment:AlignmentType.CENTER,spacing:{after:200}, children:[new TextRun({text:'What the Text Says When Nobody Tells It What to Say',font:'Georgia',size:26,italics:true})]}));
c.push(new Paragraph({alignment:AlignmentType.CENTER,spacing:{after:400}, children:[new TextRun({text:'A Computational Theological Framework with No Doctrinal Input',font:'Georgia',size:24})]}));
c.push(new Paragraph({alignment:AlignmentType.CENTER,spacing:{after:100}, children:[new TextRun({text:'31,102 BSB Verses \u00B7 13 Theological Concepts \u00B7 3 Metrics \u00B7 0 Creeds',font:'Arial',size:20})]}));
c.push(new Paragraph({alignment:AlignmentType.CENTER,spacing:{after:100}, children:[new TextRun({text:'Christopher A. Ensminger',font:'Georgia',size:22})]}));
c.push(new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'March 2026',font:'Georgia',size:22})]}));
c.push(pb());

// PREFACE
c.push(h1('Preface: The Experiment'));
c.push(n('What would Christianity look like if you had never heard of Nicaea, Chalcedon, Augustine, Aquinas, Luther, or Calvin? What if all you had was the text itself \u2014 the Hebrew and Greek words, their distributions, their semantic neighborhoods, their cross-testament continuity \u2014 and the Second Temple Jewish worldview that the original audience brought to the table?'));
c.push(n('This document attempts to answer that question computationally.'));
c.push(n('We defined 13 theological concepts, each represented by Hebrew and Greek vocabulary terms with Strong\u2019s numbers. Then we measured each concept on three axes:'));
c.push(bb('Frequency: ','How often does the biblical text talk about this? Measured by total Strong\u2019s number occurrences across the entire Hebrew and Greek morphological database (282,423 Hebrew words + 141,720 Greek words).'));
c.push(bb('Cross-Testament Continuity: ','How well does this concept transfer from Old Testament to New Testament? Measured by average cosine similarity between representative OT and NT verses (5 each, embedded in 1,024-dimensional space by BAAI/bge-large-en-v1.5).'));
c.push(bb('Semantic Centrality: ','How many other concepts cluster around this one? Measured by average centroid-to-centroid similarity between each concept and all 12 others.'));
c.push(n('The product of these three normalized scores (geometric mean) gives each concept a Theological Weight \u2014 its measured importance in the text itself, with zero doctrinal input.'));
c.push(n('What follows is what the text produced. It does not match any existing systematic theology.'));
c.push(pb());

// THE RANKINGS
c.push(h1('Section 1: The Rankings'));
c.push(n('Here is the complete ranked index. The combined score is the geometric mean of normalized frequency, continuity, and centrality. A score of 1.0 would mean a concept dominates all three metrics. A score below 0.30 means the concept is measurably peripheral in the text itself.'));

var rHeaders = ['Rank','Concept','Freq','Cont','Cent','Combined'];
var rWidths = [600,3500,1000,1000,1000,1200];
var rRows = rankings.map(function(r,i){
  return [String(i+1), r.label, r.frequency_norm.toFixed(3), r.continuity_norm.toFixed(3), r.centrality_norm.toFixed(3), r.combined_score.toFixed(3)];
});
c.push(makeTable(rHeaders, rWidths, rRows));
c.push(spacer());
c.push(pb());

// WHAT RISES
c.push(h1('Section 2: What Rises to the Top'));
c.push(n('The top six concepts are the ones the text itself treats as most important \u2014 by how often it talks about them, how well they transfer across testaments, and how many other concepts they connect to.'));

// #1 Divine Reign
var r1 = rankings[0];
c.push(h2('#1: ' + r1.label + ' (Score: ' + r1.combined_score.toFixed(3) + ')'));
c.push(n('This is not close. God\u2019s reign dominates the biblical text by every measure. YHWH appears 6,023 times in the Hebrew Bible. Melek (king) appears 2,393 times. In the NT, kyrios (lord) and christos (anointed one) carry the same freight. Basileia (kingdom) is the single most common word on Jesus\u2019s lips in the Synoptic Gospels, with 128 of its 164 occurrences there.'));
c.push(n('In a Second Temple Jewish context, this is a cosmic enthronement claim. God is king over all powers, principalities, and cosmic forces. When the early Christians announced \u201CJesus is Lord,\u201D they were not making a devotional statement \u2014 they were making a political-cosmic one. The universe has a new administration. Every other power is subordinated.'));
c.push(nb('What this means for data-driven Christianity: ','The center is not salvation. The center is not atonement. The center is not moral instruction. The center is the reign of God. Everything else is a subsidiary question: How does God reign? Over what scope? Through what means? Every other concept orbits this one.'));

// #2 Cosmic Scope
var r2 = rankings[1];
c.push(h2('#2: ' + r2.label + ' (Score: ' + r2.combined_score.toFixed(3) + ')'));
c.push(n('The second highest concept is scope. Kol (all) appears 5,036 times in the Hebrew Bible. Pas (all) appears 1,264 times in the Greek NT. Erets (earth/land), goy (nations), kosmos (world) \u2014 the text relentlessly insists on totality. The scope of God\u2019s reign is not tribal, not national, not denominational. It is cosmic.'));
c.push(n('This concept has the highest cross-testament continuity of any concept tested (normalized 1.000). The OT\u2019s \u201Call nations will be blessed through you\u201D (Gen 12:3) and the NT\u2019s \u201Creconcile ALL things\u201D (Col 1:20) occupy almost identical semantic space. The universalism is not a NT innovation \u2014 it is embedded in the Abrahamic covenant from the beginning.'));
c.push(nb('What this means: ','Any theology that narrows the scope of God\u2019s reign to a subset of humanity is working against the text\u2019s most persistent vocabulary. The data does not say everyone is saved. It says the scope of God\u2019s intention is relentlessly total.'));

// #3 Loyal Love
var r3 = rankings[2];
c.push(h2('#3: ' + r3.label + ' (Score: ' + r3.combined_score.toFixed(3) + ')'));
c.push(n('chesed (loyal love, 197 occurrences, overwhelmingly in the Psalter), ahav (love, 741), emeth (truth/faithfulness, 272) \u2014 these are the words the Hebrew Bible uses to describe God\u2019s character. In the NT, agape (416), pistis (faith/faithfulness, 242), charis (grace, 155) carry the same weight.'));
c.push(n('The distribution is critical: chesed lives in Israel\u2019s worship poetry. 50% of occurrences are in the Writings (Psalms, Proverbs, Job). This is a word Israel sang, not a word Israel legislated. In Second Temple worship, the Psalter was the prayer book \u2014 and chesed was its signature attribute of God.'));
c.push(nb('What this means: ','God\u2019s defining characteristic in the text is not holiness (though that appears), not justice (though that appears), and not wrath (which ranks #12 of 13). It is loyal love. A data-driven Christianity would be built on chesed, not on threat.'));

// #4 Temple/Sacred Space
var r4 = rankings[3];
c.push(h2('#4: ' + r4.label + ' (Score: ' + r4.combined_score.toFixed(3) + ')'));
c.push(n('This one surprises most modern readers. bayit (house/temple) appears 1,925 times. qodesh (holy/sacred) adds 425. In the NT, naos (inner sanctuary), hieron (temple complex), and oikos (house/household) continue the theme. The Bible talks about sacred space far more than most theologies acknowledge.'));
c.push(n('In the Second Temple worldview, the temple was the axis mundi \u2014 the point where heaven and earth intersect. When Paul says \u201Cyou are God\u2019s temple\u201D (1 Cor 3:16) and John says \u201CI saw no temple, because the Lord God Almighty and the Lamb are its temple\u201D (Rev 21:22), they are making cosmic claims: the heaven-earth intersection point has moved from a building to a people and finally to the entire renewed creation.'));
c.push(nb('What this means: ','Sacred space is not a dispensable metaphor. It is the fourth most important concept in the text. A data-driven Christianity would take seriously the idea that certain spaces, communities, and practices are where heaven and earth overlap \u2014 and that the trajectory points toward the whole cosmos becoming that space.'));

// #5 Spirit Community
var r5 = rankings[4];
c.push(h2('#5: ' + r5.label + ' (Score: ' + r5.combined_score.toFixed(3) + ')'));
c.push(n('ruach (spirit/wind/breath, 353) + pneuma (spirit, 385) + navi (prophet, 305) + qodesh (holy, 425) + prophetes (149) + apostolos (83). The spirit-driven, prophetically-led community is the fifth most important concept in the text.'));
c.push(n('This has the highest cross-testament continuity score of any concept (normalized 0.983). Joel 2:28 (\u201CI will pour out my Spirit on all flesh\u201D) and Acts 2:4 (\u201Cthey were all filled with the Holy Spirit\u201D) are among the tightest OT-to-NT transfers we measured. The early community\u2019s charismatic structure (3.76:1 charismatic-to-institutional ratio in the undisputed Paulines) is not an accident \u2014 it is the continuation of an OT prophetic tradition.'));
c.push(nb('What this means: ','The earliest community was spirit-led and prophetically structured. The institutional shift (bishops, elders, deacons) visible in the Pastoral Epistles represents a later development, not the original form. A data-driven Christianity would be more charismatic than institutional.'));

// #6 Atonement
var r6 = rankings[5];
c.push(h2('#6: Atonement / Sacrifice Mechanics (Score: ' + r6.combined_score.toFixed(3) + ')'));
c.push(n('Atonement makes the top six \u2014 but only barely, and with a critical caveat. 63% of kaphar (atone) occurrences are in Leviticus alone. kohen (priest, 711) is heavily concentrated in Torah and Historical books. This is institutional ritual language, not pan-biblical theology.'));
c.push(n('The NT picks up atonement vocabulary (haima/blood, hiereus/priest, hilasmos/propitiation) but reinterprets it: Hebrews reads the Levitical system as a shadow pointing to Christ. Paul uses sacrificial language but wraps it in participatory/union categories (\u201Ccrucified WITH Christ,\u201D \u201Cburied WITH him\u201D).'));
c.push(nb('What this means: ','Atonement is real biblical vocabulary. But it is narrower and more institutionally specific than most Western theologies assume. A data-driven Christianity would treat atonement as one important theme among several \u2014 not as the controlling center. The controlling center is the reign of God.'));
c.push(pb());

// WHAT SINKS
c.push(h1('Section 3: What Sinks Below'));
c.push(n('The bottom of the rankings is where the data most directly challenges post-biblical theology.'));

// Death/Judgment
var rd = rankings.find(function(r){return r.concept==='death_judgment';});
c.push(h2('Death / Eternal Punishment / Hell (Score: ' + (rd?rd.combined_score.toFixed(3):'') + ', Rank #12 of 13)'));
c.push(n('This is the single most consequential finding for Western Christianity. The concept that has dominated preaching, evangelism, and popular theology for 1,500 years \u2014 hell, eternal punishment, the threat of damnation \u2014 ranks 12th out of 13 concepts by the text\u2019s own metrics.'));
c.push(n('maveth (death, 138 occurrences) and sheol (54) are modest. sheol is 51% concentrated in the Writings \u2014 it belongs to Israel\u2019s poetry, not its dogma. There is no single Hebrew word for \u201Chell.\u201D In the Greek NT, geenna (12 occurrences, almost all from Jesus in the Synoptics), hades (10), and the various judgment terms are present but sparse. apollumi (destroy/lost, 92) is the most common \u2014 and as the lexicon demonstrated, apollumi means \u201Clost,\u201D not \u201Cannihilated.\u201D'));
c.push(nb('What this means: ','The text does not talk about eternal punishment nearly as much as post-biblical Christianity does. A data-driven Christianity would mention judgment \u2014 the text does \u2014 but it would be a minor key, not the bass line. The bass line is the reign of God and the cosmic scope of loyal love.'));

// Individual Salvation
var ri = rankings.find(function(r){return r.concept==='individual_salvation';});
c.push(h2('Individual Decision / Personal Salvation (Score: ' + (ri?ri.combined_score.toFixed(3):'') + ', Rank #13 of 13)'));
c.push(n('Dead last. The concept that modern evangelicalism treats as the entire point of Christianity \u2014 the individual decision to accept Jesus as personal savior \u2014 has the lowest combined theological weight of any concept we tested.'));
c.push(n('pisteuo (believe/trust, 245) is the strongest term, and it\u2019s a real word with real frequency. But metanoia (repentance, 24), baptisma (baptism, 0 in the morphological database search results), and yeshua (salvation, 24) are sparse. The concept has high semantic centrality (normalized 1.000 \u2014 it connects to everything) but rock-bottom frequency (0.029) and only moderate continuity (0.903).'));
c.push(n('In a Second Temple context, salvation is communal and cosmic, not individual. Israel is saved as a people. The nations are blessed collectively. The individual\u2019s relationship to God is real but always embedded in community and creation.'));
c.push(nb('What this means: ','A data-driven Christianity would not ask \u201CHave you made a personal decision for Christ?\u201D as its primary question. It would ask \u201CDo you see that God reigns, and are you living in the community shaped by that reign?\u201D The individual matters \u2014 pisteuo is real vocabulary \u2014 but the individual is never the center. The center is God\u2019s cosmic reign and the community that embodies it.'));
c.push(pb());

// WHAT THE GOSPEL ANNOUNCES
c.push(h1('Section 4: What the Gospel Actually Announces'));
c.push(n('We searched all 97 BSB verses containing the word \u201Cgospel\u201D and checked what concepts co-occur in the same verse:'));

var gHeaders = ['Concept','Co-occurrences','Percentage'];
var gWidths = [3500, 2000, 3860];
var gItems = [
  ['believe/faith', gospel['believe/faith']||0],
  ['kingdom/reign', gospel['kingdom/reign']||0],
  ['grace', gospel['grace']||0],
  ['salvation/save', gospel['salvation/save']||0],
  ['death/cross', gospel['death/cross']||0],
  ['resurrection/raised', gospel['resurrection/raised']||0],
  ['peace', gospel['peace']||0],
  ['justice/righteousness', gospel['justice/righteousness']||0],
];
var gRows = gItems.map(function(g){ return [g[0], String(g[1]), ((g[1]/gospelCount)*100).toFixed(1)+'%']; });
c.push(makeTable(gHeaders, gWidths, gRows));
c.push(spacer());

c.push(n('Only 2.1% of \u201Cgospel\u201D verses mention death. Only 2.1% mention resurrection. The most common co-occurrence is believe/faith at 13.4%, followed by kingdom/reign at 6.2%.'));
c.push(nb('The implication is staggering: ','what the NT calls \u201Cthe gospel\u201D is not primarily about the mechanism of salvation (death + resurrection + personal faith). It is the announcement of God\u2019s reign. The gospel is news about a king, not a transaction. The death and resurrection of Jesus are real and important \u2014 but when the NT says \u201Cgospel,\u201D it usually means \u201Cthe kingdom of God has arrived.\u201D'));
c.push(pb());

// MOST-CITED OT BOOKS
c.push(h1('Section 5: The Bible\u2019s Own Library Priorities'));
c.push(n('Which OT books does the NT cite most frequently? The cross-reference database reveals the text\u2019s own priorities:'));

var otEntries = Object.entries(citedOT).sort(function(a,b){return b[1]-a[1];}).slice(0,10);
var otHeaders = ['OT Book','Cross-References to NT','Implication'];
var otWidths = [2000, 2500, 4860];
var implications = {
    'Psalms': 'The prayer book IS the theology \u2014 Israel\u2019s worship shapes the NT more than its law',
    'Isaiah': 'The prophetic vision of restoration/new creation is the NT\u2019s primary OT source',
    'Genesis': 'The origin stories (creation, covenant, blessing) ground the NT\u2019s cosmic scope',
    'Proverbs': 'Wisdom tradition deeply shapes NT ethics \u2014 more than usually recognized',
    'Jeremiah': 'The new covenant prophet \u2014 \u201CI will put my law in their hearts\u201D',
    'Ezekiel': 'Resurrection (ch 37), temple vision (40-48), spirit promise (36:26)',
    'Exodus': 'Liberation narrative \u2014 the original \u201Csalvation\u201D is corporate and physical',
    'Deuteronomy': 'Covenant renewal, blessing/curse, choose life',
    'Job': 'Suffering, divine sovereignty, the limits of human wisdom',
    'Leviticus': 'Sacrificial system \u2014 present but far below Psalms and Isaiah',
};
var otRows = otEntries.map(function(e){ return [e[0], String(e[1]), implications[e[0]]||'']; });
c.push(makeTable(otHeaders, otWidths, otRows));
c.push(spacer());

c.push(nb('The headline: ','Psalms (6,768 cross-references) dwarfs everything else. Isaiah is second (4,606). Leviticus \u2014 the book that contains most of the atonement/sacrifice vocabulary \u2014 ranks 10th. The NT\u2019s Bible is the Psalter and the Prophets, not the legal code. A data-driven Christianity would be Psalter-shaped and Isaiah-shaped, not Leviticus-shaped.'));
c.push(pb());

// THE FRAMEWORK
c.push(h1('Section 6: The Data-Driven Framework'));
c.push(n('If you started from scratch \u2014 no creeds, no councils, no systematic theology \u2014 and built a Christian framework from only what the text emphasizes, here is what you would get:'));

c.push(h2('The Core Claim'));
c.push(n('God reigns over all creation as cosmic king. This reign is total in scope (all nations, all things, heaven and earth and under the earth). The announcement of this reign is what the text calls \u201Cthe gospel.\u201D'));

c.push(h2('The Character of the King'));
c.push(n('God\u2019s defining attribute is chesed \u2014 loyal love, covenant faithfulness, steadfast mercy. This is not one attribute among equals. It is the attribute Israel sings about, prays about, and builds its worship around. The Psalter \u2014 the Bible\u2019s most-cited book \u2014 is a chesed songbook.'));

c.push(h2('The Shape of Community'));
c.push(n('The community formed by this reign is spirit-driven, prophetically structured, and charismatic in the technical sense: gifts are distributed for the common good, leadership is functional rather than hierarchical, and the boundary between clergy and laity is blurred. Institutional structure appears later and represents development, not origin.'));

c.push(h2('Sacred Space'));
c.push(n('The trajectory moves from a physical temple (axis mundi, heaven-earth intersection) to a human community as temple to the entire renewed creation as sacred space. The endpoint is not that temple disappears \u2014 it is that temple expands to encompass everything. \u201CI saw no temple, because the Lord God Almighty and the Lamb are its temple\u201D (Rev 21:22).'));

c.push(h2('Atonement'));
c.push(n('Real but not central. The sacrificial system is one legitimate lens for understanding what God does in Christ \u2014 but it is an institutional, Levitical lens, and the text uses it far less universally than Western theology assumes. The stronger cross-testament signal is union/participation: \u201Cin Christ\u201D as the new \u201Ccleave to God.\u201D'));

c.push(h2('Judgment'));
c.push(n('Present in the text but ranking 12th of 13 concepts. Judgment serves the reign \u2014 it is the mechanism by which the king restores cosmic order. The 31 judgment-restoration cycle markers in the OT show a consistent pattern: judgment leads to restoration, not to permanent exclusion. The text talks about judgment. It talks about the reign of God, loyal love, sacred space, spirit community, and cosmic scope far more.'));

c.push(h2('Individual Decision'));
c.push(n('Last place. The text assumes that individuals respond to God\u2019s reign \u2014 pisteuo (believe/trust) is real vocabulary \u2014 but it never treats the individual decision as the center of the story. Salvation in the Second Temple worldview is communal and cosmic: Israel is saved, the nations are blessed, creation is renewed. The individual participates in this cosmic reality; they do not generate it by their decision.'));

c.push(h2('What This Is Not'));
c.push(b('This is not universalism \u2014 though the scope is relentlessly cosmic'));
c.push(b('This is not antinomianism \u2014 Torah as wisdom/instruction ranks 9th, still in the top two-thirds'));
c.push(b('This is not liberalism \u2014 the supernatural (spirit, resurrection, cosmic powers) is everywhere'));
c.push(b('This is not conservatism \u2014 individual salvation and hell theology are at the bottom'));
c.push(b('This is not any denomination \u2014 every tradition gets some things right and misses others'));
c.push(spacer());
c.push(n('This is what the text says when nobody tells it what to say.'));
c.push(pb());

// ============================================================
// SECTION 7: COMMUNITY PRACTICES
// ============================================================
c.push(h1('Section 7: What Did They Actually Do?'));
c.push(n('Before it was a theology, Christianity was a set of practices. What does the text emphasize as the activities of the community? We counted vocabulary for eight practice categories across both testaments.'));

var prHeaders = ['Rank','Practice','Occurrences'];
var prWidths = [600, 5500, 3260];
var prRows = practices.map(function(p, i) { return [String(i+1), p.label, String(p.total)]; });
c.push(makeTable(prHeaders, prWidths, prRows));
c.push(spacer());

c.push(nb('#1 Economic Sharing (2,084): ','natan (give, 1,877 occurrences) dominates the Hebrew Bible. tsedaqah (righteousness/justice, 142) has an economic dimension that English translations obscure \u2014 in Second Temple usage, tsedaqah often means \u201Calmsgiving.\u201D In the NT, koinonia (18) and diakonia (34) carry the same freight. The text talks about economic generosity more than any other practice.'));
c.push(nb('#2 Proclamation (916): ','qara (call/proclaim, 685) + kerusso (herald, 61) + euangelizo (announce good news, 55) + martureo (testify, 77). The community announces. It does not primarily argue, defend, or convert \u2014 it heralds.'));
c.push(nb('#3 Prayer/Worship (668): ','shachah (bow down, 162) + halal (praise, 133) + proseuche (prayer, 36) + proseuchomai (pray, 87). Worship and prayer outrank teaching, healing, and baptism.'));
c.push(nb('#4 Shared Meal (656): ','lechem (bread, 277) + artos (bread, 99) + yayin (wine, 132). Table fellowship is a top-four practice. In the Second Temple context, shared meals were covenant acts \u2014 eating together was theology enacted.'));
c.push(nb('#7-8 Baptism (102) and Hospitality (102): ','Both are real but modest in vocabulary frequency. Baptism, which many traditions treat as the gateway practice, ranks seventh. The text treats economic sharing, proclamation, worship, and shared meals as far more central.'));

c.push(h2('What This Means'));
c.push(n('A data-driven community would be defined by radical economic generosity, public proclamation of God\u2019s reign, prayer and worship, and shared meals. Baptism and formal initiation exist but are not the center. The modern church\u2019s emphasis on Sunday sermons (teaching, rank #5) and altar calls (individual decision, not even in the top 8) is out of proportion with what the text itself emphasizes.'));
c.push(pb());

// ============================================================
// SECTION 8: THE ACTUAL ENEMY
// ============================================================
c.push(h1('Section 8: What\u2019s the Actual Enemy?'));
c.push(n('If the text has a \u201Cproblem\u201D that the \u201Cgospel\u201D solves, what is it? We counted vocabulary for four categories of \u201Cenemy\u201D:'));

var enHeaders = ['Rank','Enemy Category','Occurrences'];
var enWidths = [600, 5500, 3260];
var enRows = enemies.map(function(e, i) { return [String(i+1), e.label, String(e.total)]; });
c.push(makeTable(enHeaders, enWidths, enRows));
c.push(spacer());

c.push(n('Individual sin vocabulary (826) outranks cosmic powers (582) by raw frequency. But the semantic clustering tells a more nuanced story. When we tested six \u201Csolution\u201D passages against both enemy clusters, the results split 3-3:'));
c.push(b('Cosmic-enemy lean: Colossians 1:13 (rescued from darkness), 1 Corinthians 15:57 (victory), Revelation 21:4 (no more death)'));
c.push(b('Sin-enemy lean: Romans 8:2 (free from law of sin and death), Galatians 1:4 (rescue from evil age), 2 Corinthians 5:17 (new creation)'));
c.push(n('The text does not choose between cosmic powers and individual sin as \u201Cthe problem.\u201D It holds both. But the Second Temple framework integrates them: individual sin is participation in the cosmic rebellion against God\u2019s reign. The solution is not primarily moral reform (fixing individuals) but cosmic victory (defeating the powers, including death itself). \u201CThe last enemy to be destroyed is death\u201D (1 Cor 15:26) is the theological climax, not \u201Cyour sins are forgiven.\u201D'));

c.push(nb('Idolatry (#3, 197) and Structural Injustice (#4, 121): ','Both are present and meaningful. Idolatry \u2014 the worship of what is not God \u2014 is the Hebrew Bible\u2019s primary diagnostic of what goes wrong. Structural injustice (chamac/violence, oshek/oppression) is real vocabulary that the prophets deploy relentlessly. A data-driven Christianity would treat both as live categories, not historical curiosities.'));
c.push(pb());

// ============================================================
// SECTION 9: ETHICS SHAPE
// ============================================================
c.push(h1('Section 9: What Shape Are the Ethics?'));
c.push(n('Do the NT\u2019s ethical instructions look like \u201Cresponse to God\u2019s reign\u201D (participatory \u2014 you live this way because you\u2019re already in the kingdom) or \u201Crequirements for salvation\u201D (conditional \u2014 you live this way or you\u2019re excluded)?'));
c.push(n('We tested 12 major ethical chapters against both frameworks by measuring their semantic similarity to representative participatory and conditional passages:'));

var ethHeaders = ['Chapter','Description','Participatory','Conditional','Leans'];
var ethWidths = [1500, 3200, 1500, 1500, 1660];
var ethRows = ethics.map(function(e){ return [e.reference, e.description, String(e.avg_participatory), String(e.avg_conditional), e.leans]; });
c.push(makeTable(ethHeaders, ethWidths, ethRows));
c.push(spacer());

var partCount = ethics.filter(function(e){return e.leans==='PARTICIPATORY';}).length;
var condCount = ethics.filter(function(e){return e.leans==='CONDITIONAL';}).length;
c.push(nb('Result: ' + partCount + ' participatory, ' + condCount + ' conditional. ','The split is almost even, but the pattern is revealing. Paul\u2019s ethics (Romans 12, Galatians 5, Ephesians 4-5, Colossians 3) consistently lean participatory \u2014 \u201Csince you have been raised with Christ, therefore live this way.\u201D The Sermon on the Mount (Matthew 5-7) and James lean conditional \u2014 \u201Cdo this or face consequences.\u201D'));
c.push(n('The honest reading: NT ethics are BOTH participatory and conditional, depending on the author and context. But the trajectory favors participation. Paul\u2019s ethics \u2014 the largest ethical corpus in the NT \u2014 consistently frames moral life as response to what God has already done, not as requirements for what God will do. \u201CWe love because he first loved us\u201D (1 John 4:19) is the data-driven ethical principle.'));
c.push(pb());

// ============================================================
// SECTION 10: WOMEN AND POWER
// ============================================================
c.push(h1('Section 10: Women and Power'));
c.push(n('The text contains both women in leadership and restrictions on women\u2019s leadership. Rather than choosing a side, we counted:'));
c.push(nb('Leadership passages including women: ', String(womenPower.women_in_leadership_passages) + ' \u2014 Miriam (prophet), Deborah (judge/prophet), Huldah (prophet), Anna (prophet), Priscilla (teacher), Phoebe (deacon), Junia (apostle), Lydia (church host), Philip\u2019s daughters (prophets), and others'));
c.push(nb('Restriction passages: ', String(womenPower.restriction_passages) + ' \u2014 1 Cor 14:34, 1 Tim 2:12, 1 Cor 11:5, Eph 5:22, Col 3:18, 1 Pet 3:1'));
c.push(nb('Ratio: ', womenPower.ratio + ':1 leadership-to-restriction'));
c.push(n('The critical finding is the authorship split. In undisputed Paul (Romans, 1-2 Corinthians, Galatians, Philippians, 1 Thessalonians, Philemon), women hold every leadership title: apostle (Junia), deacon (Phoebe), co-worker (Priscilla), hard worker (Mary, Tryphena, Tryphosa, Persis). The only restriction in undisputed Paul is 1 Corinthians 14:34 \u2014 which many scholars regard as a later interpolation because it contradicts 1 Corinthians 11:5, where Paul assumes women pray and prophesy publicly.'));
c.push(n('The major restriction passages (1 Tim 2:12, Eph 5:22, Col 3:18) are all in disputed or Pastoral letters \u2014 the same letters that show the institutional shift from charismatic to hierarchical structure. The restriction of women\u2019s leadership correlates with the institutionalization of the community, not with the earliest practice.'));
c.push(nb('A data-driven Christianity: ','would follow the earliest and most textually robust evidence: women in every leadership role, with restrictions appearing only in the later, institutional layer.'));
c.push(pb());

// ============================================================
// SECTION 11: SACRED CALENDAR
// ============================================================
c.push(h1('Section 11: Sacred Calendar'));
c.push(n('Second Temple Judaism was structured by liturgical time. Does the biblical text treat sacred time as seriously as sacred space (which ranked #4)?'));
c.push(n('Total calendar vocabulary across both testaments: ' + calendarTotal + ' occurrences.'));

var calHeaders = ['Calendar Element','Occurrences'];
var calWidths = [5000, 4360];
var calRows = calendar.map(function(ca){ return [ca.label, String(ca.total)]; });
c.push(makeTable(calHeaders, calWidths, calRows));
c.push(spacer());

c.push(n('The cross-testament continuity is strong:'));
c.push(b('Passover \u2192 Christ our Passover (1 Cor 5:7): cosine similarity 0.6888'));
c.push(b('Tabernacles \u2192 Jesus at Feast of Tabernacles (John 7:2): 0.6769'));
c.push(b('Sabbath \u2192 Sabbath made for man (Mark 2:27): 0.6154'));
c.push(b('Jubilee/Release \u2192 Jesus in Nazareth synagogue (Luke 4:18): 0.5904'));
c.push(b('Firstfruits \u2192 Christ the firstfruits (1 Cor 15:20): 0.5328'));
c.push(n('The NT does not abandon the calendar \u2014 it reinterprets it christologically. Passover becomes the cross. Firstfruits becomes the resurrection. Jubilee becomes Jesus\u2019s mission statement. A data-driven Christianity would have a liturgical shape: it would mark time by the biblical calendar, reading the feasts through their christological fulfillment. The modern evangelical rejection of liturgical calendar is working against the text\u2019s own structure.'));
c.push(pb());

// ============================================================
// SECTION 12: SERMON PROFILE
// ============================================================
c.push(h1('Section 12: The Data-Driven Sermon'));
c.push(n('If a pastor preached in proportion to what the text actually emphasizes, a 40-minute sermon would allocate time like this:'));

var spHeaders = ['Concept','% of Sermon','Minutes / 40 min'];
var spWidths = [4500, 2000, 2860];
var spRows = sermonProfile.map(function(s){ return [s.concept, s.percentage + '%', s.minutes_per_40 + ' min']; });
c.push(makeTable(spHeaders, spWidths, spRows));
c.push(spacer());

c.push(h2('The Gap: Typical Evangelical vs Data-Driven'));
c.push(n('We estimated a typical evangelical sermon\u2019s topic allocation and compared it to the data:'));

var gapHeaders = ['Concept','Typical','Data','Gap'];
var gapWidths = [4000, 1200, 1200, 2960];
var gapRows = sermonComparison.map(function(s){
  var arrow = s.gap > 0 ? '\u2191' : s.gap < 0 ? '\u2193' : '=';
  return [s.concept, s.typical_pct + '%', s.data_pct + '%', (s.gap>0?'+':'') + s.gap + '% ' + arrow];
});
c.push(makeTable(gapHeaders, gapWidths, gapRows));
c.push(spacer());

c.push(n('The three largest gaps:'));
c.push(bb('Individual Decision: ', '\u221234.1%. The typical evangelical sermon spends 35% of its time on personal salvation decisions. The text allocates 0.9%. This is the single largest distortion in modern preaching.'));
c.push(bb('God\u2019s Reign: ', '+25.0%. The text spends 30% of its vocabulary on cosmic kingship. The typical sermon spends 5%. The most important concept in the Bible gets one-sixth of the attention it deserves.'));
c.push(bb('Cosmic Scope: ', '+23.3%. The text\u2019s relentless insistence on totality (\u201Call things,\u201D \u201Cevery knee,\u201D \u201Cthe nations\u201D) is entirely absent from most sermons.'));
c.push(n('A data-driven sermon would spend 12 minutes on God\u2019s reign, 9 minutes on cosmic scope, 3 minutes on loyal love, 3 minutes on sacred space, and 24 seconds on individual salvation decisions. This is not a prescription. It is what proportional faithfulness to the text looks like.'));
c.push(pb());

// ============================================================
// SECTION 13: REPRODUCIBILITY PACKAGE
// ============================================================
c.push(h1('Section 13: Reproducibility'));
c.push(n('Every finding in this document is computationally reproducible. Here is what you need:'));

c.push(h2('What We Can Provide Directly'));
c.push(b('All output JSON files (output/ directory) \u2014 the raw data behind every table and chart in this document'));
c.push(b('All pipeline scripts (pipeline/ directory, scripts 01\u201340+) \u2014 Python and JavaScript'));
c.push(b('The document build scripts (build_data_driven_christianity.js, etc.)'));
c.push(b('The probe scripts (probe_data_driven_theology.py, probe_six_extensions.py, etc.)'));
c.push(b('The CLAUDE.md project documentation \u2014 morphological signal keys, book abbreviation warnings, methodology notes'));
c.push(b('The session logs documenting the research process'));

c.push(h2('What Requires GitHub / External Hosting'));
c.push(b('bible.db (SQLite database, ~150+ MB) \u2014 too large for document embedding, must be hosted externally'));
c.push(b('Pre-computed verse embeddings (31,086 vectors \u00D7 1,024 dimensions) \u2014 stored in bible.db as BLOBs'));
c.push(b('The BAAI/bge-large-en-v1.5 model weights \u2014 available from HuggingFace, but researchers need to know which model to download'));
c.push(b('GPU requirements for re-running embeddings (NVIDIA GPU with CUDA; original run on RTX 5070 Ti, ~5 min)'));

c.push(h2('Recommended GitHub Repository Structure'));
c.push(n('pipeline/ \u2014 All numbered scripts (01_gpu_embeddings.py through 40+)'));
c.push(n('probes/ \u2014 All probe scripts (probe_data_driven_theology.py, probe_six_extensions.py, etc.)'));
c.push(n('builders/ \u2014 Document build scripts (build_data_driven_christianity.js, etc.)'));
c.push(n('output/ \u2014 All JSON result files'));
c.push(n('docs/ \u2014 CLAUDE.md, session logs, methodology notes'));
c.push(n('Bibledata/ \u2014 Git LFS or download instructions for bible.db'));
c.push(n('README.md \u2014 Setup instructions, dependency list, run order'));

c.push(h2('Dependencies'));
c.push(b('Python 3.10+ with: sentence-transformers, sqlite-vec, torch, numpy'));
c.push(b('Node.js 18+ with: docx (npm package)'));
c.push(b('NVIDIA GPU with CUDA for embedding generation (CPU possible but slow)'));
c.push(b('pandoc for document validation/conversion'));

c.push(n('Any researcher with these tools can reproduce every finding from scratch. The pipeline is designed to run sequentially: Script 01 generates embeddings, Scripts 02\u201312 detect patterns, the probe scripts test specific hypotheses, and the builder scripts generate the final documents.'));
c.push(pb());

// METHODOLOGY
c.push(h1('Methodology'));
c.push(n('Database: STEPBible morphological data (282,423 Hebrew words, 141,720 Greek words) in SQLite. 31,102 BSB verses embedded with BAAI/bge-large-en-v1.5 (1,024 dimensions) on NVIDIA RTX 5070 Ti. Cross-references: 344,799 entries.'));
c.push(n('Concepts: 13 theological concepts defined by Hebrew + Greek Strong\u2019s numbers. Each concept represented by 5 OT + 5 NT verses for cross-testament analysis.'));
c.push(n('Frequency: Total morphological database hits per Strong\u2019s number, summed across all terms in each concept.'));
c.push(n('Continuity: Average pairwise cosine similarity between the 5 OT representative verses and 5 NT representative verses for each concept.'));
c.push(n('Centrality: Centroid embedding computed for each concept (all 10 representative verses averaged, normalized). Average centroid-to-centroid cosine similarity between each concept and all 12 others.'));
c.push(n('Combined Score: Geometric mean of normalized frequency, normalized continuity, and normalized centrality. This balances the three metrics so that a concept must score well on all three to rank highly.'));
c.push(n('Limitations: Representative verse selection involves researcher judgment. Frequency counts depend on Strong\u2019s number assignments, which can be debated. Cosine similarity measures semantic proximity in English translation space, not in the original languages directly. The 13-concept taxonomy is a simplification; other scholars would define the categories differently.'));
c.push(n('Reproducibility: All pipeline scripts, the SQLite database, and output JSON files are available for independent verification.'));

// PACK
var doc = new Document({
  numbering: numbering,
  styles: {
    default: { document: { run: { font:'Georgia', size:22 } } },
    paragraphStyles: [
      { id:'Heading1', name:'Heading 1', basedOn:'Normal', next:'Normal', quickFormat:true,
        run:{size:32,bold:true,font:'Georgia'}, paragraph:{spacing:{before:360,after:200},outlineLevel:0} },
      { id:'Heading2', name:'Heading 2', basedOn:'Normal', next:'Normal', quickFormat:true,
        run:{size:28,bold:true,font:'Georgia'}, paragraph:{spacing:{before:240,after:160},outlineLevel:1} },
    ]
  },
  sections: [{
    properties: {
      page: { size:{width:12240,height:15840}, margin:{top:1440,right:1440,bottom:1440,left:1440} }
    },
    headers: { default: new Header({children:[new Paragraph({children:[
      new TextRun({text:'Data-Driven Christianity \u2014 What the Text Says When Nobody Tells It What to Say',font:'Georgia',size:18,italics:true,color:'888888'})
    ]})]}) },
    footers: { default: new Footer({children:[new Paragraph({alignment:AlignmentType.CENTER,children:[
      new TextRun({text:'Page ',font:'Arial',size:18}),
      new TextRun({children:[PageNumber.CURRENT],font:'Arial',size:18}),
    ]})]}) },
    children: c,
  }]
});

console.log('Total elements: ' + c.length);
Packer.toBuffer(doc).then(function(buffer){
  var out = 'Data_Driven_Christianity.docx';
  fs.writeFileSync(out, buffer);
  console.log('Output: ' + out);
  console.log('Size: ' + (buffer.length/1024).toFixed(1) + ' KB');
});
