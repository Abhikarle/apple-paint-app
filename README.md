<div align="center">

# 🎨 Paint Pro

**A polished, layer-based paint application with an Apple-inspired interface.**

Built with React, Tailwind CSS, and Vite.

</div>

---

## Overview

Paint Pro is a browser-based digital painting app inspired by macOS/iOS design language — a translucent, blurred toolbar, SF-style iconography, and a clean two-panel layout (canvas + layers). It supports a full non-destructive layer workflow, multiple brush engines, shape and selection tools, zoom/pan navigation, and local save/load of projects.

## ✨ Features

### Tools
| Tool | Shortcut | Description |
|---|---|---|
| Move / Select | `V` | Marquee-select a region and drag to move pixels |
| Brush | `B` | Freehand painting with 4 brush engines |
| Eraser | `E` | Soft or hard erase on the active layer |
| Fill Bucket | `G` | Flood fill with adjustable tolerance |
| Eyedropper | `I` | Sample a color from the composited canvas |
| Text | `T` | Click-to-place text in the active color |
| Line | `L` | Straight lines |
| Rectangle | `R` | Rectangle outlines |
| Circle | `C` | Ellipses/circles |

### Brushes
- **Round** — standard soft/hard round brush (hardness-adjustable edge blur)
- **Marker** — flat-cap, high-opacity stroke
- **Spray** — scattered dot airbrush effect
- **Calligraphy** — angle-sensitive nib with dynamic width

Each brush supports independent **size**, **opacity**, and **hardness** controls.

### Layers
- Add, delete, duplicate, and rename layers (double-click name to edit)
- Drag-and-drop reordering
- Per-layer visibility toggle and opacity slider
- Full undo/redo history per layer

### Canvas
- Zoom via buttons, `Ctrl` + scroll, or `Ctrl` `+` / `-`
- Pan by holding `Space` and dragging
- Multiple canvas size presets (Small / Medium / Large) via New Project

### Project Management
- **Save / Load** — persists the full layer stack to browser `localStorage`
- **Export** — flattens all visible layers to a downloadable PNG
- **Dark mode** toggle

### Keyboard Shortcuts
| Action | Shortcut |
|---|---|
| Switch tool | `V` `B` `E` `G` `I` `T` `L` `R` `C` |
| Undo / Redo | `Ctrl+Z` / `Ctrl+Shift+Z` |
| Duplicate active layer | `Ctrl+D` |
| Export PNG | `Ctrl+S` |
| Decrease / increase brush size | `[` / `]` |
| Zoom in / out / reset | `Ctrl+` `=`/`-`/`0` |
| Pan | Hold `Space` + drag |

## 🖥️ Screenshots

*(Add screenshots or a screen recording here once you've run the app.)*

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) 18+ and npm

### Installation

```bash
git clone https://github.com/<your-username>/apple-paint-app.git
cd apple-paint-app
npm install
```

### Development

```bash
npm run dev
```

Open the URL Vite prints (typically `http://localhost:5173`).

### Production build

```bash
npm run build
npm run preview
```

## 🛠️ Tech Stack

- **[React 18](https://react.dev/)** — UI library
- **[Vite](https://vitejs.dev/)** — build tool & dev server
- **[Tailwind CSS](https://tailwindcss.com/)** — utility-first styling
- **[lucide-react](https://lucide.dev/)** — icon set

## 📁 Project Structure

```
apple-paint-app/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── src/
    ├── main.jsx      # React entry point
    ├── App.jsx        # Paint Pro application
    └── index.css      # Tailwind directives
```

## 🗺️ Roadmap Ideas

- [ ] Cloud/account-based project storage
- [ ] Custom brush presets & saved palettes
- [ ] Multi-select and transform (scale/rotate) for selections
- [ ] Touch and stylus pressure support
- [ ] Export to layered file formats (e.g. PSD-like)

## 📄 License

MIT — feel free to use, modify, and distribute.

## 🙌 Acknowledgements

Icons by [Lucide](https://lucide.dev/). Design language inspired by Apple's Human Interface Guidelines.
