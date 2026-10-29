/**
 * localStorage bridge for USER-CREATED Program Increments and their iterations.
 *
 * FRONTEND PROTOTYPE ONLY — there is no PI/Sprint backend model or API yet, so
 * this storage is per-browser and is not shared with other users.
 *
 * The app store is re-seeded from mock data on every page load. Only PIs that
 * are not part of the seed (created through Create PI) are stored, together
 * with every iteration whose `piId` points at one of them, plus iterations the
 * user added to a seed PI — so their current state (status changes, Team
 * Leader, members …) is kept as well. Seed PIs and seed iterations are never
 * written, so seed updates are never shadowed.
 *
 * Records for unknown projects, or whose id / PI number would collide with a
 * seed record, are pruned on load so they can never attach to the wrong data.
 */
export const PROGRAM_INCREMENT_STORAGE_KEY = 'flowexec_program_increments_v1';
const EMPTY = { pis: [], sprints: [] };
export const readProgramIncrementSnapshot = () => {
    try {
        const storage = globalThis.localStorage;
        if (!storage)
            return EMPTY;
        const raw = storage.getItem(PROGRAM_INCREMENT_STORAGE_KEY);
        if (!raw)
            return EMPTY;
        const parsed = JSON.parse(raw);
        if (!parsed || !Array.isArray(parsed.pis) || !Array.isArray(parsed.sprints))
            return EMPTY;
        return parsed;
    }
    catch {
        return EMPTY;
    }
};
let lastSerialized = null;
const writeSnapshot = (snapshot) => {
    const serialized = JSON.stringify(snapshot);
    if (serialized === lastSerialized)
        return;
    lastSerialized = serialized;
    try {
        const storage = globalThis.localStorage;
        if (!storage)
            return;
        if (snapshot.pis.length === 0)
            storage.removeItem(PROGRAM_INCREMENT_STORAGE_KEY);
        else
            storage.setItem(PROGRAM_INCREMENT_STORAGE_KEY, serialized);
    }
    catch {
        /* storage unavailable — created PIs live for this session only */
    }
};
/**
 * Merges the persisted snapshot onto the seed PIs / iterations. Returns the
 * arrays the store should start with.
 */
export const applyProgramIncrementSnapshot = (seedPis, seedSprints, seedProjects, snapshot = readProgramIncrementSnapshot()) => {
    const projectIds = new Set(seedProjects.map((p) => p.id));
    const seedPiIds = new Set(seedPis.map((p) => p.id));
    const seedSprintIds = new Set(seedSprints.map((s) => s.id));
    const pis = snapshot.pis.filter((pi) => pi &&
        projectIds.has(pi.projectId) &&
        !seedPiIds.has(pi.id) &&
        !seedPis.some((s) => s.projectId === pi.projectId && s.number === pi.number));
    // Iterations may belong to a user-created PI or to a seed PI (iterations
    // added to an existing PI); either way the PI must exist for a known project.
    const piIds = new Set([
        ...pis.map((p) => p.id),
        ...seedPis.filter((p) => projectIds.has(p.projectId)).map((p) => p.id),
    ]);
    const sprints = snapshot.sprints.filter((s) => s && piIds.has(s.piId) && !seedSprintIds.has(s.id));
    return {
        pis: pis.length ? [...seedPis, ...pis] : seedPis,
        sprints: sprints.length ? [...seedSprints, ...sprints] : seedSprints,
    };
};
/**
 * Stores the user-created PIs (ids not in `seedPiIds`), every iteration of
 * those PIs, and every user-created iteration (id not in `seedSprintIds`) of a
 * seed PI. Seed iterations of seed PIs are never written.
 * Deduplicated, so unchanged state never touches localStorage.
 */
export const persistProgramIncrements = (pis, sprints, seedPiIds, seedSprintIds = new Set()) => {
    const createdPis = pis.filter((p) => !seedPiIds.has(p.id));
    const createdIds = new Set(createdPis.map((p) => p.id));
    writeSnapshot({
        pis: createdPis,
        sprints: sprints.filter((s) => createdIds.has(s.piId) || (seedPiIds.has(s.piId) && !seedSprintIds.has(s.id))),
    });
};
/** Test hook: forget the dedupe cache. */
export const resetProgramIncrementPersistenceCache = () => {
    lastSerialized = null;
};
