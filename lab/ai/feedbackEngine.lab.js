export class FeedbackEngine {
  constructor(patternDB) {
    this.patternDB = patternDB;
  }

  evaluate(pattern, actualOutcome) {
    const history = this.patternDB.getByType(pattern.type);

    history.forEach((p) => {
      const sameNodes =
        JSON.stringify(p.nodes) === JSON.stringify(pattern.nodes);

      if (!sameNodes) return;

      if (!p.weightAdjust) p.weightAdjust = 1;

      if (actualOutcome.success) {
        p.weightAdjust *= 1.05;
      } else {
        p.weightAdjust *= 0.95;
      }

      p.weightAdjust = Math.max(0.5, Math.min(2, p.weightAdjust));
    });
  }
}
