"""Deterministic sound-design synth + mixer.

usage: python sfx.py cues.json out.wav [--seconds 76.5]
cues.json: [{"beat": 8, "type": "impact", "gain": 1.0, "dur": 0.6, "pan": 0.0}, ...]
beat = GLOBAL film beat (float). Types:
  tick tap click type pen chalk paper flip whoosh swoosh thud impact riser swell
  shimmer bell stamp sub
Keep it tasteful: most cues gain 0.3-0.8, a few hero hits at 1.0.
"""
import json, sys
import numpy as np

SR = 48000
B = 0.7179
rng = np.random.default_rng(7)

def env(n, a, d, curve=4.0):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-curve * np.maximum(0, t - a) / max(d, 1e-4))
    return e

def noise(n, seed):
    return np.random.default_rng(seed).standard_normal(n)

def bandpass(x, lo, hi):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    X[(f < lo) | (f > hi)] = 0
    return np.fft.irfft(X, len(x))

def sweep_bp(x, f0, f1, width=0.6):
    # time-varying band-pass via short-time FFT
    hop, win = 512, 2048
    out = np.zeros(len(x) + win); w = np.hanning(win)
    frames = range(0, len(x), hop)
    for k, i in enumerate(frames):
        seg = np.zeros(win); s = x[i:i + win]; seg[:len(s)] = s
        p = i / max(1, len(x)); fc = f0 * (f1 / f0) ** p
        S = np.fft.rfft(seg * w); f = np.fft.rfftfreq(win, 1 / SR)
        g = np.exp(-0.5 * (np.log(np.maximum(f, 1) / fc) / width) ** 2)
        out[i:i + win] += np.fft.irfft(S * g, win) * w
    return out[:len(x)] / 1.5

def sine(n, f, phase=0):
    t = np.arange(n) / SR
    f = np.broadcast_to(f, (n,)) if np.ndim(f) else np.full(n, f)
    return np.sin(2 * np.pi * np.cumsum(f) / SR + phase)

def synth(kind, dur, seed):
    n = int(SR * max(dur, 0.05))
    if kind == 'tick':
        n = int(SR * 0.05); return (sine(n, 3800) * env(n, 0.0005, 0.012) + 0.3 * noise(n, seed) * env(n, 0.0003, 0.004)) * 0.6
    if kind == 'click':
        n = int(SR * 0.04); return bandpass(noise(n, seed), 1500, 9000) * env(n, 0.0002, 0.006) * 1.2
    if kind == 'tap':
        n = int(SR * 0.12); return (sine(n, 880) * 0.6 + sine(n, 1760) * 0.25) * env(n, 0.0008, 0.035) + 0.2 * bandpass(noise(n, seed), 800, 5000) * env(n, 0.0003, 0.01)
    if kind == 'type':
        n = int(SR * 0.09); return bandpass(noise(n, seed), 1800, 7000) * env(n, 0.0003, 0.008) * 1.1 + sine(n, 180) * env(n, 0.001, 0.03) * 0.5
    if kind == 'pen':
        x = bandpass(noise(n, seed), 2500, 9000); am = 0.6 + 0.4 * np.abs(np.sin(np.arange(n) / SR * 2 * np.pi * 23))
        return x * am * env(n, 0.03, dur * 0.8, 2.0) * 0.35
    if kind == 'chalk':
        x = bandpass(noise(n, seed), 900, 6000); crack = (noise(n, seed + 1) > 2.3) * noise(n, seed + 2) * 2
        return (x * 0.5 + bandpass(crack, 1500, 8000)) * env(n, 0.02, dur * 0.8, 2.0) * 0.45
    if kind in ('paper', 'flip'):
        n = int(SR * (dur if kind == 'paper' else 0.28)); x = bandpass(noise(n, seed), 400, 9000)
        crinkle = bandpass((noise(n, seed + 3) > 1.8) * noise(n, seed + 4), 2000, 10000)
        return (x * 0.5 + crinkle * 0.9) * env(n, 0.01, n / SR * 0.5, 3.0) * 0.5
    if kind in ('whoosh', 'swoosh'):
        if kind == 'swoosh': n = int(SR * 0.35)
        x = sweep_bp(noise(n, seed), 300, 4000, 0.5)
        t = np.linspace(0, 1, n); e = np.sin(np.pi * t) ** 1.5
        return x * e * 1.4
    if kind == 'thud':
        n = int(SR * 0.6); f = 70 * np.exp(-np.arange(n) / SR * 6) + 38
        return sine(n, f) * env(n, 0.002, 0.18) * 1.1 + bandpass(noise(n, seed), 100, 2000) * env(n, 0.0005, 0.02) * 0.4
    if kind == 'sub':
        n = int(SR * 1.0); f = 52 * np.exp(-np.arange(n) / SR * 2) + 30
        return sine(n, f) * env(n, 0.003, 0.5, 2.5) * 1.0
    if kind == 'impact':
        n = int(SR * 1.6); f = 80 * np.exp(-np.arange(n) / SR * 5) + 35
        body = sine(n, f) * env(n, 0.002, 0.45, 3.0) * 1.1
        crack = bandpass(noise(n, seed), 200, 9000) * env(n, 0.0005, 0.08, 4) * 0.8
        tail = bandpass(noise(n, seed + 5), 300, 3000) * env(n, 0.01, 1.0, 3) * 0.15
        return body + crack + tail
    if kind == 'riser':
        t = np.linspace(0, 1, n); x = sweep_bp(noise(n, seed), 200, 7000, 0.4)
        tone = sine(n, 110 * 2 ** (t * 2.0)) * 0.25
        return (x * 0.9 + tone) * t ** 2.2
    if kind == 'swell':
        t = np.linspace(0, 1, n); x = bandpass(noise(n, seed), 800, 12000)
        return x * t ** 3 * 0.8
    if kind == 'shimmer':
        t = np.arange(n) / SR; x = sum(np.sin(2 * np.pi * f * t + i) for i, f in enumerate([1568, 2349, 3136, 4699])) / 4
        return x * env(n, dur * 0.3, dur * 0.7, 2.5) * 0.35
    if kind == 'bell':
        n = int(SR * 2.5); t = np.arange(n) / SR
        x = sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t * d) for f, a, d in [(523.25, 1, 1.4), (1046.5, 0.5, 2.0), (1312.0, 0.3, 2.8), (1567.98, 0.25, 3.5), (2093, 0.15, 5)])
        return x * env(n, 0.002, 2.2, 1.0) * 0.5
    if kind == 'stamp':
        n = int(SR * 0.5); return synth('thud', 0.5, seed)[:n] * 0.8 + bandpass(noise(n, seed + 9), 300, 6000) * env(n, 0.0005, 0.03) * 0.9
    raise ValueError(kind)

def reverb(x, seconds=1.2, mix=0.18, seed=11):
    n = int(SR * seconds); ir = noise(n, seed) * np.exp(-np.arange(n) / SR * 5.0); ir /= np.sqrt((ir ** 2).sum())
    wet = np.fft.irfft(np.fft.rfft(x, len(x) + n) * np.fft.rfft(ir, len(x) + n), len(x) + n)[:len(x)]
    return x * (1 - mix) + wet * mix

def main():
    cues = json.load(open(sys.argv[1])); out = sys.argv[2]
    seconds = float(sys.argv[sys.argv.index('--seconds') + 1]) if '--seconds' in sys.argv else 96 * B
    N = int(SR * seconds) + SR * 3
    L = np.zeros(N); R = np.zeros(N)
    for k, c in enumerate(cues):
        x = synth(c['type'], c.get('dur', 0.6), 1000 + k) * c.get('gain', 0.7)
        i = int(round(c['beat'] * B * SR)) + int(SR * c.get('offset', 0))
        if i >= N: continue
        x = x[:N - i]; p = np.clip(c.get('pan', 0), -1, 1)
        L[i:i + len(x)] += x * np.sqrt((1 - p) / 2) * 1.414; R[i:i + len(x)] += x * np.sqrt((1 + p) / 2) * 1.414
    L, R = reverb(L), reverb(R, seed=12)
    st = np.stack([L, R], 1)[:int(SR * seconds)]
    peak = np.abs(st).max() or 1
    st = st / max(peak, 1.0) * 0.89
    import wave
    with wave.open(out, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((st * 32767).astype(np.int16).tobytes())
    print(out, len(cues), 'cues')

if __name__ == '__main__':
    main()
