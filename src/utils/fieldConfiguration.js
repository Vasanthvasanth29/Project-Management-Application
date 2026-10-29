const ALL_TYPES = [
    'INITIATIVE',
    'FEATURE',
    'EPIC',
    'STORY',
    'TASK',
    'SUB-TASK',
    'BUG_FIX',
    'IMPROVEMENT',
];
const DELIVERY_TYPES = ['STORY', 'TASK', 'SUB-TASK', 'BUG_FIX', 'IMPROVEMENT'];
const PLANNING_TYPES = ['INITIATIVE', 'FEATURE', 'EPIC'];
export const STANDARD_FIELD_DEFS = [
    { key: 'description', label: 'Description', types: ALL_TYPES },
    { key: 'priority', label: 'Priority', types: ALL_TYPES },
    { key: 'assignee', label: 'Assignee', types: ALL_TYPES },
    { key: 'parent', label: 'Parent Link', types: ['FEATURE', 'EPIC', 'STORY', 'TASK', 'SUB-TASK', 'BUG_FIX', 'IMPROVEMENT'] },
    { key: 'dueDate', label: 'Due Date', types: [...DELIVERY_TYPES, 'EPIC', 'FEATURE'] },
    { key: 'startDate', label: 'Start Date', types: ['INITIATIVE'] },
    { key: 'team', label: 'Team', types: ALL_TYPES },
    { key: 'labels', label: 'Tags', types: ALL_TYPES },
    { key: 'components', label: 'Modules', types: ALL_TYPES },
    { key: 'fixVersions', label: 'Target Release', types: ALL_TYPES },
    { key: 'affectsVersions', label: 'Affected Releases', types: ALL_TYPES },
    { key: 'applicationCis', label: 'Application CI (as per CMDB)', types: PLANNING_TYPES.concat(DELIVERY_TYPES) },
    { key: 'resolution', label: 'Resolution', types: ALL_TYPES },
];
export const STANDARD_FIELD_KEY_TO_LABEL = STANDARD_FIELD_DEFS.reduce((acc, def) => {
    acc[def.key] = def.label;
    return acc;
}, {});
export const standardFieldLabel = (key) => STANDARD_FIELD_KEY_TO_LABEL[key] ?? key;
/** True when the key names a known configurable standard field. */
export const isStandardFieldKey = (key) => Object.prototype.hasOwnProperty.call(STANDARD_FIELD_KEY_TO_LABEL, key);
/**
 * Safe default standard-field set for a work item type: every configurable
 * field applicable to that type, in catalog order. Existing projects without
 * a saved config keep exactly the fields they show today.
 */
export const defaultStandardFieldsForType = (type) => STANDARD_FIELD_DEFS.filter((def) => def.types.includes(type)).map((def) => def.key);
/** The configurable standard fields for a type (for the configuration UI). */
export const standardFieldsForType = (type) => STANDARD_FIELD_DEFS.filter((def) => def.types.includes(type));
/**
 * Resolved standard-field keys for a project + work item type, in display
 * order. Falls back to the safe defaults when the project has no saved config
 * for the type (or the saved list is empty / contains unknown keys only).
 */
export const getStandardFieldConfig = (project, type) => {
    const saved = project?.fieldConfig?.standardFields?.[type];
    if (!Array.isArray(saved) || saved.length === 0) {
        return defaultStandardFieldsForType(type);
    }
    // Keep only known keys, de-duplicated, preserving saved order; unknown keys
    // (e.g. from an older catalog) are dropped so they can never render.
    const seen = new Set();
    const keys = [];
    saved.forEach((key) => {
        if (isStandardFieldKey(key) && !seen.has(key)) {
            seen.add(key);
            keys.push(key);
        }
    });
    return keys.length > 0 ? keys : defaultStandardFieldsForType(type);
};
/** True when a standard field should be shown for a project + type. */
export const isStandardFieldShown = (project, type, key) => getStandardFieldConfig(project, type).includes(key);
/** Order two standard field keys by their position in the resolved config. */
export const standardFieldSorter = (project, type) => {
    const order = getStandardFieldConfig(project, type);
    return (a, b) => {
        const ia = order.indexOf(a);
        const ib = order.indexOf(b);
        return (ia === -1 ? order.length : ia) - (ib === -1 ? order.length : ib);
    };
};
/** Build a normalized ProjectFieldConfig from a per-type map, dropping empty
 *  and unknown entries so a saved config can never carry garbage. */
export const normalizeFieldConfig = (standardFields) => {
    const out = {};
    Object.keys(standardFields).forEach((type) => {
        const keys = standardFields[type];
        if (!Array.isArray(keys) || keys.length === 0)
            return;
        const seen = new Set();
        const clean = [];
        keys.forEach((key) => {
            if (isStandardFieldKey(key) && !seen.has(key)) {
                seen.add(key);
                clean.push(key);
            }
        });
        if (clean.length > 0)
            out[type] = clean;
    });
    return { standardFields: out };
};
