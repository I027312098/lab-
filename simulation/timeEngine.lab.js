export class TimeEngine {
  constructor(engine, cy) {
    this.engine = engine;
    this.cy = cy;
    this.timer = null;


    this.timeline = [...this.engine.getNodes()].sort(
      (a, b) => new Date(a.time || 0) - new Date(b.time || 0)
    );


    this.handleEscape = this.handleEscape.bind(this);
  }


  handleEscape(e) {
    if (e.key === "Escape") {
      this.reset();
    }
  }


  play(interval = 1200) {
    this.reset();


    if (!this.timeline || this.timeline.length === 0) return;


    let index = 0;


    document.addEventListener("keydown", this.handleEscape);


    this.timer = setInterval(() => {
      if (index >= this.timeline.length) {
        index = 0;
      }


      const evt = this.timeline[index];
      const node = this.cy.getElementById(evt.id);


      const info = document.getElementById("info-panel");
      if (info) {
        info.innerHTML = `Timeline: ${index + 1} / ${this.timeline.length} → ${evt.id}`;
      }


      console.log(
        "timeline step:",
        index,
        evt.id,
        node && node.length ? "found" : "not found"
      );


      this.cy.nodes().style({
        "background-color": "#1e2025",
        "border-color": "#4dabf7",
        "border-width": 2,
        "opacity": 0.55,
        "width": 90,
        "height": 34
      });


      if (node && node.length > 0) {
        node.style({
          "background-color": "#ff4500",
          "border-color": "#ffd700",
          "border-width": 5,
          "opacity": 1,
          "width": 120,
          "height": 48
        });


        this.cy.animate({
  fit: {
    eles: node,
    padding: 80
  },
  duration: 400
});

      }


      index++;
    }, interval);
  }


  reset() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }


    document.removeEventListener("keydown", this.handleEscape);


    this.cy.nodes().style({
      "background-color": "#1e2025",
      "border-color": "#4dabf7",
      "border-width": 2,
      "opacity": 1,
      "width": 90,
      "height": 34
    });


    const info = document.getElementById("info-panel");
    if (info) {
      info.innerHTML = "노드를 선택하면 사건 데이터가 출력됩니다.";
    }
  }
}


