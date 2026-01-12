import { GameSystem } from './GameSystem';
import {
  HistoricalDataPoint,
  Resources,
  ZoneDemand,
} from '../types';

/**
 * HistorySystem - Historical data tracking for graphs and charts
 *
 * Tracks game metrics over time for visualization:
 * - Population changes
 * - Resource levels
 * - Happiness trends
 * - Zone demand fluctuations
 * - Budget income/expenses (when implemented)
 *
 * Features:
 * - Periodic sampling (configurable interval)
 * - Circular buffer with max capacity
 * - Multiple time range queries (1h, 6h, 24h, 7d)
 * - Data export for charting libraries
 */
export class HistorySystem implements GameSystem {
  private scene!: Phaser.Scene;
  private history: HistoricalDataPoint[] = [];

  // Configuration
  private readonly MAX_DATA_POINTS = 1000; // Maximum history entries
  private readonly SAMPLE_INTERVAL = 10000; // Sample every 10 seconds (in ms)

  private lastSampleTime: number = 0;
  private gameStartTime: number = 0;

  init(scene: Phaser.Scene): void {
    this.scene = scene;
    this.gameStartTime = Date.now();
    console.log('[HistorySystem] Initialized');
  }

  update(delta: number): void {
    this.lastSampleTime += delta;
  }

  destroy(): void {
    this.history = [];
    console.log('[HistorySystem] Destroyed');
  }

  /**
   * Record a data point (called periodically from MainScene)
   */
  recordDataPoint(
    gameTime: number,
    population: number,
    happiness: number,
    resources: Partial<Resources>,
    zoneDemand?: ZoneDemand,
    income?: number,
    expenses?: number
  ): void {
    // Check if it's time to sample
    if (this.lastSampleTime < this.SAMPLE_INTERVAL) {
      return;
    }

    this.lastSampleTime = 0;

    const dataPoint: HistoricalDataPoint = {
      timestamp: gameTime,
      population,
      happiness,
      resources,
      zoneDemand,
      income,
      expenses,
    };

    this.history.push(dataPoint);

    // Maintain max capacity (circular buffer behavior)
    if (this.history.length > this.MAX_DATA_POINTS) {
      this.history.shift();
    }

    console.log(
      `[HistorySystem] Recorded data point at ${gameTime}s (total: ${this.history.length})`
    );
  }

  /**
   * Get all historical data
   */
  getAllData(): HistoricalDataPoint[] {
    return [...this.history];
  }

  /**
   * Get data within a time range (in seconds)
   */
  getDataInRange(startTime: number, endTime: number): HistoricalDataPoint[] {
    return this.history.filter(
      (point) => point.timestamp >= startTime && point.timestamp <= endTime
    );
  }

  /**
   * Get last N data points
   */
  getLastNPoints(n: number): HistoricalDataPoint[] {
    return this.history.slice(-n);
  }

  /**
   * Get data for the last N seconds of game time
   */
  getLastNSeconds(seconds: number, currentGameTime: number): HistoricalDataPoint[] {
    const startTime = currentGameTime - seconds;
    return this.history.filter((point) => point.timestamp >= startTime);
  }

  /**
   * Get common time ranges for UI
   */
  getTimeRangeData(range: '1h' | '6h' | '24h' | '7d' | 'all', currentGameTime: number): HistoricalDataPoint[] {
    switch (range) {
      case '1h':
        return this.getLastNSeconds(3600, currentGameTime); // 1 hour
      case '6h':
        return this.getLastNSeconds(3600 * 6, currentGameTime); // 6 hours
      case '24h':
        return this.getLastNSeconds(3600 * 24, currentGameTime); // 24 hours
      case '7d':
        return this.getLastNSeconds(3600 * 24 * 7, currentGameTime); // 7 days
      case 'all':
        return this.getAllData();
      default:
        return this.getAllData();
    }
  }

  /**
   * Get statistics for a specific metric over time
   */
  getMetricStats(metric: keyof HistoricalDataPoint): {
    min: number;
    max: number;
    average: number;
    current: number;
  } {
    if (this.history.length === 0) {
      return { min: 0, max: 0, average: 0, current: 0 };
    }

    let min = Infinity;
    let max = -Infinity;
    let sum = 0;
    let count = 0;

    for (const point of this.history) {
      const value = point[metric];
      if (typeof value === 'number') {
        min = Math.min(min, value);
        max = Math.max(max, value);
        sum += value;
        count++;
      }
    }

    const current = this.history[this.history.length - 1][metric] as number || 0;

    return {
      min: min === Infinity ? 0 : min,
      max: max === -Infinity ? 0 : max,
      average: count > 0 ? sum / count : 0,
      current,
    };
  }

  /**
   * Get resource-specific stats
   */
  getResourceStats(resourceKey: keyof Resources): {
    min: number;
    max: number;
    average: number;
    current: number;
  } {
    if (this.history.length === 0) {
      return { min: 0, max: 0, average: 0, current: 0 };
    }

    let min = Infinity;
    let max = -Infinity;
    let sum = 0;
    let count = 0;

    for (const point of this.history) {
      const value = point.resources[resourceKey];
      if (typeof value === 'number') {
        min = Math.min(min, value);
        max = Math.max(max, value);
        sum += value;
        count++;
      }
    }

    const lastPoint = this.history[this.history.length - 1];
    const current = lastPoint.resources[resourceKey] as number || 0;

    return {
      min: min === Infinity ? 0 : min,
      max: max === -Infinity ? 0 : max,
      average: count > 0 ? sum / count : 0,
      current,
    };
  }

  /**
   * Export data for charting libraries (e.g., Recharts)
   */
  exportForCharts(
    range: '1h' | '6h' | '24h' | '7d' | 'all',
    currentGameTime: number
  ): Array<{
    time: number;
    population: number;
    happiness: number;
    scrap?: number;
    food?: number;
    water?: number;
    power?: number;
    medicine?: number;
    caps?: number;
    residential?: number;
    commercial?: number;
    industrial?: number;
  }> {
    const data = this.getTimeRangeData(range, currentGameTime);

    return data.map((point) => ({
      time: point.timestamp,
      population: point.population,
      happiness: point.happiness,
      scrap: point.resources.scrap,
      food: point.resources.food,
      water: point.resources.water,
      power: point.resources.power,
      medicine: point.resources.medicine,
      caps: point.resources.caps,
      residential: point.zoneDemand?.residential,
      commercial: point.zoneDemand?.commercial,
      industrial: point.zoneDemand?.industrial,
    }));
  }

  /**
   * Clear all historical data
   */
  clearHistory(): void {
    this.history = [];
    this.gameStartTime = Date.now();
    console.log('[HistorySystem] History cleared');
  }

  /**
   * Get number of data points in history
   */
  getDataPointCount(): number {
    return this.history.length;
  }

  /**
   * Check if enough data exists for meaningful graphs
   */
  hasEnoughData(): boolean {
    return this.history.length >= 3; // Need at least 3 points for a trend
  }
}
