import path from 'path';
import { app } from 'electron';
import { isDev } from './util.js';

export function getPreloadPath() {
  if (isDev()) {
    return path.join(app.getAppPath(), 'electron/dist/preload.cjs');
  }
  return path.join(process.resourcesPath, 'preload.cjs');
}

export function getUIPath() {
  if (isDev()) {
    return 'http://localhost:5173';
  }
  return `file://${path.join(process.resourcesPath, 'dist-react/index.html')}`;
}

export function getAssetPath() {
  if (isDev()) {
    return path.join(app.getAppPath(), 'src/assets');
  }
  return path.join(process.resourcesPath, 'assets');
} 