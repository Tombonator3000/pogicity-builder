import { parseGIF, decompressFrames, ParsedFrame } from 'gifuct-js';
import { getAssetPath } from './utils/AssetPathUtils';

export interface GifAnimation {
  frames: HTMLCanvasElement[];
  delays: number[];
  width: number;
  height: number;
}

/**
 * Parse a GIF file and extract frames as canvas elements
 */
export async function loadGifAnimation(url: string): Promise<GifAnimation> {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  const gif = parseGIF(buffer);
  const frames = decompressFrames(gif, true);

  if (frames.length === 0) {
    throw new Error('No frames found in GIF');
  }

  const { width, height } = gif.lsd;
  const canvasFrames: HTMLCanvasElement[] = [];
  const delays: number[] = [];

  // Create a persistent canvas for compositing
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext('2d')!;

  // Clear with transparency
  tempCtx.clearRect(0, 0, width, height);

  for (const frame of frames) {
    const frameCanvas = document.createElement('canvas');
    frameCanvas.width = width;
    frameCanvas.height = height;
    const frameCtx = frameCanvas.getContext('2d')!;

    // Handle disposal method from previous frame
    if (frame.disposalType === 2) {
      // Restore to background
      tempCtx.clearRect(0, 0, width, height);
    }
    // disposalType 1: Do not dispose (keep previous frame)
    // disposalType 3: Restore to previous (complex, skip for now)

    // Draw frame patch onto temp canvas
    const imageData = tempCtx.createImageData(frame.dims.width, frame.dims.height);
    imageData.data.set(frame.patch);
    tempCtx.putImageData(imageData, frame.dims.left, frame.dims.top);

    // Copy composited result to frame canvas
    frameCtx.drawImage(tempCanvas, 0, 0);
    canvasFrames.push(frameCanvas);
    delays.push(frame.delay || 100);
  }

  return { frames: canvasFrames, delays, width, height };
}

/**
 * Create Phaser textures from a GIF animation
 */
export async function createGifTextures(
  scene: Phaser.Scene,
  key: string,
  url: string
): Promise<{ frameKeys: string[]; delays: number[] }> {
  try {
    const animation = await loadGifAnimation(url);
    const frameKeys: string[] = [];

    for (let i = 0; i < animation.frames.length; i++) {
      const frameKey = `${key}_frame_${i}`;
      if (!scene.textures.exists(frameKey)) {
        scene.textures.addCanvas(frameKey, animation.frames[i]);
      }
      frameKeys.push(frameKey);
    }

    return { frameKeys, delays: animation.delays };
  } catch (error) {
    console.warn(`Failed to load GIF: ${url}`, error);
    return { frameKeys: [], delays: [] };
  }
}

/**
 * Character animation manager for handling GIF-based walking animations
 */
export class CharacterAnimationManager {
  private scene: Phaser.Scene;
  private animations: Map<string, { frameKeys: string[]; delays: number[] }> = new Map();
  private loadingPromises: Map<string, Promise<void>> = new Map();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  async loadCharacterAnimations(): Promise<void> {
    const characters = ['banana', 'apple'];
    const directions = ['east', 'north', 'south', 'west'];

    const loadPromises: Promise<void>[] = [];

    for (const char of characters) {
      for (const dir of directions) {
        const key = `${char}_${dir}`;
        const url = getAssetPath(`Characters/${char}walk${dir}.gif`);

        const promise = this.loadAnimation(key, url);
        loadPromises.push(promise);
      }
    }

    await Promise.all(loadPromises);
  }

  private async loadAnimation(key: string, url: string): Promise<void> {
    if (this.animations.has(key) || this.loadingPromises.has(key)) {
      return this.loadingPromises.get(key);
    }

    const promise = createGifTextures(this.scene, key, url).then((result) => {
      if (result.frameKeys.length > 0) {
        this.animations.set(key, result);
      }
    });

    this.loadingPromises.set(key, promise);
    return promise;
  }

  getAnimation(characterType: string, direction: string): { frameKeys: string[]; delays: number[] } | null {
    const key = `${characterType}_${direction}`;
    return this.animations.get(key) || null;
  }

  hasAnimation(characterType: string, direction: string): boolean {
    const key = `${characterType}_${direction}`;
    return this.animations.has(key);
  }
}
