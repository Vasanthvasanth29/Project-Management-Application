import { describe, it, expect, beforeEach } from 'vitest';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

Object.assign(globalThis, { location: { origin: 'http://localhost', pathname: '/' } });

const { useAuthStore } = await import('../../store/authStore');
const { useAppStore } = await import('../../store/appStore');
const { BugsPage } = await import('./BugsPage');
const { BugDetailPage } = await import('./BugDetailPage');

describe('Bugs Module Rendering', () => {
  beforeEach(() => {
    useAuthStore.setState({
      isAuthenticated: true,
      currentUser: {
        id: 'u-admin-01',
        name: 'Sarah Mitchell',
        role: 'ADMIN',
        organizationId: 'org-001',
      },
    });
  });

  it('renders BugsPage without crashing for ADMIN', () => {
    const html = renderToStaticMarkup(
      h(MemoryRouter, { initialEntries: ['/tl/bugs'] }, h(BugsPage))
    );
    expect(html).toContain('Bug Tracking &amp; Rework');
  });

  it('renders BugsPage without crashing for MEMBER', () => {
    useAuthStore.setState({
      currentUser: {
        id: 'u-m-01',
        name: 'John Member',
        role: 'MEMBER',
        organizationId: 'org-001',
      },
    });
    const html = renderToStaticMarkup(
      h(MemoryRouter, { initialEntries: ['/member/bugs'] }, h(BugsPage))
    );
    expect(html).toContain('Bug Tracking &amp; Rework');
  });

  it('renders BugDetailPage without crashing for existing bug with route params', () => {
    const state = useAppStore.getState();
    const firstBug = state.bugs[0];
    const html = renderToStaticMarkup(
      h(MemoryRouter, { initialEntries: [`/bugs/${firstBug.id}`] },
        h(Routes, null, h(Route, { path: '/bugs/:bugId', element: h(BugDetailPage) }))
      )
    );
    expect(html).toContain('Bug Details');
    expect(html).toContain(firstBug.title);
  });

  it('renders BugDetailPage gracefully for unknown bug without crashing', () => {
    const html = renderToStaticMarkup(
      h(MemoryRouter, { initialEntries: ['/bugs/unknown-999'] },
        h(Routes, null, h(Route, { path: '/bugs/:bugId', element: h(BugDetailPage) }))
      )
    );
    expect(html).toContain('Bug not found');
  });
});
