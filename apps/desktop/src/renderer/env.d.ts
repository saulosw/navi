import type { DesktopBridge } from '@navi/contracts';

declare global {
  interface Window {
    // Absent when the preload script fails to load, so callers must handle it.
    navi?: DesktopBridge;
  }
}
