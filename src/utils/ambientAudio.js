/**
 * Multi-Channel Web Audio API Spatial Soundscape Synthesizer
 * Supports simultaneous mixing of:
 * 1. Monsoon Rain (rain)
 * 2. Midnight Ocean Waves (waves)
 * 3. Analog Vinyl Crackle (vinyl)
 * 4. Fireplace Hearth (fire)
 * Also maintains full backward-compatibility with single-mode .start(mode) / .setVolume(val).
 */

class AmbientAudioEngine {
  constructor() {
    this.ctx = null;
    // Legacy single-channel nodes (used by Story Studio)
    this.gainNode = null;
    this.noiseNode = null;
    this.filterNode = null;
    this.chimeInterval = null;
    this.isPlaying = false;
    this.currentMode = 'rain';
    this.volume = 0.25;

    // Multi-channel mixer state
    this.layers = {
      rain: { volume: 0, gain: null, source: null, interval: null },
      waves: { volume: 0, gain: null, source: null, lfo: null },
      vinyl: { volume: 0, gain: null, source: null, interval: null },
      fire: { volume: 0, gain: null, source: null, interval: null },
    };
  }

  init() {
    if (this.ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    this.ctx = new AudioContext();

    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    this.gainNode.connect(this.ctx.destination);
  }

  // =====================================================================
  // MULTI-CHANNEL SPATIAL MIXER API
  // =====================================================================
  setLayerVolume(layerId, val) {
    this.init();
    if (!this.ctx || !this.layers[layerId]) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const clamped = Math.max(0, Math.min(1, val));
    const layer = this.layers[layerId];
    layer.volume = clamped;

    if (clamped > 0.01) {
      if (!layer.source) {
        this.startLayerNode(layerId);
      }
      if (layer.gain) {
        layer.gain.gain.setTargetAtTime(clamped * 0.65, this.ctx.currentTime, 0.08);
      }
    } else {
      this.stopLayerNode(layerId);
    }
  }

  getLayerVolumes() {
    return {
      rain: this.layers.rain.volume,
      waves: this.layers.waves.volume,
      vinyl: this.layers.vinyl.volume,
      fire: this.layers.fire.volume,
    };
  }

  hasActiveLayers() {
    return Object.values(this.layers).some((l) => l.volume > 0.01);
  }

  stopAllLayers() {
    Object.keys(this.layers).forEach((id) => {
      this.layers[id].volume = 0;
      this.stopLayerNode(id);
    });
  }

  startLayerNode(layerId) {
    if (!this.ctx) return;
    const layer = this.layers[layerId];
    this.stopLayerNode(layerId);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(layer.volume * 0.65, this.ctx.currentTime);
    gain.connect(this.ctx.destination);
    layer.gain = gain;

    const bufferSize = this.ctx.sampleRate * 4;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    if (layerId === 'rain') {
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        lastOut = (lastOut + 0.02 * white) / 1.02;
        output[i] = lastOut * 3.2;
      }
      const src = this.ctx.createBufferSource();
      src.buffer = noiseBuffer;
      src.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(850, this.ctx.currentTime);
      src.connect(filter);
      filter.connect(gain);
      src.start();
      layer.source = src;
    } else if (layerId === 'waves') {
      let b0 = 0,
        b1 = 0,
        b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.969 * b2 + white * 0.153852;
        // Slow wave swell envelope baked into 4s loop
        const swell = 0.55 + 0.45 * Math.sin((i / bufferSize) * Math.PI * 2);
        output[i] = (b0 + b1 + b2) * 0.48 * swell;
      }
      const src = this.ctx.createBufferSource();
      src.buffer = noiseBuffer;
      src.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(420, this.ctx.currentTime);
      src.connect(filter);
      filter.connect(gain);
      src.start();
      layer.source = src;
    } else if (layerId === 'vinyl') {
      // Subtle warm analog hiss + random micro-pops
      for (let i = 0; i < bufferSize; i++) {
        const hiss = (Math.random() * 2 - 1) * 0.04;
        const pop = Math.random() < 0.00045 ? (Math.random() * 2 - 1) * 0.85 : 0;
        output[i] = hiss + pop;
      }
      const src = this.ctx.createBufferSource();
      src.buffer = noiseBuffer;
      src.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1900, this.ctx.currentTime);
      filter.Q.setValueAtTime(0.9, this.ctx.currentTime);
      src.connect(filter);
      filter.connect(gain);
      src.start();
      layer.source = src;
    } else if (layerId === 'fire') {
      // Warm low-end hearth rumble + soft ember crackles
      let last = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        last = (last + 0.04 * white) / 1.04;
        const crackle = Math.random() < 0.0008 ? (Math.random() * 2 - 1) * 0.7 : 0;
        output[i] = last * 2.6 + crackle;
      }
      const src = this.ctx.createBufferSource();
      src.buffer = noiseBuffer;
      src.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(620, this.ctx.currentTime);
      src.connect(filter);
      filter.connect(gain);
      src.start();
      layer.source = src;
    }
  }

  stopLayerNode(layerId) {
    const layer = this.layers[layerId];
    if (!layer) return;
    if (layer.interval) {
      clearInterval(layer.interval);
      layer.interval = null;
    }
    if (layer.source) {
      try {
        layer.source.stop();
        layer.source.disconnect();
      } catch (e) {}
      layer.source = null;
    }
    if (layer.gain) {
      try {
        layer.gain.disconnect();
      } catch (e) {}
      layer.gain = null;
    }
  }

  // =====================================================================
  // LEGACY SINGLE-MODE API (USED BY STORY STUDIO)
  // =====================================================================
  start(mode = 'rain') {
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    if (this.isPlaying) {
      this.stop();
    }

    this.isPlaying = true;
    this.currentMode = mode;

    if (mode === 'rain') {
      this.startRain();
    } else if (mode === 'waves') {
      this.startWaves();
    }
  }

  startRain() {
    const bufferSize = this.ctx.sampleRate * 4;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.02 * white) / 1.02;
      output[i] = lastOut * 3.5;
    }

    this.noiseNode = this.ctx.createBufferSource();
    this.noiseNode.buffer = noiseBuffer;
    this.noiseNode.loop = true;

    this.filterNode = this.ctx.createBiquadFilter();
    this.filterNode.type = 'lowpass';
    this.filterNode.frequency.setValueAtTime(800, this.ctx.currentTime);
    this.filterNode.Q.setValueAtTime(1.2, this.ctx.currentTime);

    this.noiseNode.connect(this.filterNode);
    this.filterNode.connect(this.gainNode);
    this.noiseNode.start();

    this.chimeInterval = setInterval(() => {
      if (!this.isPlaying || !this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const dropGain = this.ctx.createGain();

        const freq = 1200 + Math.random() * 800;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.4, this.ctx.currentTime + 0.12);

        dropGain.gain.setValueAtTime(0.04 * this.volume, this.ctx.currentTime);
        dropGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.12);

        osc.connect(dropGain);
        dropGain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.13);
      } catch (e) {}
    }, 450);
  }

  startWaves() {
    const bufferSize = this.ctx.sampleRate * 4;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    let b0 = 0,
      b1 = 0,
      b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      output[i] = (b0 + b1 + b2) * 0.5;
    }

    this.noiseNode = this.ctx.createBufferSource();
    this.noiseNode.buffer = noiseBuffer;
    this.noiseNode.loop = true;

    this.filterNode = this.ctx.createBiquadFilter();
    this.filterNode.type = 'lowpass';
    this.filterNode.frequency.setValueAtTime(450, this.ctx.currentTime);

    this.noiseNode.connect(this.filterNode);
    this.filterNode.connect(this.gainNode);
    this.noiseNode.start();
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.cancelScheduledValues(this.ctx.currentTime);
      this.gainNode.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  stop() {
    if (this.chimeInterval) {
      clearInterval(this.chimeInterval);
      this.chimeInterval = null;
    }
    if (this.noiseNode) {
      try {
        this.noiseNode.stop();
        this.noiseNode.disconnect();
      } catch (e) {}
      this.noiseNode = null;
    }
    if (this.filterNode) {
      try {
        this.filterNode.disconnect();
      } catch (e) {}
      this.filterNode = null;
    }
    this.isPlaying = false;
  }
}

export const ambientAudio = new AmbientAudioEngine();
