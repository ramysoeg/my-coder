"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const isDev = __importStar(require("electron-is-dev"));
let mainWindow = null;
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
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
        ? 'http://localhost:12000'
        : `file://${path.join(__dirname, '../dist/index.html')}`;
    mainWindow.loadURL(startUrl);
    if (isDev) {
        mainWindow.webContents.openDevTools();
    }
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}
electron_1.app.whenReady().then(() => {
    createWindow();
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
// File system operations
electron_1.ipcMain.handle('open-file', () => __awaiter(void 0, void 0, void 0, function* () {
    if (!mainWindow)
        return { canceled: true };
    const { canceled, filePaths } = yield electron_1.dialog.showOpenDialog(mainWindow, {
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
}));
electron_1.ipcMain.handle('save-file', (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { filePath, content }) {
    if (!filePath) {
        if (!mainWindow)
            return { canceled: true };
        const { canceled, filePath: savedFilePath } = yield electron_1.dialog.showSaveDialog(mainWindow, {
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
}));
// Directory operations
electron_1.ipcMain.handle('open-directory', () => __awaiter(void 0, void 0, void 0, function* () {
    if (!mainWindow)
        return { canceled: true };
    const { canceled, filePaths } = yield electron_1.dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory']
    });
    if (canceled || filePaths.length === 0) {
        return { canceled: true };
    }
    const directoryPath = filePaths[0];
    return { canceled: false, directoryPath };
}));
electron_1.ipcMain.handle('read-directory', (_, dirPath) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });
        const files = entries.map(entry => ({
            name: entry.name,
            path: path.join(dirPath, entry.name),
            isDirectory: entry.isDirectory()
        }));
        return { success: true, files };
    }
    catch (error) {
        console.error('Error reading directory:', error);
        return { success: false, error: error.message };
    }
}));
// File read operation
electron_1.ipcMain.handle('read-file', (_, filePath) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        return { success: true, content };
    }
    catch (error) {
        console.error('Error reading file:', error);
        return { success: false, error: error.message };
    }
}));
//# sourceMappingURL=main.js.map