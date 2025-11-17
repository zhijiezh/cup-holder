# Cup Holder

Mobile-first bra size calculator built with **SvelteKit** + **Three.js**. It converts between international sizing systems, keeps brand-specific algorithms in configuration, and renders an animated 3D model that matches the selected measurements and theme.

---

## Quick Start

```bash
npm install
npm run dev        # start local dev server
npm run check      # type-check + svelte-check
npm run format     # run Prettier (tabs, 100-col width)
npm run lint       # prettier --check + eslint
npm run build      # production build
npm run preview    # preview prod build
```

---

## Project Layout

```
src/
  lib/
    components/        # UI + Three.js widgets
    logic/             # measurement types, region configs, converters
    stores/            # Svelte stores (settings persistence)
    styles/            # base/layout/forms/component CSS layers
    theme/             # theme tokens + helpers shared by UI & model
    config/            # global constants / option lists
  routes/+page.svelte  # main experience orchestrating all pieces
```

Key files:

- `src/lib/logic/regionConfigs.ts`: declarative per-region sizing strategies.
- `src/lib/stores/settingsStore.ts`: single source of truth for theme/language/unit/region (persists to `localStorage`).
- `src/lib/components/ModelViewer.svelte`: Three.js scene with theme-aware palette.
- `src/lib/styles/{base,layout,components,forms}.css`: layered CSS system (tokens → layout grid → shared components).

---

## Features

- 📐 **Region-aware conversions** (CN / US / US Classic / JP / UK) with modern + legacy band strategies.
- 🧮 **Wave-select controls** for band/cup + precise number pickers for bust/underbust.
- 🪄 **Themeable UI & 3D model** (Spongebob, Barbie, Toon, Cyberpunk, Alien…) with automatic text contrast.
- 🌐 **i18n** (EN/中文) backed by `src/lib/i18n/index.ts`.
- 📱 **Mobile-first layout**: content stack plus floating model canvas, safe-area aware.
- 🧊 **State persistence**: unit/language/theme/region remembered per device.

---

## Development Notes

- **Styling**: No Tailwind runtime. Instead we use CSS variables and `layout/components/forms` layers so spacing + typography remain consistent. Safe-area + spacing tokens defined in `base.css`.
- **Three.js themes**: `ModelViewer` uses typed `ModelTheme` objects. All material configs live in one place and the UI store drives theme syncing.
- **Linting/formatting**: ESLint with Svelte + TypeScript plugins and Prettier (tabs, single quotes, trailing comma disabled). Run `npm run lint` before committing.
- **Region logic testing**: all converters live in `src/lib/logic`; each helper (measurements, strategies) is small and easy to unit test with Vitest if we add tests later.

---

## Future Ideas

- Add automated tests for conversion strategies (`src/lib/logic/strategies`).
- Expand docs (e.g., `docs/architecture.md`, `docs/sizing-reference.md`) if we onboard more contributors.
- Optional Tailwind adoption for layout utilities (current system is ready if we choose to migrate).

Questions or ideas? Open an issue or start a PR—this codebase is now structured for easy collaboration. 💪
