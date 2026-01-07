import { BuildingDefinition, BuildingCategory, Direction } from "./types";

// Helper to get the correct footprint for a building based on orientation
export function getBuildingFootprint(
  building: BuildingDefinition,
  orientation?: Direction
): { width: number; height: number } {
  if (!building.footprintByOrientation || !orientation) {
    return building.footprint;
  }

  const dirMap: Record<string, "south" | "north" | "east" | "west"> = {
    down: "south",
    up: "north",
    right: "east",
    left: "west",
  };

  const dir = dirMap[orientation];
  if (!dir) {
    return building.footprint;
  }

  return building.footprintByOrientation[dir] || building.footprint;
}

// All buildings defined in one place
export const BUILDINGS: Record<string, BuildingDefinition> = {
  // ===== RESIDENTIAL =====
  "yellow-apartments": {
    id: "yellow-apartments",
    name: "Yellow Apartments",
    category: "residential",
    footprint: { width: 2, height: 2 },
    sprites: {
      south: "/Building/residential/2x2yellow_apartments_south.png",
      north: "/Building/residential/2x2yellow_apartments_north.png",
      east: "/Building/residential/2x2yellow_apartments_east.png",
      west: "/Building/residential/2x2yellow_apartments_west.png",
    },
    icon: "🏢",
    supportsRotation: true,
  },
  "english-townhouse": {
    id: "english-townhouse",
    name: "English Townhouse",
    category: "residential",
    footprint: { width: 2, height: 2 },
    sprites: {
      south: "/Building/residential/2x2english_townhouse_south.png",
      north: "/Building/residential/2x2english_townhouse_north.png",
      east: "/Building/residential/2x2english_townhouse_east.png",
      west: "/Building/residential/2x2english_townhouse_west.png",
    },
    icon: "🏘️",
    supportsRotation: true,
  },
  brownstone: {
    id: "brownstone",
    name: "Brownstone",
    category: "residential",
    footprint: { width: 2, height: 3 },
    footprintByOrientation: {
      south: { width: 2, height: 3 },
      north: { width: 2, height: 3 },
      east: { width: 3, height: 2 },
      west: { width: 3, height: 2 },
    },
    sprites: {
      south: "/Building/residential/2x3brownstone_south.png",
      north: "/Building/residential/2x3brownstone_north.png",
      east: "/Building/residential/3x2brownstone_east.png",
      west: "/Building/residential/3x2brownstone_west.png",
    },
    icon: "🏠",
    supportsRotation: true,
  },
  "80s-apartment": {
    id: "80s-apartment",
    name: "80s Apartment",
    category: "residential",
    footprint: { width: 3, height: 3 },
    sprites: {
      south: "/Building/residential/3x380s_small_apartment_building_south.png",
      north: "/Building/residential/3x380s_small_apartment_building_north.png",
      east: "/Building/residential/3x380s_small_apartment_building_east.png",
      west: "/Building/residential/3x380s_small_apartment_building_west.png",
    },
    icon: "🏢",
    supportsRotation: true,
  },
  "row-houses": {
    id: "row-houses",
    name: "Row Houses",
    category: "residential",
    footprint: { width: 3, height: 2 },
    footprintByOrientation: {
      south: { width: 3, height: 2 },
      north: { width: 3, height: 2 },
      east: { width: 2, height: 3 },
      west: { width: 2, height: 3 },
    },
    sprites: {
      south: "/Building/residential/3x2small_rowhouses_south.png",
      north: "/Building/residential/3x2small_rowhouses_north.png",
      east: "/Building/residential/2x3small_rowhouses_east.png",
      west: "/Building/residential/2x3small_rowhouses_west.png",
    },
    icon: "🏘️",
    supportsRotation: true,
  },
  "medium-apartments": {
    id: "medium-apartments",
    name: "Medium Apartments",
    category: "residential",
    footprint: { width: 4, height: 4 },
    sprites: {
      south: "/Building/residential/4x4medium_apartments_south.png",
      north: "/Building/residential/4x4medium_apartments_north.png",
      east: "/Building/residential/4x4medium_apartments_east.png",
      west: "/Building/residential/4x4medium_apartments_west.png",
    },
    icon: "🏢",
    supportsRotation: true,
  },

  // ===== COMMERCIAL =====
  checkers: {
    id: "checkers",
    name: "Checkers",
    category: "commercial",
    footprint: { width: 2, height: 2 },
    sprites: {
      south: "/Building/commercial/2x2checkers_south.png",
      north: "/Building/commercial/2x2checkers_north.png",
      east: "/Building/commercial/2x2checkers_east.png",
      west: "/Building/commercial/2x2checkers_west.png",
    },
    icon: "🍔",
    supportsRotation: true,
  },
  popeyes: {
    id: "popeyes",
    name: "Popeyes",
    category: "commercial",
    footprint: { width: 2, height: 2 },
    sprites: {
      south: "/Building/commercial/2x2popeyes_south.png",
      north: "/Building/commercial/2x2popeyes_north.png",
      east: "/Building/commercial/2x2popeyes_east.png",
      west: "/Building/commercial/2x2popeyes_west.png",
    },
    icon: "🍗",
    supportsRotation: true,
  },
  dunkin: {
    id: "dunkin",
    name: "Dunkin",
    category: "commercial",
    footprint: { width: 2, height: 2 },
    sprites: {
      south: "/Building/commercial/2x2dunkin_south.png",
      north: "/Building/commercial/2x2dunkin_north.png",
      east: "/Building/commercial/2x2dunkin_east.png",
      west: "/Building/commercial/2x2dunkin_west.png",
    },
    icon: "🍩",
    supportsRotation: true,
  },
  "martini-bar": {
    id: "martini-bar",
    name: "Martini Bar",
    category: "commercial",
    footprint: { width: 2, height: 2 },
    sprites: {
      south: "/Building/commercial/2x2martini_bar_south.png",
      north: "/Building/commercial/2x2martini_bar_north.png",
      east: "/Building/commercial/2x2martini_bar_east.png",
      west: "/Building/commercial/2x2martini_bar_west.png",
    },
    icon: "🍸",
    supportsRotation: true,
  },
  bookstore: {
    id: "bookstore",
    name: "Bookstore",
    category: "commercial",
    footprint: { width: 4, height: 4 },
    sprites: {
      south: "/Building/commercial/4x4bookstore_south.png",
      north: "/Building/commercial/4x4bookstore_north.png",
      east: "/Building/commercial/4x4bookstore_east.png",
      west: "/Building/commercial/4x4bookstore_west.png",
    },
    icon: "📚",
    supportsRotation: true,
  },

  // ===== PROPS =====
  "bus-shelter": {
    id: "bus-shelter",
    name: "Bus Shelter",
    category: "props",
    footprint: { width: 2, height: 1 },
    sprites: {
      south: "/Props/2x1busshelter.png",
    },
    icon: "🚏",
  },
  "flower-bush": {
    id: "flower-bush",
    name: "Flower Bush",
    category: "props",
    footprint: { width: 1, height: 1 },
    sprites: {
      south: "/Props/1x1flowerbush.png",
    },
    icon: "🌺",
    isDecoration: true,
  },
  "park-table": {
    id: "park-table",
    name: "Park Table",
    category: "props",
    footprint: { width: 1, height: 1 },
    sprites: {
      south: "/Props/1x1park_table.png",
    },
    icon: "🪑",
    isDecoration: true,
  },
  fountain: {
    id: "fountain",
    name: "Fountain",
    category: "props",
    footprint: { width: 2, height: 2 },
    sprites: {
      south: "/Props/2x2fountain.png",
    },
    icon: "⛲",
    isDecoration: true,
  },
  statue: {
    id: "statue",
    name: "Statue",
    category: "props",
    footprint: { width: 1, height: 2 },
    sprites: {
      south: "/Props/1x2statue.png",
    },
    icon: "🗽",
    isDecoration: true,
  },
  "tree-1": {
    id: "tree-1",
    name: "Oak Tree",
    category: "props",
    footprint: { width: 1, height: 1 },
    renderSize: { width: 4, height: 4 },
    sprites: {
      south: "/Props/1x1tree1.png",
    },
    icon: "🌳",
    isDecoration: true,
  },
  "tree-2": {
    id: "tree-2",
    name: "Maple Tree",
    category: "props",
    footprint: { width: 1, height: 1 },
    renderSize: { width: 4, height: 4 },
    sprites: {
      south: "/Props/1x1tree2.png",
    },
    icon: "🌲",
    isDecoration: true,
  },
  "modern-bench": {
    id: "modern-bench",
    name: "Modern Bench",
    category: "props",
    footprint: { width: 1, height: 1 },
    sprites: {
      south: "/Props/1x1modern_bench_south.png",
      north: "/Props/1x1modern_bench_north.png",
      east: "/Props/1x1modern_bench_east.png",
      west: "/Props/1x1modern_bench_west.png",
    },
    icon: "🪑",
    supportsRotation: true,
    isDecoration: true,
  },

  // ===== CHRISTMAS =====
  "christmas-tree": {
    id: "christmas-tree",
    name: "Christmas Tree",
    category: "christmas",
    footprint: { width: 2, height: 2 },
    sprites: {
      south: "/Props/2x2christmas_tree.png",
    },
    icon: "🎄",
    isDecoration: true,
  },
  snowman: {
    id: "snowman",
    name: "Snowman",
    category: "christmas",
    footprint: { width: 1, height: 1 },
    sprites: {
      south: "/Props/1x1snowman_south.png",
      north: "/Props/1x1snowman_north.png",
      east: "/Props/1x1snowman_east.png",
      west: "/Props/1x1snowman_west.png",
    },
    icon: "⛄",
    supportsRotation: true,
    isDecoration: true,
  },
  "christmas-lamp": {
    id: "christmas-lamp",
    name: "Christmas Lamp",
    category: "christmas",
    footprint: { width: 1, height: 1 },
    sprites: {
      south: "/Props/1x1christmas_lamp_south.png",
      west: "/Props/1x1christmas_lamp_west.png",
    },
    icon: "🪔",
    supportsRotation: true,
    isDecoration: true,
  },
  "santas-sleigh": {
    id: "santas-sleigh",
    name: "Santa's Sleigh",
    category: "christmas",
    footprint: { width: 2, height: 2 },
    sprites: {
      south: "/Props/2x2sleigh_south.png",
      north: "/Props/2x2sleigh_north.png",
      east: "/Props/2x2sleigh_east.png",
      west: "/Props/2x2sleigh_west.png",
    },
    icon: "🛷",
    supportsRotation: true,
    isDecoration: true,
  },
};

export function getBuilding(id: string): BuildingDefinition | undefined {
  return BUILDINGS[id];
}

export function getBuildingsByCategory(
  category: BuildingCategory
): BuildingDefinition[] {
  return Object.values(BUILDINGS).filter((b) => b.category === category);
}

// Legacy compatibility
export function getBuildingById(id: string): BuildingDefinition | undefined {
  return BUILDINGS[id];
}
