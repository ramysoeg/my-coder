import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as isDev from 'electron-is-dev';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, '../preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    // Set window appearance
    backgroundColor: '#1e1e1e',
    titleBarStyle: 'hiddenInset',
    autoHideMenuBar: true,
  });

  const startUrl = isDev
    ? 'http://localhost:12001'
    : `file://${path.join(__dirname, '../dist/index.html')}`;

  mainWindow.loadURL(startUrl);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// File system operations
ipcMain.handle('open-file', async () => {
  if (!mainWindow) return { canceled: true };

  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Text Files', extensions: ['txt', 'js', 'ts', 'jsx', 'tsx', 'py', 'html', 'css', 'json'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (canceled || filePaths.length === 0) {
    return { canceled: true };
  }

  const filePath = filePaths[0];
  const content = fs.readFileSync(filePath, 'utf8');
  return { canceled: false, filePath, content };
});

ipcMain.handle('save-file', async (_, { filePath, content }: { filePath: string, content: string }) => {
  if (!filePath) {
    if (!mainWindow) return { canceled: true };

    const { canceled, filePath: savedFilePath } = await dialog.showSaveDialog(mainWindow, {
      filters: [
        { name: 'Text Files', extensions: ['txt', 'js', 'ts', 'jsx', 'tsx', 'py', 'html', 'css', 'json'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (canceled || !savedFilePath) {
      return { canceled: true };
    }

    filePath = savedFilePath;
  }

  fs.writeFileSync(filePath, content, 'utf8');
  return { canceled: false, filePath };
});

// Directory operations
ipcMain.handle('open-directory', async () => {
  if (!mainWindow) return { canceled: true };

  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });

  if (canceled || filePaths.length === 0) {
    return { canceled: true };
  }

  const directoryPath = filePaths[0];
  return { canceled: false, directoryPath };
});

ipcMain.handle('read-directory', async (_, dirPath: string) => {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    const files = entries.map(entry => ({
      name: entry.name,
      path: path.join(dirPath, entry.name),
      isDirectory: entry.isDirectory()
    }));
    
    return { success: true, files };
  } catch (error) {
    console.error('Error reading directory:', error);
    return { success: false, error: (error as Error).message };
  }
});

// File read operation
ipcMain.handle('read-file', async (_, filePath: string) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return { success: true, content };
  } catch (error) {
    console.error('Error reading file:', error);
    return { success: false, error: (error as Error).message };
  }
});