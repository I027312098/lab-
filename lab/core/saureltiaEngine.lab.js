// core.lab/saureltiaEngine.lab.js
export class SaureltiaEngine {
  constructor(){
    this.nodes = []; // array of { id, label, time, ticker, sentiment, confidence, vars }
    this.edges = []; // array of { from, to, type, strength }
    this.nodeMap = new Map();
  }

  async loadData(path){
    // path should be relative to labMain; e.g. "../deta.lab/events.lab.json"
    const res = await fetch(path);
    const data = await res.json();
    // expected shape: { nodes: [...], edges: [...] }  or an array of nodes
    if (Array.isArray(data)) {
      data.forEach(n => this.addEvent(n));
    } else if (data.nodes) {
      data.nodes.forEach(n => this.addEvent(n));
      if (data.edges) this.edges = data.edges.slice();
    } else {
      console.warn("unknown data format", data);
    }
  }

  getEvent(id){
    return this.nodeMap.get(id);
  }

  addEvent(evt){
    if (!evt.id) evt.id = `EVT-${Date.now()}-${Math.floor(Math.random()*999)}`;
    this.nodes.push(evt);
    this.nodeMap.set(evt.id, evt);
  }

  addEdge(e){
    this.edges.push(e);
  }

  getNodes(){ return this.nodes; }
  getEdges(){ return this.edges; }
}
