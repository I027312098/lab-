export class GraphRenderer {
  constructor(engine) {
    this.engine = engine;
  }

  buildElements() {
    const rawNodes = this.engine.getNodes() || [];
    const rawEdges = this.engine.getEdges() || [];
    
    rawNodes.forEach((n, i) => {
  if (n.rot == null) n.rot = 100 + i * 80;
  if (n.cap == null) n.cap = 30 + i * 20;
  if (n.var == null) n.var = 50 + i * 40;
});

    const visibleNodes =
      typeof window.getVisibleNodes === "function"
        ? window.getVisibleNodes(rawNodes)
        : rawNodes;

    const visibleNodeIds = new Set(visibleNodes.map((n) => n.id));

    const visibleEdges =
      typeof window.getVisibleEdges === "function"
        ? window
            .getVisibleEdges(rawEdges)
            .filter((e) => visibleNodeIds.has(e.from) && visibleNodeIds.has(e.to))
        : rawEdges.filter(
            (e) => visibleNodeIds.has(e.from) && visibleNodeIds.has(e.to)
          );

    const nodes = visibleNodes.map((n) => ({
  data: {
    id: n.id,
    label: n.label || n.id,
    stat: n.stat || "Alive",
    ticker: n.ticker || "",
    sentiment: n.sentiment || "neutral",
    rot: n.rot ?? null,
    cap: n.cap ?? null,
    var: n.var ?? null
  }
}));

    const edges = visibleEdges.map((e, i) => ({
      data: {
        id: e.id || `EDGE-${i}`,
        source: e.from,
        target: e.to,
        type: e.type || "RELATED",
        strength: typeof e.strength === "number" ? e.strength : 0.5,
        label: e.label || e.type || "EDGE"
      }
    }));

    return [...nodes, ...edges];
  }

  getStyles() {
    return [
      {
        selector: "node",
        style: {
          "background-color": "#1e2025",
          "border-width": 2,
          "border-color": "#4dabf7",
          label: "data(label)",
          color: "#ffffff",
          "font-size": "11px",
          "text-valign": "center",
          "text-halign": "center",
          "text-wrap": "wrap",
          "text-max-width": "90px",
          width: 90,
          height: 34,
          shape: "round-rectangle"
        }
      },
      {
        selector: 'node[kind = "pattern"]',
        style: {
          "background-color": "#5f3dc4",
          "border-width": 3,
          "border-color": "#d0bfff",
          label: "data(label)",
          color: "#ffffff",
          "font-size": "10px",
          "text-valign": "center",
          "text-halign": "center",
          shape: "diamond",
          width: 70,
          height: 70
        }
      },
      {
        selector: 'edge[kind = "pattern-link"]',
        style: {
          "line-color": "#b197fc",
          "target-arrow-color": "#b197fc",
          "target-arrow-shape": "triangle",
          "line-style": "dotted",
          "curve-style": "bezier",
          width: 2,
          opacity: 0.9
        }
      },
      {
        selector: 'node[stat = "Death"]',
        style: {
          "border-color": "#555",
          color: "#999",
          opacity: 0.7
        }
      },
      {
        selector: 'node[sentiment = "bullish"]',
        style: {
          "border-color": "#2f9e44"
        }
      },
      {
        selector: 'node[sentiment = "bearish"]',
        style: {
          "border-color": "#e03131"
        }
      },
      {
  selector: "edge",
  style: {
    width: 2,
    "line-color": "#666",
    "target-arrow-color": "#666",
    "target-arrow-shape": "triangle",
    "curve-style": "bezier",
    // ❌ label 제거
    "font-size": "8px",
    color: "#bbbbbb",
    "text-rotation": "autorotate",
    opacity: 0.75
  }
},
{
  selector: "edge[label]",
  style: {
    label: "data(label)"
  }
},
      {
        selector: 'edge[type = "CAUSE"]',
        style: {
          "line-color": "#e03131",
          "target-arrow-color": "#e03131",
          width: 3
        }
      },
      {
        selector: 'edge[type = "SIMILAR"]',
        style: {
          "line-color": "#3b5bdb",
          "target-arrow-color": "#3b5bdb"
        }
      },
      {
        selector: 'edge[type = "PRECURSOR"]',
        style: {
          "line-color": "#2f9e44",
          "target-arrow-color": "#2f9e44",
          "line-style": "dashed"
        }
      },
      {
        selector: ".faded",
        style: {
          opacity: 0.15
        }
      },
      {
  selector: "node.node-dimmed",
  style: {
    "opacity": 0.28
  }
},
{
  selector: "edge.edge-dimmed",
  style: {
    "opacity": 0.16
  }
},      
{ 
  selector: ".pl-dim-node",
  style: {
    opacity: 0.15,
    "text-opacity": 0.15
  }
},
{
  selector: ".pl-dim-edge",
  style: {
    opacity: 0.08
  }
},

    ];
  }

  getLayout() {
    return {
      name: "dagre",
      rankDir: "TB",
      nodeSep: 60,
      rankSep: 100,
      animate: true,
      animationDuration: 250
    };
  }

  render(containerId) {
  const elements = this.buildElements();

  const cy = cytoscape({
    container: document.getElementById(containerId),
    elements,
    style: this.getStyles(),
    layout: this.getLayout()
  });

  window.cy = cy;   // 추가

  return cy;
}
}
