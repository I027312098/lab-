export class InteractionController {
    constructor(cy, engine) {
        this.cy = cy;
        this.engine = engine;
        this.infoPanel = document.getElementById("event-info");
        this.setup();
    }

    setup() {
        // 노드 클릭 시 정보 출력
        this.cy.on('tap', 'node', (e) => {
            const evt = this.engine.getEvent(e.target.id());
            this.displayEvent(evt);
        });

        // 호버 시 집중 모드
        this.cy.on('mouseover', 'node', (e) => {
            const node = e.target;
            const neighborhood = node.neighborhood().add(node);

            this.cy.batch(() => {
                this.cy.elements().difference(neighborhood).style({ 'opacity': 0.1 });
                neighborhood.style({ 'opacity': 1, 'border-color': '#fff' });
            });
        });

        this.cy.on('mouseout', 'node', () => {
            this.cy.elements().style({ 'opacity': 1, 'border-color': '#4dabf7' });
        });

        // ESC 키로 상태 리셋
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                this.cy.batch(() => {
                    this.cy.elements().style({ 'opacity': 1, 'border-color': '#4dabf7' });
                });
                this.infoPanel.innerHTML = "Select event";
            }
        });
    }

    displayEvent(evt) {
        if (!evt) return;
        this.infoPanel.innerHTML = `
            <div style="color:#4dabf7; font-weight:bold">[${evt.id}] ${evt.label}</div>
            <div style="font-size:0.8rem; margin-top:5px">
                Ticker: ${evt.ticker}<br>
                Sentiment: ${evt.sentiment}<br>
                Confidence: ${(evt.confidence * 100).toFixed(1)}%<br>
                Time: ${evt.time}
            </div>
        `;
    }
}