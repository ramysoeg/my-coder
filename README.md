# MyCoder - Modern Code Editor with AI Integration

MyCoder is a modern code editor inspired by VSCode with integrated AI assistance, similar to Cursor and Windsurf. Built with Electron, Vue.js, and Monaco Editor.

## Features

- 🚀 Modern code editing with Monaco Editor
- 🤖 Integrated AI assistant for coding help
- 📁 File explorer for project navigation
- 🎨 Dark theme and customizable UI
- ⚡ Fast and responsive interface
- 🔄 Real-time code analysis and suggestions

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

- Code explanations
- Debugging assistance
- Code suggestions
- Best practices
- Documentation

## License

This project is licensed under the ISC License.

## Acknowledgements

- Inspired by VSCode, Cursor, and Windsurf
- Built with Electron and Vue.js
- Uses Monaco Editor for code editing