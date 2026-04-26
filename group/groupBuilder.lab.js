export function buildSingleGroupFromPattern(pattern, options = {}) {
  if (!pattern || !Array.isArray(pattern.nodes) || pattern.nodes.length === 0) {
    return null;
  }

  const memberNodeIds = [...new Set(pattern.nodes.filter(Boolean))];
  if (!memberNodeIds.length) return null;

  const centerNodeId =
    options.centerNodeId ||
    options.center ||
    memberNodeIds[0] ||
    null;

  const edgeType =
    options.edgeType ||
    pattern.type ||
    "PATTERN_GROUP";

  const sourcePatternId =
    options.sourcePatternId ||
    pattern.id ||
    null;

  const id =
    options.id ||
    makeGroupIdFromPattern(pattern, centerNodeId, edgeType);

  const name =
    options.name ||
    makeGroupNameFromPattern(pattern, edgeType);

  const label =
    options.label ||
    name;

  const now = Date.now();

  const signatureTags = Array.isArray(options.signatureTags)
    ? [...new Set(options.signatureTags.filter(Boolean))]
    : Array.isArray(options.tags)
      ? [...new Set(options.tags.filter(Boolean))]
      : [];

  const purityTags = Array.isArray(options.purityTags)
    ? [...new Set(options.purityTags.filter(Boolean))]
    : [];

  const contaminationTags = Array.isArray(options.contaminationTags)
    ? [...new Set(options.contaminationTags.filter(Boolean))]
    : [];

  const sourceLayerNames = Array.isArray(options.sourceLayerNames)
    ? [...new Set(options.sourceLayerNames.filter(Boolean))]
    : [];

  const group = {
    id,
    name,
    label,
    description: options.description || "",
    memo: options.memo || "",

    status: {
      isActive: false,
      isSelected: false,
      isExpanded: false,
      isPinned: false,
      isReference: false,
      isBase: false,
      isDirty: false
    },

    core: {
      centerNodeId,
      requiredNodeIds: Array.isArray(options.requiredNodeIds)
        ? [...new Set(options.requiredNodeIds.filter(Boolean))]
        : (centerNodeId ? [centerNodeId] : []),
      memberNodeIds,
      excludedNodeIds: Array.isArray(options.excludedNodeIds)
        ? [...new Set(options.excludedNodeIds.filter(Boolean))]
        : [],
      requiredEdgeIds: Array.isArray(options.requiredEdgeIds)
        ? [...new Set(options.requiredEdgeIds.filter(Boolean))]
        : [],
      requiredEdgeTypes: Array.isArray(options.requiredEdgeTypes)
        ? [...new Set(options.requiredEdgeTypes.filter(Boolean))]
        : [edgeType],
      signatureTags,
      signatureVariables: normalizeSignatureVariables(options.signatureVariables),
      theoryType: options.theoryType || edgeType || null,
      purityFocus: options.purityFocus || null
    },

    context: {
      sourcePatternIds: sourcePatternId ? [sourcePatternId] : [],
      sourceLayerNames,
      sourceGroupIds: Array.isArray(options.sourceGroupIds)
        ? [...new Set(options.sourceGroupIds.filter(Boolean))]
        : [],
      promotedFrom: options.promotedFrom || null,
      promotedTo: Array.isArray(options.promotedTo)
        ? [...new Set(options.promotedTo.filter(Boolean))]
        : [],
      relatedNodeIds: Array.isArray(options.relatedNodeIds)
        ? [...new Set(options.relatedNodeIds.filter(Boolean))]
        : [],
      relatedEdgeIds: Array.isArray(options.relatedEdgeIds)
        ? [...new Set(options.relatedEdgeIds.filter(Boolean))]
        : [],
      referencedByLayerNames: Array.isArray(options.referencedByLayerNames)
        ? [...new Set(options.referencedByLayerNames.filter(Boolean))]
        : [],
      referencedByPatternIds: Array.isArray(options.referencedByPatternIds)
        ? [...new Set(options.referencedByPatternIds.filter(Boolean))]
        : [],
      sourceEventIds: Array.isArray(options.sourceEventIds)
        ? [...new Set(options.sourceEventIds.filter(Boolean))]
        : [...memberNodeIds],
      sourceDocumentIds: Array.isArray(options.sourceDocumentIds)
        ? [...new Set(options.sourceDocumentIds.filter(Boolean))]
        : [],
      purityTags,
      contaminationTags
    },

    evaluation: {
      purityScore: normalizeScore(options.purityScore, 1),
      contaminationScore: normalizeScore(options.contaminationScore, 0),
      importanceScore: normalizeScore(options.importanceScore, 0),
      cohesionScore: normalizeScore(options.cohesionScore, 0),
      confidenceScore: normalizeScore(options.confidenceScore, 0),
      overlapScore: normalizeScore(options.overlapScore, 0),
      nodeWeightMap: normalizeWeightMap(options.nodeWeightMap),
      nodeRankMap: normalizeRankMap(options.nodeRankMap),
      edgeWeightMap: normalizeWeightMap(options.edgeWeightMap),
      purityState: options.purityState || "unknown",
      contaminationState: options.contaminationState || "clean",
      theoryState: options.theoryState || "draft",
      lastEvaluatedAt: options.lastEvaluatedAt || null,
      evaluatedBy: options.evaluatedBy || "system"
    },

    display: {
      colorKey: options.colorKey || null,
      opacityMode: options.opacityMode || "score",
      emphasisMode: options.emphasisMode || "group",
      defaultRank: options.defaultRank || "related",
      visibleNodeIds: Array.isArray(options.visibleNodeIds)
        ? [...new Set(options.visibleNodeIds.filter(Boolean))]
        : [...memberNodeIds],
      dimmedNodeIds: Array.isArray(options.dimmedNodeIds)
        ? [...new Set(options.dimmedNodeIds.filter(Boolean))]
        : [],
      hiddenNodeIds: Array.isArray(options.hiddenNodeIds)
        ? [...new Set(options.hiddenNodeIds.filter(Boolean))]
        : [],
      visibleEdgeIds: Array.isArray(options.visibleEdgeIds)
        ? [...new Set(options.visibleEdgeIds.filter(Boolean))]
        : [],
      dimmedEdgeIds: Array.isArray(options.dimmedEdgeIds)
        ? [...new Set(options.dimmedEdgeIds.filter(Boolean))]
        : [],
      hiddenEdgeIds: Array.isArray(options.hiddenEdgeIds)
        ? [...new Set(options.hiddenEdgeIds.filter(Boolean))]
        : [],
      lastViewMode: options.lastViewMode || "group"
    },

    relation: {
      parentGroupId: options.parentGroupId || null,
      childGroupIds: Array.isArray(options.childGroupIds)
        ? [...new Set(options.childGroupIds.filter(Boolean))]
        : [],
      baseGroupId: options.baseGroupId || null,
      compareGroupIds: Array.isArray(options.compareGroupIds)
        ? [...new Set(options.compareGroupIds.filter(Boolean))]
        : [],
      linkedLayerSetIds: Array.isArray(options.linkedLayerSetIds)
        ? [...new Set(options.linkedLayerSetIds.filter(Boolean))]
        : [],
      linkedPatternIds: sourcePatternId
        ? [...new Set([sourcePatternId, ...(options.linkedPatternIds || [])].filter(Boolean))]
        : Array.isArray(options.linkedPatternIds)
          ? [...new Set(options.linkedPatternIds.filter(Boolean))]
          : [],
      linkedTheoryIds: Array.isArray(options.linkedTheoryIds)
        ? [...new Set(options.linkedTheoryIds.filter(Boolean))]
        : []
    },

    meta: {
      createdAt: options.createdAt ?? now,
      updatedAt: options.updatedAt ?? now,
      createdBy: options.createdBy || "system",
      updatedBy: options.updatedBy || "system",
      version: Number.isFinite(options.version) ? options.version : 1,
      locked: Boolean(options.locked),
      archived: Boolean(options.archived),
      sourceType: options.sourceType || "pattern",
      sourceId: options.sourceId || sourcePatternId || null
    }
  };

  return attachLegacyGroupFields(group, {
    edgeType,
    tags: signatureTags,
    sourcePatternId
  });
}

export function buildGroupsFromPattern(pattern, options = {}) {
  const mode = options.mode || "single";

  if (!pattern || !Array.isArray(pattern.nodes) || pattern.nodes.length === 0) {
    return [];
  }

  if (mode === "single") {
    const group = buildSingleGroupFromPattern(pattern, options);
    return group ? [group] : [];
  }

  if (mode === "split-by-node") {
    return [...new Set(pattern.nodes.filter(Boolean))]
      .map((nodeId, index) => {
        return buildSingleGroupFromPattern(
          {
            ...pattern,
            nodes: [nodeId]
          },
          {
            ...options,
            id: `${pattern.id || "PATTERN"}-GROUP-${index + 1}`,
            name: `${pattern.name || pattern.id || "Pattern"} / ${nodeId}`,
            label: `${pattern.name || pattern.id || "Pattern"} / ${nodeId}`,
            centerNodeId: nodeId
          }
        );
      })
      .filter(Boolean);
  }

  return [];
}

export function makeGroupIdFromPattern(pattern, centerNodeId, edgeType) {
  const base = pattern?.id || "PATTERN";
  const c = centerNodeId || "CENTER";
  const e = edgeType || "GROUP";
  return `GROUP-${base}-${e}-${c}`;
}

export function makeGroupNameFromPattern(pattern, edgeType = "GROUP") {
  const base = pattern?.name || pattern?.id || "Pattern";
  return `${base} / ${edgeType}`;
}

export function attachLegacyGroupFields(group, legacy = {}) {
  if (!group || !group.id) return null;

  const centerNodeId = group?.core?.centerNodeId || null;
  const memberNodeIds = Array.isArray(group?.core?.memberNodeIds)
    ? [...new Set(group.core.memberNodeIds.filter(Boolean))]
    : [];

  const signatureTags = Array.isArray(group?.core?.signatureTags)
    ? [...new Set(group.core.signatureTags.filter(Boolean))]
    : [];

  const sourcePatternIds = Array.isArray(group?.context?.sourcePatternIds)
    ? [...new Set(group.context.sourcePatternIds.filter(Boolean))]
    : [];

  const edgeType =
    legacy.edgeType ||
    group?.core?.requiredEdgeTypes?.[0] ||
    group?.core?.theoryType ||
    "GROUP";

  return {
    ...group,

    // legacy bridge
    center: centerNodeId,
    nodes: memberNodeIds,
    edgeType,
    sourcePatternId: legacy.sourcePatternId || sourcePatternIds[0] || null,
    tags: Array.isArray(legacy.tags) && legacy.tags.length
      ? [...new Set(legacy.tags.filter(Boolean))]
      : signatureTags,

    createdAt: group?.meta?.createdAt ?? Date.now(),
    updatedAt: group?.meta?.updatedAt ?? Date.now(),
    edgeCount: Number.isFinite(group?.edgeCount)
      ? group.edgeCount
      : Math.max(0, memberNodeIds.length - 1)
  };
}

function normalizeSignatureVariables(raw) {
  const input = raw && typeof raw === "object" ? raw : {};
  return {
    rot: input.rot ?? null,
    cap: input.cap ?? null,
    var: input.var ?? null
  };
}

function normalizeScore(value, fallback = 0) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  if (num < 0) return 0;
  if (num > 1) return 1;
  return num;
}

function normalizeWeightMap(raw) {
  if (!raw || typeof raw !== "object") return {};
  const out = {};

  Object.entries(raw).forEach(([key, value]) => {
    if (!key) return;
    const num = Number(value);
    if (!Number.isFinite(num)) return;
    out[key] = Math.max(0, Math.min(1, num));
  });

  return out;
}

function normalizeRankMap(raw) {
  if (!raw || typeof raw !== "object") return {};
  const allowed = new Set(["core", "strong", "related", "weak", "outside"]);
  const out = {};

  Object.entries(raw).forEach(([key, value]) => {
    if (!key || typeof value !== "string") return;
    if (!allowed.has(value)) return;
    out[key] = value;
  });

  return out;
}
