export const BOARD_COLUMNS = ['TODO', 'IN_PROGRESS', 'DONE'];
export const columnLabel = {
    TODO: 'To Do',
    IN_PROGRESS: 'In Progress',
    DONE: 'Done',
};
// Any status outside TODO/DONE (IN_REVIEW, TESTING, BUG_FIX, RETEST, BLOCKED…)
// belongs to the middle column. Cancelled is a terminal outcome: it sits in the
// DONE column rendered with the grey Cancelled chip (it never counts as done).
export const columnOfStatus = (status) => {
    if (status === 'DONE' || status === 'CANCELLED')
        return 'DONE';
    if (status === 'TODO')
        return 'TODO';
    return 'IN_PROGRESS';
};
export const statusForColumn = (column) => column;
// Directional matrix: TO DO -> IN PROGRESS only; IN PROGRESS -> TO DO or DONE;
// DONE -> IN PROGRESS only. Same-column drops are reorders, never transitions.
const VALID_TRANSITIONS = {
    TODO: ['IN_PROGRESS'],
    IN_PROGRESS: ['TODO', 'DONE'],
    DONE: ['IN_PROGRESS'],
};
export const canTransition = (from, to) => from !== to && VALID_TRANSITIONS[from].includes(to);
// A column accepts the dragged card when it is the same column (reorder) or the
// matrix allows the move. Invalid pairs must NOT be preventDefault-ed during
// dragover so the browser refuses the drop entirely.
export const isValidDropTarget = (from, to) => from === to || canTransition(from, to);
// Transitions that require an (optional) comment step before the status changes:
// starting work, sending work back, and finishing work. Returning a finished card
// to IN PROGRESS applies immediately.
const COMMENT_REQUIRED = [
    ['TODO', 'IN_PROGRESS'],
    ['IN_PROGRESS', 'TODO'],
    ['IN_PROGRESS', 'DONE'],
];
export const needsComment = (from, to) => COMMENT_REQUIRED.some(([f, t]) => f === from && t === to);
