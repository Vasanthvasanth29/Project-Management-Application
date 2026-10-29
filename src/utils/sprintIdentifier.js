// One-based sprint numbering per PI: <Project Key><PI>.<Iteration Number>, e.g. ECOMM4.1.
// New iterations carry their PI-scoped number explicitly (Sprint.iterationNumber, e.g.
// "30.4" = PI 30, iteration 4) and that stored value wins. Sprints without one fall
// back to the legacy behaviour: PI parsed from the name, sequence computed chronologically.
export const buildSprintIdentifiers = (sprints, projectKey) => {
    const map = {};
    const legacy = [];
    sprints.forEach((s) => {
        const stored = (s.iterationNumber || '').match(/^(\d+)(?:\.(\d+))?/);
        if (stored) {
            const pi = Number(stored[1]);
            const seq = stored[2] ? Number(stored[2]) : 1;
            map[s.id] = `${projectKey}${pi}.${seq}`;
        }
        else {
            legacy.push(s);
        }
    });
    const byPi = {};
    legacy.forEach((s) => {
        const piMatch = s.name.match(/\d+/);
        const pi = piMatch ? Number(piMatch[0]) : 1;
        if (!byPi[pi])
            byPi[pi] = [];
        byPi[pi].push(s);
    });
    Object.keys(byPi)
        .map(Number)
        .forEach((pi) => {
        [...byPi[pi]]
            .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime() ||
            a.id.localeCompare(b.id))
            .forEach((s, index) => {
            map[s.id] = `${projectKey}${pi}.${index + 1}`;
        });
    });
    return map;
};
// Corrected sprint identifier — one-based, never ".0"
export const formatSprintIdentifier = (sprint, projectKey, identifiers) => identifiers?.[sprint.id] ||
    `${projectKey}${sprint.name.match(/\d+/)?.[0] || '1'}.1`;
// "15 SEP - 28 SEP" style sprint date range.
export const formatSprintDateRange = (sprint) => {
    const fmt = (iso, fallback) => iso
        ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: '2-digit' }).toUpperCase()
        : fallback;
    return `${fmt(sprint.startDate, '15 SEP')} - ${fmt(sprint.endDate, '28 SEP')}`;
};
// Full sprint title: "ECOMM4.1 [15 SEP - 28 SEP]".
export const formatSprintFullTitle = (sprint, projectKey, identifiers) => `${formatSprintIdentifier(sprint, projectKey, identifiers)} [${formatSprintDateRange(sprint)}]`;
// PI-grouped iteration label: "30.4 [15 SEP - 28 SEP]" — the stored PI-based
// number without the project-key prefix, used inside PI group headers. Falls
// back to the full legacy title when a sprint has no stored number.
export const formatSprintPiTitle = (sprint, projectKey, identifiers) => sprint.iterationNumber
    ? `${sprint.iterationNumber} [${formatSprintDateRange(sprint)}]`
    : formatSprintFullTitle(sprint, projectKey, identifiers);
