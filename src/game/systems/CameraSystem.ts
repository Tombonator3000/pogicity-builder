import Phaser from 'phaser';
import { CAMERA_CONFIG, GRID_CONFIG } from '../config';
import { gridToScreen } from '../utils/GridUtils';
import { GameSystem } from './GameSystem';

/**
 * Camera control system
 * Handles camera movement, zoom, panning, and screen shake
 */
export class CameraSystem implements GameSystem {
  private scene!: Phaser.Scene;
  private camera!: Phaser.Cameras.Scene2D.Camera;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys | null;

  // Camera state
  private baseScrollX: number = 0;
  private baseScrollY: number = 0;

  // Panning state
  private isPanning: boolean = false;
  private panStartX: number = 0;
  private panStartY: number = 0;
  private cameraStartX: number = 0;
  private cameraStartY: number = 0;

  // Screen shake state
  private shakeOffsetX: number = 0;
  private shakeOffsetY: number = 0;
  private shakeDuration: number = 0;
  private shakeIntensity: number = 0;
  private shakeElapsed: number = 0;
  private shakeAxis: 'x' | 'y' | 'both' = 'y';

  init(scene: Phaser.Scene): void {
    this.scene = scene;
    this.camera = scene.cameras.main;

    // Set up keyboard controls
    if (scene.input.keyboard) {
      this.cursors = scene.input.keyboard.createCursorKeys();
    }

    // Center camera on grid
    this.centerOnGrid();
  }

  update(delta: number): void {
    this.updateScreenShake(delta);
    this.updateKeyboardMovement();
    this.applyCamera();
  }

  /**
   * Centers the camera on the grid
   */
  centerOnGrid(): void {
    const centerScreen = gridToScreen(GRID_CONFIG.width / 2, GRID_CONFIG.height / 2);
    this.baseScrollX = centerScreen.x - this.camera.width / 2;
    this.baseScrollY = centerScreen.y - this.camera.height / 2;
    this.camera.setScroll(this.baseScrollX, this.baseScrollY);
  }

  /**
   * Sets camera zoom level
   */
  setZoom(zoom: number): void {
    const clamped = Phaser.Math.Clamp(zoom, CAMERA_CONFIG.minZoom, CAMERA_CONFIG.maxZoom);
    this.camera.setZoom(clamped);
  }

  /**
   * Gets current camera zoom level
   */
  getZoom(): number {
    return this.camera.zoom;
  }

  /**
   * Handles mouse wheel zoom
   */
  handleWheel(deltaY: number): void {
    const oldZoom = this.camera.zoom;
    const newZoom = Phaser.Math.Clamp(
      oldZoom - deltaY * CAMERA_CONFIG.zoomSensitivity,
      CAMERA_CONFIG.minZoom,
      CAMERA_CONFIG.maxZoom
    );
    this.camera.setZoom(newZoom);
  }

  /**
   * Starts camera panning
   */
  startPanning(pointerX: number, pointerY: number): void {
    this.isPanning = true;
    this.panStartX = pointerX;
    this.panStartY = pointerY;
    this.cameraStartX = this.baseScrollX;
    this.cameraStartY = this.baseScrollY;
  }

  /**
   * Updates camera panning
   */
  updatePanning(pointerX: number, pointerY: number): void {
    if (!this.isPanning) return;

    const dx = (this.panStartX - pointerX) / this.camera.zoom;
    const dy = (this.panStartY - pointerY) / this.camera.zoom;
    this.baseScrollX = this.cameraStartX + dx;
    this.baseScrollY = this.cameraStartY + dy;
  }

  /**
   * Stops camera panning
   */
  stopPanning(): void {
    this.isPanning = false;
  }

  /**
   * Checks if camera is currently panning
   */
  isPanningActive(): boolean {
    return this.isPanning;
  }

  /**
   * Triggers screen shake effect
   * @param axis - Shake axis: 'x', 'y', or 'both'
   * @param intensity - Shake intensity (default 2)
   * @param duration - Shake duration in milliseconds (default 150)
   */
  shakeScreen(axis: 'x' | 'y' | 'both' = 'y', intensity: number = 2, duration: number = 150): void {
    this.shakeAxis = axis;
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
    this.shakeElapsed = 0;
  }

  destroy(): void {
    this.cursors = null;
  }

  // ============================================
  // PRIVATE METHODS
  // ============================================

  private updateScreenShake(delta: number): void {
    if (this.shakeElapsed < this.shakeDuration) {
      this.shakeElapsed += delta;
      const t = Math.min(this.shakeElapsed / this.shakeDuration, 1);
      const envelope = (1 - t) * (1 - t);
      const shakeValue = Math.sin(t * 3 * Math.PI * 2) * this.shakeIntensity * envelope;

      if (this.shakeAxis === 'x' || this.shakeAxis === 'both') {
        this.shakeOffsetX = shakeValue;
      } else {
        this.shakeOffsetX = 0;
      }

      if (this.shakeAxis === 'y' || this.shakeAxis === 'both') {
        this.shakeOffsetY = shakeValue;
      } else {
        this.shakeOffsetY = 0;
      }
    } else {
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
    }
  }

  private updateKeyboardMovement(): void {
    if (!this.cursors) return;

    const speed = CAMERA_CONFIG.keyboardSpeed / this.camera.zoom;

    if (this.cursors.left.isDown) {
      this.baseScrollX -= speed;
    }
    if (this.cursors.right.isDown) {
      this.baseScrollX += speed;
    }
    if (this.cursors.up.isDown) {
      this.baseScrollY -= speed;
    }
    if (this.cursors.down.isDown) {
      this.baseScrollY += speed;
    }
  }

  private applyCamera(): void {
    this.camera.setScroll(
      Math.round(this.baseScrollX + this.shakeOffsetX),
      Math.round(this.baseScrollY + this.shakeOffsetY)
    );
  }
}
