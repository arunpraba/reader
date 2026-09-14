"use client";

import {
  Maximize2,
  Minimize2,
  RotateCcw,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  memo,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import { loadMermaid, mermaidSvgCache } from "../../lib/mermaid-loader";
import { useTheme } from "../theme-provider";

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 10;
const ZOOM_STEP = 0.25;
const ZOOM_DEFAULT = 1;

function clampZoom(value: number) {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(value * 100) / 100));
}

export const MermaidDiagram = memo(function MermaidDiagram({
  source,
}: {
  source: string;
}) {
  const reactId = useId().replace(/:/g, "");
  const { theme } = useTheme();
  const cacheKey = `${theme.kind}:${source}`;
  const [svg, setSvg] = useState("");
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [zoom, setZoom] = useState(ZOOM_DEFAULT);
  const stageRef = useRef<HTMLDivElement>(null);
  const displaySvg = mermaidSvgCache.get(cacheKey) ?? svg;

  const closeLightbox = useCallback(() => {
    setExpanded(false);
    setZoom(ZOOM_DEFAULT);
  }, []);

  const adjustZoom = useCallback((next: number) => {
    setZoom(clampZoom(next));
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mermaidSvgCache.has(cacheKey)) {
      setSvg(mermaidSvgCache.get(cacheKey) ?? "");
      setError(false);
      return;
    }

    let active = true;
    loadMermaid()
      .then(async (mermaid) => {
        const result = await mermaid.render(`mermaid-${reactId}`, source);
        mermaidSvgCache.set(cacheKey, result.svg);
        if (active) {
          setSvg(result.svg);
          setError(false);
        }
      })
      .catch(() => {
        if (active) setError(true);
      });

    return () => {
      active = false;
    };
  }, [cacheKey, reactId, source]);

  useEffect(() => {
    if (!expanded) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeLightbox();
        return;
      }
      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        setZoom((value) => clampZoom(value + ZOOM_STEP));
      }
      if (event.key === "-" || event.key === "_") {
        event.preventDefault();
        setZoom((value) => clampZoom(value - ZOOM_STEP));
      }
      if (event.key === "0") {
        event.preventDefault();
        setZoom(ZOOM_DEFAULT);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [closeLightbox, expanded]);

  useEffect(() => {
    if (!expanded) return;
    const stage = stageRef.current;
    if (!stage) return;
    const onWheel = (event: WheelEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return;
      event.preventDefault();
      const direction = event.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      setZoom((value) => clampZoom(value + direction));
    };
    stage.addEventListener("wheel", onWheel, { passive: false });
    return () => stage.removeEventListener("wheel", onWheel);
  }, [expanded]);

  if (error) {
    return (
      <pre className="mermaid-error">
        <code>{source}</code>
      </pre>
    );
  }

  const diagram = (
    <div
      className="mermaid-diagram"
      role="img"
      aria-label="Mermaid diagram"
      dangerouslySetInnerHTML={{ __html: displaySvg }}
    />
  );

  return (
    <>
      <div className="mermaid-frame">
        {diagram}
        {displaySvg ? (
          <button
            type="button"
            className="mermaid-zoom"
            onClick={(event) => {
              event.stopPropagation();
              setZoom(ZOOM_DEFAULT);
              setExpanded(true);
            }}
            onPointerUp={(event) => event.stopPropagation()}
            aria-label="Expand diagram"
            title="Expand diagram"
          >
            <Maximize2 size={16} aria-hidden="true" />
          </button>
        ) : null}
      </div>
      {mounted &&
        expanded &&
        createPortal(
          <div
            className="mermaid-lightbox"
            role="dialog"
            aria-modal="true"
            aria-label="Expanded diagram"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) closeLightbox();
            }}
          >
            <div className="mermaid-lightbox-toolbar">
              <div
                className="mermaid-zoom-controls"
                role="group"
                aria-label="Zoom"
              >
                <button
                  type="button"
                  className="mermaid-lightbox-tool"
                  onClick={() => adjustZoom(zoom - ZOOM_STEP)}
                  disabled={zoom <= ZOOM_MIN}
                  aria-label="Zoom out"
                  title="Zoom out (−)"
                >
                  <ZoomOut size={16} aria-hidden="true" />
                </button>
                <span className="mermaid-zoom-level" aria-live="polite">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  className="mermaid-lightbox-tool"
                  onClick={() => adjustZoom(zoom + ZOOM_STEP)}
                  disabled={zoom >= ZOOM_MAX}
                  aria-label="Zoom in"
                  title="Zoom in (+)"
                >
                  <ZoomIn size={16} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="mermaid-lightbox-tool"
                  onClick={() => setZoom(ZOOM_DEFAULT)}
                  disabled={zoom === ZOOM_DEFAULT}
                  aria-label="Reset zoom"
                  title="Reset zoom (0)"
                >
                  <RotateCcw size={15} aria-hidden="true" />
                </button>
              </div>
              <button
                type="button"
                className="mermaid-lightbox-tool"
                onClick={closeLightbox}
                aria-label="Collapse diagram"
                title="Collapse diagram"
              >
                <Minimize2 size={16} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="mermaid-lightbox-close"
                onClick={closeLightbox}
                aria-label="Close"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>
            <div className="mermaid-lightbox-stage" ref={stageRef}>
              <div
                className="mermaid-diagram mermaid-diagram-expanded"
                role="img"
                aria-label="Mermaid diagram"
                style={{ "--mermaid-zoom": String(zoom) } as CSSProperties}
                dangerouslySetInnerHTML={{ __html: displaySvg }}
              />
            </div>
          </div>,
          document.body,
        )}
    </>
  );
});
