import { contextBridge, ipcRenderer } from 'electron';
import type { DesktopBridge } from '@navi/contracts';

const platform = process.platform;

const bridge: DesktopBridge = {
  login: (input) => ipcRenderer.invoke('navi:login', input) as ReturnType<DesktopBridge['login']>,
  restoreSession: () =>
    ipcRenderer.invoke('navi:restoreSession') as ReturnType<DesktopBridge['restoreSession']>,
  logout: () => ipcRenderer.invoke('navi:logout') as ReturnType<DesktopBridge['logout']>,
  listMembers: () =>
    ipcRenderer.invoke('navi:listMembers') as ReturnType<DesktopBridge['listMembers']>,
  platform:
    platform === 'linux' || platform === 'darwin' || platform === 'win32' ? platform : 'other',
};

contextBridge.exposeInMainWorld('navi', Object.freeze(bridge));
