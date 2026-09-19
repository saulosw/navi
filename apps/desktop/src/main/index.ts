import { app, BrowserWindow, session } from 'electron';
import { join } from 'node:path';

const RENDERER_DEV_ORIGIN = 'http://127.0.0.1:5173';

// The renderer also ships this policy as a <meta> tag, which is what enforces it
// for the packaged file:// document. The response header is defence in depth for
// anything the window ever loads over http(s). Development is left to the meta
// tag alone because Vite's HMR client needs inline scripts and a websocket.
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'none'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join('; ');

function resolveRendererDevUrl(): string | undefined {
  if (app.isPackaged) return undefined;
  const value = process.env.ELECTRON_RENDERER_URL;
  if (!value) return undefined;
  if (new URL(value).origin !== RENDERER_DEV_ORIGIN)
    throw new Error('Unexpected renderer development origin');
  return value;
}

function createWindow(devUrl: string | undefined): void {
  const window = new BrowserWindow({
    width: 1120,
    height: 760,
    minWidth: 720,
    minHeight: 560,
    show: false,
    backgroundColor: '#0b100e',
    title: 'Navi',
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', (event) => event.preventDefault());
  window.webContents.on('will-attach-webview', (event) => event.preventDefault());
  window.once('ready-to-show', () => window.show());
  if (devUrl) void window.loadURL(devUrl);
  else void window.loadFile(join(__dirname, '../renderer/index.html'));
}

void app.whenReady().then(() => {
  const devUrl = resolveRendererDevUrl();
  session.defaultSession.setPermissionRequestHandler((_contents, _permission, callback) =>
    callback(false),
  );
  session.defaultSession.setPermissionCheckHandler(() => false);
  if (!devUrl) {
    session.defaultSession.webRequest.onHeadersReceived((details, callback) =>
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [CONTENT_SECURITY_POLICY],
        },
      }),
    );
  }
  createWindow(devUrl);
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow(devUrl);
  });
});
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
