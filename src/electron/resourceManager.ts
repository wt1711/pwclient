import os from 'os';
import fs from 'fs';
import osUtils from 'os-utils';
import { BrowserWindow } from 'electron';
import { ipcWebContentsSend } from './util.js';

const POLLING_INTERVAL = 500;

export function pollResources(mainWindow: BrowserWindow) {
  setInterval(async () => {
    const cpuUsage = await getCpuUsage();
    const ramUsage = getRamUsage();
    const storageData = getStorageData();
    ipcWebContentsSend(mainWindow.webContents, 'statistics', {
      cpuUsage,
      ramUsage,
      storageUsage: storageData.usage,
    });
  }, POLLING_INTERVAL);
}

export function getStaticData() {
  const totalStorage = getStorageData().total;
  const cpuModel = os.cpus()[0].model;
  const totalMemoryGB = Math.floor(osUtils.totalmem() / 1024);

  return {
    totalStorage,
    cpuModel,
    totalMemoryGB,
  };
}

function getCpuUsage(): Promise<number> {
  return new Promise((resolve) => {
    osUtils.cpuUsage(resolve);
  });
}

function getRamUsage() {
  return 1 - osUtils.freememPercentage();
}

function getStorageData() {
  // requires node 18
  // TODO: fix this
  // const stats = fs.statfsSync(process.platform === 'win32' ? 'C://' : '/');
  // const total = stats.bsize * stats.blocks;
  // const free = stats.bsize * stats.bfree;

  return {
    total: 0,
    usage: 0,
  };
}
