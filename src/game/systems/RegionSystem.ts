import Phaser from "phaser";
import {
  RegionData,
  RegionConfig,
  CitySlot,
  MayorRating,
  RegionStats,
  CityComparison,
  TradableResource,
  ResourceTradeOffer,
  ResourceTradeDeal,
  RegionalProject,
  RegionalProjectType,
  RegionalProjectStatus,
  ResourceCost,
} from "../types";

/**
 * RegionSystem - Manages multiple cities in a region
 *
 * Features:
 * - Multi-city management (2x2, 3x3, or 4x4 grids)
 * - Resource trading between cities
 * - Regional projects (shared infrastructure)
 * - City comparison and leaderboards
 * - Regional statistics aggregation
 *
 * Phase 5.1 of SimCity transformation
 */
export class RegionSystem {
  private scene: Phaser.Scene;
  private regionData: RegionData | null = null;
  private activeCityId: string | null = null;

  // Configuration
  private readonly SAVE_KEY = "wasteland-region-data";
  private readonly TRADE_UPDATE_INTERVAL = 30000; // 30 seconds = 1 game month

  // Timers
  private lastTradeUpdate = 0;

  constructor() {}

  /**
   * Initialize the system
   */
  init(scene: Phaser.Scene): void {
    this.scene = scene;
    this.loadRegionData();

    console.log("[RegionSystem] Initialized");
    console.log(
      `[RegionSystem] Region: ${this.regionData?.config.name || "None"}`,
    );
    console.log(
      `[RegionSystem] Cities: ${this.regionData?.cities.length || 0}`,
    );
  }

  /**
   * Update the system
   */
  update(delta: number): void {
    if (!this.regionData) return;

    const now = Date.now();

    // Process monthly trades
    if (now - this.lastTradeUpdate > this.TRADE_UPDATE_INTERVAL) {
      this.processMonthlyTrades();
      this.lastTradeUpdate = now;
    }

    // Update regional statistics
    this.updateRegionalStats();

    // Update regional projects
    this.updateRegionalProjects(delta);
  }

  // ============================================================================
  // REGION MANAGEMENT
  // ============================================================================

  /**
   * Create a new region
   */
  createRegion(config: Partial<RegionConfig>): RegionData {
    const defaultConfig: RegionConfig = {
      id: `region-${Date.now()}`,
      name: config.name || "Wasteland Region",
      description: config.description || "A cluster of settlements in the wasteland",
      gridWidth: config.gridWidth || 2,
      gridHeight: config.gridHeight || 2,
      maxCities: (config.gridWidth || 2) * (config.gridHeight || 2),
      sharedBudget: config.sharedBudget ?? false,
      allowTrade: config.allowTrade ?? true,
      allowRegionalProjects: config.allowRegionalProjects ?? true,
      competitiveMode: config.competitiveMode ?? false,
      startingResources: config.startingResources || {
        scrap: 100,
        food: 50,
        water: 50,
        caps: 500,
      },
      difficultyMultipliers: config.difficultyMultipliers || {
        disasterFrequency: 1.0,
        resourceProduction: 1.0,
        costs: 1.0,
      },
      createdAt: Date.now(),
      lastModified: Date.now(),
    };

    this.regionData = {
      config: defaultConfig,
      cities: [],
      tradeOffers: [],
      activeDeals: [],
      projects: [],
      stats: this.createEmptyStats(),
      regionalFund: defaultConfig.sharedBudget ? 10000 : undefined,
      lastUpdated: Date.now(),
    };

    this.saveRegionData();

    this.scene.events.emit("region:created", this.regionData);

    console.log(`[RegionSystem] Created new region: ${defaultConfig.name}`);

    return this.regionData;
  }

  /**
   * Load region data from localStorage
   */
  private loadRegionData(): void {
    const saved = localStorage.getItem(this.SAVE_KEY);
    if (saved) {
      try {
        this.regionData = JSON.parse(saved);
        console.log("[RegionSystem] Loaded region data from storage");
      } catch (error) {
        console.error("[RegionSystem] Failed to load region data:", error);
      }
    }
  }

  /**
   * Save region data to localStorage
   */
  private saveRegionData(): void {
    if (!this.regionData) return;

    this.regionData.lastUpdated = Date.now();
    localStorage.setItem(this.SAVE_KEY, JSON.stringify(this.regionData));
  }

  /**
   * Get current region data
   */
  getRegionData(): RegionData | null {
    return this.regionData;
  }

  /**
   * Get region configuration
   */
  getRegionConfig(): RegionConfig | null {
    return this.regionData?.config || null;
  }

  /**
   * Delete region (start over)
   */
  deleteRegion(): void {
    this.regionData = null;
    this.activeCityId = null;
    localStorage.removeItem(this.SAVE_KEY);

    this.scene.events.emit("region:deleted");

    console.log("[RegionSystem] Region deleted");
  }

  // ============================================================================
  // CITY MANAGEMENT
  // ============================================================================

  /**
   * Create a new city in the region
   */
  createCity(
    name: string,
    position: { x: number; y: number },
  ): CitySlot | null {
    if (!this.regionData) {
      console.error("[RegionSystem] No region exists. Create a region first.");
      return null;
    }

    // Check if position is valid
    if (
      position.x < 0 ||
      position.x >= this.regionData.config.gridWidth ||
      position.y < 0 ||
      position.y >= this.regionData.config.gridHeight
    ) {
      console.error("[RegionSystem] Invalid position:", position);
      return null;
    }

    // Check if position is already occupied
    const existingCity = this.regionData.cities.find(
      (c) => c.position.x === position.x && c.position.y === position.y,
    );
    if (existingCity) {
      console.error("[RegionSystem] Position already occupied:", position);
      return null;
    }

    // Check max cities limit
    if (this.regionData.cities.length >= this.regionData.config.maxCities) {
      console.error(
        "[RegionSystem] Region is full. Max cities:",
        this.regionData.config.maxCities,
      );
      return null;
    }

    // Create new city
    const newCity: CitySlot = {
      id: `city-${Date.now()}`,
      name,
      position,
      founded: Date.now(),
      population: 0,
      budget: this.regionData.config.sharedBudget
        ? 0
        : (this.regionData.config.startingResources.caps || 500),
      mayorRating: MayorRating.Outcast,
      stats: {
        population: 0,
        income: 0,
        happiness: 50,
        pollution: 0,
        crime: 0,
        landValue: 50,
        buildings: 0,
      },
      tradeEnabled: this.regionData.config.allowTrade,
      exportingResources: [],
      importingResources: [],
      lastModified: Date.now(),
      playTimeMinutes: 0,
      isActive: false,
    };

    this.regionData.cities.push(newCity);
    this.saveRegionData();

    this.scene.events.emit("city:created", newCity);

    console.log(`[RegionSystem] Created city: ${name} at (${position.x}, ${position.y})`);

    return newCity;
  }

  /**
   * Switch to a different city
   */
  switchCity(cityId: string): CitySlot | null {
    if (!this.regionData) return null;

    const city = this.regionData.cities.find((c) => c.id === cityId);
    if (!city) {
      console.error("[RegionSystem] City not found:", cityId);
      return null;
    }

    // Deactivate current city
    if (this.activeCityId) {
      const currentCity = this.regionData.cities.find(
        (c) => c.id === this.activeCityId,
      );
      if (currentCity) {
        currentCity.isActive = false;
      }
    }

    // Activate new city
    city.isActive = true;
    this.activeCityId = cityId;

    this.saveRegionData();

    this.scene.events.emit("city:switched", city);

    console.log(`[RegionSystem] Switched to city: ${city.name}`);

    return city;
  }

  /**
   * Update city statistics (called by MainScene)
   */
  updateCityStats(
    cityId: string,
    stats: Partial<CitySlot["stats"]>,
    population?: number,
    budget?: number,
    mayorRating?: MayorRating,
  ): void {
    if (!this.regionData) return;

    const city = this.regionData.cities.find((c) => c.id === cityId);
    if (!city) return;

    // Update stats
    Object.assign(city.stats, stats);

    if (population !== undefined) city.population = population;
    if (budget !== undefined) city.budget = budget;
    if (mayorRating !== undefined) city.mayorRating = mayorRating;

    city.lastModified = Date.now();

    this.saveRegionData();
  }

  /**
   * Save current city state (full serialization)
   */
  saveCityState(cityId: string, saveData: string): void {
    if (!this.regionData) return;

    const city = this.regionData.cities.find((c) => c.id === cityId);
    if (!city) return;

    city.saveData = saveData;
    city.lastModified = Date.now();

    this.saveRegionData();

    console.log(`[RegionSystem] Saved state for city: ${city.name}`);
  }

  /**
   * Load city state (full deserialization)
   */
  loadCityState(cityId: string): string | null {
    if (!this.regionData) return null;

    const city = this.regionData.cities.find((c) => c.id === cityId);
    if (!city || !city.saveData) return null;

    console.log(`[RegionSystem] Loaded state for city: ${city.name}`);

    return city.saveData;
  }

  /**
   * Delete a city
   */
  deleteCity(cityId: string): void {
    if (!this.regionData) return;

    const index = this.regionData.cities.findIndex((c) => c.id === cityId);
    if (index === -1) return;

    const city = this.regionData.cities[index];

    // Remove city
    this.regionData.cities.splice(index, 1);

    // Remove all trade offers/deals involving this city
    this.regionData.tradeOffers = this.regionData.tradeOffers.filter(
      (offer) =>
        offer.fromCityId !== cityId && offer.toCityId !== cityId,
    );
    this.regionData.activeDeals = this.regionData.activeDeals.filter(
      (deal) =>
        deal.fromCityId !== cityId && deal.toCityId !== cityId,
    );

    // Remove contributions from regional projects
    this.regionData.projects.forEach((project) => {
      delete project.contributions[cityId];
    });

    this.saveRegionData();

    this.scene.events.emit("city:deleted", city);

    console.log(`[RegionSystem] Deleted city: ${city.name}`);
  }

  /**
   * Get all cities in region
   */
  getCities(): CitySlot[] {
    return this.regionData?.cities || [];
  }

  /**
   * Get active city
   */
  getActiveCity(): CitySlot | null {
    if (!this.regionData || !this.activeCityId) return null;

    return (
      this.regionData.cities.find((c) => c.id === this.activeCityId) || null
    );
  }

  /**
   * Get city by ID
   */
  getCity(cityId: string): CitySlot | null {
    if (!this.regionData) return null;

    return this.regionData.cities.find((c) => c.id === cityId) || null;
  }

  // ============================================================================
  // RESOURCE TRADING
  // ============================================================================

  /**
   * Create a trade offer
   */
  createTradeOffer(
    fromCityId: string,
    toCityId: string,
    resource: TradableResource,
    amount: number,
    pricePerUnit: number,
    recurring: boolean = false,
    expiresInHours?: number,
  ): ResourceTradeOffer | null {
    if (!this.regionData || !this.regionData.config.allowTrade) return null;

    const fromCity = this.getCity(fromCityId);
    const toCity = this.getCity(toCityId);

    if (!fromCity || !toCity) {
      console.error("[RegionSystem] Invalid cities for trade offer");
      return null;
    }

    const offer: ResourceTradeOffer = {
      id: `offer-${Date.now()}`,
      fromCityId,
      toCityId,
      resource,
      amount,
      pricePerUnit,
      totalCost: amount * pricePerUnit,
      recurring,
      expiresAt: expiresInHours
        ? Date.now() + expiresInHours * 60 * 60 * 1000
        : undefined,
      createdAt: Date.now(),
    };

    this.regionData.tradeOffers.push(offer);
    this.saveRegionData();

    this.scene.events.emit("trade:offer-created", offer);

    console.log(
      `[RegionSystem] Trade offer created: ${fromCity.name} → ${toCity.name} (${amount} ${resource} @ ${pricePerUnit} caps each)`,
    );

    return offer;
  }

  /**
   * Accept a trade offer (creates active deal)
   */
  acceptTradeOffer(offerId: string): ResourceTradeDeal | null {
    if (!this.regionData) return null;

    const offer = this.regionData.tradeOffers.find((o) => o.id === offerId);
    if (!offer) {
      console.error("[RegionSystem] Trade offer not found:", offerId);
      return null;
    }

    // Create active deal
    const deal: ResourceTradeDeal = {
      id: `deal-${Date.now()}`,
      offerId,
      fromCityId: offer.fromCityId,
      toCityId: offer.toCityId,
      resource: offer.resource,
      amountPerMonth: offer.amount,
      pricePerUnit: offer.pricePerUnit,
      startedAt: Date.now(),
      lastTradeAt: Date.now(),
      totalTraded: 0,
      totalPaid: 0,
      active: true,
    };

    this.regionData.activeDeals.push(deal);

    // Remove offer if not recurring
    if (!offer.recurring) {
      this.regionData.tradeOffers = this.regionData.tradeOffers.filter(
        (o) => o.id !== offerId,
      );
    }

    this.saveRegionData();

    this.scene.events.emit("trade:deal-accepted", deal);

    const fromCity = this.getCity(offer.fromCityId);
    const toCity = this.getCity(offer.toCityId);

    console.log(
      `[RegionSystem] Trade deal accepted: ${fromCity?.name} → ${toCity?.name}`,
    );

    return deal;
  }

  /**
   * Cancel a trade deal
   */
  cancelTradeDeal(dealId: string): void {
    if (!this.regionData) return;

    const deal = this.regionData.activeDeals.find((d) => d.id === dealId);
    if (!deal) return;

    deal.active = false;

    this.saveRegionData();

    this.scene.events.emit("trade:deal-cancelled", deal);

    console.log("[RegionSystem] Trade deal cancelled");
  }

  /**
   * Process monthly trades (called every 30 seconds)
   */
  private processMonthlyTrades(): void {
    if (!this.regionData) return;

    const now = Date.now();

    this.regionData.activeDeals.forEach((deal) => {
      if (!deal.active) return;

      // Execute trade (emit event for MainScene to handle resource transfer)
      this.scene.events.emit("trade:execute", deal);

      deal.lastTradeAt = now;
      deal.totalTraded += deal.amountPerMonth;
      deal.totalPaid += deal.amountPerMonth * deal.pricePerUnit;
    });

    // Remove expired offers
    this.regionData.tradeOffers = this.regionData.tradeOffers.filter(
      (offer) => !offer.expiresAt || offer.expiresAt > now,
    );

    this.saveRegionData();
  }

  /**
   * Get all trade offers
   */
  getTradeOffers(): ResourceTradeOffer[] {
    return this.regionData?.tradeOffers || [];
  }

  /**
   * Get active trade deals
   */
  getActiveDeals(): ResourceTradeDeal[] {
    return this.regionData?.activeDeals.filter((d) => d.active) || [];
  }

  // ============================================================================
  // REGIONAL PROJECTS
  // ============================================================================

  /**
   * Propose a regional project
   */
  proposeRegionalProject(
    type: RegionalProjectType,
    name: string,
    description: string,
    cost: ResourceCost,
    benefits: RegionalProject["benefits"],
    requirements?: RegionalProject["requirements"],
  ): RegionalProject | null {
    if (!this.regionData || !this.regionData.config.allowRegionalProjects) {
      return null;
    }

    const project: RegionalProject = {
      id: `project-${Date.now()}`,
      type,
      name,
      description,
      totalCost: cost,
      contributions: {},
      status: RegionalProjectStatus.Proposed,
      progress: 0,
      benefits,
      requirements: requirements || {},
      proposedAt: Date.now(),
    };

    this.regionData.projects.push(project);
    this.saveRegionData();

    this.scene.events.emit("project:proposed", project);

    console.log(`[RegionSystem] Regional project proposed: ${name}`);

    return project;
  }

  /**
   * Contribute to a regional project
   */
  contributeToProject(
    projectId: string,
    cityId: string,
    amount: number,
  ): void {
    if (!this.regionData) return;

    const project = this.regionData.projects.find((p) => p.id === projectId);
    if (!project) return;

    const city = this.getCity(cityId);
    if (!city) return;

    // Add contribution
    project.contributions[cityId] =
      (project.contributions[cityId] || 0) + amount;

    // Calculate progress
    const totalContributed = Object.values(project.contributions).reduce(
      (sum, val) => sum + val,
      0,
    );
    const totalCost = Object.values(project.totalCost).reduce(
      (sum, val) => sum + val,
      0,
    );
    project.progress = Math.min(100, (totalContributed / totalCost) * 100);

    // Update status
    if (project.status === RegionalProjectStatus.Proposed && project.progress > 0) {
      project.status = RegionalProjectStatus.InProgress;
      project.startedAt = Date.now();
    }

    if (project.progress >= 100) {
      project.status = RegionalProjectStatus.Completed;
      project.completedAt = Date.now();

      this.scene.events.emit("project:completed", project);

      console.log(`[RegionSystem] Regional project completed: ${project.name}`);
    }

    this.saveRegionData();
  }

  /**
   * Abandon a regional project
   */
  abandonProject(projectId: string): void {
    if (!this.regionData) return;

    const project = this.regionData.projects.find((p) => p.id === projectId);
    if (!project) return;

    project.status = RegionalProjectStatus.Abandoned;

    this.saveRegionData();

    this.scene.events.emit("project:abandoned", project);

    console.log(`[RegionSystem] Regional project abandoned: ${project.name}`);
  }

  /**
   * Update regional projects
   */
  private updateRegionalProjects(delta: number): void {
    // Projects don't update passively - they progress through contributions
    // This method is for future expansion (e.g., construction time delays)
  }

  /**
   * Get all regional projects
   */
  getRegionalProjects(): RegionalProject[] {
    return this.regionData?.projects || [];
  }

  /**
   * Get completed projects (for bonus calculation)
   */
  getCompletedProjects(): RegionalProject[] {
    return (
      this.regionData?.projects.filter(
        (p) => p.status === RegionalProjectStatus.Completed,
      ) || []
    );
  }

  // ============================================================================
  // REGIONAL STATISTICS
  // ============================================================================

  /**
   * Create empty regional stats
   */
  private createEmptyStats(): RegionStats {
    return {
      totalPopulation: 0,
      totalBudget: 0,
      totalIncome: 0,
      totalExpenses: 0,
      averageHappiness: 0,
      averagePollution: 0,
      averageCrime: 0,
      totalBuildings: 0,
      totalLandValue: 0,
      totalResources: {},
      activeTradeDeals: 0,
      monthlyTradeVolume: 0,
      completedProjects: 0,
      activeProjects: 0,
    };
  }

  /**
   * Update regional statistics (aggregate from all cities)
   */
  private updateRegionalStats(): void {
    if (!this.regionData) return;

    const stats = this.createEmptyStats();
    const cities = this.regionData.cities;

    if (cities.length === 0) {
      this.regionData.stats = stats;
      return;
    }

    // Aggregate city statistics
    cities.forEach((city) => {
      stats.totalPopulation += city.population;
      stats.totalBudget += city.budget;
      stats.totalIncome += city.stats.income;
      stats.averageHappiness += city.stats.happiness;
      stats.averagePollution += city.stats.pollution;
      stats.averageCrime += city.stats.crime;
      stats.totalBuildings += city.stats.buildings;
      stats.totalLandValue += city.stats.landValue;
    });

    // Calculate averages
    stats.averageHappiness /= cities.length;
    stats.averagePollution /= cities.length;
    stats.averageCrime /= cities.length;

    // Count trade deals
    stats.activeTradeDeals = this.regionData.activeDeals.filter(
      (d) => d.active,
    ).length;

    // Count projects
    stats.completedProjects = this.regionData.projects.filter(
      (p) => p.status === RegionalProjectStatus.Completed,
    ).length;
    stats.activeProjects = this.regionData.projects.filter(
      (p) => p.status === RegionalProjectStatus.InProgress,
    ).length;

    this.regionData.stats = stats;
  }

  /**
   * Get regional statistics
   */
  getRegionalStats(): RegionStats | null {
    return this.regionData?.stats || null;
  }

  // ============================================================================
  // CITY COMPARISON & LEADERBOARDS
  // ============================================================================

  /**
   * Get city leaderboard (ranked by overall score)
   */
  getCityLeaderboard(): CityComparison[] {
    if (!this.regionData) return [];

    const comparisons = this.regionData.cities.map((city) => {
      const comparison: CityComparison = {
        cityId: city.id,
        cityName: city.name,
        rank: 0, // Will be set after sorting
        population: city.population,
        income: city.stats.income,
        happiness: city.stats.happiness,
        mayorRating: city.mayorRating,
        landValue: city.stats.landValue,
        achievementsUnlocked: 0, // TODO: Link to achievement system
        scenariosCompleted: 0, // TODO: Link to scenario system
        playTimeMinutes: city.playTimeMinutes,
        foundedAt: city.founded,
        overallScore: this.calculateCityScore(city),
      };

      return comparison;
    });

    // Sort by overall score (descending)
    comparisons.sort((a, b) => b.overallScore - a.overallScore);

    // Assign ranks
    comparisons.forEach((comparison, index) => {
      comparison.rank = index + 1;
    });

    return comparisons;
  }

  /**
   * Calculate overall city score (0-100)
   */
  private calculateCityScore(city: CitySlot): number {
    // Weighted score:
    // - Population: 30%
    // - Happiness: 25%
    // - Income: 20%
    // - Land Value: 15%
    // - Mayor Rating: 10%

    const populationScore = Math.min(100, (city.population / 1000) * 100);
    const happinessScore = city.stats.happiness;
    const incomeScore = Math.min(100, (city.stats.income / 500) * 100);
    const landValueScore = Math.min(100, city.stats.landValue);

    const mayorRatingScore = (() => {
      switch (city.mayorRating) {
        case MayorRating.Outcast:
          return 0;
        case MayorRating.Settler:
          return 20;
        case MayorRating.Overseer:
          return 40;
        case MayorRating.Guardian:
          return 60;
        case MayorRating.WastelandHero:
          return 80;
        case MayorRating.Legend:
          return 100;
        default:
          return 0;
      }
    })();

    const overallScore =
      populationScore * 0.3 +
      happinessScore * 0.25 +
      incomeScore * 0.2 +
      landValueScore * 0.15 +
      mayorRatingScore * 0.1;

    return Math.round(overallScore);
  }

  /**
   * Compare two cities
   */
  compareCities(cityId1: string, cityId2: string): {
    city1: CityComparison;
    city2: CityComparison;
    winner: string | null;
  } | null {
    const city1 = this.getCity(cityId1);
    const city2 = this.getCity(cityId2);

    if (!city1 || !city2) return null;

    const leaderboard = this.getCityLeaderboard();

    const comparison1 = leaderboard.find((c) => c.cityId === cityId1);
    const comparison2 = leaderboard.find((c) => c.cityId === cityId2);

    if (!comparison1 || !comparison2) return null;

    const winner =
      comparison1.overallScore > comparison2.overallScore
        ? cityId1
        : comparison2.overallScore > comparison1.overallScore
          ? cityId2
          : null;

    return {
      city1: comparison1,
      city2: comparison2,
      winner,
    };
  }
}
