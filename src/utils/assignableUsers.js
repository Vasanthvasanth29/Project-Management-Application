/**
 * Users assignable to a project's work items: members of every team the
 * project includes, plus the project manager.
 *
 * Single source shared by the Work Item Details page (mentions, transition
 * dialog) and the People panel's assignee picker, so every assignee surface
 * always offers exactly the same people.
 */
export const getAssignableUsers = (users, teams, project) => {
    if (!project)
        return [];
    const projectTeamIds = new Set(teams.filter((t) => project.teamIds.includes(t.id)).flatMap((t) => t.memberIds));
    return users.filter((u) => projectTeamIds.has(u.id) || u.id === project.projectManagerId);
};
