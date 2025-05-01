# MyCoder - Modern Code Editor with AI Integration

MyCoder is a modern code editor inspired by VSCode with integrated AI assistance, similar to Cursor and Windsurf. Built with Electron, Vue.js, and Monaco Editor for a fast, responsive coding experience.

## Features

- 🚀 Modern code editing with Monaco Editor
- 🤖 Integrated AI assistant for coding help
- 📁 File explorer for project navigation
- 🎨 Dark theme and customizable UI
- ⚡ Fast and responsive interface
- 🔄 Real-time code analysis and suggestions
- 🔌 Extensible architecture
- 🔍 Smart code completion
- 🔗 AI API integration (OpenAI)

## Tech Stack

- **Electron**: Cross-platform desktop application framework
- **Vue.js**: Frontend framework for UI components
- **Monaco Editor**: Code editing component (same as VSCode)
- **TypeScript**: Type-safe JavaScript
- **Pinia**: State management for Vue
- **Webpack**: Module bundler

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/ramysoeg/my-coder.git
cd my-coder

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Build for Production

```bash
# Build the application
npm run build

# Package the application
npm run package
```

## Development

### Project Structure

```
my-coder/
├── public/              # Static assets
├── src/
│   ├── main/            # Electron main process
│   │   └── main.ts      # Main entry point
│   ├── renderer/        # Renderer process (Vue app)
│   │   ├── components/  # Vue components
│   │   ├── services/    # Services (AI, etc.)
│   │   ├── stores/      # Pinia stores
│   │   └── main.ts      # Renderer entry point
│   └── preload.ts       # Preload script for IPC
├── package.json         # Project metadata
└── tsconfig.json        # TypeScript configuration
```

## AI Integration

The AI assistant is designed to help with:

- Code explanations and understanding
- Debugging assistance and error fixing
- Code suggestions and improvements
- Best practices and patterns
- Documentation generation
- Refactoring suggestions
- Test case generation
- Learning new concepts

### AI Features

- **Context-aware assistance**: The AI understands your current file and project context
- **Code selection**: Select code to get specific help on that section
- **Insert to editor**: Insert AI suggestions directly into your code
- **Configurable models**: Choose between different AI models (GPT-4, GPT-3.5, etc.)
- **Custom API endpoints**: Use your own API endpoints or proxies
- **Conversation history**: Review and continue previous conversations
- **Markdown support**: Rich formatting with syntax highlighting

## License

This project is licensed under the ISC License.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+S` / `Cmd+S` | Save file |
| `Ctrl+O` / `Cmd+O` | Open file |
| `Ctrl+N` / `Cmd+N` | New file |
| `Ctrl+F` / `Cmd+F` | Find in file |
| `Ctrl+Shift+F` / `Cmd+Shift+F` | Find in project |
| `Ctrl+Space` | Trigger suggestions |
| `F1` | Command palette |

## Screenshots

*Coming soon*

## Roadmap

- [ ] Plugin system for extensions
- [ ] Git integration
- [ ] Terminal integration
- [ ] Multiple editor tabs
- [ ] Settings synchronization
- [ ] Themes and customization
- [ ] Collaborative editing
- [ ] Advanced AI features (code generation, refactoring)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Acknowledgements

- Inspired by VSCode, Cursor, and Windsurf
- Built with Electron and Vue.js
- Uses Monaco Editor for code editing
- Special thanks to the open source community