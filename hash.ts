/**
 * FNV-1a 32-bit hash of a string.
 * Same input always produces same output — safe to use as a glyph seed.
 */
export function stringHash(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

/**
 * Returns 5 independent deterministic random functions from a single seed.
 * Each stream is XOR-shifted into a different region of the hash space,
 * so decisions made in one stream don't affect decisions in another.
 */
export function makeRands(seed: number): Array<() => number> {
  const offsets = [0, 0xdeadbeef, 0xcafebabe, 0x12345678, 0xabcdef01];
  return offsets.map((offset) => {
    let state = (seed ^ offset) >>> 0;
    return () => {
      state = (Math.imul(state ^ (state >>> 16), 0x45d9f3b) >>> 0);
      state = (Math.imul(state ^ (state >>> 16), 0x45d9f3b) >>> 0);
      state = (state ^ (state >>> 16)) >>> 0;
      return state / 0xffffffff;
    };
  });
}
