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

### Core Principles

1. **Log all changes** to `log.md` with date and summary
2. **Test sprite paths** before adding new buildings
3. **Keep BuildingPanel categories** in sync with building definitions
4. **Use semantic Tailwind tokens** from index.css

### Modular Architecture Requirements

**CRITICAL: All code must be written with modularity in mind to minimize future refactoring.**

#### 1. Separation of Concerns
- **Each file should have ONE clear responsibility**
- Game logic → `src/game/`
- UI components → `src/components/`
- Utilities → `src/utils/`
- Types → `src/types/` or co-located `*.types.ts`
- Constants → `src/constants/` or co-located `*.constants.ts`

#### 2. Entity-Component Pattern
- Entities (buildings, characters, vehicles) should be **data-driven**
- Separate data definitions from behavior
- Use registries for entity types (see `buildings.ts` as example)
- Keep entity behavior in dedicated systems (e.g., `MovementSystem`, `RenderSystem`)

**Example Structure:**
```
src/game/entities/
  buildings/
    BuildingRegistry.ts    // Building definitions
    BuildingSystem.ts      // Building placement/removal logic
    BuildingRenderer.ts    // Building rendering logic
  characters/
    CharacterRegistry.ts
    CharacterSystem.ts
  vehicles/
    VehicleRegistry.ts
    VehicleSystem.ts
```

#### 3. Configuration-Driven Design
- Game constants should be configurable
- Use configuration objects instead of hardcoded values
- Support different game modes through config

```typescript
// Good
const GRID_CONFIG = {
  width: 48,
  height: 48,
  tileWidth: 44,
  tileHeight: 22
};

// Bad
const grid = new Grid(48, 48, 44, 22);
```

#### 4. Event-Driven Communication
- Use event system for cross-module communication
- Avoid tight coupling between systems
- Phaser's event emitter should be leveraged
- Create custom event types in `src/game/events.ts`

```typescript
// Good
scene.events.emit('building:placed', building);

// Bad
gameUI.onBuildingPlaced(building); // Tight coupling
```

#### 5. Plugin Architecture
- New features should be pluggable
- Each system should be independently testable
- Use dependency injection where possible

```typescript
class MainScene extends Phaser.Scene {
  private systems: GameSystem[] = [];

  addSystem(system: GameSystem) {
    this.systems.push(system);
    system.init(this);
  }
}
```

#### 6. Data Layer Abstraction
- All persistence should go through a data layer
- Abstract localStorage behind a service
- Enable easy migration to backend storage

```typescript
interface StorageService {
  save(key: string, data: unknown): Promise<void>;
  load<T>(key: string): Promise<T | null>;
}
```

### Code Organization Best Practices

#### File Naming Conventions
- Components: `PascalCase.tsx` (e.g., `BuildingPanel.tsx`)
- Utilities: `camelCase.ts` (e.g., `roadUtils.ts`)
- Systems: `PascalCaseSystem.ts` (e.g., `MovementSystem.ts`)
- Types: `camelCase.types.ts` or `types.ts`
- Constants: `SCREAMING_SNAKE_CASE.ts`

#### Import Organization
```typescript
// 1. External libraries
import React from 'react';
import Phaser from 'phaser';

// 2. Internal modules
import { Building } from '@/game/buildings';
import { GridUtils } from '@/game/utils/gridUtils';

// 3. Types
import type { TileType, Direction } from '@/game/types';

// 4. Styles
import './styles.css';
```

#### Type Safety
- **Always use TypeScript strictly**
- No `any` types without explicit justification
- Use type guards for runtime type checking
- Define interfaces for all data structures

```typescript
// Good
interface Building {
  id: string;
  type: BuildingType;
  position: GridPosition;
  rotation: Direction;
}

// Bad
const building: any = { ... };
```

### Game Development Best Practices

#### 1. Performance Optimization
- **Object Pooling** for frequently created/destroyed entities
- **Sprite Atlases** for reducing draw calls
- **Lazy Loading** for assets
- **Culling** for off-screen entities
- **Batch Rendering** where possible

```typescript
class EntityPool<T> {
  private pool: T[] = [];

  acquire(): T {
    return this.pool.pop() || this.create();
  }

  release(entity: T): void {
    this.reset(entity);
    this.pool.push(entity);
  }
}
```

#### 2. Asset Management
- Preload critical assets in boot scene
- Use asset manifests for organization
- Support multiple resolutions
- Compress images appropriately
- Use sprite sheets for animations

```typescript
const ASSET_MANIFEST = {
  buildings: {
    residential: ['yellow_apartments', 'brownstone'],
    commercial: ['checkers', 'popeyes']
  },
  characters: ['banana', 'apple'],
  vehicles: ['jeep', 'taxi']
};
```

#### 3. State Management
- Separate UI state from game state
- Game state should be serializable
- Implement undo/redo with command pattern
- Use immutable updates where possible

```typescript
interface GameState {
  grid: TileType[][];
  buildings: Building[];
  characters: Character[];
  vehicles: Vehicle[];
}

class GameStateManager {
  private history: GameState[] = [];

  saveState(state: GameState): void {
    this.history.push(structuredClone(state));
  }

  undo(): GameState | null {
    return this.history.pop() || null;
  }
}
```

#### 4. Input Handling
- Centralize input management
- Support multiple input methods (mouse, touch, keyboard)
- Implement input buffering for complex commands
- Debounce expensive input operations

#### 5. Testing Strategy
- Unit tests for utilities and pure functions
- Integration tests for systems
- Visual regression tests for UI
- Performance benchmarks for critical paths

```typescript
// Example testable code
export function calculateIsometricPosition(
  gridX: number,
  gridY: number,
  tileWidth: number,
  tileHeight: number
): { x: number; y: number } {
  return {
    x: (gridX - gridY) * (tileWidth / 2),
    y: (gridX + gridY) * (tileHeight / 2)
  };
}
```

#### 6. Error Handling
- Graceful degradation for missing assets
- User-friendly error messages
- Logging system for debugging
- Recovery mechanisms for corrupted state

```typescript
try {
  const texture = this.textures.get(spriteName);
} catch (error) {
  console.error(`Failed to load sprite: ${spriteName}`, error);
  // Fallback to placeholder
  return this.textures.get('placeholder');
}
```

### Scalability Patterns

#### 1. Feature Flags
```typescript
const FEATURES = {
  MULTIPLAYER: false,
  ADVANCED_TERRAIN: true,
  WEATHER_SYSTEM: false
};

if (FEATURES.WEATHER_SYSTEM) {
  scene.addSystem(new WeatherSystem());
}
```

#### 2. Modular Loading
```typescript
// Load features on demand
async function loadFeature(name: string) {
  const module = await import(`./features/${name}`);
  return module.default;
}
```

#### 3. Data-Driven Content
```typescript
// Buildings defined in JSON/TypeScript config
export const BUILDINGS_CONFIG = {
  'yellow_apartments': {
    category: 'residential',
    footprint: { width: 2, height: 2 },
    sprites: {
      south: '/Building/yellow_apartments_s.png',
      north: '/Building/yellow_apartments_n.png',
      east: '/Building/yellow_apartments_e.png',
      west: '/Building/yellow_apartments_w.png'
    },
    properties: {
      capacity: 20,
      cost: 1000
    }
  }
};
```

#### 4. Version Management
```typescript
interface SaveData {
  version: string;
  data: GameState;
}

function migrateData(save: SaveData): GameState {
  if (save.version === '1.0.0') {
    // Migrate to 2.0.0
    save = migrateTo2_0_0(save);
  }
  return save.data;
}
```

### Anti-Patterns to Avoid

❌ **God Objects** - Classes that do everything
❌ **Tight Coupling** - Direct dependencies between unrelated modules
❌ **Magic Numbers** - Hardcoded values without context
❌ **Deep Nesting** - Functions with 4+ levels of nesting
❌ **Global State** - Mutable globals accessible everywhere
❌ **Premature Optimization** - Optimizing before profiling
❌ **Copy-Paste Code** - Duplicated logic without abstraction

### Documentation Requirements

- **Every public function** should have JSDoc comments
- **Complex algorithms** need explanation comments
- **Type definitions** should have descriptive names
- **README files** for each major module
- **Architecture Decision Records (ADRs)** for major changes

```typescript
/**
 * Converts grid coordinates to isometric screen coordinates
 * @param gridX - Grid X coordinate (0 to GRID_WIDTH)
 * @param gridY - Grid Y coordinate (0 to GRID_HEIGHT)
 * @returns Screen coordinates {x, y} in pixels
 */
export function gridToScreen(gridX: number, gridY: number): Point {
  // Implementation
}
```

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
