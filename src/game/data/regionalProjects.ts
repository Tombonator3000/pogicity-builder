import {
  RegionalProjectType,
  RegionalProjectStatus,
  RegionalProject,
  ResourceCost,
} from "../types";

/**
 * Predefined regional projects (expensive multi-city infrastructure)
 *
 * These projects are shared between all cities in a region and provide
 * bonuses to all participating cities when completed.
 *
 * Phase 5.1 - Region System
 */

interface RegionalProjectDefinition {
  type: RegionalProjectType;
  name: string;
  description: string;
  totalCost: ResourceCost;
  benefits: RegionalProject["benefits"];
  requirements: RegionalProject["requirements"];
  tier: number; // 1 = early game, 2 = mid game, 3 = late game
}

export const REGIONAL_PROJECTS: RegionalProjectDefinition[] = [
  // ============================================================================
  // TIER 1: EARLY GAME (Basic Infrastructure)
  // ============================================================================
  {
    type: RegionalProjectType.TradeHub,
    name: "Wasteland Trade Hub",
    description:
      "A centralized trading post that facilitates commerce between settlements. Increases caps income for all cities.",
    totalCost: {
      scrap: 500,
      caps: 2000,
    },
    benefits: {
      incomeBonus: 100, // +100 caps/month per city
      happinessBonus: 5,
    },
    requirements: {
      minCities: 2,
      minPopulationPerCity: 50,
    },
    tier: 1,
  },
  {
    type: RegionalProjectType.PowerPlant,
    name: "Regional Power Station",
    description:
      "A large-scale power generation facility that supplies electricity to all settlements in the region.",
    totalCost: {
      scrap: 800,
      caps: 3000,
    },
    benefits: {
      powerBonus: 200, // +200 power per city
      pollutionReduction: -10, // Slightly polluting
    },
    requirements: {
      minCities: 2,
      minPopulationPerCity: 100,
    },
    tier: 1,
  },
  {
    type: RegionalProjectType.WaterTreatment,
    name: "Regional Water Purification Plant",
    description:
      "A massive water purification facility that provides clean water to all settlements, reducing radiation exposure.",
    totalCost: {
      scrap: 700,
      caps: 2500,
    },
    benefits: {
      waterBonus: 150, // +150 water per city
      happinessBonus: 10,
      pollutionReduction: 5, // Reduces radiation
    },
    requirements: {
      minCities: 2,
      minPopulationPerCity: 100,
    },
    tier: 1,
  },

  // ============================================================================
  // TIER 2: MID GAME (Advanced Infrastructure)
  // ============================================================================
  {
    type: RegionalProjectType.Railroad,
    name: "Wasteland Railroad Network",
    description:
      "A rail system connecting all settlements, boosting trade and population growth.",
    totalCost: {
      scrap: 1500,
      caps: 5000,
    },
    benefits: {
      populationCapBonus: 200, // +200 max population per city
      incomeBonus: 150, // +150 caps/month per city
      happinessBonus: 15,
    },
    requirements: {
      minCities: 3,
      minPopulationPerCity: 200,
      minRegionalPopulation: 800,
    },
    tier: 2,
  },
  {
    type: RegionalProjectType.Airport,
    name: "Wasteland Airfield",
    description:
      "A restored pre-war airfield that enables long-distance trade and attracts wealthy settlers.",
    totalCost: {
      scrap: 2000,
      caps: 8000,
    },
    benefits: {
      incomeBonus: 300, // +300 caps/month per city
      populationCapBonus: 150,
      happinessBonus: 20,
    },
    requirements: {
      minCities: 3,
      minPopulationPerCity: 300,
      minRegionalPopulation: 1200,
    },
    tier: 2,
  },
  {
    type: RegionalProjectType.ResearchCenter,
    name: "Wasteland Research Institute",
    description:
      "A collaborative research facility that advances technology and reduces pollution across all settlements.",
    totalCost: {
      scrap: 1800,
      caps: 6000,
    },
    benefits: {
      pollutionReduction: 20, // -20% pollution
      happinessBonus: 15,
      incomeBonus: 100, // Tech leads to better production
    },
    requirements: {
      minCities: 3,
      minPopulationPerCity: 250,
    },
    tier: 2,
  },

  // ============================================================================
  // TIER 3: LATE GAME (Mega-Projects)
  // ============================================================================
  {
    type: RegionalProjectType.Stadium,
    name: "Wasteland Arena",
    description:
      "A massive entertainment complex that hosts gladiatorial combat and sporting events. Greatly boosts morale and attracts visitors.",
    totalCost: {
      scrap: 3000,
      caps: 12000,
    },
    benefits: {
      happinessBonus: 30, // Major happiness boost
      incomeBonus: 200, // Tourism income
      populationCapBonus: 250,
    },
    requirements: {
      minCities: 4,
      minPopulationPerCity: 500,
      minRegionalPopulation: 2500,
    },
    tier: 3,
  },
  {
    type: RegionalProjectType.Arcology,
    name: "Wasteland Arcology",
    description:
      "A self-contained mega-structure that houses thousands of settlers. The ultimate achievement in post-apocalyptic urban planning.",
    totalCost: {
      scrap: 5000,
      caps: 20000,
    },
    benefits: {
      populationCapBonus: 500, // Massive population increase
      happinessBonus: 25,
      pollutionReduction: 15, // Self-contained = cleaner
      powerBonus: 100,
      waterBonus: 100,
      incomeBonus: 250,
    },
    requirements: {
      minCities: 4,
      minPopulationPerCity: 800,
      minRegionalPopulation: 4000,
    },
    tier: 3,
  },
];

/**
 * Create a regional project instance from a definition
 */
export function createRegionalProject(
  definition: RegionalProjectDefinition,
): Omit<RegionalProject, "id" | "proposedAt"> {
  return {
    type: definition.type,
    name: definition.name,
    description: definition.description,
    totalCost: definition.totalCost,
    contributions: {},
    status: RegionalProjectStatus.Proposed,
    progress: 0,
    benefits: definition.benefits,
    requirements: definition.requirements,
  };
}

/**
 * Get projects available for a region based on city stats
 */
export function getAvailableProjects(
  cityCount: number,
  minPopulation: number,
  totalPopulation: number,
): RegionalProjectDefinition[] {
  return REGIONAL_PROJECTS.filter((project) => {
    const reqs = project.requirements;

    // Check min cities
    if (reqs.minCities && cityCount < reqs.minCities) return false;

    // Check min population per city
    if (reqs.minPopulationPerCity && minPopulation < reqs.minPopulationPerCity)
      return false;

    // Check total regional population
    if (
      reqs.minRegionalPopulation &&
      totalPopulation < reqs.minRegionalPopulation
    )
      return false;

    return true;
  });
}

/**
 * Get projects by tier
 */
export function getProjectsByTier(tier: 1 | 2 | 3): RegionalProjectDefinition[] {
  return REGIONAL_PROJECTS.filter((project) => project.tier === tier);
}

/**
 * Get project definition by type
 */
export function getProjectDefinition(
  type: RegionalProjectType,
): RegionalProjectDefinition | undefined {
  return REGIONAL_PROJECTS.find((project) => project.type === type);
}
