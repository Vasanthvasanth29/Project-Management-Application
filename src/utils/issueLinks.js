/** Dropdown options — labels are shown verbatim, in this exact order. */
export const ISSUE_LINK_TYPE_OPTIONS = [
    { value: 'BLOCKS', label: 'blocks' },
    { value: 'BLOCKED_BY', label: 'is blocked by' },
    { value: 'CLONES', label: 'clones' },
    { value: 'CLONED_BY', label: 'is cloned by' },
    { value: 'SPLIT_TO', label: 'split to' },
    { value: 'SPLIT_FROM', label: 'split from' },
    { value: 'MITIGATES', label: 'Mitigates' },
    { value: 'MITIGATED_BY', label: 'is mitigated by' },
    { value: 'RELATES_TO', label: 'relates to' },
    { value: 'RELATES_FROM', label: 'relates from' },
    { value: 'MENTIONED', label: 'mentioned' },
    { value: 'MENTIONED_IN', label: 'mentioned in' },
];
export const ISSUE_LINK_LABEL = ISSUE_LINK_TYPE_OPTIONS.reduce((acc, option) => {
    acc[option.value] = option.label;
    return acc;
}, {});
/** Deterministic inverse of every relationship (symmetric ones map to themselves). */
export const ISSUE_LINK_INVERSE = {
    BLOCKS: 'BLOCKED_BY',
    BLOCKED_BY: 'BLOCKS',
    CLONES: 'CLONED_BY',
    CLONED_BY: 'CLONES',
    SPLIT_TO: 'SPLIT_FROM',
    SPLIT_FROM: 'SPLIT_TO',
    MITIGATES: 'MITIGATED_BY',
    MITIGATED_BY: 'MITIGATES',
    RELATES_TO: 'RELATES_TO',
    RELATES_FROM: 'RELATES_FROM',
    MENTIONED: 'MENTIONED_IN',
    MENTIONED_IN: 'MENTIONED',
};
/** Group-heading dot colours, keyed by the displayed label. */
export const ISSUE_LINK_DOT_COLOR = {
    blocks: 'bg-amber-500',
    'is blocked by': 'bg-red-500',
    clones: 'bg-violet-500',
    'is cloned by': 'bg-fuchsia-500',
    'split to': 'bg-sky-500',
    'split from': 'bg-indigo-500',
    Mitigates: 'bg-emerald-500',
    'is mitigated by': 'bg-lime-500',
    'relates to': 'bg-teal-500',
    'relates from': 'bg-teal-500',
    mentioned: 'bg-purple-500',
    'mentioned in': 'bg-blue-500',
};
/**
 * The relationship type as seen from `viewerTaskId`: unchanged for the task
 * that created the link, inverted for the other side
 * (`A blocks B` → B sees `is blocked by A`).
 */
export const perspectiveLinkType = (recordType, recordTaskId, viewerTaskId) => (recordTaskId === viewerTaskId ? recordType : ISSUE_LINK_INVERSE[recordType]);
/** Display label for a stored dependency seen from `viewerTaskId`. */
export const perspectiveLinkLabel = (recordType, recordTaskId, viewerTaskId) => ISSUE_LINK_LABEL[perspectiveLinkType(recordType, recordTaskId, viewerTaskId)];
/** True when `a → b (type)` already exists as a record in either direction. */
export const isDuplicateLink = (dependencies, aTaskId, bTaskId, type) => dependencies.some((d) => (d.taskId === aTaskId && d.dependsOnTaskId === bTaskId && d.type === type) ||
    (d.taskId === bTaskId && d.dependsOnTaskId === aTaskId && d.type === ISSUE_LINK_INVERSE[type]));
/** Plain-text version of rich HTML, for the Activity/History event line. */
export const plainTextFromHtml = (html) => html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
