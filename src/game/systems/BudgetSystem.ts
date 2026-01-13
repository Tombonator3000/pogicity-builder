import Phaser from "phaser";
import { GameSystem } from "./GameSystem";
import type { GridCell, Resources } from "../types";
import { GRID_WIDTH, GRID_HEIGHT } from "../types";

/**
 * Budget categories for income and expenses
 */
export interface BudgetCategory {
  residential: number;
  commercial: number;
  industrial: number;
  services: number;
  infrastructure: number;
  maintenance: number;
}

/**
 * Tax rates for different zone types (percentage)
 */
export interface TaxRates {
  residential: number; // 0-20%
  commercial: number; // 0-20%
  industrial: number; // 0-20%
}

/**
 * Budget state for a given month/cycle
 */
export interface BudgetState {
  income: BudgetCategory;
  expenses: BudgetCategory;
  netIncome: number;
  balance: number; // Current cash balance (caps)
  debt: number; // Outstanding loans
  lastUpdate: number; // Timestamp of last budget cycle
}

/**
 * BudgetSystem - SimCity-style budget and taxation
 *
 * Features:
 * - Monthly budget cycle (every 30 seconds)
 * - Tax collection from RCI zones
 * - Service expenses (police, fire, health, education)
 * - Infrastructure maintenance costs
 * - Tax rate adjustments affect happiness and income
 * - Loans and debt management
 *
 * Wasteland Theme:
 * - Residential tax = Settlement fees
 * - Commercial tax = Trade licenses
 * - Industrial tax = Scrap production fees
 * - Services = Militia, Medics, etc.
 */
export class BudgetSystem implements GameSystem {
  private scene!: Phaser.Scene;

  // Budget state
  private taxRates: TaxRates = {
    residential: 7, // Default 7%
    commercial: 7,
    industrial: 7,
  };

  private budgetState: BudgetState = {
    income: {
      residential: 0,
      commercial: 0,
      industrial: 0,
      services: 0,
      infrastructure: 0,
      maintenance: 0,
    },
    expenses: {
      residential: 0,
      commercial: 0,
      industrial: 0,
      services: 0,
      infrastructure: 0,
      maintenance: 0,
    },
    netIncome: 0,
    balance: 0,
    debt: 0,
    lastUpdate: 0,
  };

  // Configuration
  private readonly BUDGET_CYCLE_INTERVAL = 30000; // 30 seconds = 1 month
  private readonly BASE_TAX_PER_ZONE = 10; // Base tax income per developed zone
  private readonly MAINTENANCE_COST_PER_BUILDING = 2; // Maintenance per building
  private readonly SERVICE_COST_PER_WORKER = 5; // Cost per worker in service buildings

  // Loan system
  private readonly MAX_LOAN_AMOUNT = 10000;
  private readonly LOAN_INTEREST_RATE = 0.05; // 5% per month

  /**
   * Initialize the budget system
   */
  init(scene: Phaser.Scene): void {
    this.scene = scene;
    this.budgetState.lastUpdate = Date.now();
  }

  /**
   * Calculate tax income from zones
   */
  private calculateTaxIncome(grid: GridCell[][]): {
    residential: number;
    commercial: number;
    industrial: number;
  } {
    let residentialZones = 0;
    let commercialZones = 0;
    let industrialZones = 0;

    // Count developed zones (zones with buildings on them)
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        const cell = grid[y][x];

        // Count zones with buildings as developed
        if (cell.type === "building" && cell.zoneType) {
          if (cell.zoneType === "residential") residentialZones++;
          else if (cell.zoneType === "commercial") commercialZones++;
          else if (cell.zoneType === "industrial") industrialZones++;
        }
      }
    }

    // Calculate tax income (base tax * tax rate * number of zones)
    const residentialTax =
      this.BASE_TAX_PER_ZONE * (this.taxRates.residential / 100) * residentialZones;
    const commercialTax =
      this.BASE_TAX_PER_ZONE * (this.taxRates.commercial / 100) * commercialZones;
    const industrialTax =
      this.BASE_TAX_PER_ZONE * (this.taxRates.industrial / 100) * industrialZones;

    return {
      residential: Math.round(residentialTax),
      commercial: Math.round(commercialTax),
      industrial: Math.round(industrialTax),
    };
  }

  /**
   * Calculate service expenses
   */
  private calculateServiceExpenses(grid: GridCell[][]): number {
    let serviceBuildings = 0;

    // Count service buildings (defense, health, etc.)
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        const cell = grid[y][x];

        // Count service buildings
        if (cell.type === "building" && cell.buildingId) {
          const buildingId = cell.buildingId;
          // Service buildings: militia, medic, watch_tower, radio_tower
          if (
            buildingId.includes("militia") ||
            buildingId.includes("medic") ||
            buildingId.includes("watch") ||
            buildingId.includes("radio")
          ) {
            serviceBuildings++;
          }
        }
      }
    }

    return serviceBuildings * this.SERVICE_COST_PER_WORKER;
  }

  /**
   * Calculate infrastructure and maintenance expenses
   */
  private calculateMaintenanceExpenses(grid: GridCell[][]): {
    infrastructure: number;
    maintenance: number;
  } {
    let buildings = 0;
    let roads = 0;

    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        const cell = grid[y][x];

        if (cell.type === "building") {
          buildings++;
        } else if (cell.type === "road" || cell.type === "asphalt") {
          roads++;
        }
      }
    }

    // Infrastructure cost = road maintenance
    const infrastructureCost = Math.round(roads * 0.1); // 0.1 caps per road tile

    // Maintenance cost = building upkeep
    const maintenanceCost = buildings * this.MAINTENANCE_COST_PER_BUILDING;

    return {
      infrastructure: infrastructureCost,
      maintenance: maintenanceCost,
    };
  }

  /**
   * Process monthly budget cycle
   */
  processBudgetCycle(grid: GridCell[][], currentBalance: number): BudgetState {
    // Calculate income from taxes
    const taxIncome = this.calculateTaxIncome(grid);

    // Calculate expenses
    const serviceExpenses = this.calculateServiceExpenses(grid);
    const { infrastructure, maintenance } = this.calculateMaintenanceExpenses(grid);

    // Update budget state
    this.budgetState.income = {
      residential: taxIncome.residential,
      commercial: taxIncome.commercial,
      industrial: taxIncome.industrial,
      services: 0,
      infrastructure: 0,
      maintenance: 0,
    };

    this.budgetState.expenses = {
      residential: 0,
      commercial: 0,
      industrial: 0,
      services: serviceExpenses,
      infrastructure,
      maintenance,
    };

    // Calculate net income
    const totalIncome =
      taxIncome.residential + taxIncome.commercial + taxIncome.industrial;
    const totalExpenses = serviceExpenses + infrastructure + maintenance;

    this.budgetState.netIncome = totalIncome - totalExpenses;

    // Apply interest on debt
    if (this.budgetState.debt > 0) {
      const interestCharge = Math.round(
        this.budgetState.debt * this.LOAN_INTEREST_RATE
      );
      this.budgetState.expenses.maintenance += interestCharge;
      this.budgetState.netIncome -= interestCharge;
    }

    // Update balance
    this.budgetState.balance = currentBalance + this.budgetState.netIncome;
    this.budgetState.lastUpdate = Date.now();

    return { ...this.budgetState };
  }

  /**
   * Set tax rates (affects happiness and income)
   */
  setTaxRates(rates: Partial<TaxRates>): void {
    if (rates.residential !== undefined) {
      this.taxRates.residential = Math.max(0, Math.min(20, rates.residential));
    }
    if (rates.commercial !== undefined) {
      this.taxRates.commercial = Math.max(0, Math.min(20, rates.commercial));
    }
    if (rates.industrial !== undefined) {
      this.taxRates.industrial = Math.max(0, Math.min(20, rates.industrial));
    }
  }

  /**
   * Get current tax rates
   */
  getTaxRates(): TaxRates {
    return { ...this.taxRates };
  }

  /**
   * Calculate happiness penalty from taxes
   * Higher taxes = lower happiness
   * Returns penalty from 0 to -30
   */
  calculateTaxHappinessPenalty(): number {
    const avgTaxRate =
      (this.taxRates.residential +
        this.taxRates.commercial +
        this.taxRates.industrial) /
      3;

    // 0-7% tax = no penalty
    // 7-15% tax = -10 to -20 penalty
    // 15-20% tax = -20 to -30 penalty
    if (avgTaxRate <= 7) {
      return 0;
    } else if (avgTaxRate <= 15) {
      return -Math.round((avgTaxRate - 7) * 2);
    } else {
      return -Math.round(20 + (avgTaxRate - 15) * 2);
    }
  }

  /**
   * Take out a loan
   */
  takeLoan(amount: number): boolean {
    if (amount <= 0 || amount > this.MAX_LOAN_AMOUNT) {
      return false;
    }

    if (this.budgetState.debt + amount > this.MAX_LOAN_AMOUNT) {
      return false;
    }

    this.budgetState.debt += amount;
    this.budgetState.balance += amount;
    return true;
  }

  /**
   * Repay loan
   */
  repayLoan(amount: number): boolean {
    if (amount <= 0 || amount > this.budgetState.debt) {
      return false;
    }

    if (amount > this.budgetState.balance) {
      return false; // Can't afford
    }

    this.budgetState.debt -= amount;
    this.budgetState.balance -= amount;
    return true;
  }

  /**
   * Get current budget state
   */
  getBudgetState(): BudgetState {
    return { ...this.budgetState };
  }

  /**
   * Get time until next budget cycle (in seconds)
   */
  getTimeUntilNextCycle(): number {
    const elapsed = Date.now() - this.budgetState.lastUpdate;
    const remaining = this.BUDGET_CYCLE_INTERVAL - elapsed;
    return Math.max(0, Math.round(remaining / 1000));
  }

  /**
   * Check if budget cycle should run
   */
  shouldRunBudgetCycle(): boolean {
    const elapsed = Date.now() - this.budgetState.lastUpdate;
    return elapsed >= this.BUDGET_CYCLE_INTERVAL;
  }

  update(time: number, delta: number): void {
    // Budget cycle is checked externally via shouldRunBudgetCycle()
  }

  serialize(): any {
    return {
      taxRates: this.taxRates,
      budgetState: this.budgetState,
    };
  }

  deserialize(data: any): void {
    if (data.taxRates) {
      this.taxRates = data.taxRates;
    }
    if (data.budgetState) {
      this.budgetState = data.budgetState;
    }
  }
}
