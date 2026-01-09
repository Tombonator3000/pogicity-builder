/**
 * Asset Path Utilities
 * Handles platform-specific asset path resolution for Lovable and GitHub Pages
 */

/**
 * Gets the base path from Vite's environment
 * In development/Lovable: '/'
 * In GitHub Pages: '/pogicity-builder/' or configured value
 */
export function getBasePath(): string {
  // Vite's import.meta.env.BASE_URL is automatically set from base config
  return import.meta.env.BASE_URL || '/';
}

/**
 * Resolves an asset path with the correct base path
 * @param assetPath - Relative asset path (e.g., '/Building/foo.png' or 'Building/foo.png')
 * @returns Full path with base path prepended
 *
 * Examples:
 * - Lovable: getAssetPath('/Building/foo.png') -> '/Building/foo.png'
 * - GitHub: getAssetPath('/Building/foo.png') -> '/pogicity-builder/Building/foo.png'
 */
export function getAssetPath(assetPath: string): string {
  const basePath = getBasePath();

  // Remove leading slash from asset path if present
  const cleanPath = assetPath.startsWith('/') ? assetPath.slice(1) : assetPath;

  // Combine base path with asset path
  // Ensure no double slashes
  const fullPath = basePath.endsWith('/')
    ? `${basePath}${cleanPath}`
    : `${basePath}/${cleanPath}`;

  return fullPath;
}

/**
 * Resolves multiple asset paths
 * @param assetPaths - Array of relative asset paths
 * @returns Array of full paths with base path prepended
 */
export function getAssetPaths(assetPaths: string[]): string[] {
  return assetPaths.map(path => getAssetPath(path));
}

/**
 * Resolves asset paths in an object (useful for building sprites)
 * @param pathsObject - Object with keys and relative paths as values
 * @returns Object with same keys but full paths as values
 *
 * Example:
 * Input: { south: '/Building/foo_s.png', north: '/Building/foo_n.png' }
 * Output (GitHub): { south: '/pogicity-builder/Building/foo_s.png', ... }
 */
export function resolveAssetPathsInObject<T extends Record<string, string>>(
  pathsObject: T
): T {
  const result = {} as T;

  for (const [key, path] of Object.entries(pathsObject)) {
    result[key as keyof T] = getAssetPath(path) as T[keyof T];
  }

  return result;
}
