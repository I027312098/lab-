export class PatternDatabase {
  constructor(initialPatterns = []) {
    this.patterns = initialPatterns;
  }

  async load(path) {
    const res = await fetch(path);
    this.patterns = await res.json();
    return this.patterns;
  }

  getByType(type) {
    return this.patterns.filter((p) => p.type === type);
  }

  getExact(pattern) {
    return this.patterns.find(
      (p) =>
        p.type === pattern.type &&
        JSON.stringify(p.nodes) === JSON.stringify(pattern.nodes)
    );
  }

  save(pattern) {
    const existing = this.getExact(pattern);

    if (existing) {
      existing.score = pattern.score;
      existing.desc = pattern.desc;
      if (pattern.weightAdjust !== undefined) {
        existing.weightAdjust = pattern.weightAdjust;
      }
      return existing;
    }

    const copy = { ...pattern };
    this.patterns.push(copy);
    return copy;
  }

  all() {
    return this.patterns;
  }
}
