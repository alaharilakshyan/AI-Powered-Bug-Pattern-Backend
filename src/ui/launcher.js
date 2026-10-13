import { spawn, exec, execSync } from 'child_process';
import fs from 'fs';
import os from 'os';

/**
 * Calculates side-dock window geometry so the popup window comes aside
 * from the user's terminal/editor instead of covering it.
 */
export function getSideDockGeometry() {
  const platform = os.platform();
  if (platform === 'win32') {
    try {
      const out = execSync(
        'powershell -NoProfile -Command "(Get-CimInstance Win32_VideoController)[0].CurrentHorizontalResolution"',
        { encoding: 'utf-8', timeout: 800 }
      ).trim();
      const resW = parseInt(out, 10);
      if (resW >= 1920) {
        return { width: 900, height: 980, x: 980, y: 30 };
      } else if (resW >= 1200) {
        return { width: 660, height: 710, x: 690, y: 20 };
      }
    } catch {}
  }
  return { width: 720, height: 880, x: 800, y: 30 };
}

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

import path from 'path';

/**
 * Launches the URL in a dedicated standalone application window positioned aside the terminal.
 */
export function launchWindowUtility(url, options = {}) {
  const platform = os.platform();
  const geom = options.geometry || getSideDockGeometry();
  const winSize = `${geom.width},${geom.height}`;
  const winPos = `${geom.x},${geom.y}`;
  const profileDir = path.join(os.tmpdir(), 'buggraph_hud_profile');

  return new Promise((resolve) => {
    if (platform === 'win32') {
      const browserPath = findWindowsBrowser();

      if (browserPath) {
        // Spawn standalone application window positioned beside the terminal
        const child = spawn(browserPath, [
          `--app=${url}`,
          `--user-data-dir=${profileDir}`,
          `--window-size=${winSize}`,
          `--window-position=${winPos}`,
          '--no-first-run',
          '--no-default-browser-check',
          '--disable-extensions',
          '--class=BugGraphHUD'
        ], {
          detached: true,
          stdio: 'ignore'
        });

        child.unref();
        return resolve({ success: true, mode: 'app-window', executable: browserPath, geometry: geom });
      }

      // Fallback: try cmd start
      exec(`start "" msedge --app="${url}" --window-position="${winPos}" --window-size="${winSize}" || start "" chrome --app="${url}" || start "" "${url}"`, (err) => {
        resolve({ success: !err, mode: 'system-start', error: err?.message, geometry: geom });
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

/**
 * Spawns an external native terminal window (CMD / PowerShell on Windows)
 * running the BugGraph CLI utility side-docked beside current tasks.
 */
export function launchTerminalPopup(options = {}) {
  const platform = os.platform();
  const scriptPath = path.resolve('bin/buggraph.js');

  return new Promise((resolve) => {
    if (platform === 'win32') {
      const cmd = `start "BugGraph CLI Workstation" cmd.exe /k "node \"${scriptPath}\" shell"`;
      exec(cmd, (err) => {
        resolve({ success: !err, mode: 'external-cmd-window', error: err?.message });
      });
      return;
    }

    if (platform === 'darwin') {
      const osascript = `osascript -e 'tell application "Terminal" to do script "node \\"${scriptPath}\\" shell"'`;
      exec(osascript, (err) => {
        resolve({ success: !err, mode: 'external-terminal', error: err?.message });
      });
      return;
    }

    // Linux
    exec(`x-terminal-emulator -e node "${scriptPath}" shell || gnome-terminal -- node "${scriptPath}" shell || xterm -e node "${scriptPath}" shell`, (err) => {
      resolve({ success: !err, mode: 'external-terminal', error: err?.message });
    });
  });
}
