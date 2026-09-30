import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { brightnessFor, colorFor, radiusFor } from '../lib/skills';

/**
 * The night sky.
 *
 * Positions are FIXED (fx/fy) from the server's stored starPosition, so the sky
 * never rearranges itself when a line is drawn — people keep their bearings.
 * The force simulation is effectively off; we use react-force-graph purely for
 * its canvas renderer, zoom/pan and hit-testing.
 */
export default function SkyGraph({
  nodes,
  links,
  highlightIds = null, // Set of ids to keep lit; others dim. null = everything lit.
  focusId = null, // id whose immediate links are emphasised
  flareIds = [], // ids to flash — newly drawn connections
  onSelect,
}) {
  const ref = useRef(null);
  const wrapRef = useRef(null);
  const [size, setSize] = useState({ width: 800, height: 600 });
  const [hoverId, setHoverId] = useState(null);
  const flareStart = useRef(new Map());

  // Keep the canvas matched to its container.
  useEffect(() => {
    if (!wrapRef.current) return undefined;
    const el = wrapRef.current;
    const ro = new ResizeObserver(() => {
      setSize({ width: el.clientWidth, height: el.clientHeight });
    });
    ro.observe(el);
    setSize({ width: el.clientWidth, height: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  // Record when each flare began so the ring can fade out over ~1s.
  useEffect(() => {
    const now = performance.now();
    flareIds.forEach((id) => {
      if (!flareStart.current.has(id)) flareStart.current.set(id, now);
    });
  }, [flareIds]);

  const graphData = useMemo(
    () => ({
      nodes: nodes.map((n) => ({ ...n, fx: n.x, fy: n.y })),
      links: links.map((l) => ({ ...l })),
    }),
    [nodes, links]
  );

  /** Ids directly connected to focusId, so "my constellation" can dim the rest. */
  const neighbours = useMemo(() => {
    if (!focusId) return null;
    const set = new Set([focusId]);
    links.forEach((l) => {
      const s = typeof l.source === 'object' ? l.source.id : l.source;
      const t = typeof l.target === 'object' ? l.target.id : l.target;
      if (s === focusId) set.add(t);
      if (t === focusId) set.add(s);
    });
    return set;
  }, [focusId, links]);

  const isLit = useCallback(
    (id) => {
      if (highlightIds && !highlightIds.has(id)) return false;
      if (neighbours && !neighbours.has(id)) return false;
      return true;
    },
    [highlightIds, neighbours]
  );

  const drawNode = useCallback(
    (node, ctx, globalScale) => {
      const lit = isLit(node.id);
      const hovered = hoverId === node.id;
      const base = colorFor(node.category);
      const r = radiusFor(node.connectionCount || 0);
      const alpha = lit ? brightnessFor(node.connectionCount || 0) : 0.12;

      // Glow halo.
      const glowR = r * (hovered ? 5 : 3.4);
      const grad = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, glowR);
      grad.addColorStop(0, hexToRgba(base, alpha * 0.55));
      grad.addColorStop(1, hexToRgba(base, 0));
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(node.x, node.y, glowR, 0, Math.PI * 2);
      ctx.fill();

      // Core.
      ctx.fillStyle = hexToRgba(base, Math.min(1, alpha + 0.25));
      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
      ctx.fill();

      // "You are here" ring.
      if (node.isMe) {
        ctx.strokeStyle = 'rgba(255,255,255,0.75)';
        ctx.lineWidth = 1.2 / globalScale;
        ctx.beginPath();
        ctx.arc(node.x, node.y, r + 4, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Flare on a brand new connection.
      const started = flareStart.current.get(node.id);
      if (started) {
        const t = (performance.now() - started) / 900;
        if (t < 1) {
          ctx.strokeStyle = hexToRgba('#ffffff', 0.8 * (1 - t));
          ctx.lineWidth = 2 / globalScale;
          ctx.beginPath();
          ctx.arc(node.x, node.y, r + 4 + t * 26, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          flareStart.current.delete(node.id);
        }
      }

      // Labels only once zoomed in, or on hover — otherwise the sky is unreadable.
      if ((globalScale > 1.6 || hovered) && lit) {
        const fontSize = Math.max(9, 11 / globalScale);
        ctx.font = `${fontSize}px Inter, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = hovered ? '#f1f5f9' : 'rgba(226,232,240,0.75)';
        ctx.fillText(node.name, node.x, node.y + r + 5);
      }
    },
    [hoverId, isLit]
  );

  const linkColor = useCallback(
    (link) => {
      const s = typeof link.source === 'object' ? link.source.id : link.source;
      const t = typeof link.target === 'object' ? link.target.id : link.target;
      const lit = isLit(s) && isLit(t);
      const touchesHover = hoverId && (s === hoverId || t === hoverId);
      if (!lit) return 'rgba(148,163,184,0.05)';
      if (touchesHover) return 'rgba(226,232,240,0.6)';
      return 'rgba(148,163,184,0.22)';
    },
    [hoverId, isLit]
  );

  /** Zoom the view onto one star. */
  const focusOn = useCallback((node) => {
    ref.current?.centerAt(node.x, node.y, 600);
    ref.current?.zoom(3.2, 600);
  }, []);

  useEffect(() => {
    // Fit the whole sky once data first arrives.
    if (nodes.length && ref.current) {
      const id = setTimeout(() => ref.current?.zoomToFit(600, 60), 250);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [nodes.length]);

  return (
    <div ref={wrapRef} className="sky-canvas h-full w-full">
      <ForceGraph2D
        ref={ref}
        width={size.width}
        height={size.height}
        graphData={graphData}
        backgroundColor="rgba(0,0,0,0)"
        cooldownTicks={0}
        d3AlphaDecay={1}
        d3VelocityDecay={1}
        enableNodeDrag={false}
        nodeRelSize={4}
        nodeCanvasObject={drawNode}
        nodePointerAreaPaint={(node, color, ctx) => {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(node.x, node.y, radiusFor(node.connectionCount || 0) + 6, 0, Math.PI * 2);
          ctx.fill();
        }}
        linkColor={linkColor}
        linkWidth={(l) => {
          const s = typeof l.source === 'object' ? l.source.id : l.source;
          const t = typeof l.target === 'object' ? l.target.id : l.target;
          return hoverId && (s === hoverId || t === hoverId) ? 1.6 : 0.7;
        }}
        onNodeHover={(node) => setHoverId(node ? node.id : null)}
        onNodeClick={(node) => {
          focusOn(node);
          onSelect?.(node);
        }}
        onBackgroundClick={() => onSelect?.(null)}
      />
    </div>
  );
}

function hexToRgba(hex, alpha) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const num = parseInt(full, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}
