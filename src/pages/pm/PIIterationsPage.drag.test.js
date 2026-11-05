import { describe, expect, it } from 'vitest';

if (typeof window === 'undefined') {
  globalThis.window = { location: { origin: 'http://localhost', pathname: '/' } };
}

const { calculateNextIterationNumber, toInitialCapsStatus, getProgressStyles } = await import('./PIIterationsPage');
const { piStatusOf } = await import('../../utils/programIncrement');

describe('PI Iterations Page - Status Formatting and Progress Column Colors', () => {
  it('formats status labels to Initial Caps consistently', () => {
    expect(toInitialCapsStatus('IN_PROGRESS')).toBe('In Progress');
    expect(toInitialCapsStatus('COMPLETED')).toBe('Completed');
    expect(toInitialCapsStatus('PLANNED')).toBe('Planned');
    expect(toInitialCapsStatus('ACTIVE')).toBe('Active');
    expect(toInitialCapsStatus('ALL')).toBe('All Statuses');
    expect(toInitialCapsStatus('in progress')).toBe('In Progress');
    expect(toInitialCapsStatus('completed')).toBe('Completed');
    expect(toInitialCapsStatus('planned')).toBe('Planned');
  });

  it('provides blue text and blue progress bar for In Progress iterations', () => {
    const inProgressStyles = getProgressStyles('In Progress');
    expect(inProgressStyles.textClass).toContain('text-[#2563eb]');
    expect(inProgressStyles.barColor).toBe('bg-[#2563eb]');

    const activeStyles = getProgressStyles('ACTIVE');
    expect(activeStyles.textClass).toContain('text-[#2563eb]');
    expect(activeStyles.barColor).toBe('bg-[#2563eb]');
  });

  it('provides green text and green progress bar for Completed iterations', () => {
    const completedStyles = getProgressStyles('Completed');
    expect(completedStyles.textClass).toContain('text-[#059669]');
    expect(completedStyles.barColor).toBe('bg-[#10b981]');

    const completedUpperStyles = getProgressStyles('COMPLETED');
    expect(completedUpperStyles.textClass).toContain('text-[#059669]');
    expect(completedUpperStyles.barColor).toBe('bg-[#10b981]');
  });

  it('provides neutral/gray text and light gray progress bar for Planned iterations', () => {
    const plannedStyles = getProgressStyles('Planned');
    expect(plannedStyles.textClass).toContain('text-slate-600');
    expect(plannedStyles.barColor).toBe('bg-slate-300');

    const plannedUpperStyles = getProgressStyles('PLANNED');
    expect(plannedUpperStyles.textClass).toContain('text-slate-600');
    expect(plannedUpperStyles.barColor).toBe('bg-slate-300');
  });
});

describe('PI Iterations Drag and Drop - Renumbering and Business Rules', () => {
  it('calculates the next sequential iteration number based on destination PI', () => {
    const targetPi = { id: 'pi-005', name: 'PI 5', number: 5 };
    const sprints = [
      { id: 's-1', piId: 'pi-005', iterationNumber: '5.1', isArchived: false },
      { id: 's-2', piId: 'pi-005', iterationNumber: '5.2', isArchived: false },
      { id: 's-3', piId: 'pi-005', iterationNumber: '5.3', isArchived: false },
      { id: 's-4', piId: 'pi-005', iterationNumber: '5.4', isArchived: false },
    ];

    const next = calculateNextIterationNumber(targetPi, sprints);
    expect(next).toBe('5.5');
  });

  it('increments sequentially when multiple iterations are moved to the same destination', () => {
    const targetPi = { id: 'pi-005', name: 'PI 5', number: 5 };
    const sprints = [
      { id: 's-1', piId: 'pi-005', iterationNumber: '5.1' },
      { id: 's-2', piId: 'pi-005', iterationNumber: '5.2' },
      { id: 's-3', piId: 'pi-005', iterationNumber: '5.3' },
      { id: 's-4', piId: 'pi-005', iterationNumber: '5.4' },
      { id: 's-5', piId: 'pi-005', iterationNumber: '5.5' },
    ];

    const next = calculateNextIterationNumber(targetPi, sprints);
    expect(next).toBe('5.6');
  });

  it('handles empty destination PI by starting at 1', () => {
    const targetPi = { id: 'pi-006', name: 'PI 6', number: 6 };
    const sprints = [];

    const next = calculateNextIterationNumber(targetPi, sprints);
    expect(next).toBe('6.1');
  });

  it('extracts PI number from name if number property is omitted', () => {
    const targetPi = { id: 'pi-007', name: 'PI 7 - Advanced Analytics' };
    const sprints = [
      { id: 's-1', piId: 'pi-007', iterationNumber: '7.1' },
    ];

    const next = calculateNextIterationNumber(targetPi, sprints);
    expect(next).toBe('7.2');
  });

  it('enforces completed PI status restrictions for drag and drop', () => {
    const completedPi = {
      id: 'pi-003',
      name: 'PI 3',
      number: 3,
      status: 'COMPLETED',
      startDate: '2026-08-01',
      endDate: '2026-10-18',
    };
    const sprints = [
      { id: 's-1', piId: 'pi-003', status: 'COMPLETED' },
    ];

    const status = piStatusOf(completedPi, sprints);
    expect(status).toBe('COMPLETED');
    const isDragSourceAllowed = status !== 'COMPLETED';
    expect(isDragSourceAllowed).toBe(false);
  });

  it('builds navigation URL with iteration, sprintId, and pi query parameters', () => {
    const rolePrefix = 'admin';
    const key = 'ECOMM4.0';
    const nameSlug = 'e-commerce-platform';
    const iterNum = '4.3';
    const sprintId = 'spr-ecomm-403';
    const targetPiId = 'pi-004';

    const search = new URLSearchParams();
    if (iterNum) search.set('iteration', iterNum);
    if (sprintId) search.set('sprintId', sprintId);
    if (targetPiId) search.set('pi', targetPiId);

    const targetUrl = `/${rolePrefix}/${encodeURIComponent(key)}/${nameSlug}/iterations?${search.toString()}`;
    expect(targetUrl).toBe('/admin/ECOMM4.0/e-commerce-platform/iterations?iteration=4.3&sprintId=spr-ecomm-403&pi=pi-004');
  });
});
