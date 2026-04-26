export class WeightEngine {
  constructor(engine) {
    this.engine = engine;
  }


  computeEventWeight(evt) {
    if (!evt) return 0;


    const confidence = typeof evt.confidence === "number" ? evt.confidence : 0.5;


    let recency = 1;
    if (evt.time) {
      const diffSec = (Date.now() - new Date(evt.time).getTime()) / 1000;
      recency = Math.exp(-diffSec / (60 * 60 * 24));
    }


    const edges = this.engine.getEdges() || [];
    const connectivity = edges.filter(
      (e) => e.from === evt.id || e.to === evt.id
    ).length;


    const connectivityScore = Math.min(1, connectivity / 5);


    let sentimentBias = 1;
    const sentiment = (evt.sentiment || "").toLowerCase();


    if (sentiment === "bearish") sentimentBias = 1.15;
    if (sentiment === "bullish") sentimentBias = 0.95;


    const weight =
      (confidence * 0.45 +
       recency * 0.25 +
       connectivityScore * 0.30) * sentimentBias;


    return Math.max(0, Math.min(1, weight));
  }
}
