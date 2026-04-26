import { SaureltiaEngine } from "../core/saureltiaEngine.lab.js";
import { GraphRenderer } from "../core/graphRenderer.lab.js";
import { InteractionController } from "../interaction/interactionController.lab.js";
import { PatternMiner } from "../analysis/patternMiner.lab.js";
import { TimeEngine } from "../simulation/timeEngine.lab.js";
import { PatternDatabase } from "../ai/patternDatabase.lab.js";
import { PredictionEngine } from "../ai/predictionEngine.lab.js";
import { EventGenerator } from "../ingestion/eventGenerator.lab.js";
import { FeedbackEngine } from "../ai/feedbackEngine.lab.js";
import { buildGroupsFromPattern } from "../group/groupBuilder.lab.js";
import { createGroupRegistry } from "../group/groupRegistry.lab.js";
import { exportGroups, importGroups } from "../group/groupSerializer.lab.js";

const LAB_CONFIG = {
  timelineInterval: 1200,
  graph: {
    fadeOpacity: 0.22,
    defaultOpacity: 1,
    maxNodesSoft: 220,
    maxEdgesSoft: 320,
    maxNodesHard: 420,
    maxEdgesHard: 700,
    zoomSensitivity: 0.18,
    wheelSensitivity: 0.16,
    panSensitivity: 1
  },
  layout: {
    name: "dagre",
    rankDir: "TB",
    nodeSep: 60,
    rankSep: 100
  },
  seed: {
    defaultCount: 120,
    clusterSize: 6,
    deathRatio: 0.08,
    bullishRatio: 0.34,
    bearishRatio: 0.18
  }
};

const EDGE_RULES = {
  SAME: { directed: false, temporary: false },
  SIMILAR: { directed: false, temporary: false },
  COUNTER: { directed: false, temporary: false },

  PRECURSOR: { directed: true, temporary: false },
  FOLLOWUP: { directed: true, temporary: false },

  CAUSE: { directed: true, temporary: false },

  GROUP_MEMBER: { directed: false, temporary: false },
  PATTERN_LINK: { directed: false, temporary: false },

  TEMP_TIMELINE: { directed: true, temporary: true },
  TEMP_TEST: { directed: false, temporary: true }
};

const uiState = {
  // pattern
  lastDetectedPatterns: [],
  rankedResults: [],
  rawRankedResults: [],
  patternMap: new Map(),

  // navigation / selection
  navStack: [],
  selectedPattern: null,
  selectedGroup: null,
  selectedEvent: null,
  selectedPatternId: null,
  selectedGroupId: null,
  selectedEventId: null,

  // mode / page
  mode: "explore",
  page: "network",

  // panels
  rightPanelView: "network",
  isLayerPanelOpen: false,

  // layer
  savedLayers: [],
  currentLayerName: "기본 그래프",
  isLayerDeleteMode: false,
  selectedLayerNamesForDelete: [],
  currentLayerFilter: {
    rotMin: null,
    capMax: null,
    varMin: null
  },

  // event
  events: [],
  isEventDeleteMode: false,
  selectedEventIdsForDelete: [],
  editingEventId: null,
  eventDraft: null,

  // explorer
  patternToLayerExplorerMode: "menu",
  layerToPatternExplorerMode: "menu",

  // preview
  patternLayerPreview: {
    mode: "all",
    nodeIds: [],
    nodeCount: 0,
    edgeCount: 0,
    sample: []
  },

  // timeline
  timelineIndex: 0,
  timelinePlaying: false,
  timelineTimer: null,
  timelineSpeed: 1,

  // logs
  logs: [],
  lastLogSignature: null,
  logCounter: 0,
  unsentLogs: [],
  logExplorerScope: "ALL",
  logExplorerQuery: "",
  logExplorerRecentOnly: false,
  selectedLogId: null,

  // all data explorer
  allDataScope: "ALL",
  allDataQuery: "",
  selectedAllDataId: null,
  allDataSort: "name",

  // filters / graph
  viewFilters: {
    A: true,
    B: true,
    C: true,
    D: true
  },

  graphToggles: {
    showPatternLinks: true,
    hideWeakEdges: false,
    showEventLabels: true
  },

  graphStats: {
    nodeCount: 0,
    edgeCount: 0,
    graphCapped: false
  },

  validationErrors: [],

  activeGroupIds: [],
topGroupId: "TOP",

previewLayerGroupIds: [],
previewLayerNodeIds: [],
isLayerPreviewActive: false,

patternExplorer: {
  active: false,

  hideMode: null, // "edge" | "node"
  hiddenNodeIds: new Set(),
  hiddenEdgeIds: new Set(),

  tempEdgeMode: false,
  tempEdgeChain: [],
  tempEdgeIds: []
},
  
patternLinkSnapshot: null,

selectedEdgeId: null,

dimMode: false,
dimmedNodeIds: new Set(),
dimmedEdgeIds: new Set(),

autoFocusNodeId: null,
autoFocusEdgeId: null,

baseNodeIds: new Set(),
baseEdgeIds: new Set(),

edgeRelationFilter: "ALL",

filterView: {
  mode: "off", // off | grade | threshold
  grade: null, // "PEAK", "CORE" 등
  threshold: null // multiplier 기준
},

filterRankMode: "pass",
filterRankMetric: "basic", // basic | raw

patternApplied: false,

patternCompactMode: false,

appliedPatternId: null,

selectedPatternIds: [],

patternMiniExplorerOpen: false,

patternExplorerMode: false,

appliedPatternIds: [],

selectedLayerNames: [],

promotedPatterns: [],

expandedGroupId: null,

relationTags: [],

relationExplorer: {
  open: false,
  active: false,
  baseGroupId: null,
  edgeFilter: "ALL",

  selectedEdgeIds: [],
  history: [],

  emptyResultModal: {
    open: false,
    previousFilter: "ALL",
    previousSelectedEdgeIds: []
  }
},

patternLinkWorkspace: {
  active: false,
  open: false,
  hideMode: null,
  hiddenNodeIds: new Set(),
  hiddenEdgeIds: new Set(),
  tempEdgeMode: false,
  tempEdgeIds: [],
  tempEdgeChain: [],

  loadedLayerName: null,
  loadedLayerNodes: [],
  loadedLayerFilter: {
    rotMin: null,
    capMax: null,
    varMin: null
  },
  loadedActiveGroupIds: [],
  compareSource: "layer",
  lockedFocusNodeId: null,
  lockedFocusEdgeId: null,
  dimStrength: 0.08,
  tempEdgeEditorEdgeId: null,

  selectedEdgeId: null,
  dimMode: false,
  dimmedNodeIds: new Set(),
  dimmedEdgeIds: new Set(),
  autoFocusNodeId: null,
  autoFocusEdgeId: null,
  baseNodeIds: new Set(),
  baseEdgeIds: new Set(),
  edgeRelationFilter: "ALL"
},

timelineExplorer: {
  open: false,
  active: false,
  selectedTempEdgeIds: [],
  lastAppliedEventId: null
},

patternLinkExplorerState: {
  relationFilter: "ALL",
  statusFilter: "ALL",
  selectedNodeIds: [],
  selectedEdgeIds: [],
  lastFocusedId: null
},

patternLinkPageState: {
  layoutMode: "default",
  selectedNodeId: null,
  selectedEdgeId: null,
  selectedGroupId: null,
  selectedGroupRefId: null,
  activeGroupIds: [],
  inspectTab: "compare",
  compareScrollTop: 0,
  inspectScrollTop: 0,
  listScrollTop: 0
},

layerCandidates: [],
approvedLayerNames: [],

layerExplorerState: {
  open: false,
  fullOpen: false,
  selectedLayerName: null,

  viewMode: "home",
  mainTab: "status",
  statusTab: "all",
  timeViewMode: "month",

  selectedYear: null,
  selectedMonth: null,
  selectedDay: null
},

layerMergeExplorer: {
  open: false,
  selectedLayerNames: []
},

layerSets: [],

setExplorerState: {
  open: false,
  fullOpen: false,
  viewMode: "home", // home | list | detail
  selectedSetId: null
},

setCreateModal: {
  open: false,
  parentSetId: null,
  pendingName: null
},

setDeleteModal: {
  open: false,
  rootSetId: null,
  selectedSetIds: [],
  minDepth: 0,
  maxDepth: null
},

groupExplorerContext: {
  page: "network",
  target: "main" // main | patternLinkPage
},

suggestions: [],

suggestionToastHiddenIds: [],

};

const ENTITY_TAG_CATEGORIES = {
  EVT: {
    SELF_NODE: "자기 노드",
    OTHER_NODE: "다른 노드",
    DATA_SOURCE: "데이터/소스",
    MARKET_CONTEXT: "시장/외부"
  },

  LAYER: {
    LAYER_STRUCTURE: "레이어 구조",
    ALGORITHM: "알고리즘"
  },

  PATTERN: {
    PATTERN_STRUCTURE: "패턴 구조",
    ALGORITHM: "알고리즘"
  },

  GROUP: {
    GROUP_STRUCTURE: "그룹 구조",
    ALGORITHM: "알고리즘",
    THEORY: "이론"
  }
};

const ENTITY_TAG_RULES = {
  EVT: {
    SELF_NODE: {
      EVT_NOISE: {
        label: "노드 자체 노이즈",
        meaning: "해당 EVT의 반응이 독립 신호가 아니라 단기 노이즈일 가능성",
        stat: "Alive",
        effects: [
          { target: "purity", direction: "down", min: 0.03, max: 0.08 }
        ]
      },

      EVT_WEAK_SIGNAL: {
        label: "약한 신호",
        meaning: "EVT가 관측되었으나 독립적인 설명력이 약함",
        stat: "Alive",
        effects: [
          { target: "confidence", direction: "down", min: 0.03, max: 0.07 }
        ]
      },

      EVT_DEATH_SIGNAL: {
        label: "사망 신호",
        meaning: "EVT 구조가 더 이상 유효한 반복 패턴으로 작동하지 않음",
        stat: "Death",
        effects: [
          { target: "g", direction: "down", min: 0.15, max: 0.35 },
          { target: "confidence", direction: "down", min: 0.10, max: 0.25 }
        ]
      }
    },

    OTHER_NODE: {
      EVT_SPILLOVER: {
        label: "타 노드 전이",
        meaning: "다른 EVT의 영향이 현재 EVT에 전이됨",
        stat: "Alive",
        effects: [
          { target: "purity", direction: "down", min: 0.02, max: 0.06 }
        ]
      },

      EVT_CAUSAL_DEPENDENCY: {
        label: "인과 의존",
        meaning: "현재 EVT가 다른 EVT 없이는 설명력이 약함",
        stat: "Alive",
        effects: [
          { target: "confidence", direction: "down", min: 0.04, max: 0.10 }
        ]
      }
    },

    DATA_SOURCE: {
      DATA_LEAK: {
        label: "정보 선반영",
        meaning: "공식 관측 전 정보가 가격/반응에 일부 반영되었을 가능성",
        stat: "Alive",
        effects: [
          { target: "confidence", direction: "down", min: 0.04, max: 0.12 }
        ]
      },

      DATA_LOW_TRUST: {
        label: "소스 신뢰 낮음",
        meaning: "참조 데이터의 신뢰성이 낮거나 확인 불충분",
        stat: "Alive",
        effects: [
          { target: "confidence", direction: "down", min: 0.05, max: 0.15 }
        ]
      }
    },

    MARKET_CONTEXT: {
      EXU: {
        label: "외부 불확실성",
        meaning: "시장 외부 요인으로 EVT 순수성이 훼손될 가능성",
        stat: "Alive",
        effects: [
          { target: "g", direction: "down", min: 0.05, max: 0.12 }
        ]
      },

      MARKET_REGIME_SHIFT: {
        label: "시장 국면 전환",
        meaning: "기존 EVT 해석이 시장 국면 변화로 약화됨",
        stat: "Alive",
        effects: [
          { target: "confidence", direction: "down", min: 0.06, max: 0.16 }
        ]
      }
    }
  },

  LAYER: {
    LAYER_STRUCTURE: {
      LAYER_OVERLAP: {
        label: "레이어 중복",
        meaning: "Layer가 다른 Layer와 과도하게 겹쳐 독립성이 낮음",
        stat: "Alive",
        effects: [
          { target: "purity", direction: "down", min: 0.04, max: 0.10 }
        ]
      },

      LAYER_FRAGMENTED: {
        label: "레이어 분산",
        meaning: "Layer 내부 node들이 하나의 구조로 충분히 묶이지 않음",
        stat: "Alive",
        effects: [
          { target: "confidence", direction: "down", min: 0.04, max: 0.12 }
        ]
      }
    },

    ALGORITHM: {
      LAYER_ALGO_WEAK_CLUSTER: {
        label: "약한 클러스터링",
        meaning: "Layer 생성 알고리즘이 약한 연결을 과대평가했을 가능성",
        stat: "Alive",
        effects: [
          { target: "confidence", direction: "down", min: 0.05, max: 0.15 }
        ]
      }
    }
  },

  PATTERN: {
    PATTERN_STRUCTURE: {
      PATTERN_DUPLICATE: {
        label: "패턴 중복",
        meaning: "이미 존재하는 패턴과 구조적으로 중복됨",
        stat: "Alive",
        effects: [
          { target: "importance", direction: "down", min: 0.03, max: 0.08 }
        ]
      },

      PATTERN_UNSTABLE: {
        label: "불안정 패턴",
        meaning: "반복 구조가 충분히 안정적이지 않음",
        stat: "Alive",
        effects: [
          { target: "confidence", direction: "down", min: 0.06, max: 0.18 }
        ]
      }
    },

    ALGORITHM: {
      PATTERN_ALGO_FALSE_POSITIVE: {
        label: "패턴 오탐 가능성",
        meaning: "알고리즘이 우연한 관계를 패턴으로 감지했을 가능성",
        stat: "Alive",
        effects: [
          { target: "purity", direction: "down", min: 0.08, max: 0.20 }
        ]
      }
    }
  },

  GROUP: {
    GROUP_STRUCTURE: {
      GROUP_WEAK_RELATION: {
        label: "약한 그룹 관계",
        meaning: "Group 내부 관계가 충분히 강하지 않음",
        stat: "Alive",
        effects: [
          { target: "importance", direction: "down", min: 0.03, max: 0.08 }
        ]
      },

      GROUP_CONTAMINATED: {
        label: "그룹 오염",
        meaning: "Group 내부에 설명 구조를 흐리는 node/tag가 포함됨",
        stat: "Alive",
        effects: [
          { target: "contamination", direction: "up", min: 0.05, max: 0.18 },
          { target: "purity", direction: "down", min: 0.04, max: 0.12 }
        ]
      },

      GROUP_CORE: {
        label: "핵심 그룹",
        meaning: "Group이 중심 이론 또는 반복 구조를 안정적으로 대표함",
        stat: "Alive",
        effects: [
          { target: "importance", direction: "up", min: 0.05, max: 0.12 }
        ]
      }
    },

    ALGORITHM: {
      GROUP_ALGO_CAUSE: {
        label: "알고리즘 원인",
        meaning: "Group 평가값 변화의 원인이 데이터가 아니라 알고리즘 처리 방식에 있음",
        stat: "Alive",
        effects: [
          { target: "confidence", direction: "down", min: 0.04, max: 0.12 }
        ]
      },

      GROUP_PURITY_CHECK_FAIL: {
        label: "순수성 검사 실패",
        meaning: "순수성 검사 알고리즘 기준을 통과하지 못함",
        stat: "Alive",
        effects: [
          { target: "purity", direction: "down", min: 0.08, max: 0.22 }
        ]
      }
    },

    THEORY: {
      THEORY_FAIL_CASE: {
        label: "이론 실패 사례",
        meaning: "해당 Group이 기존 이론을 설명하지 못하거나 반례로 작동함",
        stat: "Alive",
        effects: [
          { target: "g", direction: "down", min: 0.10, max: 0.30 }
        ]
      },

      THEORY_CONFIRMED: {
        label: "이론 확인",
        meaning: "Group이 기존 이론을 강화하는 사례로 작동함",
        stat: "Alive",
        effects: [
          { target: "confidence", direction: "up", min: 0.05, max: 0.15 }
        ]
      }
    }
  }
};

const TAG_STRENGTH_LEVELS = {
  TINY: { label: "미약", symbol: "미약", multiplier: 0.35, rank: 1 },
  WEAK: { label: "약", symbol: "약", multiplier: 0.6, rank: 2 },
  MID: { label: "중", symbol: "중", multiplier: 1.0, rank: 3 },
  STRONG: { label: "강", symbol: "강강", multiplier: 1.35, rank: 4 },
  PEAK: { label: "최강", symbol: "강강강", multiplier: 1.75, rank: 5 }
};

const TAG_ALIAS = {
  GROUP_CONTAMINATED: "NOISE",
  GROUP_WEAK_RELATION: "WEAK",
  GROUP_CORE: "CORE",
  GROUP_ALGO_CAUSE: "ALGO",
  GROUP_PURITY_CHECK_FAIL: "FAIL",
  THEORY_FAIL_CASE: "FAIL",
  THEORY_CONFIRMED: "CONFIRM"
};

const BASE_GROUP_TAG_CATEGORIES = new Set([
  "GROUP_STRUCTURE",
  "ALGORITHM",
  "THEORY"
]);

function isBaseGroupTagCategory(category) {
  return BASE_GROUP_TAG_CATEGORIES.has(category);
}

function isCustomGroupTagCategory(category) {
  return !!uiState.customTagRules?.GROUP?.[category];
}

function isCustomGroupTagRule(category, tagKey) {
  return !!uiState.customTagRules?.GROUP?.[category]?.[tagKey];
}

function getDisplayTagName(tagKey) {
  return TAG_ALIAS[tagKey] || tagKey || "-";
}

function getTagStrengthInfo(strength = "MID") {
  return TAG_STRENGTH_LEVELS[strength] || TAG_STRENGTH_LEVELS.MID;
}

function getTagStrengthMultiplier(strength = "MID") {
  return getTagStrengthInfo(strength).multiplier || 1;
}

function getEntityTagCategories(entityType = "GROUP") {
  return ENTITY_TAG_CATEGORIES?.[entityType] || ENTITY_TAG_CATEGORIES?.GROUP || {};
}

function getEntityTagRules(entityType = "GROUP", category = null) {
  const root = ENTITY_TAG_RULES?.[entityType] || ENTITY_TAG_RULES?.GROUP || {};
  const result = [];

  Object.entries(root).forEach(([categoryKey, tags]) => {
    if (category && categoryKey !== category) return;

    Object.entries(tags || {}).forEach(([tagKey, rule]) => {
      result.push({
        key: tagKey,
        category: categoryKey,
        ...rule
      });
    });
  });

  return result;
}

function findEntityTagRule(entityType = "GROUP", tagKey) {
  if (!tagKey) return null;

  return getEntityTagRules(entityType).find((rule) => rule.key === tagKey) || null;
}

function addEntityAdjustmentTag(entity, tagKey, options = {}) {
  if (!entity || !tagKey) return null;

  const entityType = options.entityType || entity.entityType || "GROUP";
  const rule = findEntityTagRule(entityType, tagKey);
  if (!rule) return null;

  const edit = ensureEntityEditState(entity);
  if (!edit) return null;

  if (hasEntityAdjustmentTag(entity, tagKey, {
  sourceType: options.sourceType || null,
  sourceRef: options.sourceRef || null
})) {
  return null;
}

const strength = options.strength || "MID";
const strengthInfo = getTagStrengthInfo(strength);

const entry = {
  id: `EADJ-${Date.now()}-${Math.random().toString(16).slice(2)}`,

  entityType,
  tag: tagKey,
  displayTag: getDisplayTagName(tagKey),
  category: rule.category,
  label: rule.label,
  meaning: rule.meaning || "",
  stat: rule.stat || "Alive",

  strength,
  strengthLabel: strengthInfo.label,
  strengthSymbol: strengthInfo.symbol,

  relationTags: Array.isArray(options.relationTags)
    ? [...options.relationTags]
    : [],

  hypothesisRefs: Array.isArray(options.hypothesisRefs)
    ? [...options.hypothesisRefs]
    : [],

  premiseRefs: Array.isArray(options.premiseRefs)
    ? [...options.premiseRefs]
    : [],

  effects: Array.isArray(rule.effects)
    ? rule.effects.map((effect) => ({ ...effect }))
    : [],

  sourceType: options.sourceType || null,
  sourceRef: options.sourceRef || null,
  sourceRole: options.sourceRole || null,
  bulkId: options.bulkId || null,
  memo: options.memo || "",
  createdAt: Date.now()
};

  edit.adjustmentTags.push(entry);

edit.logs.push({
  type: "ADD_TAG",
  entryId: entry.id,
  tag: entry.tag,
  displayTag: entry.displayTag,
  category: entry.category,
  entityType,
  stat: entry.stat,
  strength: entry.strength,
  strengthSymbol: entry.strengthSymbol,
  sourceType: entry.sourceType,
  sourceRef: entry.sourceRef,
  sourceRole: entry.sourceRole,
  relationTags: entry.relationTags,
  hypothesisRefs: entry.hypothesisRefs,
  premiseRefs: entry.premiseRefs,
  bulkId: entry.bulkId,
  createdAt: entry.createdAt
});

  saveLabState?.();
  return entry;
}

window.DEBUG_GROUP_IMPACT = {
  renderTargets: (type = "EVT") => renderGroupImpactSourceTargetOptions(type),
  targetOptions: () => {
    const select = document.getElementById("group-impact-source-target");
    return {
      hasSelect: !!select,
      html: select?.outerHTML || null,
      options: select
        ? [...select.options].map((o) => ({ value: o.value, text: o.textContent }))
        : []
    };
  },
  sourceOptions: (type = "ALGORITHM") => getGroupEditRefOptions(type)
};

window.DEBUG_GROUP_SAVE = {
  countSnapshotGroups: () => {
    const snap = JSON.parse(localStorage.getItem("saureltia-lab-state") || "{}");
    return snap.groups?.length || 0;
  },

  firstSnapshotGroup: () => {
    const snap = JSON.parse(localStorage.getItem("saureltia-lab-state") || "{}");
    return snap.groups?.[0] || null;
  },

  findSnapshotGroup: (groupId) => {
    const snap = JSON.parse(localStorage.getItem("saureltia-lab-state") || "{}");
    return (snap.groups || []).find((g) => g.id === groupId) || null;
  }
};

window.DEBUG_GROUP_STORE = {
  size: () => groupStore?.size || 0,
  list: () => [...groupStore.values()],
  ids: () => [...groupStore.keys()],
  first: () => [...groupStore.values()][0] || null,
  save: () => {
    saveLabState?.();
    return JSON.parse(localStorage.getItem("saureltia-lab-state") || "{}")?.groups?.length;
  }
};

window.DEBUG_GROUP_EDIT = {
  ensure: (groupId) => {
    const group = groupStore.get(groupId);
    return ensureGroupEditState(group);
  },

  addRef: (groupId, type, refId, relationTag = "RELATED") => {
    return addGroupReference(groupId, {
      type,
      id: refId,
      relationTag
    });
  },

  addAdj: (groupId, tagKey, sourceRef = null) => {
    return addGroupAdjustmentTag(groupId, tagKey, {
      sourceRef
    });
  },

  removeAdj: (groupId, adjustmentId) => {
    return removeGroupAdjustmentTag(groupId, adjustmentId);
  },

  meta: (groupId) => {
    const group = groupStore.get(groupId);
    return getGroupCardMeta(group);
  },

  computeBase: (groupId) => {
    const group = groupStore.get(groupId);
    if (!group) return null;

    const basePurityScore = getGroupEvaluationScore(group, "purityScore", 1);
    const baseContaminationScore = getGroupEvaluationScore(group, "contaminationScore", 0);
    const baseImportanceScore = getGroupEvaluationScore(group, "importanceScore", 0);
    const baseConfidenceScore = getGroupEvaluationScore(group, "confidenceScore", 0);

    return computeGroupAdjustedMetrics(group, {
      purityScore: basePurityScore,
      contaminationScore: baseContaminationScore,
      importanceScore: baseImportanceScore,
      confidenceScore: baseConfidenceScore,
      gScore: baseConfidenceScore
    });
  }
};

window.DEBUG_KEYWORD = {
  recordGroup: (keyword) => recordKeywordLearning(GROUP_KEYWORD_LEARNING_KEY, keyword),
  getGroup: () => loadKeywordLearning(GROUP_KEYWORD_LEARNING_KEY),
  clearGroup: () => localStorage.removeItem(GROUP_KEYWORD_LEARNING_KEY)
};

const LAB_STORAGE_KEY = "saureltia-lab-state";

// 여기에 추가
const GROUP_KEYWORD_LEARNING_KEY = "saureltia-group-keyword-learning";
const GLOBAL_KEYWORD_LEARNING_KEY = "saureltia-global-keyword-learning";

const patternMemoryMap = new Map();

const groupStore = new Map();

const groupRegistry = createGroupRegistry();

const STORAGE_KEYS = {
  ui: "saureltia.lab.ui",
  memory: "saureltia.lab.patternMemory"
};

window.DEBUG_GROUP = {
  getPreview: () => getGroupExplorerPreviewGroupIds?.(),
  getActive: () => getGroupExplorerActiveGroupIds?.(),
  getBase: () => getCurrentBaseGroupIdForExplorer?.()
};

function updatePatternActionUI() {
  const isPatternPage = document.body.dataset.page === "pattern";

  if (els.patternFloatingActions) {
    els.patternFloatingActions.classList.toggle("hidden", !isPatternPage);
  }

  updatePatternApplyToggleUI();
  updatePatternCompactUI();
  syncPatternExplorerMirrorButtons();
  if (els.patternRegisterGroupBtn) {
  els.patternRegisterGroupBtn.disabled = !uiState.selectedPatternId;
}

if (els.patternPromoteGroupBtn) {
  const hasPatterns =
    Array.isArray(uiState.selectedPatternIds) && uiState.selectedPatternIds.length
      ? true
      : !!(uiState.patternApplied && Array.isArray(uiState.appliedPatternIds) && uiState.appliedPatternIds.length);

  els.patternPromoteGroupBtn.disabled = !hasPatterns;
}

if (els.layerPromotePatternBtn) {
  const hasLayers =
    Array.isArray(uiState.selectedLayerNames) && uiState.selectedLayerNames.length
      ? true
      : !!uiState.currentLayerName;

  els.layerPromotePatternBtn.disabled = !hasLayers;
}

}

function updatePatternApplyToggleUI() {
  if (!els.patternApplyToggleBtn) return;

  const hasPattern =
    Array.isArray(uiState.selectedPatternIds)
      ? uiState.selectedPatternIds.length > 0
      : !!uiState.selectedPatternId;

  if (uiState.patternApplied && hasPattern) {
    els.patternApplyToggleBtn.textContent = "현재 pattern 적용 해제";
    els.patternApplyToggleBtn.classList.add("active");
  } else {
    els.patternApplyToggleBtn.textContent = "현재 pattern 적용";
    els.patternApplyToggleBtn.classList.remove("active");
  }

  els.patternApplyToggleBtn.disabled = !hasPattern;
  syncPatternExplorerMirrorButtons();
}

function applyCurrentPatternToGraph() {
  if (!window.cy) return;

  const selectedIds = Array.isArray(uiState.selectedPatternIds) && uiState.selectedPatternIds.length
    ? [...uiState.selectedPatternIds]
    : (uiState.selectedPatternId ? [uiState.selectedPatternId] : []);

  if (!selectedIds.length) return;

  const selectedPatternNodeIdSet = new Set(selectedIds);

  const selectedEventNodeIdSet = new Set();
  selectedIds.forEach((patternId) => {
    const patternObj = uiState.patternMap?.get(patternId);
    const pattern = patternObj?.pattern || patternObj;
    (pattern?.nodes || []).forEach((id) => {
      if (id) selectedEventNodeIdSet.add(id);
    });
  });

  cy.nodes().forEach((node) => {
    const isPatternNode = node.data("kind") === "pattern";

    if (isPatternNode) {
      const match = selectedPatternNodeIdSet.has(node.id());
      node.style("opacity", match ? 1 : 0.12);
      return;
    }

    const match = selectedEventNodeIdSet.has(node.id());
    node.style("opacity", match ? 1 : 0.12);
  });

  cy.edges().forEach((edge) => {
    const sourceId = edge.source().id();
    const targetId = edge.target().id();

    const sourcePattern = selectedPatternNodeIdSet.has(sourceId);
    const targetPattern = selectedPatternNodeIdSet.has(targetId);
    const sourceEvent = selectedEventNodeIdSet.has(sourceId);
    const targetEvent = selectedEventNodeIdSet.has(targetId);

    const match =
      (sourcePattern && targetEvent) ||
      (targetPattern && sourceEvent) ||
      (sourceEvent && targetEvent);

    edge.style("opacity", match ? 1 : 0.08);
  });

  uiState.patternApplied = true;
uiState.appliedPatternIds = Array.isArray(uiState.selectedPatternIds)
  ? [...uiState.selectedPatternIds]
  : [];
uiState.appliedPatternId = uiState.appliedPatternIds[0] || null;

updatePatternApplyToggleUI();
renderFocusHeader();
renderPatterns(uiState.rawRankedResults || uiState.rankedResults || []);
renderPatternMiniExplorer();
syncPatternExplorerMirrorButtons();
}

function clearCurrentPatternAppliedView() {
  if (!window.cy) return;

  cy.nodes().forEach((node) => {
    node.removeStyle("opacity");
  });

  cy.edges().forEach((edge) => {
    edge.removeStyle("opacity");
  });

  uiState.patternApplied = false;
  uiState.appliedPatternId = null;
  uiState.appliedPatternIds = [];

  updatePatternApplyToggleUI();
  renderFocusHeader();
  renderPatterns(uiState.rawRankedResults || uiState.rankedResults || []);
  renderPatternMiniExplorer();
  syncPatternExplorerMirrorButtons();
}

function enterPatternFromCard(patternId, cards = null, card = null) {
  if (!patternId) return;

  uiState.selectedPatternId = patternId;
  uiState.selectedPatternIds = [patternId];
  uiState.selectedPattern = uiState.patternMap?.get(patternId) || null;

  if (typeof selectPattern === "function") {
    selectPattern(patternId, cards, card);
    return;
  }

  renderPatterns(uiState.rawRankedResults || uiState.rankedResults || []);
  renderFocusHeader();
  renderDetailPanel();
  refreshGraphState();
  renderPatternMiniExplorer();

}

function closePatternPage() {
  closePatternPageCompletely();
}

function getRefTargetEntity(type, refId) {
  if (!type || !refId) return null;

  if (type === "EVT") {
    return (uiState.events || []).find((evt) => evt.id === refId) || null;
  }

  if (type === "LAYER") {
    return (uiState.savedLayers || []).find((layer) => {
      return layer.name === refId || layer.id === refId;
    }) || null;
  }

  if (type === "PATTERN") {
    const patterns = [
      ...(uiState.lastDetectedPatterns || []),
      ...(uiState.promotedPatterns || [])
    ];

    const found = patterns.find((p) => {
      const pattern = p?.pattern || p;
      return pattern?.id === refId || pattern?.name === refId;
    });

    return found?.pattern || found || null;
  }

  if (type === "GROUP") {
    return groupStore.get(refId) || null;
  }

  if (type === "ALGORITHM") {
    return {
      id: refId,
      name: refId,
      entityType: "ALGORITHM"
    };
  }

  return null;
}

function inferGroupReferenceChangeTriggerTags(group, type, refId, relationTag) {
  const tags = [];

  if (!group || !type || !refId) return tags;

  if (relationTag === "없음") {
    tags.push({
      tag: "NO_RELATION",
      label: "관계 없음",
      meaning: "현재 Group과 선택 대상 사이에 직접적인 구조 관계가 감지되지 않음",
      category: "GROUP_STRUCTURE"
    });

    return tags;
  }

  if (type === "EVT") {
    if (relationTag === "CENTER") {
      tags.push({
        tag: "GROUP_CORE",
        label: "핵심 그룹",
        meaning: "선택 EVT가 Group 중심 노드와 일치함",
        category: "GROUP_STRUCTURE"
      });
    }

    if (relationTag === "GROUP_MEMBER") {
      tags.push({
        tag: "GROUP_WEAK_RELATION",
        label: "멤버 참조",
        meaning: "선택 EVT가 Group 내부 멤버로 확인됨",
        category: "GROUP_STRUCTURE"
      });
    }
  }

  if (type === "GROUP") {
    if (relationTag === "OVERLAP") {
      tags.push({
        tag: "GROUP_CONTAMINATED",
        label: "그룹 오염 가능",
        meaning: "다른 Group과 node overlap이 커서 독립성이 낮아질 수 있음",
        category: "GROUP_STRUCTURE"
      });
    }

    if (relationTag === "RELATED") {
      tags.push({
        tag: "GROUP_WEAK_RELATION",
        label: "약한 그룹 관계",
        meaning: "공유 node가 일부 있으나 중심 구조로 보기에는 약함",
        category: "GROUP_STRUCTURE"
      });
    }
  }

  if (type === "LAYER") {
    tags.push({
      tag: "GROUP_ALGO_CAUSE",
      label: "레이어 기반 영향",
      meaning: "Layer 구성 또는 필터가 Group 평가 변화의 원인일 수 있음",
      category: "ALGORITHM"
    });
  }

  if (type === "PATTERN") {
    tags.push({
      tag: "THEORY_CONFIRMED",
      label: "패턴 기반 확인",
      meaning: "Pattern과 Group이 연결되어 이론적 설명력이 강화될 수 있음",
      category: "THEORY"
    });
  }

  if (type === "ALGORITHM") {
    tags.push({
      tag: "GROUP_ALGO_CAUSE",
      label: "알고리즘 원인",
      meaning: "평가 변화 원인이 데이터가 아니라 알고리즘 처리 방식에 있을 수 있음",
      category: "ALGORITHM"
    });
  }

  return tags;
}

function buildGroupRefPreview(groupId) {
  const group = groupStore.get(groupId);
  if (!group) return null;

  const refTypeSelect = document.getElementById("group-edit-ref-type");
  const refTargetSelect = document.getElementById("group-edit-ref-target");
  const relationTagSelect = document.getElementById("group-edit-relation-tag");

  const type = refTypeSelect?.value || "EVT";
  const refId = refTargetSelect?.value || "";
  const target = getRefTargetEntity(type, refId);

  const relationTag = inferGroupReferenceRelationTag(group, type, refId);
  const changeTriggerTags = inferGroupReferenceChangeTriggerTags(
    group,
    type,
    refId,
    relationTag
  );

  if (relationTagSelect) {
    relationTagSelect.value = relationTag;
  }

  return {
    groupId,
    type,
    refId,
    target,
    relationTag,
    changeTriggerTags
  };
}

function renderGroupRefPreview(groupId) {
  const box = document.getElementById("group-edit-ref-preview");
  if (!box) return;

  const preview = buildGroupRefPreview(groupId);
  if (!preview || !preview.refId) {
    box.innerHTML = `
      <div class="group-ref-preview-empty">
        Ref Type / Target을 선택하면 관계 preview가 표시됩니다.
      </div>
    `;
    return;
  }

  const targetLabel =
    preview.target?.name ||
    preview.target?.label ||
    preview.target?.id ||
    preview.refId;

  box.innerHTML = `
    <div class="group-ref-preview-main">
      <div class="group-ref-preview-row">
        <span>Target</span>
        <b>${preview.type} · ${targetLabel}</b>
      </div>

      <div class="group-ref-preview-row">
        <span>Relation</span>
        <b class="${preview.relationTag === "없음" ? "is-none" : ""}">
          ${preview.relationTag}
        </b>
      </div>
    </div>

    <div class="group-ref-preview-title small">CHANGE TRIGGER TAGS</div>

    <div class="group-ref-trigger-tags">
      ${
        preview.changeTriggerTags.length
          ? preview.changeTriggerTags.map((tag) => `
            <button
              type="button"
              class="group-ref-trigger-tag"
              data-ref-trigger-tag="${tag.tag}"
              title="${tag.meaning || ""}"
            >
              <span>${tag.tag}</span>
              <b>${tag.label || ""}</b>
              <small>${tag.category || "-"}</small>
            </button>
          `).join("")
          : `<span class="group-ref-preview-empty">변화 유발 태그 없음</span>`
      }
    </div>
  `;
}

function inferGroupReferenceRelationTag(group, type, refId) {
  if (!group || !type || !refId) return "없음";

  const groupNodeIds = new Set(getGroupMemberNodeIds?.(group) || []);
  const centerNodeId = getGroupCenterNodeId?.(group);

  if (type === "EVT") {
    if (centerNodeId && refId === centerNodeId) return "CENTER";
    if (groupNodeIds.has(refId)) return "GROUP_MEMBER";
    return "없음";
  }

  if (type === "GROUP") {
    const targetGroup = groupStore.get(refId);
    if (!targetGroup) return "없음";

    const targetNodeIds = new Set(getGroupMemberNodeIds?.(targetGroup) || []);
    const shared = [...groupNodeIds].filter((id) => targetNodeIds.has(id));

    if (shared.length >= Math.max(2, Math.ceil(groupNodeIds.size * 0.4))) {
      return "OVERLAP";
    }

    if (shared.length > 0) {
      return "RELATED";
    }

    return "없음";
  }

  if (type === "LAYER") {
    const layer = getRefTargetEntity(type, refId);
    const layerNodes = new Set(layer?.nodes || []);
    const shared = [...groupNodeIds].filter((id) => layerNodes.has(id));

    if (shared.length >= Math.max(2, Math.ceil(groupNodeIds.size * 0.5))) {
      return "LAYER_INCLUDED";
    }

    if (shared.length > 0) {
      return "LAYER_RELATED";
    }

    return "없음";
  }

  if (type === "PATTERN") {
    const pattern = getRefTargetEntity(type, refId);
    const patternNodes = new Set(pattern?.nodes || []);
    const shared = [...groupNodeIds].filter((id) => patternNodes.has(id));

    if (shared.length >= Math.max(2, Math.ceil(groupNodeIds.size * 0.5))) {
      return "PATTERN_INCLUDED";
    }

    if (shared.length > 0) {
      return "PATTERN_RELATED";
    }

    return "없음";
  }

  if (type === "ALGORITHM") {
    return "ALGORITHM_REF";
  }

  return "없음";
}

function getGroupEditRefOptions(type) {
  if (type === "EVT") {
    return (uiState.events || []).map((evt) => ({
      id: evt.id,
      label: evt.name || evt.label || evt.id
    })).filter((x) => x.id);
  }

  if (type === "LAYER") {
    return (uiState.savedLayers || []).map((layer) => ({
      id: layer.name || layer.id,
      label: layer.name || layer.id
    })).filter((x) => x.id);
  }

  if (type === "PATTERN") {
    const patterns = Array.isArray(uiState.lastDetectedPatterns)
      ? uiState.lastDetectedPatterns
      : [];

    return patterns.map((p) => {
      const pattern = p?.pattern || p;
      return {
        id: pattern?.id || pattern?.name,
        label: pattern?.name || pattern?.id
      };
    }).filter((x) => x.id);
  }

  if (type === "GROUP") {
    return [...groupStore.values()].filter(Boolean).map((g) => ({
      id: g.id,
      label: g.name || g.label || g.id
    }));
  }

  if (type === "ALGORITHM") {
    return [
      { id: "PURITY_CHECK", label: "PURITY_CHECK" },
      { id: "GROUP_SCORING", label: "GROUP_SCORING" },
      { id: "PATTERN_DETECTION", label: "PATTERN_DETECTION" },
      { id: "BUCKET_AXIS", label: "BUCKET_AXIS" }
    ];
  }

  return [];
}

function renderGroupEditRefTargetOptions(type) {
  const select = document.getElementById("group-edit-ref-target");
  if (!select) return;

  const options = getGroupEditRefOptions(type);

  if (!options.length) {
    select.innerHTML = `<option value="">대상 없음</option>`;
    return;
  }

  select.innerHTML = options.map((item) => `
    <option value="${item.id}">${item.label}</option>
  `).join("");
}

function renderGroupDiagnosisTargetOptions(groupId) {
  const typeSelect = document.getElementById("group-diagnosis-source-type");
  const targetSelect = document.getElementById("group-diagnosis-source-target");
  if (!targetSelect) return;

  const sourceType = typeSelect?.value || "RELATION";

  if (sourceType === "RELATION") {
    const relations = getRelationsForGroup(groupId);

    if (!relations.length) {
      targetSelect.innerHTML = `<option value="">연결된 relation 없음</option>`;
      return;
    }

    targetSelect.innerHTML = relations.map((rel) => `
      <option value="${rel.id}">${formatRelationLabel(rel)}</option>
    `).join("");

    return;
  }

  if (sourceType === "NODE") {
    const group = groupStore.get(groupId);
    const nodeIds = getGroupMemberNodeIds?.(group) || [];

    if (!nodeIds.length) {
      targetSelect.innerHTML = `<option value="">node 없음</option>`;
      return;
    }

    targetSelect.innerHTML = nodeIds.map((id) => `
      <option value="${id}">${id}</option>
    `).join("");

    return;
  }

  if (sourceType === "EDGE") {
    const group = groupStore.get(groupId);
    const edgeTypes = getGroupEdgeTypes?.(group) || [];

    if (!edgeTypes.length) {
      targetSelect.innerHTML = `<option value="">edge 없음</option>`;
      return;
    }

    targetSelect.innerHTML = edgeTypes.map((edgeType) => `
      <option value="${edgeType}">${edgeType}</option>
    `).join("");

    return;
  }

  if (sourceType === "ALGORITHM") {
    targetSelect.innerHTML = `
      <option value="PURITY_CHECK">PURITY_CHECK</option>
      <option value="GROUP_SCORING">GROUP_SCORING</option>
      <option value="PATTERN_DETECTION">PATTERN_DETECTION</option>
      <option value="BUCKET_AXIS">BUCKET_AXIS</option>
    `;
    return;
  }

  if (sourceType === "THEORY") {
    targetSelect.innerHTML = `
      <option value="THEORY_FAIL_CASE">THEORY_FAIL_CASE</option>
      <option value="THEORY_CONFIRMED">THEORY_CONFIRMED</option>
      <option value="PREMISE_BROKEN">PREMISE_BROKEN</option>
      <option value="PREMISE_STABLE">PREMISE_STABLE</option>
    `;
    return;
  }

  targetSelect.innerHTML = `<option value="">대상 없음</option>`;
}

function inferGroupToGroupRelationTag(sourceGroupId, targetGroupId) {
  const sourceGroup = groupStore.get(sourceGroupId);
  const targetGroup = groupStore.get(targetGroupId);

  if (!sourceGroup || !targetGroup) return "NONE";

  const sourceNodes = new Set(getGroupMemberNodeIds?.(sourceGroup) || []);
  const targetNodes = new Set(getGroupMemberNodeIds?.(targetGroup) || []);

  const shared = [...sourceNodes].filter((id) => targetNodes.has(id));
  const minSize = Math.max(1, Math.min(sourceNodes.size, targetNodes.size));
  const overlapRatio = minSize ? shared.length / minSize : 0;

  if (overlapRatio >= 0.6) return "OVERLAP";
  if (overlapRatio >= 0.2) return "REF";

  const sourceRelation = getGroupPrimaryEdgeType?.(sourceGroup);
  const targetRelation = getGroupPrimaryEdgeType?.(targetGroup);

  if (sourceRelation && targetRelation && sourceRelation === targetRelation) {
    return "SUPPORT";
  }

  return "NONE";
}

function getRelationTagsBetweenGroups(sourceGroupId, targetGroupId) {
  const manualRelations = (uiState.relationTags || []).filter((rel) => {
    return (
      rel.fromType === "GROUP" &&
      rel.toType === "GROUP" &&
      rel.fromId === sourceGroupId &&
      rel.toId === targetGroupId
    );
  });

  if (manualRelations.length) {
    return manualRelations.map((rel) => rel.tag);
  }

  return [inferGroupToGroupRelationTag(sourceGroupId, targetGroupId)];
}

function renderEntityImpactCauseCategoryButtons(entityType = "GROUP", selectedCategory = "GROUP_STRUCTURE") {
  const box = document.getElementById("group-impact-cause-category-buttons");
  if (!box) return;

  const categories = getEntityTagCategories(entityType);
  const firstCategory = selectedCategory || Object.keys(categories)[0] || "GROUP_STRUCTURE";

  box.innerHTML = Object.entries(categories).map(([key, label]) => `
    <button
      type="button"
      class="group-edit-category-btn ${key === firstCategory ? "active" : ""}"
      data-impact-cause-category="${key}"
    >
      <span>${key}</span>
      <b>${label}</b>
    </button>
  `).join("");

  box.dataset.selectedCategory = firstCategory;
  box.dataset.entityType = entityType;

  box.querySelectorAll("[data-impact-cause-category]").forEach((btn) => {
    btn.onclick = () => {
      const category = btn.dataset.impactCauseCategory || firstCategory;

      box.dataset.selectedCategory = category;

      box.querySelectorAll(".group-edit-category-btn").forEach((node) => {
        node.classList.toggle(
          "active",
          node.dataset.impactCauseCategory === category
        );
      });

      renderEntityImpactCauseTagButtons(entityType, category);

      const detailGroupId = ensureGroupExplorerFullState?.().detailGroupId;
if (detailGroupId) {
  refreshGroupImpactPreviewViews?.(detailGroupId);
}

    };
  });
}

function renderEntityImpactCauseTagButtons(entityType = "GROUP", category = "GROUP_STRUCTURE") {
  const box = document.getElementById("group-impact-cause-tag-buttons");
  if (!box) return;

  const rules = getEntityTagRules(entityType, category);

  if (!rules.length) {
    box.innerHTML = `<div class="group-edit-empty">해당 카테고리 태그 없음</div>`;
    box.dataset.selectedTag = "";
    return;
  }

  const firstKey = rules[0].key;

  box.innerHTML = rules.map((rule, index) => {
    const primaryEffect = rule.effects?.[0];
const effectText = primaryEffect
  ? formatEffectSign(primaryEffect)
  : "effect -";

    return `
<button
  type="button"
  class="group-edit-tag-btn ${index === 0 ? "active" : ""}"
  data-impact-cause-tag="${rule.key}"
  data-category="${rule.category}"
>

        <span class="tag-key">${getDisplayTagName(rule.key)}</span>
        <span class="tag-label">${rule.label}</span>
        <span class="tag-meta">${rule.category} · ${rule.stat || "Alive"} · ${effectText}</span>
      </button>
    `;
  }).join("");

  box.dataset.selectedTag = firstKey;
  box.dataset.entityType = entityType;
  box.dataset.selectedCategory = category;

  box.querySelectorAll("[data-impact-cause-tag]").forEach((btn) => {
    btn.onclick = () => {
  const key = btn.dataset.impactCauseTag;
  if (!key) return;

  box.dataset.selectedTag = key;

  box.querySelectorAll(".group-edit-tag-btn").forEach((node) => {
    node.classList.toggle(
      "active",
      node.dataset.impactCauseTag === key
    );
  });

  const detailGroupId = ensureGroupExplorerFullState?.().detailGroupId;
  if (detailGroupId) {
    refreshGroupImpactPreviewViews?.(detailGroupId);
  }
};
  });
}

function bindGroupFullEditControls(groupId) {
  const refTypeSelect = document.getElementById("group-edit-ref-type");
  const refTargetSelect = document.getElementById("group-edit-ref-target");
  const relationTagSelect = document.getElementById("group-edit-relation-tag");
  const addRefBtn = document.getElementById("btn-group-edit-add-ref");
const addRefWithTagsBtn = document.getElementById("btn-group-edit-add-ref-with-tags");
const addAdjustmentBtn = document.getElementById("btn-group-edit-add-adjustment");

renderEntityEditTagCategoryButtons?.("GROUP", "GROUP_STRUCTURE");
renderEntityEditTagButtons?.("GROUP", "GROUP_STRUCTURE");

if (refTypeSelect) {
  renderGroupEditRefTargetOptions?.(refTypeSelect.value || "EVT");
  renderGroupRefPreview?.(groupId);

  refTypeSelect.onchange = () => {
    renderGroupEditRefTargetOptions?.(refTypeSelect.value || "EVT");
    renderGroupRefPreview?.(groupId);
  };
}

if (refTargetSelect) {
  refTargetSelect.onchange = () => {
    renderGroupRefPreview?.(groupId);
  };
}

if (relationTagSelect) {
  relationTagSelect.onchange = () => {
    renderGroupRefPreview?.(groupId);
  };
}

if (addRefBtn) {
  addRefBtn.onclick = () => {
    applyGroupRefFromPreview(groupId, {
      applyTriggerTags: false
    });

    openGroupExplorerFullDetail?.(groupId);
  };
}

if (addRefWithTagsBtn) {
  addRefWithTagsBtn.onclick = () => {
    applyGroupRefFromPreview(groupId, {
      applyTriggerTags: true
    });

    openGroupExplorerFullDetail?.(groupId);
  };
}

  if (addAdjustmentBtn) {
    addAdjustmentBtn.onclick = () => {
      const tagBox = document.getElementById("group-edit-adjustment-tag-buttons");
      const categoryBox = document.getElementById("group-edit-adjustment-category-buttons");

      const tagKey = tagBox?.dataset.selectedTag || "";
      const category = categoryBox?.dataset.selectedCategory || "";

      const type = refTypeSelect?.value || null;
      const refId = refTargetSelect?.value || null;

      if (!tagKey) return;

      addGroupAdjustmentTag(groupId, tagKey, {
        sourceType: type,
        sourceRef: refId,
        category
      });

      triggerGroupRecomputeCascade?.(groupId, {
        reason: "ADD_ADJUSTMENT",
        source: refId || tagKey,
        tag: tagKey,
        category,
        scope: "related_only"
      });

      openGroupExplorerFullDetail?.(groupId);
    };
  }
}

function bindGroupImpactControls(groupId) {
  const targetGroupSelect = document.getElementById("group-impact-target-group");
  const relationTagInput = document.getElementById("group-impact-relation-tag");
  const applyBtn = document.getElementById("btn-group-impact-apply");
  const previewExplorerBtn = document.getElementById("btn-open-group-impact-preview-explorer");

  renderGroupImpactTargetGroupOptions(groupId);
  renderEntityImpactCauseCategoryButtons("GROUP", "GROUP_STRUCTURE");
  renderEntityImpactCauseTagButtons("GROUP", "GROUP_STRUCTURE");

  function syncRelationTag() {
    const targetGroupId = targetGroupSelect?.value || "";
    const relation = inferGroupToGroupRelationTag(groupId, targetGroupId);

    if (relationTagInput) {
      relationTagInput.value = relation || "NONE";
    }

    refreshGroupImpactPreviewViews?.(groupId);
  }

  if (targetGroupSelect) {
    syncRelationTag();

    targetGroupSelect.onchange = () => {
      syncRelationTag();
    };
  }

  if (applyBtn) {
    applyBtn.onclick = () => {
      applyGroupImpactFromPreview?.(groupId);
      openGroupExplorerFullDetail?.(groupId);
    };
  }

  if (previewExplorerBtn) {
    previewExplorerBtn.onclick = () => {
      openGroupImpactPreviewExplorer?.(groupId);
    };
  }

  refreshGroupImpactPreviewViews?.(groupId);
}

function cloneMetricPack(metrics = {}) {
  return {
    purity: Number(metrics.purity ?? metrics.purityScore ?? 1),
    contamination: Number(metrics.contamination ?? metrics.contaminationScore ?? 0),
    importance: Number(metrics.importance ?? metrics.importanceScore ?? 0),
    confidence: Number(metrics.confidence ?? metrics.confidenceScore ?? 0),
    g: Number(metrics.g ?? metrics.gScore ?? metrics.confidenceScore ?? 0)
  };
}

function applyEffectsToMetricPreview(baseMetrics = {}, effects = []) {
  const before = cloneMetricPack(baseMetrics);
  const after = { ...before };
  const deltas = [];

  (effects || []).forEach((effect) => {
    const target = effect.target;
    if (!target || !(target in after)) return;

    const min = Number(effect.min ?? 0);
    const max = Number(effect.max ?? min);
    const amount = (min + max) / 2;

    const prev = after[target];

    if (effect.direction === "up") {
      after[target] = clampMetricValue(after[target] + amount);
    } else {
      after[target] = clampMetricValue(after[target] - amount);
    }

    deltas.push({
      target,
      direction: effect.direction || "down",
      min,
      max,
      amount,
      before: prev,
      after: after[target]
    });
  });

  return {
    before,
    after,
    deltas
  };
}

function getSelectedGroupImpactCauseRule() {
  const tagBox = document.getElementById("group-impact-cause-tag-buttons");
  const categoryBox = document.getElementById("group-impact-cause-category-buttons");

  const tagKey = tagBox?.dataset.selectedTag || "";
  const category = categoryBox?.dataset.selectedCategory || "GROUP_STRUCTURE";

  if (!tagKey) return null;

  const rule = findEntityTagRule?.("GROUP", tagKey);
  if (!rule) return null;

  return {
    key: tagKey,
    category,
    ...rule
  };
}

function buildGroupImpactPreview(groupId) {
  const sourceGroup = groupStore.get(groupId);
  if (!sourceGroup) return null;

  const targetGroupSelect = document.getElementById("group-impact-target-group");
  const relationTagInput = document.getElementById("group-impact-relation-tag");

  const targetGroupId = targetGroupSelect?.value || "";
  const targetGroup = groupStore.get(targetGroupId) || null;

  if (!targetGroup) return null;

  const relationTag =
    relationTagInput?.value ||
    inferGroupToGroupRelationTag(groupId, targetGroupId) ||
    "NONE";

  const rule = getSelectedGroupImpactCauseRule();
  if (!rule) return null;

  const meta = getGroupCardMeta(targetGroup);

  const baseMetrics = {
    purity: meta.purityScore,
    contamination: meta.contaminationScore,
    importance: meta.importanceScore,
    confidence: meta.confidenceScore,
    g: meta.gScore
  };

  const preview = applyEffectsToMetricPreview(baseMetrics, rule.effects || []);

  return {
    sourceType: "GROUP",
    sourceRef: groupId,
    sourceGroupId: groupId,
    sourceGroupLabel: sourceGroup.name || sourceGroup.label || sourceGroup.id,

    targetGroupId,
    targetGroupLabel: targetGroup.name || targetGroup.label || targetGroup.id,

    relationTag,
    relationTags: relationTag && relationTag !== "NONE" ? [relationTag] : [],

    tag: rule.key,
    displayTag: getDisplayTagName?.(rule.key) || rule.key,
    category: rule.category,
    label: rule.label,
    meaning: rule.meaning || "",
    stat: rule.stat || "Alive",
    strength: "MID",

    effects: Array.isArray(rule.effects)
      ? rule.effects.map((effect) => ({ ...effect }))
      : [],

    before: preview.before,
    after: preview.after,
    deltas: preview.deltas
  };
}

function applyGroupImpactFromPreview(groupId) {
  const preview = buildGroupImpactPreview?.(groupId);
  if (!preview || !preview.tag || !preview.targetGroupId) return null;

  const targetGroup = groupStore.get(preview.targetGroupId);
  if (!targetGroup) return null;

  const entry = addGroupAdjustmentTag?.(preview.targetGroupId, preview.tag, {
    sourceType: "GROUP",
    sourceRef: preview.sourceGroupId || preview.sourceRef || null,
    sourceRole: "GROUP_IMPACT",
    category: preview.category || null,
    strength: preview.strength || "MID",
    relationTags: preview.relationTags || [],
    hypothesisRefs: preview.hypothesisRefs || [],
    premiseRefs: preview.premiseRefs || [],
    memo: `Group impact from ${preview.sourceGroupLabel || preview.sourceRef || "-"}`
  });

  if (!entry) {
    console.warn("Group impact apply skipped: duplicate or invalid tag", {
      sourceGroupId: preview.sourceGroupId,
      targetGroupId: preview.targetGroupId,
      tag: preview.tag
    });

    return null;
  }

  entry.sourceGroupId = preview.sourceGroupId;
  entry.targetGroupId = preview.targetGroupId;
  entry.relationTag = preview.relationTag;

  entry.previewBefore = preview.before ? { ...preview.before } : null;
  entry.previewAfter = preview.after ? { ...preview.after } : null;
  entry.previewDeltas = Array.isArray(preview.deltas)
    ? preview.deltas.map((delta) => ({ ...delta }))
    : [];

  triggerGroupRecomputeCascade?.(preview.targetGroupId, {
    reason: "APPLY_GROUP_IMPACT",
    source: preview.sourceGroupId || null,
    target: preview.targetGroupId,
    tag: preview.tag,
    relationTags: preview.relationTags || [],
    category: preview.category || null,
    scope: "related_only"
  });

  saveLabState?.();

  return entry;
}

function formatMetricValue(value) {
  return Number.isFinite(Number(value))
    ? Number(value).toFixed(3)
    : "-";
}

function formatMetricDelta(delta) {
  if (!delta) return "-";

  const sign = delta.direction === "up" ? "+" : "-";
  return `${sign}${Number(delta.amount || 0).toFixed(3)}`;
}

function renderGroupImpactPreviewInline(groupId) {
  const el = document.getElementById("group-impact-preview-explorer");

  if (!el || el.classList.contains("hidden")) {
    return;
  }

  renderGroupImpactPreviewExplorerBody?.(groupId);
}

function renderGroupImpactTargetGroupOptions(sourceGroupId) {
  const select = document.getElementById("group-impact-target-group");
  if (!select) return;

  const groups = [...groupStore.values()]
    .filter((group) => group?.id && group.id !== sourceGroupId)
    .map((group) => ({
      id: group.id,
      label: group.name || group.label || group.id
    }));

  if (!groups.length) {
    select.innerHTML = `<option value="">다른 Group 없음</option>`;
    return;
  }

  select.innerHTML = groups.map((group) => `
    <option value="${group.id}">${group.label}</option>
  `).join("");
}

function refreshGroupImpactPreviewViews(groupId) {
  const explorer = document.getElementById("group-impact-preview-explorer");

  if (explorer && !explorer.classList.contains("hidden")) {
    renderGroupImpactPreviewExplorerBody?.(groupId);
  }
}

function ensureGroupImpactPreviewExplorerEl() {
  let el = document.getElementById("group-impact-preview-explorer");
  if (el) return el;

  el = document.createElement("div");
  el.id = "group-impact-preview-explorer";
  el.className = "group-impact-preview-explorer hidden";

  el.innerHTML = `
    <div class="group-impact-preview-explorer-head">
      <div>
        <div class="group-impact-preview-explorer-kicker">GROUP IMPACT</div>
        <div id="group-impact-preview-explorer-title" class="group-impact-preview-explorer-title">
          Impact Preview
        </div>
      </div>

      <button id="btn-close-group-impact-preview-explorer" type="button">
        닫기
      </button>
    </div>

    <div id="group-impact-preview-explorer-body"></div>
  `;

  document.body.appendChild(el);

  const closeBtn = el.querySelector("#btn-close-group-impact-preview-explorer");
  if (closeBtn) {
    closeBtn.onclick = () => {
      closeGroupImpactPreviewExplorer();
    };
  }

  makeGroupImpactPreviewExplorerDraggable(el);

  return el;
}

function openGroupImpactPreviewExplorer(groupId) {
  const el = ensureGroupImpactPreviewExplorerEl();
  el.dataset.groupId = groupId;
  el.classList.remove("hidden");

  renderGroupImpactPreviewExplorerBody(groupId);
}

function hasEntityAdjustmentTag(entity, tagKey, options = {}) {
  const edit = ensureEntityEditState?.(entity);
  const tags = Array.isArray(edit?.adjustmentTags) ? edit.adjustmentTags : [];

  return tags.some((entry) => {
    if (entry.tag !== tagKey) return false;

    if (options.sourceType && entry.sourceType !== options.sourceType) {
      return false;
    }

    if (options.sourceRef && entry.sourceRef !== options.sourceRef) {
      return false;
    }

    return true;
  });
}

function closeGroupImpactPreviewExplorer() {
  const el = document.getElementById("group-impact-preview-explorer");
  if (!el) return;

  el.classList.add("hidden");
}

function renderGroupImpactPreviewExplorerBody(groupId) {
  const body = document.getElementById("group-impact-preview-explorer-body");
  if (!body) return;

  const group = groupStore.get(groupId);
  const preview = buildGroupImpactPreview?.(groupId);

  const title = document.getElementById("group-impact-preview-explorer-title");
  if (title && group) {
    title.textContent = group.name || group.label || group.id;
  }

  if (!preview || !preview.sourceRef || !preview.tag) {
    body.innerHTML = `
      <div class="group-impact-preview-empty">
        문제 대상과 원인 태그를 선택하면 preview가 표시됩니다.
      </div>
    `;
    return;
  }

  const metricKeys = ["purity", "contamination", "importance", "confidence", "g"];

body.innerHTML = `
  <section class="group-impact-preview-section">
    <div class="group-impact-preview-section-title">GROUP IMPACT SOURCE</div>

    <div class="group-impact-preview-info-grid">
      <div>
        <span>Source Group</span>
        <b>${preview.sourceGroupLabel || preview.sourceRef || "-"}</b>
      </div>

      <div>
        <span>Target Group</span>
        <b>${preview.targetGroupLabel || "-"}</b>
      </div>

      <div>
        <span>Relation Tags</span>
        <b>${
          Array.isArray(preview.relationTags) && preview.relationTags.length
            ? preview.relationTags.join(", ")
            : "NONE"
        }</b>
      </div>

      <div>
        <span>Impact Tag</span>
        <b>${preview.displayTag || getDisplayTagName?.(preview.tag) || preview.tag || "-"}</b>
      </div>

      <div>
        <span>Category</span>
        <b>${preview.category || "-"}</b>
      </div>

      <div>
        <span>Strength</span>
        <b>${preview.strengthSymbol || preview.strength || "중"}</b>
      </div>

      <div>
        <span>State</span>
        <b>${preview.stat || "Alive"}</b>
      </div>
    </div>
  </section>

  <section class="group-impact-preview-section">
    <div class="group-impact-preview-section-title">MEANING</div>
    <div class="group-impact-preview-meaning">
      ${preview.meaning || "-"}
    </div>
  </section>

  <section class="group-impact-preview-section">
    <div class="group-impact-preview-section-title">METRIC PREVIEW</div>

    <div class="group-impact-preview-metric-list">
      ${metricKeys.map((key) => {
        const delta = preview.deltas.find((item) => item.target === key);
        const changed = !!delta;

        return `
          <div class="group-impact-preview-metric ${changed ? "changed" : ""}">
            <span>${key}</span>
            <b>${formatMetricValue(preview.before[key])}</b>
            <em>→</em>
            <b>${formatMetricValue(preview.after[key])}</b>
            <small>${changed ? formatMetricDelta(delta) : "±0.000"}</small>
          </div>
        `;
      }).join("")}
    </div>
  </section>

  <section class="group-impact-preview-section">
    <div class="group-impact-preview-section-title">EFFECTS</div>

    <div class="group-impact-preview-effect-list">
      ${
        preview.deltas.length
          ? preview.deltas.map((delta) => `
            <div class="group-impact-preview-effect">
              <b>${delta.target}</b>
              <span>${delta.direction === "up" ? "+" : "-"}</span>
              <small>${Number(delta.min).toFixed(3)}~${Number(delta.max).toFixed(3)}</small>
            </div>
          `).join("")
          : `<div class="group-impact-preview-empty">변화 없음</div>`
      }
    </div>
  </section>
`;

}

function makeGroupImpactPreviewExplorerDraggable(el) {
  if (!el || el.dataset.dragBound === "true") return;

  const head = el.querySelector(".group-impact-preview-explorer-head");
  if (!head) return;

  let dragging = false;
  let offsetX = 0;
  let offsetY = 0;

  head.addEventListener("mousedown", (e) => {
    if (e.target.closest("button")) return;

    dragging = true;

    const rect = el.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    el.style.right = "auto";
    el.style.left = `${rect.left}px`;
    el.style.top = `${rect.top}px`;

    document.body.style.userSelect = "none";
  });

  window.addEventListener("mousemove", (e) => {
    if (!dragging) return;

    const w = el.offsetWidth;
    const h = el.offsetHeight;

    let nextLeft = e.clientX - offsetX;
    let nextTop = e.clientY - offsetY;

    nextLeft = Math.max(8, Math.min(nextLeft, window.innerWidth - w - 8));
    nextTop = Math.max(8, Math.min(nextTop, window.innerHeight - h - 8));

    el.style.left = `${nextLeft}px`;
    el.style.top = `${nextTop}px`;
  });

  window.addEventListener("mouseup", () => {
    dragging = false;
    document.body.style.userSelect = "";
  });

  el.dataset.dragBound = "true";
}

function applyGroupRefFromPreview(groupId, options = {}) {
  const preview = buildGroupRefPreview?.(groupId);
  if (!preview || !preview.refId) return null;

  const refEntry = addGroupReference(groupId, {
    type: preview.type,
    id: preview.refId,
    relationTag: preview.relationTag || "없음",
    changeTriggerTags: preview.changeTriggerTags || []
  });

  const appliedTags = [];

  if (options.applyTriggerTags) {
    (preview.changeTriggerTags || []).forEach((tagInfo) => {
      const tagKey = tagInfo.tag;
      if (!tagKey || tagKey === "NO_RELATION") return;

      const entry = addGroupAdjustmentTag?.(groupId, tagKey, {
        sourceType: preview.type,
        sourceRef: preview.refId,
        category: tagInfo.category || null,
        memo: `Applied from ref trigger: ${preview.type}:${preview.refId}`
      });

      if (entry) {
        appliedTags.push(entry.tag);
      }
    });
  }

  triggerGroupRecomputeCascade?.(groupId, {
    reason: options.applyTriggerTags
      ? "ADD_REF_WITH_TRIGGER_TAGS"
      : "ADD_REF_ONLY",
    source: preview.refId,
    relationTag: preview.relationTag,
    changeTriggerTags: (preview.changeTriggerTags || []).map((t) => t.tag),
    appliedTags,
    scope: "related_only"
  });

  return {
    refEntry,
    appliedTags,
    preview
  };
}

function bindGroupDetailTagChips(groupId) {
  document
    .querySelectorAll("[data-group-detail-tag]")
    .forEach((btn) => {
      btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();

        const tag = btn.dataset.groupDetailTag;
        const type = btn.dataset.groupDetailTagType || "all";

        openGroupTagListExplorer(groupId, {
          tag,
          type
        });
      };
    });
}

function ensureGroupTagListExplorerEl() {
  let el = document.getElementById("group-tag-list-explorer");
  if (el) return el;

  el = document.createElement("div");
  el.id = "group-tag-list-explorer";
  el.className = "group-tag-list-explorer hidden";

  el.innerHTML = `
    <div class="group-tag-list-explorer-head">
      <div>
        <div class="group-tag-list-kicker">GROUP TAGS</div>
        <div id="group-tag-list-title" class="group-tag-list-title">-</div>
      </div>

      <button id="btn-close-group-tag-list-explorer" type="button">닫기</button>
    </div>

    <div id="group-tag-list-body"></div>
  `;

  document.body.appendChild(el);

  const closeBtn = el.querySelector("#btn-close-group-tag-list-explorer");
  if (closeBtn) {
    closeBtn.onclick = () => {
      el.classList.add("hidden");
    };
  }

  makeGroupTagListExplorerDraggable(el);

  return el;
}

function openGroupTagListExplorer(groupId, options = {}) {
  const group = groupStore.get(groupId);
  if (!group) return;

  const el = ensureGroupTagListExplorerEl();
  el.dataset.groupId = groupId;
  el.classList.remove("hidden");

  const title = el.querySelector("#group-tag-list-title");
  if (title) {
    title.textContent = `${group.name || group.label || group.id} · ${options.type || "tags"}`;
  }

  renderGroupTagListExplorerBody(groupId, options);
}

function renderGroupTagListExplorerBody(groupId, options = {}) {
  const body = document.getElementById("group-tag-list-body");
  if (!body) return;

  const group = groupStore.get(groupId);
  if (!group) return;

  const entries = sortEntityTagsForDisplay(getGroupEditTagEntries(group));
  const selectedTag = options.tag || "";

  const visibleEntries = selectedTag
    ? entries.filter((entry) => entry.tag === selectedTag)
    : entries;

  if (!visibleEntries.length) {
    body.innerHTML = `<div class="group-log-empty">해당 태그 기록 없음</div>`;
    return;
  }

  body.innerHTML = visibleEntries.map((entry) => {
    const effectText = formatTagEffects(entry.effects || []);

    return `
      <div class="group-tag-list-item">
        <div>
          <b>${entry.tag || "-"}</b>
          <span>${entry.label || "-"}</span>
          <small>${entry.category || "-"} · ${entry.stat || "Alive"}</small>
        </div>

        <div class="group-tag-list-effect">${effectText}</div>

        <div class="group-tag-list-meaning">
          ${entry.meaning || "-"}
        </div>
      </div>
    `;
  }).join("");
}

function makeGroupTagListExplorerDraggable(el) {
  if (!el || el.dataset.dragBound === "true") return;

  const head = el.querySelector(".group-tag-list-explorer-head");
  if (!head) return;

  let dragging = false;
  let offsetX = 0;
  let offsetY = 0;

  head.addEventListener("mousedown", (e) => {
    if (e.target.closest("button")) return;

    dragging = true;

    const rect = el.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    el.style.right = "auto";
    el.style.left = `${rect.left}px`;
    el.style.top = `${rect.top}px`;

    document.body.style.userSelect = "none";
  });

  window.addEventListener("mousemove", (e) => {
    if (!dragging) return;

    const w = el.offsetWidth;
    const h = el.offsetHeight;

    let nextLeft = e.clientX - offsetX;
    let nextTop = e.clientY - offsetY;

    nextLeft = Math.max(8, Math.min(nextLeft, window.innerWidth - w - 8));
    nextTop = Math.max(8, Math.min(nextTop, window.innerHeight - h - 8));

    el.style.left = `${nextLeft}px`;
    el.style.top = `${nextTop}px`;
  });

  window.addEventListener("mouseup", () => {
    dragging = false;
    document.body.style.userSelect = "";
  });

  el.dataset.dragBound = "true";
}

function getGroupsRelatedToGroup(groupId) {
  if (!groupId) return [];

  const targetGroup = groupStore.get(groupId);
  if (!targetGroup) return [];

  const targetNodes = new Set(getGroupAllNodeIds?.(targetGroup) || []);
  const related = [];

  groupStore.forEach((group, id) => {
    if (!group || id === groupId) return;

    const nodeIds = getGroupAllNodeIds?.(group) || [];
    const hasSharedNode = nodeIds.some((nodeId) => targetNodes.has(nodeId));

    const edit = ensureGroupEditState(group);
    const hasGroupRef = (edit?.refs || []).some((ref) => ref.type === "GROUP" && ref.refId === groupId);

    if (hasSharedNode || hasGroupRef) {
      related.push(id);
    }
  });

  return related;
}

function triggerGroupRecomputeCascade(groupId, options = {}) {
  if (!groupId) return null;

  const relatedGroupIds = getGroupsRelatedToGroup(groupId);

  if (!uiState.groupRecomputeLogs) {
    uiState.groupRecomputeLogs = [];
  }

  const log = {
    id: `GRECOMP-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    groupId,
    relatedGroupIds,
    affectedCount: relatedGroupIds.length,
    reason: options.reason || "UNKNOWN",
    source: options.source || null,
    tag: options.tag || null,
    category: options.category || null,
    scope: options.scope || "related_only",
    createdAt: Date.now()
  };

  uiState.groupRecomputeLogs.push(log);

  // 너무 커지는 것 방지
  if (uiState.groupRecomputeLogs.length > 200) {
    uiState.groupRecomputeLogs = uiState.groupRecomputeLogs.slice(-200);
  }

  // 관련 group에 dirty flag만 남김. 실제 계산은 렌더 시 getGroupCardMeta가 수행.
  relatedGroupIds.forEach((id) => {
    const group = groupStore.get(id);
    if (!group) return;

    if (!group.runtime) group.runtime = {};
    group.runtime.needsRecompute = true;
    group.runtime.lastRecomputeSourceGroupId = groupId;
    group.runtime.lastRecomputeLogId = log.id;
  });

  const self = groupStore.get(groupId);
  if (self) {
    if (!self.runtime) self.runtime = {};
    self.runtime.needsRecompute = true;
    self.runtime.lastRecomputeLogId = log.id;
  }

  saveLabState?.();

  return log;
}

/*function renderGroupFullEditLog(groupId) {
  const box = document.getElementById("group-edit-log");
  if (!box) return;

  const group = groupStore.get(groupId);
  if (!group) return;

  const edit = ensureGroupEditState(group);
  const refs = edit?.refs || [];
  const adjustments = edit?.adjustmentTags || [];

  const refHtml = refs.length
    ? refs.map((ref) => `
      <div class="group-edit-log-item ref" data-ref-entry-id="${ref.id}">
        <b>REF</b>
        <span>${ref.type || "-"}</span>
        <span>${ref.refId || "-"}</span>
        <span>${ref.relationTag || "-"}</span>
        <button
          type="button"
          class="group-edit-log-remove"
          data-remove-ref="${ref.id}"
        >
          삭제
        </button>
      </div>
    `).join("")
    : `<div class="group-edit-empty">참조 없음</div>`;

  const adjHtml = adjustments.length
    ? adjustments.map((adj) => {
        const amount = Number(adj.amount || 0);
        const amountText = `${adj.direction === "up" ? "+" : "-"}${amount.toFixed(2)}`;

        return `
          <div class="group-edit-log-item adjustment" data-adjustment-id="${adj.id}">
            <b>${adj.tag || "-"}</b>
            <span>${adj.label || "-"}</span>
            <span>${adj.target || "-"} ${amountText}</span>
            <span>${adj.reason || "-"}</span>
            <small>${adj.sourceRef || "-"}</small>
            <button
              type="button"
              class="group-edit-log-remove"
              data-remove-adjustment="${adj.id}"
            >
              삭제
            </button>
          </div>
        `;
      }).join("")
    : `<div class="group-edit-empty">조정 태그 없음</div>`;

  box.innerHTML = `
    <div class="group-edit-log-toolbar">
      <button id="btn-group-edit-undo-last" type="button">
        마지막 작업 되돌리기
      </button>
    </div>

    <div class="group-edit-log-section">
      <div class="group-edit-log-title">REFERENCES</div>
      ${refHtml}
    </div>

    <div class="group-edit-log-section">
      <div class="group-edit-log-title">ADJUSTMENTS</div>
      ${adjHtml}
    </div>
  `;

  bindGroupFullEditLogActions(groupId);
}*/

function formatEffectSign(effect) {
  const sign = effect?.direction === "up" ? "+" : "-";
  const min = Number(effect?.min ?? 0);
  const max = Number(effect?.max ?? min);

  if (min === max) {
    return `${effect.target || "-"} ${sign}${min.toFixed(2)}`;
  }

  return `${effect.target || "-"} ${sign}${min.toFixed(2)}~${max.toFixed(2)}`;
}

function undoLastGroupEditAction(groupId) {
  if (!groupId) return false;

  const group = groupStore.get(groupId);
  if (!group) return false;

  const edit = ensureGroupEditState(group);
  if (!edit) return false;

  const logs = Array.isArray(edit.logs) ? edit.logs : [];
  if (!logs.length) return false;

  const last = logs[logs.length - 1];

  if (last.type === "ADD_REF") {
    const targetRefId = last.refEntryId || last.entryId || null;

    if (targetRefId) {
      edit.refs = edit.refs.filter((ref) => ref.id !== targetRefId);
    } else {
      edit.refs.pop();
    }

    edit.logs.push({
      type: "UNDO_ADD_REF",
      originalLog: last,
      createdAt: Date.now()
    });

    saveLabState?.();
    return true;
  }

if (last.type === "ADD_ADJUSTMENT" || last.type === "ADD_TAG") {
  const targetAdjId = last.adjustmentId || last.entryId || null;

  if (targetAdjId) {
    edit.adjustmentTags = edit.adjustmentTags.filter((adj) => adj.id !== targetAdjId);
  } else {
    edit.adjustmentTags.pop();
  }

  edit.logs.push({
    type: "UNDO_ADD_TAG",
    originalLog: last,
    createdAt: Date.now()
  });

  saveLabState?.();
  return true;
}

  return false;
}
/*
function bindGroupFullEditLogActions(groupId) {
  const box = document.getElementById("group-edit-log");
  if (!box) return;

  const undoBtn = document.getElementById("btn-group-edit-undo-last");
  if (undoBtn) {
    undoBtn.onclick = () => {
      undoLastGroupEditAction?.(groupId);

      triggerGroupRecomputeCascade?.(groupId, {
        reason: "UNDO_LAST_EDIT",
        source: groupId,
        scope: "related_only"
      });

      openGroupExplorerFullDetail?.(groupId);
    };
  }

  box.querySelectorAll("[data-remove-ref]").forEach((btn) => {
    btn.onclick = () => {
      const refEntryId = btn.dataset.removeRef;
      if (!refEntryId) return;

      removeGroupReference?.(groupId, refEntryId);

      triggerGroupRecomputeCascade?.(groupId, {
        reason: "REMOVE_REF",
        source: refEntryId,
        scope: "related_only"
      });

      openGroupExplorerFullDetail?.(groupId);
    };
  });

  box.querySelectorAll("[data-remove-adjustment]").forEach((btn) => {
    btn.onclick = () => {
      const adjustmentId = btn.dataset.removeAdjustment;
      if (!adjustmentId) return;

      removeGroupAdjustmentTag?.(groupId, adjustmentId);

      triggerGroupRecomputeCascade?.(groupId, {
        reason: "REMOVE_ADJUSTMENT",
        source: adjustmentId,
        scope: "related_only"
      });

      openGroupExplorerFullDetail?.(groupId);
    };
  });
}
*/
function getGroupBucketBulkEditState() {
  const state = ensureGroupExplorerFullState();

  if (!state.bucketBulkEdit || typeof state.bucketBulkEdit !== "object") {
    state.bucketBulkEdit = {
      openBucketKey: null,
      category: "GROUP_STRUCTURE"
    };
  }

  if (!state.bucketBulkEdit.category) {
    state.bucketBulkEdit.category = "GROUP_STRUCTURE";
  }

  return state.bucketBulkEdit;
}

function openGroupBucketBulkEdit(bucketKey) {
  if (!bucketKey) return;

  const bulk = getGroupBucketBulkEditState();
  bulk.openBucketKey = bucketKey;
  bulk.category = bulk.category || "GROUP_STRUCTURE";

  renderGroupExplorerFullSubview?.();
  saveLabState?.();
}

function closeGroupBucketBulkEdit() {
  const bulk = getGroupBucketBulkEditState();
  bulk.openBucketKey = null;

  renderGroupExplorerFullSubview?.();
  saveLabState?.();
}

function getCurrentGroupExplorerFullBuckets() {
  const state = ensureGroupExplorerFullState();
  const items = getGroupExplorerFullItems();
  const axis = state.axis || "overall";

  if (axis === "overall") return [];

  return sortGroupExplorerFullBuckets(
    getGroupExplorerFullBuckets(items, axis)
  );
}

function getCurrentGroupExplorerFullBucketByKey(bucketKey) {
  return getCurrentGroupExplorerFullBuckets()
    .find((bucket) => bucket.key === bucketKey) || null;
}

function applyGroupBucketAdjustment(bucketKey, tagKey, options = {}) {
  if (!bucketKey || !tagKey) return null;

  const bucket = getCurrentGroupExplorerFullBucketByKey(bucketKey);
  if (!bucket || !Array.isArray(bucket.items) || !bucket.items.length) {
    return null;
  }

  const bulkId = `GBULK-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const appliedGroupIds = [];

  bucket.items.forEach((item) => {
    const groupId = item.id || item.group?.id;
    if (!groupId) return;

    const entry = addGroupAdjustmentTag?.(groupId, tagKey, {
      sourceType: "BUCKET",
      sourceRef: bucketKey,
      bulkId,
      category: options.category || null,
      memo: `Bucket bulk adjustment: ${bucket.label || bucket.key}`
    });

    if (entry) {
      appliedGroupIds.push(groupId);

      triggerGroupRecomputeCascade?.(groupId, {
        reason: "BUCKET_BULK_ADJUSTMENT",
        source: bucketKey,
        tag: tagKey,
        category: options.category || null,
        scope: "related_only"
      });
    }
  });

  if (!uiState.groupRecomputeLogs) {
    uiState.groupRecomputeLogs = [];
  }

uiState.groupRecomputeLogs.push({
  id: bulkId,
  type: "BUCKET_BULK_ADJUSTMENT",

  entityType: "GROUP",
  logClass: "BULK_EDIT",
  logTarget: "BUCKET",
  status: "ACTIVE",

  axis: ensureGroupExplorerFullState?.().axis || "overall",
  bucketKey,
  bucketLabel: bucket.label || bucket.key,

  tag: tagKey,
  category: options.category || null,

  appliedGroupIds,
  affectedCount: appliedGroupIds.length,

  createdAt: Date.now()
});

  if (uiState.groupRecomputeLogs.length > 200) {
    uiState.groupRecomputeLogs = uiState.groupRecomputeLogs.slice(-200);
  }

  saveLabState?.();

  return {
    bulkId,
    bucketKey,
    tagKey,
    appliedGroupIds
  };
}

function undoGroupBucketBulkAdjustment(bulkId) {
  if (!bulkId) return false;

  let removedCount = 0;
  const affectedGroupIds = [];

  groupStore.forEach((group, groupId) => {
    if (!group) return;

    const edit = ensureGroupEditState(group);
    if (!edit) return;

    const before = edit.adjustmentTags.length;

    edit.adjustmentTags = edit.adjustmentTags.filter((adj) => {
      return adj.bulkId !== bulkId;
    });

    const removed = before - edit.adjustmentTags.length;

    if (removed > 0) {
      removedCount += removed;
      affectedGroupIds.push(groupId);

      edit.logs.push({
        type: "UNDO_BUCKET_BULK_ADJUSTMENT",
        bulkId,
        removedCount: removed,
        createdAt: Date.now()
      });

      if (!group.runtime) group.runtime = {};
      group.runtime.needsRecompute = true;
      group.runtime.lastBulkUndoId = bulkId;
    }
  });

  console.log("UNDO BULK SCAN", {
    bulkId,
    removedCount,
    affectedGroupIds
  });

  if (!uiState.groupRecomputeLogs) {
    uiState.groupRecomputeLogs = [];
  }

  uiState.groupRecomputeLogs.push({
  id: `GBULK-UNDO-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  type: "UNDO_BUCKET_BULK_ADJUSTMENT",

  entityType: "GROUP",
  logClass: "BULK_EDIT",
  logTarget: "BUCKET",
  status: "UNDONE",

  bulkId,
  affectedGroupIds,
  affectedCount: affectedGroupIds.length,
  removedCount,

  createdAt: Date.now()
});

  if (uiState.groupRecomputeLogs.length > 200) {
    uiState.groupRecomputeLogs = uiState.groupRecomputeLogs.slice(-200);
  }

  saveLabState?.();
  renderGroupExplorerFullSubview?.();

  return removedCount > 0;
}

function ensureGroupBulkHistoryExplorerEl() {
  let el = document.getElementById("group-bulk-history-explorer");
  if (el) return el;

  el = document.createElement("div");
  el.id = "group-bulk-history-explorer";
  el.className = "group-bulk-history-explorer hidden";

  el.innerHTML = `
    <div class="group-bulk-history-explorer-head">
      <div>
        <div class="group-bulk-history-kicker">GROUP BULK LOG</div>
        <div class="group-bulk-history-title">Bulk History Explorer</div>
      </div>

      <button id="btn-close-group-bulk-history-explorer" type="button">닫기</button>
    </div>

<div class="group-bulk-history-tabs">
  <button type="button" data-bulk-log-tab="active" class="active">ACTIVE</button>
  <button type="button" data-bulk-log-tab="raw">RAW LOG</button>
  <button type="button" data-bulk-log-tab="undone">UNDONE</button>
  <button type="button" data-bulk-log-tab="tag">BY TAG</button>
  <button type="button" data-bulk-log-tab="bucket">BY BUCKET</button>
</div>

    <div id="group-bulk-history-explorer-body"></div>
  `;

  document.body.appendChild(el);

  const closeBtn = el.querySelector("#btn-close-group-bulk-history-explorer");
  if (closeBtn) {
    closeBtn.onclick = () => closeGroupBulkHistoryExplorer();
  }

  el.querySelectorAll("[data-bulk-log-tab]").forEach((btn) => {
    btn.onclick = () => {
      const tab = btn.dataset.bulkLogTab || "active";

      el.querySelectorAll("[data-bulk-log-tab]").forEach((node) => {
        node.classList.toggle("active", node === btn);
      });

      el.dataset.activeTab = tab;
      renderGroupBulkHistoryExplorerBody(tab);
    };
  });

  el.dataset.activeTab = "active";

  makeGroupBulkHistoryExplorerDraggable(el);

  return el;
}

function openGroupBulkHistoryExplorer() {
  const el = ensureGroupBulkHistoryExplorerEl();
  el.classList.remove("hidden");

  const tab = el.dataset.activeTab || "active";
  renderGroupBulkHistoryExplorerBody(tab);
}

function closeGroupBulkHistoryExplorer() {
  const el = document.getElementById("group-bulk-history-explorer");
  if (!el) return;
  el.classList.add("hidden");
}

function renderGroupBulkHistoryExplorerBody(tab = "active") {
  const body = document.getElementById("group-bulk-history-explorer-body");
  if (!body) return;

  const logs = Array.isArray(uiState.groupRecomputeLogs)
    ? uiState.groupRecomputeLogs
    : [];

  const undoneBulkIds = new Set(
    logs
      .filter((log) => log.type === "UNDO_BUCKET_BULK_ADJUSTMENT")
      .map((log) => log.bulkId)
      .filter(Boolean)
  );

  if (tab === "raw") {
    const rawLogs = logs.slice().sort((a, b) => {
      return Number(b.createdAt || 0) - Number(a.createdAt || 0);
    });

    if (!rawLogs.length) {
      body.innerHTML = `<div class="group-log-empty">Raw bulk log 없음</div>`;
      return;
    }

    body.innerHTML = rawLogs.map((log) => {
      const isUndo = log.type === "UNDO_BUCKET_BULK_ADJUSTMENT";

      return `
        <div class="group-bulk-history-explorer-item raw ${isUndo ? "undone" : ""}">
          <div>
            <div class="bulk-log-main-line">
              <b>${log.type || "-"}</b>
              <span>${log.tag || log.bulkId || log.bucketLabel || log.bucketKey || "-"}</span>
            </div>

            <div class="bulk-log-chip-row">
              <em>${log.entityType || "GROUP"}</em>
              <em>${log.logClass || "BULK_EDIT"}</em>
              <em>${log.logTarget || "BUCKET"}</em>
              <em>${log.axis || "-"}</em>
              <em>${log.category || "-"}</em>
              <em>${log.status || (isUndo ? "UNDONE" : "ACTIVE")}</em>
            </div>

            <small>
              affected ${log.affectedCount || 0}
              ${
                Number.isFinite(log.removedCount)
                  ? ` · removed ${log.removedCount}`
                  : ""
              }
              · ${log.createdAt ? new Date(log.createdAt).toLocaleString() : "-"}
            </small>
          </div>
        </div>
      `;
    }).join("");

    return;
  }

  if (tab === "undone") {
  const undoneLogs = logs
    .filter((log) => log.type === "UNDO_BUCKET_BULK_ADJUSTMENT")
    .slice()
    .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));

  if (!undoneLogs.length) {
    body.innerHTML = `<div class="group-log-empty">Undone bulk log 없음</div>`;
    return;
  }

  body.innerHTML = undoneLogs.map((log) => `
    <div class="group-bulk-history-explorer-item undone">
      <div>
        <div class="bulk-log-main-line">
          <b>UNDONE</b>
          <span>${log.bulkId || "-"}</span>
        </div>

        <div class="bulk-log-chip-row">
          <em>${log.entityType || "GROUP"}</em>
          <em>${log.logClass || "BULK_EDIT"}</em>
          <em>${log.logTarget || "BUCKET"}</em>
          <em>${log.status || "UNDONE"}</em>
        </div>

        <small>
          affected ${log.affectedCount || 0}
          · removed ${log.removedCount || 0}
          · ${log.createdAt ? new Date(log.createdAt).toLocaleString() : "-"}
        </small>
      </div>
    </div>
  `).join("");

  return;
}

if (tab === "tag") {
  const activeBulkLogs = logs
    .filter((log) => log.type === "BUCKET_BULK_ADJUSTMENT")
    .filter((log) => !undoneBulkIds.has(log.id));

  const map = new Map();

  activeBulkLogs.forEach((log) => {
    const key = log.tag || "-";

    const prev = map.get(key) || {
      tag: key,
      count: 0,
      affectedCount: 0,
      categories: new Set(),
      buckets: new Set(),
      logs: []
    };

    prev.count += 1;
    prev.affectedCount += Number(log.affectedCount || 0);
    if (log.category) prev.categories.add(log.category);
    if (log.bucketLabel || log.bucketKey) prev.buckets.add(log.bucketLabel || log.bucketKey);
    prev.logs.push(log);

    map.set(key, prev);
  });

  const rows = [...map.values()].sort((a, b) => {
    if (b.affectedCount !== a.affectedCount) return b.affectedCount - a.affectedCount;
    return String(a.tag).localeCompare(String(b.tag));
  });

  if (!rows.length) {
    body.innerHTML = `<div class="group-log-empty">Tag 기준 bulk log 없음</div>`;
    return;
  }

  body.innerHTML = rows.map((row) => `
    <div class="group-bulk-history-explorer-item">
      <div>
        <div class="bulk-log-main-line">
          <b>${row.tag}</b>
          <span>${row.count} bulk logs</span>
        </div>

        <div class="bulk-log-chip-row">
          ${[...row.categories].map((category) => `<em>${category}</em>`).join("")}
          <em>${row.buckets.size} buckets</em>
          <em>${row.affectedCount} affected</em>
        </div>

        <small>${[...row.buckets].slice(0, 4).join(", ") || "-"}</small>
      </div>
    </div>
  `).join("");

  return;
}

if (tab === "bucket") {
  const activeBulkLogs = logs
    .filter((log) => log.type === "BUCKET_BULK_ADJUSTMENT")
    .filter((log) => !undoneBulkIds.has(log.id));

  const map = new Map();

  activeBulkLogs.forEach((log) => {
    const key = log.bucketKey || log.bucketLabel || "-";

    const prev = map.get(key) || {
      bucketKey: key,
      bucketLabel: log.bucketLabel || log.bucketKey || "-",
      axis: log.axis || "-",
      count: 0,
      affectedCount: 0,
      tags: new Set(),
      categories: new Set(),
      logs: []
    };

    prev.count += 1;
    prev.affectedCount += Number(log.affectedCount || 0);
    if (log.tag) prev.tags.add(log.tag);
    if (log.category) prev.categories.add(log.category);
    prev.logs.push(log);

    map.set(key, prev);
  });

  const rows = [...map.values()].sort((a, b) => {
    if (b.affectedCount !== a.affectedCount) return b.affectedCount - a.affectedCount;
    return String(a.bucketLabel).localeCompare(String(b.bucketLabel));
  });

  if (!rows.length) {
    body.innerHTML = `<div class="group-log-empty">Bucket 기준 bulk log 없음</div>`;
    return;
  }

  body.innerHTML = rows.map((row) => `
    <div class="group-bulk-history-explorer-item">
      <div>
        <div class="bulk-log-main-line">
          <b>${row.bucketLabel}</b>
          <span>${row.count} bulk logs</span>
        </div>

        <div class="bulk-log-chip-row">
          <em>${row.axis}</em>
          ${[...row.categories].map((category) => `<em>${category}</em>`).join("")}
          <em>${row.tags.size} tags</em>
          <em>${row.affectedCount} affected</em>
        </div>

        <small>${[...row.tags].slice(0, 5).join(", ") || "-"}</small>
      </div>
    </div>
  `).join("");

  return;
}

  const bulkLogs = logs
    .filter((log) => log.type === "BUCKET_BULK_ADJUSTMENT")
    .filter((log) => !undoneBulkIds.has(log.id))
    .slice()
    .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));

  if (!bulkLogs.length) {
    body.innerHTML = `<div class="group-log-empty">Active bulk 작업 없음</div>`;
    return;
  }

  body.innerHTML = bulkLogs.map((log) => {
    return `
      <div class="group-bulk-history-explorer-item active">
        <div>
          <div class="bulk-log-main-line">
            <b>${log.tag || "-"}</b>
            <span>${log.bucketLabel || log.bucketKey || "-"}</span>
          </div>

          <div class="bulk-log-chip-row">
            <em>${log.entityType || "GROUP"}</em>
            <em>${log.logClass || "BULK_EDIT"}</em>
            <em>${log.logTarget || "BUCKET"}</em>
            <em>${log.axis || "-"}</em>
            <em>${log.category || "-"}</em>
            <em>ACTIVE</em>
          </div>

          <small>${log.affectedCount || 0} groups</small>
        </div>

        <button
          type="button"
          data-undo-bulk="${log.id}"
        >
          undo
        </button>
      </div>
    `;
  }).join("");

  bindGroupBulkHistoryExplorerActions();
}

function bindGroupBulkHistoryExplorerActions() {
  const body = document.getElementById("group-bulk-history-explorer-body");
  if (!body) return;

  body.querySelectorAll("[data-undo-bulk]").forEach((btn) => {
    btn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();

      const bulkId = btn.dataset.undoBulk;
      if (!bulkId) return;

      undoGroupBucketBulkAdjustment?.(bulkId);

      const el = document.getElementById("group-bulk-history-explorer");
      const tab = el?.dataset.activeTab || "active";

      renderGroupBulkHistoryExplorerBody(tab);
      renderGroupExplorerFullSubview?.();
    };
  });
}

function makeGroupBulkHistoryExplorerDraggable(el) {
  if (!el || el.dataset.dragBound === "true") return;

  const head = el.querySelector(".group-bulk-history-explorer-head");
  if (!head) return;

  let dragging = false;
  let offsetX = 0;
  let offsetY = 0;

  head.addEventListener("mousedown", (e) => {
    if (e.target.closest("button")) return;

    dragging = true;

    const rect = el.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    el.style.right = "auto";
    el.style.left = `${rect.left}px`;
    el.style.top = `${rect.top}px`;

    document.body.style.userSelect = "none";
  });

  window.addEventListener("mousemove", (e) => {
    if (!dragging) return;

    const w = el.offsetWidth;
    const h = el.offsetHeight;

    let nextLeft = e.clientX - offsetX;
    let nextTop = e.clientY - offsetY;

    nextLeft = Math.max(8, Math.min(nextLeft, window.innerWidth - w - 8));
    nextTop = Math.max(8, Math.min(nextTop, window.innerHeight - h - 8));

    el.style.left = `${nextLeft}px`;
    el.style.top = `${nextTop}px`;
  });

  window.addEventListener("mouseup", () => {
    dragging = false;
    document.body.style.userSelect = "";
  });

  el.dataset.dragBound = "true";
}

function renderGroupBulkHistory() {
  const logs = Array.isArray(uiState.groupRecomputeLogs)
    ? uiState.groupRecomputeLogs
    : [];

  const undoneBulkIds = new Set(
    logs
      .filter((log) => log.type === "UNDO_BUCKET_BULK_ADJUSTMENT")
      .map((log) => log.bulkId)
      .filter(Boolean)
  );

  const activeBulkCount = logs
    .filter((log) => log.type === "BUCKET_BULK_ADJUSTMENT")
    .filter((log) => !undoneBulkIds.has(log.id))
    .length;

  return `
    <div class="group-bulk-history-launcher">
      <div>
        <b>BULK HISTORY</b>
        <span>${activeBulkCount} active bulk logs</span>
      </div>

      <button
        type="button"
        id="btn-open-group-bulk-history-explorer"
      >
        Open Bulk Log Explorer
      </button>
    </div>
  `;
}

function renderGroupBucketBulkEditPanel(bucket) {
  const bulk = getGroupBucketBulkEditState();

  if (!bucket || bulk.openBucketKey !== bucket.key) {
    return "";
  }

  const categories = getEntityTagCategories("GROUP");
  const category = categories[bulk.category]
    ? bulk.category
    : "GROUP_STRUCTURE";

  const rules = getEntityTagRules("GROUP", category);
  const firstTag = rules[0]?.key || "";

  const tagHtml = rules.length
    ? rules.map((rule, index) => {
        const effect = rule.effects?.[0];
        const effectText = effect
          ? `${effect.target} ${effect.direction} ${effect.min ?? 0}~${effect.max ?? effect.min ?? 0}`
          : "effect -";

        return `
          <button
            type="button"
            class="group-bucket-bulk-tag-btn ${index === 0 ? "active" : ""}"
            data-bucket-bulk-tag="${rule.key}"
          >
            <span>${rule.key}</span>
            <b>${rule.label}</b>
            <small>${rule.category} · ${rule.stat || "Alive"} · ${effectText}</small>
          </button>
        `;
      }).join("")
    : `<div class="group-edit-empty">해당 카테고리 태그 없음</div>`;

  return `
    <div class="group-bucket-bulk-panel" data-bucket-bulk-panel="${bucket.key}">
      <div class="group-bucket-bulk-head">
        <div>
          <div class="group-bucket-bulk-kicker">BULK EDIT</div>
          <div class="group-bucket-bulk-title">${bucket.label}</div>
          <div class="group-bucket-bulk-sub">${bucket.count} groups · ${bucket.percent}%</div>
        </div>

        <button
          type="button"
          class="group-bucket-bulk-close"
          data-close-bucket-bulk="${bucket.key}"
        >
          닫기
        </button>
      </div>

      <div class="group-bucket-bulk-category-row">
        ${Object.entries(categories).map(([key, label]) => `
          <button
            type="button"
            class="group-bucket-bulk-category-btn ${key === category ? "active" : ""}"
            data-bucket-bulk-category="${key}"
          >
            <span>${key}</span>
            <b>${label}</b>
          </button>
        `).join("")}
      </div>

      <div
        class="group-bucket-bulk-tag-row"
        data-selected-bucket-bulk-tag="${firstTag}"
      >
        ${tagHtml}
      </div>

      <div class="group-bucket-bulk-actions">
        <button
          type="button"
          class="group-bucket-bulk-apply"
          data-apply-bucket-bulk="${bucket.key}"
        >
          Apply to Bucket
        </button>
      </div>
    </div>
  `;
}

function getGroupBucketSummary(bucket) {
  const items = Array.isArray(bucket?.items) ? bucket.items : [];

  if (!items.length) {
    return {
      avgPurity: 0,
      avgContamination: 0,
      avgImportance: 0,
      avgConfidence: 0,
      topRelation: "-",
      topCenter: "-"
    };
  }

  const sum = items.reduce(
    (acc, item) => {
      acc.purity += Number(item.purity || 0);
      acc.contamination += Number(item.contamination || 0);
      acc.importance += Number(item.importance || 0);
      acc.confidence += Number(item.confidence || 0);

      const relation = item.meta?.relationTag || "-";
      const center = item.meta?.centerNodeId || "-";

      acc.relationCounts.set(relation, (acc.relationCounts.get(relation) || 0) + 1);
      acc.centerCounts.set(center, (acc.centerCounts.get(center) || 0) + 1);

      return acc;
    },
    {
      purity: 0,
      contamination: 0,
      importance: 0,
      confidence: 0,
      relationCounts: new Map(),
      centerCounts: new Map()
    }
  );

  const pickTop = (map) => {
    return [...map.entries()]
      .sort((a, b) => {
        if (b[1] !== a[1]) return b[1] - a[1];
        return String(a[0]).localeCompare(String(b[0]));
      })[0]?.[0] || "-";
  };

  const count = items.length || 1;

  return {
    avgPurity: sum.purity / count,
    avgContamination: sum.contamination / count,
    avgImportance: sum.importance / count,
    avgConfidence: sum.confidence / count,
    topRelation: pickTop(sum.relationCounts),
    topCenter: pickTop(sum.centerCounts)
  };
}

function applyPatternLinkRelationFilter() {
  const plc = getPatternLinkCy();
  const ws = getPatternLinkWorkspace();
  if (!plc || !ws) return;

  const filter = ws.edgeRelationFilter || "ALL";

  plc.edges().forEach((edge) => {
    const relationTag = edge.data("relationTag") || edge.data("label") || "UNKNOWN";
    const visible = filter === "ALL" || relationTag === filter;

    edge.style("display", visible ? "element" : "none");
  });

  plc.nodes().forEach((node) => {
    const hasVisibleEdge = node.connectedEdges().some((edge) => edge.style("display") !== "none");
    node.style("display", hasVisibleEdge ? "element" : "none");
  });
}

function applyPatternLinkDimStyles(plc) {
  if (!plc) return;

  const ws = getPatternLinkWorkspace?.();
  const dimOpacity =
    typeof ws?.dimStrength === "number" ? ws.dimStrength : 0.08;
  const dimTextOpacity = Math.max(0.02, Math.min(1, dimOpacity * 0.5));
  const dimEdgeOpacity = Math.max(0.02, Math.min(1, dimOpacity * 0.75));

  // 기본 초기화
  plc.nodes().forEach((node) => {
    node.style("opacity", 1);
    node.style("text-opacity", 1);

    if (node.hasClass("pl-layer-a")) {
      node.style("background-color", "#4dabf7");
    } else if (node.hasClass("pl-layer-b")) {
      node.style("background-color", "#ff6b6b");
    } else {
      node.removeStyle("background-color");
    }
  });

  plc.edges().forEach((edge) => {
    const relationTag = edge.data("relationTag") || edge.data("label") || "";

    edge.style("label", relationTag);
    edge.style("font-size", 10);
    edge.style("text-background-color", "#111");
    edge.style("text-background-opacity", 0.7);
    edge.style("text-background-padding", 2);
    edge.style("color", "#fff");
    edge.style("opacity", 1);

    if (edge.hasClass("pl-layer-a")) {
      edge.style("line-color", "#4dabf7");
      edge.style("target-arrow-color", "#4dabf7");
      edge.style("width", 3);
    } else if (edge.hasClass("pl-layer-b")) {
      edge.style("line-color", "#ff6b6b");
      edge.style("target-arrow-color", "#ff6b6b");
      edge.style("width", 3);
    } else if (relationTag === "CAUSE") {
      edge.style("line-color", "#4dabf7");
      edge.style("target-arrow-color", "#4dabf7");
      edge.style("width", 3);
    } else if (relationTag === "FOLLOWUP") {
      edge.style("line-color", "#ff922b");
      edge.style("target-arrow-color", "#ff922b");
      edge.style("width", 3);
    } else if (relationTag === "UNKNOWN") {
      edge.style("line-color", "#868e96");
      edge.style("target-arrow-color", "#868e96");
      edge.style("width", 2);
    } else {
      edge.removeStyle("line-color");
      edge.removeStyle("target-arrow-color");
      edge.removeStyle("width");
    }
  });

  // dim 적용
  plc.nodes(".pl-dim-node").forEach((node) => {
    node.style("opacity", dimOpacity);
    node.style("text-opacity", dimTextOpacity);
  });

  plc.edges(".pl-dim-edge").forEach((edge) => {
    edge.style("opacity", dimEdgeOpacity);
    edge.style("line-color", "#444");
    edge.style("target-arrow-color", "#444");
    edge.style("width", 1);
  });
}

function createLayerFromPatternCustom(pattern) {
  if (!pattern?.nodes?.length) return null;

  const rotMin = Number(els.patternLayerRotMinInput?.value || "");
  const capMax = Number(els.patternLayerCapMaxInput?.value || "");
  const varMin = Number(els.patternLayerVarMinInput?.value || "");
  const nodeLimit = Number(els.patternLayerNodeLimitInput?.value || "");

  let nodeIds = [...new Set(pattern.nodes.filter(Boolean))];

  if (window.cy) {
    nodeIds = nodeIds.filter((id) => {
      const node = cy.getElementById(id);
      if (!node || node.length === 0) return false;

      const rot = Number(node.data("rot"));
      const cap = Number(node.data("cap"));
      const vari = Number(node.data("var"));

      if (!Number.isNaN(rotMin) && els.patternLayerRotMinInput?.value !== "" && !(rot >= rotMin)) return false;
      if (!Number.isNaN(capMax) && els.patternLayerCapMaxInput?.value !== "" && !(cap <= capMax)) return false;
      if (!Number.isNaN(varMin) && els.patternLayerVarMinInput?.value !== "" && !(vari >= varMin)) return false;

      return true;
    });
  }

  if (!Number.isNaN(nodeLimit) && els.patternLayerNodeLimitInput?.value !== "" && nodeLimit > 0) {
    nodeIds = nodeIds.slice(0, nodeLimit);
  }

  return createLayerFromPattern(
    {
      ...pattern,
      nodes: nodeIds
    },
    {
      name:
        els.patternLayerNameInput?.value?.trim() ||
        makePatternLayerName(`${pattern.id}-custom`),
      memo: "pattern custom 기반 자동 생성",
      description: `PATTERN ${pattern.id}의 커스텀 조건 Layer`,
      filter: {
        rotMin: els.patternLayerRotMinInput?.value === "" ? null : rotMin,
        capMax: els.patternLayerCapMaxInput?.value === "" ? null : capMax,
        varMin: els.patternLayerVarMinInput?.value === "" ? null : varMin
      }
    }
  );
}

function updatePatternMemory(memory, pattern, result) {
  const now = Date.now();

  // 이전 값
  const prevScore = memory.performance.lastScore ?? result.patternScore;
  const prevProb = memory.performance.lastProbability ?? result.probability;

  // 현재 값
  const currentScore = result.patternScore;
  const currentProb = result.probability;

  // discovery
  memory.discovery.lastSeen = now;
  memory.discovery.seenCount += 1;

  // performance 최신값
  memory.performance.lastScore = currentScore;
  memory.performance.lastProbability = currentProb;

  const n = memory.discovery.seenCount;

  memory.performance.averageScore =
    (memory.performance.averageScore * (n - 1) + currentScore) / n;

  memory.performance.averageProbability =
    (memory.performance.averageProbability * (n - 1) + currentProb) / n;

  // 🔥 Trend 계산
  const EPS = 0.002;

  const scoreDiff = currentScore - prevScore;
  const probDiff = currentProb - prevProb;

  let scoreTrend = "stable";
  if (scoreDiff > EPS) scoreTrend = "rising";
  else if (scoreDiff < -EPS) scoreTrend = "falling";

  let probabilityTrend = "stable";
  if (probDiff > EPS) probabilityTrend = "rising";
  else if (probDiff < -EPS) probabilityTrend = "falling";

  // 🔥 저장
  memory.trend.scoreTrend = scoreTrend;
  memory.trend.probabilityTrend = probabilityTrend;

  // 🔥 상태
  if (scoreTrend === "falling" || probabilityTrend === "falling") {
    memory.state.state = "fading";
  } else if (scoreTrend === "rising" || probabilityTrend === "rising") {
    memory.state.state = "growing";
  } else {
    memory.state.state = "stable";
  }
}

function sortGroupExplorerFullBuckets(buckets) {
  const state = ensureGroupExplorerFullState();
  const bucketSort = state.bucketSort || "count";

  const withSummary = buckets.map((bucket) => ({
    ...bucket,
    summary: getGroupBucketSummary(bucket)
  }));

  const byCount = (a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return String(a.label).localeCompare(String(b.label));
  };

  const byLabel = (a, b) => {
    return String(a.label).localeCompare(String(b.label));
  };

  withSummary.sort((a, b) => {
    if (bucketSort === "purity") {
      const primary = b.summary.avgPurity - a.summary.avgPurity;
      if (Math.abs(primary) > 0.0001) return primary;

      const contaminationTie = a.summary.avgContamination - b.summary.avgContamination;
      if (Math.abs(contaminationTie) > 0.0001) return contaminationTie;

      return byCount(a, b);
    }

    if (bucketSort === "contamination") {
      const primary = b.summary.avgContamination - a.summary.avgContamination;
      if (Math.abs(primary) > 0.0001) return primary;

      const purityTie = b.summary.avgPurity - a.summary.avgPurity;
      if (Math.abs(purityTie) > 0.0001) return purityTie;

      return byCount(a, b);
    }

    if (bucketSort === "importance") {
      const primary = b.summary.avgImportance - a.summary.avgImportance;
      if (Math.abs(primary) > 0.0001) return primary;

      const confidenceTie = b.summary.avgConfidence - a.summary.avgConfidence;
      if (Math.abs(confidenceTie) > 0.0001) return confidenceTie;

      return byCount(a, b);
    }

    if (bucketSort === "confidence") {
      const primary = b.summary.avgConfidence - a.summary.avgConfidence;
      if (Math.abs(primary) > 0.0001) return primary;

      const importanceTie = b.summary.avgImportance - a.summary.avgImportance;
      if (Math.abs(importanceTie) > 0.0001) return importanceTie;

      return byCount(a, b);
    }

    if (bucketSort === "label") {
      return byLabel(a, b);
    }

    return byCount(a, b);
  });

  return withSummary;
}

function readLayerFilterInputs() {
  uiState.currentLayerFilter = {
    rotMin: els.rotMinInput?.value ? Number(els.rotMinInput.value) : null,
    capMax: els.capMaxInput?.value ? Number(els.capMaxInput.value) : null,
    varMin: els.varMinInput?.value ? Number(els.varMinInput.value) : null
  };
}

function nextLogId() {
  uiState.logCounter = (uiState.logCounter || 0) + 1;
  return `LOG-${String(uiState.logCounter).padStart(6, "0")}`;
}

function inferLogScope(summary) {
  const text = String(summary || "").toUpperCase();

  if (text.includes("[EVENT]")) return "EVENT";
  if (text.includes("[TIMELINE]")) return "TIMELINE";
  if (text.includes("[GROUP]")) return "GROUP";
  if (text.includes("[LAYER]")) return "LAYER";
  if (text.includes("[MODE]")) return "MODE";
  if (text.includes("[GRAPH]")) return "GRAPH";
  if (text.includes("[PATTERN]")) return "PATTERN";
  if (text.includes("[COMMAND]")) return "SYSTEM";

  return "SYSTEM";
}

function inferLogType(summary) {
  const text = String(summary || "").toUpperCase();

  if (text.includes("생성")) return "CREATE";
  if (text.includes("수정")) return "UPDATE";
  if (text.includes("삭제")) return "DELETE";
  if (text.includes("열림")) return "OPEN";
  if (text.includes("닫힘")) return "CLOSE";
  if (text.includes("재생 시작")) return "PLAY";
  if (text.includes("정지")) return "STOP";
  if (text.includes("다음 이벤트")) return "STEP_FORWARD";
  if (text.includes("이전 이벤트")) return "STEP_BACKWARD";
  if (text.includes("처음으로")) return "RESET";
  if (text.includes("선택 해제")) return "CLEAR";
  if (text.includes("선택")) return "SELECT";
  if (text.includes("임시 저장")) return "SAVE";

  return "GENERIC";
}

function makeLogSignature(summary) {
  return String(summary || "").trim().toLowerCase();
}

function logEvent(message, meta = {}) {
  if (!uiState.logs) uiState.logs = [];

  let type = "general";

  if (message.includes("[TIMELINE]")) type = "timeline";
  else if (message.includes("[EVENT]")) type = "event";
  else if (message.includes("[GROUP]")) type = "group";
  else if (message.includes("[LAYER]")) type = "layer";
  else if (message.includes("[MODE]")) type = "mode";
  else if (message.includes("[GRAPH]")) type = "graph";
  else if (message.includes("[COMMAND]")) type = "command";

  const entry = {
    id: "LOG-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
    type,
    message,
    ts: Date.now(),
    ...meta
  };

  uiState.logs.push(entry);

  // 최대 길이 제한
  if (uiState.logs.length > 3000) {
    uiState.logs.shift();
  }

  renderLog?.();
}

function createLogEntry({
  type,
  level = "info",
  scope = "SYSTEM",
  refId = null,
  summary,
  payload = null,
  source = "ui"
}) {
  return {
    id: nextLogId(),
    ts: Date.now(),
    type,
    level,
    scope,
    refId,
    summary,
    payload,
    source,
    sent: false
  };
}

function appendLogEntry(entry) {
  if (!uiState.logs) uiState.logs = [];
  if (!uiState.unsentLogs) uiState.unsentLogs = [];

  uiState.logs.unshift(entry);
  uiState.unsentLogs.push(entry);

  if (uiState.logs.length > 300) {
    uiState.logs = uiState.logs.slice(0, 300);
  }
}

function recordLog({
  type,
  level = "info",
  scope = "SYSTEM",
  refId = null,
  summary,
  payload = null,
  source = "ui",
  dedupeMs = 1200
}) {
  if (!summary) return;

  const signature = makeLogSignature(type, summary, refId || "");
  const latest = (uiState.logs || [])[0];

  if (latest) {
    const latestSig = makeLogSignature(
      latest.type,
      latest.summary,
      latest.refId || ""
    );

    if (latestSig === signature && Date.now() - latest.ts < dedupeMs) {
      return;
    }
  }

  const entry = createLogEntry({
    type,
    level,
    scope,
    refId,
    summary,
    payload,
    source
  });

  appendLogEntry(entry);
  renderLog();
  saveLabState();
}

function makeTimelineExplorerDraggable() {
  const explorer = document.getElementById("timeline-explorer");
  const head = document.getElementById("timeline-explorer-head");

  if (!explorer || !head) return;
  if (explorer.dataset.dragBound === "true") return;

  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  explorer.addEventListener("mousedown", () => {
    bringExplorerToFront(explorer);
  });

  head.addEventListener("mousedown", (e) => {
    if (e.target.closest("button")) return;

    isDragging = true;

    const rect = explorer.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    explorer.style.right = "auto";
    explorer.style.left = `${rect.left}px`;
    explorer.style.top = `${rect.top}px`;

    document.body.style.userSelect = "none";
  });

  window.addEventListener("mousemove", (e) => {
    if (!isDragging) return;

    const explorerWidth = explorer.offsetWidth;
    const explorerHeight = explorer.offsetHeight;

    let nextLeft = e.clientX - offsetX;
    let nextTop = e.clientY - offsetY;

    const minLeft = 8;
    const minTop = 8;
    const maxLeft = window.innerWidth - explorerWidth - 8;
    const maxTop = window.innerHeight - explorerHeight - 8;

    nextLeft = Math.max(minLeft, Math.min(nextLeft, maxLeft));
    nextTop = Math.max(minTop, Math.min(nextTop, maxTop));

    explorer.style.left = `${nextLeft}px`;
    explorer.style.top = `${nextTop}px`;
  });

  window.addEventListener("mouseup", () => {
    isDragging = false;
    document.body.style.userSelect = "";
  });

  explorer.dataset.dragBound = "true";
}

function getTimelineEvents() {
  return (uiState.events || []).slice();
}

function applyWorkspaceAndSaveLayer() {
  const name = buildPatternLinkWorkspaceLayerName();
  savePatternLinkWorkspaceAsLayer(name);
  applyPatternLinkWorkspaceToMainGraph();
}

function applyTimelineEventByIndex(index) {
  const events = getTimelineEvents();
  if (!events.length) return;

  const evt = events[index];
  if (!evt) return;

  uiState.selectedEventId = evt.id;
  uiState.selectedEvent = evt;

  refreshGraphState();
  renderDetailPanel();
  renderSideMiniStatus();
  renderTimelineStatus();
}

function passesPatternLinkLayerFilter(node, filter = {}) {
  if (!node) return false;

  const rot = Number(node.data("rot") ?? node.data("ROT") ?? 0);
  const cap = Number(node.data("cap") ?? node.data("CAP") ?? Number.MAX_SAFE_INTEGER);
  const vari = Number(node.data("var") ?? node.data("VAR") ?? 0);

  if (filter.rotMin !== null && filter.rotMin !== undefined && filter.rotMin !== "") {
    if (!(rot >= Number(filter.rotMin))) return false;
  }

  if (filter.capMax !== null && filter.capMax !== undefined && filter.capMax !== "") {
    if (!(cap <= Number(filter.capMax))) return false;
  }

  if (filter.varMin !== null && filter.varMin !== undefined && filter.varMin !== "") {
    if (!(vari >= Number(filter.varMin))) return false;
  }

  return true;
}

function isNodeIncludedByWorkspaceGroups(nodeId, activeGroupIds = []) {
  if (!nodeId) return false;
  if (!Array.isArray(activeGroupIds) || activeGroupIds.length === 0) return true;

  for (const groupId of activeGroupIds) {
    const group = groupStore?.get(groupId);
    if (!group) continue;

    if (group.center === nodeId) return true;
    if (Array.isArray(group.nodes) && group.nodes.includes(nodeId)) return true;
  }

  return false;
}

function playTimeline() {
  const events = getTimelineEvents();
  if (!events.length) return;

  stopTimeline();
  uiState.timelinePlaying = true;

  logEvent("[TIMELINE] 재생 시작");

  const interval = Math.max(150, 1200 / (uiState.timelineSpeed || 1));

  applyTimelineEventByIndex(uiState.timelineIndex);
  renderTimelineStatus();

  uiState.timelineTimer = setInterval(() => {
    uiState.timelineIndex += 1;

    if (uiState.timelineIndex >= events.length) {
      uiState.timelineIndex = Math.max(0, events.length - 1);
      stopTimeline();
      applyTimelineEventByIndex(uiState.timelineIndex);
      return;
    }

    applyTimelineEventByIndex(uiState.timelineIndex);
  }, interval);
}

function snapshotPatternLinkSourceState() {
  uiState.patternLinkSnapshot = {
    page: uiState.page || "network",
    mode: uiState.mode || "-",
    currentLayerName: uiState.currentLayerName || null,

    selectedPatternId: uiState.selectedPatternId || null,
    selectedGroupId: uiState.selectedGroupId || null,
    selectedEventId: uiState.selectedEventId || null,

    activeGroupIds: Array.isArray(uiState.activeGroupIds)
      ? [...uiState.activeGroupIds]
      : [],

    hiddenNodeIds: new Set(
      uiState.patternExplorer?.hiddenNodeIds || []
    ),

    hiddenEdgeIds: new Set(
      uiState.patternExplorer?.hiddenEdgeIds || []
    ),

    tempEdgeIds: Array.isArray(uiState.patternExplorer?.tempEdgeIds)
      ? [...uiState.patternExplorer.tempEdgeIds]
      : []
  };
}

function findEntityAdjustmentTagEntry(entity, tagKey, options = {}) {
  const edit = ensureEntityEditState?.(entity);
  const tags = Array.isArray(edit?.adjustmentTags) ? edit.adjustmentTags : [];

  return tags.find((entry) => {
    if (entry.tag !== tagKey) return false;

    if (options.sourceType && entry.sourceType !== options.sourceType) {
      return false;
    }

    if (options.sourceRef && entry.sourceRef !== options.sourceRef) {
      return false;
    }

    return true;
  }) || null;
}

function restorePatternLinkSourceState() {
  const snap = uiState.patternLinkSnapshot;
  if (!snap) return;

  uiState.page = snap.page;
  uiState.mode = snap.mode;
  uiState.currentLayerName = snap.currentLayerName;

  uiState.selectedPatternId = snap.selectedPatternId;
  uiState.selectedGroupId = snap.selectedGroupId;
  uiState.selectedEventId = snap.selectedEventId;

  uiState.activeGroupIds = [...snap.activeGroupIds];

  if (!uiState.patternExplorer) {
    uiState.patternExplorer = {};
  }

  uiState.patternExplorer.hiddenNodeIds = new Set(snap.hiddenNodeIds);
  uiState.patternExplorer.hiddenEdgeIds = new Set(snap.hiddenEdgeIds);
  uiState.patternExplorer.tempEdgeIds = [...snap.tempEdgeIds];
}

function stopTimeline() {
  const wasPlaying = uiState.timelinePlaying;

  uiState.timelinePlaying = false;

  if (uiState.timelineTimer) {
    clearInterval(uiState.timelineTimer);
    uiState.timelineTimer = null;
  }

  if (wasPlaying) {
    logEvent("[TIMELINE] 정지");
  }

  renderTimelineStatus();
  saveLabState?.();
}

function stepTimelineForward() {
  const events = getTimelineEvents();
  if (!events.length) return;

  stopTimeline();

  if (uiState.timelineIndex < events.length - 1) {
    uiState.timelineIndex += 1;
  }

  applyTimelineEventByIndex(uiState.timelineIndex);

  const current = events[uiState.timelineIndex];
  logEvent(`[TIMELINE] 다음 이벤트: ${current?.name || current?.id || "-"}`);

  renderTimelineStatus();
  saveLabState?.();

}

function resetTimeline() {
  stopTimeline();

  uiState.timelineIndex = 0;
  uiState.selectedEventId = null;
uiState.selectedEvent = null;


  logEvent("[TIMELINE] 처음으로");

  refreshGraphState();
  renderDetailPanel();
  renderSideMiniStatus();
  renderTimelineStatus();
  saveLabState?.();

}

function increaseTimelineSpeed() {
  uiState.timelineSpeed = Math.min(4, (uiState.timelineSpeed || 1) + 0.5);
  renderTimelineStatus();

  if (uiState.timelinePlaying) {
    playTimeline();
  }
  saveLabState?.();

}

function openGroupExplorerFull() {
  if (!uiState.groupExplorerFull) {
    uiState.groupExplorerFull = {};
  }

  uiState.groupExplorerFull.open = true;
  uiState.groupExplorerFull.minimized = false;

  // Full Explorer 열기
  if (els.groupExplorerFull) {
    els.groupExplorerFull.classList.remove("hidden");
  }

  // Full Explorer 아이콘은 숨김
  if (els.groupExplorerFullMinimized) {
    els.groupExplorerFullMinimized.classList.add("hidden");
  }

  // Compact Group Explorer는 축소
  if (els.groupPanel) {
    els.groupPanel.classList.add("hidden");
  }

  // Compact Group Explorer 아이콘 표시
  if (els.groupExplorerCompactMinimized) {
    els.groupExplorerCompactMinimized.classList.remove("hidden");
  }

  renderGroupExplorerFullHome?.();
  saveLabState?.();
}

function openGroupExplorerForCurrentPage() {
  const page =
    document.body.dataset.page ||
    uiState.page ||
    "network";

  const nextTarget = page === "pattern-link"
    ? "patternLinkPage"
    : "main";

  const prevTarget = uiState.groupExplorerContext?.target || null;

  uiState.groupExplorerContext = {
    page,
    target: nextTarget
  };

  // context가 바뀌면 preview만 초기화
  // ON과 BASE는 유지
  if (prevTarget && prevTarget !== nextTarget) {
    if (nextTarget === "patternLinkPage") {
      uiState.previewGroupIds = [];
    } else {
      if (uiState.patternLinkPageState) {
        uiState.patternLinkPageState.previewGroupIds = [];
      }
    }
  }

  if (els.groupPanel) {
    els.groupPanel.classList.remove("hidden");
    els.groupPanel.dataset.groupContext = nextTarget;
  }

  renderGroupPanel?.();
  updateGroupExplorerStatus?.();
  decorateGroupExplorerCards?.();
  saveLabState?.();
}

function cleanupGroupExplorerRuntimeTags() {
  if (!els.groupPanelBody) return;

  els.groupPanelBody
    .querySelectorAll(".group-card-runtime-tags")
    .forEach((el) => el.remove());

  els.groupPanelBody
    .querySelectorAll(".group-card")
    .forEach((card) => {
      card.classList.remove(
        "is-active-group",
        "is-preview-group",
        "is-base-group"
      );
    });
}

function decreaseTimelineSpeed() {
  uiState.timelineSpeed = Math.max(0.5, (uiState.timelineSpeed || 1) - 0.5);
  renderTimelineStatus();

  if (uiState.timelinePlaying) {
    playTimeline();
  }
  saveLabState?.();

}

function buildTemporaryTimelineRelations() {
  if (!window.cy) return;

  const events = getTimelineEvents();
  if (events.length < 2) return;

  for (let i = 0; i < events.length - 1; i++) {
    const sourceId = events[i].id;
    const targetId = events[i + 1].id;
    const edgeId = `TEMP-${sourceId}-${targetId}`;

    const exists = cy.getElementById(edgeId);
    if (exists && exists.length > 0) continue;

    cy.add({
  group: "edges",
  data: {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: edge.type,
    strength: edge.strength,
    label: edge.label
  }
});
  }

  cy.edges().forEach((edge) => {
    if (edge.data("kind") === "temp-timeline") {
      edge.style({
        "line-color": "#ffd43b",
        "target-arrow-color": "#ffd43b",
        width: 3
      });
    }
  });

  logEvent("[TIMELINE] 임시 관계도 생성");

  applyPatternLinkDimStyles(window.patternLinkCy);
  saveLabState?.();

}

function enterEventEditor(eventId = null) {
  uiState.rightPanelView = "event-editor";
  uiState.editingEventId = eventId;

  if (eventId) {
  uiState.eventDraft = buildEventDraftFromSources(eventId);
} else {
    uiState.eventDraft = {
  id: generateEventId(),
  name: "",
  relationTags: [],
  stateTags: [],
  variables: {
    rot: null,
    cap: null,
    var: null
  },
  memo: "",
  stat: "Alive",
  sentiment: "neutral"
};
  }

  renderRightPanelView();
  renderEventEditorPanel();
}

function getAllEvents() {
  if (!uiState.events) uiState.events = [];
  return uiState.events;
}

function getEventById(id) {
  const events = getAllEvents();
  return events.find((e) => e.id === id);
}

function addEvent(evt) {
  return upsertEventEntry(evt);
}

function updateEvent(evt) {
  return upsertEventEntry(evt);
}

function applyAllEventsToGraph() {
  if (!window.cy) return;

  const events = getAllEvents();

  events.forEach((evt) => {
    if (!evt || !evt.id) return;

    const node = window.cy.getElementById(evt.id);
    if (!node || node.length === 0) return;

    node.data({
      label: evt.name || evt.id,
      relationTags: evt.relationTags || [],
      stateTags: evt.stateTags || [],
      rot: evt.variables?.rot ?? null,
      cap: evt.variables?.cap ?? null,
      var: evt.variables?.var ?? null,
      memo: evt.memo || "",
      stat: evt.stat ?? "Alive",
      sentiment: evt.sentiment ?? "neutral"
    });
  });
}

function computeLayerFilterMultiplier(node, filter = {}) {
  if (!node) {
    return {
      pass: true,
      multiplier: 1,
      rawMultiplier: 1,
      grade: "BASE",
      detail: { rotFactor: 1, capFactor: 1, varFactor: 1 }
    };
  }

  const rawRot = node.data("rot");
  const rawCap = node.data("cap");
  const rawVar = node.data("var");

  const rot = Number(rawRot);
  const cap = Number(rawCap);
  const vari = Number(rawVar);

  const rotMin = filter.rotMin;
  const capMax = filter.capMax;
  const varMin = filter.varMin;

  const hasRotFilter = rotMin !== null && rotMin !== undefined && rotMin !== "";
  const hasCapFilter = capMax !== null && capMax !== undefined && capMax !== "";
  const hasVarFilter = varMin !== null && varMin !== undefined && varMin !== "";

  const rotMissing = hasRotFilter && !Number.isFinite(rot);
  const capMissing = hasCapFilter && !Number.isFinite(cap);
  const varMissing = hasVarFilter && !Number.isFinite(vari);

  const rotPass = !hasRotFilter ? true : (!rotMissing && rot >= Number(rotMin));
  const capPass = !hasCapFilter ? true : (!capMissing && cap <= Number(capMax));
  const varPass = !hasVarFilter ? true : (!varMissing && vari >= Number(varMin));

  const pass = rotPass && capPass && varPass;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(value, max));
  }

  function passUpperFactor(value, base) {
    if (!Number.isFinite(value) || !Number.isFinite(base) || base <= 0) return 1;
    const ratio = value / base;
    if (ratio <= 1) return 1;
    return clamp(1 + (ratio - 1) * 0.8, 1, 2.4);
  }

  function passLowerFactor(value, base) {
    if (!Number.isFinite(value) || !Number.isFinite(base) || base <= 0) return 1;
    const ratio = value / base;
    if (ratio >= 1) return 1;
    return clamp(1 + (1 - ratio) * 0.65, 1, 2.0);
  }

  function failUpperFactor(value, base) {
    if (!Number.isFinite(value) || !Number.isFinite(base) || base <= 0) return 0;
    const ratio = value / base;
    return Math.max(0, ratio);
  }

  function failLowerFactor(value, base) {
    if (!Number.isFinite(value) || !Number.isFinite(base) || base <= 0) return 0;
    const ratio = value / base;
    if (ratio <= 0) return 0;
    return Math.max(0, 1 / ratio);
  }

  let rotFactor = 1;
  let capFactor = 1;
  let varFactor = 1;

  if (pass) {
    rotFactor = hasRotFilter ? passUpperFactor(rot, Number(rotMin)) : 1;
    capFactor = hasCapFilter ? passLowerFactor(cap, Number(capMax)) : 1;
    varFactor = hasVarFilter ? passUpperFactor(vari, Number(varMin)) : 1;
  } else {
    rotFactor = hasRotFilter ? failUpperFactor(rot, Number(rotMin)) : 1;
    capFactor = hasCapFilter ? failLowerFactor(cap, Number(capMax)) : 1;
    varFactor = hasVarFilter ? failUpperFactor(vari, Number(varMin)) : 1;
  }

  
  const rawMultiplier = Number((rotFactor * capFactor * varFactor).toFixed(3));

  let multiplier = Number((rotFactor * capFactor * varFactor).toFixed(3));  

  if (!pass) {
    if (multiplier >= 0.75) multiplier = 0.75;
    else if (multiplier >= 0.45) multiplier = 0.45;
    else if (multiplier > 0) multiplier = 0.18;
    else multiplier = 0;
  }

  const grade = resolveLayerFilterGrade(multiplier, pass);

  return {
    pass,
    multiplier,
    rawMultiplier,
    grade,
    detail: {
      rotFactor: Number(rotFactor.toFixed(3)),
      capFactor: Number(capFactor.toFixed(3)),
      varFactor: Number(varFactor.toFixed(3))
    }
  };
}

function resolveLayerFilterGrade(multiplier, pass = true) {
  if (!pass) {
    if (multiplier >= 0.75) return "NEAR";
    if (multiplier >= 0.45) return "WEAK";
    if (multiplier > 0) return "FAIL";
    return "DEAD";
  }

  if (multiplier < 1.10) return "BASE";
  if (multiplier < 1.30) return "BOOST";
  if (multiplier < 1.60) return "HIGH";
  if (multiplier < 2.00) return "CORE";
  return "PEAK";
}

function applyLayerVariableFilter() {
  if (!window.cy) return;

  const filter = uiState.currentLayerFilter || {};

  cy.nodes().forEach((node) => {
    const result = computeLayerFilterMultiplier(node, filter);

node.data("filterPass", result.pass);
node.data("filterMultiplier", result.multiplier);
node.data("filterRawMultiplier", result.rawMultiplier);
node.data("filterGrade", result.grade);

node.data("filterRotFactor", result.detail?.rotFactor ?? 1);
node.data("filterCapFactor", result.detail?.capFactor ?? 1);
node.data("filterVarFactor", result.detail?.varFactor ?? 1);

    if (!result.pass) {
      node.addClass("node-dimmed");
    } else {
      node.removeClass("node-dimmed");
    }
  });

  cy.edges().forEach((edge) => {
    const sourcePass = !!edge.source().data("filterPass");
    const targetPass = !!edge.target().data("filterPass");

    if (!sourcePass || !targetPass) {
      edge.addClass("edge-dimmed");
    } else {
      edge.removeClass("edge-dimmed");
    }
  });

  applyFilterGradeVisuals();
  applyFilterViewHighlight();
}

function findGroupById(id) {
  if (!id) return null;

  if (uiState.rankedResults) {
    return uiState.rankedResults.find(g => g.id === id);
  }

  return null;
}

function buildAllDataSearchText(item) {
  const payload = item?.payload || {};

  const parts = [
    item.scope || "",
    item.id || "",
    item.refId || "",
    item.title || "",
    item.sub || ""
  ];

  if (item.scope === "EVENT") {
    parts.push(
      payload.name || "",
      payload.id || "",
      payload.stat || "",
      payload.sentiment || "",
      ...(payload.relationTags || []),
      ...(payload.stateTags || []),
      payload.memo || "",
      String(payload.variables?.rot ?? ""),
      String(payload.variables?.cap ?? ""),
      String(payload.variables?.var ?? "")
    );
  }

  if (item.scope === "GROUP") {
    parts.push(
      payload.id || "",
      payload.center || "",
      payload.edgeType || "",
      ...(payload.nodes || [])
    );
  }

  if (item.scope === "PATTERN") {
    parts.push(
      payload.id || "",
      payload.type || "",
      ...(payload.nodes || []),
      String(payload.probability ?? "")
    );
  }

  if (item.scope === "LAYER") {
    parts.push(
      payload.name || "",
      payload.mode || "",
      payload.groupId || "",
      payload.memo || "",
      payload.description || "",
      ...(payload.nodes || []),
      String(payload.filter?.rotMin ?? ""),
      String(payload.filter?.capMax ?? ""),
      String(payload.filter?.varMin ?? "")
    );
  }

  return parts.join(" ").toLowerCase();
}

function buildLayerModePrefix(mode = "") {
  const normalized = String(mode || "explore").trim().toLowerCase();

  const map = {
    explore: "EXPRA",
    warning: "WARNQ",
    pattern: "PATRN",
    network: "NETWK",
    relation: "RELAX",
    layer: "LAYRX"
  };

  if (map[normalized]) return map[normalized];

  const base = normalized.replace(/[^a-z]/gi, "").toUpperCase();
  return (base + "XXXXX").slice(0, 5);
}

function nextLayerSequenceForPrefix(prefix) {
  const layers = Array.isArray(uiState.savedLayers) ? uiState.savedLayers : [];
  let maxSeq = 0;

  layers.forEach((layer) => {
    const name = String(layer?.name || "");
    const match = name.match(/^([A-Z]{5})-(\d{4})$/);
    if (!match) return;
    if (match[1] !== prefix) return;

    const seq = Number(match[2]);
    if (Number.isFinite(seq) && seq > maxSeq) {
      maxSeq = seq;
    }
  });

  return maxSeq + 1;
}

function buildGeneratedLayerName(mode = "") {
  const prefix = buildLayerModePrefix(mode);
  const seq = nextLayerSequenceForPrefix(prefix);
  return `${prefix}-${String(seq).padStart(4, "0")}`;
}

function buildAutoLayerName(input = {}) {
  const rawName = String(input.name || "").trim();
  const blockedNames = new Set(["", "전체", "all", "ALL"]);

  if (!blockedNames.has(rawName)) {
    return rawName;
  }

  return buildStructuredLayerName({
    mode: input.mode || uiState.mode || "explore",
    groupId: input.groupId ?? null,
    activeGroupIds: Array.isArray(input.activeGroupIds)
      ? [...input.activeGroupIds]
      : [...(uiState.activeGroupIds || [])],
    sourceMeta: input.sourceMeta || {},
    groupContext: input.groupContext || {},
    upperGroupCode: input.upperGroupCode || null,
    groupCode: input.groupCode || null
  });
}

function renderLayerPanel() {
const container = document.getElementById("layer-container");

  if (!container) return;

  if (els.layerCurrentValue) {
    els.layerCurrentValue.textContent = uiState.currentLayerName || "기본 그래프";
  }

  container.innerHTML = "";

const visibleLayers = (uiState.savedLayers || []).filter((layer) => {
  if (!layer) return false;

  layer.promoted = layer.promoted || false;
  return !layer.promoted && layer.approved === true;
});

  if (!visibleLayers.length) {
container.innerHTML = `
  <div class="empty-state">업로드된 레이어가 없습니다.</div>
`;
    updateLayerPatternActionUI();
    return;
  }

  const summary = document.createElement("div");
  summary.className = "layer-panel-summary";
  summary.textContent = `표시 레이어 ${visibleLayers.length}`;
  container.appendChild(summary);

  visibleLayers.forEach((layer) => {
    const item = document.createElement("div");
    item.className = `layer-item${uiState.currentLayerName === layer.name ? " active" : ""}`;

    if (uiState.isLayerDeleteMode) {
      item.classList.add("delete-selectable");
    }

    if ((uiState.selectedLayerNamesForDelete || []).includes(layer.name)) {
      item.classList.add("selected-for-delete");
    }

    const nameSpan = document.createElement("span");
    const isActive = uiState.currentLayerName === layer.name;
    nameSpan.textContent = isActive ? `${layer.name} [ACTIVE]` : layer.name;
    nameSpan.className = "layer-item-title layer-name-text";

    nameSpan.ondblclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      startLayerNameEdit(layer.name, nameSpan);
    };

    const subSpan = document.createElement("span");
    subSpan.className = "layer-item-sub";
    const nodeCount = Array.isArray(layer.nodes) ? layer.nodes.length : 0;
    subSpan.textContent =
      `mode: ${layer.mode || "-"} / nodes: ${nodeCount} / depth: ${layer.depth ?? 0}`;

    item.innerHTML = "";
    item.appendChild(nameSpan);
    item.appendChild(subSpan);

    item.onclick = (e) => {
      if (e.target.closest(".layer-name-input")) return;

      if (uiState.isLayerDeleteMode) {
        toggleLayerDeleteSelection(layer.name);
        return;
      }

      uiState.selectedLayerNames = [layer.name];

      const isSameLayer = uiState.currentLayerName === layer.name;

      if (isSameLayer) {
        uiState.currentLayerName = null;
        uiState.activeGroupIds = [];
        uiState.currentLayerFilter = {
          rotMin: null,
          capMax: null,
          varMin: null
        };

        if (els.rotMinInput) els.rotMinInput.value = "";
        if (els.capMaxInput) els.capMaxInput.value = "";
        if (els.varMinInput) els.varMinInput.value = "";

        logEvent(`[LAYER] 선택 해제`);
      } else {
        uiState.currentLayerName = layer.name;
        uiState.activeGroupIds = [...(layer.activeGroupIds || [])];
        uiState.currentLayerFilter = layer.filter
          ? { ...layer.filter }
          : {
              rotMin: null,
              capMax: null,
              varMin: null
            };

        if (els.rotMinInput) els.rotMinInput.value = uiState.currentLayerFilter.rotMin ?? "";
        if (els.capMaxInput) els.capMaxInput.value = uiState.currentLayerFilter.capMax ?? "";
        if (els.varMinInput) els.varMinInput.value = uiState.currentLayerFilter.varMin ?? "";

        logEvent(`[LAYER] 적용: ${layer.name}`);
      }

      clearLayerPreview();
      refreshGraphState();
      renderLayerPanel();
      renderLayerMetaFields();
      renderSideMiniStatus();
      saveLabState();
    };

    item.onmouseenter = () => {
      previewLayer(layer);
    };

    item.onmouseleave = () => {
      clearLayerPreview();
    };

    container.appendChild(item);
  });

  if (els.layerCurrentValue) {
    els.layerCurrentValue.textContent = uiState.currentLayerName || "기본 그래프";
  }

  updateLayerPatternActionUI();
}

function renderLayerExplorerCandidates() {
  if (!els.layerPanelBody) return;

  const layers = (uiState.savedLayers || []).filter((layer) => {
    if (!layer) return false;
    return true;
  });

  if (!layers.length) {
    els.layerPanelBody.innerHTML = `
      <div class="empty-state">업로드된 레이어가 없습니다.</div>
    `;
    return;
  }

  els.layerPanelBody.innerHTML = layers.map((layer) => {
    const nodeCount = Array.isArray(layer.nodes) ? layer.nodes.length : 0;
    const state = layer.approvalState || "stored";

const badge =
  state === "approved"
    ? `<span class="mini-on-badge">LOADED</span>`
    : state === "holding"
      ? `<span class="mini-on-badge">HOLD</span>`
      : `<span class="mini-on-badge">NEW</span>`;

    return `
      <div class="layer-item ${state === "approved" ? "active" : ""}" data-layer-name="${layer.name}">
        <div class="layer-item-title">
          ${layer.name} ${badge}
        </div>
        <div class="layer-item-sub">
          mode: ${layer.mode || "-"} / nodes: ${nodeCount}
        </div>
        <div class="layer-item-actions">
          <button class="btn-layer-load" data-layer-load="${layer.name}">
            ${state === "approved" ? "해제" : "승인"}
          </button>
          <button class="btn-layer-hold" data-layer-hold="${layer.name}">
            보류
          </button>
        </div>
      </div>
    `;
  }).join("");

  els.layerPanelBody.querySelectorAll("[data-layer-load]").forEach((btn) => {
    btn.onclick = () => {
      toggleLayerLoaded(btn.dataset.layerLoad);
    };
  });

  els.layerPanelBody.querySelectorAll("[data-layer-hold]").forEach((btn) => {
    btn.onclick = () => {
      holdLayer(btn.dataset.layerHold);
    };
  });
}

function renderLayerSystemState() {
  renderLayerPanel?.();
  renderLayerExplorerCandidates?.();
  renderLayerExplorerFullPage?.();
  updateLayerReferenceCount?.();
}

function updateLayerReferenceCount() {
  if (!els.layerSummaryCount) return;

  const count = Array.isArray(uiState.savedLayers)
    ? uiState.savedLayers.length
    : 0;

  els.layerSummaryCount.textContent = `참조 ${count}`;
}

function toggleLayerLoaded(layerName) {
  if (!layerName) return;

  uiState.savedLayers = (uiState.savedLayers || []).map((layer) => {
    if (layer.name !== layerName) return normalizeLayerEntry(layer);

    const isLoaded = layer.approvalState === "approved";

    return normalizeLayerEntry({
      ...layer,
      approvalState: isLoaded ? "stored" : "approved",
      approved: !isLoaded
    });
  });

  const updated = (uiState.savedLayers || []).find((layer) => layer.name === layerName);
  const isLoaded = updated?.approvalState === "approved";

  if (!isLoaded && uiState.currentLayerName === layerName) {
    uiState.currentLayerName = null;
  }

  recordLog?.({
    type: "LAYER_LOAD_TOGGLE",
    scope: "LAYER",
    refId: layerName,
    summary: isLoaded
      ? `[LAYER] load: ${layerName}`
      : `[LAYER] unload: ${layerName}`
  });

renderLayerSystemState?.();
  saveLabState?.();
}

function holdLayer(layerName) {
  if (!layerName) return;

  uiState.savedLayers = (uiState.savedLayers || []).map((layer) => {
    if (layer.name !== layerName) return normalizeLayerEntry(layer);

    return normalizeLayerEntry({
      ...layer,
      approvalState: "holding",
      approved: false
    });
  });

  if (uiState.currentLayerName === layerName) {
    uiState.currentLayerName = null;
  }

  recordLog?.({
    type: "LAYER_HOLD",
    scope: "LAYER",
    refId: layerName,
    summary: `[LAYER] hold: ${layerName}`
  });

renderLayerSystemState?.();
  saveLabState?.();
}

function rejectLayerCandidate(layerName) {
  if (!layerName) return;

  uiState.savedLayers = (uiState.savedLayers || []).map((layer) => {
    if (layer.name !== layerName) return normalizeLayerEntry(layer);

    return normalizeLayerEntry({
      ...layer,
      approved: false,
      approvalState: "candidate",
      hubMeta: {
        ...(layer.hubMeta || {}),
        approvedByExplorer: false
      }
    });
  });

  uiState.approvedLayerNames = (uiState.approvedLayerNames || []).filter(
    (name) => name !== layerName
  );

  recordLog({
    type: "LAYER_REJECT",
    scope: "LAYER",
    refId: layerName,
    summary: `[LAYER] 보류: ${layerName}`
  });

  renderLayerExplorerCandidates?.();
  renderLayerPanel?.();
  saveLabState?.();
}

function getCurrentLayer() {
  return getCurrentLayerObject();
}

function openLayerPatternExplorer() {
  if (!els.layerPatternExplorer) return;

  const layer = getCurrentLayerObject();
  if (!layer) return;

  uiState.layerToPatternExplorerMode = "menu";

  if (els.layerPatternIdInput) els.layerPatternIdInput.value = "";
  if (els.layerPatternTypeInput) els.layerPatternTypeInput.value = "CUSTOM";
  if (els.layerPatternNameInput) els.layerPatternNameInput.value = layer.name || "";
  if (els.layerPatternProbInput) els.layerPatternProbInput.value = "0.50";
  if (els.layerPatternScoreInput) els.layerPatternScoreInput.value = "0.50";
  if (els.layerPatternMemoInput) els.layerPatternMemoInput.value = layer.memo || "";

  renderLayerPatternExplorerView();
  els.layerPatternExplorer.classList.remove("hidden");
}

function loadKeywordLearning(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (err) {
    console.warn("keyword learning load failed", err);
    return {};
  }
}

function saveKeywordLearning(storageKey, data) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(data || {}));
  } catch (err) {
    console.warn("keyword learning save failed", err);
  }
}

function recordKeywordLearning(storageKey, keyword) {
  const rawText = String(keyword || "").trim();
  if (!rawText) return;

  const key = normalizeKeywordKey(rawText);

  const data = loadKeywordLearning(storageKey);
  const prev = data[key] || {
    count: 0,
    lastUsedAt: 0,
    label: rawText
  };

  data[key] = {
    count: Number(prev.count || 0) + 1,
    lastUsedAt: Date.now(),
    label: prev.label || rawText
  };

  saveKeywordLearning(storageKey, data);
}

function getGroupRelatedKeywordStats(items) {
  const counts = new Map();
  const total = Math.max(1, items.length);
  const learned = loadKeywordLearning(GROUP_KEYWORD_LEARNING_KEY);

  const add = (key, type = "tag") => {
    const text = String(key || "").trim();
    if (!text) return;

    const prev = counts.get(text) || {
      keyword: text,
      count: 0,
      types: new Set()
    };

    prev.count += 1;
    prev.types.add(type);
    counts.set(text, prev);
  };

  items.forEach((item) => {
    const meta = item.meta || {};
    const group = item.group || {};

    add(meta.relationTag, "relation");
    add(meta.centerNodeId, "center");

    (meta.signatureTags || []).forEach((tag) => add(tag, "signature"));
    (meta.purityTags || []).forEach((tag) => add(tag, "purity"));
    (meta.contaminationTags || []).forEach((tag) => add(tag, "contamination"));

    (group.context?.sourcePatternIds || []).forEach((id) => add(id, "pattern"));
    (group.context?.sourceLayerNames || []).forEach((name) => add(name, "layer"));
    (group.context?.sourceEventIds || []).forEach((id) => add(id, "event"));
  });

  return [...counts.values()]
    .map((entry) => {
      const learnedKey = normalizeKeywordKey(entry.keyword);
const learnedCount = Number(learned[learnedKey]?.count || 0);

      const dataPercent = Math.round((entry.count / total) * 100);

      // 학습 보정은 최대 +25점까지만. 과적합 방지.
      const learningBoost = Math.min(25, Math.round(Math.log1p(learnedCount) * 8));

      return {
        keyword: entry.keyword,
        count: entry.count,
        percent: dataPercent,
        learnedCount,
        score: dataPercent + learningBoost,
        types: [...entry.types]
      };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.count !== a.count) return b.count - a.count;
      return String(a.keyword).localeCompare(String(b.keyword));
    })
    .slice(0, 18);
}

function renderGroupRelatedKeywords(items) {
  if (!els.groupFullRelatedKeywords) return;

  const stats = getGroupRelatedKeywordStats(items);

  if (!stats.length) {
    els.groupFullRelatedKeywords.innerHTML = "";
    return;
  }

  els.groupFullRelatedKeywords.classList.remove("hidden");

  els.groupFullRelatedKeywords.innerHTML = stats.map((s) => {
    const typeText = s.types.slice(0, 2).join("/");
    const learnedText = s.learnedCount ? ` · used ${s.learnedCount}` : "";
    const title = `${s.keyword} · ${s.count} groups · ${s.percent}%${learnedText} · ${s.types.join(", ")}`;

    return `
      <button
        type="button"
        class="group-related-keyword-chip"
        data-group-keyword="${s.keyword}"
        title="${title}"
      >
        <span class="keyword-text">${s.keyword}</span>
        <span class="keyword-count">${s.count}g</span>
        <span class="keyword-percent">${s.percent}%</span>
        ${
          s.learnedCount
            ? `<span class="keyword-learned">L${s.learnedCount}</span>`
            : ""
        }
        ${typeText ? `<span class="keyword-count">${typeText}</span>` : ""}
      </button>
    `;
  }).join("");

  els.groupFullRelatedKeywords
    .querySelectorAll("[data-group-keyword]")
    .forEach((btn) => {
      btn.onclick = () => {
        const keyword = btn.dataset.groupKeyword || "";

        recordKeywordLearning(GROUP_KEYWORD_LEARNING_KEY, keyword);
        //recordKeywordLearning(GLOBAL_KEYWORD_LEARNING_KEY, keyword);

        const state = ensureGroupExplorerFullState();
        state.query = keyword;

        if (els.groupFullSearchInput) {
          els.groupFullSearchInput.value = keyword;
        }

        renderGroupExplorerFullSubview();
        saveLabState?.();
      };
    });
}

function bindGroupRelatedKeywordClose() {
  if (document.body.dataset.groupRelatedCloseBound === "true") return;

  document.addEventListener("click", (e) => {
    const relatedBox = els.groupFullRelatedKeywords;
    if (!relatedBox || relatedBox.classList.contains("hidden")) return;

    const clickedChip = e.target.closest(".group-related-keyword-chip");
    const clickedRelatedBox = e.target.closest("#group-full-related-keywords");
    const clickedSearchInput = e.target.closest("#group-full-search-input");

    const clickedToolbarControl =
      e.target.closest("#group-full-axis-select") ||
      e.target.closest("#group-full-filter-select") ||
      e.target.closest("#group-full-sort-select");

    // chip 버튼 클릭은 검색어 적용 동작이 있어야 하므로 닫지 않음
    if (clickedChip) return;

    // 검색 input / select 조작은 닫지 않음
    if (clickedSearchInput || clickedToolbarControl) return;

    // related keyword 영역 내부의 빈공간 클릭이면 닫기
    if (clickedRelatedBox) {
      closeGroupRelatedKeywords?.();
      return;
    }

    // 그 외 바깥 빈공간 클릭도 닫기
    closeGroupRelatedKeywords?.();
  });

  document.body.dataset.groupRelatedCloseBound = "true";
}

function renderLayerPatternExplorerView() {
  const mode = uiState.layerToPatternExplorerMode || "menu";

  if (els.layerPatternMenuView) {
    els.layerPatternMenuView.classList.toggle("hidden", mode !== "menu");
  }

  if (els.layerPatternCustomView) {
    els.layerPatternCustomView.classList.toggle("hidden", mode !== "custom");
  }

  renderLayerPatternPreview(mode === "custom" ? "custom" : "all");
}

function renderLayerMetaFields() {
  const currentLayer = (uiState.savedLayers || []).find(
    (l) => l.name === uiState.currentLayerName
  );

  if (!currentLayer) {
    if (els.layerMemoInput) els.layerMemoInput.value = "";
    if (els.layerDescriptionInput) els.layerDescriptionInput.value = "";
    return;
  }

  if (els.layerMemoInput) {
    els.layerMemoInput.value = currentLayer.memo || "";
  }

  if (els.layerDescriptionInput) {
    els.layerDescriptionInput.value = currentLayer.description || "";
  }

  updateLayerPatternActionUI();
}

function saveLayerFromNodes(nodeIds, name, extra = {}) {
  const ids = [...new Set((nodeIds || []).filter(Boolean))];
  if (!ids.length) return null;

  const mode = extra.mode || uiState.mode || "-";
  const filter = {
    rotMin: extra.filter?.rotMin ?? null,
    capMax: extra.filter?.capMax ?? null,
    varMin: extra.filter?.varMin ?? null
  };

  const sourceMeta = normalizeLayerSourceMeta(extra.sourceMeta || {});

  if (isDuplicateLayerRegistration(ids, mode, filter, sourceMeta)) {
    logEvent("[LAYER] 중복 등록 방지");
    recordLog?.({
      type: "LAYER_DUPLICATE_SKIP",
      scope: "LAYER",
      summary: `[LAYER] 중복 등록 방지`,
      payload: {
        mode,
        nodeCount: ids.length,
        filter,
        sourceMeta
      }
    });
    return null;
  }

  const finalName =
    String(name || "").trim() ||
    buildAutoLayerName({
      mode,
      activeGroupIds: Array.isArray(extra.activeGroupIds)
        ? [...extra.activeGroupIds]
        : [...(uiState.activeGroupIds || [])]
    });

  return createLayerEntry({
    name: finalName,
    mode,
    groupId: extra.groupId || null,
    nodes: ids,
    activeGroupIds: Array.isArray(extra.activeGroupIds)
      ? [...extra.activeGroupIds]
      : [...(uiState.activeGroupIds || [])],
    filter,
    memo: extra.memo || "",
    description: extra.description || "",
    sourceMeta
  });
}

function saveCurrentLayerMeta() {
  if (!uiState.currentLayerName) return;

  uiState.savedLayers = (uiState.savedLayers || []).map((layer) => {
    if (layer.name === uiState.currentLayerName) {
      return {
        ...layer,
        memo: els.layerMemoInput ? els.layerMemoInput.value : "",
        description: els.layerDescriptionInput ? els.layerDescriptionInput.value : ""
      };
    }
    return layer;
  });

  saveLabState();
  renderLayerPanel();
}

function promotePatternsToSingleGroup() {
  const ids =
    Array.isArray(uiState.selectedPatternIds) && uiState.selectedPatternIds.length
      ? [...uiState.selectedPatternIds]
      : (
          uiState.patternApplied &&
          Array.isArray(uiState.appliedPatternIds) &&
          uiState.appliedPatternIds.length
        )
          ? [...uiState.appliedPatternIds]
          : (uiState.selectedPatternId ? [uiState.selectedPatternId] : []);

  if (!ids.length) {
    recordLog({
      type: "COMMAND",
      scope: "SYSTEM",
      summary: "[COMMAND] 패턴 승격 실패: 선택된 pattern 없음"
    });
    return null;
  }

  const patterns = ids
    .map((id) => uiState.patternMap?.get(id))
    .map((p) => p?.pattern || p)
    .filter(Boolean);

  if (!patterns.length) {
    recordLog({
      type: "COMMAND",
      scope: "SYSTEM",
      summary: "[COMMAND] 패턴 승격 실패: pattern 데이터를 찾지 못함"
    });
    return null;
  }

  const allNodes = [...new Set(patterns.flatMap((p) => p.nodes || []))];

  const group = {
    id: `GROUP-MERGED-${Date.now()}`,
    name: `Merged (${patterns.length})`,
    center: allNodes[0] || null,
    nodes: allNodes,
    edgeType: "PATTERN_MERGED",
    sourcePatternIds: ids,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  groupRegistry.registerGroup(group);
  groupStore.set(group.id, group);

  patterns.forEach((p) => {
    p.promoted = true;
  });

  uiState.selectedGroup = group;
  uiState.selectedGroupId = group.id;

  renderPatterns(uiState.rawRankedResults || []);
  renderGroupPanel?.();
  renderSideMiniStatus?.();
  renderFocusHeader?.();
  saveLabState?.();

  if (els.groupPanel) {
    els.groupPanel.classList.remove("hidden");
  }

  recordLog({
    type: "GROUP_CREATE",
    scope: "GROUP",
    refId: group.id,
    summary: `[GROUP] 승격 생성: ${group.name}`,
    payload: {
      sourcePatternIds: ids,
      nodeCount: allNodes.length
    }
  });

    if (els.groupPanel) {
  els.groupPanel.classList.remove("hidden");
}
renderGroupPanel?.();
renderFocusHeader?.();
renderSideMiniStatus?.();
saveLabState?.();

  return group;
  
}

function minimizeGroupExplorerFull() {
  if (!uiState.groupExplorerFull) {
    uiState.groupExplorerFull = {};
  }

  uiState.groupExplorerFull.open = true;
  uiState.groupExplorerFull.minimized = true;

  if (els.groupExplorerFull) {
    els.groupExplorerFull.classList.add("hidden");
  }

  if (els.groupExplorerFullMinimized) {
    els.groupExplorerFullMinimized.classList.remove("hidden");
  }

  saveLabState?.();
}

function restoreGroupExplorerCompact() {
  if (els.groupPanel) {
    els.groupPanel.classList.remove("hidden");
  }

  if (els.groupExplorerCompactMinimized) {
    els.groupExplorerCompactMinimized.classList.add("hidden");
  }

  renderGroupPanel?.();
  updateGroupExplorerStatus?.();
  saveLabState?.();
}

function makeFloatingIconDraggable(icon, storageKey) {
  if (!icon) return;
  if (icon.dataset.dragBound === "true") return;

  let isDragging = false;
  let moved = false;
  let offsetX = 0;
  let offsetY = 0;
  let startX = 0;
  let startY = 0;

  // 저장된 위치 복원
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
    if (saved && Number.isFinite(saved.left) && Number.isFinite(saved.top)) {
      icon.style.left = `${saved.left}px`;
      icon.style.top = `${saved.top}px`;
      icon.style.right = "auto";
      icon.style.bottom = "auto";
    }
  } catch (err) {
    console.warn("icon position restore failed", storageKey, err);
  }

  icon.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;

    isDragging = true;
    moved = false;

    const rect = icon.getBoundingClientRect();

    startX = e.clientX;
    startY = e.clientY;
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    icon.style.left = `${rect.left}px`;
    icon.style.top = `${rect.top}px`;
    icon.style.right = "auto";
    icon.style.bottom = "auto";

    document.body.style.userSelect = "none";
  });

  window.addEventListener("mousemove", (e) => {
    if (!isDragging) return;

    const dx = Math.abs(e.clientX - startX);
    const dy = Math.abs(e.clientY - startY);

    if (dx > 3 || dy > 3) {
      moved = true;
    }

    const iconWidth = icon.offsetWidth;
    const iconHeight = icon.offsetHeight;

    let nextLeft = e.clientX - offsetX;
    let nextTop = e.clientY - offsetY;

    nextLeft = Math.max(8, Math.min(nextLeft, window.innerWidth - iconWidth - 8));
    nextTop = Math.max(8, Math.min(nextTop, window.innerHeight - iconHeight - 8));

    icon.style.left = `${nextLeft}px`;
    icon.style.top = `${nextTop}px`;
  });

  window.addEventListener("mouseup", () => {
    if (!isDragging) return;

    isDragging = false;
    document.body.style.userSelect = "";

    const rect = icon.getBoundingClientRect();

    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          left: rect.left,
          top: rect.top
        })
      );
    } catch (err) {
      console.warn("icon position save failed", storageKey, err);
    }

    // 드래그 직후 click 복원 방지용
    icon.dataset.wasDragged = moved ? "true" : "false";
    setTimeout(() => {
      icon.dataset.wasDragged = "false";
    }, 0);
  });

  icon.dataset.dragBound = "true";
}

function restoreGroupExplorerFull() {
  if (!uiState.groupExplorerFull) {
    uiState.groupExplorerFull = {};
  }

  uiState.groupExplorerFull.open = true;
  uiState.groupExplorerFull.minimized = false;

  if (els.groupExplorerFull) {
    els.groupExplorerFull.classList.remove("hidden");
  }

  if (els.groupExplorerFullMinimized) {
    els.groupExplorerFullMinimized.classList.add("hidden");
  }

  renderGroupExplorerFullHome?.();
  saveLabState?.();
}

function closeGroupExplorerFull() {
  if (!uiState.groupExplorerFull) {
    uiState.groupExplorerFull = {};
  }

  uiState.groupExplorerFull.open = false;
  uiState.groupExplorerFull.minimized = false;

  if (els.groupExplorerFull) {
    els.groupExplorerFull.classList.add("hidden");
  }

  if (els.groupExplorerFullMinimized) {
    els.groupExplorerFullMinimized.classList.add("hidden");
  }

  // Compact 아이콘은 유지
  if (els.groupExplorerCompactMinimized) {
    els.groupExplorerCompactMinimized.classList.remove("hidden");
  }

  saveLabState?.();
}

function closeGroupRelatedKeywords() {
  if (!els.groupFullRelatedKeywords) return;

  els.groupFullRelatedKeywords.classList.add("hidden");
}

function promoteLayersToSinglePattern() {
  const selected =
    Array.isArray(uiState.selectedLayerNames) && uiState.selectedLayerNames.length
      ? [...uiState.selectedLayerNames]
      : (uiState.currentLayerName ? [uiState.currentLayerName] : []);

  if (!selected.length) return null;

  const layers = uiState.savedLayers.filter((l) => selected.includes(l.name));
  if (!layers.length) return null;

  const allNodes = [...new Set(layers.flatMap((l) => l.nodes || []))];

  const newPattern = {
    id: `PATTERN-MERGED-${Date.now()}`,
    name: `Layer Merge (${layers.length})`,
    type: "MERGED",
    nodes: allNodes,
    promoted: false
  };

  const promotedResult = {
    pattern: newPattern,
    probability: 0.5,
    patternScore: 0.5
  };

  uiState.patternMap.set(newPattern.id, promotedResult);

  uiState.promotedPatterns = Array.isArray(uiState.promotedPatterns)
    ? [...uiState.promotedPatterns, promotedResult]
    : [promotedResult];

  layers.forEach((l) => {
    l.promoted = true;
  });

  uiState.selectedPatternId = newPattern.id;
  uiState.selectedPatternIds = [newPattern.id];
  uiState.selectedPattern = promotedResult;

  uiState.rawRankedResults = [...(uiState.rawRankedResults || []), promotedResult];
  uiState.rankedResults = [...(uiState.rankedResults || []), promotedResult];

  uiState.page = "pattern";
  document.body.dataset.page = "pattern";

  if (els.patternMiniExplorer) {
    els.patternMiniExplorer.classList.add("hidden");
  }
  document.body.classList.remove("pattern-explorer-mode");

  renderLayerPanel?.();
  renderPatterns(uiState.rawRankedResults || []);
  renderFocusHeader?.();
  renderSideMiniStatus?.();
  updatePatternActionUI?.();
  saveLabState?.();

  return newPattern;

}

function ensureGroupExplorerFullState() {
  if (!uiState.groupExplorerFull) uiState.groupExplorerFull = {};

  if (!uiState.groupExplorerFull.view) uiState.groupExplorerFull.view = "home";
  if (!uiState.groupExplorerFull.query) uiState.groupExplorerFull.query = "";
  if (!uiState.groupExplorerFull.filter) uiState.groupExplorerFull.filter = "ALL";
  if (!uiState.groupExplorerFull.sort) uiState.groupExplorerFull.sort = "name";
  if (!uiState.groupExplorerFull.axis) uiState.groupExplorerFull.axis = "overall";
  if (!uiState.groupExplorerFull.bucketSort) {
  uiState.groupExplorerFull.bucketSort = "count";
}

  return uiState.groupExplorerFull;
}

function renderGroupExplorerFullHome() {
  ensureGroupExplorerFullState();

  updateGroupExplorerFullSummary?.();

  if (els.groupExplorerFullHome) {
    els.groupExplorerFullHome.classList.remove("hidden");
  }

  if (els.groupExplorerFullView) {
    els.groupExplorerFullView.classList.add("hidden");
  }

  uiState.groupExplorerFull.view = "home";
}

function ensureGraphPageVisible() {
  uiState.page = "network";
  document.body.dataset.page = "network";

  document.body.classList.remove("pattern-explorer-mode");

  if (els.patternMiniExplorer) {
    els.patternMiniExplorer.classList.add("hidden");
  }

  updatePatternActionUI?.();
}

function previewLayer(layer) {
  if (!layer) return;

  uiState.previewLayerGroupIds = Array.isArray(layer.activeGroupIds)
    ? [...layer.activeGroupIds]
    : [];

  uiState.previewLayerNodeIds = Array.isArray(layer.nodes)
    ? [...layer.nodes]
    : [];

  uiState.isLayerPreviewActive = true;

  refreshGraphState();
}

function applyFilterViewHighlight() {
  if (!window.cy) return;

  const view = uiState.filterView;
  if (!view || view.mode === "off") return;

  cy.nodes().forEach((node) => {
    const grade = node.data("filterGrade");
    const multiplier = Number(node.data("filterMultiplier") || 0);

    let match = false;

    if (view.mode === "grade") {
      match = grade === view.grade;
    } else if (view.mode === "threshold") {
      match = multiplier >= view.threshold;
    }

    if (!match) {
      node.style("opacity", 0.08);
    } else {
      node.style("opacity", 1);
      node.style("border-width", 4);
    }
  });

  cy.edges().forEach((edge) => {
    const s = edge.source();
    const t = edge.target();

    const sVisible = s.style("opacity") !== "0.08";
    const tVisible = t.style("opacity") !== "0.08";

    edge.style("opacity", sVisible && tVisible ? 1 : 0.05);
  });
}

function clearLayerPreview() {
  uiState.previewLayerGroupIds = [];
  uiState.previewLayerNodeIds = [];
  uiState.isLayerPreviewActive = false;

  refreshGraphState();
}

function deleteSelectedLayers() {
  const selected = new Set(uiState.selectedLayerNamesForDelete || []);

  logEvent(`[LAYER] 삭제: ${[...selected].join(", ")}`);

  if (!selected.size) return;

  uiState.savedLayers = (uiState.savedLayers || []).filter(
    (layer) => !selected.has(layer.name)
  );

  if (uiState.currentLayerName && selected.has(uiState.currentLayerName)) {
    uiState.currentLayerName = null;
    uiState.currentLayerFilter = {
      rotMin: null,
      capMax: null,
      varMin: null
    };

    if (els.rotMinInput) els.rotMinInput.value = "";
    if (els.capMaxInput) els.capMaxInput.value = "";
    if (els.varMinInput) els.varMinInput.value = "";
  }

refreshGraphState?.();
renderLayerSystemState?.();
renderLayerMetaFields?.();
renderSideMiniStatus?.();
saveLabState?.();
exitLayerDeleteMode?.();

}

function toggleEventDeleteSelection(eventId) {
  const list = uiState.selectedEventIdsForDelete || [];
  const exists = list.includes(eventId);

  uiState.selectedEventIdsForDelete = exists
    ? list.filter((id) => id !== eventId)
    : [...list, eventId];

  openEventDeleteModal();
}

function openPatternExplorer() {
  uiState.patternExplorer.active = true;

  const box = document.getElementById("pattern-explorer");
  if (box) box.classList.remove("hidden");
}

function closePatternExplorer() {
  uiState.patternExplorer.active = false;
  uiState.patternExplorer.hideMode = null;
  uiState.patternExplorer.tempEdgeMode = false;
  uiState.patternExplorer.tempEdgeChain = [];

  const box = document.getElementById("pattern-explorer");
  if (box) box.classList.add("hidden");
}

function applyPatternExplorerVisibility() {
  if (!window.cy) return;

  const exp = uiState.patternExplorer;
  if (!exp) return;

  cy.nodes().forEach((node) => {
    if (exp.hiddenNodeIds.has(node.id())) {
      node.style("display", "none");
    } else {
      node.style("display", "element");
    }
  });

  cy.edges().forEach((edge) => {
    if (exp.hiddenEdgeIds.has(edge.id())) {
      edge.style("display", "none");
    } else {
      edge.style("display", "element");
    }
  });
}

function exitEventDeleteMode() {
  uiState.isEventDeleteMode = false;
  uiState.selectedEventIdsForDelete = [];

  if (els.eventDeleteBar) {
    els.eventDeleteBar.classList.add("hidden");
  }

  if (els.eventDeleteModal) {
    els.eventDeleteModal.classList.add("hidden");
  }

  renderAllDataExplorer();
}

function openEventDeleteModal() {
  const events = uiState.events || [];
  const selectedIds = uiState.selectedEventIdsForDelete || [];

  const modal = document.getElementById("event-delete-modal");
  const list = document.getElementById("event-delete-modal-list");

  if (!modal || !list) return;

  list.innerHTML = events
    .map((evt) => {
      const isSelected = selectedIds.includes(evt.id);

      return `
        <div class="event-delete-item ${isSelected ? "selected-for-delete" : ""}"
             data-event-id="${evt.id}">
          <div class="event-delete-item-title">${evt.name || evt.id}</div>
          <div class="event-delete-item-sub">${evt.id}</div>
        </div>
      `;
    })
    .join("");

  const items = list.querySelectorAll(".event-delete-item");
  items.forEach((item) => {
    item.onclick = () => {
      const id = item.dataset.eventId;
      toggleEventDeleteSelection(id);
    };
  });

  modal.classList.remove("hidden");
}

function deleteSelectedEvents() {
  const selected = new Set(uiState.selectedEventIdsForDelete || []);
  if (!selected.size) return;

  uiState.events = (uiState.events || []).filter(
    (evt) => !selected.has(evt.id)
  );

  if (window.cy) {
    selected.forEach((id) => {
      const node = cy.getElementById(id);
      if (node && node.length > 0) {
        const connectedEdges = node.connectedEdges();
        cy.remove(connectedEdges);
        cy.remove(node);
      }
    });
  }

  if (uiState.selectedEventId && selected.has(uiState.selectedEventId)) {
    uiState.selectedEventId = null;
uiState.selectedEvent = null;

  }

  recordLog({
    type: "EVENT_DELETE",
    scope: "EVENT",
    refId: null,
    summary: `[EVENT] 삭제: ${[...selected].join(", ")}`,
    payload: { ids: [...selected] }
  });

  renderAllDataExplorer();
  renderAllDataDetail(null);
  refreshGraphState();
  renderDetailPanel();
  renderSideMiniStatus();
  saveLabState();
  exitEventDeleteMode();
}

function updateLayerPatternActionUI() {
  if (!els.openLayerPatternExplorerBtn) return;
  els.openLayerPatternExplorerBtn.disabled = !uiState.currentLayerName;
}

function renderSideMiniStatus() {
  if (els.leftMiniGroup) {
    const groupText = uiState.selectedGroup
      ? (uiState.selectedGroup.edgeType || uiState.selectedGroup.id || "-")
      : "-";
    els.leftMiniGroup.textContent = groupText;
  }

  if (els.leftMiniMode) {
    els.leftMiniMode.textContent = uiState.mode || "-";
  }

if (els.groupSummaryCount) {
  const count = groupStore instanceof Map ? groupStore.size : 0;
  els.groupSummaryCount.textContent = `참조 ${count}`;
}

if (els.layerSummaryCount) {
  const count = Array.isArray(uiState.savedLayers)
    ? uiState.savedLayers.filter((layer) => !layer?.promoted).length
    : 0;

  els.layerSummaryCount.textContent = `참조 ${count}`;
}

}

function makePatternKey(pattern) {
  if (!pattern || !pattern.nodes || pattern.nodes.length === 0) return null;

  const type = pattern.type || "UNKNOWN";

  // 순서 유지 (중요)
  const nodesKey = pattern.nodes.join("->");

  return `${type}|${nodesKey}`;
}

function createPatternMemory(key, pattern, result) {
  const now = Date.now();

  return {
    key,
    discovery: {
      firstSeen: now,
      lastSeen: now,
      seenCount: 1
    },
    performance: {
      lastScore: result.patternScore,
      lastProbability: result.probability,
      averageScore: result.patternScore,
      averageProbability: result.probability
    },
    trend: {
      scoreTrend: "stable",
      probabilityTrend: "stable"
    },
    state: {
      state: "new"
    }
  };
}

function isDuplicateLayerRegistration(nodeIds = [], mode = "", filter = {}, sourceMeta = {}) {
  const targetIds = [...new Set((nodeIds || []).filter(Boolean))].sort();
  if (!targetIds.length) return false;

  const targetSourceType = sourceMeta.sourceType || "manual";
  const targetSourceIds = [...new Set(sourceMeta.sourceIds || [])].sort();
  const layers = Array.isArray(uiState.savedLayers) ? uiState.savedLayers : [];

  return layers.some((layer) => {
    const layerIds = [...new Set((layer?.nodes || []).filter(Boolean))].sort();
    if (layerIds.length !== targetIds.length) return false;

    const sameNodes = layerIds.every((id, index) => id === targetIds[index]);
    if (!sameNodes) return false;

    const sameMode = String(layer?.mode || "") === String(mode || "");
    if (!sameMode) return false;

    const lf = layer?.filter || {};
    const sameFilter =
      (lf.rotMin ?? null) === (filter.rotMin ?? null) &&
      (lf.capMax ?? null) === (filter.capMax ?? null) &&
      (lf.varMin ?? null) === (filter.varMin ?? null);

    if (!sameFilter) return false;

    const ls = layer?.sourceMeta || {};
    const layerSourceType = ls.sourceType || "manual";
    const layerSourceIds = [...new Set(ls.sourceIds || [])].sort();

    const sameSourceType = layerSourceType === targetSourceType;
    const sameSourceIds =
      layerSourceIds.length === targetSourceIds.length &&
      layerSourceIds.every((id, index) => id === targetSourceIds[index]);

    return sameSourceType && sameSourceIds;
  });
}

function getFilterRankSelectedNodeIds(option = "all") {
  const items = getFilterRankItems();
  if (!items.length) return [];

  if (option === "active") {
    return uiState.filterRankActiveId ? [uiState.filterRankActiveId] : [];
  }

  if (option === "pass") {
    return items.filter((item) => item.pass).map((item) => item.id);
  }

  if (option === "fail") {
    return items.filter((item) => !item.pass).map((item) => item.id);
  }

  return items.map((item) => item.id);
}

function buildFilterRankLayerName(option = "all") {
  const modeLabel =
    uiState.filterRankMode === "fail"
      ? "FAIL"
      : uiState.filterRankMode === "pass"
        ? "PASS"
        : "ALL";

  const metricLabel =
    uiState.filterRankMetric === "raw" ? "RAW" : "BASIC";

  if (option === "active") return `FR-${metricLabel}-${modeLabel}-ACTIVE`;
  if (option === "pass") return `FR-${metricLabel}-PASS`;
  if (option === "fail") return `FR-${metricLabel}-FAIL`;

  return `FR-${metricLabel}-${modeLabel}`;
}

function createLayerFromFilterRank(option = "all") {
  const nodeIds = getFilterRankSelectedNodeIds(option);
  if (!nodeIds.length) return null;

  const layer = saveLayerFromNodes(
    nodeIds,
    buildFilterRankLayerName(option),
    {
      memo: `Filter Rank 기반 Layer 생성 (${option})`,
      description: `metric=${uiState.filterRankMetric || "basic"} / mode=${uiState.filterRankMode || null}`,
      filter: { ...(uiState.currentLayerFilter || {}) }
    }
  );

  if (!layer) return null;

  uiState.currentLayerName = layer.name;

  recordLog({
    type: "LAYER_CREATE",
    scope: "LAYER",
    refId: layer.name,
    summary: `[LAYER] Filter Rank 기반 생성: ${layer.name}`,
    payload: {
      option,
      nodeCount: nodeIds.length,
      metric: uiState.filterRankMetric || "basic",
      mode: uiState.filterRankMode || null
    }
  });

  refreshGraphState();
  renderLayerPanel();
  renderLayerMetaFields();
  renderSideMiniStatus();
  saveLabState();

  return layer;
}

function syncPatternMemories(results) {
  if (!results || results.length === 0) return;

  results.forEach((r) => {
    const pattern = r.pattern;

    const key = makePatternKey(pattern);
    if (!key) return;

    const existing = patternMemoryMap.get(key);

    if (!existing) {
      // NEW
      const memory = createPatternMemory(key, pattern, r);
      patternMemoryMap.set(key, memory);
    } else {
      // UPDATE
      updatePatternMemory(existing, pattern, r);
    }
  });
}

function serializePatternLinkExplorerState() {
  const ws = getPatternLinkWorkspace();

  return {
    hideMode: ws.hideMode || null,
    hiddenNodeIds: [...(ws.hiddenNodeIds || [])],
    hiddenEdgeIds: [...(ws.hiddenEdgeIds || [])],

    tempEdgeMode: !!ws.tempEdgeMode,
    tempEdgeIds: [...(ws.tempEdgeIds || [])],
    tempEdgeChain: [...(ws.tempEdgeChain || [])],
    tempEdgeEditorEdgeId: ws.tempEdgeEditorEdgeId || null,

    loadedLayerName: ws.loadedLayerName || null,
    loadedLayerNodes: [...(ws.loadedLayerNodes || [])],
    loadedLayerFilter: {
      rotMin: ws.loadedLayerFilter?.rotMin ?? null,
      capMax: ws.loadedLayerFilter?.capMax ?? null,
      varMin: ws.loadedLayerFilter?.varMin ?? null
    },
    loadedActiveGroupIds: [...(ws.loadedActiveGroupIds || [])],

    compareSource: ws.compareSource || "layer",
    lockedFocusNodeId: ws.lockedFocusNodeId || null,
    lockedFocusEdgeId: ws.lockedFocusEdgeId || null,

    autoFocusNodeId: ws.autoFocusNodeId || null,
    autoFocusEdgeId: ws.autoFocusEdgeId || null,

    dimMode: !!ws.dimMode,
    dimStrength: typeof ws.dimStrength === "number" ? ws.dimStrength : 0.08,
    dimmedNodeIds: [...(ws.dimmedNodeIds || [])],
    dimmedEdgeIds: [...(ws.dimmedEdgeIds || [])],

    baseNodeIds: [...(ws.baseNodeIds || [])],
    baseEdgeIds: [...(ws.baseEdgeIds || [])],

    edgeRelationFilter: ws.edgeRelationFilter || "ALL",
    selectedEdgeId: ws.selectedEdgeId || null,

    statusFilter: uiState.patternLinkExplorerState?.statusFilter || "ALL",
    selectedNodeIds: [...(uiState.patternLinkExplorerState?.selectedNodeIds || [])],
    selectedEdgeIds: [...(uiState.patternLinkExplorerState?.selectedEdgeIds || [])],
    lastFocusedId: uiState.patternLinkExplorerState?.lastFocusedId || null
  };
}

function restorePatternLinkExplorerState(snapshot = {}) {
  uiState.patternLinkWorkspace = {
    ...(uiState.patternLinkWorkspace || {}),

    open: false,
    active: false,

    hideMode: snapshot.hideMode || null,
    hiddenNodeIds: new Set(snapshot.hiddenNodeIds || []),
    hiddenEdgeIds: new Set(snapshot.hiddenEdgeIds || []),

    tempEdgeMode: !!snapshot.tempEdgeMode,
    tempEdgeIds: snapshot.tempEdgeIds || [],
    tempEdgeChain: snapshot.tempEdgeChain || [],
    tempEdgeEditorEdgeId: snapshot.tempEdgeEditorEdgeId || null,

    loadedLayerName: snapshot.loadedLayerName || null,
    loadedLayerNodes: snapshot.loadedLayerNodes || [],
    loadedLayerFilter: {
      rotMin: snapshot.loadedLayerFilter?.rotMin ?? null,
      capMax: snapshot.loadedLayerFilter?.capMax ?? null,
      varMin: snapshot.loadedLayerFilter?.varMin ?? null
    },
    loadedActiveGroupIds: snapshot.loadedActiveGroupIds || [],

    compareSource: snapshot.compareSource || "layer",
    lockedFocusNodeId: snapshot.lockedFocusNodeId || null,
    lockedFocusEdgeId: snapshot.lockedFocusEdgeId || null,

    autoFocusNodeId: snapshot.autoFocusNodeId || null,
    autoFocusEdgeId: snapshot.autoFocusEdgeId || null,

    dimMode: !!snapshot.dimMode,
    dimStrength: typeof snapshot.dimStrength === "number" ? snapshot.dimStrength : 0.08,
    dimmedNodeIds: new Set(snapshot.dimmedNodeIds || []),
    dimmedEdgeIds: new Set(snapshot.dimmedEdgeIds || []),

    baseNodeIds: new Set(snapshot.baseNodeIds || []),
    baseEdgeIds: new Set(snapshot.baseEdgeIds || []),

    edgeRelationFilter: snapshot.edgeRelationFilter || "ALL",
    selectedEdgeId: snapshot.selectedEdgeId || null
  };

  uiState.patternLinkExplorerState = {
    open: false,
    active: false,
    
    statusFilter: snapshot.statusFilter || "ALL",
    selectedNodeIds: snapshot.selectedNodeIds || [],
    selectedEdgeIds: snapshot.selectedEdgeIds || [],
    lastFocusedId: snapshot.lastFocusedId || null
  };
}

function serializeTimelineState() {
  return {
    timelineIndex: uiState.timelineIndex || 0,
    timelinePlaying: !!uiState.timelinePlaying,
    timelineSpeed: uiState.timelineSpeed || 1,
    selectedEventId: uiState.selectedEventId || null,
    tempEdges: collectPersistentTempEdges(),
    explorerOpen: !!uiState.timelineExplorer?.open,
    explorerActive: !!uiState.timelineExplorer?.active,
    selectedTempEdgeIds: [...(uiState.timelineExplorer?.selectedTempEdgeIds || [])],
    lastAppliedEventId: uiState.timelineExplorer?.lastAppliedEventId || null
  };
}

function restoreTimelineState(snapshot = {}) {
  uiState.timelineIndex = snapshot.timelineIndex || 0;
  uiState.timelinePlaying = !!snapshot.timelinePlaying;
  uiState.timelineSpeed = snapshot.timelineSpeed || 1;

  if (snapshot.selectedEventId) {
    uiState.selectedEventId = snapshot.selectedEventId;
  }

  uiState.timelineExplorer = {
    open: !!snapshot.explorerOpen,
    active: !!snapshot.explorerActive,
    selectedTempEdgeIds: snapshot.selectedTempEdgeIds || [],
    lastAppliedEventId: snapshot.lastAppliedEventId || null
  };
}

function openLayerExplorer() {
  uiState.layerExplorerState.open = true;
  if (els.layerPanel) {
    els.layerPanel.classList.remove("hidden");
  }
  renderLayerExplorerState?.();
  saveLabState?.();
}

function closeLayerExplorer() {
  uiState.layerExplorerState.open = false;
  if (els.layerPanel) {
    els.layerPanel.classList.add("hidden");
  }
  saveLabState?.();
}

function openLayerExplorerFullPage() {
  uiState.layerExplorerState.fullOpen = true;
  if (els.layerExplorerFull) {
    els.layerExplorerFull.classList.remove("hidden");
  }
  renderLayerExplorerState?.();
  saveLabState?.();
}

function closeLayerExplorerFullPage() {
  uiState.layerExplorerState.fullOpen = false;
  if (els.layerExplorerFull) {
    els.layerExplorerFull.classList.add("hidden");
  }
  saveLabState?.();
}
/*
function renderLayerExplorerFullHeader() {
  if (!els.layerExplorerFullHeadRight) return;

  const mode = uiState.layerExplorerState?.fullMode || "status";

  els.layerExplorerFullHeadRight.innerHTML = `
    <button class="layer-full-mode-btn ${mode === "status" ? "active" : ""}" data-layer-full-mode="status">상태</button>
    <button class="layer-full-mode-btn ${mode === "month" ? "active" : ""}" data-layer-full-mode="month">월별</button>
    <button class="layer-full-mode-btn ${mode === "day" ? "active" : ""}" data-layer-full-mode="day">날짜별</button>
  `;

  els.layerExplorerFullHeadRight
    .querySelectorAll("[data-layer-full-mode]")
    .forEach((btn) => {
      btn.onclick = () => {
        uiState.layerExplorerState.fullMode = btn.dataset.layerFullMode || "status";
        renderLayerExplorerFullPage?.();
        saveLabState?.();
      };
    });
}
*/
function renderLayerExplorerStatusView() {
  if (!els.layerExplorerFullSubview) return;

  const layers = (uiState.savedLayers || []).filter(Boolean);

  const approved = layers.filter((layer) => (layer.approvalState || "stored") === "approved");
  const holding = layers.filter((layer) => (layer.approvalState || "stored") === "holding");
  const stored = layers.filter((layer) => (layer.approvalState || "stored") === "stored");

  els.layerExplorerFullSubview.innerHTML = `
    <div id="layer-explorer-full-body">
      <div class="layer-explorer-full-col">
        <div class="layer-explorer-full-col-title">승인</div>
        <div id="layer-explorer-approved-list">${renderLayerExplorerGroupList(approved)}</div>
      </div>

      <div class="layer-explorer-full-col">
        <div class="layer-explorer-full-col-title">보류</div>
        <div id="layer-explorer-holding-list">${renderLayerExplorerGroupList(holding)}</div>
      </div>

      <div class="layer-explorer-full-col">
        <div class="layer-explorer-full-col-title">미확인</div>
        <div id="layer-explorer-stored-list">${renderLayerExplorerGroupList(stored)}</div>
      </div>
    </div>
  `;
}

function renderLayerExplorerMonthView() {
  if (!els.layerExplorerFullSubview) return;

  const layers = (uiState.savedLayers || []).filter(Boolean);

const years = [...new Set(
  layers.map(getLayerCreatedYear).filter((x) => x !== "unknown")
)].sort();

  const selectedYear =
    uiState.layerExplorerState?.selectedYear ||
    years[0] ||
    String(new Date().getFullYear());

  uiState.layerExplorerState.selectedYear = selectedYear;

  const yearLayers = layers.filter((layer) => getLayerCreatedYear(layer) === selectedYear);

  els.layerExplorerFullSubview.innerHTML = `
    <div class="layer-time-head">
      <div class="layer-time-year">${selectedYear}</div>
    </div>

    <div class="layer-time-month-grid">
      ${Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        const monthLayers = yearLayers.filter((layer) => getLayerCreatedMonth(layer) === month);
        const count = monthLayers.length;

        return `
          <button
            class="layer-time-month-card ${count ? "" : "empty"}"
            data-layer-month="${month}"
            ${count ? "" : "disabled"}>
            <div class="layer-time-month-title">${month}월</div>
            <div class="layer-time-month-sub">
              ${count ? `${count}개` : "없음"}
            </div>
          </button>
        `;
      }).join("")}
    </div>
  `;

  els.layerExplorerFullSubview
    .querySelectorAll("[data-layer-month]")
    .forEach((btn) => {
      btn.onclick = () => {
        const month = Number(btn.dataset.layerMonth || 0);
        if (!month) return;

        uiState.layerExplorerState.selectedMonth = month;
        uiState.layerExplorerState.timeViewMode = "day";
        renderLayerExplorerFullPage?.();
        saveLabState?.();
      };
    });
}

function renderLayerExplorerDayView() {
  if (!els.layerExplorerFullSubview) return;

  const layers = (uiState.savedLayers || []).filter(Boolean);
  const year = uiState.layerExplorerState?.selectedYear;
  const month = Number(uiState.layerExplorerState?.selectedMonth || 1);

  const monthLayers = layers.filter((layer) => {
    return getLayerCreatedYear(layer) === year &&
           getLayerCreatedMonth(layer) === month;
  });

  const grouped = new Map();

  monthLayers.forEach((layer) => {
    const day = getLayerCreatedDay(layer);
    if (!grouped.has(day)) grouped.set(day, []);
    grouped.get(day).push(layer);
  });

const days = [...grouped.keys()].sort((a, b) => a - b);

  els.layerExplorerFullSubview.innerHTML = `
    <div class="layer-time-head">
      <button id="btn-layer-time-back" type="button">Back</button>
      <div class="layer-time-year">${year} / ${month}월</div>
    </div>

    <div class="layer-time-day-grid">
      ${days.length ? days.map((day) => `
        <div class="layer-time-day-card">
          <div class="layer-time-day-title">${day}일</div>
          <div class="layer-time-day-list">
            ${renderLayerExplorerGroupList(grouped.get(day) || [])}
          </div>
        </div>
      `).join("") : `<div class="empty-state">없음</div>`}
    </div>
  `;

  document.getElementById("btn-layer-time-back")?.addEventListener("click", () => {
    uiState.layerExplorerState.timeViewMode = "month";
    renderLayerExplorerFullPage?.();
    saveLabState?.();
  });
}

function renderLayerExplorerFullHome() {
  const viewMode = uiState.layerExplorerState?.viewMode || "home";
  const mainTab = uiState.layerExplorerState?.mainTab || "status";

  if (els.layerMainTabStatusBtn) {
    els.layerMainTabStatusBtn.classList.toggle("active", viewMode === "status" || (viewMode === "home" && mainTab === "status"));
  }

  if (els.layerMainTabTimeBtn) {
    els.layerMainTabTimeBtn.classList.toggle("active", viewMode === "time" || (viewMode === "home" && mainTab === "time"));
  }
}

function renderLayerExplorerFullInfo() {
  const layers = (uiState.savedLayers || []).filter(Boolean);

  const approved = layers.filter((x) => (x.approvalState || "stored") === "approved").length;
  const holding = layers.filter((x) => (x.approvalState || "stored") === "holding").length;
  const stored = layers.filter((x) => (x.approvalState || "stored") === "stored").length;

  if (els.layerFullTotalCount) els.layerFullTotalCount.textContent = String(layers.length);
  if (els.layerFullApprovedCount) els.layerFullApprovedCount.textContent = String(approved);
  if (els.layerFullHoldingCount) els.layerFullHoldingCount.textContent = String(holding);
  if (els.layerFullStoredCount) els.layerFullStoredCount.textContent = String(stored);
}

function renderLayerExplorerFullMainTabs() {
  if (els.layerMainTabStatusBtn) {
    els.layerMainTabStatusBtn.classList.toggle(
      "active",
      (uiState.layerExplorerState?.viewMode || "home") === "status"
    );

    els.layerMainTabStatusBtn.onclick = () => {
      uiState.layerExplorerState.viewMode = "status";
      uiState.layerExplorerState.mainTab = "status";
      renderLayerExplorerFullPage?.();
      saveLabState?.();
    };
  }

  if (els.layerMainTabTimeBtn) {
    els.layerMainTabTimeBtn.classList.toggle(
      "active",
      (uiState.layerExplorerState?.viewMode || "home") === "time"
    );

    els.layerMainTabTimeBtn.onclick = () => {
      uiState.layerExplorerState.viewMode = "time";
      uiState.layerExplorerState.mainTab = "time";
      renderLayerExplorerFullPage?.();
      saveLabState?.();
    };
  }

  if (els.layerFullBackBtn) {
    els.layerFullBackBtn.onclick = () => {
      uiState.layerExplorerState.viewMode = "home";
      renderLayerExplorerFullPage?.();
      saveLabState?.();
    };
  }
}

function renderLayerExplorerState() {
  renderLayerPanel?.();
  renderLayerExplorerCandidates?.();
  renderLayerExplorerFullPage?.();
}

function renderLayerExplorerGroupList(list = []) {
  if (!list.length) {
    return `<div class="empty-state">없음</div>`;
  }

  return list.map((layer) => {
    const nodeCount = Array.isArray(layer.nodes) ? layer.nodes.length : 0;
    const createdText = formatLayerCreatedAt(layer.createdAt);

    return `
      <div class="layer-item">
        <div class="layer-item-title">${layer.name}</div>
        <div class="layer-item-sub">mode: ${layer.mode || "-"} / nodes: ${nodeCount}</div>
        <div class="layer-item-sub">created: ${createdText}</div>
      </div>
    `;
  }).join("");
}

function getLayerCreatedYear(layer) {
  const ts = Number(layer?.createdAt || 0);
  if (!ts) return "unknown";
  return String(new Date(ts).getFullYear());
}

function getLayerCreatedMonth(layer) {
  const ts = Number(layer?.createdAt || 0);
  if (!ts) return null;
  return new Date(ts).getMonth() + 1;
}

function getLayerCreatedDay(layer) {
  const ts = Number(layer?.createdAt || 0);
  if (!ts) return null;
  return new Date(ts).getDate();
}

function formatLayerCreatedAt(ts) {
  const value = Number(ts || 0);
  if (!value) return "시간 미상";

  const d = new Date(value);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function serializePatternLinkPageState() {
  return {
    layoutMode: uiState.patternLinkPageState?.layoutMode || "default",
    selectedNodeId: uiState.patternLinkPageState?.selectedNodeId || null,
    selectedEdgeId: uiState.patternLinkPageState?.selectedEdgeId || null,
    selectedGroupId: uiState.patternLinkPageState?.selectedGroupId || null,
    selectedGroupRefId: uiState.patternLinkPageState?.selectedGroupRefId || null,
    activeGroupIds: Array.isArray(uiState.patternLinkPageState?.activeGroupIds)
      ? [...uiState.patternLinkPageState.activeGroupIds]
      : [],
    inspectTab: uiState.patternLinkPageState?.inspectTab || "compare",
    compareScrollTop: uiState.patternLinkPageState?.compareScrollTop || 0,
    inspectScrollTop: uiState.patternLinkPageState?.inspectScrollTop || 0,
    listScrollTop: uiState.patternLinkPageState?.listScrollTop || 0,
    baseGroupId: uiState.patternLinkPageState?.baseGroupId || null,
previewGroupIds: Array.isArray(uiState.patternLinkPageState?.previewGroupIds)
  ? [...uiState.patternLinkPageState.previewGroupIds]
  : [],

  };
}

function restorePatternLinkPageState(snapshot = {}) {
  uiState.patternLinkPageState = {
    layoutMode: snapshot.layoutMode || "default",
    selectedNodeId: snapshot.selectedNodeId || null,
    selectedEdgeId: snapshot.selectedEdgeId || null,
    selectedGroupId: snapshot.selectedGroupId || null,
    selectedGroupRefId: snapshot.selectedGroupRefId || null,
    activeGroupIds: Array.isArray(snapshot.activeGroupIds)
      ? [...snapshot.activeGroupIds]
      : [],
    inspectTab: snapshot.inspectTab || "compare",
    compareScrollTop: snapshot.compareScrollTop || 0,
    inspectScrollTop: snapshot.inspectScrollTop || 0,
    listScrollTop: snapshot.listScrollTop || 0,
    baseGroupId: snapshot.baseGroupId || null,
previewGroupIds: Array.isArray(snapshot.previewGroupIds)
  ? [...snapshot.previewGroupIds]
  : [],

  };
}

function getPatternLinkPageActiveGroupIds() {
  if (!uiState.patternLinkPageState) {
    uiState.patternLinkPageState = {};
  }

  if (!Array.isArray(uiState.patternLinkPageState.activeGroupIds)) {
    uiState.patternLinkPageState.activeGroupIds = [];
  }

  return uiState.patternLinkPageState.activeGroupIds;
}

function setPatternLinkPageGroupActive(groupId) {
  if (!groupId) return;

  const group = groupStore.get(groupId);
  if (!group) return;

  if (!uiState.patternLinkPageState) {
    uiState.patternLinkPageState = {};
  }

  uiState.patternLinkPageState.activeGroupIds = [groupId];
  uiState.patternLinkPageState.selectedGroupId = groupId;
  uiState.patternLinkPageState.selectedGroupRefId = groupId;

  const centerNodeId = getGroupCenterNodeId(group);
  uiState.patternLinkPageState.selectedNodeId = centerNodeId || null;
  uiState.patternLinkPageState.selectedEdgeId = null;

  const ws = getPatternLinkWorkspace();
  ws.selectedNodeId = centerNodeId || null;
  ws.selectedEdgeId = null;

applyActiveGroupsToPatternLinkPage?.();
applyPatternLinkDimStyles?.(getPatternLinkCy?.());

renderPatternLinkPanel?.();
renderPatternLinkDetail?.();
renderPatternLinkFocusHeader?.();
updatePatternLinkCurrentGroupBox?.();

saveLabState?.();

}

function togglePatternLinkPageGroupActive(groupId) {
  console.log("TOGGLE start", groupId);

  if (!groupId) return;

  const group = groupStore.get(groupId);
  console.log("TOGGLE group exists", !!group, group);

  if (!group) return;

  if (!uiState.patternLinkPageState) {
    uiState.patternLinkPageState = {};
  }

  const activeSet = new Set(getPatternLinkPageActiveGroupIds());
  console.log("TOGGLE before", [...activeSet]);

  if (activeSet.has(groupId)) {
    activeSet.delete(groupId);
  } else {
    activeSet.add(groupId);
  }

  uiState.patternLinkPageState.activeGroupIds = [...activeSet];
  console.log("TOGGLE after", uiState.patternLinkPageState.activeGroupIds);

  uiState.patternLinkPageState.selectedGroupId = groupId;
  uiState.patternLinkPageState.selectedGroupRefId = groupId;

  const centerNodeId = getGroupCenterNodeId(group);
  const ws = getPatternLinkWorkspace();

  if (activeSet.has(groupId)) {
    uiState.patternLinkPageState.selectedNodeId = centerNodeId || null;
    uiState.patternLinkPageState.selectedEdgeId = null;
    ws.selectedNodeId = centerNodeId || null;
    ws.selectedEdgeId = null;
  }

applyActiveGroupsToPatternLinkPage?.();
applyPatternLinkDimStyles?.(getPatternLinkCy?.());

renderPatternLinkPanel?.();
renderPatternLinkDetail?.();
renderPatternLinkFocusHeader?.();
updatePatternLinkCurrentGroupBox?.();

saveLabState?.();

}

function clearPatternLinkPageGroupActive(groupId) {
  if (!groupId || !uiState.patternLinkPageState) return;

  const next = getPatternLinkPageActiveGroupIds().filter((id) => id !== groupId);
  uiState.patternLinkPageState.activeGroupIds = next;

  if (uiState.patternLinkPageState.selectedGroupId === groupId) {
    uiState.patternLinkPageState.selectedGroupId = null;
    uiState.patternLinkPageState.selectedGroupRefId = null;
  }

  applyActiveGroupsToPatternLinkPage?.();
  renderPatternLinkPanel?.();
  renderPatternLinkDetail?.();
  renderPatternLinkFocusHeader?.();
  saveLabState?.();
}

function saveLabState() {

  const previousSnapshot = JSON.parse(localStorage.getItem("saureltia-lab-state") || "{}");
const serializedGroups = serializeGroupStoreForSave?.() || [];

const safeGroups =
  serializedGroups.length
    ? serializedGroups
    : (
        Array.isArray(previousSnapshot.groups) && previousSnapshot.groups.length
          ? previousSnapshot.groups
          : []
      );

  const snapshot = {
    mode: uiState.mode,
    page: uiState.page,

    savedLayers: uiState.savedLayers,
    currentLayerName: uiState.currentLayerName,
    currentLayerFilter: uiState.currentLayerFilter,

    events: uiState.events,

    logs: uiState.logs || [],
    unsentLogs: uiState.unsentLogs || [],
    logCounter: uiState.logCounter || 0,

    tempEdges: collectPersistentTempEdges(),

    // 중요: exportGroups만 쓰면 group.edit가 날아갈 수 있음
    groups: safeGroups,

    promotedPatterns: uiState.promotedPatterns || [],

    selectedPatternId: uiState.selectedPatternId,
    selectedPatternIds: uiState.selectedPatternIds || [],

    selectedGroupId: uiState.selectedGroupId,
    selectedGroupIds: uiState.selectedGroupIds || [],
    selectedEventId: uiState.selectedEventId,

    activeGroupIds: uiState.activeGroupIds || [],

    patternApplied: !!uiState.patternApplied,
    appliedPatternIds: uiState.appliedPatternIds || [],

    selectedLayerNames: uiState.selectedLayerNames || [],
    expandedGroupId: uiState.expandedGroupId || null,

    relationExplorer: {
      open: !!uiState.relationExplorer?.open,
      active: !!uiState.relationExplorer?.active,
      baseGroupId: uiState.relationExplorer?.baseGroupId || null,
      edgeFilter: uiState.relationExplorer?.edgeFilter || "ALL",
      selectedEdgeIds: uiState.relationExplorer?.selectedEdgeIds || [],
      history: uiState.relationExplorer?.history || [],
      emptyResultModal: {
        open: !!uiState.relationExplorer?.emptyResultModal?.open,
        previousFilter: uiState.relationExplorer?.emptyResultModal?.previousFilter || "ALL",
        previousSelectedEdgeIds:
          uiState.relationExplorer?.emptyResultModal?.previousSelectedEdgeIds || []
      }
    },

    patternLinkExplorer: serializePatternLinkExplorerState(),
    timelineState: serializeTimelineState(),
    patternLinkPage: serializePatternLinkPageState(),

    patternLinkExplorerState: {
      relationFilter: uiState.patternLinkExplorerState?.relationFilter || "ALL"
    },

    approvedLayerNames: uiState.approvedLayerNames || [],

    layerExplorerState: {
      open: !!uiState.layerExplorerState?.open,
      fullOpen: !!uiState.layerExplorerState?.fullOpen,
      selectedLayerName: uiState.layerExplorerState?.selectedLayerName || null,

      viewMode: uiState.layerExplorerState?.viewMode || "home",
      mainTab: uiState.layerExplorerState?.mainTab || "status",
      statusTab: uiState.layerExplorerState?.statusTab || "all",
      timeViewMode: uiState.layerExplorerState?.timeViewMode || "month",

      selectedYear: uiState.layerExplorerState?.selectedYear || null,
      selectedMonth: uiState.layerExplorerState?.selectedMonth || null,
      selectedDay: uiState.layerExplorerState?.selectedDay || null
    },

    layerSets: uiState.layerSets || [],

    setExplorerState: {
      open: !!uiState.setExplorerState?.open,
      fullOpen: !!uiState.setExplorerState?.fullOpen,
      viewMode: uiState.setExplorerState?.viewMode || "home",
      selectedSetId: uiState.setExplorerState?.selectedSetId || null
    },

    // Group Explorer Full 상태도 저장
    groupExplorerFull: {
      open: !!uiState.groupExplorerFull?.open,
      minimized: !!uiState.groupExplorerFull?.minimized,
      view: uiState.groupExplorerFull?.view || "home",
      query: uiState.groupExplorerFull?.query || "",
      filter: uiState.groupExplorerFull?.filter || "ALL",
      sort: uiState.groupExplorerFull?.sort || "name",
      axis: uiState.groupExplorerFull?.axis || "overall",
      bucketSort: uiState.groupExplorerFull?.bucketSort || "count",
      expandedBucketKeys: Array.isArray(uiState.groupExplorerFull?.expandedBucketKeys)
        ? [...uiState.groupExplorerFull.expandedBucketKeys]
        : [],
      detailGroupId: uiState.groupExplorerFull?.detailGroupId || null
    },

    groupRecomputeLogs: Array.isArray(uiState.groupRecomputeLogs)
      ? [...uiState.groupRecomputeLogs]
      : [],

      relationTags: uiState.relationTags || [],

      customTagRules: uiState.customTagRules || { GROUP: {} },
customTagCategoryLabels: uiState.customTagCategoryLabels || {},

suggestions: uiState.suggestions || [],

suggestionToastHiddenIds: uiState.suggestionToastHiddenIds || [],

suggestionMaintenance: uiState.suggestionMaintenance || {
  tab: "duplicates",
  lastResult: null
},

  };

  localStorage.setItem("saureltia-lab-state", JSON.stringify(snapshot));
}

function serializeGroupStoreForSave() {
  const rawGroups = [...groupStore.values()].filter(Boolean);

  const exported = typeof exportGroups === "function"
    ? exportGroups(rawGroups)
    : rawGroups;

  let exportedGroups = [];

  if (Array.isArray(exported)) {
    exportedGroups = exported;
  } else if (Array.isArray(exported?.groups)) {
    exportedGroups = exported.groups;
  } else if (Array.isArray(exported?.items)) {
    exportedGroups = exported.items;
  } else if (Array.isArray(exported?.data)) {
    exportedGroups = exported.data;
  } else {
    console.warn("serializeGroupStoreForSave: exportGroups returned non-array", exported);
    exportedGroups = rawGroups;
  }

  return exportedGroups.map((exportedGroup) => {
    const id = exportedGroup?.id;
    const originalGroup = id ? groupStore.get(id) : null;

    return {
      ...exportedGroup,

      edit: originalGroup?.edit
        ? {
            refs: Array.isArray(originalGroup.edit.refs)
              ? [...originalGroup.edit.refs]
              : [],
            adjustmentTags: Array.isArray(originalGroup.edit.adjustmentTags)
              ? [...originalGroup.edit.adjustmentTags]
              : [],
            logs: Array.isArray(originalGroup.edit.logs)
              ? [...originalGroup.edit.logs]
              : []
          }
        : {
            refs: [],
            adjustmentTags: [],
            logs: []
          },

      runtime: originalGroup?.runtime
        ? { ...originalGroup.runtime }
        : {}
    };
  });
}

function collectPersistentTempEdges() {
  if (!window.cy) return [];

  return cy.edges()
  .filter((edge) => {
    const type = edge.data("type");
    return type === "TEMP_TEST";
  })
  .map((edge) => ({
    id: edge.id(),
    source: edge.data("source"),
    target: edge.data("target"),
    type: edge.data("type"),
    label: edge.data("label") || "TEMP",
    relationTag: edge.data("relationTag") || edge.data("label") || "TEMP"
  }));

}

function restorePersistentTempEdges(edges = []) {
  if (!window.cy || !Array.isArray(edges)) return;

  edges.forEach((edge) => {
    if (!edge?.id || !edge?.source || !edge?.target) return;
    if (cy.getElementById(edge.id).length > 0) return;

    cy.add({
  group: "edges",
  data: {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: edge.type || "TEMP_TEST",
    label: edge.label || "TEMP",
    relationTag: edge.relationTag || edge.label || "TEMP"
  }
});

    const added = cy.getElementById(edge.id);
    if (added && added.length > 0) {
      added.style({
        "line-color": "#ffd43b",
        "target-arrow-color": "#ffd43b",
        width: 3
      });
    }
  });
}

function normalizeLoadedGroupEditState(group) {
  if (!group.edit || typeof group.edit !== "object") {
    group.edit = {};
  }

  if (!Array.isArray(group.edit.refs)) {
    group.edit.refs = [];
  }

  if (!Array.isArray(group.edit.adjustmentTags)) {
    group.edit.adjustmentTags = [];
  }

  if (!Array.isArray(group.edit.logs)) {
    group.edit.logs = [];
  }

  if (!group.runtime || typeof group.runtime !== "object") {
    group.runtime = {};
  }

  return group;
}

function loadLabState() {
  const raw = localStorage.getItem("saureltia-lab-state");
  if (!raw) return;

  try {
    const snapshot = JSON.parse(raw);

    uiState.mode = snapshot.mode || "explore";
    uiState.page = snapshot.page || "network";

    uiState.savedLayers = (snapshot.savedLayers || []).map((layer) => {
      ensureEntityEditState?.(layer);
      return layer;
    });

    uiState.events = (snapshot.events || []).map((evt) => {
      ensureEntityEditState?.(evt);
      return evt;
    });

    uiState.logs = snapshot.logs || [];
    uiState.logCounter = snapshot.logCounter || 0;
    uiState.unsentLogs = snapshot.unsentLogs || [];
    uiState.tempEdges = snapshot.tempEdges || [];
    uiState.__eventCounter = snapshot.eventCounter || 1;

    // =========================
    // GROUP RESTORE
    // =========================
    const savedGroups = Array.isArray(snapshot.groups)
      ? snapshot.groups
      : [];

    if (savedGroups.length) {
      const savedGroupMap = new Map(
        savedGroups
          .filter((group) => group?.id)
          .map((group) => [group.id, group])
      );

      const importedGroups = importGroups?.(savedGroups) || savedGroups;

      const restoredWithEdit = importedGroups
        .filter((group) => group?.id)
        .map((group) => {
          const saved = savedGroupMap.get(group.id);

          const merged = {
            ...group,

            edit: saved?.edit
              ? {
                  refs: Array.isArray(saved.edit.refs)
                    ? [...saved.edit.refs]
                    : [],
                  adjustmentTags: Array.isArray(saved.edit.adjustmentTags)
                    ? [...saved.edit.adjustmentTags]
                    : [],
                  logs: Array.isArray(saved.edit.logs)
                    ? [...saved.edit.logs]
                    : []
                }
              : {
                  refs: [],
                  adjustmentTags: [],
                  logs: []
                },

            runtime: saved?.runtime
              ? { ...saved.runtime }
              : {}
          };

          return normalizeLoadedGroupEditState?.(merged) || merged;
        });

      if (restoredWithEdit.length) {
        groupStore.clear();

        const registeredGroups = groupRegistry.replaceAll(restoredWithEdit);

        registeredGroups.forEach((group) => {
          const saved = savedGroupMap.get(group.id);

          if (saved?.edit) {
            group.edit = {
              refs: Array.isArray(saved.edit.refs)
                ? [...saved.edit.refs]
                : [],
              adjustmentTags: Array.isArray(saved.edit.adjustmentTags)
                ? [...saved.edit.adjustmentTags]
                : [],
              logs: Array.isArray(saved.edit.logs)
                ? [...saved.edit.logs]
                : []
            };
          } else {
            group.edit = {
              refs: [],
              adjustmentTags: [],
              logs: []
            };
          }

          if (saved?.runtime) {
            group.runtime = { ...saved.runtime };
          } else if (!group.runtime || typeof group.runtime !== "object") {
            group.runtime = {};
          }

          normalizeLoadedGroupEditState?.(group);
          groupStore.set(group.id, group);
        });
      } else {
        console.warn("Group restore skipped: imported groups empty");
      }
    } else {
      console.warn("Group restore skipped: snapshot.groups empty");
    }

    uiState.currentLayerFilter = {
      rotMin: null,
      capMax: null,
      varMin: null
    };

    uiState.rightPanelView = "network";
    uiState.isLayerDeleteMode = false;
    uiState.selectedLayerNamesForDelete = [];

    uiState.promotedPatterns = (snapshot.promotedPatterns || []).map((result) => {
      const pattern = result?.pattern || result;

      if (pattern) {
        ensureEntityEditState?.(pattern);
      }

      return result;
    });

    if (!uiState.patternMap) {
      uiState.patternMap = new Map();
    } else {
      uiState.patternMap.clear?.();
    }

    (uiState.promotedPatterns || []).forEach((result) => {
      const pattern = result?.pattern || result;
      if (!pattern?.id) return;
      uiState.patternMap.set(pattern.id, result);
    });

    uiState.selectedPatternId = snapshot.selectedPatternId || null;
    uiState.selectedPatternIds = snapshot.selectedPatternIds || [];
    uiState.selectedGroupId = snapshot.selectedGroupId || null;
    uiState.selectedGroupIds = snapshot.selectedGroupIds || [];
    uiState.selectedEventId = snapshot.selectedEventId || null;
    uiState.activeGroupIds = snapshot.activeGroupIds || [];
    uiState.patternApplied = !!snapshot.patternApplied;
    uiState.appliedPatternIds = snapshot.appliedPatternIds || [];
    uiState.selectedLayerNames = snapshot.selectedLayerNames || [];
    uiState.currentLayerName = snapshot.currentLayerName || null;
    uiState.expandedGroupId = snapshot.expandedGroupId || null;

    uiState.relationExplorer = {
      open: !!snapshot.relationExplorer?.open,
      active: !!snapshot.relationExplorer?.active,
      baseGroupId: snapshot.relationExplorer?.baseGroupId || null,
      edgeFilter: snapshot.relationExplorer?.edgeFilter || "ALL",
      selectedEdgeIds: snapshot.relationExplorer?.selectedEdgeIds || [],
      history: snapshot.relationExplorer?.history || [],
      emptyResultModal: {
        open: !!snapshot.relationExplorer?.emptyResultModal?.open,
        previousFilter:
          snapshot.relationExplorer?.emptyResultModal?.previousFilter || "ALL",
        previousSelectedEdgeIds:
          snapshot.relationExplorer?.emptyResultModal?.previousSelectedEdgeIds || []
      }
    };

    uiState.patternLinkExplorerState = {
      relationFilter: snapshot.patternLinkExplorerState?.relationFilter || "ALL"
    };

    uiState.approvedLayerNames = snapshot.approvedLayerNames || [];

    uiState.layerExplorerState = {
      open: !!snapshot.layerExplorerState?.open,
      fullOpen: !!snapshot.layerExplorerState?.fullOpen,
      selectedLayerName: snapshot.layerExplorerState?.selectedLayerName || null,

      viewMode: snapshot.layerExplorerState?.viewMode || "home",
      mainTab: snapshot.layerExplorerState?.mainTab || "status",
      statusTab: snapshot.layerExplorerState?.statusTab || "all",
      timeViewMode: snapshot.layerExplorerState?.timeViewMode || "month",

      selectedYear: snapshot.layerExplorerState?.selectedYear || null,
      selectedMonth: snapshot.layerExplorerState?.selectedMonth || null,
      selectedDay: snapshot.layerExplorerState?.selectedDay || null
    };

    uiState.layerSets = Array.isArray(snapshot.layerSets)
      ? snapshot.layerSets
      : [];

    uiState.setExplorerState = {
      open: !!snapshot.setExplorerState?.open,
      fullOpen: !!snapshot.setExplorerState?.fullOpen,
      viewMode: snapshot.setExplorerState?.viewMode || "home",
      selectedSetId: snapshot.setExplorerState?.selectedSetId || null
    };

    uiState.groupExplorerFull = {
      open: !!snapshot.groupExplorerFull?.open,
      minimized: !!snapshot.groupExplorerFull?.minimized,
      view: snapshot.groupExplorerFull?.view || "home",
      query: snapshot.groupExplorerFull?.query || "",
      filter: snapshot.groupExplorerFull?.filter || "ALL",
      sort: snapshot.groupExplorerFull?.sort || "name",
      axis: snapshot.groupExplorerFull?.axis || "overall",
      bucketSort: snapshot.groupExplorerFull?.bucketSort || "count",
      expandedBucketKeys: Array.isArray(snapshot.groupExplorerFull?.expandedBucketKeys)
        ? [...snapshot.groupExplorerFull.expandedBucketKeys]
        : [],
      detailGroupId: snapshot.groupExplorerFull?.detailGroupId || null,
      shouldAutoExpandFirstBucket: false
    };

    uiState.groupRecomputeLogs = Array.isArray(snapshot.groupRecomputeLogs)
      ? [...snapshot.groupRecomputeLogs]
      : [];

      uiState.relationTags = Array.isArray(snapshot.relationTags)
  ? snapshot.relationTags
  : [];

      uiState.customTagRules = snapshot.customTagRules || { GROUP: {} };
uiState.customTagCategoryLabels = snapshot.customTagCategoryLabels || {};

restoreCustomTagRulesToRuntime?.();

uiState.suggestions = Array.isArray(snapshot.suggestions)
  ? snapshot.suggestions
  : [];

  uiState.suggestionToastHiddenIds = Array.isArray(snapshot.suggestionToastHiddenIds)
  ? snapshot.suggestionToastHiddenIds
  : [];

  uiState.suggestionMaintenance = snapshot.suggestionMaintenance || {
  tab: "duplicates",
  lastResult: null
};

    restorePatternLinkExplorerState(snapshot.patternLinkExplorer || {});
    restoreTimelineState(snapshot.timelineState || {});
    restorePatternLinkPageState(snapshot.patternLinkPage || {});
  } catch (err) {
    console.error("loadLabState parse failed:", err);
  }
}

/*
function restoreGroupStoreFromSave(savedGroups) {
  if (!Array.isArray(savedGroups)) return;

  groupStore.clear();

  savedGroups.forEach((group) => {
    if (!group?.id) return;

    if (!group.edit || typeof group.edit !== "object") {
      group.edit = {};
    }

    if (!Array.isArray(group.edit.refs)) {
      group.edit.refs = [];
    }

    if (!Array.isArray(group.edit.adjustmentTags)) {
      group.edit.adjustmentTags = [];
    }

    if (!Array.isArray(group.edit.logs)) {
      group.edit.logs = [];
    }

    if (!group.runtime || typeof group.runtime !== "object") {
      group.runtime = {};
    }

    groupStore.set(group.id, group);
  });
}
*/

function ensureSuggestionDetailExplorerEl() {
  let panel = document.getElementById("suggestion-detail-explorer");

  if (panel) return panel;

  panel = document.createElement("div");
  panel.id = "suggestion-detail-explorer";
  panel.className = "suggestion-detail-explorer hidden";

  panel.innerHTML = `
    <div class="suggestion-detail-head">
      <div>
        <div class="suggestion-detail-kicker">제안!</div>
        <div id="suggestion-detail-title" class="suggestion-detail-title">Suggestion Detail</div>
      </div>

      <button id="btn-close-suggestion-detail" type="button">닫기</button>
    </div>

    <div id="suggestion-detail-body"></div>
  `;

  document.body.appendChild(panel);

  const closeBtn = panel.querySelector("#btn-close-suggestion-detail");
  if (closeBtn) {
    closeBtn.onclick = () => {
      panel.classList.add("hidden");
    };
  }

  makeSuggestionDetailExplorerDraggable(panel);

  return panel;
}

function makeSuggestionDetailExplorerDraggable(panel) {
  if (!panel || panel.dataset.dragBound === "true") return;

  const head = panel.querySelector(".suggestion-detail-head");
  if (!head) return;

  let dragging = false;
  let offsetX = 0;
  let offsetY = 0;

  head.addEventListener("mousedown", (e) => {
    if (e.target.closest("button")) return;

    dragging = true;

    const rect = panel.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    panel.style.right = "auto";
    panel.style.left = `${rect.left}px`;
    panel.style.top = `${rect.top}px`;

    document.body.style.userSelect = "none";
  });

  window.addEventListener("mousemove", (e) => {
    if (!dragging) return;

    const w = panel.offsetWidth;
    const h = panel.offsetHeight;

    let nextLeft = e.clientX - offsetX;
    let nextTop = e.clientY - offsetY;

    nextLeft = Math.max(8, Math.min(nextLeft, window.innerWidth - w - 8));
    nextTop = Math.max(8, Math.min(nextTop, window.innerHeight - h - 8));

    panel.style.left = `${nextLeft}px`;
    panel.style.top = `${nextTop}px`;
  });

  window.addEventListener("mouseup", () => {
    dragging = false;
    document.body.style.userSelect = "";
  });

  panel.dataset.dragBound = "true";
}

function openSuggestionDetailExplorer(suggestionId) {
  const sug = findSuggestionById(suggestionId);
  if (!sug) return;

  const panel = ensureSuggestionDetailExplorerEl();
  panel.dataset.suggestionId = suggestionId;
  panel.classList.remove("hidden");

  renderSuggestionDetailExplorer(suggestionId);
}

function buildSuggestionMaintenancePreview(options = {}) {
  const suggestions = ensureSuggestionState();
  const groups = [...groupStore.values()];

  const duplicateMap = new Map();
  const duplicateItems = [];

  suggestions.forEach((item) => {
    const key =
      item.dedupeKey ||
      [
        item.type,
        item.entityType,
        item.entityId,
        item.suggestedTag,
        item.sourceType,
        item.sourceRef
      ].join(":");

    if (duplicateMap.has(key)) {
      duplicateItems.push(item);
    } else {
      duplicateMap.set(key, item);
    }
  });

  const alreadyAppliedSuggestions = suggestions.filter((sug) => {
    if (sug.entityType !== "GROUP") return false;
    if (sug.status !== "NEW" && sug.status !== "SNOOZED") return false;

    return hasGroupTagApplied?.(sug.entityId, sug.suggestedTag);
  });

  const candidateRows = [];

  groups.forEach((group) => {
    const meta = getGroupCardMeta(group);

    AUTO_GROUP_SUGGESTION_RULES.forEach((rule) => {
      const value = meta?.[rule.metric];
      const passed = evaluateAutoSuggestionRule(value, rule);

      if (!passed) return;

      const alreadyTagged = hasGroupTagApplied?.(group.id, rule.suggestedTag);
      const dedupeKey = [
        "AUTO_GROUP_RULE",
        rule.id,
        group.id,
        rule.suggestedTag
      ].join(":");

      const alreadySuggested = suggestions.some((item) => {
        return item.dedupeKey === dedupeKey;
      });

      const preview = buildAutoSuggestionPreview(group, rule);

      candidateRows.push({
        groupId: group.id,
        groupLabel: group.name || group.label || group.id,

        ruleId: rule.id,
        metric: rule.metric,
        value,
        operator: rule.operator,
        threshold: rule.threshold,

        suggestedTag: rule.suggestedTag,
        displayTag: getDisplayTagName?.(rule.suggestedTag) || rule.suggestedTag,
        category: rule.category,
        strength: rule.strength || "MID",

        alreadyTagged,
        alreadySuggested,
        willCreate: !alreadyTagged && !alreadySuggested,

        previewBefore: preview.before,
        previewAfter: preview.after,
        previewDeltas: preview.deltas
      });
    });
  });

return {
  createdAt: Date.now(),

  currentSuggestionCount: suggestions.length,
  duplicateCount: duplicateItems.length,
  alreadyAppliedPendingCount: alreadyAppliedSuggestions.length,

  scanCandidateCount: candidateRows.length,
  scanCreateCount: candidateRows.filter((row) => row.willCreate).length,

  duplicateItems,
  alreadyAppliedSuggestions,
  candidateRows
};

}

function getSuggestionEntityTypes() {
  return ["ALL", "EVT", "LAYER", "PATTERN", "GROUP", "ALGORITHM"];
}

function ensureSuggestionInboxState() {
  if (!uiState.suggestionInbox || typeof uiState.suggestionInbox !== "object") {
    uiState.suggestionInbox = {
      entityType: "ALL",
      selectedSuggestionId: null
    };
  }

  if (!uiState.suggestionInbox.entityType) {
    uiState.suggestionInbox.entityType = "ALL";
  }

  return uiState.suggestionInbox;
}

function getSuggestionInboxItems(tab = "new") {
  const inbox = ensureSuggestionInboxState();
  const items = getSuggestionsByTab(tab);

  if (inbox.entityType === "ALL") return items;

  return items.filter((sug) => sug.entityType === inbox.entityType);
}

function ensureSuggestionMaintenanceState() {
  if (!uiState.suggestionMaintenance || typeof uiState.suggestionMaintenance !== "object") {
    uiState.suggestionMaintenance = {
      tab: "duplicates",
      lastResult: null
    };
  }

  if (!uiState.suggestionMaintenance.tab) {
    uiState.suggestionMaintenance.tab = "duplicates";
  }

  return uiState.suggestionMaintenance;
}

function ensureSuggestionMaintenanceExplorerEl() {
  let overlay = document.getElementById("suggestion-maintenance-overlay");
  let panel = document.getElementById("suggestion-maintenance-explorer");

  if (overlay && panel) {
    return { overlay, panel };
  }

  overlay = document.createElement("div");
  overlay.id = "suggestion-maintenance-overlay";
  overlay.className = "suggestion-maintenance-overlay hidden";

  panel = document.createElement("div");
  panel.id = "suggestion-maintenance-explorer";
  panel.className = "suggestion-maintenance-explorer hidden";

  panel.innerHTML = `
    <div class="suggestion-maintenance-head">
      <div>
        <div class="suggestion-maintenance-kicker">SUGGESTION MAINTENANCE</div>
        <div class="suggestion-maintenance-title">제안 정리 / 스캔 Preview</div>
      </div>

      <button id="btn-close-suggestion-maintenance" type="button">닫기</button>
    </div>

    <div id="suggestion-maintenance-body"></div>
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(panel);

  const closeBtn = panel.querySelector("#btn-close-suggestion-maintenance");
  if (closeBtn) {
    closeBtn.onclick = () => closeSuggestionMaintenanceExplorer();
  }

  makeSuggestionMaintenanceExplorerDraggable(panel);

  return { overlay, panel };
}

function openSuggestionMaintenanceExplorer(tab = "duplicates") {
  const { overlay, panel } = ensureSuggestionMaintenanceExplorerEl();
  const state = ensureSuggestionMaintenanceState();

  state.tab = tab || state.tab || "duplicates";

  overlay.classList.remove("hidden");
  panel.classList.remove("hidden");

  const preview = buildSuggestionMaintenancePreview();
  panel.__preview = preview;

  renderSuggestionMaintenanceExplorer(preview);
}

function closeSuggestionMaintenanceExplorer() {
  document.getElementById("suggestion-maintenance-overlay")?.classList.add("hidden");
  document.getElementById("suggestion-maintenance-explorer")?.classList.add("hidden");
}

function renderSuggestionMaintenanceExplorer(preview) {
  const body = document.getElementById("suggestion-maintenance-body");
  if (!body || !preview) return;

  const state = ensureSuggestionMaintenanceState();
  const tab = state.tab || "duplicates";

  const duplicateItems = Array.isArray(preview.duplicateItems)
    ? preview.duplicateItems
    : [];

  const alreadyAppliedSuggestions = Array.isArray(preview.alreadyAppliedSuggestions)
    ? preview.alreadyAppliedSuggestions
    : [];

  const candidateRows = Array.isArray(preview.candidateRows)
    ? preview.candidateRows
    : [];

  const willCreateRows = candidateRows.filter((row) => row.willCreate);

  body.innerHTML = `
    <section class="suggestion-maintenance-warning">
      <b>주의</b>
      <p>
        이 화면은 제안 구조를 정리하거나 새 제안 후보를 생성하기 전의 preview입니다.
        자동으로 태그를 적용하지 않습니다.
      </p>
      <p>
        아직 변수/태그 체계가 완성된 상태가 아니므로,
        현재 preview는 “값에 따라 특정 태그가 제안될 수 있음”만 표시합니다.
      </p>
    </section>

    <section class="suggestion-maintenance-summary">
      <div><span>현재 제안</span><b>${preview.currentSuggestionCount}</b></div>
      <div><span>중복 후보</span><b>${preview.duplicateCount}</b></div>
      <div><span>태그 체결 완료 후보</span><b>${preview.alreadyAppliedPendingCount}</b></div>
      <div><span>스캔 후보</span><b>${preview.scanCandidateCount}</b></div>
      <div><span>생성 가능</span><b>${preview.scanCreateCount}</b></div>
    </section>

    <section class="suggestion-maintenance-tabs">
      <button type="button" data-maintenance-tab="duplicates" class="${tab === "duplicates" ? "active" : ""}">
        중복 정리 후보
      </button>
      <button type="button" data-maintenance-tab="scan" class="${tab === "scan" ? "active" : ""}">
        스캔 preview
      </button>
      <button type="button" data-maintenance-tab="result" class="${tab === "result" ? "active" : ""}">
        실행 결과
      </button>
    </section>

    <section class="suggestion-maintenance-section">
      ${
        tab === "duplicates"
          ? renderSuggestionMaintenanceDuplicateView(duplicateItems)
          : tab === "scan"
            ? renderSuggestionMaintenanceScanView(candidateRows)
            : renderSuggestionMaintenanceResultView(state.lastResult)
      }
    </section>

    <section class="suggestion-maintenance-actions">
      <button id="btn-run-suggestion-dedupe" type="button" title="같은 dedupeKey 또는 같은 제안 구조를 하나만 남기고 정리합니다.">
        중복 정리 실행
      </button>

      <button id="btn-run-suggestion-clean-applied" type="button" title="이미 실제 태그로 체결된 NEW/SNOOZED 제안을 목록에서 제거합니다.">
        체결 완료 후보 정리
      </button>

      <button id="btn-run-suggestion-scan" type="button" title="현재 Group 값으로 제안 후보를 다시 검사합니다. 자동 적용은 하지 않습니다.">
        스캔 실행
      </button>

      <button id="btn-run-suggestion-all" type="button" title="중복 정리 → 체결 완료 후보 정리 → 스캔 실행을 순서대로 수행합니다.">
        전체 실행
      </button>
    </section>

    ${renderSuggestionScanDetailOverlay(preview)}

  `;

  bindSuggestionMaintenanceTabs();
  bindSuggestionMaintenanceActions();
  bindSuggestionScanDetailButton?.();

  bindSuggestionScanDetailOverlayControls?.();

}

function renderSuggestionScanDetailPanel(row) {
  const before = row.previewBefore || {};
  const manualAfter = row.previewManualAfter || row.manualAfter || before;
  const after = row.previewAfter || {};
  const deltas = Array.isArray(row.previewDeltas) ? row.previewDeltas : [];

  const displayTag = row.displayTag || getSuggestionDisplayTag(row.suggestedTag);

  return `
    <div class="suggestion-scan-detail-panel-inner">
      <section class="suggestion-scan-detail-main-card">
        <div class="suggestion-scan-detail-main-title">${displayTag}</div>
        <div class="suggestion-scan-detail-main-sub">
          ${row.groupLabel || row.groupId || "-"}
        </div>

        <div class="suggestion-scan-detail-condition">
          <span>조건</span>
          <b>${row.metric} ${row.operator} ${formatSuggestionNumber(row.threshold)}</b>
          <em>현재 ${formatSuggestionNumber(row.value)}</em>
        </div>

        <div class="suggestion-scan-detail-tags">
          ${renderSuggestionTagRow([row.category, row.strength, row.suggestedTag])}
        </div>
      </section>

      <section class="suggestion-scan-detail-stage-grid">
        ${renderSuggestionMetricBox("원래 변수 값", before, "base")}

        <button
          type="button"
          class="suggestion-stage-open-card"
          data-open-stage-detail="manual"
        >
          <div class="suggestion-stage-open-title">내 수정 반영 값</div>
          <div class="suggestion-stage-open-sub">수동 태그 변화 상세 보기</div>
        </button>

        <button
          type="button"
          class="suggestion-stage-open-card suggestion"
          data-open-stage-detail="suggestion"
        >
          <div class="suggestion-stage-open-title">제안 태그 반영 값</div>
          <div class="suggestion-stage-open-sub">제안 태그 변화 상세 보기</div>
        </button>
      </section>

      <section class="suggestion-scan-detail-stage-grid">
        ${renderSuggestionMetricBox("내 수정 후", manualAfter, "manual")}
        ${renderSuggestionDeltaBox("제안 변화", deltas, "delta")}
        ${renderSuggestionMetricBox("제안 후", after, "after")}
      </section>
    </div>
  `;
}

function bindSuggestionScanDetailOverlayControls() {
  const detailState = ensureSuggestionScanDetailState();

  const closeBtn = document.getElementById("btn-close-suggestion-scan-detail");
  if (closeBtn) {
    closeBtn.onclick = () => {
      closeSuggestionScanDetailOverlay();
    };
  }

  const typeSelect = document.getElementById("suggestion-scan-detail-type");
  if (typeSelect) {
    typeSelect.onchange = () => {
      detailState.entityType = typeSelect.value || "GROUP";

      const preview = buildSuggestionMaintenancePreview();
      const rows = getSuggestionScanDetailRows(preview, detailState.entityType);
      detailState.selectedKey = rows[0]?.key || null;

      renderSuggestionMaintenanceExplorer(preview);
      saveLabState?.();
    };
  }

  document.querySelectorAll("[data-scan-detail-key]").forEach((btn) => {
    btn.onclick = () => {
      detailState.selectedKey = btn.dataset.scanDetailKey || null;

      const preview = buildSuggestionMaintenancePreview();
      renderSuggestionMaintenanceExplorer(preview);
      saveLabState?.();
    };
  });

  document.querySelectorAll("[data-open-stage-detail]").forEach((btn) => {
    btn.onclick = () => {
      const stage = btn.dataset.openStageDetail;
      openSuggestionStageDetailExplorer(stage);
    };
  });

  document.querySelectorAll("[data-open-stage-detail]").forEach((btn) => {
  btn.onclick = () => {
    openSuggestionStageDetailExplorer(btn.dataset.openStageDetail);
  };
});

const closeStageBtn = document.getElementById("btn-close-suggestion-stage-detail");
if (closeStageBtn) {
  closeStageBtn.onclick = () => {
    closeSuggestionStageDetailExplorer();
  };
}

}

function bindSuggestionMaintenanceTabs() {
  const state = ensureSuggestionMaintenanceState();

  document
    .querySelectorAll("[data-maintenance-tab]")
    .forEach((btn) => {
      btn.onclick = () => {
        state.tab = btn.dataset.maintenanceTab || "duplicates";

        const preview = buildSuggestionMaintenancePreview();
        renderSuggestionMaintenanceExplorer(preview);

        saveLabState?.();
      };
    });
}


function bindSuggestionMaintenanceActions() {
  const state = ensureSuggestionMaintenanceState();

  const dedupeBtn = document.getElementById("btn-run-suggestion-dedupe");
  const cleanBtn = document.getElementById("btn-run-suggestion-clean-applied");
  const scanBtn = document.getElementById("btn-run-suggestion-scan");
  const allBtn = document.getElementById("btn-run-suggestion-all");

  function rerender(action, result = {}) {
    state.tab = "result";
    state.lastResult = {
      action,
      ...result,
      createdAt: Date.now()
    };

    const preview = buildSuggestionMaintenancePreview();
    renderSuggestionMaintenanceExplorer(preview);
    renderSuggestionToasts?.();
    renderSuggestionInboxExplorer?.();
    renderUnreadMessageExplorer?.();
    saveLabState?.();
  }

  if (dedupeBtn) {
    dedupeBtn.onclick = () => {
      const before = ensureSuggestionState().length;
      dedupeSuggestionsByKey?.();
      const after = ensureSuggestionState().length;

      rerender("중복 정리", {
        dedupeCount: Math.max(0, before - after),
        cleanAppliedCount: 0,
        createdCount: 0,
        created: []
      });
    };
  }

  if (cleanBtn) {
    cleanBtn.onclick = () => {
      const before = ensureSuggestionState().length;
      removeSuggestionsForAlreadyAppliedGroupTags?.();
      const after = ensureSuggestionState().length;

      rerender("체결 완료 후보 정리", {
        dedupeCount: 0,
        cleanAppliedCount: Math.max(0, before - after),
        createdCount: 0,
        created: []
      });
    };
  }

  if (scanBtn) {
    scanBtn.onclick = () => {
      const created = scanAllGroupSuggestionCandidates?.() || [];

      rerender("스캔 실행", {
        dedupeCount: 0,
        cleanAppliedCount: 0,
        createdCount: created.length,
        created
      });
    };
  }

  if (allBtn) {
    allBtn.onclick = () => {
      const beforeDedupe = ensureSuggestionState().length;
      dedupeSuggestionsByKey?.();
      const afterDedupe = ensureSuggestionState().length;

      const beforeClean = ensureSuggestionState().length;
      removeSuggestionsForAlreadyAppliedGroupTags?.();
      const afterClean = ensureSuggestionState().length;

      const created = scanAllGroupSuggestionCandidates?.() || [];

      rerender("전체 실행", {
        dedupeCount: Math.max(0, beforeDedupe - afterDedupe),
        cleanAppliedCount: Math.max(0, beforeClean - afterClean),
        createdCount: created.length,
        created
      });
    };
  }
}

function bindSuggestionScanDetailButton() {
  const btn = document.getElementById("btn-open-suggestion-scan-detail");
  if (!btn) return;

  btn.onclick = () => {
    openSuggestionScanDetailOverlay();
  };
}

function renderSuggestionMaintenanceDuplicateView(duplicateItems = []) {
  if (!duplicateItems.length) {
    return `
      <div class="suggestion-maintenance-soft-empty">
        중복된 태그 구조가 존재하지 않습니다.
      </div>
    `;
  }

  return `
    <div class="suggestion-maintenance-section-title">DUPLICATE PREVIEW</div>

    ${duplicateItems.map((sug) => `
      <div class="suggestion-maintenance-row duplicate">
        <div class="suggestion-maintenance-row-main">
          <div>
            <b>${sug.displayTag || getDisplayTagName?.(sug.suggestedTag) || sug.suggestedTag || "-"}</b>
            <span>${sug.entityType || "-"}:${sug.entityId || "-"}</span>
          </div>

          <small>${sug.reason || "중복 제안 구조"}</small>

          <div class="suggestion-maintenance-chip-row">
            <em>${sug.status || "-"}</em>
            <em>${sug.category || "-"}</em>
            <em>${sug.sourceType || "-"}:${sug.sourceRef || "-"}</em>
            <em class="blocked">중복 정리 후보</em>
          </div>
        </div>
      </div>
    `).join("")}
  `;
}

function renderSuggestionMaintenanceScanView(candidateRows = []) {
  return `
    <div class="suggestion-maintenance-section-title">SCAN PREVIEW</div>

    <div class="suggestion-maintenance-soft-empty">
      Scan Preview는 대상별 변수 비교 Explorer에서 확인합니다.
    </div>

    <button
      id="btn-open-suggestion-scan-detail"
      type="button"
      class="suggestion-scan-detail-open-btn large"
    >
      Scan Preview Explorer 열기
    </button>
  `;
}

function renderSuggestionMaintenanceResultView(result) {
  if (!result) {
    return `
      <div class="suggestion-maintenance-soft-empty">
        아직 실행 결과가 없습니다.
      </div>
    `;
  }

  return `
    <div class="suggestion-maintenance-section-title">RESULT</div>

    <div class="suggestion-maintenance-result-grid">
      <div><span>작업</span><b>${result.action || "-"}</b></div>
      <div><span>중복 정리</span><b>${result.dedupeCount ?? "-"}</b></div>
      <div><span>체결 완료 정리</span><b>${result.cleanAppliedCount ?? "-"}</b></div>
      <div><span>생성된 제안</span><b>${result.createdCount ?? "-"}</b></div>
    </div>

    ${
      Array.isArray(result.created) && result.created.length
        ? result.created.map((sug) => `
          <div class="suggestion-maintenance-row will-create">
            <div class="suggestion-maintenance-row-main">
              <div>
                <b>${sug.displayTag || getDisplayTagName?.(sug.suggestedTag) || sug.suggestedTag}</b>
                <span>${sug.entityType}:${sug.entityId}</span>
              </div>
              <small>${sug.reason || "-"}</small>
            </div>
          </div>
        `).join("")
        : `<div class="suggestion-maintenance-soft-empty">새로 생성된 제안이 없습니다.</div>`
    }
  `;
}

function makeSuggestionMaintenanceExplorerDraggable(panel) {
  if (!panel || panel.dataset.dragBound === "true") return;

  const head = panel.querySelector(".suggestion-maintenance-head");
  if (!head) return;

  let dragging = false;
  let offsetX = 0;
  let offsetY = 0;

  head.addEventListener("mousedown", (e) => {
    if (e.target.closest("button")) return;

    dragging = true;

    const rect = panel.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    panel.style.right = "auto";
    panel.style.left = `${rect.left}px`;
    panel.style.top = `${rect.top}px`;
    panel.style.transform = "none";

    document.body.style.userSelect = "none";
  });

  window.addEventListener("mousemove", (e) => {
    if (!dragging) return;

    const w = panel.offsetWidth;
    const h = panel.offsetHeight;

    let nextLeft = e.clientX - offsetX;
    let nextTop = e.clientY - offsetY;

    nextLeft = Math.max(8, Math.min(nextLeft, window.innerWidth - w - 8));
    nextTop = Math.max(8, Math.min(nextTop, window.innerHeight - h - 8));

    panel.style.left = `${nextLeft}px`;
    panel.style.top = `${nextTop}px`;
  });

  window.addEventListener("mouseup", () => {
    dragging = false;
    document.body.style.userSelect = "";
  });

  panel.dataset.dragBound = "true";
}

function hasGroupTagApplied(groupId, tagKey, options = {}) {
  const group = groupStore.get(groupId);
  if (!group || !tagKey) return false;

  const edit = ensureEntityEditState?.(group);
  const tags = Array.isArray(edit?.adjustmentTags) ? edit.adjustmentTags : [];

  return tags.some((entry) => {
    if (entry.tag !== tagKey) return false;

    // strictSource가 true일 때만 source까지 비교
    if (options.strictSource) {
      if (options.sourceType && entry.sourceType !== options.sourceType) return false;
      if (options.sourceRef && entry.sourceRef !== options.sourceRef) return false;
    }

    return true;
  });
}

function renderSuggestionDetailExplorer(suggestionId) {
  const sug = findSuggestionById(suggestionId);
  const title = document.getElementById("suggestion-detail-title");
  const body = document.getElementById("suggestion-detail-body");

  if (!sug || !body) return;

  if (title) {
    title.textContent = `${sug.displayTag || sug.suggestedTag || "-"} · ${sug.status || "NEW"}`;
  }

  const isFinal = sug.status === "APPLIED" || sug.status === "DISMISSED";
const canAct = sug.status === "NEW" || sug.status === "SNOOZED";
const statusText =
  sug.status === "APPLIED"
    ? "적용 완료"
    : sug.status === "DISMISSED"
      ? "무시됨"
      : sug.status === "SNOOZED"
        ? "보류 중"
        : "검토 대기";

  body.innerHTML = `
    <section class="suggestion-detail-section">
      <div class="suggestion-detail-section-title">SUMMARY</div>

      <div class="suggestion-detail-grid">
        <div><span>Entity</span><b>${sug.entityType || "-"}:${sug.entityId || "-"}</b></div>
        <div><span>Tag</span><b>${sug.displayTag || sug.suggestedTag || "-"}</b></div>
        <div><span>Category</span><b>${sug.category || "-"}</b></div>
        <div><span>Strength</span><b>${sug.strength || "MID"}</b></div>
        <div><span>Source</span><b>${sug.sourceType || "-"}:${sug.sourceRef || "-"}</b></div>
        <div><span>Status</span><b>${sug.status || "NEW"}</b></div>
      </div>
    </section>

    <section class="suggestion-detail-section">
      <div class="suggestion-detail-section-title">REASON</div>
      <div class="suggestion-detail-reason">${sug.reason || "검토 필요"}</div>
    </section>

    <section class="suggestion-detail-section">
      <div class="suggestion-detail-section-title">PREVIEW DELTA</div>

      <div class="suggestion-detail-delta-list">
        ${
          Array.isArray(sug.previewDeltas) && sug.previewDeltas.length
            ? sug.previewDeltas.map((delta) => `
              <div class="suggestion-detail-delta">
                <b>${delta.target}</b>
                <span>${delta.direction === "up" ? "+" : "-"}${Number(delta.amount || 0).toFixed(3)}</span>
              </div>
            `).join("")
            : `<div class="suggestion-empty">preview 없음</div>`
        }
      </div>
    </section>

    <div class="suggestion-detail-actions">
  ${
    canAct
      ? `
        <button type="button" data-detail-apply-suggestion="${sug.id}">적용</button>
        <button type="button" data-detail-snooze-suggestion="${sug.id}">보류</button>
        <button type="button" data-detail-dismiss-suggestion="${sug.id}">무시</button>
      `
      : `
        <div class="suggestion-detail-status-fixed">
          ${statusText}
        </div>
      `
  }
</div>

  `;

  bindSuggestionDetailActions();
}

function bindSuggestionDetailActions() {
  const body = document.getElementById("suggestion-detail-body");
  if (!body) return;

body.querySelectorAll("[data-detail-apply-suggestion]").forEach((btn) => {
  btn.onclick = () => {
    const suggestionId = btn.dataset.detailApplySuggestion;
    const result = applySuggestion(suggestionId);

    if (!result) {
      btn.disabled = false;
      btn.textContent = "적용 실패";
      setTimeout(() => {
        btn.textContent = "적용";
      }, 900);
      return;
    }

    renderSuggestionDetailExplorer(suggestionId);
    renderSuggestionToasts?.();
    renderUnreadMessageExplorer?.();
    renderSuggestionInboxExplorer?.();
  };
});

  body.querySelectorAll("[data-detail-snooze-suggestion]").forEach((btn) => {
    btn.onclick = () => {
      snoozeSuggestion(btn.dataset.detailSnoozeSuggestion);
      renderSuggestionDetailExplorer(btn.dataset.detailSnoozeSuggestion);
      renderSuggestionToasts?.();
    };
  });

  body.querySelectorAll("[data-detail-dismiss-suggestion]").forEach((btn) => {
    btn.onclick = () => {
      dismissSuggestion(btn.dataset.detailDismissSuggestion);
      renderSuggestionDetailExplorer(btn.dataset.detailDismissSuggestion);
      renderSuggestionToasts?.();
    };
  });
}

function ensureSuggestionScanDetailState() {
  const state = ensureSuggestionMaintenanceState();

  if (!state.scanDetail || typeof state.scanDetail !== "object") {
    state.scanDetail = {
      open: false,
      entityType: "GROUP",
      selectedKey: null
    };
  }

  return state.scanDetail;
}

function openSuggestionScanDetailOverlay() {
  const detailState = ensureSuggestionScanDetailState();
  detailState.open = true;

  const preview = buildSuggestionMaintenancePreview();
  const rows = getSuggestionScanDetailRows(preview, detailState.entityType);

  if (!detailState.selectedKey || !rows.some((row) => row.key === detailState.selectedKey)) {
    detailState.selectedKey = rows[0]?.key || null;
  }

  renderSuggestionMaintenanceExplorer(preview);
  saveLabState?.();
}

function closeSuggestionScanDetailOverlay() {
  const detailState = ensureSuggestionScanDetailState();
  detailState.open = false;
  saveLabState?.();

  const preview = buildSuggestionMaintenancePreview();
  renderSuggestionMaintenanceExplorer(preview);
}

function getSuggestionScanDetailRows(preview, entityType = "GROUP") {
  const rows = Array.isArray(preview?.candidateRows) ? preview.candidateRows : [];

  return rows
    .filter((row) => {
      if (entityType === "ALL") return true;
      return (row.entityType || "GROUP") === entityType;
    })
    .map((row) => ({
      ...row,
      key: [
        row.entityType || "GROUP",
        row.groupId || row.entityId,
        row.suggestedTag,
        row.ruleId
      ].join(":")
    }));
}

function getSuggestionTargetMetricSnapshot(target) {
  if (!target) {
    return {
      before: {},
      manualAfter: {},
      suggestionAfter: {}
    };
  }

  let before = {};

  if (target.rows?.[0]?.previewBefore) {
    before = target.rows[0].previewBefore;
  } else if (target.entityType === "GROUP") {
    const group = groupStore.get(target.entityId);
    before = group ? getBaseMetricsForGroup(group) : {};
  }

  const manualAfter = applyManualDeltasToMetrics(before, target);

  const suggestionAfter = target.hasSuggestion
    ? applySuggestionRowsToMetrics(manualAfter, target.rows || [])
    : { ...manualAfter };

  return {
    before,
    manualAfter,
    suggestionAfter
  };
}

function applySuggestionRowsToMetrics(baseMetrics = {}, rows = []) {
  const result = { ...baseMetrics };

  rows.forEach((row) => {
    const deltas = Array.isArray(row.previewDeltas) ? row.previewDeltas : [];

    deltas.forEach((delta) => {
      const key = delta.target;
      if (!key) return;

      const base = Number(result[key] || 0);
      const amount = getDeltaAmount(delta);

      result[key] = clampMetricValue(base + amount);
    });
  });

  return result;
}

function getDeltaAmount(delta) {
  const raw = Number(delta?.amount ?? delta?.max ?? delta?.min ?? 0);
  if (!Number.isFinite(raw)) return 0;

  if (delta.direction === "down") return -Math.abs(raw);
  if (delta.direction === "up") return Math.abs(raw);

  return raw;
}

function clampMetricValue(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;

  return Math.max(0, Math.min(1, n));
}

function renderSuggestionStageDetailOverlay(preview) {
  const detailState = ensureSuggestionScanDetailState();
  const stageState = detailState.stageDetail || {};

  if (!stageState.open) return "";

  const targets = getSuggestionScanTargetRows(preview, detailState.entityType || "GROUP");
  const selected = targets.find((target) => target.key === detailState.selectedKey);

  if (!selected) return "";

  const rows = selected.rows || [];

  const title =
    stageState.stage === "manual"
      ? "내 수정 값 상세"
      : "제안 반영 값 상세";

  const deltas =
    stageState.stage === "manual"
      ? collectManualDeltasForTarget(selected)
      : collectSuggestionDeltasForTarget(selected);

  return `
    <div class="suggestion-stage-detail-overlay">
      <div class="suggestion-stage-detail-head">
        <div>
          <div class="suggestion-stage-detail-kicker">${title}</div>
          <div class="suggestion-stage-detail-title">${selected.label}</div>
        </div>

        <button id="btn-close-suggestion-stage-detail" type="button">닫기</button>
      </div>

      <div class="suggestion-stage-detail-body">
        ${
          deltas.length
            ? deltas.map((item) => `
              <div class="suggestion-stage-detail-row">
                <div>
                  <b>${item.tag}</b>
                  <span>${item.source || "-"}</span>
                </div>

                <em>${item.metric} ${item.delta >= 0 ? "+" : ""}${Number(item.delta).toFixed(3)}</em>
              </div>
            `).join("")
            : `<div class="suggestion-scan-detail-empty">표시할 변화가 없습니다.</div>`
        }
      </div>
    </div>
  `;
}

function collectSuggestionDeltasForTarget(target) {
  const result = [];

  (target.rows || []).forEach((row) => {
    const tag = row.displayTag || getSuggestionDisplayTag(row.suggestedTag);

    (row.previewDeltas || []).forEach((delta) => {
      result.push({
        tag,
        source: row.ruleId || row.sourceRef || "-",
        metric: delta.target || "-",
        delta: getDeltaAmount(delta)
      });
    });
  });

  return result;
}

function collectManualDeltasForGroup(groupId) {
  const group = groupStore.get(groupId);
  if (!group) return [];

  const edit = ensureEntityEditState?.(group);
  const tags = Array.isArray(edit?.adjustmentTags) ? edit.adjustmentTags : [];

  const result = [];

  tags.forEach((entry) => {
    const rule = findEntityTagRule?.("GROUP", entry.tag);
    const effects = Array.isArray(entry.effects)
      ? entry.effects
      : Array.isArray(rule?.effects)
        ? rule.effects
        : [];

    effects.forEach((effect) => {
      result.push({
        tag: entry.displayTag || getSuggestionDisplayTag(entry.tag) || entry.tag,
        source: entry.sourceType
          ? `${entry.sourceType}:${entry.sourceRef || "-"}`
          : entry.sourceRef || "-",
        metric: effect.target || entry.target || "-",
        delta: getDeltaAmount(effect)
      });
    });
  });

  return result;
}

function collectManualDeltasForTarget(target) {
  if (!target) return [];

  if (target.entityType === "GROUP") {
    return collectManualDeltasForGroup(target.entityId);
  }

  return [];
}

function applyManualDeltasToMetrics(baseMetrics = {}, target) {
  const result = { ...baseMetrics };
  const deltas = collectManualDeltasForTarget(target);

  deltas.forEach((item) => {
    const key = item.metric;
    if (!key || key === "-") return;

    const base = Number(result[key] || 0);
    const next = base + Number(item.delta || 0);

    result[key] = clampMetricValue(next);
  });

  return result;
}

function getBaseMetricsForGroup(group) {
  const meta = getGroupCardMeta?.(group) || {};

  return {
    purity: Number(meta.purityScore || meta.purity || 0),
    contamination: Number(meta.contaminationScore || meta.contamination || 0),
    importance: Number(meta.importanceScore || meta.importance || 0),
    confidence: Number(meta.confidenceScore || meta.confidence || 0),
    g: Number(meta.gScore || meta.g || 0)
  };
}

function getSuggestionScanTargetRows(preview, entityType = "GROUP") {
  const candidateRows = Array.isArray(preview?.candidateRows)
    ? preview.candidateRows
    : [];

  const map = new Map();

  // 1) 제안 후보가 있는 대상
  candidateRows.forEach((row) => {
    const targetType = row.entityType || "GROUP";
    if (entityType !== "ALL" && targetType !== entityType) return;

    const targetId = row.groupId || row.entityId;
    if (!targetId) return;

    const key = `${targetType}:${targetId}`;

    if (!map.has(key)) {
      map.set(key, {
        key,
        entityType: targetType,
        entityId: targetId,
        label: row.groupLabel || row.entityLabel || targetId,
        rows: [],
        hasSuggestion: false,
        hasManualTags: false
      });
    }

    const target = map.get(key);
    target.rows.push(row);
    target.hasSuggestion = true;
  });

  // 2) 제안은 없지만 수동 태그가 있는 GROUP
  if (entityType === "ALL" || entityType === "GROUP") {
    [...groupStore.values()].forEach((group) => {
      const edit = ensureEntityEditState?.(group);
      const manualTags = Array.isArray(edit?.adjustmentTags)
        ? edit.adjustmentTags
        : [];

      if (!manualTags.length) return;

      const key = `GROUP:${group.id}`;

      if (!map.has(key)) {
        map.set(key, {
          key,
          entityType: "GROUP",
          entityId: group.id,
          label: group.name || group.label || group.id,
          rows: [],
          hasSuggestion: false,
          hasManualTags: true
        });
      } else {
        map.get(key).hasManualTags = true;
      }
    });
  }

  return [...map.values()].sort((a, b) => {
    if (a.hasSuggestion !== b.hasSuggestion) {
      return a.hasSuggestion ? -1 : 1;
    }

    if (a.hasManualTags !== b.hasManualTags) {
      return a.hasManualTags ? -1 : 1;
    }

    return String(a.label || "").localeCompare(String(b.label || ""));
  });
}

function renderSuggestionScanDetailOverlay(preview) {
  const detailState = ensureSuggestionScanDetailState();
  if (!detailState.open) return "";

  const entityType = detailState.entityType || "GROUP";
  const targets = getSuggestionScanTargetRows(preview, entityType);

  const selected =
    targets.find((target) => target.key === detailState.selectedKey) ||
    targets[0] ||
    null;

  if (!detailState.selectedKey && selected) {
    detailState.selectedKey = selected.key;
  }

  return `
    <div class="suggestion-scan-detail-overlay simple">
      <div class="suggestion-scan-detail-head">
        <div>
          <div class="suggestion-scan-detail-kicker">SCAN PREVIEW</div>
          <div class="suggestion-scan-detail-title">대상별 변수 비교</div>
        </div>

        <div class="suggestion-scan-detail-tools">
          <select id="suggestion-scan-detail-type">
            <option value="ALL" ${entityType === "ALL" ? "selected" : ""}>ALL</option>
            <option value="GROUP" ${entityType === "GROUP" ? "selected" : ""}>GROUP</option>
            <option value="EVT" ${entityType === "EVT" ? "selected" : ""}>EVT</option>
            <option value="LAYER" ${entityType === "LAYER" ? "selected" : ""}>LAYER</option>
            <option value="PATTERN" ${entityType === "PATTERN" ? "selected" : ""}>PATTERN</option>
          </select>

          <button id="btn-close-suggestion-scan-detail" type="button">닫기</button>
        </div>
      </div>

      <div class="suggestion-scan-detail-body simple">
        <aside class="suggestion-target-list">
          ${
            targets.length
              ? targets.map((target) => `
                <button
                  type="button"
                  class="suggestion-target-item ${selected?.key === target.key ? "active" : ""}"
                  data-scan-detail-key="${target.key}"
                >
                  <b>${target.label}</b>
                  <span>${target.entityType}:${target.entityId}</span>
                  <em>
  ${
    target.hasSuggestion
      ? `${target.rows.length} 제안`
      : "수동 태그"
  }
</em>

                </button>
              `).join("")
              : `<div class="suggestion-scan-detail-empty">적합한 대상이 없습니다.</div>`
          }
        </aside>

        <main class="suggestion-target-panel">
          ${
            selected
              ? renderSuggestionTargetMetricPanel(selected)
              : `<div class="suggestion-scan-detail-empty">선택된 대상 없음</div>`
          }
        </main>
      </div>
      ${renderSuggestionStageDetailOverlay(preview)}

    </div>
  `;
}

function ensureSuggestionToastHiddenIds() {
  if (!Array.isArray(uiState.suggestionToastHiddenIds)) {
    uiState.suggestionToastHiddenIds = [];
  }

  return uiState.suggestionToastHiddenIds;
}

function isSuggestionToastHidden(suggestionId) {
  return ensureSuggestionToastHiddenIds().includes(suggestionId);
}

function hideSuggestionToast(suggestionId) {
  if (!suggestionId) return;

  const hiddenIds = ensureSuggestionToastHiddenIds();

  if (!hiddenIds.includes(suggestionId)) {
    hiddenIds.push(suggestionId);
  }

  saveLabState?.();
  renderSuggestionToasts?.();
}

function restoreHiddenSuggestionToasts() {
  uiState.suggestionToastHiddenIds = [];
  saveLabState?.();
  renderSuggestionToasts();
}

function getNewSuggestionsForToast() {
  return ensureSuggestionState()
    .filter((item) => item.status === "NEW")
    .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
}

function getVisibleNewSuggestionsForToast() {
  const hiddenIds = new Set(ensureSuggestionToastHiddenIds());

  return getNewSuggestionsForToast()
    .filter((item) => !hiddenIds.has(item.id))
    .slice(0, 5);
}

function getUnreadMessageCountForBadge() {
  const allNew = getNewSuggestionsForToast();
  const visible = getVisibleNewSuggestionsForToast();
  const visibleIds = new Set(visible.map((item) => item.id));

  return allNew.filter((item) => !visibleIds.has(item.id)).length;
}

function renderSuggestionToasts() {
  const stack = ensureSuggestionToastStackEl();
  const hiddenBadge = ensureHiddenSuggestionToastBadgeEl();

  const visibleItems = getVisibleNewSuggestionsForToast();
  const unreadMessageCount = getUnreadMessageCountForBadge();

  stack.innerHTML = visibleItems.map((suggestion) => `
    <button
      type="button"
      class="suggestion-toast"
      data-suggestion-toast-id="${suggestion.id}"
      title="좌클릭: 열기 / 우클릭: 가리기"
    >
      <div class="suggestion-toast-title">제안!</div>
      <div class="suggestion-toast-body">
        ${suggestion.displayTag || suggestion.suggestedTag || "-"} · ${suggestion.reason || "검토 필요"}
      </div>
    </button>
  `).join("");

stack.querySelectorAll("[data-suggestion-toast-id]").forEach((toast) => {
  toast.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    const suggestionId = toast.dataset.suggestionToastId;
    if (!suggestionId) return;

    openSuggestionDetailExplorer?.(suggestionId);
    renderSuggestionToasts?.();
  });

  toast.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    e.stopPropagation();

    const suggestionId = toast.dataset.suggestionToastId;
    if (!suggestionId) return;

    hideSuggestionToast(suggestionId);
  });
});

hiddenBadge.classList.remove("hidden");

if (unreadMessageCount > 0) {
  hiddenBadge.textContent = `읽지 않은 message +${unreadMessageCount}`;
  hiddenBadge.classList.add("has-unread");
} else {
  hiddenBadge.textContent = "message";
  hiddenBadge.classList.remove("has-unread");
}

}

function ensureUnreadMessageExplorerEl() {
  let overlay = document.getElementById("unread-message-overlay");
  let panel = document.getElementById("unread-message-explorer");

  if (overlay && panel) {
    return { overlay, panel };
  }

  overlay = document.createElement("div");
  overlay.id = "unread-message-overlay";
  overlay.className = "unread-message-overlay hidden";

  panel = document.createElement("div");
  panel.id = "unread-message-explorer";
  panel.className = "unread-message-explorer hidden";

  panel.innerHTML = `
    <div class="unread-message-head">
      <div>
<div class="unread-message-kicker">MESSAGE CENTER</div>
<div class="unread-message-title">message</div>

      </div>

      <button id="btn-close-unread-message-explorer" type="button">
        닫기
      </button>
    </div>

    <div class="unread-message-layout">
      <aside class="unread-message-category-list">
        <button
          type="button"
          class="unread-message-category active"
          data-unread-message-category="suggestion"
        >
          <b>제안!</b>
          <span id="unread-message-suggestion-count">0</span>
        </button>
      </aside>

      <main id="unread-message-body" class="unread-message-body"></main>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(panel);

  const closeBtn = panel.querySelector("#btn-close-unread-message-explorer");
  if (closeBtn) {
    closeBtn.onclick = () => closeUnreadMessageExplorer();
  }

  makeUnreadMessageExplorerDraggable(panel);

panel.querySelectorAll("[data-unread-message-category]").forEach((btn) => {
  btn.onclick = () => {
    const category = btn.dataset.unreadMessageCategory || "suggestion";

    panel.querySelectorAll("[data-unread-message-category]").forEach((node) => {
      node.classList.toggle("active", node === btn);
    });

    panel.dataset.activeCategory = category;

    if (category === "suggestion") {
      openSuggestionInboxExplorer?.("new");
      return;
    }

    renderUnreadMessageExplorer();
  };
});

  panel.dataset.activeCategory = "suggestion";

  return { overlay, panel };
}

function makeUnreadMessageExplorerDraggable(panel) {
  if (!panel || panel.dataset.dragBound === "true") return;

  const head = panel.querySelector(".unread-message-head");
  if (!head) return;

  let dragging = false;
  let offsetX = 0;
  let offsetY = 0;

  head.addEventListener("mousedown", (e) => {
    if (e.target.closest("button")) return;

    dragging = true;

    const rect = panel.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    panel.style.right = "auto";
    panel.style.left = `${rect.left}px`;
    panel.style.top = `${rect.top}px`;
    panel.style.transform = "none";

    document.body.style.userSelect = "none";
  });

  window.addEventListener("mousemove", (e) => {
    if (!dragging) return;

    const w = panel.offsetWidth;
    const h = panel.offsetHeight;

    let nextLeft = e.clientX - offsetX;
    let nextTop = e.clientY - offsetY;

    nextLeft = Math.max(8, Math.min(nextLeft, window.innerWidth - w - 8));
    nextTop = Math.max(8, Math.min(nextTop, window.innerHeight - h - 8));

    panel.style.left = `${nextLeft}px`;
    panel.style.top = `${nextTop}px`;
  });

  window.addEventListener("mouseup", () => {
    dragging = false;
    document.body.style.userSelect = "";
  });

  panel.dataset.dragBound = "true";
}

function openUnreadMessageExplorer() {
  const { overlay, panel } = ensureUnreadMessageExplorerEl();

  overlay.classList.remove("hidden");
  panel.classList.remove("hidden");

  renderUnreadMessageExplorer();
}

function closeUnreadMessageExplorer() {
  const overlay = document.getElementById("unread-message-overlay");
  const panel = document.getElementById("unread-message-explorer");

  overlay?.classList.add("hidden");
  panel?.classList.add("hidden");
}

function getUnreadSuggestionMessages() {
  const visibleToastIds = new Set(
    getVisibleNewSuggestionsForToast().map((item) => item.id)
  );

  return getNewSuggestionsForToast().filter((item) => {
    return isSuggestionToastHidden(item.id) || !visibleToastIds.has(item.id);
  });
}

function renderUnreadMessageExplorer() {
  const panel = document.getElementById("unread-message-explorer");
  const body = document.getElementById("unread-message-body");
  const countEl = document.getElementById("unread-message-suggestion-count");

  if (!panel || !body) return;

  const category = panel.dataset.activeCategory || "suggestion";
  const suggestions = getUnreadSuggestionMessages();

  updateUnreadMessageExplorerTitle?.();

  if (countEl) {
    countEl.textContent = String(suggestions.length);
  }

  if (category !== "suggestion") {
    body.innerHTML = `<div class="unread-message-empty">아직 지원하지 않는 분류입니다.</div>`;
    return;
  }

  if (!suggestions.length) {
    body.innerHTML = `<div class="unread-message-empty">읽지 않은 제안이 없습니다.</div>`;
    return;
  }

  body.innerHTML = suggestions.map((sug) => `
    <button
      type="button"
      class="unread-suggestion-row"
      data-open-suggestion-detail="${sug.id}"
    >
      <div>
        <b>${sug.displayTag || sug.suggestedTag || "-"}</b>
        <span>${sug.reason || "검토 필요"}</span>
        <small>${sug.entityType || "GROUP"}:${sug.entityId || "-"}</small>
      </div>

      <em>${sug.status || "NEW"}</em>
    </button>
  `).join("");

  body.querySelectorAll("[data-open-suggestion-detail]").forEach((btn) => {
    btn.onclick = () => {
      const suggestionId = btn.dataset.openSuggestionDetail;
      if (!suggestionId) return;

      openSuggestionDetailExplorer(suggestionId);
    };
  });
}

function showSuggestionToast(suggestion) {
  renderSuggestionToasts();
}

function buildSetLetterByIndex(index = 0) {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const base = index % 26;
  const cycle = Math.floor(index / 26);
  return cycle === 0 ? letters[base] : `${letters[base]}${cycle}`;
}

function buildNextLayerSetName() {
  const sets = Array.isArray(uiState.layerSets) ? uiState.layerSets : [];
  let index = 0;

  while (true) {
    const name = `집합 ${buildSetLetterByIndex(index)}`;
    const exists = sets.some((set) => String(set?.name || "") === name);
    if (!exists) return name;
    index += 1;
  }
}

function buildNextLayerSetDisplayName() {
  return buildNextLayerSetName();
}

function openLayerSetCreateModal(parentSetId = null) {
  const nextName = buildNextLayerSetDisplayName();

  uiState.setCreateModal = {
    open: true,
    parentSetId,
    pendingName: nextName
  };

  if (!els.layerSetCreateModal || !els.layerSetCreateModalMessage) return;

  els.layerSetCreateModalMessage.textContent = `"${nextName}"을 생성하시겠습니까?`;
  els.layerSetCreateModal.classList.remove("hidden");
}

function closeLayerSetCreateModal() {
  uiState.setCreateModal = {
    open: false,
    parentSetId: null,
    pendingName: null
  };

  if (els.layerSetCreateModal) {
    els.layerSetCreateModal.classList.add("hidden");
  }
}

function snapshotPatternLinkWorkspace() {
  const ws = getPatternLinkWorkspace();

  const snapshot = {
    layer: ws.loadedLayerName,
    hiddenNodes: [...ws.hiddenNodeIds],
    hiddenEdges: [...ws.hiddenEdgeIds],
    dimMode: ws.dimMode,
    focusNode: ws.autoFocusNodeId,
    focusEdge: ws.autoFocusEdgeId,
    time: Date.now()
  };

  pushLog({
    type: "PL_SNAPSHOT",
    summary: `[PL] snapshot saved`,
    data: snapshot
  });
}

async function flushLogsToServer() {
  const queue = uiState.unsentLogs || [];
  if (!queue.length) return;

  const target = queue.filter((log) => !log.sent);
  if (!target.length) return;

  // TODO: 서버 붙을 때 여기서 fetch 사용
  console.log("SEND_LOGS_TO_SERVER", target);

  target.forEach((item) => {
    item.sent = true;
  });

  uiState.unsentLogs = uiState.unsentLogs.filter((item) => !item.sent);
  saveLabState();
}

function normalizeTagKey(raw = "") {
  return String(raw || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/[^A-Z0-9_]/g, "");
}

function createCustomGroupTagCategoryFromForm() {
  const rawKey = document.getElementById("group-category-create-key")?.value || "";
  const label = document.getElementById("group-category-create-label")?.value || "";

  const categoryKey = normalizeTagKey(rawKey);
  if (!categoryKey) return null;

  if (ENTITY_TAG_RULES.GROUP[categoryKey]) {
    console.warn("Category already exists:", categoryKey);
    refreshGroupTagCreateCategorySelect(categoryKey);
    return {
      key: categoryKey,
      existed: true
    };
  }

  if (!ENTITY_TAG_RULES.GROUP[categoryKey]) {
    ENTITY_TAG_RULES.GROUP[categoryKey] = {};
  }

  const custom = ensureCustomTagRulesState();
  if (!custom.GROUP[categoryKey]) {
    custom.GROUP[categoryKey] = {};
  }

  if (!uiState.customTagCategoryLabels) {
    uiState.customTagCategoryLabels = {};
  }

  uiState.customTagCategoryLabels[categoryKey] = label || categoryKey;

  saveLabState?.();
  refreshGroupTagCreateCategorySelect(categoryKey);

  return {
    key: categoryKey,
    label: label || categoryKey
  };
}

function deleteCustomGroupTagCategory(categoryKey) {
  if (!categoryKey) return false;

  if (isBaseGroupTagCategory(categoryKey)) {
    console.warn("Base category cannot be deleted:", categoryKey);
    return false;
  }

  const custom = ensureCustomTagRulesState();
  const customRules = custom.GROUP?.[categoryKey] || {};
  const customTagCount = Object.keys(customRules).length;

  if (customTagCount > 0) {
    console.warn("Category has custom tags. Delete tags first:", {
      categoryKey,
      customTagCount
    });
    return false;
  }

  delete custom.GROUP[categoryKey];

  if (ENTITY_TAG_RULES.GROUP[categoryKey]) {
    delete ENTITY_TAG_RULES.GROUP[categoryKey];
  }

  if (uiState.customTagCategoryLabels) {
    delete uiState.customTagCategoryLabels[categoryKey];
  }

  saveLabState?.();
  refreshGroupTagCreateCategorySelect("GROUP_STRUCTURE");

  return true;
}

function addLog(type, payload) {
  if (!uiState.logs) uiState.logs = [];

  const entry = {
    id: "LOG-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
    ts: Date.now(),
    type,
    scope: "SYSTEM",
    summary: typeof payload === "string" ? payload : JSON.stringify(payload),
    payload
  };

  uiState.logs.unshift(entry);

  if (uiState.logs.length > 300) {
    uiState.logs = uiState.logs.slice(0, 300);
  }

  renderLog();
  saveLabState();
}

function formatLogTime(ts) {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

function renderLog() {
  const body = document.getElementById("log-body");
  if (!body) return;

  const logs = uiState.logs || [];

  if (!logs.length) {
    body.innerHTML = `<div class="empty-state">기록 없음</div>`;
    return;
  }

  body.innerHTML = logs
    .map((item) => {
      const text = typeof item === "string" ? item : item.summary || item.message || "-";
      const scope = typeof item === "string" ? "LOG" : item.scope || "LOG";
      const time = typeof item === "string" ? "" : formatLogTime(item.ts || Date.now());

      return `
        <div class="log-row">
          <span class="log-time">${time}</span>
          <span class="log-scope">[${scope}]</span>
          <span class="log-text">${text}</span>
        </div>
      `;
    })
    .join("");
}

function renderLogExplorer() {
  if (!els.logExplorerResults) return;

  const logs = getFilteredLogs();

  const filterBtns = document.querySelectorAll(".log-filter-btn");
  filterBtns.forEach((btn) => {
    btn.classList.toggle(
      "active",
      btn.dataset.logScope === uiState.logExplorerScope
    );
  });

  if (els.logSearchInput) {
    els.logSearchInput.value = uiState.logExplorerQuery || "";
  }

  if (!logs.length) {
    els.logExplorerResults.innerHTML = `
      <div class="empty-state">기록 없음</div>
    `;
    return;
  }

  els.logExplorerResults.innerHTML = logs
    .map((log) => {
      const type = log.type || (
        log.message?.includes("[TIMELINE]") ? "timeline" :
        log.message?.includes("[EVENT]") ? "event" :
        log.message?.includes("[GROUP]") ? "group" :
        log.message?.includes("[LAYER]") ? "layer" :
        log.message?.includes("[MODE]") ? "mode" :
        log.message?.includes("[GRAPH]") ? "graph" :
        log.message?.includes("[PATTERN]") ? "pattern" :
        "general"
      );

      return `
        <div class="log-explorer-item${uiState.selectedLogId === log.id ? " active" : ""}" data-log-id="${log.id}">
          <div class="log-explorer-item-head">
            <span class="log-explorer-time">${formatLogExplorerTime(log.ts)}</span>
            <span class="log-explorer-scope">[${log.scope || "SYSTEM"}]</span>
            <span class="log-explorer-type">${type || "-"}</span>
          </div>
          <div class="log-explorer-summary">${log.summary || log.message || "-"}</div>
          <div class="log-explorer-ref">ref: ${log.refId || "-"}</div>
        </div>
      `;
    })
    .join("");

  const items = els.logExplorerResults.querySelectorAll(".log-explorer-item");
items.forEach((item) => {
  item.onclick = () => {
    const id = item.dataset.logId;
    uiState.selectedLogId = id;
    renderLogExplorer();
  };
});
}
/*
function focusLogTarget(log) {
  if (!log) return;

  const refId = log.refId;
  if (!refId) return;

  if (log.scope === "EVENT") {
    if (window.cy) {
      const node = cy.getElementById(refId);
      if (node && node.length > 0) {
        enterEventEditor(refId);
        cy.animate({
          fit: { eles: node, padding: 80 },
          duration: 250
        });
      }
    }
    return;
  }

  if (log.scope === "GROUP") {
    if (groupStore.has(refId)) {
      selectGroup(refId);
    }
    return;
  }

  if (log.scope === "LAYER") {
    const layer = (uiState.savedLayers || []).find((l) => l.name === refId);
    if (layer) {
      uiState.currentLayerName = layer.name;
      uiState.currentLayerFilter = layer.filter
        ? { ...layer.filter }
        : { rotMin: null, capMax: null, varMin: null };

      refreshGraphState();
      renderLayerPanel();
      renderLayerMetaFields();
      renderSideMiniStatus();
    }
    return;
  }

  if (log.scope === "TIMELINE") {
    openTimelineExplorer();
  }
}
*/
function openLogExplorer() {
  if (!els.logExplorer) return;
  els.logExplorer.classList.remove("hidden");
  renderLogExplorer();
}

function closeLogExplorer() {
  if (!els.logExplorer) return;
  els.logExplorer.classList.add("hidden");
}

function selectEvent(eventId, shouldPush = true) {
  if (shouldPush && uiState.selectedGroup) {
    pushState("eventView", { group: uiState.selectedGroup, eventId });
  }

  uiState.selectedEventId = eventId;
  uiState.selectedEvent = getEventById(eventId) || null;

  const relatedPatterns = buildPatternCandidatesFromEvent(eventId);
  renderPatternCandidates(relatedPatterns);

  renderEventDetail(eventId);

  refreshGraphState();

  renderDebugStatus();
  saveLabState();
  renderFocusHeader();
  renderDetailPanel();
  renderPatternLinkPanel();
}

function getNodeTimeValue(node) {
  if (!node) return Number.MAX_SAFE_INTEGER;

  const candidates = [
    node.data("time"),
    node.data("date"),
    node.data("timestamp"),
    node.data("createdAt"),
    node.data("occurredAt")
  ];

  for (const value of candidates) {
    if (value === null || value === undefined || value === "") continue;

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    const parsed = Date.parse(String(value));
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  return Number.MAX_SAFE_INTEGER;
}

function renderLayerExplorerTimeView() {
  const mode = uiState.layerExplorerState?.timeViewMode || "month";

  if (mode === "day") {
    renderLayerExplorerDayView?.();
    return;
  }

  renderLayerExplorerMonthView?.();
}

function formatLogExplorerTime(ts) {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

function normalizeEdge(edge) {
  const rule = EDGE_RULES[edge.type] || {};

  return {
    ...edge,
    directed: rule.directed ?? false,
    temporary: rule.temporary ?? false
  };
}

function normalizeLogScope(value) {
  return String(value || "")
    .trim()
    .toUpperCase();
}

function getFilteredLogs() {
  let logs = (uiState.logs || []).slice();

  logs = logs.map((log, index) => {
    const summary = String(log.summary || log.message || "");
    const summaryUpper = summary.toUpperCase();

    const inferredScope =
      summaryUpper.includes("[TIMELINE]") ? "TIMELINE" :
      summaryUpper.includes("[EVENT]") ? "EVENT" :
      summaryUpper.includes("[GROUP]") ? "GROUP" :
      summaryUpper.includes("[LAYER]") ? "LAYER" :
      summaryUpper.includes("[MODE]") ? "MODE" :
      summaryUpper.includes("[GRAPH]") ? "GRAPH" :
      summaryUpper.includes("[PATTERN]") ? "PATTERN" :
      summaryUpper.includes("[COMMAND]") ? "SYSTEM" :
      null;

    const inferredType =
      summaryUpper.includes("생성") ? "CREATE" :
      summaryUpper.includes("수정") ? "UPDATE" :
      summaryUpper.includes("삭제") ? "DELETE" :
      summaryUpper.includes("열림") ? "OPEN" :
      summaryUpper.includes("닫힘") ? "CLOSE" :
      summaryUpper.includes("재생 시작") ? "PLAY" :
      summaryUpper.includes("정지") ? "STOP" :
      summaryUpper.includes("다음 이벤트") ? "STEP_FORWARD" :
      summaryUpper.includes("이전 이벤트") ? "STEP_BACKWARD" :
      summaryUpper.includes("처음으로") ? "RESET" :
      summaryUpper.includes("선택 해제") ? "CLEAR" :
      summaryUpper.includes("선택") ? "SELECT" :
      summaryUpper.includes("임시 저장") ? "SAVE" :
      null;

    return {
      id: log.id || `LOG-${index}`,
      ts: log.ts || Date.now(),
      type: inferredType || log.type || "GENERIC",
      level: log.level || "info",
      scope: inferredScope || log.scope || "SYSTEM",
      refId: log.refId || null,
      summary: summary || "-",
      payload: log.payload ?? null,
      source: log.source || "ui",
      sent: log.sent ?? false
    };
  });

  const wantedScope = String(uiState.logExplorerScope || "ALL").toUpperCase();

  if (wantedScope !== "ALL") {
    logs = logs.filter((log) => String(log.scope || "").toUpperCase() === wantedScope);
  }

  const q = String(uiState.logExplorerQuery || "").trim().toLowerCase();
  if (q) {
    logs = logs.filter((log) => {
      const haystack = [
        log.summary || "",
        log.type || "",
        log.scope || "",
        log.refId || "",
        JSON.stringify(log.payload || {})
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }

  if (uiState.logExplorerRecentOnly) {
    logs = logs.slice(0, 20);
  }

  return logs;
}

function clearSavedLabState() {
  try {
    localStorage.removeItem(STORAGE_KEYS.ui);
    localStorage.removeItem(STORAGE_KEYS.memory);
  } catch (err) {
    console.warn("clearSavedLabState failed:", err);
  }
}

function renderLogPreview() {
  const panel = document.getElementById("debug-note-body");
  if (!panel) return;

  const recent = (uiState.logs || []).slice(0, 5);

  let html = `<br><b>Recent Logs</b><br>`;

  recent.forEach((log) => {
    const time = new Date(log.ts || Date.now()).toLocaleTimeString();
    const type = log.type || "LOG";
    const text = log.summary || log.message || "-";

    html += `${time} - ${type} - ${text}<br>`;
  });

  panel.innerHTML += html;
}

function enterPatternLinkPage() {

    const ws = getPatternLinkWorkspace();

  snapshotPatternLinkSourceState();

  uiState.page = "pattern-link";
  document.body.dataset.page = "pattern-link";

  console.log("ENTER PL PAGE HARD TEST");

if (els.patternLinkListBox) {
  els.patternLinkListBox.innerHTML = `
    <div style="padding:12px; border:2px solid red; font-weight:700;">
      HARD TEST: enterPatternLinkPage reached
    </div>
  `;
}

if (els.patternLinkFocusGroup) {
  els.patternLinkFocusGroup.textContent = "그룹: HARD TEST";
}

  renderPatternLinkFocusHeader();
  renderPatternLinkDetail();

const hasSavedWorkspace =
  !!ws.active ||
  !!ws.loadedLayerName ||
  (ws.hiddenNodeIds instanceof Set && ws.hiddenNodeIds.size > 0) ||
  (ws.hiddenEdgeIds instanceof Set && ws.hiddenEdgeIds.size > 0) ||
  !!ws.dimMode ||
  (ws.dimmedNodeIds instanceof Set && ws.dimmedNodeIds.size > 0) ||
  (ws.dimmedEdgeIds instanceof Set && ws.dimmedEdgeIds.size > 0) ||
  !!ws.lockedFocusNodeId ||
  !!ws.lockedFocusEdgeId;

if (!hasSavedWorkspace) {
  ws.hideMode = null;
  ws.tempEdgeMode = false;
  ws.dimMode = false;

  ws.hiddenNodeIds = new Set();
  ws.hiddenEdgeIds = new Set();
  ws.dimmedNodeIds = new Set();
  ws.dimmedEdgeIds = new Set();

  ws.tempEdgeIds = [];
  ws.tempEdgeChain = [];
} else {
  ws.tempEdgeMode = false;
  ws.tempEdgeIds = [];
  ws.tempEdgeChain = [];
  ws.tempEdgeEditorEdgeId = null;
}

buildPatternLinkWorkspaceGraph();

applyActiveGroupsToPatternLinkPage?.();

renderPatternLinkWorkspaceStatus();
renderPatternLinkFocusHeader();
renderPatternLinkDetail();
renderPatternLinkLayerOptions();
renderPatternLinkPanel?.();

saveLabState?.();

const plPage = document.getElementById("pattern-link-page");

if (plPage && plPage.dataset.clickDebugBound !== "true") {
  plPage.addEventListener(
    "click",
    (e) => {
      console.log("PL PAGE CAPTURE CLICK", {
        target: e.target,
        id: e.target?.id || null,
        className: e.target?.className || null,
        groupId: e.target.closest?.("[data-plp-group-id]")?.dataset?.plpGroupId || null,
        eventId: e.target.closest?.("[data-plp-event-id]")?.dataset?.plpEventId || null
      });
    },
    true
  );

  plPage.dataset.clickDebugBound = "true";
}

}

function openPatternMiniExplorer() {
  if (!els.patternMiniExplorer) return;

  uiState.patternExplorerMode = true;
  els.patternMiniExplorer.classList.remove("hidden");
  document.body.classList.add("pattern-explorer-mode");

  renderPatternMiniExplorer();
}

function closePatternMiniExplorer() {
  if (!els.patternMiniExplorer) return;

  uiState.patternExplorerMode = false;
  els.patternMiniExplorer.classList.add("hidden");
  document.body.classList.remove("pattern-explorer-mode");
}

function renderPatternMiniExplorer() {
  if (!els.patternMiniExplorerList) return;

  const results = uiState.rawRankedResults || uiState.rankedResults || [];

  if (!results.length) {
    els.patternMiniExplorerList.innerHTML = `
      <div class="empty-state">패턴 없음</div>
    `;
    return;
  }

  let html = "";

  results.forEach((r, i) => {
    const pattern = r?.pattern || r;
    if (!pattern?.id) return;

    const patternId = pattern.id;
    const isSelected =
  Array.isArray(uiState.selectedPatternIds) &&
  uiState.selectedPatternIds.includes(patternId);

const isApplied =
  !!uiState.patternApplied &&
  (
    Array.isArray(uiState.appliedPatternIds)
      ? uiState.appliedPatternIds.includes(patternId)
      : uiState.appliedPatternId === patternId
  );

const hasApplied =
  !!uiState.patternApplied &&
  (
    (Array.isArray(uiState.appliedPatternIds) && uiState.appliedPatternIds.length > 0) ||
    !!uiState.appliedPatternId
  );

const isMuted = hasApplied && !isApplied;

    const cardClass = [
      "pattern-mini-item",
      isSelected ? "selected" : "",
      isApplied ? "applied" : "",
      isMuted ? "muted" : ""
    ].filter(Boolean).join(" ");

    const prob = r?.probability;
    const probText = typeof prob === "number" ? prob.toFixed(2) : "-";

    html += `
      <div class="${cardClass}" data-pattern-id="${patternId}">
        <div class="pattern-mini-item-title">
          ${pattern.name || `[패턴 ${i + 1}] ${pattern.type || "CUSTOM"}`}
        </div>
        <div class="pattern-mini-item-sub">
          ${patternId} / p: ${probText} / n: ${pattern.nodes?.length || 0}
        </div>
      </div>
    `;
  });

  els.patternMiniExplorerList.innerHTML = html;

  const items = els.patternMiniExplorerList.querySelectorAll("[data-pattern-id]");
  items.forEach((itemEl) => {
    itemEl.onclick = () => {
      const id = itemEl.dataset.patternId;
      togglePatternSelection(id);
      renderPatternMiniExplorer();
    };

    itemEl.oncontextmenu = (e) => {
      e.preventDefault();
      const id = itemEl.dataset.patternId;
      enterPatternFromCard(id);
      renderPatternMiniExplorer();
      
    };
  });
  syncPatternExplorerMirrorButtons();
}

function normalizeKeywordKey(keyword) {
  return String(keyword || "")
    .trim()
    .toUpperCase();
}

function buildPatternLinkWorkspaceGraph() {

  const ws = getPatternLinkWorkspace();
  if (!els.patternLinkCy || !window.cy) return;

  if (window.patternLinkCy) {
    window.patternLinkCy.destroy();
    window.patternLinkCy = null;
  }

  const elements = window.cy.json().elements;

  window.patternLinkCy = cytoscape({
  container: els.patternLinkCy,
  elements,
  style: window.cy.style().json(),
  layout: {
    name: "dagre",
    rankDir: "LR",
    nodeSep: 40,
    rankSep: 70
  },
});

registerPatternLinkWorkspaceEvents();
applyPatternLinkWorkspaceVisibility();
reLayoutPatternLinkWorkspaceByMode("default");
renderPatternLinkFocusHeader();
renderPatternLinkDetail();
renderPatternLinkWorkspaceStatus();
renderPatternLinkLayerOptions();
applyPatternLinkDimStyles(window.patternLinkCy);
if (
  uiState.relationExplorer?.open &&
  uiState.relationExplorer?.active
) {
  applyRelationExplorerFocusToPatternLink?.();
}
if (uiState.patternLinkWorkspace?.open && uiState.patternLinkWorkspace?.active) {
  applyPatternLinkWorkspaceVisibility?.();
  applyAutoDimToPatternLinkWorkspace?.();
}

applyActiveGroupsToPatternLinkPage?.();

renderPatternLinkPanel?.();

}

function renderPatternDetail(pattern) {
  if (!els?.patternDetailPanel) return;

  if (!pattern) {
    els.patternDetailPanel.innerHTML = `
      <div class="empty-state">패턴을 선택하면 상세 정보가 표시됩니다.</div>
    `;
    return;
  }

  els.patternDetailPanel.innerHTML = `
    <div><b>ID</b>: ${pattern.id || "-"}</div>
    <div><b>TYPE</b>: ${pattern.type || "-"}</div>
    <div><b>NODES</b>: ${(pattern.nodes || []).join(", ") || "-"}</div>
    <div><b>NAME</b>: ${pattern.name || "-"}</div>
  `;
}

function renderPatternLinkFocusHeader() {
  const ws = getPatternLinkWorkspace();
  const plState = uiState.patternLinkPageState || {};
  const selectedGroup = getPatternLinkSelectedGroup();

  if (els.patternLinkFocusPattern) {
    els.patternLinkFocusPattern.textContent = `패턴: ${uiState.selectedPatternId || "-"}`;
  }

  if (els.patternLinkFocusGroup) {
    els.patternLinkFocusGroup.textContent =
      `그룹: ${selectedGroup ? (selectedGroup.label || selectedGroup.name || selectedGroup.id) : "-"}`;
  }

  if (els.patternLinkFocusEvent) {
    const label = plState.selectedEdgeId
      ? `관계: ${plState.selectedEdgeId}`
      : `이벤트: ${plState.selectedNodeId || ws.selectedNodeId || "-"}`;

    els.patternLinkFocusEvent.textContent = label;
  }
}

function exitPatternLinkPage() {

  const ws = getPatternLinkWorkspace();

  applyPatternLinkTempEdgesToMainGraph();
  restorePatternLinkSourceState();

  const page = uiState.patternLinkSnapshot?.sourcePage || "network";
  document.body.dataset.page = page;
  uiState.page = page;

  refreshGraphState();
  renderRightPanelView?.();
  closePatternLinkTempEdgeEditor();
}

function enterPatternPage() {

  const ws = getPatternLinkWorkspace();

  console.log("ENTER_PATTERN_PAGE");

  uiState.page = "pattern";
  document.body.dataset.page = "pattern";

  const patterns = miner.mine();
  const results = predictor.predictAll(patterns);

  syncPatternMemories(results);

  uiState.rawRankedResults = [...results];
  uiState.rankedResults = [];
  uiState.patternMap = new Map();
  uiState.selectedPattern = null;
  uiState.selectedPatternId = null;
  uiState.selectedGroup = null;
  uiState.selectedGroupId = null;
  
  uiState.selectedEventId = null;
uiState.selectedEvent = null;

  uiState.navStack = [];

  refreshCurrentView();

  // 🔥 첫 진입은 무조건 직접 렌더
  renderPatterns(results);
  renderPatternsAsGraph(results);
  renderPatternDetail(null);
  renderFocusHeader();
  renderDebugStatus();
  saveLabState();
  renderSideMiniStatus();
  renderPatternLinkCompareBox();
  uiState.patternApplied = false;
updatePatternActionUI();
updatePatternApplyToggleUI();

uiState.patternApplied = false;
updatePatternActionUI();

uiState.patternCompactMode = false;
updatePatternCompactUI();

  console.log("PAGE NOW:", uiState.page, document.body.dataset.page);

  uiState.patternExplorerMode = false;
document.body.classList.remove("pattern-explorer-mode");

if (els.patternMiniExplorer) {
  els.patternMiniExplorer.classList.add("hidden");
}
syncPatternExplorerMirrorButtons();
}

function closePatternPageCompletely() {
  const keepApplied = !!uiState.patternApplied;

  if (window.cy) {
    removePatternNodesFromGraph();

    if (!keepApplied) {
      cy.nodes().forEach((node) => {
        node.removeStyle("opacity");
        node.removeStyle("border-width");
        node.removeStyle("border-color");
      });

      cy.edges().forEach((edge) => {
        edge.removeStyle("opacity");
      });

      uiState.appliedPatternId = null;
    }
  }

  uiState.selectedPattern = null;
  uiState.selectedPatternId = null;
  uiState.selectedGroup = null;
  uiState.selectedGroupId = null;
  uiState.selectedEventId = null;
  uiState.selectedEvent = null;
  uiState.navStack = [];

  uiState.rankedResults = [];
  uiState.rawRankedResults = [];
  uiState.lastDetectedPatterns = [];
  uiState.patternMap = new Map();

  uiState.patternExplorerMode = false;
document.body.classList.remove("pattern-explorer-mode");

if (els.patternMiniExplorer) {
  els.patternMiniExplorer.classList.add("hidden");
}

  uiState.page = "network";
  document.body.dataset.page = "network";

  if (els.predictionPanel) {
    els.predictionPanel.innerHTML = "";
  }

  uiState.patternCompactMode = false;
  updatePatternCompactUI();

  renderNetworkDefault();
  updatePatternActionUI();
  updatePatternApplyToggleUI();
  renderFocusHeader();
  renderDebugStatus();
  renderSideMiniStatus();
  renderDetailPanel();
  refreshGraphState();
  saveLabState();
}

function enterNetworkPage() {
  console.trace("ENTER_NETWORK_PAGE");

  closePatternPageCompletely();

  uiState.page = "network";
  document.body.dataset.page = "network";

  updatePatternActionUI();
  updatePatternToLayerButton();

  if (typeof closeLayerPatternExplorer === "function") {
    closeLayerPatternExplorer();
  }

  renderNetworkDefault();
  refreshGraphState();
  renderFocusHeader();
  renderDebugStatus();
  renderSideMiniStatus();
  renderDetailPanel();
  saveLabState();
  uiState.patternApplied = false;
updatePatternActionUI();
updatePatternApplyToggleUI();

if (els.closePatternPageBtn) {
  els.closePatternPageBtn.classList.add("hidden");
}

  console.log("PAGE NOW:", uiState.page, document.body.dataset.page);
}

function renderNetworkDefault() {
  if (!els.patternDetailPanel) return;

  els.patternDetailPanel.innerHTML = `
<b>[네트워크 페이지]</b><br><br>
그래프 탐색 화면입니다.<br>
패턴 탐지를 누르면 패턴 페이지로 이동합니다.
`;
}

const engine = new SaureltiaEngine();
await engine.loadData("./deta/events.lab.json");

console.log("NODES:", engine.getNodes());
console.log("EDGES:", engine.getEdges());

const renderer = new GraphRenderer(engine);
const cy = renderer.render("cy");

window.cy = cy;
registerPatternExplorerEvents();

cy.userZoomingEnabled(true);
cy.userPanningEnabled(true);

cy.on("mouseover", "node", (evt) => {
  const node = evt.target;
  const original = evt.originalEvent;
  if (!original) return;

  showFilterGradeHover(node, original.clientX, original.clientY);
});

cy.on("mousemove", "node", (evt) => {
  const node = evt.target;
  const original = evt.originalEvent;
  if (!original) return;

  showFilterGradeHover(node, original.clientX, original.clientY);
});

cy.on("mouseout", "node", () => {
  hideFilterGradeHover();
});

if (typeof cy.minZoom === "function") {
  cy.minZoom(0.08);
  cy.maxZoom(2.6);
}

cy.on("zoom", () => {
  const z = cy.zoom();
  if (z < 0.08) cy.zoom(0.08);
  if (z > 2.6) cy.zoom(2.6);
});

new InteractionController(cy, engine);

const miner = new PatternMiner(engine, cy);
const timeline = new TimeEngine(engine, cy);

const patternDB = new PatternDatabase();
await patternDB.load("./deta/patterns.lab.json");

const predictor = new PredictionEngine(patternDB, engine, miner.weightEngine);
const generator = new EventGenerator(engine);
const feedback = new FeedbackEngine(patternDB);

  const els = window.els = {
  playBtn: document.getElementById("btn-play"),
  patternBtn: document.getElementById("btn-pattern"),
  eventBtn: document.getElementById("btn-event"),
  relayoutBtn: document.getElementById("btn-relayout"),
  resetLabBtn: document.getElementById("btn-reset-lab"),
  feedbackGoodBtn: document.getElementById("btn-feedback-good"),
  feedbackBadBtn: document.getElementById("btn-feedback-bad"),
  backBtn: document.getElementById("btn-back"),


  predictionPanel: document.getElementById("prediction"),
  infoPanel: document.getElementById("info-panel"),
  patternDetailPanel: document.getElementById("pattern-detail"),


  labTitle: document.getElementById("lab-title"),


  focusPattern: document.getElementById("focus-pattern"),
focusRelation: document.getElementById("focus-relation"),
focusEvent: document.getElementById("focus-event"),


rightFullBtn: document.getElementById("btn-right-full"),
  rightPanel: document.getElementById("right-panel"),
  graphPanel: document.getElementById("graph-panel"),
  labLayout: document.getElementById("lab-layout"),


  groupSummaryCount: document.getElementById("group-summary-count"),
openGroupPanelBtn: document.getElementById("btn-open-group-panel"),
leftMiniGroup: document.getElementById("left-mini-group"),
leftMiniMode: document.getElementById("left-mini-mode"),


modeCurrentValue: document.getElementById("mode-current-value"),
modeDescription: document.getElementById("mode-description"),


layerCurrentValue: document.getElementById("layer-current-value"),
layerSaveBtn: document.getElementById("btn-layer-save"),
layerClearBtn: document.getElementById("btn-layer-clear"),


layerSummaryCount: document.getElementById("layer-summary-count"),
openLayerPanelBtn: document.getElementById("btn-open-layer-panel"),


groupPanel: document.getElementById("group-panel"),
groupPanelBody: document.getElementById("group-panel-body"),
closeGroupPanelBtn: document.getElementById("btn-close-group-panel"),


layerPanel: document.getElementById("layer-panel"),
layerPanelBody: document.getElementById("layer-panel-body"),
closeLayerPanelBtn: document.getElementById("btn-close-layer-panel"),


addVariableBtn: document.getElementById("btn-add-variable"),
buildFilterGroupsBtn: document.getElementById("btn-build-filter-groups"),
rightPanelNetwork: document.getElementById("right-panel-network"),
rightPanelVariable: document.getElementById("right-panel-variable"),
closeVariablePanelBtn: document.getElementById("btn-close-variable-panel"),


leftPanel: document.getElementById("left-panel"),
leftPanelToggle: document.getElementById("left-panel-toggle"),
closeLeftPanelBtn: document.getElementById("btn-close-left-panel"),


rotMinInput: document.getElementById("input-rot-min"),
capMaxInput: document.getElementById("input-cap-max"),
varMinInput: document.getElementById("input-var-min"),
applyLayerFilterBtn: document.getElementById("btn-apply-layer-filter"),
resetLayerFilterBtn: document.getElementById("btn-reset-layer-filter"),

btnFilterPeak: document.getElementById("btn-filter-peak"),
btnFilterCore: document.getElementById("btn-filter-core"),
btnFilterReset: document.getElementById("btn-filter-reset"),

layerDeleteModeBtn: document.getElementById("btn-layer-delete-mode"),
layerDeleteBar: document.getElementById("layer-delete-bar"),
layerDeleteConfirmBtn: document.getElementById("btn-layer-delete-confirm"),
layerDeleteModal: document.getElementById("layer-delete-modal"),
layerDeleteModalList: document.getElementById("layer-delete-modal-list"),
layerDeleteCancelBtn: document.getElementById("btn-layer-delete-cancel"),
layerDeleteFinalBtn: document.getElementById("btn-layer-delete-final"),


layerDeleteExplorer: document.getElementById("layer-delete-explorer"),
layerDeleteExplorerBody: document.getElementById("layer-delete-explorer-body"),
closeLayerDeleteModeBtn: document.getElementById("btn-close-layer-delete-mode"),


layerMemoInput: document.getElementById("layer-memo-input"),
layerDescriptionInput: document.getElementById("layer-description-input"),
layerMetaSaveBtn: document.getElementById("btn-layer-meta-save"),


rightPanelEventEditor: document.getElementById("right-panel-event-editor"),
eventEditorBody: document.getElementById("event-editor-body"),
closeEventEditorBtn: document.getElementById("btn-close-event-editor"),


playBtn: document.getElementById("btn-play"),
stopBtn: document.getElementById("btn-stop"),
stepForwardBtn: document.getElementById("btn-step-forward"),
timelineResetBtn: document.getElementById("btn-timeline-reset"),
timelineIndexBox: document.getElementById("timeline-index-box"),
speedDownBtn: document.getElementById("btn-speed-down"),
speedUpBtn: document.getElementById("btn-speed-up"),
timelineSpeedBox: document.getElementById("timeline-speed-box"),
buildTempRelationsBtn: document.getElementById("btn-build-temp-relations"),


openTimelineExplorerBtn: document.getElementById("btn-open-timeline-explorer"),
closeTimelineExplorerBtn: document.getElementById("btn-close-timeline-explorer"),
timelineExplorer: document.getElementById("timeline-explorer"),


stepBackwardBtn: document.getElementById("btn-step-backward"),
clearTempRelationsBtn: document.getElementById("btn-clear-temp-relations"),


commandPalette: document.getElementById("command-palette"),
closeCommandPaletteBtn: document.getElementById("btn-close-command-palette"),
commandPaletteInput: document.getElementById("command-palette-input"),
commandPaletteResults: document.getElementById("command-palette-results"),


logExplorer: document.getElementById("log-explorer"),
closeLogExplorerBtn: document.getElementById("btn-close-log-explorer"),
logExplorerResults: document.getElementById("log-explorer-results"),
logSearchInput: document.getElementById("log-search-input"),
logShowRecentBtn: document.getElementById("btn-log-show-recent"),
logShowAllBtn: document.getElementById("btn-log-show-all"),


logExplorerDetailBody: document.getElementById("log-explorer-detail-body"),


allDataExplorer: document.getElementById("all-data-explorer"),
closeAllDataExplorerBtn: document.getElementById("btn-close-all-data-explorer"),
allDataSearchInput: document.getElementById("all-data-search-input"),
allDataSortSelect: document.getElementById("all-data-sort-select"),
allDataList: document.getElementById("all-data-list"),
allDataDetailBody: document.getElementById("all-data-detail-body"),


eventDeleteModeBtn: document.getElementById("btn-event-delete-mode"),
eventDeleteBar: document.getElementById("event-delete-bar"),
eventDeleteConfirmBtn: document.getElementById("btn-event-delete-confirm"),
closeEventDeleteModeBtn: document.getElementById("btn-close-event-delete-mode"),
eventDeleteModal: document.getElementById("event-delete-modal"),
eventDeleteModalList: document.getElementById("event-delete-modal-list"),
eventDeleteCancelBtn: document.getElementById("btn-event-delete-cancel"),
eventDeleteFinalBtn: document.getElementById("btn-event-delete-final"),


eventSelectAllBtn: document.getElementById("btn-event-select-all"),
eventSelectFilteredBtn: document.getElementById("btn-event-select-filtered"),
eventClearSelectionBtn: document.getElementById("btn-event-clear-selection"),


patternToLayerBtn: document.getElementById("btn-pattern-to-layer"),


patternLayerMenu: document.getElementById("pattern-layer-menu"),


patternFloatingActions: document.getElementById("pattern-floating-actions"),
patternCreateLayerBtn: document.getElementById("btn-pattern-create-layer"),
patternLayerExplorer: document.getElementById("pattern-layer-explorer"),
closePatternLayerExplorerBtn: document.getElementById("btn-close-pattern-layer-explorer"),
patternLayerMenuView: document.getElementById("pattern-layer-menu-view"),
patternLayerCustomView: document.getElementById("pattern-layer-custom-view"),
patternLayerAllBtn: document.getElementById("btn-pattern-layer-all"),
patternLayerDenseBtn: document.getElementById("btn-pattern-layer-dense"),
patternLayerGroupsBtn: document.getElementById("btn-pattern-layer-groups"),
patternLayerCustomBtn: document.getElementById("btn-pattern-layer-custom"),
patternLayerCustomBackBtn: document.getElementById("btn-pattern-layer-custom-back"),
patternLayerCustomCreateBtn: document.getElementById("btn-pattern-layer-custom-create"),
patternLayerNameInput: document.getElementById("input-pattern-layer-name"),
patternLayerRotMinInput: document.getElementById("input-pattern-rot-min"),
patternLayerCapMaxInput: document.getElementById("input-pattern-cap-max"),
patternLayerVarMinInput: document.getElementById("input-pattern-var-min"),
patternLayerNodeLimitInput: document.getElementById("input-pattern-node-limit"),
patternApplyToggleBtn: document.getElementById("btn-pattern-apply-toggle"),
closePatternPageBtn: document.getElementById("btn-close-pattern-page"),


layerRegisterPatternBtn: document.getElementById("btn-layer-register-pattern"),


layerPatternExplorer: document.getElementById("layer-pattern-explorer"),
closeLayerPatternExplorerBtn: document.getElementById("btn-close-layer-pattern-explorer"),
layerPatternIdInput: document.getElementById("input-layer-pattern-id"),
layerPatternTypeInput: document.getElementById("input-layer-pattern-type"),
layerPatternNameInput: document.getElementById("input-layer-pattern-name"),
layerPatternProbInput: document.getElementById("input-layer-pattern-prob"),
layerPatternScoreInput: document.getElementById("input-layer-pattern-score"),
layerPatternMemoInput: document.getElementById("input-layer-pattern-memo"),
layerPatternPreview: document.getElementById("layer-pattern-preview"),
layerPatternPreviewBtn: document.getElementById("btn-layer-pattern-preview"),


layerPatternMenuView: document.getElementById("layer-pattern-menu-view"),
layerPatternCustomView: document.getElementById("layer-pattern-custom-view"),


btnLayerPatternAll: document.getElementById("btn-layer-pattern-all"),
btnLayerPatternFiltered: document.getElementById("btn-layer-pattern-filtered"),
btnLayerPatternCustom: document.getElementById("btn-layer-pattern-custom"),
btnLayerPatternCustomBack: document.getElementById("btn-layer-pattern-custom-back"),
btnLayerPatternCustomCreate: document.getElementById("btn-layer-pattern-custom-create"),

openPatternLinkExplorerBtn: document.getElementById("btn-open-pattern-link-explorer"),
closePatternLinkExplorerBtn: document.getElementById("btn-close-pattern-link-explorer"),
patternLinkExplorer: document.getElementById("pattern-link-explorer"),
patternLinkExplorerStatus: document.getElementById("pattern-link-explorer-status"),


patternHideNodeBtn: document.getElementById("btn-pattern-hide-node"),
patternHideEdgeBtn: document.getElementById("btn-pattern-hide-edge"),
patternHideLayerNodesBtn: document.getElementById("btn-pattern-hide-layer-nodes"),
patternHideLayerEdgesBtn: document.getElementById("btn-pattern-hide-layer-edges"),
patternTempEdgeBtn: document.getElementById("btn-pattern-temp-edge"),
patternResetVisibilityBtn: document.getElementById("btn-pattern-reset-visibility"),
patternRelayoutBtn: document.getElementById("btn-pattern-relayout"),

patternRelayoutDefaultBtn: document.getElementById("btn-pattern-relayout-default"),
patternRelayoutTimeBtn: document.getElementById("btn-pattern-relayout-time"),
patternRelayoutFocusBtn: document.getElementById("btn-pattern-relayout-focus"),

patternTempEdgeUndoBtn: document.getElementById("btn-pattern-temp-edge-undo"),
patternTempEdgeClearBtn: document.getElementById("btn-pattern-temp-edge-clear"),

patternLinkPanel: document.getElementById("pattern-link-panel"),
closePatternLinkPanelBtn: document.getElementById("btn-close-pattern-link-panel"),

plpHideNodeBtn: document.getElementById("btn-plp-hide-node"),
plpHideEdgeBtn: document.getElementById("btn-plp-hide-edge"),
plpTempEdgeBtn: document.getElementById("btn-plp-temp-edge"),
plpResetBtn: document.getElementById("btn-plp-reset"),
plpRelayoutDefaultBtn: document.getElementById("btn-plp-relayout-default"),
plpRelayoutTimeBtn: document.getElementById("btn-plp-relayout-time"),
plpRelayoutFocusBtn: document.getElementById("btn-plp-relayout-focus"),

patternLinkCompareBox: document.getElementById("pattern-link-compare-box"),
patternLinkInspectBox: document.getElementById("pattern-link-inspect-box"),
patternLinkListBox: document.getElementById("pattern-link-list-box"),

patternLinkPage: document.getElementById("pattern-link-page"),
closePatternLinkPageBtn: document.getElementById("btn-close-pattern-link-page"),

patternLinkLeft: document.getElementById("pattern-link-left"),
patternLinkCenter: document.getElementById("pattern-link-center"),
patternLinkRight: document.getElementById("pattern-link-right"),

patternLinkCy: document.getElementById("pattern-link-cy"),
patternLinkDetailBody: document.getElementById("pattern-link-detail-body"),

patternLinkFocusPattern: document.getElementById("pattern-link-focus-pattern"),
patternLinkFocusGroup: document.getElementById("pattern-link-focus-group"),
patternLinkFocusEvent: document.getElementById("pattern-link-focus-event"),

plpHideNodeBtn: document.getElementById("btn-plp-hide-node"),
plpHideEdgeBtn: document.getElementById("btn-plp-hide-edge"),
plpTempEdgeBtn: document.getElementById("btn-plp-temp-edge"),
plpResetWorkBtn: document.getElementById("btn-plp-reset-work"),
plpRelayoutDefaultBtn: document.getElementById("btn-plp-relayout-default"),
plpRelayoutTimeBtn: document.getElementById("btn-plp-relayout-time"),
plpRelayoutFocusBtn: document.getElementById("btn-plp-relayout-focus"),

patternLinkWorkspaceStatus: document.getElementById("pattern-link-workspace-status"),

patternLinkLayerSelect: document.getElementById("pattern-link-layer-select"),
plpLoadLayerBtn: document.getElementById("btn-plp-load-layer"),

plpUnloadLayerBtn: document.getElementById("btn-plp-unload-layer"),
plpShowAllBtn: document.getElementById("btn-plp-show-all"),

plpLayerNameInput: document.getElementById("input-plp-layer-name"),
plpSaveWorkspaceLayerBtn: document.getElementById("btn-plp-save-workspace-layer"),

patternLinkCompareBox: document.getElementById("pattern-link-compare-box"),

plpApplyToMainBtn: document.getElementById("btn-plp-apply-to-main"),

plpDimBtn: document.getElementById("btn-plp-dim"),

eventCounter: uiState.__eventCounter || 1,

patternLinkBtn: document.getElementById("btn-pattern-link"),
patternHideElementBtn: document.getElementById("btn-pattern-hide-element"),
patternLayerHideBtn: document.getElementById("btn-pattern-layer-hide"),
patternRelationFilterBtn: document.getElementById("btn-pattern-relation-filter"),

patternTempBreakBtn: document.getElementById("btn-pattern-temp-break"),
patternTempUndoBtn: document.getElementById("btn-pattern-temp-undo"),
patternTempBacktrackBtn: document.getElementById("btn-pattern-temp-backtrack"),
patternTempChainPreview: document.getElementById("pattern-temp-chain-preview"),

patternTempPatternPreviewBody: document.getElementById("pattern-temp-pattern-preview-body"),

filterGradeHover: document.getElementById("filter-grade-hover"),

openFilterRankExplorerBtn: document.getElementById("btn-open-filter-rank-explorer"),
filterRankExplorer: document.getElementById("filter-rank-explorer"),
closeFilterRankExplorerBtn: document.getElementById("btn-close-filter-rank-explorer"),
filterRankExplorerBody: document.getElementById("filter-rank-explorer-body"),
filterRankPassBtn: document.getElementById("btn-filter-rank-pass"),
filterRankFailBtn: document.getElementById("btn-filter-rank-fail"),

filterRankBasicBtn: document.getElementById("btn-filter-rank-basic"),
filterRankRawBtn: document.getElementById("btn-filter-rank-raw"),

filterRankLayerAllBtn: document.getElementById("btn-filter-rank-layer-all"),
filterRankLayerActiveBtn: document.getElementById("btn-filter-rank-layer-active"),
filterRankLayerPassBtn: document.getElementById("btn-filter-rank-layer-pass"),

patternApplyToggleBtn: document.getElementById("btn-pattern-apply-toggle"),
closePatternPageBtn: document.getElementById("btn-close-pattern-page"),

patternCompactToggleBtn: document.getElementById("btn-pattern-compact-toggle"),

openPatternMiniExplorerBtn: document.getElementById("btn-open-pattern-mini-explorer"),
patternMiniExplorer: document.getElementById("pattern-mini-explorer"),
closePatternMiniExplorerBtn: document.getElementById("btn-close-pattern-mini-explorer"),
patternMiniExplorerList: document.getElementById("pattern-mini-explorer-list"),

patternApplyToggleMiniBtn: document.getElementById("btn-pattern-apply-toggle-mini"),
patternCreateLayerMiniBtn: document.getElementById("btn-pattern-create-layer-mini"),

patternRegisterGroupBtn: document.getElementById("btn-pattern-register-group"),

patternRegisterGroupMiniBtn: document.getElementById("btn-pattern-register-group-mini"),

layerPromotePatternBtn: document.getElementById("btn-layer-promote-pattern"),

patternPromoteGroupBtn: document.getElementById("btn-pattern-promote-group"),
patternPromoteGroupMiniBtn: document.getElementById("btn-pattern-promote-group-mini"),

groupPanelActions: document.getElementById("group-panel-actions"),
groupPromoteMergeBtn: document.getElementById("btn-group-promote-merge"),

closeRelationExplorerBtn: document.getElementById("btn-close-relation-explorer"),

relationMakeLayerBtn: document.getElementById("btn-relation-make-layer"),
relationBackBtn: document.getElementById("btn-relation-back"),
resetRelationFocusBtn: document.getElementById("btn-reset-relation-focus"),

relationExplorer: document.getElementById("relation-explorer"),
relationExplorerTarget: document.getElementById("relation-explorer-target"),
relationExplorerSummary: document.getElementById("relation-explorer-summary"),
relationNodeList: document.getElementById("relation-node-list"),
relationEdgeList: document.getElementById("relation-edge-list"),
openRelationExplorerFromGroupBtn: document.getElementById("btn-open-relation-explorer-from-group"),

relationEmptyModal: document.getElementById("relation-empty-modal"),
closeRelationEmptyModalBtn: document.getElementById("btn-close-relation-empty-modal"),

patternRelationFilterBox: document.getElementById("pattern-relation-filter-box"),

openLayerExplorerFullBtn: document.getElementById("btn-open-layer-explorer-full"),
layerExplorerFull: document.getElementById("layer-explorer-full"),
closeLayerExplorerFullBtn: document.getElementById("btn-close-layer-explorer-full"),
layerExplorerApprovedList: document.getElementById("layer-explorer-approved-list"),
layerExplorerHoldingList: document.getElementById("layer-explorer-holding-list"),
layerExplorerStoredList: document.getElementById("layer-explorer-stored-list"),

openLayerMergeExplorerBtn: document.getElementById("btn-open-layer-merge-explorer"),
layerMergeExplorer: document.getElementById("layer-merge-explorer"),
closeLayerMergeExplorerBtn: document.getElementById("btn-close-layer-merge-explorer"),
layerMergeExplorerList: document.getElementById("layer-merge-explorer-list"),
layerMergeConfirmBtn: document.getElementById("btn-layer-merge-confirm"),

layerExplorerFull: document.getElementById("layer-explorer-full"),
closeLayerExplorerFullBtn: document.getElementById("btn-close-layer-explorer-full"),

layerMainTabStatusBtn: document.getElementById("btn-layer-main-tab-status"),
layerMainTabTimeBtn: document.getElementById("btn-layer-main-tab-time"),

layerFullTotalCount: document.getElementById("layer-full-total-count"),
layerFullApprovedCount: document.getElementById("layer-full-approved-count"),
layerFullHoldingCount: document.getElementById("layer-full-holding-count"),
layerFullStoredCount: document.getElementById("layer-full-stored-count"),

layerExplorerFullSubview: document.getElementById("layer-explorer-full-subview"),

layerExplorerFullHome: document.getElementById("layer-explorer-full-home"),
layerExplorerFullView: document.getElementById("layer-explorer-full-view"),
layerFullBackBtn: document.getElementById("btn-layer-full-back"),

layerMainTabSetBtn: document.getElementById("btn-layer-main-tab-set"),

layerSetCreateModal: document.getElementById("layer-set-create-modal"),
layerSetCreateModalMessage: document.getElementById("layer-set-create-modal-message"),
layerSetCreateCancelBtn: document.getElementById("btn-layer-set-create-cancel"),
layerSetCreateConfirmBtn: document.getElementById("btn-layer-set-create-confirm"),

layerSetDeleteModal: document.getElementById("layer-set-delete-modal"),
layerSetDeleteModalMessage: document.getElementById("layer-set-delete-modal-message"),
layerSetDeleteCancelBtn: document.getElementById("btn-layer-set-delete-cancel"),
layerSetDeleteConfirmBtn: document.getElementById("btn-layer-set-delete-confirm"),

plpOpenGroupExplorerBtn: document.getElementById("btn-plp-open-group-explorer"),
patternLinkCurrentGroupBox: document.getElementById("pattern-link-current-group-box"),

groupExplorerOnCount: document.getElementById("group-explorer-on-count"),
groupExplorerPreviewCount: document.getElementById("group-explorer-preview-count"),
groupBaseBtn: document.getElementById("btn-group-base"),

groupClearPreviewBtn: document.getElementById("btn-group-clear-preview"),
groupClearOnBtn: document.getElementById("btn-group-clear-on"),
groupClearBaseBtn: document.getElementById("btn-group-clear-base"),

groupExplorerFull: document.getElementById("group-explorer-full"),
groupExplorerFullHome: document.getElementById("group-explorer-full-home"),
groupExplorerFullView: document.getElementById("group-explorer-full-view"),
groupExplorerFullSubview: document.getElementById("group-explorer-full-subview"),

openGroupExplorerFullBtn: document.getElementById("btn-open-group-explorer-full"),
closeGroupExplorerFullBtn: document.getElementById("btn-close-group-explorer-full"),
groupFullBackBtn: document.getElementById("btn-group-full-back"),

groupFullTotalCount: document.getElementById("group-full-total-count"),
groupFullOnCount: document.getElementById("group-full-on-count"),
groupFullPreviewCount: document.getElementById("group-full-preview-count"),
groupFullBaseName: document.getElementById("group-full-base-name"),
groupFullContaminatedCount: document.getElementById("group-full-contaminated-count"),
groupFullCleanCount: document.getElementById("group-full-clean-count"),

groupFullStatusTabBtn: document.getElementById("btn-group-full-tab-status"),
groupFullTheoryTabBtn: document.getElementById("btn-group-full-tab-theory"),
groupFullStructureTabBtn: document.getElementById("btn-group-full-tab-structure"),
groupFullReferenceTabBtn: document.getElementById("btn-group-full-tab-reference"),

groupFullCurrentViewLabel: document.getElementById("group-full-current-view-label"),
groupFullSearchInput: document.getElementById("group-full-search-input"),
groupFullFilterSelect: document.getElementById("group-full-filter-select"),
groupFullSortSelect: document.getElementById("group-full-sort-select"),

minimizeGroupExplorerFullBtn: document.getElementById("btn-minimize-group-explorer-full"),
minimizeGroupExplorerFullViewBtn: document.getElementById("btn-minimize-group-explorer-full-view"),
groupExplorerFullMinimized: document.getElementById("group-explorer-full-minimized"),

groupExplorerCompactMinimized: document.getElementById("group-explorer-compact-minimized"),

groupFullAxisSelect: document.getElementById("group-full-axis-select"),

groupFullRelatedKeywords: document.getElementById("group-full-related-keywords"),

globalSearchInput: document.getElementById("global-search-input"),
globalRelatedKeywords: document.getElementById("global-related-keywords"),
globalSearchResults: document.getElementById("global-search-results"),

groupFullBucketActions: document.getElementById("group-full-bucket-actions"),
groupFullExpandBucketsBtn: document.getElementById("btn-group-full-expand-buckets"),
groupFullCollapseBucketsBtn: document.getElementById("btn-group-full-collapse-buckets"),

groupFullBucketSortSelect: document.getElementById("group-full-bucket-sort-select"),

};

bindPatternLinkExplorerControls();

if (els.plpHideNodeBtn) {
  els.plpHideNodeBtn.onclick = () => {
    setPatternLinkWorkspaceMode("hide-node");
  };
}

if (els.plpHideEdgeBtn) {
  els.plpHideEdgeBtn.onclick = () => {
    setPatternLinkWorkspaceMode("hide-edge");
  };
}

if (els.plpTempEdgeBtn) {
  els.plpTempEdgeBtn.onclick = () => {
    setPatternLinkWorkspaceMode("temp-edge");
  };
}

if (els.plpDimBtn) {
  els.plpDimBtn.onclick = () => {
    setPatternLinkWorkspaceMode("dim");
  };
}

if (els.plpShowAllBtn) {
  els.plpShowAllBtn.onclick = () => {
    showAllPatternLinkWorkspace();
  };
}

if (els.plpUnloadLayerBtn) {
  els.plpUnloadLayerBtn.onclick = () => {
    unloadPatternLinkWorkspaceLayer();
  };
}

if (els.plpLoadLayerBtn) {
  els.plpLoadLayerBtn.onclick = () => {
    const layerName = els.patternLinkLayerSelect?.value;
    const layer = getSavedLayerByName(layerName);
    if (!layer) return;
    applyLayerToPatternLinkWorkspace(layer);
  };
}

const COMMAND_ITEMS = [
  {
  id: "open-all-data",
  title: "ALL DATA 열기",
  sub: "정의 집합 탐색기 열기",
  keywords: ["all data", "data", "정의", "데이터", "집합"],
  run: () => {
    openAllDataExplorer();
  }
},
  {
  id: "open-log",
  title: "LOG 열기",
  sub: "LOG Explorer 열기",
  keywords: ["log", "logs", "기록", "로그"],
  run: () => {
    openLogExplorer();
  }
},
  {
    id: "open-timeline",
    title: "TIMELINE 열기",
    sub: "타임라인 Explorer 열기",
    keywords: ["timeline", "time", "타임라인", "재생"],
    run: () => {
      openTimelineExplorer();
      logEvent("[COMMAND] TIMELINE 열기");
    }
  },
  {
    id: "open-event-editor",
    title: "이벤트 생성",
    sub: "이벤트 편집기 열기",
    keywords: ["event", "이벤트", "생성", "editor"],
    run: () => {
      enterEventEditor();
      logEvent("[COMMAND] 이벤트 생성 열기");
    }
  },
  {
    id: "go-pattern",
    title: "패턴 페이지 이동",
    sub: "Pattern 페이지 진입",
    keywords: ["pattern", "패턴"],
    run: () => {
      enterPatternPage();
      logEvent("[COMMAND] 패턴 페이지 이동");
    }
  },
  {
    id: "reset-lab",
    title: "LAB 초기화",
    sub: "현재 LAB 상태 초기화",
    keywords: ["reset", "lab", "초기화"],
    run: () => {
      resetLabState();
      logEvent("[COMMAND] LAB 초기화");
    }
  },
  {
    id: "clear-temp-relations",
    title: "임시 관계도 해제",
    sub: "TEMP_TIMELINE edge 제거",
    keywords: ["temp", "relation", "clear", "임시", "관계도", "해제"],
    run: () => {
      clearTemporaryTimelineRelations();
      logEvent("[COMMAND] 임시 관계도 해제");
    }
  },
{
  id: "open-pattern-link-page",
  title: "패턴 링크 페이지 열기",
  sub: "패턴 링크 작업 페이지 진입",
  keywords: ["패턴 링크 페이지", "패턴 링크", "pattern link page", "plp"],
  run: () => {
    enterPatternLinkPage();
    logEvent("[COMMAND] 패턴 링크 페이지 열기");
  }
},

];

if (els.labTitle && els.infoPanel) {
  els.labTitle.onclick = () => {
    els.infoPanel.classList.toggle("collapsed");
  };
}

if (els.rightFullBtn && els.rightPanel && els.graphPanel) {
  els.rightFullBtn.onclick = () => {
    const willFull = !els.rightPanel.classList.contains("fullscreen");

    els.rightPanel.classList.toggle("fullscreen", willFull);
    els.graphPanel.classList.toggle("mini", willFull);
  };
}

//초기 렌더 구간 / 초기화 구간

loadLabState();

if (!uiState.page || uiState.page === "pattern-link") {
  uiState.page = "network";
}

document.body.dataset.mode = uiState.mode;
document.body.dataset.page = uiState.page;

//renderSuggestionToasts?.();
//openSuggestionMaintenanceOnBoot?.();

renderModeButtons();
renderLayerSystemState();
renderLayerMetaFields();
renderLog();
renderEdgeRelationFilterButtons();
refreshCurrentView();

applyAllEventsToGraph();

restorePersistentTempEdges(uiState.tempEdges || []);
refreshGraphState();
syncNodeTimeDataFromEngine();
updatePatternActionUI();
renderFocusHeader();
renderSideMiniStatus();
renderDetailPanel();
renderTimelineStatus();

updateLayerPatternActionUI();

bindTimelineExplorerControls();
makeTimelineExplorerDraggable();
makePatternLinkExplorerDraggable();
makeFilterRankExplorerDraggable();
makePatternMiniExplorerDraggable();

bindRelationExplorerControls();
makeRelationExplorerDraggable();

bindPatternMiniExplorerControls();
makePatternMiniExplorerDraggable();
bindLayerSetCreateModalControls();
bindLayerSetDeleteModalControls();

bindLabTitleDragHub?.();

closeCommandPalette();

updatePatternToLayerButton();

uiState.rightPanelView = "network";
renderRightPanelView();

if (els.patternLinkExplorer) {
  els.patternLinkExplorer.classList.add("hidden");
}
renderPatternLinkExplorerUI();
renderPatternLinkDetail();
syncPatternLinkRelationFilterButtons?.();
renderPatternLinkExplorerStatus?.();

renderPatternLinkExplorerUI();
renderPatternLinkDetail();

bindGlobalHubPanelClose?.();
bindGlobalHubEscClose?.();
bindGroupRelatedKeywordClose?.();
bindGlobalRelatedKeywordClose?.();

bindGroupExplorerControls();

if (uiState.relationExplorer?.baseGroupId) {
  renderRelationExplorer?.();

  if (uiState.relationExplorer.open && els.relationExplorer) {
    els.relationExplorer.classList.remove("hidden");
  } else if (els.relationExplorer) {
    els.relationExplorer.classList.add("hidden");
  }

  document.querySelectorAll(".relation-edge-filter-btn").forEach((x) => {
    x.classList.toggle(
      "active",
      x.dataset.relationEdgeFilter === (uiState.relationExplorer.edgeFilter || "ALL")
    );
  });

  if (
    uiState.relationExplorer.open &&
    uiState.relationExplorer.active &&
    (
      (uiState.relationExplorer.selectedEdgeIds || []).length > 0 ||
      uiState.relationExplorer.edgeFilter !== "ALL"
    )
  ) {
    recomputeRelationExplorerWeights?.();
    applyRelationExplorerFocusToGraph?.();
  } else {
    refreshGraphState?.();
  }
}

// suggestion boot
setTimeout(() => {
  renderSuggestionToasts?.();
  openSuggestionMaintenanceOnBoot?.();
}, 0);

window.__explorerZIndex = 1000;

window.uiState = uiState;

window.DEBUG = {
  getLastPattern: () => uiState.rankedResults?.at(-1),
  getAllPatterns: () => uiState.rankedResults,
  getCurrentLayer: () => getCurrentLayerObject(),
  getSelectedPattern: () => getSelectedPatternObject()
};

window.testDebug = () => {
  console.log("DEBUG OK", {
    rankedResults: uiState.rankedResults?.length || 0,
    currentLayerName: uiState.currentLayerName,
    selectedPatternId: uiState.selectedPatternId
  });
};

window.createLayerFromPattern = createLayerFromPattern;

function closeGlobalRelatedKeywords() {
  if (!els.globalRelatedKeywords) return;

  els.globalRelatedKeywords.classList.add("hidden");
}

function openSuggestionMaintenanceOnBoot() {
  try {
    if (typeof openSuggestionMaintenanceExplorer !== "function") return;
    if (typeof buildSuggestionMaintenancePreview !== "function") return;
    if (!Array.isArray(AUTO_GROUP_SUGGESTION_RULES)) return;

    openSuggestionMaintenanceExplorer("duplicates");
  } catch (err) {
    console.warn("Suggestion maintenance boot skipped", err);
  }
}

function formatSuggestionNumber(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "-";
  return n.toFixed(3);
}

function formatSuggestionDelta(delta) {
  const amount = Number(delta?.amount ?? delta?.max ?? delta?.min ?? 0);

  if (!Number.isFinite(amount)) return "-";

  const sign =
    delta?.direction === "down"
      ? "-"
      : delta?.direction === "up"
        ? "+"
        : amount >= 0
          ? "+"
          : "";

  return `${sign}${Math.abs(amount).toFixed(3)}`;
}

function getSuggestionDisplayTag(tag) {
  const map = {
    GROUP_CONTAMINATED: "NOISE",
    GROUP_WEAK_RELATION: "WEAK",
    THEORY_CONFIRMED: "CONFIRMED"
  };

  return map[tag] || tag || "-";
}

function getSuggestionMetricKeys() {
  return ["purity", "contamination", "importance", "confidence", "g"];
}

function renderSuggestionMetricBox(title, metrics = {}, tone = "base") {
  const keys = getSuggestionMetricKeys();

  return `
    <div class="suggestion-metric-box ${tone}">
      <div class="suggestion-metric-box-title">${title}</div>

      <div class="suggestion-metric-box-grid">
        ${keys.map((key) => `
          <div class="suggestion-metric-cell">
            <span>${key}</span>
            <b>${formatSuggestionNumber(metrics[key])}</b>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function renderSuggestionDeltaBox(title, deltas = [], tone = "delta") {
  return `
    <div class="suggestion-metric-box ${tone}">
      <div class="suggestion-metric-box-title">${title}</div>

      <div class="suggestion-delta-list">
        ${
          Array.isArray(deltas) && deltas.length
            ? deltas.map((delta) => `
              <div class="suggestion-delta-cell">
                <span>${delta.target || "-"}</span>
                <b>${formatSuggestionDelta(delta)}</b>
              </div>
            `).join("")
            : `<div class="suggestion-delta-empty">-</div>`
        }
      </div>
    </div>
  `;
}

function renderSuggestionTargetMetricPanel(target) {
  const snapshot = getSuggestionTargetMetricSnapshot(target);
  const keys = getSuggestionMetricKeys();

  return `
    <div class="suggestion-target-panel-inner">
      <section class="suggestion-target-title-card">
        <div>
          <div class="suggestion-target-kicker">${target.entityType}</div>
          <div class="suggestion-target-title">${target.label}</div>
          <div class="suggestion-target-id">${target.entityId}</div>
        </div>
      </section>

      <section class="suggestion-metric-compare-table">
        <div class="suggestion-metric-table-head">
          <span>변수</span>
          <span>원래 값</span>
          <button type="button" data-open-stage-detail="manual">내 수정 값</button>
          <button type="button" data-open-stage-detail="suggestion">제안 반영 값</button>
        </div>

        ${keys.map((key) => `
          <div class="suggestion-metric-table-row">
            <span class="metric-name">${key}</span>
            <b>${formatSuggestionNumber(snapshot.before[key])}</b>
            <b class="manual">${formatSuggestionNumber(snapshot.manualAfter[key])}</b>
            <b class="suggestion">${formatSuggestionNumber(snapshot.suggestionAfter[key])}</b>
          </div>
        `).join("")}
      </section>

      <section class="suggestion-target-rule-summary">
  <div class="suggestion-target-rule-title">
    ${target.hasSuggestion ? "적용될 제안 태그" : "수동 적용 태그"}
  </div>

  <div class="suggestion-target-rule-list">
    ${
      target.hasSuggestion
        ? target.rows.map((row) => `
          <div class="suggestion-target-rule">
            <b>${row.displayTag || getSuggestionDisplayTag(row.suggestedTag)}</b>
            <span>${row.metric} ${row.operator} ${formatSuggestionNumber(row.threshold)}</span>
            <em>현재 ${formatSuggestionNumber(row.value)}</em>
          </div>
        `).join("")
        : renderManualTagSummaryForTarget(target)
    }
  </div>
</section>
    </div>
  `;
}

function renderManualTagSummaryForTarget(target) {
  if (target.entityType !== "GROUP") {
    return `<div class="suggestion-scan-detail-empty">수동 태그 없음</div>`;
  }

  const group = groupStore.get(target.entityId);
  const edit = group ? ensureEntityEditState?.(group) : null;
  const tags = Array.isArray(edit?.adjustmentTags) ? edit.adjustmentTags : [];

  if (!tags.length) {
    return `<div class="suggestion-scan-detail-empty">수동 태그 없음</div>`;
  }

  return tags.map((entry) => `
    <div class="suggestion-target-rule">
      <b>${entry.displayTag || getSuggestionDisplayTag(entry.tag) || entry.tag}</b>
      <span>${entry.category || entry.sourceType || "-"}</span>
      <em>${entry.sourceRef || "-"}</em>
    </div>
  `).join("");
}

function openSuggestionStageDetailExplorer(stage) {
  const detailState = ensureSuggestionScanDetailState();

  detailState.stageDetail = {
    open: true,
    stage
  };

  const preview = buildSuggestionMaintenancePreview();
  renderSuggestionMaintenanceExplorer(preview);
}

function closeSuggestionStageDetailExplorer() {
  const detailState = ensureSuggestionScanDetailState();

  if (detailState.stageDetail) {
    detailState.stageDetail.open = false;
  }

  const preview = buildSuggestionMaintenancePreview();
  renderSuggestionMaintenanceExplorer(preview);
}

function renderSuggestionTagRow(tags = []) {
  const list = Array.isArray(tags) ? tags.filter(Boolean) : [];

  if (!list.length) {
    return `<div class="suggestion-tag-row empty">-</div>`;
  }

  return `
    <div class="suggestion-tag-row">
      ${list.map((tag) => `
        <span class="suggestion-readable-tag">${getSuggestionDisplayTag(tag)}</span>
      `).join("")}
    </div>
  `;
}

function bindTimelineExplorerControls() {
  const openBtn = document.getElementById("btn-open-timeline-explorer");
  const closeBtn = document.getElementById("btn-close-timeline-explorer");
  const explorer = document.getElementById("timeline-explorer");

  if (openBtn && explorer) {
    openBtn.onclick = () => {
      uiState.timelineExplorer.open = true;
      uiState.timelineExplorer.active = true;

      explorer.classList.remove("hidden");
      refreshGraphState?.();
      saveLabState?.();
    };
  }

  if (closeBtn && explorer) {
    closeBtn.onclick = () => {
      uiState.timelineExplorer.open = false;
      uiState.timelineExplorer.active = false;

      explorer.classList.add("hidden");
      refreshGraphState?.();
      saveLabState?.();
    };
  }
}

if (els.closeVariablePanelBtn) {
  els.closeVariablePanelBtn.onclick = () => {
    uiState.rightPanelView = "network";
    renderRightPanelView();

    if (els.addVariableBtn) {
      els.addVariableBtn.textContent = "변수 추가";
    }
  };
}

function setFilterRankActive(nodeId) {
  const prevId = uiState.filterRankActiveNodeId;
  const prevNode = prevId && window.cy ? cy.getElementById(prevId) : null;

  if (prevNode && prevNode.length > 0) {
    prevNode.style({
      "border-width": "",
      "border-color": "",
      "overlay-opacity": ""
    });
  }

  uiState.filterRankActiveNodeId = nodeId;

  const node = window.cy ? cy.getElementById(nodeId) : null;
  if (!node || node.length === 0) return;

  node.style({
    "border-width": 6,
    "border-color": "#ff8a65",
    "overlay-opacity": 0
  });

  cy.animate({
    center: { eles: node },
    duration: 220
  });

  setTimeout(() => {
    const current = window.cy ? cy.getElementById(nodeId) : null;
    if (!current || current.length === 0) return;

    current.style({
      "border-width": 4,
      "border-color": "#ffd54f",
      "overlay-opacity": 0
    });
  }, 700);
}

function getPatternLinkWorkspaceCompareData() {
  const ws = getPatternLinkWorkspace();

  const visibleIds = new Set(getVisiblePatternLinkWorkspaceNodeIds());
  const loadedIds = new Set(ws.loadedLayerNodes || []);

  const onlyInLoaded = [...loadedIds].filter((id) => !visibleIds.has(id));
  const onlyInWorkspace = [...visibleIds].filter((id) => !loadedIds.has(id));
  const shared = [...visibleIds].filter((id) => loadedIds.has(id));

  return {
    visibleCount: visibleIds.size,
    loadedCount: loadedIds.size,
    sharedCount: shared.length,
    onlyInLoaded,
    onlyInWorkspace
  };
}

function renderPatternLinkCompareBox() {
  if (!els.patternLinkCompareBox) return;

  const ws = getPatternLinkWorkspace();

  if (!ws.loadedLayerName) {
    els.patternLinkCompareBox.innerHTML = `
      <div class="empty-state">불러온 Layer가 없습니다.</div>
    `;
    return;
  }

  const compare = getPatternLinkWorkspaceCompareData();

  const onlyInLoadedHtml = compare.onlyInLoaded.length
    ? compare.onlyInLoaded
        .slice(0, 20)
        .map((id) => `<button class="pl-compare-item-btn" data-pl-compare-event="${id}">${id}</button>`)
        .join("")
    : `<div class="empty-state">없음</div>`;

  const onlyInWorkspaceHtml = compare.onlyInWorkspace.length
    ? compare.onlyInWorkspace
        .slice(0, 20)
        .map((id) => `<button class="pl-compare-item-btn" data-pl-compare-event="${id}">${id}</button>`)
        .join("")
    : `<div class="empty-state">없음</div>`;

  els.patternLinkCompareBox.innerHTML = `
    <div class="pl-compare-row"><span>Loaded Layer</span><b>${ws.loadedLayerName}</b></div>
    <div class="pl-compare-row"><span>Loaded Nodes</span><b>${compare.loadedCount}</b></div>
    <div class="pl-compare-row"><span>Visible Workspace Nodes</span><b>${compare.visibleCount}</b></div>
    <div class="pl-compare-row"><span>Shared</span><b>${compare.sharedCount}</b></div>

    <div class="pl-compare-block">
      <div class="pl-compare-title">Layer only</div>
      <div class="pl-compare-list">${onlyInLoadedHtml}</div>
    </div>

    <div class="pl-compare-block">
      <div class="pl-compare-title">Workspace only</div>
      <div class="pl-compare-list">${onlyInWorkspaceHtml}</div>
    </div>
  `;

  els.patternLinkCompareBox
  .querySelectorAll("[data-pl-compare-event]")
  .forEach((btn) => {
    btn.onclick = () => {
      const id = btn.dataset.plCompareEvent;
      if (!id) return;

      jumpToPatternLinkEvent(id);
    };
  });

}

function bringExplorerToFront(el) {
  if (!el) return;

  window.__explorerZIndex += 1;
  el.style.zIndex = window.__explorerZIndex;
}

function jumpToPatternLinkEvent(eventId) {
  if (!eventId) return;

  const ws = getPatternLinkWorkspace();
  const plc = getPatternLinkCy();
  if (!plc) return;

  const node = plc.getElementById(eventId);
  if (!node || node.length === 0) return;

  if (!uiState.patternLinkPageState) {
    uiState.patternLinkPageState = {};
  }

  uiState.patternLinkPageState.selectedNodeId = eventId;
  uiState.patternLinkPageState.selectedEdgeId = null;

  ws.selectedNodeId = eventId;
  ws.selectedEdgeId = null;

  saveLabState?.();

  plc.center(node);
  plc.select(node);

  renderPatternLinkFocusHeader?.();
  renderPatternLinkDetail?.();
  renderPatternLinkPanel?.();
}

function jumpToPatternLinkEdge(edgeId) {
  if (!edgeId) return;

  const ws = getPatternLinkWorkspace();
  const plc = getPatternLinkCy();
  if (!plc) return;

  const edge = plc.getElementById(edgeId);
  if (!edge || edge.length === 0) return;

  if (!uiState.patternLinkPageState) {
    uiState.patternLinkPageState = {};
  }

  uiState.patternLinkPageState.selectedEdgeId = edgeId;
  uiState.patternLinkPageState.selectedNodeId = null;

  ws.selectedEdgeId = edgeId;
  ws.selectedNodeId = null;

  saveLabState?.();

  plc.center(edge);
  plc.select(edge);

  renderPatternLinkFocusHeader?.();
  renderPatternLinkDetail?.();
  renderPatternLinkPanel?.();
}

function reLayoutGraphByMode(mode = "default") {
  if (!window.cy) return;

  if (mode === "default") {
    cy.layout({
      name: LAB_CONFIG.layout.name,
      rankDir: LAB_CONFIG.layout.rankDir,
      nodeSep: LAB_CONFIG.layout.nodeSep,
      rankSep: LAB_CONFIG.layout.rankSep,
      animate: true,
      animationDuration: 300
    }).run();

    setTimeout(() => {
      applyPatternExplorerVisibility();
    }, 350);

    return;
  }

  if (mode === "time") {
    const nodes = cy.nodes().toArray();

    const sorted = [...nodes].sort((a, b) => {
      const ta = getNodeTimeValue(a);
      const tb = getNodeTimeValue(b);

      if (ta !== tb) return ta - tb;

      return String(a.id()).localeCompare(String(b.id()));
    });

    const colGap = 260;
    const rowGap = 120;
    const startX = 140;
    const startY = 100;
    const colCount = 2;

    sorted.forEach((node, index) => {
      const col = index % colCount;
      const row = Math.floor(index / colCount);

      node.position({
        x: startX + col * colGap,
        y: startY + row * rowGap
      });
    });

    cy.fit(cy.nodes(), 40);
    applyPatternExplorerVisibility();
    return;
  }

  if (mode === "focus") {
  const priorityIds = getFocusPriorityNodeIds();

  if (!priorityIds.length) {
    reLayoutGraphByMode("default");
    return;
  }

  const focusNodes = getCyNodeListFromIds(priorityIds);
  const focusIdSet = new Set(focusNodes.map((n) => n.id()));

  const relatedNodeSet = new Set();

  focusNodes.forEach((node) => {
    relatedNodeSet.add(node.id());

    node.connectedEdges().forEach((edge) => {
      relatedNodeSet.add(edge.source().id());
      relatedNodeSet.add(edge.target().id());
    });
  });

  const relatedNodes = getCyNodeListFromIds([...relatedNodeSet]).filter(
    (node) => !focusIdSet.has(node.id())
  );

  const backgroundNodes = cy.nodes().filter((node) => {
    return !focusIdSet.has(node.id()) && !relatedNodeSet.has(node.id());
  }).toArray();

  // 1) 핵심 대상: 중앙 좌측 2열
  focusNodes.forEach((node, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);

    node.position({
      x: 220 + col * 220,
      y: 120 + row * 130
    });
  });

  // 2) 관련 노드: 중앙 우측 보조 영역
  relatedNodes.forEach((node, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);

    node.position({
      x: 700 + col * 180,
      y: 120 + row * 110
    });
  });

  // 3) 나머지 노드: 아래쪽 정리 영역
  backgroundNodes.forEach((node, index) => {
    const col = index % 3;
    const row = Math.floor(index / 3);

    node.position({
      x: 180 + col * 180,
      y: 520 + row * 90
    });
  });

  cy.fit(cy.nodes(), 50);
  applyPatternExplorerVisibility();
  return;
}
}

function getFocusPriorityNodeIds() {
  if (uiState.selectedEventId) {
    return [uiState.selectedEventId];
  }

if (uiState.selectedGroup) {
  return getGroupAllNodeIds(uiState.selectedGroup);

   return [...new Set(ids.filter(Boolean))];
}

  const currentLayer = getCurrentLayerObject?.() || null;
  if (currentLayer && Array.isArray(currentLayer.nodes) && currentLayer.nodes.length > 0) {
    return [...new Set(currentLayer.nodes.filter(Boolean))];
  }

  if (Array.isArray(uiState.activeGroupIds) && uiState.activeGroupIds.length > 0) {
    const ids = [];

    uiState.activeGroupIds.forEach((groupId) => {
      const group = groupStore?.get(groupId);
      if (!group) return;

      if (group.center) ids.push(group.center);
      if (Array.isArray(group.nodes)) ids.push(...group.nodes);
    });

    return [...new Set(ids.filter(Boolean))];
  }

  return [];
}

function jumpToPatternFromRelationExplorer() {
  const nodeWeights = uiState.relationExplorer?.focusNodeWeights || {};
  const nodeIds = Object.keys(nodeWeights).filter((id) => Number(nodeWeights[id] || 0) > 0);

  if (!nodeIds.length) return null;

  const pattern = registerPatternFromNodeIds(nodeIds, {
    type: "RELATION_FOCUS",
    name: `Relation Focus (${nodeIds.length})`
  });

  if (!pattern) return null;

  uiState.page = "pattern";
  document.body.dataset.page = "pattern";
  uiState.selectedPatternId = pattern.id;
  uiState.selectedPatternIds = [pattern.id];

  renderPatterns?.(uiState.rawRankedResults || []);
  renderFocusHeader?.();
  renderDetailPanel?.();
  saveLabState?.();

  return pattern;
}

function getCyNodeListFromIds(nodeIds = []) {
  return [...new Set(nodeIds)]
    .map((id) => cy.getElementById(id))
    .filter((el) => el && el.length > 0)
    .map((el) => el[0]);
}

function syncNodeTimeDataFromEngine() {
  if (!window.cy || !engine?.getNodes) return;

  const engineNodes = engine.getNodes() || [];

  engineNodes.forEach((src) => {
    const id = src.id || src.refId;
    if (!id) return;

    const node = cy.getElementById(id);
    if (!node || node.length === 0) return;

    const timeValue =
      src.time ??
      src.date ??
      src.timestamp ??
      src.createdAt ??
      src.occurredAt ??
      null;

    if (timeValue !== null && timeValue !== undefined && timeValue !== "") {
      node.data("time", timeValue);
    }
  });
}

function restoreAllPromotedPatterns() {
  uiState.patternMap.forEach(p => {
    if (p.promoted) p.promoted = false;
  });

  renderPatterns(uiState.rawRankedResults || []);
}

function makePatternMiniExplorerDraggable() {
  const explorer = document.getElementById("pattern-mini-explorer");
  const head = document.getElementById("pattern-mini-explorer-head");

  if (!explorer || !head) return;
  if (explorer.dataset.dragBound === "true") return;

  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  explorer.addEventListener("mousedown", () => {
    bringExplorerToFront(explorer);
  });

  head.addEventListener("mousedown", (e) => {
    if (e.target.closest("button")) return;

    isDragging = true;

    const rect = explorer.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    explorer.style.right = "auto";
    explorer.style.left = `${rect.left}px`;
    explorer.style.top = `${rect.top}px`;

    document.body.style.userSelect = "none";
  });

  window.addEventListener("mousemove", (e) => {
    if (!isDragging) return;

    const explorerWidth = explorer.offsetWidth;
    const explorerHeight = explorer.offsetHeight;

    let nextLeft = e.clientX - offsetX;
    let nextTop = e.clientY - offsetY;

    const minLeft = 8;
    const minTop = 8;
    const maxLeft = window.innerWidth - explorerWidth - 8;
    const maxTop = window.innerHeight - explorerHeight - 8;

    nextLeft = Math.max(minLeft, Math.min(nextLeft, maxLeft));
    nextTop = Math.max(minTop, Math.min(nextTop, maxTop));

    explorer.style.left = `${nextLeft}px`;
    explorer.style.top = `${nextTop}px`;
  });

  window.addEventListener("mouseup", () => {
    isDragging = false;
    document.body.style.userSelect = "";
  });

  explorer.dataset.dragBound = "true";
}

function makePatternLinkExplorerDraggable() {
  const explorer = document.getElementById("pattern-link-explorer");
  const head = document.getElementById("pattern-link-explorer-head");

  if (!explorer || !head) return;
  if (explorer.dataset.dragBound === "true") return;

  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  explorer.addEventListener("mousedown", () => {
    bringExplorerToFront(explorer);
  });

  head.addEventListener("mousedown", (e) => {
    if (e.target.closest("button")) return;

    isDragging = true;

    const rect = explorer.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    explorer.style.right = "auto";
    explorer.style.left = `${rect.left}px`;
    explorer.style.top = `${rect.top}px`;
    explorer.style.transform = "none";

    document.body.style.userSelect = "none";
  });

  window.addEventListener("mousemove", (e) => {
    if (!isDragging) return;

    const explorerWidth = explorer.offsetWidth;
    const explorerHeight = explorer.offsetHeight;

    let nextLeft = e.clientX - offsetX;
    let nextTop = e.clientY - offsetY;

    const minLeft = 8;
    const minTop = 8;
    const maxLeft = window.innerWidth - explorerWidth - 8;
    const maxTop = window.innerHeight - explorerHeight - 8;

    nextLeft = Math.max(minLeft, Math.min(nextLeft, maxLeft));
    nextTop = Math.max(minTop, Math.min(nextTop, maxTop));

    explorer.style.left = `${nextLeft}px`;
    explorer.style.top = `${nextTop}px`;
  });

  window.addEventListener("mouseup", () => {
    isDragging = false;
    document.body.style.userSelect = "";
  });

  explorer.dataset.dragBound = "true";
}

function makePatternLinkTempEdgeEditorDraggable(editor) {
  if (!editor) return;
  if (editor.dataset.dragBound === "true") return;

  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  const head = editor.querySelector(".pl-temp-edge-editor-head");
  if (!head) return;

  editor.addEventListener("mousedown", () => {
    bringExplorerToFront(editor);
  });

  head.addEventListener("mousedown", (e) => {
    if (e.target.closest("button")) return;

    isDragging = true;

    const rect = editor.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    editor.style.transform = "none";
    editor.style.left = `${rect.left}px`;
    editor.style.top = `${rect.top}px`;

    document.body.style.userSelect = "none";
  });

window.addEventListener("mousemove", (e) => {
  if (!isDragging) return;

  const parentRect = editor.offsetParent
    ? editor.offsetParent.getBoundingClientRect()
    : { left: 0, top: 0 };

  const editorWidth = editor.offsetWidth;
  const editorHeight = editor.offsetHeight;

  let nextLeft = e.clientX - parentRect.left - offsetX;
  let nextTop = e.clientY - parentRect.top - offsetY;

  const maxLeft = (editor.offsetParent?.clientWidth || window.innerWidth) - editorWidth - 8;
  const maxTop = (editor.offsetParent?.clientHeight || window.innerHeight) - editorHeight - 8;

  nextLeft = Math.max(8, Math.min(nextLeft, maxLeft));
  nextTop = Math.max(8, Math.min(nextTop, maxTop));

  editor.style.left = `${nextLeft}px`;
  editor.style.top = `${nextTop}px`;
});

  window.addEventListener("mouseup", () => {
    isDragging = false;
    document.body.style.userSelect = "";
  });

  editor.dataset.dragBound = "true";
}

function getCurrentGroupExplorerFullBucketKeys() {
  const state = ensureGroupExplorerFullState();
  const items = getGroupExplorerFullItems();
  const axis = state.axis || "overall";

  if (axis === "overall") return [];

  return getGroupExplorerFullBuckets(items, axis).map((bucket) => bucket.key);
}

function expandAllGroupExplorerFullBuckets() {
  const state = ensureGroupExplorerFullState();
  state.expandedBucketKeys = getCurrentGroupExplorerFullBucketKeys();
  state.shouldAutoExpandFirstBucket = false;

  renderGroupExplorerFullSubview?.();
  saveLabState?.();
}

function collapseAllGroupExplorerFullBuckets() {
  const state = ensureGroupExplorerFullState();
  state.expandedBucketKeys = [];
  state.shouldAutoExpandFirstBucket = false;

  renderGroupExplorerFullSubview?.();
  saveLabState?.();
}

function enterGroupExplorerFullView(viewName) {
  const state = ensureGroupExplorerFullState();
  state.view = viewName || "status";

  if (els.groupExplorerFullHome) {
    els.groupExplorerFullHome.classList.add("hidden");
  }

  if (els.groupExplorerFullView) {
    els.groupExplorerFullView.classList.remove("hidden");
  }

  if (els.groupFullCurrentViewLabel) {
    els.groupFullCurrentViewLabel.textContent = String(viewName || "status").toUpperCase();
  }

  if (els.groupFullSearchInput) {
    els.groupFullSearchInput.value = state.query || "";
  }

  if (els.groupFullFilterSelect) {
    els.groupFullFilterSelect.value = state.filter || "ALL";
  }

  if (els.groupFullSortSelect) {
    els.groupFullSortSelect.value = state.sort || "name";
  }

  if (els.groupFullBucketSortSelect) {
  els.groupFullBucketSortSelect.value = state.bucketSort || "count";
}

  if (els.groupFullAxisSelect) {
  els.groupFullAxisSelect.value = state.axis || "overall";
}

  renderGroupExplorerFullSubview();
  saveLabState?.();
}

function getGroupExplorerFullExpandedBuckets() {
  const state = ensureGroupExplorerFullState();

  if (!Array.isArray(state.expandedBucketKeys)) {
    state.expandedBucketKeys = [];
  }

  return state.expandedBucketKeys;
}

function isGroupExplorerFullBucketExpanded(bucketKey) {
  return getGroupExplorerFullExpandedBuckets().includes(bucketKey);
}

function toggleGroupExplorerFullBucket(bucketKey) {
  if (!bucketKey) return;

  const state = ensureGroupExplorerFullState();
  const expanded = new Set(getGroupExplorerFullExpandedBuckets());

  if (expanded.has(bucketKey)) {
    expanded.delete(bucketKey);
  } else {
    expanded.add(bucketKey);
  }

  state.expandedBucketKeys = [...expanded];

  renderGroupExplorerFullSubview?.();
  saveLabState?.();
}

function getGroupExplorerFullBuckets(items, axis) {
  const buckets = new Map();

  const addToBucket = (bucketKey, bucketLabel, item) => {
    const key = String(bucketKey || "UNKNOWN");
    const label = String(bucketLabel || key);

    if (!buckets.has(key)) {
      buckets.set(key, {
        key,
        label,
        items: []
      });
    }

    buckets.get(key).items.push(item);
  };

  items.forEach((item) => {
    const meta = item.meta || {};
    const group = item.group || {};

    if (axis === "relation") {
      addToBucket(meta.relationTag || "UNKNOWN_RELATION", meta.relationTag || "UNKNOWN RELATION", item);
      return;
    }

    if (axis === "signature") {
      const tags = Array.isArray(meta.signatureTags) ? meta.signatureTags : [];

      if (!tags.length) {
        addToBucket("NO_SIGNATURE", "NO SIGNATURE", item);
        return;
      }

      tags.forEach((tag) => {
        addToBucket(tag, tag, item);
      });

      return;
    }

    if (axis === "purity") {
      const purity = Number(item.purity || 0);

      if (purity >= 0.75) {
        addToBucket("HIGH_PURITY", "HIGH PURITY", item);
      } else if (purity >= 0.45) {
        addToBucket("MID_PURITY", "MID PURITY", item);
      } else {
        addToBucket("LOW_PURITY", "LOW PURITY", item);
      }

      return;
    }

    if (axis === "contamination") {
      const contamination = Number(item.contamination || 0);

      if (contamination >= 0.5) {
        addToBucket("CONTAMINATED", "CONTAMINATED", item);
      } else if (contamination >= 0.2) {
        addToBucket("WATCH", "WATCH", item);
      } else {
        addToBucket("CLEAN", "CLEAN", item);
      }

      return;
    }

    if (axis === "center-node") {
      addToBucket(meta.centerNodeId || "NO_CENTER", meta.centerNodeId || "NO CENTER", item);
      return;
    }

    if (axis === "source-pattern") {
      const sourcePatternIds = Array.isArray(group.context?.sourcePatternIds)
        ? group.context.sourcePatternIds
        : [];

      if (!sourcePatternIds.length) {
        addToBucket("NO_SOURCE_PATTERN", "NO SOURCE PATTERN", item);
        return;
      }

      sourcePatternIds.forEach((id) => {
        addToBucket(id, id, item);
      });

      return;
    }

    if (axis === "source-layer") {
      const sourceLayerNames = Array.isArray(group.context?.sourceLayerNames)
        ? group.context.sourceLayerNames
        : [];

      if (!sourceLayerNames.length) {
        addToBucket("NO_SOURCE_LAYER", "NO SOURCE LAYER", item);
        return;
      }

      sourceLayerNames.forEach((name) => {
        addToBucket(name, name, item);
      });

      return;
    }

    if (axis === "reference-group") {
      const baseGroupId = getCurrentBaseGroupIdForExplorer?.() || null;
      const baseGroup = baseGroupId ? groupStore.get(baseGroupId) : null;
      const score = computeGroupSimilarityToReference?.(item, baseGroup) || 0;

      if (!baseGroup) {
        addToBucket("NO_BASE", "NO BASE GROUP", item);
        return;
      }

      if (score >= 0.55) {
        addToBucket("HIGH_SIMILARITY", "HIGH SIMILARITY", item);
      } else if (score >= 0.25) {
        addToBucket("MID_SIMILARITY", "MID SIMILARITY", item);
      } else {
        addToBucket("LOW_SIMILARITY", "LOW SIMILARITY", item);
      }

      return;
    }

    addToBucket("OVERALL", "OVERALL", item);
  });

  return [...buckets.values()]
    .map((bucket) => ({
      ...bucket,
      count: bucket.items.length,
      percent: Math.round((bucket.items.length / Math.max(1, items.length)) * 100)
    }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return String(a.label).localeCompare(String(b.label));
    });
}

function renderGroupExplorerFullBucket(bucket) {
  const isExpanded = isGroupExplorerFullBucketExpanded(bucket.key);
  const summary = getGroupBucketSummary(bucket);

  return `
    <section
      class="group-full-bucket ${isExpanded ? "expanded" : "collapsed"}"
      data-group-bucket="${bucket.key}"
    >
      <button
        type="button"
        class="group-full-bucket-head"
        data-group-bucket-toggle="${bucket.key}"
      >
        <div class="group-full-bucket-main">
          <div class="group-full-bucket-kicker">BUCKET</div>
          <div class="group-full-bucket-title">${bucket.label}</div>

          <div class="group-full-bucket-summary">
            <span>P avg ${summary.avgPurity.toFixed(2)}</span>
            <span>C avg ${summary.avgContamination.toFixed(2)}</span>
            <span>I avg ${summary.avgImportance.toFixed(2)}</span>
            <span>F avg ${summary.avgConfidence.toFixed(2)}</span>
            <span>rel ${summary.topRelation}</span>
            <span>center ${summary.topCenter}</span>
          </div>
        </div>

        <div class="group-full-bucket-stat">
          <b>${bucket.count}</b>
          <span>${bucket.percent}%</span>
          <em>${isExpanded ? "접기" : "펼치기"}</em>
        </div>
      </button>

      <div class="group-full-bucket-tools">
        <button
          type="button"
          class="group-full-bucket-bulk-btn"
          data-open-bucket-bulk="${bucket.key}"
        >
          Bulk Edit
        </button>
      </div>
      ${renderGroupBucketBulkEditPanel(bucket)}

      ${
        isExpanded
          ? `
            <div class="group-full-bucket-items">
              ${bucket.items.map((item) => renderGroupExplorerFullItem(item)).join("")}
            </div>
          `
          : ""
      }
    </section>
  `;
}

function bindGroupExplorerFullBuckets() {
  if (!els.groupExplorerFullSubview) return;

  els.groupExplorerFullSubview
    .querySelectorAll("[data-group-bucket-toggle]")
    .forEach((btn) => {
      btn.onclick = () => {
        const bucketKey = btn.dataset.groupBucketToggle;
        if (!bucketKey) return;

        toggleGroupExplorerFullBucket(bucketKey);
      };
    });

els.groupExplorerFullSubview
  .querySelectorAll("[data-open-bucket-bulk]")
  .forEach((btn) => {
    btn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();

      const bucketKey = btn.dataset.openBucketBulk;
      if (!bucketKey) return;

      openGroupBucketBulkEdit(bucketKey);
    };
  });

  els.groupExplorerFullSubview
    .querySelectorAll("[data-close-bucket-bulk]")
    .forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();
        closeGroupBucketBulkEdit();
      };
    });

  els.groupExplorerFullSubview
    .querySelectorAll("[data-bucket-bulk-category]")
    .forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();

        const category = btn.dataset.bucketBulkCategory;
        if (!category) return;

        const bulk = getGroupBucketBulkEditState();
        bulk.category = category;

        renderGroupExplorerFullSubview?.();
        saveLabState?.();
      };
    });

  els.groupExplorerFullSubview
    .querySelectorAll("[data-bucket-bulk-tag]")
    .forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();

        const row = btn.closest(".group-bucket-bulk-tag-row");
        if (!row) return;

        const tagKey = btn.dataset.bucketBulkTag;
        if (!tagKey) return;

        row.dataset.selectedBucketBulkTag = tagKey;

        row.querySelectorAll(".group-bucket-bulk-tag-btn").forEach((node) => {
          node.classList.toggle("active", node.dataset.bucketBulkTag === tagKey);
        });
      };
    });

  els.groupExplorerFullSubview
    .querySelectorAll("[data-apply-bucket-bulk]")
    .forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();

        const bucketKey = btn.dataset.applyBucketBulk;
        if (!bucketKey) return;

        const panel = btn.closest("[data-bucket-bulk-panel]");
        const tagRow = panel?.querySelector(".group-bucket-bulk-tag-row");
        const tagKey = tagRow?.dataset.selectedBucketBulkTag || "";

        const bulk = getGroupBucketBulkEditState();
        const category = bulk.category || "SELF_NODE";

        if (!tagKey) return;

        applyGroupBucketAdjustment(bucketKey, tagKey, {
          category
        });

        closeGroupBucketBulkEdit();
      };
    });

els.groupExplorerFullSubview
  .querySelectorAll("[data-undo-bulk]")
  .forEach((btn) => {
    console.log("BIND BULK UNDO", btn.dataset.undoBulk);

    btn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();

      const bulkId = btn.dataset.undoBulk;
      console.log("CLICK BULK UNDO", bulkId);

      if (!bulkId) return;

      const result = undoGroupBucketBulkAdjustment?.(bulkId);
      console.log("UNDO RESULT", result);
    };
  });

  const bulkHistoryBtn = document.getElementById("btn-open-group-bulk-history-explorer");
if (bulkHistoryBtn) {
  bulkHistoryBtn.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    openGroupBulkHistoryExplorer();
  };
}

}

function getGroupExplorerFullItems() {
  const state = ensureGroupExplorerFullState();

  const query = String(state.query || "").trim().toLowerCase();
  const filter = state.filter || "ALL";
  const sort = state.sort || "name";

  const activeSet = new Set(getGroupExplorerActiveGroupIds?.() || []);
  const previewSet = new Set(getGroupExplorerPreviewGroupIds?.() || []);
  const baseGroupId = getCurrentBaseGroupIdForExplorer?.() || null;

  let items = [...groupStore.values()]
    .filter(Boolean)
    .map((group) => {
      const meta = getGroupCardMeta(group);

      const purity = Number.isFinite(meta.purityScore) ? meta.purityScore : 0;
      const contamination = Number.isFinite(meta.contaminationScore) ? meta.contaminationScore : 0;
      const importance = Number.isFinite(meta.importanceScore) ? meta.importanceScore : 0;
      const confidence = Number.isFinite(meta.confidenceScore) ? meta.confidenceScore : 0;

      const id = group.id;
      const name = group.name || group.label || id;

      const searchable = [
        id,
        name,
        meta.centerNodeId,
        meta.relationTag,
        ...(meta.signatureTags || []),
        ...(meta.purityTags || []),
        ...(meta.contaminationTags || [])
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return {
        group,
        meta,
        id,
        name,
        searchable,
        isOn: activeSet.has(id),
        isPreview: previewSet.has(id),
        isBase: baseGroupId === id,
        purity,
        contamination,
        importance,
        confidence,
        memberCount: meta.nodeCount || 0,
        edgeCount: meta.edgeCount || 0
      };
    });

if (query) {
  const q = String(query).trim().toLowerCase();

  items = items.filter((item) => {
    const group = item.group || item.raw || item;

    const haystack = [
      item.id,
      item.groupId,
      item.name,
      item.label,
      group?.id,
      group?.name,
      group?.label,
      group?.type,
      group?.relationTag,
      ...(Array.isArray(group?.tags) ? group.tags : []),
      ...(Array.isArray(group?.signatureTags) ? group.signatureTags : [])
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(q);
  });
}

  if (filter !== "ALL") {
    items = items.filter((item) => {
      if (filter === "ON") return item.isOn;
      if (filter === "PREVIEW") return item.isPreview;
      if (filter === "BASE") return item.isBase;
      if (filter === "HIGH_PURITY") return item.purity >= 0.75;
      if (filter === "CONTAMINATED") return item.contamination >= 0.5;
      if (filter === "LOW_CONFIDENCE") return item.confidence <= 0.35;
      if (filter === "MERGED") return String(item.id).includes("MERGED") || String(item.name).includes("Merged");
      if (filter === "PATTERN") return String(item.id).includes("PATTERN");
      if (filter === "LAYER") return String(item.id).includes("LAYER");
      if (filter === "MANUAL") return String(item.id).includes("MANUAL");
      return true;
    });
  }

  items.sort((a, b) => {
    if (sort === "purity") return b.purity - a.purity;
    if (sort === "contamination") return b.contamination - a.contamination;
    if (sort === "importance") return b.importance - a.importance;
    if (sort === "confidence") return b.confidence - a.confidence;
    if (sort === "members") return b.memberCount - a.memberCount;
    if (sort === "edges") return b.edgeCount - a.edgeCount;
    if (sort === "base-similarity") {
  const baseGroupId = getCurrentBaseGroupIdForExplorer?.() || null;
  const baseGroup = baseGroupId ? groupStore.get(baseGroupId) : null;

  if (!baseGroup) {
    return String(a.name).localeCompare(String(b.name));
  }

  return (
    computeGroupSimilarityToReference(b, baseGroup) -
    computeGroupSimilarityToReference(a, baseGroup)
  );
}

    // base-similarity는 아직 계산식 전이라 임시로 이름순 fallback
    return String(a.name).localeCompare(String(b.name));
  });

  return items;
}

function makeGroupBucketBulkExplorerDraggable(el) {
  if (!el || el.dataset.draggableBound === "true") return;

  const head = el.querySelector(".group-bucket-bulk-explorer-head");
  if (!head) return;

  let dragging = false;
  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;

  head.addEventListener("mousedown", (e) => {
    dragging = true;
    startX = e.clientX;
    startY = e.clientY;

    const rect = el.getBoundingClientRect();
    startLeft = rect.left;
    startTop = rect.top;

    e.preventDefault();
  });

  window.addEventListener("mousemove", (e) => {
    if (!dragging) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    el.style.left = `${startLeft + dx}px`;
    el.style.top = `${startTop + dy}px`;
    el.style.right = "auto";
  });

  window.addEventListener("mouseup", () => {
    dragging = false;
  });

  el.dataset.draggableBound = "true";
}

function renderGroupExplorerFullSubview() {
  const state = ensureGroupExplorerFullState();

  if (!els.groupExplorerFullSubview) return;

  closeGroupRelatedKeywords?.();

  if (state.view === "theory") {
    els.groupExplorerFullSubview.innerHTML = `
      <div class="group-full-placeholder">
        THEORY VIEW 준비 중 — 지식의 원 알고리즘과 연결될 상위 분석 영역
      </div>
    `;
    return;
  }

  if (state.view === "structure") {
    els.groupExplorerFullSubview.innerHTML = `
      <div class="group-full-placeholder">
        STRUCTURE VIEW 준비 중 — 상위/하위 group, 병합/분해 후보 예정
      </div>
    `;
    return;
  }

  if (state.view === "reference") {
    els.groupExplorerFullSubview.innerHTML = `
      <div class="group-full-placeholder">
        REFERENCE VIEW 준비 중 — Pattern / Layer / EVT 참조 예정
      </div>
    `;
    return;
  }

  const items = getGroupExplorerFullItems();
  const axis = state.axis || "overall";

  if (els.groupFullBucketActions) {
  els.groupFullBucketActions.classList.toggle("hidden", axis === "overall");
}

  if (!items.length) {
    els.groupExplorerFullSubview.innerHTML = `
      <div class="group-full-placeholder">
        조건에 맞는 GROUP 없음
      </div>
    `;
    return;
  }

  if (axis === "overall") {
    els.groupExplorerFullSubview.innerHTML = `
      <div class="group-full-list">
        ${items.map((item) => renderGroupExplorerFullItem(item)).join("")}
      </div>
    `;

    bindGroupExplorerFullItems?.();
    return;
  }

  const buckets = sortGroupExplorerFullBuckets(
  getGroupExplorerFullBuckets(items, axis)
);

  if (!Array.isArray(state.expandedBucketKeys)) {
    state.expandedBucketKeys = [];
  }

  // axis가 바뀐 직후에만 첫 bucket 자동 펼침
  if (state.shouldAutoExpandFirstBucket === true && buckets.length) {
    state.expandedBucketKeys = [buckets[0].key];
    state.shouldAutoExpandFirstBucket = false;
  }

els.groupExplorerFullSubview.innerHTML = `
  ${renderGroupBulkHistory()}

  <div class="group-full-bucket-list">
    ${buckets.map((bucket) => renderGroupExplorerFullBucket(bucket)).join("")}
  </div>
`;

  bindGroupExplorerFullBuckets?.();
  bindGroupExplorerFullItems?.();
}

function computeGroupSimilarityToReference(item, referenceGroup) {
  if (!item?.group || !referenceGroup) return 0;

  const aNodes = new Set(getGroupAllNodeIds?.(item.group) || []);
  const bNodes = new Set(getGroupAllNodeIds?.(referenceGroup) || []);

  let common = 0;
  aNodes.forEach((id) => {
    if (bNodes.has(id)) common += 1;
  });

  const union = new Set([...aNodes, ...bNodes]).size || 1;
  const nodeScore = common / union;

  const aMeta = item.meta || {};
  const bMeta = getGroupCardMeta?.(referenceGroup) || {};

  const relationScore =
    aMeta.relationTag && bMeta.relationTag && aMeta.relationTag === bMeta.relationTag
      ? 0.25
      : 0;

  return nodeScore + relationScore;
}

function getGlobalSearchItems() {
  const items = [];

  groupStore.forEach((group) => {
    if (!group) return;

    const meta = getGroupCardMeta?.(group) || {};

    items.push({
      scope: "GROUP",
      id: group.id,
      title: group.name || group.label || group.id,
      text: [
        group.id,
        group.name,
        group.label,
        meta.centerNodeId,
        meta.relationTag,
        ...(meta.signatureTags || []),
        ...(meta.purityTags || []),
        ...(meta.contaminationTags || [])
      ].filter(Boolean).join(" "),
      ref: group
    });
  });

  (uiState.savedLayers || []).forEach((layer) => {
    if (!layer) return;

    items.push({
      scope: "LAYER",
      id: layer.name || layer.id,
      title: layer.name || layer.id || "Layer",
      text: [
        layer.name,
        layer.id,
        layer.memo,
        layer.description,
        ...(layer.nodes || [])
      ].filter(Boolean).join(" "),
      ref: layer
    });
  });

  (uiState.events || []).forEach((evt) => {
    if (!evt) return;

    items.push({
      scope: "EVENT",
      id: evt.id,
      title: evt.name || evt.label || evt.id,
      text: [
        evt.id,
        evt.name,
        evt.label,
        evt.memo,
        evt.description,
        evt.mode,
        evt.type
      ].filter(Boolean).join(" "),
      ref: evt
    });
  });

  const patterns = Array.isArray(uiState.lastDetectedPatterns)
    ? uiState.lastDetectedPatterns
    : [];

  patterns.forEach((p) => {
    const pattern = p?.pattern || p;
    if (!pattern) return;

    items.push({
      scope: "PATTERN",
      id: pattern.id || pattern.name,
      title: pattern.name || pattern.id || "Pattern",
      text: [
        pattern.id,
        pattern.name,
        pattern.type,
        pattern.relationTag,
        ...(pattern.nodes || [])
      ].filter(Boolean).join(" "),
      ref: pattern
    });
  });

  return items.map((item) => ({
    ...item,
    searchable: String(item.text || "").toLowerCase()
  }));
}

function renderGlobalSearchResults() {
  if (!els.globalSearchInput || !els.globalSearchResults) return;

  const query = String(els.globalSearchInput.value || "").trim().toLowerCase();

  if (!query) {
    els.globalSearchResults.classList.add("hidden");
    els.globalSearchResults.innerHTML = "";
    renderGlobalRelatedKeywords?.();
    return;
  }

  recordKeywordLearning(GLOBAL_KEYWORD_LEARNING_KEY, query);

  const items = getGlobalSearchItems()
    .filter((item) => item.searchable.includes(query))
    .slice(0, 20);

if (!items.length) {
  els.globalSearchResults.classList.add("hidden");
  els.globalSearchResults.innerHTML = "";

  if (els.globalRelatedKeywords) {
    els.globalRelatedKeywords.innerHTML = `
      <div class="global-search-empty-inline">
        검색 결과 없음
      </div>
    `;
  }

  return;
}

  els.globalSearchResults.classList.remove("hidden");
  els.globalSearchResults.innerHTML = items.map((item) => `
    <button
      type="button"
      class="global-search-result"
      data-global-scope="${item.scope}"
      data-global-id="${item.id}"
    >
      <span>${item.scope}</span>
      <b>${item.title}</b>
      <small>${item.id || "-"}</small>
    </button>
  `).join("");

  els.globalSearchResults
    .querySelectorAll("[data-global-scope]")
    .forEach((btn) => {
      btn.onclick = () => {
        const scope = btn.dataset.globalScope;
        const id = btn.dataset.globalId;

        handleGlobalSearchOpen(scope, id);

        els.globalSearchResults.classList.add("hidden");
      };
    });
}

function bindGlobalHubPanelClose() {
  const hub = document.getElementById("global-hub-panel");
  const body = document.getElementById("global-hub-body");
  if (!hub) return;
  if (hub.dataset.closeBound === "true") return;

  hub.addEventListener("click", (e) => {
    if (e.target === hub) {
      closeGlobalHubPanel?.();
    }
  });

  if (body) {
    body.addEventListener("click", (e) => {
      // input, button, results 같은 실제 요소 클릭은 유지
      if (e.target.closest("input, button, select, textarea, .global-search-result, .global-related-keyword-chip")) {
        return;
      }

      // body 빈공간 클릭만 닫기
      if (e.target === body) {
        closeGlobalHubPanel?.();
      }
    });
  }

  hub.dataset.closeBound = "true";
}

function bindGlobalHubEscClose() {
  if (document.body.dataset.globalHubEscBound === "true") return;

  window.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;

    const hub = document.getElementById("global-hub-panel");
    if (!hub || hub.classList.contains("hidden")) return;

    closeGlobalHubPanel?.();
  });

  document.body.dataset.globalHubEscBound = "true";
}

function bindLabTitleDragHub() {
  const bar = document.getElementById("lab-title-drag-bar") || document.getElementById("lab-title");
  const hub = document.getElementById("global-hub-panel");
  if (!bar || !hub) return;
  if (bar.dataset.dragHubBound === "true") return;

  let startY = 0;
  let dragging = false;

  bar.addEventListener("mousedown", (e) => {
    dragging = true;
    startY = e.clientY;
  });

  window.addEventListener("mousemove", (e) => {
    if (!dragging) return;

    const dy = e.clientY - startY;

    if (dy > 45) {
      openGlobalHubPanel();
      dragging = false;
    }
  });

  window.addEventListener("mouseup", () => {
    dragging = false;
  });

  bar.dataset.dragHubBound = "true";
}

function openGlobalHubPanel() {
  const hub = document.getElementById("global-hub-panel");
  if (!hub) return;

  document.body.classList.add("global-hub-open");
  hub.classList.remove("hidden");

  renderGlobalRelatedKeywords?.();
  renderGlobalSearchResults?.();
}

function closeGlobalHubPanel() {
  const hub = document.getElementById("global-hub-panel");
  if (!hub) return;

  document.body.classList.remove("global-hub-open");
  hub.classList.add("hidden");
}

function handleGlobalSearchOpen(scope, id) {
  if (!scope || !id) return;

  if (scope === "GROUP") {
    openGroupExplorerForCurrentPage?.();
    handleGroupExplorerSelect?.(id);
    return;
  }

  if (scope === "LAYER") {
    const layer = (uiState.savedLayers || []).find((l) => (l.name || l.id) === id);
    if (layer?.name) {
      uiState.currentLayerName = layer.name;
      refreshCurrentView?.();
      renderLayerPanel?.();
    }
    return;
  }

  if (scope === "EVENT") {
    selectEvent?.(id, false);
    renderRightPanelView?.();
    return;
  }

  if (scope === "PATTERN") {
    uiState.selectedPatternId = id;
    enterPatternPage?.();
    renderPatternPage?.();
  }
}

function getGlobalRelatedKeywordStats() {
  const items = getGlobalSearchItems();
  const learned = loadKeywordLearning(GLOBAL_KEYWORD_LEARNING_KEY);
  const counts = new Map();
  const total = Math.max(1, items.length);

  const add = (keyword, scope) => {
    const text = String(keyword || "").trim();
    if (!text) return;

    const prev = counts.get(text) || {
      keyword: text,
      count: 0,
      scopes: new Set()
    };

    prev.count += 1;
    prev.scopes.add(scope);
    counts.set(text, prev);
  };

  items.forEach((item) => {
    add(item.scope, item.scope);
    String(item.text || "")
      .split(/\s+/)
      .filter((word) => word.length >= 3)
      .slice(0, 20)
      .forEach((word) => add(word, item.scope));
  });

  return [...counts.values()]
    .map((entry) => {
      const learnedCount = Number(learned[entry.keyword]?.count || 0);
      const percent = Math.round((entry.count / total) * 100);
      const learningBoost = Math.min(25, Math.round(Math.log1p(learnedCount) * 8));

      return {
        keyword: entry.keyword,
        count: entry.count,
        percent,
        learnedCount,
        score: percent + learningBoost,
        scopes: [...entry.scopes]
      };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.count - a.count;
    })
    .slice(0, 12);
}

function ensureGroupBucketBulkExplorerEl() {
  let el = document.getElementById("group-bucket-bulk-explorer");
  if (el) return el;

  el = document.createElement("div");
  el.id = "group-bucket-bulk-explorer";
  el.className = "group-bucket-bulk-explorer hidden";

  el.innerHTML = `
    <div class="group-bucket-bulk-explorer-head">
      <div>
        <div class="group-bucket-bulk-kicker">BUCKET BULK EDIT</div>
        <div id="group-bucket-bulk-explorer-title" class="group-bucket-bulk-title">-</div>
      </div>

      <button id="btn-close-group-bucket-bulk-explorer" type="button">닫기</button>
    </div>

    <div id="group-bucket-bulk-explorer-body"></div>
  `;

  document.body.appendChild(el);

  const closeBtn = el.querySelector("#btn-close-group-bucket-bulk-explorer");
  if (closeBtn) {
    closeBtn.onclick = () => {
      closeGroupBucketBulkExplorer();
    };
  }

  makeGroupBucketBulkExplorerDraggable(el);

  return el;
}

function openGroupBucketBulkExplorer(bucketKey) {
  const bucket = getCurrentGroupExplorerFullBucketByKey(bucketKey);
  if (!bucket) return;

  const el = ensureGroupBucketBulkExplorerEl();
  el.dataset.bucketKey = bucketKey;
  el.classList.remove("hidden");

  const title = el.querySelector("#group-bucket-bulk-explorer-title");
  if (title) {
    title.textContent = `${bucket.label || bucket.key} · ${bucket.count} groups`;
  }

  renderGroupBucketBulkExplorerBody(bucketKey);
}

function closeGroupBucketBulkExplorer() {
  const el = document.getElementById("group-bucket-bulk-explorer");
  if (!el) return;

  el.classList.add("hidden");
}

function renderGroupBucketBulkExplorerBody(bucketKey, category = "GROUP_STRUCTURE") {
  const body = document.getElementById("group-bucket-bulk-explorer-body");
  if (!body) return;

  const bucket = getCurrentGroupExplorerFullBucketByKey(bucketKey);
  if (!bucket) return;

  const categories = getEntityTagCategories("GROUP");
  const rules = getEntityTagRules("GROUP", category);
  const firstTag = rules[0]?.key || "";

  body.innerHTML = `
    <div class="group-bucket-bulk-explorer-summary">
      <span>BUCKET ${bucket.label || bucket.key}</span>
      <span>${bucket.count} groups</span>
      <span>${bucket.percent}%</span>
    </div>

    <div class="group-bucket-bulk-category-row">
      ${Object.entries(categories).map(([key, label]) => `
        <button
          type="button"
          class="group-bucket-bulk-category-btn ${key === category ? "active" : ""}"
          data-bucket-bulk-category="${key}"
        >
          <span>${key}</span>
          <b>${label}</b>
        </button>
      `).join("")}
    </div>

    <div class="group-bucket-bulk-tag-row" data-selected-bucket-bulk-tag="${firstTag}">
      ${
        rules.length
          ? rules.map((rule, index) => {
              const effect = rule.effects?.[0];
              const effectText = effect
                ? `${effect.target} ${effect.direction} ${effect.min ?? 0}~${effect.max ?? effect.min ?? 0}`
                : "effect -";

              return `
                <button
                  type="button"
                  class="group-bucket-bulk-tag-btn ${index === 0 ? "active" : ""}"
                  data-bucket-bulk-tag="${rule.key}"
                >
                  <span>${rule.key}</span>
                  <b>${rule.label}</b>
                  <small>${rule.category} · ${effectText}</small>
                </button>
              `;
            }).join("")
          : `<div class="group-edit-empty">해당 카테고리 태그 없음</div>`
      }
    </div>

    <div class="group-bucket-bulk-actions">
      <button
        type="button"
        class="group-bucket-bulk-apply"
        data-apply-bucket-bulk="${bucket.key}"
      >
        Apply to Bucket
      </button>
    </div>
  `;

  bindGroupBucketBulkExplorerActions(bucketKey);
}

function bindGroupBucketBulkExplorerActions(bucketKey) {
  const el = document.getElementById("group-bucket-bulk-explorer");
  if (!el) return;

  el.querySelectorAll("[data-bucket-bulk-category]").forEach((btn) => {
    btn.onclick = () => {
      const category = btn.dataset.bucketBulkCategory || "GROUP_STRUCTURE";
      renderGroupBucketBulkExplorerBody(bucketKey, category);
    };
  });

  el.querySelectorAll("[data-bucket-bulk-tag]").forEach((btn) => {
    btn.onclick = () => {
      const row = btn.closest(".group-bucket-bulk-tag-row");
      if (!row) return;

      const tagKey = btn.dataset.bucketBulkTag;
      if (!tagKey) return;

      row.dataset.selectedBucketBulkTag = tagKey;

      row.querySelectorAll(".group-bucket-bulk-tag-btn").forEach((node) => {
        node.classList.toggle("active", node.dataset.bucketBulkTag === tagKey);
      });
    };
  });

  el.querySelectorAll("[data-apply-bucket-bulk]").forEach((btn) => {
    btn.onclick = () => {
      const row = el.querySelector(".group-bucket-bulk-tag-row");
      const tagKey = row?.dataset.selectedBucketBulkTag || "";
      if (!tagKey) return;

      const categoryBtn = el.querySelector(".group-bucket-bulk-category-btn.active");
      const category = categoryBtn?.dataset.bucketBulkCategory || "GROUP_STRUCTURE";

      applyGroupBucketAdjustment(bucketKey, tagKey, {
        category
      });

      closeGroupBucketBulkExplorer();
      renderGroupExplorerFullSubview?.();
    };
  });
}

function renderGlobalRelatedKeywords() {
  if (!els.globalRelatedKeywords) return;

  const stats = getGlobalRelatedKeywordStats();

  if (!stats.length) {
    els.globalRelatedKeywords.innerHTML = "";
    els.globalRelatedKeywords.classList.add("hidden");
    return;
  }

  els.globalRelatedKeywords.classList.remove("hidden");

  els.globalRelatedKeywords.innerHTML = stats.map((s) => `
    <button
      type="button"
      class="global-related-keyword-chip"
      data-global-keyword="${s.keyword}"
      title="${s.count} items · ${s.percent}% · ${s.scopes.join(", ")}"
    >
      ${s.keyword}
      <b>${s.percent}%</b>
      ${s.learnedCount ? `<span>L${s.learnedCount}</span>` : ""}
    </button>
  `).join("");

  els.globalRelatedKeywords
    .querySelectorAll("[data-global-keyword]")
    .forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();

        const keyword = btn.dataset.globalKeyword || "";

        recordKeywordLearning(GLOBAL_KEYWORD_LEARNING_KEY, keyword);

        if (els.globalSearchInput) {
          els.globalSearchInput.value = keyword;
        }

        renderGlobalSearchResults();
      };
    });
}

function bindGlobalRelatedKeywordClose() {
  if (document.body.dataset.globalRelatedCloseBound === "true") return;

  document.addEventListener("click", (e) => {
    const isInsideGlobalSearch =
      e.target.closest("#global-search-box") ||
      e.target.closest("#global-related-keywords") ||
      e.target.closest("#global-search-results");

    if (isInsideGlobalSearch) return;

    closeGlobalRelatedKeywords?.();
  });

  document.body.dataset.globalRelatedCloseBound = "true";
}

function renderGroupNameIcon(item) {
  const label = item.name || item.id;
  const short = String(label).replace(/^GROUP[-_]?/i, "").slice(0, 18);

  return `
    <button class="group-name-icon" data-group-id="${item.id}" title="${label}">
      ${short}
    </button>
  `;
}

function renderGroupExplorerFullItem(item) {
const tags = [];

if (item.isBase) {
  tags.push(`<span class="group-full-tag tag-base">BASE</span>`);
}

const itemClass = [
  "group-full-item",
  item.isBase ? "is-base" : ""
].filter(Boolean).join(" ");

  return `
    <div class="${itemClass}" data-group-id="${item.id}">
      <div class="group-full-item-head">
        <div>
          <div class="group-full-item-id">${item.id}</div>
          <div class="group-full-item-title">${item.name}</div>
        </div>
        <div class="group-full-item-tags">
          ${tags.join("")}
        </div>
      </div>

      <div class="group-full-item-meta">
        <span>center ${item.meta.centerNodeId || "-"}</span>
        <span>relation ${item.meta.relationTag || "-"}</span>
        <span>node ${item.memberCount}</span>
        <span>edge ${item.edgeCount}</span>
      </div>

      <div class="group-full-item-metrics">
        <span>P ${Number(item.purity).toFixed(2)}</span>
        <span>C ${Number(item.contamination).toFixed(2)}</span>
        <span>I ${Number(item.importance).toFixed(2)}</span>
        <span>F ${Number(item.confidence).toFixed(2)}</span>
      </div>
    </div>
  `;
}

function bindGroupExplorerFullItems() {
  if (!els.groupExplorerFullSubview) return;

  els.groupExplorerFullSubview
    .querySelectorAll(".group-full-item[data-group-id]")
    .forEach((card) => {
      card.onclick = () => {
        const id = card.dataset.groupId;
        if (!id) return;

        openGroupExplorerFullDetail(id);
      };

      card.ondblclick = (e) => {
        e.preventDefault();

        const id = card.dataset.groupId;
        if (!id) return;

        openGroupExplorerFullDetail(id);
      };
    });
}

function openGroupExplorerFullDetail(groupId) {
  const group = groupStore.get(groupId);
  if (!group || !els.groupExplorerFullSubview) return;

  const state = ensureGroupExplorerFullState();
  state.detailGroupId = groupId;

  const meta = getGroupCardMeta(group);

  const purityText = Number.isFinite(meta.purityScore)
    ? meta.purityScore.toFixed(2)
    : "-";

  const contaminationText = Number.isFinite(meta.contaminationScore)
    ? meta.contaminationScore.toFixed(2)
    : "-";

  const importanceText = Number.isFinite(meta.importanceScore)
    ? meta.importanceScore.toFixed(2)
    : "-";

  const confidenceText = Number.isFinite(meta.confidenceScore)
    ? meta.confidenceScore.toFixed(2)
    : "-";

  const gText = Number.isFinite(meta.gScore)
    ? meta.gScore.toFixed(2)
    : "-";

  const memberNodeIds = getGroupMemberNodeIds?.(group) || [];
  const requiredNodeIds = getGroupRequiredNodeIds?.(group) || [];
  const signatureTags = getGroupSignatureTags?.(group) || [];
  const purityTags = getGroupPurityTags?.(group) || [];
  const contaminationTags = getGroupContaminationTags?.(group) || [];

  const sourcePatternText =
    Array.isArray(group.context?.sourcePatternIds) && group.context.sourcePatternIds.length
      ? group.context.sourcePatternIds.join(", ")
      : "-";

  const sourceLayerText =
    Array.isArray(group.context?.sourceLayerNames) && group.context.sourceLayerNames.length
      ? group.context.sourceLayerNames.join(", ")
      : "-";

  els.groupExplorerFullSubview.innerHTML = `
    <div class="group-full-detail">
      <div class="group-full-detail-head">
        <div>
          <div class="group-full-detail-kicker">GROUP DETAIL</div>
          <div class="group-full-detail-title">${group.name || group.label || group.id}</div>
          <div class="group-full-detail-id">${group.id}</div>
        </div>

        <button id="btn-group-full-detail-back" type="button">
          Back to List
        </button>
      </div>

      <div class="group-full-detail-grid">
        <section class="group-full-detail-card">
          <div class="group-full-detail-card-title">STRUCTURE</div>
          <div class="group-full-detail-row"><span>Center</span><b>${meta.centerNodeId || "-"}</b></div>
          <div class="group-full-detail-row"><span>Relation</span><b>${meta.relationTag || "-"}</b></div>
          <div class="group-full-detail-row"><span>Members</span><b>${memberNodeIds.length}</b></div>
          <div class="group-full-detail-row"><span>Required</span><b>${requiredNodeIds.length}</b></div>
          <div class="group-full-detail-row"><span>Edges</span><b>${meta.edgeCount}</b></div>
          <div class="group-full-detail-row"><span>Nodes</span><b>${meta.nodeCount}</b></div>
        </section>

        <section class="group-full-detail-card">
          <div class="group-full-detail-card-title">EVALUATION</div>
          <div class="group-full-detail-row"><span>Purity</span><b>${purityText}</b></div>
          <div class="group-full-detail-row"><span>Contamination</span><b>${contaminationText}</b></div>
          <div class="group-full-detail-row"><span>Importance</span><b>${importanceText}</b></div>
          <div class="group-full-detail-row"><span>Confidence</span><b>${confidenceText}</b></div>
          <div class="group-full-detail-row"><span>G</span><b>${gText}</b></div>
        </section>

        <section class="group-full-detail-card">
          <div class="group-full-detail-card-title">TAGS</div>
          <div class="group-full-chip-row">
${renderGroupDetailTagChips(signatureTags, "signature")}
          </div>
        </section>

        <section class="group-full-detail-card">
          <div class="group-full-detail-card-title">PURITY TAGS</div>
          <div class="group-full-chip-row">
${renderGroupDetailTagChips(purityTags, "purity")}
          </div>
        </section>

        <section class="group-full-detail-card">
          <div class="group-full-detail-card-title">CONTAMINATION TAGS</div>
          <div class="group-full-chip-row">
${renderGroupDetailTagChips(contaminationTags, "contamination")}
          </div>
        </section>

        <section
  class="group-full-detail-card group-full-edit-card group-detail-bucket collapsed"
  data-group-detail-bucket="tag-edit"
>
  <button
    type="button"
    class="group-detail-bucket-head"
    data-toggle-group-detail-bucket="tag-edit"
  >
    <span>TAG EDIT</span>
    <b>열기</b>
  </button>

  <div class="group-detail-bucket-body">
    <div class="group-edit-tag-picker">
      <div class="group-edit-field-title">Adjustment Category</div>
      <div
        id="group-edit-adjustment-category-buttons"
        class="group-edit-category-buttons"
      ></div>

      <div class="group-edit-field-title tag-title-gap">Adjustment Tag</div>
      <div
        id="group-edit-adjustment-tag-buttons"
        class="group-edit-tag-buttons"
      ></div>
    </div>

    <div class="group-full-edit-actions adjustment-actions">
      <button id="btn-group-edit-add-adjustment" type="button">
        적용하기
      </button>
    </div>
  </div>
</section>

<section
  class="group-full-detail-card group-full-edit-card group-detail-bucket collapsed"
  data-group-detail-bucket="tag-creator"
>
  <button
    type="button"
    class="group-detail-bucket-head"
    data-toggle-group-detail-bucket="tag-creator"
  >
    <span>TAG CREATOR</span>
    <b>열기</b>
  </button>

  <div class="group-detail-bucket-body">
    <div class="group-full-detail-card-headline">
      <div class="group-full-detail-card-title">TAG CREATOR</div>

      <button id="btn-open-group-tag-delete-explorer" type="button">
        삭제하기
      </button>
    </div>

    <div class="group-tag-create-grid">
      <label>
        <span>New Category</span>
        <input
          id="group-category-create-key"
          type="text"
          placeholder="GROUP_RISK"
        />
      </label>

      <label>
        <span>Category Label</span>
        <input
          id="group-category-create-label"
          type="text"
          placeholder="그룹 위험"
        />
      </label>

      <div class="group-tag-create-actions-inline left">
        <button id="btn-group-category-create" type="button">
          카테고리 만들기
        </button>
      </div>

      <label>
        <span>Category</span>
        <select id="group-tag-create-category">
          ${renderGroupTagCreateCategoryOptions?.() || `
            <option value="GROUP_STRUCTURE">GROUP_STRUCTURE</option>
            <option value="ALGORITHM">ALGORITHM</option>
            <option value="THEORY">THEORY</option>
          `}
        </select>
      </label>

      <label>
        <span>Tag Key</span>
        <input id="group-tag-create-key" type="text" placeholder="NOISE" />
      </label>

      <label>
        <span>Label</span>
        <input id="group-tag-create-label" type="text" placeholder="노이즈" />
      </label>

      <label>
        <span>Metric</span>
        <select id="group-tag-create-target">
          <option value="purity">purity</option>
          <option value="contamination">contamination</option>
          <option value="importance">importance</option>
          <option value="confidence">confidence</option>
          <option value="g">g</option>
        </select>
      </label>

      <label>
        <span>Sign</span>
        <select id="group-tag-create-sign">
          <option value="-">-</option>
          <option value="+">+</option>
        </select>
      </label>

      <label>
        <span>Min</span>
        <input
          id="group-tag-create-min"
          type="number"
          step="0.001"
          value="0.030"
        />
      </label>

      <label>
        <span>Max</span>
        <input
          id="group-tag-create-max"
          type="number"
          step="0.001"
          value="0.080"
        />
      </label>

      <label>
        <span>Meaning</span>
        <input
          id="group-tag-create-meaning"
          type="text"
          placeholder="태그 의미"
        />
      </label>
    </div>

    <div class="group-full-edit-actions adjustment-actions">
      <button id="btn-group-tag-create" type="button">
        태그 만들기
      </button>
    </div>
  </div>
</section>

<section
  class="group-full-detail-card group-full-edit-card group-detail-bucket collapsed"
  data-group-detail-bucket="group-impact"
>
  <button
    type="button"
    class="group-detail-bucket-head"
    data-toggle-group-detail-bucket="group-impact"
  >
    <span>GROUP IMPACT</span>
    <b>열기</b>
  </button>

  <div class="group-detail-bucket-body">
    <div class="group-full-edit-grid">
      <label>
        <span>Source Group</span>
        <input
          id="group-impact-source-group"
          class="group-impact-readonly-input"
          type="text"
          readonly
          value="${group.name || group.label || group.id}"
        />
      </label>

      <label>
        <span>Target Group</span>
        <select id="group-impact-target-group"></select>
      </label>

      <label>
        <span>Relation Tag</span>
        <input
          id="group-impact-relation-tag"
          class="group-impact-readonly-input"
          type="text"
          readonly
          value="NONE"
        />
      </label>

      <div class="group-impact-cause-picker">
        <div class="group-edit-field-title">Impact Tag Category</div>
        <div
          id="group-impact-cause-category-buttons"
          class="group-edit-category-buttons"
        ></div>

        <div class="group-edit-field-title tag-title-gap">Impact Tag</div>
        <div
          id="group-impact-cause-tag-buttons"
          class="group-edit-tag-buttons"
        ></div>
      </div>

      <div class="group-impact-preview-box compact">
        <button id="btn-open-group-impact-preview-explorer" type="button">
          Preview Explorer 열기
        </button>
      </div>
    </div>

    <div class="group-full-edit-actions adjustment-actions">
      <button id="btn-group-impact-apply" type="button">
        적용하기
      </button>
    </div>
  </div>
</section>

        <section class="group-full-detail-card group-full-edit-log-card">
  <div class="group-full-detail-card-title">EDIT HISTORY</div>
  <div id="group-edit-log-summary"></div>
</section>

      </div>
    </div>
  `;

  const backBtn = document.getElementById("btn-group-full-detail-back");
  if (backBtn) {
    backBtn.onclick = () => {
      state.detailGroupId = null;
      renderGroupExplorerFullSubview();
    };
  }

  bindGroupFullEditControls?.(groupId);
bindGroupTagCreatorControls?.(groupId);
bindGroupImpactControls?.(groupId);
renderGroupFullEditLogSummary?.(groupId);
bindGroupDetailTagChips?.(groupId);
bindGroupDetailBuckets?.();

  saveLabState?.();
}

function ensureCustomTagRulesState() {
  if (!uiState.customTagRules || typeof uiState.customTagRules !== "object") {
    uiState.customTagRules = { GROUP: {} };
  }

  if (!uiState.customTagRules.GROUP || typeof uiState.customTagRules.GROUP !== "object") {
    uiState.customTagRules.GROUP = {};
  }

  return uiState.customTagRules;
}

function restoreCustomTagRulesToRuntime() {
  const custom = uiState.customTagRules;
  if (!custom?.GROUP) return;

  Object.entries(custom.GROUP).forEach(([category, rules]) => {
    if (!ENTITY_TAG_RULES.GROUP[category]) {
      ENTITY_TAG_RULES.GROUP[category] = {};
    }

    Object.entries(rules || {}).forEach(([key, rule]) => {
      ENTITY_TAG_RULES.GROUP[category][key] = {
        ...rule,
        custom: true
      };
    });
  });
}

function createCustomGroupTagRuleFromForm() {
  const category = document.getElementById("group-tag-create-category")?.value || "GROUP_STRUCTURE";
  const rawKey = document.getElementById("group-tag-create-key")?.value || "";
  const label = document.getElementById("group-tag-create-label")?.value || "";
  const target = document.getElementById("group-tag-create-target")?.value || "purity";
  const sign = document.getElementById("group-tag-create-sign")?.value || "-";
  const min = Number(document.getElementById("group-tag-create-min")?.value || 0);
  const max = Number(document.getElementById("group-tag-create-max")?.value || min);
  const meaning = document.getElementById("group-tag-create-meaning")?.value || "";

  const key = normalizeTagKey(rawKey);
  if (!key) return null;

  const direction = sign === "+" ? "up" : "down";

  const rule = {
    label: label || key,
    meaning,
    stat: "Alive",
    effects: [
      {
        target,
        direction,
        min: Number.isFinite(min) ? min : 0,
        max: Number.isFinite(max) ? max : min
      }
    ],
    custom: true,
    createdAt: Date.now()
  };

  if (!ENTITY_TAG_RULES.GROUP[category]) {
    ENTITY_TAG_RULES.GROUP[category] = {};
  }

  ENTITY_TAG_RULES.GROUP[category][key] = rule;

  const custom = ensureCustomTagRulesState();

  if (!custom.GROUP[category]) {
    custom.GROUP[category] = {};
  }

  custom.GROUP[category][key] = rule;

  saveLabState?.();

  return {
    key,
    category,
    rule
  };
}

function deleteCustomGroupTagRuleFromForm() {
  const category = document.getElementById("group-tag-create-category")?.value || "GROUP_STRUCTURE";
  const rawKey = document.getElementById("group-tag-create-key")?.value || "";
  const key = normalizeTagKey(rawKey);

  if (!key) return false;

  if (!isCustomGroupTagRule(category, key)) {
    console.warn("Only custom tags can be deleted:", {
      category,
      key
    });
    return false;
  }

  const custom = ensureCustomTagRulesState();

  delete custom.GROUP[category][key];

  if (ENTITY_TAG_RULES.GROUP?.[category]?.[key]?.custom) {
    delete ENTITY_TAG_RULES.GROUP[category][key];
  }

  saveLabState?.();

  return true;
}

function ensureRelationTagState() {
  if (!Array.isArray(uiState.relationTags)) {
    uiState.relationTags = [];
  }

  return uiState.relationTags;
}

function createRelationTagEntry(data = {}) {
  const relations = ensureRelationTagState();

  const entry = {
    id: `REL-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    fromType: data.fromType || "GROUP",
    fromId: data.fromId || null,
    toType: data.toType || "GROUP",
    toId: data.toId || null,
    tag: data.tag || "REF",
    strength: data.strength || "MID",
    source: data.source || "GRAPH",
    memo: data.memo || "",
    createdAt: Date.now()
  };

  if (!entry.fromId || !entry.toId) return null;

  relations.push(entry);
  saveLabState?.();

  return entry;
}

function getRelationsForEntity(entityType, entityId) {
  const relations = ensureRelationTagState();

  return relations.filter((rel) => {
    return (
      (rel.fromType === entityType && rel.fromId === entityId) ||
      (rel.toType === entityType && rel.toId === entityId)
    );
  });
}

function getRelationsForGroup(groupId) {
  return getRelationsForEntity("GROUP", groupId);
}

function formatRelationLabel(rel) {
  if (!rel) return "-";

  return `${rel.tag || "REF"} · ${rel.fromType}:${rel.fromId} → ${rel.toType}:${rel.toId}`;
}

function bindGroupTagCreatorControls(groupId) {
  const createCategoryBtn = document.getElementById("btn-group-category-create");
  //const deleteCategoryBtn = document.getElementById("btn-group-category-delete");
  const createTagBtn = document.getElementById("btn-group-tag-create");
  //const deleteTagBtn = document.getElementById("btn-group-tag-delete");
  const categorySelect = document.getElementById("group-tag-create-category");

  const openDeleteExplorerBtn = document.getElementById("btn-open-group-tag-delete-explorer");

  refreshGroupTagCreateCategorySelect(categorySelect?.value || "GROUP_STRUCTURE");

  if (categorySelect) {
    categorySelect.onchange = () => {
      renderEntityEditTagCategoryButtons?.("GROUP", categorySelect.value);
      renderEntityEditTagButtons?.("GROUP", categorySelect.value);

      renderEntityImpactCauseCategoryButtons?.("GROUP", categorySelect.value);
      renderEntityImpactCauseTagButtons?.("GROUP", categorySelect.value);

      refreshGroupImpactPreviewViews?.(groupId);
    };
  }

  if (createCategoryBtn) {
    createCategoryBtn.onclick = () => {
      const created = createCustomGroupTagCategoryFromForm();
      if (!created) return;

      refreshGroupTagCreateCategorySelect(created.key);

      renderEntityEditTagCategoryButtons?.("GROUP", created.key);
      renderEntityEditTagButtons?.("GROUP", created.key);

      renderEntityImpactCauseCategoryButtons?.("GROUP", created.key);
      renderEntityImpactCauseTagButtons?.("GROUP", created.key);

      refreshGroupImpactPreviewViews?.(groupId);
    };
  }

  if (createTagBtn) {
    createTagBtn.onclick = () => {
      const created = createCustomGroupTagRuleFromForm();
      if (!created) return;

      renderEntityEditTagCategoryButtons?.("GROUP", created.category);
      renderEntityEditTagButtons?.("GROUP", created.category);

      renderEntityImpactCauseCategoryButtons?.("GROUP", created.category);
      renderEntityImpactCauseTagButtons?.("GROUP", created.category);

      refreshGroupImpactPreviewViews?.(groupId);
    };
  }

if (openDeleteExplorerBtn) {
  openDeleteExplorerBtn.onclick = () => {
    openGroupTagDeleteExplorer(groupId);
  };
}

}

function ensureSuggestionState() {
  if (!Array.isArray(uiState.suggestions)) {
    uiState.suggestions = [];
  }

  return uiState.suggestions;
}

function bindGroupDetailBuckets() {
  document
    .querySelectorAll("[data-toggle-group-detail-bucket]")
    .forEach((btn) => {
      btn.onclick = () => {
        const key = btn.dataset.toggleGroupDetailBucket;
        const bucket = document.querySelector(`[data-group-detail-bucket="${key}"]`);
        if (!bucket) return;

        const collapsed = bucket.classList.toggle("collapsed");
        btn.querySelector("b").textContent = collapsed ? "열기" : "닫기";
      };
    });
}

function createSuggestion(data = {}) {
  const suggestions = ensureSuggestionState();

  const suggestion = {
    id: `SUG-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type: data.type || "AUTO_TAG_CANDIDATE",
    status: "NEW",

    dedupeKey: data.dedupeKey || null,

    entityType: data.entityType || "GROUP",
    entityId: data.entityId || null,

    suggestedTag: data.suggestedTag || null,
    displayTag: getDisplayTagName?.(data.suggestedTag) || data.suggestedTag || "-",
    category: data.category || null,
    strength: data.strength || "MID",

    reason: data.reason || "",
    evidence: data.evidence || null,

    previewBefore: data.previewBefore || null,
    previewAfter: data.previewAfter || null,
    previewDeltas: Array.isArray(data.previewDeltas)
      ? data.previewDeltas.map((delta) => ({ ...delta }))
      : [],

    sourceType: data.sourceType || null,
    sourceRef: data.sourceRef || null,
    sourceRole: data.sourceRole || "SUGGESTION",

    relationTags: Array.isArray(data.relationTags) ? [...data.relationTags] : [],
    hypothesisRefs: Array.isArray(data.hypothesisRefs) ? [...data.hypothesisRefs] : [],
    premiseRefs: Array.isArray(data.premiseRefs) ? [...data.premiseRefs] : [],

    createdAt: Date.now()
  };

  if (!suggestion.entityId || !suggestion.suggestedTag) {
    return null;
  }

if (suggestion.dedupeKey) {
  const duplicated = suggestions.some((item) => {
    return item.dedupeKey === suggestion.dedupeKey;
  });

  if (duplicated) {
    return null;
  }
}

  suggestions.unshift(suggestion);

  if (suggestions.length > 200) {
    uiState.suggestions = suggestions.slice(0, 200);
  }

  saveLabState?.();
  showSuggestionToast?.(suggestion);
  playSuggestionBeep?.();

  return suggestion;
}

const AUTO_GROUP_SUGGESTION_RULES = [
  {
    id: "GROUP_CONTAMINATION_HIGH",
    label: "오염도 상승",
    metric: "contaminationScore",
    operator: ">=",
    threshold: 0.2,
    suggestedTag: "GROUP_CONTAMINATED",
    category: "GROUP_STRUCTURE",
    strength: "STRONG",
    reasonTemplate: "contamination {value} >= {threshold}"
  },
  {
    id: "GROUP_PURITY_LOW",
    label: "순수성 하락",
    metric: "purityScore",
    operator: "<=",
    threshold: 0.65,
    suggestedTag: "GROUP_WEAK_RELATION",
    category: "GROUP_STRUCTURE",
    strength: "STRONG",
    reasonTemplate: "purity {value} <= {threshold}"
  },
  {
    id: "GROUP_CONFIDENCE_HIGH",
    label: "신뢰도 상승",
    metric: "confidenceScore",
    operator: ">=",
    threshold: 0.8,
    suggestedTag: "THEORY_CONFIRMED",
    category: "THEORY",
    strength: "MID",
    reasonTemplate: "confidence {value} >= {threshold}"
  }
];

function evaluateAutoSuggestionRule(value, rule) {
  const v = Number(value);
  const threshold = Number(rule?.threshold);

  if (!Number.isFinite(v) || !Number.isFinite(threshold)) {
    return false;
  }

  if (rule.operator === ">=") return v >= threshold;
  if (rule.operator === "<=") return v <= threshold;
  if (rule.operator === ">") return v > threshold;
  if (rule.operator === "<") return v < threshold;
  if (rule.operator === "==") return v === threshold;

  return false;
}

function dedupeSuggestionsByKey() {
  const suggestions = ensureSuggestionState();
  const seen = new Set();
  const kept = [];

  suggestions
    .slice()
    .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0))
    .forEach((item) => {
      const key =
        item.dedupeKey ||
        [
          item.type,
          item.entityType,
          item.entityId,
          item.suggestedTag,
          item.sourceType,
          item.sourceRef
        ].join(":");

      if (seen.has(key)) return;

      seen.add(key);
      kept.push(item);
    });

  uiState.suggestions = kept;

  saveLabState?.();
  renderSuggestionToasts?.();
  renderSuggestionInboxExplorer?.();
  renderUnreadMessageExplorer?.();

  return uiState.suggestions;
}

function formatAutoSuggestionReason(rule, value) {
  const valueText = Number(value).toFixed(3);
  const thresholdText = Number(rule.threshold).toFixed(3);

  return String(rule.reasonTemplate || `${rule.metric} ${rule.operator} ${rule.threshold}`)
    .replaceAll("{value}", valueText)
    .replaceAll("{threshold}", thresholdText);
}

function buildAutoSuggestionPreview(group, rule) {
  const meta = getGroupCardMeta(group);

  const before = {
    purity: Number(meta.purityScore || 0),
    contamination: Number(meta.contaminationScore || 0),
    importance: Number(meta.importanceScore || 0),
    confidence: Number(meta.confidenceScore || 0),
    g: Number(meta.gScore || 0)
  };

  const tagRule = findEntityTagRule?.("GROUP", rule.suggestedTag);
  const effects = Array.isArray(tagRule?.effects) ? tagRule.effects : [];

  const preview = applyEffectsToMetricPreview?.(before, effects) || {
    before,
    after: { ...before },
    deltas: []
  };

  return {
    before: preview.before,
    after: preview.after,
    deltas: preview.deltas
  };
}

function scanGroupSuggestionCandidates(groupId) {
  const group = groupStore.get(groupId);
  if (!group) return [];

  const meta = getGroupCardMeta(group);
  const created = [];

AUTO_GROUP_SUGGESTION_RULES.forEach((rule) => {
  const value = meta?.[rule.metric];

  // 이미 같은 tag가 group에 적용되어 있으면 제안하지 않음
  if (hasGroupTagApplied(group.id, rule.suggestedTag)) {
    return;
  }

  if (!evaluateAutoSuggestionRule(value, rule)) {
    return;
  }

  const preview = buildAutoSuggestionPreview(group, rule);

  const dedupeKey = [
    "AUTO_GROUP_RULE",
    rule.id,
    group.id,
    rule.suggestedTag
  ].join(":");

  const suggestion = createSuggestion({
    type: "AUTO_TAG_CANDIDATE",
    dedupeKey,

    entityType: "GROUP",
    entityId: group.id,

    suggestedTag: rule.suggestedTag,
    category: rule.category,
    strength: rule.strength || "MID",

    reason: formatAutoSuggestionReason(rule, value),
    evidence: {
      ruleId: rule.id,
      metric: rule.metric,
      operator: rule.operator,
      value,
      threshold: rule.threshold
    },

    previewBefore: preview.before,
    previewAfter: preview.after,
    previewDeltas: preview.deltas,

    sourceType: "AUTO_SCAN",
    sourceRef: rule.id,
    sourceRole: "AUTO_SUGGESTION"
  });

  if (suggestion) {
    created.push(suggestion);
  }
});

  return created;
}

function scanAllGroupSuggestionCandidates() {
  const allGroups = [...groupStore.values()];
  const created = [];

  allGroups.forEach((group) => {
    const result = scanGroupSuggestionCandidates(group.id);
    created.push(...result);
  });

  if (created.length) {
    renderSuggestionToasts?.();
  }

  console.log("AUTO SUGGESTION SCAN", {
    groupCount: allGroups.length,
    createdCount: created.length,
    created
  });

  return created;
}

function playSuggestionBeep() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    function tone(freq, start, duration, peak = 0.34) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0.0001, now + start);
      gain.gain.exponentialRampToValueAtTime(peak, now + start + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + start);
      osc.stop(now + start + duration + 0.02);
    }

    // 더 크고 조금 더 길게: 띵-딩
    tone(660, 0.00, 0.32, 0.34);
    tone(880, 0.22, 0.34, 0.30);

    setTimeout(() => {
      ctx.close?.();
    }, 850);
  } catch (err) {
    // 브라우저 자동재생 제한이면 무시
  }
}

function ensureSuggestionToastStackEl() {
  let el = document.getElementById("suggestion-toast-stack");
  if (el) return el;

  el = document.createElement("div");
  el.id = "suggestion-toast-stack";
  el.className = "suggestion-toast-stack";

  document.body.appendChild(el);

  return el;
}

function ensureHiddenSuggestionToastBadgeEl() {
  let el = document.getElementById("hidden-suggestion-toast-badge");
  if (el) return el;

  el = document.createElement("button");
  el.id = "hidden-suggestion-toast-badge";
  el.type = "button";
  el.className = "hidden-suggestion-toast-badge hidden";

el.onclick = () => {
  openUnreadMessageExplorer();
};

  document.body.appendChild(el);

  return el;
}

function ensureSuggestionInboxExplorerEl() {
  let overlay = document.getElementById("suggestion-inbox-overlay");
  let panel = document.getElementById("suggestion-inbox-explorer");

  if (overlay && panel) {
    return { overlay, panel };
  }

  overlay = document.createElement("div");
  overlay.id = "suggestion-inbox-overlay";
  overlay.className = "suggestion-inbox-overlay hidden";

  panel = document.createElement("div");
  panel.id = "suggestion-inbox-explorer";
  panel.className = "suggestion-inbox-explorer hidden";

  panel.innerHTML = `
    <div class="suggestion-inbox-head">
      <div>
        <div class="suggestion-inbox-kicker">SUGGESTION INBOX</div>
        <div class="suggestion-inbox-title">제안 검토함</div>
      </div>

      <button id="btn-close-suggestion-inbox" type="button">닫기</button>
    </div>

<div class="suggestion-inbox-tabs">
  <button type="button" data-suggestion-tab="new">NEW</button>
  <button type="button" data-suggestion-tab="snoozed">보류</button>
  <button type="button" data-suggestion-tab="applied">적용됨</button>
  <button type="button" data-suggestion-tab="dismissed">무시됨</button>
  <button type="button" data-suggestion-tab="all">ALL</button>
</div>

    <div id="suggestion-inbox-body"></div>
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(panel);

  const closeBtn = panel.querySelector("#btn-close-suggestion-inbox");
  if (closeBtn) {
    closeBtn.onclick = () => closeSuggestionInboxExplorer();
  }

  makeSuggestionInboxExplorerDraggable(panel);

panel.querySelectorAll("[data-suggestion-tab]").forEach((btn) => {
  btn.onclick = () => {
    const tab = btn.dataset.suggestionTab || "new";

    panel.dataset.activeTab = tab;

    panel.querySelectorAll("[data-suggestion-tab]").forEach((node) => {
      node.classList.toggle("active", node.dataset.suggestionTab === tab);
    });

    renderSuggestionInboxExplorer();
  };
});

  panel.dataset.activeTab = "new";

  return { overlay, panel };
}

function makeSuggestionInboxExplorerDraggable(panel) {
  if (!panel || panel.dataset.dragBound === "true") return;

  const head = panel.querySelector(".suggestion-inbox-head");
  if (!head) return;

  let dragging = false;
  let offsetX = 0;
  let offsetY = 0;

  head.addEventListener("mousedown", (e) => {
    if (e.target.closest("button")) return;

    dragging = true;

    const rect = panel.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    panel.style.right = "auto";
    panel.style.left = `${rect.left}px`;
    panel.style.top = `${rect.top}px`;
    panel.style.transform = "none";

    document.body.style.userSelect = "none";
  });

  window.addEventListener("mousemove", (e) => {
    if (!dragging) return;

    const w = panel.offsetWidth;
    const h = panel.offsetHeight;

    let nextLeft = e.clientX - offsetX;
    let nextTop = e.clientY - offsetY;

    nextLeft = Math.max(8, Math.min(nextLeft, window.innerWidth - w - 8));
    nextTop = Math.max(8, Math.min(nextTop, window.innerHeight - h - 8));

    panel.style.left = `${nextLeft}px`;
    panel.style.top = `${nextTop}px`;
  });

  window.addEventListener("mouseup", () => {
    dragging = false;
    document.body.style.userSelect = "";
  });

  panel.dataset.dragBound = "true";
}

function openSuggestionInboxExplorer(tab = "new") {
  const { overlay, panel } = ensureSuggestionInboxExplorerEl();

  overlay.classList.remove("hidden");
  panel.classList.remove("hidden");

  const activeTab = tab || "new";
  panel.dataset.activeTab = activeTab;

  panel.querySelectorAll("[data-suggestion-tab]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.suggestionTab === activeTab);
  });

  renderSuggestionInboxExplorer();
}

function closeSuggestionInboxExplorer() {
  const overlay = document.getElementById("suggestion-inbox-overlay");
  const panel = document.getElementById("suggestion-inbox-explorer");

  overlay?.classList.add("hidden");
  panel?.classList.add("hidden");
}

function getSuggestionsByTab(tab = "new") {
  const suggestions = ensureSuggestionState();

  const normalizedTab = String(tab || "new").toLowerCase();

  if (normalizedTab === "all") {
    return suggestions
      .slice()
      .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
  }

  const statusMap = {
    new: "NEW",
    snoozed: "SNOOZED",
    applied: "APPLIED",
    dismissed: "DISMISSED"
  };

  const status = statusMap[normalizedTab] || "NEW";

  return suggestions
    .filter((item) => item.status === status)
    .slice()
    .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
}

function renderSuggestionInboxExplorer() {
  const panel = document.getElementById("suggestion-inbox-explorer");
  const body = document.getElementById("suggestion-inbox-body");
  if (!panel || !body) return;

  const tab = panel.dataset.activeTab || "new";
  const inbox = ensureSuggestionInboxState();
const items = getSuggestionInboxItems(tab);

if (!inbox.selectedSuggestionId || !items.some((x) => x.id === inbox.selectedSuggestionId)) {
  inbox.selectedSuggestionId = items[0]?.id || null;
}

  if (!items.length) {
    body.innerHTML = `
      <div class="suggestion-empty">
        표시할 제안이 없습니다.
      </div>
    `;
    return;
  }

body.innerHTML = `
  <div class="suggestion-inbox-bucket-layout">
    <aside class="suggestion-inbox-left">
      <div class="suggestion-inbox-type-tabs">
        ${getSuggestionEntityTypes().map((type) => `
          <button
            type="button"
            data-suggestion-entity-type="${type}"
            class="${inbox.entityType === type ? "active" : ""}"
          >
            ${type}
          </button>
        `).join("")}
      </div>

      <div class="suggestion-inbox-list">
        ${
          items.length
            ? items.map((sug) => `
              <button
                type="button"
                class="suggestion-inbox-row ${inbox.selectedSuggestionId === sug.id ? "active" : ""}"
                data-select-suggestion="${sug.id}"
              >
                <b>${sug.displayTag || getDisplayTagName?.(sug.suggestedTag) || sug.suggestedTag || "-"}</b>
                <span>${sug.entityType || "-"}:${sug.entityId || "-"}</span>
                <em>${sug.status || "NEW"}</em>
              </button>
            `).join("")
            : `<div class="suggestion-empty">표시할 제안이 없습니다.</div>`
        }
      </div>
    </aside>

    <main class="suggestion-inbox-right">
      ${renderSuggestionInboxSelectedDetail(inbox.selectedSuggestionId)}
    </main>
  </div>
`;

bindSuggestionInboxBucketActions(tab);

  bindSuggestionInboxActions();
}

function renderSuggestionInboxSelectedDetail(suggestionId) {
  const sug = findSuggestionById?.(suggestionId);
  if (!sug) {
    return `<div class="suggestion-empty">선택된 제안이 없습니다.</div>`;
  }

  const before = sug.previewBefore || {};
  const after = sug.previewAfter || {};
  const deltas = Array.isArray(sug.previewDeltas) ? sug.previewDeltas : [];

  const metricKeys = ["purity", "contamination", "importance", "confidence", "g"];
  const canAct = sug.status === "NEW" || sug.status === "SNOOZED";

  return `
    <section class="suggestion-selected-card">
      <div class="suggestion-selected-head">
        <div>
          <div class="suggestion-selected-kicker">${sug.entityType || "-"}</div>
          <div class="suggestion-selected-title">
            ${sug.displayTag || getDisplayTagName?.(sug.suggestedTag) || sug.suggestedTag || "-"}
          </div>
        </div>
        <span class="suggestion-selected-status">${sug.status || "NEW"}</span>
      </div>

      <div class="suggestion-selected-chip-row">
        <span>${sug.category || "-"}</span>
        <span>${sug.strength || "MID"}</span>
        <span>${sug.sourceType || "-"}:${sug.sourceRef || "-"}</span>
      </div>

      <div class="suggestion-selected-reason">
        ${sug.reason || "검토 필요"}
      </div>
    </section>

    <section class="suggestion-metric-compare">
      <div class="suggestion-metric-block">
        <div class="suggestion-metric-block-title">원래 값</div>
        ${metricKeys.map((key) => `
          <div class="suggestion-metric-line">
            <span>${key}</span>
            <b>${formatMetricValueOrDash(before[key])}</b>
          </div>
        `).join("")}
      </div>

      <div class="suggestion-metric-block changed">
        <div class="suggestion-metric-block-title">제안 태그 변화</div>
        ${
          deltas.length
            ? deltas.map((delta) => `
              <div class="suggestion-metric-line">
                <span>${delta.target}</span>
                <b>${delta.direction === "up" ? "+" : "-"}${Number(delta.amount || 0).toFixed(3)}</b>
              </div>
            `).join("")
            : `<div class="suggestion-metric-line"><span>-</span><b>-</b></div>`
        }
      </div>

      <div class="suggestion-metric-block final">
        <div class="suggestion-metric-block-title">제안 반영 후</div>
        ${metricKeys.map((key) => `
          <div class="suggestion-metric-line">
            <span>${key}</span>
            <b>${formatMetricValueOrDash(after[key])}</b>
          </div>
        `).join("")}
      </div>
    </section>

    <section class="suggestion-selected-actions">
      ${
        canAct
          ? `
            <button type="button" data-apply-suggestion="${sug.id}">적용</button>
            <button type="button" data-snooze-suggestion="${sug.id}">보류</button>
            <button type="button" data-dismiss-suggestion="${sug.id}">무시</button>
          `
          : `<span class="suggestion-status-fixed">${sug.status === "APPLIED" ? "적용 완료" : "처리 완료"}</span>`
      }
    </section>
  `;
}

function formatMetricValueOrDash(value) {
  const n = Number(value);

  if (!Number.isFinite(n)) return "-";
  if (n <= 0) return "-";

  return n.toFixed(3);
}

function bindSuggestionInboxBucketActions(tab = "new") {
  const inbox = ensureSuggestionInboxState();

  document.querySelectorAll("[data-suggestion-entity-type]").forEach((btn) => {
    btn.onclick = () => {
      inbox.entityType = btn.dataset.suggestionEntityType || "ALL";
      inbox.selectedSuggestionId = null;
      renderSuggestionInboxExplorer();
      saveLabState?.();
    };
  });

  document.querySelectorAll("[data-select-suggestion]").forEach((btn) => {
    btn.onclick = () => {
      inbox.selectedSuggestionId = btn.dataset.selectSuggestion || null;
      renderSuggestionInboxExplorer();
      saveLabState?.();
    };
  });

  bindSuggestionInboxActions?.();
}

function findSuggestionById(suggestionId) {
  return ensureSuggestionState().find((item) => item.id === suggestionId) || null;
}

function applySuggestion(suggestionId) {
  const sug = findSuggestionById(suggestionId);
  if (!sug) return null;

  if (sug.status !== "NEW" && sug.status !== "SNOOZED") {
    return sug;
  }

  let appliedEntry = null;
  let alreadyApplied = false;
  let existingEntry = null;

  if (sug.entityType === "GROUP") {
    const group = groupStore.get(sug.entityId);

    if (!group) {
      console.warn("Suggestion apply failed: group not found", sug);
      return null;
    }

    existingEntry = findEntityAdjustmentTagEntry?.(group, sug.suggestedTag, {
      sourceType: sug.sourceType || "SUGGESTION",
      sourceRef: sug.sourceRef || sug.id
    }) || null;

    alreadyApplied = !!existingEntry;

    if (existingEntry && !existingEntry.suggestionId) {
      existingEntry.suggestionId = sug.id;
    }

    if (!alreadyApplied) {
      appliedEntry = addGroupAdjustmentTag?.(sug.entityId, sug.suggestedTag, {
        sourceType: sug.sourceType || "SUGGESTION",
        sourceRef: sug.sourceRef || sug.id,
        sourceRole: "SUGGESTION_APPLY",
        category: sug.category || null,
        strength: sug.strength || "MID",
        relationTags: sug.relationTags || [],
        hypothesisRefs: sug.hypothesisRefs || [],
        premiseRefs: sug.premiseRefs || [],
        memo: `Suggestion applied: ${sug.reason || sug.id}`
      });

      if (appliedEntry) {
        appliedEntry.suggestionId = sug.id;
        appliedEntry.previewBefore = sug.previewBefore ? { ...sug.previewBefore } : null;
        appliedEntry.previewAfter = sug.previewAfter ? { ...sug.previewAfter } : null;
        appliedEntry.previewDeltas = Array.isArray(sug.previewDeltas)
          ? sug.previewDeltas.map((delta) => ({ ...delta }))
          : [];
      }
    }
  }

  if (!appliedEntry && !alreadyApplied) {
    console.warn("Suggestion apply skipped: no entry created", {
      suggestionId,
      suggestedTag: sug.suggestedTag,
      entityType: sug.entityType,
      entityId: sug.entityId
    });

    return null;
  }

  sug.status = "APPLIED";
  sug.appliedAt = Date.now();
  sug.appliedEntryId = appliedEntry?.id || existingEntry?.id || null;
  sug.alreadyApplied = !!alreadyApplied;

  saveLabState?.();

  renderSuggestionInboxExplorer?.();
  renderUnreadMessageExplorer?.();
  renderSuggestionToasts?.();

  if (sug.entityType === "GROUP" && sug.entityId) {
    renderGroupExplorerFullSubview?.();
  }

  return sug;
}

function snoozeSuggestion(suggestionId) {
  const sug = findSuggestionById(suggestionId);
  if (!sug) return null;

  if (sug.status !== "NEW" && sug.status !== "SNOOZED") {
  return sug;
}

  sug.status = "SNOOZED";
  sug.snoozedAt = Date.now();

  saveLabState?.();
renderSuggestionInboxExplorer?.();
renderUnreadMessageExplorer?.();
renderSuggestionToasts?.();

  return sug;
}

function dismissSuggestion(suggestionId) {
  const sug = findSuggestionById(suggestionId);
  if (!sug) return null;

  if (sug.status !== "NEW" && sug.status !== "SNOOZED") {
  return sug;
}

  sug.status = "DISMISSED";
  sug.dismissedAt = Date.now();

  saveLabState?.();
renderSuggestionInboxExplorer?.();
renderUnreadMessageExplorer?.();
renderSuggestionToasts?.();
  
  return sug;
}

function bindSuggestionInboxActions() {
  const body = document.getElementById("suggestion-inbox-body");
  if (!body) return;

  body.querySelectorAll("[data-apply-suggestion]").forEach((btn) => {
    btn.onclick = () => {
      applySuggestion(btn.dataset.applySuggestion);
    };
  });

  body.querySelectorAll("[data-snooze-suggestion]").forEach((btn) => {
    btn.onclick = () => {
      snoozeSuggestion(btn.dataset.snoozeSuggestion);
    };
  });

  body.querySelectorAll("[data-dismiss-suggestion]").forEach((btn) => {
    btn.onclick = () => {
      dismissSuggestion(btn.dataset.dismissSuggestion);
    };
  });

  body.querySelectorAll("[data-open-suggestion-detail]").forEach((item) => {
  item.onclick = (e) => {
    if (e.target.closest("button")) return;

    const suggestionId = item.dataset.openSuggestionDetail;
    if (!suggestionId) return;

    openSuggestionDetailExplorer(suggestionId);
  };
});

}

function createTestGroupSuggestion(groupId) {
  const group = groupStore.get(groupId);
  if (!group) return null;

  const meta = getGroupCardMeta(group);

  return createSuggestion({
    entityType: "GROUP",
    entityId: groupId,
    suggestedTag: "GROUP_CONTAMINATED",
    category: "GROUP_STRUCTURE",
    strength: "STRONG",
    reason: "테스트 제안: contamination 상승 가능성",
    evidence: {
      metric: "contamination",
      value: meta.contaminationScore,
      threshold: 0.2
    },
    previewBefore: {
      purity: meta.purityScore,
      contamination: meta.contaminationScore,
      importance: meta.importanceScore,
      confidence: meta.confidenceScore,
      g: meta.gScore
    },
    previewAfter: {
      purity: Math.max(0, meta.purityScore - 0.08),
      contamination: Math.min(1, meta.contaminationScore + 0.12),
      importance: meta.importanceScore,
      confidence: meta.confidenceScore,
      g: meta.gScore
    },
    previewDeltas: [
      {
        target: "purity",
        direction: "down",
        amount: 0.08
      },
      {
        target: "contamination",
        direction: "up",
        amount: 0.12
      }
    ],
    sourceType: "TEST",
    sourceRef: "MANUAL"
  });
}

window.DEBUG_SUGGESTION = {
  // 생성 / 스캔
  createTest: createTestGroupSuggestion,
  scanGroup: (groupId) => scanGroupSuggestionCandidates(groupId),
  scanAll: () => scanAllGroupSuggestionCandidates(),

  // 열기
  open: (tab = "new") => openSuggestionInboxExplorer(tab),
  openNew: () => openSuggestionInboxExplorer("new"),
  openApplied: () => openSuggestionInboxExplorer("applied"),
  openSnoozed: () => openSuggestionInboxExplorer("snoozed"),
  openDismissed: () => openSuggestionInboxExplorer("dismissed"),
  openAll: () => openSuggestionInboxExplorer("all"),
  openMessage: () => openUnreadMessageExplorer(),
  openDetail: (suggestionId) => openSuggestionDetailExplorer(suggestionId),

  // 조회
  all: () => uiState.suggestions || [],
  newest: () => (uiState.suggestions || [])[0] || null,
  newOnly: () => (uiState.suggestions || []).filter((item) => item.status === "NEW"),
  applied: () => (uiState.suggestions || []).filter((item) => item.status === "APPLIED"),
  snoozed: () => (uiState.suggestions || []).filter((item) => item.status === "SNOOZED"),
  dismissed: () => (uiState.suggestions || []).filter((item) => item.status === "DISMISSED"),

  summary: () => {
    const list = uiState.suggestions || [];

    return list.map((s) => ({
      id: s.id,
      status: s.status,
      tag: s.suggestedTag,
      displayTag: s.displayTag,
      entityType: s.entityType,
      entityId: s.entityId,
      sourceType: s.sourceType,
      sourceRef: s.sourceRef,
      dedupeKey: s.dedupeKey,
      appliedEntryId: s.appliedEntryId,
      alreadyApplied: s.alreadyApplied,
      reason: s.reason
    }));
  },

  count: () => {
    const list = uiState.suggestions || [];

    return {
      total: list.length,
      NEW: list.filter((s) => s.status === "NEW").length,
      SNOOZED: list.filter((s) => s.status === "SNOOZED").length,
      APPLIED: list.filter((s) => s.status === "APPLIED").length,
      DISMISSED: list.filter((s) => s.status === "DISMISSED").length
    };
  },

  // 상태 변경
  apply: (suggestionId) => applySuggestion(suggestionId),
  snooze: (suggestionId) => snoozeSuggestion(suggestionId),
  dismiss: (suggestionId) => dismissSuggestion(suggestionId),

  // 복구 / 갱신
  repair: () => repairAppliedSuggestionEntryLinks?.(),
  render: () => {
    renderSuggestionToasts?.();
    renderSuggestionInboxExplorer?.();
    renderUnreadMessageExplorer?.();
    return window.DEBUG_SUGGESTION.count();
  },

  // toast
  hideToast: (suggestionId) => hideSuggestionToast(suggestionId),
  restoreToasts: () => {
    uiState.suggestionToastHiddenIds = [];
    saveLabState?.();
    renderSuggestionToasts?.();
    return uiState.suggestionToastHiddenIds;
  },
  hiddenToastIds: () => uiState.suggestionToastHiddenIds || [],

  // 삭제/초기화
  clearTest: () => {
    uiState.suggestions = (uiState.suggestions || []).filter((item) => {
      return item.sourceType !== "TEST";
    });

    saveLabState?.();
    renderSuggestionToasts?.();
    renderSuggestionInboxExplorer?.();
    renderUnreadMessageExplorer?.();

    return uiState.suggestions;
  },

  clearAll: () => {
    uiState.suggestions = [];
    uiState.suggestionToastHiddenIds = [];

    saveLabState?.();
    renderSuggestionToasts?.();
    renderSuggestionInboxExplorer?.();
    renderUnreadMessageExplorer?.();

    return [];
  },

  // rule
  rules: () => AUTO_GROUP_SUGGESTION_RULES,

  dedupe: () => dedupeSuggestionsByKey(),

  cleanApplied: () => removeSuggestionsForAlreadyAppliedGroupTags(),

  maintenance: () => openSuggestionMaintenanceExplorer(),
previewMaintenance: () => buildSuggestionMaintenancePreview(),
runDedupe: () => dedupeSuggestionsByKey(),
runCleanApplied: () => removeSuggestionsForAlreadyAppliedGroupTags(),
runScan: () => scanAllGroupSuggestionCandidates(),
runAllMaintenance: () => {
  dedupeSuggestionsByKey?.();
  removeSuggestionsForAlreadyAppliedGroupTags?.();
  scanAllGroupSuggestionCandidates?.();

  const preview = buildSuggestionMaintenancePreview();
  renderSuggestionToasts?.();
  renderSuggestionInboxExplorer?.();
  renderUnreadMessageExplorer?.();

  return preview;
}

};

function renderGroupTagCreateCategoryOptions(selectedCategory = null) {
  const categories = getEntityTagCategories("GROUP");
  const custom = uiState.customTagRules?.GROUP || {};

  const merged = {
    ...categories
  };

  Object.keys(custom).forEach((category) => {
    if (!merged[category]) {
      merged[category] = category;
    }
  });

  const active = selectedCategory || "GROUP_STRUCTURE";

  return Object.entries(merged).map(([key, label]) => `
    <option value="${key}" ${key === active ? "selected" : ""}>
      ${key} · ${label}
    </option>
  `).join("");
}

function ensureGroupTagDeleteExplorerState() {
  const state = ensureGroupExplorerFullState();

  if (!state.tagDeleteExplorer || typeof state.tagDeleteExplorer !== "object") {
    state.tagDeleteExplorer = {
      open: false,
      mode: "tag",
      selectedCategory: "GROUP_STRUCTURE"
    };
  }

  return state.tagDeleteExplorer;
}

function ensureGroupTagDeleteExplorerEl() {
  let overlay = document.getElementById("group-tag-delete-overlay");
  let panel = document.getElementById("group-tag-delete-explorer");

  if (overlay && panel) {
    return { overlay, panel };
  }

  overlay = document.createElement("div");
  overlay.id = "group-tag-delete-overlay";
  overlay.className = "group-tag-delete-overlay hidden";

  panel = document.createElement("div");
  panel.id = "group-tag-delete-explorer";
  panel.className = "group-tag-delete-explorer hidden";

  panel.innerHTML = `
    <div class="group-tag-delete-head">
      <div>
        <div class="group-tag-delete-kicker">TAG DELETE</div>
        <div class="group-tag-delete-title">Category / Tag Delete Explorer</div>
      </div>

      <button id="btn-close-group-tag-delete-explorer" type="button">
        닫기
      </button>
    </div>

    <div class="group-tag-delete-mode-row">
      <button type="button" data-tag-delete-mode="tag" class="active">
        태그 삭제
      </button>
      <button type="button" data-tag-delete-mode="category">
        카테고리 삭제
      </button>
    </div>

    <div class="group-tag-delete-body">
      <div id="group-tag-delete-category-list" class="group-tag-delete-category-list"></div>
      <div id="group-tag-delete-detail" class="group-tag-delete-detail"></div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(panel);

  const closeBtn = panel.querySelector("#btn-close-group-tag-delete-explorer");
  if (closeBtn) {
    closeBtn.onclick = () => closeGroupTagDeleteExplorer();
  }

  panel.querySelectorAll("[data-tag-delete-mode]").forEach((btn) => {
    btn.onclick = () => {
      const explorerState = ensureGroupTagDeleteExplorerState();
      explorerState.mode = btn.dataset.tagDeleteMode || "tag";

      panel.querySelectorAll("[data-tag-delete-mode]").forEach((node) => {
        node.classList.toggle("active", node === btn);
      });

      renderGroupTagDeleteExplorer();
      saveLabState?.();
    };
  });

  return { overlay, panel };
}

function openGroupTagDeleteExplorer(groupId) {
  const explorerState = ensureGroupTagDeleteExplorerState();
  explorerState.open = true;
  explorerState.groupId = groupId;
  explorerState.selectedCategory = explorerState.selectedCategory || "GROUP_STRUCTURE";

  const { overlay, panel } = ensureGroupTagDeleteExplorerEl();

  overlay.classList.remove("hidden");
  panel.classList.remove("hidden");

  renderGroupTagDeleteExplorer();
  saveLabState?.();
}

function closeGroupTagDeleteExplorer() {
  const explorerState = ensureGroupTagDeleteExplorerState();
  explorerState.open = false;

  const overlay = document.getElementById("group-tag-delete-overlay");
  const panel = document.getElementById("group-tag-delete-explorer");

  overlay?.classList.add("hidden");
  panel?.classList.add("hidden");

  saveLabState?.();
}

function getGroupTagCategoryRows() {
  const categories = getEntityTagCategories("GROUP");
  const custom = uiState.customTagRules?.GROUP || {};
  const labels = uiState.customTagCategoryLabels || {};

  const keys = new Set([
    ...Object.keys(categories || {}),
    ...Object.keys(custom || {})
  ]);

  return [...keys].map((key) => {
    const rules = ENTITY_TAG_RULES.GROUP?.[key] || {};
    const customRules = custom?.[key] || {};

    return {
      key,
      label: labels[key] || categories[key] || key,
      isBase: isBaseGroupTagCategory(key),
      isCustom: !!custom[key],
      totalTagCount: Object.keys(rules).length,
      customTagCount: Object.keys(customRules).length
    };
  });
}

function getGroupTagRowsByCategory(category) {
  const rules = ENTITY_TAG_RULES.GROUP?.[category] || {};

  return Object.entries(rules).map(([key, rule]) => ({
    key,
    label: rule.label || key,
    meaning: rule.meaning || "",
    isCustom: isCustomGroupTagRule(category, key),
    custom: !!rule.custom
  }));
}

function renderGroupTagDeleteExplorer() {
  const explorerState = ensureGroupTagDeleteExplorerState();
  const categoryList = document.getElementById("group-tag-delete-category-list");
  const detail = document.getElementById("group-tag-delete-detail");

  if (!categoryList || !detail) return;

  const categories = getGroupTagCategoryRows();

  if (!categories.length) {
    categoryList.innerHTML = `<div class="group-tag-delete-empty">카테고리 없음</div>`;
    detail.innerHTML = `<div class="group-tag-delete-empty">표시할 내용 없음</div>`;
    return;
  }

  if (!categories.some((item) => item.key === explorerState.selectedCategory)) {
    explorerState.selectedCategory = categories[0].key;
  }

  categoryList.innerHTML = categories.map((category) => `
    <button
      type="button"
      class="group-tag-delete-category-row ${
        category.key === explorerState.selectedCategory ? "active" : ""
      }"
      data-delete-category="${category.key}"
    >
      <div>
        <b>${category.key}</b>
        <span>${category.label}</span>
      </div>

      <em>
        ${category.totalTagCount} tags
      </em>
    </button>
  `).join("");

  categoryList.querySelectorAll("[data-delete-category]").forEach((btn) => {
    btn.onclick = () => {
      explorerState.selectedCategory = btn.dataset.deleteCategory;
      renderGroupTagDeleteExplorer();
      saveLabState?.();
    };
  });

  if (explorerState.mode === "category") {
    renderGroupCategoryDeleteDetail(explorerState.selectedCategory);
  } else {
    renderGroupTagDeleteDetail(explorerState.selectedCategory);
  }
}

function renderGroupTagDeleteDetail(category) {
  const detail = document.getElementById("group-tag-delete-detail");
  if (!detail) return;

  const tags = getGroupTagRowsByCategory(category);

  if (!tags.length) {
    detail.innerHTML = `
      <div class="group-tag-delete-empty">
        이 카테고리에 태그가 없습니다.
      </div>
    `;
    return;
  }

  detail.innerHTML = `
    <div class="group-tag-delete-detail-title">
      <b>${category}</b>
      <span>custom 태그만 삭제할 수 있습니다.</span>
    </div>

    <div class="group-tag-delete-tag-list">
      ${tags.map((tag) => `
        <div class="group-tag-delete-tag-row ${tag.isCustom ? "custom" : "base"}">
          <div>
            <b>${getDisplayTagName(tag.key)}</b>
            <span>${tag.label}</span>
            <small>${tag.isCustom ? "CUSTOM" : "BASE"} · ${tag.meaning || "-"}</small>
          </div>

          <button
            type="button"
            data-delete-tag="${tag.key}"
            ${tag.isCustom ? "" : "disabled"}
          >
            삭제
          </button>
        </div>
      `).join("")}
    </div>
  `;

  detail.querySelectorAll("[data-delete-tag]").forEach((btn) => {
    btn.onclick = () => {
      const tagKey = btn.dataset.deleteTag;
      if (!tagKey) return;

      const ok = deleteCustomGroupTagRule(category, tagKey);
      if (!ok) return;

      renderGroupTagDeleteExplorer();
      refreshAfterCustomTagMutation(category);
    };
  });
}

function renderGroupCategoryDeleteDetail(category) {
  const detail = document.getElementById("group-tag-delete-detail");
  if (!detail) return;

  const row = getGroupTagCategoryRows().find((item) => item.key === category);
  const tags = getGroupTagRowsByCategory(category);
  const customTags = tags.filter((tag) => tag.isCustom);

  if (!row) {
    detail.innerHTML = `<div class="group-tag-delete-empty">카테고리 없음</div>`;
    return;
  }

  if (row.isBase) {
    detail.innerHTML = `
      <div class="group-tag-delete-confirm">
        <h4>${category}</h4>
        <p>기본 카테고리는 삭제할 수 없습니다.</p>

        <div class="group-tag-delete-chip-row">
          ${tags.map((tag) => `
            <span>${getDisplayTagName(tag.key)}</span>
          `).join("")}
        </div>
      </div>
    `;
    return;
  }

  detail.innerHTML = `
    <div class="group-tag-delete-confirm">
      <h4>${category}</h4>

      <p>
        내부 태그
        <b>${customTags.length}</b>개를 전부 삭제하고,
        카테고리도 삭제하시겠습니까?
      </p>

      <div class="group-tag-delete-chip-row">
        ${
          customTags.length
            ? customTags.map((tag) => `
              <span>${getDisplayTagName(tag.key)}</span>
            `).join("")
            : `<span>내부 custom 태그 없음</span>`
        }
      </div>

      <div class="group-tag-delete-confirm-actions">
        <button
          type="button"
          id="btn-confirm-delete-category"
        >
          예, 삭제
        </button>

        <button
          type="button"
          id="btn-cancel-delete-category"
        >
          아니오
        </button>
      </div>
    </div>
  `;

  const confirmBtn = document.getElementById("btn-confirm-delete-category");
  const cancelBtn = document.getElementById("btn-cancel-delete-category");

  if (confirmBtn) {
    confirmBtn.onclick = () => {
      const ok = deleteCustomGroupTagCategoryCascade(category);
      if (!ok) return;

      const explorerState = ensureGroupTagDeleteExplorerState();
      explorerState.selectedCategory = "GROUP_STRUCTURE";

      renderGroupTagDeleteExplorer();
      refreshAfterCustomTagMutation("GROUP_STRUCTURE");
    };
  }

  if (cancelBtn) {
    cancelBtn.onclick = () => {
      const explorerState = ensureGroupTagDeleteExplorerState();
      explorerState.mode = "tag";
      renderGroupTagDeleteExplorer();
    };
  }
}

function deleteCustomGroupTagRule(category, tagKey) {
  if (!category || !tagKey) return false;

  if (!isCustomGroupTagRule(category, tagKey)) {
    console.warn("Only custom tags can be deleted:", { category, tagKey });
    return false;
  }

  const custom = ensureCustomTagRulesState();

  delete custom.GROUP[category][tagKey];

  if (ENTITY_TAG_RULES.GROUP?.[category]?.[tagKey]?.custom) {
    delete ENTITY_TAG_RULES.GROUP[category][tagKey];
  }

  saveLabState?.();

  return true;
}

function deleteCustomGroupTagCategoryCascade(category) {
  if (!category) return false;

  if (isBaseGroupTagCategory(category)) {
    console.warn("Base category cannot be deleted:", category);
    return false;
  }

  const custom = ensureCustomTagRulesState();

  if (custom.GROUP?.[category]) {
    Object.keys(custom.GROUP[category]).forEach((tagKey) => {
      delete custom.GROUP[category][tagKey];
    });

    delete custom.GROUP[category];
  }

  if (ENTITY_TAG_RULES.GROUP?.[category]) {
    Object.entries(ENTITY_TAG_RULES.GROUP[category]).forEach(([tagKey, rule]) => {
      if (rule?.custom) {
        delete ENTITY_TAG_RULES.GROUP[category][tagKey];
      }
    });

    if (!Object.keys(ENTITY_TAG_RULES.GROUP[category]).length) {
      delete ENTITY_TAG_RULES.GROUP[category];
    }
  }

  if (uiState.customTagCategoryLabels) {
    delete uiState.customTagCategoryLabels[category];
  }

  saveLabState?.();

  return true;
}

function refreshAfterCustomTagMutation(category = "GROUP_STRUCTURE") {
  refreshGroupTagCreateCategorySelect?.(category);

  renderEntityEditTagCategoryButtons?.("GROUP", category);
  renderEntityEditTagButtons?.("GROUP", category);

  renderEntityImpactCauseCategoryButtons?.("GROUP", category);
  renderEntityImpactCauseTagButtons?.("GROUP", category);

  const detailGroupId = ensureGroupExplorerFullState?.().detailGroupId;
  if (detailGroupId) {
    refreshGroupImpactPreviewViews?.(detailGroupId);
    renderGroupFullEditLogSummary?.(detailGroupId);
  }
}

function refreshGroupTagCreateCategorySelect(selectedCategory = null) {
  const select = document.getElementById("group-tag-create-category");
  if (!select) return;

  select.innerHTML = renderGroupTagCreateCategoryOptions(
    selectedCategory || select.value || "GROUP_STRUCTURE"
  );
}

function renderEntityEditTagCategoryButtons(entityType = "GROUP", selectedCategory = null) {
  const box = document.getElementById("group-edit-adjustment-category-buttons");
  if (!box) return;

  const categories = getEntityTagCategories(entityType);
  const firstCategory = selectedCategory || Object.keys(categories)[0];

  box.innerHTML = Object.entries(categories).map(([key, label]) => `
    <button
      type="button"
      class="group-edit-category-btn ${key === firstCategory ? "active" : ""}"
      data-adjustment-category="${key}"
    >
      <span>${key}</span>
      <b>${label}</b>
    </button>
  `).join("");

  box.dataset.selectedCategory = firstCategory;
  box.dataset.entityType = entityType;

  box.querySelectorAll("[data-adjustment-category]").forEach((btn) => {
    btn.onclick = () => {
      const category = btn.dataset.adjustmentCategory || firstCategory;

      box.dataset.selectedCategory = category;

      box.querySelectorAll(".group-edit-category-btn").forEach((node) => {
        node.classList.toggle("active", node.dataset.adjustmentCategory === category);
      });

      renderEntityEditTagButtons(entityType, category);
    };
  });
}

function renderEntityEditTagButtons(entityType = "GROUP", category = "GROUP_STRUCTURE") {
  const box = document.getElementById("group-edit-adjustment-tag-buttons");
  if (!box) return;

  const rules = getEntityTagRules(entityType, category);

  if (!rules.length) {
    box.innerHTML = `<div class="group-edit-empty">해당 카테고리 태그 없음</div>`;
    box.dataset.selectedTag = "";
    return;
  }

  const firstKey = rules[0].key;

  box.innerHTML = rules.map((rule, index) => {
    const primaryEffect = rule.effects?.[0];
const effectText = primaryEffect
  ? formatEffectSign(primaryEffect)
  : "effect -";

    return `
<button
  type="button"
  class="group-edit-tag-btn ${index === 0 ? "active" : ""}"
  data-adjustment-tag="${rule.key}"
  data-category="${rule.category}"
>

        <span class="tag-key">${getDisplayTagName(rule.key)}</span>
        <span class="tag-label">${rule.label}</span>
        <span class="tag-meta">${rule.category} · ${rule.stat || "Alive"} · ${effectText}</span>
      </button>
    `;
  }).join("");

  box.dataset.selectedTag = firstKey;
  box.dataset.entityType = entityType;
  box.dataset.selectedCategory = category;

  box.querySelectorAll("[data-adjustment-tag]").forEach((btn) => {
    btn.onclick = () => {
      const key = btn.dataset.adjustmentTag;
      if (!key) return;

      box.dataset.selectedTag = key;

      box.querySelectorAll(".group-edit-tag-btn").forEach((node) => {
        node.classList.toggle("active", node.dataset.adjustmentTag === key);
      });
    };
  });
}

function renderGroupEditAdjustmentCategoryButtons(selectedCategory = "SELF_NODE") {
  const box = document.getElementById("group-edit-adjustment-category-buttons");
  if (!box) return;

  box.innerHTML = Object.entries(GROUP_ADJUSTMENT_TAG_CATEGORIES).map(([key, label]) => `
    <button
      type="button"
      class="group-edit-category-btn ${key === selectedCategory ? "active" : ""}"
      data-adjustment-category="${key}"
    >
      <span>${key}</span>
      <b>${label}</b>
    </button>
  `).join("");

  box.dataset.selectedCategory = selectedCategory;

  box.querySelectorAll("[data-adjustment-category]").forEach((btn) => {
    btn.onclick = () => {
      const category = btn.dataset.adjustmentCategory || "SELF_NODE";

      box.dataset.selectedCategory = category;

      box.querySelectorAll(".group-edit-category-btn").forEach((node) => {
        node.classList.toggle("active", node.dataset.adjustmentCategory === category);
      });

      renderGroupEditAdjustmentTagButtons(category);
    };
  });
}

function renderGroupEditAdjustmentTagButtons(category = "SELF_NODE") {
  const box = document.getElementById("group-edit-adjustment-tag-buttons");
  if (!box) return;

  const entries = Object.entries(GROUP_ADJUSTMENT_TAG_RULES)
    .filter(([, rule]) => !category || rule.category === category);

  if (!entries.length) {
    box.innerHTML = `<div class="group-edit-empty">해당 카테고리 태그 없음</div>`;
    box.dataset.selectedTag = "";
    return;
  }

  const firstKey = entries[0][0];

  box.innerHTML = entries.map(([key, rule], index) => {
    const isActive = index === 0;
    const directionText = rule.direction === "up" ? "+" : "-";
    const amountText = `${directionText}${Number(rule.amount || 0).toFixed(2)}`;

    return `
      <button
        type="button"
        class="group-edit-tag-btn ${isActive ? "active" : ""} ${rule.direction === "up" ? "tag-up" : "tag-down"}"
        data-adjustment-tag="${key}"
      >
        <span class="tag-key">${key}</span>
        <span class="tag-label">${rule.label}</span>
        <span class="tag-meta">${rule.category || "TAG"} · ${rule.target} ${amountText}</span>
      </button>
    `;
  }).join("");

  box.dataset.selectedTag = firstKey;

  box.querySelectorAll("[data-adjustment-tag]").forEach((btn) => {
    btn.onclick = () => {
      const key = btn.dataset.adjustmentTag;
      if (!key) return;

      box.dataset.selectedTag = key;

      box.querySelectorAll(".group-edit-tag-btn").forEach((node) => {
        node.classList.toggle("active", node.dataset.adjustmentTag === key);
      });
    };
  });
}

function getGroupExplorerActiveGroupIds() {
  const target = uiState.groupExplorerContext?.target || "main";

  if (target === "patternLinkPage") {
    return Array.isArray(uiState.patternLinkPageState?.activeGroupIds)
      ? uiState.patternLinkPageState.activeGroupIds
      : [];
  }

  return Array.isArray(uiState.activeGroupIds)
    ? uiState.activeGroupIds
    : [];
}

function getGroupExplorerPreviewGroupIds() {
  const target = uiState.groupExplorerContext?.target || "main";

  if (target === "patternLinkPage") {
    return Array.isArray(uiState.patternLinkPageState?.previewGroupIds)
      ? uiState.patternLinkPageState.previewGroupIds
      : [];
  }

  return Array.isArray(uiState.previewGroupIds)
    ? uiState.previewGroupIds
    : [];
}

function getCurrentBaseGroupIdForExplorer() {
  const target = uiState.groupExplorerContext?.target || "main";

  if (target === "patternLinkPage") {
    return uiState.patternLinkPageState?.baseGroupId || null;
  }

  return uiState.baseGroupId || null;
}

function updateUnreadMessageExplorerTitle() {
  const title = document.querySelector(".unread-message-title");
  const kicker = document.querySelector(".unread-message-kicker");
  const count = getUnreadMessageCountForBadge?.() || 0;

  if (!title || !kicker) return;

  if (count > 0) {
    kicker.textContent = "UNREAD MESSAGE";
    title.textContent = `읽지 않은 message +${count}`;
  } else {
    kicker.textContent = "MESSAGE CENTER";
    title.textContent = "message";
  }
}

function updateGroupExplorerFullSummary() {
  const groups = [...groupStore.values()].filter(Boolean);

  const activeGroupIds = getGroupExplorerActiveGroupIds?.() || [];
  const previewGroupIds = getGroupExplorerPreviewGroupIds?.() || [];
  const baseGroupId = getCurrentBaseGroupIdForExplorer?.() || null;
  const baseGroup = baseGroupId ? groupStore.get(baseGroupId) : null;

  let contaminatedCount = 0;
  let cleanCount = 0;

  groups.forEach((group) => {
    const contamination = getGroupEvaluationScore?.(group, "contaminationScore", 0) ?? 0;
    const purity = getGroupEvaluationScore?.(group, "purityScore", 1) ?? 1;

    if (contamination >= 0.5) contaminatedCount += 1;
    if (purity >= 0.75) cleanCount += 1;
  });

  if (els.groupFullTotalCount) els.groupFullTotalCount.textContent = String(groups.length);
  if (els.groupFullOnCount) els.groupFullOnCount.textContent = String(activeGroupIds.length);
  if (els.groupFullPreviewCount) els.groupFullPreviewCount.textContent = String(previewGroupIds.length);
  if (els.groupFullBaseName) {
    els.groupFullBaseName.textContent = baseGroup
      ? (baseGroup.name || baseGroup.label || baseGroup.id)
      : "-";
  }
  if (els.groupFullContaminatedCount) els.groupFullContaminatedCount.textContent = String(contaminatedCount);
  if (els.groupFullCleanCount) els.groupFullCleanCount.textContent = String(cleanCount);
}

function updateGroupExplorerStatus() {
  const activeGroupIds = getGroupExplorerActiveGroupIds?.() || [];
  const previewGroupIds = getGroupExplorerPreviewGroupIds?.() || [];
  const baseGroupId = getCurrentBaseGroupIdForExplorer?.() || null;
  const baseGroup = baseGroupId ? groupStore.get(baseGroupId) : null;

  if (els.groupExplorerOnCount) {
    els.groupExplorerOnCount.textContent = String(activeGroupIds.length);
  }

  if (els.groupExplorerPreviewCount) {
    els.groupExplorerPreviewCount.textContent = String(previewGroupIds.length);
  }

  if (els.groupBaseBtn) {
    els.groupBaseBtn.textContent = baseGroup
      ? `BASE = ${baseGroup.name || baseGroup.label || baseGroup.id}`
      : "BASE";

    els.groupBaseBtn.classList.toggle("has-base", !!baseGroup);
  }

  decorateGroupExplorerCards?.();
}

function decorateGroupExplorerCards() {
  if (!els.groupPanelBody) return;

  const activeSet = new Set(getGroupExplorerActiveGroupIds?.() || []);
  const previewSet = new Set(getGroupExplorerPreviewGroupIds?.() || []);
  const baseGroupId = getCurrentBaseGroupIdForExplorer?.() || null;

  const cards = els.groupPanelBody.querySelectorAll(".group-card[data-group-id]");

  cards.forEach((card) => {
    const groupId = card.dataset.groupId;
    if (!groupId) return;

    const isOn = activeSet.has(groupId);
    const isPreview = previewSet.has(groupId);
    const isBase = baseGroupId === groupId;

    // context 변경 시 이전 시각 상태 제거
    card.classList.remove(
      "is-active-group",
      "is-preview-group",
      "is-base-group"
    );

    card.classList.toggle("is-active-group", isOn);
    card.classList.toggle("is-preview-group", isPreview);
    card.classList.toggle("is-base-group", isBase);

    // 우리가 만든 runtime tag는 항상 제거 후 재생성
    card.querySelectorAll(".group-card-runtime-tags").forEach((el) => el.remove());

    const tags = [];

if (isOn) {
  tags.push(`<span class="group-runtime-tag tag-on">ON</span>`);
}

if (isPreview) {
  tags.push(`<span class="group-runtime-tag tag-preview">PREVIEW</span>`);
}

    if (!tags.length) return;

    const tagRow = document.createElement("div");
    tagRow.className = "group-card-runtime-tags";
    tagRow.innerHTML = tags.join("");

    card.appendChild(tagRow);
  });
}

function openGroupBaseMiniExplorer(groupId) {
  const group = groupStore.get(groupId);
  if (!group) return;

  let box = document.getElementById("group-base-mini-explorer");

  if (!box) {
    box = document.createElement("div");
    box.id = "group-base-mini-explorer";
    box.className = "group-base-mini-explorer";
    document.body.appendChild(box);
  }

  const centerNodeId = getGroupCenterNodeId?.(group) || "-";
  const memberNodeIds = getGroupMemberNodeIds?.(group) || [];
  const edgeTypes = getGroupEdgeTypes?.(group) || [];
  const purity = getGroupEvaluationScore?.(group, "purityScore", 1) ?? 1;
  const contamination = getGroupEvaluationScore?.(group, "contaminationScore", 0) ?? 0;
  const importance = getGroupEvaluationScore?.(group, "importanceScore", 0) ?? 0;
  const confidence = getGroupEvaluationScore?.(group, "confidenceScore", 0) ?? 0;

  box.innerHTML = `
    <div id="group-base-mini-head" class="group-base-mini-head">
      <span>BASE GROUP</span>
      <button id="btn-close-group-base-mini" type="button">×</button>
    </div>

    <div class="group-base-mini-body">
      <div class="group-base-mini-title">${group.name || group.label || group.id}</div>
      <div class="group-base-mini-row"><span>ID</span><b>${group.id}</b></div>
      <div class="group-base-mini-row"><span>Center</span><b>${centerNodeId}</b></div>
      <div class="group-base-mini-row"><span>Members</span><b>${memberNodeIds.length}</b></div>
      <div class="group-base-mini-row"><span>Relation</span><b>${edgeTypes.join(", ") || "-"}</b></div>

      <div class="group-base-mini-metrics">
        <span>P ${Number(purity).toFixed(2)}</span>
        <span>C ${Number(contamination).toFixed(2)}</span>
        <span>I ${Number(importance).toFixed(2)}</span>
        <span>F ${Number(confidence).toFixed(2)}</span>
      </div>
    </div>

    box.dataset.open = "true";
box.classList.remove("hidden");
box.style.display = "block";

const closeBtn = document.getElementById("btn-close-group-base-mini");
if (closeBtn) {
  closeBtn.onclick = () => {
    box.dataset.open = "false";
    box.classList.add("hidden");
    box.style.display = "none";
  };
}

  `;

  box.classList.remove("hidden");

  document.getElementById("btn-close-group-base-mini")?.addEventListener("click", () => {
    box.classList.add("hidden");
  });

  makeGroupBaseMiniExplorerDraggable(box);
}

function makeGroupBaseMiniExplorerDraggable(box) {
  if (!box) return;
  if (box.dataset.dragBound === "true") return;

  const head = box.querySelector("#group-base-mini-head");
  if (!head) return;

  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  box.addEventListener("mousedown", () => {
    bringExplorerToFront?.(box);
  });

  head.addEventListener("mousedown", (e) => {
    if (e.target.closest("button")) return;

    isDragging = true;

    const rect = box.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    box.style.left = `${rect.left}px`;
    box.style.top = `${rect.top}px`;
    box.style.right = "auto";
    box.style.transform = "none";

    document.body.style.userSelect = "none";
  });

  window.addEventListener("mousemove", (e) => {
    if (!isDragging) return;

    const boxWidth = box.offsetWidth;
    const boxHeight = box.offsetHeight;

    let nextLeft = e.clientX - offsetX;
    let nextTop = e.clientY - offsetY;

    nextLeft = Math.max(8, Math.min(nextLeft, window.innerWidth - boxWidth - 8));
    nextTop = Math.max(8, Math.min(nextTop, window.innerHeight - boxHeight - 8));

    box.style.left = `${nextLeft}px`;
    box.style.top = `${nextTop}px`;
  });

  window.addEventListener("mouseup", () => {
    isDragging = false;
    document.body.style.userSelect = "";
  });

  box.dataset.dragBound = "true";
}

function sanitizeAlphaCode(value = "", fallback = "X") {
  const cleaned = String(value || "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "");

  return cleaned || fallback;
}

function makeFixedAlphaCode(value = "", length = 1, fallback = "X") {
  const cleaned = sanitizeAlphaCode(value, fallback);
  return (cleaned + fallback.repeat(length)).slice(0, length);
}

function resolveLayerMajorCategoryCode(mode = "", sourceMeta = {}) {
  const explicit = sourceMeta?.majorCategoryCode || sourceMeta?.majorCode || "";
  if (explicit) {
    return makeFixedAlphaCode(explicit, 2, "X");
  }

  const normalizedMode = String(mode || "").trim().toLowerCase();

  const map = {
    explore: "EX",
    warning: "WN",
    pattern: "PT",
    relation: "RL",
    network: "NW",
    layer: "LY",
    workspace: "WS"
  };

  if (map[normalizedMode]) return map[normalizedMode];

  return makeFixedAlphaCode(normalizedMode, 2, "X");
}

function resolveLayerUpperGroupCode(data = {}) {
  const explicit =
    data?.sourceMeta?.upperGroupCode ||
    data?.groupContext?.upperGroupCode ||
    data?.upperGroupCode ||
    "";

  if (explicit) {
    return makeFixedAlphaCode(explicit, 1, "X");
  }

  const activeGroupIds = Array.isArray(data?.activeGroupIds)
    ? data.activeGroupIds
    : Array.isArray(uiState.activeGroupIds)
      ? uiState.activeGroupIds
      : [];

  const firstGroupId = activeGroupIds[0] || data?.groupId || "";
  return makeFixedAlphaCode(firstGroupId, 1, "X");
}

function closeLayerSetDeleteModal() {
  uiState.setDeleteModal = {
    open: false,
    rootSetId: null,
    selectedSetIds: [],
    minDepth: 0,
    maxDepth: null
  };

  els.layerSetDeleteModal?.classList.add("hidden");
}

function setLayerSetDeleteMinDepth(value = 0) {
  uiState.setDeleteModal.minDepth = Math.max(0, Number(value || 0));
  renderLayerSetDeleteModal();
}

function setLayerSetDeleteMaxDepth(value = null) {
  uiState.setDeleteModal.maxDepth =
    value === null || value === "" ? null : Math.max(0, Number(value));
  renderLayerSetDeleteModal();
}

function renderGroupFullEditLogSummary(groupId) {
  const box = document.getElementById("group-edit-log-summary");
  if (!box) return;

  const group = groupStore.get(groupId);
  if (!group) return;

  const edit = ensureGroupEditState(group);
  const refs = edit?.refs || [];
  const adjustments = edit?.adjustmentTags || [];
  const logs = edit?.logs || [];

  box.innerHTML = `
    <div class="group-edit-log-summary">
      <div class="group-edit-summary-chips">
        <span>REF ${refs.length}</span>
        <span>ADJ ${adjustments.length}</span>
        <span>LOG ${logs.length}</span>
      </div>

      <button
        id="btn-open-group-edit-log-explorer"
        type="button"
      >
        Open Log Explorer
      </button>
    </div>
  `;

  const btn = document.getElementById("btn-open-group-edit-log-explorer");
  if (btn) {
    btn.onclick = () => {
      openGroupEditLogExplorer(groupId);
    };
  }
}

function ensureGroupEditLogExplorerEl() {
  let el = document.getElementById("group-edit-log-explorer");

  if (el) return el;

  el = document.createElement("div");
  el.id = "group-edit-log-explorer";
  el.className = "group-edit-log-explorer hidden";

  el.innerHTML = `
    <div class="group-edit-log-explorer-head">
      <div>
        <div class="group-edit-log-explorer-kicker">GROUP LOG</div>
        <div id="group-edit-log-explorer-title" class="group-edit-log-explorer-title">-</div>
      </div>

      <button id="btn-close-group-edit-log-explorer" type="button">닫기</button>
    </div>

    <div class="group-edit-log-explorer-tabs">
      <button type="button" data-group-log-tab="active" class="active">ACTIVE</button>
      <button type="button" data-group-log-tab="raw">RAW LOG</button>
    </div>

    <div id="group-edit-log-explorer-body"></div>
  `;

  document.body.appendChild(el);

  const closeBtn = el.querySelector("#btn-close-group-edit-log-explorer");
  if (closeBtn) {
    closeBtn.onclick = () => {
      closeGroupEditLogExplorer();
    };
  }

  el.querySelectorAll("[data-group-log-tab]").forEach((btn) => {
    btn.onclick = () => {
      el.querySelectorAll("[data-group-log-tab]").forEach((node) => {
        node.classList.toggle("active", node === btn);
      });

      const groupId = el.dataset.groupId;
      const tab = btn.dataset.groupLogTab || "active";
      renderGroupEditLogExplorerBody(groupId, tab);
    };
  });

  makeGroupEditLogExplorerDraggable(el);

  return el;
}

function openGroupEditLogExplorer(groupId) {
  if (!groupId) return;

  const group = groupStore.get(groupId);
  if (!group) return;

  const el = ensureGroupEditLogExplorerEl();

  el.dataset.groupId = groupId;
  el.classList.remove("hidden");

  const title = el.querySelector("#group-edit-log-explorer-title");
  if (title) {
    title.textContent = group.name || group.label || group.id;
  }

  renderGroupEditLogExplorerBody(groupId, "active");
}

function closeGroupEditLogExplorer() {
  const el = document.getElementById("group-edit-log-explorer");
  if (!el) return;

  el.classList.add("hidden");
}

function renderGroupEditLogExplorerBody(groupId, tab = "active") {
  const body = document.getElementById("group-edit-log-explorer-body");
  if (!body) return;

  const group = groupStore.get(groupId);
  if (!group) return;

  const edit = ensureGroupEditState(group);

  const refs = sortEntityRefsForDisplay(edit?.refs || []);
  const adjustments = sortEntityTagsForDisplay(edit?.adjustmentTags || []);
  const logs = sortEntityLogsForDisplay(edit?.logs || []);

  if (tab === "raw") {
    body.innerHTML = renderGroupEditRawLogs(logs);
    return;
  }

  body.innerHTML = `
    <section class="group-log-section">
      <div class="group-log-section-title">ACTIVE REFERENCES</div>
      ${renderGroupEditActiveRefs(groupId, refs)}
    </section>

    <section class="group-log-section">
      <div class="group-log-section-title">CURRENT TAGS / ADJUSTMENTS</div>
      ${renderGroupEditActiveAdjustments(groupId, adjustments)}
    </section>
  `;

  bindGroupEditLogExplorerActions(groupId);
}

function sortEntityRefsForDisplay(refs = []) {
  return [...refs].sort((a, b) => {
    const typeCompare = String(a.type || "").localeCompare(String(b.type || ""));
    if (typeCompare) return typeCompare;

    return String(a.refId || "").localeCompare(String(b.refId || ""));
  });
}

function sortEntityTagsForDisplay(tags = []) {
  const categoryOrder = {
    GROUP_STRUCTURE: 1,
    ALGORITHM: 2,
    THEORY: 3,
    SELF_NODE: 1,
    OTHER_NODE: 2,
    DATA_SOURCE: 3,
    MARKET_CONTEXT: 4
  };

  return [...tags].sort((a, b) => {
    const ca = categoryOrder[a.category] || 99;
    const cb = categoryOrder[b.category] || 99;
    if (ca !== cb) return ca - cb;

    const statCompare = String(a.stat || "Alive").localeCompare(String(b.stat || "Alive"));
    if (statCompare) return statCompare;

    return String(a.tag || "").localeCompare(String(b.tag || ""));
  });
}

function sortEntityLogsForDisplay(logs = []) {
  return [...logs].sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
}

function renderGroupEditActiveRefs(groupId, refs) {
  if (!refs.length) {
    return `<div class="group-log-empty">활성 참조 없음</div>`;
  }

  return refs.map((ref) => `
    <div class="group-log-row ref">
      <b>REF</b>
      <span>${ref.type || "-"}</span>
      <span>${ref.refId || "-"}</span>
      <span>${ref.relationTag || "-"}</span>
      <button
        type="button"
        data-log-remove-ref="${ref.id}"
      >
        삭제
      </button>
    </div>
  `).join("");
}

function formatTagEffects(effects = []) {
  if (!Array.isArray(effects) || !effects.length) return "effect -";

  return effects.map((effect) => formatEffectSign(effect)).join(" / ");
}

function renderGroupEditActiveAdjustments(groupId, adjustments) {
  if (!adjustments.length) {
    return `<div class="group-log-empty">활성 태그 없음</div>`;
  }

  return adjustments.map((adj) => {
    const effectText = formatTagEffects(adj.effects || []);
    const bulkText = adj.bulkId ? "BULK" : "MANUAL";

    return `
      <div class="group-log-row adjustment ${adj.bulkId ? "bulk" : "manual"}">
        <b>${adj.tag || "-"}</b>
        <span title="${effectText}">${effectText}</span>
        <span>${adj.category || "-"}</span>
        <span>${bulkText}</span>
        <small title="${adj.sourceRef || "-"}">${adj.sourceRef || "-"}</small>
        <button
          type="button"
          data-log-remove-adjustment="${adj.id}"
        >
          삭제
        </button>
      </div>
    `;
  }).join("");
}

function renderGroupEditRawLogs(logs) {
  if (!logs.length) {
    return `<div class="group-log-empty">Raw log 없음</div>`;
  }

  return logs.slice().reverse().map((log) => `
    <div class="group-raw-log-row">
      <b>${log.type || "-"}</b>
      <span>${log.tag || log.refId || log.adjustmentId || log.entryId || "-"}</span>
      <small>${log.createdAt ? new Date(log.createdAt).toLocaleString() : "-"}</small>
    </div>
  `).join("");
}

function bindGroupEditLogExplorerActions(groupId) {
  const body = document.getElementById("group-edit-log-explorer-body");
  if (!body) return;

  body.querySelectorAll("[data-log-remove-ref]").forEach((btn) => {
    btn.onclick = () => {
      const refId = btn.dataset.logRemoveRef;
      if (!refId) return;

      removeGroupReference?.(groupId, refId);

      triggerGroupRecomputeCascade?.(groupId, {
        reason: "REMOVE_REF_FROM_LOG_EXPLORER",
        source: refId,
        scope: "related_only"
      });

      renderGroupEditLogExplorerBody(groupId, "active");
      renderGroupFullEditLogSummary?.(groupId);
      openGroupExplorerFullDetail?.(groupId);
    };
  });

  body.querySelectorAll("[data-log-remove-adjustment]").forEach((btn) => {
    btn.onclick = () => {
      const adjustmentId = btn.dataset.logRemoveAdjustment;
      if (!adjustmentId) return;

      removeGroupAdjustmentTag?.(groupId, adjustmentId);

      triggerGroupRecomputeCascade?.(groupId, {
        reason: "REMOVE_ADJUSTMENT_FROM_LOG_EXPLORER",
        source: adjustmentId,
        scope: "related_only"
      });

      renderGroupEditLogExplorerBody(groupId, "active");
      renderGroupFullEditLogSummary?.(groupId);
      openGroupExplorerFullDetail?.(groupId);
    };
  });
}

function makeGroupEditLogExplorerDraggable(el) {
  if (!el || el.dataset.draggableBound === "true") return;

  const head = el.querySelector(".group-edit-log-explorer-head");
  if (!head) return;

  let dragging = false;
  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;

  head.addEventListener("mousedown", (e) => {
    dragging = true;
    startX = e.clientX;
    startY = e.clientY;

    const rect = el.getBoundingClientRect();
    startLeft = rect.left;
    startTop = rect.top;

    e.preventDefault();
  });

  window.addEventListener("mousemove", (e) => {
    if (!dragging) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    el.style.left = `${startLeft + dx}px`;
    el.style.top = `${startTop + dy}px`;
    el.style.right = "auto";
  });

  window.addEventListener("mouseup", () => {
    dragging = false;
  });

  el.dataset.draggableBound = "true";
}

function toggleLayerSetDeleteSelection(setId) {
  const current = new Set(uiState.setDeleteModal?.selectedSetIds || []);

  if (current.has(setId)) {
    current.delete(setId);
  } else {
    current.add(setId);
  }

  uiState.setDeleteModal.selectedSetIds = [...current];
  renderLayerSetDeleteModal();
}

function selectAllLayerSetDeleteItems() {
  const rootSetId = uiState.setDeleteModal?.rootSetId || null;
  if (!rootSetId) return;

  uiState.setDeleteModal.selectedSetIds = collectDescendantLayerSetIds(rootSetId);
  renderLayerSetDeleteModal();
}

function clearAllLayerSetDeleteItems() {
  uiState.setDeleteModal.selectedSetIds = [];
  renderLayerSetDeleteModal();
}

function renderLayerSetTreePrefix(row) {
  if (!row.depth) return "";

  let prefix = "";

  for (let i = 0; i < row.depth - 1; i += 1) {
    prefix += row.guideMask[i] ? "│  " : "   ";
  }

  prefix += row.isLast ? "└─ " : "├─ ";
  return prefix;
}

function renderLayerSetDeleteModal() {
  if (!els.layerSetDeleteModal) return;

  const rootSetId = uiState.setDeleteModal?.rootSetId || null;
  const selectedIds = new Set(uiState.setDeleteModal?.selectedSetIds || []);
  const minDepth = Number(uiState.setDeleteModal?.minDepth || 0);
  const maxDepth = uiState.setDeleteModal?.maxDepth ?? null;

  const rootSet = rootSetId ? getLayerSetById(rootSetId) : null;
  const rawRows = rootSetId ? buildLayerSetTreeRows(rootSetId) : [];
  const filteredRows = filterLayerSetTreeRowsByDepth(rawRows, minDepth, maxDepth);

  const rows = filteredRows.map((row) => ({
    ...row,
    displayDepth: Math.max(0, row.depth - minDepth),
    displayGuideMask: Array.isArray(row.guideMask)
      ? row.guideMask.slice(minDepth)
      : []
  }));

  if (els.layerSetDeleteModalMessage) {
    els.layerSetDeleteModalMessage.textContent = rootSet
      ? `"${rootSet.name}" 및 하위 집합을 삭제할 대상을 선택하세요.`
      : `삭제할 집합을 선택하세요.`;
  }

  const listBox = document.getElementById("layer-set-delete-modal-list");
  if (!listBox) return;

  listBox.innerHTML = `
    <div class="layer-set-delete-depth-toolbar">
      <button type="button" data-set-delete-depth="0" class="${minDepth === 0 ? "active" : ""}">전체</button>
      <button type="button" data-set-delete-depth="1" class="${minDepth === 1 ? "active" : ""}">하위 1단계+</button>
      <button type="button" data-set-delete-depth="2" class="${minDepth === 2 ? "active" : ""}">하위 2단계+</button>
    </div>

    <div class="layer-set-delete-tree-list">
      ${
        rows.length
          ? rows.map((row) => {
              const isSelected = selectedIds.has(row.id);

              const guideHtml = row.displayDepth > 0
                ? row.displayGuideMask.map((showLine) => `
                    <span class="layer-set-tree-guide ${showLine ? "show" : ""}"></span>
                  `).join("")
                : "";

              const branchHtml = row.displayDepth > 0
                ? `<span class="layer-set-tree-branch ${row.isLast ? "last" : "mid"}"></span>`
                : `<span class="layer-set-tree-root-branch"></span>`;

              const childHintHtml = row.childCount > 0
                ? `<div class="layer-set-delete-tree-child-hint">하위 집합</div>`
                : "";

              return `
                <div
                  class="layer-set-delete-tree-row ${isSelected ? "selected-for-delete" : ""}"
                  data-layer-set-delete-id="${row.id}"
                >
                  <div class="layer-set-delete-tree-linebox">
                    ${guideHtml}
                    ${branchHtml}
                  </div>

                  <div class="layer-set-delete-tree-content">
                    <div class="layer-set-delete-tree-box">
                      <div class="layer-set-delete-tree-name">${row.name}</div>
                      <div class="layer-set-delete-tree-meta">
                        LAYER ${row.layerCount} / SET ${row.childCount}
                      </div>
                    </div>
                    ${childHintHtml}
                  </div>
                </div>
              `;
            }).join("")
          : `<div class="empty-state">삭제할 집합 없음</div>`
      }
    </div>
  `;

  listBox.querySelectorAll("[data-layer-set-delete-id]").forEach((item) => {
    item.onclick = () => {
      const id = item.dataset.layerSetDeleteId;
      if (!id) return;
      toggleLayerSetDeleteSelection(id);
    };
  });

  listBox.querySelectorAll("[data-set-delete-depth]").forEach((btn) => {
    btn.onclick = () => {
      const depth = Number(btn.dataset.setDeleteDepth || 0);
      setLayerSetDeleteMinDepth(depth);
    };
  });
}

function deleteSelectedLayerSets() {
  const selectedIds = new Set(uiState.setDeleteModal?.selectedSetIds || []);
  if (!selectedIds.size) return;

  const deletedNames = (uiState.layerSets || [])
    .filter((set) => selectedIds.has(set.id))
    .map((set) => set.name);

  uiState.layerSets = (uiState.layerSets || [])
    .filter((set) => !selectedIds.has(set.id))
    .map((set) => {
      const next = normalizeLayerSetEntry(set);

      if (selectedIds.has(next.parentSetId)) {
        next.parentSetId = null;
      }

      next.childSetIds = (next.childSetIds || []).filter((id) => !selectedIds.has(id));
      return next;
    });

  if (selectedIds.has(uiState.setExplorerState?.selectedSetId)) {
    uiState.setExplorerState.selectedSetId = null;
    uiState.setExplorerState.viewMode = "home";
  }

  recordLog?.({
    type: "SET_DELETE",
    scope: "LAYER",
    refId: null,
    summary: `[SET] delete: ${deletedNames.join(", ")}`
  });

  closeLayerSetDeleteModal();
  renderLayerExplorerFullPage?.();
  saveLabState?.();
}

function deleteLayerSetEntry(setId) {
  if (!setId) return;

  const target = (uiState.layerSets || []).find((x) => x.id === setId);
  if (!target) return;

  uiState.layerSets = (uiState.layerSets || [])
    .filter((set) => set.id !== setId)
    .map((set) => {
      const next = normalizeLayerSetEntry(set);

      if (next.parentSetId === setId) {
        next.parentSetId = target.parentSetId || null;
      }

      next.childSetIds = (next.childSetIds || []).filter((id) => id !== setId);
      return next;
    });

  if (uiState.setExplorerState?.selectedSetId === setId) {
    uiState.setExplorerState.selectedSetId = target.parentSetId || null;
    uiState.setExplorerState.viewMode = target.parentSetId ? "detail" : "home";
  }

  recordLog?.({
    type: "SET_DELETE",
    scope: "LAYER",
    refId: setId,
    summary: `[SET] delete: ${target.name}`
  });

  renderLayerExplorerFullPage?.();
  saveLabState?.();
}

function addSelectedLayersToSet(setId) {
  if (!setId) return;

  const selectedLayerNames =
    Array.isArray(uiState.selectedLayerNames) && uiState.selectedLayerNames.length
      ? [...uiState.selectedLayerNames]
      : (uiState.currentLayerName ? [uiState.currentLayerName] : []);

  if (!selectedLayerNames.length) return;

  uiState.layerSets = (uiState.layerSets || []).map((set) => {
    if (set.id !== setId) return normalizeLayerSetEntry(set);

    return normalizeLayerSetEntry({
      ...set,
      layerNames: [...new Set([...(set.layerNames || []), ...selectedLayerNames])],
      updatedAt: Date.now()
    });
  });

  recordLog?.({
    type: "SET_LAYER_ADD",
    scope: "LAYER",
    refId: setId,
    summary: `[SET] layer add: ${selectedLayerNames.join(", ")}`
  });

  renderLayerExplorerFullPage?.();
  saveLabState?.();
}

function removeSuggestionsForAlreadyAppliedGroupTags() {
  const suggestions = ensureSuggestionState();

  uiState.suggestions = suggestions.filter((sug) => {
    if (sug.entityType !== "GROUP") return true;
    if (sug.status !== "NEW" && sug.status !== "SNOOZED") return true;

    return !hasGroupTagApplied(sug.entityId, sug.suggestedTag);
  });

  saveLabState?.();
  renderSuggestionToasts?.();
  renderSuggestionInboxExplorer?.();
  renderUnreadMessageExplorer?.();

  return uiState.suggestions;
}

function resolveLayerGroupCode(data = {}) {
  const explicit =
    data?.sourceMeta?.groupCode ||
    data?.groupContext?.groupCode ||
    data?.groupCode ||
    data?.groupId ||
    "";

  if (explicit) {
    return makeFixedAlphaCode(explicit, 3, "X");
  }

  const activeGroupIds = Array.isArray(data?.activeGroupIds)
    ? data.activeGroupIds
    : Array.isArray(uiState.activeGroupIds)
      ? uiState.activeGroupIds
      : [];

  const firstGroupId = activeGroupIds[0] || data?.groupId || "";
  return makeFixedAlphaCode(firstGroupId, 3, "X");
}

function buildLayerStructuredPrefix(data = {}) {
  const major = resolveLayerMajorCategoryCode(data.mode, data.sourceMeta || {});
  const upper = resolveLayerUpperGroupCode(data);
  const group = resolveLayerGroupCode(data);

  return `${major}${upper}${group}`;
}

function nextLayerSequenceForStructuredPrefix(prefix = "") {
  const layers = Array.isArray(uiState.savedLayers) ? uiState.savedLayers : [];
  let maxSeq = 0;

  layers.forEach((layer) => {
    const name = String(layer?.name || "");
    const match = name.match(/^([A-Z]{6})-(\d{4})$/);
    if (!match) return;

    if (match[1] !== prefix) return;

    const seq = Number(match[2]);
    if (Number.isFinite(seq) && seq > maxSeq) {
      maxSeq = seq;
    }
  });

  return maxSeq + 1;
}

function buildStructuredLayerName(data = {}) {
  const prefix = buildLayerStructuredPrefix(data);
  const seq = nextLayerSequenceForStructuredPrefix(prefix);
  return `${prefix}-${String(seq).padStart(4, "0")}`;
}

function exportAllDataSnapshot() {
  return {
    events: uiState.events || [],
    layers: uiState.savedLayers || [],
    patterns: [...(uiState.patternMap?.values() || [])],
    groups: [...groupStore.values()]
  };
}

function exportLogsSnapshot() {
  return {
    logs: uiState.logs || [],
    validationErrors: uiState.validationErrors || []
  };
}

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}

function showFilterGradeHover(node, clientX, clientY) {
  if (!els.filterGradeHover || !node) return;

  const grade = node.data("filterGrade") || "-";
  const multiplier = node.data("filterMultiplier");
  const rawMultiplier = node.data("filterRawMultiplier");
  const pass = node.data("filterPass");

  const rotFactor = node.data("filterRotFactor");
  const capFactor = node.data("filterCapFactor");
  const varFactor = node.data("filterVarFactor");

  const gradeColor = getFilterGradeColor(grade);

  els.filterGradeHover.innerHTML = `
    <div><b>${node.data("label") || node.id()}</b></div>
    <div>pass: ${pass ? "YES" : "NO"}</div>
    <div>grade: <span style="color:${gradeColor}; font-weight:700;">${grade}</span></div>
    <div>raw multiplier: ${
  typeof rawMultiplier === "number" ? Number(rawMultiplier).toFixed(3) : "-"
}</div>

    <div>rot: ${
      typeof rotFactor === "number" ? Number(rotFactor).toFixed(3) : "-"
    }</div>
    <div>cap: ${
      typeof capFactor === "number" ? Number(capFactor).toFixed(3) : "-"
    }</div>
    <div>var: ${
      typeof varFactor === "number" ? Number(varFactor).toFixed(3) : "-"
    }</div>
  `;

  els.filterGradeHover.style.left = `${clientX + 12}px`;
  els.filterGradeHover.style.top = `${clientY + 12}px`;
  els.filterGradeHover.classList.remove("hidden");

}

function hideFilterGradeHover() {
  if (!els.filterGradeHover) return;
  els.filterGradeHover.classList.add("hidden");
}

function applyPatternLinkWorkspaceToMainGraphPreview() {
  if (!window.cy) return;

  const ws = getPatternLinkWorkspace();
  if (!ws || !ws.open || !ws.active) return;

  const hiddenNodeIds = ws.hiddenNodeIds || new Set();
  const hiddenEdgeIds = ws.hiddenEdgeIds || new Set();
  const relationFilter = ws.edgeRelationFilter || "ALL";

  cy.nodes().forEach((node) => {
    const id = node.id();

    if (hiddenNodeIds.has(id)) {
      node.style("display", "none");
      return;
    }

    node.style("display", "element");
  });

  cy.edges().forEach((edge) => {
    const id = edge.id();
    const relationTag = edge.data("relationTag") || edge.data("label") || "UNKNOWN";

    const hiddenByWorkspace = hiddenEdgeIds.has(id);
    const blockedByRelation =
      relationFilter !== "ALL" && relationTag !== relationFilter;

    if (hiddenByWorkspace || blockedByRelation) {
      edge.style("display", "none");
      return;
    }

    const sourceVisible = edge.source().style("display") !== "none";
    const targetVisible = edge.target().style("display") !== "none";

    edge.style("display", sourceVisible && targetVisible ? "element" : "none");
  });

  if (ws.dimMode) {
    cy.nodes().forEach((node) => {
      const shouldDim = ws.dimmedNodeIds?.has(node.id());
      node.style("opacity", shouldDim ? (ws.dimStrength ?? 0.08) : 1);
    });

    cy.edges().forEach((edge) => {
      const shouldDim = ws.dimmedEdgeIds?.has(edge.id());
      edge.style("opacity", shouldDim ? Math.max(0.02, (ws.dimStrength ?? 0.08) * 0.75) : 1);
    });
  } else {
    cy.nodes().forEach((node) => node.removeStyle("opacity"));
    cy.edges().forEach((edge) => edge.removeStyle("opacity"));
  }
}

function applyPatternLinkWorkspaceToMainGraph() {
  const mainCy = window.cy;
  const plc = getPatternLinkCy();

  if (!mainCy || !plc) return;

  const visibleIds = new Set(
    plc.nodes()
      .filter((node) => node.visible())
      .map((node) => node.id())
  );

  // ===== 노드 적용 =====
  mainCy.nodes().forEach((node) => {
  if (visibleIds.has(node.id())) {
    node.style("display", "element");
  }
});

  // ===== 엣지 적용 =====
  mainCy.edges().forEach((edge) => {
  const sourceVisible = edge.source().style("display") !== "none";
  const targetVisible = edge.target().style("display") !== "none";

  if (sourceVisible && targetVisible) {
    edge.style("display", "element");
  }
});

  // ===== 상태 반영 =====
  uiState.activeGroupIds = [];
  uiState.currentLayerName = getPatternLinkWorkspace().loadedLayerName || "PL-APPLIED";

  if (typeof refreshGraphState === "function") {
    refreshGraphState();
  }

  if (typeof renderSideMiniStatus === "function") {
    renderSideMiniStatus();
  }

  if (typeof renderLayerMetaFields === "function") {
    renderLayerMetaFields();
  }
}

function applyPatternLinkTempEdgesToMainGraph() {
  const plc = getPatternLinkCy();
  const mainCy = window.cy;

  if (!plc || !mainCy) return;

  const tempEdges = plc.edges().filter((edge) => edge.data("type") === "PL_TEMP");

  tempEdges.forEach((edge) => {
    const source = edge.data("source");
    const target = edge.data("target");
    const label = edge.data("label") || "TEMP";
    const relationTag = edge.data("relationTag") || label || "TEMP";

    const mainEdgeId = `MAIN-TEMP-${source}-${target}`;
    if (mainCy.getElementById(mainEdgeId).length > 0) return;

    mainCy.add({
      group: "edges",
      data: {
        id: mainEdgeId,
        source,
        target,
        type: "TEMP_TEST",
        label,
        relationTag
      }
    });

    const added = mainCy.getElementById(mainEdgeId);
    if (added && added.length > 0) {
      added.style({
        "line-color": "#ffd43b",
        "target-arrow-color": "#ffd43b",
        width: 3,
        "line-style": "solid"
      });
    }
  });

  saveLabState();
}

function clearPreviewHighlight() {
  if (!window.cy) return;

  cy.nodes().forEach((node) => {
    node.removeClass("node-dimmed");
  });

  cy.edges().forEach((edge) => {
    edge.removeClass("edge-dimmed");
  });
}

function addGroupToLayer(groupId) {
  if (!uiState.activeGroupIds) uiState.activeGroupIds = [];

  if (!uiState.activeGroupIds.includes(groupId)) {
    uiState.activeGroupIds.push(groupId);
  }

  refreshGraphState();
  renderSideMiniStatus();
  saveLabState();
}

function removeGroupFromLayer(groupId) {
  uiState.activeGroupIds =
    (uiState.activeGroupIds || []).filter((id) => id !== groupId);

  refreshGraphState();
  renderSideMiniStatus();
  saveLabState();
}

function getFocusRelayoutContext() {
  if (!window.cy) return null;

  if (uiState.selectedEventId) {
    return {
      type: "event",
      centerId: uiState.selectedEventId
    };
  }

const selectedGroupCenterId = getGroupCenterNodeId(uiState.selectedGroup);
if (selectedGroupCenterId) {
  return {
    type: "group",
    centerId: selectedGroupCenterId,
    group: uiState.selectedGroup
  };
}

  const currentLayer = getCurrentLayerObject?.() || null;
  if (currentLayer && Array.isArray(currentLayer.nodes) && currentLayer.nodes.length > 0) {
    return {
      type: "layer",
      layer: currentLayer,
      nodeIds: [...currentLayer.nodes]
    };
  }

  if (Array.isArray(uiState.activeGroupIds) && uiState.activeGroupIds.length > 0) {
    const collected = [];

    uiState.activeGroupIds.forEach((groupId) => {
      const g = groupStore?.get(groupId);
      if (!g) return;

      if (Array.isArray(g.nodes)) {
        collected.push(...g.nodes);
      }

      if (g.center) {
        collected.push(g.center);
      }
    });

    const uniq = [...new Set(collected.filter(Boolean))];

    if (uniq.length > 0) {
      return {
        type: "activeGroups",
        nodeIds: uniq
      };
    }
  }

  return null;
}

function getCyNodesFromIds(nodeIds = []) {
  if (!window.cy) return [];

  return [...new Set(nodeIds)]
    .map((id) => cy.getElementById(id))
    .filter((el) => el && el.length > 0)
    .map((el) => el[0]);
}

function layoutNodesInGrid(nodes, options = {}) {
  const colGap = options.colGap ?? 180;
  const rowGap = options.rowGap ?? 110;
  const startX = options.startX ?? 120;
  const startY = options.startY ?? 100;
  const colCount = options.colCount ?? 2;

  nodes.forEach((node, index) => {
    const col = index % colCount;
    const row = Math.floor(index / colCount);

    node.position({
      x: startX + col * colGap,
      y: startY + row * rowGap
    });
  });
}

function computeActiveLayerNodes() {
  const groups = (uiState.activeGroupIds || [])
    .map(id => groupStore.get(id))
    .filter(Boolean);

  const nodeSet = new Set();

  groups.forEach((g) => {
    if (g.center) nodeSet.add(g.center);
    (g.nodes || []).forEach((n) => nodeSet.add(n));
  });

  return Array.from(nodeSet);
}

function highlightPreview(nodeIds) {
  if (!window.cy) return;

  const keep = new Set(nodeIds || []);

  cy.nodes().forEach((node) => {
    if (keep.has(node.id())) {
      node.removeClass("node-dimmed");
    } else {
      node.addClass("node-dimmed");
    }
  });

  cy.edges().forEach((edge) => {
    const visible =
      keep.has(edge.source().id()) &&
      keep.has(edge.target().id());

    if (visible) {
      edge.removeClass("edge-dimmed");
    } else {
      edge.addClass("edge-dimmed");
    }
  });
}

function getGroupCenterNodeId(group) {
  if (!group) return null;
  return group?.core?.centerNodeId || group.center || null;
}

function getGroupMemberNodeIds(group) {
  if (!group) return [];
  const next = [
    ...(Array.isArray(group?.core?.memberNodeIds) ? group.core.memberNodeIds : []),
    ...(Array.isArray(group?.nodes) ? group.nodes : [])
  ].filter(Boolean);

  return [...new Set(next)];
}

function getGroupRequiredNodeIds(group) {
  if (!group) return [];
  return [...new Set(
    Array.isArray(group?.core?.requiredNodeIds)
      ? group.core.requiredNodeIds.filter(Boolean)
      : []
  )];
}

function getGroupEdgeTypes(group) {
  if (!group) return [];
  const next = [
    ...(Array.isArray(group?.core?.requiredEdgeTypes) ? group.core.requiredEdgeTypes : []),
    group.edgeType
  ].filter(Boolean);

  return [...new Set(next)];
}

function getGroupPrimaryEdgeType(group) {
  return getGroupEdgeTypes(group)[0] || "-";
}

function getGroupEditTagEntries(group) {
  const edit = ensureGroupEditState?.(group);
  return Array.isArray(edit?.adjustmentTags)
    ? edit.adjustmentTags.filter(Boolean)
    : [];
}

function getGroupCurrentTagKeys(group) {
  return [...new Set(
    getGroupEditTagEntries(group)
      .map((entry) => entry.tag)
      .filter(Boolean)
  )];
}

function getGroupTagKeysByEffectTarget(group, targetName) {
  return [...new Set(
    getGroupEditTagEntries(group)
      .filter((entry) => {
        return (entry.effects || []).some((effect) => effect.target === targetName);
      })
      .map((entry) => entry.tag)
      .filter(Boolean)
  )];
}

function getGroupTagsByCategory(group, category) {
  return [...new Set(
    getGroupEditTagEntries(group)
      .filter((entry) => entry.category === category)
      .map((entry) => entry.tag)
      .filter(Boolean)
  )];
}

function getGroupSignatureTags(group) {
  if (!group) return [];

  const next = [
    ...(Array.isArray(group?.core?.signatureTags) ? group.core.signatureTags : []),
    ...(Array.isArray(group?.tags) ? group.tags : []),
    ...getGroupCurrentTagKeys(group)
  ].filter(Boolean);

  return [...new Set(next)];
}

function getGroupPurityTags(group) {
  if (!group) return [];

  const next = [
    ...(Array.isArray(group?.context?.purityTags) ? group.context.purityTags : []),
    ...getGroupTagKeysByEffectTarget(group, "purity")
  ].filter(Boolean);

  return [...new Set(next)];
}

function getGroupContaminationTags(group) {
  if (!group) return [];

  const next = [
    ...(Array.isArray(group?.context?.contaminationTags) ? group.context.contaminationTags : []),
    ...getGroupTagKeysByEffectTarget(group, "contamination")
  ].filter(Boolean);

  return [...new Set(next)];
}

function renderGroupDetailTagChips(tags = [], type = "all") {
  if (!Array.isArray(tags) || !tags.length) {
    return `<span class="group-detail-tag-empty">-</span>`;
  }

  return tags.map((tag) => `
    <button
      type="button"
      class="group-detail-tag-chip"
      data-group-detail-tag="${tag}"
      data-group-detail-tag-type="${type}"
    >
      ${getDisplayTagName(tag)}
    </button>
  `).join("");
}

function getGroupAllNodeIds(group) {
  const center = getGroupCenterNodeId(group);
  const members = getGroupMemberNodeIds(group);
  return [...new Set([center, ...members].filter(Boolean))];
}

function getGroupEvaluationScore(group, key, fallback = 0) {
  const value = Number(group?.evaluation?.[key]);
  return Number.isFinite(value) ? value : fallback;
}

function getGroupNodeRank(group, nodeId) {
  if (!group || !nodeId) return null;
  return group?.evaluation?.nodeRankMap?.[nodeId] || null;
}

function getGroupNodeWeight(group, nodeId, fallback = 0) {
  if (!group || !nodeId) return fallback;
  const value = Number(group?.evaluation?.nodeWeightMap?.[nodeId]);
  return Number.isFinite(value) ? value : fallback;
}

function isGroupBase(groupOrId) {
  const group = typeof groupOrId === "string"
    ? groupStore.get(groupOrId)
    : groupOrId;

  if (!group) return false;

  return Boolean(
    group?.status?.isBase ||
    group?.relation?.baseGroupId === group.id ||
    uiState?.baseGroupId === group.id ||
    uiState?.focusGroupId === group.id
  );
}

function setBaseGroupImmediate(groupId) {
  if (!groupId) return;

  uiState.baseGroupId = groupId;
  uiState.focusGroupId = groupId;

  groupStore.forEach((group, id) => {
    if (!group) return;

    if (!group.status) group.status = {};
    group.status.isBase = id === groupId;
  });
}

const GROUP_ADJUSTMENT_TAG_CATEGORIES = {
  SELF_NODE: "자기 노드 원인",
  OTHER_NODE: "다른 노드 원인",
  GROUP_STRUCTURE: "그룹 구조",
  ALGORITHM: "알고리즘",
  THEORY: "이론",
  DATA_SOURCE: "데이터/소스",
  MARKET_CONTEXT: "시장/외부"
};

const GROUP_ADJUSTMENT_TAG_RULES = {
  EXU: {
    category: "MARKET_CONTEXT",
    label: "외부 불확실성",
effects: [
  { target: "g", direction: "down", min: 0.06, max: 0.10 }
],
    reason: "external_uncertainty"
  },

  LEAK: {
    category: "DATA_SOURCE",
    label: "선반영 / 정보 누출",
    target: "confidence",
    direction: "down",
    amount: 0.06,
    reason: "information_leak"
  },

  NOISE: {
    category: "SELF_NODE",
    label: "노이즈성 반응",
    target: "purity",
    direction: "down",
    amount: 0.05,
    reason: "noise_reaction"
  },

  WEAK: {
    category: "GROUP_STRUCTURE",
    label: "약한 연결",
    target: "importance",
    direction: "down",
    amount: 0.04,
    reason: "weak_relation"
  },

  DUP: {
    category: "GROUP_STRUCTURE",
    label: "중복 구조",
    target: "importance",
    direction: "down",
    amount: 0.03,
    reason: "duplicate_structure"
  },

  LAG: {
    category: "OTHER_NODE",
    label: "지연 반응",
    target: "confidence",
    direction: "down",
    amount: 0.03,
    reason: "lagged_reaction"
  },

  FAIL: {
    category: "THEORY",
    label: "실패 사례",
    target: "g",
    direction: "down",
    amount: 0.12,
    reason: "failed_case"
  },

  PURE: {
    category: "THEORY",
    label: "순수성 강화",
    target: "purity",
    direction: "up",
    amount: 0.06,
    reason: "purity_confirmed"
  },

  CORE: {
    category: "GROUP_STRUCTURE",
    label: "핵심 구조",
    target: "importance",
    direction: "up",
    amount: 0.08,
    reason: "core_structure"
  },

  CONF: {
    category: "THEORY",
    label: "신뢰도 강화",
    target: "confidence",
    direction: "up",
    amount: 0.05,
    reason: "confidence_confirmed"
  },

  ALG: {
    category: "ALGORITHM",
    label: "알고리즘 원인",
    target: "confidence",
    direction: "down",
    amount: 0.05,
    reason: "algorithmic_cause"
  },

  PURITY_CHECK_FAIL: {
    category: "ALGORITHM",
    label: "순수성 검사 실패",
    target: "purity",
    direction: "down",
    amount: 0.10,
    reason: "purity_check_failed"
  }
};

function getGroupCardMeta(group) {
  const memberNodeIds = getGroupMemberNodeIds(group);
  const centerNodeId = getGroupCenterNodeId(group);

  const basePurityScore = getGroupEvaluationScore(group, "purityScore", 1);
  const baseContaminationScore = getGroupEvaluationScore(group, "contaminationScore", 0);
  const baseImportanceScore = getGroupEvaluationScore(group, "importanceScore", 0);
  const baseConfidenceScore = getGroupEvaluationScore(group, "confidenceScore", 0);

  const adjusted = computeGroupAdjustedMetrics?.(group, {
    purityScore: basePurityScore,
    contaminationScore: baseContaminationScore,
    importanceScore: baseImportanceScore,
    confidenceScore: baseConfidenceScore,
    gScore: baseConfidenceScore
  }) || {
    purity: basePurityScore,
    contamination: baseContaminationScore,
    importance: baseImportanceScore,
    confidence: baseConfidenceScore,
    g: baseConfidenceScore,
    adjustmentLog: []
  };

  return {
    centerNodeId,
    nodeCount: memberNodeIds.length,
    edgeCount: Number.isFinite(group?.edgeCount)
      ? group.edgeCount
      : Math.max(0, memberNodeIds.length - 1),

    purityScore: adjusted.purity,
    contaminationScore: adjusted.contamination,
    importanceScore: adjusted.importance,
    confidenceScore: adjusted.confidence,
    gScore: adjusted.g,
    adjustmentLog: adjusted.adjustmentLog || [],

    basePurityScore,
    baseContaminationScore,
    baseImportanceScore,
    baseConfidenceScore,

    relationTag: getGroupPrimaryEdgeType(group),
    signatureTags: getGroupSignatureTags(group),
    purityTags: getGroupPurityTags(group),
    contaminationTags: getGroupContaminationTags(group)
  };
}

function ensureGroupEditState(group) {
  if (!group) return null;

  if (!group.edit || typeof group.edit !== "object") {
    group.edit = {};
  }

  if (!Array.isArray(group.edit.refs)) {
    group.edit.refs = [];
  }

  if (!Array.isArray(group.edit.adjustmentTags)) {
    group.edit.adjustmentTags = [];
  }

  if (!Array.isArray(group.edit.logs)) {
    group.edit.logs = [];
  }

  return group.edit;
}

function addGroupReference(groupId, ref = {}) {
  const group = groupStore.get(groupId);
  if (!group) return null;

  return addEntityReference(group, ref);
}

function addGroupAdjustmentTag(groupId, tagKey, options = {}) {
  const group = groupStore.get(groupId);
  if (!group) return null;

  group.entityType = "GROUP";

  return addEntityAdjustmentTag(group, tagKey, {
    ...options,
    entityType: "GROUP"
  });
}

function removeGroupReference(groupId, refEntryId) {
  if (!groupId || !refEntryId) return false;

  const group = groupStore.get(groupId);
  if (!group) return false;

  const edit = ensureGroupEditState(group);
  if (!edit) return false;

  const before = edit.refs.length;
  edit.refs = edit.refs.filter((ref) => ref.id !== refEntryId);

  const changed = edit.refs.length !== before;

  if (changed) {
    edit.logs.push({
      type: "REMOVE_REF",
      refEntryId,
      createdAt: Date.now()
    });

    saveLabState?.();
  }

  return changed;
}

function removeGroupAdjustmentTag(groupId, adjustmentId) {
  if (!groupId || !adjustmentId) return false;

  const group = groupStore.get(groupId);
  if (!group) return false;

  const edit = ensureGroupEditState(group);
  if (!edit) return false;

  const before = edit.adjustmentTags.length;
  edit.adjustmentTags = edit.adjustmentTags.filter((tag) => tag.id !== adjustmentId);

  const changed = edit.adjustmentTags.length !== before;

  if (changed) {
    edit.logs.push({
      type: "REMOVE_ADJUSTMENT",
      adjustmentId,
      createdAt: Date.now()
    });

    saveLabState?.();
  }

  return changed;
}

function buildRelationExplorerDataFromGroup(groupId) {
  if (!window.cy || !groupId) {
    return { nodeIds: [], edges: [] };
  }

  const group = groupStore.get(groupId);
  if (!group) {
    return { nodeIds: [], edges: [] };
  }

  const baseNodeIds = new Set([
    group.center,
    ...(group.nodes || [])
  ].filter(Boolean));

  const relatedNodeIds = new Set([...baseNodeIds]);
  const edges = [];

  cy.edges().forEach((edge) => {
    const sourceId = edge.source().id();
    const targetId = edge.target().id();
    const relationTag = edge.data("relationTag") || edge.data("label") || "UNKNOWN";

    const hit = baseNodeIds.has(sourceId) || baseNodeIds.has(targetId);
    if (!hit) return;

    relatedNodeIds.add(sourceId);
    relatedNodeIds.add(targetId);

    edges.push({
      id: edge.id(),
      sourceId,
      targetId,
      relationTag
    });
  });

  return {
    nodeIds: [...relatedNodeIds],
    edges
  };
}

function getRelationExplorerState() {
  return uiState.relationExplorer || {};
}

function getRelationExplorerDerived() {
  const rel = getRelationExplorerState();
  const baseGroupId = rel.baseGroupId;

  if (!baseGroupId) {
    return {
      data: { nodeIds: [], edges: [] },
      visibleEdges: [],
      relatedNodeIds: [],
      relatedEdgeIds: [],
      focusNodeWeights: {},
      focusEdgeWeights: {}
    };
  }

  const data = buildRelationExplorerDataFromGroup(baseGroupId);
  const filter = rel.edgeFilter || "ALL";

  const visibleEdges = (data.edges || []).filter((edgeInfo) => {
    return filter === "ALL" || edgeInfo.relationTag === filter;
  });

  const selectedSet = new Set(rel.selectedEdgeIds || []);
  const selectedVisibleEdges = visibleEdges.filter((edgeInfo) => selectedSet.has(edgeInfo.id));

  const focusNodeWeights = {};
  const focusEdgeWeights = {};
  const relatedNodeSet = new Set(data.nodeIds || []);
  const relatedEdgeIds = (data.edges || []).map((edgeInfo) => edgeInfo.id);

  selectedVisibleEdges.forEach((edgeInfo) => {
    focusEdgeWeights[edgeInfo.id] = (focusEdgeWeights[edgeInfo.id] || 0) + 1;

    if (edgeInfo.sourceId) {
      focusNodeWeights[edgeInfo.sourceId] = (focusNodeWeights[edgeInfo.sourceId] || 0) + 1;
    }

    if (edgeInfo.targetId) {
      focusNodeWeights[edgeInfo.targetId] = (focusNodeWeights[edgeInfo.targetId] || 0) + 1;
    }
  });

  return {
    data,
    visibleEdges,
    relatedNodeIds: [...relatedNodeSet],
    relatedEdgeIds,
    focusNodeWeights,
    focusEdgeWeights
  };
}

function recomputeRelationExplorerWeights() {
  return getRelationExplorerDerived();
}

function renderRelationExplorer() {
  if (!els.relationExplorer) return;

  const rel = getRelationExplorerState();
  const baseGroupId = rel.baseGroupId || null;

  if (!baseGroupId) {
    if (els.relationExplorerTarget) {
      els.relationExplorerTarget.textContent = "group: -";
    }
    if (els.relationExplorerSummary) {
      els.relationExplorerSummary.textContent = "node: 0 / edge: 0 / total: 0 / selected: 0";
    }
    if (els.relationNodeList) {
      els.relationNodeList.innerHTML = `<div class="empty-state">관련 node 없음</div>`;
    }
    if (els.relationEdgeList) {
      els.relationEdgeList.innerHTML = `<div class="empty-state">관련 edge 없음</div>`;
    }
    return;
  }

  const group = groupStore.get(baseGroupId);
  const {
    data,
    visibleEdges,
    relatedNodeIds,
    focusNodeWeights
  } = getRelationExplorerDerived();

  const currentFilter = rel.edgeFilter || "ALL";
  const selectedEdgeSet = new Set(rel.selectedEdgeIds || []);
  const totalEdgeCount = (data.edges || []).length;
  const visibleEdgeCount = visibleEdges.length;

  if (els.relationExplorerTarget) {
    els.relationExplorerTarget.textContent = `group: ${group?.name || group?.id || baseGroupId}`;
  }

  if (els.relationExplorerSummary) {
    els.relationExplorerSummary.textContent =
      `node: ${relatedNodeIds.length} / edge: ${visibleEdgeCount} / total: ${totalEdgeCount} / selected: ${(rel.selectedEdgeIds || []).length}`;
  }

  if (els.relationNodeList) {
    els.relationNodeList.innerHTML = relatedNodeIds.length
      ? relatedNodeIds
          .slice(0, 30)
          .map((id) => {
            const on = Number(focusNodeWeights[id] || 0) > 0;
            return `
              <button
                class="pl-compare-item-btn ${on ? "active" : ""}"
                data-relation-node-id="${id}">
                ${id}${on ? ' <span class="mini-on-badge">ON</span>' : ""}
              </button>
            `;
          })
          .join("")
      : `<div class="empty-state">관련 node 없음</div>`;
  }

  if (els.relationEdgeList) {
    els.relationEdgeList.innerHTML = (data.edges || []).length
      ? (data.edges || [])
          .slice(0, 40)
          .map((edgeInfo) => {
            const matchesFilter =
              currentFilter === "ALL" || edgeInfo.relationTag === currentFilter;

            return `
              <button
                class="pl-compare-item-btn
                       ${selectedEdgeSet.has(edgeInfo.id) ? "active" : ""}
                       ${matchesFilter ? "" : "relation-item-muted"}"
                data-relation-edge-id="${edgeInfo.id}">
                ${edgeInfo.id}
                <span class="relation-edge-tag">${edgeInfo.relationTag || "UNKNOWN"}</span>
                ${selectedEdgeSet.has(edgeInfo.id) ? ' <span class="mini-on-badge">ON</span>' : ""}
              </button>
            `;
          })
          .join("")
      : `<div class="empty-state">관련 edge 없음</div>`;
  }

  els.relationNodeList?.querySelectorAll("[data-relation-node-id]").forEach((btn) => {
    btn.onclick = () => {
      const id = btn.dataset.relationNodeId;
      if (!id) return;

      if (typeof focusNodeByIdFromFilterRank === "function") {
        focusNodeByIdFromFilterRank(id);
        return;
      }

      const node = cy.getElementById(id);
      if (!node || node.length === 0) return;

      cy.center(node);
      node.style({
        "border-width": 4,
        "border-color": "#ffd54f"
      });
      previewNodeFocusFromRelation?.();
    };
  });

  els.relationEdgeList?.querySelectorAll("[data-relation-edge-id]").forEach((btn) => {
    btn.onclick = () => {
      const id = btn.dataset.relationEdgeId;
      if (!id) return;

      toggleRelationEdgeFocus(id);

      const edge = cy.getElementById(id);
      if (edge && edge.length > 0) {
        cy.center(edge);
      }
    };
  });
}

function bindRelationExplorerControls() {
  const openRelationBtn = document.getElementById("btn-open-relation-explorer-from-group");
  if (openRelationBtn) {
  openRelationBtn.onclick = () => {
    if (typeof isExplorerInteractionLocked === "function" && isExplorerInteractionLocked()) {
      return;
    }

    openRelationExplorerWithRestore();
  };
}

if (els.closeRelationExplorerBtn) {
  els.closeRelationExplorerBtn.onclick = () => {
    uiState.relationExplorer.open = false;
    uiState.relationExplorer.active = false;

    if (els.relationExplorer) {
      els.relationExplorer.classList.add("hidden");
    }

    if (typeof resetRelationExplorerGraphViewOnly === "function") {
      resetRelationExplorerGraphViewOnly();
    } else {
      refreshGraphState?.();
    }

    saveLabState?.();
  };
}

  if (els.relationMakeLayerBtn) {
    els.relationMakeLayerBtn.onclick = () => {
      if (typeof jumpToLayerFromRelationExplorer === "function") {
        jumpToLayerFromRelationExplorer();
      } else if (typeof createLayerFromRelationExplorer === "function") {
        createLayerFromRelationExplorer();
        renderLayerPanel?.();
        renderLayerMetaFields?.();
        renderSideMiniStatus?.();
        saveLabState?.();
      }
    };
  }

  if (els.relationBackBtn) {
    els.relationBackBtn.onclick = () => {
      stepBackRelationExplorerFocus?.();
    };
  }

  if (els.resetRelationFocusBtn) {
    els.resetRelationFocusBtn.onclick = () => {
      resetRelationExplorerFocus?.();
      saveLabState?.();
    };
  }

document.querySelectorAll(".relation-edge-filter-btn").forEach((btn) => {
  btn.onclick = () => {
    const rel = uiState.relationExplorer;
    const filter = btn.dataset.relationEdgeFilter || "ALL";

    const prevFilter = rel.edgeFilter || "ALL";
    const prevSelectedEdgeIds = [...(rel.selectedEdgeIds || [])];

    const data = buildRelationExplorerDataFromGroup(rel.baseGroupId);
    const visibleEdges = (data.edges || []).filter((edgeInfo) => {
      return filter === "ALL" || edgeInfo.relationTag === filter;
    });

    if (!visibleEdges.length) {
      rel.emptyResultModal = {
        open: false,
        previousFilter: prevFilter,
        previousSelectedEdgeIds: prevSelectedEdgeIds
      };

      openRelationEmptyModal?.();
      return;
    }

    rel.history = Array.isArray(rel.history) ? rel.history : [];
    rel.history.push({
      selectedEdgeIds: [...(rel.selectedEdgeIds || [])],
      edgeFilter: rel.edgeFilter || "ALL"
    });

    rel.edgeFilter = filter;

    document.querySelectorAll(".relation-edge-filter-btn").forEach((x) => {
      x.classList.toggle("active", x.dataset.relationEdgeFilter === filter);
    });

    const visibleEdgeIds = new Set(visibleEdges.map((edgeInfo) => edgeInfo.id));
    rel.selectedEdgeIds =
      (rel.selectedEdgeIds || []).filter((id) => visibleEdgeIds.has(id));

    refreshGraphState?.();
    renderRelationExplorer?.();
    saveLabState?.();
  };
});

  if (els.closeRelationEmptyModalBtn) {
    els.closeRelationEmptyModalBtn.onclick = () => {
      closeRelationEmptyModalAndRestore?.();
      saveLabState?.();
    };
  }
}

function makeRelationExplorerDraggable() {
  const explorer = document.getElementById("relation-explorer");
  const head = document.getElementById("relation-explorer-head");

  if (!explorer || !head) return;
  if (explorer.dataset.dragBound === "true") return;

  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  explorer.addEventListener("mousedown", () => {
    bringExplorerToFront(explorer);
  });

  head.addEventListener("mousedown", (e) => {
    if (e.target.closest("button")) return;

    isDragging = true;

    const rect = explorer.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    explorer.style.right = "auto";
    explorer.style.left = `${rect.left}px`;
    explorer.style.top = `${rect.top}px`;
    explorer.style.transform = "none";

    document.body.style.userSelect = "none";
  });

  window.addEventListener("mousemove", (e) => {
    if (!isDragging) return;

    const explorerWidth = explorer.offsetWidth;
    const explorerHeight = explorer.offsetHeight;

    let nextLeft = e.clientX - offsetX;
    let nextTop = e.clientY - offsetY;

    const minLeft = 8;
    const minTop = 8;
    const maxLeft = window.innerWidth - explorerWidth - 8;
    const maxTop = window.innerHeight - explorerHeight - 8;

    nextLeft = Math.max(minLeft, Math.min(nextLeft, maxLeft));
    nextTop = Math.max(minTop, Math.min(nextTop, maxTop));

    explorer.style.left = `${nextLeft}px`;
    explorer.style.top = `${nextTop}px`;
  });

  window.addEventListener("mouseup", () => {
    isDragging = false;
    document.body.style.userSelect = "";
  });

  explorer.dataset.dragBound = "true";
}

function updatePatternCompactUI() {
  const isPatternPage = document.body.dataset.page === "pattern";
  const compact = !!uiState.patternCompactMode;

  document.body.classList.toggle("pattern-compact-mode", isPatternPage && compact);
}

function updatePatternLayerPreview(mode = "all") {
  const pattern = getSelectedPatternObject();
  if (!pattern) return;

  uiState.patternLayerPreview = buildPatternLayerPreview(pattern, mode);
  renderPatternLayerPreview();
  highlightPreview(uiState.patternLayerPreview.nodeIds);
}

function clearPatternSelectionUI(cards) {
  cards.forEach((card) => {
    card.classList.remove("selected");
  });
}

function makePatternLayerName(patternId) {
  const base = `Pattern-${patternId}`;
  const exists = new Set((uiState.savedLayers || []).map((l) => l.name));

  if (!exists.has(base)) return base;

  let i = 2;
  while (exists.has(`${base}-${i}`)) {
    i += 1;
  }
  return `${base}-${i}`;
}

function applyEdgeRelationFilter() {
  if (!window.cy) return;

  const filter = uiState.edgeRelationFilter || "ALL";

  cy.edges().forEach((edge) => {
    const tag = edge.data("relationTag") || edge.data("label") || "UNKNOWN";

    if (filter === "ALL" || tag === filter) {
      edge.style("display", "element");
    } else {
      edge.style("display", "none");
    }
  });
}

function applyCompareHighlight(layerNodes, workspaceNodes) {
  const plc = getPatternLinkCy();
  if (!plc) return;

  const setA = new Set(layerNodes);
  const setB = new Set(workspaceNodes);

  plc.nodes().forEach(n => {
    const id = n.id();

    n.removeClass("pl-layer-a");
    n.removeClass("pl-layer-b");

    if (setA.has(id) && !setB.has(id)) {
      n.addClass("pl-layer-a"); // layer only
    } else if (!setA.has(id) && setB.has(id)) {
      n.addClass("pl-layer-b"); // workspace only
    }
  });
}

function closeLayerPatternExplorer() {
  if (!els.layerPatternExplorer) return;
  els.layerPatternExplorer.classList.add("hidden");
  uiState.layerToPatternExplorerMode = "menu";
  resetGraphFocus();
}

function openPatternLayerMenu() {
  if (!els.patternLayerMenu) return;
  els.patternLayerMenu.classList.remove("hidden");
}

function openPatternLayerExplorer() {
  if (!els.patternLayerExplorer) return;

  uiState.patternToLayerExplorerMode = "menu";
  els.patternLayerExplorer.classList.remove("hidden");

  if (els.patternLayerMenuView) {
    els.patternLayerMenuView.classList.remove("hidden");
  }

  if (els.patternLayerCustomView) {
    els.patternLayerCustomView.classList.add("hidden");
  }

  renderPatternLayerExplorerView();
  renderPatternLayerPreview();
}

function closePatternLayerExplorer() {
  if (!els.patternLayerExplorer) return;

  els.patternLayerExplorer.classList.add("hidden");
  uiState.patternToLayerExplorerMode = "menu";

  if (typeof clearPreviewHighlight === "function") {
    clearPreviewHighlight();
  }
}

function renderPatternLayerExplorerView() {
  const mode = uiState.patternToLayerExplorerMode || "menu";

  if (els.patternLayerMenuView) {
    els.patternLayerMenuView.classList.toggle("hidden", mode !== "menu");
  }

  if (els.patternLayerCustomView) {
    els.patternLayerCustomView.classList.toggle("hidden", mode !== "custom");
  }
}

function renderPatternLayerPreview() {
  const box = document.getElementById("pattern-layer-preview");
  if (!box) return;

  const preview = uiState.patternLayerPreview || {
    mode: "all",
    nodeIds: [],
    nodeCount: 0,
    edgeCount: 0,
    sample: []
  };

  box.innerHTML = `
    <div><b>mode</b>: ${preview.mode || "-"}</div>
    <div><b>nodes</b>: ${preview.nodeCount || 0}</div>
    <div><b>edges/groups</b>: ${preview.edgeCount || 0}</div>
    <div><b>sample</b>: ${(preview.sample || []).join(", ") || "-"}</div>
  `;
}

function closePatternLayerMenu() {
  if (!els.patternLayerMenu) return;
  els.patternLayerMenu.classList.add("hidden");
}

function togglePatternLayerMenu() {
  if (!els.patternLayerMenu) return;
  els.patternLayerMenu.classList.toggle("hidden");
}

function createLayerFromPatternAll(pattern) {
  return createLayerFromPattern(pattern, {
    name: makePatternLayerName(pattern?.id || `PATTERN-${Date.now()}`)
  });
}

function createLayerFromRelationExplorer() {
  const nodeWeights = uiState.relationExplorer?.focusNodeWeights || {};
  const nodeIds = Object.keys(nodeWeights).filter((id) => nodeWeights[id] > 0);

  if (!nodeIds.length) return null;

  return saveLayerFromNodes(nodeIds, `REL-${Date.now()}`, {
    memo: "Relation Explorer 기반 Layer 생성",
    description: "선택 relation edge focus 기반",
    sourceMeta: {
      sourceType: "relation",
      sourceIds: [...(uiState.relationExplorer?.selectedEdgeIds || [])],
      category: "analysis",
      subcategory: "relation-focus",
      originScope: "group",
      originPath: [
        uiState.relationExplorer?.baseGroupId || "-",
        "RELATION",
        uiState.relationExplorer?.edgeFilter || "ALL"
      ],
      originTags: ["preview", "focus", "manual-reviewed"]
    }
  });
}

function isExplorerInteractionLocked() {
  if (uiState.isLayerDeleteMode) return true;
  if (uiState.isEventDeleteMode) return true;
  if (uiState.relationExplorer?.emptyResultModal?.open) return true;
  return false;
}

function jumpToGroupFromRelationExplorer() {
  if (isExplorerInteractionLocked()) return;

  const groupId = uiState.relationExplorer?.baseGroupId;
  if (!groupId) return;

  if (els.groupPanel) {
    els.groupPanel.classList.remove("hidden");
  }

  uiState.selectedGroupId = groupId;
  uiState.selectedGroupIds = [groupId];
  uiState.selectedGroup = groupStore.get(groupId) || null;
  uiState.expandedGroupId = groupId;

  renderGroupPanel?.();
  renderFocusHeader?.();
  renderDetailPanel?.();
}

function jumpToLayerFromRelationExplorer() {
  if (isExplorerInteractionLocked()) return;

  const layer = createLayerFromRelationExplorer();
  if (!layer) return null;

  uiState.currentLayerName = layer.name;
  uiState.selectedLayerNames = [layer.name];

  if (els.layerPanel) {
    els.layerPanel.classList.remove("hidden");
  }

  renderLayerPanel?.();
  renderLayerMetaFields?.();
  renderSideMiniStatus?.();
  saveLabState?.();

  return layer;
}

function createPatternFromLayer(layer, options = {}) {
  if (!layer || !Array.isArray(layer.nodes) || !layer.nodes.length) {
    return null;
  }

  return {
    id: options.id || `PATTERN-LAYER-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: options.type || "CUSTOM",
    name: options.name || layer.name || "",
    nodes: [...new Set(layer.nodes.filter(Boolean))],
    sourceLayerName: layer.name,
    sourceGroupIds: Array.isArray(options.sourceGroupIds)
      ? [...options.sourceGroupIds]
      : Array.isArray(layer.activeGroupIds)
        ? [...layer.activeGroupIds]
        : [],
    memo: options.memo || layer.memo || "",
    description: options.description || layer.description || ""
  };
}

function breakPatternExplorerTempChain() {
  const exp = uiState.patternExplorer;
  if (!exp) return;

  exp.tempEdgeChain = [];
  renderPatternLinkExplorerUI();
}

function undoPatternExplorerTempEdge() {
  const exp = uiState.patternExplorer;
  if (!exp || !window.cy) return;

  if (!Array.isArray(exp.tempEdgeIds)) {
    exp.tempEdgeIds = [];
  }
  if (!Array.isArray(exp.tempEdgeChain)) {
    exp.tempEdgeChain = [];
  }

  const lastEdgeId = exp.tempEdgeIds.pop();
  if (!lastEdgeId) return;

  const edge = cy.getElementById(lastEdgeId);
  if (edge && edge.length > 0) {
    const source = edge.data("source");
    const target = edge.data("target");

    edge.remove();

    const chain = exp.tempEdgeChain;
    if (chain.length > 0 && chain[chain.length - 1] === target) {
      chain.pop();
    }
    if (chain.length > 0 && chain[chain.length - 1] !== source) {
      chain.push(source);
    }
  }

  renderPatternLinkExplorerUI();
}

function backtrackPatternExplorerTempChain() {
  undoPatternExplorerTempEdge();
}

function createLayerFromPatternDense(pattern) {
  if (!pattern?.nodes?.length) return null;

  const ranked = [...new Set(pattern.nodes.filter(Boolean))]
    .map((id) => ({
      id,
      degree: getNodeConnectionCount(id)
    }))
    .sort((a, b) => b.degree - a.degree);

  const topIds = ranked
    .slice(0, Math.max(2, Math.ceil(ranked.length * 0.5)))
    .map((x) => x.id);

  return createLayerFromPattern(
    { ...pattern, nodes: topIds },
    {
      name: makePatternLayerName(`${pattern.id}-dense`),
      memo: "pattern dense 기반 자동 생성",
      description: `PATTERN ${pattern.id}의 밀도 높은 노드 기반 Layer`
    }
  );
}

function createLayersFromPatternGroups(pattern) {
  if (!pattern?.nodes?.length) return [];

  const groups = buildGroupsFromPattern(pattern);
  if (!groups?.length) return [];

  const created = [];

  groups.forEach((group, index) => {
    const nodeIds = Array.isArray(group.nodes)
      ? [...new Set(group.nodes.filter(Boolean))]
      : [];

    if (!nodeIds.length) return;

    const layer = createLayerFromPattern(
      {
        ...pattern,
        nodes: nodeIds
      },
      {
        name: makePatternLayerName(`${pattern.id}-group-${index + 1}`),
        memo: "pattern group 기반 자동 생성",
        description: `PATTERN ${pattern.id}의 그룹 분할 Layer`,
        groupId: group.id || null
      }
    );

    if (layer) created.push(layer);
  });

  return created;
}

function getSelectedPatternObject() {
  const patternId = uiState.selectedPatternId;
  if (!patternId) return null;

  const result = getPatternResultById(patternId);
  return result?.pattern || null;
}

function openAllDataExplorer() {
  if (!els.allDataExplorer) return;
  els.allDataExplorer.classList.remove("hidden");
  renderAllDataExplorer();
  renderAllDataDetail(null);
}

function closeAllDataExplorer() {
  if (!els.allDataExplorer) return;
  els.allDataExplorer.classList.add("hidden");
}

function getAllDataImportance(item) {
  if (!item) return 0;

  if (item.scope === "EVENT") {
    const v = item.payload?.variables || {};
    return Number(v.var || 0) + Number(v.rot || 0) * 0.1;
  }

  if (item.scope === "GROUP") {
    return Number((item.payload?.nodes || []).length || 0);
  }

  if (item.scope === "PATTERN") {
    return Number(item.payload?.probability || 0);
  }

  if (item.scope === "LAYER") {
    return Number((item.payload?.nodes || []).length || 0);
  }

  return 0;
}

function collectAllDataItems() {
  const items = [];

  const uniqueEvents = new Map();

(uiState.events || []).forEach((evt) => {
  if (!evt?.id) return;
  uniqueEvents.set(evt.id, evt);
});

[...uniqueEvents.values()].forEach((evt) => {
  items.push({
    id: `EVENT:${evt.id}`,
    scope: "EVENT",
    refId: evt.id,
    title: evt.name || evt.id,
    sub: `stat: ${evt.stat || "-"} / sentiment: ${evt.sentiment || "-"}`,
    payload: evt
  });
});

  groupStore.forEach((group) => {
    items.push({
      id: `GROUP:${group.id}`,
      scope: "GROUP",
      refId: group.id,
      title: group.id,
      sub: `center: ${group.center || "-"} / nodes: ${(group.nodes || []).length}`,
      payload: group
    });
  });

  (uiState.rankedResults || []).forEach((r) => {
    const p = r.pattern;
    if (!p) return;

    items.push({
      id: `PATTERN:${p.id}`,
      scope: "PATTERN",
      refId: p.id,
      title: p.id,
      sub: `${p.type || "-"} / prob: ${typeof r.probability === "number" ? r.probability.toFixed(2) : "-"}`,
      payload: {
        ...p,
        probability: r.probability
      }
    });
  });

  (uiState.savedLayers || []).forEach((layer) => {
    items.push({
      id: `LAYER:${layer.name}`,
      scope: "LAYER",
      refId: layer.name,
      title: layer.name,
      sub: `mode: ${layer.mode || "-"} / nodes: ${(layer.nodes || []).length}`,
      payload: layer
    });
  });

  return items;
}

function getFilterRankItems() {
  if (!window.cy) return [];

  const items = cy.nodes().map((node, index) => {
    const grade = node.data("filterGrade") || "-";
    const multiplier = Number(node.data("filterMultiplier") || 0);
    const rawMultiplier = Number(node.data("filterRawMultiplier") || 0);
    const pass = !!node.data("filterPass");

    return {
      id: node.id(),
      label: node.data("label") || node.id(),
      grade,
      multiplier,
      rawMultiplier,
      pass,
      gradeRank: getFilterGradeRank(grade),
      index
    };
  });

  const mode = uiState.filterRankMode;
const metric = uiState.filterRankMetric;
let valueKey = "multiplier";

if (metric === "raw") {
  valueKey = "rawMultiplier";
}

if (mode === "fail") {
  items.sort((a, b) => {
    const af = a.pass ? 0 : 1;
    const bf = b.pass ? 0 : 1;

    const failDiff = bf - af;
    if (failDiff !== 0) return failDiff;

    if (a[valueKey] !== b[valueKey]) {
      return a[valueKey] - b[valueKey];
    }

    return String(a.label).localeCompare(String(b.label));
  });
} else if (mode === "pass") {
  items.sort((a, b) => {
    const ap = a.pass ? 1 : 0;
    const bp = b.pass ? 1 : 0;

    const passDiff = bp - ap;
    if (passDiff !== 0) return passDiff;

    if (b[valueKey] !== a[valueKey]) {
      return b[valueKey] - a[valueKey];
    }

    return String(a.label).localeCompare(String(b.label));
  });
} else {
  items.sort((a, b) => {
    if (b[valueKey] !== a[valueKey]) {
      return b[valueKey] - a[valueKey];
    }

    return String(a.label).localeCompare(String(b.label));
  });
}

  return items;
}

function renderFilterRankExplorer() {
  const items = getFilterRankItems();

  if (!els.filterRankExplorerBody) return;

  if (els.filterRankPassBtn) {
    els.filterRankPassBtn.classList.toggle("active", uiState.filterRankMode === "pass");
  }

  if (els.filterRankFailBtn) {
    els.filterRankFailBtn.classList.toggle("active", uiState.filterRankMode === "fail");
  }

  if (els.filterRankBasicBtn) {
    els.filterRankBasicBtn.classList.toggle("active", uiState.filterRankMetric === "basic");
  }

  if (els.filterRankRawBtn) {
    els.filterRankRawBtn.classList.toggle("active", uiState.filterRankMetric === "raw");
  }

  if (!items.length) {
    els.filterRankExplorerBody.innerHTML = `
      <div class="empty-state">표시할 대상 없음</div>
    `;
    return;
  }

  els.filterRankExplorerBody.innerHTML = items.map((item) => {
    const color = getFilterGradeColor(item.grade);
    const isActive = uiState.filterRankActiveId === item.id;

return `
  <div class="filter-rank-item ${isActive ? "active" : ""}" data-filter-rank-id="${item.id}">
    <div class="filter-rank-item-title">
      ${item.label}
    </div>
    <div class="filter-rank-item-sub">
      <span style="color:${color}; font-weight:700;">${item.grade}</span>
      / basic: ${Number(item.multiplier).toFixed(3)}
      / raw: ${Number(item.rawMultiplier).toFixed(3)}
      / pass: ${item.pass ? "YES" : "NO"}
    </div>
  </div>
`;
  }).join("");

  els.filterRankExplorerBody
    .querySelectorAll("[data-filter-rank-id]")
    .forEach((itemEl) => {
      itemEl.onclick = () => {
        const id = itemEl.dataset.filterRankId;
        if (!id) return;

        uiState.filterRankActiveId = id;
        renderFilterRankExplorer();
        focusNodeByIdFromFilterRank(id);
      };
    });
}

function openRelationExplorerWithRestore(groupId = null) {
  const resolvedGroupId =
    groupId ||
    uiState.relationExplorer?.baseGroupId ||
    (Array.isArray(uiState.selectedGroupIds) && uiState.selectedGroupIds[0]) ||
    uiState.selectedGroupId ||
    uiState.expandedGroupId ||
    (Array.isArray(uiState.activeGroupIds) && uiState.activeGroupIds[0]) ||
    null;
    uiState.relationExplorer.open = true;
uiState.relationExplorer.active = true;

  if (!resolvedGroupId) {
    console.warn("RELATION OPEN BLOCKED: no group id");
    return;
  }

  uiState.relationExplorer.baseGroupId = resolvedGroupId;
  uiState.relationExplorer.open = true;

  if (els.relationExplorer) {
    els.relationExplorer.classList.remove("hidden");
  }

  renderRelationExplorer?.();
  recomputeRelationExplorerWeights?.();
  applyRelationExplorerFocusToGraph?.();
  saveLabState?.();
}

function openRelationEmptyModal() {
  if (!els.relationEmptyModal) return;
  uiState.relationExplorer.emptyResultModal.open = true;
  els.relationEmptyModal.classList.remove("hidden");
}

function closeRelationEmptyModalAndRestore() {
  if (!els.relationEmptyModal) return;

  const modalState = uiState.relationExplorer.emptyResultModal || {};
  const rel = uiState.relationExplorer;

  rel.edgeFilter = modalState.previousFilter || "ALL";
  rel.selectedEdgeIds = [...(modalState.previousSelectedEdgeIds || [])];

  rel.emptyResultModal.open = false;
  els.relationEmptyModal.classList.add("hidden");

  document.querySelectorAll(".relation-edge-filter-btn").forEach((x) => {
    x.classList.toggle(
      "active",
      x.dataset.relationEdgeFilter === (rel.edgeFilter || "ALL")
    );
  });

  refreshGraphState?.();
  renderRelationExplorer?.();
  saveLabState?.();
}

function clearFilterRankFocus() {
  if (!window.cy) return;

  const prevId = uiState.filterRankFocusedNodeId;
  if (!prevId) return;

  const prevNode = cy.getElementById(prevId);
  if (prevNode && prevNode.length > 0) {
    prevNode.style({
      "border-width": "",
      "border-color": ""
    });
  }

  uiState.filterRankFocusedNodeId = null;
}

function focusNodeByIdFromFilterRank(id) {
  if (!window.cy || !id) return;

  clearFilterRankFocus();

  const node = cy.getElementById(id);
  if (!node || node.length === 0) return;

  uiState.filterRankFocusedNodeId = id;

  cy.animate({
    center: { eles: node },
    duration: 220
  });

  node.style({
    "border-width": 4,
    "border-color": "#ffd54f"
  });

  setTimeout(() => {
    const current = cy.getElementById(id);
    if (!current || current.length === 0) return;
    if (uiState.filterRankFocusedNodeId !== id) return;

    current.style({
      "border-width": 6,
      "border-color": "#ff8a65"
    });

    setTimeout(() => {
      const latest = cy.getElementById(id);
      if (!latest || latest.length === 0) return;
      if (uiState.filterRankFocusedNodeId !== id) return;

      latest.style({
        "border-width": 4,
        "border-color": "#ffd54f"
      });
    }, 220);
  }, 0);
}

function openFilterRankExplorer() {
  if (!els.filterRankExplorer) return;

  els.filterRankExplorer.classList.remove("hidden");
  renderFilterRankExplorer();
  syncFilterRankToolbarActive();
}

function closeFilterRankExplorer() {
  if (!els.filterRankExplorer) return;
  els.filterRankExplorer.classList.add("hidden");
}

function scrollFilterRankExplorer(direction = 1) {
  if (!els.filterRankExplorerBody) return;
  els.filterRankExplorerBody.scrollTop += 160 * direction;
}

function makeFilterRankExplorerDraggable() {
  const explorer = document.getElementById("filter-rank-explorer");
  const head = document.getElementById("filter-rank-explorer-head");

  if (!explorer || !head) return;
  if (explorer.dataset.dragBound === "true") return;

  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  explorer.addEventListener("mousedown", () => {
    bringExplorerToFront(explorer);
  });

  head.addEventListener("mousedown", (e) => {
    if (e.target.closest("button")) return;

    isDragging = true;

    const rect = explorer.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    explorer.style.right = "auto";
    explorer.style.left = `${rect.left}px`;
    explorer.style.top = `${rect.top}px`;

    document.body.style.userSelect = "none";
  });

  window.addEventListener("mousemove", (e) => {
    if (!isDragging) return;

    const explorerWidth = explorer.offsetWidth;
    const explorerHeight = explorer.offsetHeight;

    let nextLeft = e.clientX - offsetX;
    let nextTop = e.clientY - offsetY;

    const minLeft = 8;
    const minTop = 8;
    const maxLeft = window.innerWidth - explorerWidth - 8;
    const maxTop = window.innerHeight - explorerHeight - 8;

    nextLeft = Math.max(minLeft, Math.min(nextLeft, maxLeft));
    nextTop = Math.max(minTop, Math.min(nextTop, maxTop));

    explorer.style.left = `${nextLeft}px`;
    explorer.style.top = `${nextTop}px`;
  });

  window.addEventListener("mouseup", () => {
    isDragging = false;
    document.body.style.userSelect = "";
  });

  explorer.dataset.dragBound = "true";
}

function getFilteredAllDataItems() {
  let items = collectAllDataItems();

  const wanted = String(uiState.allDataScope || "ALL").toUpperCase();
  if (wanted !== "ALL") {
    items = items.filter((item) => String(item.scope || "").toUpperCase() === wanted);
  }

  const q = String(uiState.allDataQuery || "").trim().toLowerCase();
  if (q) {
    items = items.filter((item) => {
      return buildAllDataSearchText(item).includes(q);
    });
  }

  const sortMode = uiState.allDataSort || "name";

  if (sortMode === "name") {
    items.sort((a, b) => String(a.title || "").localeCompare(String(b.title || "")));
  } else if (sortMode === "id") {
    items.sort((a, b) => String(a.refId || "").localeCompare(String(b.refId || "")));
  } else if (sortMode === "scope") {
    items.sort((a, b) => {
      const s = String(a.scope || "").localeCompare(String(b.scope || ""));
      if (s !== 0) return s;
      return String(a.title || "").localeCompare(String(b.title || ""));
    });
  } else if (sortMode === "importance") {
    items.sort((a, b) => getAllDataImportance(b) - getAllDataImportance(a));
  } else if (sortMode === "filter-grade") {
    items.sort((a, b) => {
      const ag = getAllDataFilterMetrics(a);
      const bg = getAllDataFilterMetrics(b);

      const g = bg.gradeRank - ag.gradeRank;
      if (g !== 0) return g;

      const m = bg.multiplier - ag.multiplier;
      if (m !== 0) return m;

      return String(a.title || "").localeCompare(String(b.title || ""));
    });
  } else if (sortMode === "filter-multiplier") {
    items.sort((a, b) => {
      const am = getAllDataFilterMetrics(a);
      const bm = getAllDataFilterMetrics(b);

      const m = bm.multiplier - am.multiplier;
      if (m !== 0) return m;

      const g = bm.gradeRank - am.gradeRank;
      if (g !== 0) return g;

      return String(a.title || "").localeCompare(String(b.title || ""));
    });
  } else if (sortMode === "filter-pass") {
    items.sort((a, b) => {
      const am = getAllDataFilterMetrics(a);
      const bm = getAllDataFilterMetrics(b);

      const ap = am.multiplier >= 1 ? 1 : 0;
      const bp = bm.multiplier >= 1 ? 1 : 0;

      const passDiff = bp - ap;
      if (passDiff !== 0) return passDiff;

      const m = bm.multiplier - am.multiplier;
      if (m !== 0) return m;

      return String(a.title || "").localeCompare(String(b.title || ""));
    });
  } else if (sortMode === "filter-fail") {
    items.sort((a, b) => {
      const am = getAllDataFilterMetrics(a);
      const bm = getAllDataFilterMetrics(b);

      const af = am.multiplier < 1 ? 1 : 0;
      const bf = bm.multiplier < 1 ? 1 : 0;

      const failDiff = bf - af;
      if (failDiff !== 0) return failDiff;

      const m = am.multiplier - bm.multiplier;
      if (m !== 0) return m;

      return String(a.title || "").localeCompare(String(b.title || ""));
    });
  }

  return items;
}

function renderAllDataExplorer() {
  if (!els.allDataList) return;

  const items = getFilteredAllDataItems();

  const btns = document.querySelectorAll(".all-data-filter-btn");
  btns.forEach((btn) => {
    btn.classList.toggle(
      "active",
      btn.dataset.dataScope === uiState.allDataScope
    );
  });

  if (els.allDataSearchInput) {
    els.allDataSearchInput.value = uiState.allDataQuery || "";
  }

  if (els.allDataSortSelect) {
    els.allDataSortSelect.value = uiState.allDataSort || "name";
  }

  if (!items.length) {
    els.allDataList.innerHTML = `<div class="empty-state">정의 없음</div>`;
    return;
  }

  els.allDataList.innerHTML = items
    .map((item) => {
      const isEvent = item.scope === "EVENT";
      const isSelected = (uiState.selectedEventIdsForDelete || []).includes(item.refId);

      const filterMeta = item.scope === "EVENT"
  ? getAllDataFilterMetrics(item)
  : null;

const filterMetaText = item.scope === "EVENT"
  ? ` / grade: ${filterMeta?.grade || "-"} / m: ${
      typeof filterMeta?.multiplier === "number" && filterMeta.multiplier >= 0
        ? filterMeta.multiplier.toFixed(3)
        : "-"
    }`
  : "";

      return `
        <div
          class="all-data-item${uiState.selectedAllDataId === item.id ? " active" : ""}${uiState.isEventDeleteMode && isEvent ? " delete-selectable" : ""}${isSelected ? " selected-for-delete" : ""}"
          data-all-data-id="${item.id}"
        >
          <div class="all-data-item-title">[${item.scope}] ${item.title}</div>
          <div class="all-data-item-sub">${item.sub || "-"}${filterMetaText}</div>
        </div>
      `;
    })
    .join("");

  const nodes = els.allDataList.querySelectorAll(".all-data-item");
  nodes.forEach((node) => {
    node.onclick = () => {
      const id = node.dataset.allDataId;
      const target = items.find((x) => x.id === id);
      if (!target) return;

      if (uiState.isEventDeleteMode) {
        if (target.scope === "EVENT") {
          toggleEventDeleteSelection(target.refId);
        }
        return;
      }

      uiState.selectedAllDataId = id;
      renderAllDataExplorer();
      renderAllDataDetail(target);
    };
  });
}

function enterEventDeleteModal() {
  uiState.isEventDeleteMode = true;
  uiState.selectedEventIdsForDelete = [];

  if (els.eventDeleteBar) {
    els.eventDeleteBar.classList.remove("hidden");
  }

  renderAllDataExplorer();
}

function upsertGroupEntry(group) {
  if (!group?.id) return null;
  groupStore.set(group.id, group);

  recordLog({
    type: "GROUP_UPSERT",
    scope: "GROUP",
    refId: group.id,
    summary: `[GROUP] 등록: ${group.id}`,
    payload: group
  });

  return group;
}

function upsertPatternEntry(result) {
  const pattern = result?.pattern;
  if (!pattern?.id) return null;

  if (!uiState.patternMap) uiState.patternMap = new Map();
  uiState.patternMap.set(pattern.id, result);

  recordLog({
    type: "PATTERN_UPSERT",
    scope: "PATTERN",
    refId: pattern.id,
    summary: `[PATTERN] 등록: ${pattern.id}`,
    payload: result
  });

  return result;
}

function renderAllDataSummary(item) {
  const p = item?.payload || {};

  if (item.scope === "EVENT") {
    return `
      <div><b>이름</b>: ${p.name || "-"}</div>
      <div><b>ID</b>: ${p.id || "-"}</div>
      <div><b>STAT</b>: ${p.stat || "-"}</div>
      <div><b>SENTIMENT</b>: ${p.sentiment || "-"}</div>
      <div><b>ROT</b>: ${p.variables?.rot ?? "-"}</div>
      <div><b>CAP</b>: ${p.variables?.cap ?? "-"}</div>
      <div><b>VAR</b>: ${p.variables?.var ?? "-"}</div>
      <div><b>관계 태그</b>: ${(p.relationTags || []).join(", ") || "-"}</div>
      <div><b>상태 태그</b>: ${(p.stateTags || []).join(", ") || "-"}</div>
      <div><b>메모</b>: ${p.memo || "-"}</div>
    `;
  }

  if (item.scope === "GROUP") {
    return `
      <div><b>ID</b>: ${p.id || "-"}</div>
      <div><b>중심 이벤트</b>: ${p.center || "-"}</div>
      <div><b>관계 타입</b>: ${p.edgeType || p.type || "-"}</div>
      <div><b>노드 수</b>: ${(p.nodes || []).length}</div>
      <div><b>노드</b>: ${(p.nodes || []).join(", ") || "-"}</div>
    `;
  }

  if (item.scope === "PATTERN") {
    return `
      <div><b>ID</b>: ${p.id || "-"}</div>
      <div><b>유형</b>: ${p.type || "-"}</div>
      <div><b>노드 수</b>: ${(p.nodes || []).length}</div>
      <div><b>노드</b>: ${(p.nodes || []).join(", ") || "-"}</div>
      <div><b>확률</b>: ${typeof p.probability === "number" ? p.probability.toFixed(2) : "-"}</div>
    `;
  }

  if (item.scope === "LAYER") {
    return `
      <div><b>이름</b>: ${p.name || "-"}</div>
      <div><b>MODE</b>: ${p.mode || "-"}</div>
      <div><b>GROUP ID</b>: ${p.groupId || "-"}</div>
      <div><b>노드 수</b>: ${(p.nodes || []).length}</div>
      <div><b>ROT 최소</b>: ${p.filter?.rotMin ?? "-"}</div>
      <div><b>CAP 최대</b>: ${p.filter?.capMax ?? "-"}</div>
      <div><b>VAR 최소</b>: ${p.filter?.varMin ?? "-"}</div>
      <div><b>MEMO</b>: ${p.memo || "-"}</div>
      <div><b>설명</b>: ${p.description || "-"}</div>
    `;
  }

  return `<div>-</div>`;
}

function renderAllDataDetail(item) {
  if (!els.allDataDetailBody) return;

  if (!item) {
    els.allDataDetailBody.innerHTML = `
      <div class="empty-state">정의를 선택하면 상세 정보가 표시됩니다.</div>
    `;
    return;
  }

  if (item.scope === "EVENT") {
  const evt = engine.getEvent(item.refId);
  if (!evt) {
    els.allDataDetail.innerHTML = `<div>이벤트 데이터를 찾을 수 없습니다.</div>`;
    return;
  }

  const node = window.cy ? cy.getElementById(evt.id) : null;

  const grade = node && node.length > 0 ? node.data("filterGrade") : "-";
  const multiplier = node && node.length > 0 ? node.data("filterMultiplier") : null;
  const rawMultiplier = node && node.length > 0 ? node.data("filterRawMultiplier") : null;
  const pass = node && node.length > 0 ? node.data("filterPass") : null;

  const rotFactor = node && node.length > 0 ? node.data("filterRotFactor") : null;
  const capFactor = node && node.length > 0 ? node.data("filterCapFactor") : null;
  const varFactor = node && node.length > 0 ? node.data("filterVarFactor") : null;

  const gradeColor = getFilterGradeColor(grade);

  els.allDataDetail.innerHTML = `
    <div><b>[EVENT]</b></div>
    <div>ID: ${evt.id}</div>
    <div>label: ${evt.label || "-"}</div>
    <div>ticker: ${evt.ticker || "-"}</div>
    <div>time: ${evt.time || "-"}</div>

    <hr>

    <div><b>[FILTER]</b></div>
    <div>pass: ${typeof pass === "boolean" ? (pass ? "YES" : "NO") : "-"}</div>
    <div>
      grade: <span style="color:${gradeColor}; font-weight:700;">${grade}</span>
    </div>
    <div>
  raw multiplier: ${
  typeof rawMultiplier === "number"
    ? Number(rawMultiplier).toFixed(3)
    : "-"
}
</div>

    <br>

    <div><b>[FACTOR]</b></div>
    <div>rot: ${
      typeof rotFactor === "number" ? rotFactor.toFixed(3) : "-"
    }</div>
    <div>cap: ${
      typeof capFactor === "number" ? capFactor.toFixed(3) : "-"
    }</div>
    <div>var: ${
      typeof varFactor === "number" ? varFactor.toFixed(3) : "-"
    }</div>

    <hr>

    <div><b>[RAW DATA]</b></div>
    <pre>${JSON.stringify(evt, null, 2)}</pre>
  `;
}

  const payloadText = JSON.stringify(item.payload || null, null, 2);

  els.allDataDetailBody.innerHTML = `
    <div class="all-data-meta">
      <div><b>ID</b>: ${item.id || "-"}</div>
      <div><b>SCOPE</b>: ${item.scope || "-"}</div>
      <div><b>REF</b>: ${item.refId || "-"}</div>
      <div><b>중요도</b>: ${getAllDataImportance(item)}</div>
    </div>

    <div class="all-data-section">
      <div class="all-data-section-title">SUMMARY</div>
      <div class="all-data-summary-grid">
        ${renderAllDataSummary(item)}
      </div>
    </div>

    <div class="all-data-section">
      <div class="all-data-section-title">RAW JSON</div>
      <pre class="all-data-json">${payloadText}</pre>
    </div>
  `;
  
}

function focusAllDataTarget(item) {
  if (!item) return;

  if (item.scope === "EVENT") {
    if (window.cy) {
      const node = cy.getElementById(item.refId);
      if (node && node.length > 0) {
        enterEventEditor(item.refId);
        cy.animate({
          fit: { eles: node, padding: 80 },
          duration: 250
        });
      }
    }
    return;
  }

  if (item.scope === "GROUP") {
    if (groupStore.has(item.refId)) {
      selectGroup(item.refId);
    }
    return;
  }

  if (item.scope === "PATTERN") {
    selectPattern(item.refId);
    return;
  }

  if (item.scope === "LAYER") {
    const layer = (uiState.savedLayers || []).find((l) => l.name === item.refId);
    if (layer) {
      uiState.currentLayerName = layer.name;
      uiState.currentLayerFilter = layer.filter
        ? { ...layer.filter }
        : { rotMin: null, capMax: null, varMin: null };

      refreshGraphState();
      renderLayerPanel();
      renderLayerMetaFields();
      renderSideMiniStatus();
    }
  }
}

function getCurrentAllDataEventItems() {
  return getFilteredAllDataItems().filter((item) => item.scope === "EVENT");
}

function selectAllEventsForDelete() {
  const events = uiState.events || [];
  uiState.selectedEventIdsForDelete = events.map(e => e.id);
  openEventDeleteModal();
}

function clearFilterGradeGroups() {
  const keysToDelete = [];

  groupStore.forEach((group, key) => {
    if (String(key).startsWith("FILTER-")) {
      keysToDelete.push(key);
    }
  });

  keysToDelete.forEach((key) => {
    groupStore.delete(key);
  });
}

function collectNodesByFilterGrade() {
  const buckets = new Map();

  if (!window.cy) return buckets;

  cy.nodes().forEach((node) => {
    const grade = node.data("filterGrade");
    if (!grade) return;

    if (!buckets.has(grade)) {
      buckets.set(grade, []);
    }

    buckets.get(grade).push(node.id());
  });

  return buckets;
}

function buildFilterGradeGroups() {
  if (!window.cy) return;

  clearFilterGradeGroups();

  const buckets = collectNodesByFilterGrade();

  const gradeOrder = [
    "PEAK",
    "CORE",
    "HIGH",
    "BOOST",
    "BASE",
    "NEAR",
    "WEAK",
    "FAIL",
    "DEAD",
    "DIM"
  ];

  gradeOrder.forEach((grade) => {
    const nodeIds = buckets.get(grade) || [];
    if (!nodeIds.length) return;

    const groupId = `FILTER-${grade}`;
    const center = nodeIds[0];

    groupStore.set(groupId, {
      id: groupId,
      name: `Filter ${grade}`,
      edgeType: `FILTER_${grade}`,
      center,
      nodes: [...nodeIds],
      source: "filter-grade",
      grade,
      multiplierSummary: computeFilterGroupSummary(nodeIds)
    });
  });

  renderGroupPanel?.();
  renderSideMiniStatus?.();
  renderAllDataExplorer?.();

  recordLog?.({
    type: "GROUP_CREATE",
    scope: "GROUP",
    refId: "FILTER-GROUPS",
    summary: `[GROUP] filter grade 자동 그룹 생성`,
    payload: {
      groups: [...groupStore.keys()].filter((id) => id.startsWith("FILTER-"))
    }
  });

  saveLabState?.();
}

function computeFilterGroupSummary(nodeIds = []) {
  if (!window.cy || !Array.isArray(nodeIds) || !nodeIds.length) {
    return {
      count: 0,
      avgMultiplier: 0,
      maxMultiplier: 0
    };
  }

  const values = nodeIds
    .map((id) => {
      const node = cy.getElementById(id);
      if (!node || node.length === 0) return null;

      const m = Number(node.data("filterMultiplier"));
      return Number.isFinite(m) ? m : null;
    })
    .filter((v) => v !== null);

  if (!values.length) {
    return {
      count: nodeIds.length,
      avgMultiplier: 0,
      maxMultiplier: 0
    };
  }

  const sum = values.reduce((acc, v) => acc + v, 0);
  const avg = sum / values.length;
  const max = Math.max(...values);

  return {
    count: nodeIds.length,
    avgMultiplier: Number(avg.toFixed(3)),
    maxMultiplier: Number(max.toFixed(3))
  };
}

function selectFilteredEventsForDelete() {
  const items = getFilteredAllDataItems()
    .filter(i => i.scope === "EVENT");

  uiState.selectedEventIdsForDelete = items
    .map(i => i.refId)
    .filter(Boolean);

  openEventDeleteModal();
}

function getVisiblePatternLinkWorkspaceNodeIds() {
  const plc = getPatternLinkCy();
  if (!plc) return [];

  return plc.nodes()
    .filter((node) => node.visible())
    .map((node) => node.id());
}

function buildPatternLinkWorkspaceLayerName() {
  const ws = getPatternLinkWorkspace();

  if (ws.loadedLayerName) {
    return `${ws.loadedLayerName}-workspace`;
  }

  return `PL-Workspace-${Date.now()}`;
}

function savePatternLinkWorkspaceAsLayer(customName = "") {
  const ws = getPatternLinkWorkspace();
  const visibleNodeIds = getVisiblePatternLinkWorkspaceNodeIds();

  const layerName =
    String(customName || "").trim() ||
    buildPatternLinkWorkspaceLayerName();

  if (!Array.isArray(uiState.savedLayers)) {
    uiState.savedLayers = [];
  }

  const duplicate = uiState.savedLayers.find((layer) => layer.name === layerName);
  if (duplicate) {
    alert(`이미 같은 이름의 Layer가 있습니다: ${layerName}`);
    return;
  }

  const layer = createLayerEntry({
    name: layerName,
    mode: uiState.mode || "-",
    groupId: null,
    nodes: visibleNodeIds,
    activeGroupIds: Array.isArray(ws.loadedActiveGroupIds)
      ? [...ws.loadedActiveGroupIds]
      : [],
    filter: ws.loadedLayerFilter
      ? { ...ws.loadedLayerFilter }
      : {
          rotMin: null,
          capMax: null,
          varMin: null
        },
    memo: `Pattern Link Workspace에서 저장`,
    description: `Workspace 기준 저장 Layer`,
    sourceMeta: {
  sourceType: "workspace",
  sourceIds: [],
  category: "workspace",
  subcategory: "pattern-link",
  originScope: "pattern-link",
  originPath: [],
  originTags: ["workspace"],

  majorCategoryCode: "WS",
  upperGroupCode: "P",
  groupCode: "PLK"
}

  });

  if (!layer) return;
  uiState.currentLayerName = layer.name;

renderLayerExplorerState?.();

if (typeof renderLayerMetaFields === "function") {
  renderLayerMetaFields();
}

if (typeof renderSideMiniStatus === "function") {
  renderSideMiniStatus();
}

  if (typeof renderPatternLinkLayerOptions === "function") {
    renderPatternLinkLayerOptions();
  }

  if (els.plpLayerNameInput) {
    els.plpLayerNameInput.value = layer.name;
  }

  renderPatternLinkWorkspaceStatus();
  renderPatternLinkDetail();
  renderPatternLinkCompareBox();
}

function selectAllEventsInAllData() {
  const eventItems = getCurrentAllDataEventItems();

  uiState.selectedEventIdsForDelete = eventItems
    .map((item) => item.refId)
    .filter(Boolean);

  openEventDeleteModal();
}

function selectFilteredEventsInAllData() {
  const eventItems = getCurrentAllDataEventItems();

  uiState.selectedEventIdsForDelete = eventItems
    .map((item) => item.refId)
    .filter(Boolean);

  openEventDeleteModal();
}

function clearEventDeleteSelection() {
  uiState.selectedEventIdsForDelete = [];
  openEventDeleteModal();
}

function renderEventDeleteModal() {
  openEventDeleteModal();
}

function getSavedLayerByName(layerName) {
  if (!layerName) return null;
  return (uiState.savedLayers || []).find((layer) => layer.name === layerName) || null;
}

function applyLayerToPatternLinkWorkspace(layer) {
  const plc = getPatternLinkCy();
  const ws = getPatternLinkWorkspace();
  const baseNodeIds = ws.baseNodeIds || new Set();
const baseEdgeIds = ws.baseEdgeIds || new Set();

  if (!plc || !layer) return;

  ws.loadedLayerName = layer.name || null;
  ws.loadedLayerNodes = Array.isArray(layer.nodes) ? [...layer.nodes] : [];
  ws.loadedLayerFilter = layer.filter
    ? { ...layer.filter }
    : {
        rotMin: null,
        capMax: null,
        varMin: null
      };

  ws.loadedActiveGroupIds = Array.isArray(layer.activeGroupIds)
    ? [...layer.activeGroupIds]
    : [];

  plc.nodes().forEach((node) => {
    node.show();
    node.removeClass("pl-dim-node");
  });

  plc.edges().forEach((edge) => {
    if (edge.data("type") !== "PL_TEMP") edge.show();
    edge.removeClass("pl-dim-edge");
  });

  ws.baseNodeIds = new Set(baseNodeIds);
ws.baseEdgeIds = new Set(baseEdgeIds);

  ws.hiddenNodeIds.clear();
  ws.hiddenEdgeIds.clear();
  ws.dimmedNodeIds.clear();
  ws.dimmedEdgeIds.clear();

  ws.tempEdgeIds = [];
  ws.tempEdgeChain = [];
  ws.hideMode = null;
  ws.tempEdgeMode = false;
  ws.autoFocusNodeId = null;
  ws.autoFocusEdgeId = null;

  applyAutoDimToPatternLinkWorkspace();

  renderPatternLinkWorkspaceStatus();
  renderPatternLinkDetail();
  renderPatternLinkFocusHeader();
  renderPatternLinkCompareBox();
}

function applyLayerColorHighlight(layerAIds = [], layerBIds = []) {
  const plc = getPatternLinkCy();
  if (!plc) return;

  plc.nodes().forEach((node) => {
    node.removeClass("pl-layer-a");
    node.removeClass("pl-layer-b");
  });

  plc.edges().forEach((edge) => {
    edge.removeClass("pl-layer-a");
    edge.removeClass("pl-layer-b");
  });

  const setA = new Set(layerAIds);
  const setB = new Set(layerBIds);

  plc.nodes().forEach((node) => {
    const id = node.id();
    if (setA.has(id)) node.addClass("pl-layer-a");
    if (setB.has(id)) node.addClass("pl-layer-b");
  });

  plc.edges().forEach((edge) => {
    const source = edge.source().id();
    const target = edge.target().id();

    if (setA.has(source) && setA.has(target)) edge.addClass("pl-layer-a");
    if (setB.has(source) && setB.has(target)) edge.addClass("pl-layer-b");
  });
}

function createLayerFromPattern(pattern, options = {}) {
  if (!pattern || !Array.isArray(pattern.nodes) || !pattern.nodes.length) {
    return null;
  }

  const patternId = pattern.id || `PATTERN-${Date.now()}`;

  // 🔴 그룹 추론 (핵심)
  const inferredGroupIds = Array.isArray(options.activeGroupIds)
    ? [...options.activeGroupIds]
    : Array.isArray(pattern.sourceGroupIds)
      ? [...pattern.sourceGroupIds]
      : [];

  // 🔴 자동 이름 생성
  const autoName = buildAutoLayerName({
    activeGroupIds: inferredGroupIds,
    patternId
  });

  // 🔴 노드 정리
  const nodeIds = [...new Set(pattern.nodes.filter(Boolean))];

  // 🔴 Layer 생성
  const layer = createLayerEntry({
    name: options.name || autoName,
    mode: uiState.mode || "-",
    groupId: null,
    nodes: nodeIds,
    activeGroupIds: inferredGroupIds,
    filter: {
      rotMin: null,
      capMax: null,
      varMin: null
    },
    memo: "pattern 기반 자동 생성",
    description: `PATTERN ${patternId}에서 생성된 Layer`
  });

  if (!layer) return null;

  // 🔴 로그 (선택)
  recordLog({
    type: "LAYER_FROM_PATTERN",
    scope: "LAYER",
    refId: layer.name,
    summary: `[LAYER] 패턴 기반 생성: ${layer.name}`,
    payload: {
      patternId,
      groupCount: inferredGroupIds.length,
      nodeCount: nodeIds.length
    }
  });

  return layer;
}

function evaluateGroupForNode(node, state) {
  const activeGroups = Array.isArray(uiState.activeGroupIds)
    ? uiState.activeGroupIds
    : [];

  if (!activeGroups.length) return state;

  const nodeId = node.id();

  let bestRank = "outside";
  let bestWeight = 0;
  let included = false;
  let matchedBase = false;

  const rankPriority = {
    outside: 0,
    weak: 1,
    related: 2,
    strong: 3,
    core: 4
  };

  activeGroups.forEach((gid) => {
    const group = groupStore.get(gid);
    if (!group) return;

    const centerNodeId = getGroupCenterNodeId(group);
    const memberNodeIds = getGroupMemberNodeIds(group);
    const requiredNodeIds = getGroupRequiredNodeIds(group);

    const inGroup =
      centerNodeId === nodeId ||
      memberNodeIds.includes(nodeId) ||
      requiredNodeIds.includes(nodeId);

    if (!inGroup) return;

    included = true;

    const rank =
      getGroupNodeRank(group, nodeId) ||
      (centerNodeId === nodeId
        ? "core"
        : requiredNodeIds.includes(nodeId)
          ? "strong"
          : "related");

    const weight =
      getGroupNodeWeight(group, nodeId, 0.6);

    if (rankPriority[rank] > rankPriority[bestRank]) {
      bestRank = rank;
    }

    if (weight > bestWeight) {
      bestWeight = weight;
    }

    if (isGroupBase(group)) {
      matchedBase = true;
    }
  });

  if (!included) {
    state.dim = true;
    state.emphasis -= 2.2;
    state.groupRank = "outside";
    state.groupScore = 0;
    return state;
  }

  state.groupRank = bestRank;
  state.groupScore = bestWeight;

  if (bestRank === "core") {
    state.dim = false;
    state.emphasis += 2.8;
  } else if (bestRank === "strong") {
    state.dim = false;
    state.emphasis += 2.1;
  } else if (bestRank === "related") {
    state.emphasis += 1.2;
  } else if (bestRank === "weak") {
    state.dim = false;
    state.emphasis += 0.35;
  }

  if (bestWeight < 0.2) {
    state.dim = true;
    state.emphasis -= 0.8;
  } else if (bestWeight < 0.45) {
    state.emphasis -= 0.2;
  } else if (bestWeight > 0.8) {
    state.emphasis += 0.45;
  }

  if (matchedBase) {
    state.emphasis += 0.5;
  }

  return state;
}

function toggleGroupBaseMiniExplorer(groupId) {
  const box = document.getElementById("group-base-mini-explorer");

  if (box && box.dataset.open === "true") {
    box.dataset.open = "false";
    box.classList.add("hidden");
    box.style.display = "none";
    return;
  }

  openGroupBaseMiniExplorer?.(groupId);

  const nextBox = document.getElementById("group-base-mini-explorer");
  if (nextBox) {
    nextBox.dataset.open = "true";
    nextBox.classList.remove("hidden");
    nextBox.style.display = "block";
  }
}

function setPatternLinkPageBaseGroup(groupId) {
  if (!groupId) return;
  if (!groupStore.has(groupId)) return;

  if (!uiState.patternLinkPageState) {
    uiState.patternLinkPageState = {};
  }

  uiState.patternLinkPageState.baseGroupId = groupId;

  updatePatternLinkCurrentGroupBox?.();
  renderPatternLinkFocusHeader?.();
  updateGroupExplorerStatus?.();
  decorateGroupExplorerCards?.();
  saveLabState?.();
}

function toggleGroupSelection(groupId) {
  if (!groupId) return;

  if (!Array.isArray(uiState.selectedGroupIds)) {
    uiState.selectedGroupIds = [];
  }

  const exists = uiState.selectedGroupIds.includes(groupId);

  if (exists) {
    uiState.selectedGroupIds = uiState.selectedGroupIds.filter((id) => id !== groupId);
  } else {
    uiState.selectedGroupIds.push(groupId);
  }

  uiState.selectedGroupId = uiState.selectedGroupIds[0] || null;
  uiState.selectedGroup = uiState.selectedGroupId
    ? groupStore.get(uiState.selectedGroupId) || null
    : null;

  renderGroupPanel();
  renderFocusHeader?.();
  renderDetailPanel?.();
}

function updateGroupExplorerActionUI() {
  const selectedIds = Array.isArray(uiState.selectedGroupIds)
    ? uiState.selectedGroupIds
    : [];

  const fallbackId =
    selectedIds[0] ||
    uiState.selectedGroupId ||
    uiState.expandedGroupId ||
    (Array.isArray(uiState.activeGroupIds) ? uiState.activeGroupIds[0] : null) ||
    null;

  const hasSelection = !!fallbackId;

  if (els.groupActivateBtn) {
    els.groupActivateBtn.disabled = !hasSelection;
  }

  if (els.groupOpenExclusiveBtn) {
    els.groupOpenExclusiveBtn.disabled = !hasSelection;
  }

  if (els.groupPromoteMergeBtn) {
    els.groupPromoteMergeBtn.disabled = !hasSelection;
  }
}
function setGroupActiveImmediate(groupId) {
  if (!groupId) return;

  uiState.activeGroupIds = [groupId];

  const group = groupStore.get(groupId);
  uiState.selectedGroupId = groupId;
  uiState.selectedGroupIds = [groupId];
  uiState.selectedGroup = group || null;
  uiState.expandedGroupId = groupId;
  uiState.focusGroupId = groupId;

  groupStore.forEach((g, id) => {
    if (!g) return;
    if (!g.status) g.status = {};
    g.status.isActive = id === groupId;
    g.status.isSelected = id === groupId;
  });

  if (uiState.page === "pattern-link") {
    applyActiveGroupsToPatternLinkPage?.();
    renderPatternLinkPanel?.();
    renderPatternLinkDetail?.();
    renderPatternLinkFocusHeader?.();
    saveLabState?.();
    return;
  }

  ensureGraphPageVisible?.();
  refreshGraphState?.();
  renderGroupPanel?.();
  renderFocusHeader?.();
  renderDetailPanel?.();
  saveLabState?.();
}

function toggleGroupActiveImmediate(groupId) {
  if (!groupId) return;

  if (!Array.isArray(uiState.activeGroupIds)) {
    uiState.activeGroupIds = [];
  }

  const activeSet = new Set(uiState.activeGroupIds);

  if (activeSet.has(groupId)) {
    activeSet.delete(groupId);
  } else {
    activeSet.add(groupId);
  }

  uiState.activeGroupIds = [...activeSet];

  if (!Array.isArray(uiState.selectedGroupIds)) {
    uiState.selectedGroupIds = [];
  }

  const selectedSet = new Set(uiState.selectedGroupIds);
  if (selectedSet.has(groupId)) {
    selectedSet.delete(groupId);
  } else {
    selectedSet.add(groupId);
  }

  uiState.selectedGroupIds = [...selectedSet];
  uiState.selectedGroupId = uiState.selectedGroupIds[0] || null;
  uiState.selectedGroup = uiState.selectedGroupId
    ? groupStore.get(uiState.selectedGroupId) || null
    : null;

  uiState.focusGroupId = uiState.selectedGroupId || null;

  groupStore.forEach((g, id) => {
    if (!g) return;
    if (!g.status) g.status = {};
    g.status.isActive = uiState.activeGroupIds.includes(id);
    g.status.isSelected = uiState.selectedGroupIds.includes(id);
  });

  if (uiState.page === "pattern-link") {
    applyActiveGroupsToPatternLinkPage?.();
    renderPatternLinkPanel?.();
    renderPatternLinkDetail?.();
    renderPatternLinkFocusHeader?.();
    saveLabState?.();
    return;
  }

  ensureGraphPageVisible?.();
  refreshGraphState?.();
  renderGroupPanel?.();
  renderFocusHeader?.();
  renderDetailPanel?.();
  saveLabState?.();
}

function clearGroupExplorerPreview() {
  const target = uiState.groupExplorerContext?.target || "main";

  if (target === "patternLinkPage") {
    if (!uiState.patternLinkPageState) {
      uiState.patternLinkPageState = {};
    }
    uiState.patternLinkPageState.previewGroupIds = [];
  } else {
    uiState.previewGroupIds = [];
  }

  updateGroupExplorerStatus?.();
  decorateGroupExplorerCards?.();
  saveLabState?.();
}

function clearGroupExplorerActiveGroups() {
  const target = uiState.groupExplorerContext?.target || "main";

  if (target === "patternLinkPage") {
    if (!uiState.patternLinkPageState) {
      uiState.patternLinkPageState = {};
    }

    uiState.patternLinkPageState.activeGroupIds = [];

    applyActiveGroupsToPatternLinkPage?.();

    const plc = getPatternLinkCy?.() || window.patternLinkCy;
    if (plc) {
      applyPatternLinkDimStyles?.(plc);
    }
  } else {
    uiState.activeGroupIds = [];
    uiState.selectedGroupIds = [];
    uiState.selectedGroupId = null;
    uiState.selectedGroup = null;
    uiState.focusGroupId = null;

    groupStore.forEach((g) => {
      if (!g) return;
      if (!g.status) g.status = {};
      g.status.isActive = false;
      g.status.isSelected = false;
    });

    refreshGraphState?.();
    renderFocusHeader?.();
    renderDetailPanel?.();
  }

  updateGroupExplorerStatus?.();
  decorateGroupExplorerCards?.();
  renderGroupPanel?.();
  saveLabState?.();
}

function clearGroupExplorerBase() {
  const target = uiState.groupExplorerContext?.target || "main";

  if (target === "patternLinkPage") {
    if (uiState.patternLinkPageState) {
      uiState.patternLinkPageState.baseGroupId = null;
    }
  } else {
    uiState.baseGroupId = null;

    groupStore.forEach((g) => {
      if (g?.status) {
        g.status.isBase = false;
      }
    });
  }

  const box = document.getElementById("group-base-mini-explorer");
  if (box) {
    box.dataset.open = "false";
    box.classList.add("hidden");
    box.style.display = "none";
  }

  updateGroupExplorerStatus?.();
  decorateGroupExplorerCards?.();
  renderGroupPanel?.();
  saveLabState?.();
}

function clearGroupActiveImmediate(groupId) {
  if (!groupId) return;

  uiState.activeGroupIds = (uiState.activeGroupIds || []).filter((id) => id !== groupId);

  if (uiState.selectedGroupId === groupId) {
    uiState.selectedGroupId = null;
    uiState.selectedGroup = null;
  }

  if (Array.isArray(uiState.selectedGroupIds)) {
    uiState.selectedGroupIds = uiState.selectedGroupIds.filter((id) => id !== groupId);
  }

  if (uiState.expandedGroupId === groupId) {
    uiState.expandedGroupId = null;
  }

  if (uiState.baseGroupId === groupId) {
    uiState.baseGroupId = null;
  }

  if (uiState.focusGroupId === groupId) {
    uiState.focusGroupId = null;
  }

  const group = groupStore.get(groupId);
  if (group?.status) {
    group.status.isActive = false;
    group.status.isSelected = false;
  }

  if (uiState.page === "pattern-link") {
    applyActiveGroupsToPatternLinkPage?.();
    renderPatternLinkPanel?.();
    renderPatternLinkDetail?.();
    renderPatternLinkFocusHeader?.();
    saveLabState?.();
    return;
  }

  ensureGraphPageVisible?.();
  refreshGraphState?.();
  renderGroupPanel?.();
  renderFocusHeader?.();
  renderDetailPanel?.();
  saveLabState?.();
}

function toggleGroupActive(groupId) {
  if (!groupId) return;

  if (!Array.isArray(uiState.activeGroupIds)) {
    uiState.activeGroupIds = [];
  }

  const exists = uiState.activeGroupIds.includes(groupId);

  if (exists) {
    uiState.activeGroupIds = uiState.activeGroupIds.filter(id => id !== groupId);
  } else {
    uiState.activeGroupIds.push(groupId);
  }

  refreshGraphState();
}

function openGroupExclusive(groupId) {
  if (!groupId) return;

  uiState.activeGroupIds = [groupId];
  uiState.selectedGroupId = groupId;
  uiState.selectedGroupIds = [groupId];
  uiState.selectedGroup = groupStore.get(groupId) || null;
  uiState.expandedGroupId = groupId;
  uiState.focusGroupId = groupId;

  groupStore.forEach((g, id) => {
    if (!g) return;
    if (!g.status) g.status = {};
    g.status.isActive = id === groupId;
    g.status.isSelected = id === groupId;
  });

  refreshGraphState?.();
}

function inferGroupIdsFromPattern(pattern) {
  if (!pattern?.nodes?.length) return [];

  const patternNodeSet = new Set(pattern.nodes);
  const matchedGroupIds = [];

  groupStore.forEach((group, groupId) => {
    const groupNodeSet = new Set([
      group.center,
      ...(group.nodes || [])
    ].filter(Boolean));

    let overlap = 0;
    groupNodeSet.forEach((id) => {
      if (patternNodeSet.has(id)) overlap += 1;
    });

    if (overlap > 0) {
      matchedGroupIds.push(groupId);
    }
  });

  return matchedGroupIds;
}

function renderLayerMergeExplorer() {
  if (!els.layerMergeExplorerList) return;

  const layers = (uiState.savedLayers || []).filter((layer) => !!layer);

  if (!layers.length) {
    els.layerMergeExplorerList.innerHTML = `<div class="empty-state">레이어 없음</div>`;
    return;
  }

  const selected = new Set(uiState.layerMergeExplorer?.selectedLayerNames || []);

  els.layerMergeExplorerList.innerHTML = layers.map((layer) => {
    const isSelected = selected.has(layer.name);
    const nodeCount = Array.isArray(layer.nodes) ? layer.nodes.length : 0;

    return `
      <div class="layer-item ${isSelected ? "selected-for-delete" : ""}" data-layer-merge-name="${layer.name}">
        <div class="layer-item-title">${layer.name}</div>
        <div class="layer-item-sub">mode: ${layer.mode || "-"} / nodes: ${nodeCount}</div>
      </div>
    `;
  }).join("");

  els.layerMergeExplorerList.querySelectorAll("[data-layer-merge-name]").forEach((item) => {
    item.onclick = () => {
      const name = item.dataset.layerMergeName;
      if (!name) return;

      const list = uiState.layerMergeExplorer.selectedLayerNames || [];
      const exists = list.includes(name);

      uiState.layerMergeExplorer.selectedLayerNames = exists
        ? list.filter((x) => x !== name)
        : [...list, name];

      renderLayerMergeExplorer();
    };
  });
}

function openLayerMergeExplorer() {
  uiState.layerMergeExplorer.open = true;
  uiState.layerMergeExplorer.selectedLayerNames = [];

  if (els.layerMergeExplorer) {
    els.layerMergeExplorer.classList.remove("hidden");
  }

  renderLayerMergeExplorer();
}

function closeLayerMergeExplorer() {
  uiState.layerMergeExplorer.open = false;
  uiState.layerMergeExplorer.selectedLayerNames = [];

  if (els.layerMergeExplorer) {
    els.layerMergeExplorer.classList.add("hidden");
  }
}

function confirmLayerMergePromotion() {
  const selected = uiState.layerMergeExplorer?.selectedLayerNames || [];
  if (!selected.length) return;

  const ok = window.confirm("통합 승격하겠습니까? (이 작업은 취소할 수 없습니다.)");
  if (!ok) return;

  uiState.selectedLayerNames = [...selected];
  promoteLayersToSinglePattern?.();

  renderLayerSystemState?.();
  closeLayerMergeExplorer?.();
  saveLabState?.();
}

function renderLayerPatternPreview(mode = null) {
  if (!els.layerPatternPreview) return;

  if (mode) {
    uiState.layerToPatternExplorerMode = mode === "custom" ? "custom" : uiState.layerPatternExplorerMode;
  }

  const previewMode =
    mode ||
    (uiState.layerPatternCustomView && !els.layerPatternCustomView.classList.contains("hidden")
      ? "custom"
      : "all");

  const preview = buildLayerPatternPreviewData(previewMode);
  if (!preview) {
    els.layerPatternPreview.innerHTML = `<div class="empty-state">Layer 없음</div>`;
    return;
  }

  els.layerPatternPreview.innerHTML = `
    <div class="pattern-layer-preview-title">PREVIEW</div>
    <div>현재 Layer 이름: ${preview.layerName}</div>
    <div>노드 수: ${preview.nodeCount}</div>
    <div>엣지 수: ${preview.edgeCount}</div>
    <div>대표 노드: ${preview.sample.join(", ") || "-"}</div>
  `;

  highlightPreview(preview.nodeIds);
  updateLayerPatternActionUI();
}

function buildLayerPatternPreviewData(mode = "all") {
  const layer = getCurrentLayerObject();
  if (!layer) return null;

  let nodeIds = [...new Set(layer.nodes || [])];

  if (mode === "filtered") {
    const filter = layer.filter || uiState.currentLayerFilter || {};
    nodeIds = getLayerNodeIdsByFilter(layer, filter);
  }

  if (mode === "custom") {
    nodeIds = [...new Set(layer.nodes || [])];
  }

  const edgeCount = window.cy
    ? cy.edges().filter((e) => {
        const source = e.data("source");
        const target = e.data("target");
        return nodeIds.includes(source) && nodeIds.includes(target);
      }).length
    : 0;

  return {
    mode,
    layerName: layer.name || "-",
    nodeIds,
    nodeCount: nodeIds.length,
    edgeCount,
    sample: nodeIds.slice(0, 5)
  };
}

function getLayerNodeIdsByFilter(layer, filter = {}) {
  if (!layer?.nodes?.length) return [];

  const ids = [...new Set(layer.nodes.filter(Boolean))];

  if (!window.cy) return ids;

  return ids.filter((id) => {
    const node = cy.getElementById(id);
    if (!node || node.length === 0) return false;

    const rot = Number(node.data("rot"));
    const cap = Number(node.data("cap"));
    const vari = Number(node.data("var"));

    if (filter.rotMin !== null && filter.rotMin !== undefined && filter.rotMin !== "" && !(rot >= Number(filter.rotMin))) return false;
    if (filter.capMax !== null && filter.capMax !== undefined && filter.capMax !== "" && !(cap <= Number(filter.capMax))) return false;
    if (filter.varMin !== null && filter.varMin !== undefined && filter.varMin !== "" && !(vari >= Number(filter.varMin))) return false;

    return true;
  });
}

function applyRelationExplorerFocusToGraph() {
  console.log("REL APPLY RUN", structuredClone(uiState.relationExplorer));

  if (!window.cy) return;

  const rel = getRelationExplorerState();
  if (!rel.baseGroupId) return;

  const {
    visibleEdges,
    focusNodeWeights,
    focusEdgeWeights
  } = getRelationExplorerDerived();

  const visibleEdgeIdSet = new Set(visibleEdges.map((edgeInfo) => edgeInfo.id));
  const activeNodeIdSet = new Set(
    Object.keys(focusNodeWeights).filter((id) => Number(focusNodeWeights[id] || 0) > 0)
  );
  const activeEdgeIdSet = new Set(
    Object.keys(focusEdgeWeights).filter((id) => Number(focusEdgeWeights[id] || 0) > 0)
  );

  const hasSelectedFocus = activeNodeIdSet.size > 0 || activeEdgeIdSet.size > 0;
  const hasPreviewFocus = visibleEdgeIdSet.size > 0;

  cy.nodes().forEach((node) => {
    if (!hasSelectedFocus && !hasPreviewFocus) {
      node.removeStyle("opacity");
      node.removeStyle("border-width");
      node.removeStyle("border-color");
      node.removeStyle("background-color");
      return;
    }

    const nodeId = node.id();
    const weight = Number(focusNodeWeights[nodeId] || 0);

    // 1순위: 선택된 edge 기준 강강조
    if (weight > 0) {
      let color = "#7cc4ff";
      let borderWidth = 3;
      let opacity = 0.95;

      if (weight >= 4) {
        color = "#ffd54f";
        borderWidth = 5;
        opacity = 1;
      } else if (weight >= 3) {
        color = "#ff6b6b";
        borderWidth = 4;
        opacity = 0.98;
      } else if (weight >= 2) {
        color = "#b197fc";
        borderWidth = 4;
        opacity = 0.96;
      }

      node.style("opacity", opacity);
      node.style("border-width", borderWidth);
      node.style("border-color", color);
      node.style("background-color", color);
      return;
    }

    // 2순위: 현재 filter에 부합하는 related edge preview
    const isPreviewNode = visibleEdges.some(
      (edgeInfo) => edgeInfo.sourceId === nodeId || edgeInfo.targetId === nodeId
    );

    if (isPreviewNode) {
      node.style("opacity", 0.22);
      node.style("border-width", 2);
      node.style("border-color", "#5c677d");
      node.removeStyle("background-color");
      return;
    }

    // 나머지 dim
    node.style("opacity", 0.06);
    node.style("border-width", 1);
    node.removeStyle("border-color");
    node.removeStyle("background-color");
  });

  cy.edges().forEach((edge) => {
    if (!hasSelectedFocus && !hasPreviewFocus) {
      edge.removeStyle("opacity");
      edge.removeStyle("width");
      edge.removeStyle("line-color");
      edge.removeStyle("target-arrow-color");
      return;
    }

    const edgeId = edge.id();
    const weight = Number(focusEdgeWeights[edgeId] || 0);

    // 1순위: 선택된 edge
    if (weight > 0) {
      let color = "#7cc4ff";
      let width = 2.4;
      let opacity = 0.7;

      if (weight >= 4) {
        color = "#ffd54f";
        width = 4;
        opacity = 1;
      } else if (weight >= 3) {
        color = "#ff6b6b";
        width = 3.2;
        opacity = 0.9;
      } else if (weight >= 2) {
        color = "#b197fc";
        width = 2.8;
        opacity = 0.8;
      }

      edge.style("opacity", opacity);
      edge.style("width", width);
      edge.style("line-color", color);
      edge.style("target-arrow-color", color);
      return;
    }

    // 2순위: 필터에 맞는 related edge preview
    if (visibleEdgeIdSet.has(edgeId)) {
      edge.style("opacity", 0.16);
      edge.style("width", 1.4);
      edge.style("line-color", "#4b5563");
      edge.style("target-arrow-color", "#4b5563");
      return;
    }

    // 나머지 dim
    edge.style("opacity", 0.03);
    edge.style("width", 1);
    edge.style("line-color", "#2f3440");
    edge.style("target-arrow-color", "#2f3440");
  });

  console.log("REL APPLY DONE");
}

function resetRelationExplorerFocus() {
  const rel = uiState.relationExplorer;
  if (!rel) return;

  rel.selectedEdgeIds = [];
  rel.edgeFilter = "ALL";
  rel.history = [];
  rel.emptyResultModal = {
    open: false,
    previousFilter: "ALL",
    previousSelectedEdgeIds: []
  };

  document.querySelectorAll(".relation-edge-filter-btn").forEach((x) => {
    x.classList.toggle(
      "active",
      x.dataset.relationEdgeFilter === "ALL"
    );
  });

  refreshGraphState?.();
  renderRelationExplorer?.();
  saveLabState?.();
}

function getRelationExplorerPreviewSets() {
  const { visibleEdges } = getRelationExplorerDerived();

  const nodeSet = new Set();
  const edgeSet = new Set();

  visibleEdges.forEach((edgeInfo) => {
    edgeSet.add(edgeInfo.id);
    if (edgeInfo.sourceId) nodeSet.add(edgeInfo.sourceId);
    if (edgeInfo.targetId) nodeSet.add(edgeInfo.targetId);
  });

  return {
    nodeIds: [...nodeSet],
    edgeIds: [...edgeSet]
  };
}

function stepBackRelationExplorerFocus() {
  const rel = uiState.relationExplorer || {};
  const history = rel.history || [];
  if (!history.length) return;

  const prev = history.pop();
  if (!prev) return;

  rel.selectedEdgeIds = [...(prev.selectedEdgeIds || [])];
  rel.edgeFilter = prev.edgeFilter || "ALL";

  document.querySelectorAll(".relation-edge-filter-btn").forEach((x) => {
    x.classList.toggle(
      "active",
      x.dataset.relationEdgeFilter === (rel.edgeFilter || "ALL")
    );
  });

  refreshGraphState?.();
  renderRelationExplorer?.();
  saveLabState?.();
}

function toggleRelationEdgeFocus(edgeId) {
  if (!window.cy || !edgeId) return;

  const edge = cy.getElementById(edgeId);
  if (!edge || edge.length === 0) return;

  const rel = uiState.relationExplorer;
  if (!rel) return;

  rel.history = Array.isArray(rel.history) ? rel.history : [];
  rel.history.push({
    selectedEdgeIds: [...(rel.selectedEdgeIds || [])],
    edgeFilter: rel.edgeFilter || "ALL"
  });

  rel.selectedEdgeIds = Array.isArray(rel.selectedEdgeIds)
    ? [...rel.selectedEdgeIds]
    : [];

  const exists = rel.selectedEdgeIds.includes(edgeId);

  if (exists) {
    rel.selectedEdgeIds = rel.selectedEdgeIds.filter((id) => id !== edgeId);
  } else {
    rel.selectedEdgeIds.push(edgeId);
  }

  console.log("TOGGLE BEFORE SAVE", {
  edgeId,
  selectedEdgeIds: [...(uiState.relationExplorer?.selectedEdgeIds || [])],
  edgeFilter: uiState.relationExplorer?.edgeFilter,
  historyLen: uiState.relationExplorer?.history?.length || 0
});

  refreshGraphState?.();
  renderRelationExplorer?.();
  saveLabState?.();
}

function getPreviewFromPattern(pattern) {
  const nodeIds = [...new Set(pattern.nodes)];
  const edgeCount = cy.edges().filter(e =>
    nodeIds.includes(e.data("source")) &&
    nodeIds.includes(e.data("target"))
  ).length;

  return {
    nodeCount: nodeIds.length,
    edgeCount,
    sample: nodeIds.slice(0, 5)
  };
}

function registerPatternFromNodeIds(nodeIds, options = {}) {
  const baseLayer = getCurrentLayerObject();
  if (!baseLayer) return null;

  const tempLayer = {
    ...baseLayer,
    nodes: [...new Set((nodeIds || []).filter(Boolean))]
  };

  return registerPatternFromLayer(tempLayer, options);
}

function getCurrentLayerNodeIds() {
  const layer = getCurrentLayerObject();
  if (!layer) return [];
  return [...new Set(layer.nodes || [])];
}

function getFilteredLayerNodeIds() {
  const layer = getCurrentLayerObject();
  if (!layer) return [];

  const ids = [...new Set(layer.nodes || [])];
  const filter = uiState.currentLayerFilter || {};

  return ids.filter((id) => {
    const node = cy.getElementById(id);
    if (!node || node.length === 0) return false;

    const rot = Number(node.data("rot"));
    const cap = Number(node.data("cap"));
    const vari = Number(node.data("var"));

    if (filter.rotMin !== null && !(rot >= filter.rotMin)) return false;
    if (filter.capMax !== null && !(cap <= filter.capMax)) return false;
    if (filter.varMin !== null && !(vari >= filter.varMin)) return false;

    return true;
  });
}

function getNodeConnectionCount(nodeId) {
  if (!window.cy) return 0;

  const node = cy.getElementById(nodeId);
  if (!node || node.length === 0) return 0;

  return node.connectedEdges().length;
}

function getPreviewNodeIdsFromPattern(pattern, mode = "all") {
  if (!pattern?.nodes?.length) return [];

  const base = [...new Set(pattern.nodes.filter(Boolean))];

  if (mode === "all") {
    return base;
  }

  if (mode === "dense") {
    const ranked = base
      .map((id) => ({
        id,
        degree: getNodeConnectionCount(id)
      }))
      .sort((a, b) => b.degree - a.degree);

    return ranked
      .slice(0, Math.max(2, Math.ceil(ranked.length * 0.5)))
      .map((x) => x.id);
  }

  return base;
}

function buildPatternLayerPreview(pattern, mode = "all") {
  const nodeIds = getPreviewNodeIdsFromPattern(pattern, mode);

  const edgeCount = window.cy
    ? cy.edges().filter((e) =>
        nodeIds.includes(e.data("source")) &&
        nodeIds.includes(e.data("target"))
      ).length
    : 0;

  return {
    mode,
    nodeIds,
    nodeCount: nodeIds.length,
    edgeCount,
    sample: nodeIds.slice(0, 5)
  };
}

function getPatternLinkLayerBaseNodeIds() {
  const ws = getPatternLinkWorkspace();
  const layer = ws.loadedLayer;
  const nodeIds = new Set();

  if (!layer) return nodeIds;

  (layer.nodes || []).forEach((id) => {
    if (id) nodeIds.add(id);
  });

  return nodeIds;
}

function getPatternLinkLayerBaseEdgeIds() {
  const plc = getPatternLinkCy();
  const nodeIds = getPatternLinkLayerBaseNodeIds();
  const edgeIds = new Set();

  if (!plc || !nodeIds.size) return edgeIds;

  plc.edges().forEach((edge) => {
    const source = edge.data("source");
    const target = edge.data("target");
    if (nodeIds.has(source) && nodeIds.has(target)) {
      edgeIds.add(edge.id());
    }
  });

  return edgeIds;
}

function getPatternLinkWorkspace() {
  if (!uiState.patternLinkWorkspace) {
    uiState.patternLinkWorkspace = {};
  }

  const ws = uiState.patternLinkWorkspace;

  if (!(ws.hiddenNodeIds instanceof Set)) ws.hiddenNodeIds = new Set();
  if (!(ws.hiddenEdgeIds instanceof Set)) ws.hiddenEdgeIds = new Set();
  if (!(ws.dimmedNodeIds instanceof Set)) ws.dimmedNodeIds = new Set();
  if (!(ws.dimmedEdgeIds instanceof Set)) ws.dimmedEdgeIds = new Set();

  if (!Array.isArray(ws.tempEdgeIds)) ws.tempEdgeIds = [];
  if (!Array.isArray(ws.tempEdgeChain)) ws.tempEdgeChain = [];

  if (!Array.isArray(ws.loadedLayerNodes)) ws.loadedLayerNodes = [];
  if (!Array.isArray(ws.loadedActiveGroupIds)) ws.loadedActiveGroupIds = [];

  if (!ws.loadedLayerFilter) {
    ws.loadedLayerFilter = {
      rotMin: null,
      capMax: null,
      varMin: null
    };
  }

  if (typeof ws.active !== "boolean") ws.active = false;
  if (typeof ws.hideMode === "undefined") ws.hideMode = null;
  if (typeof ws.tempEdgeMode !== "boolean") ws.tempEdgeMode = false;
  if (typeof ws.dimMode !== "boolean") ws.dimMode = false;
  if (typeof ws.loadedLayerName === "undefined") ws.loadedLayerName = null;
  if (typeof ws.compareSource === "undefined") ws.compareSource = "layer";
  if (typeof ws.autoFocusNodeId === "undefined") ws.autoFocusNodeId = null;
if (typeof ws.autoFocusEdgeId === "undefined") ws.autoFocusEdgeId = null;
if (typeof ws.dimStrength !== "number") ws.dimStrength = 0.08;
if (typeof ws.tempEdgeEditorEdgeId === "undefined") ws.tempEdgeEditorEdgeId = null;

  return ws;
}

function getPatternLinkCy() {
  return window.patternLinkCy || null;
}

function getPatternLinkTempEdgeEditor() {
  return document.getElementById("pattern-link-temp-edge-editor");
}

function closePatternLinkTempEdgeEditor() {
  const ws = getPatternLinkWorkspace();
  ws.tempEdgeEditorEdgeId = null;

  const editor = getPatternLinkTempEdgeEditor();
  if (editor) {
    editor.remove();
  }
}

function updatePatternLinkTempEdgeRelation(edgeId, relationTag) {
  const plc = getPatternLinkCy();
  if (!plc || !edgeId) return;

  const edge = plc.getElementById(edgeId);
  if (!edge || edge.length === 0) return;

  edge.data({
    label: relationTag,
    relationTag
  });

  const mainCy = window.cy;
  if (mainCy) {
    const mainEdge = mainCy.getElementById(edgeId);
    if (mainEdge && mainEdge.length > 0) {
      mainEdge.data({
        label: relationTag,
        relationTag
      });
    }
  }

  renderPatternLinkDetail();
  renderPatternLinkWorkspaceStatus();
}

function updateMainEdgeRelation(edgeId, relationTag) {
  const mainCy = window.cy;
  if (!mainCy || !edgeId) return;

  const edge = mainCy.getElementById(edgeId);
  if (!edge || edge.length === 0) return;

  edge.data({
    label: relationTag,
    relationTag
  });

  saveLabState?.();
}

function deleteMainTempEdge(edgeId) {
  const mainCy = window.cy;
  if (!mainCy || !edgeId) return;

  const edge = mainCy.getElementById(edgeId);
  if (edge && edge.length > 0) {
    edge.remove();
  }

  const editor = document.getElementById("main-edge-relation-editor");
  if (editor) editor.remove();

  if (typeof saveLabState === "function") {
    saveLabState();
  }
}

function makeMainEdgeRelationEditorDraggable(editor) {
  if (!editor) return;
  if (editor.dataset.dragBound === "true") return;

  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  const head = editor.querySelector(".main-edge-relation-editor-head");
  if (!head) return;

  editor.addEventListener("mousedown", () => {
    bringExplorerToFront?.(editor);
  });

  head.addEventListener("mousedown", (e) => {
    if (e.target.closest("button")) return;

    isDragging = true;

    const rect = editor.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    editor.style.left = `${rect.left}px`;
    editor.style.top = `${rect.top}px`;
    editor.style.transform = "none";

    document.body.style.userSelect = "none";
  });

  window.addEventListener("mousemove", (e) => {
    if (!isDragging) return;

    const editorWidth = editor.offsetWidth;
    const editorHeight = editor.offsetHeight;

    let nextLeft = e.clientX - offsetX;
    let nextTop = e.clientY - offsetY;

    const minLeft = 8;
    const minTop = 8;
    const maxLeft = window.innerWidth - editorWidth - 8;
    const maxTop = window.innerHeight - editorHeight - 8;

    nextLeft = Math.max(minLeft, Math.min(nextLeft, maxLeft));
    nextTop = Math.max(minTop, Math.min(nextTop, maxTop));

    editor.style.left = `${nextLeft}px`;
    editor.style.top = `${nextTop}px`;
  });

  window.addEventListener("mouseup", () => {
    isDragging = false;
    document.body.style.userSelect = "";
  });

  editor.dataset.dragBound = "true";
}

function openMainEdgeRelationEditor(edge) {
  if (!edge || edge.length === 0) return;

  const old = document.getElementById("main-edge-relation-editor");
  if (old) old.remove();

  const edgeId = edge.id();
  const sourceId = edge.data("source") || "-";
  const targetId = edge.data("target") || "-";
  const currentTag = edge.data("relationTag") || edge.data("label") || "CAUSE";

  const rendered = edge.renderedMidpoint ? edge.renderedMidpoint() : edge.midpoint();
  const cyRect = cy.container().getBoundingClientRect();

  const left = cyRect.left + rendered.x;
  const top = cyRect.top + rendered.y - 18;

  const editor = document.createElement("div");
  editor.id = "main-edge-relation-editor";
  editor.style.position = "fixed";
  editor.style.left = `${left}px`;
  editor.style.top = `${top}px`;
  editor.style.transform = "translate(-50%, -100%)";
  editor.style.zIndex = "9999";
  editor.style.minWidth = "220px";
  editor.style.padding = "10px";
  editor.style.background = "rgba(17,18,22,0.98)";
  editor.style.border = "1px solid #3a3f4b";
  editor.style.borderRadius = "12px";
  editor.style.boxShadow = "0 10px 28px rgba(0,0,0,0.32)";
  editor.style.color = "#fff";
  editor.style.display = "flex";
  editor.style.flexDirection = "column";
  editor.style.gap = "8px";

  const head = document.createElement("div");
  head.className = "main-edge-relation-editor-head";
  head.style.display = "flex";
  head.style.justifyContent = "space-between";
  head.style.alignItems = "center";
  head.style.cursor = "move";
  head.innerHTML = `<div style="font-size:12px;font-weight:700;">EDGE RELATION</div>`;

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.textContent = "×";
  closeBtn.style.border = "none";
  closeBtn.style.background = "transparent";
  closeBtn.style.color = "#c9ced8";
  closeBtn.style.fontSize = "16px";
  closeBtn.style.cursor = "pointer";
  closeBtn.onclick = () => editor.remove();
  head.appendChild(closeBtn);

const info = document.createElement("div");
info.style.fontSize = "12px";
info.style.lineHeight = "1.45";

const isSaved = !edge.id().startsWith("temp-");

info.innerHTML = `
  <div><b>EDGE</b>: ${sourceId} → ${targetId}</div>
  <div><b>RELATION</b>: <span style="color:#ffd43b;">${currentTag}</span></div>
  <div><b>STATE</b>: 
    <span style="color:${isSaved ? "#69db7c" : "#ffa94d"};">
      ${isSaved ? "SAVED" : "TEMP"}
    </span>
  </div>
`;

  const row = document.createElement("div");
  row.style.display = "flex";
  row.style.gap = "6px";
  row.style.flexWrap = "wrap";

  ["CAUSE", "FOLLOWUP", "UNKNOWN"].forEach((tag) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = tag;
    btn.style.padding = "5px 9px";
    btn.style.borderRadius = "8px";
    btn.style.border = "1px solid #4b5563";
    btn.style.background = currentTag === tag ? "#2f6fed" : "#1f2430";
    btn.style.color = "#fff";
    btn.style.cursor = "pointer";
    btn.style.fontSize = "12px";

    btn.onclick = () => {
      updateMainEdgeRelation(edgeId, tag);
      editor.remove();
      openMainEdgeRelationEditor(window.cy.getElementById(edgeId));
    };

    row.appendChild(btn);
  });

  const actionRow = document.createElement("div");
  actionRow.style.display = "flex";
  actionRow.style.justifyContent = "flex-end";
  actionRow.style.gap = "6px";

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.textContent = "DELETE";
  deleteBtn.style.padding = "5px 9px";
  deleteBtn.style.borderRadius = "8px";
  deleteBtn.style.border = "1px solid #7a2f2f";
  deleteBtn.style.background = "#3a1f1f";
  deleteBtn.style.color = "#ffd7d7";
  deleteBtn.style.cursor = "pointer";
  deleteBtn.style.fontSize = "12px";

  deleteBtn.onclick = () => {
    deleteMainTempEdge(edgeId);
  };

  actionRow.appendChild(deleteBtn);

  editor.appendChild(head);
  editor.appendChild(info);
  editor.appendChild(row);
  editor.appendChild(actionRow);

  document.body.appendChild(editor);

  makeMainEdgeRelationEditorDraggable(editor);
}

function deletePatternLinkTempEdge(edgeId) {
  const plc = getPatternLinkCy();
  const ws = getPatternLinkWorkspace();
  if (!plc || !edgeId) return;

  const edge = plc.getElementById(edgeId);
  if (edge && edge.length > 0) {
    edge.remove();
  }

  if (Array.isArray(ws.tempEdgeIds)) {
    ws.tempEdgeIds = ws.tempEdgeIds.filter((id) => id !== edgeId);
  }

  if (ws.tempEdgeEditorEdgeId === edgeId) {
    ws.tempEdgeEditorEdgeId = null;
  }

  closePatternLinkTempEdgeEditor();
  renderPatternLinkDetail();
  renderPatternLinkWorkspaceStatus();
}

function openPatternLinkTempEdgeEditor(edge) {
  const plc = getPatternLinkCy();
  const ws = getPatternLinkWorkspace();
  if (!plc || !edge || edge.length === 0) return;

  closePatternLinkTempEdgeEditor();

  const container = els.patternLinkCenter || els.patternLinkPage || document.body;
  const rendered = edge.renderedMidpoint ? edge.renderedMidpoint() : edge.midpoint();

  const hostRect = container.getBoundingClientRect();
  const cyRect = els.patternLinkCy.getBoundingClientRect();

  const left = cyRect.left - hostRect.left + rendered.x;
  const top = cyRect.top - hostRect.top + rendered.y - 18;

  const sourceId = edge.data("source") || "-";
  const targetId = edge.data("target") || "-";
  const edgeType = edge.data("type") || "PL_TEMP";
  const currentTag = edge.data("relationTag") || edge.data("label") || "CAUSE";

  const editor = document.createElement("div");
  editor.id = "pattern-link-temp-edge-editor";
  editor.className = "pl-temp-edge-editor";
  editor.style.position = "absolute";
  editor.style.left = `${left}px`;
  editor.style.top = `${top}px`;
  editor.style.transform = "translate(-50%, -100%)";
  editor.style.zIndex = "999";
  editor.style.minWidth = "220px";
  editor.style.maxWidth = "280px";
  editor.style.padding = "10px";
  editor.style.background = "rgba(17,18,22,0.98)";
  editor.style.border = "1px solid #3a3f4b";
  editor.style.borderRadius = "12px";
  editor.style.boxShadow = "0 10px 28px rgba(0,0,0,0.32)";
  editor.style.color = "#fff";
  editor.style.display = "flex";
  editor.style.flexDirection = "column";
  editor.style.gap = "8px";

  const head = document.createElement("div");
head.className = "pl-temp-edge-editor-head";
head.style.display = "flex";
head.style.justifyContent = "space-between";
head.style.alignItems = "center";
head.style.cursor = "move";
  head.innerHTML = `
    <div style="font-size:12px;font-weight:700;letter-spacing:0.04em;opacity:0.92;">
      TEMP EDGE
    </div>
  `;

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.textContent = "×";
  closeBtn.style.border = "none";
  closeBtn.style.background = "transparent";
  closeBtn.style.color = "#c9ced8";
  closeBtn.style.fontSize = "16px";
  closeBtn.style.cursor = "pointer";
  closeBtn.style.lineHeight = "1";
  closeBtn.onclick = (evt) => {
    evt.stopPropagation();
    closePatternLinkTempEdgeEditor();
  };
  head.appendChild(closeBtn);

  const edgeInfo = document.createElement("div");
  edgeInfo.style.fontSize = "12px";
  edgeInfo.style.lineHeight = "1.45";
  edgeInfo.style.color = "#d6dbe5";
  edgeInfo.innerHTML = `
    <div><b>EDGE</b>: ${sourceId} → ${targetId}</div>
    <div><b>TYPE</b>: ${edgeType}</div>
    <div><b>RELATION</b>: <span style="color:#ffd43b;">${currentTag}</span></div>
  `;

  const sectionTitle = document.createElement("div");
  sectionTitle.textContent = "Relation";
  sectionTitle.style.fontSize = "11px";
  sectionTitle.style.fontWeight = "700";
  sectionTitle.style.opacity = "0.8";

  const buttonRow = document.createElement("div");
  buttonRow.style.display = "flex";
  buttonRow.style.flexWrap = "wrap";
  buttonRow.style.gap = "6px";

  const tagList = ["CAUSE", "FOLLOWUP", "UNKNOWN"];

  tagList.forEach((tag) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = tag;
    btn.className = "pl-temp-edge-tag-btn";
    btn.style.padding = "5px 9px";
    btn.style.borderRadius = "8px";
    btn.style.border = "1px solid #4b5563";
    btn.style.background = currentTag === tag ? "#2f6fed" : "#1f2430";
    btn.style.color = "#fff";
    btn.style.cursor = "pointer";
    btn.style.fontSize = "12px";

    btn.onclick = (evt) => {
      evt.stopPropagation();
      updatePatternLinkTempEdgeRelation(edge.id(), tag);
      openPatternLinkTempEdgeEditor(plc.getElementById(edge.id()));
    };

    buttonRow.appendChild(btn);
  });

  const infoBox = document.createElement("div");
  infoBox.style.fontSize = "11px";
  infoBox.style.lineHeight = "1.45";
  infoBox.style.padding = "8px";
  infoBox.style.borderRadius = "8px";
  infoBox.style.background = "rgba(255,255,255,0.04)";
  infoBox.style.color = "#b8c0cc";
  infoBox.innerHTML = `
    <div>label: ${edge.data("label") || "-"}</div>
    <div>saved: temp</div>
    <div>status: editable</div>
  `;

  const actionRow = document.createElement("div");
actionRow.style.display = "flex";
actionRow.style.justifyContent = "flex-end";
actionRow.style.gap = "6px";

const deleteBtn = document.createElement("button");
deleteBtn.type = "button";
deleteBtn.textContent = "DELETE";
deleteBtn.style.padding = "5px 9px";
deleteBtn.style.borderRadius = "8px";
deleteBtn.style.border = "1px solid #7a2f2f";
deleteBtn.style.background = "#3a1f1f";
deleteBtn.style.color = "#ffd7d7";
deleteBtn.style.cursor = "pointer";
deleteBtn.style.fontSize = "12px";

deleteBtn.onclick = (evt) => {
  evt.stopPropagation();
  deletePatternLinkTempEdge(edge.id());
};

actionRow.appendChild(deleteBtn);

editor.appendChild(head);
editor.appendChild(edgeInfo);
editor.appendChild(sectionTitle);
editor.appendChild(buttonRow);
editor.appendChild(infoBox);
editor.appendChild(actionRow);

  container.appendChild(editor);
ws.tempEdgeEditorEdgeId = edge.id();

makePatternLinkTempEdgeEditorDraggable(editor);
}

function getPatternLinkNodeTimeValue(node) {
  if (!node) return Number.MAX_SAFE_INTEGER;

  const candidates = [
    node.data("time"),
    node.data("date"),
    node.data("timestamp"),
    node.data("createdAt"),
    node.data("occurredAt")
  ];

  for (const value of candidates) {
    if (value === null || value === undefined || value === "") continue;

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    const parsed = Date.parse(String(value));
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  return Number.MAX_SAFE_INTEGER;
}

function getPatternLinkCyNodeListFromIds(nodeIds = []) {
  const plc = getPatternLinkCy();
  if (!plc) return [];

  return [...new Set(nodeIds)]
    .map((id) => plc.getElementById(id))
    .filter((el) => el && el.length > 0)
    .map((el) => el[0]);
}

function layoutPatternLinkNodesInGrid(nodes, options = {}) {
  const colGap = options.colGap ?? 180;
  const rowGap = options.rowGap ?? 110;
  const startX = options.startX ?? 120;
  const startY = options.startY ?? 100;
  const colCount = options.colCount ?? 2;

  nodes.forEach((node, index) => {
    const col = index % colCount;
    const row = Math.floor(index / colCount);

    node.position({
      x: startX + col * colGap,
      y: startY + row * rowGap
    });
  });
}

function getPatternLinkFocusPriorityNodeIds() {
  if (uiState.selectedEventId) {
    return [uiState.selectedEventId];
  }

if (uiState.selectedGroup) {
  return getGroupAllNodeIds(uiState.selectedGroup);

   return [...new Set(ids.filter(Boolean))];
}

  const currentLayer = getCurrentLayerObject?.() || null;
  if (currentLayer && Array.isArray(currentLayer.nodes) && currentLayer.nodes.length > 0) {
    return [...new Set(currentLayer.nodes.filter(Boolean))];
  }

  if (Array.isArray(uiState.activeGroupIds) && uiState.activeGroupIds.length > 0) {
    const ids = [];

    uiState.activeGroupIds.forEach((groupId) => {
      const group = groupStore?.get(groupId);
      if (!group) return;

      if (group.center) ids.push(group.center);
      if (Array.isArray(group.nodes)) ids.push(...group.nodes);
    });

    return [...new Set(ids.filter(Boolean))];
  }

  return [];
}

function reLayoutPatternLinkWorkspaceByMode(mode = "default") {

  uiState.patternLinkPageState.layoutMode = mode;
saveLabState?.();

  const plc = getPatternLinkCy();
  if (!plc) return;

  if (mode === "default") {
    plc.layout({
      name: "dagre",
      rankDir: "LR",
      nodeSep: 40,
      rankSep: 70,
      animate: true,
      animationDuration: 300
    }).run();

    setTimeout(() => {
      applyPatternLinkWorkspaceVisibility();
    }, 350);

    return;
  }

  if (mode === "time") {
    const nodes = plc.nodes().toArray();

    const sorted = [...nodes].sort((a, b) => {
      const ta = getPatternLinkNodeTimeValue(a);
      const tb = getPatternLinkNodeTimeValue(b);

      if (ta !== tb) return ta - tb;

      return String(a.id()).localeCompare(String(b.id()));
    });

    const colGap = 260;
    const rowGap = 120;
    const startX = 140;
    const startY = 100;
    const colCount = 2;

    sorted.forEach((node, index) => {
      const col = index % colCount;
      const row = Math.floor(index / colCount);

      node.position({
        x: startX + col * colGap,
        y: startY + row * rowGap
      });
    });

    plc.fit(plc.nodes(), 40);
    applyPatternLinkWorkspaceVisibility();
    return;
  }

  if (mode === "focus") {
    const priorityIds = getPatternLinkFocusPriorityNodeIds();

    if (!priorityIds.length) {
      reLayoutPatternLinkWorkspaceByMode("default");
      return;
    }

    const focusNodes = getPatternLinkCyNodeListFromIds(priorityIds);
    const focusIdSet = new Set(focusNodes.map((n) => n.id()));
    const relatedNodeSet = new Set();

    focusNodes.forEach((node) => {
      relatedNodeSet.add(node.id());

      node.connectedEdges().forEach((edge) => {
        relatedNodeSet.add(edge.source().id());
        relatedNodeSet.add(edge.target().id());
      });
    });

    const relatedNodes = getPatternLinkCyNodeListFromIds([...relatedNodeSet]).filter(
      (node) => !focusIdSet.has(node.id())
    );

    const backgroundNodes = plc.nodes().filter((node) => {
      return !focusIdSet.has(node.id()) && !relatedNodeSet.has(node.id());
    }).toArray();

    focusNodes.forEach((node, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);

      node.position({
        x: 220 + col * 220,
        y: 120 + row * 130
      });
    });

    relatedNodes.forEach((node, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);

      node.position({
        x: 700 + col * 180,
        y: 120 + row * 110
      });
    });

    backgroundNodes.forEach((node, index) => {
      const col = index % 3;
      const row = Math.floor(index / 3);

      node.position({
        x: 180 + col * 180,
        y: 520 + row * 90
      });
    });

    plc.fit(plc.nodes(), 50);
    applyPatternLinkWorkspaceVisibility();
  }
}

function renderPatternLinkWorkspaceStatus() {
  if (!els.patternLinkWorkspaceStatus) return;

  const ws = getPatternLinkWorkspace();

  const hiddenNodeCount = ws.hiddenNodeIds?.size || 0;
  const hiddenEdgeCount = ws.hiddenEdgeIds?.size || 0;
  const tempEdgeCount = ws.tempEdgeIds?.length || 0;
  const chainCount = ws.tempEdgeChain?.length || 0;
  const dimNodeCount = ws.dimmedNodeIds?.size || 0;
const dimEdgeCount = ws.dimmedEdgeIds?.size || 0;

let modeText = "OFF";
if (ws.active) modeText = "ON";
if (ws.hideMode === "node") modeText = "HIDE NODE";
if (ws.hideMode === "edge") modeText = "HIDE EDGE";
if (ws.tempEdgeMode) modeText = "TEMP EDGE";
if (ws.dimMode) modeText = "DIM";

  els.patternLinkWorkspaceStatus.innerHTML = `
  <div>mode: ${modeText}</div>
  <div>loaded layer: ${ws.loadedLayerName || "-"}</div>
  <div>layer nodes: ${(ws.loadedLayerNodes || []).length}</div>
  <div>group refs: ${(ws.loadedActiveGroupIds || []).length}</div>
  <div>filter: ROT≥${ws.loadedLayerFilter?.rotMin ?? "-"} / CAP≤${ws.loadedLayerFilter?.capMax ?? "-"} / VAR≥${ws.loadedLayerFilter?.varMin ?? "-"}</div>
  <div>focus node: ${ws.autoFocusNodeId || "-"}</div>
  <div>focus edge: ${ws.autoFocusEdgeId || "-"}</div>
  <div>dim nodes: ${dimNodeCount}</div>
  <div>dim edges: ${dimEdgeCount}</div>
  <div>hidden nodes: ${hiddenNodeCount}</div>
  <div>hidden edges: ${hiddenEdgeCount}</div>
  <div>temp edges: ${tempEdgeCount}</div>
  <div>chain: ${chainCount}</div>
`;
}

function quickSavePatternLinkLayer() {
  const ws = getPatternLinkWorkspace();
  const plc = getPatternLinkCy();
  if (!plc) return;

  const visibleNodes = plc.nodes(":visible").map(n => n.id());

  const layer = createLayerEntry({
    name: `Layer-${Date.now()}`,
    mode: ws.dimMode ? "dim" : "-",
    nodes: visibleNodes,
    groupId: null,
    filter: ws.loadedLayerFilter || {},
    memo: "quick save",
    description: "workspace snapshot"
  });

  if (!layer) return;

  pushLog({
    type: "LAYER_SAVE",
    summary: `[LAYER] quick save: ${layer.name}`
  });
}

function resetPatternLinkWorkspace() {
  const plc = getPatternLinkCy();
  const ws = getPatternLinkWorkspace();

  if (!plc) return;

  plc.nodes().forEach((n) => {
    n.show();
    n.removeClass("pl-dim-node");
  });

  plc.edges().forEach((e) => {
    e.show();
    e.removeClass("pl-dim-edge");
  });

  ws.hiddenNodeIds.clear();
  ws.hiddenEdgeIds.clear();
  ws.dimmedNodeIds.clear();
  ws.dimmedEdgeIds.clear();

  ws.tempEdgeIds = [];
  ws.tempEdgeChain = [];

  ws.hideMode = null;
  ws.tempEdgeMode = false;
  ws.dimMode = false;
  ws.autoFocusNodeId = null;
ws.autoFocusEdgeId = null;

  renderPatternLinkWorkspaceStatus();
  closePatternLinkTempEdgeEditor();
}

function nodeOrEdgeCleanup(edge, ws) {
  if (!edge || edge.length === 0) return;

  const edgeType = edge.data("type");
  if (edgeType === "PL_TEMP") {
    edge.remove();
    return;
  }

  edge.style("display", "element");
}

function applyAutoDimToPatternLinkWorkspace() {
  const plc = getPatternLinkCy();
  const ws = getPatternLinkWorkspace();
  if (!plc || !ws) return;

  const hasLoadedLayer =
    !!ws.loadedLayerName ||
    (Array.isArray(ws.loadedLayerNodes) && ws.loadedLayerNodes.length > 0);

  plc.nodes().forEach((node) => {
    node.removeClass("pl-dim-node");
    node.style("opacity", 1);
  });

  plc.edges().forEach((edge) => {
    edge.removeClass("pl-dim-edge");
    edge.style("opacity", 1);
  });

  ws.dimmedNodeIds.clear();
  ws.dimmedEdgeIds.clear();

  if (!ws.dimMode && !hasLoadedLayer) {
    renderPatternLinkWorkspaceStatus();
    return;
  }

  const explicitNodeIds = new Set(ws.loadedLayerNodes || []);
  const activeGroupIds = Array.isArray(ws.loadedActiveGroupIds)
    ? ws.loadedActiveGroupIds
    : [];

  const baseNodeIds = new Set();

  plc.nodes().forEach((node) => {
    const nodeId = node.id();

    const passesExplicit =
      explicitNodeIds.size === 0 || explicitNodeIds.has(nodeId);

    const passesGroup =
      isNodeIncludedByWorkspaceGroups(nodeId, activeGroupIds);

    const passesFilter =
      passesPatternLinkLayerFilter(node, ws.loadedLayerFilter);

    if (passesExplicit && passesGroup && passesFilter) {
      baseNodeIds.add(nodeId);
    }
  });

  const baseEdgeIds = new Set();
  plc.edges().forEach((edge) => {
    const sourceId = edge.source().id();
    const targetId = edge.target().id();

    if (baseNodeIds.has(sourceId) && baseNodeIds.has(targetId)) {
      baseEdgeIds.add(edge.id());
    }
  });

  if (!ws.dimMode && !hasLoadedLayer) {
  renderPatternLinkWorkspaceStatus();
  return;
}

if (!ws.dimMode) {
    if (baseNodeIds.size || baseEdgeIds.size) {
      plc.nodes().forEach((node) => {
        if (!baseNodeIds.has(node.id())) {
          node.addClass("pl-dim-node");
          ws.dimmedNodeIds.add(node.id());
        }
      });

      plc.edges().forEach((edge) => {
        if (!baseEdgeIds.has(edge.id())) {
          edge.addClass("pl-dim-edge");
          ws.dimmedEdgeIds.add(edge.id());
        }
      });
    }

    renderPatternLinkWorkspaceStatus();
    return;
  }

  const focusNodeId = ws.lockedFocusNodeId || ws.autoFocusNodeId || null;
const focusEdgeId = ws.lockedFocusEdgeId || ws.autoFocusEdgeId || null;

  if (focusNodeId) {
    const center = plc.getElementById(focusNodeId);
    if (!center || center.length === 0) {
      renderPatternLinkWorkspaceStatus();
      return;
    }

    const keepNodeIds = new Set([center.id()]);
    const keepEdgeIds = new Set();

    center.connectedEdges().forEach((edge) => {
      keepEdgeIds.add(edge.id());
      keepNodeIds.add(edge.source().id());
      keepNodeIds.add(edge.target().id());
    });

    plc.nodes().forEach((node) => {
      if (!keepNodeIds.has(node.id())) {
        node.addClass("pl-dim-node");
        ws.dimmedNodeIds.add(node.id());
      }
    });

    plc.edges().forEach((edge) => {
      if (!keepEdgeIds.has(edge.id())) {
        edge.addClass("pl-dim-edge");
        ws.dimmedEdgeIds.add(edge.id());
      }
    });

    renderPatternLinkWorkspaceStatus();
    return;
  }

  if (focusEdgeId) {
    const edge = plc.getElementById(focusEdgeId);
    if (!edge || edge.length === 0) {
      renderPatternLinkWorkspaceStatus();
      return;
    }

    const keepNodeIds = new Set([
      edge.source().id(),
      edge.target().id()
    ]);
    const keepEdgeIds = new Set([edge.id()]);

    plc.nodes().forEach((node) => {
      if (!keepNodeIds.has(node.id())) {
        node.addClass("pl-dim-node");
        ws.dimmedNodeIds.add(node.id());
      }
    });

    plc.edges().forEach((e) => {
      if (!keepEdgeIds.has(e.id())) {
        e.addClass("pl-dim-edge");
        ws.dimmedEdgeIds.add(e.id());
      }
    });

    renderPatternLinkWorkspaceStatus();
    return;
  }

  plc.nodes().forEach((node) => {
    if (!baseNodeIds.has(node.id())) {
      node.addClass("pl-dim-node");
      ws.dimmedNodeIds.add(node.id());
    }
  });

  plc.edges().forEach((edge) => {
    if (!baseEdgeIds.has(edge.id())) {
      edge.addClass("pl-dim-edge");
      ws.dimmedEdgeIds.add(edge.id());
    }
  });

  renderPatternLinkWorkspaceStatus();
}

function setPatternLinkWorkspaceMode(mode) {
  const ws = getPatternLinkWorkspace();

  ws.active = true;
  ws.hideMode = null;
  ws.tempEdgeMode = false;
  ws.dimMode = false;

  ws.autoFocusNodeId = null;
  ws.autoFocusEdgeId = null;

  if (mode === "hide-node") {
    ws.hideMode = "node";
  } else if (mode === "hide-edge") {
    ws.hideMode = "edge";
  } else if (mode === "temp-edge") {
    ws.tempEdgeMode = true;
    ws.tempEdgeChain = [];
  } else if (mode === "dim") {
    ws.dimMode = true;
  }

  applyAutoDimToPatternLinkWorkspace();
  renderPatternLinkWorkspaceStatus();
  saveLabState?.();
}

function setPatternLinkAutoFocusNode(nodeId) {
  const ws = getPatternLinkWorkspace();

  ws.autoFocusNodeId = nodeId || null;
  ws.autoFocusEdgeId = null;

  applyAutoDimToPatternLinkWorkspace();
  saveLabState?.();
}

function setPatternLinkAutoFocusEdge(edgeId) {
  const ws = getPatternLinkWorkspace();

  ws.autoFocusEdgeId = edgeId || null;
  ws.autoFocusNodeId = null;

  applyAutoDimToPatternLinkWorkspace();
  saveLabState?.();
}

function togglePatternLinkFocusLockNode(nodeId) {
  const ws = getPatternLinkWorkspace();

  if (ws.lockedFocusNodeId === nodeId) {
    ws.lockedFocusNodeId = null;
  } else {
    ws.lockedFocusNodeId = nodeId;
    ws.lockedFocusEdgeId = null;
  }

  applyAutoDimToPatternLinkWorkspace();
  saveLabState?.();
}

function togglePatternLinkFocusLockEdge(edgeId) {
  const ws = getPatternLinkWorkspace();

  if (ws.lockedFocusEdgeId === edgeId) {
    ws.lockedFocusEdgeId = null;
  } else {
    ws.lockedFocusEdgeId = edgeId;
    ws.lockedFocusNodeId = null;
  }

  applyAutoDimToPatternLinkWorkspace();
}

function clearPatternLinkAutoFocus() {
  const ws = getPatternLinkWorkspace();

  ws.autoFocusNodeId = null;
  ws.autoFocusEdgeId = null;

  applyAutoDimToPatternLinkWorkspace();
}

function applyPatternLinkWorkspaceVisibility() {
  const ws = getPatternLinkWorkspace();
  const plc = getPatternLinkCy();
  if (!plc) return;

  plc.nodes().forEach((node) => {
    if (ws.hiddenNodeIds.has(node.id())) {
      node.hide();
    } else {
      node.show();
    }
  });

  plc.edges().forEach((edge) => {
    if (ws.hiddenEdgeIds.has(edge.id())) {
      edge.hide();
    } else {
      edge.show();
    }
  });
}

function setPatternLinkDimStrength(value) {
  const ws = getPatternLinkWorkspace();
  ws.dimStrength = Number(value);

  const plc = getPatternLinkCy();
  if (plc) {
    applyPatternLinkDimStyles(plc);
  }

  applyAutoDimToPatternLinkWorkspace();
}

function registerPatternLinkWorkspaceEvents() {
  const plc = getPatternLinkCy();
  if (!plc) return;
  if (plc._patternLinkWorkspaceBound) return;

  // =========================
  // 우클릭: node
  // =========================
  plc.on("cxttap", "node", (evt) => {
    const ws = getPatternLinkWorkspace();
    if (!ws.active && uiState.page !== "pattern-link") return;

    const node = evt.target;
    const nodeId = node?.id?.();
    if (!nodeId) return;

    // DIM mode
    if (ws.dimMode) {
      if (ws.dimmedNodeIds.has(nodeId)) {
        ws.dimmedNodeIds.delete(nodeId);
        node.removeClass("pl-dim-node");
      } else {
        ws.dimmedNodeIds.add(nodeId);
        node.addClass("pl-dim-node");
      }

      renderPatternLinkWorkspaceStatus?.();
      saveLabState?.();
      return;
    }

    // HIDE mode
    if (ws.hideMode === "node") {
      ws.hiddenNodeIds.add(nodeId);
      node.hide();

      if (uiState.selectedEventId === nodeId) {
        uiState.selectedEventId = null;
      }

      if (ws.selectedNodeId === nodeId) {
        ws.selectedNodeId = null;
      }

      if (uiState.patternLinkPageState) {
        if (uiState.patternLinkPageState.selectedNodeId === nodeId) {
          uiState.patternLinkPageState.selectedNodeId = null;
        }
      }

      renderPatternLinkFocusHeader?.();
      renderPatternLinkDetail?.();
      renderPatternLinkWorkspaceStatus?.();
      saveLabState?.();
    }
  });

  // =========================
  // 우클릭: edge
  // =========================
  plc.on("cxttap", "edge", (evt) => {
    const ws = getPatternLinkWorkspace();
    if (!ws.active && uiState.page !== "pattern-link") return;

    const edge = evt.target;
    const edgeId = edge?.id?.();
    if (!edgeId) return;

    // DIM mode
    if (ws.dimMode) {
      if (ws.dimmedEdgeIds.has(edgeId)) {
        ws.dimmedEdgeIds.delete(edgeId);
        edge.removeClass("pl-dim-edge");
      } else {
        ws.dimmedEdgeIds.add(edgeId);
        edge.addClass("pl-dim-edge");
      }

      renderPatternLinkWorkspaceStatus?.();
      saveLabState?.();
      return;
    }

    // HIDE mode
    if (ws.hideMode === "edge") {
      ws.hiddenEdgeIds.add(edgeId);
      edge.hide();

      if (ws.selectedEdgeId === edgeId) {
        ws.selectedEdgeId = null;
      }

      if (uiState.patternLinkPageState) {
        if (uiState.patternLinkPageState.selectedEdgeId === edgeId) {
          uiState.patternLinkPageState.selectedEdgeId = null;
        }
      }

      renderPatternLinkFocusHeader?.();
      renderPatternLinkDetail?.();
      renderPatternLinkWorkspaceStatus?.();
      saveLabState?.();
    }
  });

  // =========================
  // 좌클릭: node
  // =========================
  plc.on("tap", "node", (evt) => {
    const ws = getPatternLinkWorkspace();
    if (!ws.active && uiState.page !== "pattern-link") return;

    const node = evt.target;
    console.log("PL CY NODE TAP", node.id(), {
    page: uiState.page,
    nodeData: node.data()
  });
    const nodeId = node?.id?.();
    if (!nodeId) return;

    // 1) hide-node mode
    if (ws.hideMode === "node") {
      ws.hiddenNodeIds.add(nodeId);
      node.hide();

      if (uiState.selectedEventId === nodeId) {
        uiState.selectedEventId = null;
      }

      if (ws.selectedNodeId === nodeId) {
        ws.selectedNodeId = null;
      }

      if (uiState.patternLinkPageState) {
        if (uiState.patternLinkPageState.selectedNodeId === nodeId) {
          uiState.patternLinkPageState.selectedNodeId = null;
        }
      }

      renderPatternLinkFocusHeader?.();
      renderPatternLinkDetail?.();
      renderPatternLinkWorkspaceStatus?.();
      saveLabState?.();
      return;
    }

    // 2) temp-edge mode
    if (ws.tempEdgeMode) {
      if (!Array.isArray(ws.tempEdgeChain)) {
        ws.tempEdgeChain = [];
      }
      if (!Array.isArray(ws.tempEdgeIds)) {
        ws.tempEdgeIds = [];
      }

      const chain = ws.tempEdgeChain;

      if (chain.length > 0) {
        const prev = chain[chain.length - 1];

        if (prev && prev !== nodeId) {
          const relationTag = "CAUSE";
          const edgeId = `pl-temp-${prev}-${nodeId}-${Date.now()}`;

          if (plc.getElementById(edgeId).length === 0) {
            plc.add({
              group: "edges",
              data: {
                id: edgeId,
                source: prev,
                target: nodeId,
                type: "PL_TEMP",
                label: relationTag,
                relationTag
              }
            });

            ws.tempEdgeIds.push(edgeId);

            const edge = plc.getElementById(edgeId);
            if (edge && edge.length > 0) {
              edge.style({
                "line-color": "#ffd43b",
                "target-arrow-color": "#ffd43b",
                width: 3
              });
            }
          }
        }
      }

      chain.push(nodeId);
      renderPatternLinkWorkspaceStatus?.();
      saveLabState?.();
      return;
    }

    // 3) normal select
    ws.selectedNodeId = nodeId;
    ws.selectedEdgeId = null;

if (!uiState.patternLinkPageState) {
  uiState.patternLinkPageState = {};
}
uiState.patternLinkPageState.selectedNodeId = nodeId;
uiState.patternLinkPageState.selectedEdgeId = null;

    if (evt.originalEvent?.shiftKey) {
      togglePatternLinkFocusLockNode?.(nodeId);
    } else {
      setPatternLinkAutoFocusNode?.(nodeId);
    }

    saveLabState?.();
    renderPatternLinkFocusHeader?.();
    renderPatternLinkDetail?.();
  });

  // =========================
  // 좌클릭: edge
  // =========================
  plc.on("tap", "edge", (evt) => {
    const ws = getPatternLinkWorkspace();
    if (!ws.active && uiState.page !== "pattern-link") return;

    const edge = evt.target;
    console.log("PL CY EDGE TAP", edge.id(), {
    page: uiState.page,
    edgeData: edge.data()
  });

    const edgeId = edge?.id?.();
    if (!edgeId) return;

    ws.selectedEdgeId = edgeId;
    ws.selectedNodeId = null;

    if (!uiState.patternLinkPageState) {
      uiState.patternLinkPageState = {};
    }
    uiState.patternLinkPageState.selectedEdgeId = edgeId;
    uiState.patternLinkPageState.selectedNodeId = null;

    saveLabState?.();
    renderPatternLinkFocusHeader?.();
    renderPatternLinkDetail?.();
  });

  // =========================
  // 빈 곳 클릭: 선택 해제
  // =========================
  plc.on("tap", (evt) => {
    if (evt.target !== plc) return;

    const ws = getPatternLinkWorkspace();
    if (!ws.active && uiState.page !== "pattern-link") return;

    ws.selectedNodeId = null;
    ws.selectedEdgeId = null;

    if (!uiState.patternLinkPageState) {
      uiState.patternLinkPageState = {};
    }
    uiState.patternLinkPageState.selectedNodeId = null;
    uiState.patternLinkPageState.selectedEdgeId = null;

    saveLabState?.();
    renderPatternLinkFocusHeader?.();
    renderPatternLinkDetail?.();
  });

  plc._patternLinkWorkspaceBound = true;
}

function getPatternResultById(patternId) {
  const results = uiState.rawRankedResults || uiState.rankedResults || [];
  return results.find((r) => r?.pattern?.id === patternId) || null;
}

function createLayerFromSelectedPattern() {
  const patternId = uiState.selectedPatternId;
  if (!patternId) return null;

  const result = getPatternResultById(patternId);
  if (!result || !result.pattern) return null;

  return createLayerFromPattern(result.pattern);
}

function renderPayloadSummary(log) {
  const payload = log?.payload;
  if (!payload) {
    return `<div class="log-detail-empty">payload 없음</div>`;
  }

  if (log.scope === "EVENT") {
    return `
      <div class="log-detail-grid">
        <div><b>ID</b>: ${escapeHtml(payload.id || log.refId || "-")}</div>
        <div><b>이름</b>: ${escapeHtml(payload.name || "-")}</div>
        <div><b>STAT</b>: ${escapeHtml(payload.stat || "-")}</div>
        <div><b>SENTIMENT</b>: ${escapeHtml(payload.sentiment || "-")}</div>
        <div><b>ROT</b>: ${escapeHtml(payload.variables?.rot ?? "-")}</div>
        <div><b>CAP</b>: ${escapeHtml(payload.variables?.cap ?? "-")}</div>
        <div><b>VAR</b>: ${escapeHtml(payload.variables?.var ?? "-")}</div>
        <div><b>관계 태그</b>: ${escapeHtml((payload.relationTags || []).join(", ") || "-")}</div>
        <div><b>상태 태그</b>: ${escapeHtml((payload.stateTags || []).join(", ") || "-")}</div>
        <div><b>메모</b>: ${escapeHtml(payload.memo || "-")}</div>
      </div>
    `;
  }

  if (log.scope === "GROUP") {
    return `
      <div class="log-detail-grid">
        <div><b>ID</b>: ${escapeHtml(payload.id || log.refId || "-")}</div>
        <div><b>중심 이벤트</b>: ${escapeHtml(payload.center || "-")}</div>
        <div><b>관계 타입</b>: ${escapeHtml(payload.edgeType || payload.type || "-")}</div>
        <div><b>노드 수</b>: ${escapeHtml((payload.nodes || []).length)}</div>
        <div><b>노드</b>: ${escapeHtml((payload.nodes || []).join(", ") || "-")}</div>
      </div>
    `;
  }

  if (log.scope === "LAYER") {
    return `
      <div class="log-detail-grid">
        <div><b>이름</b>: ${escapeHtml(payload.name || log.refId || "-")}</div>
        <div><b>MODE</b>: ${escapeHtml(payload.mode || "-")}</div>
        <div><b>GROUP ID</b>: ${escapeHtml(payload.groupId || "-")}</div>
        <div><b>노드 수</b>: ${escapeHtml((payload.nodes || []).length)}</div>
        <div><b>ROT 최소</b>: ${escapeHtml(payload.filter?.rotMin ?? "-")}</div>
        <div><b>CAP 최대</b>: ${escapeHtml(payload.filter?.capMax ?? "-")}</div>
        <div><b>VAR 최소</b>: ${escapeHtml(payload.filter?.varMin ?? "-")}</div>
      </div>
    `;
  }

  if (log.scope === "TIMELINE") {
    return `
      <div class="log-detail-grid">
        <div><b>REF</b>: ${escapeHtml(log.refId || "-")}</div>
        <div><b>SUMMARY</b>: ${escapeHtml(log.summary || "-")}</div>
      </div>
    `;
  }

  return `
    <div class="log-detail-grid">
      <div><b>REF</b>: ${escapeHtml(log.refId || "-")}</div>
      <div><b>SUMMARY</b>: ${escapeHtml(log.summary || "-")}</div>
    </div>
  `;
}
/*
function renderLogDetail(log) {
  if (!els.logExplorerDetailBody) return;

  if (!log) {
    els.logExplorerDetailBody.innerHTML = `
      <div class="empty-state">로그를 선택하면 상세 정보가 표시됩니다.</div>
    `;
    return;
  }

  const payloadText = log.payload
    ? escapeHtml(JSON.stringify(log.payload, null, 2))
    : "null";

  els.logExplorerDetailBody.innerHTML = `
    <div class="log-detail-meta">
      <div><b>ID</b>: ${escapeHtml(log.id || "-")}</div>
      <div><b>TYPE</b>: ${escapeHtml(log.type || "-")}</div>
      <div><b>SCOPE</b>: ${escapeHtml(log.scope || "-")}</div>
      <div><b>LEVEL</b>: ${escapeHtml(log.level || "-")}</div>
      <div><b>REF</b>: ${escapeHtml(log.refId || "-")}</div>
      <div><b>TIME</b>: ${escapeHtml(new Date(log.ts).toLocaleString())}</div>
    </div>

    <div class="log-detail-section">
      <div class="log-detail-title">SUMMARY</div>
      <div class="log-detail-summary">${escapeHtml(log.summary || "-")}</div>
    </div>

    <div class="log-detail-section">
      <div class="log-detail-title">PAYLOAD SUMMARY</div>
      ${renderPayloadSummary(log)}
    </div>

    <div class="log-detail-section">
      <div class="log-detail-title">RAW JSON</div>
      <pre class="log-detail-json">${payloadText}</pre>
    </div>
  `;
}
*/
function openCommandPalette() {
  if (!els.commandPalette) return;
  els.commandPalette.classList.remove("hidden");
  renderCommandPaletteResults("");
  if (els.commandPaletteInput) {
    els.commandPaletteInput.value = "";
    els.commandPaletteInput.focus();
  }
}

function closeCommandPalette() {
  if (!els.commandPalette) return;
  els.commandPalette.classList.add("hidden");
}

function filterCommandItems(query) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return COMMAND_ITEMS;

  return COMMAND_ITEMS.filter((item) => {
    const haystack = [
      item.title,
      item.sub,
      ...(item.keywords || [])
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(q);
  });
}

function renderCommandPaletteResults(query) {
  if (!els.commandPaletteResults) return;

  const items = filterCommandItems(query);

  if (!items.length) {
    els.commandPaletteResults.innerHTML = `
      <div class="empty-state">검색 결과 없음</div>
    `;
    return;
  }

  els.commandPaletteResults.innerHTML = items
    .map((item, index) => `
      <div class="command-item${index === 0 ? " active" : ""}" data-command-id="${item.id}">
        <div class="command-item-title">${item.title}</div>
        <div class="command-item-sub">${item.sub}</div>
      </div>
    `)
    .join("");

  const nodes = els.commandPaletteResults.querySelectorAll(".command-item");
  nodes.forEach((node) => {
    node.onclick = () => {
      const id = node.dataset.commandId;
      executeCommandById(id);
    };
  });
}

function executeCommandById(id) {
  const item = COMMAND_ITEMS.find((cmd) => cmd.id === id);
  if (!item) return;

  const handler = item.run || item.action;
  if (typeof handler !== "function") return;

  handler();
}

function runCommandText(query) {
  const q = String(query || "").trim().toLowerCase();

  if (q === "log" || q === "logs" || q === "로그") {
    openLogExplorer();
    return true;
  }

  if (q === "timeline" || q === "타임라인") {
    openTimelineExplorer();
    return true;
  }

  return false;
}

function stepTimelineBackward() {
  const events = getTimelineEvents();
  if (!events.length) return;

  stopTimeline();

  if (uiState.timelineIndex > 0) {
    uiState.timelineIndex -= 1;
  }

  applyTimelineEventByIndex(uiState.timelineIndex);

  const current = events[uiState.timelineIndex];
  logEvent(`[TIMELINE] 이전 이벤트: ${current?.name || current?.id || "-"}`);

  renderTimelineStatus();
  saveLabState?.();

}

function clearTemporaryTimelineRelations() {
  if (!window.cy) return;

  const tempEdges = cy.edges().filter((edge) => edge.data("kind") === "temp-timeline");
  if (tempEdges.length > 0) {
    cy.remove(tempEdges);
  }

  logEvent("[TIMELINE] 임시 관계도 해제");
}

function openTimelineExplorer() {
  if (!els.timelineExplorer) return;

  els.timelineExplorer.classList.remove("hidden");

  logEvent("[TIMELINE] Explorer 열림");
}


function closeTimelineExplorer() {
  if (!els.timelineExplorer) return;

  els.timelineExplorer.classList.add("hidden");

  logEvent("[TIMELINE] Explorer 닫힘");
}

function renderLayerDeleteExplorer() {
  if (!els.layerDeleteExplorerBody) return;

  const layers = uiState.savedLayers || [];
  els.layerDeleteExplorerBody.innerHTML = "";

  if (!layers.length) {
    els.layerDeleteExplorerBody.innerHTML = `<div class="empty-state">저장된 Layer가 없습니다.</div>`;
    return;
  }

  layers.forEach((layer) => {
    const item = document.createElement("div");
    item.className = "layer-delete-item";

    if ((uiState.selectedLayerNamesForDelete || []).includes(layer.name)) {
      item.classList.add("selected-for-delete");
    }

    item.innerHTML = `
      <div class="layer-delete-item-title">${layer.name}</div>
      <div class="layer-delete-item-sub">mode: ${layer.mode || "-"} / group: ${layer.groupId || "-"}</div>
    `;

    item.onclick = () => {
      const list = uiState.selectedLayerNamesForDelete || [];
      const exists = list.includes(layer.name);

      uiState.selectedLayerNamesForDelete = exists
        ? list.filter((name) => name !== layer.name)
        : [...list, layer.name];

      renderLayerDeleteExplorer();
    };

    els.layerDeleteExplorerBody.appendChild(item);
  });
}

function enterLayerDeleteMode() {
  uiState.isLayerDeleteMode = true;
  uiState.selectedLayerNamesForDelete = [];

  document.body.classList.add("layer-delete-mode");

  if (els.layerDeleteExplorer) {
    els.layerDeleteExplorer.classList.remove("hidden");
  }

  if (els.layerDeleteBar) {
    els.layerDeleteBar.classList.remove("hidden");
  }

  renderLayerDeleteExplorer();
}

function exitLayerDeleteMode() {
  uiState.isLayerDeleteMode = false;
  uiState.selectedLayerNamesForDelete = [];

  document.body.classList.remove("layer-delete-mode");

  if (els.layerDeleteExplorer) {
    els.layerDeleteExplorer.classList.add("hidden");
  }

  if (els.layerDeleteBar) {
    els.layerDeleteBar.classList.add("hidden");
  }

  if (els.layerDeleteModal) {
    els.layerDeleteModal.classList.add("hidden");
  }
}

function unapproveLayer(layerName) {
  if (!layerName) return;

  uiState.savedLayers = (uiState.savedLayers || []).map((layer) => {
    if (layer.name !== layerName) return normalizeLayerEntry(layer);

    return normalizeLayerEntry({
      ...layer,
      approved: false,
      approvalState: "stored"
    });
  });

  if (uiState.currentLayerName === layerName) {
    uiState.currentLayerName = null;
  }

  recordLog?.({
    type: "LAYER_UNAPPROVE",
    scope: "LAYER",
    refId: layerName,
    summary: `[LAYER] 이번 사용 해제: ${layerName}`
  });

  renderLayerPanel?.();
  saveLabState?.();
}

function unloadPatternLinkWorkspaceLayer() {
  const ws = getPatternLinkWorkspace();
  const plc = getPatternLinkCy();

  ws.loadedLayerName = null;
  ws.loadedLayerNodes = [];
  ws.loadedLayerFilter = {
    rotMin: null,
    capMax: null,
    varMin: null
  };
  ws.loadedActiveGroupIds = [];

  ws.autoFocusNodeId = null;
  ws.autoFocusEdgeId = null;
  ws.lockedFocusNodeId = null;
  ws.lockedFocusEdgeId = null;

  ws.dimMode = false;
  ws.dimmedNodeIds.clear();
  ws.dimmedEdgeIds.clear();

  if (plc) {
    plc.nodes().forEach((node) => {
      node.removeClass("pl-dim-node");
      node.style("opacity", 1);
    });

    plc.edges().forEach((edge) => {
      edge.removeClass("pl-dim-edge");
      edge.style("opacity", 1);
    });
  }

  renderPatternLinkLayerOptions();
  renderPatternLinkWorkspaceStatus();
  renderPatternLinkFocusHeader();
  renderPatternLinkDetail();
  renderPatternLinkCompareBox();
}

function showAllPatternLinkWorkspace() {
  const plc = getPatternLinkCy();
  const ws = getPatternLinkWorkspace();
  if (!plc) return;

  plc.nodes().forEach((node) => {
    node.show();
    node.removeClass("pl-dim-node");
  });

  plc.edges().forEach((edge) => {
    const edgeType = edge.data("type");
    if (edgeType === "PL_TEMP") {
      edge.remove();
    } else {
      edge.show();
      edge.removeClass("pl-dim-edge");
    }
  });

  ws.hiddenNodeIds.clear();
  ws.hiddenEdgeIds.clear();
  ws.dimmedNodeIds.clear();
  ws.dimmedEdgeIds.clear();

  ws.tempEdgeIds = [];
  ws.tempEdgeChain = [];
  ws.hideMode = null;
  ws.tempEdgeMode = false;
  ws.dimmedNodeIds.clear();
ws.dimmedEdgeIds.clear();
ws.autoFocusNodeId = null;
ws.autoFocusEdgeId = null;

plc.nodes().forEach((node) => {
  node.removeClass("pl-dim-node");
});

plc.edges().forEach((edge) => {
  edge.removeClass("pl-dim-edge");
});

  renderPatternLinkWorkspaceStatus();
  renderPatternLinkDetail();
  renderPatternLinkCompareBox();
  closePatternLinkTempEdgeEditor();
}

// ===== LEGACY (pattern viwe) ======
//function highlightPatternOnGraph(pattern) {
  //if (!pattern || !pattern.nodes) return;

  //resetGraphFocus();

  //cy.elements().style("opacity", LAB_CONFIG.graph.fadeOpacity);

  //pattern.nodes.forEach((id) => {
    //const node = cy.getElementById(id);
    //if (node && node.length > 0) {
      //node.style({
        //"background-color": "#ffd700",
        //"border-color": "#9400d3",
        //"border-width": 4,
        //"opacity": 1,
        //"color": "#ffffff"
      //});
    //}
  //});

  //if (pattern.nodes.length >= 2) {
    //const source = pattern.nodes[0];
    //const target = pattern.nodes[1];

    //cy.edges().forEach((edge) => {
      //const edgeSource = edge.data("source");
      //const edgeTarget = edge.data("target");

      //if (
        //(edgeSource === source && edgeTarget === target) ||
        //(edgeSource === target && edgeTarget === source)
      //) {
        //edge.style({
          //"line-color": "#ffd700",
          //"target-arrow-color": "#ffd700",
          //"width": 4,
          //"opacity": 1
        //});
      //}
    //});
  //}
//}

//function centerPatternOnGraph(pattern) {
  //if (!pattern || !pattern.nodes || pattern.nodes.length === 0) return;

  //const firstNode = cy.getElementById(pattern.nodes[0]);
  //if (firstNode && firstNode.length > 0) {
    //cy.animate({
      //fit: {
        //eles: firstNode,
        //padding: 80
      //},
      //duration: 300
    //});
  //}
//}

function renderRightPanelView() {
  if (!els.rightPanelNetwork || !els.rightPanelVariable || !els.rightPanelEventEditor) return;

  els.rightPanelNetwork.classList.add("hidden");
  els.rightPanelVariable.classList.add("hidden");
  els.rightPanelEventEditor.classList.add("hidden");

  if (uiState.rightPanelView === "variable") {
    els.rightPanelVariable.classList.remove("hidden");
    return;
  }

  if (uiState.rightPanelView === "event-editor") {
    els.rightPanelEventEditor.classList.remove("hidden");
    return;
  }

  els.rightPanelNetwork.classList.remove("hidden");
}

function renderEventEditorPanel() {
  if (!els.eventEditorBody || !uiState.eventDraft) return;

  const d = uiState.eventDraft;

  els.eventEditorBody.innerHTML = `
    <div class="variable-section">
      <div class="panel-title">기본</div>

      <div class="variable-input-row">
  <label for="evt-name">이름</label>
  <input id="evt-name" type="text" value="${d.name || ""}" />
</div>

<div class="variable-input-row">
  <label for="evt-stat">STAT</label>
  <input id="evt-stat" type="text" value="${d.stat || ""}" />
</div>

<div class="variable-input-row">
  <label for="evt-sentiment">SENTIMENT</label>
  <input id="evt-sentiment" type="text" value="${d.sentiment || ""}" />
</div>

      <div class="variable-input-row">
        <label for="evt-rel">관계성 태그</label>
        <input id="evt-rel" type="text" value="${(d.relationTags || []).join(", ")}" />
      </div>

      <div class="variable-input-row">
        <label for="evt-state">상태성 태그</label>
        <input id="evt-state" type="text" value="${(d.stateTags || []).join(", ")}" />
      </div>
    </div>

    <div class="variable-section">
      <div class="panel-title">변수</div>

      <div class="variable-input-row">
        <label for="evt-rot">ROT</label>
        <input id="evt-rot" type="number" value="${d.variables?.rot ?? ""}" />
      </div>

      <div class="variable-input-row">
        <label for="evt-cap">CAP</label>
        <input id="evt-cap" type="number" value="${d.variables?.cap ?? ""}" />
      </div>

      <div class="variable-input-row">
        <label for="evt-var">VAR</label>
        <input id="evt-var" type="number" value="${d.variables?.var ?? ""}" />
      </div>
    </div>

    <div class="variable-section">
      <div class="panel-title">메모</div>
      <textarea id="evt-memo">${d.memo || ""}</textarea>
    </div>

    <div class="variable-actions">
      <button id="btn-save-event-editor">저장</button>
    </div>
  `;

  bindEventEditorEvents();
}

function saveEventDraft() {
  const d = uiState.eventDraft;
  if (!d) return;

  upsertEventEntry(d);
  bindGraphNodeEditorEvent();
  exitEventEditor();
}

function normalizeLayerSetEntry(set) {
  if (!set) return null;

  return {
    id: set.id || `SET-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: String(set.name || "").trim() || buildNextLayerSetName(),
    parentSetId: set.parentSetId || null,
    childSetIds: Array.isArray(set.childSetIds) ? [...set.childSetIds] : [],
    layerNames: Array.isArray(set.layerNames) ? [...set.layerNames] : [],
    memo: set.memo || "",
    description: set.description || "",
    createdAt: Number(set.createdAt || Date.now()),
    updatedAt: Number(set.updatedAt || Date.now()),
    lastOpenedAt: Number(set.lastOpenedAt || 0)
  };
}

function createLayerSetEntry(data = {}) {
  const entry = normalizeLayerSetEntry({
    id: data.id,
    name: data.name || buildNextLayerSetName(),
    parentSetId: data.parentSetId || null,
    childSetIds: data.childSetIds || [],
    layerNames: data.layerNames || [],
    memo: data.memo || "",
    description: data.description || "",
    createdAt: data.createdAt || Date.now(),
    updatedAt: data.updatedAt || Date.now(),
    lastOpenedAt: data.lastOpenedAt || 0
  });

  uiState.layerSets = Array.isArray(uiState.layerSets) ? uiState.layerSets : [];
  uiState.layerSets.push(entry);

  if (entry.parentSetId) {
    uiState.layerSets = uiState.layerSets.map((set) => {
      if (set.id !== entry.parentSetId) return normalizeLayerSetEntry(set);

      const nextChildIds = [...new Set([...(set.childSetIds || []), entry.id])];
      return normalizeLayerSetEntry({
        ...set,
        childSetIds: nextChildIds,
        updatedAt: Date.now()
      });
    });
  }

  recordLog?.({
    type: "SET_CREATE",
    scope: "LAYER",
    refId: entry.id,
    summary: `[SET] create: ${entry.name}`
  });

  saveLabState?.();
  return entry;
}

function getLayerSetById(setId) {
  return (uiState.layerSets || []).find((set) => set.id === setId) || null;
}

function collectDescendantLayerSetIds(rootSetId) {
  const result = [];
  const visited = new Set();

  function walk(setId) {
    if (!setId || visited.has(setId)) return;
    visited.add(setId);

    const set = getLayerSetById(setId);
    if (!set) return;

    result.push(setId);

    (set.childSetIds || []).forEach((childId) => {
      walk(childId);
    });
  }

  walk(rootSetId);
  return result;
}

function openLayerSetDeleteModal(setId) {
  const rootSet = getLayerSetById(setId);
  if (!rootSet) return;

  const collectedIds = collectDescendantLayerSetIds(setId);

  uiState.setDeleteModal = {
    open: true,
    rootSetId: setId,
    selectedSetIds: [...collectedIds],
    minDepth: 0,
    maxDepth: null
  };

  renderLayerSetDeleteModal();
  els.layerSetDeleteModal?.classList.remove("hidden");
}

function normalizeLayerEntry(layer) {
  if (!layer) return layer;

  const approvalState =
    layer.approvalState ||
    (layer.approved === true ? "approved" : "stored");

  return {
    ...layer,

    activeGroupIds: Array.isArray(layer.activeGroupIds)
      ? [...layer.activeGroupIds]
      : [],

    nodes: Array.isArray(layer.nodes)
      ? [...layer.nodes]
      : [],

    filter: layer.filter || {
      rotMin: null,
      capMax: null,
      varMin: null
    },

    approved: approvalState === "approved",
    approvalState,
    createdAt: Number(layer.createdAt || Date.now()),

  };
}

function getSortedLayerSets(parentSetId = null) {
  const sets = Array.isArray(uiState.layerSets) ? uiState.layerSets : [];

  return sets
    .filter((set) => (set.parentSetId || null) === parentSetId)
    .sort((a, b) => {
      const aTime = Number(a.lastOpenedAt || a.createdAt || 0);
      const bTime = Number(b.lastOpenedAt || b.createdAt || 0);
      return bTime - aTime;
    });
}

function openLayerSetDetail(setId) {
  if (!setId) return;

  uiState.layerSets = (uiState.layerSets || []).map((set) => {
    if (set.id !== setId) return normalizeLayerSetEntry(set);

    return normalizeLayerSetEntry({
      ...set,
      lastOpenedAt: Date.now(),
      updatedAt: Date.now()
    });
  });

  uiState.setExplorerState.viewMode = "detail";
  uiState.setExplorerState.selectedSetId = setId;

  renderLayerExplorerFullPage?.();
  saveLabState?.();
}

function createLayerSetFromCurrentSelection(parentSetId = null) {
  const selectedLayerNames =
    Array.isArray(uiState.selectedLayerNames) && uiState.selectedLayerNames.length
      ? [...uiState.selectedLayerNames]
      : (uiState.currentLayerName ? [uiState.currentLayerName] : []);

  const entry = createLayerSetEntry({
    name: buildNextLayerSetName(),
    parentSetId,
    layerNames: selectedLayerNames,
    memo: "",
    description: ""
  });

  if (!entry) return null;

  uiState.setExplorerState.viewMode = "detail";
  uiState.setExplorerState.selectedSetId = entry.id;

  renderLayerExplorerFullPage?.();
  saveLabState?.();
  return entry;
}

function renderLayerSetCards(parentSetId = null) {
  const sets = getSortedLayerSets(parentSetId);

  if (!sets.length) {
    return `<div class="empty-state">집합 없음</div>`;
  }

  return sets.map((set) => {
    const layerCount = Array.isArray(set.layerNames) ? set.layerNames.length : 0;
    const childCount = Array.isArray(set.childSetIds) ? set.childSetIds.length : 0;

    return `
      <div class="layer-set-card" data-layer-set-id="${set.id}">
        <div class="layer-set-card-title" data-layer-set-name="${set.id}">
          ${set.name}
        </div>
        <div class="layer-set-card-sub">
          LAYER ${layerCount} / SET ${childCount}
        </div>
      </div>
    `;
  }).join("");
}

function renderLayerSetHomeView() {
  if (!els.layerExplorerFullSubview) return;

  els.layerExplorerFullSubview.innerHTML = `
    <div class="layer-set-head-actions">
      <button id="btn-create-layer-set-root" type="button">집합 만들기</button>
    </div>

    <div class="layer-set-container">
      ${renderLayerSetCards(null)}
    </div>
  `;

  document.getElementById("btn-create-layer-set-root")?.addEventListener("click", () => {
    openLayerSetCreateModal(null);
  });

  bindLayerSetCardEvents();
}

function renderLayerSetDetailView() {
  if (!els.layerExplorerFullSubview) return;

  const selectedSetId = uiState.setExplorerState?.selectedSetId || null;
  const set = (uiState.layerSets || []).find((x) => x.id === selectedSetId);

  if (!set) {
    els.layerExplorerFullSubview.innerHTML = `
      <div class="empty-state">집합을 찾을 수 없습니다.</div>
    `;
    return;
  }

  const layerCount = Array.isArray(set.layerNames) ? set.layerNames.length : 0;

  els.layerExplorerFullSubview.innerHTML = `
    <div class="layer-set-detail-head">
      <div class="layer-set-detail-title">${set.name}</div>
      <div class="layer-set-detail-sub">LAYER ${layerCount}</div>
    </div>

    <div class="layer-set-head-actions">
      <button id="btn-create-layer-set-child" type="button">집합 만들기</button>
<button id="btn-delete-layer-set" type="button">집합 삭제</button>
<button id="btn-add-layers-to-set" type="button">Layer 삽입</button>
      <button id="btn-back-layer-set-home" type="button">Back</button>
    </div>

    <div class="layer-set-meta">
      <input id="input-layer-set-memo" type="text" value="${escapeHtml(set.memo || "")}" placeholder="memo" />
      <textarea id="input-layer-set-description" placeholder="description">${escapeHtml(set.description || "")}</textarea>
      <button id="btn-save-layer-set-meta" type="button">저장</button>
    </div>

    <div class="layer-set-container">
      ${renderLayerSetCards(set.id)}
    </div>

    <div class="layer-set-layer-list">
      ${(set.layerNames || []).length
        ? set.layerNames.map((name) => `<div class="layer-set-layer-item">${name}</div>`).join("")
        : `<div class="empty-state">포함된 Layer 없음</div>`
      }
    </div>
  `;

  document.getElementById("btn-create-layer-set-child")?.addEventListener("click", () => {
    openLayerSetCreateModal(set.id);
  });

  document.getElementById("btn-back-layer-set-home")?.addEventListener("click", () => {
    uiState.setExplorerState.viewMode = "home";
    uiState.setExplorerState.selectedSetId = null;
    renderLayerExplorerFullPage?.();
    saveLabState?.();
  });

  document.getElementById("btn-save-layer-set-meta")?.addEventListener("click", () => {
    const memo = document.getElementById("input-layer-set-memo")?.value || "";
    const description = document.getElementById("input-layer-set-description")?.value || "";

    uiState.layerSets = (uiState.layerSets || []).map((item) => {
      if (item.id !== set.id) return normalizeLayerSetEntry(item);

      return normalizeLayerSetEntry({
        ...item,
        memo,
        description,
        updatedAt: Date.now()
      });
    });

    saveLabState?.();
  });

  document.getElementById("btn-add-layers-to-set")?.addEventListener("click", () => {
  addSelectedLayersToSet(set.id);
});

document.getElementById("btn-delete-layer-set")?.addEventListener("click", () => {
  openLayerSetDeleteModal(set.id);
});


  bindLayerSetCardEvents();
}

function bindLayerSetCreateModalControls() {
  if (els.layerSetCreateCancelBtn) {
    els.layerSetCreateCancelBtn.onclick = () => {
      closeLayerSetCreateModal();
    };
  }

  if (els.layerSetCreateConfirmBtn) {
    els.layerSetCreateConfirmBtn.onclick = () => {
      const parentSetId = uiState.setCreateModal?.parentSetId || null;
      const pendingName = uiState.setCreateModal?.pendingName || buildNextLayerSetName();

      createLayerSetFromCurrentSelection(parentSetId, pendingName);
      closeLayerSetCreateModal();
    };
  }
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function buildLayerSetTreeRows(rootSetId) {
  const rows = [];

  function walk(setId, depth = 0, guideMask = [], isLast = true) {
    const set = getLayerSetById(setId);
    if (!set) return;

    rows.push({
      id: set.id,
      name: set.name,
      depth,
      isLast,
      guideMask: [...guideMask],
      layerCount: Array.isArray(set.layerNames) ? set.layerNames.length : 0,
      childCount: Array.isArray(set.childSetIds) ? set.childSetIds.length : 0
    });

    const children = Array.isArray(set.childSetIds) ? [...set.childSetIds] : [];

    children.forEach((childId, index) => {
      const childIsLast = index === children.length - 1;

      walk(
        childId,
        depth + 1,
        [...guideMask, !isLast],
        childIsLast
      );
    });
  }

  walk(rootSetId, 0, [], true);
  return rows;
}

function filterLayerSetTreeRowsByDepth(rows = [], minDepth = 0, maxDepth = null) {
  return rows.filter((row) => {
    if (row.depth < minDepth) return false;
    if (maxDepth !== null && row.depth > maxDepth) return false;
    return true;
  });
}

function bindLayerSetDeleteModalControls() {
  if (els.layerSetDeleteCancelBtn) {
    els.layerSetDeleteCancelBtn.onclick = () => {
      closeLayerSetDeleteModal();
    };
  }

  const selectAllBtn = document.getElementById("btn-layer-set-delete-select-all");
  if (selectAllBtn) {
    selectAllBtn.onclick = () => {
      selectAllLayerSetDeleteItems();
    };
  }

  const clearAllBtn = document.getElementById("btn-layer-set-delete-clear-all");
  if (clearAllBtn) {
    clearAllBtn.onclick = () => {
      clearAllLayerSetDeleteItems();
    };
  }

  if (els.layerSetDeleteConfirmBtn) {
    els.layerSetDeleteConfirmBtn.onclick = () => {
      deleteSelectedLayerSets();
    };
  }
}

function bindLayerSetCardEvents() {
  document.querySelectorAll("[data-layer-set-id]").forEach((card) => {
    card.onclick = () => {
      const setId = card.dataset.layerSetId;
      if (!setId) return;
      openLayerSetDetail(setId);
    };
  });

  document.querySelectorAll("[data-layer-set-name]").forEach((title) => {
    title.ondblclick = (e) => {
      e.stopPropagation();

      const setId = title.dataset.layerSetName;
      const set = (uiState.layerSets || []).find((x) => x.id === setId);
      if (!set) return;

      const input = document.createElement("input");
      input.type = "text";
      input.value = set.name;
      input.className = "layer-set-title-input";

      input.onkeydown = (evt) => {
        if (evt.key === "Enter") {
          const nextName = String(input.value || "").trim() || set.name;

          uiState.layerSets = (uiState.layerSets || []).map((item) => {
            if (item.id !== setId) return normalizeLayerSetEntry(item);

            return normalizeLayerSetEntry({
              ...item,
              name: nextName,
              updatedAt: Date.now()
            });
          });

          renderLayerExplorerFullPage?.();
          saveLabState?.();
        }
      };

      input.onblur = () => {
        renderLayerExplorerFullPage?.();
      };

      title.innerHTML = "";
      title.appendChild(input);
      input.focus();
      input.select();
    };
  });
}

function renderLayerExplorerFullPage() {
  if (!els.layerExplorerFullHome || !els.layerExplorerFullView) return;

  renderLayerExplorerFullMainTabs?.();

  const viewMode = uiState.layerExplorerState?.viewMode || "home";

  els.layerExplorerFullHome.classList.toggle("hidden", viewMode !== "home");
  els.layerExplorerFullView.classList.toggle("hidden", viewMode === "home");

  if (viewMode === "home") {
    return;
  }

  renderLayerExplorerFullInfo?.();

  if (viewMode === "time") {
    renderLayerExplorerTimeView?.();
    return;
  }

  if (viewMode === "set") {
    const setMode = uiState.setExplorerState?.viewMode || "home";

    if (setMode === "detail") {
      renderLayerSetDetailView?.();
      return;
    }

    renderLayerSetHomeView?.();
    return;
  }

  renderLayerExplorerStatusView?.();
}

function normalizeLayerSourceMeta(sourceMeta = {}) {
  return {
    sourceType: sourceMeta.sourceType || "manual",
    sourceIds: Array.isArray(sourceMeta.sourceIds) ? [...sourceMeta.sourceIds] : [],
    createdAt: sourceMeta.createdAt || Date.now(),
    updatedAt: Date.now(),

    category: sourceMeta.category || null,
    subcategory: sourceMeta.subcategory || null,
    originPath: Array.isArray(sourceMeta.originPath) ? [...sourceMeta.originPath] : [],
    originScope: sourceMeta.originScope || null,
    originTags: Array.isArray(sourceMeta.originTags) ? [...sourceMeta.originTags] : []
  };
}

function createLayerEntry(data) {
  if (!data) return null;

  const finalName = buildAutoLayerName({
    name: data.name,
    mode: data.mode,
    groupId: data.groupId ?? null,
    activeGroupIds: data.activeGroupIds || [],
    sourceMeta: data.sourceMeta || {},
    groupContext: data.groupContext || {},
    upperGroupCode: data.upperGroupCode || null,
    groupCode: data.groupCode || null
  });

const layer = normalizeLayerEntry({
  name: finalName,
  id: finalName,
  mode: data.mode,
  groupId: data.groupId ?? null,
  nodes: data.nodes || [],
  activeGroupIds: data.activeGroupIds || [],
  filter: data.filter || {
    rotMin: null,
    capMax: null,
    varMin: null
  },
  memo: data.memo || "",
  description: data.description || "",
  createdAt: data.createdAt || Date.now(),

  approved: false,
  approvalState: "stored",
  sourceMeta: data.sourceMeta || {}
});

  uiState.savedLayers.push(layer);

  recordLog?.({
    type: "LAYER_CREATE",
    scope: "LAYER",
    refId: layer.name,
    summary: `[LAYER] store: ${layer.name}`
  });

  renderLayerSystemState?.();
  saveLabState?.();
  return layer;
}

function getLayerMonthKey(layer) {
  const ts = Number(layer?.createdAt || 0);
  if (!ts) return "unknown";

  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function getLayerDayKey(layer) {
  const ts = Number(layer?.createdAt || 0);
  if (!ts) return "unknown";

  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function registerPatternExplorerEvents() {
  if (!window.cy) return;

  const cy = window.cy;

  if (cy._patternExplorerEventsBound) return;
  cy._patternExplorerEventsBound = true;

  cy.on("tap", "node", (evt) => {
    const exp = uiState.patternExplorer;
    if (!exp?.active) return;

    const node = evt.target;
    const nodeId = node.id();
    if (!nodeId) return;

    if (exp.hideMode === "node") {
      node.style("display", "none");
      renderPatternLinkExplorerUI();
      return;
    }

    if (!exp.tempEdgeMode) return;

    if (!Array.isArray(exp.tempEdgeChain)) {
      exp.tempEdgeChain = [];
    }
    if (!Array.isArray(exp.tempEdgeIds)) {
      exp.tempEdgeIds = [];
    }

    const chain = exp.tempEdgeChain;

    if (evt.originalEvent && evt.originalEvent.shiftKey) {
      exp.tempEdgeChain = [];
      chain.length = 0;
    }

    if (chain.length > 0) {
      const prev = chain[chain.length - 1];

      if (prev !== nodeId) {
        const edgeId = `temp-${prev}-${nodeId}-${Date.now()}`;

        if (cy.getElementById(edgeId).length === 0) {
          cy.add({
            group: "edges",
            data: {
              id: edgeId,
              source: prev,
              target: nodeId,
              type: "TEMP_TEST",
              label: "TEMP",
              relationTag: "UNKNOWN"
            }
          });

          const edge = cy.getElementById(edgeId);
          if (edge && edge.length > 0) {
            const index = exp.tempEdgeIds.length;
            const colors = ["#ffd43b", "#ff922b", "#ff6b6b", "#845ef7", "#4dabf7"];
            const color = colors[index % colors.length];

            edge.style({
              "line-color": color,
              "target-arrow-color": color,
              width: 3,
              "line-style": "dashed"
            });
          }

          exp.tempEdgeIds.push(edgeId);
        }
      }
    }

    chain.push(nodeId);
    exp.tempEdgeChain = chain;

    renderPatternLinkExplorerUI();
  });

  cy.on("tap", "edge", (evt) => {
    const exp = uiState.patternExplorer;
    if (!exp?.active) return;

    const edge = evt.target;
    const edgeId = edge.id();
    if (!edgeId) return;

    if (exp.hideMode === "edge") {
      edge.style("display", "none");
      renderPatternLinkExplorerUI();
      return;
    }

    uiState.selectedEdgeId = edgeId;
    uiState.selectedEventId = null;

    if (edge.data("type") === "TEMP_TEST") {
      openMainEdgeRelationEditor(edge);
    }
  });

  cy.on("mouseover", "edge", (evt) => {
    const edge = evt.target;
    if (edge.data("type") !== "TEMP_TEST") return;

    const exp = uiState.patternExplorer;
    if (!exp?.tempEdgeMode) return;

    const chainIds = new Set(exp.tempEdgeIds || []);

    cy.edges().forEach((e) => {
      if (!chainIds.has(e.id())) {
        e.style("opacity", 0.15);
      } else {
        e.style("opacity", 1);
        e.style("width", 4);
      }
    });
  });

  cy.on("mouseout", "edge", (evt) => {
    if (evt.target.data("type") !== "TEMP_TEST") return;

    cy.edges().forEach((e) => {
      e.style("opacity", 1);
      if (e.data("type") === "TEMP_TEST") {
        e.style("width", 3);
      }
    });
  });

  cy.on("tap", (evt) => {
    if (evt.target !== cy) return;

    const editor = document.getElementById("main-edge-relation-editor");
    if (editor) editor.remove();

    uiState.selectedEdgeId = null;
    uiState.selectedEventId = null;
  });
}

function undoLastTempEdge() {
  const exp = uiState.patternExplorer;
  if (!exp || !window.cy) return;

  const lastEdgeId = exp.tempEdgeIds?.pop();
  if (lastEdgeId) {
    const edge = cy.getElementById(lastEdgeId);
    if (edge && edge.length > 0) {
      cy.remove(edge);
    }
  }

  if (Array.isArray(exp.tempEdgeChain) && exp.tempEdgeChain.length > 0) {
    exp.tempEdgeChain.pop();
  }

  renderPatternLinkExplorerUI();
}

function clearAllTempEdges() {
  const exp = uiState.patternExplorer;
  if (!exp || !window.cy) return;

  (exp.tempEdgeIds || []).forEach((edgeId) => {
    const edge = cy.getElementById(edgeId);
    if (edge && edge.length > 0) {
      cy.remove(edge);
    }
  });

  exp.tempEdgeIds = [];
  exp.tempEdgeChain = [];

  renderPatternLinkExplorerUI();
}

function registerPatternFromLayer(layer, options = {}) {
  if (!layer) return null;

  const normalized = normalizeLayerEntry(layer);

  const pattern = {
    id: options.id || `PATTERN-LAYER-${Date.now()}`,
    type: options.type || "CUSTOM",
    name: options.name || normalized.name,
    nodes: [...normalized.nodes],
    groups: [...normalized.activeGroupIds], // 🔴 핵심
    memo: options.memo || normalized.memo || ""
  };

  const result = {
    pattern,
    probability: options.probability ?? 0.5,
    patternScore: options.patternScore ?? 0.5
  };

  return upsertPatternEntry(result);
}

/*
function registerSelectedLayerAsPattern(options = {}) {
  const layer = getCurrentLayerObject();
  if (!layer) return null;

  return registerPatternFromLayer(layer, options);
}
*/

function registerSelectedPatternAsGroupFromUI() {
  const selectedIds =
    Array.isArray(uiState.selectedPatternIds) && uiState.selectedPatternIds.length
      ? [...uiState.selectedPatternIds]
      : (uiState.selectedPatternId ? [uiState.selectedPatternId] : []);

  if (!selectedIds.length) return [];

  const drafts = [];

  selectedIds.forEach((patternId) => {
    const patternObj = uiState.patternMap?.get(patternId);
    const pattern = patternObj?.pattern || patternObj;
    if (!pattern) return;

    const patternNodeIds = [...new Set(
  Array.isArray(pattern.nodes) ? pattern.nodes.filter(Boolean) : []
)];

const centerNodeId = patternNodeIds[0] || null;
const nodeWeightMap = {};
const nodeRankMap = {};

patternNodeIds.forEach((nodeId, index) => {
  if (!nodeId) return;

  if (index === 0) {
    nodeWeightMap[nodeId] = 1;
    nodeRankMap[nodeId] = "core";
  } else if (index < 3) {
    nodeWeightMap[nodeId] = 0.78;
    nodeRankMap[nodeId] = "strong";
  } else {
    nodeWeightMap[nodeId] = 0.58;
    nodeRankMap[nodeId] = "related";
  }
});

const built = buildGroupsFromPattern(pattern, {
  mode: "single",
  centerNodeId,
  requiredNodeIds: centerNodeId ? [centerNodeId] : [],
  sourcePatternId: pattern.id || null,
  signatureTags: Array.isArray(pattern.tags) ? pattern.tags : [],
  purityScore: 1,
  contaminationScore: 0,
  importanceScore: Math.min(1, patternNodeIds.length / 10),
  cohesionScore: patternNodeIds.length > 1 ? 0.65 : 0.4,
  confidenceScore: 0.5,
  overlapScore: 0,
  nodeWeightMap,
  nodeRankMap,
  purityState: "unknown",
  contaminationState: "clean",
  theoryState: "draft"
});

    drafts.push(...built);
  });

  if (!drafts.length) return [];

  const groups = groupRegistry.registerGroups(drafts);

  groups.forEach((group) => {
    groupStore.set(group.id, group);
  });

  renderGroupPanel?.();
  renderSideMiniStatus?.();
  renderAllDataExplorer?.();
  saveLabState?.();

  recordLog?.({
    type: "GROUP_CREATE",
    scope: "GROUP",
    refId: groups[0]?.id || null,
    summary: `[GROUP] Pattern 기반 등록: ${groups.map((g) => g.id).join(", ")}`,
    payload: {
      sourcePatternIds: selectedIds,
      groupIds: groups.map((g) => g.id)
    }
  });

  return groups;
}

function ensureEntityEditState(entity) {
  if (!entity) return null;

  if (!entity.edit || typeof entity.edit !== "object") {
    entity.edit = {};
  }

  if (!Array.isArray(entity.edit.refs)) {
    entity.edit.refs = [];
  }

  if (!Array.isArray(entity.edit.adjustmentTags)) {
    entity.edit.adjustmentTags = [];
  }

  if (!Array.isArray(entity.edit.logs)) {
    entity.edit.logs = [];
  }

  return entity.edit;
}

function addEntityReference(entity, ref = {}) {
  const edit = ensureEntityEditState(entity);
  if (!edit) return null;

  const refType = ref.type || "GROUP";
  const refId = ref.id || ref.refId || null;

  if (!refId) return null;

  const entry = {
    id: `EREF-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type: refType,
    refId,
    relationTag: ref.relationTag || "RELATED",
    changeTriggerTags: Array.isArray(ref.changeTriggerTags)
  ? ref.changeTriggerTags.map((tag) => ({ ...tag }))
  : [],
    memo: ref.memo || "",
    createdAt: Date.now()
  };

  edit.refs.push(entry);

edit.logs.push({
  type: "ADD_REF",
  entryId: entry.id,
  refId: entry.refId,
  refType: entry.type,
  relationTag: entry.relationTag,
  changeTriggerTags: entry.changeTriggerTags.map((tag) => tag.tag),
  createdAt: entry.createdAt
});

  saveLabState?.();
  return entry;
}

function ensureEventNodeExists(eventData) {
  if (!eventData || !window.cy) return;

  const exists = window.cy.getElementById(eventData.id);
  if (exists && exists.length > 0) return;

  window.cy.add({
    group: "nodes",
    data: {
      id: eventData.id,
      label: eventData.name || eventData.id,
      relationTags: eventData.relationTags || [],
      stateTags: eventData.stateTags || [],
      rot: eventData.variables?.rot ?? null,
      cap: eventData.variables?.cap ?? null,
      var: eventData.variables?.var ?? null,
      memo: eventData.memo || "",
      stat: eventData.stat ?? "Alive",
sentiment: eventData.sentiment ?? "neutral",
    }
  });
}

function exitEventEditor() {
  uiState.rightPanelView = "network";
  uiState.editingEventId = null;
  uiState.eventDraft = null;

  renderRightPanelView();
  renderDetailPanel();
}

function bindPatternLinkExplorerControls() {
  if (!els) return;

  if (els.openPatternLinkExplorerBtn) {
    els.openPatternLinkExplorerBtn.onclick = () => {
      openPatternLinkExplorer();
    };
  }

  if (els.closePatternLinkExplorerBtn) {
    els.closePatternLinkExplorerBtn.onclick = () => {
      closePatternLinkExplorer();
    };
  }

  if (els.patternHideLayerNodesBtn) {
    els.patternHideLayerNodesBtn.onclick = () => {
      const ws = getPatternLinkWorkspace();
      ws.active = true;
      hideCurrentLayerElements("node");
      renderPatternLinkExplorerUI?.();
      saveLabState?.();
    };
  }

  if (els.patternHideLayerEdgesBtn) {
    els.patternHideLayerEdgesBtn.onclick = () => {
      const ws = getPatternLinkWorkspace();
      ws.active = true;
      hideCurrentLayerElements("edge");
      renderPatternLinkExplorerUI?.();
      saveLabState?.();
    };
  }

  if (els.patternResetVisibilityBtn) {
    els.patternResetVisibilityBtn.onclick = () => {
      resetExplorerVisibility();
      renderPatternLinkExplorerUI?.();
      saveLabState?.();
    };
  }

  if (els.patternRelayoutBtn) {
    els.patternRelayoutBtn.onclick = () => {
      reLayoutGraph();
    };
  }

  if (els.patternRelayoutDefaultBtn) {
    els.patternRelayoutDefaultBtn.onclick = () => {
      reLayoutGraphByMode("default");
    };
  }

  if (els.patternRelayoutTimeBtn) {
    els.patternRelayoutTimeBtn.onclick = () => {
      reLayoutGraphByMode("time");
    };
  }

  if (els.patternRelayoutFocusBtn) {
    els.patternRelayoutFocusBtn.onclick = () => {
      reLayoutGraphByMode("focus");
    };
  }

  if (els.patternLinkBtn) {
    els.patternLinkBtn.onclick = () => {
      enterPatternLinkPage();
    };
  }

  if (els.patternHideElementBtn) {
    els.patternHideElementBtn.onclick = () => {
      togglePatternHideElementBox();
    };
  }

  if (els.patternLayerHideBtn) {
    els.patternLayerHideBtn.onclick = () => {
      togglePatternLayerHideBox();
    };
  }

  if (els.patternRelationFilterBtn) {
    els.patternRelationFilterBtn.onclick = () => {
      togglePatternRelationFilterBox();
    };
  }

  if (els.patternHideNodeBtn) {
    els.patternHideNodeBtn.onclick = () => {
      setPatternLinkWorkspaceMode("hide-node");
      renderPatternLinkExplorerUI?.();
    };
  }

  if (els.patternHideEdgeBtn) {
    els.patternHideEdgeBtn.onclick = () => {
      setPatternLinkWorkspaceMode("hide-edge");
      renderPatternLinkExplorerUI?.();
    };
  }

  if (els.patternTempEdgeBtn) {
    els.patternTempEdgeBtn.onclick = () => {
      setPatternLinkWorkspaceMode("temp-edge");
      renderPatternLinkExplorerUI?.();
    };
  }

  if (els.patternTempBreakBtn) {
    els.patternTempBreakBtn.onclick = () => {
      breakPatternExplorerTempChain();
      renderPatternLinkExplorerUI?.();
      saveLabState?.();
    };
  }

  if (els.patternTempUndoBtn) {
    els.patternTempUndoBtn.onclick = () => {
      undoPatternExplorerTempEdge();
      renderPatternLinkExplorerUI?.();
      saveLabState?.();
    };
  }

  if (els.patternTempBacktrackBtn) {
    els.patternTempBacktrackBtn.onclick = () => {
      backtrackPatternExplorerTempChain();
      renderPatternLinkExplorerUI?.();
      saveLabState?.();
    };
  }

const relationFilterBox = document.getElementById("pattern-relation-filter-box");

if (relationFilterBox && !relationFilterBox.dataset.bound) {
  relationFilterBox.addEventListener("click", (e) => {
    const btn = e.target.closest(".edge-filter-btn");
    if (!btn) return;

    const filter = btn.dataset.edgeFilter || "ALL";
    const ws = getPatternLinkWorkspace();

    ws.edgeRelationFilter = filter;

    relationFilterBox
      .querySelectorAll(".edge-filter-btn")
      .forEach((x) => {
        x.classList.toggle("active", x.dataset.edgeFilter === filter);
      });

    renderPatternLinkExplorerStatus?.();
    saveLabState?.();
  });

  relationFilterBox.dataset.bound = "true";
}

}

function syncPatternExplorerMirrorButtons() {
  if (els.patternApplyToggleMiniBtn && els.patternApplyToggleBtn) {
    els.patternApplyToggleMiniBtn.textContent = els.patternApplyToggleBtn.textContent;
    els.patternApplyToggleMiniBtn.disabled = !!els.patternApplyToggleBtn.disabled;
    els.patternApplyToggleMiniBtn.classList.toggle(
      "active",
      els.patternApplyToggleBtn.classList.contains("active")
    );
  }

  if (els.patternCreateLayerMiniBtn && els.patternCreateLayerBtn) {
    els.patternCreateLayerMiniBtn.textContent = els.patternCreateLayerBtn.textContent;
    els.patternCreateLayerMiniBtn.disabled = !!els.patternCreateLayerBtn.disabled;
    els.patternCreateLayerMiniBtn.classList.toggle(
      "active",
      els.patternCreateLayerBtn.classList.contains("active")
    );
  }

  if (els.patternRegisterGroupMiniBtn && els.patternRegisterGroupBtn) {
    els.patternRegisterGroupMiniBtn.textContent = els.patternRegisterGroupBtn.textContent;
    els.patternRegisterGroupMiniBtn.disabled = !!els.patternRegisterGroupBtn.disabled;
    els.patternRegisterGroupMiniBtn.classList.toggle(
      "active",
      els.patternRegisterGroupBtn.classList.contains("active")
    );
  }

if (els.patternPromoteGroupMiniBtn && els.patternPromoteGroupBtn) {
  els.patternPromoteGroupMiniBtn.textContent = els.patternPromoteGroupBtn.textContent;
  els.patternPromoteGroupMiniBtn.disabled = !!els.patternPromoteGroupBtn.disabled;
  els.patternPromoteGroupMiniBtn.classList.toggle(
    "active",
    els.patternPromoteGroupBtn.classList.contains("active")
  );
}

}

function bindPatternMiniExplorerControls() {
  if (els.patternCompactToggleBtn) {
    els.patternCompactToggleBtn.onclick = () => {
      openPatternMiniExplorer();
      syncPatternExplorerMirrorButtons?.();
    };
  }

  if (els.closePatternMiniExplorerBtn) {
    els.closePatternMiniExplorerBtn.onclick = () => {
      closePatternMiniExplorer();
    };
  }

  if (els.patternApplyToggleMiniBtn) {
    els.patternApplyToggleMiniBtn.onclick = () => {
      const hasPattern =
        Array.isArray(uiState.selectedPatternIds)
          ? uiState.selectedPatternIds.length > 0
          : !!uiState.selectedPatternId;

      if (!hasPattern) return;

      flashExplorerAction(els.patternApplyToggleMiniBtn);

      if (els.patternApplyToggleBtn) {
        els.patternApplyToggleBtn.click();
      } else {
        if (uiState.patternApplied) {
          clearCurrentPatternAppliedView();
        } else {
          applyCurrentPatternToGraph();
        }
      }

      syncPatternExplorerMirrorButtons?.();
      renderPatternMiniExplorer?.();
    };
  }

if (els.patternCreateLayerMiniBtn && els.patternCreateLayerBtn) {
  els.patternCreateLayerMiniBtn.onclick = () => {
    els.patternCreateLayerBtn.click();
  };
}

if (els.patternRegisterGroupBtn) {
  els.patternRegisterGroupBtn.onclick = () => {
    const groups = registerSelectedPatternAsGroupFromUI();
    if (!groups.length) return;

    if (els.groupPanel) {
      els.groupPanel.classList.remove("hidden");
    }

    syncPatternExplorerMirrorButtons?.();
    renderPatternMiniExplorer?.();
  };
}

  if (els.closePatternPageBtn) {
    els.closePatternPageBtn.onclick = () => {
      flashExplorerAction(els.closePatternPageBtn);
      closePatternPageCompletely();
    };
  }

  if (els.patternApplyToggleBtn) {
    els.patternApplyToggleBtn.onclick = () => {
      const hasPattern =
        Array.isArray(uiState.selectedPatternIds)
          ? uiState.selectedPatternIds.length > 0
          : !!uiState.selectedPatternId;

      if (!hasPattern) return;

      if (uiState.patternApplied) {
        clearCurrentPatternAppliedView();
      } else {
        applyCurrentPatternToGraph();
      }

      syncPatternExplorerMirrorButtons?.();
      renderPatternMiniExplorer?.();
    };
  }

if (els.patternCreateLayerBtn) {
  els.patternCreateLayerBtn.onclick = () => {
    openPatternLayerExplorer();
    syncPatternExplorerMirrorButtons?.();
  };
}

}

function bindEventEditorEvents() {
  const d = uiState.eventDraft;
  if (!d) return;

  const name = document.getElementById("evt-name");
  const rel = document.getElementById("evt-rel");
  const state = document.getElementById("evt-state");
  const rot = document.getElementById("evt-rot");
  const cap = document.getElementById("evt-cap");
  const vari = document.getElementById("evt-var");
  const memo = document.getElementById("evt-memo");
  const saveBtn = document.getElementById("btn-save-event-editor");
  const stat = document.getElementById("evt-stat");
const sentiment = document.getElementById("evt-sentiment");

  if (name) name.oninput = () => d.name = name.value;
  if (rel) rel.oninput = () => {
    d.relationTags = rel.value.split(",").map(s => s.trim()).filter(Boolean);
  };
  if (state) state.oninput = () => {
    d.stateTags = state.value.split(",").map(s => s.trim()).filter(Boolean);
  };
  if (rot) rot.oninput = () => {
    if (!d.variables) d.variables = {};
    d.variables.rot = rot.value === "" ? null : Number(rot.value);
  };
  if (cap) cap.oninput = () => {
    if (!d.variables) d.variables = {};
    d.variables.cap = cap.value === "" ? null : Number(cap.value);
  };
  if (vari) vari.oninput = () => {
    if (!d.variables) d.variables = {};
    d.variables.var = vari.value === "" ? null : Number(vari.value);
  };
  if (memo) memo.oninput = () => d.memo = memo.value;

  if (saveBtn) {
    saveBtn.onclick = () => {
      saveEventDraft();
    };
  }

  if (els.closeEventEditorBtn) {
    els.closeEventEditorBtn.onclick = () => {
      exitEventEditor();
    };
  }
  
  if (stat) stat.oninput = () => d.stat = stat.value;
if (sentiment) sentiment.oninput = () => d.sentiment = sentiment.value;
}

function normalizeTagList(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim()).filter(Boolean);
  }
  return String(value)
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function normalizeEventEntry(input = {}) {
  return {
    id: input.id || generateEventId(),
    name: String(input.name || "").trim(),
    relationTags: normalizeTagList(input.relationTags),
    stateTags: normalizeTagList(input.stateTags),
    variables: {
      rot: input.variables?.rot ?? null,
      cap: input.variables?.cap ?? null,
      var: input.variables?.var ?? null
    },
    memo: String(input.memo || ""),
    stat: input.stat ?? "Alive",
    sentiment: input.sentiment ?? "neutral"
  };
}

function validateEventEntry(eventData) {
  const errors = [];

  if (!eventData.id) errors.push("EVENT id 누락");
  if (!eventData.name) errors.push(`EVENT ${eventData.id}: name 누락`);

  const stat = String(eventData.stat || "").toLowerCase();
  if (stat && !["alive", "death", "archived"].includes(stat)) {
    errors.push(`EVENT ${eventData.id}: stat 값 이상 (${eventData.stat})`);
  }

  ["rot", "cap", "var"].forEach((key) => {
    const v = eventData.variables?.[key];
    if (v !== null && v !== undefined && Number.isNaN(Number(v))) {
      errors.push(`EVENT ${eventData.id}: variables.${key} 숫자 아님`);
    }
  });

  return errors;
}

function upsertEventEntry(input, options = {}) {
  const eventData = normalizeEventEntry(input);
  const errors = validateEventEntry(eventData);

  if (errors.length) {
    uiState.validationErrors = [...(uiState.validationErrors || []), ...errors];
    console.warn("EVENT validation failed:", errors, eventData);
    if (options.strict) return null;
  }

  const events = getAllEvents();
  const idx = events.findIndex((e) => e.id === eventData.id);
  const isUpdate = idx !== -1;

  if (isUpdate) {
    events[idx] = eventData;
  } else {
    events.push(eventData);
  }

  ensureEventNodeExists(eventData);
  applyAllEventsToGraph();

  recordLog({
    type: isUpdate ? "EVENT_UPDATE" : "EVENT_CREATE",
    scope: "EVENT",
    refId: eventData.id,
    summary: `[EVENT] ${isUpdate ? "수정" : "생성"}: ${eventData.name || eventData.id}`,
    payload: eventData
  });

  refreshGraphState();
  renderDetailPanel();
  renderSideMiniStatus();
  saveLabState();

  return eventData;
}

function updateGraphStats() {
  if (!window.cy) return;

  uiState.graphStats = {
    nodeCount: cy.nodes().length,
    edgeCount: cy.edges().length,
    graphCapped: false
  };
}

function applyGraphCaps() {
  if (!window.cy) return;

  const nodeCount = cy.nodes().length;
  const edgeCount = cy.edges().length;

  if (
    nodeCount <= LAB_CONFIG.graph.maxNodesSoft &&
    edgeCount <= LAB_CONFIG.graph.maxEdgesSoft
  ) {
    uiState.graphStats.graphCapped = false;
    return;
  }

  uiState.graphStats.graphCapped = true;

  const rankedNodes = cy.nodes().toArray().sort((a, b) => {
    const av = Number(a.data("var") || 0) + Number(a.data("rot") || 0) * 0.2;
    const bv = Number(b.data("var") || 0) + Number(b.data("rot") || 0) * 0.2;
    return bv - av;
  });

  const keepIds = new Set(
    rankedNodes
      .slice(0, LAB_CONFIG.graph.maxNodesSoft)
      .map((node) => node.id())
  );

  cy.nodes().forEach((node) => {
    if (!keepIds.has(node.id())) {
      node.addClass("node-dimmed");
    }
  });

  cy.edges().forEach((edge) => {
    const visible =
      keepIds.has(edge.source().id()) &&
      keepIds.has(edge.target().id());

    if (!visible) {
      edge.addClass("edge-dimmed");
    }
  });
}

function togglePatternHideElementBox() {
  const box = document.getElementById("pattern-hide-element-box");
  if (!box) return;
  box.classList.toggle("hidden");
}

function togglePatternLayerHideBox() {
  const box = document.getElementById("pattern-layer-hide-box");
  if (!box) return;
  box.classList.toggle("hidden");
}

function togglePatternRelationFilterBox() {
  const box = document.getElementById("pattern-relation-filter-box");
  if (!box) return;
  box.classList.toggle("hidden");
}

// Explorer ON/OFF
function togglePatternExplorer() {
  uiState.patternExplorer.active = !uiState.patternExplorer.active;
}

// hide mode
function setHideMode(mode) {
  uiState.patternExplorer.hideMode = mode; // "node" or "edge"
}

function setPatternExplorerMode(mode) {
  const exp = uiState.patternExplorer;
  if (!exp) return;

  exp.active = true;
  exp.hideMode = null;
  exp.tempEdgeMode = false;
  exp.tempEdgeChain = [];

  if (mode === "hide-node") {
    exp.hideMode = "node";
  } else if (mode === "hide-edge") {
    exp.hideMode = "edge";
  } else if (mode === "temp-edge") {
    exp.tempEdgeMode = true;
  }

  if (window.cy) {
    cy.nodes().forEach((node) => {
      node.grabbable(!exp.tempEdgeMode);
    });
  }

  renderPatternLinkExplorerUI();
}

// temp edge mode
function toggleTempEdgeMode() {
  const exp = uiState.patternExplorer;

  exp.tempEdgeMode = !exp.tempEdgeMode;
  exp.tempEdgeChain = [];
}

function hideCurrentLayerElements(type) {
  const layer = getCurrentLayer();
  if (!layer || !layer.nodes) return;

  const exp = uiState.patternExplorer;

  if (type === "node") {
    layer.nodes.forEach(id => {
      const el = cy.getElementById(id);
      if (!el || el.empty()) return;

      exp.hiddenNodeIds.add(id);
      el.style("display", "none");
    });
  }

  if (type === "edge") {
    cy.edges().forEach(edge => {
      const s = edge.source().id();
      const t = edge.target().id();

      if (layer.nodes.includes(s) && layer.nodes.includes(t)) {
        exp.hiddenEdgeIds.add(edge.id());
        edge.style("display", "none");
      }
    });
  }
}

function resetExplorerVisibility() {
  const exp = uiState.patternExplorer;
  if (!exp || !window.cy) return;

  exp.hiddenNodeIds.clear();
  exp.hiddenEdgeIds.clear();
  exp.hideMode = null;
  exp.tempEdgeMode = false;
  exp.tempEdgeChain = [];

  cy.nodes().forEach((n) => n.style("display", "element"));
  cy.edges().forEach((e) => e.style("display", "element"));

  if (window.cy) {
  cy.nodes().forEach((node) => node.grabbable(true));
}

  renderPatternLinkExplorerUI();
  renderPatternLinkPanel();
}

function buildEventDraftFromSources(eventId) {
  const saved = getEventById(eventId);
  if (saved) {
    return structuredClone
      ? structuredClone(saved)
      : JSON.parse(JSON.stringify(saved));
  }

  const cyNode = window.cy ? window.cy.getElementById(eventId) : null;
  const cyData =
    cyNode && cyNode.length > 0
      ? cyNode.data()
      : null;

  const engineEvent = engine?.getEvent ? engine.getEvent(eventId) : null;

  return {
    id: eventId,
    name:
      cyData?.label ||
      engineEvent?.label ||
      engineEvent?.name ||
      "",
    relationTags:
      cyData?.relationTags ||
      engineEvent?.relationTags ||
      [],
    stateTags:
      cyData?.stateTags ||
      engineEvent?.stateTags ||
      [],
    variables: {
      rot: cyData?.rot ?? engineEvent?.rot ?? null,
      cap: cyData?.cap ?? engineEvent?.cap ?? null,
      var: cyData?.var ?? engineEvent?.var ?? null
    },
    memo:
      cyData?.memo ||
      engineEvent?.memo ||
      "",
    stat:
      cyData?.stat ??
      engineEvent?.stat ??
      "Alive",
    sentiment:
      cyData?.sentiment ??
      engineEvent?.sentiment ??
      "neutral"
  };
}

function buildGroupsFromPatternUI(pattern) {
  if (!pattern || !pattern.nodes || pattern.nodes.length === 0) return [];

  const groups = [];

  pattern.nodes.forEach((centerId, i) => {
    const related = pattern.nodes.filter((id) => id !== centerId);

    groups.push({
      id: `GROUP-${pattern.id}-${i}`,
      patternId: pattern.id,
      center: centerId,
      nodes: related
    });
  });

  return groups;
}

function buildGroupsFromEvent(eventId) {
  const edges = engine.getEdges() || [];

  const buckets = new Map();

  edges.forEach((e) => {
    let other = null;

    if (e.from === eventId) other = e.to;
    else if (e.to === eventId) other = e.from;
    else return;

    const type = e.type || "RELATED";

    if (!buckets.has(type)) {
      buckets.set(type, []);
    }

    buckets.get(type).push(other);
  });

  const groups = [];

  buckets.forEach((nodes, type, index) => {
    groups.push({
      id: `GROUP-EVT-${eventId}-${type}`,
      center: eventId,
      edgeType: type,
      nodes: [...new Set(nodes)]
    });
  });

  groups.forEach((g) => groupStore.set(g.id, g));

  return groups;
}

function renderPatternLinkExplorerStatus() {
  if (!els.patternLinkExplorerStatus) return;

  const ws = getPatternLinkWorkspace();
  if (!ws) {
    els.patternLinkExplorerStatus.textContent = "OFF";
    return;
  }

  const relationFilter = ws.edgeRelationFilter || "ALL";
  const hiddenNodeCount = ws.hiddenNodeIds?.size || 0;
  const hiddenEdgeCount = ws.hiddenEdgeIds?.size || 0;
  const chainCount = ws.tempEdgeChain?.length || 0;
  const tempEdgeCount = ws.tempEdgeIds?.length || 0;

  const tail = ` / relation: ${relationFilter}`;

  if (!ws.active) {
    els.patternLinkExplorerStatus.textContent =
      `OFF / nodes: ${hiddenNodeCount} / edges: ${hiddenEdgeCount}${tail}`;
    return;
  }

  if (ws.tempEdgeMode) {
    els.patternLinkExplorerStatus.textContent =
      `TEMP EDGE / chain: ${chainCount} / temp edges: ${tempEdgeCount} / hidden nodes: ${hiddenNodeCount} / hidden edges: ${hiddenEdgeCount}${tail}`;
    return;
  }

  if (ws.hideMode === "node") {
    els.patternLinkExplorerStatus.textContent =
      `HIDE NODE / hidden nodes: ${hiddenNodeCount} / hidden edges: ${hiddenEdgeCount}${tail}`;
    return;
  }

  if (ws.hideMode === "edge") {
    els.patternLinkExplorerStatus.textContent =
      `HIDE EDGE / hidden nodes: ${hiddenNodeCount} / hidden edges: ${hiddenEdgeCount}${tail}`;
    return;
  }

  els.patternLinkExplorerStatus.textContent =
    `ON / hidden nodes: ${hiddenNodeCount} / hidden edges: ${hiddenEdgeCount}${tail}`;
}

function renderPatternLinkExplorerButtons() {
  if (!els) return;

  const ws = getPatternLinkWorkspace();
  if (!ws) return;

  const buttons = [
    els.patternHideNodeBtn,
    els.patternHideEdgeBtn,
    els.patternTempEdgeBtn
  ];

  buttons.forEach((btn) => {
    if (!btn) return;
    btn.classList.remove("active");
  });

  if (els.patternHideNodeBtn && ws.active && ws.hideMode === "node") {
    els.patternHideNodeBtn.classList.add("active");
  }

  if (els.patternHideEdgeBtn && ws.active && ws.hideMode === "edge") {
    els.patternHideEdgeBtn.classList.add("active");
  }

  if (els.patternTempEdgeBtn && ws.active && ws.tempEdgeMode) {
    els.patternTempEdgeBtn.classList.add("active");
  }
}

function renderPatternLinkExplorerUI() {
  renderPatternLinkExplorerStatus();
  syncPatternLinkRelationFilterButtons();
  renderPatternLinkExplorerButtons();

  const ws = getPatternLinkWorkspace();

  if (els.patternTempChainPreview) {
    const chain = ws?.tempEdgeChain || [];
    els.patternTempChainPreview.textContent =
      chain.length ? `chain: ${chain.join(" → ")}` : "chain: -";
  }
}

function openPatternLinkExplorer() {
  const ws = getPatternLinkWorkspace();
  if (!els.patternLinkExplorer) return;

  ws.open = true;
  ws.active = true;

  els.patternLinkExplorer.style.display = "";
  els.patternLinkExplorer.classList.remove("hidden");
  els.patternLinkExplorer.style.position = "fixed";

  if (!els.patternLinkExplorer.dataset.moved) {
    els.patternLinkExplorer.style.top = "140px";
    els.patternLinkExplorer.style.right = "24px";
    els.patternLinkExplorer.style.left = "auto";
  }

  renderPatternLinkExplorerUI?.();
  syncPatternLinkRelationFilterButtons?.();
  renderPatternLinkListBox?.();
  renderPatternLinkDetail?.();

  refreshGraphState?.();
  saveLabState?.();
}

function closePatternLinkExplorer() {
  const ws = getPatternLinkWorkspace();
  if (!els.patternLinkExplorer) return;

  ws.open = false;
  ws.active = false;

  els.patternLinkExplorer.classList.add("hidden");
  els.patternLinkExplorer.style.display = "none";

  refreshGraphState?.();
  saveLabState?.();
}

function applyTimelineExplorerPreviewToMainGraph() {
  if (!window.cy) return;
  if (!uiState.timelineExplorer?.open || !uiState.timelineExplorer?.active) return;

  const events = getTimelineEvents?.() || [];
  if (!events.length) return;

  const index = Math.max(0, Math.min(uiState.timelineIndex || 0, events.length - 1));
  const current = events[index];
  const currentId = current?.id || null;

  if (currentId) {
    cy.nodes().forEach((node) => {
      if (node.id() === currentId) {
        node.style("border-width", 5);
        node.style("border-color", "#ffd54f");
        node.style("opacity", 1);
      }
    });
  }

  cy.edges().forEach((edge) => {
    if (edge.data("kind") === "temp-timeline" || edge.data("type") === "TEMP_TIMELINE") {
      edge.style("line-color", "#ffd43b");
      edge.style("target-arrow-color", "#ffd43b");
      edge.style("width", 3);
      edge.style("opacity", 1);
    }
  });
}

function applyExplorerPreviewsToMainGraph() {
  if (!window.cy) return;

  if (uiState.timelineExplorer?.open && uiState.timelineExplorer?.active) {
    applyTimelineExplorerPreviewToMainGraph?.();
  }

  if (uiState.relationExplorer?.open && uiState.relationExplorer?.active) {
    recomputeRelationExplorerWeights?.();
    applyRelationExplorerFocusToGraph?.();
  }

  if (uiState.patternLinkWorkspace?.open && uiState.patternLinkWorkspace?.active) {
    applyPatternLinkWorkspaceToMainGraphPreview?.();
  }
}

function openPatternLinkPanel() {
  if (!els.patternLinkPanel) return;

  els.patternLinkPanel.classList.remove("hidden");
  renderPatternLinkPanel();
}

function closePatternLinkPanel() {
  if (!els.patternLinkPanel) return;

  els.patternLinkPanel.classList.add("hidden");
}

function renderPatternLinkPanel() {

  console.log("RENDER PL PANEL HARD TEST");

if (els.patternLinkListBox) {
  els.patternLinkListBox.innerHTML = `
    <div style="padding:12px; border:2px solid blue; font-weight:700;">
      HARD TEST: renderPatternLinkPanel reached
    </div>
  `;
}

  renderPatternLinkCompareBox();
  renderPatternLinkInspectBox();
  renderPatternLinkListBox();
}                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 

function renderPatternLinkInspectBox() {
  if (!els.patternLinkInspectBox) return;

  const currentLayer = getCurrentLayerObject?.() || null;
  const selectedGroup = getPatternLinkSelectedGroup();
  const plState = uiState.patternLinkPageState || {};

  els.patternLinkInspectBox.innerHTML = `
    <div class="plp-row"><span>mode</span><b>${uiState.mode || "-"}</b></div>
    <div class="plp-row"><span>layer</span><b>${currentLayer?.name || uiState.currentLayerName || "-"}</b></div>
    <div class="plp-row"><span>pattern</span><b>${uiState.selectedPatternId || "-"}</b></div>
    <div class="plp-row"><span>group</span><b>${selectedGroup ? (selectedGroup.label || selectedGroup.name || selectedGroup.id) : "-"}</b></div>
    <div class="plp-row"><span>event</span><b>${plState.selectedNodeId || uiState.selectedEventId || "-"}</b></div>
    <div class="plp-row"><span>active groups</span><b>${(uiState.activeGroupIds || []).length}</b></div>
  `;
}

function renderPatternLinkLayerOptions() {

  const ws = getPatternLinkWorkspace();

  if (!els.patternLinkLayerSelect) return;

  const layers = uiState.savedLayers || [];

  const options = [
    `<option value="">선택 안 함</option>`,
    ...layers.map((layer) => {
      const selected =
        getPatternLinkWorkspace().loadedLayerName === layer.name ? "selected" : "";
      return `<option value="${layer.name}" ${selected}>${layer.name}</option>`;
    })
  ];

  els.patternLinkLayerSelect.innerHTML = options.join("");
}

function renderPatternLinkListBox() {
  if (!els.patternLinkListBox) return;

  const ws = getPatternLinkWorkspace();
  const hiddenNodeIds = [...(ws.hiddenNodeIds || [])];
  const activeGroupIds = uiState.patternLinkPageState?.activeGroupIds || [];
  const activeSet = new Set(activeGroupIds);

  const hiddenNodeHtml = hiddenNodeIds.length
    ? hiddenNodeIds.map((id) => `
        <button class="plp-item-btn" data-plp-event-id="${id}">
          EVENT · ${id}
        </button>
      `).join("")
    : `<div class="empty-state">숨긴 노드 없음</div>`;

  const allGroupIds = [...groupStore.keys()];

  const groupHtml = allGroupIds.length
    ? allGroupIds.map((id) => {
        const group = groupStore.get(id);
        const isActive = activeSet.has(id);

        return `
          <button class="plp-item-btn ${isActive ? "active" : ""}" data-plp-group-id="${id}">
            ${isActive ? "ON" : "OFF"} · GROUP · ${group?.name || id}
          </button>
        `;
      }).join("")
    : `<div class="empty-state">등록된 그룹 없음</div>`;

  els.patternLinkListBox.innerHTML = `
    <div class="plp-subtitle">Hidden Nodes</div>
    <div class="plp-list-block">${hiddenNodeHtml}</div>

    <div class="plp-subtitle">Groups</div>
    <div class="plp-list-block">${groupHtml}</div>
  `;

els.patternLinkListBox.onclick = (e) => {
  const groupBtn = e.target.closest("[data-plp-group-id]");
  const eventBtn = e.target.closest("[data-plp-event-id]");

  console.log("PL LIST CLICK", {
    target: e.target,
    groupId: groupBtn?.dataset?.plpGroupId || null,
    eventId: eventBtn?.dataset?.plpEventId || null
  });

  if (groupBtn) {
    e.preventDefault();
    e.stopPropagation();

    const groupId = groupBtn.dataset.plpGroupId;
    console.log("PL group delegated click", groupId);

    if (!groupId) return;
    togglePatternLinkPageGroupActive(groupId);
    return;
  }

  if (eventBtn) {
    e.preventDefault();
    e.stopPropagation();

    const eventId = eventBtn.dataset.plpEventId;
    console.log("PL event delegated click", eventId);

    if (!eventId) return;
    jumpToPatternLinkEvent(eventId);
    renderPatternLinkPanel();
  }
};

  console.log("PL LIST RENDER");
console.log("PL list buttons", els.patternLinkListBox.querySelectorAll("[data-plp-group-id]").length);

}

function renderPatternCandidates(results) {
  console.log("RENDER RELATED PANEL", els.patternDetailPanel);
  const panel = els.patternDetailPanel;
  if (!panel) return;

  if (!results || results.length === 0) {
    panel.innerHTML = `
<b>[RELATED PATTERNS]</b><br><br>
연관 패턴이 없습니다.
`;
    return;
  }

  let html = `<b>[RELATED PATTERNS]</b><br><br>`;

  results.forEach((r, i) => {
    const p = r.pattern;
    const mem = getPatternMemory(p);

    const seenCount = mem?.discovery?.seenCount ?? 0;
    const state = mem?.state?.state ?? "-";
    const scoreTrend = mem?.trend?.scoreTrend ?? "-";
    const displayId = getPatternDisplayId(p);

    html += `
<div class="mini-pattern-card" data-pattern-id="${p.id}">
  <b>${displayId} ${p.type}</b><br>
  Nodes: ${p.nodes.join(", ")}<br>
  Probability: ${r.probability.toFixed(2)}<br>
  Seen: ${seenCount} / State: ${state} / Trend: ${scoreTrend}<br><br>

  <div class="mini-pattern-actions">
    <button class="btn-related-focus" data-pattern-id="${p.id}">Pattern 이동</button>
    <button class="btn-related-rebuild" data-pattern-id="${p.id}">Event 기준 재탐색</button>
  </div>
</div>
`;
  });

  panel.innerHTML = html;

  const focusBtns = panel.querySelectorAll(".btn-related-focus");
  const rebuildBtns = panel.querySelectorAll(".btn-related-rebuild");

  focusBtns.forEach((btn) => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const patternId = btn.dataset.patternId;
      selectPattern(patternId);
    };
  });

  rebuildBtns.forEach((btn) => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const patternId = btn.dataset.patternId;
      rebuildGroupsFromPatternCandidate(patternId);
    };
  });
}

// 테스트용 더미 데이터 (함수)

function seedTestEvents(count = 100) {
  for (let i = 0; i < count; i++) {
    upsertEventEntry({
      id: `EVT-SEED-${String(i + 1).padStart(4, "0")}`,
      name: `Seed Event ${i + 1}`,
      relationTags: i % 2 === 0 ? ["seed", "test"] : ["seed"],
      stateTags: i % 3 === 0 ? ["watch"] : [],
      variables: {
        rot: Math.floor(Math.random() * 20),
        cap: Math.floor(Math.random() * 1000),
        var: Math.floor(Math.random() * 50)
      },
      memo: "seed data",
      stat: i % 10 === 0 ? "Death" : "Alive",
      sentiment: i % 2 === 0 ? "bullish" : "neutral"
    });
  }
}

function seededRand(seedObj) {
  seedObj.value = (seedObj.value * 1664525 + 1013904223) % 4294967296;
  return seedObj.value / 4294967296;
}

function createSeedEvent(index, rng) {
  const bullishRatio = LAB_CONFIG.seed.bullishRatio;
  const bearishRatio = LAB_CONFIG.seed.bearishRatio;
  const deathRatio = LAB_CONFIG.seed.deathRatio;

  const roll = seededRand(rng);
  const stat = roll < deathRatio ? "Death" : "Alive";

  let sentiment = "neutral";
  if (roll < bullishRatio) sentiment = "bullish";
  else if (roll < bullishRatio + bearishRatio) sentiment = "bearish";

  const rot = Math.floor(seededRand(rng) * 18) + 1;
  const cap = Math.floor(seededRand(rng) * 800) + 50;
  const vari = Math.floor(seededRand(rng) * 40);

  return {
    id: `EVT-SEED-${String(index + 1).padStart(4, "0")}`,
    name: `Seed Event ${index + 1}`,
    relationTags: index % 2 === 0 ? ["seed", "test"] : ["seed"],
    stateTags: stat === "Death" ? ["archive"] : ["watch"],
    variables: {
      rot,
      cap,
      var: vari
    },
    memo: "seed data",
    stat,
    sentiment
  };
}

function createSeedEdges(count, rng) {
  const edges = [];
  const clusterSize = LAB_CONFIG.seed.clusterSize;

  for (let i = 0; i < count; i++) {
    const source = `EVT-SEED-${String(i + 1).padStart(4, "0")}`;

    for (let j = 1; j <= 2; j++) {
      const targetIndex = i + j;
      if (targetIndex >= count) continue;

      const target = `EVT-SEED-${String(targetIndex + 1).padStart(4, "0")}`;

      edges.push({
  id: `EDGE-SEED-${i}-${targetIndex}`,
  from: source,
  to: target,
  source,
  target,
  type: j === 1 ? "CAUSE" : "RELATED",
  strength: Number((0.35 + seededRand(rng) * 0.6).toFixed(2)),
  label: j === 1 ? "CAUSE" : "RELATED"
});
    }

    if (i % clusterSize === 0 && i + clusterSize < count) {
      const clusterTarget = `EVT-SEED-${String(i + clusterSize).padStart(4, "0")}`;
      edges.push({
  id: `EDGE-SEED-CLUSTER-${i}`,
  from: source,
  to: clusterTarget,
  source,
  target: clusterTarget,
  type: "CLUSTER",
  strength: Number((0.45 + seededRand(rng) * 0.45).toFixed(2)),
  label: "CLUSTER"
});
    }
  }

  return edges;
}

function seedTestData(count = LAB_CONFIG.seed.defaultCount, seed = 42) {
  const rng = { value: seed >>> 0 };

  for (let i = 0; i < count; i++) {
    upsertEventEntry(createSeedEvent(i, rng), { strict: false });
  }

  const edges = createSeedEdges(count, rng);
  edges.forEach((edge) => {
    const exists = cy.getElementById(edge.id);
    if (exists && exists.length > 0) return;

    cy.add({
  group: "edges",
  data: {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: edge.type,
    strength: edge.strength,
    label: edge.label
  }
});
  });

  recordLog({
    type: "SEED_GENERATE",
    scope: "GRAPH",
    refId: `SEED-${count}`,
    summary: `[GRAPH] 시드 생성: ${count} events / ${edges.length} edges`,
    payload: { count, edgeCount: edges.length, seed }
  });

  refreshGraphState();
  renderSideMiniStatus();
  saveLabState();
}

function rebuildGroupsFromPatternCandidate(patternId) {
  const result = uiState.patternMap.get(patternId);
  if (!result) return;

  const pattern = result.pattern;
  if (!pattern || !pattern.nodes || pattern.nodes.length === 0) return;

  const currentEventId = uiState.selectedEventId;
  if (!currentEventId) {
    selectPattern(patternId);
    return;
  }

  const matched = pattern.nodes.includes(currentEventId);

  if (matched) {
    const groups = buildGroupsFromPatternUI(pattern);
    groups.forEach((g) => groupStore.set(g.id, g));

    uiState.selectedPattern = pattern;
    uiState.selectedPatternId = pattern.id;
    uiState.selectedGroup = null;
    uiState.selectedGroupId = null;

    logEvent(`[GROUP] 선택 해제`);

    pushState("groupList", {
      patternId: pattern.id,
      groups
    });

    renderGroups(groups);
    renderPatternDetail(pattern);
    renderDebugStatus();
    saveLabState();
    return;
  }

  selectPattern(patternId);
}

function undoPatternLinkWorkspaceTempEdge() {
  const ws = getPatternLinkWorkspace();
  const plc = getPatternLinkCy();
  if (!ws || !plc) return;

  if (!Array.isArray(ws.tempEdgeIds)) {
    ws.tempEdgeIds = [];
  }
  if (!Array.isArray(ws.tempEdgeChain)) {
    ws.tempEdgeChain = [];
  }

  const lastEdgeId = ws.tempEdgeIds.pop();
  if (!lastEdgeId) return;

  const edge = plc.getElementById(lastEdgeId);
  if (edge && edge.length > 0) {
    const source = edge.data("source");
    const target = edge.data("target");

    edge.remove();

    const chain = ws.tempEdgeChain;
    if (chain.length > 0 && chain[chain.length - 1] === target) {
      chain.pop();
    }
    if (chain.length > 0 && chain[chain.length - 1] !== source) {
      chain.push(source);
    }
  }

  renderPatternLinkWorkspaceStatus();
  renderPatternLinkDetail();
}

function getPatternMemory(pattern) {
  const key = makePatternKey(pattern);
  if (!key) return null;
  return patternMemoryMap.get(key) || null;
}

function getPatternDisplayId(pattern) {
  const idx = uiState.rankedResults.findIndex((r) => r.pattern.id === pattern.id);
  if (idx < 0) return "P-??";
  return `P-${String(idx + 1).padStart(2, "0")}`;
}

function getPatternStateBadge(state) {
  if (state === "new") return "NEW";
  if (state === "growing") return "▲ GROW";
  if (state === "stable") return "■ STABLE";
  if (state === "fading") return "▼ FADING";
  return "-";
}

function getPatternTrendBadge(trend) {
  if (trend === "rising") return "▲";
  if (trend === "falling") return "▼";
  return "■";
}

function buildPatternCandidatesFromEvent(eventId) {
  const edges = engine.getEdges() || [];
  const relatedEventIds = new Set([eventId]);

  edges.forEach((e) => {
    if (e.from === eventId) relatedEventIds.add(e.to);
    if (e.to === eventId) relatedEventIds.add(e.from);
  });

  const allPatterns = uiState.rankedResults || [];

  const filtered = allPatterns.filter((r) => {
    const pattern = r.pattern;
    if (!pattern || !pattern.nodes) return false;
    return pattern.nodes.some((id) => relatedEventIds.has(id));
  });

  return filtered.sort((a, b) => {
    const memA = getPatternMemory(a.pattern);
    const memB = getPatternMemory(b.pattern);

    const seenA = memA?.discovery?.seenCount ?? 0;
    const seenB = memB?.discovery?.seenCount ?? 0;

    const stateScore = (state) => {
      if (state === "growing") return 3;
      if (state === "stable") return 2;
      if (state === "fading") return 1;
      if (state === "new") return 0;
      return 0;
    };

    const sA = stateScore(memA?.state?.state);
    const sB = stateScore(memB?.state?.state);

    if (sA !== sB) return sB - sA;
    if (seenA !== seenB) return seenB - seenA;
    return (b.probability ?? 0) - (a.probability ?? 0);
  });
}

// renderGroups 수정

function renderGroups(groups) {
  const panel = els.predictionPanel;
  if (!panel) return;

  if (!groups || groups.length === 0) {
    panel.innerHTML = `
<div class="empty-state">
  <b>관계 태그 없음</b><br>
  현재 조건에 해당하는 관계가 없습니다.
</div>
`;
    return;
  }

  let html = "";

  groups.forEach((g, i) => {
    const importance = getGroupImportance(g);
    const isActiveInLayer = (uiState.activeGroupIds || []).includes(g.id);
    const isSelected = uiState.selectedGroupId === g.id;

    html += `
<div class="group-card${isSelected ? " selected" : ""}${isActiveInLayer ? " group-card-active-layer" : ""}" data-group-id="${g.id}">
  <b>[관계 태그 ${i + 1}] ${g.edgeType || "PATTERN"}</b><br><br>
  중심 이벤트: ${g.center || "-"}<br>
  연결 수: ${g.nodes?.length || 0}<br>
  강도: ${importance}<br>
  Layer 포함: ${isActiveInLayer ? "ON" : "OFF"}<br><br>

  <div class="group-card-actions">
    <button class="btn-group-open-exclusive" data-group-id="${g.id}">
      단독 열기
    </button>

    <button class="btn-group-toggle-layer" data-group-id="${g.id}">
      ${isActiveInLayer ? "레이어에서 제거" : "레이어에 추가"}
    </button>
  </div>
</div>
`;
  });

  panel.innerHTML = html;

  const cards = panel.querySelectorAll(".group-card");
  cards.forEach((card) => {
  card.onclick = (e) => {
  if (e.target.closest("button")) return;

  const id = card.dataset.groupId;

  // 🔴 여기
  if (e.shiftKey || e.ctrlKey) {
    toggleGroupActive(id);
    renderGroups(groups);
    return;
  }

  selectGroup(id, cards, card);
  refreshGraphState();
};
});

  const openBtns = panel.querySelectorAll(".btn-group-open-exclusive");
  openBtns.forEach((btn) => {
    btn.onclick = (e) => {
      e.stopPropagation();

      const id = btn.dataset.groupId;
      openGroupExclusive(id);

      const group = groupStore.get(id);
      if (group) {
        renderEvents(group);
      }

      renderGroups(groups);
      renderFocusHeader();
      renderDebugStatus();
      renderDetailPanel();
    };
  });

  const toggleBtns = panel.querySelectorAll(".btn-group-toggle-layer");
  toggleBtns.forEach((btn) => {
    btn.onclick = (e) => {
      e.stopPropagation();

      const id = btn.dataset.groupId;
      toggleGroupActive(id);

      renderGroups(groups);
      renderFocusHeader();
      renderDebugStatus();
      renderDetailPanel();
    };
  });
}

function renderGroupPanel() {
  if (!els.groupPanelBody) return;

  const groups = [...groupStore.values()]
    .filter(Boolean)
    .sort((a, b) => String(a.name || a.id || "").localeCompare(String(b.name || b.id || "")));

  if (!groups.length) {
    els.groupPanelBody.innerHTML = `
      <div class="empty-state">등록된 GROUP 없음</div>
    `;

    updateGroupExplorerActionUI?.();
    updateGroupExplorerStatus?.();
    return;
  }

  const activeIds = getGroupExplorerActiveGroupIds?.() || [];
  const previewIds = getGroupExplorerPreviewGroupIds?.() || [];
  const baseGroupId = getCurrentBaseGroupIdForExplorer?.() || null;

  const selectedIds =
    uiState.groupExplorerContext?.target === "patternLinkPage"
      ? (
          uiState.patternLinkPageState?.selectedGroupId
            ? [uiState.patternLinkPageState.selectedGroupId]
            : []
        )
      : (
          Array.isArray(uiState.selectedGroupIds)
            ? uiState.selectedGroupIds
            : []
        );

  let html = "";

  groups.forEach((g, i) => {
    const groupId = g.id;
    if (!groupId) return;

    const isSelected = selectedIds.includes(groupId);
    const isActive = activeIds.includes(groupId);
    const isPreview = previewIds.includes(groupId);
    const isBase = baseGroupId === groupId;
    const isExpanded = uiState.expandedGroupId === groupId;

    const meta = getGroupCardMeta(g);

    const cardClass = [
      "group-card",
      isSelected ? "selected" : "",
      isActive ? "group-card-active-layer" : "",
      isPreview ? "group-card-preview-layer" : "",
      isBase ? "group-card-base-soft" : ""
    ].filter(Boolean).join(" ");

    const purityText = Number.isFinite(meta.purityScore)
      ? meta.purityScore.toFixed(2)
      : "-";

    const contaminationText = Number.isFinite(meta.contaminationScore)
      ? meta.contaminationScore.toFixed(2)
      : "-";

    const importanceText = Number.isFinite(meta.importanceScore)
      ? meta.importanceScore.toFixed(2)
      : "-";

    const confidenceText = Number.isFinite(meta.confidenceScore)
      ? meta.confidenceScore.toFixed(2)
      : "-";

    html += `
      <div class="${cardClass}" data-group-id="${groupId}">
        <div class="group-card-head">
          <div class="group-card-title-wrap">
            <div class="group-card-index">[GROUP ${i + 1}]</div>
            <div class="group-card-title">${g.label || g.name || groupId}</div>
          </div>
        </div>

        <div class="group-card-sub">
          <span>중심: ${meta.centerNodeId || "-"}</span>
          <span>관계: ${meta.relationTag || "-"}</span>
        </div>

        <div class="group-card-metrics">
          <span>P ${purityText}</span>
          <span>C ${contaminationText}</span>
          <span>I ${importanceText}</span>
          <span>F ${confidenceText}</span>
        </div>

        ${
          meta.signatureTags.length
            ? `
              <div class="group-card-tags">
                ${meta.signatureTags.map(tag => `<span class="group-chip">${tag}</span>`).join("")}
              </div>
            `
            : ""
        }

        ${
  isExpanded
    ? `
<div class="group-card-detail">
  <div>state: ${isActive ? "ON" : "OFF"}</div>
  <div>preview: ${isPreview ? "YES" : "NO"}</div>
  <div>base: ${isBase ? "YES" : "NO"}</div>
  <div>관계 태그: ${meta.relationTag || "-"}</div>
  <div>중심 node: ${meta.centerNodeId || "-"}</div>
  <div>edge: ${meta.edgeCount}</div>
  <div>node: ${meta.nodeCount}</div>
  <div>purity: ${purityText}</div>
  <div>contamination: ${contaminationText}</div>
  <div>importance: ${importanceText}</div>
  <div>confidence: ${confidenceText}</div>
  <div>purity tags: ${meta.purityTags.length ? meta.purityTags.join(", ") : "-"}</div>
  <div>contamination tags: ${meta.contaminationTags.length ? meta.contaminationTags.join(", ") : "-"}</div>
</div>

<div class="group-card-actions-inline">
<button
  type="button"
  class="group-inline-btn group-inline-base-btn ${isBase ? "is-base" : ""}"
  data-group-action="base"
  data-group-id="${groupId}"
>
  ${isBase ? "BASE 해제" : "BASE 지정"}
</button>

</div>
`
    : ""
}

      </div>
    `;
  });

  els.groupPanelBody.innerHTML = html;

  const cards = els.groupPanelBody.querySelectorAll(".group-card[data-group-id]");

  cards.forEach((card) => {
    card.onclick = (e) => {
      const id = card.dataset.groupId;
      if (!id) return;

      // Ctrl / Shift 클릭은 ON 토글
      if (e.ctrlKey || e.shiftKey) {
        handleGroupExplorerToggleActive(id);
        return;
      }

      // 일반 좌클릭은 PREVIEW / 상세
      handleGroupExplorerSelect(id);
    };

    card.oncontextmenu = (e) => {
      e.preventDefault();

      const id = card.dataset.groupId;
      if (!id) return;

      handleGroupExplorerSelect(id);
    };

    card.ondblclick = (e) => {
      e.preventDefault();

      const id = card.dataset.groupId;
      if (!id) return;

      handleGroupExplorerToggleActive(id);
    };
  });

  const actionButtons = els.groupPanelBody.querySelectorAll("[data-group-action]");
actionButtons.forEach((btn) => {
  btn.onclick = (e) => {
    e.stopPropagation();

    const id = btn.dataset.groupId;
    const action = btn.dataset.groupAction;
    if (!id || !action) return;

    if (action === "base") {
      handleGroupExplorerSetBase(id);
      return;
    }
  };
});

  updateGroupExplorerActionUI?.();

  cleanupGroupExplorerRuntimeTags?.();
  decorateGroupExplorerCards?.();
  updateGroupExplorerStatus?.();
}

function handleGroupExplorerSetBase(groupId) {
  if (!groupId) return;

  const target = uiState.groupExplorerContext?.target || "main";
  const currentBaseId = getCurrentBaseGroupIdForExplorer?.() || null;

  // 같은 group이면 BASE 해제
  if (currentBaseId === groupId) {
    if (target === "patternLinkPage") {
      if (uiState.patternLinkPageState) {
        uiState.patternLinkPageState.baseGroupId = null;
      }
    } else {
      uiState.baseGroupId = null;

      groupStore.forEach((g) => {
        if (g?.status) {
          g.status.isBase = false;
        }
      });
    }

    const box = document.getElementById("group-base-mini-explorer");
    if (box) {
      box.dataset.open = "false";
      box.classList.add("hidden");
      box.style.display = "none";
    }

    updateGroupExplorerStatus?.();
    decorateGroupExplorerCards?.();
    renderGroupPanel?.();
    saveLabState?.();
    return;
  }

  // 다른 group이면 BASE 지정
  if (target === "patternLinkPage") {
    setPatternLinkPageBaseGroup?.(groupId);
  } else {
    uiState.baseGroupId = groupId;

    groupStore.forEach((g, id) => {
      if (!g) return;
      if (!g.status) g.status = {};
      g.status.isBase = id === groupId;
    });

    saveLabState?.();
  }

  updateGroupExplorerStatus?.();
  decorateGroupExplorerCards?.();
  renderGroupPanel?.();
  saveLabState?.();
}

function handleGroupBaseButtonClick() {
  const currentBaseId = getCurrentBaseGroupIdForExplorer?.() || null;

  if (!currentBaseId) return;

  toggleGroupBaseMiniExplorer?.(currentBaseId);
}

function resetRelationExplorerGraphViewOnly() {
  if (!window.cy) return;

  cy.nodes().forEach((node) => {
    node.removeStyle("opacity");
    node.removeStyle("border-width");
    node.removeStyle("border-color");
    node.removeStyle("background-color");
  });

  cy.edges().forEach((edge) => {
    edge.removeStyle("opacity");
    edge.removeStyle("width");
    edge.removeStyle("line-color");
    edge.removeStyle("target-arrow-color");
  });

  refreshGraphState?.();
}

function bindGroupExplorerControls() {
if (els.openGroupPanelBtn) {
  els.openGroupPanelBtn.onclick = () => {
    openGroupExplorerForCurrentPage();
  };
}

  if (els.closeGroupPanelBtn) {
    els.closeGroupPanelBtn.onclick = () => {
      if (els.groupPanel) {
        els.groupPanel.classList.add("hidden");
      }
    };
  }

  if (els.groupDeactivateBtn) {
    els.groupDeactivateBtn.onclick = () => {
      const ids = Array.isArray(uiState.selectedGroupIds)
        ? uiState.selectedGroupIds
        : [];

      if (!ids.length) return;

      const selectedSet = new Set(ids);
      uiState.activeGroupIds = (uiState.activeGroupIds || []).filter(
        (id) => !selectedSet.has(id)
      );

      refreshGraphState?.();
      renderGroupPanel();
      renderFocusHeader?.();
      renderDetailPanel?.();
      saveLabState?.();
    };
  }

  if (els.groupPromoteMergeBtn) {
    els.groupPromoteMergeBtn.onclick = () => {
      console.log("GROUP MERGE PROMOTE", uiState.selectedGroupIds);
    };
  }

  const relationBtn = document.getElementById("btn-open-relation-explorer-from-group");
if (relationBtn) {
  relationBtn.onclick = () => {
    openRelationExplorerWithRestore();
  };
}

if (els.groupPanelActions && !els.groupPanelActions.dataset.relationBound) {
  els.groupPanelActions.addEventListener("click", (e) => {
    const btn = e.target.closest("#btn-open-relation-explorer-from-group");
    if (!btn) return;

    if (typeof isExplorerInteractionLocked === "function" && isExplorerInteractionLocked()) {
      return;
    }

    openRelationExplorerWithRestore();
  });

  els.groupPanelActions.dataset.relationBound = "true";
}

if (els.groupBaseBtn) {
  els.groupBaseBtn.onclick = () => {
    handleGroupBaseButtonClick();
  };
}

if (els.groupExplorerBaseCurrent) {
  els.groupExplorerBaseCurrent.onclick = () => {
    const baseGroupId = getCurrentBaseGroupIdForExplorer();
    if (!baseGroupId) return;

    handleGroupExplorerSelect?.(baseGroupId);
    renderGroupPanel?.();
    updateGroupExplorerStatus?.();
  };
}

if (els.groupBaseBtn) {
  els.groupBaseBtn.onclick = () => {
    handleGroupBaseButtonClick();
  };
}

if (els.groupClearPreviewBtn) {
  els.groupClearPreviewBtn.onclick = () => {
    clearGroupExplorerPreview();
  };
}

if (els.groupClearOnBtn) {
  els.groupClearOnBtn.onclick = () => {
    clearGroupExplorerActiveGroups();
  };
}

if (els.groupClearBaseBtn) {
  els.groupClearBaseBtn.onclick = () => {
    clearGroupExplorerBase();
  };
}

if (els.minimizeGroupExplorerFullBtn) {
  els.minimizeGroupExplorerFullBtn.onclick = () => {
    minimizeGroupExplorerFull();
  };
}

if (els.minimizeGroupExplorerFullViewBtn) {
  els.minimizeGroupExplorerFullViewBtn.onclick = () => {
    minimizeGroupExplorerFull();
  };
}

if (els.groupExplorerFullMinimized) {
  els.groupExplorerFullMinimized.onclick = () => {
    restoreGroupExplorerFull();
  };
}

if (els.closeGroupExplorerFullBtn) {
  els.closeGroupExplorerFullBtn.onclick = () => {
    closeGroupExplorerFull();
  };
}

}

function handleGroupExplorerSelect(groupId) {
  if (!groupId) return;

  const target = uiState.groupExplorerContext?.target || "main";

  if (target === "patternLinkPage") {
    if (!uiState.patternLinkPageState) {
      uiState.patternLinkPageState = {};
    }

    uiState.patternLinkPageState.selectedGroupId = groupId;
    uiState.patternLinkPageState.selectedGroupRefId = groupId;
    uiState.patternLinkPageState.previewGroupIds = [groupId];

    selectGroupInPatternLinkPage?.(groupId, {
      activate: false,
      preview: true
    });

    updatePatternLinkCurrentGroupBox?.();
    renderPatternLinkFocusHeader?.();
    renderPatternLinkDetail?.();
    updateGroupExplorerStatus?.();
    decorateGroupExplorerCards?.();
    saveLabState?.();
    return;
  }

  uiState.selectedGroupId = groupId;
  uiState.selectedGroup = groupStore.get(groupId) || null;
  uiState.expandedGroupId = groupId;
  uiState.focusGroupId = groupId;
  uiState.previewGroupIds = [groupId];

  renderGroupPanel?.();
  renderFocusHeader?.();
  renderDetailPanel?.();
  updateGroupExplorerStatus?.();
  decorateGroupExplorerCards?.();
  saveLabState?.();
}

function handleGroupExplorerToggleActive(groupId) {
  if (!groupId) return;

  const target = uiState.groupExplorerContext?.target || "main";

  if (target === "patternLinkPage") {
    togglePatternLinkPageGroupActive?.(groupId);
    updatePatternLinkCurrentGroupBox?.();
    updateGroupExplorerStatus?.();
    decorateGroupExplorerCards?.();
    return;
  }

  toggleGroupActiveImmediate?.(groupId);
  updateGroupExplorerStatus?.();
  decorateGroupExplorerCards?.();
}

function handleGroupExplorerOpenExclusive(groupId) {
  if (!groupId) return;

  const target = uiState.groupExplorerContext?.target || "main";

  if (target === "patternLinkPage") {
    setPatternLinkPageGroupActive?.(groupId);
    updatePatternLinkCurrentGroupBox?.();
    return;
  }

  openGroupExclusive?.(groupId);
}

function updatePatternLinkCurrentGroupBox() {
  if (!els.patternLinkCurrentGroupBox) return;

  const plState = uiState.patternLinkPageState || {};
  const groupId =
    plState.selectedGroupId ||
    plState.selectedGroupRefId ||
    null;

  const activeGroupIds = Array.isArray(plState.activeGroupIds)
    ? plState.activeGroupIds
    : [];

  const group = groupId ? groupStore.get(groupId) : null;

  els.patternLinkCurrentGroupBox.textContent = group
    ? `PL Group: ${group.name || group.label || group.id} / active ${activeGroupIds.length}`
    : `PL Group: - / active ${activeGroupIds.length}`;
}

function flashExplorerAction(btn) {
  if (!btn) return;

  btn.classList.add("active");

  setTimeout(() => {
    btn.classList.remove("active");
    syncPatternExplorerMirrorButtons?.();
  }, 220);
}

function getFocusTierStyleByOverlap(overlapCount = 0, isCore = false) {
  if (isCore || overlapCount >= 4) {
    return {
      color: "#ffd54f",      // 노랑
      borderColor: "#ffd54f",
      borderWidth: 5,
      opacity: 1
    };
  }

  if (overlapCount >= 3) {
    return {
      color: "#ff6b6b",      // 빨강
      borderColor: "#ff6b6b",
      borderWidth: 4,
      opacity: 0.96
    };
  }

  if (overlapCount >= 2) {
    return {
      color: "#b197fc",      // 보라
      borderColor: "#b197fc",
      borderWidth: 4,
      opacity: 0.93
    };
  }

  if (overlapCount >= 1) {
    return {
      color: "#7cc4ff",      // 파랑
      borderColor: "#7cc4ff",
      borderWidth: 3,
      opacity: 0.9
    };
  }

  return {
    color: null,
    borderColor: null,
    borderWidth: 2,
    opacity: 0.12
  };
}

function refreshGraphState() {
  if (!window.cy) return;

  resetGraphFocus();

  const focusProfile = computeSelectedGroupFocusProfile();
  const coreNodeSet = new Set(focusProfile.coreNodeIds || []);
  const relatedNodeSet = new Set(focusProfile.relatedNodeIds || []);

  const previewGroupIds = uiState.isLayerPreviewActive
    ? (uiState.previewLayerGroupIds || [])
    : [];

  const previewNodeIds = uiState.isLayerPreviewActive
    ? (uiState.previewLayerNodeIds || [])
    : [];

  const previewNodeSet = new Set(previewNodeIds);

  previewGroupIds.forEach((groupId) => {
    const group = groupStore.get(groupId);
    if (!group) return;

    if (group.center) previewNodeSet.add(group.center);
    (group.nodes || []).forEach((id) => previewNodeSet.add(id));
  });

  const nodeStates = {};

  cy.nodes().forEach((node) => {
  const nodeId = node.id();

  let state = createNodeState(node);

  state = evaluateModeForNode(node, state);
  state = evaluateLayerForNode(node, state);
  state = evaluateEventForNode(node, state);

  const isCoreNode = coreNodeSet.has(nodeId);
  const isRelatedNode = relatedNodeSet.has(nodeId);

  if (coreNodeSet.size > 0 || relatedNodeSet.size > 0) {
    if (isCoreNode) {
      state.dim = false;
      state.emphasis = Math.max(state.emphasis, 4);
      state.forceHighlight = true;
      state.focusTier = "core";
    } else if (isRelatedNode) {
      state.dim = false;
      state.emphasis = Math.max(state.emphasis, 1);
      state.forceHighlight = true;
      state.focusTier = "related";
    } else {
      state.dim = true;
      state.emphasis -= 2;
      state.focusTier = "dim";
    }
  }

  if (uiState.isLayerPreviewActive) {
    if (previewNodeSet.has(nodeId)) {
      state.dim = false;
      state.emphasis = Math.max(state.emphasis, 4);
      state.forceHighlight = true;
      state.focusTier = "core";
    } else {
      state.dim = true;
      state.emphasis -= 3;
    }
  }

  if (!isCoreNode && !isRelatedNode && !state.forceHighlight && state.emphasis < 0) {
    state.dim = true;
  }

  const tierStyle = getFocusTierStyleByOverlap(state.emphasis || 0, isCoreNode);
  if (isCoreNode || isRelatedNode) {
    state.color = tierStyle.color;
    state.borderColor = tierStyle.borderColor;
    state.borderWidth = tierStyle.borderWidth;
    state.opacity = tierStyle.opacity;
  }

  nodeStates[nodeId] = state;
});

  const edgeStates = {};

  cy.edges().forEach((edge) => {
    const sourceId = edge.source().id();
    const targetId = edge.target().id();

    const sourceCore = coreNodeSet.has(sourceId);
    const targetCore = coreNodeSet.has(targetId);

    const sourceRelated = relatedNodeSet.has(sourceId);
    const targetRelated = relatedNodeSet.has(targetId);

    let edgeState = evaluateEdgeState(
      edge,
      nodeStates[sourceId],
      nodeStates[targetId]
    );

    const sourceInFocus = coreNodeSet.has(sourceId) || relatedNodeSet.has(sourceId);
const targetInFocus = coreNodeSet.has(targetId) || relatedNodeSet.has(targetId);

if (sourceInFocus && targetInFocus) {
  edgeState.dim = false;
}

    // 기본 focusLevel
    let focusLevel = "dim";

    if (coreNodeSet.size > 0 || relatedNodeSet.size > 0) {
if (sourceCore && targetCore) {
  focusLevel = "core";
} else if (
  (sourceCore && targetRelated) ||
  (targetCore && sourceRelated)
) {
  focusLevel = "strong-related";
} else if (sourceRelated && targetRelated) {
  focusLevel = "related";
} else {
  focusLevel = "dim";
}

    } else {
      // active group 없으면 기존 edgeState 기준 유지
      focusLevel = edgeState?.dim ? "dim" : "related";
    }

    // preview 우선
    if (uiState.isLayerPreviewActive) {
      const sourcePreview = previewNodeSet.has(sourceId);
      const targetPreview = previewNodeSet.has(targetId);

      if (sourcePreview && targetPreview) {
        focusLevel = "core";
      } else {
        focusLevel = "dim";
      }
    }

    edge.data("focusLevel", focusLevel);

    if (focusLevel === "core") {
      edgeState.dim = false;
      edgeState.opacity = 1;
      edgeState.width = 4;
    } else if (focusLevel === "related") {
      edgeState.dim = false;
      edgeState.opacity = 0.55;
      edgeState.width = 2.5;
    } else {
      edgeState.dim = true;
      edgeState.opacity = 0.08;
      edgeState.width = 1;
    }

    edgeStates[edge.id()] = edgeState;
  });

applyComputedGraphState(nodeStates, edgeStates);

// node 직접 style 보정
cy.nodes().forEach((node) => {
  const state = nodeStates[node.id()];
  if (!state) return;

  const isCore = coreNodeSet.has(node.id());
  const isRelated = relatedNodeSet.has(node.id());
  const overlapCount = getGroupOverlapCountByNodeId(node.id());

  const style = getFocusTierStyleByOverlap(overlapCount, isCore);

  if (isCore || isRelated) {
    node.style("opacity", style.opacity);
    node.style("border-width", style.borderWidth);
    node.style("border-color", style.borderColor);

    if (style.color) {
      node.style("background-color", style.color);
    }
  } else if (coreNodeSet.size > 0 || relatedNodeSet.size > 0) {
    node.style("opacity", 0.12);
    node.style("border-width", 2);
  }
});

// edge 직접 style 보정
cy.edges().forEach((edge) => {
  const focusLevel = edge.data("focusLevel");

  if (focusLevel === "core") {
    edge.style("opacity", 1);
    edge.style("width", 4);
    edge.style("line-color", "#ffd54f");
    edge.style("target-arrow-color", "#ffd54f");
  } else if (focusLevel === "strong-related") {
    edge.style("opacity", 0.82);
    edge.style("width", 3.2);
    edge.style("line-color", "#ff6b6b");
    edge.style("target-arrow-color", "#ff6b6b");
  } else if (focusLevel === "related") {
    edge.style("opacity", 0.58);
    edge.style("width", 2.4);
    edge.style("line-color", "#7cc4ff");
    edge.style("target-arrow-color", "#7cc4ff");
  } else {
    edge.style("opacity", 0.08);
    edge.style("width", 1);
  }
});

if (
  uiState.relationExplorer?.baseGroupId &&
  (
    (uiState.relationExplorer.selectedEdgeIds || []).length > 0 ||
    uiState.relationExplorer.edgeFilter !== "ALL"
  )
) {
  applyRelationExplorerFocusToGraph?.();
}

applyPatternExplorerVisibility();
updateGraphStats();
applyGraphCaps();
applyEdgeRelationFilter();

const plw = getPatternLinkWorkspace?.();
if (plw?.open && plw?.active) {
  applyPatternLinkWorkspaceVisibility?.();
  applyAutoDimToPatternLinkWorkspace?.();
}

if (uiState.page !== "pattern-link" && uiState.patternLinkWorkspace?.open && uiState.patternLinkWorkspace?.active) {
  applyPatternLinkWorkspaceToMainGraphPreview();
}

applyExplorerPreviewsToMainGraph?.();

}

window.refreshGraphState = refreshGraphState;

function renderEdgeRelationFilterButtons() {
  const host = document.getElementById("edge-relation-filter-bar");
  if (!host) return;

  const current = uiState.edgeRelationFilter || "ALL";
  const list = ["ALL", "CAUSE", "FOLLOWUP", "UNKNOWN"];

  host.innerHTML = list.map((tag) => `
    <button
      class="edge-filter-btn${current === tag ? " active" : ""}"
      data-edge-filter="${tag}"
      type="button"
    >
      ${tag}
    </button>
  `).join("");

  host.querySelectorAll("[data-edge-filter]").forEach((btn) => {
    btn.onclick = () => {
      uiState.edgeRelationFilter = btn.dataset.edgeFilter || "ALL";
      renderEdgeRelationFilterButtons();
      applyEdgeRelationFilter();
    };
  });
}

function syncPatternLinkRelationFilterButtons() {
  const ws = getPatternLinkWorkspace();
  const filter = ws.edgeRelationFilter || "ALL";

  if (!els.patternRelationFilterBox) return;

  els.patternRelationFilterBox
    .querySelectorAll(".edge-filter-btn")
    .forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.edgeFilter === filter);
    });
}

function renderTimelineButton() {
  if (!els.playBtn) return;
  els.playBtn.textContent = uiState.timelinePlaying ? "정지" : "재생";
}

function renderDetailPanel() {
  const panel = document.getElementById("pattern-detail");
  if (!panel) return;

  if (uiState.selectedEventId) {
    const evt = getEventById(uiState.selectedEventId);

    panel.innerHTML = `
      <b>[이벤트 상세]</b><br><br>
      ID: ${evt?.id || "-"}<br>
      이름: ${evt?.name || "-"}<br>
      ROT: ${evt?.variables?.rot ?? "-"}<br>
      CAP: ${evt?.variables?.cap ?? "-"}<br>
      VAR: ${evt?.variables?.var ?? "-"}<br>
      메모: ${evt?.memo || "-"}
    `;
    return;
  }

  if (uiState.selectedGroup) {
    const group = uiState.selectedGroup;
    const centerNodeId = getGroupCenterNodeId(group);
    const memberNodeIds = getGroupMemberNodeIds(group);
    const requiredNodeIds = getGroupRequiredNodeIds(group);
    const edgeTypes = getGroupEdgeTypes(group);
    const signatureTags = getGroupSignatureTags(group);
    const purityTags = getGroupPurityTags(group);
    const contaminationTags = getGroupContaminationTags(group);

    const purityScore = getGroupEvaluationScore(group, "purityScore", 1);
    const contaminationScore = getGroupEvaluationScore(group, "contaminationScore", 0);
    const importanceScore = getGroupEvaluationScore(group, "importanceScore", 0);
    const confidenceScore = getGroupEvaluationScore(group, "confidenceScore", 0);
    const cohesionScore = getGroupEvaluationScore(group, "cohesionScore", 0);
    const overlapScore = getGroupEvaluationScore(group, "overlapScore", 0);

    panel.innerHTML = `
      <b>[GROUP 상세]</b><br><br>
      ID: ${group.id || "-"}<br>
      이름: ${group.label || group.name || "-"}<br>
      중심: ${centerNodeId || "-"}<br>
      관계: ${edgeTypes.length ? edgeTypes.join(", ") : "-"}<br>
      멤버 수: ${memberNodeIds.length}<br>
      핵심 노드: ${requiredNodeIds.length ? requiredNodeIds.join(", ") : "-"}<br>
      시그니처 태그: ${signatureTags.length ? signatureTags.join(", ") : "-"}<br>
      순수성 태그: ${purityTags.length ? purityTags.join(", ") : "-"}<br>
      오염 태그: ${contaminationTags.length ? contaminationTags.join(", ") : "-"}<br>
      <br>
      purity: ${purityScore.toFixed(2)}<br>
      contamination: ${contaminationScore.toFixed(2)}<br>
      importance: ${importanceScore.toFixed(2)}<br>
      confidence: ${confidenceScore.toFixed(2)}<br>
      cohesion: ${cohesionScore.toFixed(2)}<br>
      overlap: ${overlapScore.toFixed(2)}<br>
      <br>
      source pattern: ${
        Array.isArray(group?.context?.sourcePatternIds) && group.context.sourcePatternIds.length
          ? group.context.sourcePatternIds.join(", ")
          : "-"
      }<br>
      source layer: ${
        Array.isArray(group?.context?.sourceLayerNames) && group.context.sourceLayerNames.length
          ? group.context.sourceLayerNames.join(", ")
          : "-"
      }<br>
      theory state: ${group?.evaluation?.theoryState || "-"}<br>
      purity state: ${group?.evaluation?.purityState || "-"}<br>
      contamination state: ${group?.evaluation?.contaminationState || "-"}<br>
      메모: ${group?.memo || "-"}
    `;
    return;
  }

  panel.innerHTML = `
    <b>[네트워크 패널]</b><br><br>
    선택된 Pattern / Group / EVT 설명이 여기에 표시됩니다.
  `;
}

function renderTimelineStatus() {
  const events = getTimelineEvents();
  const total = events.length;

  if (els.timelineIndexBox) {
    const current = total ? uiState.timelineIndex + 1 : 0;
    els.timelineIndexBox.textContent = `${current} / ${total}`;
  }

  if (els.timelineSpeedBox) {
    els.timelineSpeedBox.textContent = `${uiState.timelineSpeed.toFixed(1)}x`;
  }

  if (els.playBtn) {
    els.playBtn.textContent = uiState.timelinePlaying ? "재생 중" : "재생";
  }
}

function getPatternLinkSelectedGroup() {
  const plState = uiState.patternLinkPageState || {};
  const selectedGroupId =
    plState.selectedGroupId ||
    plState.selectedGroupRefId ||
    null;

  if (!selectedGroupId) return null;
  return groupStore.get(selectedGroupId) || null;
}

function buildPatternLinkGroupEdgeButtons(group, plc) {
  if (!group || !plc) {
    return `<div class="empty-state">연결된 edge 없음</div>`;
  }

  const nodeIds = new Set(getGroupAllNodeIds(group));
  const edgeItems = [];

  plc.edges().forEach((edge) => {
    const sourceId = edge.data("source");
    const targetId = edge.data("target");

    if (!nodeIds.has(sourceId) && !nodeIds.has(targetId)) {
      return;
    }

    edgeItems.push(`
      <button class="pl-jump-btn pl-edge-btn" data-pl-jump-edge="${edge.id()}">
        ${(sourceId || "-")} → ${(targetId || "-")}
      </button>
    `);
  });

  if (!edgeItems.length) {
    return `<div class="empty-state">연결된 edge 없음</div>`;
  }

  return edgeItems.join("");
}

function renderPatternLinkDetail() {
  if (!els.patternLinkDetailBody) return;

  const plc = getPatternLinkCy();
  const ws = getPatternLinkWorkspace();

  const eventId = uiState.selectedEventId || null;
  const edgeId = ws.selectedEdgeId || null;
  const selectedGroup = getPatternLinkSelectedGroup();

  // ======================
  // EDGE DETAIL
  // ======================
  if (edgeId) {
    const edge = plc?.getElementById(edgeId);

    if (!edge || edge.length === 0) {
      els.patternLinkDetailBody.innerHTML = `
        <div class="pl-detail-section">
          <div class="pl-detail-title">DETAIL</div>
          <div class="empty-state">edge not found</div>
        </div>
      `;
      return;
    }

    const data = edge.data();
    const sourceId = data.source || "-";
    const targetId = data.target || "-";

    els.patternLinkDetailBody.innerHTML = `
      <div class="pl-detail-section">
        <div class="pl-detail-title">RELATION</div>
        <div><b>ID</b>: ${edgeId}</div>
        <div><b>Type</b>: ${data.type || "-"}</div>
        <div><b>Source</b>: ${sourceId}</div>
        <div><b>Target</b>: ${targetId}</div>
      </div>

      <div class="pl-detail-section">
        <div class="pl-detail-title">WORKSPACE</div>
        <div><b>Loaded Layer</b>: ${ws.loadedLayerName || "-"}</div>
        <div><b>Workspace Groups</b>: ${(ws.loadedActiveGroupIds || []).length}</div>
        <div><b>Workspace Filter</b>: ROT≥${ws.loadedLayerFilter?.rotMin ?? "-"} / CAP≤${ws.loadedLayerFilter?.capMax ?? "-"} / VAR≥${ws.loadedLayerFilter?.varMin ?? "-"}</div>
      </div>

      <div class="pl-detail-section">
        <div class="pl-detail-title">JUMP</div>
        <div class="pl-jump-row">
          <span class="pl-jump-label">Source</span>
          <button class="pl-jump-btn" data-pl-jump-event="${sourceId}">
            ${sourceId}
          </button>
        </div>
        <div class="pl-jump-row">
          <span class="pl-jump-label">Target</span>
          <button class="pl-jump-btn" data-pl-jump-event="${targetId}">
            ${targetId}
          </button>
        </div>
        ${
          selectedGroup
            ? `
        <div class="pl-jump-row">
          <span class="pl-jump-label">Group</span>
          <button class="pl-jump-btn" data-pl-open-group="${selectedGroup.id}">
            ${selectedGroup.label || selectedGroup.name || selectedGroup.id}
          </button>
        </div>
        `
            : ""
        }
      </div>
    `;

    els.patternLinkDetailBody
      .querySelectorAll("[data-pl-jump-event]")
      .forEach((btn) => {
        btn.onclick = () => {
          const id = btn.dataset.plJumpEvent;
          if (!id) return;

          const node = plc?.getElementById(id);
          if (!node || node.length === 0) return;

          uiState.selectedEventId = id;
          uiState.selectedEdgeId = null;

          ws.selectedNodeId = id;
          ws.selectedEdgeId = null;

          if (!uiState.patternLinkPageState) {
            uiState.patternLinkPageState = {};
          }
          uiState.patternLinkPageState.selectedNodeId = id;
          uiState.patternLinkPageState.selectedEdgeId = null;

          saveLabState?.();
          plc.center(node);
          renderPatternLinkFocusHeader?.();
          renderPatternLinkDetail?.();
        };
      });

    els.patternLinkDetailBody
      .querySelectorAll("[data-pl-open-group]")
      .forEach((btn) => {
        btn.onclick = () => {
          const id = btn.dataset.plOpenGroup;
          if (!id) return;
          selectGroupInPatternLinkPage(id);
        };
      });

    return;
  }

  // ======================
  // EVENT DETAIL
  // ======================
  if (eventId) {
    let evtData = null;

    if (typeof getEventById === "function") {
      evtData = getEventById(eventId);
    }

    if (!evtData) {
      const node = plc?.getElementById(eventId);
      evtData = node?.data() || null;
    }

    const node = plc?.getElementById(eventId);
    const connectedEdges = node?.connectedEdges()?.toArray() || [];
    const connectedCount = connectedEdges.length;

    const edgeButtons = connectedEdges.length
      ? connectedEdges.map((edge) => {
          const id = edge.id();
          const source = edge.data("source") || "-";
          const target = edge.data("target") || "-";
          return `
            <button class="pl-jump-btn pl-edge-btn" data-pl-jump-edge="${id}">
              ${source} → ${target}
            </button>
          `;
        }).join("")
      : `<div class="empty-state">연결된 edge 없음</div>`;

    els.patternLinkDetailBody.innerHTML = `
      <div class="pl-detail-section">
        <div class="pl-detail-title">EVENT</div>
        <div><b>ID</b>: ${eventId}</div>
        <div><b>Name</b>: ${evtData?.name || evtData?.label || "-"}</div>
      </div>

      <div class="pl-detail-section">
        <div class="pl-detail-title">STATE</div>
        <div><b>Group</b>: ${uiState.selectedGroupId || "-"}</div>
        <div><b>Pattern</b>: ${uiState.selectedPatternId || "-"}</div>
        <div><b>Layer</b>: ${uiState.currentLayerName || "-"}</div>
        <div><b>Mode</b>: ${uiState.mode || "-"}</div>
        <div><b>Workspace Layer</b>: ${ws.loadedLayerName || "-"}</div>
        <div><b>Workspace Groups</b>: ${(ws.loadedActiveGroupIds || []).length}</div>
      </div>

      <div class="pl-detail-section">
        <div class="pl-detail-title">DATA</div>
        <div><b>Time</b>: ${evtData?.time || evtData?.date || evtData?.timestamp || "-"}</div>
        <div><b>Memo</b>: ${evtData?.memo || evtData?.description || "-"}</div>
        <div><b>Workspace Filter</b>: ROT≥${ws.loadedLayerFilter?.rotMin ?? "-"} / CAP≤${ws.loadedLayerFilter?.capMax ?? "-"} / VAR≥${ws.loadedLayerFilter?.varMin ?? "-"}</div>
      </div>

      <div class="pl-detail-section">
        <div class="pl-detail-title">GRAPH</div>
        <div><b>Connections</b>: ${connectedCount}</div>
      </div>

      <div class="pl-detail-section">
        <div class="pl-detail-title">JUMP</div>
        <div class="pl-edge-list">
          ${edgeButtons}
        </div>
        ${
          selectedGroup
            ? `
        <div class="pl-jump-row" style="margin-top:10px;">
          <span class="pl-jump-label">Group</span>
          <button class="pl-jump-btn" data-pl-open-group="${selectedGroup.id}">
            ${selectedGroup.label || selectedGroup.name || selectedGroup.id}
          </button>
        </div>
        `
            : ""
        }
      </div>
    `;

    els.patternLinkDetailBody
      .querySelectorAll("[data-pl-jump-edge]")
      .forEach((btn) => {
        btn.onclick = () => {
          const id = btn.dataset.plJumpEdge;
          if (!id) return;

          const edge = plc?.getElementById(id);
          if (!edge || edge.length === 0) return;

          ws.selectedEdgeId = id;
          ws.selectedNodeId = null;

          uiState.selectedEventId = null;
          uiState.selectedEdgeId = id;

          if (!uiState.patternLinkPageState) {
            uiState.patternLinkPageState = {};
          }
          uiState.patternLinkPageState.selectedEdgeId = id;
          uiState.patternLinkPageState.selectedNodeId = null;

          saveLabState?.();
          plc.center(edge);
          renderPatternLinkFocusHeader?.();
          renderPatternLinkDetail?.();
        };
      });

    els.patternLinkDetailBody
      .querySelectorAll("[data-pl-open-group]")
      .forEach((btn) => {
        btn.onclick = () => {
          const id = btn.dataset.plOpenGroup;
          if (!id) return;
          selectGroupInPatternLinkPage(id);
        };
      });

    return;
  }

  // ======================
  // GROUP DETAIL
  // ======================
  if (selectedGroup) {
    const centerNodeId = getGroupCenterNodeId(selectedGroup);
    const memberNodeIds = getGroupMemberNodeIds(selectedGroup);
    const requiredNodeIds = getGroupRequiredNodeIds(selectedGroup);
    const edgeTypes = getGroupEdgeTypes(selectedGroup);
    const signatureTags = getGroupSignatureTags(selectedGroup);
    const purityTags = getGroupPurityTags(selectedGroup);
    const contaminationTags = getGroupContaminationTags(selectedGroup);

    const purityScore = getGroupEvaluationScore(selectedGroup, "purityScore", 1);
    const contaminationScore = getGroupEvaluationScore(selectedGroup, "contaminationScore", 0);
    const importanceScore = getGroupEvaluationScore(selectedGroup, "importanceScore", 0);
    const confidenceScore = getGroupEvaluationScore(selectedGroup, "confidenceScore", 0);
    const cohesionScore = getGroupEvaluationScore(selectedGroup, "cohesionScore", 0);
    const overlapScore = getGroupEvaluationScore(selectedGroup, "overlapScore", 0);

    const relatedEdgeButtons = buildPatternLinkGroupEdgeButtons(selectedGroup, plc);

    const memberButtons = memberNodeIds.length
      ? memberNodeIds.map((nodeId) => `
          <button class="pl-jump-btn" data-pl-jump-event="${nodeId}">
            ${nodeId}
          </button>
        `).join("")
      : `<div class="empty-state">멤버 node 없음</div>`;

    els.patternLinkDetailBody.innerHTML = `
      <div class="pl-detail-section">
        <div class="pl-detail-title">GROUP</div>
        <div><b>ID</b>: ${selectedGroup.id || "-"}</div>
        <div><b>Name</b>: ${selectedGroup.label || selectedGroup.name || "-"}</div>
        <div><b>Center</b>: ${centerNodeId || "-"}</div>
        <div><b>Relation</b>: ${edgeTypes.length ? edgeTypes.join(", ") : "-"}</div>
      </div>

      <div class="pl-detail-section">
        <div class="pl-detail-title">EVALUATION</div>
        <div><b>Purity</b>: ${purityScore.toFixed(2)}</div>
        <div><b>Contamination</b>: ${contaminationScore.toFixed(2)}</div>
        <div><b>Importance</b>: ${importanceScore.toFixed(2)}</div>
        <div><b>Confidence</b>: ${confidenceScore.toFixed(2)}</div>
        <div><b>Cohesion</b>: ${cohesionScore.toFixed(2)}</div>
        <div><b>Overlap</b>: ${overlapScore.toFixed(2)}</div>
      </div>

      <div class="pl-detail-section">
        <div class="pl-detail-title">STRUCTURE</div>
        <div><b>Members</b>: ${memberNodeIds.length}</div>
        <div><b>Required</b>: ${requiredNodeIds.length ? requiredNodeIds.join(", ") : "-"}</div>
        <div><b>Pattern</b>: ${
          Array.isArray(selectedGroup?.context?.sourcePatternIds) && selectedGroup.context.sourcePatternIds.length
            ? selectedGroup.context.sourcePatternIds.join(", ")
            : "-"
        }</div>
        <div><b>Layer</b>: ${
          Array.isArray(selectedGroup?.context?.sourceLayerNames) && selectedGroup.context.sourceLayerNames.length
            ? selectedGroup.context.sourceLayerNames.join(", ")
            : "-"
        }</div>
      </div>

      <div class="pl-detail-section">
        <div class="pl-detail-title">TAGS</div>
        <div><b>Signature</b>: ${signatureTags.length ? signatureTags.join(", ") : "-"}</div>
        <div><b>Purity Tags</b>: ${purityTags.length ? purityTags.join(", ") : "-"}</div>
        <div><b>Contamination Tags</b>: ${contaminationTags.length ? contaminationTags.join(", ") : "-"}</div>
      </div>

      <div class="pl-detail-section">
        <div class="pl-detail-title">MEMBERS</div>
        <div class="pl-edge-list">
          ${memberButtons}
        </div>
      </div>

      <div class="pl-detail-section">
        <div class="pl-detail-title">RELATED EDGES</div>
        <div class="pl-edge-list">
          ${relatedEdgeButtons}
        </div>
      </div>
    `;

    els.patternLinkDetailBody
      .querySelectorAll("[data-pl-jump-event]")
      .forEach((btn) => {
        btn.onclick = () => {
          const id = btn.dataset.plJumpEvent;
          if (!id) return;

          const node = plc?.getElementById(id);
          if (!node || node.length === 0) return;

          uiState.selectedEventId = id;
          uiState.selectedEdgeId = null;

          ws.selectedNodeId = id;
          ws.selectedEdgeId = null;

          if (!uiState.patternLinkPageState) {
            uiState.patternLinkPageState = {};
          }
          uiState.patternLinkPageState.selectedNodeId = id;
          uiState.patternLinkPageState.selectedEdgeId = null;

          saveLabState?.();
          plc.center(node);
          renderPatternLinkFocusHeader?.();
          renderPatternLinkDetail?.();
        };
      });

    els.patternLinkDetailBody
      .querySelectorAll("[data-pl-jump-edge]")
      .forEach((btn) => {
        btn.onclick = () => {
          const id = btn.dataset.plJumpEdge;
          if (!id) return;

          const edge = plc?.getElementById(id);
          if (!edge || edge.length === 0) return;

          ws.selectedEdgeId = id;
          ws.selectedNodeId = null;

          uiState.selectedEventId = null;
          uiState.selectedEdgeId = id;

          if (!uiState.patternLinkPageState) {
            uiState.patternLinkPageState = {};
          }
          uiState.patternLinkPageState.selectedEdgeId = id;
          uiState.patternLinkPageState.selectedNodeId = null;

          saveLabState?.();
          plc.center(edge);
          renderPatternLinkFocusHeader?.();
          renderPatternLinkDetail?.();
        };
      });

    return;
  }

  // ======================
  // DEFAULT
  // ======================
  els.patternLinkDetailBody.innerHTML = `
    <div class="pl-detail-section">
      <div class="pl-detail-title">DETAIL</div>
      <div class="empty-state">노드, 엣지 또는 그룹을 선택하세요.</div>
    </div>
  `;
}

function getFilterDimOpacity(multiplier, pass) {
  if (!pass) return 0.10;
  if (multiplier >= 2.0) return 1.0;   // PEAK
  if (multiplier >= 1.6) return 0.92;  // CORE
  if (multiplier >= 1.3) return 0.82;  // HIGH
  if (multiplier >= 1.1) return 0.70;  // BOOST
  return 0.55;                         // BASE
}

function getFilterGradeColor(grade) {
  if (grade === "BOOST") return "#74c0fc";
  if (grade === "HIGH") return "#ffd43b";
  if (grade === "CORE") return "#ff922b";
  if (grade === "PEAK") return "#ff6b6b";

  if (grade === "NEAR") return "#8ce99a";
  if (grade === "WEAK") return "#adb5bd";
  if (grade === "FAIL") return "#868e96";
  if (grade === "DEAD") return "#495057";

  return "#cbd5e1";
}

function getFilterGradeRank(grade) {
  const map = {
    PEAK: 9,
    CORE: 8,
    HIGH: 7,
    BOOST: 6,
    BASE: 5,
    NEAR: 4,
    WEAK: 3,
    FAIL: 2,
    DEAD: 1,
    DIM: 0
  };

  return map[String(grade || "").toUpperCase()] ?? -1;
}

function getAllDataFilterMetrics(item) {
  if (!item || item.scope !== "EVENT") {
    return {
      grade: null,
      gradeRank: -1,
      multiplier: -1
    };
  }

  const refId = item.refId;
  const node = window.cy ? cy.getElementById(refId) : null;

  const grade =
    node && node.length > 0 ? node.data("filterGrade") : null;

  const multiplier =
    node && node.length > 0
      ? Number(node.data("filterMultiplier") ?? -1)
      : -1;

  return {
    grade,
    gradeRank: getFilterGradeRank(grade),
    multiplier: Number.isFinite(multiplier) ? multiplier : -1
  };
}

function getFailOpacity(multiplier) {
  if (multiplier >= 0.75) return 0.55; // NEAR
  if (multiplier >= 0.45) return 0.32; // WEAK
  if (multiplier > 0) return 0.16;     // FAIL
  return 0.08;                         // DEAD
}

function applyFilterGradeVisuals() {
  if (!window.cy) return;

  cy.nodes().forEach((node) => {
    const grade = node.data("filterGrade");
    const pass = !!node.data("filterPass");
    const multiplier = Number(node.data("filterMultiplier") || 0);
    const color = getFilterGradeColor(grade);

    if (pass) {
      node.style("opacity", 1);
      node.style("border-width", 3);
      node.style("border-color", color);
      node.style("background-blacken", 0);
    } else {
      node.style("opacity", getFailOpacity(multiplier));
      node.style("border-width", 1);
      node.style("border-color", color);
      node.style("background-blacken", -0.55);
    }
  });

  cy.edges().forEach((edge) => {
    const sourcePass = !!edge.source().data("filterPass");
    const targetPass = !!edge.target().data("filterPass");

    if (!sourcePass || !targetPass) {
      const sourceM = Number(edge.source().data("filterMultiplier") || 0);
      const targetM = Number(edge.target().data("filterMultiplier") || 0);
      const avg = (sourceM + targetM) / 2;
      edge.style("opacity", Math.max(0.04, getFailOpacity(avg) * 0.6));
    } else {
      edge.style("opacity", 1);
    }
  });
}

function renderEventDetail(evt) {
  const panel = els.patternDetailPanel;
  if (!panel) return;

  if (!evt) {
    panel.innerHTML = `
<b>[이벤트 상세]</b><br><br>
이벤트를 선택하면 상세 정보가 표시됩니다.
`;
    return;
  }

  const edges = engine.getEdges() || [];
  const connectionCount = edges.filter(
    (e) => e.from === evt.id || e.to === evt.id
  ).length;
  const rawMultiplier = node.data("filterRawMultiplier");

  const cyNode = window.cy ? cy.getElementById(evt.id) : null;

  const runtimeLabel =
    cyNode && cyNode.length > 0 ? cyNode.data("label") : evt.label;

  const filterGrade =
    cyNode && cyNode.length > 0
      ? (cyNode.data("filterGrade") || "-")
      : (evt.filterGrade || "-");

const filterMultiplierRaw =
  cyNode && cyNode.length > 0
    ? cyNode.data("filterMultiplier")
    : evt.filterMultiplier;

const filterRawMultiplier =
  cyNode && cyNode.length > 0
    ? cyNode.data("filterRawMultiplier")
    : evt.filterRawMultiplier;

  const filterRotFactor =
    cyNode && cyNode.length > 0 ? cyNode.data("filterRotFactor") : null;

  const filterCapFactor =
    cyNode && cyNode.length > 0 ? cyNode.data("filterCapFactor") : null;

  const filterVarFactor =
    cyNode && cyNode.length > 0 ? cyNode.data("filterVarFactor") : null;

  const filterPass =
    cyNode && cyNode.length > 0 ? cyNode.data("filterPass") : null;

  const gradeColor = getFilterGradeColor(filterGrade);

  panel.innerHTML = `
<b>[이벤트 상세]</b><br><br>

<div class="pattern-detail-title">${runtimeLabel || "-"}</div>

[기본 정보]<br>
ID: ${evt.id || "-"}<br>
티커: ${evt.ticker || "-"}<br>
시각: ${evt.time || "-"}<br><br>

[상태]<br>
감정: ${evt.sentiment || "-"}<br>
신뢰도: ${
  typeof evt.confidence === "number" ? evt.confidence.toFixed(2) : "-"
}<br>
Filter Pass: ${
  typeof filterPass === "boolean" ? (filterPass ? "YES" : "NO") : "-"
}<br>
Filter Grade: <span style="color:${gradeColor}; font-weight:700;">${filterGrade}</span><br>
Multiplier: ${
  typeof filterMultiplierRaw === "number"
    ? Number(filterMultiplierRaw).toFixed(3)
    : "-"
}<br>
Raw Multiplier: ${
  typeof filterRawMultiplier === "number"
    ? Number(filterRawMultiplier).toFixed(3)
    : "-"
}<br>

[Factor]<br>
ROT Factor: ${
  typeof filterRotFactor === "number"
    ? Number(filterRotFactor).toFixed(3)
    : "-"
}<br>
CAP Factor: ${
  typeof filterCapFactor === "number"
    ? Number(filterCapFactor).toFixed(3)
    : "-"
}<br>
VAR Factor: ${
  typeof filterVarFactor === "number"
    ? Number(filterVarFactor).toFixed(3)
    : "-"
}<br><br>

[연결]<br>
연결 수: ${connectionCount}<br><br>
`;
}

function selectPattern(patternId, cards = null, selectedCard = null) {
  const result = uiState.patternMap.get(patternId);
  if (!result) return;

  const pattern = result.pattern;

  uiState.selectedPattern = pattern;
uiState.selectedPatternId = patternId;

updatePatternActionUI();
updatePatternToLayerButton();

addLog("pattern", {
  id: patternId,
  type: pattern.type
});

  uiState.selectedGroup = null;
  uiState.selectedGroupId = null;
  
  uiState.selectedEventId = null;
uiState.selectedEvent = null;


  if (cards) clearPatternSelectionUI(cards);
  if (selectedCard) selectedCard.classList.add("selected");

  if (
  !uiState.navStack.length ||
  uiState.navStack[uiState.navStack.length - 1]?.type !== "patternList"
) {
  pushState("patternList", uiState.rawRankedResults || []);
}
  
  const groups = buildGroupsFromPattern(pattern);
  groups.forEach((g) => groupStore.set(g.id, g));

  pushState("groupList", {
    patternId: pattern.id,
    groups
  });

  pushLog("SELECT_PATTERN", {
  patternId
});

console.log("PATTERN LOG PAYLOAD:", {
  id: patternId,
  type: pattern.type
});

  renderGroups(groups);
  renderPatternDetail(pattern);
  renderDebugStatus();
  saveLabState();
  renderFocusHeader();
  resetGraphFocus();
  renderSideMiniStatus();
  renderDetailPanel();
}

// Group 클릭 시 그래프 미리 강조

//function previewGroup(group) {
  //cy.elements().style("opacity", 0.1);
//
  //const center = cy.getElementById(group.center);
  //if (center && center.length > 0) {
    //center.style({
      //"opacity": 1,
      //"background-color": "#ff922b"
    //});
  //}

  //group.nodes.forEach((id) => {
    //const node = cy.getElementById(id);
    //if (node && node.length > 0) {
      //node.style({
        //"opacity": 0.7
      //});
    //}
  //});
//}

// EVT 강조 규칙 강화 (거리 기반 확장)

// ===== EXPERIMENTAL =====
//function highlightEventWithDepth(eventId, depth = 1) {
  //const visited = new Set();
  //const queue = [{ id: eventId, d: 0 }];

  //cy.elements().style("opacity", 0.05);

  //while (queue.length > 0) {
    //const { id, d } = queue.shift();
    //if (visited.has(id)) continue;
    //visited.add(id);

    //const node = cy.getElementById(id);
    //if (node && node.length > 0) {
      //node.style({
        //"opacity": 1,
        //"background-color": d === 0 ? "#ffd700" : "#ffe066"
      //});
    //}

    //if (d >= depth) continue;

    //cy.edges().forEach((e) => {
      //if (e.data("source") === id || e.data("target") === id) {
        //e.style({
          //"opacity": 1,
          //"line-color": "#ffd700",
          //"width": 2 + (depth - d)
        //});

        //const next =
          //e.data("source") === id
            //? e.data("target")
            //: e.data("source");

        //queue.push({ id: next, d: d + 1 });
      //}
    //});
  //}
//}

function previewNodeFocus(id) {
  if (typeof focusNodeByIdFromFilterRank === "function") {
    focusNodeByIdFromFilterRank(id);
  }
}

function applyRelationExplorerFocusToPatternLink() {
  const plc = getPatternLinkCy?.();
  if (!plc) return;

  const rel = uiState.relationExplorer || {};
  if (!rel.baseGroupId) return;

  const nodeWeights = rel.focusNodeWeights || {};
  const edgeWeights = rel.focusEdgeWeights || {};

  const activeNodeIds = new Set(
    Object.keys(nodeWeights).filter((id) => Number(nodeWeights[id] || 0) > 0)
  );
  const activeEdgeIds = new Set(
    Object.keys(edgeWeights).filter((id) => Number(edgeWeights[id] || 0) > 0)
  );

  const preview = getRelationExplorerPreviewSets?.() || { nodeIds: [], edgeIds: [] };
  const previewNodeSet = new Set(preview.nodeIds || []);
  const previewEdgeSet = new Set(preview.edgeIds || []);

  const hasSelectedFocus = activeNodeIds.size > 0 || activeEdgeIds.size > 0;
  const hasPreviewFocus = previewNodeSet.size > 0 || previewEdgeSet.size > 0;

  plc.nodes().forEach((node) => {
    if (!hasSelectedFocus && !hasPreviewFocus) {
      node.removeStyle("opacity");
      node.removeStyle("border-width");
      node.removeStyle("border-color");
      node.removeStyle("background-color");
      node.removeStyle("text-opacity");
      return;
    }

    const weight = Number(nodeWeights[node.id()] || 0);

    if (weight > 0) {
      let color = "#7cc4ff";
      let borderWidth = 3;
      let opacity = 0.95;

      if (weight >= 4) {
        color = "#ffd54f";
        borderWidth = 5;
        opacity = 1;
      } else if (weight >= 3) {
        color = "#ff6b6b";
        borderWidth = 4;
        opacity = 0.98;
      } else if (weight >= 2) {
        color = "#b197fc";
        borderWidth = 4;
        opacity = 0.96;
      }

      node.style("opacity", opacity);
      node.style("text-opacity", 1);
      node.style("border-width", borderWidth);
      node.style("border-color", color);
      node.style("background-color", color);
      return;
    }

    if (previewNodeSet.has(node.id())) {
      node.style("opacity", 0.22);
      node.style("text-opacity", 0.16);
      node.style("border-width", 2);
      node.style("border-color", "#5c677d");
      node.removeStyle("background-color");
      return;
    }

    node.style("opacity", 0.06);
    node.style("text-opacity", 0.04);
    node.style("border-width", 1);
    node.removeStyle("border-color");
    node.removeStyle("background-color");
  });

  plc.edges().forEach((edge) => {
    if (!hasSelectedFocus && !hasPreviewFocus) {
      edge.removeStyle("opacity");
      edge.removeStyle("width");
      edge.removeStyle("line-color");
      edge.removeStyle("target-arrow-color");
      return;
    }

    const weight = Number(edgeWeights[edge.id()] || 0);

    if (weight > 0) {
      let color = "#7cc4ff";
      let width = 2.4;
      let opacity = 0.7;

      if (weight >= 4) {
        color = "#ffd54f";
        width = 4;
        opacity = 1;
      } else if (weight >= 3) {
        color = "#ff6b6b";
        width = 3.2;
        opacity = 0.9;
      } else if (weight >= 2) {
        color = "#b197fc";
        width = 2.8;
        opacity = 0.8;
      }

      edge.style("opacity", opacity);
      edge.style("width", width);
      edge.style("line-color", color);
      edge.style("target-arrow-color", color);
      return;
    }

    if (previewEdgeSet.has(edge.id())) {
      edge.style("opacity", 0.16);
      edge.style("width", 1.4);
      edge.style("line-color", "#4b5563");
      edge.style("target-arrow-color", "#4b5563");
      return;
    }

    edge.style("opacity", 0.03);
    edge.style("width", 1);
    edge.style("line-color", "#2f3440");
    edge.style("target-arrow-color", "#2f3440");
  });
}

function previewNodeFocusFromRelation(id) {
  if (!window.cy || !id) return;

  const node = cy.getElementById(id);
  if (!node || node.length === 0) return;

  cy.animate({
    center: { eles: node },
    duration: 220
  });

  node.style({
    "border-width": 6,
    "border-color": "#ffd54f"
  });

  setTimeout(() => {
    const current = cy.getElementById(id);
    if (!current || current.length === 0) return;

    current.style({
      "border-width": 4,
      "border-color": "#ff8a65"
    });
  }, 220);
}

function renderEvents(group) {
  const panel = els.predictionPanel;
  if (!panel || !group) return;

  const allEventIds = [group.center, ...(group.nodes || [])];
  let html = "";

  allEventIds.forEach((eventId) => {
    const meta = getEventCardMeta(eventId);
    const isCenter = eventId === group.center;

    html += `
<div class="event-card" data-event-id="${eventId}">
  <b>${isCenter ? "● 중심 이벤트" : "○ 연결 이벤트"}</b><br><br>
  이름: ${meta.label || "-"}<br>
  감정: ${meta.sentiment || "-"}<br>
  중요도: ${meta.level || "-"}
</div>
`;
  });

  panel.innerHTML = html;

  const cards = panel.querySelectorAll(".event-card");
  cards.forEach((card) => {
    card.onclick = () => {
      const id = card.dataset.eventId;
      selectEvent(id, true);
    };
  });
}

function applyComputedGraphState(nodeStates, edgeStates) {
  cy.nodes().forEach((node) => {
    const state = nodeStates[node.id()];
    if (!state) return;

    node.removeClass("node-dimmed");

    if (state.dim) {
      node.addClass("node-dimmed");
    }

    node.style({
      "background-color": state.color || "#2a2f3a",
      "border-color": state.borderColor || "#6ea8d9",
      "border-width": state.borderWidth ?? 2,
      "opacity": state.opacity ?? (state.dim ? 0.12 : 1)
    });
  });

  cy.edges().forEach((edge) => {
    const state = edgeStates[edge.id()];
    if (!state) return;

    edge.removeClass("edge-dimmed");

    if (state.dim) {
      edge.addClass("edge-dimmed");
    }

    edge.style({
      "line-color": state.color || "#777",
      "target-arrow-color": state.color || "#777",
      width: state.width || 2,
      "opacity": state.opacity ?? (state.dim ? 0.08 : 1)
    });
  });
}

function evaluateEdgeState(edge, sourceState, targetState) {
  const state = createEdgeState(edge);

  if (sourceState.dim || targetState.dim) {
    state.dim = true;
  }

  if (uiState.selectedGroup) {
    const group = uiState.selectedGroup;
    const relatedIds = new Set([
      group.center,
      ...(group.nodes || []),
      ...(group.related || [])
    ]);

    const connected =
      relatedIds.has(edge.source().id()) &&
      relatedIds.has(edge.target().id());

    if (connected) {
      state.dim = false;
      state.highlight = true;
      state.color = "#7cc4ff";
      state.width = 2;
      state.emphasis += 3;
    }
  }

  if (uiState.selectedEventId) {
    const eventId = uiState.selectedEventId;
    const connectedToEvent =
      edge.source().id() === eventId || edge.target().id() === eventId;

    if (connectedToEvent) {
      state.dim = false;
      state.highlight = true;
      state.color = "#ffd700";
      state.width = 3;
      state.emphasis += 5;
    }
  }

  return state;
}

function evaluateEventForNode(node, state) {
  const eventId = uiState.selectedEventId;
  if (!eventId) return state;

  if (node.id() === eventId) {
    state.color = "#ffd700";
    state.borderColor = "#ff00ff";
    state.emphasis += 10;
    state.forceHighlight = true;
  } else {
    state.emphasis -= 1;
  }

  return state;
}

function evaluateLayerForNode(node, state) {
  const layer = getCurrentLayerObject();
  const filter = uiState.currentLayerFilter || {};

  if (layer && layer.nodes && layer.nodes.length > 0) {
    const ids = new Set(layer.nodes);

    if (!ids.has(node.id())) {
      state.emphasis -= 2;
    } else {
      state.color = "#7cc4ff";
      state.borderColor = "#d0ebff";
      state.emphasis += 2;
      state.forceHighlight = true;
    }
  }

  const rot = Number(node.data("rot"));
  const cap = Number(node.data("cap"));
  const vari = Number(node.data("var"));

  const hasRot = filter.rotMin !== null && filter.rotMin !== undefined;
  const hasCap = filter.capMax !== null && filter.capMax !== undefined;
  const hasVar = filter.varMin !== null && filter.varMin !== undefined;

  const hasAnyFilter = hasRot || hasCap || hasVar;

  let pass = true;

  if (hasRot && !(rot >= filter.rotMin)) pass = false;
  if (hasCap && !(cap <= filter.capMax)) pass = false;
  if (hasVar && !(vari >= filter.varMin)) pass = false;

  if (hasAnyFilter) {
    if (!pass) {
      state.emphasis -= 2;
    } else {
      state.emphasis += 1;
      state.forceHighlight = true;
    }
  }

const filterResult = computeLayerFilterMultiplier(node, filter);

state.filterPass = filterResult.pass;
state.filterMultiplier = filterResult.multiplier;
state.filterGrade = filterResult.grade;

if (!filterResult.pass) {
  state.dim = true;
  state.emphasis = Math.min(state.emphasis, -2.2);
} else {
  state.dim = false; // pass면 dim 금지
  state.emphasis *= filterResult.multiplier;

  if (filterResult.grade === "BOOST") {
    state.emphasis += 0.10;
  } else if (filterResult.grade === "HIGH") {
    state.emphasis += 0.24;
  } else if (filterResult.grade === "CORE") {
    state.emphasis += 0.44;
  } else if (filterResult.grade === "PEAK") {
    state.emphasis += 0.72;
  }
}

  return state;
}

function evaluateModeForNode(node, state) {
  const mode = uiState.mode || "explore";
  const sentiment = String(node.data("sentiment") || "").toLowerCase();
  const stat = String(node.data("stat") || "").toLowerCase();

  if (mode === "explore") {
    return state;
  }

  if (mode === "warning") {
    const isWarning =
      stat === "death" ||
      sentiment === "bearish" ||
      sentiment === "warning";

    if (isWarning) {
      state.color = "#3a1f1f";
      state.borderColor = "#ff6b6b";
      state.emphasis += 1;
      state.forceHighlight = true;
    } else {
      state.emphasis -= 1;
    }

    return state;
  }

  if (mode === "focus") {
    const isFocus =
      sentiment === "bullish" ||
      sentiment === "focus";

    if (isFocus) {
      state.color = "#1f2f24";
      state.borderColor = "#51cf66";
      state.emphasis += 1;
      state.forceHighlight = true;
    } else {
      state.emphasis -= 1;
    }

    return state;
  }

  return state;
}

function computeSelectedGroupFocusProfile() {
  const ids = Array.isArray(uiState.activeGroupIds)
    ? uiState.activeGroupIds
    : [];

  const groups = ids
    .map((id) => groupStore.get(id))
    .filter(Boolean);

  if (!groups.length) {
    return {
      coreNodeIds: [],
      relatedNodeIds: []
    };
  }

  if (groups.length === 1) {
    const g = groups[0];
    const coreNodeIds = [
      ...new Set([
        getGroupCenterNodeId(g),
        ...getGroupRequiredNodeIds(g)
      ].filter(Boolean))
    ];

    const relatedNodeIds = [
      ...new Set(getGroupAllNodeIds(g))
    ];

    return {
      coreNodeIds: coreNodeIds.length ? coreNodeIds : [...relatedNodeIds],
      relatedNodeIds: [...relatedNodeIds]
    };
  }

  const nodeSets = groups.map((g) => {
    return new Set(getGroupAllNodeIds(g));
  });

  const coreNodeIds = [...nodeSets[0]].filter((id) =>
    nodeSets.every((set) => set.has(id))
  );

  const relatedSet = new Set();
  groups.forEach((g) => {
    getGroupAllNodeIds(g).forEach((id) => {
      if (id) relatedSet.add(id);
    });
  });

  return {
    coreNodeIds,
    relatedNodeIds: [...relatedSet]
  };
}

function createNodeState(node) {
  return {
    dim: false,
    forceHighlight: false,
    color: null,
    borderColor: null,
    borderWidth: null,
    opacity: null,
    emphasis: 0
  };
}

function createEdgeState(edge) {
  return {
    id: edge.id(),
    visible: true,
    dim: false,
    highlight: false,
    color: null,
    width: null,
    emphasis: 0
  };
}

function getCurrentLayerObject() {
  if (!uiState.currentLayerName || !uiState.savedLayers) return null;
  return uiState.savedLayers.find(
    (l) => l.name === uiState.currentLayerName
  ) || null;
}

/**
 * [CORE] 그래프 갱신 단일 파이프라인
 * 모든 그래프 시각화 변경은 이 함수를 통해서만 실행됩니다.
 */
refreshGraphState();

function resetGraphFocus() {
  if (!window.cy) return;

  cy.nodes().forEach((node) => {
    node.removeClass("node-dimmed");
    node.style({
      "background-color": "#1e2025",
      "border-color": "#4dabf7"
    });
  });

  cy.edges().forEach((edge) => {
    edge.removeClass("edge-dimmed");
    edge.style({
      "line-color": "#666",
      "target-arrow-color": "#666",
      width: 2
    });
  });
}

function applyModeLayer() {
  const mode = uiState.mode || "explore";
  if (mode === "explore") return;

  if (mode === "warning") {
    cy.nodes().forEach((node) => {
      const isWarning = node.data("stat") === "Death" || node.data("sentiment") === "bearish";
      if (isWarning) {
        node.style({ "background-color": "#3a1f1f", "border-color": "#ff6b6b" });
      } else {
        node.addClass("node-dimmed");
      }
    });
    cy.edges().forEach((edge) => {
      const sourceWarning = edge.source().data("stat") === "Death" || edge.source().data("sentiment") === "bearish";
      const targetWarning = edge.target().data("stat") === "Death" || edge.target().data("sentiment") === "bearish";
      if (sourceWarning || targetWarning) {
        edge.style({ "line-color": "#ff6b6b", "target-arrow-color": "#ff6b6b", width: 3 });
      } else {
        edge.addClass("edge-dimmed");
      }
    });
  } else if (mode === "focus") {
    cy.nodes().forEach((node) => {
      if (node.data("sentiment") === "bullish") {
        node.style({ "background-color": "#1f2f24", "border-color": "#51cf66" });
      } else {
        node.addClass("node-dimmed");
      }
    });
    cy.edges().forEach((edge) => {
      const type = edge.data("type");
      if (type === "CAUSE" || type === "PRECURSOR") {
        edge.style({ "line-color": "#74c0fc", "target-arrow-color": "#74c0fc", width: 3 });
      } else {
        edge.addClass("edge-dimmed");
      }
    });
  }
}

function applyLayer(nodes, mode = "create") {
  if (mode === "append") {
    currentLayer.nodes = [...new Set([...currentLayer.nodes, ...nodes])];
  }

  if (mode === "replace") {
    currentLayer.nodes = nodes;
  }

  if (mode === "create") {
    createLayerEntry({ nodes });
  }
}

function applyLayerLayer() {
  if (!uiState.currentLayerName || !uiState.savedLayers) return;

  const layer = uiState.savedLayers.find(
    (l) => l.name === uiState.currentLayerName
  );
  if (!layer || !layer.nodes) return;

  if (layer.filter) {
    uiState.currentLayerFilter = { ...layer.filter };

    if (els.rotMinInput) els.rotMinInput.value = layer.filter.rotMin ?? "";
    if (els.capMaxInput) els.capMaxInput.value = layer.filter.capMax ?? "";
    if (els.varMinInput) els.varMinInput.value = layer.filter.varMin ?? "";
  }

  const ids = new Set(layer.nodes);

  cy.nodes().forEach((node) => {
    if (ids.has(node.id())) {
      node.style({
        "background-color": "#7cc4ff",
        "border-color": "#d0ebff"
      });
    } else {
      node.addClass("node-dimmed");
    }
  });

  cy.edges().forEach((edge) => {
    if (ids.has(edge.source().id()) && ids.has(edge.target().id())) {
      edge.style({
        "line-color": "#7cc4ff",
        "target-arrow-color": "#7cc4ff",
        width: 2
      });
    } else {
      edge.addClass("edge-dimmed");
    }
  });
}

function applyGroupLayer() {
  const group = uiState.selectedGroup;
  if (!group) return;

  const relatedIds = new Set([group.center, ...(group.nodes || []), ...(group.related || [])]);
  cy.nodes().forEach((node) => {
    if (relatedIds.has(node.id())) {
      node.style({ "background-color": "#7cc4ff", "border-color": "#d0ebff" });
    } else {
      node.addClass("node-dimmed");
    }
  });
  cy.edges().forEach((edge) => {
    if (relatedIds.has(edge.source().id()) && relatedIds.has(edge.target().id())) {
      edge.style({ "line-color": "#7cc4ff", "target-arrow-color": "#7cc4ff", width: 2 });
    } else {
      edge.addClass("edge-dimmed");
    }
  });
}

function applyEventLayer() {
  const eventId = uiState.selectedEventId;
  if (!eventId) return;

  const main = cy.getElementById(eventId);
  if (main && main.length > 0) {
    main.removeClass("node-dimmed"); // 강조 대상은 dim 해제
    main.style({
      "background-color": "#ffd700",
      "border-color": "#ff00ff",
      "border-width": 4
    });
  }
}

function applyGraphVisibilityRules() {
  // 현재 레이어 시스템과 충돌 방지를 위해 비활성화 (요청 사항)
}

function applyGraphToggleRules() {
  if (!window.cy) return;
  const toggles = uiState.graphToggles || {};

  cy.nodes().forEach((node) => {
    if (node.data("kind") === "pattern") return;
    // Opacity는 건드리지 않고 Label만 제어
    node.style("label", toggles.showEventLabels ? (node.data("label") || node.id()) : "");
  });

  cy.edges().forEach((edge) => {
    if (edge.data("kind") === "pattern-link") {
      edge.style("display", toggles.showPatternLinks ? "element" : "none");
    } else if (toggles.hideWeakEdges) {
      const strength = edge.data("strength");
      const weak = (typeof strength === "number" && strength < 0.45);
      edge.style("display", weak ? "none" : "element");
    } else {
      edge.style("display", "element");
    }
  });
}

// 상위 제어 함수들 (UI 이벤트 핸들러)
function applyMode(modeName) {
  uiState.mode = modeName;

recordLog({
  type: "MODE_CHANGE",
  scope: "MODE",
  refId: modeName,
  summary: `[MODE] 변경: ${modeName}`,
  payload: {
    mode: modeName
  }
});

document.body.dataset.mode = modeName;
  
  // refreshCurrentView() 대신 상태 파이프라인 호출
  refreshGraphState();
  
  renderModeButtons();
  renderSideMiniStatus();
  saveLabState();
}

function selectGroupInPatternLinkPage(groupId, options = {}) {
  if (!groupId) return;

  const group = groupStore.get(groupId);
  if (!group) return;

  const plc = getPatternLinkCy?.() || window.patternLinkCy;
  const ws = getPatternLinkWorkspace();
  const centerNodeId = getGroupCenterNodeId(group);

  if (!uiState.patternLinkPageState) {
    uiState.patternLinkPageState = {};
  }

  uiState.patternLinkPageState.selectedGroupId = groupId;
  uiState.patternLinkPageState.selectedGroupRefId = groupId;
  uiState.patternLinkPageState.selectedNodeId = centerNodeId || null;
  uiState.patternLinkPageState.selectedEdgeId = null;

  // 좌클릭 preview 전용
  if (options.preview !== false) {
    uiState.patternLinkPageState.previewGroupIds = [groupId];
  }

  // 명시적으로 activate:true일 때만 ON 처리
  if (options.activate === true) {
    uiState.patternLinkPageState.activeGroupIds = [groupId];
  }

  ws.selectedNodeId = centerNodeId || null;
  ws.selectedEdgeId = null;

  if (options.center !== false && plc && centerNodeId) {
    const node = plc.getElementById(centerNodeId);
    if (node && node.length) {
      plc.center(node);
      node.select();
    }
  }

  if (options.activate === true) {
    applyActiveGroupsToPatternLinkPage?.();
    if (plc) applyPatternLinkDimStyles?.(plc);
  }

  renderPatternLinkFocusHeader?.();
  renderPatternLinkDetail?.();
  updatePatternLinkCurrentGroupBox?.();

  saveLabState?.();
}

function selectGroup(groupId, cards = null, selectedCard = null) {
  if (!groupId) return;

  if (uiState.page === "pattern-link") {
    selectGroupInPatternLinkPage(groupId);
    return;
  }

  const group = groupStore.get(groupId);
  if (!group) return;

  ensureGraphPageVisible();

  const centerNodeId = getGroupCenterNodeId(group);

  uiState.selectedGroup = group;
  uiState.selectedGroupId = group.id;
  uiState.selectedEventId = centerNodeId;
  uiState.selectedEvent = getEventById?.(centerNodeId) || null;

  recordLog({
    type: "GROUP_SELECT",
    scope: "GROUP",
    refId: group.id,
    summary: `[GROUP] 선택: ${group.id || group.name || "-"}`,
    payload: group
  });

  if (cards) clearPatternSelectionUI(cards);
  if (selectedCard) selectedCard.classList.add("selected");

  pushState("eventView", { group, eventId: centerNodeId });

  renderEvents?.(group);
  renderSideMiniStatus();
  refreshGraphState();
  renderDebugStatus?.();
  saveLabState();
  renderFocusHeader();
  renderDetailPanel();
  renderPatternLinkPanel?.();
}

function toggleLayerDeleteSelection(layerName) {
  const list = uiState.selectedLayerNamesForDelete || [];
  const exists = list.includes(layerName);

  uiState.selectedLayerNamesForDelete = exists
    ? list.filter((name) => name !== layerName)
    : [...list, layerName];

  renderLayerPanel();
}

function openLayerDeleteModal() {
  const selected = uiState.selectedLayerNamesForDelete || [];
  if (!selected.length) return;

  if (els.layerDeleteModalList) {
    els.layerDeleteModalList.innerHTML = selected
      .map((name) => `<div class="layer-delete-name">${name}</div>`)
      .join("");
  }

  if (els.layerDeleteModal) {
    els.layerDeleteModal.classList.remove("hidden");
  }
}

function startLayerNameEdit(layerName, element) {
  if (!element) return;

  const input = document.createElement("input");
  input.type = "text";
  input.value = layerName;
  input.className = "layer-name-input";

  element.innerHTML = "";
  element.appendChild(input);

  input.focus();
  input.select();

  const finish = (save) => {
    const newName = input.value.trim();

    if (save && newName && newName !== layerName) {
      const exists = (uiState.savedLayers || []).some(l => l.name === newName);

      if (exists) {
        alert("이미 존재하는 Layer 이름입니다.");
        renderLayerPanel();
        return;
      }

      uiState.savedLayers = uiState.savedLayers.map(l => {
        if (l.name === layerName) {
          return { ...l, name: newName };
        }
        return l;
      });

      if (uiState.currentLayerName === layerName) {
        uiState.currentLayerName = newName;
      }
    }

    renderLayerPanel();
    saveLabState();
  };

  input.onkeydown = (e) => {
    if (e.key === "Enter") finish(true);
    if (e.key === "Escape") finish(false);
  };

  input.onblur = () => finish(true);
}

function renderPatterns(results) {
  const panel = els.predictionPanel;
  if (!panel) return;

  if (!results || results.length === 0) {
    uiState.rankedResults = [];
    uiState.rawRankedResults = [];
    uiState.lastDetectedPatterns = [];
    uiState.patternMap = new Map();

    panel.innerHTML = `
<div class="empty-state">
  <b>패턴 없음</b><br>
  현재 조건에서 감지된 패턴이 없습니다.
</div>
`;
    renderPatternMiniExplorer?.();
    return;
  }

  uiState.rawRankedResults = Array.isArray(results) ? [...results] : [];
  uiState.rankedResults = Array.isArray(results) ? [...results] : [];
  uiState.lastDetectedPatterns = results.map((r) => r.pattern);
  uiState.patternMap = new Map();

  results.forEach((r) => {
    upsertPatternEntry(r);
  });

  const visibleResults = results.filter((r) => {
    const p = r?.pattern || r;
    if (!p) return false;

    p.promoted = p.promoted || false;
    return !p.promoted;
  });

  if (!visibleResults.length) {
    panel.innerHTML = `
<div class="empty-state">
  <b>표시 가능한 패턴 없음</b><br>
  승격되지 않은 패턴이 없습니다.
</div>
`;
    renderPatternMiniExplorer?.();
    return;
  }

  const appliedIds =
    Array.isArray(uiState.appliedPatternIds) && uiState.appliedPatternIds.length
      ? uiState.appliedPatternIds
      : (uiState.appliedPatternId ? [uiState.appliedPatternId] : []);

  let html = "";

  visibleResults.forEach((r, i) => {
    const pattern = r?.pattern || r;
    if (!pattern?.id) return;

    const patternId = pattern.id;

    const isSelected =
      Array.isArray(uiState.selectedPatternIds) &&
      uiState.selectedPatternIds.includes(patternId);

    const isApplied =
      !!uiState.patternApplied &&
      appliedIds.includes(patternId);

    const isMuted =
      !!uiState.patternApplied &&
      appliedIds.length > 0 &&
      !isApplied;

    const cardClass = [
      "pattern-card",
      isSelected ? "selected" : "",
      isApplied ? "applied" : "",
      isMuted ? "muted" : ""
    ].filter(Boolean).join(" ");

    const prob = r?.probability;
    const probText = typeof prob === "number" ? prob.toFixed(2) : "-";

    let signal = "약함";
    if (typeof prob === "number" && prob > 0.7) signal = "강함";
    else if (typeof prob === "number" && prob > 0.4) signal = "중간";

    html += `
<div class="${cardClass}" data-pattern-id="${pattern.id}">
  <b>[패턴 ${i + 1}] ${pattern.type || "CUSTOM"}</b><br><br>
  확률: ${probText}<br>
  신호 강도: ${signal}<br>
  연결 이벤트 수: ${pattern.nodes?.length || 0}
</div>
`;
  });

  panel.innerHTML = html;

  const cards = panel.querySelectorAll(".pattern-card");

  cards.forEach((card) => {
    card.onclick = () => {
      const id = card.dataset.patternId;
      togglePatternSelection(id);
    };

    card.oncontextmenu = (e) => {
      e.preventDefault();

      const id = card.dataset.patternId;
      enterPatternFromCard(id, cards, card);
    };
  });

  renderPatternMiniExplorer?.();
}

function togglePatternSelection(patternId) {
  if (!patternId) return;

  if (!Array.isArray(uiState.selectedPatternIds)) {
    uiState.selectedPatternIds = [];
  }

  const exists = uiState.selectedPatternIds.includes(patternId);

  if (exists) {
    uiState.selectedPatternIds = uiState.selectedPatternIds.filter((id) => id !== patternId);
  } else {
    uiState.selectedPatternIds.push(patternId);
  }

  uiState.selectedPatternId = uiState.selectedPatternIds[0] || null;
  uiState.selectedPattern =
    uiState.selectedPatternId
      ? (uiState.patternMap?.get(uiState.selectedPatternId) || null)
      : null;

  renderPatterns(uiState.rawRankedResults || uiState.rankedResults || []);
  renderFocusHeader();
  updatePatternActionUI();
  renderPatternMiniExplorer();

}

function renderViewToggles() {
  const slot = document.getElementById("controls-view");
  if (!slot) return;

  slot.innerHTML = "";

  const box = document.createElement("div");
  box.id = "view-toggle-box";
  box.style.display = "inline-block";

  ["A", "B", "C", "D"].forEach((group) => {
    const btn = document.createElement("button");
    btn.textContent = group;
    btn.dataset.group = group;
    btn.style.marginRight = "6px";
    btn.style.opacity = uiState.viewFilters[group] ? "1" : "0.4";

    btn.onclick = () => {
      uiState.viewFilters[group] = !uiState.viewFilters[group];
      
      refreshCurrentView();
    };

    box.appendChild(btn);
  });

  slot.appendChild(box);
}

function applyActiveGroupsToPatternLinkPage() {
  const plc = getPatternLinkCy();
  if (!plc) return;

  const activeGroupIds = Array.isArray(uiState.patternLinkPageState?.activeGroupIds)
    ? uiState.patternLinkPageState.activeGroupIds
    : [];

    
  console.log("APPLY PL GROUPS");
console.log("PL activeGroupIds in apply", activeGroupIds);
console.log("PL cy exists", !!plc, plc?.nodes?.().length);

  plc.nodes().removeClass("pl-dim-node");
  plc.edges().removeClass("pl-dim-edge");

  if (!activeGroupIds.length) {
    return;
  }

  const visibleNodeIds = new Set();

  activeGroupIds.forEach((groupId) => {
    const group = groupStore.get(groupId);
    if (!group) return;

    getGroupAllNodeIds(group).forEach((id) => {
      if (id) visibleNodeIds.add(id);
    });
  });

plc.nodes().forEach((node) => {
  const isVisible = visibleNodeIds.has(node.id());
  console.log("PL node", node.id(), "visible", isVisible, "classes(before)", node.classes());

  if (!isVisible) {
    node.addClass("pl-dim-node");
  }

  console.log("PL node", node.id(), "classes(after)", node.classes());
});

  plc.edges().forEach((edge) => {
    const sourceId = edge.data("source");
    const targetId = edge.data("target");

    const visible =
      visibleNodeIds.has(sourceId) &&
      visibleNodeIds.has(targetId);

    if (!visible) {
      edge.addClass("pl-dim-edge");
    }
  });

  applyPatternLinkDimStyles?.(plc);

}

function applyPatternViewFilter(results) {
  return (results || []).map((r) => {
    const group = getImportanceGroup(r.probability ?? 0);
    return {
      ...r,
      __visible: uiState.viewFilters[group]
    };
  });
}

function removePatternNodesFromGraph() {
  if (!window.cy) return;

  const patternNodes = cy.nodes().filter((node) => node.data("kind") === "pattern");

  const patternEdges = cy.edges().filter((edge) => {
    const id = String(edge.id() || "");
    return (
      id.startsWith("pattern-edge-") ||
      id.startsWith("pattern-link-") ||
      id.startsWith("pattern-") ||
      edge.data("kind") === "pattern-link" ||
      edge.source().data("kind") === "pattern" ||
      edge.target().data("kind") === "pattern"
    );
  });

  cy.remove(patternEdges);
  cy.remove(patternNodes);
}


function removeGeneratedEventNodes() {
  const generatedNodes = cy.nodes().filter((node) => {
    return String(node.id()).startsWith("EVT-TEST-");
  });

  const generatedNodeIds = new Set(generatedNodes.map((n) => n.id()));

  const connectedEdges = cy.edges().filter((edge) => {
    return generatedNodeIds.has(edge.data("source")) || generatedNodeIds.has(edge.data("target"));
  });

  cy.remove(connectedEdges);
  cy.remove(generatedNodes);

  engine.nodes = engine.getNodes().filter((n) => !String(n.id).startsWith("EVT-TEST-"));
  engine.nodeMap = new Map(engine.nodes.map((n) => [n.id, n]));
}

function resetLabState() {
  timeline.reset();

  uiState.lastDetectedPatterns = [];
  uiState.rankedResults = [];
  uiState.rawRankedResults = [];
  uiState.patternMap = new Map();
  uiState.navStack = [];

  uiState.selectedPattern = null;
  uiState.selectedPatternId = null;
  uiState.selectedGroup = null;
  uiState.selectedGroupId = null;
  
  uiState.selectedEventId = null;
uiState.selectedEvent = null;


  const cards = document.querySelectorAll(".pattern-card");
  cards.forEach((card) => card.classList.remove("selected"));

  removePatternNodesFromGraph();
  removeGeneratedEventNodes();

  resetGraphFocus();

  if (els.infoPanel) {
    els.infoPanel.innerHTML = "Select event";
  }

  if (els.predictionPanel) {
    els.predictionPanel.innerHTML = "Prediction: -";
  }

  renderNetworkDefault();

  reLayoutGraph();
  renderDebugStatus();
  clearSavedLabState();
}

function renderPatternsAsGraph(results = []) {
  if (!window.cy) return;

  cy.nodes().forEach((node) => {
    if (String(node.id()).startsWith("PATTERN-")) {
      node.remove();
    }
  });

  cy.edges().forEach((edge) => {
    const id = String(edge.id());
    if (
      id.startsWith("pattern-edge-") ||
      id.startsWith("pattern-link-") ||
      id.startsWith("pattern-")
    ) {
      edge.remove();
    }
  });

  results.forEach((item, index) => {
    const pattern = item?.pattern || item;
    if (!pattern?.id) return;

    if (cy.getElementById(pattern.id).length > 0) return;

    cy.add({
      group: "nodes",
      data: {
        id: pattern.id,
        label: pattern.name || `[패턴 ${index + 1}] ${pattern.type || "CUSTOM"}`,
        kind: "pattern",
        type: pattern.type || "CUSTOM"
      }
    });

    (pattern.nodes || []).forEach((nodeId) => {
      if (!nodeId) return;
      if (cy.getElementById(nodeId).length === 0) return;

      const edgeId = `pattern-edge-${pattern.id}-${nodeId}`;
      if (cy.getElementById(edgeId).length > 0) return;

cy.add({
  group: "edges",
  data: {
    id: edgeId,
    source: pattern.id,
    target: nodeId,
    kind: "pattern-link"
  }
});
    });
  });
}

function detectPatterns() {
  const patterns = miner.mine();
  const rankedResults = predictor.predictAll(patterns);

  syncPatternMemories(rankedResults);

  uiState.rawRankedResults = [...rankedResults];
  uiState.rankedResults = [...rankedResults];

  uiState.selectedPattern = null;
  uiState.selectedPatternId = null;
  uiState.selectedGroup = null;
  uiState.selectedGroupId = null;
  
  uiState.selectedEventId = null;
uiState.selectedEvent = null;

  uiState.navStack = [];

  console.log("Detected patterns:", rankedResults);

  pushState("pattern", rankedResults);

  recordLog({
    type: "PATTERN_DETECT",
    scope: "PATTERN",
    summary: "[PATTERN] 탐지 완료",
    payload: {
      count: rankedResults.length
    }
  });

  renderPatterns(uiState.rankedResults);
  renderPatternsAsGraph(uiState.rankedResults);

  renderPatternDetail(null);
  renderDebugStatus();
  renderFocusHeader();
  renderSideMiniStatus();
  renderDetailPanel();

  addLog("detect", { count: rankedResults.length });
  saveLabState();
}

function applyFeedback(success) {

  pushLog("FEEDBACK", {
  patternId: uiState.selectedPattern?.id ?? null,
  success
});

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

function generateEventId() {
  const allIds = new Set();

  (uiState.events || []).forEach((evt) => {
    if (evt?.id) allIds.add(evt.id);
  });

  if (window.cy) {
    window.cy.nodes().forEach((node) => {
      if (node?.id()) allIds.add(node.id());
    });
  }

  let max = 0;

  allIds.forEach((id) => {
    const match = String(id).match(/^EVT-(\d{4,})$/);
    if (!match) return;

    const num = Number(match[1]);
    if (Number.isFinite(num) && num > max) {
      max = num;
    }
  });

  const next = max + 1;
  return `EVT-${String(next).padStart(4, "0")}`;
}

function renderDebugStatus() {
  const panel = document.getElementById("debug-note-body");
  if (!panel) return;

  const patternText = uiState.selectedPattern
    ? `${getPatternDisplayId(uiState.selectedPattern)} ${uiState.selectedPattern.type}`
    : "-";

const relationText = uiState.selectedGroup
  ? `${getGroupPrimaryEdgeType(uiState.selectedGroup) || "RELATION"} / ${getGroupCenterNodeId(uiState.selectedGroup) || "-"}`
  : "-";

  const eventText = uiState.selectedEventId || "-";

  panel.innerHTML = `
모드: ${uiState.mode || "-"}<br>
패턴: ${patternText}<br>
관계 태그: ${relationText}<br>
이벤트: ${eventText}<br>
탐색 깊이: ${uiState.navStack?.length || 0}
`;
}

function renderEventEditor() {
  const panel = els.leftPanel;
  const d = uiState.eventDraft;

  panel.innerHTML = `
    <div class="event-editor">

      <div class="editor-header">
        <span>${uiState.editingEventId ? "이벤트 수정" : "이벤트 생성"}</span>
        <button id="event-editor-close">X</button>
      </div>

      <div class="editor-body">

        <label>이름</label>
        <input id="evt-name" value="${d.name || ""}" />

        <label>Relation Tags</label>
        <input id="evt-rel" value="${(d.relationTags || []).join(",")}" />

        <label>State Tags</label>
        <input id="evt-state" value="${(d.stateTags || []).join(",")}" />

        <label>ROT</label>
        <input id="evt-rot" type="number" value="${d.variables.rot ?? ""}" />

        <label>CAP</label>
        <input id="evt-cap" type="number" value="${d.variables.cap ?? ""}" />

        <label>VAR</label>
        <input id="evt-var" type="number" value="${d.variables.var ?? ""}" />

        <label>Memo</label>
        <textarea id="evt-memo">${d.memo || ""}</textarea>

      </div>

      <div class="editor-footer">
        <button id="evt-save">저장</button>
      </div>
    </div>
  `;

  bindEventEditorEvents();
}


function renderLeftSummary() {
  if (els.leftCurrentPattern) {
    els.leftCurrentPattern.textContent = uiState.selectedPattern?.id ?? "-";
  }

  if (els.leftCurrentGroup) {
    els.leftCurrentGroup.textContent = uiState.selectedGroup?.id ?? "-";
  }

  if (els.leftCurrentEvent) {
    els.leftCurrentEvent.textContent = uiState.selectedEventId ?? "-";
  }

  if (els.leftCurrentMode) {
    els.leftCurrentMode.textContent = uiState.mode ?? "-";
  }

  if (els.leftRelatedCount) {
    const count = uiState.selectedEventId
      ? buildPatternCandidatesFromEvent(uiState.selectedEventId).length
      : 0;

    els.leftRelatedCount.textContent = String(count);
  }
}

const MODE_RULES = {
  explore: {
    showAllNodes: true,
    showWeakEdges: true,
    filter: null
  },
  focus: {
    showAllNodes: false,
    showWeakEdges: false,
    filter: (node) => node.importance > 0.5
  },
  warning: {
    showAllNodes: true,
    showWeakEdges: false,
    filter: (node) => node.type !== "C" && node.type !== "D"
  }
};

function renderModeButtons() {
  const container = document.getElementById("mode-container");
  if (!container) return;

  const modeMeta = {
    explore: {
      title: "Explore",
      sub: "전체 그래프를 기준으로 탐색",
      desc: "전체 그래프를 기준으로 탐색합니다."
    },
    warning: {
      title: "Warning",
      sub: "중요도 높은 흐름 중심으로 압축",
      desc: "중요도 높은 흐름만 남기고 시야를 압축합니다."
    },

    focus: {
  title: "Focus",
  sub: "핵심 관계 집중",
  desc: "상승/핵심 관계 중심으로 그래프를 집중해서 봅니다."
}
  };

  container.innerHTML = "";

  Object.entries(modeMeta).forEach(([key, meta]) => {
    const btn = document.createElement("button");
    btn.className = `mode-btn${uiState.mode === key ? " active" : ""}`;

    btn.innerHTML = `
      <span class="mode-btn-title">${meta.title}</span>
      <span class="mode-btn-sub">${meta.sub}</span>
    `;

    btn.onclick = () => {
      applyMode(key);
    };

    container.appendChild(btn);
  });

  if (els.modeCurrentValue) {
    els.modeCurrentValue.textContent = uiState.mode || "-";
  }

  if (els.modeDescription) {
    els.modeDescription.textContent =
      modeMeta[uiState.mode]?.desc || "현재 모드 정보가 없습니다.";
  }
}

function renderGraphToggles() {
  const slot = document.getElementById("controls-graph");
  if (!slot) return;

  slot.innerHTML = "";

  const box = document.createElement("div");
  box.id = "graph-toggle-box";
  box.style.display = "inline-block";

  const items = [
    { key: "showPatternLinks", label: "Pattern Link" },
    { key: "hideWeakEdges", label: "Weak Edge Hide" },
    { key: "showEventLabels", label: "Event Label" }
  ];

  items.forEach((item) => {
    const btn = document.createElement("button");
    btn.textContent = item.label;
    btn.style.marginRight = "6px";
    btn.style.opacity = uiState.graphToggles[item.key] ? "1" : "0.45";

    btn.onclick = () => {
      uiState.graphToggles[item.key] = !uiState.graphToggles[item.key];
      
      applyGraphToggleRules();
      saveLabState();
    };

    box.appendChild(btn);
  });

  slot.appendChild(box);
}

function getImportanceGroup(probability) {
  if (probability >= 0.75) return "A";
  if (probability >= 0.55) return "B";
  if (probability >= 0.35) return "C";
  return "D";
}

function getPatternImportanceById(patternId) {
  const result = uiState.patternMap.get(patternId);
  if (!result) return "D";
  return getImportanceGroup(result.probability ?? 0);
}

function getEffectMidpoint(effect) {
  const min = Number(effect?.min || 0);
  const max = Number(effect?.max ?? min);

  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return 0;
  }

  return (min + max) / 2;
}

function computeEntityAdjustedMetrics(entity, baseMetrics = {}) {
  const edit = ensureEntityEditState(entity);

  const result = {
    purity: clampMetricValue(baseMetrics.purity ?? baseMetrics.purityScore ?? 1),
    contamination: clampMetricValue(baseMetrics.contamination ?? baseMetrics.contaminationScore ?? 0),
    importance: clampMetricValue(baseMetrics.importance ?? baseMetrics.importanceScore ?? 0),
    confidence: clampMetricValue(baseMetrics.confidence ?? baseMetrics.confidenceScore ?? 0),
    g: clampMetricValue(baseMetrics.g ?? baseMetrics.gScore ?? baseMetrics.confidenceScore ?? 0)
  };

  const adjustmentLog = [];

  if (!edit) {
    return {
      ...result,
      adjustmentLog
    };
  }

  edit.adjustmentTags.forEach((tagEntry) => {
    const effects = Array.isArray(tagEntry.effects) ? tagEntry.effects : [];

    effects.forEach((effect) => {
      const target = effect.target;
      if (!target || !(target in result)) return;

      const amount = getEffectMidpoint(effect) * getTagStrengthMultiplier(tagEntry.strength || "MID");
      const before = result[target];

      if (effect.direction === "up") {
        result[target] = clampMetricValue(result[target] + amount);
      } else {
        result[target] = clampMetricValue(result[target] - amount);
      }

      adjustmentLog.push({
        tag: tagEntry.tag,
        label: tagEntry.label,
        category: tagEntry.category,
        stat: tagEntry.stat,
        target,
        direction: effect.direction,
        min: effect.min,
        max: effect.max,
        amount,
        before,
        after: result[target],
        sourceType: tagEntry.sourceType || null,
        sourceRef: tagEntry.sourceRef || null,
        bulkId: tagEntry.bulkId || null
      });
    });
  });

  return {
    ...result,
    adjustmentLog
  };
}

function computeGroupAdjustedMetrics(group, baseMetrics = {}) {
  return computeEntityAdjustedMetrics(group, baseMetrics);
}

function getEventImportance(eventId) {
  const related = (uiState.rankedResults || []).filter((r) => {
    const p = r.pattern;
    return p && p.nodes && p.nodes.includes(eventId);
  });

  if (related.length === 0) return "D";

  const maxProb = Math.max(...related.map((r) => r.probability ?? 0));
  return getImportanceGroup(maxProb);
}

function renderFocusHeader() {
  const appliedIds =
    Array.isArray(uiState.appliedPatternIds) && uiState.appliedPatternIds.length
      ? uiState.appliedPatternIds
      : (uiState.appliedPatternId ? [uiState.appliedPatternId] : []);

  const patternLabel =
    appliedIds.length === 0
      ? (uiState.selectedPatternIds?.[0] || uiState.selectedPatternId || "-")
      : appliedIds.length === 1
        ? appliedIds[0]
        : `${appliedIds[0]} 외 ${appliedIds.length - 1}`;

  if (els.focusPattern) {
    els.focusPattern.textContent = `패턴: ${patternLabel}`;
  }

  if (els.focusRelation) {
    const relationText =
      uiState.selectedGroup?.edgeType ||
      uiState.selectedGroupId ||
      "-";
    els.focusRelation.textContent = `관계 태그: ${relationText}`;
  }

  if (els.focusEvent) {
    const eventText = uiState.selectedEventId || "-";
    els.focusEvent.textContent = `이벤트: ${eventText}`;
  }
}

function formatEventTime(value) {
  if (!value) return "-";

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

function getEventCardMeta(eventId) {
  const evt = engine.getEvent(eventId);
  const edges = engine.getEdges() || [];

  const connectionCount = edges.filter(
    (e) => e.from === eventId || e.to === eventId
  ).length;

  return {
    id: eventId,
    label: evt?.label ?? "-",
    time: formatEventTime(evt?.time),
    sentiment: evt?.sentiment ?? "-",
    level: getEventImportance(eventId),
    connections: connectionCount
  };
}

function applyEventViewFilter(eventIds) {
  if (!eventIds || eventIds.length === 0) return [];

  return eventIds.map((id) => {
    const group = getEventImportance(id);
    return {
      id,
      group,
      visible: uiState.viewFilters[group]
    };
  });
}

function getGroupOverlapCountByNodeId(nodeId) {
  const activeIds = Array.isArray(uiState.activeGroupIds)
    ? uiState.activeGroupIds
    : [];

  if (!nodeId || !activeIds.length) return 0;

  let count = 0;

  activeIds.forEach((groupId) => {
    const group = groupStore.get(groupId);
    if (!group) return;

    const inCenter = group.center === nodeId;
    const inNodes = Array.isArray(group.nodes) && group.nodes.includes(nodeId);

    if (inCenter || inNodes) {
      count += 1;
    }
  });

  return count;
}

function getGroupImportance(group) {
  if (!group) return "D";

  const related = (uiState.rankedResults || []).filter((r) => {
    const p = r.pattern;
    if (!p || !p.nodes) return false;

    return (
      p.nodes.includes(group.center) ||
      group.nodes.some((id) => p.nodes.includes(id))
    );
  });

  if (related.length === 0) return "D";

  const maxProb = Math.max(...related.map((r) => r.probability ?? 0));
  return getImportanceGroup(maxProb);
}

function getVisibleNodes(nodes) {
  const rule = uiState.modeRule;

  return nodes.filter((node) => {
    // 1. viewFilters (타입 필터)
    if (uiState.viewFilters) {
      const type = node.type;
      if (type && uiState.viewFilters[type] === false) return false;
    }

    // 2. MODE_RULES (모드 필터)
    if (!rule || rule.showAllNodes) return true;
    if (!rule.filter) return true;

    return rule.filter(node);
  });
}

function getVisibleEdges(edges) {
  const rule = uiState.modeRule;

  if (!rule) return edges;

  if (!rule.showWeakEdges) {
    return edges.filter((e) => (e.strength ?? 0.5) > 0.5);
  }

  return edges;
}

window.getVisibleNodes = getVisibleNodes;
window.getVisibleEdges = getVisibleEdges;

function applyGroupViewFilter(groups) {
  if (!groups || groups.length === 0) return [];

  return groups.filter((g) => {
    const groupImportance = getGroupImportance(g);
    return uiState.viewFilters[groupImportance];
  });
}

function pushState(type, data) {
  if (!uiState.navStack) uiState.navStack = [];

  const last = uiState.navStack[uiState.navStack.length - 1];

  const sameType = last?.type === type;
  const sameData =
    (type === "pattern" && last?.data === data) ||
    (type === "groupList" && last?.data?.patternId === data?.patternId) ||
    (type === "eventView" &&
      last?.data?.group?.id === data?.group?.id &&
      last?.data?.eventId === data?.eventId);

  if (sameType && sameData) return;

  uiState.navStack.push({
    type,
    data,
    selectedPattern: uiState.selectedPattern,
    selectedPatternId: uiState.selectedPatternId,
    selectedGroup: uiState.selectedGroup,
    selectedGroupId: uiState.selectedGroupId,
    selectedEvent: uiState.selectedEvent,
    selectedEventId: uiState.selectedEventId,
    mode: uiState.mode,
    viewFilters: { ...uiState.viewFilters }
  });
}

function refreshCurrentView() {
  console.log("REFRESH_CURRENT_VIEW:", uiState.page);

  if (uiState.page === "pattern") {
    const results = uiState.rawRankedResults || uiState.rankedResults || [];

    if (uiState.selectedGroup) {
      renderEvents(uiState.selectedGroup);
      selectEvent(uiState.selectedEventId || getGroupCenterNodeId(uiState.selectedGroup), false);
      renderDebugStatus();
      bindGraphNodeEditorEvent();
      return;
    }

    if (uiState.selectedPattern) {
      const groups = buildGroupsFromPattern(uiState.selectedPattern);
      groups.forEach((g) => groupStore.set(g.id, g));
      renderGroups(groups);
      renderPatternDetail(uiState.selectedPattern);
      renderDebugStatus();
      bindGraphNodeEditorEvent();
      return;
    }

    renderPatterns(results);
    renderPatternsAsGraph(results);
    renderPatternDetail(null);
    renderFocusHeader();
    renderDebugStatus();
    bindGraphNodeEditorEvent();
    return;
  }

  // network page
  renderNetworkDefault();
  resetGraphFocus();
  renderFocusHeader();
  renderDebugStatus();
  bindGraphNodeEditorEvent();
}

function bindGraphNodeEditorEvent() {
  if (!window.cy) return;
  if (uiState.__nodeEditorBound) return;

  window.cy.on("tap", "node", (evt) => {
    clearFilterRankFocus();
uiState.filterRankActiveId = null;
renderFilterRankExplorer();

    const exp = uiState.patternExplorer;

    if (exp?.active && exp?.tempEdgeMode) {
      return;
    }

    const node = evt.target;
    const id = node.id();
    if (!id) return;

    enterEventEditor(id);
  });

  window.cy.on("tap", (evt) => {
  if (evt.target !== window.cy) return;

  clearFilterRankFocus();
  uiState.filterRankActiveId = null;
  renderFilterRankExplorer();

  uiState.selectedEventId = null;
  uiState.selectedEvent = null;
  uiState.selectedEdgeId = null;
  uiState.rightPanelView = "network";

  renderRightPanelView();
  renderDetailPanel();
  renderFocusHeader();
  renderDebugStatus();
  refreshGraphState();
});

  uiState.__nodeEditorBound = true;
}

function goBack() {
  if (!uiState.navStack || uiState.navStack.length === 0) {
    enterNetworkPage();
    return;
  }

  // 현재 상태 제거
  uiState.navStack.pop();

  // 더 없으면 네트워크
  if (uiState.navStack.length === 0) {
    enterNetworkPage();
    return;
  }

  const prev = uiState.navStack[uiState.navStack.length - 1];
  if (!prev) {
    enterNetworkPage();
    return;
  }

  uiState.selectedPattern = prev.selectedPattern ?? null;
  uiState.selectedPatternId = prev.selectedPatternId ?? null;

  updatePatternToLayerButton();

  uiState.selectedGroup = prev.selectedGroup ?? null;
  uiState.selectedGroupId = prev.selectedGroupId ?? null;
  uiState.selectedEventId = prev.selectedEventId ?? prev.selectedEvent ?? null;
  uiState.mode = prev.mode ?? "explore";
  uiState.viewFilters = { ...(prev.viewFilters || uiState.viewFilters) };

  resetGraphFocus();

  if (prev.type === "patternList") {
    const results = prev.data || uiState.rawRankedResults || [];
    renderPatterns(results);
    renderPatternsAsGraph(results);
    renderPatternDetail(null);
    renderFocusHeader();
    renderDebugStatus();
    saveLabState();
    renderSideMiniStatus();
    renderDetailPanel();
    return;
  }

  if (prev.type === "groupList") {
    const groups = prev.data?.groups || [];
    renderGroups(groups);

    if (uiState.selectedPattern) {
      renderPatternDetail(uiState.selectedPattern);
    } else {
      renderPatternDetail(null);
    }

    renderFocusHeader();
    renderDebugStatus();
    saveLabState();
    return;
  }

  if (prev.type === "eventView") {
    const group = prev.data?.group || null;
    const eventId = prev.data?.eventId || null;

    if (group) {
      renderEvents(group);
    }

    if (eventId) {
      selectEvent(eventId, false);
    } else if (uiState.selectedPattern) {
      renderPatternDetail(uiState.selectedPattern);
    } else {
      renderPatternDetail(null);
    }

    renderFocusHeader();
    renderDebugStatus();
    saveLabState();
    return;
  }

  enterNetworkPage();
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

  setTimeout(() => {
    applyPatternExplorerVisibility();
  }, 350);
}

if (els.playBtn) {
  els.playBtn.onclick = () => {
    if (uiState.timelinePlaying) {
      stopTimeline();
    } else {
      playTimeline(LAB_CONFIG.timelineInterval || 1200);
    }
  };
}

if (els.closeLayerPatternExplorerBtn) {
  els.closeLayerPatternExplorerBtn.onclick = () => {
    closeLayerPatternExplorer();
  };
}

if (els.layerPatternPreviewBtn) {
  els.layerPatternPreviewBtn.onclick = () => {
    renderLayerPatternPreview();
  };
}

if (els.openLayerPanelBtn) {
  els.openLayerPanelBtn.onclick = () => {
    if (els.layerPanel) {
      els.layerPanel.classList.remove("hidden");
    }
    renderLayerExplorerCandidates();
  };
}

if (els.closeLayerPanelBtn) {
  els.closeLayerPanelBtn.onclick = () => {
    if (els.layerPanel) {
      els.layerPanel.classList.add("hidden");
    }
  };
}

if (els.leftPanelToggle && els.leftPanel) {
  els.leftPanelToggle.onclick = () => {
    const isCollapsed = els.leftPanel.classList.contains("collapsed");

    if (isCollapsed) {
      els.leftPanel.classList.remove("collapsed");
      els.leftPanelToggle.textContent = "◀";
    } else {
      els.leftPanel.classList.add("collapsed");
      els.leftPanelToggle.textContent = "▶";
    }
  };
}

if (els.closeLeftPanelBtn && els.leftPanel && els.leftPanelToggle) {
  els.closeLeftPanelBtn.onclick = () => {
    els.leftPanel.classList.add("collapsed");
    els.leftPanelToggle.textContent = "▶";
  };
}

if (els.patternBtn) {
  els.patternBtn.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    console.log("PATTERN BUTTON CLICK");
    enterPatternPage();
  };
}

if (els.closeLayerDeleteModeBtn) {
  els.closeLayerDeleteModeBtn.onclick = () => {
    exitLayerDeleteMode();
  };
}

if (els.layerMetaSaveBtn) {
  els.layerMetaSaveBtn.onclick = () => {
    saveCurrentLayerMeta();
  };
}

if (els.stepBackwardBtn) {
  els.stepBackwardBtn.onclick = () => {
    stepTimelineBackward();
  };
}

if (els.clearTempRelationsBtn) {
  els.clearTempRelationsBtn.onclick = () => {
    clearTemporaryTimelineRelations();
  };
}

if (els.closeCommandPaletteBtn) {
  els.closeCommandPaletteBtn.onclick = () => {
    closeCommandPalette();
  };
}

if (els.commandPaletteInput) {
  els.commandPaletteInput.oninput = () => {
    renderCommandPaletteResults(els.commandPaletteInput.value);
  };

  els.commandPaletteInput.onkeydown = (e) => {
  if (e.key === "Enter") {
    const raw = els.commandPaletteInput.value;

    if (runCommandText(raw)) {
      closeCommandPalette();
      return;
    }

    const first = filterCommandItems(raw)[0];
    if (first) {
      executeCommandById(first.id);
    }
  }
};
}

if (els.closeLogExplorerBtn) {
  els.closeLogExplorerBtn.onclick = () => {
    closeLogExplorer();
  };
}

document.addEventListener("click", (e) => {
  const btn = e.target.closest(".log-filter-btn");
  if (!btn) return;

  uiState.logExplorerScope = normalizeLogScope(btn.dataset.logScope || "ALL");
  renderLogExplorer();
});

if (els.logSearchInput) {
  els.logSearchInput.oninput = () => {
    uiState.logExplorerQuery = els.logSearchInput.value || "";
    renderLogExplorer();
  };
}

if (els.logShowRecentBtn) {
  els.logShowRecentBtn.onclick = () => {
    uiState.logExplorerRecentOnly = true;
    renderLogExplorer();
  };
}

if (els.logShowAllBtn) {
  els.logShowAllBtn.onclick = () => {
    uiState.logExplorerRecentOnly = false;
    renderLogExplorer();
  };
}

if (els.closeAllDataExplorerBtn) {
  els.closeAllDataExplorerBtn.onclick = () => {
    closeAllDataExplorer();
  };
}

document.addEventListener("click", (e) => {
  const btn = e.target.closest(".all-data-filter-btn");
  if (!btn) return;

  uiState.allDataScope = btn.dataset.dataScope || "ALL";
  renderAllDataExplorer();
});

if (els.allDataSearchInput) {
  els.allDataSearchInput.oninput = () => {
    uiState.allDataQuery = els.allDataSearchInput.value || "";
    renderAllDataExplorer();
  };
}

if (els.eventDeleteModeBtn) {
  els.eventDeleteModeBtn.onclick = () => {
    uiState.selectedEventIdsForDelete = [];
    openEventDeleteModal();
  };
}

if (els.eventSelectAllBtn) {
  els.eventSelectAllBtn.onclick = () => {
    selectAllEventsInAllData();
  };
}

if (els.eventSelectFilteredBtn) {
  els.eventSelectFilteredBtn.onclick = () => {
    selectFilteredEventsInAllData();
  };
}

if (els.eventClearSelectionBtn) {
  els.eventClearSelectionBtn.onclick = () => {
    clearEventDeleteSelection();
  };
}

if (els.eventDeleteConfirmBtn) {
  els.eventDeleteConfirmBtn.onclick = () => {
    openEventDeleteModal();
  };
}

if (els.closeEventDeleteModeBtn) {
  els.closeEventDeleteModeBtn.onclick = () => {
    exitEventDeleteMode();
  };
}

if (els.eventDeleteCancelBtn) {
  els.eventDeleteCancelBtn.onclick = () => {
    if (els.eventDeleteModal) {
      els.eventDeleteModal.classList.add("hidden");
    }
  };
}

if (els.eventDeleteFinalBtn) {
  els.eventDeleteFinalBtn.onclick = () => {
    deleteSelectedEvents();
  };
}

const btnDeleteSelectAll = document.getElementById("btn-delete-select-all");
const btnDeleteSelectFiltered = document.getElementById("btn-delete-select-filtered");
const btnDeleteClear = document.getElementById("btn-delete-clear");

if (btnDeleteSelectAll) {
  btnDeleteSelectAll.onclick = () => {
    selectAllEventsForDelete();
  };
}

if (btnDeleteSelectFiltered) {
  btnDeleteSelectFiltered.onclick = () => {
    selectFilteredEventsForDelete();
  };
}

if (btnDeleteClear) {
  btnDeleteClear.onclick = () => {
    clearEventDeleteSelection();
  };
}

if (els.patternToLayerBtn) {
  els.patternToLayerBtn.onclick = () => {
    const layer = createLayerFromSelectedPattern();
    if (!layer) return;

    uiState.currentLayerName = layer.name;
    refreshGraphState();
    renderLayerPanel();
    renderLayerMetaFields();
    renderSideMiniStatus();
    saveLabState();
  };
}

if (els.patternCompactToggleBtn) {
  els.patternCompactToggleBtn.onclick = () => {
    openPatternMiniExplorer();
  };
}

if (els.closePatternMiniExplorerBtn) {
  els.closePatternMiniExplorerBtn.onclick = () => {
    closePatternMiniExplorer();
  };
}

function updatePatternToLayerButton() {
  if (!els.patternToLayerBtn) return;
  els.patternToLayerBtn.disabled = !uiState.selectedPatternId;
}

if (els.closePatternLayerExplorerBtn) {
  els.closePatternLayerExplorerBtn.onclick = () => {
    closePatternLayerExplorer();
  };
}

if (els.patternLayerAllBtn) {
  els.patternLayerAllBtn.onclick = () => {
  const pattern = getSelectedPatternObject();
  if (!pattern) return;

  // preview
  updatePatternLayerPreview("all");

  // 생성
  const name = `Pattern-${pattern.id}-ALL`;
  saveLayerFromNodes(pattern.nodes || [], name);

  recordLog({
    type: "LAYER_CREATE",
    scope: "PATTERN",
    refId: pattern.id,
    summary: `[LAYER] 전체 노드 생성`,
    payload: { count: pattern.nodes?.length || 0 }
  });

  closePatternLayerExplorer();
};
}

if (els.patternLayerDenseBtn) {
  els.patternLayerDenseBtn.onclick = () => {
  const pattern = getSelectedPatternObject();
  if (!pattern) return;

  // preview
  updatePatternLayerPreview("dense");

  const previewNodes = uiState.patternLayerPreview.nodeIds;

  const name = `Pattern-${pattern.id}-DENSE`;
  saveLayerFromNodes(previewNodes, name);

  recordLog({
    type: "LAYER_CREATE",
    scope: "PATTERN",
    refId: pattern.id,
    summary: `[LAYER] 밀도 기반 생성`,
    payload: { count: previewNodes.length }
  });

  closePatternLayerExplorer();
};
}

if (els.patternLayerGroupsBtn) {
  els.patternLayerGroupsBtn.onclick = () => {
  const pattern = getSelectedPatternObject();
  if (!pattern) return;

  // 🔥 [1] PREVIEW 먼저
  const groups = buildGroupsFromPattern(pattern);

  uiState.patternLayerPreview = {
    mode: "groups",
    nodeIds: pattern.nodes || [],
    nodeCount: pattern.nodes?.length || 0,
    edgeCount: groups.length,
    sample: groups.slice(0, 3).map((g) => g.id || g.center || "-")
  };

  renderPatternLayerPreview();
  highlightPreview(uiState.patternLayerPreview.nodeIds);

  // 🔥 [2] 실제 생성은 여기 아래 유지
  groups.forEach((group, index) => {
    const name = `PatternGroup-${pattern.id}-${index + 1}`;
    saveLayerFromNodes(group.nodes, name);
  });

  recordLog({
    type: "LAYER_CREATE",
    scope: "PATTERN",
    refId: pattern.id,
    summary: `[LAYER] 그룹 분할 생성: ${groups.length}개`,
    payload: { groups: groups.length }
  });

  closePatternLayerExplorer();
};
}

if (els.patternLayerCustomBtn) {
  els.patternLayerCustomBtn.onclick = () => {
    uiState.patternToLayerExplorerMode = "custom";
    renderPatternLayerExplorerView();
  };
}

if (els.patternLayerCustomBackBtn) {
  els.patternLayerCustomBackBtn.onclick = () => {
    uiState.patternToLayerExplorerMode = "menu";
    renderPatternLayerExplorerView();
  };
}

if (els.patternLayerCustomCreateBtn) {
  els.patternLayerCustomCreateBtn.onclick = () => {
    const pattern = getSelectedPatternObject();
    if (!pattern) return;

    const layer = createLayerFromPatternCustom(pattern);
    if (!layer) return;

    uiState.currentLayerName = layer.name;
    refreshGraphState();
    renderLayerPanel();
    renderLayerMetaFields();
    renderSideMiniStatus();
    saveLabState();
    closePatternLayerExplorer();
  };
}

if (els.btnLayerPatternCustom) {
  els.btnLayerPatternCustom.onclick = () => {
    uiState.layerToPatternExplorerMode = "custom";
    renderLayerPatternExplorerView();
  };
}

if (els.btnLayerPatternCustomBack) {
  els.btnLayerPatternCustomBack.onclick = () => {
    uiState.layerToPatternExplorerMode = "menu";
    renderLayerPatternExplorerView();
  };
}

if (els.btnLayerPatternAll) {
  els.btnLayerPatternAll.onclick = () => {
    console.trace("ALL_BUTTON_CLICK");

    const layer = getCurrentLayerObject();
    if (!layer) return;

    const result = registerPatternFromLayer(layer, {
      type: "ALL",
      name: layer.name || "Layer Pattern"
    });

    if (!result) return;

    renderPatterns(uiState.rankedResults);
    renderPatternsAsGraph(uiState.rankedResults);
    renderDebugStatus();
    renderSideMiniStatus();
    closeLayerPatternExplorer();
  };
}

if (els.btnLayerPatternFiltered) {
  els.btnLayerPatternFiltered.onclick = () => {
    const layer = getCurrentLayerObject();
    if (!layer) return;

    const filter = layer.filter || uiState.currentLayerFilter || {};
    const filteredNodeIds = getLayerNodeIdsByFilter(layer, filter);
    if (!filteredNodeIds.length) return;

    const result = registerPatternFromLayer(
      {
        ...layer,
        nodes: filteredNodeIds
      },
      {
        type: "FILTERED",
        name: `${layer.name || "Layer"}-Filtered`
      }
    );

    if (!result) return;

    renderPatterns(uiState.rankedResults);
    renderPatternsAsGraph(uiState.rankedResults);
    renderDebugStatus();
    renderSideMiniStatus();
    closeLayerPatternExplorer();
  };
}

if (els.btnLayerPatternCustomCreate) {
  els.btnLayerPatternCustomCreate.onclick = () => {
    const layer = getCurrentLayerObject();
    if (!layer) return;

    const result = registerPatternFromLayer(layer, {
      id: els.layerPatternIdInput?.value?.trim() || undefined,
      type: els.layerPatternTypeInput?.value?.trim() || "CUSTOM",
      name: els.layerPatternNameInput?.value?.trim() || layer.name || "",
      probability: els.layerPatternProbInput?.value === "" ? 0.5 : Number(els.layerPatternProbInput.value),
      patternScore: els.layerPatternScoreInput?.value === "" ? 0.5 : Number(els.layerPatternScoreInput.value),
      memo: els.layerPatternMemoInput?.value || ""
    });

    if (!result) return;

    renderPatterns(uiState.rankedResults);
    renderPatternsAsGraph(uiState.rankedResults);
    renderDebugStatus();
    renderSideMiniStatus();
    closeLayerPatternExplorer();
  };
}

if (els.plpApplyToMainBtn) {
  els.plpApplyToMainBtn.onclick = () => {
  applyPatternLinkTempEdgesToMainGraph();
applyWorkspaceAndSaveLayer();
};
}

if (els.plpLoadLayerBtn) {
  els.plpLoadLayerBtn.onclick = () => {
    const layerName = els.patternLinkLayerSelect?.value || "";
    const layer = getSavedLayerByName(layerName);

    if (!layer) {
      const ws = getPatternLinkWorkspace();
      ws.loadedLayerName = null;
      ws.loadedLayerNodes = [];
      ws.loadedLayerFilter = {
        rotMin: null,
        capMax: null,
        varMin: null
      };

      buildPatternLinkWorkspaceGraph();
      renderPatternLinkLayerOptions();
      renderPatternLinkWorkspaceStatus();
      return;
    }

    applyLayerToPatternLinkWorkspace(layer);
    renderPatternLinkLayerOptions();
  };
}

if (els.plpSaveWorkspaceLayerBtn) {
  els.plpSaveWorkspaceLayerBtn.onclick = () => {
    const name = els.plpLayerNameInput?.value || "";
    savePatternLinkWorkspaceAsLayer(name);
  };
}

if (els.layerRegisterPatternBtn) {
  els.layerRegisterPatternBtn.onclick = () => {
    openLayerPatternExplorer();
  };
}

if (els.addVariableBtn) {
  els.addVariableBtn.onclick = () => {
    uiState.rightPanelView = "variable";
    renderRightPanelView();

    els.addVariableBtn.textContent = "변수 편집";
  };
}

if (els.plpUnloadLayerBtn) {
  els.plpUnloadLayerBtn.onclick = () => {
    unloadPatternLinkWorkspaceLayer();
  };
}

if (els.plpSnapshotBtn) {
  els.plpSnapshotBtn.onclick = () => snapshotPatternLinkWorkspace();
}

if (els.plpShowAllBtn) {
  els.plpShowAllBtn.onclick = () => {
    showAllPatternLinkWorkspace();
  };
}

if (els.patternTempEdgeUndoBtn) {
  els.patternTempEdgeUndoBtn.onclick = () => {
    undoLastTempEdge();
  };
}

if (els.patternTempEdgeClearBtn) {
  els.patternTempEdgeClearBtn.onclick = () => {
    clearAllTempEdges();
  };
}

if (els.closePatternLinkPageBtn) {
  els.closePatternLinkPageBtn.onclick = () => {
    exitPatternLinkPage();
  };
}

if (els.plpHideNodeBtn) {
  els.plpHideNodeBtn.onclick = () => {
    setPatternLinkWorkspaceMode("hide-node");
  };
}

if (els.plpHideEdgeBtn) {
  els.plpHideEdgeBtn.onclick = () => {
    setPatternLinkWorkspaceMode("hide-edge");
  };
}

if (els.plpTempEdgeBtn) {
  els.plpTempEdgeBtn.onclick = () => {
    setPatternLinkWorkspaceMode("temp-edge");
  };
}

if (els.plpResetWorkBtn) {
  els.plpResetWorkBtn.onclick = () => {
    resetPatternLinkWorkspace();
  };
}

if (els.plpResetBtn) {
  els.plpResetBtn.onclick = () => {
    resetExplorerVisibility();
    renderPatternLinkPanel();
  };
}

if (els.plpRelayoutDefaultBtn) {
  els.plpRelayoutDefaultBtn.onclick = () => {
    reLayoutPatternLinkWorkspaceByMode("default");
  };
}

if (els.plpRelayoutTimeBtn) {
  els.plpRelayoutTimeBtn.onclick = () => {
    reLayoutPatternLinkWorkspaceByMode("time");
  };
}

if (els.plpRelayoutFocusBtn) {
  els.plpRelayoutFocusBtn.onclick = () => {
    reLayoutPatternLinkWorkspaceByMode("focus");
  };
}

if (els.plpDimLowBtn) els.plpDimLowBtn.onclick = () => setPatternLinkDimStrength(0.7);
if (els.plpDimMidBtn) els.plpDimMidBtn.onclick = () => setPatternLinkDimStrength(0.4);
if (els.plpDimHighBtn) els.plpDimHighBtn.onclick = () => setPatternLinkDimStrength(0.15);

if (els.plpDimBtn) {
  els.plpDimBtn.onclick = () => {
    setPatternLinkWorkspaceMode("dim");
  };
}

if (els.plpQuickSaveBtn) {
  els.plpQuickSaveBtn.onclick = () => {
    quickSavePatternLinkLayer();
  };
}

window.addEventListener("keydown", (e) => {
  const isMac = navigator.platform.toUpperCase().includes("MAC");
  const meta = isMac ? e.metaKey : e.ctrlKey;

  if (!meta || e.key.toLowerCase() !== "k") return;

  e.preventDefault();

  if (uiState.page === "pattern-link") {
    exitPatternLinkPage();
  } else {
    enterPatternLinkPage();
  }
});

window.addEventListener("keydown", (e) => {
  const isMac = navigator.platform.toUpperCase().includes("MAC");
  const meta = isMac ? e.metaKey : e.ctrlKey;

  if (!meta || e.key.toLowerCase() !== "z") return;

  const explorer = document.getElementById("pattern-link-explorer");
  const isExplorerOpen = explorer && !explorer.classList.contains("hidden");
  const exp = uiState.patternExplorer;

  if (!isExplorerOpen) return;
  if (!exp?.active) return;
  if (!exp?.tempEdgeMode) return;

  e.preventDefault();
  undoPatternExplorerTempEdge();
});

window.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;

  const explorer = document.getElementById("pattern-link-explorer");
  const isExplorerOpen = explorer && !explorer.classList.contains("hidden");
  const exp = uiState.patternExplorer;

  if (!isExplorerOpen) return;
  if (!exp?.active) return;
  if (!exp?.tempEdgeMode) return;

  e.preventDefault();

  exp.tempEdgeMode = false;
  exp.tempEdgeChain = [];

  if (window.cy) {
    cy.nodes().forEach((n) => n.grabbable(true));
  }

  renderPatternLinkExplorerUI();
});

if (els.btnFilterPeak) {
  els.btnFilterPeak.onclick = () => {
    uiState.filterView = {
      mode: "grade",
      grade: "PEAK"
    };
    applyFilterViewHighlight();
  };
}

if (els.btnFilterCore) {
  els.btnFilterCore.onclick = () => {
    uiState.filterView = {
      mode: "threshold",
      threshold: 1.6
    };
    applyFilterViewHighlight();
  };
}

if (els.openFilterRankExplorerBtn) {
  els.openFilterRankExplorerBtn.onclick = () => {
    openFilterRankExplorer();
  };
}

if (els.closeFilterRankExplorerBtn) {
  els.closeFilterRankExplorerBtn.onclick = () => {
    closeFilterRankExplorer();
  };
}

function syncFilterRankToolbarActive() {
  if (els.filterRankPassBtn) {
    els.filterRankPassBtn.classList.toggle("active", uiState.filterRankMode === "pass");
  }

  if (els.filterRankFailBtn) {
    els.filterRankFailBtn.classList.toggle("active", uiState.filterRankMode === "fail");
  }

  if (els.filterRankBasicBtn) {
    els.filterRankBasicBtn.classList.toggle("active", uiState.filterRankMetric === "basic");
  }

  if (els.filterRankRawBtn) {
    els.filterRankRawBtn.classList.toggle("active", uiState.filterRankMetric === "raw");
  }
}

function bindFilterRankToolbarButtons() {
  if (els.filterRankPassBtn) {
    els.filterRankPassBtn.onclick = (e) => {
      uiState.filterRankMode =
        uiState.filterRankMode === "pass" ? null : "pass";

      renderFilterRankExplorer();
      syncFilterRankToolbarActive();
      e.currentTarget.blur();
    };
  }

  if (els.filterRankFailBtn) {
    els.filterRankFailBtn.onclick = (e) => {
      uiState.filterRankMode =
        uiState.filterRankMode === "fail" ? null : "fail";

      renderFilterRankExplorer();
      syncFilterRankToolbarActive();
      e.currentTarget.blur();
    };
  }

  if (els.filterRankBasicBtn) {
    els.filterRankBasicBtn.onclick = (e) => {
      uiState.filterRankMetric =
        uiState.filterRankMetric === "basic" ? null : "basic";

      renderFilterRankExplorer();
      syncFilterRankToolbarActive();
      e.currentTarget.blur();
    };
  }

  if (els.filterRankRawBtn) {
    els.filterRankRawBtn.onclick = (e) => {
      uiState.filterRankMetric =
        uiState.filterRankMetric === "raw" ? null : "raw";

      renderFilterRankExplorer();
      syncFilterRankToolbarActive();
      e.currentTarget.blur();
    };
  }

  if (els.filterRankLayerAllBtn) {
    els.filterRankLayerAllBtn.onclick = (e) => {
      createLayerFromFilterRank("all");
      e.currentTarget.blur();
    };
  }

  if (els.filterRankLayerActiveBtn) {
    els.filterRankLayerActiveBtn.onclick = (e) => {
      createLayerFromFilterRank("active");
      e.currentTarget.blur();
    };
  }

  if (els.filterRankLayerPassBtn) {
    els.filterRankLayerPassBtn.onclick = (e) => {
      createLayerFromFilterRank("pass");
      e.currentTarget.blur();
    };
  }
}

if (els.filterRankPassBtn) {
    els.filterRankPassBtn.onclick = (e) => {
      uiState.filterRankMode =
        uiState.filterRankMode === "pass" ? null : "pass";

      renderFilterRankExplorer();
      syncFilterRankToolbarActive();
      e.currentTarget.blur();
    };
  }

  if (els.filterRankFailBtn) {
    els.filterRankFailBtn.onclick = (e) => {
      uiState.filterRankMode =
        uiState.filterRankMode === "fail" ? null : "fail";

      renderFilterRankExplorer();
      syncFilterRankToolbarActive();
      e.currentTarget.blur();
    };
  }

  if (els.filterRankBasicBtn) {
    els.filterRankBasicBtn.onclick = (e) => {
      uiState.filterRankMetric =
        uiState.filterRankMetric === "basic" ? null : "basic";

      renderFilterRankExplorer();
      syncFilterRankToolbarActive();
      e.currentTarget.blur();
    };
  }

  if (els.filterRankRawBtn) {
    els.filterRankRawBtn.onclick = (e) => {
      uiState.filterRankMetric =
        uiState.filterRankMetric === "raw" ? null : "raw";

      renderFilterRankExplorer();
      syncFilterRankToolbarActive();
      e.currentTarget.blur();
    };
  }

  if (els.filterRankLayerAllBtn) {
  els.filterRankLayerAllBtn.onclick = (e) => {
    createLayerFromFilterRank("all");
    e.currentTarget.blur();
  };
}

if (els.filterRankLayerActiveBtn) {
  els.filterRankLayerActiveBtn.onclick = (e) => {
    createLayerFromFilterRank("active");
    e.currentTarget.blur();
  };
}

if (els.btnFilterReset) {
  els.btnFilterReset.onclick = () => {
    uiState.filterView = { mode: "off" };
    refreshGraphState();
  };
}

if (els.buildFilterGroupsBtn) {
  els.buildFilterGroupsBtn.onclick = () => {
    buildFilterGradeGroups();
  };
}

if (els.patternHideElementBtn) {
  els.patternHideElementBtn.onclick = () => {
    togglePatternHideElementBox();
  };
}

if (els.patternLayerHideBtn) {
  els.patternLayerHideBtn.onclick = () => {
    togglePatternLayerHideBox();
  };
}

if (els.patternRelationFilterBtn) {
  els.patternRelationFilterBtn.onclick = () => {
    togglePatternRelationFilterBox();
  };
}

if (els.patternApplyToggleMiniBtn && els.patternApplyToggleBtn) {
  els.patternApplyToggleMiniBtn.onclick = () => {
    els.patternApplyToggleBtn.click();
  };
}

if (els.patternCreateLayerMiniBtn && els.patternCreateLayerBtn) {
  els.patternCreateLayerMiniBtn.onclick = () => {
    els.patternCreateLayerBtn.click();
  };
}

if (els.closePatternPageBtn) {
  els.closePatternPageBtn.onclick = () => {
    closePatternPageCompletely();
  };
}

if (els.patternRegisterGroupMiniBtn && els.patternRegisterGroupBtn) {
  els.patternRegisterGroupMiniBtn.onclick = () => {
    els.patternRegisterGroupBtn.click();
  };
}

if (els.patternCreateLayerBtn) {
  els.patternCreateLayerBtn.onclick = () => {
    openPatternLayerExplorer();
    syncPatternExplorerMirrorButtons?.();
  };
}

if (els.patternCreateLayerMiniBtn && els.patternCreateLayerBtn) {
  els.patternCreateLayerMiniBtn.onclick = () => {
    els.patternCreateLayerBtn.click();
  };
}

if (els.closePatternLayerExplorerBtn) {
  els.closePatternLayerExplorerBtn.onclick = () => {
    closePatternLayerExplorer();
  };
}

if (els.patternRegisterGroupBtn) {
  els.patternRegisterGroupBtn.onclick = () => {
    const groups = registerSelectedPatternAsGroupFromUI();
    if (!groups.length) return;

    if (els.groupPanel) {
      els.groupPanel.classList.remove("hidden");
    }

    syncPatternExplorerMirrorButtons?.();
    renderPatternMiniExplorer?.();
  };
}

if (els.patternRegisterGroupMiniBtn && els.patternRegisterGroupBtn) {
  els.patternRegisterGroupMiniBtn.onclick = () => {
    els.patternRegisterGroupBtn.click();
  };
}

if (els.layerPromotePatternBtn) {
  els.layerPromotePatternBtn.onclick = () => {
    const pattern = promoteLayersToSinglePattern();
    if (!pattern) return;

    renderLayerPanel?.();
    renderPatterns?.(uiState.rawRankedResults || []);
    renderFocusHeader?.();
    renderSideMiniStatus?.();
    saveLabState?.();
  };
}

if (els.patternPromoteGroupBtn) {
  els.patternPromoteGroupBtn.onclick = () => {
    const group = promotePatternsToSingleGroup();
    if (!group) return;

    if (els.groupPanel) {
      els.groupPanel.classList.remove("hidden");
    }

    renderGroupPanel?.();
    renderFocusHeader?.();
    renderSideMiniStatus?.();
    saveLabState?.();
    syncPatternExplorerMirrorButtons?.();
  };
}

if (els.patternPromoteGroupMiniBtn && els.patternPromoteGroupBtn) {
  els.patternPromoteGroupMiniBtn.onclick = () => {
    els.patternPromoteGroupBtn.click();
  };
}

if (els.openLayerExplorerFullBtn) {
  els.openLayerExplorerFullBtn.onclick = () => {
    openLayerExplorerFullPage();
  };
}

if (els.closeLayerExplorerFullBtn) {
  els.closeLayerExplorerFullBtn.onclick = () => {
    closeLayerExplorerFullPage();
  };
}

if (els.layerMainTabSetBtn) {
  els.layerMainTabSetBtn.classList.toggle(
    "active",
    (uiState.layerExplorerState?.viewMode || "home") === "set"
  );

  els.layerMainTabSetBtn.onclick = () => {
    uiState.layerExplorerState.viewMode = "set";
    uiState.layerExplorerState.mainTab = "set";
    uiState.setExplorerState.viewMode = "home";
    uiState.setExplorerState.selectedSetId = null;
    renderLayerExplorerFullPage?.();
    saveLabState?.();
  };
}

if (els.openGroupExplorerFullBtn) {
  els.openGroupExplorerFullBtn.onclick = () => {
    openGroupExplorerFull();
  };
}

if (els.minimizeGroupExplorerFullBtn) {
  els.minimizeGroupExplorerFullBtn.onclick = () => {
    minimizeGroupExplorerFull();
  };
}

if (els.minimizeGroupExplorerFullViewBtn) {
  els.minimizeGroupExplorerFullViewBtn.onclick = () => {
    minimizeGroupExplorerFull();
  };
}

if (els.groupExplorerFullMinimized) {
  els.groupExplorerFullMinimized.onclick = () => {
    restoreGroupExplorerFull();
  };
}

if (els.closeGroupExplorerFullBtn) {
  els.closeGroupExplorerFullBtn.onclick = () => {
    closeGroupExplorerFull();
  };
}

if (els.groupExplorerCompactMinimized) {
  els.groupExplorerCompactMinimized.onclick = () => {
    restoreGroupExplorerCompact();
  };
}

if (els.groupExplorerCompactMinimized) {
  makeFloatingIconDraggable(
    els.groupExplorerCompactMinimized,
    "saureltia-group-compact-icon-position"
  );

  els.groupExplorerCompactMinimized.onclick = () => {
    if (els.groupExplorerCompactMinimized.dataset.wasDragged === "true") return;
    restoreGroupExplorerCompact();
  };
}

if (els.groupExplorerFullMinimized) {
  makeFloatingIconDraggable(
    els.groupExplorerFullMinimized,
    "saureltia-group-full-icon-position"
  );

  els.groupExplorerFullMinimized.onclick = () => {
    if (els.groupExplorerFullMinimized.dataset.wasDragged === "true") return;
    restoreGroupExplorerFull();
  };
}

if (els.groupFullStatusTabBtn) {
  els.groupFullStatusTabBtn.onclick = () => {
    enterGroupExplorerFullView("status");
  };
}

if (els.groupFullTheoryTabBtn) {
  els.groupFullTheoryTabBtn.onclick = () => {
    enterGroupExplorerFullView("theory");
  };
}

if (els.groupFullStructureTabBtn) {
  els.groupFullStructureTabBtn.onclick = () => {
    enterGroupExplorerFullView("structure");
  };
}

if (els.groupFullReferenceTabBtn) {
  els.groupFullReferenceTabBtn.onclick = () => {
    enterGroupExplorerFullView("reference");
  };
}

if (els.groupFullBackBtn) {
  els.groupFullBackBtn.onclick = () => {
    renderGroupExplorerFullHome();
  };
}

if (els.groupFullSearchInput) {
  els.groupFullSearchInput.onfocus = () => {
    const items = getGroupExplorerFullItems();
    renderGroupRelatedKeywords(items);
  };

  els.groupFullSearchInput.oninput = () => {
    const state = ensureGroupExplorerFullState();
    const rawQuery = String(els.groupFullSearchInput.value || "");

    state.query = rawQuery.trim();

    renderGroupExplorerFullSubview();

    const items = getGroupExplorerFullItems();
    renderGroupRelatedKeywords(items);

    saveLabState?.();
  };

  els.groupFullSearchInput.onblur = () => {
    els.groupFullSearchInput.value = String(els.groupFullSearchInput.value || "").trim();
  };

  els.groupFullSearchInput.onkeydown = (e) => {
    if (e.key !== "Enter") return;

    const keyword = String(els.groupFullSearchInput.value || "").trim();
    const state = ensureGroupExplorerFullState();

    state.query = keyword;
    els.groupFullSearchInput.value = keyword;

    recordKeywordLearning(GROUP_KEYWORD_LEARNING_KEY, keyword);
    recordKeywordLearning(GLOBAL_KEYWORD_LEARNING_KEY, keyword);

    renderGroupExplorerFullSubview();
    saveLabState?.();

    const items = getGroupExplorerFullItems();
    renderGroupRelatedKeywords(items);

    saveLabState?.();
  };
}

if (els.groupFullFilterSelect) {
  els.groupFullFilterSelect.onchange = () => {
    const state = ensureGroupExplorerFullState();
    state.filter = els.groupFullFilterSelect.value || "ALL";
    renderGroupExplorerFullSubview();
    saveLabState?.();
  };
}

if (els.groupFullSortSelect) {
  els.groupFullSortSelect.onchange = () => {
    const state = ensureGroupExplorerFullState();
    state.sort = els.groupFullSortSelect.value || "name";
    renderGroupExplorerFullSubview();
    saveLabState?.();
  };
}

if (els.groupFullAxisSelect) {
  els.groupFullAxisSelect.onchange = () => {
    const state = ensureGroupExplorerFullState();

    state.axis = els.groupFullAxisSelect.value || "overall";
    state.expandedBucketKeys = [];
    state.shouldAutoExpandFirstBucket = true;

    renderGroupExplorerFullSubview();
    saveLabState?.();
  };
}

if (els.globalSearchInput) {
  els.globalSearchInput.oninput = () => {
    renderGlobalSearchResults();
  };

  els.globalSearchInput.onfocus = () => {
    renderGlobalRelatedKeywords?.();
  };
}

const closeGlobalHubBtn = document.getElementById("btn-close-global-hub");
if (closeGlobalHubBtn) {
  closeGlobalHubBtn.onclick = () => {
    closeGlobalHubPanel();
  };
}

if (els.globalSearchInput) {
  els.globalSearchInput.onfocus = () => {
    renderGlobalRelatedKeywords?.();
  };

  els.globalSearchInput.oninput = () => {
    renderGlobalSearchResults?.();
  };
}

if (els.groupFullExpandBucketsBtn) {
  els.groupFullExpandBucketsBtn.onclick = () => {
    expandAllGroupExplorerFullBuckets();
  };
}

if (els.groupFullCollapseBucketsBtn) {
  els.groupFullCollapseBucketsBtn.onclick = () => {
    collapseAllGroupExplorerFullBuckets();
  };
}

if (els.groupFullBucketSortSelect) {
  els.groupFullBucketSortSelect.onchange = () => {
    const state = ensureGroupExplorerFullState();
    state.bucketSort = els.groupFullBucketSortSelect.value || "count";

    renderGroupExplorerFullSubview?.();
    saveLabState?.();
  };
}

if (els.backBtn) {
  els.backBtn.onclick = () => {
    if (typeof goBack === "function" && uiState.navStack?.length) {
      goBack();
      return;
    }

    if (uiState.page === "pattern-link") {
      exitPatternLinkPage();
      return;
    }

    enterNetworkPage();
  };
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    uiState.activeGroupIds = [];
    refreshGraphState();
  }
});

if (els.eventDeleteModeBtn) {
  els.eventDeleteModeBtn.onclick = () => {
    if (uiState.isEventDeleteMode) {
      exitEventDeleteMode();
    } else {
      enterEventDeleteModal();
    }
  };
}

if (els.eventDeleteConfirmBtn) {
  els.eventDeleteConfirmBtn.onclick = () => {
    openEventDeleteModal();
  };
}

if (els.closeEventDeleteModeBtn) {
  els.closeEventDeleteModeBtn.onclick = () => {
    exitEventDeleteMode();
  };
}

if (els.eventDeleteCancelBtn) {
  els.eventDeleteCancelBtn.onclick = () => {
    if (els.eventDeleteModal) {
      els.eventDeleteModal.classList.add("hidden");
    }
  };
}

if (els.eventDeleteFinalBtn) {
  els.eventDeleteFinalBtn.onclick = () => {
    deleteSelectedEvents();
  };
}

if (els.playBtn) {
  els.playBtn.onclick = () => {
    if (uiState.timelinePlaying) {
      stopTimeline();
    } else {
      playTimeline();
    }
  };
}

if (els.stopBtn) {
  els.stopBtn.onclick = () => {
    stopTimeline();
  };
}

if (els.stepForwardBtn) {
  els.stepForwardBtn.onclick = () => {
    stepTimelineForward();
  };
}

if (els.timelineResetBtn) {
  els.timelineResetBtn.onclick = () => {
    resetTimeline();
  };
}

if (els.speedUpBtn) {
  els.speedUpBtn.onclick = () => {
    increaseTimelineSpeed();
  };
}

if (els.speedDownBtn) {
  els.speedDownBtn.onclick = () => {
    decreaseTimelineSpeed();
  };
}

if (els.buildTempRelationsBtn) {
  els.buildTempRelationsBtn.onclick = () => {
    buildTemporaryTimelineRelations();
  };
}

if (els.layerDeleteModeBtn) {
  els.layerDeleteModeBtn.onclick = () => {
    if (uiState.isLayerDeleteMode) {
      exitLayerDeleteMode();
    } else {
      enterLayerDeleteMode();
    }
  };
}

if (els.layerDeleteConfirmBtn) {
  els.layerDeleteConfirmBtn.onclick = () => {
    openLayerDeleteModal();
  };
}

if (els.layerDeleteCancelBtn) {
  els.layerDeleteCancelBtn.onclick = () => {
    if (els.layerDeleteModal) {
      els.layerDeleteModal.classList.add("hidden");
    }
  };
}

if (els.layerDeleteFinalBtn) {
  els.layerDeleteFinalBtn.onclick = () => {
    deleteSelectedLayers();
  };
}

if (els.layerSaveBtn) {
  els.layerSaveBtn.onclick = () => {
    const layerName = buildAutoLayerName({
  activeGroupIds: [...(uiState.activeGroupIds || [])]
});

    const focusedNodeIds = window.cy
      ? cy.nodes().filter((n) => !n.hasClass("node-dimmed")).map((n) => n.id())
      : [];

    els.layerSaveBtn.onclick = () => {
  const groupNames = (uiState.activeGroupIds || [])
    .map(id => groupStore.get(id)?.name || id)
    .join(" + ");

  const layerName = groupNames || "전체";

  const layer = createLayerEntry({
    name: layerName, // 🔴 여기 들어감
    mode: uiState.mode || "-",
    nodes: computeActiveLayerNodes(),
    activeGroupIds: [...(uiState.activeGroupIds || [])],
    filter: { ...uiState.currentLayerFilter }
  });

  renderLayerPanel();
};

  };
}

if (els.applyLayerFilterBtn) {
  els.applyLayerFilterBtn.onclick = () => {
    readLayerFilterInputs();
    refreshGraphState();
    applyLayerVariableFilter();
    saveLabState();
  };
}

if (els.resetLayerFilterBtn) {
  els.resetLayerFilterBtn.onclick = () => {
    if (els.rotMinInput) els.rotMinInput.value = "";
    if (els.capMaxInput) els.capMaxInput.value = "";
    if (els.varMinInput) els.varMinInput.value = "";

    uiState.currentLayerFilter = {
      rotMin: null,
      capMax: null,
      varMin: null
    };

    refreshGraphState();
    saveLabState();
  };
}

if (els.layerClearBtn) {
  els.layerClearBtn.onclick = () => {
    uiState.savedLayers = [];
    uiState.currentLayerName = "기본 그래프";

    renderLayerPanel();
    renderSideMiniStatus();
    saveLabState();
  };
}

if (els.openGroupPanelBtn) {
  els.openGroupPanelBtn.onclick = () => {
    openGroupExplorerForCurrentPage();
  };
}

if (els.closeGroupPanelBtn) {
  els.closeGroupPanelBtn.onclick = () => {
    els.groupPanel.classList.add("hidden");
  };
}

if (els.eventBtn) {
  els.eventBtn.onclick = () => {
    enterEventEditor();
  };
}

if (els.relayoutBtn) {
  els.relayoutBtn.onclick = () => {
    reLayoutGraph();
  };
}

if (els.resetLabBtn) {
  els.resetLabBtn.onclick = () => {
    resetLabState();
  };
}

if (els.feedbackGoodBtn) {
  els.feedbackGoodBtn.onclick = () => {
    applyFeedback(true);
    addLog("fb+", { pattern: uiState.selectedPatternId });
  };
}

if (els.feedbackBadBtn) {
  els.feedbackBadBtn.onclick = () => {
    applyFeedback(false);
    addLog("fb-", { pattern: uiState.selectedPatternId });
  };
}

if (els.patternLinkBtn) {
  els.patternLinkBtn.onclick = () => {
    enterPatternLinkPage();
  };
}

if (els.openPatternMiniExplorerBtn) {
  els.openPatternMiniExplorerBtn.onclick = () => {
    openPatternMiniExplorer();
  };
}

if (els.closePatternMiniExplorerBtn) {
  els.closePatternMiniExplorerBtn.onclick = () => {
    closePatternMiniExplorer();
  };
}

if (els.openPatternLinkExplorerBtn) {
  els.openPatternLinkExplorerBtn.onclick = () => {
    openPatternLinkExplorer();
  };
}


if (els.closePatternLinkExplorerBtn) {
  els.closePatternLinkExplorerBtn.onclick = () => {
    closePatternLinkExplorer();
  };
}

document.addEventListener("keydown", (e) => {
  const isCmdK =
    (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k";

  const isSlash =
    e.key === "/" &&
    document.activeElement?.tagName !== "INPUT" &&
    document.activeElement?.tagName !== "TEXTAREA";

  if (isCmdK || isSlash) {
    e.preventDefault();
    openCommandPalette();
    return;
  }

  if (e.key === "Escape") {
    if (els.allDataExplorer && !els.allDataExplorer.classList.contains("hidden")) {
      closeAllDataExplorer();
      return;
    }

    if (els.commandPalette && !els.commandPalette.classList.contains("hidden")) {
      closeCommandPalette();
      return;
    }

    if (els.logExplorer && !els.logExplorer.classList.contains("hidden")) {
      closeLogExplorer();
      return;
    }

    if (els.timelineExplorer && !els.timelineExplorer.classList.contains("hidden")) {
      closeTimelineExplorer();
      return;
    }

    uiState.selectedPattern = null;
    uiState.selectedGroup = null;
    uiState.selectedPatternId = null;
    uiState.selectedGroupId = null;
    uiState.selectedEventId = null;
    uiState.selectedEvent = null;

    resetGraphFocus();

    if (els.predictionPanel) {
      els.predictionPanel.innerHTML = "Prediction: -";
    }

    renderNetworkDefault();
    renderDebugStatus();
  }
});

const patternLinkExplorerEl = document.getElementById("pattern-link-explorer");
const openPatternLinkExplorerBtn = document.getElementById("btn-open-pattern-link-explorer");
const closePatternLinkExplorerBtn = document.getElementById("btn-close-pattern-link-explorer");

if (openPatternLinkExplorerBtn && patternLinkExplorerEl) {
  openPatternLinkExplorerBtn.onclick = () => {
    patternLinkExplorerEl.classList.remove("hidden");
  };
}

if (closePatternLinkExplorerBtn && patternLinkExplorerEl) {
  closePatternLinkExplorerBtn.onclick = () => {
    patternLinkExplorerEl.classList.add("hidden");
  };
}

renderNetworkDefault()

document.getElementById("btn-delete-select-all").onclick =
  selectAllEventsForDelete;

document.getElementById("btn-delete-select-filtered").onclick =
  selectFilteredEventsForDelete;

document.getElementById("btn-delete-clear").onclick =
  clearEventDeleteSelection;

window.__saureltia_test__ = "alive";

window.debugState = uiState;

window.seedTestData = seedTestData;

globalThis.PL_DEBUG = {
  getCy: () => getPatternLinkCy(),
  getWS: () => getPatternLinkWorkspace(),
  applyDim: () => applyAutoDimToPatternLinkWorkspace(),
  restyle: () => applyPatternLinkDimStyles(getPatternLinkCy())
};

window.detectPatterns = 

detectPatterns;window.upsertEventEntry = upsertEventEntry;
window.createLayerEntry = createLayerEntry;

window.pushLog = (...args) => logEvent(args.join(" "));

window.openCommandPalette = openCommandPalette;
window.updatePatternToLayerButton = updatePatternToLayerButton;

window.createLayerFromSelectedPattern = createLayerFromSelectedPattern;

