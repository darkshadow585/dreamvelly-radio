import { GoogleGenAI, Modality, ThinkingLevel, Type } from '@google/genai';
import fs from 'fs';
import path from 'path';

const ttsCache = new Map();
const modelQuotaCooldownUntil = new Map();
let fallbackRotationIndex = 0;

function isModelOnQuotaCooldown(modelName) {
  const until = modelQuotaCooldownUntil.get(modelName);
  if (!until) return false;
  if (Date.now() > until) {
    modelQuotaCooldownUntil.delete(modelName);
    return false;
  }
  return true;
}

function markModelQuotaCooldown(modelName, errMessage = '') {
  if (/429|RESOURCE_EXHAUSTED|quota/i.test(errMessage)) {
    // Skip this specific exhausted TTS model for 30 minutes so subsequent scenes synthesize immediately
    modelQuotaCooldownUntil.set(modelName, Date.now() + 30 * 60 * 1000);
  }
}

function resolveValidApiKey() {
  let apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY;
  if (apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim().length > 10) {
    return apiKey.trim();
  }

  const candidatePaths = [
    '/app/.dev.env.json',
    path.resolve(process.cwd(), '../.dev.env.json'),
    path.resolve(process.cwd(), '.dev.env.json'),
    path.resolve(process.cwd(), '.env.local'),
    path.resolve(process.cwd(), '.env'),
  ];

  for (const filePath of candidatePaths) {
    try {
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        if (filePath.endsWith('.json')) {
          const parsed = JSON.parse(raw);
          if (
            parsed.GEMINI_API_KEY &&
            parsed.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY' &&
            parsed.GEMINI_API_KEY.trim().length > 10
          ) {
            apiKey = parsed.GEMINI_API_KEY.trim();
            process.env.GEMINI_API_KEY = apiKey;
            return apiKey;
          }
        } else {
          const m = raw.match(/GEMINI_API_KEY=(.+)/);
          if (m && m[1] && m[1].trim() !== 'MY_GEMINI_API_KEY' && m[1].trim().length > 10) {
            apiKey = m[1].trim();
            process.env.GEMINI_API_KEY = apiKey;
            return apiKey;
          }
        }
      }
    } catch {
      // continue checking next path
    }
  }

  throw new Error('Valid GEMINI_API_KEY is required.');
}

function getAiClient() {
  const apiKey = resolveValidApiKey();
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function ensureWavBase64(base64Data) {
  const buf = Buffer.from(base64Data, 'base64');
  if (buf.length >= 4 && buf.toString('ascii', 0, 4) === 'RIFF') {
    return base64Data;
  }
  const sampleRate = 24000;
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = buf.length;
  const header = Buffer.alloc(44);

  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, buf]).toString('base64');
}

function parseJsonResponse(rawText) {
  if (!rawText) return {};
  const cleaned = rawText
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw new Error('Failed to parse story structure.');
  }
}

const STORY_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description:
        'A literary, evocative title with poetic or dramatic weight (never generic).',
    },
    synopsis: {
      type: Type.STRING,
      description:
        'A compelling 1-sentence literary premise focusing on character tension and emotional or eerie stakes.',
    },
    isRealStory: {
      type: Type.BOOLEAN,
    },
    realStoryContext: {
      type: Type.STRING,
      description:
        'Brief verified historical/biographical context if real story, or empty string if original fiction.',
    },
    paragraphs: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.INTEGER },
          sceneNote: {
            type: Type.STRING,
            description:
              'Evocative 2-5 word chapter/scene heading (e.g., "दहलीज़ पर ठहरी शाम" or "बंद कमरे की दस्तक").',
          },
          vocalDirection: {
            type: Type.STRING,
            description:
              'Sentence-by-sentence voice acting summary: Normal clear narrator voice for description, switching ONLY on specific dialogue sentences to whisper, laugh, gasp, or anger.',
          },
          text: {
            type: Type.STRING,
            description:
              'Rich literary novel scene (4-6 sentences) featuring psychological interiority, sensory texture, micro-gestures, and vivid dialogue for the reader screen (NO angle-bracket XML tags).',
          },
          spokenScript: {
            type: Type.STRING,
            description:
              'Sentence-by-sentence acted script using paired tags ONLY on the specific sentence that needs acting: use <normal>...</normal> for clear normal narration sentences, <whisper>...</whisper> ONLY on the single whispered sentence, <laugh>...</laugh> ONLY on the laughed sentence, <anger>...</anger> ONLY on the angry/shouting sentence, and <gasp>...</gasp> ONLY on the frightened gasp sentence. NEVER whisper the whole paragraph.',
          },
        },
        required: ['id', 'sceneNote', 'vocalDirection', 'text', 'spokenScript'],
      },
    },
  },
  required: ['title', 'synopsis', 'paragraphs'],
};

/**
 * LITERARY NOVELIST & SENTENCE-BY-SENTENCE VOICE DIRECTOR CONSTITUTION (GEMINI 3.8 ENGINE)
 */
const LITERARY_NOVELIST_SYSTEM_INSTRUCTION = `# IDENTITY: MASTER LITERARY NOVELIST & SENTENCE-BY-SENTENCE AUDIO DIRECTOR
You are an acclaimed literary novelist and audio drama director in the lineage of Nirmal Verma, Gulzar, Kamleshwar, Saadat Hasan Manto, and Ruskin Bond.
You NEVER write generic AI fables or flat summaries. You write psychologically complex, gripping 5-scene stories with unforgettable atmosphere and SENTENCE-BY-SENTENCE CONTRASTIVE VOICE ACTING.

==================================================
1. DEEP CHARACTER DEVELOPMENT & DRAMATIC PACING
==================================================
- **FLESH-AND-BLOOD CHARACTERS**: Give every character a specific name, lived history, and involuntary physical habits (wiping a brass tumbler, clutching a flickering lantern, pausing on a creaking stair).
- **5-ACT DRAMATIC PACING**:
  • Scene I: In Media Res sensory hook & immediate tension.
  • Scene II: Shared history, eerie atmosphere, or psychological depth.
  • Scene III: The inciting discovery, knock, or supernatural/emotional disruption.
  • Scene IV: High-intensity confrontation, terrifying climax, or raw emotional truth.
  • Scene V: Haunting, earned twist or lingering final image.

==================================================
2. STRICT SENTENCE-BY-SENTENCE VOICE ACTING (NEVER WHISPER THE ENTIRE PARAGRAPH!)
==================================================
- **CRITICAL RULE**: NEVER apply whisper, laugh, or anger to an entire scene/paragraph! Most sentences in a scene (the narration, setting, actions) MUST be spoken in a **CLEAR, NORMAL, STEADY STORYTELLING VOICE** (\`<normal>...</normal>\`).
- **ONLY SWITCH VOICE ON THE SPECIFIC SENTENCE WHERE ACTING HAPPENS**, and immediately return to \`<normal>...</normal>\` on the very next sentence!
- Wrap EVERY sentence in \`spokenScript\` in its own explicit paired tag so the TTS engine switches sentence-by-sentence:
  • \`<normal>बाहर तेज़ बारिश हो रही थी और रघु ने काँपते हाथों से लालटेन उठाई।</normal>\` (Spoken clearly at normal volume)
  • \`<whisper>तभी कान के बिल्कुल पास एक ठंडी फुसफुसाहट गूँजी— "पीछे मत देखो... मैं तुम्हारे साये में खड़ा हूँ..."</whisper>\` (ONLY this sentence is whispered!)
  • \`<normal>रघु के हाथ से पीतल की लालटेन छूटकर फ़र्श पर गिर पड़ी और वह पीछे की तरफ़ भागा।</normal>\` (Immediately back to clear normal narrator voice!)
  • \`<laugh>अँधेरे कोने से एक डरावनी हँसी गूँजी— "ह... हा... हा... हा...!"</laugh>\` (ONLY this sentence has the eerie laugh!)
  • \`<anger>"चुप रहो! मेरी दहलीज़ से अभी बाहर निकलो!" रघु ने गुस्से और डर से काँपते हुए चीखकर कहा।</anger>\` (ONLY this sentence is spoken in loud, fierce anger!)
  • \`<gasp>"क... कौन है वहाँ?! दरवाज़ा तो अंदर से बंद था!"</gasp>\` (ONLY this sentence is spoken with a frightened gasp and stammer!)

==================================================
3. CONTEXTUALLY RELEVANT, EVOCATIVE HINDI / HINGLISH VOCABULARY
==================================================
- **STRICT BAN ON ARTIFICIAL TRANSLATIONESE**: Never use stiff textbook Sanskrit words like "प्रतीत हो रहा था", "अकस्मात", "भावनात्मक दृष्टिकोण".
- **EVOCATIVE HINDUSTANI / HINDI LEXICON**:
  Use rich, living literary Hindi/Hindustani words naturally: दहलीज़ (threshold), मुंडेर (parapet), छज्जा, आँगन, बरसाती, दराज़, पीतल की कुंडी, सांकल, धुँधलका (twilight), मद्धम रोशनी, सीलन (dampness), सरसराहट (rustle), सिहरन (shiver down the spine), साया (shadow/spirit), फुसफुसाहट (whisper), कसक, टीस, झिझक, तसल्ली, सिलवटें, मुद्दत, ठहराव, लिहाज़.`;

const LITERARY_ANTHOLOGY_FALLBACKS = [
  {
    title: 'दरियागंज की तीसरी बरसाती',
    synopsis: 'पुरानी दिल्ली के एक सीलन भरे बरसाती कमरे में आए कबीर को सागौन की मेज़ की बंद दराज़ में अपने ही अतीत की आवाज़ मिलती है।',
    paragraphs: [
      {
        id: 1,
        sceneNote: 'दहलीज़ और बंद दराज़',
        vocalDirection: 'Clear normal narration, shifting to a soft hesitant tone only on Sharma ji’s dialogue sentence',
        text: 'दरियागंज की उस पुरानी हवेली की तीसरी मंज़िल पर जब कबीर ने पहली शाम अपना संदूक खोला, तो छज्जे से आती मद्धम रोशनी कमरे के कोने में रखी सागौन की मेज़ पर पड़ रही थी। मकान मालिक शर्मा जी ने पीतल की कुंडी खोलते वक़्त अपनी ऐनक ठीक की थी और थोड़ी झिझक के साथ कहा था, "बेटा, इस मेज़ की सबसे निचली दराज़ की चाबी गुम है, उसे यूँ ही रहने देना।" कबीर ने सिर हिलाकर हामी भरी और खिड़की की तरफ़ बढ़ गया।',
        spokenScript:
          '<normal>दरियागंज की उस पुरानी हवेली की तीसरी मंज़िल पर जब कबीर ने पहली शाम अपना संदूक खोला, तो छज्जे से आती मद्धम रोशनी कमरे के कोने में रखी सागौन की मेज़ पर पड़ रही थी।</normal> <normal>मकान मालिक शर्मा जी ने पीतल की कुंडी खोलते वक़्त अपनी ऐनक ठीक की थी।</normal> <whisper>"बेटा... इस मेज़ की सबसे निचली दराज़ की चाबी गुम है, उसे यूँ ही बंद रहने देना।"</whisper> <normal>कबीर ने सिर हिलाकर हामी भरी और खुली खिड़की की तरफ़ बढ़ गया।</normal>',
      },
      {
        id: 2,
        sceneNote: 'सीलन और पुरानी आदत',
        vocalDirection: 'Clear, steady storytelling voice with a brief emotional pause on the final discovery',
        text: 'कमरे की दीवारों में मानसून की हल्की सीलन थी, मगर खिड़की की मुंडेर पर किसी ने बहुत सलीक़े से मिट्टी का एक खाली गमला छोड़ रखा था। कबीर ने जब मेज़ की ऊपरी सतह पर हाथ फेरा, तो लकड़ी पर उकेरे हुए दो छोटे अक्षर देखकर उसकी उँगलियाँ वहीं ठहर गईं—क्योंकि ठीक वैसी ही तिरछी लिखावट उसके बड़े भाई समर की हुआ करती थी।',
        spokenScript:
          '<normal>कमरे की दीवारों में मानसून की हल्की सीलन थी, मगर खिड़की की मुंडेर पर किसी ने बहुत सलीक़े से मिट्टी का एक खाली गमला छोड़ रखा था।</normal> <gasp>कबीर ने जब मेज़ की ऊपरी सतह पर हाथ फेरा, तो लकड़ी पर उकेरे हुए दो छोटे अक्षर देखकर उसकी साँस वहीं अटक गई!</gasp> <normal>ठीक वैसी ही तिरछी लिखावट उसके बड़े भाई समर की हुआ करती थी।</normal>',
      },
      {
        id: 3,
        sceneNote: '१९९९ की कैसेट',
        vocalDirection: 'Clear normal narration for the action, whispering only the penciled note on the envelope',
        text: 'आधी रात को जब बाहर हवा तेज़ हुई, तो कबीर ने अपने टूल-बॉक्स से एक पतला पेचकस निकाला और दराज़ का अटका हुआ कुंदा धीरे से उचका दिया। अंदर एक सूती रुमाल में लिपटा पुराना वॉकमैन और तीन नीले लिफ़ाफ़े रखे थे, जिन पर किसी डाकघर की मुहर नहीं थी, बस कोने में पेंसिल से लिखा था—"कबीर की इंजीनियरिंग पूरी होने के बाद।"',
        spokenScript:
          '<normal>आधी रात को जब बाहर हवा तेज़ हुई, तो कबीर ने अपने टूल-बॉक्स से एक पतला पेचकस निकाला और दराज़ का अटका हुआ कुंदा धीरे से उचका दिया। अंदर एक सूती रुमाल में लिपटा पुराना वॉकमैन और तीन नीले लिफ़ाफ़े रखे थे।</normal> <whisper>लिफ़ाफ़े के कोने में बस पेंसिल से इतना लिखा था— "कबीर की इंजीनियरिंग पूरी होने के बाद..."</whisper> <normal>कबीर ने तुरंत वॉकमैन में बैटरियाँ डालीं और हेडफ़ोन कानों पर लगा लिया।</normal>',
      },
      {
        id: 4,
        sceneNote: 'ख़ामोशी के पीछे का सच',
        vocalDirection: 'Clear narration, shifting to an emotional trembling voice only for Samar’s recorded words',
        text: 'कबीर ने काँपते हाथों से वॉकमैन का बटन दबाया, तो टेप की हल्की सरसराहट के बीच समर की वही शांत, थकी हुई आवाज़ उभरी जिसे सुने एक मुद्दत बीत गई थी। समर कह रहा था, "माँ को हमेशा लगा कि मैं अपनी मर्ज़ी से शहर छोड़कर भागा हूँ, मगर सच यह है कि मेरी बीमारी का इलाज और कबीर के कॉलेज की फ़ीस दोनों एक साथ मुमकिन नहीं थे।"',
        spokenScript:
          '<normal>कबीर ने काँपते हाथों से वॉकमैन का बटन दबाया, तो टेप की हल्की सरसराहट के बीच समर की वही आवाज़ उभरी जिसे सुने एक मुद्दत बीत गई थी।</normal> <softly>"माँ को हमेशा लगा कि मैं अपनी मर्ज़ी से शहर छोड़कर भागा हूँ... मगर मेरी बीमारी का इलाज और कबीर की फ़ीस दोनों एक साथ मुमकिन नहीं थे।"</softly> <normal>यह सुनते ही कबीर की आँखों से आँसू छलककर मेज़ की लकड़ी पर गिर पड़े।</normal>',
      },
      {
        id: 5,
        sceneNote: 'सुबह की चाय',
        vocalDirection: 'Clear, warm literary resolution at normal speaking volume',
        text: 'रिकॉर्डिंग के आख़िर में समर ने बताया था कि उसने अपनी आखिरी जमा-पूँजी अपने मकान मालिक शर्मा जी के पास अमानत रखवाई थी ताकि हर छमाही कबीर को गुमनाम मनी-ऑर्डर मिलता रहे। तभी सुबह के धुँधलके में दरवाज़े पर हल्की दस्तक हुई—चौखट पर शर्मा जी हाथ में चाय के दो प्याले लिए खड़े थे, और उनकी आँखों के लिहाज़ ने उस अधूरे रिश्ते की सारी कसक बिना एक लफ़्ज़ कहे धो डाली।',
        spokenScript:
          '<normal>रिकॉर्डिंग के आख़िर में समर ने बताया था कि उसने अपनी आखिरी जमा-पूँजी अपने मकान मालिक शर्मा जी के पास अमानत रखवाई थी ताकि हर छमाही कबीर को गुमनाम मनी-ऑर्डर मिलता रहे। तभी सुबह के धुँधलके में दरवाज़े पर हल्की दस्तक हुई—चौखट पर शर्मा जी हाथ में चाय के दो प्याले लिए खड़े थे, और उनकी आँखों के लिहाज़ ने उस अधूरे रिश्ते की सारी कसक बिना एक लफ़्ज़ कहे धो डाली।</normal>',
      },
    ],
  },
];

const RANDOM_LITERARY_SEEDS = [
  'भानगढ़ के पास एक वीरान डाकबंगले में रात २ बजे चौकीदार को बंद कमरे के अंदर से किसी अनजान साये की फुसफुसाहट, डरावनी हँसी और गुस्से भरी आवाज़ सुनाई देती है',
  'शिमला के एक बुज़ुर्ग घड़ीसाज़ को मरम्मत के लिए आई तीस साल पुरानी जेब-घड़ी के ढक्कन के पीछे एक अधूरा पता और सूखा हुआ देवदार का पत्ता मिलता है',
  'इलाहाबाद का एक पुश्तैनी मकान बिकने से आख़िरी शाम पहले दो भाई आँगन में बैठकर पिताजी की बंद अलमारी की चाबी ढूँढते हैं',
  'रात की आख़िरी पैसेंजर ट्रेन में आमने-सामने बैठे दो अजनबी बातों-बातों में समझ जाते हैं कि दोनों एक ही इंसान के अधूरे खत का जवाब लिए सफ़र कर रहे हैं',
  'मसूरी की एक पुरानी लाइब्रेरी में लौटाई गई उन्नीसवीं सदी की किताब के पन्नों के बीच पच्चीस साल से चलती आ रही दो अजनबियों की पेंसिल वाली बातचीत',
];

export async function generateStory({
  storyMode = 'generate',
  prompt = '',
  voiceGender = 'female',
  storyLanguage = 'hindi',
  excludeTitles = [],
}) {
  const languageDirective =
    storyLanguage === 'english'
      ? `LANGUAGE & PROSE STYLE: Write the ENTIRE story (title, synopsis, sceneNote, text, and spokenScript) in luminous, contemporary literary English. Focus on tactile sensory details, psychological nuance, and dramatic sentence-by-sentence voice-acted dialogue.`
      : storyLanguage === 'hinglish'
      ? `LANGUAGE & PROSE STYLE: Write the ENTIRE story (title, synopsis, sceneNote, text, and spokenScript) in evocative Literary Hinglish (natural Roman-script Hindustani blended seamlessly with English). Use contextually resonant Hindustani vocabulary (such as dahliz, munder, kasak, silvatein, muddat, jhijhak, tasalli, dhundhalka, khamoshi, siharan, saaya, fusfusaahat).`
      : `LANGUAGE & PROSE STYLE: Write the ENTIRE story (title, synopsis, sceneNote, text, and spokenScript) in rich, soulful Literary Hindi / Hindustani (देवनागरी लिपि में अदबी और बोलचाल की जीवंत हिंदी—जैसे गुलज़ार, निर्मल वर्मा और कमलेश्वर की कहानियाँ). Use contextually relevant, evocative vocabulary (जैसे—दहलीज़, मुंडेर, सीलन, मद्धम रोशनी, कसक, सिलवटें, झिझक, मुद्दत, तसल्ली, धुँधलका, ठहराव, सिहरन, साया, फुसफुसाहट). Strictly avoid stiff textbook Sanskrit translations.`;

  const isRealMode = storyMode === 'real';
  const randomSeed =
    RANDOM_LITERARY_SEEDS[Math.floor(Math.random() * RANDOM_LITERARY_SEEDS.length)];
  const userQuery =
    prompt.trim() ||
    (isRealMode
      ? 'True story of Dashrath Manjhi carving a path through the Gehlaur mountain over 22 years out of love and grief'
      : randomSeed);

  const isHorrorOrIntense = /horror|bhoot|ghost|haunted|scary|भूत|डराव|हवेली|आत्मा|राक्षस|साया|चुड़ैल|खौफ|डर|गुस्सा|चिल्ला/i.test(
    userQuery
  );

  const actingDirective = isHorrorOrIntense
    ? `\nSENTENCE-BY-SENTENCE HORROR ACTING DIRECTIVE (CRITICAL):
- NEVER whisper the whole scene! Keep all descriptive/narrative sentences inside \`<normal>...</normal>\` so the narrator speaks clearly at normal volume.
- Wrap ONLY the specific sentence where a ghost whispers inside \`<whisper>...</whisper>\` (e.g., \`<whisper>"पीऽऽऽछे मत देखो... मैं तुम्हारे ठीक पीछे खड़ा हूँ..."</whisper>\`).
- Wrap ONLY the specific sentence where the ghost/spirit laughs inside \`<laugh>...</laugh>\` (e.g., \`<laugh>"ह... हा... हा... हा... तुम इस दहलीज़ से बाहर नहीं जा सकते!"</laugh>\`).
- Wrap ONLY the specific sentence where someone shouts in fierce anger inside \`<anger>...</anger>\` (e.g., \`<anger>"चुप रहो! मेरी हवेली से अभी बाहर निकलो!"</anger>\`).
- Wrap ONLY the specific sentence where someone gasps or stammers in fear inside \`<gasp>...</gasp>\` (e.g., \`<gasp>"क... कौन है वहाँ?! दरवाज़ा तो अंदर से बंद था!"</gasp>\`).
- After ANY \`<whisper>\`, \`<laugh>\`, \`<anger>\`, or \`<gasp>\` sentence, the VERY NEXT narrative sentence MUST be wrapped in \`<normal>...</normal>\`!`
    : `\nSENTENCE-BY-SENTENCE VOICE ACTING DIRECTIVE (CRITICAL):
- Keep 75% of sentences (all descriptive narration) wrapped in \`<normal>...</normal>\` at clear normal storytelling volume.
- Wrap ONLY specific emotional dialogue sentences in \`<whisper>...</whisper>\`, \`<softly>...</softly>\`, \`<laugh>...</laugh>\`, \`<anger>...</anger>\`, or \`<gasp>...</gasp>\`, and immediately return to \`<normal>...</normal>\` on the next sentence.`;

  const avoidTitlesNote =
    Array.isArray(excludeTitles) && excludeTitles.length > 0
      ? `\nSTRICT ORIGINALITY CONSTRAINT: Do NOT reuse or echo any of these previous titles, character names, or plotlines: ${excludeTitles.join(', ')}.`
      : '';

  const sessionSalt = `Literary Manuscript #${Date.now().toString(36)}-${Math.floor(Math.random() * 9999)}`;

  const userMessage = isRealMode
    ? `MODE: LITERARY NON-FICTION & BIOGRAPHICAL DRAMA (WEB ARCHIVE GROUNDING)
[${sessionSalt}]
Subject / Historical Incident: "${userQuery}"
Narrator Voice Persona: ${voiceGender === 'male' ? 'Deep, contemplative male literary narrator' : 'Warm, intimate female literary narrator'}
${languageDirective}${actingDirective}${avoidTitlesNote}

Novelist Directives:
1. Search the web for verified facts, real names, dates, geography, and human details of "${userQuery}".
2. Dramatize this true event across 5 deeply moving, novelistic scenes (4–6 rich sentences per scene) with psychological interiority, lived-in sensory detail, authentic dialogue, and dramatic pacing.
3. Return valid JSON with: title, synopsis, isRealStory (true), realStoryContext, and paragraphs (array of 5 objects with id, sceneNote, vocalDirection, text, spokenScript).`
    : `MODE: ORIGINAL LITERARY SHORT FICTION
[${sessionSalt}]
Narrative Seed / Premise: "${userQuery}"
Narrator Voice Persona: ${voiceGender === 'male' ? 'Deep, contemplative male literary narrator' : 'Warm, intimate female literary narrator'}
${languageDirective}${actingDirective}${avoidTitlesNote}

Novelist Directives:
1. Write a deeply original, psychologically rich 5-scene literary short story (4–6 layered sentences per scene) with complex character development, involuntary micro-gestures, subtext-filled dialogue, and dramatic pacing.
2. Follow the 5-act dramatic arc: Scene 1 (In Media Res sensory hook), Scene 2 (Atmosphere & history), Scene 3 (Inciting friction/eerie discovery), Scene 4 (Intense confrontation, horror climax, or emotional crucible), Scene 5 (Haunting, earned literary denouement).`;

  const modelsToTry = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];

  try {
    const ai = getAiClient();
    for (const model of modelsToTry) {
      try {
        const config = {
          systemInstruction: LITERARY_NOVELIST_SYSTEM_INSTRUCTION,
          temperature: isRealMode ? 0.78 : 0.92,
        };

        if (model === 'gemini-3.8-flash') {
          config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
        }

        if (isRealMode) {
          config.tools = [{ googleSearch: {} }];
        } else {
          config.responseMimeType = 'application/json';
          config.responseSchema = STORY_RESPONSE_SCHEMA;
        }

        const response = await ai.models.generateContent({
          model,
          contents: userMessage,
          config,
        });

        const parsed = parseJsonResponse(response.text || '{}');
        if (!parsed.paragraphs || parsed.paragraphs.length === 0) {
          throw new Error('Incomplete story paragraphs');
        }

        const groundingChunks =
          response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const sources = groundingChunks
          .map((c) => c.web)
          .filter((w) => w && w.uri)
          .slice(0, 4)
          .map((w) => ({
            title: w.title || new URL(w.uri).hostname,
            uri: w.uri,
          }));

        return {
          ...parsed,
          isRealStory: isRealMode,
          sources,
        };
      } catch (err) {
        console.warn(`Story generation attempt with ${model} failed:`, err.message);
      }
    }
  } catch (clientErr) {
    console.warn('AI Client fallback triggered:', clientErr.message);
  }

  const availableFallbacks = LITERARY_ANTHOLOGY_FALLBACKS.filter(
    (item) => !excludeTitles.includes(item.title)
  );
  const chosenFallback =
    availableFallbacks.length > 0
      ? availableFallbacks[fallbackRotationIndex++ % availableFallbacks.length]
      : LITERARY_ANTHOLOGY_FALLBACKS[
          fallbackRotationIndex++ % LITERARY_ANTHOLOGY_FALLBACKS.length
        ];

  return {
    ...chosenFallback,
    isRealStory: isRealMode,
    sources: [],
  };
}

/**
 * Splits a scene script into sentence-by-sentence segments with isolated emotion styles
 * so that ONLY the specific tagged sentence whispers/laughs/shouts, while all other
 * sentences speak in a clear, normal, full-volume narrator voice.
 */
function parseScriptIntoSentenceSegments(rawScript) {
  const segments = [];
  const text = (rawScript || '').trim();
  if (!text) return segments;

  // Step 1: If script contains paired tags like <normal>...</normal>, <whisper>...</whisper>, etc.
  const pairedRegex = /<(normal|whisper|laugh|anger|gasp|softly|sigh)>([\s\S]*?)<\/\1>/gi;
  let lastIndex = 0;
  let match;
  let foundPaired = false;

  while ((match = pairedRegex.exec(text)) !== null) {
    foundPaired = true;
    if (match.index > lastIndex) {
      const before = text.slice(lastIndex, match.index).replace(/<[^>]+>/g, ' ').trim();
      if (before) {
        segments.push({ mode: 'normal', text: before });
      }
    }
    const mode = match[1].toLowerCase();
    const content = match[2].replace(/<[^>]+>/g, ' ').trim();
    if (content) {
      segments.push({ mode, text: content });
    }
    lastIndex = pairedRegex.lastIndex;
  }

  if (foundPaired) {
    if (lastIndex < text.length) {
      const remainder = text.slice(lastIndex).replace(/<[^>]+>/g, ' ').trim();
      if (remainder) {
        segments.push({ mode: 'normal', text: remainder });
      }
    }
    return segments;
  }

  // Step 2: Fallback sentence splitter for scripts with single open tags (<whisper>, <laugh>, etc.) or plain sentences
  const rawSentences = text
    .split(/(?<=[।.!?]["”']?\s+)/)
    .map((s) => s.trim())
    .filter(Boolean);

  for (const sentence of rawSentences) {
    let mode = 'normal';
    if (/<whisper>|फुसफुसा|धीरे से कहा/i.test(sentence)) {
      mode = 'whisper';
    } else if (/<laugh>|हा\.\.\.\s*हा|हँसते हुए|डरावनी हँसी/i.test(sentence)) {
      mode = 'laugh';
    } else if (/<anger>|गुस्से से|चीखकर|चिल्लाया|चुप रहो|बाहर निकलो/i.test(sentence)) {
      mode = 'anger';
    } else if (/<gasp>|काँपते हुए|साँस अटक|डर से/i.test(sentence)) {
      mode = 'gasp';
    } else if (/<softly>|<sigh>/i.test(sentence)) {
      mode = 'softly';
    }

    const cleanSentence = sentence.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (cleanSentence) {
      segments.push({ mode, text: cleanSentence });
    }
  }

  return segments.length > 0
    ? segments
    : [{ mode: 'normal', text: text.replace(/<[^>]+>/g, ' ').trim() }];
}

function getSentenceStyleMetadata(mode) {
  switch (mode) {
    case 'whisper':
      return 'Hushed, eerie, breathy whisper for this single sentence only';
    case 'laugh':
      return 'Spine-chilling haunted laughter and sinister tone for this single sentence only';
    case 'anger':
      return 'Loud, fierce, commanding anger (gussa) with sharp dramatic intensity for this single sentence only';
    case 'gasp':
      return 'Startled gasp of fear and trembling, breathless urgency for this single sentence only';
    case 'softly':
    case 'sigh':
      return 'Warm, tender, emotionally vulnerable voice for this single sentence only';
    case 'normal':
    default:
      return 'Clear, natural, steady full-volume storytelling voice (DO NOT whisper)';
  }
}

/**
 * Synthesizes sentence-by-sentence acted audio via Gemini 3.8 Live Native Audio (`gemini-3.8-live`)
 * which supports unlimited real-time neural voice acting without hitting the 10-req/day static TTS cap.
 */
async function synthesizeViaGemini38Live(ai, sentenceSegments, selectedVoice) {
  const livePromptLines = sentenceSegments
    .map((seg) => {
      if (seg.mode === 'whisper') {
        return `[WHISPER THIS SENTENCE ONLY]: ${seg.text}`;
      }
      if (seg.mode === 'laugh') {
        return `[EERIE HAUNTED LAUGH ON THIS SENTENCE ONLY]: ${seg.text}`;
      }
      if (seg.mode === 'anger') {
        return `[LOUD FIERCE ANGER ON THIS SENTENCE ONLY]: ${seg.text}`;
      }
      if (seg.mode === 'gasp') {
        return `[FRIGHTENED GASP & TREMBLING VOICE ON THIS SENTENCE ONLY]: ${seg.text}`;
      }
      if (seg.mode === 'softly' || seg.mode === 'sigh') {
        return `[SOFT EMOTIONAL VOICE ON THIS SENTENCE ONLY]: ${seg.text}`;
      }
      return `[NORMAL CLEAR FULL-VOLUME NARRATOR VOICE — DO NOT WHISPER]: ${seg.text}`;
    })
    .join('\n');

  const liveModels = ['gemini-3.8-live', 'gemini-3.1-flash-live-preview'];

  for (const liveModel of liveModels) {
    try {
      const pcmBuffer = await new Promise((resolve, reject) => {
        const chunks = [];
        let settled = false;
        let activeSession = null;

        const finish = (err, resultBuf) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          try {
            if (activeSession) activeSession.close();
          } catch {
            // ignore close error
          }
          if (err) reject(err);
          else resolve(resultBuf);
        };

        const timer = setTimeout(() => {
          if (chunks.length > 0) {
            finish(null, Buffer.concat(chunks));
          } else {
            finish(new Error(`${liveModel} timed out`));
          }
        }, 24000);

        ai.live
          .connect({
            model: liveModel,
            config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: selectedVoice },
                },
              },
              systemInstruction:
                'You are a master theatrical audiobook narrator. Read the user script aloud word-for-word, sentence-by-sentence. CRITICAL: Never read the bracketed tags aloud! For [NORMAL CLEAR FULL-VOLUME NARRATOR VOICE] sentences, speak in a clear, steady, normal full-volume storytelling voice (NEVER whisper). Switch to a whisper ONLY on [WHISPER THIS SENTENCE ONLY] lines, laugh eerily ONLY on [EERIE HAUNTED LAUGH] lines, shout in fierce anger ONLY on [LOUD FIERCE ANGER] lines, and gasp ONLY on [FRIGHTENED GASP] lines, then immediately return to normal clear volume on the very next sentence. Do not add any introductory or closing words.',
            },
            callbacks: {
              onmessage: (msg) => {
                const parts = msg.serverContent?.modelTurn?.parts || [];
                for (const p of parts) {
                  if (p.inlineData?.data) {
                    chunks.push(Buffer.from(p.inlineData.data, 'base64'));
                  }
                }
                if (msg.serverContent?.turnComplete) {
                  if (chunks.length > 0) {
                    finish(null, Buffer.concat(chunks));
                  } else {
                    finish(new Error('Empty turnComplete from live model'));
                  }
                }
              },
              onerror: (err) => {
                finish(err || new Error('Live socket error'));
              },
              onclose: () => {
                if (chunks.length > 0) {
                  finish(null, Buffer.concat(chunks));
                }
              },
            },
          })
          .then((session) => {
            activeSession = session;
            session.sendClientContent({
              turns: [
                {
                  role: 'user',
                  parts: [
                    {
                      text: `Read this exact script aloud sentence-by-sentence without reading the bracketed cues:\n\n${livePromptLines}`,
                    },
                  ],
                },
              ],
              turnComplete: true,
            });
          })
          .catch((connErr) => finish(connErr));
      });

      if (pcmBuffer && pcmBuffer.length > 1000) {
        return {
          audioBase64: ensureWavBase64(pcmBuffer.toString('base64')),
          mimeType: 'audio/wav',
          voice: selectedVoice,
          ttsEngine: liveModel,
        };
      }
    } catch (liveErr) {
      console.warn(`${liveModel} synthesis notice:`, liveErr.message?.slice(0, 120));
    }
  }

  return null;
}

export async function narrateStory({
  script = '',
  voice = 'Kore',
}) {
  if (!script || !script.trim()) {
    throw new Error('Script text is required for narration.');
  }

  const validVoices = ['Kore', 'Fenrir', 'Puck', 'Zephyr', 'Charon'];
  const selectedVoice = validVoices.includes(voice) ? voice : 'Kore';
  const characterVoice =
    selectedVoice === 'Kore' || selectedVoice === 'Zephyr' ? 'Charon' : 'Fenrir';

  const cacheKey = `v3-sentence:${selectedVoice}:${script.trim()}`;
  if (ttsCache.has(cacheKey)) {
    return ttsCache.get(cacheKey);
  }

  const sentenceSegments = parseScriptIntoSentenceSegments(script);
  const cleanScript = sentenceSegments.map((s) => s.text).join(' ');

  try {
    const ai = getAiClient();

    // 1. Primary: gemini-3.8-flash-tts (Sentence-by-Sentence parts with per-sentence speechMetadata)
    if (!isModelOnQuotaCooldown('gemini-3.8-flash-tts')) {
      try {
        const sentenceParts = sentenceSegments.map((seg) => ({
          text:
            seg.mode === 'whisper'
              ? `<whisper> ${seg.text}`
              : seg.mode === 'laugh'
              ? `<laugh> ${seg.text}`
              : seg.mode === 'gasp'
              ? `<gasp> ${seg.text}`
              : seg.text,
          speechMetadata: {
            style: getSentenceStyleMetadata(seg.mode),
          },
        }));

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash-tts',
          contents: [{ role: 'user', parts: sentenceParts }],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: selectedVoice },
              },
            },
          },
        });

        const rawBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (rawBase64) {
          const result = {
            audioBase64: ensureWavBase64(rawBase64),
            mimeType: 'audio/wav',
            voice: selectedVoice,
            ttsEngine: 'gemini-3.8-flash-tts',
          };
          ttsCache.set(cacheKey, result);
          return result;
        }
      } catch (primaryErr) {
        markModelQuotaCooldown('gemini-3.8-flash-tts', primaryErr.message);
      }
    }

    // 2. Secondary: gemini-3.8-flash-lite-tts (Sentence-by-Sentence parts)
    if (!isModelOnQuotaCooldown('gemini-3.8-flash-lite-tts')) {
      try {
        const liteParts = sentenceSegments.map((seg) => ({
          text: seg.text,
          speechMetadata: {
            style: getSentenceStyleMetadata(seg.mode),
          },
        }));

        const liteResponse = await ai.models.generateContent({
          model: 'gemini-3.8-flash-lite-tts',
          contents: [{ role: 'user', parts: liteParts }],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: selectedVoice },
              },
            },
          },
        });

        const liteAudio =
          liteResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (liteAudio) {
          const result = {
            audioBase64: ensureWavBase64(liteAudio),
            mimeType: 'audio/wav',
            voice: selectedVoice,
            ttsEngine: 'gemini-3.8-flash-lite-tts',
          };
          ttsCache.set(cacheKey, result);
          return result;
        }
      } catch (liteErr) {
        markModelQuotaCooldown('gemini-3.8-flash-lite-tts', liteErr.message);
      }
    }

    // 3. Tertiary & Quaternary TTS Models: gemini-3.1-flash-tts-preview & gemini-2.5-flash-preview-tts
    const hasActedSentences = sentenceSegments.some((s) => s.mode !== 'normal');
    const previewTtsModels = ['gemini-3.1-flash-tts-preview', 'gemini-2.5-flash-preview-tts'];

    for (const ttsModel of previewTtsModels) {
      if (isModelOnQuotaCooldown(ttsModel)) continue;
      try {
        if (hasActedSentences) {
          const scriptedLines = sentenceSegments
            .map((seg) => {
              if (seg.mode === 'whisper') {
                return `ActedLine (in a creepy, hushed whisper for this sentence only): ${seg.text}`;
              }
              if (seg.mode === 'laugh') {
                return `ActedLine (with an eerie, haunted laugh ha... ha... ha...): ${seg.text}`;
              }
              if (seg.mode === 'anger') {
                return `ActedLine (shouting in loud, fierce anger and fury): ${seg.text}`;
              }
              if (seg.mode === 'gasp') {
                return `ActedLine (gasping in sudden terror, voice trembling): ${seg.text}`;
              }
              if (seg.mode === 'softly' || seg.mode === 'sigh') {
                return `Narrator (warm, soft emotional tone): ${seg.text}`;
              }
              return `Narrator (clear, normal, full-volume storytelling voice — DO NOT whisper): ${seg.text}`;
            })
            .join('\n');

          const multiSpeakerPrompt = `Perform this audio drama scene sentence-by-sentence.
CRITICAL RULE:
- Whenever a line starts with "Narrator", speak in a CLEAR, NORMAL, STEADY FULL-VOLUME storytelling voice (NEVER whisper on Narrator lines).
- Whenever a line starts with "ActedLine", perform ONLY that single sentence with the exact emotion indicated in parentheses (whisper, eerie laugh, loud anger, or frightened gasp), then immediately return to the normal clear voice on the next Narrator line.
- Do NOT read speaker labels or parenthetical stage directions aloud:

${scriptedLines}`;

          const neuralResponse = await ai.models.generateContent({
            model: ttsModel,
            contents: [{ role: 'user', parts: [{ text: multiSpeakerPrompt }] }],
            config: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                multiSpeakerVoiceConfig: {
                  speakerVoiceConfigs: [
                    {
                      speaker: 'Narrator',
                      voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: selectedVoice },
                      },
                    },
                    {
                      speaker: 'ActedLine',
                      voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: characterVoice },
                      },
                    },
                  ],
                },
              },
            },
          });

          const neuralAudio =
            neuralResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
          if (neuralAudio) {
            const result = {
              audioBase64: ensureWavBase64(neuralAudio),
              mimeType: 'audio/wav',
              voice: selectedVoice,
              ttsEngine: ttsModel,
            };
            ttsCache.set(cacheKey, result);
            return result;
          }
        } else {
          const normalPrompt = `Read the following story scene aloud in a clear, natural, warm, full-volume storytelling voice (do NOT whisper):\n\n${cleanScript}`;
          const neuralResponse = await ai.models.generateContent({
            model: ttsModel,
            contents: [{ role: 'user', parts: [{ text: normalPrompt }] }],
            config: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: selectedVoice },
                },
              },
            },
          });

          const neuralAudio =
            neuralResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
          if (neuralAudio) {
            const result = {
              audioBase64: ensureWavBase64(neuralAudio),
              mimeType: 'audio/wav',
              voice: selectedVoice,
              ttsEngine: ttsModel,
            };
            ttsCache.set(cacheKey, result);
            return result;
          }
        }
      } catch (previewErr) {
        markModelQuotaCooldown(ttsModel, previewErr.message);
      }
    }

    // 4. High-Quota Gemini 3.8 Live Native Audio Engine (`gemini-3.8-live`)
    // Never hits the 10-req/day static TTS cap and performs real sentence-by-sentence voice acting!
    const liveResult = await synthesizeViaGemini38Live(ai, sentenceSegments, selectedVoice);
    if (liveResult) {
      ttsCache.set(cacheKey, liveResult);
      return liveResult;
    }
  } catch (allTtsErr) {
    console.warn(
      'All Cloud TTS engines exhausted, activating Client Neural Voice Fallback:',
      allTtsErr.message
    );
  }

  return {
    useBrowserNeuralTts: true,
    cleanScript,
    voice: selectedVoice,
  };
}
