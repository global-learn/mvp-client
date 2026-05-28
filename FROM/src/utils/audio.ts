// Web Audio API synthesiser for premium, latency-free corporate-app sounds
// Built to elevate the feedback loops with physical/mechanical feel

class SoundEngine {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Soft mechanical key click sound for interactions
  playClick() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch (e) {
      // Ignore audio constraints or blocks
    }
  }

  // Soft high success ping for checklist item checked
  playCheck() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, this.ctx.currentTime); // A5 note
      osc.frequency.setValueAtTime(1320, this.ctx.currentTime + 0.04); // E6 note

      gain.gain.setValueAtTime(0.03, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch (e) {}
  }

  // Multi-tone notification chime for step completed
  playStepSuccess() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      
      const playTone = (freq: number, start: number, duration: number, volume: number) => {
        if (!this.ctx) return;
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(freq, start);
        g.gain.setValueAtTime(volume, start);
        g.gain.exponentialRampToValueAtTime(0.001, start + duration);
        o.connect(g);
        g.connect(this.ctx.destination);
        o.start(start);
        o.stop(start + duration);
      };

      // Play major arpeggio (C5 - E5 - G5 - C6)
      playTone(523.25, now, 0.15, 0.03);      // C5
      playTone(659.25, now + 0.06, 0.15, 0.03); // E5
      playTone(783.99, now + 0.12, 0.15, 0.03); // G5
      playTone(1046.50, now + 0.18, 0.25, 0.05); // C6
    } catch (e) {}
  }

  // Deep positive swell for all-steps complete
  playFinalSuccess() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Complex corporate fanfare
      const chord = [261.63, 329.63, 392.00, 523.25, 659.25]; // C major chord
      chord.forEach((freq, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.05);
        gain.gain.setValueAtTime(0.02, now + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.6);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.05);
        osc.stop(now + i * 0.05 + 0.6);
      });
    } catch (e) {}
  }
}

export const sound = new SoundEngine();
