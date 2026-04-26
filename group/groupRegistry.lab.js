import { attachLegacyGroupFields } from "./groupBuilder.lab.js";

export function createGroupRegistry(initialGroups = []) {
  const store = new Map();

  function normalizeGroupShape(group) {
    if (!group || !group.id) return null;

    const normalized = {
      id: group.id,
      name: group.name || group.label || group.id,
      label: group.label || group.name || group.id,
      description: group.description || "",
      memo: group.memo || "",

      status: normalizeStatus(group.status),
      core: normalizeCore(group),
      context: normalizeContext(group),
      evaluation: normalizeEvaluation(group.evaluation),
      display: normalizeDisplay(group.display, group),
      relation: normalizeRelation(group.relation),
      meta: normalizeMeta(group.meta, group)
    };

    return attachLegacyGroupFields(normalized, {
      edgeType:
        group.edgeType ||
        normalized.core.requiredEdgeTypes?.[0] ||
        normalized.core.theoryType ||
        "GROUP",
      tags:
        Array.isArray(group.tags) && group.tags.length
          ? group.tags
          : normalized.core.signatureTags,
      sourcePatternId:
        group.sourcePatternId ||
        normalized.context.sourcePatternIds?.[0] ||
        null
    });
  }

  function registerGroup(group, options = {}) {
    const normalized = normalizeGroupShape(group);
    if (!normalized) return null;

    const existing = store.get(normalized.id);
    if (!existing) {
      store.set(normalized.id, normalized);
      return normalized;
    }

    const merge = options.merge !== false;
    if (!merge) {
      store.set(normalized.id, normalized);
      return normalized;
    }

    const merged = attachLegacyGroupFields({
      ...existing,
      ...normalized,

      status: {
        ...existing.status,
        ...normalized.status
      },

      core: {
        ...existing.core,
        ...normalized.core,
        requiredNodeIds: mergeUnique(existing.core?.requiredNodeIds, normalized.core?.requiredNodeIds),
        memberNodeIds: mergeUnique(existing.core?.memberNodeIds, normalized.core?.memberNodeIds),
        excludedNodeIds: mergeUnique(existing.core?.excludedNodeIds, normalized.core?.excludedNodeIds),
        requiredEdgeIds: mergeUnique(existing.core?.requiredEdgeIds, normalized.core?.requiredEdgeIds),
        requiredEdgeTypes: mergeUnique(existing.core?.requiredEdgeTypes, normalized.core?.requiredEdgeTypes),
        signatureTags: mergeUnique(existing.core?.signatureTags, normalized.core?.signatureTags),
        signatureVariables: {
          rot: normalized.core?.signatureVariables?.rot ?? existing.core?.signatureVariables?.rot ?? null,
          cap: normalized.core?.signatureVariables?.cap ?? existing.core?.signatureVariables?.cap ?? null,
          var: normalized.core?.signatureVariables?.var ?? existing.core?.signatureVariables?.var ?? null
        }
      },

      context: {
        ...existing.context,
        ...normalized.context,
        sourcePatternIds: mergeUnique(existing.context?.sourcePatternIds, normalized.context?.sourcePatternIds),
        sourceLayerNames: mergeUnique(existing.context?.sourceLayerNames, normalized.context?.sourceLayerNames),
        sourceGroupIds: mergeUnique(existing.context?.sourceGroupIds, normalized.context?.sourceGroupIds),
        promotedTo: mergeUnique(existing.context?.promotedTo, normalized.context?.promotedTo),
        relatedNodeIds: mergeUnique(existing.context?.relatedNodeIds, normalized.context?.relatedNodeIds),
        relatedEdgeIds: mergeUnique(existing.context?.relatedEdgeIds, normalized.context?.relatedEdgeIds),
        referencedByLayerNames: mergeUnique(existing.context?.referencedByLayerNames, normalized.context?.referencedByLayerNames),
        referencedByPatternIds: mergeUnique(existing.context?.referencedByPatternIds, normalized.context?.referencedByPatternIds),
        sourceEventIds: mergeUnique(existing.context?.sourceEventIds, normalized.context?.sourceEventIds),
        sourceDocumentIds: mergeUnique(existing.context?.sourceDocumentIds, normalized.context?.sourceDocumentIds),
        purityTags: mergeUnique(existing.context?.purityTags, normalized.context?.purityTags),
        contaminationTags: mergeUnique(existing.context?.contaminationTags, normalized.context?.contaminationTags)
      },

      evaluation: {
        ...existing.evaluation,
        ...normalized.evaluation,
        nodeWeightMap: {
          ...(existing.evaluation?.nodeWeightMap || {}),
          ...(normalized.evaluation?.nodeWeightMap || {})
        },
        nodeRankMap: {
          ...(existing.evaluation?.nodeRankMap || {}),
          ...(normalized.evaluation?.nodeRankMap || {})
        },
        edgeWeightMap: {
          ...(existing.evaluation?.edgeWeightMap || {}),
          ...(normalized.evaluation?.edgeWeightMap || {})
        }
      },

      display: {
        ...existing.display,
        ...normalized.display,
        visibleNodeIds: mergeUnique(existing.display?.visibleNodeIds, normalized.display?.visibleNodeIds),
        dimmedNodeIds: mergeUnique(existing.display?.dimmedNodeIds, normalized.display?.dimmedNodeIds),
        hiddenNodeIds: mergeUnique(existing.display?.hiddenNodeIds, normalized.display?.hiddenNodeIds),
        visibleEdgeIds: mergeUnique(existing.display?.visibleEdgeIds, normalized.display?.visibleEdgeIds),
        dimmedEdgeIds: mergeUnique(existing.display?.dimmedEdgeIds, normalized.display?.dimmedEdgeIds),
        hiddenEdgeIds: mergeUnique(existing.display?.hiddenEdgeIds, normalized.display?.hiddenEdgeIds)
      },

      relation: {
        ...existing.relation,
        ...normalized.relation,
        childGroupIds: mergeUnique(existing.relation?.childGroupIds, normalized.relation?.childGroupIds),
        compareGroupIds: mergeUnique(existing.relation?.compareGroupIds, normalized.relation?.compareGroupIds),
        linkedLayerSetIds: mergeUnique(existing.relation?.linkedLayerSetIds, normalized.relation?.linkedLayerSetIds),
        linkedPatternIds: mergeUnique(existing.relation?.linkedPatternIds, normalized.relation?.linkedPatternIds),
        linkedTheoryIds: mergeUnique(existing.relation?.linkedTheoryIds, normalized.relation?.linkedTheoryIds)
      },

      meta: {
        ...existing.meta,
        ...normalized.meta,
        createdAt: existing.meta?.createdAt ?? normalized.meta?.createdAt ?? Date.now(),
        updatedAt: Date.now(),
        version: Math.max(
          Number(existing.meta?.version || 1),
          Number(normalized.meta?.version || 1)
        )
      }
    }, {
      edgeType:
        normalized.edgeType ||
        existing.edgeType ||
        normalized.core?.requiredEdgeTypes?.[0] ||
        existing.core?.requiredEdgeTypes?.[0] ||
        "GROUP",
      tags: mergeUnique(existing.tags, normalized.tags),
      sourcePatternId:
        normalized.sourcePatternId ||
        existing.sourcePatternId ||
        normalized.context?.sourcePatternIds?.[0] ||
        existing.context?.sourcePatternIds?.[0] ||
        null
    });

    store.set(merged.id, merged);
    return merged;
  }

  function registerGroups(groups = [], options = {}) {
    return groups
      .map((group) => registerGroup(group, options))
      .filter(Boolean);
  }

  function getGroup(id) {
    return store.get(id) || null;
  }

  function getAllGroups() {
    return [...store.values()];
  }

  function hasGroup(id) {
    return store.has(id);
  }

  function removeGroup(id) {
    return store.delete(id);
  }

  function clear() {
    store.clear();
  }

  function replaceAll(groups = []) {
    clear();
    registerGroups(groups, { merge: false });
    return getAllGroups();
  }

  registerGroups(initialGroups, { merge: false });

  return {
    registerGroup,
    registerGroups,
    getGroup,
    getAllGroups,
    hasGroup,
    removeGroup,
    clear,
    replaceAll,
    rawStore: store
  };
}

function normalizeStatus(status = {}) {
  return {
    isActive: Boolean(status?.isActive),
    isSelected: Boolean(status?.isSelected),
    isExpanded: Boolean(status?.isExpanded),
    isPinned: Boolean(status?.isPinned),
    isReference: Boolean(status?.isReference),
    isBase: Boolean(status?.isBase),
    isDirty: Boolean(status?.isDirty)
  };
}

function normalizeCore(group) {
  const legacyNodes = Array.isArray(group?.nodes) ? group.nodes : [];
  const legacyCenter = group?.center || null;
  const legacyTags = Array.isArray(group?.tags) ? group.tags : [];
  const core = group?.core || {};

  const memberNodeIds = mergeUnique(core.memberNodeIds, legacyNodes);
  const centerNodeId = core.centerNodeId || legacyCenter || memberNodeIds[0] || null;

  return {
    centerNodeId,
    requiredNodeIds: mergeUnique(core.requiredNodeIds, centerNodeId ? [centerNodeId] : []),
    memberNodeIds,
    excludedNodeIds: uniqueArray(core.excludedNodeIds),
    requiredEdgeIds: uniqueArray(core.requiredEdgeIds),
    requiredEdgeTypes: mergeUnique(core.requiredEdgeTypes, group?.edgeType ? [group.edgeType] : []),
    signatureTags: mergeUnique(core.signatureTags, legacyTags),
    signatureVariables: {
      rot: core?.signatureVariables?.rot ?? null,
      cap: core?.signatureVariables?.cap ?? null,
      var: core?.signatureVariables?.var ?? null
    },
    theoryType: core.theoryType || group?.edgeType || null,
    purityFocus: core.purityFocus || null
  };
}

function normalizeContext(group) {
  const ctx = group?.context || {};
  return {
    sourcePatternIds: mergeUnique(
      ctx.sourcePatternIds,
      group?.sourcePatternId ? [group.sourcePatternId] : []
    ),
    sourceLayerNames: uniqueArray(ctx.sourceLayerNames),
    sourceGroupIds: uniqueArray(ctx.sourceGroupIds),
    promotedFrom: ctx.promotedFrom || null,
    promotedTo: uniqueArray(ctx.promotedTo),
    relatedNodeIds: uniqueArray(ctx.relatedNodeIds),
    relatedEdgeIds: uniqueArray(ctx.relatedEdgeIds),
    referencedByLayerNames: uniqueArray(ctx.referencedByLayerNames),
    referencedByPatternIds: uniqueArray(ctx.referencedByPatternIds),
    sourceEventIds: uniqueArray(ctx.sourceEventIds),
    sourceDocumentIds: uniqueArray(ctx.sourceDocumentIds),
    purityTags: uniqueArray(ctx.purityTags),
    contaminationTags: uniqueArray(ctx.contaminationTags)
  };
}

function normalizeEvaluation(evaluation = {}) {
  return {
    purityScore: clampScore(evaluation.purityScore, 1),
    contaminationScore: clampScore(evaluation.contaminationScore, 0),
    importanceScore: clampScore(evaluation.importanceScore, 0),
    cohesionScore: clampScore(evaluation.cohesionScore, 0),
    confidenceScore: clampScore(evaluation.confidenceScore, 0),
    overlapScore: clampScore(evaluation.overlapScore, 0),
    nodeWeightMap: normalizeMap(evaluation.nodeWeightMap),
    nodeRankMap: normalizeRankMap(evaluation.nodeRankMap),
    edgeWeightMap: normalizeMap(evaluation.edgeWeightMap),
    purityState: evaluation.purityState || "unknown",
    contaminationState: evaluation.contaminationState || "clean",
    theoryState: evaluation.theoryState || "draft",
    lastEvaluatedAt: evaluation.lastEvaluatedAt || null,
    evaluatedBy: evaluation.evaluatedBy || "system"
  };
}

function normalizeDisplay(display = {}, group = {}) {
  const memberNodeIds = group?.core?.memberNodeIds || group?.nodes || [];
  return {
    colorKey: display.colorKey || null,
    opacityMode: display.opacityMode || "score",
    emphasisMode: display.emphasisMode || "group",
    defaultRank: display.defaultRank || "related",
    visibleNodeIds: uniqueArray(display.visibleNodeIds?.length ? display.visibleNodeIds : memberNodeIds),
    dimmedNodeIds: uniqueArray(display.dimmedNodeIds),
    hiddenNodeIds: uniqueArray(display.hiddenNodeIds),
    visibleEdgeIds: uniqueArray(display.visibleEdgeIds),
    dimmedEdgeIds: uniqueArray(display.dimmedEdgeIds),
    hiddenEdgeIds: uniqueArray(display.hiddenEdgeIds),
    lastViewMode: display.lastViewMode || "group"
  };
}

function normalizeRelation(relation = {}) {
  return {
    parentGroupId: relation.parentGroupId || null,
    childGroupIds: uniqueArray(relation.childGroupIds),
    baseGroupId: relation.baseGroupId || null,
    compareGroupIds: uniqueArray(relation.compareGroupIds),
    linkedLayerSetIds: uniqueArray(relation.linkedLayerSetIds),
    linkedPatternIds: uniqueArray(relation.linkedPatternIds),
    linkedTheoryIds: uniqueArray(relation.linkedTheoryIds)
  };
}

function normalizeMeta(meta = {}, group = {}) {
  return {
    createdAt: Number.isFinite(meta.createdAt)
      ? meta.createdAt
      : Number.isFinite(group.createdAt)
        ? group.createdAt
        : Date.now(),
    updatedAt: Number.isFinite(meta.updatedAt)
      ? meta.updatedAt
      : Number.isFinite(group.updatedAt)
        ? group.updatedAt
        : Date.now(),
    createdBy: meta.createdBy || "system",
    updatedBy: meta.updatedBy || "system",
    version: Number.isFinite(meta.version) ? meta.version : 1,
    locked: Boolean(meta.locked),
    archived: Boolean(meta.archived),
    sourceType: meta.sourceType || "pattern",
    sourceId: meta.sourceId || group?.sourcePatternId || null
  };
}

function uniqueArray(input) {
  return Array.isArray(input)
    ? [...new Set(input.filter(Boolean))]
    : [];
}

function mergeUnique(a, b) {
  return [...new Set([...(Array.isArray(a) ? a : []), ...(Array.isArray(b) ? b : [])].filter(Boolean))];
}

function clampScore(value, fallback = 0) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(0, Math.min(1, num));
}

function normalizeMap(raw) {
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
