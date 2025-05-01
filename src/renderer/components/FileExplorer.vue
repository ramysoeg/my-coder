<template>
  <div class="file-explorer">
    <div class="file-explorer-header">
      <h3>Explorer</h3>
      <div class="file-explorer-actions">
        <button @click="openFolder" title="Open Folder">📂</button>
        <button @click="refreshFiles" title="Refresh">🔄</button>
        <span v-if="isWebMode" class="web-mode-indicator" title="Running in Web Mode">🌐</span>
      </div>
    </div>
    
    <div v-if="currentPath" class="current-path">
      <span>{{ currentPath }}</span>
      <span v-if="isWebMode" class="web-mode-path-note">(Demo Files)</span>
    </div>
    
    <div class="file-list">
      <div v-if="!currentPath" class="empty-message">
        <p>No folder open</p>
        <button @click="openFolder" class="open-folder-btn">Open Folder</button>
      </div>
      
      <template v-else>
        <div v-if="parentPath" class="file-item parent-dir" @click="navigateToParent">
          <span>📁</span>
          <span>..</span>
        </div>
        
        <div 
          v-for="file in sortedFiles" 
          :key="file.path" 
          class="file-item"
          :class="{ 
            active: file.path === activeFile,
            directory: file.isDirectory
          }"
          @click="selectFile(file)"
          @dblclick="openFile(file)"
        >
          <span v-if="file.isDirectory">📁</span>
          <span v-else-if="isImageFile(file.name)">🖼️</span>
          <span v-else-if="isCodeFile(file.name)">📄</span>
          <span v-else>📝</span>
          {{ file.name }}
        </div>
        
        <div v-if="files.length === 0" class="empty-message">
          <p>Empty folder</p>
        </div>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, watch } from 'vue';
import { useFileStore } from '../stores/fileStore';
import * as path from 'path';

// Sample files for web mode demo
const SAMPLE_FILES = [
  { name: 'src', path: '/sample/src', isDirectory: true },
  { name: 'public', path: '/sample/public', isDirectory: true },
  { name: 'package.json', path: '/sample/package.json', isDirectory: false },
  { name: 'README.md', path: '/sample/README.md', isDirectory: false },
  { name: 'tsconfig.json', path: '/sample/tsconfig.json', isDirectory: false },
];

const SAMPLE_SRC_FILES = [
  { name: 'components', path: '/sample/src/components', isDirectory: true },
  { name: 'stores', path: '/sample/src/stores', isDirectory: true },
  { name: 'main.ts', path: '/sample/src/main.ts', isDirectory: false },
  { name: 'App.vue', path: '/sample/src/App.vue', isDirectory: false },
];

const SAMPLE_COMPONENTS_FILES = [
  { name: 'Editor.vue', path: '/sample/src/components/Editor.vue', isDirectory: false },
  { name: 'FileExplorer.vue', path: '/sample/src/components/FileExplorer.vue', isDirectory: false },
  { name: 'AIPanel.vue', path: '/sample/src/components/AIPanel.vue', isDirectory: false },
];

const SAMPLE_FILE_CONTENTS = {
  '/sample/package.json': JSON.stringify({
    "name": "my-coder",
    "version": "1.0.0",
    "description": "VSCode-like IDE with AI assistant",
    "main": "dist/main.js",
    "scripts": {
      "start": "electron .",
      "dev": "webpack serve --mode development"
    },
    "dependencies": {
      "electron": "^28.0.0",
      "monaco-editor": "^0.45.0",
      "vue": "^3.3.0"
    }
  }, null, 2),
  '/sample/README.md': '# MyCoder\n\nA VSCode-like IDE with integrated AI assistant.\n\n## Features\n\n- Monaco Editor integration\n- File explorer\n- AI assistant panel\n- Electron-based desktop app',
  '/sample/src/main.ts': `import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';

const pinia = createPinia();
const app = createApp(App);

app.use(pinia);
app.mount('#app');`,
  '/sample/src/components/Editor.vue': `<template>
  <div class="monaco-editor-container" ref="editorContainer"></div>
</template>

<script lang="ts">
// Monaco Editor component
</script>

<style scoped>
.monaco-editor-container {
  width: 100%;
  height: 100%;
}
</style>`
};

interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
}

export default defineComponent({
  name: 'FileExplorer',
  setup() {
    const fileStore = useFileStore();
    const files = ref<FileItem[]>([]);
    const activeFile = ref('');
    const currentPath = ref('');
    const isLoading = ref(false);
    const error = ref('');

    const parentPath = computed(() => {
      if (!currentPath.value) return null;
      const parent = path.dirname(currentPath.value);
      return parent !== currentPath.value ? parent : null;
    });

    const sortedFiles = computed(() => {
      return [...files.value].sort((a, b) => {
        // Directories first
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        
        // Then alphabetically
        return a.name.localeCompare(b.name);
      });
    });

    const isWebMode = computed(() => {
      return !window.electron || !window.electron.ipcRenderer;
    });

    const openFolder = async () => {
      if (isWebMode.value) {
        // In web mode, just load the sample root directory
        currentPath.value = '/sample';
        await loadDirectory('/sample');
        return;
      }

      try {
        const result = await window.electron.ipcRenderer.invoke('open-directory');
        if (!result.canceled && result.directoryPath) {
          currentPath.value = result.directoryPath;
          await loadDirectory(result.directoryPath);
        }
      } catch (error) {
        console.error('Failed to open folder:', error);
      }
    };

    const loadDirectory = async (dirPath: string) => {
      isLoading.value = true;
      error.value = '';
      
      // Handle web mode with sample files
      if (isWebMode.value) {
        try {
          // Simulate loading delay
          await new Promise(resolve => setTimeout(resolve, 300));
          
          if (dirPath === '/sample') {
            files.value = SAMPLE_FILES;
          } else if (dirPath === '/sample/src') {
            files.value = SAMPLE_SRC_FILES;
          } else if (dirPath === '/sample/src/components') {
            files.value = SAMPLE_COMPONENTS_FILES;
          } else {
            files.value = [];
          }
          
          currentPath.value = dirPath;
        } catch (err) {
          error.value = 'Error reading directory';
          console.error('Error reading directory:', err);
        } finally {
          isLoading.value = false;
        }
        return;
      }
      
      // Electron mode
      try {
        const result = await window.electron.ipcRenderer.invoke('read-directory', dirPath);
        
        if (result.success) {
          files.value = result.files;
          currentPath.value = dirPath;
        } else {
          error.value = result.error || 'Failed to read directory';
          console.error(error.value);
        }
      } catch (err) {
        error.value = 'Error reading directory';
        console.error('Error reading directory:', err);
      } finally {
        isLoading.value = false;
      }
    };

    const refreshFiles = async () => {
      if (currentPath.value) {
        await loadDirectory(currentPath.value);
      }
    };

    const navigateToParent = async () => {
      if (parentPath.value) {
        await loadDirectory(parentPath.value);
      }
    };

    const selectFile = async (file: FileItem) => {
      if (file.isDirectory) {
        await loadDirectory(file.path);
        return;
      }

      activeFile.value = file.path;
    };

    const openFile = async (file: FileItem) => {
      if (file.isDirectory) {
        await loadDirectory(file.path);
        return;
      }

      // Handle web mode with sample file contents
      if (isWebMode.value) {
        try {
          // Simulate loading delay
          await new Promise(resolve => setTimeout(resolve, 200));
          
          let content = '';
          if (file.path in SAMPLE_FILE_CONTENTS) {
            content = SAMPLE_FILE_CONTENTS[file.path];
          } else {
            // Generate some sample content for files without predefined content
            content = `// Sample content for ${file.name}\n\n// This is a demo file in web mode`;
          }
          
          // Update the file store
          fileStore.setCurrentFile({
            path: file.path,
            name: file.name,
            content: content
          });
        } catch (error) {
          console.error('Error opening file in web mode:', error);
        }
        return;
      }

      // Electron mode
      try {
        const result = await window.electron.ipcRenderer.invoke('read-file', file.path);
        if (result.success) {
          // Update the file store
          fileStore.setCurrentFile({
            path: file.path,
            name: file.name,
            content: result.content
          });
        } else {
          console.error('Failed to read file:', result.error);
        }
      } catch (error) {
        console.error('Error opening file:', error);
      }
    };

    const isImageFile = (filename: string): boolean => {
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp'];
      const ext = path.extname(filename).toLowerCase();
      return imageExtensions.includes(ext);
    };

    const isCodeFile = (filename: string): boolean => {
      const codeExtensions = [
        '.js', '.ts', '.jsx', '.tsx', '.vue', '.html', '.css', '.scss', 
        '.json', '.py', '.rb', '.go', '.java', '.c', '.cpp', '.cs', 
        '.php', '.swift', '.kt', '.rs', '.md', '.txt'
      ];
      const ext = path.extname(filename).toLowerCase();
      return codeExtensions.includes(ext);
    };

    // Watch for changes in the file store
    watch(() => fileStore.currentFile, (newFile) => {
      if (newFile) {
        activeFile.value = newFile.path;
      }
    });

    onMounted(() => {
      if (isWebMode.value) {
        // In web mode, automatically load the sample directory
        currentPath.value = '/sample';
        loadDirectory('/sample');
        return;
      }
      
      // In Electron mode, try to load last opened directory if available
      const lastDir = localStorage.getItem('lastOpenedDirectory');
      if (lastDir) {
        loadDirectory(lastDir);
      }
    });

    return {
      files,
      sortedFiles,
      activeFile,
      currentPath,
      parentPath,
      isLoading,
      error,
      isWebMode,
      openFolder,
      refreshFiles,
      selectFile,
      openFile,
      navigateToParent,
      isImageFile,
      isCodeFile
    };
  }
});
</script>

<style scoped>
.file-explorer {
  display: flex;
  flex-direction: column;
  height: 100%;
  user-select: none;
}

.file-explorer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 10px;
  border-bottom: 1px solid #1a1a1a;
  height: 36px;
}

.file-explorer-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
}

.file-explorer-actions {
  display: flex;
  gap: 5px;
}

.file-explorer-actions button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  padding: 2px 5px;
  border-radius: 3px;
  color: #cccccc;
}

.file-explorer-actions button:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.current-path {
  padding: 5px 10px;
  font-size: 12px;
  color: #888;
  border-bottom: 1px solid #1a1a1a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-list {
  flex: 1;
  overflow: auto;
  padding: 5px;
}

.file-item {
  padding: 3px 5px;
  cursor: pointer;
  border-radius: 3px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.file-item.active {
  background-color: rgba(255, 255, 255, 0.2);
}

.file-item.directory {
  font-weight: 500;
}

.file-item.parent-dir {
  color: #888;
}

.empty-message {
  padding: 20px 10px;
  color: #888;
  font-style: italic;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.open-folder-btn {
  background-color: #3c3c3c;
  color: #cccccc;
  border: none;
  border-radius: 3px;
  padding: 5px 10px;
  cursor: pointer;
  font-size: 12px;
}

.open-folder-btn:hover {
  background-color: #505050;
}

.web-mode-indicator {
  font-size: 14px;
  margin-left: 5px;
  color: #64b5f6;
  cursor: help;
}

.web-mode-path-note {
  font-size: 11px;
  color: #64b5f6;
  margin-left: 5px;
  font-style: italic;
}
</style>