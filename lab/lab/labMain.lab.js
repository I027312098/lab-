import { SaureltiaEngine } from "../core/saureltiaEngine.lab.js";
import { GraphRenderer } from "../core/graphRenderer.lab.js";
import { InteractionController } from "../interaction/interactionController.lab.js";
import { PatternMiner } from "../analysis/patternMiner.lab.js";
import { TimeEngine } from "../simulation/timeEngine.lab.js";
import { PatternDatabase } from "../ai/patternDatabase.lab.js";
import { PredictionEngine } from "../ai/predictionEngine.lab.js";
import { EventGenerator } from "../ingestion/eventGenerator.lab.js";
import { FeedbackEngine } from "../ai/feedbackEngine.lab.js";

const LAB_CONFIG = {
  timelineInterval: 1200,
  graph: {
    fadeOpacity: 0.22,
    defaultOpacity: 1
  },
  layout: {
    name: "dagre",
    rankDir: "TB",
    nodeSep: 60,
    rankSep: 100
  }
};

const uiState = {
  lastDetectedPatterns: [],
  selectedPattern: null,
  selectedPatternIndex: -1
};

const engine = new SaureltiaEngine();
await engine.loadData("../deta/events.lab.json");

console.log("NODES:", engine.getNodes());
console.log("EDGES:", engine.getEdges());

const renderer = new GraphRenderer(engine);
const cy = renderer.render("cy");

new InteractionController(cy, engine);

const miner = new PatternMiner(engine, cy);
const timeline = new TimeEngine(engine, cy);

const patternDB = new PatternDatabase();
await patternDB.load("../deta/patterns.lab.json");

const predictor = new PredictionEngine(patternDB);
const generator = new EventGenerator(engine);
const feedback = new FeedbackEngine(patternDB);

const els = {
  playBtn: document.getElementById("btn-play"),
  patternBtn: document.getElementById("btn-pattern"),
  eventBtn: document.getElementById("btn-event"),
  relayoutBtn: document.getElementById("btn-relayout"),
  feedbackGoodBtn: document.getElementById("btn-feedback-good"),
  feedbackBadBtn: document.getElementById("btn-feedback-bad"),
  predictionPanel: document.getElementById("prediction"),
  infoPanel: document.getElementById("info-panel")
};

function clearPatternSelectionUI(cards) {
  cards.forEach((card) => {
    card.classList.remove("selected");
  });
}

function resetGraphFocus() {
  cy.elements().style("opacity", LAB_CONFIG.graph.defaultOpacity);

  cy.nodes().forEach((node) => {
    node.removeStyle();
  });

  cy.edges().forEach((edge) => {
    edge.removeStyle();
  });
}

function highlightPatternOnGraph(pattern) {
  if (!pattern || !pattern.nodes) return;

  resetGraphFocus();

  cy.elements().style("opacity", LAB_CONFIG.graph.fadeOpacity);

  pattern.nodes.forEach((id) => {
    const node = cy.getElementById(id);
    if (node && node.length > 0) {
      node.style({
        "background-color": "#ffd700",
        "border-color": "#9400d3",
        "border-width": 4,
        "opacity": 1,
        "color": "#ffffff"
      });
    }
  });

  if (pattern.nodes.length >= 2) {
    const source = pattern.nodes[0];
    const target = pattern.nodes[1];

    cy.edges().forEach((edge) => {
      const edgeSource = edge.data("source");
      const edgeTarget = edge.data("target");

      if (
        (edgeSource === source && edgeTarget === target) ||
        (edgeSource === target && edgeTarget === source)
      ) {
        edge.style({
          "line-color": "#ffd700",
          "target-arrow-color": "#ffd700",
          "width": 4,
          "opacity": 1
        });
      }
    });
  }
}

function centerPatternOnGraph(pattern) {
  if (!pattern || !pattern.nodes || pattern.nodes.length === 0) return;

  const firstNode = cy.getElementById(pattern.nodes[0]);
  if (firstNode && firstNode.length > 0) {
    cy.animate({
      fit: {
        eles: firstNode,
        padding: 80
      },
      duration: 300
    });
  }
}

function selectPatternByIndex(index, cards) {
  const pattern = uiState.lastDetectedPatterns[index];
  if (!pattern) return;

  uiState.selectedPattern = pattern;
  uiState.selectedPatternIndex = index;

  clearPatternSelectionUI(cards);

  const selectedCard = cards[index];
  if (selectedCard) {
    selectedCard.classList.add("selected");
  }

  console.log("Selected pattern:", uiState.selectedPattern);

  highlightPatternOnGraph(pattern);
  centerPatternOnGraph(pattern);
}

function renderPatterns(patterns) {
  const panel = els.predictionPanel;
  if (!panel) {
    console.warn("prediction panel not found");
    return;
  }

  panel.style.display = "block";
  panel.style.visibility = "visible";
  panel.style.opacity = "1";
  panel.style.minHeight = "80px";

  if (!patterns || patterns.length === 0) {
    panel.innerHTML = `
<div class="empty-state">
  <b>No patterns detected</b><br>
  현재 조건에 맞는 패턴이 없습니다.
</div>
`;
    return;
  }

  let html = "";

  patterns.forEach((p, i) => {
    patternDB.save(p);
    const result = predictor.predict(p);

    html += `
<div class="pattern-card" data-index="${i}">
  <b>${p.type}</b><br>
  Pattern Score: ${typeof p.score === "number" ? p.score.toFixed(2) : "N/A"}<br>
  Probability: ${typeof result.probability === "number" ? result.probability.toFixed(2) : "N/A"}<br>
  Expected Move: ${typeof result.expectedMove === "number" ? result.expectedMove.toFixed(2) : "N/A"}%<br>
  <small>Index: ${i} / Click to select</small>
</div>
`;
  });

  panel.innerHTML = html;

  const cards = panel.querySelectorAll(".pattern-card");

  cards.forEach((card) => {
    card.onclick = () => {
      const idx = Number(card.dataset.index);
      selectPatternByIndex(idx, cards);
    };
  });

  // 자동 선택을 원하면 주석 해제
  // selectPatternByIndex(0, cards);
}

function detectPatterns() {
  const patterns = miner.mine();
  uiState.lastDetectedPatterns = patterns;
  uiState.selectedPattern = null;
  uiState.selectedPatternIndex = -1;

  console.log("Detected patterns:", patterns);

  renderPatterns(patterns);
  renderPatternsAsGraph(patterns);
}

function applyFeedback(success) {
  if (!uiState.selectedPattern) {
    console.warn(
      success ? "No selected pattern to reinforce" : "No selected pattern to weaken"
    );
    return;
  }

  feedback.evaluate(uiState.selectedPattern, {
    success,
    magnitude: 1
  });

  console.log(
    success ? "Positive feedback applied to:" : "Negative feedback applied to:",
    uiState.selectedPattern,
    patternDB.all()
  );

  console.log("EXACT AFTER FEEDBACK:", patternDB.getExact(uiState.selectedPattern));
}

function generateEvent() {
  const evt = generator.generateFromText(
    "NVDA earnings beat expectations and stock surge"
  );

  engine.addEvent(evt);

  const selected = cy.$("node:selected");
  let pos = { x: 100, y: 100 };

  if (selected.length > 0) {
    const p = selected[0].position();
    pos = { x: p.x + 120, y: p.y + 40 };
  } else if (cy.nodes().length > 0) {
    const last = cy.nodes()[cy.nodes().length - 1].position();
    pos = { x: last.x + 120, y: last.y };
  }

  cy.add({
    data: {
      id: evt.id,
      label: evt.label
    },
    position: pos
  });
}

function removePatternNodesFromGraph() {
  const patternNodes = cy.nodes().filter((node) => {
    return node.data("kind") === "pattern";
  });

  const patternEdges = cy.edges().filter((edge) => {
    return edge.data("kind") === "pattern-link";
  });

  cy.remove(patternEdges);
  cy.remove(patternNodes);
}

function renderPatternsAsGraph(patterns) {
  if (!patterns || patterns.length === 0) return;

  removePatternNodesFromGraph();

  patterns.forEach((pattern, index) => {
    const patternId = pattern.id || `PATTERN-GRAPH-${index}`;

    const linkedNodes = pattern.nodes
      .map((id) => cy.getElementById(id))
      .filter((node) => node && node.length > 0);

    let pos = { x: 120 + index * 140, y: 60 };

    if (linkedNodes.length > 0) {
      const linkedPositions = linkedNodes.map((node) => node.position());

      const avgX =
        linkedPositions.reduce((sum, p) => sum + p.x, 0) / linkedPositions.length;
      const avgY =
        linkedPositions.reduce((sum, p) => sum + p.y, 0) / linkedPositions.length;

      pos = {
        x: avgX + index * 30,
        y: avgY - 180
      };
    }

    cy.add({
      data: {
        id: patternId,
        label: pattern.type,
        kind: "pattern",
        patternType: pattern.type
      },
      position: pos
    });

    pattern.nodes.forEach((nodeId, nodeIndex) => {
      const targetNode = cy.getElementById(nodeId);
      if (!targetNode || targetNode.length === 0) return;

      cy.add({
        data: {
          id: `${patternId}-LINK-${nodeIndex}`,
          source: patternId,
          target: nodeId,
          label: "PATTERN_OF",
          kind: "pattern-link"
        }
      });
    });
  });
}



    cy.add({
      data: {
        id: patternId,
        label: pattern.type,
        kind: "pattern",
        patternType: pattern.type
      },
      position: pos
    });


    pattern.nodes.forEach((nodeId, nodeIndex) => {
      cy.add({
        data: {
          id: `${patternId}-LINK-${nodeIndex}`,
          source: patternId,
          target: nodeId,
          label: "PATTERN_OF",
          kind: "pattern-link"
        }
      });
    });
  });
}

function reLayoutGraph() {
  cy.layout({
    name: LAB_CONFIG.layout.name,
    rankDir: LAB_CONFIG.layout.rankDir,
    nodeSep: LAB_CONFIG.layout.nodeSep,
    rankSep: LAB_CONFIG.layout.rankSep,
    animate: true,
    animationDuration: 300
  }).run();
}

if (els.playBtn) {
  els.playBtn.onclick = () => {
    timeline.play(LAB_CONFIG.timelineInterval);
  };
}

if (els.patternBtn) {
  els.patternBtn.onclick = () => {
    detectPatterns();
  };
}

if (els.eventBtn) {
  els.eventBtn.onclick = () => {
    generateEvent();
  };
}

if (els.relayoutBtn) {
  els.relayoutBtn.onclick = () => {
    reLayoutGraph();
  };
}

if (els.feedbackGoodBtn) {
  els.feedbackGoodBtn.onclick = () => {
    applyFeedback(true);
  };
}

if (els.feedbackBadBtn) {
  els.feedbackBadBtn.onclick = () => {
    applyFeedback(false);
  };
}

document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;

  uiState.selectedPattern = null;
  uiState.selectedPatternIndex = -1;

  const cards = document.querySelectorAll(".pattern-card");
  cards.forEach((card) => card.classList.remove("selected"));

  resetGraphFocus();

  if (els.infoPanel) {
    els.infoPanel.innerHTML = "Select event";
  }

  if (els.predictionPanel) {
    els.predictionPanel.innerHTML = "Prediction: -";
  }
});

