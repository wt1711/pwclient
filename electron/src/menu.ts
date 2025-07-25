import { app, Menu, BrowserWindow } from 'electron';
import { isDev } from './util.js';
import { ipcWebContentsSend } from './util.js';

export function createMenu(mainWindow: BrowserWindow) {
  const menu = Menu.buildFromTemplate([
    {
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'Developer',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        {
          label: 'CPU',
          click: () => {
            if (mainWindow)
              if (isDev()) {
                ipcWebContentsSend(mainWindow.webContents, 'changeView', 'CPU');
              }
          },
        },
        {
          label: 'RAM',
          click: () => {
            if (mainWindow)
              if (isDev()) {
                ipcWebContentsSend(mainWindow.webContents, 'changeView', 'RAM');
              }
          },
        },
        {
          label: 'Disk',
          click: () => {
            if (mainWindow)
              if (isDev()) {
                ipcWebContentsSend(mainWindow.webContents, 'changeView', 'Disk');
              }
          },
        },
      ],
    },
  ]);
  Menu.setApplicationMenu(menu);
} 