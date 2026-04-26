export class PredictionEngine {
  constructor(patternDB, engine, weightEngine) {
    this.patternDB = patternDB;
    this.engine = engine;
    this.weightEngine = weightEngine;
  }

  getPatternScore(pattern) {
    return pattern?.score || 0.5;
  }

  getEventWeight(pattern) {
    if (!pattern?.nodes || !this.engine || !this.weightEngine) return 0.5;

    const events = pattern.nodes
      .map((id) => this.engine.getEvent(id))
      .filter(Boolean);

    if (events.length === 0) return 0.5;

    const weights = events.map((evt) =>
      this.weightEngine.computeEventWeight(evt)
    );

    return weights.reduce((a, b) => a + b, 0) / weights.length;
  }

  getFeedbackWeight(pattern) {
    const exact = this.patternDB.getExact(pattern);
    return exact?.weightAdjust || 1;
  }

  getTypeBias(pattern) {
    const type = pattern?.type || "";

    if (type === "SENTIMENT_REVERSAL") return 1.1;
    if (type === "CAUSAL_CHAIN") return 0.95;
    if (type === "SPILLOVER") return 1.0;

    return 1.0;
  }

  clampProbability(value) {
    return Math.max(0.05, Math.min(0.95, value));
  }

  calculateProbability({ patternScore, eventWeight, feedbackWeight, typeBias }) {
    const raw =
      patternScore * 0.4 +
      eventWeight * 0.2 +
      feedbackWeight * 0.4;

    return this.clampProbability(raw * typeBias);
  }

  calculateExpectedMove(probability) {
    return (probability - 0.5) * 20;
  }

  predict(pattern) {
    const patternScore = this.getPatternScore(pattern);
    const eventWeight = this.getEventWeight(pattern);
    const feedbackWeight = this.getFeedbackWeight(pattern);
    const typeBias = this.getTypeBias(pattern);

    const probability = this.calculateProbability({
      patternScore,
      eventWeight,
      feedbackWeight,
      typeBias
    });

    const expectedMove = this.calculateExpectedMove(probability);

    return {
      probability,
      expectedMove,
      patternScore,
      eventWeight,
      feedbackWeight,
      typeBias
    };
  }

  predictAll(patterns) {
    return (patterns || [])
      .map((pattern) => ({
        pattern,
        ...this.predict(pattern)
      }))
      .sort((a, b) => b.probability - a.probability)
      .map((item, index) => ({
        rank: index + 1,
        ...item
      }));
  }
}
