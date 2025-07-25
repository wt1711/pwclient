import { ipcMain, WebFrameMain } from 'electron';
import { pathToFileURL } from 'url';
import { getUIPath } from './pathResolver.js';

function validateEventFrame(frame: WebFrameMain | null) {
  if (
    !frame ||
    !frame.url ||
    !(frame.url.startsWith('file://') || frame.url.startsWith('http://localhost'))
  ) {
    throw new Error('Invalid event frame');
  }
}
// TODO: fix this
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ipcMainHandle<Key extends keyof any>(
  key: Key,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: () => any
) {
  ipcMain.handle(key as string, (event) => {
    validateEventFrame(event.senderFrame);
    return handler();
  });
}

// TODO: fix this
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ipcMainOn<Key extends keyof any>(
  key: Key,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: (payload: any) => void
) {
  ipcMain.on(key as string, (event, payload) => {
    validateEventFrame(event.senderFrame);
    handler(payload);
  });
}

// TODO: fix this
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ipcWebContentsSend<Key extends keyof any>(
  webContents: Electron.WebContents,
  key: Key,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any
) {
  webContents.send(key as string, payload);
}

export function isDev() {
  return process.env.NODE_ENV === 'development';
}

export function getUrl(path: string) {
  if (isDev()) return `http://localhost:5173/${path}`;
  const uiPath = getUIPath();
  return `${pathToFileURL(`${uiPath}/index.html`).href}#/${path}`;
}
