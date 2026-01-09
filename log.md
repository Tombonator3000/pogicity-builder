# Development Log

## 2026-01-07

### Session Start
- Continued development from previous session
- Created `agents.md` and `log.md` for project context tracking

### Sprites Downloaded
Downloaded sprites from pogicity-demo.vercel.app:

**Tiles (6 files)**
- 1x1grass.png, 1x1square_tile.png, 1x1asphalt_tile.png
- 1x1snow_tile_1.png, 1x1snow_tile_2.png, 1x1snow_tile_3.png

**Residential Buildings (24 files)**
- yellow_apartments (4 dirs)
- english_townhouse (4 dirs)
- brownstone (4 dirs - with different footprints for E/W)
- 80s_small_apartment_building (4 dirs)
- small_rowhouses (4 dirs)
- medium_apartments (4 dirs)

**Commercial Buildings (20 files)**
- checkers (4 dirs)
- popeyes (4 dirs)
- dunkin (4 dirs)
- martini_bar (4 dirs)
- bookstore (4 dirs)

**Props (16 files)**
- 2x1busshelter.png
- 1x1flowerbush.png, 1x1park_table.png
- 2x2fountain.png, 1x2statue.png
- 1x1tree1.png, 1x1tree2.png
- 1x1modern_bench (4 dirs)
- 2x2christmas_tree.png
- 1x1snowman (4 dirs)
- 1x1christmas_lamp (south, west)
- 2x2sleigh (4 dirs)

**Cars (8 files)**
- jeep (n, s, e, w)
- taxi (n, s, e, w)

### Buildings Registry Updated
- Removed `small-house` (sprites not available on demo)
- Removed all civic buildings (fire_station, police_station, hospital - sprites 404)
- Categories now: residential, commercial, props, christmas

### BuildingPanel Updated
- Added Christmas category with 🎄 icon
- Removed Civic category (no available sprites)

### Building Placement Fixed
- Fixed disconnect between MainScene tool state and GameUI state
- Building placement now works correctly with proper orientation support
- Added `underlyingTileType` tracking for buildings placed on snow
- Added success toast when placing buildings

### Terrain Tools Added
- Added Asphalt tool (for car roads)
- Added Tile tool (for sidewalks/plazas)
- Added Snow tool (for winter terrain)
- Tools now paint on drag for faster terrain creation

### Rotation Controls Added
- Added rotation button that appears when building is selected
- Shows current direction (South/North/East/West)
- Rotates through all 4 directions

### UI Improvements
- Reorganized toolbar with separators
- Added terrain tools to main toolbar
- Rotation panel appears on left side when building selected

---

## 2026-01-09

### Session Start
- Reviewed project context from agents.md and log.md
- Analyzed pogicity-demo GitHub repository for missing features

### Character Animation System
- Downloaded 8 character GIF sprites from pogicity-demo:
  - Banana walking animations (4 directions)
  - Apple walking animations (4 directions)
- Installed `gifuct-js` package for GIF parsing
- Created `src/game/GifLoader.ts`:
  - `loadGifAnimation()` - Parses GIF files into canvas frames
  - `createGifTextures()` - Creates Phaser textures from GIF frames
  - `CharacterAnimationManager` class - Manages character animations
- Updated `MainScene.ts`:
  - Integrated CharacterAnimationManager
  - Characters now render with animated GIF sprites
  - Animation frames update based on GIF timing
  - Direction changes reset animation frames
  - Fallback to colored circles if GIFs not loaded

### Files Created
- `src/game/GifLoader.ts` - GIF animation utilities
- `public/Characters/*.gif` - 8 character walking animations

---

## 2026-01-09 (Session 2)

### Documentation Overhaul
- **Comprehensive agents.md update** with modular architecture guidelines:
  - Added 6 modular architecture requirements (Separation of Concerns, Entity-Component Pattern, Configuration-Driven Design, Event-Driven Communication, Plugin Architecture, Data Layer Abstraction)
  - Documented code organization best practices (file naming, import organization, type safety)
  - Added 6 game development best practices (Performance Optimization, Asset Management, State Management, Input Handling, Testing Strategy, Error Handling)
  - Included 4 scalability patterns (Feature Flags, Modular Loading, Data-Driven Content, Version Management)
  - Listed anti-patterns to avoid (God Objects, Tight Coupling, Magic Numbers, etc.)
  - Added documentation requirements with JSDoc examples

### Architecture Guidelines
- **Modular design principles** to minimize refactoring:
  - Entity-Component pattern for game entities
  - Event-driven communication between systems
  - Plugin architecture for extensibility
  - Data layer abstraction for persistence
  - Configuration-driven design for flexibility

### Code Quality Standards
- Type safety requirements (strict TypeScript, no `any` types)
- File naming conventions established
- Import organization standards
- Performance optimization patterns (object pooling, sprite atlases, culling)
- Error handling and graceful degradation strategies

### Development Workflow
- Testing strategy documented (unit, integration, visual regression)
- Asset management best practices
- State management patterns (undo/redo with command pattern)
- Version management for save data migration

---

## 2026-01-09 (Session 3)

### Major Refactoring - Modular Architecture Implementation

**Goal**: Refactor and optimize game code following agents.md modular architecture guidelines

### Configuration System Created
- Created `src/game/config/` directory structure:
  - `GridConfig.ts` - Grid dimensions and isometric tile settings
  - `EntityConfig.ts` - Character and vehicle movement speeds
  - `CameraConfig.ts` - Camera controls and zoom limits
  - `RenderConfig.ts` - Rendering depths, colors, and visual settings
  - `index.ts` - Central configuration export

**Benefits**: All game constants now configurable in one place, eliminating magic numbers

### Utilities Extracted
- Created `src/game/utils/` directory:
  - `GridUtils.ts` - Isometric grid/screen coordinate conversion, depth calculation
  - `IdGenerator.ts` - Unique ID generation utility
  - `DirectionUtils.ts` - Direction vectors, opposites, and mapping functions
  - `ObjectPool.ts` - Generic object pooling for performance optimization

**Benefits**: Reusable utilities, reduced code duplication, better testability

### Modular Systems Architecture
- Created `src/game/systems/` directory following Entity-Component-System pattern:
  - `GameSystem.ts` - Base interface for all game systems
  - **CharacterSystem.ts** (200 lines):
    - Character spawning and movement logic
    - Pathfinding on walkable tiles (Road, Tile)
    - Direction change at intersections
    - Teleportation when stuck
  - **VehicleSystem.ts** (180 lines):
    - Vehicle spawning and movement logic
    - Lane-following on asphalt roads
    - Direction change at intersections
    - Respawn when off-road
  - **CameraSystem.ts** (180 lines):
    - Camera pan, zoom, keyboard controls
    - Screen shake effects
    - Smooth camera movement
  - **RenderSystem.ts** (420 lines):
    - All rendering logic (tiles, buildings, characters, vehicles)
    - Sprite management and lifecycle
    - Character GIF animation handling
    - Isometric depth sorting
    - Fallback rendering for missing textures
  - **InputSystem.ts** (290 lines):
    - Mouse/pointer input handling
    - Tool selection and preview
    - Drag operations for painting tools
    - Event communication with React UI
  - `index.ts` - Systems export file

**Benefits**:
- Clear separation of concerns
- Each system is independently testable
- Systems can be enabled/disabled easily
- Follows Single Responsibility Principle

### MainScene Refactored
- **Before**: 1150 lines (God Object anti-pattern)
- **After**: 230 lines (orchestration only)
- **Reduction**: 80% smaller, 920 lines extracted

**New Structure**:
- Systems initialized in `initializeSystems()`
- Update loop delegates to systems
- Public API methods delegate to appropriate systems
- Scene only handles system composition and coordination

**Benefits**:
- Dramatically improved maintainability
- Easy to add new features as systems
- Clear responsibilities
- Reduced coupling between game logic

### Code Organization Improvements
- Eliminated God Object anti-pattern
- Removed tight coupling between modules
- Extracted magic numbers to configuration
- Improved type safety throughout
- Better import organization
- Consistent file naming conventions

### Performance Optimizations
- Object pooling infrastructure added
- Sprite reuse in rendering system
- Reduced sprite creation/destruction overhead
- Foundation for future optimizations (culling, batching)

### Files Created (19 new files)
**Configuration** (5):
- `src/game/config/GridConfig.ts`
- `src/game/config/EntityConfig.ts`
- `src/game/config/CameraConfig.ts`
- `src/game/config/RenderConfig.ts`
- `src/game/config/index.ts`

**Utilities** (4):
- `src/game/utils/GridUtils.ts`
- `src/game/utils/IdGenerator.ts`
- `src/game/utils/DirectionUtils.ts`
- `src/game/utils/ObjectPool.ts`

**Systems** (7):
- `src/game/systems/GameSystem.ts`
- `src/game/systems/CharacterSystem.ts`
- `src/game/systems/VehicleSystem.ts`
- `src/game/systems/CameraSystem.ts`
- `src/game/systems/RenderSystem.ts`
- `src/game/systems/InputSystem.ts`
- `src/game/systems/index.ts`

**Backup**:
- `src/game/MainScene.old.ts` (original backed up)

### Files Modified (1)
- `src/game/MainScene.ts` - Completely refactored to use systems

### Architecture Compliance
✅ Separation of Concerns - Each file has one clear responsibility
✅ Entity-Component Pattern - Systems manage entity behavior
✅ Configuration-Driven Design - All constants configurable
✅ Event-Driven Communication - Systems communicate via events
✅ Plugin Architecture - Systems are pluggable and modular
✅ Type Safety - Strict TypeScript, no `any` types
✅ Performance Optimization - Object pooling infrastructure

### Anti-Patterns Eliminated
❌ God Objects - MainScene split into focused systems
❌ Tight Coupling - Systems are independent
❌ Magic Numbers - Moved to configuration
❌ Deep Nesting - Flattened with better abstractions
❌ Copy-Paste Code - Extracted to utilities

### Testing Status
- ✅ TypeScript compilation: No errors
- ⏳ Runtime testing: Pending user verification
- ⏳ Performance testing: Pending benchmarks

### Next Steps (Future Optimizations)
- Spatial culling for off-screen entities
- Texture atlas for reduced draw calls
- Lazy loading for assets
- Save state versioning system
- Unit tests for utilities
- Integration tests for systems

---

## 2026-01-09 (Session 4)

### Multi-Platform Support - GitHub & Lovable

**Goal**: Make game runnable on both Lovable (root path) and GitHub Pages (subdirectory path)

### Problem Analysis
- All asset paths were hardcoded with absolute paths starting with `/`
- This works on Lovable (`/Building/foo.png`) but fails on GitHub Pages (`/pogicity-builder/Building/foo.png`)
- Need dynamic path resolution based on deployment platform

### Asset Path Resolution System Created
- Created `src/game/utils/AssetPathUtils.ts`:
  - `getBasePath()` - Gets base path from Vite's `import.meta.env.BASE_URL`
  - `getAssetPath(path)` - Resolves single asset path with base
  - `resolveAssetPathsInObject()` - Resolves all paths in an object (for building sprites)
  - Automatic handling of leading slashes and path joining

**Benefits**:
- Single source of truth for base path configuration
- Automatic path resolution at runtime
- No code changes needed between platforms

### Environment Configuration
Created environment files for platform-specific configuration:
- `.env.development` - Development/Lovable: `VITE_BASE_PATH=/`
- `.env.production` - Production/Lovable: `VITE_BASE_PATH=/`
- `.env.github` - GitHub Pages: `VITE_BASE_PATH=/pogicity-builder/`

### Vite Configuration Updated
- `vite.config.ts`:
  - Added `base` property reading from `VITE_BASE_PATH` env variable
  - Defaults to `/` if not specified
  - Supports command-line override via `--base` flag

### Buildings System Updated
- `src/game/buildings.ts`:
  - Renamed `BUILDINGS` → `RAW_BUILDINGS` (with relative paths)
  - Created `getResolvedBuildings()` function that resolves all sprite paths once
  - Implemented caching for performance
  - Created Proxy for `BUILDINGS` export to maintain backward compatibility
  - All building sprites now use dynamic paths

**Architecture**:
```typescript
RAW_BUILDINGS (static) → getResolvedBuildings() → BUILDINGS (Proxy)
```

### GIF Loader Updated
- `src/game/GifLoader.ts`:
  - Imported `getAssetPath` utility
  - Updated character GIF loading to use dynamic paths
  - Character animations (banana, apple) now work on all platforms

### Main Scene Updated
- `src/game/MainScene.ts`:
  - Imported `getAssetPath` utility
  - Updated tile texture loading (grass, road, asphalt, snow)
  - Updated car texture loading (jeep, taxi in 4 directions)
  - Building texture loading already uses resolved paths from BUILDINGS

### Build Scripts Added
- `package.json` updated with platform-specific scripts:
  - `build:lovable` - Builds for Lovable (base: `/`)
  - `build:github` - Builds for GitHub Pages (base: `/pogicity-builder/`)
  - `preview:github` - Previews GitHub build locally with correct base

**Usage**:
```bash
npm run build:lovable  # For Lovable deployment
npm run build:github   # For GitHub Pages deployment
```

### Documentation Created
- Created `DEPLOYMENT.md`:
  - Complete deployment guide for both platforms
  - GitHub Actions workflow example
  - Manual deployment instructions
  - Architecture overview
  - Troubleshooting guide
  - Performance notes

### Files Created (4 new files)
- `src/game/utils/AssetPathUtils.ts` - Asset path resolution utilities
- `.env.development` - Development environment config
- `.env.production` - Production environment config
- `.env.github` - GitHub Pages environment config
- `DEPLOYMENT.md` - Deployment guide

### Files Modified (5 files)
- `vite.config.ts` - Added base path configuration
- `package.json` - Added platform-specific build scripts
- `src/game/buildings.ts` - Dynamic path resolution with caching
- `src/game/GifLoader.ts` - Dynamic character GIF paths
- `src/game/MainScene.ts` - Dynamic asset loading

### Build Testing
- ✅ TypeScript compilation: No errors
- ✅ Lovable build: Successful (1.85 MB JS bundle)
- ✅ GitHub build: Successful (1.85 MB JS bundle)
- ✅ Path resolution: Verified in built HTML (`/pogicity-builder/` prefix applied)

### Platform Support Matrix
| Platform | Base Path | Build Command | Status |
|----------|-----------|---------------|--------|
| **Lovable** | `/` | `npm run build:lovable` | ✅ Ready |
| **GitHub Pages** | `/pogicity-builder/` | `npm run build:github` | ✅ Ready |

### Technical Highlights
- **Zero Runtime Overhead**: Path resolution happens once at initialization
- **Backward Compatible**: Existing code works without changes via Proxy pattern
- **Type Safe**: Full TypeScript support maintained
- **Cacheable**: Resolved paths are cached for performance
- **Configurable**: Easy to change base path via environment variables

### Architecture Benefits
- Single source of truth for base paths
- Platform-agnostic game code
- Easy to add new deployment targets
- No hardcoded paths in application code
- Testable path resolution logic

### Next Steps (Future)
- Set up GitHub Actions workflow for automatic deployment
- Test actual deployment on GitHub Pages
- Consider adding more deployment targets (Netlify, Vercel, etc.)

---

## 2026-01-09 (Session 5)

### Wasteland Rebuilders - Post-Apocalyptic City Builder Concept

**Goal**: Transform game into Fallout-inspired post-apocalyptic city builder with resource management, survival mechanics, and tech progression.

### Concept Exploration
Explored three post-apocalyptic concepts:
1. **Wasteland Rebuilders** (Fallout-inspired) - Resource management, radiation, factions, tech tree
2. **Frozen Aftermath** (Frostpunk-inspired) - Temperature management, energy crisis
3. **Scavenger City** (Simple economy-focused) - Trading routes, exploration

**Selected**: Wasteland Rebuilders (Konsept 1)

**Rationale**:
- Perfect fit with existing Character/Vehicle/Building systems
- Rich gameplay with resources, tech tree, factions, radiation
- Modular development in 4 phases
- Leverages recent architectural refactor

### Implementation Plan - Phase 1: Resource System & Buildings

**Core Features**:
- ⚡ **Resources**: Scrap, Food, Water, Power, Medicine, Caps
- 🏭 **Buildings**: Post-apocalyptic structures with production/consumption
- 🌍 **Terrain**: Wasteland, Radiation, Rubble, Contaminated tiles
- 💰 **Economy**: Buildings cost resources to place, produce/consume over time
- 🎨 **UI**: ResourcePanel showing current resources

**Technical Approach**:
1. Extend type definitions (Resources interface, TileType enum)
2. Create ResourceSystem following existing systems pattern
3. Replace buildings with post-apocalyptic variants
4. Create ResourcePanel UI component
5. Update InputSystem to check resource costs
6. Update RenderSystem for new terrain rendering

### Phase 1 Implementation Complete ✅

**Files Created (3 new files)**:
- `src/game/systems/ResourceSystem.ts` (300 lines) - Resource production/consumption system
- `src/game/wastelandBuildings.ts` (400+ lines) - 22 post-apocalyptic buildings
- `src/components/game/ResourcePanel.tsx` (120 lines) - Resource UI display

**Files Modified (8 files)**:
- `src/game/types.ts` - Added Resources, ResourceRate interfaces; extended TileType, BuildingCategory, BuildingDefinition
- `src/game/systems/index.ts` - Exported ResourceSystem
- `src/game/buildings.ts` - Now uses WASTELAND_BUILDINGS (old buildings commented out)
- `src/game/MainScene.ts` - Integrated ResourceSystem into update loop
- `src/game/PhaserGame.tsx` - Added resource methods to API (canAffordBuilding, spendResources, getScene)
- `src/components/game/BuildingPanel.tsx` - Shows resource costs on buildings; updated categories
- `src/components/game/GameUI.tsx` - Integrated ResourcePanel; resource checking before placement; event listeners

**New Building Categories**:
- **Shelter** (3): Makeshift Shack, Reinforced Bunker, Repaired Apartments
- **Production** (4): Scavenging Station, Water Purifier, Hydroponic Farm, Brahmin Pen
- **Infrastructure** (4): Solar Array, Generator, Med Bay, Radio Tower
- **Defense** (2): Guard Tower, Perimeter Wall
- **Trade** (2): Trading Post, Workshop
- **Props** (4): Rusted Car, Dead Tree, Campfire, Storage Container

**Resource System Features**:
- ✅ 6 resource types tracked (scrap, food, water, power, medicine, caps)
- ✅ Resource capacity system with storage buildings
- ✅ Real-time production/consumption calculations (per second)
- ✅ Building costs validated before placement
- ✅ Automatic resource updates via event system
- ✅ UI shows current/max values and net rates (+/- per second)
- ✅ Color-coded resource indicators (red when low, green when producing)

**Building Economics**:
- Buildings cost resources to build (e.g., Shack costs 20 scrap)
- Some buildings produce resources (e.g., Scavenging Station: +2 scrap/sec)
- Some buildings consume resources (e.g., Water Purifier: -1 power/sec)
- Storage buildings increase capacity (e.g., Storage Container: +200 scrap capacity)
- Starting resources: 100 scrap, 50 food, 50 water, 10 medicine

**UI Improvements**:
- ResourcePanel in top-right corner shows all 6 resources
- BuildingPanel shows resource costs on each building tile
- Category tabs renamed to post-apocalyptic theme (Shelter, Production, Infrastructure, Defense, Trade, Props)
- Status bar updated to "☢️ Wasteland Rebuilders"
- Toast notifications for insufficient resources

**Architecture Highlights**:
- ResourceSystem follows same pattern as CharacterSystem/VehicleSystem
- Event-driven communication (resources:changed event)
- Modular and testable design
- Zero TypeScript errors ✅
- Backward compatible (old buildings preserved in comments)

**Future Phases**:
- Phase 2: Citizen jobs & work assignments
- Phase 3: Tech tree & radiation hazards
- Phase 4: Factions & raider attacks

---

*Log format: Date > Section > Changes*
