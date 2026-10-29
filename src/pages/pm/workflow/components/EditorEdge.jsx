import React, { memo, useEffect, useRef } from 'react';
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath } from '@xyflow/react';
/**
 * Transition connector for the workflow editor canvas.
 *
 * `data.kind` comes from classifyTransition (configured data only). `data.preview`
 * ('active' | 'visited') and `data.reduced` are display-only overlays from the
 * local preview. The label is the transition's own `name`, shown only when set.
 */
export const EDGE_COLORS = {
    normal: '#94a3b8',
    complete: '#10b981',
    failure: '#f43f5e',
    rework: '#f59e0b',
    selected: '#0d9488',
    preview: '#0d9488',
};
export const edgeColor = (kind, { selected, preview } = {}) => (preview ? EDGE_COLORS.preview : selected ? EDGE_COLORS.selected : EDGE_COLORS[kind] || EDGE_COLORS.normal);
const LABEL_STYLE = {
    normal: 'text-[#475569] border-[#e2e8f0]',
    complete: 'text-[#047857] border-[#a7f3d0] bg-[#ecfdf5]',
    failure: 'text-[#be123c] border-[#fecdd3] bg-[#fff1f2]',
    rework: 'text-[#b45309] border-[#fde68a] bg-[#fffbeb]',
};
/**
 * Marker that travels the connector once. SVG animations inserted into a live
 * document are timed from document load, so it starts explicitly on mount.
 */
const PreviewMarker = ({ path, durationMs }) => {
    const motion = useRef(null);
    useEffect(() => {
        motion.current?.beginElement?.();
    }, [path, durationMs]);
    return (<circle r={5} fill="#0d9488" stroke="#ffffff" strokeWidth={2} data-preview-marker="">
      <animateMotion ref={motion} begin="indefinite" dur={`${durationMs}ms`} repeatCount="1" fill="freeze" path={path} calcMode="spline" keyPoints="0;1" keyTimes="0;1" keySplines="0.45 0 0.55 1"/>
    </circle>);
};
export const EditorEdge = memo(({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, markerEnd, data = {}, selected }) => {
    const [path, labelX, labelY] = getSmoothStepPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, borderRadius: 14, offset: 20 });
    const kind = data.kind || 'normal';
    const isSelected = selected || data.isSelected;
    const preview = data.preview;
    const color = edgeColor(kind, { selected: isSelected, preview });
    const style = {
        stroke: color,
        strokeWidth: preview === 'active' ? 2.6 : isSelected ? 2.5 : preview === 'visited' ? 2.1 : 1.75,
        strokeDasharray: kind === 'rework' && !preview && !isSelected ? '6 5' : undefined,
        transition: 'stroke 250ms ease, stroke-width 250ms ease',
    };
    const name = (data.transition?.name || '').trim();
    return (<>
      <BaseEdge id={id} path={path} markerEnd={markerEnd} style={style} interactionWidth={22}/>
      {preview === 'active' && !data.reduced && <PreviewMarker path={path} durationMs={data.travelMs || 900}/>}
      {name && (<EdgeLabelRenderer>
          <div className={`nodrag nopan pointer-events-none absolute rounded-full border bg-white px-2 py-0.5 text-[10px] font-semibold shadow-sm ${LABEL_STYLE[kind] || LABEL_STYLE.normal}`} style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}>
            {name}
          </div>
        </EdgeLabelRenderer>)}
    </>);
});
EditorEdge.displayName = 'EditorEdge';
