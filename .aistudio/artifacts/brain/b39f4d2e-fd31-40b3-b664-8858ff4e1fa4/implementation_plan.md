# AI Story Studio: Emotional Hindi Storytelling with Gemini 3.8 & TTS

> **Status: Completed & Verified ✅**
> The AI Story Studio has been implemented with server-side Gemini 3.8 narrative generation, emotional Gemini 3.8 Flash TTS with vocal performance tags (`<breath>`, `<sigh>`, `<whisper>`), full-screen synchronized teleprompter, and continuous soothing monsoon rain acoustics.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following user preferences were confirmed in the interactive interview and will guide this implementation:

- **Language & Narration Mood**: Hindi and Hinglish with a cinematic, romantic, and soulful emotional mood (evoking classic monsoon romance, bittersweet longing, and midnight coffee nostalgia).
- **Interface Experience**: A dedicated full-screen immersive story reader with synchronized paragraph-by-paragraph text highlighting, audio progress seeker, and play/pause controls.
- **Atmospheric Audio**: Blended soft rain sound and acoustic guitar/piano background ambiance playing underneath the storyteller's voice with volume balancing.
- **Story Generation Model**: `gemini-3.8-flash` on server-side with structured prompt instructions injecting expressive theatrical emotion tags (`<breath>`, `<sigh>`, `<whisper>`, `<softly>`, `<pause>`).
- **Narration Audio Model**: `gemini-3.8-flash-tts` on server-side returning high-fidelity 24kHz audio (`audio/wav`) narrated with natural voice cadence (e.g. "Kore" or "Fenrir").

---

## 1. Overview & Core Concept

- **What It Does**: Introduces a new "AI Story" mode to Dreamvalley Radio. Users can either type a custom mood or pick curated prompts (e.g., *"Pehli Barish Ki Shaam"*, *" अधूरी दास्तान - Midnight Coffee"*, *"Train Journey to the Hills"*, *"Acoustic Sunset Romance"*). Gemini generates a heartfelt Hindi/Hinglish narrative with expressive script tags, and Gemini 3.8 TTS synthesizes voice narration with natural pauses, sighs, and warmth.
- **Target Audience**: Dreamvalley Radio listeners who love romantic melodies, late-night shayari, audiobooks, monsoon radio drama, and introspective soulful storytelling.
- **Key Value**: Bridges evergreen music radio and cinematic AI audio storytelling into a unified luxury listening sanctuary.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Triggering Story Studio**:
   - A dedicated **"Story Mode"** action pill in the top header (with book/audio wave icon) and an option in the bottom dock or search modal.
   - Clicking opens the **Story Studio Overlay**.
2. **Mood Selection & Creation**:
   - Quick mood cards: *Romantic Monsoon (बारिश की यादें)*, *Midnight Nostalgia (देर रात का सफर)*, *Cafe Acoustic (कॉफी और खामोशी)*, *First Love (पहला अहसास)*.
   - Custom input: A clean text field with sample suggestions where users can write their own premise or emotions in English, Hindi, or Hinglish.
   - Narrator voice style picker: Warm Female Narrator ("Kore"), Deep Soulful Male Narrator ("Fenrir"), Storyteller Classic ("Puck").
3. **Generation & Audio Streaming**:
   - A smooth, elegant generator animation with poetic status indicators (*"कहानी बुनी जा रही है..."* -> *"आवाज़ में जज़्बात भरे जा रहे हैं..."*).
4. **Immersive Full-Screen Audio Player & Teleprompter**:
   - Dimmed dark velvet amber canvas (`#0a0705` with subtle golden particle ember and rain shimmer).
   - Large typographic story teleprompter with auto-scroll and current paragraph illumination.
   - Audio scrub bar, play/pause, volume faders for Voice and Ambient Rain/Music, repeat, and full-screen toggle.
   - Seamless transition: when a story begins, radio music smoothly ducks or pauses, and rain ambiance fades in softly.

### Visual Identity & Theme

- **Aesthetic Direction**: Neo-editorial luxury radio lounge with warm amber reflections, clean retro-Devanagari typography, and glassmorphic controls.
- **Color Palette**:
  - Dominant Neutral (60%): `#0a0705` (deep obsidian espresso)
  - Structural Surfaces (30%): `rgba(26, 18, 13, 0.75)` with 1px `rgba(245, 158, 11, 0.15)` borders
  - Accent (10%): Warm luminous amber (`#F59E0B`), candlelight gold (`#FDE68A`), and soft monsoon cyan (`#38BDF8`)
- **Typography**:
  - Display Titles: `TekoHindi` / `Teko` condensed display face for dramatic impact
  - Story Body & Narration: `Inter` and `Playfair Display` / clean Devanagari sans for high-readability paragraph flow

---

## 3. Key Product Decisions & Trade-Offs

- **Server-Side Proxy Architecture**:
  - *Chosen Approach*: Implement `/api/story/generate` and `/api/story/narrate` as backend routes (integrated via Vite middleware in dev/preview, using `@google/genai` with `process.env.GEMINI_API_KEY`).
  - *Why*: Conforms strictly with AI Studio security standards (no client-side API keys) and enables server-side parsing and audio WAV buffer delivery.
- **Emotion Tags Handling**:
  - *Chosen Approach*: The text generator will format emotion tags `<breath>`, `<sigh>`, `<whisper>`, `<softly>` directly in the script for `gemini-3.8-flash-tts`. In the visual teleprompter display, these emotion tags will either be styled as subtle italic stage directions or cleaned for distraction-free reading.
  - *Why*: Allows TTS to express authentic human breaths and dramatic pauses while keeping reader typography pristine.
- **Layered Audio Mixing**:
  - *Chosen Approach*: Storyteller voice runs on a dedicated HTML5 Audio element (`audio/wav` blob), while ambient rain and gentle acoustic guitar instrumental runs on a synchronized low-volume background audio channel with an independent volume mixer slider.
  - *Why*: Gives users complete control over narrator volume vs ambient background sounds without audio clipping.

---

## 4. Technical Architecture & Data Strategy

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Dreamvalley Radio Client                        │
│                                                                        │
│  ┌──────────────┐    ┌─────────────────────────┐    ┌────────────────┐ │
│  │  HeaderNav   │───▶│  StoryStudioModal (UI)  │───▶│ StoryTeleprompter│ │
│  │ (Story Pill) │    │  • Mood & Voice Select  │    │ • Paragraph Sync│ │
│  └──────────────┘    │  • Custom Prompt Input  │    │ • Ambient Audio│ │
│                      └───────────┬─────────────┘    └───────▲────────┘ │
└──────────────────────────────────┼──────────────────────────┼──────────┘
                                   │ HTTP POST (Mood/Voice)   │ Audio Blob
                                   ▼                          │ & Script
┌─────────────────────────────────────────────────────────────┼──────────┐
│                   Server API Routes (Vite Backend)          │          │
│                                                             │          │
│  ┌─────────────────────────────┐   ┌────────────────────────┴────────┐ │
│  │ POST /api/story/generate    │   │ POST /api/story/narrate         │ │
│  │ • Model: gemini-3.8-flash   │   │ • Model: gemini-3.8-flash-tts   │ │
│  │ • System: Hindi Storyteller │   │ • Input: Script + Emotion Tags  │ │
│  │ • Tags: <breath>, <sigh>    │   │ • Output: 24kHz WAV Audio Buffer│ │
│  └──────────────┬──────────────┘   └────────────────▲────────────────┘ │
│                 │                                   │                  │
│                 └─────────────── Story Script ──────┘                  │
│                                                                        │
│            Google GenAI SDK (User-Agent: aistudio-build)               │
└────────────────────────────────────────────────────────────────────────┘
```

### Component & State Mapping

- `src/components/StoryStudioModal.jsx`: Full-screen immersive modal containing:
  - Mood selector tabs and prompt input
  - Voice selection ("Kore" soulful female, "Fenrir" resonant male)
  - Interactive playback controller with synchronized teleprompter
  - Audio mixers for Voice and Rain background
- `src/hooks/useStoryNarration.js`: Hook managing story generation state, audio buffering, playback time tracking, and speech paragraph active highlight.
- `server.ts` / `vite.config.js`: Server middleware endpoints:
  - `/api/story/generate`: Accepts `{ mood, prompt, language }`, returns `{ title, storyText, scriptWithTags, paragraphs }`.
  - `/api/story/narrate`: Accepts `{ script, voice }`, calls `gemini-3.8-flash-tts` with `speechConfig`, returns WAV audio binary.
