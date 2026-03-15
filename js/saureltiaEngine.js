export class SaureltiaEngine {
    constructor() {
        this.nodes = [];
        this.edges = [];
        this.nodeMap = new Map();
    }

    async loadData(path) {
        const res = await fetch(path);
        const data = await res.json();
        this.nodes = data.nodes;
        this.edges = data.edges;

        // 빠른 ID 기반 검색을 위해 Map 구성
        this.nodeMap.clear();
        this.nodes.forEach(n => this.nodeMap.set(n.id, n));
    }

    getElements() {
        const nodes = this.nodes.map(n => ({ data: n }));
        const edges = this.edges.map(e => ({
            data: {
                source: e.from,
                target: e.to,
                type: e.type,
                strength: e.strength
            }
        }));
        return [...nodes, ...edges];
    }

    getEvent(id) {
        return this.nodeMap.get(id);
    }
}