export class InteractionController {
  constructor(cy, engine) {
    this.cy = cy;
    this.engine = engine;

    this.infoPanel = document.getElementById("event-info");
    this.baseInfoText = "Select event";

    this.handleEscape = this.handleEscape.bind(this);

    this.setup();
  }

  setup() {
    // 노드 클릭: 정보 패널 갱신 + 해당 노드 중심 이동
    this.cy.on("tap", "node", (e) => {
      const node = e.target;
      const event = this.engine.getEvent(node.id());

      this.displayEvent(event);

      this.cy.animate({
        center: { eles: node },
        duration: 250
      });
    });

    // 호버: 주변 집중 모드
    this.cy.on("mouseover", "node", (e) => {
      const node = e.target;
      const neighborhood = node.neighborhood().add(node);

      this.cy.batch(() => {
        this.cy.elements().difference(neighborhood).addClass("faded");
        neighborhood.removeClass("faded");

        node.style({
          "border-width": 4,
          "border-color": "#ffffff"
        });
      });
    });

    // 호버 해제
    this.cy.on("mouseout", "node", (e) => {
      const node = e.target;

      this.cy.batch(() => {
        this.cy.elements().removeClass("faded");

        node.style({
          "border-width": "",
          "border-color": ""
        });
      });
    });

    // ESC: 시각적 상태 초기화 + 패널 복구
    document.addEventListener("keydown", this.handleEscape);
  }

  handleEscape(e) {
    if (e.key !== "Escape") return;

    this.cy.batch(() => {
      this.cy.elements().removeClass("faded");

      this.cy.nodes().forEach((node) => {
        node.removeStyle();
      });

      this.cy.edges().forEach((edge) => {
        edge.removeStyle();
      });
    });

    if (this.infoPanel) {
      this.infoPanel.innerHTML = this.baseInfoText;
    }
  }

  displayEvent(evt) {
    if (!this.infoPanel || !evt) return;

    const confidence =
      typeof evt.confidence === "number"
        ? `${(evt.confidence * 100).toFixed(1)}%`
        : "N/A";

    this.infoPanel.innerHTML = `
<div><b>[${evt.id}] ${evt.label || "Untitled Event"}</b></div>
<div style="margin-top:6px; font-size:0.9rem; line-height:1.5;">
  <div>Ticker: ${evt.ticker || "N/A"}</div>
  <div>Sentiment: ${evt.sentiment || "N/A"}</div>
  <div>Confidence: ${confidence}</div>
  <div>Time: ${evt.time || "N/A"}</div>
</div>
`;
  }
}
