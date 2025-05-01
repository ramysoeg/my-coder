import { defineStore } from 'pinia';

interface FileInfo {
  path: string;
  name: string;
  content: string;
}

export const useFileStore = defineStore('file', {
  state: () => ({
    currentFile: null as FileInfo | null,
    recentFiles: [] as FileInfo[],
    isModified: false
  }),
  
  actions: {
    setCurrentFile(file: FileInfo) {
      this.currentFile = file;
      this.isModified = false;
      
      // Add to recent files if not already there
      const existingIndex = this.recentFiles.findIndex(f => f.path === file.path);
      if (existingIndex !== -1) {
        // Remove from current position
        this.recentFiles.splice(existingIndex, 1);
      }
      
      // Add to the beginning of the list
      this.recentFiles.unshift(file);
      
      // Keep only the last 10 files
      if (this.recentFiles.length > 10) {
        this.recentFiles = this.recentFiles.slice(0, 10);
      }
    },
    
    updateContent(content: string) {
      if (this.currentFile) {
        this.currentFile.content = content;
        this.isModified = true;
      }
    },
    
    clearCurrentFile() {
      this.currentFile = null;
      this.isModified = false;
    }
  }
});