<template>
  <div class="file-explorer">
    <div class="file-explorer-header">
      <h3>Explorer</h3>
      <button @click="refreshFiles">Refresh</button>
    </div>
    <div class="file-list">
      <div 
        v-for="file in files" 
        :key="file.path" 
        class="file-item"
        :class="{ active: file.path === activeFile }"
        @click="selectFile(file)"
      >
        <span v-if="file.isDirectory">📁</span>
        <span v-else>📄</span>
        {{ file.name }}
      </div>
      <div v-if="files.length === 0" class="empty-message">
        No files to display
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import { useFileStore } from '../stores/fileStore';

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

    const refreshFiles = async () => {
      try {
        // In a real app, this would fetch files from the file system
        // For now, we'll use some mock data
        files.value = [
          { name: 'src', path: '/src', isDirectory: true },
          { name: 'index.html', path: '/index.html', isDirectory: false },
          { name: 'main.js', path: '/main.js', isDirectory: false },
          { name: 'styles.css', path: '/styles.css', isDirectory: false },
        ];
      } catch (error) {
        console.error('Failed to refresh files:', error);
      }
    };

    const selectFile = async (file: FileItem) => {
      if (file.isDirectory) {
        // Handle directory selection (expand/collapse)
        return;
      }

      activeFile.value = file.path;
      
      // In a real app, this would load the file content
      // For now, we'll just simulate it
      const content = `// Content of ${file.name}
function example() {
  console.log("This is a sample file");
}`;
      
      // Update the file store
      fileStore.setCurrentFile({
        path: file.path,
        name: file.name,
        content
      });
    };

    onMounted(() => {
      refreshFiles();
    });

    return {
      files,
      activeFile,
      refreshFiles,
      selectFile
    };
  }
});
</script>

<style scoped>
.file-explorer {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.file-explorer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 10px;
  border-bottom: 1px solid var(--border-color);
}

.file-explorer-header h3 {
  margin: 10px 0;
  font-size: 14px;
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
}

.file-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.file-item.active {
  background-color: rgba(255, 255, 255, 0.2);
}

.empty-message {
  padding: 10px;
  color: #888;
  font-style: italic;
  text-align: center;
}
</style>