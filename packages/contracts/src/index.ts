export interface HealthResponse {
  status: 'ok' | 'unavailable';
}

export interface DesktopBridge {
  platform: 'linux' | 'darwin' | 'win32' | 'other';
}
