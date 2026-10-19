/**
 * Web Audio API synthesizer for continuous ambient background audio
 * (Monsoon Rain & Midnight Cafe warmth).
 * Runs completely client-side with zero external assets required.
 */

class AmbientAudioEngine {
  constructor() {
    this.ctx = null;
    this.gainNode = null;
    this.noiseNode = null;
    this.filterNode = null;
    this.chimeInterval = null;
    this.isPlaying = false;
    this.currentMode = 'rain'; // 'rain', 'waves', 'off'
    this.volume = 0.25;
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
    // Generate 5-second brownian/pink noise buffer for rain ambient
    const bufferSize = this.ctx.sampleRate * 4;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Brownian integration with soft decay
      lastOut = (lastOut + 0.02 * white) / 1.02;
      output[i] = lastOut * 3.5;
    }

    this.noiseNode = this.ctx.createBufferSource();
    this.noiseNode.buffer = noiseBuffer;
    this.noiseNode.loop = true;

    // Filter for distant pattering rain
    this.filterNode = this.ctx.createBiquadFilter();
    this.filterNode.type = 'lowpass';
    this.filterNode.frequency.setValueAtTime(800, this.ctx.currentTime);
    this.filterNode.Q.setValueAtTime(1.2, this.ctx.currentTime);

    this.noiseNode.connect(this.filterNode);
    this.filterNode.connect(this.gainNode);
    this.noiseNode.start();

    // Occasional soft droplet resonance
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

    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
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
