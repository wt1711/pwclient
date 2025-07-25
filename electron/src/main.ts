import { app, BrowserWindow } from 'electron';
import { getPreloadPath, getUIPath } from './pathResolver.js';
import { createTray } from './tray.js';
import { createMenu } from './menu.js';
import { isDev } from './util.js';

app.on('ready', () => {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: getPreloadPath(),
    },
  });

  if (isDev()) {
    mainWindow.loadURL(getUIPath());
  } else {
    mainWindow.loadURL(getUIPath());
  }

  createTray(mainWindow);
  createMenu(mainWindow);
}); 