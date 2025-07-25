import { ipcMain } from 'electron';
import { pathToFileURL } from 'url';
import { getUIPath } from './pathResolver.js';
function validateEventFrame(frame) {
    if (!frame ||
        !frame.url ||
        !(frame.url.startsWith('file://') || frame.url.startsWith('http://localhost'))) {
        throw new Error('Invalid event frame');
    }
}
// TODO: fix this
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ipcMainHandle(key, 
// eslint-disable-next-line @typescript-eslint/no-explicit-any
handler) {
    ipcMain.handle(key, (event) => {
        validateEventFrame(event.senderFrame);
        return handler();
    });
}
// TODO: fix this
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ipcMainOn(key, 
// eslint-disable-next-line @typescript-eslint/no-explicit-any
handler) {
    ipcMain.on(key, (event, payload) => {
        validateEventFrame(event.senderFrame);
        handler(payload);
    });
}
// TODO: fix this
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ipcWebContentsSend(webContents, key, 
// eslint-disable-next-line @typescript-eslint/no-explicit-any
payload) {
    webContents.send(key, payload);
}
export function isDev() {
    return process.env.NODE_ENV === 'development';
}
export function getUrl(path) {
    if (isDev())
        return `http://localhost:5173/${path}`;
    const uiPath = getUIPath();
    return `${pathToFileURL(`${uiPath}/index.html`).href}#/${path}`;
}
