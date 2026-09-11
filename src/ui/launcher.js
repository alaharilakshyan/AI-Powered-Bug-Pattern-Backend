import { spawn, exec } from 'child_process';
import fs from 'fs';
import os from 'os';

/**
 * Searches common browser installation paths on Windows for Edge or Chrome.
 */
function findWindowsBrowser() {
  const localAppData = process.env.LOCALAPPDATA || '';
  const programFiles = process.env['ProgramFiles'] || 'C:\\Program Files';
  const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';

  const candidatePaths = [
    // Microsoft Edge (Default on Windows 10/11)
    `${programFilesX86}\\Microsoft\\Edge\\Application\\msedge.exe`,
    `${programFiles}\\Microsoft\\Edge\\Application\\msedge.exe`,
    `${localAppData}\\Microsoft\\Edge\\Application\\msedge.exe`,

    // Google Chrome
    `${programFiles}\\Google\\Chrome\\Application\\chrome.exe`,
    `${programFilesX86}\\Google\\Chrome\\Application\\chrome.exe`,
    `${localAppData}\\Google\\Chrome\\Application\\chrome.exe`
  ];

  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  return null;
}

/**
 * Launches the URL in a dedicated standalone application window without address bar or tabs.
 */
export function launchWindowUtility(url) {
  const platform = os.platform();

  return new Promise((resolve) => {
    if (platform === 'win32') {
      const browserPath = findWindowsBrowser();

      if (browserPath) {
        // Spawn standalone application window
        const child = spawn(browserPath, [
          `--app=${url}`,
          '--window-size=1150,820',
          '--window-position=120,60',
          '--disable-extensions'
        ], {
          detached: true,
          stdio: 'ignore'
        });

        child.unref();
        return resolve({ success: true, mode: 'app-window', executable: browserPath });
      }

      // Fallback: try cmd start
      exec(`start "" msedge --app="${url}" || start "" chrome --app="${url}" || start "" "${url}"`, (err) => {
        resolve({ success: !err, mode: 'system-start', error: err?.message });
      });
      return;
    }

    if (platform === 'darwin') {
      const chromeMac = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
      const edgeMac = '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge';

      if (fs.existsSync(chromeMac)) {
        const child = spawn(chromeMac, [`--app=${url}`, '--window-size=1150,820'], { detached: true, stdio: 'ignore' });
        child.unref();
        return resolve({ success: true, mode: 'app-window', executable: chromeMac });
      }

      if (fs.existsSync(edgeMac)) {
        const child = spawn(edgeMac, [`--app=${url}`, '--window-size=1150,820'], { detached: true, stdio: 'ignore' });
        child.unref();
        return resolve({ success: true, mode: 'app-window', executable: edgeMac });
      }

      exec(`open "${url}"`, (err) => {
        resolve({ success: !err, mode: 'default-browser', error: err?.message });
      });
      return;
    }

    // Linux / other
    exec(`google-chrome --app="${url}" || chromium-browser --app="${url}" || xdg-open "${url}"`, (err) => {
      resolve({ success: !err, mode: 'linux-start', error: err?.message });
    });
  });
}
