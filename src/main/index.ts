/**
 * ============================================================================
 * SubNetCalc Electron Desktop - Production-Grade Subnet Suite
 * ============================================================================
 * File: src/main/index.ts
 * Version: 1.1.2
 * Date & Time: 2026-10-07T11:00:00+07:00
 *
 * Maintainer & Lead Developer:
 *   Harry Dertin Sutisna Alsyundawy (Alsyundawy IT Solution)
 *   Email: alsyundawy@gmail.com
 *   Website: https://alsyundawy.com
 *   GitHub: https://github.com/alsyundawy
 *
 * Original Heritage & Algorithmic Attribution:
 *   - Dr. Thomas Dreibholz (dreibh/subnetcalc - RFC Calculation Engine)
 *   - Julien Mulot (mulot/SubnetCalc - Original macOS Subnet Calculator)
 *
 * License: MIT (SPDX: MIT)
 * Architecture: Cross-Platform (macOS Apple Silicon & Intel, Windows x64 & x86, Linux)
 * ============================================================================
 */

import { app, BrowserWindow, Menu, MenuItem, screen, shell } from "electron";
import path from "node:path";
import { registerIpcHandlers } from "./ipc.js";
import { startMemoryWatch, stopMemoryWatch } from "./memory-watch.js";

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } =
    primaryDisplay.workAreaSize;

  // Fixed size fitted dynamically to the screen work area (no overflow)
  const windowWidth = Math.min(1060, screenWidth - 40);
  const windowHeight = Math.min(700, screenHeight - 60);

  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    minWidth: 920,
    minHeight: 580,
    resizable: true,
    maximizable: true,
    fullscreenable: false,
    center: true,
    show: false,
    backgroundColor: "#090d16",
    title: "SubNetCalc Electron",
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: true,
      spellcheck: false,
    },
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  // Native right-click context menu for editable inputs and selection
  mainWindow.webContents.on("context-menu", (_event, params) => {
    const contextMenu = new Menu();

    if (params.isEditable) {
      contextMenu.append(new MenuItem({ role: "undo", label: "Undo" }));
      contextMenu.append(new MenuItem({ role: "redo", label: "Redo" }));
      contextMenu.append(new MenuItem({ type: "separator" }));
      contextMenu.append(new MenuItem({ role: "cut", label: "Cut" }));
      contextMenu.append(new MenuItem({ role: "copy", label: "Copy" }));
      contextMenu.append(new MenuItem({ role: "paste", label: "Paste" }));
      contextMenu.append(new MenuItem({ type: "separator" }));
      contextMenu.append(new MenuItem({ role: "selectAll", label: "Select All" }));
    } else if (params.selectionText && params.selectionText.trim().length > 0) {
      contextMenu.append(new MenuItem({ role: "copy", label: "Copy" }));
      contextMenu.append(new MenuItem({ role: "selectAll", label: "Select All" }));
    }

    if (contextMenu.items.length > 0 && mainWindow) {
      contextMenu.popup({ window: mainWindow });
    }
  });

  // Intercept window open calls to open safe external links in default OS browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (
      url.startsWith("https://") ||
      url.startsWith("http://") ||
      url.startsWith("mailto:")
    ) {
      void shell.openExternal(url);
    }
    return { action: "deny" };
  });

  // Guard against unauthorized top-level navigation
  mainWindow.webContents.on("will-navigate", (event, navigationUrl) => {
    const isDevUrl =
      process.env.VITE_DEV_SERVER_URL &&
      navigationUrl.startsWith(process.env.VITE_DEV_SERVER_URL);
    if (!navigationUrl.startsWith("file:") && !isDevUrl) {
      event.preventDefault();
    }
  });

  // In development, load vite dev server url if available, otherwise dist file
  if (process.env.VITE_DEV_SERVER_URL) {
    void mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    const indexPath = path.join(__dirname, "../../dist/index.html");
    mainWindow.loadFile(indexPath).catch(() => {
      // Fallback for different path layout
      if (mainWindow) {
        void mainWindow.loadFile(
          path.join(__dirname, "../renderer/index.html"),
        );
      }
    });
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

void app.whenReady().then(() => {
  if (process.platform === "darwin") {
    const macMenuTemplate: Electron.MenuItemConstructorOptions[] = [
      {
        label: app.name,
        submenu: [
          { role: "about" },
          { type: "separator" },
          { role: "services" },
          { type: "separator" },
          { role: "hide" },
          { role: "hideOthers" },
          { role: "unhide" },
          { type: "separator" },
          { role: "quit" },
        ],
      },
      {
        label: "Edit",
        submenu: [
          { role: "undo" },
          { role: "redo" },
          { type: "separator" },
          { role: "cut" },
          { role: "copy" },
          { role: "paste" },
          { role: "selectAll" },
        ],
      },
    ];
    Menu.setApplicationMenu(Menu.buildFromTemplate(macMenuTemplate));
  } else {
    Menu.setApplicationMenu(null);
  }

  registerIpcHandlers();
  startMemoryWatch();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("before-quit", () => {
  stopMemoryWatch();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
