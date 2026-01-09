import { BuildingDefinition } from "./types";

/**
 * Post-apocalyptic building definitions for Wasteland Rebuilders
 * Using existing sprites as placeholders until custom sprites are created
 */
export const WASTELAND_BUILDINGS: Record<string, BuildingDefinition> = {
  // ===== RESIDENTIAL (Shelter) =====
  "makeshift-shack": {
    id: "makeshift-shack",
    name: "Makeshift Shack",
    category: "residential",
    footprint: { width: 2, height: 2 },
    sprites: {
      south: "/Building/residential/2x2yellow_apartments_south.png",
      north: "/Building/residential/2x2yellow_apartments_north.png",
      east: "/Building/residential/2x2yellow_apartments_east.png",
      west: "/Building/residential/2x2yellow_apartments_west.png",
    },
    icon: "🏚️",
    supportsRotation: true,
    cost: {
      scrap: 20,
      food: 0,
      water: 0,
      power: 0,
      medicine: 0,
      caps: 0,
    },
    description: "Basic shelter for survivors. Houses 2-3 people.",
  },

  "reinforced-bunker": {
    id: "reinforced-bunker",
    name: "Reinforced Bunker",
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
    cost: {
      scrap: 50,
      food: 0,
      water: 0,
      power: 0,
      medicine: 0,
      caps: 0,
    },
    description: "Rad-proof shelter. Houses 5 people safely.",
  },

  "apartment-block": {
    id: "apartment-block",
    name: "Repaired Apartments",
    category: "residential",
    footprint: { width: 3, height: 3 },
    sprites: {
      south: "/Building/residential/3x3small_apartment_building_south.png",
      north: "/Building/residential/3x3small_apartment_building_north.png",
      east: "/Building/residential/3x3small_apartment_building_east.png",
      west: "/Building/residential/3x3small_apartment_building_west.png",
    },
    icon: "🏢",
    supportsRotation: true,
    cost: {
      scrap: 100,
      food: 0,
      water: 0,
      power: 0,
      medicine: 0,
      caps: 50,
    },
    description: "Restored pre-war apartments. Houses 10 people.",
  },

  // ===== RESOURCE PRODUCTION =====
  "scavenging-station": {
    id: "scavenging-station",
    name: "Scavenging Station",
    category: "resource",
    footprint: { width: 2, height: 2 },
    sprites: {
      south: "/Building/commercial/2x2checkers_south.png",
      north: "/Building/commercial/2x2checkers_north.png",
      east: "/Building/commercial/2x2checkers_east.png",
      west: "/Building/commercial/2x2checkers_west.png",
    },
    icon: "🔨",
    supportsRotation: true,
    cost: {
      scrap: 30,
      food: 0,
      water: 0,
      power: 0,
      medicine: 0,
      caps: 0,
    },
    produces: {
      scrap: 2, // 2 scrap per second
    },
    description: "Salvages materials from ruins. +2 scrap/sec",
  },

  "water-purifier": {
    id: "water-purifier",
    name: "Water Purifier",
    category: "resource",
    footprint: { width: 2, height: 2 },
    sprites: {
      south: "/Building/commercial/2x2popeyes_south.png",
      north: "/Building/commercial/2x2popeyes_north.png",
      east: "/Building/commercial/2x2popeyes_east.png",
      west: "/Building/commercial/2x2popeyes_west.png",
    },
    icon: "💧",
    supportsRotation: true,
    cost: {
      scrap: 40,
      food: 0,
      water: 0,
      power: 0,
      medicine: 0,
      caps: 0,
    },
    produces: {
      water: 3, // 3 water per second
    },
    consumes: {
      power: 1, // Requires 1 power per second
    },
    description: "Purifies contaminated water. +3 water/sec (needs power)",
  },

  "hydroponic-farm": {
    id: "hydroponic-farm",
    name: "Hydroponic Farm",
    category: "resource",
    footprint: { width: 3, height: 3 },
    sprites: {
      south: "/Building/commercial/2x2dunkin_south.png",
      north: "/Building/commercial/2x2dunkin_north.png",
      east: "/Building/commercial/2x2dunkin_east.png",
      west: "/Building/commercial/2x2dunkin_west.png",
    },
    icon: "🌱",
    supportsRotation: true,
    cost: {
      scrap: 60,
      food: 0,
      water: 0,
      power: 0,
      medicine: 0,
      caps: 30,
    },
    produces: {
      food: 2, // 2 food per second
    },
    consumes: {
      water: 1, // Requires 1 water per second
      power: 1, // Requires 1 power per second
    },
    description: "Advanced farming. +2 food/sec (needs water + power)",
  },

  "brahmin-pen": {
    id: "brahmin-pen",
    name: "Brahmin Pen",
    category: "resource",
    footprint: { width: 2, height: 2 },
    sprites: {
      south: "/Building/props/2x2fountain.png",
      north: "/Building/props/2x2fountain.png",
      east: "/Building/props/2x2fountain.png",
      west: "/Building/props/2x2fountain.png",
    },
    icon: "🐄",
    supportsRotation: false,
    cost: {
      scrap: 25,
      food: 10,
      water: 0,
      power: 0,
      medicine: 0,
      caps: 20,
    },
    produces: {
      food: 1, // 1 food per second (slower but no power needed)
    },
    description: "Two-headed cattle. +1 food/sec (no power needed)",
  },

  // ===== INFRASTRUCTURE =====
  "solar-array": {
    id: "solar-array",
    name: "Solar Array",
    category: "infrastructure",
    footprint: { width: 2, height: 2 },
    sprites: {
      south: "/Building/props/2x2fountain.png",
      north: "/Building/props/2x2fountain.png",
      east: "/Building/props/2x2fountain.png",
      west: "/Building/props/2x2fountain.png",
    },
    icon: "☀️",
    supportsRotation: false,
    cost: {
      scrap: 50,
      food: 0,
      water: 0,
      power: 0,
      medicine: 0,
      caps: 50,
    },
    produces: {
      power: 5, // 5 power per second
    },
    description: "Clean energy from the sun. +5 power/sec",
  },

  "generator": {
    id: "generator",
    name: "Scrap Generator",
    category: "infrastructure",
    footprint: { width: 1, height: 1 },
    sprites: {
      south: "/Building/props/1x1flowerbush.png",
      north: "/Building/props/1x1flowerbush.png",
      east: "/Building/props/1x1flowerbush.png",
      west: "/Building/props/1x1flowerbush.png",
    },
    icon: "⚡",
    supportsRotation: false,
    cost: {
      scrap: 20,
      food: 0,
      water: 0,
      power: 0,
      medicine: 0,
      caps: 0,
    },
    produces: {
      power: 3, // 3 power per second
    },
    consumes: {
      scrap: 0.5, // Burns 0.5 scrap per second
    },
    description: "Burns scrap for power. +3 power/sec (-0.5 scrap/sec)",
  },

  "med-bay": {
    id: "med-bay",
    name: "Medical Bay",
    category: "infrastructure",
    footprint: { width: 2, height: 2 },
    sprites: {
      south: "/Building/commercial/2x2martini_bar_south.png",
      north: "/Building/commercial/2x2martini_bar_north.png",
      east: "/Building/commercial/2x2martini_bar_east.png",
      west: "/Building/commercial/2x2martini_bar_west.png",
    },
    icon: "🏥",
    supportsRotation: true,
    cost: {
      scrap: 70,
      food: 0,
      water: 0,
      power: 0,
      medicine: 20,
      caps: 40,
    },
    produces: {
      medicine: 1, // 1 medicine per second
    },
    consumes: {
      water: 1,
      power: 1,
    },
    description: "Produces medicine. +1 medicine/sec (needs water + power)",
  },

  // ===== DEFENSE =====
  "guard-tower": {
    id: "guard-tower",
    name: "Guard Tower",
    category: "defense",
    footprint: { width: 2, height: 2 },
    sprites: {
      south: "/Building/residential/2x2english_townhouse_south.png",
      north: "/Building/residential/2x2english_townhouse_north.png",
      east: "/Building/residential/2x2english_townhouse_east.png",
      west: "/Building/residential/2x2english_townhouse_west.png",
    },
    icon: "🗼",
    supportsRotation: true,
    cost: {
      scrap: 60,
      food: 0,
      water: 0,
      power: 0,
      medicine: 0,
      caps: 30,
    },
    description: "Provides defense against raiders. Requires 1 guard.",
  },

  "perimeter-wall": {
    id: "perimeter-wall",
    name: "Perimeter Wall",
    category: "defense",
    footprint: { width: 1, height: 1 },
    sprites: {
      south: "/Building/props/1x1park_table.png",
      north: "/Building/props/1x1park_table.png",
      east: "/Building/props/1x1park_table.png",
      west: "/Building/props/1x1park_table.png",
    },
    icon: "🧱",
    supportsRotation: false,
    cost: {
      scrap: 10,
      food: 0,
      water: 0,
      power: 0,
      medicine: 0,
      caps: 0,
    },
    description: "Blocks movement. Basic defense.",
  },

  // ===== COMMERCIAL =====
  "trading-post": {
    id: "trading-post",
    name: "Trading Post",
    category: "commercial",
    footprint: { width: 4, height: 4 },
    sprites: {
      south: "/Building/commercial/4x4bookstore_south.png",
      north: "/Building/commercial/4x4bookstore_north.png",
      east: "/Building/commercial/4x4bookstore_east.png",
      west: "/Building/commercial/4x4bookstore_west.png",
    },
    icon: "🏪",
    supportsRotation: true,
    cost: {
      scrap: 80,
      food: 0,
      water: 0,
      power: 0,
      medicine: 0,
      caps: 50,
    },
    produces: {
      caps: 2, // 2 caps per second from trade
    },
    description: "Attracts traders. +2 caps/sec",
  },

  "workshop": {
    id: "workshop",
    name: "Workshop",
    category: "commercial",
    footprint: { width: 2, height: 2 },
    sprites: {
      south: "/Building/residential/3x2rowhouses_south.png",
      north: "/Building/residential/3x2rowhouses_north.png",
      east: "/Building/residential/2x3rowhouses_east.png",
      west: "/Building/residential/2x3rowhouses_west.png",
    },
    icon: "⚙️",
    supportsRotation: true,
    cost: {
      scrap: 50,
      food: 0,
      water: 0,
      power: 0,
      medicine: 0,
      caps: 30,
    },
    description: "Repairs equipment and builds upgrades.",
  },

  "radio-tower": {
    id: "radio-tower",
    name: "Radio Tower",
    category: "infrastructure",
    footprint: { width: 1, height: 2 },
    sprites: {
      south: "/Building/props/1x2statue.png",
      north: "/Building/props/1x2statue.png",
      east: "/Building/props/1x2statue.png",
      west: "/Building/props/1x2statue.png",
    },
    icon: "📻",
    supportsRotation: false,
    cost: {
      scrap: 70,
      food: 0,
      water: 0,
      power: 0,
      medicine: 0,
      caps: 60,
    },
    consumes: {
      power: 2, // Requires 2 power per second
    },
    description: "Attracts new settlers. (needs power)",
  },

  // ===== PROPS/DECORATION =====
  "rusted-car": {
    id: "rusted-car",
    name: "Rusted Vehicle",
    category: "props",
    footprint: { width: 1, height: 1 },
    sprites: {
      south: "/Building/props/1x1flowerbush.png",
      north: "/Building/props/1x1flowerbush.png",
      east: "/Building/props/1x1flowerbush.png",
      west: "/Building/props/1x1flowerbush.png",
    },
    icon: "🚗",
    supportsRotation: false,
    isDecoration: true,
    cost: {
      scrap: 5,
      food: 0,
      water: 0,
      power: 0,
      medicine: 0,
      caps: 0,
    },
    description: "Salvaged wreck. Wasteland atmosphere.",
  },

  "dead-tree": {
    id: "dead-tree",
    name: "Dead Tree",
    category: "props",
    footprint: { width: 1, height: 1 },
    renderSize: { width: 4, height: 4 },
    sprites: {
      south: "/Building/props/1x1tree1.png",
      north: "/Building/props/1x1tree1.png",
      east: "/Building/props/1x1tree1.png",
      west: "/Building/props/1x1tree1.png",
    },
    icon: "🌳",
    supportsRotation: false,
    isDecoration: true,
    cost: {
      scrap: 0,
      food: 0,
      water: 0,
      power: 0,
      medicine: 0,
      caps: 0,
    },
    description: "Withered tree. Free to place.",
  },

  "campfire": {
    id: "campfire",
    name: "Campfire",
    category: "props",
    footprint: { width: 1, height: 1 },
    sprites: {
      south: "/Building/props/1x1modern_bench_south.png",
      north: "/Building/props/1x1modern_bench_north.png",
      east: "/Building/props/1x1modern_bench_east.png",
      west: "/Building/props/1x1modern_bench_west.png",
    },
    icon: "🔥",
    supportsRotation: true,
    isDecoration: true,
    cost: {
      scrap: 5,
      food: 0,
      water: 0,
      power: 0,
      medicine: 0,
      caps: 0,
    },
    description: "Morale boost. Survivors gather here.",
  },

  "storage-container": {
    id: "storage-container",
    name: "Storage Container",
    category: "infrastructure",
    footprint: { width: 2, height: 1 },
    sprites: {
      south: "/Building/props/2x1busshelter.png",
      north: "/Building/props/2x1busshelter.png",
      east: "/Building/props/2x1busshelter.png",
      west: "/Building/props/2x1busshelter.png",
    },
    icon: "📦",
    supportsRotation: false,
    cost: {
      scrap: 30,
      food: 0,
      water: 0,
      power: 0,
      medicine: 0,
      caps: 0,
    },
    storage: {
      scrap: 200,
      food: 100,
      water: 100,
      medicine: 50,
    },
    description: "Increases storage capacity for resources.",
  },
};
