import { isLegacySeedCustomFieldId, isUnwantedCustomFieldName } from '../data/customFields';
/**
 * localStorage bridge so Admin/PM-created custom field definitions and
 * per-issue values survive page refresh (the app store itself resets to seed
 * data on reload). Frontend-only persistence — no backend involved.
 */
const STORAGE_KEY = 'flowexec-custom-fields-v1';
/** Normalized identity used for duplicate detection: project + name (and,
 *  when set, the resolved type-applicability), never the display label alone.
 *  Stable field `id` is always the primary key; this is the secondary guard
 *  so a re-saved or re-loaded config can never surface two "Client name" rows. */
const duplicateIdentity = (d) => {
    const name = (d.label ?? d.name).trim().toLowerCase();
    const types = (d.applicableIssueTypes ?? []).slice().sort().join('|');
    return `${d.projectId}::${name}::${types}`;
};
/**
 * Drop duplicate custom-field definitions: exact id duplicates keep the first
 * occurrence; identity duplicates (same project + normalized name + type set)
 * keep the one with the lowest `order` (ties → first occurrence). This runs on
 * every hydration so stale snapshots that already contain duplicates (e.g. the
 * old Details-page "Client name" double entries) are healed on load.
 */
export const dedupeCustomFieldDefinitions = (definitions) => {
    const byId = new Map();
    definitions.forEach((d) => {
        if (!d || !d.id || byId.has(d.id))
            return;
        byId.set(d.id, d);
    });
    const byIdentity = new Map();
    byId.forEach((d) => {
        const key = duplicateIdentity(d);
        const existing = byIdentity.get(key);
        if (!existing) {
            byIdentity.set(key, d);
            return;
        }
        // Prefer the explicitly ordered (lower order) definition; tie → keep the
        // first seen so the earliest definition wins.
        const orderD = d.order ?? Number.MAX_SAFE_INTEGER;
        const orderE = existing.order ?? Number.MAX_SAFE_INTEGER;
        if (orderD < orderE)
            byIdentity.set(key, d);
    });
    // Preserve original relative order of the surviving definitions.
    const survivors = new Set(byIdentity.values());
    return definitions.filter((d) => survivors.has(d));
};
/** Read the persisted custom-field snapshot, or null when absent/unreadable. */
export const readCustomFieldSnapshot = () => {
    try {
        const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
        if (!raw)
            return null;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object')
            return null;
        return parsed;
    }
    catch {
        return null;
    }
};
/** Serialize the current definitions + per-issue values into a JSON string. */
export const serializeCustomFieldSnapshot = (definitions, tasks) => {
    const taskValues = {};
    tasks.forEach((task) => {
        if (task.customFieldValues && Object.keys(task.customFieldValues).length > 0) {
            taskValues[task.id] = task.customFieldValues;
        }
    });
    return JSON.stringify({ definitions, taskValues });
};
/** Write the snapshot; silently no-ops when storage is unavailable. */
const writeSnapshot = (serialized) => {
    try {
        globalThis.localStorage?.setItem(STORAGE_KEY, serialized);
    }
    catch {
        /* quota exceeded / storage unavailable — demo data stays in-memory */
    }
};
let lastSerialized = null;
/**
 * Store hook: serialize definitions + per-issue values and write to
 * localStorage, deduplicated so unchanged state never hits storage.
 */
export const persistCustomFieldSnapshot = (definitions, tasks) => {
    try {
        const next = serializeCustomFieldSnapshot(definitions, tasks);
        if (next === lastSerialized)
            return;
        lastSerialized = next;
        writeSnapshot(next);
    }
    catch {
        /* serialization failure — ignore */
    }
};
/**
 * Hydrate state with a persisted snapshot: saved definitions replace the
 * (now empty) seed list — an empty array is a valid "all fields deleted"
 * state — and saved per-issue values are layered over the base tasks.
 * Snapshots written before the seed cleanup are migrated here: legacy
 * auto-seeded definitions and unwanted fields accidentally created via the
 * old Details-page Add Field flow (duplicate Client Name / dept entries) are
 * dropped — along with their stored values — so they never appear again.
 */
export const applyCustomFieldSnapshot = (seedDefinitions, seedTasks, snapshot) => {
    if (!snapshot)
        return { definitions: seedDefinitions, tasks: seedTasks };
    const rawDefinitions = Array.isArray(snapshot.definitions)
        ? snapshot.definitions
        : seedDefinitions;
    const isPurged = (d) => isLegacySeedCustomFieldId(d.id) || isUnwantedCustomFieldName(d.label ?? d.name);
    const droppedIds = new Set(rawDefinitions.filter(isPurged).map((d) => d.id));
    // Purge unwanted names + legacy seeds, then collapse any duplicates (same id
    // or same project + normalized name + type set) so a stale snapshot can never
    // re-introduce a doubled "Client name" or "dept" definition.
    const definitions = dedupeCustomFieldDefinitions(rawDefinitions.filter((d) => !droppedIds.has(d.id)));
    const taskValues = snapshot.taskValues ?? {};
    const cleanedTaskValues = {};
    Object.entries(taskValues).forEach(([taskId, values]) => {
        const cleaned = Object.fromEntries(Object.entries(values).filter(([fieldId]) => !isLegacySeedCustomFieldId(fieldId) && !droppedIds.has(fieldId)));
        if (Object.keys(cleaned).length > 0)
            cleanedTaskValues[taskId] = cleaned;
    });
    const hasValues = Object.keys(cleanedTaskValues).length > 0;
    const tasks = hasValues
        ? seedTasks.map((task) => cleanedTaskValues[task.id]
            ? {
                ...task,
                customFieldValues: { ...(task.customFieldValues ?? {}), ...cleanedTaskValues[task.id] },
            }
            : task)
        : seedTasks;
    return { definitions, tasks };
};
