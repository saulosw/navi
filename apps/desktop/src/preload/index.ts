import { contextBridge } from 'electron';
import type { DesktopBridge } from '@navi/contracts';

const platform = process.platform;
const bridge: DesktopBridge = {
  platform:
    platform === 'linux' || platform === 'darwin' || platform === 'win32' ? platform : 'other',
};
contextBridge.exposeInMainWorld('navi', Object.freeze(bridge));
