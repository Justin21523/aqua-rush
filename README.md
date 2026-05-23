# AquaRush 🌊

A 3D endless waterslide game built as a learning project for modern web
game development.

> Roll, slide, and steer a ball down a procedurally generated, colorful
> waterslide. Collect coins, hit boosters, dodge obstacles, and choose
> your path at every fork. How far can you go?

## Tech stack

- [Vite](https://vitejs.dev/) — build tool
- [React 18](https://react.dev/) — UI
- [TypeScript](https://www.typescriptlang.org/) — type safety
- [Three.js](https://threejs.org/) — 3D engine
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) — declarative Three.js
- [@react-three/drei](https://github.com/pmndrs/drei) — useful R3F helpers
- [Zustand](https://docs.pmnd.rs/zustand) — lightweight state management
- [Tailwind CSS](https://tailwindcss.com/) — utility-first styling

## Getting started

```bash
npm install
npm run dev
```

Then open <http://localhost:5173>.

## Controls

| Key | Action |
| --- | --- |
| `A` / `←` | Steer left |
| `D` / `→` | Steer right |
| `Esc` | Pause / resume |

## Project layout

See the folder overview in the design doc. In short:

- `src/game/` — 3D world (React Three Fiber components)
- `src/ui/` — 2D overlay (Tailwind HTML)
- `src/store/` — Zustand state
- `src/types/`, `src/utils/`, `src/hooks/` — shared modules

## Scripts

- `npm run dev` — start the dev server with HMR
- `npm run build` — typecheck and build for production
- `npm run preview` — preview the production build locally
- `npm run typecheck` — run TypeScript without emitting files

## Status

Phase 1 (project scaffolding) is in progress. See the roadmap in the
design doc for upcoming milestones.


## 7. 初始化專案與安裝 dependencies 的終端機指令

打開你的 terminal，依序執行：

```bash
# 1. 建立並進入專案資料夾
mkdir aqua-rush
cd aqua-rush

# 2. 初始化 Git
git init

# 3. 建立 src 資料夾結構
mkdir -p src/{types,utils,store,hooks,ui}
mkdir -p src/game/{scene,player,slide,obstacles,camera,effects}
mkdir -p public

# 4. 建立一個空 package.json（我們已經寫好內容，但如果你要手動 init）
#    建議直接把上面那個 package.json 內容貼上，然後執行：
npm install

# 5. 如果你想額外安裝 dev 工具（可選）
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-react-hooks eslint-plugin-react-refresh

# 6. 啟動開發伺服器驗證
npm run dev
```