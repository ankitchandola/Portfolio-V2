export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// FNV-1a over UTF-16 code units: stable across browsers and Node.
export function hashSeed(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash;
}

export function randomSeed(
  source: {
    getRandomValues(values: Uint32Array<ArrayBuffer>): Uint32Array<ArrayBuffer>;
  } = globalThis.crypto,
): string {
  const value = new Uint32Array(1);
  source.getRandomValues(value);
  const seed = value[0];
  if (seed === undefined) throw new Error('Random seed buffer is empty');
  return seed.toString(36).toUpperCase().padStart(6, '0').slice(-6);
}
