<template>
  <div class="app-container">
    <div class="sidebar">
      <FileExplorer />
    </div>
    <div class="main-content">
      <div class="toolbar">
        <button @click="openFile">Open</button>
        <button @click="saveFile">Save</button>
        <button @click="newFile">New</button>
        <div class="spacer"></div>
        <button @click="toggleAIPanel">{{ aiPanelOpen ? 'Hide AI' : 'Show AI' }}</button>
      </div>
      <div class="editor-container">
        <MonacoEditor
          v-model="code"
          :language="language"
          :theme="'vs-dark'"
          @change="onChange"
        />
      </div>
      <div class="statusbar">
        {{ currentFilePath || 'No file open' }} | {{ language }} | {{ isModified ? 'Modified' : 'Saved' }}
      </div>
      <AIPanel 
        v-if="aiPanelOpen" 
        :isOpen="true"
        @toggle="toggleAIPanel"
        @message-sent="handleAIMessage"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, watch } from 'vue';
import MonacoEditor from './components/MonacoEditor.vue';
import FileExplorer from './components/FileExplorer.vue';
import AIPanel from './components/AIPanel.vue';
import { useFileStore } from './stores/fileStore';
import { Message } from './services/aiService';

export default defineComponent({
  name: 'App',
  components: {
    MonacoEditor,
    FileExplorer,
    AIPanel
  },
  setup() {
    const fileStore = useFileStore();
    const code = ref('// Start coding here');
    const language = ref('javascript');
    const currentFilePath = ref('');
    const aiPanelOpen = ref(true);
    const isModified = ref(false);

    // Watch for changes in the code and update the modified state
    watch(code, () => {
      if (currentFilePath.value) {
        isModified.value = true;
      }
    });

    const getLanguageFromExtension = (filePath: string): string => {
      const extension = filePath.split('.').pop()?.toLowerCase();
      switch (extension) {
        case 'js':
          return 'javascript';
        case 'ts':
          return 'typescript';
        case 'html':
          return 'html';
        case 'css':
          return 'css';
        case 'json':
          return 'json';
        case 'py':
          return 'python';
        case 'jsx':
          return 'javascript';
        case 'tsx':
          return 'typescript';
        case 'vue':
          return 'html';
        case 'md':
          return 'markdown';
        default:
          return 'plaintext';
      }
    };

    const newFile = () => {
      // Check if current file is modified and prompt to save
      if (isModified.value) {
        const shouldSave = confirm('Do you want to save changes to the current file?');
        if (shouldSave) {
          saveFile();
        }
      }
      
      // Reset editor state
      code.value = '// Start coding here';
      currentFilePath.value = '';
      language.value = 'javascript';
      isModified.value = false;
    };

    const openFile = async () => {
      try {
        // Check if current file is modified and prompt to save
        if (isModified.value) {
          const shouldSave = confirm('Do you want to save changes to the current file?');
          if (shouldSave) {
            await saveFile();
          }
        }

        const result = await window.electron.ipcRenderer.invoke('open-file');
        if (!result.canceled) {
          code.value = result.content;
          currentFilePath.value = result.filePath;
          language.value = getLanguageFromExtension(result.filePath);
          isModified.value = false;
          
          // Update file store
          fileStore.setCurrentFile({
            path: result.filePath,
            name: result.filePath.split('/').pop() || '',
            content: result.content
          });
        }
      } catch (error) {
        console.error('Failed to open file:', error);
      }
    };

    const saveFile = async () => {
      try {
        const result = await window.electron.ipcRenderer.invoke('save-file', {
          filePath: currentFilePath.value,
          content: code.value
        });
        
        if (!result.canceled) {
          currentFilePath.value = result.filePath;
          isModified.value = false;
          
          // Update file store
          if (fileStore.currentFile) {
            fileStore.updateContent(code.value);
          } else {
            fileStore.setCurrentFile({
              path: result.filePath,
              name: result.filePath.split('/').pop() || '',
              content: code.value
            });
          }
        }
      } catch (error) {
        console.error('Failed to save file:', error);
      }
    };

    const onChange = (newValue: string) => {
      code.value = newValue;
      if (fileStore.currentFile) {
        fileStore.updateContent(newValue);
      }
    };

    const toggleAIPanel = () => {
      aiPanelOpen.value = !aiPanelOpen.value;
    };

    const handleAIMessage = (event: { userMessage: Message, aiResponse: Message }) => {
      console.log('AI conversation:', event);
      // Here you could implement special handling for AI suggestions
      // For example, if the AI suggests code changes, you could apply them
    };

    onMounted(() => {
      // Initialize any required resources
      window.addEventListener('keydown', (e) => {
        // Add keyboard shortcuts
        if (e.ctrlKey || e.metaKey) {
          if (e.key === 's') {
            e.preventDefault();
            saveFile();
          } else if (e.key === 'o') {
            e.preventDefault();
            openFile();
          } else if (e.key === 'n') {
            e.preventDefault();
            newFile();
          }
        }
      });
    });

    return {
      code,
      language,
      currentFilePath,
      aiPanelOpen,
      isModified,
      openFile,
      saveFile,
      newFile,
      onChange,
      toggleAIPanel,
      handleAIMessage
    };
  }
});
</script>

<style>
:root {
  --sidebar-width: 250px;
  --toolbar-height: 40px;
  --statusbar-height: 25px;
  --primary-color: #007acc;
  --background-color: #1e1e1e;
  --sidebar-color: #252526;
  --toolbar-color: #333333;
  --statusbar-color: #007acc;
  --text-color: #cccccc;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  color: var(--text-color);
  background-color: var(--background-color);
  overflow: hidden;
}

.app-container {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.sidebar {
  width: var(--sidebar-width);
  background-color: var(--sidebar-color);
  border-right: 1px solid #1a1a1a;
  overflow-y: auto;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.toolbar {
  height: var(--toolbar-height);
  background-color: var(--toolbar-color);
  display: flex;
  align-items: center;
  padding: 0 10px;
  border-bottom: 1px solid #1a1a1a;
}

.toolbar button {
  background-color: #3c3c3c;
  color: var(--text-color);
  border: none;
  border-radius: 3px;
  padding: 5px 10px;
  margin-right: 5px;
  cursor: pointer;
  font-size: 12px;
}

.toolbar button:hover {
  background-color: #505050;
}

.spacer {
  flex: 1;
}

.editor-container {
  flex: 1;
  overflow: hidden;
}

.statusbar {
  height: var(--statusbar-height);
  background-color: var(--statusbar-color);
  display: flex;
  align-items: center;
  padding: 0 10px;
  font-size: 12px;
  color: white;
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

::-webkit-scrollbar-track {
  background: #1e1e1e;
}

::-webkit-scrollbar-thumb {
  background: #424242;
  border-radius: 5px;
}

::-webkit-scrollbar-thumb:hover {
  background: #4f4f4f;
}
</style>