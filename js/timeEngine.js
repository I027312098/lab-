export class TimeEngine {
    constructor(engine, cy) {
        this.engine = engine;
        this.cy = cy;
        this.timeline = [...engine.nodes].sort((a, b) => new Date(a.time) - new Date(b.time));
        this.timer = null;
    }

    play(interval = 1000) {
        let index = 0;
        this.reset();
        this.timer = setInterval(() => {
            if (index >= this.timeline.length) {
                clearInterval(this.timer);
                return;
            }
            const evt = this.timeline[index];
            const node = this.cy.getElementById(evt.id);
            node.animate({
                style: { 'background-color': '#ff4500', 'width': 120, 'height': 50 },
                duration: 500
            });
            index++;
        }, interval);
    }

    reset() {
        if (this.timer) clearInterval(this.timer);
        this.cy.nodes().style({
            'background-color': '#1e2025',
            'width': 100,
            'height': 40
        });
    }
}