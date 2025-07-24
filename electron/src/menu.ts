import { BrowserWindow, Menu, app } from 'electron';
import { ipcWebContentsSend, isDev } from './util.js';

export function createMenu(mainWindow: BrowserWindow) {
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      {
        label: process.platform === 'darwin' ? undefined : 'App',
        type: 'submenu',
        submenu: [
          {
            label: 'Quit',
            click: app.quit,
          },
          {
            label: 'DevTools',
            click: () => mainWindow.webContents.openDevTools(),
            visible: isDev(),
          },
        ],
      },
      {
        label: 'View',
        type: 'submenu',
        submenu: [
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
    ])
  );
}
