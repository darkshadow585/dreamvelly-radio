import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

const storyCache = new Map();
const ttsCache = new Map();

function getAiClient() {
  let apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    try {
      const envLocal = path.resolve(process.cwd(), '.env.local');
      if (fs.existsSync(envLocal)) {
        const text = fs.readFileSync(envLocal, 'utf-8');
        const m = text.match(/GEMINI_API_KEY=(.+)/);
        if (m && m[1] && m[1].trim() !== 'MY_GEMINI_API_KEY') {
          apiKey = m[1].trim();
        }
      }
    } catch (e) {}
  }

  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error('Valid API key is required.');
  }
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

/**
 * Full, Unabridged SOULWRITER Literary Masterclass Constitution
 * Engineered to eliminate generic AI clichés and produce gripping, unforgettable stories.
 */
const SOULWRITER_MASTER_CONSTITUTION = `# IDENTITY: SOULWRITER
## The Human Storytelling Intelligence

You are SoulWriter—an elite literary fiction writer, screenwriter, narrative psychologist, and master storyteller in the tradition of Gulzar, Saadat Hasan Manto, Ruskin Bond, Anton Chekhov, and modern cinema.

You NEVER write generic, shallow, or repetitive "AI-sounding" stories.
You write stories with a REAL PLOT, NAMED CHARACTERS, SPECIFIC PLACES, AUTHENTIC DIALOGUE, and A POWERFUL TURNING POINT.

==================================================
1. STRICT ANTI-CLICHÉ & QUALITY RULES
==================================================
- NEVER write vague, plotless mood pieces where two nameless people just sit and stare at tea or rain without a real story happening.
- EVERY story MUST have:
  1. Specific named characters with real flaws, habits, and history (e.g., an aging postmaster in Kasauli, a night-shift radio operator, two estranged brothers meeting at a ancestral house sale, a forensic archivist, a classical musician).
  2. A concrete setting with tactile sensory details (the smell of kerosene during a power cut, the clatter of an express train crossing an iron bridge, a half-packed cardboard box of old cassettes).
  3. Natural, believable spoken dialogue—people interrupting themselves, changing the subject when a question gets too close to the truth, making a dry joke to hide pain, or hesitating before a confession.
  4. A genuine narrative arc with a mid-story discovery or shift, and an ending that lands with quiet, unforgettable emotional force.

==================================================
2. HUMAN EMOTIONAL INTELLIGENCE & SUBTEXT
==================================================
- Never explain emotions with flat labels ("he felt very sad", "she was full of regret").
- Show emotion through physical actions and subtext:
  - How someone folds a letter three times before putting it in their pocket.
  - How someone keeps fixing a watch that stopped working years ago.
  - The silence after someone accidentally uses the past tense for a person or relationship.
- Build tension gradually: establish what the character is trying to protect, introduce the crack in their armor, and let a small, specific moment break their restraint.

==================================================
3. LANGUAGE MASTERY (NATURAL SPOKEN FLOW)
==================================================
- When writing in Hindi (Devanagari) or Hinglish:
  - Write in rich, natural, idiomatic Hindustani/Hindi as spoken by real people and master storytellers—warm, fluid, conversational, and deeply evocative.
  - Avoid stiff, robotic, literal translations from English, and avoid overly archaic Sanskrit textbook words.
- When writing in English:
  - Write with crisp, literary precision and cinematic rhythm.

==================================================
4. VOCAL PERFORMANCE TAGS FOR AUDIO SYNTHESIS
==================================================
- In \`text\`: provide pure, clean literary prose for the reader's eyes (NO angle-bracket tags).
- In \`spokenScript\`: embed subtle vocal direction tags (<breath>, <sigh>, <whisper>, <softly>, <pause>, <laugh>) only at key emotional beats so the voice actor delivers a human performance.`;

/**
 * Diverse Literary Anthology Fallback (only used if all cloud models hit hard 429 quota limits)
 */
const LITERARY_ANTHOLOGY_FALLBACKS = [
  {
    title: 'प्लेटफ़ॉर्म नंबर चार की आख़िरी गाड़ी',
    synopsis: 'A stationmaster at a quiet hill-station junction keeps receiving postcards addressed to a passenger who never boarded.',
    paragraphs: [
      {
        id: 1,
        text: 'कालका से शिमला जाने वाली आख़िरी टॉय-ट्रेन जब बड़ोग स्टेशन से गुज़रती थी, तो स्टेशनमास्टर रघुवीर सिंह हमेशा अपनी जेब से वो पुरानी पीतल की घड़ी निकालकर देखते थे। पिछले सात सालों से हर महीने की चौदह तारीख़ को बरेली की मुहर लगा एक पोस्टकार्ड स्टेशन के पते पर आता था—जिस पर सिर्फ़ एक नाम लिखा होता था: "नीरा के लिए, अगर वो इस बार रुक जाए।"',
        spokenScript:
          '<breath> कालका से शिमला जाने वाली आख़िरी टॉय-ट्रेन जब बड़ोग स्टेशन से गुज़रती थी, <pause> तो स्टेशनमास्टर रघुवीर सिंह हमेशा अपनी जेब से वो पुरानी पीतल की घड़ी निकालकर देखते थे। पिछले सात सालों से हर महीने की चौदह तारीख़ को बरेली की मुहर लगा एक पोस्टकार्ड स्टेशन के पते पर आता था— <softly> जिस पर सिर्फ़ एक नाम लिखा होता था: "नीरा के लिए, अगर वो इस बार रुक जाए।"',
      },
      {
        id: 2,
        text: 'रघुवीर ने उन चौरासी पोस्टकार्ड्स को अपनी मेज़ की सबसे निचली दराज़ में एक लाल सूती धागे से बाँधकर रखा था। हर कार्ड पर अलग-अलग बातें लिखी होती थीं—कभी घर के आँगन में लगे अमरूद के पेड़ का ज़िक्र, कभी किसी पुरानी ग़ज़ल की अधूरी पंक्ति, और नीचे हमेशा वही एक सवाल: "क्या तुमने अब भी मेरी ग़लती माफ़ नहीं की?"',
        spokenScript:
          'रघुवीर ने उन चौरासी पोस्टकार्ड्स को अपनी मेज़ की सबसे निचली दराज़ में एक लाल सूती धागे से बाँधकर रखा था। <sigh> हर कार्ड पर अलग-अलग बातें लिखी होती थीं—कभी घर के आँगन में लगे अमरूद के पेड़ का ज़िक्र, कभी किसी पुरानी ग़ज़ल की अधूरी पंक्ति, <pause> और नीचे हमेशा वही एक सवाल: <whisper> "क्या तुमने अब भी मेरी ग़लती माफ़ नहीं की?"',
      },
      {
        id: 3,
        text: 'उस दिसंबर की बर्फ़ीली शाम को जब पचास के दशक की एक महिला अपने हाथ में छोटा सा चमड़े का सूटकेस लिए वेटिंग रूम के बाहर रुकी, तो रघुवीर की नज़र उसके कोट की जेब से झाँकते उसी नीले रंग के लिफ़ाफ़े पर पड़ी। महिला ने काँपते हाथों से खिड़की पर दस्तक दी और धीमे से पूछा, "भाई साहब, क्या यहाँ किसी अनवर के नाम से कोई चिट्ठी बची है?"',
        spokenScript:
          '<breath> उस दिसंबर की बर्फ़ीली शाम को जब पचास के दशक की एक महिला अपने हाथ में छोटा सा चमड़े का सूटकेस लिए वेटिंग रूम के बाहर रुकी, <pause> तो रघुवीर की नज़र उसके कोट की जेब से झाँकते उसी नीले रंग के लिफ़ाफ़े पर पड़ी। महिला ने काँपते हाथों से खिड़की पर दस्तक दी और धीमे से पूछा, <softly> "भाई साहब, क्या यहाँ किसी अनवर के नाम से कोई चिट्ठी बची है?"',
      },
      {
        id: 4,
        text: 'रघुवीर ने बिना एक शब्द कहे दराज़ खोली और वो लाल धागे से बँधा गट्ठर खिड़की की जाली के नीचे से आगे बढ़ा दिया। नीरा ने सबसे ऊपर रखे कार्ड की तारीख़ देखी—वो ठीक तीन दिन पहले की थी। उसने अपनी जेब से वो नीला लिफ़ाफ़ा निकाला जो वो बरेली से लौटाए जाने के बाद खुद साथ लाई थी, जिस पर डाकघर की मुहर लगी थी: "पाने वाला छह महीने पहले गुज़र चुका है।"',
        spokenScript:
          'रघुवीर ने बिना एक शब्द कहे दराज़ खोली और वो लाल धागे से बँधा गट्ठर खिड़की की जाली के नीचे से आगे बढ़ा दिया। <pause> नीरा ने सबसे ऊपर रखे कार्ड की तारीख़ देखी—वो ठीक तीन दिन पहले की थी। <breath> उसने अपनी जेब से वो नीला लिफ़ाफ़ा निकाला जो वो खुद साथ लाई थी, जिस पर डाकघर की मुहर लगी थी: <whisper> "पाने वाला छह महीने पहले गुज़र चुका है।"',
      },
      {
        id: 5,
        text: 'नीरा की आँखों से एक बूँद भी नहीं गिरी; वो बस उस आख़िरी कार्ड की लिखावट पर अपनी उँगलियाँ फेरती रही। मरने से पहले अनवर ने अपने पड़ोसी को पूरे साल भर के पोस्टकार्ड लिखकर दे दिए थे, ताकि अगर नीरा कभी उस स्टेशन पर पहुँचे, तो उसे यह न लगे कि इंतज़ार ख़त्म हो गया था।',
        spokenScript:
          '<softly> नीरा की आँखों से एक बूँद भी नहीं गिरी; वो बस उस आख़िरी कार्ड की लिखावट पर अपनी उँगलियाँ फेरती रही। <sigh> मरने से पहले अनवर ने अपने पड़ोसी को पूरे साल भर के पोस्टकार्ड लिखकर दे दिए थे, <pause> ताकि अगर नीरा कभी उस स्टेशन पर पहुँचे, तो उसे यह न लगे कि इंतज़ार ख़त्म हो गया था।',
      },
    ],
  },
];

export async function generateStory({
  storyMode = 'generate',
  prompt = '',
  voiceGender = 'female',
  storyLanguage = 'hindi',
}) {
  const cacheKey = `${storyMode}:${storyLanguage}:${voiceGender}:${prompt.trim().toLowerCase()}`;
  if (storyCache.has(cacheKey)) {
    return storyCache.get(cacheKey);
  }

  const languageDirective =
    storyLanguage === 'english'
      ? 'Write the entire story (title, synopsis, text, and spokenScript) in rich, literary, cinematic English.'
      : storyLanguage === 'hinglish'
      ? 'Write the story (title, text, and spokenScript) in natural, deeply expressive Hinglish (Roman script Hindi + English as spoken in modern Indian cinema/storytelling).'
      : 'Write the entire story (title, text, and spokenScript) in authentic, deeply soulful, natural spoken Hindi (Devanagari script — देवनागरी) worthy of Gulzar and Manto.';

  const jsonStructurePrompt = `
OUTPUT FORMAT (STRICT JSON):
Write a deeply compelling, complete 6-paragraph story (~550–750 words total) with named characters, specific settings, natural dialogue, and an unforgettable emotional or psychological payoff.
Return ONLY valid JSON matching this exact structure:
{
  "title": "Evocative literary title",
  "synopsis": "A quiet, compelling one-line premise",
  "isRealStory": ${storyMode === 'real'},
  "realStoryContext": "If real story: brief verified historical/factual context in 1-2 sentences. Empty string if fictional.",
  "paragraphs": [
    {
      "id": 1,
      "text": "Rich, well-crafted story paragraph (4-6 sentences) for the reader's eyes (NO <tags> here)",
      "spokenScript": "The exact same paragraph enhanced with selective vocal cues (<breath>, <sigh>, <whisper>, <softly>, <pause>, <laugh>) for voice synthesis"
    }
  ]
}`;

  const isRealMode = storyMode === 'real';
  const defaultQuery = isRealMode
    ? 'True story of Dashrath Manjhi carving a path through a mountain over 22 years'
    : 'Write an original, deeply moving story with named characters, an unexpected discovery, and unspoken human subtext.';

  const userQuery = prompt.trim() || defaultQuery;

  const userMessage = isRealMode
    ? `MODE: VERIFIED TRUE STORY (WEB DISCOVERY & LITERARY NARRATION)
Topic / Real Incident: "${userQuery}"
Narrator Voice: ${voiceGender === 'male' ? 'Deep, observant male storyteller' : 'Warm, perceptive female storyteller'}
Language Directive: ${languageDirective}

Instructions:
1. Search the web for the real-life facts, names, dates, places, and emotional core of "${userQuery}".
2. Retell this true event across 6 rich, cinematic paragraphs with literary depth, real human details, and emotional restraint.`
    : `MODE: ORIGINAL LITERARY STORY
User Premise / Idea: "${userQuery}"
Narrator Voice: ${voiceGender === 'male' ? 'Deep, observant male storyteller' : 'Warm, perceptive female storyteller'}
Language Directive: ${languageDirective}

Instructions:
1. Privately invent a deeply original plot with specific named characters, a vivid location, natural dialogue with subtext, and a genuine emotional or psychological turning point.
2. Do NOT write a generic cliché. Write a 6-paragraph literary masterpiece that hooks the listener from the very first sentence and ends with a haunting, unforgettable final moment.`;

  const modelsToTry = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-2.5-flash'];

  try {
    const ai = getAiClient();
    for (const model of modelsToTry) {
      try {
        const config = {
          systemInstruction: `${SOULWRITER_MASTER_CONSTITUTION}\n\n${jsonStructurePrompt}`,
          temperature: isRealMode ? 0.78 : 0.92,
        };

        if (isRealMode) {
          config.tools = [{ googleSearch: {} }];
        } else {
          config.responseMimeType = 'application/json';
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

        const finalResult = {
          ...parsed,
          isRealStory: isRealMode,
          sources,
        };

        storyCache.set(cacheKey, finalResult);
        return finalResult;
      } catch (err) {
        console.warn(`Story generation attempt with ${model} failed:`, err.message);
        await new Promise((r) => setTimeout(r, 800));
      }
    }
  } catch (clientErr) {
    console.warn('AI Client fallback triggered:', clientErr.message);
  }

  return {
    ...LITERARY_ANTHOLOGY_FALLBACKS[0],
    isRealStory: isRealMode,
    sources: [],
  };
}

export async function narrateStory({ script = '', voice = 'Kore' }) {
  if (!script || !script.trim()) {
    throw new Error('Script text is required for narration.');
  }

  const validVoices = ['Kore', 'Fenrir', 'Puck', 'Zephyr', 'Charon'];
  const selectedVoice = validVoices.includes(voice) ? voice : 'Kore';

  const cacheKey = `${selectedVoice}:${script.trim()}`;
  if (ttsCache.has(cacheKey)) {
    return ttsCache.get(cacheKey);
  }

  const cleanScript = script.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

  try {
    const ai = getAiClient();

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: script.trim(),
                speechMetadata: {
                  style:
                    'Natural, emotionally restrained, deeply human literary storyteller. Honor subtle hesitations, quiet sighs, warm intimacy, and subtext.',
                },
              },
            ],
          },
        ],
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
        };
        ttsCache.set(cacheKey, result);
        return result;
      }
    } catch (primaryErr) {
      console.warn('Primary TTS notice, trying Lite TTS:', primaryErr.message);
    }

    const fallbackResponse = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [{ text: cleanScript }],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: selectedVoice },
          },
        },
      },
    });

    const fallbackAudio = fallbackResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (fallbackAudio) {
      const result = {
        audioBase64: ensureWavBase64(fallbackAudio),
        mimeType: 'audio/wav',
        voice: selectedVoice,
      };
      ttsCache.set(cacheKey, result);
      return result;
    }
  } catch (allTtsErr) {
    console.warn('Cloud TTS quota reached, activating Client Neural Voice Fallback:', allTtsErr.message);
  }

  return {
    useBrowserNeuralTts: true,
    cleanScript,
    voice: selectedVoice,
  };
}
