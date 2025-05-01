<template>
  <div ref="editorContainer" class="monaco-editor-container"></div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, watch, onBeforeUnmount, PropType } from 'vue';
import * as monaco from 'monaco-editor';

export default defineComponent({
  name: 'MonacoEditor',
  props: {
    modelValue: {
      type: String,
      default: ''
    },
    language: {
      type: String,
      default: 'javascript'
    },
    theme: {
      type: String,
      default: 'vs-dark'
    },
    options: {
      type: Object as PropType<monaco.editor.IStandaloneEditorConstructionOptions>,
      default: () => ({})
    }
  },
  emits: ['update:modelValue', 'change', 'selection-change'],
  setup(props, { emit }) {
    const editorContainer = ref<HTMLElement | null>(null);
    let editor: monaco.editor.IStandaloneCodeEditor | null = null;
    let preventTriggerChangeEvent = false;

    onMounted(() => {
      if (!editorContainer.value) return;

      // Initialize Monaco editor
      editor = monaco.editor.create(editorContainer.value, {
        value: props.modelValue,
        language: props.language,
        theme: props.theme,
        automaticLayout: true,
        minimap: { enabled: true },
        scrollBeyondLastLine: false,
        ...props.options
      });

      // Handle content changes
      editor.onDidChangeModelContent(() => {
        if (!editor || preventTriggerChangeEvent) return;
        
        const value = editor.getValue();
        emit('update:modelValue', value);
        emit('change', value);
      });
      
      // Handle selection changes
      editor.onDidChangeCursorSelection((e) => {
        if (!editor) return;
        
        const selection = editor.getModel()?.getValueInRange(e.selection) || '';
        if (selection) {
          emit('selection-change', selection);
        }
      });
    });

    // Watch for prop changes
    watch(() => props.modelValue, (newValue) => {
      if (!editor || editor.getValue() === newValue) return;
      
      preventTriggerChangeEvent = true;
      editor.setValue(newValue);
      preventTriggerChangeEvent = false;
    });

    watch(() => props.language, (newValue) => {
      if (!editor) return;
      
      const model = editor.getModel();
      if (model) {
        monaco.editor.setModelLanguage(model, newValue);
      }
    });

    watch(() => props.theme, (newValue) => {
      if (!editor) return;
      monaco.editor.setTheme(newValue);
    });

    onBeforeUnmount(() => {
      if (editor) {
        editor.dispose();
      }
    });

    // Method to insert text at cursor position
    const insertTextAtCursor = (text: string) => {
      if (!editor) return;
      
      const selection = editor.getSelection();
      if (selection) {
        const position = selection.getStartPosition();
        editor.executeEdits('', [
          {
            range: new monaco.Range(
              position.lineNumber,
              position.column,
              position.lineNumber,
              position.column
            ),
            text: text
          }
        ]);
      }
    };

    return {
      editorContainer,
      insertTextAtCursor
    };
  }
});
</script>

<style scoped>
.monaco-editor-container {
  width: 100%;
  height: 100%;
}
</style>