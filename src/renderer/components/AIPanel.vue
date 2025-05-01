<template>
  <div class="ai-panel">
    <div class="ai-panel-header">
      <div class="ai-panel-title">
        <span class="ai-icon">AI</span>
        <span>AI Assistant</span>
      </div>
      <div class="ai-panel-actions">
        <button class="ai-action-button" @click="clearConversation" title="Clear conversation">
          <span>Clear</span>
        </button>
        <button class="ai-action-button" @click="$emit('toggle')" title="Toggle panel">
          {{ isOpen ? 'Close' : 'Open' }}
        </button>
      </div>
    </div>
    
    <div v-if="isOpen" class="ai-panel-content" ref="messagesContainer">
      <div v-if="messages.length <= 1" class="ai-welcome">
        <h3>Welcome to AI Assistant</h3>
        <p>I can help you with:</p>
        <ul>
          <li><button @click="usePrompt('Explain this code')">Explain code</button></li>
          <li><button @click="usePrompt('Refactor this code to improve performance')">Refactor code</button></li>
          <li><button @click="usePrompt('Find bugs in this code')">Find bugs</button></li>
          <li><button @click="usePrompt('Generate a unit test for this code')">Generate tests</button></li>
          <li><button @click="usePrompt('Document this code')">Document code</button></li>
        </ul>
      </div>
      
      <div v-for="(message, index) in messages" :key="index" class="ai-message" :class="message.role">
        <div class="ai-message-header">
          <strong>{{ message.role === 'user' ? 'You' : message.role === 'system' ? 'System' : 'AI Assistant' }}</strong>
          <span class="ai-message-time" v-if="message.timestamp">{{ formatTime(message.timestamp) }}</span>
        </div>
        <div class="ai-message-content" v-html="formatMessage(message.content)"></div>
        <div class="ai-message-actions" v-if="message.role === 'assistant'">
          <button @click="copyToClipboard(message.content)" title="Copy to clipboard">Copy</button>
          <button @click="insertToEditor(message.content)" title="Insert into editor">Insert</button>
        </div>
      </div>
      
      <div v-if="isLoading" class="ai-message assistant">
        <div class="ai-message-header">
          <strong>AI Assistant</strong>
        </div>
        <div class="ai-message-content">
          <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>
    
    <div v-if="isOpen" class="ai-input-container">
      <div class="ai-input-wrapper">
        <textarea
          v-model="inputText"
          class="ai-input"
          placeholder="Ask AI for help with your code..."
          @keydown.enter.prevent="handleEnterKey"
          :disabled="isLoading"
          ref="inputField"
          rows="1"
          @input="autoResizeInput"
        ></textarea>
        <div class="ai-input-actions">
          <button 
            class="ai-send-button" 
            @click="sendMessage" 
            :disabled="isLoading || !inputText.trim()"
            :class="{ 'ai-send-active': inputText.trim() }"
          >
            <span>Send</span>
          </button>
        </div>
      </div>
      <div class="ai-context-indicator" v-if="hasSelectedCode">
        <span>Using selected code as context</span>
        <button @click="clearSelectedCode">Clear</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, PropType, computed, nextTick, onMounted, watch } from 'vue';
import { Message, aiService } from '../services/aiService';
import { useFileStore } from '../stores/fileStore';
import hljs from 'highlight.js';
import 'highlight.js/styles/vs2015.css';
import DOMPurify from 'dompurify';
import { marked } from 'marked';

interface MessageWithTimestamp extends Message {
  timestamp?: Date;
}

export default defineComponent({
  name: 'AIPanel',
  props: {
    isOpen: {
      type: Boolean,
      default: true
    },
    initialMessages: {
      type: Array as PropType<Message[]>,
      default: () => [
        { role: 'system', content: 'AI Assistant is ready to help you with coding.' }
      ]
    },
    selectedCode: {
      type: String,
      default: ''
    }
  },
  emits: ['toggle', 'message-sent', 'insert-to-editor'],
  setup(props, { emit }) {
    const fileStore = useFileStore();
    const messages = ref<MessageWithTimestamp[]>([...props.initialMessages]);
    const inputText = ref('');
    const isLoading = ref(false);
    const messagesContainer = ref<HTMLElement | null>(null);
    const inputField = ref<HTMLTextAreaElement | null>(null);
    const selectedCodeContext = ref(props.selectedCode);

    const hasSelectedCode = computed(() => !!selectedCodeContext.value);

    watch(() => props.selectedCode, (newCode) => {
      selectedCodeContext.value = newCode;
    });

    const formatTime = (date: Date) => {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatMessage = (content: string) => {
      // Convert markdown to HTML
      const html = marked(content);
      
      // Sanitize the HTML
      const sanitized = DOMPurify.sanitize(html);
      
      // Highlight code blocks
      const highlighted = sanitized.replace(/<pre><code class="language-(\w+)">([\s\S]+?)<\/code><\/pre>/g, 
        (_, lang, code) => {
          try {
            const highlighted = hljs.highlight(code, { language: lang }).value;
            return `<pre><code class="hljs language-${lang}">${highlighted}</code></pre>`;
          } catch (e) {
            return `<pre><code class="hljs">${hljs.highlightAuto(code).value}</code></pre>`;
          }
        }
      );
      
      return highlighted;
    };

    const scrollToBottom = async () => {
      await nextTick();
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
      }
    };

    const autoResizeInput = () => {
      if (!inputField.value) return;
      
      // Reset height to auto to get the correct scrollHeight
      inputField.value.style.height = 'auto';
      
      // Set the height to scrollHeight
      const newHeight = Math.min(inputField.value.scrollHeight, 150);
      inputField.value.style.height = `${newHeight}px`;
    };

    const handleEnterKey = (e: KeyboardEvent) => {
      if (e.shiftKey) {
        // Allow shift+enter for new line
        return;
      }
      sendMessage();
    };

    const clearConversation = () => {
      messages.value = [
        { role: 'system', content: 'AI Assistant is ready to help you with coding.' }
      ];
    };

    const usePrompt = (promptText: string) => {
      inputText.value = promptText;
      if (inputField.value) {
        inputField.value.focus();
      }
    };

    const clearSelectedCode = () => {
      selectedCodeContext.value = '';
    };

    const copyToClipboard = async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        // Could show a toast notification here
      } catch (err) {
        console.error('Failed to copy text: ', err);
      }
    };

    const insertToEditor = (text: string) => {
      emit('insert-to-editor', text);
    };

    const sendMessage = async () => {
      if (!inputText.value.trim() || isLoading.value) return;
      
      let messageContent = inputText.value;
      
      // Add selected code as context if available
      if (selectedCodeContext.value) {
        messageContent = `${messageContent}\n\n\`\`\`\n${selectedCodeContext.value}\n\`\`\``;
      }
      
      const userMessage: MessageWithTimestamp = {
        role: 'user',
        content: messageContent,
        timestamp: new Date()
      };
      
      messages.value.push(userMessage);
      inputText.value = '';
      isLoading.value = true;
      
      // Reset textarea height
      if (inputField.value) {
        inputField.value.style.height = 'auto';
      }
      
      // Scroll to bottom to show the new message
      scrollToBottom();
      
      try {
        // Get current file context
        const currentFile = fileStore.currentFile;
        const fileContext = currentFile ? 
          `Current file: ${currentFile.name} (${currentFile.path})` : 
          'No file currently open';
        
        // Create context message
        const contextMessage: Message = {
          role: 'system',
          content: `${fileContext}\n\nUser is working on a code editor project.`
        };
        
        // Send to AI service with context
        const allMessages = [
          ...messages.value.filter(m => m.role !== 'system'),
          contextMessage
        ];
        
        const response = await aiService.sendMessage(allMessages);
        
        // Add timestamp to response
        const responseWithTime: MessageWithTimestamp = {
          ...response,
          timestamp: new Date()
        };
        
        // Add response to messages
        messages.value.push(responseWithTime);
        
        // Emit event
        emit('message-sent', {
          userMessage,
          aiResponse: responseWithTime
        });
      } catch (error) {
        console.error('Error sending message to AI:', error);
        messages.value.push({
          role: 'assistant',
          content: 'Sorry, I encountered an error processing your request.',
          timestamp: new Date()
        });
      } finally {
        isLoading.value = false;
        scrollToBottom();
        clearSelectedCode();
      }
    };

    onMounted(() => {
      if (inputField.value) {
        inputField.value.focus();
      }
    });

    return {
      messages,
      inputText,
      isLoading,
      messagesContainer,
      inputField,
      hasSelectedCode,
      formatTime,
      formatMessage,
      sendMessage,
      clearConversation,
      usePrompt,
      copyToClipboard,
      insertToEditor,
      clearSelectedCode,
      handleEnterKey,
      autoResizeInput
    };
  }
});
</script>

<style scoped>
.ai-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #1e1e1e;
  border-left: 1px solid #252525;
}

.ai-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 10px;
  height: 36px;
  background-color: #252526;
  border-bottom: 1px solid #1a1a1a;
}

.ai-panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

.ai-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background-color: #0078d4;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.ai-panel-actions {
  display: flex;
  gap: 5px;
}

.ai-action-button {
  background: none;
  border: none;
  color: #cccccc;
  cursor: pointer;
  padding: 2px 5px;
  font-size: 12px;
  border-radius: 3px;
}

.ai-action-button:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.ai-panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  display: flex;
  flex-direction: column;
}

.ai-welcome {
  background-color: #252526;
  border-radius: 6px;
  padding: 15px;
  margin-bottom: 15px;
}

.ai-welcome h3 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 16px;
}

.ai-welcome ul {
  list-style-type: none;
  padding: 0;
  margin: 0;
}

.ai-welcome li {
  margin-bottom: 8px;
}

.ai-welcome button {
  background-color: #2d2d2d;
  border: none;
  color: #cccccc;
  padding: 5px 10px;
  border-radius: 3px;
  cursor: pointer;
  width: 100%;
  text-align: left;
  transition: background-color 0.2s;
}

.ai-welcome button:hover {
  background-color: #3e3e3e;
}

.ai-message {
  margin-bottom: 12px;
  padding: 10px 12px;
  border-radius: 6px;
  max-width: 95%;
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.ai-message.user {
  background-color: #2b2b2b;
  margin-left: auto;
  border-top-right-radius: 2px;
}

.ai-message.assistant {
  background-color: #252526;
  margin-right: auto;
  border-top-left-radius: 2px;
}

.ai-message.system {
  background-color: #1e1e1e;
  margin: 0 auto 12px;
  font-style: italic;
  color: #888;
  text-align: center;
  font-size: 12px;
  padding: 5px 10px;
}

.ai-message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  font-size: 12px;
}

.ai-message-time {
  color: #888;
  font-size: 10px;
}

.ai-message-content {
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.5;
}

.ai-message-content :deep(pre) {
  background-color: #1e1e1e;
  border-radius: 4px;
  padding: 10px;
  overflow-x: auto;
  margin: 10px 0;
}

.ai-message-content :deep(code) {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
}

.ai-message-content :deep(p) {
  margin: 8px 0;
}

.ai-message-actions {
  display: flex;
  justify-content: flex-end;
  gap: 5px;
  margin-top: 5px;
  opacity: 0;
  transition: opacity 0.2s;
}

.ai-message:hover .ai-message-actions {
  opacity: 1;
}

.ai-message-actions button {
  background-color: transparent;
  border: none;
  color: #888;
  cursor: pointer;
  font-size: 11px;
  padding: 2px 5px;
  border-radius: 3px;
}

.ai-message-actions button:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: #cccccc;
}

.typing-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background-color: #888;
  border-radius: 50%;
  display: inline-block;
  animation: typing 1.4s infinite ease-in-out both;
}

.typing-indicator span:nth-child(1) {
  animation-delay: 0s;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 80%, 100% {
    transform: scale(0.6);
    opacity: 0.4;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.ai-input-container {
  padding: 10px;
  background-color: #252526;
  border-top: 1px solid #1a1a1a;
}

.ai-input-wrapper {
  display: flex;
  background-color: #1e1e1e;
  border-radius: 6px;
  border: 1px solid #3c3c3c;
  overflow: hidden;
}

.ai-input {
  flex: 1;
  background-color: transparent;
  border: none;
  color: #cccccc;
  padding: 10px;
  font-family: inherit;
  font-size: 14px;
  resize: none;
  outline: none;
  max-height: 150px;
}

.ai-input::placeholder {
  color: #888;
}

.ai-input-actions {
  display: flex;
  align-items: flex-end;
  padding: 5px;
}

.ai-send-button {
  background-color: transparent;
  border: none;
  color: #888;
  cursor: pointer;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ai-send-button.ai-send-active {
  background-color: #0078d4;
  color: white;
}

.ai-send-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ai-context-indicator {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 5px;
  padding: 5px 10px;
  background-color: #2d2d2d;
  border-radius: 4px;
  font-size: 12px;
  color: #888;
}

.ai-context-indicator button {
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  font-size: 12px;
}

.ai-context-indicator button:hover {
  color: #cccccc;
}
</style>