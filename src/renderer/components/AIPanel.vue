<template>
  <div class="ai-panel">
    <div class="ai-panel-header">
      <span>AI Assistant</span>
      <button @click="$emit('toggle')">{{ isOpen ? 'Close' : 'Open' }}</button>
    </div>
    <div v-if="isOpen" class="ai-panel-content">
      <div v-for="(message, index) in messages" :key="index" class="ai-message" :class="message.role">
        <div class="ai-message-header">
          <strong>{{ message.role === 'user' ? 'You' : 'AI Assistant' }}</strong>
        </div>
        <div class="ai-message-content">{{ message.content }}</div>
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
      <input
        v-model="inputText"
        class="ai-input"
        placeholder="Ask AI for help..."
        @keyup.enter="sendMessage"
        :disabled="isLoading"
      />
      <button class="ai-send-button" @click="sendMessage" :disabled="isLoading">
        Send
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, PropType } from 'vue';
import { Message, aiService } from '../services/aiService';

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
    }
  },
  emits: ['toggle', 'message-sent'],
  setup(props, { emit }) {
    const messages = ref<Message[]>([...props.initialMessages]);
    const inputText = ref('');
    const isLoading = ref(false);

    const sendMessage = async () => {
      if (!inputText.value.trim() || isLoading.value) return;
      
      const userMessage: Message = {
        role: 'user',
        content: inputText.value
      };
      
      messages.value.push(userMessage);
      inputText.value = '';
      isLoading.value = true;
      
      try {
        // Send to AI service
        const response = await aiService.sendMessage([...messages.value]);
        
        // Add response to messages
        messages.value.push(response);
        
        // Emit event
        emit('message-sent', {
          userMessage,
          aiResponse: response
        });
      } catch (error) {
        console.error('Error sending message to AI:', error);
        messages.value.push({
          role: 'assistant',
          content: 'Sorry, I encountered an error processing your request.'
        });
      } finally {
        isLoading.value = false;
      }
    };

    return {
      messages,
      inputText,
      isLoading,
      sendMessage
    };
  }
});
</script>

<style scoped>
.ai-message {
  margin-bottom: 12px;
  padding: 8px 12px;
  border-radius: 6px;
  max-width: 85%;
}

.ai-message.user {
  background-color: #2b2b2b;
  margin-left: auto;
}

.ai-message.assistant {
  background-color: #1e1e1e;
  margin-right: auto;
}

.ai-message.system {
  background-color: #252526;
  margin: 0 auto 12px;
  font-style: italic;
  color: #888;
  text-align: center;
}

.ai-message-header {
  margin-bottom: 4px;
  font-size: 12px;
}

.ai-message-content {
  white-space: pre-wrap;
  word-break: break-word;
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
</style>