import React, { useRef, useState, useEffect } from "react";
import {
  Pencil,
  Eraser,
  Square,
  Circle as CircleIcon,
  Minus,
  Undo2,
  Redo2,
  Trash2,
  Download,
  Layers as LayersIcon,
  Plus,
  Eye,
  EyeOff,
  X,
  MousePointer2,
  Type,
  Pipette,
  PaintBucket,
  ZoomIn,
  ZoomOut,
  Sun,
  Moon,
  Copy,
  GripVertical,
  Save,
  FolderOpen,
  FilePlus2,
} from "lucide-react";

const SIZE_PRESETS = [
  { label: "Small", w: 600, h: 400 },
  { label: "Medium", w: 900, h: 560 },
  { label: "Large", w: 1200, h: 750 },
];

const PRESET_COLORS = [
  "#000000",
  "#FF3B30",
  "#FF9500",
  "#FFCC00",
  "#34C759",
  "#0A84FF",
  "#5856D6",
  "#AF52DE",
  "#FFFFFF",
];

const TOOLS = [
  { id: "select", icon: MousePointer2, label: "Move (V)" },
  { id: "brush", icon: Pencil, label: "Brush (B)" },
  { id: "eraser", icon: Eraser, label: "Eraser (E)" },
  { id: "fill", icon: PaintBucket, label: "Fill (G)" },
  { id: "eyedropper", icon: Pipette, label: "Eyedropper (I)" },
  { id: "text", icon: Type, label: "Text (T)" },
  { id: "line", icon: Minus, label: "Line (L)" },
  { id: "rect", icon: Square, label: "Rectangle (R)" },
  { id: "circle", icon: CircleIcon, label: "Circle (C)" },
];

const BRUSH_TYPES = ["round", "marker", "spray", "calligraphy"];

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function getPos(e, canvas) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
}

function normalizeRect(a, b) {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    w: Math.abs(b.x - a.x),
    h: Math.abs(b.y - a.y),
  };
}

function pointInRect(p, r) {
  return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
}

function drawShape(ctx, tool, start, end, color, lineWidth) {
  ctx.filter = "none";
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  if (tool === "line") {
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  } else if (tool === "rect") {
    ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
  } else if (tool === "circle") {
    const cx = (start.x + end.x) / 2;
    const cy = (start.y + end.y) / 2;
    const rx = Math.abs(end.x - start.x) / 2;
    const ry = Math.abs(end.y - start.y) / 2;
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  const bigint = parseInt(
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h,
    16
  );
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}

function floodFill(ctx, canvas, startX, startY, fillColor, tolerance = 32) {
  const { width, height } = canvas;
  const sx = Math.floor(startX);
  const sy = Math.floor(startY);
  if (sx < 0 || sy < 0 || sx >= width || sy >= height) return;
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const startIdx = (sy * width + sx) * 4;
  const startR = data[startIdx];
  const startG = data[startIdx + 1];
  const startB = data[startIdx + 2];
  const startA = data[startIdx + 3];
  const fill = hexToRgb(fillColor);
  if (
    Math.abs(startR - fill.r) <= 1 &&
    Math.abs(startG - fill.g) <= 1 &&
    Math.abs(startB - fill.b) <= 1 &&
    startA === 255
  )
    return;

  const stack = [[sx, sy]];
  const match = (idx) =>
    Math.abs(data[idx] - startR) <= tolerance &&
    Math.abs(data[idx + 1] - startG) <= tolerance &&
    Math.abs(data[idx + 2] - startB) <= tolerance &&
    Math.abs(data[idx + 3] - startA) <= tolerance;

  while (stack.length) {
    const [x, y] = stack.pop();
    if (x < 0 || x >= width || y < 0 || y >= height) continue;
    const idx = (y * width + x) * 4;
    if (!match(idx)) continue;
    data[idx] = fill.r;
    data[idx + 1] = fill.g;
    data[idx + 2] = fill.b;
    data[idx + 3] = 255;
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  ctx.putImageData(imgData, 0, 0);
}

let idCounter = 1;

function IconButton({ title, active, onClick, children, dark, disabled }) {
  return (
    <div className="relative group shrink-0">
      <button
        aria-label={title}
        onClick={onClick}
        disabled={disabled}
        className={`p-2 rounded-full transition-colors ${
          active
            ? dark
              ? "bg-white/15 text-[#409CFF]"
              : "bg-white text-[#0A84FF] shadow"
            : dark
            ? "text-gray-300 hover:bg-white/10"
            : "text-gray-600 hover:bg-gray-100"
        } ${disabled ? "opacity-30 cursor-not-allowed" : ""}`}
      >
        {children}
      </button>
      <span
        className={`pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-1 whitespace-nowrap text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 ${
          dark ? "bg-white text-gray-900" : "bg-gray-900 text-white"
        }`}
      >
        {title}
      </span>
    </div>
  );
}

export default function App() {
  const [dark, setDark] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ w: 900, h: 560 });
  const [layers, setLayers] = useState([
    { id: 0, name: "Layer 1", visible: true, opacity: 1 },
  ]);
  const [activeLayerId, setActiveLayerId] = useState(0);
  const [tool, setTool] = useState("brush");
  const [color, setColor] = useState("#0A84FF");
  const [brushSize, setBrushSize] = useState(8);
  const [brushType, setBrushType] = useState("round");
  const [opacity, setOpacity] = useState(1);
  const [hardness, setHardness] = useState(1);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [panelOpen, setPanelOpen] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [spaceDown, setSpaceDown] = useState(false);
  const [selection, setSelection] = useState(null);
  const [draftSelection, setDraftSelection] = useState(null);
  const [movePreviewSrc, setMovePreviewSrc] = useState(null);
  const [movePos, setMovePos] = useState({ x: 0, y: 0 });
  const [textInput, setTextInput] = useState(null);
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [editingLayerId, setEditingLayerId] = useState(null);
  const [dragLayerId, setDragLayerId] = useState(null);
  const [toast, setToast] = useState("");

  const canvasRefs = useRef({});
  const overlayRef = useRef(null);
  const isDrawing = useRef(false);
  const isSelecting = useRef(false);
  const isMoving = useRef(false);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const startPos = useRef({ x: 0, y: 0 });
  const lastPos = useRef({ x: 0, y: 0 });
  const movingRef = useRef(null);
  const selStart = useRef({ x: 0, y: 0 });
  const pendingCopy = useRef(null);
  const pendingLoad = useRef(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 1800);
  };

  // reset transient interaction state when tool changes
  useEffect(() => {
    setSelection(null);
    setDraftSelection(null);
    setMovePreviewSrc(null);
    setTextInput(null);
  }, [tool]);

  // copy pixels for duplicated layers after DOM updates
  useEffect(() => {
    if (pendingCopy.current) {
      const { srcId, newId } = pendingCopy.current;
      const src = canvasRefs.current[srcId];
      const dst = canvasRefs.current[newId];
      if (src && dst) dst.getContext("2d").drawImage(src, 0, 0);
      pendingCopy.current = null;
    }
    if (pendingLoad.current) {
      pendingLoad.current.forEach((l) => {
        const canvas = canvasRefs.current[l.id];
        if (canvas && l.dataURL) {
          const img = new Image();
          img.onload = () => {
            const ctx = canvas.getContext("2d");
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
          };
          img.src = l.dataURL;
        }
      });
      pendingLoad.current = null;
    }
  }, [layers, canvasSize]);

  const pushHistory = (layerId) => {
    const canvas = canvasRefs.current[layerId];
    if (!canvas) return;
    const dataURL = canvas.toDataURL();
    setUndoStack((prev) => [...prev.slice(-29), { layerId, dataURL }]);
    setRedoStack([]);
  };

  const undo = () => {
    setUndoStack((prev) => {
      if (prev.length === 0) return prev;
      const entry = prev[prev.length - 1];
      const canvas = canvasRefs.current[entry.layerId];
      if (canvas) {
        const cur = canvas.toDataURL();
        setRedoStack((r) => [...r, { layerId: entry.layerId, dataURL: cur }]);
        const ctx = canvas.getContext("2d");
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
        };
        img.src = entry.dataURL;
      }
      return prev.slice(0, -1);
    });
  };

  const redo = () => {
    setRedoStack((prev) => {
      if (prev.length === 0) return prev;
      const entry = prev[prev.length - 1];
      const canvas = canvasRefs.current[entry.layerId];
      if (canvas) {
        const cur = canvas.toDataURL();
        setUndoStack((u) => [...u, { layerId: entry.layerId, dataURL: cur }]);
        const ctx = canvas.getContext("2d");
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
        };
        img.src = entry.dataURL;
      }
      return prev.slice(0, -1);
    });
  };

  const clearActiveLayer = () => {
    pushHistory(activeLayerId);
    const canvas = canvasRefs.current[activeLayerId];
    if (canvas) canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
  };

  const addLayer = () => {
    idCounter += 1;
    const newId = idCounter;
    setLayers((prev) => [
      ...prev,
      { id: newId, name: `Layer ${prev.length + 1}`, visible: true, opacity: 1 },
    ]);
    setActiveLayerId(newId);
  };

  const duplicateLayer = (id) => {
    const layer = layers.find((l) => l.id === id);
    if (!layer) return;
    idCounter += 1;
    const newId = idCounter;
    pendingCopy.current = { srcId: id, newId };
    setLayers((prev) => {
      const idx = prev.findIndex((l) => l.id === id);
      const next = [...prev];
      next.splice(idx + 1, 0, { ...layer, id: newId, name: `${layer.name} copy` });
      return next;
    });
    setActiveLayerId(newId);
  };

  const deleteLayer = (id) => {
    if (layers.length <= 1) return;
    setLayers((prev) => {
      const next = prev.filter((l) => l.id !== id);
      if (activeLayerId === id) setActiveLayerId(next[0].id);
      return next;
    });
    delete canvasRefs.current[id];
  };

  const toggleVisibility = (id) =>
    setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l)));

  const setLayerOpacity = (id, val) =>
    setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, opacity: val } : l)));

  const renameLayer = (id, name) =>
    setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, name } : l)));

  const reorderLayers = (draggedId, targetId) => {
    setLayers((prev) => {
      const draggedIdx = prev.findIndex((l) => l.id === draggedId);
      const targetIdx = prev.findIndex((l) => l.id === targetId);
      if (draggedIdx === -1 || targetIdx === -1) return prev;
      const next = [...prev];
      const [moved] = next.splice(draggedIdx, 1);
      next.splice(targetIdx, 0, moved);
      return next;
    });
  };

  const sprayDot = (ctx, pos) => {
    const density = Math.round(brushSize * 0.8) + 5;
    ctx.save();
    ctx.globalAlpha = opacity * 0.5;
    ctx.fillStyle = color;
    for (let i = 0; i < density; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * brushSize;
      const x = pos.x + Math.cos(angle) * radius;
      const y = pos.y + Math.sin(angle) * radius;
      ctx.beginPath();
      ctx.arc(x, y, Math.random() * 1.5 + 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };

  const applyBrushStroke = (ctx, curTool, pos) => {
    const isEraser = curTool === "eraser";
    ctx.lineCap = brushType === "marker" ? "square" : "round";
    ctx.lineJoin = "round";
    ctx.globalCompositeOperation = isEraser ? "destination-out" : "source-over";
    ctx.globalAlpha = isEraser ? 1 : opacity;
    ctx.filter = !isEraser && hardness < 1 ? `blur(${(1 - hardness) * 3}px)` : "none";
    ctx.strokeStyle = color;

    if (!isEraser && brushType === "spray") {
      sprayDot(ctx, pos);
    } else if (!isEraser && brushType === "calligraphy") {
      const last = lastPos.current;
      const dx = pos.x - last.x;
      const dy = pos.y - last.y;
      const angle = Math.atan2(dy, dx);
      const nib = Math.PI / 4;
      const w = Math.max(brushSize * 0.15, brushSize * Math.abs(Math.cos(angle - nib)));
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    } else {
      ctx.lineWidth = brushSize;
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }
    ctx.filter = "none";
    ctx.globalAlpha = 1;
  };

  const sampleColor = (pos) => {
    const tmp = document.createElement("canvas");
    tmp.width = canvasSize.w;
    tmp.height = canvasSize.h;
    const tctx = tmp.getContext("2d");
    tctx.fillStyle = "#ffffff";
    tctx.fillRect(0, 0, canvasSize.w, canvasSize.h);
    layers.forEach((l) => {
      if (!l.visible) return;
      const c = canvasRefs.current[l.id];
      if (!c) return;
      tctx.globalAlpha = l.opacity;
      tctx.drawImage(c, 0, 0);
      tctx.globalAlpha = 1;
    });
    const d = tctx.getImageData(Math.round(pos.x), Math.round(pos.y), 1, 1).data;
    return `#${[d[0], d[1], d[2]].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
  };

  const commitText = () => {
    if (!textInput || !textInput.value.trim()) {
      setTextInput(null);
      return;
    }
    const canvas = canvasRefs.current[activeLayerId];
    if (!canvas) {
      setTextInput(null);
      return;
    }
    pushHistory(activeLayerId);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = color;
    ctx.font = `${Math.max(12, brushSize * 3)}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    ctx.textBaseline = "top";
    ctx.fillText(textInput.value, textInput.canvasX, textInput.canvasY);
    setTextInput(null);
  };

  const handlePointerDown = (e) => {
    const activeCanvas = canvasRefs.current[activeLayerId];
    if (!activeCanvas) return;
    const pos = getPos(e, activeCanvas);

    if (spaceDown || e.button === 1) {
      isPanning.current = true;
      panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
      return;
    }

    if (tool === "brush" || tool === "eraser") {
      pushHistory(activeLayerId);
      isDrawing.current = true;
      startPos.current = pos;
      lastPos.current = pos;
      const ctx = activeCanvas.getContext("2d");
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      if (tool === "brush" && brushType === "spray") sprayDot(ctx, pos);
    } else if (tool === "line" || tool === "rect" || tool === "circle") {
      pushHistory(activeLayerId);
      isDrawing.current = true;
      startPos.current = pos;
      lastPos.current = pos;
    } else if (tool === "fill") {
      pushHistory(activeLayerId);
      floodFill(activeCanvas.getContext("2d"), activeCanvas, pos.x, pos.y, color);
    } else if (tool === "eyedropper") {
      setColor(sampleColor(pos));
    } else if (tool === "text") {
      setTextInput({ x: e.clientX, y: e.clientY, canvasX: pos.x, canvasY: pos.y, value: "" });
    } else if (tool === "select") {
      if (selection && pointInRect(pos, selection)) {
        pushHistory(activeLayerId);
        const ctx = activeCanvas.getContext("2d");
        const sel = selection;
        const imgData = ctx.getImageData(sel.x, sel.y, sel.w, sel.h);
        ctx.clearRect(sel.x, sel.y, sel.w, sel.h);
        const tmp = document.createElement("canvas");
        tmp.width = sel.w;
        tmp.height = sel.h;
        tmp.getContext("2d").putImageData(imgData, 0, 0);
        movingRef.current = {
          imageData: imgData,
          offsetX: pos.x - sel.x,
          offsetY: pos.y - sel.y,
          w: sel.w,
          h: sel.h,
        };
        setMovePreviewSrc(tmp.toDataURL());
        setMovePos({ x: sel.x, y: sel.y });
        isMoving.current = true;
      } else {
        isSelecting.current = true;
        selStart.current = pos;
        setDraftSelection({ x: pos.x, y: pos.y, w: 0, h: 0 });
        setSelection(null);
        setMovePreviewSrc(null);
      }
    }
  };

  const handlePointerMove = (e) => {
    if (isPanning.current) {
      setPan({ x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y });
      return;
    }
    const activeCanvas = canvasRefs.current[activeLayerId];
    if (!activeCanvas) return;
    const pos = getPos(e, activeCanvas);

    if (tool === "brush" || tool === "eraser") {
      if (!isDrawing.current) return;
      const ctx = activeCanvas.getContext("2d");
      applyBrushStroke(ctx, tool, pos);
      lastPos.current = pos;
    } else if (tool === "line" || tool === "rect" || tool === "circle") {
      if (!isDrawing.current) return;
      const overlay = overlayRef.current;
      const octx = overlay.getContext("2d");
      octx.clearRect(0, 0, overlay.width, overlay.height);
      drawShape(octx, tool, startPos.current, pos, color, brushSize);
      lastPos.current = pos;
    } else if (tool === "select") {
      if (isSelecting.current) {
        setDraftSelection(normalizeRect(selStart.current, pos));
      } else if (isMoving.current) {
        const m = movingRef.current;
        setMovePos({ x: pos.x - m.offsetX, y: pos.y - m.offsetY });
      }
    }
  };

  const handlePointerUp = () => {
    if (isPanning.current) {
      isPanning.current = false;
      return;
    }
    const activeCanvas = canvasRefs.current[activeLayerId];
    if (!activeCanvas) return;

    if (tool === "brush" || tool === "eraser") {
      isDrawing.current = false;
      activeCanvas.getContext("2d").globalCompositeOperation = "source-over";
    } else if (tool === "line" || tool === "rect" || tool === "circle") {
      if (!isDrawing.current) return;
      isDrawing.current = false;
      const ctx = activeCanvas.getContext("2d");
      drawShape(ctx, tool, startPos.current, lastPos.current, color, brushSize);
      const overlay = overlayRef.current;
      overlay.getContext("2d").clearRect(0, 0, overlay.width, overlay.height);
    } else if (tool === "select") {
      if (isSelecting.current) {
        isSelecting.current = false;
        setDraftSelection((cur) => {
          setSelection(cur && cur.w > 2 && cur.h > 2 ? cur : null);
          return null;
        });
      } else if (isMoving.current) {
        isMoving.current = false;
        const m = movingRef.current;
        if (m) {
          const ctx = activeCanvas.getContext("2d");
          setMovePos((cur) => {
            ctx.putImageData(m.imageData, Math.round(cur.x), Math.round(cur.y));
            setSelection({ x: Math.round(cur.x), y: Math.round(cur.y), w: m.w, h: m.h });
            return cur;
          });
        }
        setMovePreviewSrc(null);
        movingRef.current = null;
      }
    }
  };

  const exportImage = () => {
    const out = document.createElement("canvas");
    out.width = canvasSize.w;
    out.height = canvasSize.h;
    const ctx = out.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvasSize.w, canvasSize.h);
    layers.forEach((layer) => {
      if (!layer.visible) return;
      const canvas = canvasRefs.current[layer.id];
      if (!canvas) return;
      ctx.globalAlpha = layer.opacity;
      ctx.drawImage(canvas, 0, 0);
      ctx.globalAlpha = 1;
    });
    out.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "painting.png";
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  const saveProject = () => {
    const proj = {
      canvasSize,
      layers: layers.map((l) => ({
        ...l,
        dataURL: canvasRefs.current[l.id] ? canvasRefs.current[l.id].toDataURL() : null,
      })),
    };
    try {
      localStorage.setItem("apple-paint-project", JSON.stringify(proj));
      showToast("Project saved");
    } catch {
      showToast("Save failed (storage full)");
    }
  };

  const loadProject = () => {
    const raw = localStorage.getItem("apple-paint-project");
    if (!raw) {
      showToast("No saved project found");
      return;
    }
    const proj = JSON.parse(raw);
    pendingLoad.current = proj.layers;
    setCanvasSize(proj.canvasSize);
    setLayers(proj.layers.map(({ dataURL, ...rest }) => rest));
    setActiveLayerId(proj.layers[0] ? proj.layers[0].id : 0);
    setUndoStack([]);
    setRedoStack([]);
    showToast("Project loaded");
  };

  const startNewProject = (size) => {
    idCounter += 1;
    const newId = idCounter;
    setCanvasSize(size);
    setLayers([{ id: newId, name: "Layer 1", visible: true, opacity: 1 }]);
    setActiveLayerId(newId);
    setUndoStack([]);
    setRedoStack([]);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setNewProjectOpen(false);
  };

  useEffect(() => {
    const onKeyDown = (e) => {
      const tag = document.activeElement.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === " ") {
        setSpaceDown(true);
        e.preventDefault();
        return;
      }
      if (e.ctrlKey || e.metaKey) {
        if (e.key.toLowerCase() === "z") {
          e.preventDefault();
          e.shiftKey ? redo() : undo();
        } else if (e.key.toLowerCase() === "y") {
          e.preventDefault();
          redo();
        } else if (e.key.toLowerCase() === "s") {
          e.preventDefault();
          exportImage();
        } else if (e.key.toLowerCase() === "d") {
          e.preventDefault();
          duplicateLayer(activeLayerId);
        } else if (e.key === "=" || e.key === "+") {
          e.preventDefault();
          setZoom((z) => clamp(z + 0.1, 0.25, 4));
        } else if (e.key === "-") {
          e.preventDefault();
          setZoom((z) => clamp(z - 0.1, 0.25, 4));
        } else if (e.key === "0") {
          e.preventDefault();
          setZoom(1);
          setPan({ x: 0, y: 0 });
        }
        return;
      }
      switch (e.key.toLowerCase()) {
        case "v":
          setTool("select");
          break;
        case "b":
          setTool("brush");
          break;
        case "e":
          setTool("eraser");
          break;
        case "g":
          setTool("fill");
          break;
        case "i":
          setTool("eyedropper");
          break;
        case "t":
          setTool("text");
          break;
        case "l":
          setTool("line");
          break;
        case "r":
          setTool("rect");
          break;
        case "c":
          setTool("circle");
          break;
        case "[":
          setBrushSize((s) => clamp(s - 2, 1, 80));
          break;
        case "]":
          setBrushSize((s) => clamp(s + 2, 1, 80));
          break;
        default:
          break;
      }
    };
    const onKeyUp = (e) => {
      if (e.key === " ") setSpaceDown(false);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  });

  const rootBg = dark
    ? "bg-gradient-to-b from-gray-950 to-black"
    : "bg-gradient-to-b from-gray-100 to-gray-200";
  const toolbarBg = dark ? "bg-gray-900/70 border-white/10" : "bg-white/70 border-black/10";
  const textMain = dark ? "text-gray-100" : "text-gray-800";
  const panelBg = dark ? "bg-gray-900/85 border-white/10" : "bg-white/85 border-black/10";
  const cardBg = dark ? "bg-gray-800/80 border-white/5" : "bg-white border-black/5";
  const cardActive = dark ? "bg-[#0A84FF]/20 border-[#0A84FF]/40" : "bg-blue-50 border-[#0A84FF]/40";

  return (
    <div className={`min-h-screen w-full ${rootBg} flex flex-col items-center font-sans select-none`}>
      {/* Nav bar row 1 */}
      <div className={`sticky top-0 z-40 w-full flex justify-center backdrop-blur-xl ${toolbarBg} border-b shadow-sm`}>
        <div className="w-full max-w-6xl flex items-center gap-2 px-4 py-2 overflow-x-auto">
          <span className={`text-[15px] font-semibold ${textMain} mr-1 whitespace-nowrap`}>Paint Pro</span>

          <div className="flex items-center gap-1">
            <IconButton title="New" onClick={() => setNewProjectOpen(true)} dark={dark}>
              <FilePlus2 size={16} />
            </IconButton>
            <IconButton title="Save" onClick={saveProject} dark={dark}>
              <Save size={16} />
            </IconButton>
            <IconButton title="Load" onClick={loadProject} dark={dark}>
              <FolderOpen size={16} />
            </IconButton>
          </div>

          <div className={`h-6 w-px ${dark ? "bg-white/10" : "bg-black/10"} mx-1`} />

          <div className={`flex items-center rounded-full p-1 gap-0.5 ${dark ? "bg-white/5" : "bg-gray-100/80"}`}>
            {TOOLS.map(({ id, icon: Icon, label }) => (
              <IconButton key={id} title={label} active={tool === id} onClick={() => setTool(id)} dark={dark}>
                <Icon size={16} strokeWidth={2} />
              </IconButton>
            ))}
          </div>

          <div className={`h-6 w-px ${dark ? "bg-white/10" : "bg-black/10"} mx-1`} />

          <div className="flex items-center gap-1.5">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-5 h-5 rounded-full border ${
                  color === c ? "ring-2 ring-[#0A84FF] ring-offset-1" : "border-black/10"
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-6 h-6 rounded-full overflow-hidden cursor-pointer border border-black/10"
            />
          </div>

          <div className={`h-6 w-px ${dark ? "bg-white/10" : "bg-black/10"} mx-1`} />

          <IconButton title="Undo (Ctrl+Z)" onClick={undo} dark={dark} disabled={undoStack.length === 0}>
            <Undo2 size={16} />
          </IconButton>
          <IconButton title="Redo (Ctrl+Shift+Z)" onClick={redo} dark={dark} disabled={redoStack.length === 0}>
            <Redo2 size={16} />
          </IconButton>
          <IconButton title="Clear layer" onClick={clearActiveLayer} dark={dark}>
            <Trash2 size={16} />
          </IconButton>
          <IconButton title="Layers" active={panelOpen} onClick={() => setPanelOpen((p) => !p)} dark={dark}>
            <LayersIcon size={16} />
          </IconButton>
          <IconButton title={dark ? "Light mode" : "Dark mode"} onClick={() => setDark((d) => !d)} dark={dark}>
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </IconButton>

          <button
            onClick={exportImage}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#0A84FF] text-white text-[13px] font-medium hover:bg-[#0074E0] whitespace-nowrap ml-1"
          >
            <Download size={15} /> Export
          </button>
        </div>
      </div>

      {/* Nav bar row 2: brush settings + zoom */}
      <div className={`sticky top-[45px] z-30 w-full flex justify-center backdrop-blur-xl ${toolbarBg} border-b`}>
        <div className="w-full max-w-6xl flex items-center gap-3 px-4 py-1.5 overflow-x-auto text-[12px]">
          {(tool === "brush" || tool === "eraser") && (
            <>
              {tool === "brush" && (
                <div className="flex items-center gap-1.5">
                  <span className={dark ? "text-gray-400" : "text-gray-500"}>Type</span>
                  <select
                    value={brushType}
                    onChange={(e) => setBrushType(e.target.value)}
                    className={`rounded-md px-1.5 py-0.5 border text-[12px] ${
                      dark ? "bg-gray-800 border-white/10 text-gray-100" : "bg-white border-black/10"
                    }`}
                  >
                    {BRUSH_TYPES.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <span className={dark ? "text-gray-400" : "text-gray-500"}>Size</span>
                <span
                  className="rounded-full bg-gray-500 inline-block"
                  style={{ width: Math.min(brushSize, 20), height: Math.min(brushSize, 20) }}
                />
                <input
                  type="range"
                  min={1}
                  max={80}
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  className="w-20 accent-[#0A84FF]"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className={dark ? "text-gray-400" : "text-gray-500"}>Opacity</span>
                <input
                  type="range"
                  min={0.05}
                  max={1}
                  step={0.05}
                  value={opacity}
                  onChange={(e) => setOpacity(Number(e.target.value))}
                  className="w-16 accent-[#0A84FF]"
                />
              </div>
              {tool === "brush" && (
                <div className="flex items-center gap-1.5">
                  <span className={dark ? "text-gray-400" : "text-gray-500"}>Hardness</span>
                  <input
                    type="range"
                    min={0.1}
                    max={1}
                    step={0.05}
                    value={hardness}
                    onChange={(e) => setHardness(Number(e.target.value))}
                    className="w-16 accent-[#0A84FF]"
                  />
                </div>
              )}
              <div className={`h-5 w-px ${dark ? "bg-white/10" : "bg-black/10"}`} />
            </>
          )}

          <div className="flex items-center gap-1 ml-auto">
            <IconButton title="Zoom out (Ctrl -)" onClick={() => setZoom((z) => clamp(z - 0.1, 0.25, 4))} dark={dark}>
              <ZoomOut size={15} />
            </IconButton>
            <button
              onClick={() => {
                setZoom(1);
                setPan({ x: 0, y: 0 });
              }}
              className={`text-[11px] w-12 text-center ${dark ? "text-gray-300" : "text-gray-600"}`}
            >
              {Math.round(zoom * 100)}%
            </button>
            <IconButton title="Zoom in (Ctrl +)" onClick={() => setZoom((z) => clamp(z + 0.1, 0.25, 4))} dark={dark}>
              <ZoomIn size={15} />
            </IconButton>
            <span className={`ml-2 text-[11px] whitespace-nowrap ${dark ? "text-gray-500" : "text-gray-400"}`}>
              hold Space to pan
            </span>
          </div>
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 w-full flex items-start justify-center gap-6 py-8 px-4">
        <div
          className="relative overflow-hidden rounded-2xl shadow-xl border border-black/10"
          style={{ width: canvasSize.w, height: canvasSize.h }}
          onWheel={(e) => {
            if (e.ctrlKey) {
              e.preventDefault();
              setZoom((z) => clamp(z + (e.deltaY < 0 ? 0.1 : -0.1), 0.25, 4));
            }
          }}
        >
          <div
            className="relative bg-white"
            style={{
              width: canvasSize.w,
              height: canvasSize.h,
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "center center",
              cursor: spaceDown ? "grab" : tool === "text" ? "text" : "crosshair",
            }}
          >
            {layers.map((layer) => (
              <canvas
                key={layer.id}
                ref={(el) => {
                  if (el) canvasRefs.current[layer.id] = el;
                }}
                width={canvasSize.w}
                height={canvasSize.h}
                className="absolute inset-0"
                style={{
                  width: canvasSize.w,
                  height: canvasSize.h,
                  display: layer.visible ? "block" : "none",
                  opacity: layer.opacity,
                }}
              />
            ))}
            <canvas
              ref={overlayRef}
              width={canvasSize.w}
              height={canvasSize.h}
              className="absolute inset-0"
              style={{ width: canvasSize.w, height: canvasSize.h }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            />

            {draftSelection && (
              <div
                className="absolute border-2 border-dashed border-[#0A84FF] pointer-events-none"
                style={{
                  left: draftSelection.x,
                  top: draftSelection.y,
                  width: draftSelection.w,
                  height: draftSelection.h,
                }}
              />
            )}
            {selection && !movePreviewSrc && (
              <div
                className="absolute border-2 border-dashed border-[#0A84FF] pointer-events-none"
                style={{ left: selection.x, top: selection.y, width: selection.w, height: selection.h }}
              />
            )}
            {movePreviewSrc && (
              <img
                src={movePreviewSrc}
                alt=""
                className="absolute pointer-events-none border-2 border-dashed border-[#0A84FF]"
                style={{ left: movePos.x, top: movePos.y }}
              />
            )}
          </div>
        </div>

        {/* Layers panel */}
        {panelOpen && (
          <div className={`w-64 backdrop-blur-xl rounded-2xl shadow-xl border p-3 sticky top-24 ${panelBg}`}>
            <div className="flex items-center justify-between mb-2 px-1">
              <span className={`text-[13px] font-semibold ${textMain}`}>Layers</span>
              <IconButton title="Add layer" onClick={addLayer} dark={dark}>
                <Plus size={15} />
              </IconButton>
            </div>
            <div className="flex flex-col gap-1.5 max-h-[440px] overflow-y-auto">
              {[...layers].reverse().map((layer) => (
                <div
                  key={layer.id}
                  draggable
                  onDragStart={() => setDragLayerId(layer.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (dragLayerId && dragLayerId !== layer.id) reorderLayers(dragLayerId, layer.id);
                    setDragLayerId(null);
                  }}
                  onClick={() => setActiveLayerId(layer.id)}
                  className={`rounded-xl px-2 py-2 cursor-pointer border transition-colors ${
                    activeLayerId === layer.id ? cardActive : cardBg + " hover:opacity-90"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <GripVertical size={13} className={dark ? "text-gray-500" : "text-gray-400"} />
                    {editingLayerId === layer.id ? (
                      <input
                        autoFocus
                        defaultValue={layer.name}
                        onClick={(e) => e.stopPropagation()}
                        onBlur={(e) => {
                          renameLayer(layer.id, e.target.value || layer.name);
                          setEditingLayerId(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") e.target.blur();
                        }}
                        className={`flex-1 text-[13px] px-1 rounded border ${
                          dark ? "bg-gray-700 border-white/10 text-gray-100" : "bg-white border-black/10"
                        }`}
                      />
                    ) : (
                      <span
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          setEditingLayerId(layer.id);
                        }}
                        className={`flex-1 text-[13px] truncate ${textMain}`}
                      >
                        {layer.name}
                      </span>
                    )}
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateLayer(layer.id);
                        }}
                        className={dark ? "p-1 text-gray-400 hover:text-gray-100" : "p-1 text-gray-500 hover:text-gray-800"}
                      >
                        <Copy size={13} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleVisibility(layer.id);
                        }}
                        className={dark ? "p-1 text-gray-400 hover:text-gray-100" : "p-1 text-gray-500 hover:text-gray-800"}
                      >
                        {layer.visible ? <Eye size={13} /> : <EyeOff size={13} />}
                      </button>
                      {layers.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteLayer(layer.id);
                          }}
                          className="p-1 text-gray-400 hover:text-red-500"
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={layer.opacity}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setLayerOpacity(layer.id, Number(e.target.value))}
                    className="w-full mt-1 accent-[#0A84FF]"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Text tool floating input */}
      {textInput && (
        <input
          autoFocus
          value={textInput.value}
          onChange={(e) => setTextInput({ ...textInput, value: e.target.value })}
          onBlur={commitText}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitText();
            if (e.key === "Escape") setTextInput(null);
          }}
          style={{ position: "fixed", left: textInput.x, top: textInput.y, zIndex: 100 }}
          className="px-1.5 py-0.5 border-2 border-[#0A84FF] rounded text-sm bg-white text-black outline-none"
          placeholder="Type..."
        />
      )}

      {/* New project modal */}
      {newProjectOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40">
          <div className={`rounded-2xl shadow-2xl border p-5 w-80 ${panelBg}`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-[14px] font-semibold ${textMain}`}>New Project</span>
              <button onClick={() => setNewProjectOpen(false)} className={dark ? "text-gray-400" : "text-gray-500"}>
                <X size={16} />
              </button>
            </div>
            <p className={`text-[12px] mb-3 ${dark ? "text-gray-400" : "text-gray-500"}`}>
              This clears the current canvas. Export or save first if you want to keep it.
            </p>
            <div className="flex flex-col gap-2">
              {SIZE_PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => startNewProject({ w: p.w, h: p.h })}
                  className={`text-left px-3 py-2 rounded-xl border text-[13px] transition-colors ${cardBg} ${textMain} hover:border-[#0A84FF]/50`}
                >
                  {p.label} — {p.w} × {p.h}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] bg-gray-900 text-white text-[13px] px-4 py-2 rounded-full shadow-lg animate-pulse">
          {toast}
        </div>
      )}
    </div>
  );
}
