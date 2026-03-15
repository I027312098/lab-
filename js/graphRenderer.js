export class GraphRenderer {
    constructor(engine) {
        this.engine = engine;
    }

    render(containerId) {
        // fcose 의존성(layout-base, cose-base) 체크 및 등록
        try {
            if (typeof fcose !== 'undefined') {
                cytoscape.use(fcose);
            } else if (typeof cytoscapeFcose !== 'undefined') {
                cytoscape.use(cytoscapeFcose);
            }
        } catch (e) {
            console.warn("fcose 레이아웃 엔진 로드 실패: 기본 레이아웃(cose)을 사용합니다.");
        }

        return cytoscape({
            container: document.getElementById(containerId),
            elements: this.engine.getElements(),
            style: [
                {
                    selector: 'node',
                    style: {
                        'label': 'data(label)',
                        'background-color': '#1e2025',
                        'border-width': 2,
                        'border-color': '#4dabf7',
                        'color': 'white',
                        'width': 100,
                        'height': 40,
                        'shape': 'round-rectangle',
                        'text-valign': 'center',
                        'font-size': '10px'
                    }
                },
                {
                    selector: 'edge',
                    style: {
                        'width': 2,
                        'curve-style': 'bezier',
                        'target-arrow-shape': 'triangle',
                        'label': 'data(type)',
                        'font-size': '8px',
                        'color': '#888',
                        'text-rotation': 'autorotate'
                    }
                },
                {
                    selector: 'edge[type="CAUSE"]',
                    style: {
                        'line-color': '#e03131',
                        'target-arrow-color': '#e03131',
                        'width': 3
                    }
                },
                {
                    selector: 'edge[type="PRECURSOR"]',
                    style: {
                        'line-color': '#2f9e44',
                        'target-arrow-color': '#2f9e44',
                        'line-style': 'dashed'
                    }
                }
            ],
            layout: {
                name: (typeof fcose !== 'undefined' || typeof cytoscapeFcose !== 'undefined') ? 'fcose' : 'cose',
                animate: true,
                fit: true,
                padding: 30
            }
        });
    }
}