import { WeightEngine } from "./weightEngine.lab.js";

export class PatternMiner {
  constructor(engine, cy) {
    this.engine = engine;
    this.cy = cy;
    this.weightEngine = new WeightEngine(engine);
  }

  makePatternId(type, nodes) {
  if (!nodes || nodes.length === 0) return `PATTERN-${type}-EMPTY`;


  const nodesKey = nodes.join("->"); // 순서 유지 중요
  return `PATTERN-${type}-${nodesKey}`;
}


  getTimeDecay(a, b) {
    if (!a?.time || !b?.time) return 0.8;

    const dtHours = Math.abs(
      (new Date(b.time).getTime() - new Date(a.time).getTime()) / (1000 * 60 * 60)
    );

    if (dtHours <= 6) return 1.0;
    if (dtHours <= 24) return 0.9;
    if (dtHours <= 72) return 0.75;
    return 0.6;
  }

  getSentimentBonus(a, b) {
    const sa = (a?.sentiment || "").toLowerCase();
    const sb = (b?.sentiment || "").toLowerCase();

    if (sa === "bullish" && sb === "bearish") return 1.15;
    if (sa === "bearish" && sb === "bullish") return 1.1;
    if (sa && sb && sa === sb) return 1.0;

    return 0.95;
  }

  getFeedbackWeight(aId, bId, type) {
    let weight = 1;

    const edges = this.engine.getEdges() || [];
    const edge = edges.find(
      (e) =>
        e.type === type &&
        ((e.from === aId && e.to === bId) || (e.from === bId && e.to === aId))
    );

    if (edge && typeof edge.weightAdjust === "number") {
      weight *= edge.weightAdjust;
    }

    return Math.max(0.8, Math.min(1.25, weight));
  }

  clampScore(score) {
    return Math.max(0, Math.min(1, score));
  }

  mine() {
    const nodes = [...this.engine.getNodes()].sort(
      (a, b) => new Date(a.time || 0) - new Date(b.time || 0)
    );

    const edges = this.engine.getEdges() || [];
    const results = [];
    const visited = new Set();

    // 1. CAUSAL_CHAIN
    edges.forEach((e) => {
      if (e.type !== "CAUSE") return;

      const key = `${e.from}->${e.to}`;
      if (visited.has(key)) return;

      const A = this.engine.getEvent(e.from);
      const B = this.engine.getEvent(e.to);

      if (!A || !B) return;
      if (A.time && B.time && new Date(A.time) > new Date(B.time)) return;

      const wA = this.weightEngine.computeEventWeight(A);
      const wB = this.weightEngine.computeEventWeight(B);
      const edgeStrength = typeof e.strength === "number" ? e.strength : 0.6;
      const timeDecay = this.getTimeDecay(A, B);
      const sentimentBonus = this.getSentimentBonus(A, B);
      const feedbackWeight = this.getFeedbackWeight(A.id, B.id, e.type);

      const score = this.clampScore(
        ((wA * 0.45 + wB * 0.45) + edgeStrength * 0.1) *
          timeDecay *
          sentimentBonus *
          feedbackWeight
      );

      if (score > 0.3) {
        results.push({
          id: this.makePatternId("CAUSAL_CHAIN", [A.id, B.id]),
          type: "CAUSAL_CHAIN",
          nodes: [A.id, B.id],
          score,
          desc: `${A.label} → ${B.label}`
        });
        visited.add(key);
      }
    });

    // 2. SENTIMENT_REVERSAL
    for (let i = 0; i < nodes.length - 1; i++) {
      const a = nodes[i];
      const b = nodes[i + 1];

      const sa = (a.sentiment || "").toLowerCase();
      const sb = (b.sentiment || "").toLowerCase();

      if (sa === "bullish" && sb === "bearish") {
        const timeDecay = this.getTimeDecay(a, b);
        const wA = this.weightEngine.computeEventWeight(a);
        const wB = this.weightEngine.computeEventWeight(b);

        const score = this.clampScore(
          (0.45 + ((wA + wB) / 2) * 0.35) * timeDecay * 1.2
        );

        results.push({
          id: this.makePatternId("SENTIMENT_REVERSAL", [a.id, b.id]),
          type: "SENTIMENT_REVERSAL",
          nodes: [a.id, b.id],
          score,
          desc: `${a.label} → ${b.label}`
        });
      }
    }

    // 3. SPILLOVER / PRECURSOR
    edges.forEach((e) => {
      if (e.type !== "SIMILAR" && e.type !== "PRECURSOR") return;

      const A = this.engine.getEvent(e.from);
      const B = this.engine.getEvent(e.to);
      if (!A || !B) return;

      const wA = this.weightEngine.computeEventWeight(A);
      const wB = this.weightEngine.computeEventWeight(B);
      const edgeStrength = typeof e.strength === "number" ? e.strength : 0.5;
      const timeDecay = this.getTimeDecay(A, B);
      const sentimentBonus = this.getSentimentBonus(A, B);
      const feedbackWeight = this.getFeedbackWeight(A.id, B.id, e.type);

      const score = this.clampScore(
        (((wA + wB) / 2) * 0.55 + edgeStrength * 0.25) *
          timeDecay *
          sentimentBonus *
          feedbackWeight
      );

      if (score > 0.25) {
        results.push({
          id: this.makePatternId("SPILLOVER", [A.id, B.id]),
          type: "SPILLOVER",
          nodes: [A.id, B.id],
          score,
          desc: `${A.label} ↔ ${B.label}`
        });
      }
    });

    return results;
  }

  highlightPatterns(patterns) {
    if (!this.cy || !patterns || patterns.length === 0) return;

    this.cy.batch(() => {
      this.cy.elements().style("opacity", 0.22);

      patterns.forEach((p) => {
        p.nodes.forEach((id) => {
          const node = this.cy.getElementById(id);
          if (node && node.length > 0) {
            node.style({
              "background-color": "#ffd700",
              "border-color": "#9400d3",
              "border-width": 4,
              "opacity": 1
            });
          }
        });
      });
    });
  }
}
