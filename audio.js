/**
 * PenBar Snakes & Ladders - Audio System
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

// === DART THROW SOUND ===
function playDartSound() {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    
    // Sharp attack noise (thud)
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
    
    // Tonal thunk
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

// === TOKEN MOVE SOUND (step/click) ===
function playMoveSound() {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.07);
}

// === SNAKE HISS SOUND ===
function playSnakeSound() {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    const duration = 1.2;
    
    // White noise filtered to sound like a hiss
    const noise = ctx.createBufferSource();
    const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    noise.buffer = buffer;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(4000, now);
    filter.frequency.linearRampToValueAtTime(6000, now + duration * 0.5);
    filter.frequency.linearRampToValueAtTime(3000, now + duration);
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.1);
    gain.gain.setValueAtTime(0.25, now + duration * 0.3);
    gain.gain.linearRampToValueAtTime(0.15, now + duration * 0.7);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    
    // Add a subtle oscillating volume for the "sss" feel
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 15;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.08;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    lfo.start(now);
    lfo.stop(now + duration);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + duration);
}

// === LADDER CLIMB SOUND (ascending whoosh) ===
function playLadderSound() {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    const duration = 0.8;
    
    // Rising tone
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + duration);
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.setValueAtTime(0.2, now + duration * 0.7);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
    
    // Sparkle effect
    for (let i = 0; i < 5; i++) {
        const sparkle = ctx.createOscillator();
        sparkle.type = 'sine';
        sparkle.frequency.value = 1000 + i * 300;
        
        const sGain = ctx.createGain();
        const t = now + i * 0.15;
        sGain.gain.setValueAtTime(0, t);
        sGain.gain.linearRampToValueAtTime(0.1, t + 0.02);
        sGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        
        sparkle.connect(sGain);
        sGain.connect(ctx.destination);
        sparkle.start(t);
        sparkle.stop(t + 0.15);
    }
}

// === WIN FANFARE ===
function playWinSound() {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    
    // Extended triumphant melody
    const melody = [
        { freq: 523.25, time: 0, dur: 0.2 },      // C5
        { freq: 587.33, time: 0.2, dur: 0.2 },    // D5
        { freq: 659.25, time: 0.4, dur: 0.2 },    // E5
        { freq: 783.99, time: 0.6, dur: 0.3 },    // G5
        { freq: 659.25, time: 0.9, dur: 0.15 },   // E5
        { freq: 783.99, time: 1.05, dur: 0.15 },  // G5
        { freq: 1046.50, time: 1.2, dur: 0.8 },   // C6 (held)
    ];
    
    // Harmony underneath
    const harmony = [
        { freq: 261.63, time: 0, dur: 0.6 },      // C4
        { freq: 329.63, time: 0.6, dur: 0.6 },    // E4
        { freq: 392.00, time: 1.2, dur: 0.8 },    // G4
    ];
    
    // Play melody
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
    
    // Play harmony
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
    
    // Cymbal crash at the big note
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
    
    // Final sustained chord
    const chordFreqs = [523.25, 659.25, 783.99, 1046.50];
    chordFreqs.forEach(freq => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq;
        
        const gain = ctx.createGain();
        const t = now + 1.5;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.08, t + 0.05);
        gain.gain.setValueAtTime(0.08, t + 0.8);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 1.6);
    });
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


// === PLAYER SELECT SOUND (button click/pop) ===
function playSelectSound() {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    
    // Pop
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
    
    // Confirmation tone
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


// === HOVER SOUND (subtle tick) ===
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


// === MISS SOUND (dart hits the wall/floor) ===
function playMissSound() {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    
    // Dull thud/clatter
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
    
    // Descending "womp" tone
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
