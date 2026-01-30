import { useEffect, useRef, useState } from "react";
import { getUser } from "../services/authStorage";

const STORAGE_KEY_BASE = "notes_widget_v1";

function keyForUser() {
  const u = getUser();
  // if logged out, still allow notes but store separately
  return `${STORAGE_KEY_BASE}:${u?.id || "guest"}`;
}

function loadState() {
  try {
    const raw = localStorage.getItem(keyForUser());
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveState(state) {
  try {
    localStorage.setItem(keyForUser(), JSON.stringify(state));
  } catch {}
}

export default function NotesWidget({ open, onClose }) {
  const saved = loadState();

  const [text, setText] = useState(saved?.text ?? "");
  const [pos, setPos] = useState(saved?.pos ?? { x: 40, y: 120 });
  const [size, setSize] = useState(saved?.size ?? { w: 360, h: 280 });

  // Drag state
  const draggingRef = useRef(false);
  const dragOffsetRef = useRef({ dx: 0, dy: 0 });

  // Save to localStorage whenever something changes
  useEffect(() => {
    saveState({ text, pos, size });
  }, [text, pos, size]);

  // Keep the widget inside viewport a bit
  function clampToViewport(nextPos) {
    const pad = 10;
    const maxX = window.innerWidth - pad;
    const maxY = window.innerHeight - pad;
    return {
      x: Math.max(pad, Math.min(nextPos.x, maxX)),
      y: Math.max(pad, Math.min(nextPos.y, maxY)),
    };
  }

  function onMouseDownHeader(e) {
    // Only left click
    if (e.button !== 0) return;
    draggingRef.current = true;
    dragOffsetRef.current = {
      dx: e.clientX - pos.x,
      dy: e.clientY - pos.y,
    };
    e.preventDefault();
  }

  useEffect(() => {
    function onMove(e) {
      if (!draggingRef.current) return;
      const next = clampToViewport({
        x: e.clientX - dragOffsetRef.current.dx,
        y: e.clientY - dragOffsetRef.current.dy,
      });
      setPos(next);
    }

    function onUp() {
      draggingRef.current = false;
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [pos]);

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: pos.x,
        top: pos.y,
        width: size.w,
        height: size.h,
        border: "1px solid #ddd",
        borderRadius: 10,
        background: "white",
        boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
        display: "flex",
        flexDirection: "column",
        zIndex: 9999,
        overflow: "hidden",
      }}
    >
      {/* Header (drag handle) */}
      <div
        onMouseDown={onMouseDownHeader}
        style={{
          cursor: "move",
          padding: "10px 10px",
          background: "#f7f7f7",
          borderBottom: "1px solid #eee",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          userSelect: "none",
        }}
      >
        <div style={{ fontWeight: 700 }}>Notes</div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={() => setText("")}
            style={{ fontSize: 12 }}
            title="Clear notes"
          >
            Clear
          </button>
          <button type="button" onClick={onClose} style={{ fontSize: 12 }} title="Close">
            ✕
          </button>
        </div>
      </div>

      {/* Body */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write your notes here…"
        style={{
          flex: 1,
          padding: 10,
          border: "none",
          outline: "none",
          resize: "none",
          fontFamily: "inherit",
          fontSize: 14,
        }}
      />

      {/* Resize handle area */}
      <div
        style={{
          height: 16,
          borderTop: "1px solid #eee",
          background: "#fafafa",
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          paddingRight: 6,
        }}
      >
        <div style={{ fontSize: 12, opacity: 0.6 }}>↘ resize</div>
      </div>

      {/* CSS resize overlay (simple and works everywhere) */}
      <div
        style={{
          position: "absolute",
          right: 0,
          bottom: 0,
          width: 18,
          height: 18,
          cursor: "nwse-resize",
          resize: "both",
          overflow: "hidden",
        }}
        // This element gives a native resize affordance in many browsers
      />

      {/* Sync size with element's actual box using ResizeObserver */}
      <ResizeWatcher onResize={(w, h) => setSize({ w, h })} />
    </div>
  );
}

/**
 * Watches parent size so our size state stays in sync after user resize.
 */
function ResizeWatcher({ onResize }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;

    const el = ref.current.parentElement;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const cr = entry.contentRect;
        onResize(Math.round(cr.width), Math.round(cr.height));
      }
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, [onResize]);

  return <div ref={ref} />;
}
