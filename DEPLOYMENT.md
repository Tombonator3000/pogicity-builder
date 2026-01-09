# Deployment Guide - Multi-Platform Support

This game is configured to run on multiple platforms with proper asset path resolution.

## Supported Platforms

### 1. Lovable (Root Path)
- **Base URL**: `https://your-project.lovable.app/`
- **Base Path**: `/`
- **Command**: `npm run build:lovable`

### 2. GitHub Pages (Subdirectory Path)
- **Base URL**: `https://username.github.io/pogicity-builder/`
- **Base Path**: `/pogicity-builder/`
- **Command**: `npm run build:github`

## How It Works

### Asset Path Resolution
All asset paths (sprites, GIFs, tiles) are automatically resolved using the `getAssetPath()` utility:

```typescript
// Input: 'Building/foo.png'
// Lovable: '/Building/foo.png'
// GitHub: '/pogicity-builder/Building/foo.png'
```

### Environment Configuration
Three environment files control the base path:

- `.env.development` - For local development (base: `/`)
- `.env.production` - For Lovable production (base: `/`)
- `.env.github` - For GitHub Pages (base: `/pogicity-builder/`)

### Build Commands

```bash
# Development (Lovable-compatible)
npm run dev

# Build for Lovable
npm run build:lovable

# Build for GitHub Pages
npm run build:github

# Preview GitHub Pages build locally
npm run preview:github
```

## Deployment Instructions

### Deploy to Lovable
1. Lovable automatically builds and deploys when you push to the main branch
2. Or manually: `npm run build:lovable`
3. The `dist/` folder is deployed to Lovable's CDN

### Deploy to GitHub Pages

#### Option 1: GitHub Actions (Recommended)
Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build for GitHub Pages
        run: npm run build:github

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

#### Option 2: Manual Deploy
```bash
# Build for GitHub Pages
npm run build:github

# Push dist/ folder to gh-pages branch
git subtree push --prefix dist origin gh-pages

# Or use gh-pages npm package:
npx gh-pages -d dist
```

#### GitHub Pages Settings
1. Go to repository Settings > Pages
2. Source: Deploy from a branch
3. Branch: `gh-pages` / `root`
4. Save

## Architecture

### Key Files
- `vite.config.ts` - Base path configuration
- `src/game/utils/AssetPathUtils.ts` - Asset path resolution utilities
- `src/game/buildings.ts` - Building sprites with dynamic paths
- `src/game/GifLoader.ts` - Character GIF loading with dynamic paths
- `src/game/MainScene.ts` - Phaser scene with asset loading

### Asset Path Flow
```
1. Asset defined: 'Building/foo.png'
2. getAssetPath() called with asset path
3. Reads import.meta.env.BASE_URL (from Vite config)
4. Combines base + asset path
5. Returns full path: '/pogicity-builder/Building/foo.png'
```

## Testing

### Local Testing with GitHub Paths
```bash
# Build for GitHub
npm run build:github

# Preview with correct base path
npm run preview:github

# Open: http://localhost:4173/pogicity-builder/
```

### Verify Asset Paths
Check browser console and Network tab:
- All assets should load with correct base path
- No 404 errors for sprites, GIFs, or tiles

## Troubleshooting

### Assets not loading on GitHub Pages
1. Verify base path in `vite.config.ts` matches repository name
2. Check that `npm run build:github` was used (not `build`)
3. Ensure all asset paths use `getAssetPath()` utility

### React Router 404s on GitHub Pages
The project uses hash routing to avoid GitHub Pages SPA issues.

### Different repository name?
Update the base path in:
1. `.env.github`: `VITE_BASE_PATH=/your-repo-name/`
2. `package.json`: `--base=/your-repo-name/` in build:github script

## Performance Notes

- Asset paths are resolved once and cached
- Building sprites use Proxy for lazy resolution
- No performance overhead after initial load
