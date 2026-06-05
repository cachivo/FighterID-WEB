import bell1Asset from '@/assets/time-master-bell-1.mp3.asset.json';
import bell3Asset from '@/assets/time-master-bell-3.mp3.asset.json';

export type AlertKind = 'bell' | 'warning' | 'rest';
export type BellVariant = 'start' | 'end';

export interface AlertChannelSettings {
  sound: boolean;
  vibrate: boolean;
  volume: number; // 0..1
}

export type AlertSettings = Record<AlertKind, AlertChannelSettings>;

const STORAGE_KEY = 'timeMaster.alertSettings.v1';

export const DEFAULT_ALERT_SETTINGS: AlertSettings = {
  bell:    { sound: true, vibrate: true, volume: 0.6 },
  warning: { sound: true, vibrate: true, volume: 0.5 },
  rest:    { sound: true, vibrate: false, volume: 0.4 },
};

export const ALERT_LABELS: Record<AlertKind, string> = {
  bell: 'Campana (inicio / fin de round)',
  warning: 'Aviso (60s / 30s / 10s)',
  rest: 'Fin de descanso',
};

export function loadAlertSettings(): AlertSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_ALERT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<AlertSettings>;
    return {
      bell: { ...DEFAULT_ALERT_SETTINGS.bell, ...(parsed.bell || {}) },
      warning: { ...DEFAULT_ALERT_SETTINGS.warning, ...(parsed.warning || {}) },
      rest: { ...DEFAULT_ALERT_SETTINGS.rest, ...(parsed.rest || {}) },
    };
  } catch {
    return DEFAULT_ALERT_SETTINGS;
  }
}

export function saveAlertSettings(s: AlertSettings) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

interface Tone {
  type: OscillatorType;
  freqStart: number;
  freqEnd: number;
  durationMs: number;
}

const TONES: Record<AlertKind, Tone> = {
  bell:    { type: 'sine',     freqStart: 880,  freqEnd: 440, durationMs: 1500 },
  warning: { type: 'square',   freqStart: 1200, freqEnd: 1200, durationMs: 200 },
  rest:    { type: 'triangle', freqStart: 660,  freqEnd: 330, durationMs: 800 },
};

const VIBRATION: Record<AlertKind, number[]> = {
  bell: [400],
  warning: [120, 80, 120],
  rest: [200, 100, 200],
};

function vibrate(pattern: number[]) {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch { /* ignore */ }
}

function playTone(tone: Tone, volume: number) {
  try {
    const Ctx = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = tone.type;
    const dur = tone.durationMs / 1000;
    osc.frequency.setValueAtTime(tone.freqStart, ctx.currentTime);
    if (tone.freqEnd !== tone.freqStart) {
      osc.frequency.exponentialRampToValueAtTime(tone.freqEnd, ctx.currentTime + dur);
    }
    const v = Math.max(0.0001, Math.min(1, volume));
    gain.gain.setValueAtTime(v, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + dur);
  } catch { /* silent */ }
}

const BELL_URLS: Record<BellVariant, string> = {
  start: bell1Asset.url,
  end: bell3Asset.url,
};

function playBell(variant: BellVariant, volume: number) {
  try {
    const audio = new Audio(BELL_URLS[variant]);
    audio.volume = Math.max(0, Math.min(1, volume));
    void audio.play().catch(() => { /* ignore autoplay errors */ });
  } catch { /* ignore */ }
}

export function playAlert(kind: AlertKind, settings: AlertSettings, variant: BellVariant = 'start') {
  const cfg = settings[kind];
  if (!cfg) return;
  if (cfg.sound) {
    if (kind === 'bell') playBell(variant, cfg.volume);
    else playTone(TONES[kind], cfg.volume);
  }
  if (cfg.vibrate) vibrate(VIBRATION[kind]);
}
