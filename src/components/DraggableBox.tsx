import { useRef, useState, useCallback, useEffect } from 'react';

interface Position {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DraggableBoxProps {
  initial: Position;
  minWidth?: number;
  minHeight?: number;
  containerRef?: React.RefObject<HTMLElement | null>;
  className?: string;
  extraStyle?: React.CSSProperties;
  children: React.ReactNode;
  resizable?: boolean;
}

export function DraggableBox({
  initial,
  minWidth = 200,
  minHeight = 40,
  containerRef,
  className = '',
  extraStyle,
  children,
  resizable = true,
}: DraggableBoxProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<Position>(initial);
  const [initialized, setInitialized] = useState(false);
  const dragging = useRef(false);
  const resizeHandle = useRef<string | false>(false);
  const startRef = useRef({ mx: 0, my: 0, x: 0, y: 0, w: 0, h: 0 });

  // Auto-center on first render when initial x/y is -1
  useEffect(() => {
    if (initialized) return;
    const container = containerRef?.current;
    const box = boxRef.current;
    if (!container || !box) return;

    const cr = container.getBoundingClientRect();
    const br = box.getBoundingClientRect();

    // -1 = center, -2 = bottom-right, -3 = center-x + below-center-y
    const centerX = initial.x < 0 ? Math.max(0,
      initial.x === -2 ? cr.width - br.width - 16 : (cr.width - br.width) / 2
    ) : initial.x;
    const centerY = initial.y < 0 ? Math.max(0,
      initial.y === -2 ? cr.height - br.height - 16
      : initial.y === -3 ? (cr.height * 0.5) + 80
      : (cr.height - br.height) / 2
    ) : initial.y;

    setPos((p) => ({ ...p, x: centerX, y: centerY }));
    setInitialized(true);
  });

  const getBounds = useCallback(() => {
    if (containerRef?.current) {
      const r = containerRef.current.getBoundingClientRect();
      return { w: r.width, h: r.height };
    }
    return { w: window.innerWidth, h: window.innerHeight };
  }, [containerRef]);

  const onDragStart = useCallback(
    (e: React.PointerEvent) => {
      if ((e.target as HTMLElement).closest('.resize-handle')) return;
      // Allow clicks on buttons/inputs/sliders to pass through
      const el = e.target as HTMLElement;
      if (el.closest('button') || el.closest('input') || el.closest('select')) return;

      e.preventDefault();
      dragging.current = true;
      startRef.current = { mx: e.clientX, my: e.clientY, x: pos.x, y: pos.y, w: pos.width, h: pos.height };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [pos]
  );

  const onResizeStart = useCallback(
    (e: React.PointerEvent, handle: string) => {
      e.preventDefault();
      e.stopPropagation();
      resizeHandle.current = handle;
      startRef.current = { mx: e.clientX, my: e.clientY, x: pos.x, y: pos.y, w: pos.width, h: pos.height };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [pos]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current && !resizeHandle.current) return;
      e.preventDefault();

      const dx = e.clientX - startRef.current.mx;
      const dy = e.clientY - startRef.current.my;
      const bounds = getBounds();

      if (dragging.current) {
        setPos((s) => ({
          ...s,
          x: Math.max(0, Math.min(bounds.w - 100, startRef.current.x + dx)),
          y: Math.max(0, Math.min(bounds.h - 40, startRef.current.y + dy)),
        }));
      }

      if (resizeHandle.current) {
        const h = resizeHandle.current;
        let newW = startRef.current.w;
        let newH = startRef.current.h;
        let newX = startRef.current.x;
        let newY = startRef.current.y;

        if (h.includes('e')) newW = Math.max(minWidth, startRef.current.w + dx);
        if (h.includes('w')) {
          newW = Math.max(minWidth, startRef.current.w - dx);
          newX = startRef.current.x + (startRef.current.w - newW);
        }
        if (h.includes('s')) newH = Math.max(minHeight, startRef.current.h + dy);
        if (h.includes('n')) {
          newH = Math.max(minHeight, startRef.current.h - dy);
          newY = startRef.current.y + (startRef.current.h - newH);
        }

        setPos({ x: newX, y: newY, width: newW, height: newH });
      }
    },
    [getBounds, minWidth, minHeight]
  );

  const onPointerUp = useCallback(() => {
    dragging.current = false;
    resizeHandle.current = false;
  }, []);

  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${pos.x}px`,
    top: `${pos.y}px`,
    ...(pos.width > 0 ? { width: `${pos.width}px` } : {}),
    ...(pos.height > 0 ? { height: `${pos.height}px` } : {}),
    ...(pos.x < 0 ? { visibility: 'hidden' as const } : {}),
    ...extraStyle,
  };

  return (
    <div
      ref={boxRef}
      className={`draggable-box ${className}`}
      style={style}
      onPointerDown={onDragStart}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {children}
      {resizable && (
        <>
          <div className="resize-handle resize-handle--e" onPointerDown={(e) => onResizeStart(e, 'e')} />
          <div className="resize-handle resize-handle--w" onPointerDown={(e) => onResizeStart(e, 'w')} />
          <div className="resize-handle resize-handle--s" onPointerDown={(e) => onResizeStart(e, 's')} />
          <div className="resize-handle resize-handle--se" onPointerDown={(e) => onResizeStart(e, 'se')} />
        </>
      )}
    </div>
  );
}
