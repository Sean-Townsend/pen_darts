/**
 * PenBar Killer Darts - Audio System
 * All sounds generated via Web Audio API — no external files needed.
 */

let audioCtx = null;

function getAudioCtx() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

// === SAFE SOUND WRAPPER ===
// Sound must never be able to block gameplay logic.
function safePlaySound(fn) {
    try {
        fn();
    } catch (err) {
        console.warn('Sound playback failed (non-fatal):', err);
    }
}

// === DART HIT SOUND (own number, gaining life) ===
function playHitSound() {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    
    const noise = ctx.createBufferSource();
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.015));
    }
    noise.buffer = buffer;
    
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 3000;
    noiseFilter.Q.value = 2;
    
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);
    
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.05);
    
    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.3, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
}

// === MISS SOUND ===
function playMissSound() {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    
    const noise = ctx.createBufferSource();
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.03));
    }
    noise.buffer = buffer;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 500;
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
    
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.2);
    
    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.15, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
}

// === BECOME KILLER FANFARE ===
function playBecomeKillerSound() {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    
    // Ominous rising sting
    const osc1 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(100, now);
    osc1.frequency.exponentialRampToValueAtTime(400, now + 0.4);
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, now);
    filter.frequency.exponentialRampToValueAtTime(2000, now + 0.4);
    
    const gain1 = ctx.createGain();
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.setValueAtTime(0.2, now + 0.35);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    
    osc1.connect(filter);
    filter.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.5);
    
    // Dark chord stab
    const chordFreqs = [110, 130.81, 164.81]; // A, C, E minor-ish
    chordFreqs.forEach(freq => {
        const osc = ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.value = freq;
        
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, now + 0.3);
        gain.gain.linearRampToValueAtTime(0.12, now + 0.35);
        gain.gain.setValueAtTime(0.12, now + 0.6);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + 0.3);
        osc.stop(now + 1.1);
    });
}

// === LOSE KILLER STATUS (demoted) ===
function playLoseKillerSound() {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(500, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.4);
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.5);
}

// === PLAYER ELIMINATED ===
function playEliminatedSound() {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    
    // Descending doom tone
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.8);
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, now);
    filter.frequency.exponentialRampToValueAtTime(200, now + 0.8);
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 1.0);
    
    // Impact thud
    const noise = ctx.createBufferSource();
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.04));
    }
    noise.buffer = buffer;
    
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.3, now);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    
    noise.connect(nGain);
    nGain.connect(ctx.destination);
    noise.start(now);
}

// === WIN FANFARE ===
function playWinSound() {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    
    const melody = [
        { freq: 523.25, time: 0, dur: 0.2 },
        { freq: 587.33, time: 0.2, dur: 0.2 },
        { freq: 659.25, time: 0.4, dur: 0.2 },
        { freq: 783.99, time: 0.6, dur: 0.3 },
        { freq: 659.25, time: 0.9, dur: 0.15 },
        { freq: 783.99, time: 1.05, dur: 0.15 },
        { freq: 1046.50, time: 1.2, dur: 0.8 },
    ];
    
    const harmony = [
        { freq: 261.63, time: 0, dur: 0.6 },
        { freq: 329.63, time: 0.6, dur: 0.6 },
        { freq: 392.00, time: 1.2, dur: 0.8 },
    ];
    
    melody.forEach(note => {
        const osc = ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.value = note.freq;
        
        const gain = ctx.createGain();
        const t = now + note.time;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.18, t + 0.02);
        gain.gain.setValueAtTime(0.18, t + note.dur * 0.7);
        gain.gain.exponentialRampToValueAtTime(0.001, t + note.dur);
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 2500;
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + note.dur + 0.1);
    });
    
    harmony.forEach(note => {
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.value = note.freq;
        
        const gain = ctx.createGain();
        const t = now + note.time;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.12, t + 0.03);
        gain.gain.setValueAtTime(0.12, t + note.dur * 0.6);
        gain.gain.exponentialRampToValueAtTime(0.001, t + note.dur);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + note.dur + 0.1);
    });
    
    const noise = ctx.createBufferSource();
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    noise.buffer = buffer;
    
    const nFilter = ctx.createBiquadFilter();
    nFilter.type = 'highpass';
    nFilter.frequency.value = 7000;
    
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0, now + 1.2);
    nGain.gain.linearRampToValueAtTime(0.15, now + 1.25);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
    
    noise.connect(nFilter);
    nFilter.connect(nGain);
    nGain.connect(ctx.destination);
    noise.start(now + 1.2);
    noise.stop(now + 2.5);
}

// === TURN CHANGE CHIME ===
function playTurnChangeSound() {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = 880;
    
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = 1320;
    
    const gain1 = ctx.createGain();
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    
    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.setValueAtTime(0.15, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    
    osc1.start(now);
    osc1.stop(now + 0.35);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.45);
}

// === SELECT / CONFIRM SOUND ===
function playSelectSound() {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.08);
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
    
    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.value = 880;
    
    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(0, now + 0.08);
    gain2.gain.linearRampToValueAtTime(0.15, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.35);
}

// === HOVER SOUND ===
function playHoverSound() {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 1000;
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
}

// === REJECT SOUND (duplicate number claim) ===
function playRejectSound() {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.setValueAtTime(150, now + 0.1);
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
}
