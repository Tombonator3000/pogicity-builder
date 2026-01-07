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

*Log format: Date > Section > Changes*
