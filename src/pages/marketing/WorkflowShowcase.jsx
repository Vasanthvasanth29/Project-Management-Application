import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { Pause, Play, RotateCcw, SkipForward } from 'lucide-react';
/**
 * Animated workflow-builder demo for the marketing homepage.
 *
 * A self-contained, predefined illustration: it never reads or writes a real
 * workflow. Everything on the canvas is a pure function of one clock `t` (ms
 * into the loop), so pause freezes every moving part, replay / skip / step
 * seeking are a single clock jump, and speed only scales how fast `t` advances.
 *
 * The graph is multi-level: a main lane (START → … → DONE), an upper lane of
 * alternate branches and review loops, and a lower lane for failures and the
 * retry path. Connectors are cubic Bézier curves leaving each handle along its
 * normal (the Workflow Builder's bezier edges); a node side can carry several
 * handles (`top:-0.25`) so one parent fans out to several children and two-way
 * links run as parallel arrows. Positions and tangents come from an arc-length
 * table, so the work item travels the exact rendered curve at an even pace.
 *
 * Timing lives in NODES / EDGES / the run schedule; geometry lives in LAYOUTS,
 * so the same story plays on a wide canvas and a portrait one (phones).
 */
const SPEEDS = [0.5, 1, 1.5];
const BANNER = [176, 24];
const COLORS = {
    slate: '#94a3b8',
    teal: '#0d9488',
    amber: '#f59e0b',
    red: '#ef4444',
    green: '#10b981',
    ink: '#0f172a',
    muted: '#64748b',
    line: '#e2e8f0',
};
/* ------------------------------------------------------------------ */
/* Story: statuses and transitions (times in ms)                       */
/* ------------------------------------------------------------------ */
/** `at`: when the status appears. `added`: created through "Add status" during the demo. */
const NODES = [
    { id: 'start', kind: 'start', label: 'START', at: 200 },
    { id: 'planning', label: 'Planning', sub: 'To do', color: COLORS.slate, at: 700 },
    { id: 'blocked', label: 'Blocked', sub: 'On hold', color: COLORS.slate, at: 1250 },
    { id: 'dev', label: 'Development', sub: 'In progress', color: COLORS.teal, at: 2350 },
    { id: 'buildFailed', label: 'Build Failed', sub: 'Failure', color: COLORS.red, at: 2900 },
    { id: 'review', label: 'Code Review', sub: 'Review', color: COLORS.amber, at: 3250 },
    { id: 'changes', label: 'Changes', label2: 'Requested', color: COLORS.amber, at: 4050 },
    { id: 'testing', label: 'Testing', sub: 'QA', color: COLORS.amber, at: 5150 },
    { id: 'done', kind: 'done', label: 'DONE', at: 5700 },
    { id: 'security', label: 'Security', label2: 'Review', color: COLORS.amber, at: 6000 },
    { id: 'bugfix', label: 'Bug Fix', sub: 'Failure', color: COLORS.red, at: 7650, added: true },
    { id: 'retest', label: 'Re-test', sub: 'Retry', color: COLORS.amber, at: 8250, added: true },
];
/**
 * `at`: when the connector starts drawing (it takes DRAW ms; its label then pops).
 * `kind`: pass (emerald) · fail (red) · review (amber) · loop (amber, dashed,
 * returns to an earlier status) · plain (slate).
 */
const DRAW = 500;
const EDGES = [
    { id: 'e1', source: 'start', target: 'planning', at: 450 },
    { id: 'e3', source: 'planning', target: 'blocked', at: 1000 },
    { id: 'e4', source: 'blocked', target: 'planning', at: 1500, kind: 'loop' },
    { id: 'e2', source: 'planning', target: 'dev', at: 2100 },
    { id: 'e6', source: 'dev', target: 'buildFailed', at: 2650, kind: 'fail' },
    { id: 'e5', source: 'dev', target: 'review', at: 3000 },
    { id: 'e8', source: 'review', target: 'changes', at: 3800, kind: 'review' },
    { id: 'e9', source: 'changes', target: 'dev', at: 4350, kind: 'loop' },
    { id: 'e7', source: 'review', target: 'testing', at: 4900, kind: 'pass', label: 'Approved' },
    { id: 'e12', source: 'testing', target: 'done', at: 5450, kind: 'pass', label: 'Passed' },
    { id: 'e11', source: 'testing', target: 'security', at: 5750, kind: 'review' },
    { id: 'e15', source: 'security', target: 'done', at: 6300, kind: 'pass' },
    { id: 'e10', source: 'testing', target: 'bugfix', at: 7700, kind: 'fail', label: 'Failed' },
    { id: 'e13', source: 'bugfix', target: 'retest', at: 8300 },
    { id: 'e14', source: 'retest', target: 'dev', at: 8800, kind: 'loop', label: 'Retry' },
];
const EDGE_BY_ID = Object.fromEntries(EDGES.map((e) => [e.id, e]));
const NODE_BY_ID = Object.fromEntries(NODES.map((n) => [n.id, n]));
const INTRO_END = 6900;
const ADD_PRESS = [[7450, 7600], [8050, 8200]];
const CURSOR = [
    { start: INTRO_END, end: 7400, from: 'enter', to: 'button' },
    { start: 7400, end: 8600, from: 'button', to: 'button' },
];
/* ------------------------------------------------------------------ */
/* Story: geometry                                                     */
/* ------------------------------------------------------------------ */
/**
 * Handles are `side` or `side:offset` (offset as a fraction of the node's width
 * for top/bottom, height for left/right).
 */
const LAYOUTS = {
    // Main lane across the centre, branches above, failures and retries below.
    wide: {
        view: [750, 300],
        size: { start: [78, 30], stage: [104, 36], done: [84, 36] },
        font: { label: 11, sub: 8.5 },
        nodes: {
            start: [51, 150], planning: [164, 150], dev: [298, 150], review: [432, 150], testing: [566, 150], done: [690, 150],
            blocked: [164, 48], changes: [365, 48], security: [620, 48],
            buildFailed: [220, 252], retest: [410, 252], bugfix: [566, 252],
        },
        edges: {
            e1: { from: 'right', to: 'left' },
            e3: { from: 'top:0.25', to: 'bottom:0.25' },
            e4: { from: 'bottom:-0.25', to: 'top:-0.25' },
            e2: { from: 'right', to: 'left' },
            e6: { from: 'bottom:-0.25', to: 'top' },
            e5: { from: 'right', to: 'left' },
            e8: { from: 'top', to: 'right' },
            e9: { from: 'left', to: 'top' },
            e7: { from: 'right', to: 'left', labelOffset: [0, -30] },
            e12: { from: 'right', to: 'left', labelOffset: [0, -30] },
            e11: { from: 'top', to: 'left' },
            e15: { from: 'right', to: 'top' },
            e10: { from: 'bottom', to: 'top', labelOffset: [34, 0] },
            e13: { from: 'left', to: 'right' },
            e14: { from: 'left', to: 'bottom:0.25' },
        },
        button: { x: 12, y: 264 },
        enter: [250, 290],
        banner: { x: 560, y: 274 },
        minWidth: 600,
    },
    // Phones: the lanes become columns (branches left, failures and retries right).
    tall: {
        view: [360, 520],
        size: { start: [78, 28], stage: [104, 36], done: [84, 36] },
        font: { label: 11, sub: 8.5 },
        nodes: {
            start: [180, 24], blocked: [60, 72], planning: [180, 112], buildFailed: [300, 154], dev: [180, 198],
            changes: [60, 246], review: [180, 286], retest: [300, 286], testing: [180, 372], security: [60, 414],
            bugfix: [300, 424], done: [180, 462],
        },
        edges: {
            e1: { from: 'bottom', to: 'top' },
            e3: { from: 'left', to: 'bottom' },
            e4: { from: 'right', to: 'top:-0.3' },
            e2: { from: 'bottom', to: 'top' },
            e6: { from: 'right:-0.25', to: 'bottom' },
            e5: { from: 'bottom', to: 'top' },
            e8: { from: 'left', to: 'bottom' },
            e9: { from: 'top', to: 'left' },
            e7: { from: 'bottom', to: 'top', labelOffset: [-40, 0] },
            e12: { from: 'bottom', to: 'top' },
            e11: { from: 'left', to: 'top' },
            e15: { from: 'bottom', to: 'left' },
            e10: { from: 'right', to: 'top:-0.3' },
            e13: { from: 'top:0.3', to: 'bottom:0.3' },
            e14: { from: 'top', to: 'right:0.25' },
        },
        button: { x: 236, y: 486 },
        enter: [300, 470],
        banner: { x: 8, y: 490 },
        minWidth: 300,
        // Wider containers centre the portrait canvas instead of stretching it.
        maxWidth: 420,
    },
};
/* ------------------------------------------------------------------ */
/* Math helpers                                                        */
/* ------------------------------------------------------------------ */
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const progress = (t, start, dur) => clamp01((t - start) / dur);
const ease = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
/** Sine ease-in-out for the work item: peaks at ~1.6× its average pace (cubic peaks at 3×). */
const easeTravel = (p) => 0.5 - 0.5 * Math.cos(Math.PI * clamp01(p));
/** Damped spring (0 → 1 with a small overshoot) for node entrances. */
const spring = (p) => (p >= 1 ? 1 : 1 - Math.exp(-6.5 * p) * Math.cos(10.5 * p));
const lerp = (a, b, p) => a + (b - a) * p;
const lerpPoint = (a, b, p) => [lerp(a[0], b[0], p), lerp(a[1], b[1], p)];
const within = (t, [from, to]) => t >= from && t <= to;
const fmt = (p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
const NORMAL = { top: [0, -1], bottom: [0, 1], left: [-1, 0], right: [1, 0] };
const cubicPoint = ([p0, p1, p2, p3], u) => {
    const v = 1 - u;
    const a = v * v * v, b = 3 * v * v * u, c = 3 * v * u * u, d = u * u * u;
    return [a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]];
};
const cubicTangent = ([p0, p1, p2, p3], u) => {
    const v = 1 - u;
    return [
        3 * v * v * (p1[0] - p0[0]) + 6 * v * u * (p2[0] - p1[0]) + 3 * u * u * (p3[0] - p2[0]),
        3 * v * v * (p1[1] - p0[1]) + 6 * v * u * (p2[1] - p1[1]) + 3 * u * u * (p3[1] - p2[1]),
    ];
};
const splitCubic = ([p0, p1, p2, p3], u) => {
    const p01 = lerpPoint(p0, p1, u), p12 = lerpPoint(p1, p2, u), p23 = lerpPoint(p2, p3, u);
    const p012 = lerpPoint(p01, p12, u), p123 = lerpPoint(p12, p23, u), m = lerpPoint(p012, p123, u);
    return [[p0, p01, p012, m], [m, p123, p23, p3]];
};
const curvePath = ([p0, p1, p2, p3]) => `M ${fmt(p0)} C ${fmt(p1)} ${fmt(p2)} ${fmt(p3)}`;
const angleOf = ([x, y]) => Math.atan2(y, x);
/* ------------------------------------------------------------------ */
/* Geometry, precomputed once per layout (nodes never move)            */
/* ------------------------------------------------------------------ */
const nodeSize = (layout, node) => layout.size[node.kind || 'stage'];
const parseHandle = (spec) => {
    const [side, offset] = spec.split(':');
    return { side, offset: offset ? Number(offset) : 0 };
};
const handlePoint = (layout, nodeId, spec) => {
    const { side, offset } = parseHandle(spec);
    const [x, y] = layout.nodes[nodeId];
    const [w, h] = nodeSize(layout, NODE_BY_ID[nodeId]);
    const [nx, ny] = NORMAL[side];
    return [x + (nx * w) / 2 + (nx === 0 ? offset * w : 0), y + (ny * h) / 2 + (ny === 0 ? offset * h : 0)];
};
const buildEdge = (layout, edge) => {
    const geo = layout.edges[edge.id];
    const p0 = handlePoint(layout, edge.source, geo.from);
    const p3 = handlePoint(layout, edge.target, geo.to);
    const n0 = NORMAL[parseHandle(geo.from).side], n3 = NORMAL[parseHandle(geo.to).side];
    let k = Math.min(120, Math.max(24, Math.hypot(p3[0] - p0[0], p3[1] - p0[1]) * 0.45));
    // Facing handles (e.g. right → left): control points further apart than a third
    // of the gap would cross over, and the curve would double back on itself —
    // invisible on a straight link, but the work item would briefly run backwards.
    const gap = (p3[0] - p0[0]) * n0[0] + (p3[1] - p0[1]) * n0[1];
    if (n0[0] === -n3[0] && n0[1] === -n3[1] && gap > 0)
        k = Math.min(k, gap / 3);
    const curve = [p0, [p0[0] + n0[0] * k, p0[1] + n0[1] * k], [p3[0] + n3[0] * k, p3[1] + n3[1] * k], p3];
    // Arc-length table so fractions map to even distances along the curve.
    const samples = 64;
    const lengths = [0];
    let prev = p0;
    for (let i = 1; i <= samples; i++) {
        const pt = cubicPoint(curve, i / samples);
        lengths.push(lengths[i - 1] + Math.hypot(pt[0] - prev[0], pt[1] - prev[1]));
        prev = pt;
    }
    const L = lengths[samples];
    const paramAt = (f) => {
        const target = clamp01(f) * L;
        let i = 1;
        while (i < samples && lengths[i] < target)
            i++;
        const span = lengths[i] - lengths[i - 1] || 1;
        return (i - 1 + (target - lengths[i - 1]) / span) / samples;
    };
    const pointAt = (f) => cubicPoint(curve, paramAt(f));
    const tangentAt = (f) => cubicTangent(curve, paramAt(f));
    const mid = pointAt(0.5);
    const off = geo.labelOffset || [0, 0];
    return { curve, L, paramAt, pointAt, tangentAt, d: curvePath(curve), label: [mid[0] + off[0], mid[1] + off[1]], mid, from: geo.from, to: geo.to };
};
const layoutForWidth = (width) => (width >= 640 ? 'wide' : 'tall');
const GEOMETRY = Object.fromEntries(Object.entries(LAYOUTS).map(([key, layout]) => [key, Object.fromEntries(EDGES.map((e) => [e.id, buildEdge(layout, e)]))]));
/** The first `f` of the edge's curve (used while it draws in). */
const partialPath = (geo, f) => (f >= 1 ? geo.d : curvePath(splitCubic(geo.curve, geo.paramAt(f))[0]));
/* ------------------------------------------------------------------ */
/* Story: run timing (needs connector lengths)                         */
/* ------------------------------------------------------------------ */
const TOKEN_SHOW = 9600;
const RUN_START = 9800;
const DWELL = 270;
/** Testing weighs both outcomes for this long before a branch is chosen. */
const EVALUATE = 700;
/**
 * Travel time per connector, proportional to its longest length across the
 * layouts (≈ 330 units/s, within 520–950ms). The work item keeps a steady pace
 * and the schedule — and so the tutorial captions — is the same on every screen.
 */
const TRAVEL_SPEED = 0.33;
const travelFor = (edgeId) => {
    const longest = Math.max(...Object.values(GEOMETRY).map((g) => g[edgeId].L));
    return Math.round(Math.min(950, Math.max(520, longest / TRAVEL_SPEED)));
};
/** FE-142 fails Testing once, goes round the retry lane, then passes to DONE. */
const ROUTE = ['e1', 'e2', 'e5', 'e7', 'e10', 'e13', 'e14', 'e5', 'e7', 'e12'];
/** Per hop: leaves along `edge` at `depart`, arrives at `arrive`, leaves the target at `next`. */
const HOPS = (() => {
    let at = RUN_START;
    return ROUTE.map((edge, i) => {
        const depart = at;
        const arrive = depart + travelFor(edge);
        const last = i === ROUTE.length - 1;
        const dwell = last ? 0 : EDGE_BY_ID[edge].target === 'testing' ? EVALUATE + 500 : DWELL;
        at = arrive + dwell;
        return { edge, depart, arrive, next: at };
    });
})();
const arrival = (hop) => HOPS[hop].arrive;
const departure = (hop) => HOPS[hop].depart;
const DONE_AT = arrival(ROUTE.length - 1);
const FADE_START = DONE_AT + 2600;
const TOTAL = FADE_START + 700;
/** Static frame for reduced-motion users: the finished workflow with the item delivered. */
const STATIC_T = DONE_AT + 900;
/**
 * Testing decisions: both outcome branches shimmer while it evaluates
 * (`evalFrom` → `at`), then the outcome shows on the node and the chosen branch
 * is primed until the item leaves along it.
 */
const DECISIONS = [
    { evalFrom: arrival(3), at: arrival(3) + EVALUATE, until: departure(4), tone: 'fail', edge: 'e10', options: ['e10', 'e12'] },
    { evalFrom: arrival(8), at: arrival(8) + EVALUATE, until: departure(9), tone: 'pass', edge: 'e12', options: ['e10', 'e12'] },
];
const STEPS = [
    { at: 0, label: 'Start the workflow' },
    { at: 2100, label: 'Branch from Development' },
    { at: 3800, label: 'Add review loops' },
    { at: 4900, label: 'Route by outcome' },
    { at: INTRO_END, label: 'Add a retry lane' },
    { at: TOKEN_SHOW, label: 'Run a work item' },
    { at: arrival(6), label: 'Retry and complete' },
];
const DETAILS = [
    { at: 0, text: 'START → Planning, with a Blocked loop for work on hold.' },
    { at: 2100, text: 'Development branches to Code Review or Build Failed.' },
    { at: 3800, text: 'Changes requested send work back to Development.' },
    { at: 4900, text: 'Approved work is tested, then goes to DONE or Security Review.' },
    { at: INTRO_END, text: 'Add statuses: Bug Fix and Re-test form a retry lane.' },
    { at: TOKEN_SHOW, text: 'FE-142 moves along the transitions you configured.' },
    { at: arrival(3), text: 'Testing evaluates FE-142: Pass or Fail?' },
    { at: arrival(3) + EVALUATE, text: 'Tests failed, so the Failed branch routes to Bug Fix.' },
    { at: arrival(6), text: 'Re-test sends it back to Development for another pass.' },
    { at: arrival(8), text: 'Testing evaluates the fix: Pass or Fail?' },
    { at: arrival(8) + EVALUATE, text: 'Tests passed, so the Passed branch goes to DONE.' },
    { at: DONE_AT, text: 'FE-142 delivered after one retry.' },
];
/* ------------------------------------------------------------------ */
/* Timeline state                                                      */
/* ------------------------------------------------------------------ */
const nodeEntrance = (node, t) => {
    const p = progress(t, node.at, 650);
    return { opacity: ease(Math.min(1, p * 2)), scale: 0.82 + 0.18 * spring(p) };
};
const edgeDraw = (edge, t) => ease(progress(t, edge.at, DRAW));
const tokenState = (t) => {
    if (t < TOKEN_SHOW)
        return null;
    // `act` (0–1) eases a node's highlight in as the item arrives and out as it
    // leaves; `r` is how far through its stay in the status the item is.
    if (t < HOPS[0].depart)
        return { mode: 'dwell', node: 'start', nextEdge: HOPS[0].edge, f: 0, r: 0, act: 1 };
    const i = HOPS.findIndex((h) => t < h.next);
    if (i === -1) {
        const last = HOPS[HOPS.length - 1].edge;
        return { mode: 'dwell', node: EDGE_BY_ID[last].target, prevEdge: last, f: 0, r: 1, act: 1 };
    }
    const hop = HOPS[i];
    if (t < hop.arrive)
        return { mode: 'travel', edge: hop.edge, f: easeTravel((t - hop.depart) / (hop.arrive - hop.depart)), act: 0 };
    const r = (t - hop.arrive) / (hop.next - hop.arrive);
    return { mode: 'dwell', node: EDGE_BY_ID[hop.edge].target, prevEdge: hop.edge, nextEdge: HOPS[i + 1].edge, f: ease(r), r, act: ease(Math.min(1, r / 0.18, (1 - r) / 0.18)) };
};
/**
 * Where the work item is drawn. While it rests in a status it shrinks into the
 * arrival handle and re-emerges at the departure handle, so it never covers the
 * node's label. Timed on linear progress so the hidden gap lasts several frames
 * even on short stays at 1.5×: it is never visible at both handles in a row.
 */
const tokenPlacement = (state, geometry) => {
    if (state.mode === 'travel')
        return { point: geometry[state.edge].pointAt(state.f), scale: 1 };
    const arrive = state.prevEdge ? geometry[state.prevEdge].pointAt(1) : null;
    const depart = state.nextEdge ? geometry[state.nextEdge].pointAt(0) : null;
    if (!arrive || !depart)
        return { point: arrive || depart, scale: 1 };
    if (state.r < 0.48)
        return { point: arrive, scale: 1 - clamp01(state.r / 0.35) };
    return { point: depart, scale: clamp01((state.r - 0.6) / 0.35) };
};
const resolvePoint = (ref, layout) => (ref === 'button' ? [layout.button.x + 30, layout.button.y + 16] : layout.enter);
const cursorState = (t, layout) => {
    const first = CURSOR[0];
    const last = CURSOR[CURSOR.length - 1];
    if (t < first.start || t > last.end)
        return null;
    const segment = CURSOR.find((s) => t >= s.start && t <= s.end) || last;
    const p = ease(progress(t, segment.start, segment.end - segment.start));
    const point = lerpPoint(resolvePoint(segment.from, layout), resolvePoint(segment.to, layout), p);
    const opacity = Math.min(progress(t, first.start, 250), 1 - progress(t, last.end - 300, 300));
    return { point, opacity, pressing: ADD_PRESS.some((c) => within(t, c)) };
};
const latest = (list, t) => list.reduce((acc, item, i) => (t >= item.at ? i : acc), 0);
/* ------------------------------------------------------------------ */
/* Hooks                                                               */
/* ------------------------------------------------------------------ */
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;
const prefersReducedMotion = () => typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
/* ------------------------------------------------------------------ */
/* Canvas pieces                                                       */
/* ------------------------------------------------------------------ */
const EDGE_TONES = {
    plain: { stroke: '#94a3b8' },
    pass: { stroke: COLORS.green, fill: '#ecfdf5', border: '#a7f3d0', text: '#047857' },
    fail: { stroke: '#f43f5e', fill: '#fff1f2', border: '#fecdd3', text: '#be123c' },
    review: { stroke: COLORS.amber },
    loop: { stroke: COLORS.amber, fill: '#fffbeb', border: '#fde68a', text: '#b45309' },
    active: { stroke: COLORS.teal },
};
const Arrow = ({ point, angle, color, scale = 1 }) => (<path d="M 0 0 L -9 -4.6 L -7 0 L -9 4.6 Z" fill={color} transform={`translate(${fmt(point)}) rotate(${(angle * 180) / Math.PI}) scale(${scale})`}/>);
/** Fractions along a return loop that carry mid-path direction chevrons. */
const LOOP_CHEVRONS = [0.32, 0.68];
/**
 * `active`: the item is travelling this edge. `shimmer`: Testing is weighing
 * this branch. `primed`: this branch was chosen and the item is about to take it.
 * Coloured branches keep their colour while travelled; plain transitions turn teal.
 */
const CanvasEdge = ({ edge, geo, t, active, shimmer, primed }) => {
    const f = edgeDraw(edge, t);
    if (f <= 0)
        return null;
    const kind = edge.kind || 'plain';
    const color = EDGE_TONES[kind === 'plain' && active ? 'active' : kind].stroke;
    const emphasised = active || primed;
    const dashed = kind === 'loop' && !active;
    // The arrowhead rides the drawing tip, then rests at the target.
    const tip = Math.min(f, 1);
    const label = edge.label && EDGE_TONES[kind];
    const labelPop = edge.label ? ease(progress(t, edge.at + DRAW, 350)) : 0;
    const labelWidth = edge.label ? edge.label.length * 6 + 18 : 0;
    return (<g>
      <path data-edge={edge.id} d={partialPath(geo, f)} fill="none" stroke={color} strokeWidth={emphasised ? 2.3 : 1.6} strokeLinecap="round" strokeDasharray={dashed ? '5 4' : undefined} strokeDashoffset={dashed ? -t / 90 : undefined} style={{ transition: 'stroke 250ms ease, stroke-width 250ms ease' }}/>
      {shimmer && (<path d={geo.d} fill="none" stroke={color} strokeWidth={4} strokeLinecap="round" strokeDasharray="3 9" strokeDashoffset={-t / 25} opacity={0.3 + 0.2 * Math.sin(t / 120)}/>)}
      {kind === 'loop' && f >= 1 && LOOP_CHEVRONS.map((at) => (<Arrow key={at} point={geo.pointAt(at)} angle={angleOf(geo.tangentAt(at))} color={color} scale={0.7}/>))}
      {emphasised && (<path d={geo.d} fill="none" stroke="#ffffff" strokeWidth={1.3} strokeLinecap="round" strokeDasharray="2 11" strokeDashoffset={-t / 30} opacity={0.9}/>)}
      <Arrow point={geo.pointAt(tip)} angle={angleOf(geo.tangentAt(tip))} color={color}/>
      {labelPop > 0 && (<g transform={`translate(${fmt(geo.label)}) scale(${0.85 + 0.15 * labelPop})`} opacity={labelPop}>
          <rect x={-labelWidth / 2} y={-9.5} width={labelWidth} height={19} rx={9.5} fill={active ? label.stroke : label.fill} stroke={active ? label.stroke : label.border} style={{ transition: 'fill 250ms ease, stroke 250ms ease' }}/>
          <text y={3.8} textAnchor="middle" fontSize={10} fontWeight={700} fill={active ? '#ffffff' : label.text}>
            {edge.label}
          </text>
        </g>)}
    </g>);
};
/** `burst` (0–1): a ring that expands once from a handle when a link to it completes. */
const Handle = ({ point, burst, pulse, fill = COLORS.teal, stroke = '#ffffff' }) => (<g transform={`translate(${fmt(point)})`}>
    {burst > 0 && <circle r={4 + 11 * ease(burst)} fill="none" stroke={COLORS.teal} strokeWidth={1.5} opacity={0.55 * (1 - burst)}/>}
    <circle r={3.1 + pulse * 0.4} fill={fill} stroke={stroke} strokeWidth={1.5}/>
  </g>);
/**
 * `activation` (0–1): the item is in this status. `stay` (0–1, or null): how far
 * through its stay it is. `status`: overrides the subtitle (Testing's verdict).
 */
const CanvasNode = ({ node, layout, t, uid, activation = 0, stay = null, status = null, isNew, handles }) => {
    if (t < node.at)
        return null;
    const entrance = nodeEntrance(node, t);
    const active = activation > 0.5;
    const [x, y] = layout.nodes[node.id];
    const [w, h] = nodeSize(layout, node);
    const { label: labelSize, sub: subSize } = layout.font;
    const pulse = active ? 0.5 + 0.5 * Math.sin(t / 240) : 0;
    const ringOpacity = active ? 0.28 + 0.12 * pulse : 0;
    const ringColor = node.kind === 'done' ? COLORS.green : COLORS.teal;
    let body;
    if (node.kind === 'start') {
        body = (<>
        <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill={COLORS.ink} filter={`url(#${uid}-shadow)`}/>
        <circle cx={-w / 2 + 14} r={8} fill={COLORS.teal}/>
        <path d={`M ${-w / 2 + 11.8} -3.6 L ${-w / 2 + 17.6} 0 L ${-w / 2 + 11.8} 3.6 Z`} fill="#ffffff"/>
        <text x={-w / 2 + 27} y={4} fontSize={10.5} fontWeight={700} letterSpacing={1} fill="#ffffff">{node.label}</text>
      </>);
    }
    else if (node.kind === 'done') {
        const complete = progress(t, DONE_AT, 500);
        body = (<>
        <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={12} fill="#059669" filter={`url(#${uid}-shadow)`}/>
        <circle cx={-w / 2 + 18} r={8} fill={complete > 0 ? '#ffffff' : 'none'} stroke="#d1fae5" strokeWidth={1.5} style={{ transition: 'fill 300ms ease' }}/>
        <path d={`M ${-w / 2 + 14} 0.4 L ${-w / 2 + 17} 3.2 L ${-w / 2 + 22} -2.6`} fill="none" stroke={complete > 0 ? '#059669' : '#d1fae5'} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
        <text x={-w / 2 + 32} y={-1} fontSize={11} fontWeight={700} letterSpacing={1} fill="#ffffff">{node.label}</text>
        <text x={-w / 2 + 32} y={10} fontSize={subSize} fontWeight={500} fill="#d1fae5">Completed</text>
      </>);
    }
    else {
        const textX = -w / 2 + 20;
        body = (<>
        <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={10} fill={active ? '#f0fdfa' : '#ffffff'} stroke={active ? COLORS.teal : COLORS.line} strokeWidth={active ? 1.5 : 1} filter={`url(#${uid}-shadow)`} style={{ transition: 'fill 300ms ease, stroke 300ms ease' }}/>
        <rect x={-w / 2 + 9} y={-h / 2 + 9} width={3.5} height={h - 18} rx={1.75} fill={active ? COLORS.teal : node.color} style={{ transition: 'fill 300ms ease' }}/>
        {node.label2 ? (<text x={textX} y={-1.5} fontSize={labelSize} fontWeight={700} fill={COLORS.ink}>
            {node.label}
            <tspan x={textX} dy={11.5}>{node.label2}</tspan>
          </text>) : (<>
            <text x={textX} y={-2} fontSize={labelSize} fontWeight={700} fill={COLORS.ink}>{node.label}</text>
            <text x={textX} y={10} fontSize={subSize} fontWeight={status ? 700 : 500} fill={status ? status.color : COLORS.muted} style={{ transition: 'fill 200ms ease' }}>{status ? status.text : node.sub}</text>
          </>)}
        {stay !== null && (<g opacity={activation}>
            <rect x={-w / 2 + 9} y={h / 2 - 3.5} width={w - 18} height={2} rx={1} fill="#ccfbf1"/>
            <rect x={-w / 2 + 9} y={h / 2 - 3.5} width={(w - 18) * stay} height={2} rx={1} fill={COLORS.teal}/>
          </g>)}
        {isNew && (<g transform={`translate(${w / 2 - 34} ${-h / 2 - 7})`}>
            <rect width={30} height={14} rx={7} fill="#ccfbf1" stroke="#99f6e4"/>
            <text x={15} y={10} textAnchor="middle" fontSize={8} fontWeight={700} fill="#0f766e">New</text>
          </g>)}
      </>);
    }
    const handleFill = node.kind === 'done' ? '#ffffff' : node.kind === 'start' ? '#2dd4bf' : COLORS.teal;
    const handleStroke = node.kind === 'done' ? '#059669' : '#ffffff';
    return (<g opacity={entrance.opacity}>
      <g transform={`translate(${x} ${y}) scale(${entrance.scale * (1 + 0.035 * activation)})`}>
        <rect x={-w / 2 - 4} y={-h / 2 - 4} width={w + 8} height={h + 8} rx={node.kind === 'start' ? h / 2 + 4 : 13} fill="none" stroke={ringColor} strokeWidth={2} style={{ opacity: ringOpacity, transition: 'opacity 300ms ease' }}/>
        {body}
      </g>
      {Object.entries(handles).map(([spec, burst]) => (<Handle key={spec} point={handlePoint(layout, node.id, spec)} burst={burst} pulse={pulse} fill={handleFill} stroke={handleStroke}/>))}
    </g>);
};
/** In-canvas "Add status" control: pressed by the scripted cursor, and clickable to replay that step. */
const AddStatusButton = ({ layout, t, onActivate }) => {
    const [focused, setFocused] = useState(false);
    const visible = progress(t, INTRO_END - 400, 400);
    if (visible <= 0)
        return null;
    const pressed = ADD_PRESS.some((w) => within(t, w));
    const onKeyDown = (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onActivate();
        }
    };
    return (<g transform={`translate(${layout.button.x} ${layout.button.y})`} opacity={visible} role="button" tabIndex={0} aria-label="Add status: replay the add-status step" onClick={onActivate} onKeyDown={onKeyDown} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={{ cursor: 'pointer', outline: 'none' }}>
      {focused && <rect x={-3} y={-3} width={118} height={34} rx={10} fill="none" stroke={COLORS.teal} strokeWidth={2}/>}
      <rect width={112} height={28} rx={8} fill={pressed ? '#ccfbf1' : '#ffffff'} stroke={pressed ? COLORS.teal : COLORS.line} style={{ transition: 'fill 150ms ease, stroke 150ms ease' }}/>
      <path d="M 12 14 h 9 M 16.5 9.5 v 9" stroke={COLORS.teal} strokeWidth={2} strokeLinecap="round"/>
      <text x={28} y={18} fontSize={10.5} fontWeight={700} fill="#0f766e">Add status</text>
    </g>);
};
const Cursor = ({ state }) => {
    if (!state)
        return null;
    return (<g transform={`translate(${fmt(state.point)}) scale(${state.pressing ? 0.9 : 1})`} opacity={state.opacity}>
      <path d="M 0 0 L 0 15 L 4 11.5 L 7 18 L 9.6 16.8 L 6.8 10.6 L 12 10.4 Z" fill={COLORS.ink} stroke="#ffffff" strokeWidth={1.4} strokeLinejoin="round"/>
    </g>);
};
const TAG = [52, 18];
/** Candidate tag positions relative to the work item: above, below, right, left. */
const TAG_OFFSETS = [[-26, -36], [-26, 18], [12, -9], [-64, -9]];
const tagOffsetCache = new WeakMap();
/**
 * Pick one tag position per connector: the candidate that overlaps nodes and
 * labels the least along the whole path (and stays on the canvas). Fixed for
 * the hop, so the tag never jumps sides mid-travel.
 */
const tagOffsetFor = (layout, geometry, edgeId) => {
    if (!tagOffsetCache.has(layout))
        tagOffsetCache.set(layout, new Map());
    const cache = tagOffsetCache.get(layout);
    if (cache.has(edgeId))
        return cache.get(edgeId);
    const [W, H] = layout.view;
    const boxes = NODES.map((n) => {
        const [x, y] = layout.nodes[n.id];
        const [w, h] = nodeSize(layout, n);
        return [x - w / 2, y - h / 2, x + w / 2, y + h / 2];
    }).concat(EDGES.filter((e) => e.label).map((e) => {
        const [x, y] = geometry[e.id].label;
        const w = e.label.length * 6 + 18;
        return [x - w / 2, y - 10, x + w / 2, y + 10];
    }));
    const overlapArea = (a, b) => Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]));
    let best = TAG_OFFSETS[0];
    let bestCost = Infinity;
    for (const offset of TAG_OFFSETS) {
        let cost = 0;
        for (let k = 0; k <= 10; k++) {
            const [px, py] = geometry[edgeId].pointAt(k / 10);
            const tag = [px + offset[0], py + offset[1], px + offset[0] + TAG[0], py + offset[1] + TAG[1]];
            cost += boxes.reduce((sum, b) => sum + overlapArea(tag, b), 0);
            if (tag[0] < 0 || tag[1] < 0 || tag[2] > W || tag[3] > H)
                cost += 1000;
        }
        if (cost < bestCost) {
            bestCost = cost;
            best = offset;
        }
    }
    cache.set(edgeId, best);
    return best;
};
const Token = ({ state, t, geometry, layout }) => {
    if (!state)
        return null;
    const { point, scale } = tokenPlacement(state, geometry);
    const opacity = progress(t, TOKEN_SHOW, 250) * Math.min(1, scale * 1.5);
    // Tag only while moving; once delivered, the completion banner names the item.
    const showTag = state.mode === 'travel' || (!state.prevEdge && !!state.nextEdge);
    const [tagX, tagY] = tagOffsetFor(layout, geometry, state.mode === 'travel' ? state.edge : state.nextEdge || state.prevEdge);
    const trail = state.mode === 'travel' ? [0.05, 0.1].map((d) => geometry[state.edge].pointAt(Math.max(0, state.f - d))) : [];
    return (<g opacity={opacity}>
      {trail.map((p, i) => (<circle key={i} cx={p[0]} cy={p[1]} r={4.2 - i * 1.1} fill={COLORS.teal} opacity={0.3 - i * 0.12}/>))}
      <g transform={`translate(${fmt(point)}) scale(${0.4 + 0.6 * scale})`} data-token-edge={state.mode === 'travel' ? state.edge : ''} data-x={point[0]} data-y={point[1]} data-visible={opacity > 0.05 ? '1' : '0'}>
        <circle r={10 + 1.5 * Math.sin(t / 260)} fill={COLORS.teal} opacity={0.15}/>
        <circle r={6} fill={COLORS.teal} stroke="#ffffff" strokeWidth={2}/>
        <g transform={`translate(${tagX} ${tagY})`} style={{ opacity: showTag ? 1 : 0, transition: 'opacity 200ms ease' }}>
          <rect width={TAG[0]} height={TAG[1]} rx={TAG[1] / 2} fill={COLORS.ink}/>
          <text x={TAG[0] / 2} y={12.5} textAnchor="middle" fontSize={10} fontWeight={700} fill="#ffffff">FE-142</text>
        </g>
      </g>
    </g>);
};
/* ------------------------------------------------------------------ */
/* Showcase                                                            */
/* ------------------------------------------------------------------ */
const iconButtonClass = 'inline-flex h-7 w-7 items-center justify-center rounded-md text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f766e] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0d9488]';
export const WorkflowShowcase = ({ replaySignal = 0 }) => {
    const uid = `wf${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
    const [reducedMotion, setReducedMotion] = useState(prefersReducedMotion);
    const [t, setT] = useState(() => (prefersReducedMotion() ? STATIC_T : 0));
    const [playing, setPlaying] = useState(() => !prefersReducedMotion());
    const [speed, setSpeed] = useState(1);
    const [inView, setInView] = useState(false);
    const [layoutKey, setLayoutKey] = useState('wide');
    const [fading, setFading] = useState(false);
    const rootRef = useRef(null);
    const jumpTimer = useRef(null);
    const layout = LAYOUTS[layoutKey];
    const geometry = GEOMETRY[layoutKey];
    // Pick the layout by the card's own width so labels stay readable at every size.
    useIsomorphicLayoutEffect(() => {
        const el = rootRef.current;
        if (!el || typeof ResizeObserver === 'undefined')
            return undefined;
        const observer = new ResizeObserver(([entry]) => setLayoutKey(layoutForWidth(entry.contentRect.width)));
        observer.observe(el);
        return () => observer.disconnect();
    }, []);
    // Follow the OS reduced-motion setting live: stop on a static, complete frame.
    useEffect(() => {
        if (typeof window === 'undefined' || typeof window.matchMedia !== 'function')
            return undefined;
        const query = window.matchMedia('(prefers-reduced-motion: reduce)');
        const onChange = () => {
            setReducedMotion(query.matches);
            if (query.matches) {
                setPlaying(false);
                setT(STATIC_T);
            }
        };
        query.addEventListener?.('change', onChange);
        return () => query.removeEventListener?.('change', onChange);
    }, []);
    // Only animate while the canvas is on screen.
    useEffect(() => {
        const el = rootRef.current;
        if (!el || typeof IntersectionObserver === 'undefined') {
            setInView(true);
            return undefined;
        }
        const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.15 });
        observer.observe(el);
        return () => observer.disconnect();
    }, []);
    useEffect(() => {
        if (!playing || !inView)
            return undefined;
        let frame;
        // Start from the first frame's own timestamp: rAF timestamps are frame-start
        // times and can precede performance.now() taken here, which would step the
        // clock backwards on every (re)start — play, speed change, scrolling back in.
        let last = null;
        const tick = (now) => {
            // Clamp long gaps (background tab, breakpoint) so the story never skips ahead.
            const dt = last === null ? 0 : Math.min(Math.max(now - last, 0), 64) * speed;
            last = now;
            setT((prev) => (prev + dt) % TOTAL);
            frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [playing, inView, speed]);
    useEffect(() => () => clearTimeout(jumpTimer.current), []);
    /** Jump the clock with a short crossfade instead of a hard cut. */
    const jumpTo = (at, { play = true } = {}) => {
        clearTimeout(jumpTimer.current);
        if (play)
            setPlaying(true);
        if (reducedMotion) {
            setT(at);
            return;
        }
        setFading(true);
        jumpTimer.current = setTimeout(() => {
            setT(at);
            setFading(false);
        }, 200);
    };
    // External "See how it works" trigger: bring the canvas into view and replay.
    useEffect(() => {
        if (!replaySignal)
            return;
        jumpTo(0);
        rootRef.current?.scrollIntoView?.({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [replaySignal]);
    // Frame state
    const token = tokenState(t);
    const activeEdge = token?.mode === 'travel' ? token.edge : null;
    const activeNode = token?.mode === 'dwell' ? token.node : null;
    const evaluating = DECISIONS.find((d) => within(t, [d.evalFrom, d.at]));
    const decided = DECISIONS.find((d) => t >= d.at && t < d.until + 300);
    const primedEdge = DECISIONS.find((d) => t >= d.at && t < d.until)?.edge;
    const testingStatus = evaluating
        ? { text: 'Evaluating…', color: '#b45309' }
        : decided
            ? decided.tone === 'pass' ? { text: '✓ Passed', color: '#047857' } : { text: '✕ Failed', color: '#be123c' }
            : null;
    /** Handles in use per node, with a one-off pulse where a link has just arrived. */
    const handlesFor = (nodeId) => {
        const handles = {};
        for (const edge of EDGES) {
            if (t < edge.at)
                continue;
            const geo = geometry[edge.id];
            const completedAt = edge.at + DRAW;
            const burst = t >= completedAt && t < completedAt + 700 ? (t - completedAt) / 700 : 0;
            if (edge.source === nodeId)
                handles[geo.from] = Math.max(handles[geo.from] || 0, 0);
            if (edge.target === nodeId)
                handles[geo.to] = Math.max(handles[geo.to] || 0, burst);
        }
        return handles;
    };
    const stepIndex = latest(STEPS, t);
    const detail = DETAILS[latest(DETAILS, t)].text;
    const endFade = 1 - progress(t, FADE_START, TOTAL - FADE_START - 100);
    const bannerVisible = progress(t, DONE_AT + 200, 350) * endFade;
    const doneBurst = progress(t, DONE_AT, 900);
    const [viewW, viewH] = layout.view;
    const donePos = layout.nodes.done;
    const doneSize = nodeSize(layout, NODE_BY_ID.done);
    const skipVisible = t < INTRO_END - 200;
    return (<figure ref={rootRef} className="rounded-2xl border border-[#e2e5ea] bg-white shadow-fe-lg overflow-hidden" aria-label="Animated workflow builder demo">
      <div className="flex h-10 items-center justify-between gap-2 border-b border-[#eef0f3] pl-3.5 pr-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${playing ? 'bg-[#10b981]' : 'bg-[#cbd5e1]'}`} aria-hidden="true"/>
          <span className="truncate text-[11px] font-semibold text-[#334155]">Workflow · Delivery</span>
          <span className="badge-teal hidden text-[9.5px] sm:inline-flex">Custom</span>
        </div>
        <div className="flex items-center gap-0.5">
          <button type="button" onClick={() => jumpTo(INTRO_END)} className={`${iconButtonClass} ${skipVisible ? '' : 'invisible'}`} aria-label="Skip intro" title="Skip intro" tabIndex={skipVisible ? 0 : -1}>
            <SkipForward className="h-3.5 w-3.5" aria-hidden="true"/>
          </button>
          <button type="button" onClick={() => setPlaying((p) => !p)} className={iconButtonClass} aria-label={playing ? 'Pause workflow demo' : 'Resume workflow demo'} title={playing ? 'Pause' : 'Resume'}>
            {playing ? <Pause className="h-3.5 w-3.5" aria-hidden="true"/> : <Play className="h-3.5 w-3.5" aria-hidden="true"/>}
          </button>
          <button type="button" onClick={() => jumpTo(0)} className={iconButtonClass} aria-label="Replay workflow demo from the start" title="Replay">
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true"/>
          </button>
          <span className="mx-1 h-4 w-px bg-[#e2e5ea]" aria-hidden="true"/>
          <div className="inline-flex h-7 items-center rounded-md bg-[#f1f5f9] p-0.5" role="group" aria-label="Animation speed">
            {SPEEDS.map((s) => (<button key={s} type="button" onClick={() => setSpeed(s)} aria-pressed={speed === s} className={`h-full rounded px-1.5 text-[10.5px] font-semibold tabular-nums transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0d9488] ${speed === s ? 'bg-white text-[#0f766e] shadow-fe-xs' : 'text-[#64748b] hover:text-[#0f172a]'}`}>
                {s}×
              </button>))}
          </div>
        </div>
      </div>

      <div className="bg-[#f8fafc] overflow-x-auto">
        <svg viewBox={`0 0 ${viewW} ${viewH}`} className="block w-full h-auto select-none" style={{ fontFamily: 'inherit', minWidth: layout.minWidth, maxWidth: layout.maxWidth, margin: '0 auto' }} role="group" aria-label="Workflow canvas. A multi-level workflow: START, Planning (with a Blocked loop), Development (branching to Code Review or Build Failed), Code Review (approved to Testing, or Changes Requested looping back to Development), Testing (to DONE, Security Review, or Bug Fix). Bug Fix and Re-test are added as a retry lane back to Development. A work item fails testing once, loops through the retry lane, then passes to DONE.">
          <defs>
            <pattern id={`${uid}-dots`} width={18} height={18} patternUnits="userSpaceOnUse">
              <circle cx={1.5} cy={1.5} r={1.1} fill="#cbd3dd"/>
            </pattern>
            <filter id={`${uid}-shadow`} x="-20%" y="-40%" width="140%" height="190%">
              <feDropShadow dx={0} dy={1} stdDeviation={1} floodColor="#0f172a" floodOpacity={0.06}/>
              <feDropShadow dx={0} dy={4} stdDeviation={5} floodColor="#0f172a" floodOpacity={0.06}/>
            </filter>
          </defs>

          <rect width={viewW} height={viewH} fill={`url(#${uid}-dots)`}/>

          <g style={{ opacity: fading ? 0 : endFade, transition: 'opacity 200ms ease' }}>
            <g aria-hidden="true">
              {EDGES.map((edge) => (<CanvasEdge key={edge.id} edge={edge} geo={geometry[edge.id]} t={t} active={edge.id === activeEdge} shimmer={!!evaluating && evaluating.options.includes(edge.id)} primed={edge.id === primedEdge}/>))}

              {doneBurst > 0 && doneBurst < 1 && (<rect x={donePos[0] - doneSize[0] / 2 - 12 * doneBurst} y={donePos[1] - doneSize[1] / 2 - 12 * doneBurst} width={doneSize[0] + 24 * doneBurst} height={doneSize[1] + 24 * doneBurst} rx={12 + 10 * doneBurst} fill="none" stroke={COLORS.green} strokeWidth={2} opacity={0.5 * (1 - doneBurst)}/>)}

              {NODES.map((node) => (<CanvasNode key={node.id} node={node} layout={layout} t={t} uid={uid} activation={node.id === activeNode ? token.act : 0} stay={node.id === activeNode && token.nextEdge && token.prevEdge ? token.r : null} status={node.id === 'testing' ? testingStatus : null} isNew={node.added && t < TOKEN_SHOW} handles={handlesFor(node.id)}/>))}
            </g>

            <AddStatusButton layout={layout} t={t} onActivate={() => jumpTo(INTRO_END)}/>

            <g aria-hidden="true">
              <Token state={token} t={t} geometry={geometry} layout={layout}/>

              {bannerVisible > 0 && (<g transform={`translate(${layout.banner.x} ${layout.banner.y})`} opacity={bannerVisible}>
                  <rect width={BANNER[0]} height={BANNER[1]} rx={BANNER[1] / 2} fill="#ecfdf5" stroke="#a7f3d0"/>
                  <circle cx={14} cy={12} r={6.5} fill={COLORS.green}/>
                  <path d="M 10.8 12.2 L 13 14.3 L 17 10" fill="none" stroke="#ffffff" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"/>
                  <text x={26} y={16} fontSize={10.5} fontWeight={700} fill="#047857">FE-142 delivered · 1 retry</text>
                </g>)}

              <Cursor state={cursorState(t, layout)}/>
            </g>
          </g>
        </svg>
      </div>

      <figcaption className="relative border-t border-[#eef0f3] bg-white">
        {/* Loop progress runs along the caption's top edge. */}
        <div className="absolute inset-x-0 -top-px h-[2px]" aria-hidden="true">
          <div className="h-full bg-[#0d9488]" style={{ width: `${(t / TOTAL) * 100}%` }}/>
        </div>
        <div className="flex items-center justify-between gap-3 px-3.5 py-2">
          <div className="min-w-0">
            <p className="truncate text-[11px] font-semibold text-[#0f172a]">
              <span className="tabular-nums text-[#0d9488]" aria-label={`Step ${stepIndex + 1} of ${STEPS.length}`}>{String(stepIndex + 1).padStart(2, '0')}</span>
              <span className="mx-1 text-[#cbd5e1]" aria-hidden="true">·</span>
              {STEPS[stepIndex].label}
            </p>
            <p className="min-h-[2.5em] text-[10.5px] leading-[1.25] text-[#64748b] line-clamp-2 sm:min-h-0 sm:truncate">{detail}</p>
          </div>
          <div className="flex flex-shrink-0 items-center gap-1">
            {STEPS.map((step, i) => (<button key={step.label} type="button" onClick={() => jumpTo(step.at)} className={`h-1.5 rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0d9488] focus-visible:ring-offset-2 ${i === stepIndex ? 'w-4 bg-[#0d9488]' : i < stepIndex ? 'w-1.5 bg-[#5eead4] hover:bg-[#2dd4bf]' : 'w-1.5 bg-[#cbd5e1] hover:bg-[#94a3b8]'}`} aria-label={`Jump to step ${i + 1}: ${step.label}`} aria-current={i === stepIndex ? 'step' : undefined}/>))}
          </div>
        </div>
      </figcaption>
    </figure>);
};
