import { BuildingDefinition, BuildingCategory } from "./types";

export const BUILDINGS: BuildingDefinition[] = [
  // Residential
  {
    id: "small_house",
    name: "Small House",
    category: "residential",
    footprint: { width: 1, height: 1 },
    color: "#4CAF50",
    icon: "🏠",
  },
  {
    id: "medium_house",
    name: "Medium House",
    category: "residential",
    footprint: { width: 2, height: 1 },
    color: "#66BB6A",
    icon: "🏡",
  },
  {
    id: "apartment",
    name: "Apartment",
    category: "residential",
    footprint: { width: 2, height: 2 },
    color: "#81C784",
    icon: "🏢",
  },
  {
    id: "tower",
    name: "Tower",
    category: "residential",
    footprint: { width: 1, height: 1 },
    color: "#A5D6A7",
    icon: "🏬",
  },

  // Commercial
  {
    id: "shop",
    name: "Shop",
    category: "commercial",
    footprint: { width: 1, height: 1 },
    color: "#2196F3",
    icon: "🏪",
  },
  {
    id: "office",
    name: "Office",
    category: "commercial",
    footprint: { width: 2, height: 2 },
    color: "#42A5F5",
    icon: "🏦",
  },
  {
    id: "mall",
    name: "Mall",
    category: "commercial",
    footprint: { width: 3, height: 2 },
    color: "#64B5F6",
    icon: "🛒",
  },
  {
    id: "factory",
    name: "Factory",
    category: "commercial",
    footprint: { width: 2, height: 2 },
    color: "#90A4AE",
    icon: "🏭",
  },

  // Civic
  {
    id: "park",
    name: "Park",
    category: "civic",
    footprint: { width: 2, height: 2 },
    color: "#4CAF50",
    icon: "🌳",
  },
  {
    id: "hospital",
    name: "Hospital",
    category: "civic",
    footprint: { width: 2, height: 2 },
    color: "#EF5350",
    icon: "🏥",
  },
  {
    id: "school",
    name: "School",
    category: "civic",
    footprint: { width: 2, height: 2 },
    color: "#FFA726",
    icon: "🏫",
  },
  {
    id: "police",
    name: "Police Station",
    category: "civic",
    footprint: { width: 1, height: 1 },
    color: "#5C6BC0",
    icon: "🚔",
  },
  {
    id: "fire",
    name: "Fire Station",
    category: "civic",
    footprint: { width: 2, height: 1 },
    color: "#EF5350",
    icon: "🚒",
  },

  // Props
  {
    id: "tree",
    name: "Tree",
    category: "props",
    footprint: { width: 1, height: 1 },
    color: "#2E7D32",
    icon: "🌲",
  },
  {
    id: "fountain",
    name: "Fountain",
    category: "props",
    footprint: { width: 1, height: 1 },
    color: "#29B6F6",
    icon: "⛲",
  },
  {
    id: "statue",
    name: "Statue",
    category: "props",
    footprint: { width: 1, height: 1 },
    color: "#9E9E9E",
    icon: "🗽",
  },
  {
    id: "bench",
    name: "Bench",
    category: "props",
    footprint: { width: 1, height: 1 },
    color: "#8D6E63",
    icon: "🪑",
  },
];

export function getBuildingsByCategory(category: BuildingCategory): BuildingDefinition[] {
  return BUILDINGS.filter((b) => b.category === category);
}

export function getBuildingById(id: string): BuildingDefinition | undefined {
  return BUILDINGS.find((b) => b.id === id);
}
