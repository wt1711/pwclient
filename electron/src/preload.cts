import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  subscribeStatistics: (callback: (data: any) => void) => {
    const subscription = (event: any, data: any) => callback(data);
    ipcRenderer.on('statistics-changed', subscription);
    return () => ipcRenderer.off('statistics-changed', subscription);
  },
  subscribeChangeView: (callback: (view: string) => void) => {
    const subscription = (event: any, view: string) => callback(view);
    ipcRenderer.on('change-view', subscription);
    return () => ipcRenderer.off('change-view', subscription);
  },
  sendFrameAction: (payload: any) => ipcRenderer.send('sendFrameAction', payload),
}); 