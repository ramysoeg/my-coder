<template>
  <div class="ai-settings">
    <h2>AI Assistant Settings</h2>
    
    <div class="settings-section">
      <h3>API Configuration</h3>
      <div class="form-group">
        <label for="apiKey">API Key</label>
        <div class="api-key-input">
          <input 
            :type="showApiKey ? 'text' : 'password'" 
            id="apiKey" 
            v-model="config.apiKey" 
            placeholder="Enter your OpenAI API key"
          />
          <button @click="toggleApiKeyVisibility" class="toggle-visibility">
            {{ showApiKey ? 'Hide' : 'Show' }}
          </button>
        </div>
        <small>Your API key is stored locally and never sent to our servers.</small>
      </div>
      
      <div class="form-group">
        <label for="model">Model</label>
        <select id="model" v-model="config.model">
          <option value="gpt-4">GPT-4</option>
          <option value="gpt-4-turbo">GPT-4 Turbo</option>
          <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
        </select>
      </div>
      
      <div class="form-group">
        <label for="baseUrl">API Endpoint</label>
        <input 
          type="text" 
          id="baseUrl" 
          v-model="config.baseUrl" 
          placeholder="https://api.openai.com/v1"
        />
        <small>Change only if you're using a custom endpoint or proxy.</small>
      </div>
    </div>
    
    <div class="settings-section">
      <h3>Generation Settings</h3>
      <div class="form-group">
        <label for="temperature">Temperature: {{ config.temperature }}</label>
        <input 
          type="range" 
          id="temperature" 
          v-model.number="config.temperature" 
          min="0" 
          max="2" 
          step="0.1"
        />
        <div class="range-labels">
          <span>Precise</span>
          <span>Balanced</span>
          <span>Creative</span>
        </div>
      </div>
      
      <div class="form-group">
        <label for="maxTokens">Max Tokens: {{ config.maxTokens }}</label>
        <input 
          type="range" 
          id="maxTokens" 
          v-model.number="config.maxTokens" 
          min="256" 
          max="4096" 
          step="256"
        />
        <div class="range-labels">
          <span>Shorter</span>
          <span>Medium</span>
          <span>Longer</span>
        </div>
      </div>
    </div>
    
    <div class="settings-actions">
      <button @click="saveSettings" class="save-button" :disabled="!isChanged">Save Settings</button>
      <button @click="resetSettings" class="reset-button" :disabled="!isChanged">Reset</button>
    </div>
    
    <div v-if="saveStatus" class="save-status" :class="saveStatus.type">
      {{ saveStatus.message }}
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, reactive, computed, onMounted } from 'vue';
import { aiService, AIConfig } from '../services/aiService';

export default defineComponent({
  name: 'AISettings',
  emits: ['settings-saved'],
  setup(_, { emit }) {
    const originalConfig = ref<AIConfig>({});
    const config = reactive<AIConfig>({
      apiKey: '',
      model: 'gpt-4',
      baseUrl: 'https://api.openai.com/v1',
      temperature: 0.7,
      maxTokens: 2048
    });
    const showApiKey = ref(false);
    const saveStatus = ref<{ message: string, type: 'success' | 'error' } | null>(null);

    const isChanged = computed(() => {
      return JSON.stringify(config) !== JSON.stringify(originalConfig.value);
    });

    const toggleApiKeyVisibility = () => {
      showApiKey.value = !showApiKey.value;
    };

    const loadSettings = () => {
      const currentConfig = aiService.getConfig();
      
      // Update the reactive config object
      config.apiKey = currentConfig.apiKey || '';
      config.model = currentConfig.model || 'gpt-4';
      config.baseUrl = currentConfig.baseUrl || 'https://api.openai.com/v1';
      config.temperature = currentConfig.temperature || 0.7;
      config.maxTokens = currentConfig.maxTokens || 2048;
      
      // Store original values for comparison
      originalConfig.value = { ...config };
    };

    const saveSettings = () => {
      try {
        aiService.setConfig(config);
        originalConfig.value = { ...config };
        
        saveStatus.value = {
          message: 'Settings saved successfully!',
          type: 'success'
        };
        
        emit('settings-saved', config);
        
        // Clear status after 3 seconds
        setTimeout(() => {
          saveStatus.value = null;
        }, 3000);
      } catch (error) {
        console.error('Failed to save settings:', error);
        saveStatus.value = {
          message: 'Failed to save settings. Please try again.',
          type: 'error'
        };
      }
    };

    const resetSettings = () => {
      // Reset to original values
      Object.assign(config, originalConfig.value);
    };

    onMounted(() => {
      loadSettings();
    });

    return {
      config,
      showApiKey,
      saveStatus,
      isChanged,
      toggleApiKeyVisibility,
      saveSettings,
      resetSettings
    };
  }
});
</script>

<style scoped>
.ai-settings {
  padding: 20px;
  color: #cccccc;
  max-width: 600px;
  margin: 0 auto;
}

h2 {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 20px;
  font-weight: 500;
  color: #ffffff;
}

h3 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 16px;
  font-weight: 500;
  color: #e0e0e0;
}

.settings-section {
  background-color: #252526;
  border-radius: 6px;
  padding: 15px;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-size: 14px;
}

input[type="text"],
input[type="password"],
select {
  width: 100%;
  padding: 8px 10px;
  background-color: #1e1e1e;
  border: 1px solid #3c3c3c;
  border-radius: 4px;
  color: #cccccc;
  font-size: 14px;
}

input[type="text"]:focus,
input[type="password"]:focus,
select:focus {
  outline: none;
  border-color: #0078d4;
}

.api-key-input {
  display: flex;
  gap: 5px;
}

.api-key-input input {
  flex: 1;
}

.toggle-visibility {
  background-color: #2d2d2d;
  border: 1px solid #3c3c3c;
  color: #cccccc;
  padding: 0 10px;
  border-radius: 4px;
  cursor: pointer;
}

.toggle-visibility:hover {
  background-color: #3e3e3e;
}

small {
  display: block;
  margin-top: 5px;
  font-size: 12px;
  color: #888888;
}

input[type="range"] {
  width: 100%;
  margin: 10px 0;
  background-color: #1e1e1e;
}

.range-labels {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #888888;
}

.settings-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.save-button,
.reset-button {
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  border: none;
}

.save-button {
  background-color: #0078d4;
  color: white;
}

.save-button:hover:not(:disabled) {
  background-color: #0086f0;
}

.reset-button {
  background-color: #2d2d2d;
  color: #cccccc;
}

.reset-button:hover:not(:disabled) {
  background-color: #3e3e3e;
}

.save-button:disabled,
.reset-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.save-status {
  margin-top: 15px;
  padding: 10px;
  border-radius: 4px;
  font-size: 14px;
  text-align: center;
}

.save-status.success {
  background-color: rgba(16, 142, 75, 0.2);
  color: #2ecc71;
}

.save-status.error {
  background-color: rgba(231, 76, 60, 0.2);
  color: #e74c3c;
}
</style>