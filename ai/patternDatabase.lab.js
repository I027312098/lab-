export class PatternDatabase {
  constructor(initialPatterns = []) {
    this.patterns = initialPatterns;
  }

  async load(path) {
    const res = await fetch(path);
    this.patterns = await res.json();
    return this.patterns;
  }

  isSamePattern(a, b) {
    return (
      a &&
      b &&
      a.type === b.type &&
      JSON.stringify(a.nodes || []) === JSON.stringify(b.nodes || [])
    );
  }

  getByType(type) {
    return this.patterns.filter((p) => p.type === type);
  }

  getExact(pattern) {
    return this.patterns.find((p) => this.isSamePattern(p, pattern));
  }

  save(pattern) {
    const existing = this.getExact(pattern);

    if (existing) {
      existing.score = pattern.score;
      existing.desc = pattern.desc;

      // 기존 feedback 값 유지
      if (typeof existing.weightAdjust !== "number") {
        existing.weightAdjust = 1;
      }

      return existing;
    }

    const copy = {
      ...pattern,
      weightAdjust: typeof pattern.weightAdjust === "number" ? pattern.weightAdjust : 1
    };

    this.patterns.push(copy);
    return copy;
  }

  all() {
    return this.patterns;
  }
}
