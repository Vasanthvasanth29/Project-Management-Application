import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '../store/appStore';
import { readPersistedIssueLinks, persistTaskDependency } from './issueLinkPersistence';

describe('Issue Link Persistence across refresh', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists a link to localStorage and rehydrates it after store reset', () => {
    const store = useAppStore.getState();
    const task1 = store.tasks[0];
    const task2 = store.tasks[1];
    expect(task1).toBeDefined();
    expect(task2).toBeDefined();

    // Add link
    const added = store.addTaskDependency(task1.id, task2.id, 'BLOCKS', 'Test comment');
    expect(added).toBe(true);

    // Verify localStorage has it
    const persisted = readPersistedIssueLinks();
    expect(persisted.length).toBeGreaterThan(0);
    expect(persisted.some((p) => p.fromTitle === task1.title && p.toTitle === task2.title)).toBe(true);

    // Simulate page refresh: reset taskDependencies to empty
    useAppStore.setState({ taskDependencies: [] });
    expect(useAppStore.getState().taskDependencies.length).toBe(0);

    // Rehydrate
    useAppStore.getState().rehydrateIssueLinks();

    // Verify it is restored!
    const restored = useAppStore.getState().taskDependencies;
    expect(restored.some((d) => d.taskId === task1.id && d.dependsOnTaskId === task2.id)).toBe(true);
  });
});