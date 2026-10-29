/** All PIs for a project, ascending by number (PI 29, PI 30, PI 31 …). */
export const sortProjectPis = (pis, projectId) => pis.filter((p) => p.projectId === projectId).sort((a, b) => a.number - b.number);
/**
 * The PI number an iteration belongs to. Uses the stored relationship first
 * (iteration.piId → PI.id) and falls back to the PI-scoped number/name so
 * unmigrated or synthetic rows still resolve instead of crashing.
 */
export const piNumberForSprint = (sprint, pis) => {
    const pi = pis.find((p) => p.id === sprint.piId);
    if (pi)
        return pi.number;
    const source = sprint.iterationNumber || sprint.name;
    const match = source.match(/\d+/);
    return match ? Number(match[0]) : undefined;
};
/**
 * Next iteration number under a PI — always scoped to that PI, never a global
 * counter: PI 30 with 30.1–30.3 → "30.4"; PI 30 with none → "30.1";
 * PI 31 with 31.1–31.2 → "31.3".
 *
 * The sequence is max + 1 over EVERY iteration of the PI (archived included),
 * so a number is never reused, and it follows creation order — creating a
 * later-dated iteration first does not renumber anything. Returns '' when the
 * PI has no valid number, so callers never produce "undefined.1".
 */
export const nextIterationNumber = (pi, sprints) => {
    if (!pi || !Number.isInteger(pi.number))
        return '';
    const existing = sprints.filter((s) => s.piId === pi.id);
    const maxSeq = existing.reduce((max, s) => {
        const seq = Number((s.iterationNumber || '').split('.')[1]);
        return Number.isFinite(seq) && seq > max ? seq : max;
    }, 0);
    return `${pi.number}.${maxSeq + 1}`;
};
/** True when `iterationNumber` already exists under the given PI (uniqueness per PI). */
export const iterationNumberExists = (sprints, piId, iterationNumber, excludeSprintId) => sprints.some((s) => s.piId === piId &&
    s.id !== excludeSprintId &&
    (s.iterationNumber || '').trim() === iterationNumber.trim());
/**
 * Group iterations under their parent PI for display (Project → PI → Iteration).
 * Preserves the caller's sprint order inside each group; group order follows
 * first appearance in the input (so callers keep their status/date ranking),
 * then PIs without iterations are appended ascending so empty PIs stay
 * reachable for "+ Add Iteration".
 */
export const groupSprintsByPi = (sprints, pis, projectId) => {
    const groups = new Map();
    const order = [];
    const ensureGroup = (key, pi, number) => {
        let group = groups.get(key);
        if (!group) {
            group = {
                key,
                piId: pi?.id,
                number,
                label: number !== undefined ? `PI ${number}` : 'Unassigned',
                sprints: [],
            };
            groups.set(key, group);
            order.push(key);
        }
        return group;
    };
    sprints.forEach((sprint) => {
        const pi = pis.find((p) => p.id === sprint.piId);
        const number = pi ? pi.number : piNumberForSprint(sprint, pis);
        const key = pi ? pi.id : `derived-${sprint.projectId}-${number ?? 'x'}`;
        ensureGroup(key, pi, number).sprints.push(sprint);
    });
    if (projectId) {
        sortProjectPis(pis, projectId).forEach((pi) => {
            if (!groups.has(pi.id))
                ensureGroup(pi.id, pi, pi.number);
        });
    }
    return order.map((key) => groups.get(key));
};
// ---------------------------------------------------------------------------
// PI creation + iteration generation
// ---------------------------------------------------------------------------
/** ISO date arithmetic in local time (never shifts across time zones). */
export const addIsoDays = (iso, days) => {
    const [y, m, d] = (iso || '').split('-').map(Number);
    if (!y || !m || !d)
        return iso;
    const date = new Date(y, m - 1, d + days);
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};
/** Inclusive day count of an ISO range: 2024-07-01 → 2024-07-14 = 14. */
export const isoDayLength = (startIso, endIso) => {
    const [ys, ms, ds] = startIso.split('-').map(Number);
    const [ye, me, de] = endIso.split('-').map(Number);
    return Math.round((Date.UTC(ye, me - 1, de) - Date.UTC(ys, ms - 1, ds)) / 86400000) + 1;
};
/** `FILL` = as many iterations as the PI dates allow; `COUNT` = a fixed number. */
export const PI_GENERATION_MODES = { FILL: 'FILL', COUNT: 'COUNT' };
/**
 * Sequential iteration plan for a PI. Iterations start on the PI start date and
 * run back-to-back for `durationDays` each (inclusive, matching the seed cadence
 * 07-01 → 07-14 for 14 days). Nothing is ever scheduled past the PI end date:
 * when the last period does not fit, it becomes a SHORTER final iteration that
 * ends exactly on the PI end date (flagged `isPartial`).
 *
 * COUNT mode stops after `count` iterations; when they cannot all start within
 * the PI, `fitsCount` is false and only the ones that fit are returned.
 */
export const generatePiIterations = ({ piNumber, startDate, endDate, durationDays, mode = PI_GENERATION_MODES.FILL, count, }) => {
    const iterations = [];
    if (!startDate || !endDate || startDate > endDate || !Number.isInteger(durationDays) || durationDays < 1) {
        return { iterations, fitsCount: false };
    }
    const limit = mode === PI_GENERATION_MODES.COUNT ? count : Number.MAX_SAFE_INTEGER;
    let start = startDate;
    while (start <= endDate && iterations.length < limit) {
        const fullEnd = addIsoDays(start, durationDays - 1);
        const isPartial = fullEnd > endDate;
        const end = isPartial ? endDate : fullEnd;
        const seq = iterations.length + 1;
        iterations.push({
            seq,
            iterationNumber: `${piNumber}.${seq}`,
            startDate: start,
            endDate: end,
            days: isoDayLength(start, end),
            isPartial,
        });
        start = addIsoDays(end, 1);
    }
    return {
        iterations,
        fitsCount: mode !== PI_GENERATION_MODES.COUNT || iterations.length === count,
    };
};
const rangesOverlap = (aStart, aEnd, bStart, bEnd) => aStart <= bEnd && aEnd >= bStart;
/**
 * Validates a Create PI draft and returns `{ errors, iterations }`. `errors` is
 * keyed by form field; an empty object means the draft can be created.
 * `projectPis` / `projectSprints` are the project's existing records — used for
 * the per-project PI number uniqueness rule and the no-overlap rule that
 * `createSprint` already enforces for every iteration in a project.
 */
export const validatePiDraft = ({ number, goal, startDate, endDate, durationDays, mode, count, projectPis, projectSprints, }) => {
    const errors = {};
    const piNumber = Number(number);
    if (!String(number ?? '').trim() || !Number.isInteger(piNumber) || piNumber < 1) {
        errors.number = 'PI number must be a positive whole number (e.g. 30).';
    }
    else if (projectPis.some((p) => p.number === piNumber)) {
        errors.number = `PI ${piNumber} already exists for this project.`;
    }
    if (!(goal || '').trim())
        errors.goal = 'A PI goal / objective is required.';
    if (!startDate)
        errors.startDate = 'Start date is required.';
    if (!endDate)
        errors.endDate = 'End date is required.';
    if (startDate && endDate && endDate <= startDate) {
        errors.endDate = 'End date must be after the start date.';
    }
    if (!Number.isInteger(durationDays) || durationDays < 1) {
        errors.duration = 'Iteration duration must be at least 1 day.';
    }
    else if (durationDays > 365) {
        errors.duration = 'Iteration duration must be 365 days or fewer.';
    }
    if (mode === PI_GENERATION_MODES.COUNT && (!Number.isInteger(count) || count < 1)) {
        errors.count = 'Number of iterations must be a positive whole number.';
    }
    if (Object.keys(errors).some((k) => k !== 'number' && k !== 'goal')) {
        return { errors, iterations: [] };
    }
    const { iterations, fitsCount } = generatePiIterations({
        piNumber: Number.isInteger(piNumber) && piNumber > 0 ? piNumber : '?',
        startDate,
        endDate,
        durationDays,
        mode,
        count,
    });
    if (!fitsCount) {
        errors.count = `Only ${iterations.length} iteration${iterations.length === 1 ? '' : 's'} of ${durationDays} days fit between the PI start and end dates.`;
    }
    const clash = iterations.find((it) => projectSprints.some((s) => rangesOverlap(it.startDate, it.endDate, s.startDate, s.endDate)));
    if (clash) {
        const other = projectSprints.find((s) => rangesOverlap(clash.startDate, clash.endDate, s.startDate, s.endDate));
        errors.dates = `Iteration ${clash.iterationNumber} (${clash.startDate} → ${clash.endDate}) overlaps existing iteration ${other.iterationNumber || other.name} (${other.startDate} → ${other.endDate}). Choose PI dates that do not overlap existing iterations.`;
    }
    return { errors, iterations };
};
// ---------------------------------------------------------------------------
// PI status, Create PI and Create Iteration rules
// ---------------------------------------------------------------------------
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
/** True for a real calendar date in YYYY-MM-DD form (rejects 2030-02-31). */
export const isIsoDate = (value) => {
    if (typeof value !== 'string' || !ISO_DATE.test(value))
        return false;
    const [y, m, d] = value.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
};
/** "07 Jan 2030" — formatted from the ISO parts, never through a timezone. */
export const formatIsoDay = (iso) => {
    if (!isIsoDate(iso))
        return '—';
    const [y, m, d] = iso.split('-').map(Number);
    return `${String(d).padStart(2, '0')} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1]} ${y}`;
};
/**
 * A PI's status, derived from its own (non-archived) iterations — the same
 * rule the PI plan uses: any ACTIVE iteration → ACTIVE, else any PLANNED →
 * PLANNED, else (all completed) → COMPLETED. A PI with no iterations yet is
 * PLANNED. Nothing is ever completed from the calendar date alone.
 */
export const piStatusOf = (pi, sprints) => {
    const own = sprints.filter((s) => s.piId === pi?.id && !s.isArchived);
    if (own.length === 0)
        return 'PLANNED';
    if (own.some((s) => s.status === 'ACTIVE'))
        return 'ACTIVE';
    if (own.some((s) => s.status === 'PLANNED'))
        return 'PLANNED';
    return 'COMPLETED';
};
/** New iterations may only be created inside ACTIVE or PLANNED PIs. */
export const canCreateIterationInPi = (pi, sprints) => !!pi && piStatusOf(pi, sprints) !== 'COMPLETED';
/**
 * Validates a Create PI draft (number, optional name/description, dates).
 * End may equal start (inclusive single-day range), matching the iteration
 * form's "end must not be before start" convention. Returns field errors.
 */
export const validatePiForm = ({ number, startDate, endDate, projectPis }) => {
    const errors = {};
    const piNumber = Number(number);
    if (!String(number ?? '').trim() || !Number.isInteger(piNumber) || piNumber < 1) {
        errors.number = 'PI number must be a positive whole number (e.g. 30).';
    }
    else if (projectPis.some((p) => p.number === piNumber)) {
        errors.number = `PI ${piNumber} already exists for this project.`;
    }
    if (!startDate)
        errors.startDate = 'Start date is required.';
    else if (!isIsoDate(startDate))
        errors.startDate = 'Enter a valid start date.';
    if (!endDate)
        errors.endDate = 'End date is required.';
    else if (!isIsoDate(endDate))
        errors.endDate = 'Enter a valid end date.';
    if (!errors.startDate && !errors.endDate && endDate < startDate) {
        errors.endDate = 'End date must be on or after the start date.';
    }
    return errors;
};
/**
 * Validates a Create Iteration draft for one PI. Dates are compared as ISO
 * strings (YYYY-MM-DD), which is timezone-free. Ranges are INCLUSIVE, the
 * convention the existing iterations follow (07-01 → 07-14, next starts
 * 07-15), so two iterations of the same PI may not share a day. Gaps are fine.
 *
 * Checks: PI exists and is not COMPLETED; number present, unique in the PI and
 * prefixed by the PI number; dates required/valid; end ≥ start; inside the
 * PI's stored date range (PIs created before PI dates existed have none, so
 * that check is skipped for them); no overlap with any non-archived iteration
 * of the SAME PI — iterations of other PIs are never considered.
 */
export const validateIterationDraft = ({ pi, sprints, iterationNumber, startDate, endDate, excludeSprintId }) => {
    const errors = {};
    if (!pi) {
        errors.piId = 'Select a parent PI — every iteration belongs to a PI.';
        return errors;
    }
    if (!canCreateIterationInPi(pi, sprints)) {
        errors.piId = `${pi.name} is completed — new iterations can only be added to active or planned PIs.`;
    }
    const number = String(iterationNumber ?? '').trim();
    if (!number) {
        errors.iterationNumber = 'Iteration number is required.';
    }
    else if (/undefined|null|NaN/.test(number) ||
        !number.startsWith(`${pi.number}.`) ||
        !/^\d+$/.test(number.slice(String(pi.number).length + 1))) {
        errors.iterationNumber = `Use the ${pi.name} numbering — ${pi.number}.1, ${pi.number}.2 …`;
    }
    else if (iterationNumberExists(sprints, pi.id, number, excludeSprintId)) {
        errors.iterationNumber = `${number} already exists under ${pi.name} — numbers must be unique per PI.`;
    }
    if (!startDate)
        errors.startDate = 'Start date is required.';
    else if (!isIsoDate(startDate))
        errors.startDate = 'Enter a valid start date.';
    if (!endDate)
        errors.endDate = 'End date is required.';
    else if (!isIsoDate(endDate))
        errors.endDate = 'Enter a valid end date.';
    if (errors.startDate || errors.endDate)
        return errors;
    if (endDate < startDate) {
        errors.endDate = 'End date must not be before the start date.';
        return errors;
    }
    if (isIsoDate(pi.startDate) && isIsoDate(pi.endDate) && (startDate < pi.startDate || endDate > pi.endDate)) {
        errors.dates = `Dates must fall within ${pi.name} (${formatIsoDay(pi.startDate)} – ${formatIsoDay(pi.endDate)}).`;
        return errors;
    }
    const clash = sprints.find((s) => s.piId === pi.id &&
        s.id !== excludeSprintId &&
        !s.isArchived &&
        s.startDate && s.endDate &&
        startDate <= s.endDate && endDate >= s.startDate);
    if (clash) {
        errors.dates = `Overlaps ${clash.iterationNumber || clash.name} (${formatIsoDay(clash.startDate)} – ${formatIsoDay(clash.endDate)}). Iterations in the same PI cannot share any day.`;
    }
    return errors;
};
// ---------------------------------------------------------------------------
// Batch iteration creation (count-driven)
// ---------------------------------------------------------------------------
/** Numeric sequence of "4.10" → 10 (never lexicographic); NaN when absent. */
export const iterationSeqOf = (iterationNumber) => {
    const parts = String(iterationNumber ?? '').trim().split('.');
    return parts.length === 2 && /^\d+$/.test(parts[1]) ? Number(parts[1]) : NaN;
};
/** Orders "4.2" < "4.9" < "4.10" by PI number, then numeric sequence. */
export const compareIterationNumbers = (a, b) => {
    const [pa, pb] = [Number(String(a).split('.')[0]), Number(String(b).split('.')[0])];
    if (pa !== pb)
        return pa - pb;
    return (iterationSeqOf(a) || 0) - (iterationSeqOf(b) || 0);
};
/**
 * `count` consecutive numbers continuing from the PI's highest existing
 * sequence: PI 4 with 4.1–4.7 and count 3 → ["4.8", "4.9", "4.10"].
 * Empty array when the PI has no valid number (never "undefined.1").
 */
export const allocateIterationNumbers = (pi, sprints, count) => {
    const first = nextIterationNumber(pi, sprints);
    if (!first || !Number.isInteger(count) || count < 1)
        return [];
    const start = iterationSeqOf(first);
    return Array.from({ length: count }, (_, i) => `${pi.number}.${start + i}`);
};
/** Largest batch the Create Iteration form accepts in one go. */
export const MAX_ITERATION_BATCH = 20;
/**
 * Validates a batch of new iterations for ONE PI as a whole. Every entry is
 * checked with the single-iteration rules (required dates, end ≥ start, inside
 * the PI's range, unique PI-scoped number, inclusive no-overlap) against the
 * PI's saved iterations AND every other entry of the batch. Returns
 * `{ formError, entryErrors }`; the batch is valid only when formError is
 * empty and every entryErrors[i] is {}.
 */
export const validateIterationBatch = ({ pi, sprints, entries }) => {
    if (!pi)
        return { formError: 'Select a parent PI — every iteration belongs to a PI.', entryErrors: entries.map(() => ({})) };
    // PI status comes from SAVED iterations only — batch entries never change it.
    if (!canCreateIterationInPi(pi, sprints)) {
        return { formError: `${pi.name} is completed — new iterations can only be added to active or planned PIs.`, entryErrors: entries.map(() => ({})) };
    }
    if (entries.length < 1 || entries.length > MAX_ITERATION_BATCH) {
        return { formError: `Create between 1 and ${MAX_ITERATION_BATCH} iterations at a time.`, entryErrors: entries.map(() => ({})) };
    }
    const asSprint = (e, i) => ({
        id: `__batch-${i}`,
        piId: pi.id,
        iterationNumber: String(e.iterationNumber ?? '').trim(),
        name: e.iterationNumber,
        status: 'PLANNED',
        startDate: e.startDate,
        endDate: e.endDate,
    });
    const entryErrors = entries.map((entry, i) => {
        const others = entries
            .map((e, j) => (j === i || !isIsoDate(e.startDate) || !isIsoDate(e.endDate) || e.endDate < e.startDate ? null : asSprint(e, j)))
            .filter(Boolean);
        // Number uniqueness inside the batch is checked against every other
        // entry, even ones whose dates are still incomplete.
        const numberPeers = entries.map((e, j) => (j === i ? null : asSprint(e, j))).filter(Boolean);
        const errors = validateIterationDraft({
            pi,
            sprints: [...sprints, ...others],
            iterationNumber: entry.iterationNumber,
            startDate: entry.startDate,
            endDate: entry.endDate,
        });
        delete errors.piId;
        // A number repeated INSIDE the batch (and not already saved) gets the
        // batch-specific message; a clash with a saved iteration keeps
        // "already exists".
        const number = String(entry.iterationNumber ?? '').trim();
        const savedClash = iterationNumberExists(sprints, pi.id, number);
        if (number && !savedClash && numberPeers.some((p) => p.iterationNumber === number) &&
            (!errors.iterationNumber || /already exists/.test(errors.iterationNumber))) {
            errors.iterationNumber = `${number} is used twice in this batch.`;
        }
        if (!String(entry.goal ?? '').trim())
            errors.goal = 'Goal is required.';
        if (entry.status && entry.status !== 'PLANNED' && entry.status !== 'ACTIVE') {
            errors.status = 'Initial status must be Planned or Active.';
        }
        return errors;
    });
    return { formError: '', entryErrors };
};
/** True when a batch validation result has no errors at all. */
export const isBatchValid = ({ formError, entryErrors }) => !formError && entryErrors.every((e) => Object.keys(e).length === 0);
/**
 * Next PI number for a project: one above the highest existing PI number
 * (PI 1–6 → 7; with PI 7 present → 8). Never restarts at 1 while PIs exist;
 * non-integer / missing numbers are ignored so the result is never NaN.
 */
export const nextPiNumber = (projectPis) => projectPis.reduce((max, p) => (Number.isInteger(p.number) && p.number > max ? p.number : max), 0) + 1;
