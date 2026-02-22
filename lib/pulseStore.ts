export type PulseReading = {
  heart_rate: number;
  breathing_rate: number;
  confidence: number;
  stress_index: number;
  break_recommended: boolean;
  created_at: number;
};

const store = new Map<string, PulseReading>();

// Persist store to disk in dev so readings survive server restarts.
const PERSIST_PATH = (() => {
  try {
    // only available in Node server environment
    const path = require("path")
    return path.join(process.cwd(), ".pulse_store.json")
  } catch (e) {
    return null
  }
})()

function loadFromDisk() {
  if (!PERSIST_PATH) return
  try {
    const fs = require("fs")
    if (fs.existsSync(PERSIST_PATH)) {
      const raw = fs.readFileSync(PERSIST_PATH, "utf8")
      const obj = JSON.parse(raw)
      for (const k of Object.keys(obj)) {
        store.set(k, obj[k])
      }
    }
  } catch (e) {
    // ignore
  }
}

function saveToDisk() {
  if (!PERSIST_PATH) return
  try {
    const fs = require("fs")
    const obj: Record<string, PulseReading> = {}
    for (const [k, v] of store.entries()) obj[k] = v
    fs.writeFileSync(PERSIST_PATH, JSON.stringify(obj, null, 2), "utf8")
  } catch (e) {
    // ignore
  }
}

// initialize from disk if available
loadFromDisk()

export function savePulse(token: string, reading: PulseReading) {
  store.set(token, reading);
  saveToDisk()
}

export function getPulse(token: string) {
  return store.get(token) ?? null;
}

export function computeStressIndex(
  hr: number,
  br: number,
  hrBase = 75,
  brBase = 14
) {
  const hrDelta = Math.max(0, (hr - hrBase) / hrBase);
  const brDelta = Math.max(0, (br - brBase) / brBase);

  const stress_index = 0.6 * Math.min(1, hrDelta) + 0.4 * Math.min(1, brDelta);

  const break_recommended = stress_index > 0.18;

  return { stress_index, break_recommended };
}
