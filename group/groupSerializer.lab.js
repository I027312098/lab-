import { attachLegacyGroupFields } from "./groupBuilder.lab.js";

const GROUP_SCHEMA = "saureltia.group";
const GROUP_SCHEMA_VERSION = "2.0";

export function normalizeGroup(raw) {
  if (!raw || !raw.id) return null;

  const normalized = {
    id: raw.id,
    name: raw.name || raw.label || raw.id,
    label: raw.label || raw.name || raw.id,
    description: raw.description || "",
    memo: raw.memo || "",

    status: {
      isActive: Boolean(raw?.status?.isActive),
      isSelected: Boolean(raw?.status?.isSelected),
      isExpanded: Boolean(raw?.status?.isExpanded),
      isPinned: Boolean(raw?.status?.isPinned),
      isReference: Boolean(raw?.status?.isReference),
      isBase: Boolean(raw?.status?.isBase),
      isDirty: Boolean(raw?.status?.isDirty)
    },

    core: {
      centerNodeId: raw?.core?.centerNodeId || raw.center || null,
      requiredNodeIds: uniqueArray(raw?.core?.requiredNodeIds),
      memberNodeIds: mergeUnique(raw?.core?.memberNodeIds, raw.nodes),
      excludedNodeIds: uniqueArray(raw?.core?.excludedNodeIds),
      requiredEdgeIds: uniqueArray(raw?.core?.requiredEdgeIds),
      requiredEdgeTypes: mergeUnique(raw?.core?.requiredEdgeTypes, raw.edgeType ? [raw.edgeType] : []),
      signatureTags: mergeUnique(raw?.core?.signatureTags, raw.tags),
      signatureVariables: {
        rot: raw?.core?.signatureVariables?.rot ?? null,
        cap: raw?.core?.signatureVariables?.cap ?? null,
        var: raw?.core?.signatureVariables?.var ?? null
      },
      theoryType: raw?.core?.theoryType || raw.edgeType || null,
      purityFocus: raw?.core?.purityFocus || null
    },

    context: {
      sourcePatternIds: mergeUnique(raw?.context?.sourcePatternIds, raw.sourcePatternId ? [raw.sourcePatternId] : []),
      sourceLayerNames: uniqueArray(raw?.context?.sourceLayerNames),
      sourceGroupIds: uniqueArray(raw?.context?.sourceGroupIds),
      promotedFrom: raw?.context?.promotedFrom || null,
      promotedTo: uniqueArray(raw?.context?.promotedTo),
      relatedNodeIds: uniqueArray(raw?.context?.relatedNodeIds),
      relatedEdgeIds: uniqueArray(raw?.context?.relatedEdgeIds),
      referencedByLayerNames: uniqueArray(raw?.context?.referencedByLayerNames),
      referencedByPatternIds: uniqueArray(raw?.context?.referencedByPatternIds),
      sourceEventIds: uniqueArray(raw?.context?.sourceEventIds),
      sourceDocumentIds: uniqueArray(raw?.context?.sourceDocumentIds),
      purityTags: uniqueArray(raw?.context?.purityTags),
      contaminationTags: uniqueArray(raw?.context?.contaminationTags)
    },

    evaluation: {
      purityScore: clampScore(raw?.evaluation?.purityScore, 1),
      contaminationScore: clampScore(raw?.evaluation?.contaminationScore, 0),
      importanceScore: clampScore(raw?.evaluation?.importanceScore, 0),
      cohesionScore: clampScore(raw?.evaluation?.cohesionScore, 0),
      confidenceScore: clampScore(raw?.evaluation?.confidenceScore, 0),
      overlapScore: clampScore(raw?.evaluation?.overlapScore, 0),
      nodeWeightMap: normalizeMap(raw?.evaluation?.nodeWeightMap),
      nodeRankMap: normalizeRankMap(raw?.evaluation?.nodeRankMap),
      edgeWeightMap: normalizeMap(raw?.evaluation?.edgeWeightMap),
      purityState: raw?.evaluation?.purityState || "unknown",
      contaminationState: raw?.evaluation?.contaminationState || "clean",
      theoryState: raw?.evaluation?.theoryState || "draft",
      lastEvaluatedAt: raw?.evaluation?.lastEvaluatedAt || null,
      evaluatedBy: raw?.evaluation?.evaluatedBy || "system"
    },

    display: {
      colorKey: raw?.display?.colorKey || null,
      opacityMode: raw?.display?.opacityMode || "score",
      emphasisMode: raw?.display?.emphasisMode || "group",
      defaultRank: raw?.display?.defaultRank || "related",
      visibleNodeIds: uniqueArray(raw?.display?.visibleNodeIds),
      dimmedNodeIds: uniqueArray(raw?.display?.dimmedNodeIds),
      hiddenNodeIds: uniqueArray(raw?.display?.hiddenNodeIds),
      visibleEdgeIds: uniqueArray(raw?.display?.visibleEdgeIds),
      dimmedEdgeIds: uniqueArray(raw?.display?.dimmedEdgeIds),
      hiddenEdgeIds: uniqueArray(raw?.display?.hiddenEdgeIds),
      lastViewMode: raw?.display?.lastViewMode || "group"
    },

    relation: {
      parentGroupId: raw?.relation?.parentGroupId || null,
      childGroupIds: uniqueArray(raw?.relation?.childGroupIds),
      baseGroupId: raw?.relation?.baseGroupId || null,
      compareGroupIds: uniqueArray(raw?.relation?.compareGroupIds),
      linkedLayerSetIds: uniqueArray(raw?.relation?.linkedLayerSetIds),
      linkedPatternIds: uniqueArray(raw?.relation?.linkedPatternIds),
      linkedTheoryIds: uniqueArray(raw?.relation?.linkedTheoryIds)
    },

    meta: {
      createdAt: Number.isFinite(raw?.meta?.createdAt)
        ? raw.meta.createdAt
        : Number.isFinite(raw.createdAt)
          ? raw.createdAt
          : Date.now(),
      updatedAt: Number.isFinite(raw?.meta?.updatedAt)
        ? raw.meta.updatedAt
        : Number.isFinite(raw.updatedAt)
          ? raw.updatedAt
          : Date.now(),
      createdBy: raw?.meta?.createdBy || "system",
      updatedBy: raw?.meta?.updatedBy || "system",
      version: Number.isFinite(raw?.meta?.version) ? raw.meta.version : 1,
      locked: Boolean(raw?.meta?.locked),
      archived: Boolean(raw?.meta?.archived),
      sourceType: raw?.meta?.sourceType || "pattern",
      sourceId: raw?.meta?.sourceId || raw?.sourcePatternId || null
    }
  };

  return attachLegacyGroupFields(normalized, {
    edgeType:
      raw.edgeType ||
      normalized.core.requiredEdgeTypes?.[0] ||
      normalized.core.theoryType ||
      "GROUP",
    tags:
      Array.isArray(raw.tags) && raw.tags.length
        ? raw.tags
        : normalized.core.signatureTags,
    sourcePatternId:
      raw.sourcePatternId ||
      normalized.context.sourcePatternIds?.[0] ||
      null
  });
}

export function exportGroups(groups = []) {
  return {
    schema: GROUP_SCHEMA,
    version: GROUP_SCHEMA_VERSION,
    exportedAt: Date.now(),
    count: groups.length,
    groups: groups.map((group) => normalizeGroup(group)).filter(Boolean)
  };
}

export function importGroups(raw) {
  if (!raw) return [];

  const groups = Array.isArray(raw)
    ? raw
    : Array.isArray(raw.groups)
      ? raw.groups
      : [];

  return groups.map((group) => normalizeGroup(group)).filter(Boolean);
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
