# Durable decisions

## 2026-09-19 — Canonical game identity

The canonical game is the pseudo-3D “Grand Theft Amt” version originally deployed at `https://ec-games.space/games/germany-simulator/`. The later flat 2D prototype is not the product direction.

## 2026-09-19 — Standalone root URL

The standalone GitHub Pages deployment serves the game directly from repository root at `https://georgefejer91.github.io/GermanySimulator/`. The former nested `public/games/germany-simulator/` runtime copy was removed to keep the public URL short and avoid duplicate authority.

## 2026-09-19 — Static-first and YAGNI

The browser game remains static-first. Backend and asset-infrastructure additions require a concrete need. `$ponytail` is the preferred skill for those decisions when installed; the repository’s explicit YAGNI checklist is the fallback.

## 2026-09-19 — Asset fidelity split

Desktop may use high-resolution Weimar-era-inspired billboard art. Mobile uses minimalist lightweight fax signage. Gameplay placement, copy, and interactions stay shared; only representation varies.
