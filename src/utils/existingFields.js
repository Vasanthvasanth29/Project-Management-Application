import { STANDARD_FIELD_DEFS, defaultStandardFieldsForType, } from './fieldConfiguration';
import { CUSTOM_FIELD_TYPE_LABEL, STANDARD_FIELD_LABELS, fieldLabel } from './customFields';
/** Normalized identity for duplicate detection (trimmed, case-insensitive). */
export const normalizeFieldName = (value) => value.trim().toLowerCase();
/** Standard-field keys shown for a draft + type (empty/absent → safe defaults). */
export const draftStandardKeys = (draft, type) => {
    const saved = draft.standardFields[type];
    return saved && saved.length > 0 ? saved : defaultStandardFieldsForType(type);
};
/** True when the draft already displays this standard key for the type. */
export const isStandardKeyEnabled = (draft, type, key) => draftStandardKeys(draft, type).includes(key);
/** True when a draft custom field applies to the type (empty list = all types). */
export const customFieldAppliesTo = (field, type) => {
    const types = field.applicableIssueTypes ?? [];
    return types.length === 0 || types.includes(type);
};
/** A custom field name may not collide with any built-in (registry) field. */
const CORE_FIELD_LABELS = ['Title', 'Type', 'Status'];
const RESERVED_FIELD_LABELS = [
    ...new Set([...CORE_FIELD_LABELS, ...STANDARD_FIELD_LABELS, ...STANDARD_FIELD_DEFS.map((d) => d.label)]),
];
/**
 * True when a candidate custom-field name shadows a built-in field (core or
 * catalog label). Case-insensitive after trimming whitespace.
 */
export const isReservedFieldName = (name) => {
    const normalized = normalizeFieldName(name);
    return normalized !== '' && RESERVED_FIELD_LABELS.some((l) => normalizeFieldName(l) === normalized);
};
/**
 * Duplicate check against the draft's custom fields: case-insensitive after
 * trimming, excluding the field being edited. Returns the clash or undefined.
 */
export const findDuplicateCustomFieldName = (name, draft, excludeId) => {
    const normalized = normalizeFieldName(name);
    if (!normalized)
        return undefined;
    return draft.customFields.find((f) => f.id !== excludeId && normalizeFieldName(fieldLabel(f)) === normalized);
};
/**
 * Full custom-field name validation: reserved (built-in) names and
 * case-insensitive duplicates are both rejected. Returns an error message or
 * null when the name is usable.
 */
export const validateCustomFieldName = (name, draft, excludeId) => {
    const trimmed = name.trim();
    if (!trimmed)
        return 'A field name is required.';
    if (isReservedFieldName(trimmed)) {
        return `"${trimmed}" is a standard field name and cannot be reused.`;
    }
    const duplicate = findDuplicateCustomFieldName(trimmed, draft, excludeId);
    if (duplicate) {
        return `A field named "${fieldLabel(duplicate)}" already exists for this project.`;
    }
    return null;
};
/**
 * Every field the "Add Existing Field" picker may offer for this draft:
 *  - `system`   registry fields (enabled/eligible per work item type),
 *  - `project`  this project's own custom definitions,
 *  - `external` custom definitions from other projects (reusable templates —
 *    selecting one copies the definition into this project exactly once).
 * Names are de-duplicated so a registry like "Client Name" never lists twice.
 */
export const buildExistingFieldCandidates = (draft, workTypes, external = {}) => {
    const candidates = [];
    const seenNames = new Set();
    // ---- System (built-in registry) fields ----
    STANDARD_FIELD_DEFS.forEach((def) => {
        const supported = workTypes.filter((t) => def.types.includes(t));
        if (supported.length === 0)
            return;
        const enabledTypes = supported.filter((t) => isStandardKeyEnabled(draft, t, def.key));
        candidates.push({
            id: `std:${def.key}`,
            kind: 'system',
            name: def.label,
            typeLabel: 'System',
            source: 'System field',
            enabledTypes,
            eligibleTypes: supported.filter((t) => !enabledTypes.includes(t)),
            supportedTypes: supported,
            systemKey: def.key,
        });
        seenNames.add(normalizeFieldName(def.label));
    });
    // ---- This project's custom definitions ----
    draft.customFields.forEach((field) => {
        const name = fieldLabel(field);
        const applicable = field.applicableIssueTypes ?? [];
        const enabledTypes = applicable.length === 0 ? [...workTypes] : workTypes.filter((t) => applicable.includes(t));
        const eligibleTypes = workTypes.filter((t) => !enabledTypes.includes(t));
        candidates.push({
            id: `cf:${field.id}`,
            kind: 'project',
            name,
            typeLabel: CUSTOM_FIELD_TYPE_LABEL[field.type] || field.type,
            source: 'This project',
            enabledTypes,
            eligibleTypes,
            supportedTypes: workTypes,
            definition: field,
        });
        seenNames.add(normalizeFieldName(name));
    });
    // ---- Other projects' custom definitions (reusable, never duplicated) ----
    const externals = external.definitions ?? [];
    const externalIds = new Set(draft.customFields.map((f) => f.id));
    externals.forEach((field, index) => {
        if (externalIds.has(field.id))
            return;
        const name = fieldLabel(field);
        const normalized = normalizeFieldName(name);
        if (!normalized || seenNames.has(normalized))
            return;
        seenNames.add(normalized);
        // A same-named field may already exist in this project under another id:
        // its applicability marks the already-added types for THIS candidate too.
        const sameName = draft.customFields.find((f) => normalizeFieldName(fieldLabel(f)) === normalized);
        const applicable = (sameName ?? field).applicableIssueTypes ?? [];
        const enabledTypes = sameName
            ? applicable.length === 0
                ? [...workTypes]
                : workTypes.filter((t) => applicable.includes(t))
            : [];
        candidates.push({
            id: `ext:${field.id}`,
            kind: 'external',
            name,
            typeLabel: CUSTOM_FIELD_TYPE_LABEL[field.type] || field.type,
            source: external.projectNames?.[field.projectId] || 'Other project',
            enabledTypes,
            eligibleTypes: workTypes.filter((t) => !enabledTypes.includes(t)),
            supportedTypes: workTypes,
            definition: { ...field, createdAt: field.createdAt || new Date(index).toISOString() },
        });
    });
    return candidates;
};
/** Case-insensitive substring search over name, type and source. */
export const filterExistingCandidates = (candidates, query) => {
    const q = query.trim().toLowerCase();
    if (!q)
        return candidates;
    return candidates.filter((c) => c.name.toLowerCase().includes(q) ||
        c.typeLabel.toLowerCase().includes(q) ||
        c.source.toLowerCase().includes(q));
};
/** A candidate the admin cannot pick at all (already on every supported type). */
export const isAlreadyAdded = (candidate) => candidate.eligibleTypes.length === 0;
const nextOrder = (fields) => fields.reduce((max, f) => Math.max(max, f.order ?? -1), -1) + 1;
/**
 * Apply the picker's selection to the draft. Guarantees:
 *  - system fields are appended to each chosen type's key list only when not
 *    already present (never duplicated, never a new definition),
 *  - existing custom definitions keep their id and stored values — only
 *    `applicableIssueTypes` is widened (union),
 *  - external definitions are copied into this project once; a later pick of
 *    the same name widens the first copy instead of adding another row,
 *  - ineligible types (already enabled) are ignored, so the same field can
 *    never be added twice to the same work item type.
 */
export const applyExistingFieldSelection = (draft, candidates, picks, workTypes) => {
    const standardFields = { ...draft.standardFields };
    const customFields = draft.customFields.map((f) => ({ ...f }));
    const keysOf = (type) => standardFields[type] && standardFields[type].length > 0
        ? standardFields[type]
        : defaultStandardFieldsForType(type);
    picks.forEach((pick) => {
        const candidate = candidates.find((c) => c.id === pick.candidateId);
        if (!candidate)
            return;
        const types = pick.types.filter((t) => workTypes.includes(t) && candidate.eligibleTypes.includes(t));
        if (types.length === 0)
            return;
        if (candidate.kind === 'system' && candidate.systemKey) {
            types.forEach((type) => {
                const current = keysOf(type);
                if (!current.includes(candidate.systemKey)) {
                    standardFields[type] = [...current, candidate.systemKey];
                }
            });
            return;
        }
        const name = normalizeFieldName(candidate.name);
        const existingIndex = customFields.findIndex((f) => normalizeFieldName(fieldLabel(f)) === name);
        if (existingIndex >= 0) {
            // Reuse the existing definition — widen applicability only.
            const field = customFields[existingIndex];
            const applicable = field.applicableIssueTypes ?? [];
            if (applicable.length > 0) {
                customFields[existingIndex] = {
                    ...field,
                    applicableIssueTypes: Array.from(new Set([...applicable, ...types])),
                };
            }
            return;
        }
        if (candidate.definition) {
            customFields.push({
                ...candidate.definition,
                id: `cf-draft-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                projectId: candidate.definition.projectId,
                applicableIssueTypes: types,
                order: nextOrder(customFields),
                createdAt: candidate.definition.createdAt || new Date().toISOString(),
            });
        }
    });
    return { standardFields, customFields };
};
