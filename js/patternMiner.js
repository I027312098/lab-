export class PatternMiner {
    constructor(engine, cy) {
        this.engine = engine;
        this.cy = cy;
    }

    mine() {
        const nodes = [...this.engine.nodes].sort((a, b) => new Date(a.time) - new Date(b.time));
        const patterns = [];
        patterns.push(...this.detectCausalChains());
        patterns.push(...this.detectSentimentReversal(nodes));
        return patterns;
    }

    detectCausalChains() {
        const results = [];
        const visited = new Set();

        for (const edge of this.engine.edges) {
            if (edge.type !== "CAUSE") continue;
            const key = edge.from + edge.to;
            if (visited.has(key)) continue;

            const A = this.engine.getEvent(edge.from);
            const B = this.engine.getEvent(edge.to);

            if (!A || !B) continue;
            if (new Date(A.time) > new Date(B.time)) continue;

            const confidence = (A.confidence || 0.5) * (edge.strength || 0.5);
            if (confidence > 0.4) {
                results.push({ type: "CAUSAL_CHAIN", nodes: [A.id, B.id], score: confidence });
                visited.add(key);
            }
        }
        return results;
    }

    detectSentimentReversal(nodes) {
        const results = [];
        for (let i = 0; i < nodes.length - 1; i++) {
            const A = nodes[i];
            const B = nodes[i + 1];
            if (A.sentiment === "bullish" && B.sentiment === "bearish") {
                results.push({ type: "REVERSAL", nodes: [A.id, B.id], score: 0.6 });
            }
        }
        return results;
    }

    highlightPatterns(patterns) {
        this.cy.batch(() => {
            patterns.forEach(p => {
                p.nodes.forEach(id => {
                    this.cy.getElementById(id).style({
                        'background-color': '#ffd700',
                        'border-color': '#9400d3',
                        'border-width': 4
                    });
                });
            });
        });
    }
}