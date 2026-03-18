import { WeightEngine } from "./weightEngine.lab.js";

export class PatternMiner {
  constructor(engine, cy) {
    this.engine = engine;
    this.cy = cy;
    this.weightEngine = new WeightEngine(engine);
  }

  mine() {
    const nodes = [...this.engine.getNodes()].sort(
      (a, b) => new Date(a.time || 0) - new Date(b.time || 0)
    );

    const edges = this.engine.getEdges() || [];
    const results = [];
    const visited = new Set();

    // 1. 인과 연쇄
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

      const score = (wA * 0.5 + wB * 0.5) * edgeStrength;

      if (score > 0.35) {
        results.push({
          id: `PATTERN-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
          type: "CAUSAL_CHAIN",
          nodes: [A.id, B.id],
          score,
          desc: `${A.label} → ${B.label}`
        });
        visited.add(key);
      }
    });

    // 2. 감성 역전
    for (let i = 0; i < nodes.length - 1; i++) {
      const a = nodes[i];
      const b = nodes[i + 1];

      const sa = (a.sentiment || "").toLowerCase();
      const sb = (b.sentiment || "").toLowerCase();

      if (sa === "bullish" && sb === "bearish") {
        const dt = (new Date(b.time || 0) - new Date(a.time || 0)) / 1000;
        if (dt >= 0 && dt <= 60 * 60 * 24) {
          const wA = this.weightEngine.computeEventWeight(a);
          const wB = this.weightEngine.computeEventWeight(b);

          const score = 0.4 + ((wA + wB) / 2) * 0.4;

          results.push({
            id: `PATTERN-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
            type: "SENTIMENT_REVERSAL",
            nodes: [a.id, b.id],
            score,
            desc: `${a.label} → ${b.label}`
          });
        }
      }
    }

    // 3. 유사/전조 전이
    edges.forEach((e) => {
      if (e.type !== "SIMILAR" && e.type !== "PRECURSOR") return;

      const A = this.engine.getEvent(e.from);
      const B = this.engine.getEvent(e.to);

      if (!A || !B) return;

      const wA = this.weightEngine.computeEventWeight(A);
      const wB = this.weightEngine.computeEventWeight(B);
      const edgeStrength = typeof e.strength === "number" ? e.strength : 0.5;

      const score = ((wA + wB) / 2) * edgeStrength;

      if (score > 0.3) {
        results.push({
          id: `PATTERN-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
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
