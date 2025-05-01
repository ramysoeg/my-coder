<template>
  <div class="file-explorer">
    <div class="file-explorer-header">
      <h3>Explorer</h3>
      <div class="file-explorer-actions">
        <button @click="openFolder" title="Open Folder">📂</button>
        <button @click="refreshFiles" title="Refresh">🔄</button>
      </div>
    </div>
    
    <div v-if="currentPath" class="current-path">
      <span>{{ currentPath }}</span>
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

    const openFolder = async () => {
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
      // Try to load last opened directory if available
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
</style>