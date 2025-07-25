"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('electron', {
    subscribeStatistics: (callback) => {
        const subscription = (event, data) => callback(data);
        electron_1.ipcRenderer.on('statistics-changed', subscription);
        return () => electron_1.ipcRenderer.off('statistics-changed', subscription);
    },
    subscribeChangeView: (callback) => {
        const subscription = (event, view) => callback(view);
        electron_1.ipcRenderer.on('change-view', subscription);
        return () => electron_1.ipcRenderer.off('change-view', subscription);
    },
    sendFrameAction: (payload) => electron_1.ipcRenderer.send('sendFrameAction', payload),
});
