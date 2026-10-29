/**
 * Persistence for per-project standard-field configuration (Project.fieldConfig).
 * The app is frontend-first: projects rehydrate from seed on every load, so the
 * standard-field config each Admin saved for a project is stored separately in
 * localStorage and replayed onto the seeded projects at startup — the same
 * pattern already used for project identity overrides and custom-field
 * snapshots. Keyed by immutable project id, so each project's configuration is
 * fully isolated from every other project.
 */
const STORAGE_KEY = 'flowexec-project-field-config-v1';
let lastSerialized = '';
export const readProjectFieldConfigs = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw)
            return {};
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
            return {};
        const out = {};
        Object.entries(parsed).forEach(([projectId, config]) => {
            if (config && typeof config === 'object' && !Array.isArray(config)) {
                out[projectId] = config;
            }
        });
        return out;
    }
    catch {
        return {};
    }
};
/** Replay saved standard-field configs onto the seeded projects (by id). */
export const applyProjectFieldConfigs = (projects, configs = readProjectFieldConfigs()) => projects.map((project) => {
    const config = configs[project.id];
    return config ? { ...project, fieldConfig: config } : project;
});
/**
 * Persist the standard-field config of every project. Deduplicated against the
 * last serialized payload so unchanged state never touches localStorage.
 */
export const persistProjectFieldConfigs = (projects) => {
    try {
        const map = {};
        projects.forEach((project) => {
            if (project.fieldConfig && Object.keys(project.fieldConfig.standardFields ?? {}).length > 0) {
                map[project.id] = project.fieldConfig;
            }
        });
        const serialized = JSON.stringify(map);
        if (serialized === lastSerialized)
            return;
        lastSerialized = serialized;
        localStorage.setItem(STORAGE_KEY, serialized);
    }
    catch {
        // Storage unavailable/quota — non-fatal for a frontend-first app.
    }
};
/** Seed the dedupe cache from the current storage so the first subscribe after
 *  load doesn't immediately rewrite an identical payload. */
export const primeProjectFieldConfigCache = () => {
    try {
        lastSerialized = localStorage.getItem(STORAGE_KEY) ?? '';
    }
    catch {
        lastSerialized = '';
    }
};
