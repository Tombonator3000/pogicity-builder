# City Builder Game - AI Agent Instructions

## Project Overview
This is a city builder game inspired by pogicity-demo, built with **Phaser 3** and **React**. It features an isometric grid system with building and road placement.

## Tech Stack
- **Frontend**: React + TypeScript + Vite
- **Game Engine**: Phaser 3
- **Styling**: Tailwind CSS with custom game theme
- **State**: React state + localStorage for persistence

## Architecture

### Key Files
- `src/game/MainScene.ts` - Core Phaser scene with grid, input, and entity logic
- `src/game/PhaserGame.tsx` - React wrapper for Phaser
- `src/game/buildings.ts` - Building definitions registry
- `src/game/roadUtils.ts` - Road network and 4x4 segment system
- `src/game/types.ts` - Type definitions and isometric constants
- `src/components/game/GameUI.tsx` - Main game UI orchestrator
- `src/components/game/BuildingPanel.tsx` - Building selection panel

### Grid System
- 48x48 grid with 44x22 pixel isometric tiles
- Coordinate conversion between screen and grid space
- Tile types: Grass, Road, Asphalt, Tile, Snow

### Building System
- Buildings support rotation (4 directions)
- Footprints mapped to orientations
- Sprites loaded from `/public/Building/` and `/public/Props/`

### Entity Systems
- Characters walk on Road/Tile surfaces
- Cars drive on Asphalt with lane direction logic
- Both use movement with direction picking at intersections

## Development Guidelines

1. **Log all changes** to `log.md` with date and summary
2. **Test sprite paths** before adding new buildings
3. **Keep BuildingPanel categories** in sync with building definitions
4. **Use semantic Tailwind tokens** from index.css

## Available Sprites

### Tiles
- grass, asphalt, square_tile, snow (1-3 variants)

### Buildings (with rotation)
- Residential: yellow_apartments, english_townhouse, brownstone, 80s_apartment, row_houses, medium_apartments
- Commercial: checkers, popeyes, dunkin, martini_bar, bookstore

### Props
- bus_shelter, flower_bush, park_table, fountain, statue, tree1, tree2, modern_bench

### Christmas
- christmas_tree, snowman, christmas_lamp, santas_sleigh

### Cars
- jeep, taxi (4 directions each)

## Missing Sprites (not on demo)
- small_house (all directions)
- All civic buildings (fire_station, police_station, hospital)
