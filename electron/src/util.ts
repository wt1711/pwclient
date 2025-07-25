export function isDev(): boolean {
  return process.env.NODE_ENV === 'development';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ipcWebContentsSend<Key extends keyof any>(
  webContents: Electron.WebContents,
  key: Key,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any
) {
  webContents.send(key as string, payload);
} 