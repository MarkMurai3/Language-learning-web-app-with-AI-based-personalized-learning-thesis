import { useEffect, useRef, useState } from "react";
import { getUser } from "../services/authStorage";

const STORAGE_KEY_BASE = "notes_widget_v1";

function keyForUser() {
  const u = getUser();
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

function clampSize(size) {
  const maxW = Math.max(280, window.innerWidth - 20);
  const maxH = Math.max(220, window.innerHeight - 20);

  return {
    w: Math.max(280, Math.min(size.w, maxW)),
    h: Math.max(220, Math.min(size.h, maxH)),
  };
}

function clampPosition(pos, size) {
  const pad = 10;
  const maxX = Math.max(pad, window.innerWidth - size.w - pad);
  const maxY = Math.max(pad, window.innerHeight - size.h - pad);

  return {
    x: Math.max(pad, Math.min(pos.x, maxX)),
    y: Math.max(pad, Math.min(pos.y, maxY)),
  };
}

export default function NotesWidget({ open, onClose }) {
  const saved = loadState();

  const initialSize = clampSize(saved?.size ?? { w: 380, h: 320 });
  const initialPos = clampPosition(saved?.pos ?? { x: 40, y: 120 }, initialSize);

  const [text, setText] = useState(saved?.text ?? "");
  const [pos, setPos] = useState(initialPos);
  const [size, setSize] = useState(initialSize);

  const draggingRef = useRef(false);
  const resizingRef = useRef(false);

  const dragOffsetRef = useRef({ dx: 0, dy: 0 });
  const resizeStartRef = useRef({ x: 0, y: 0, w: 0, h: 0 });

  useEffect(() => {
    saveState({ text, pos, size });
  }, [text, pos, size]);

  useEffect(() => {
    if (!open) return;

    const nextSize = clampSize(size);
    const nextPos = clampPosition(pos, nextSize);

    if (
      nextSize.w !== size.w ||
      nextSize.h !== size.h ||
      nextPos.x !== pos.x ||
      nextPos.y !== pos.y
    ) {
      setSize(nextSize);
      setPos(nextPos);
    }
  }, [open]);

  function onMouseDownHeader(e) {
    if (e.button !== 0) return;
    draggingRef.current = true;
    dragOffsetRef.current = {
      dx: e.clientX - pos.x,
      dy: e.clientY - pos.y,
    };
    e.preventDefault();
  }

  function onMouseDownResize(e) {
    if (e.button !== 0) return;
    resizingRef.current = true;
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      w: size.w,
      h: size.h,
    };
    e.preventDefault();
    e.stopPropagation();
  }

  useEffect(() => {
    function onMove(e) {
      if (draggingRef.current) {
        const next = clampPosition(
          {
            x: e.clientX - dragOffsetRef.current.dx,
            y: e.clientY - dragOffsetRef.current.dy,
          },
          size
        );
        setPos(next);
      }

      if (resizingRef.current) {
        const dx = e.clientX - resizeStartRef.current.x;
        const dy = e.clientY - resizeStartRef.current.y;

        const nextSize = clampSize({
          w: resizeStartRef.current.w + dx,
          h: resizeStartRef.current.h + dy,
        });

        setSize(nextSize);
        setPos((prev) => clampPosition(prev, nextSize));
      }
    }

    function onUp() {
      draggingRef.current = false;
      resizingRef.current = false;
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [size]);

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        zIndex: 9999,
        left: pos.x,
        top: pos.y,
        width: size.w,
        height: size.h,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        borderRadius: 18,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(15, 20, 38, 0.96)",
        boxShadow: "0 30px 80px rgba(0,0,0,0.55)",
        backdropFilter: "blur(14px)",
      }}
    >
      <div
        onMouseDown={onMouseDownHeader}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          padding: "12px 14px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.04)",
          cursor: "move",
          userSelect: "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              display: "grid",
              placeItems: "center",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.06)",
              fontSize: 16,
            }}
          >
            📝
          </div>
          <div>
            <div style={{ fontWeight: 800 }}>Notes</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)" }}>
              Private scratchpad
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={() => setText("")}
            style={{
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.92)",
              padding: "8px 10px",
              borderRadius: 12,
              cursor: "pointer",
            }}
          >
            Clear
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.92)",
              padding: "8px 10px",
              borderRadius: 12,
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write your notes here…"
        style={{
          flex: 1,
          width: "100%",
          border: "none",
          outline: "none",
          resize: "none",
          padding: 14,
          background: "transparent",
          color: "rgba(255,255,255,0.92)",
          font: "inherit",
          lineHeight: 1.5,
        }}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 14px",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.03)",
          color: "rgba(255,255,255,0.65)",
          fontSize: 12,
        }}
      >
        <span>Saved automatically</span>
        <span>Drag to move • Resize from corner</span>
      </div>

      <div
        onMouseDown={onMouseDownResize}
        style={{
          position: "absolute",
          right: 0,
          bottom: 0,
          width: 18,
          height: 18,
          cursor: "nwse-resize",
        }}
      />
    </div>
  );
}