# Termolio

A modern, terminal-style portfolio and blog built with React, TypeScript, and Vite. Termolio provides an interactive terminal interface for showcasing projects, articles, and personal information in a unique, developer-friendly way.

## Features

- 🖥️ **Terminal Interface**: Interactive command-line interface with context-aware commands
- 📁 **Tabbed Navigation**: Open files and content in tabs for easy navigation
- 🎨 **Syntax Highlighting**: Code blocks with customizable themes (Dracula, Material Dark, etc.)
- 🧮 **LaTeX Support**: Mathematical expressions rendered with KaTeX
- 📝 **Markdown Support**: Full markdown rendering with GitHub Flavored Markdown
- ⚙️ **Dynamic Configuration**: JSON-based configuration system
- 🔍 **Smart Autocomplete**: Context-aware command and file completion
- 📚 **Content Management**: Organized articles and projects
- 🐳 **Docker Ready**: Development and production Docker configurations

## Quick Start

### Prerequisites

- Node.js (v20.19.0+ or v22.12.0+)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd termolio
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Available Commands

### Terminal Commands

- `help` - Show available commands
- `ls` - List files and directories in current path
- `cd [directory]` - Change directory (articles, projects)
- `cat [filename]` - Open and display file content in a new tab
- `projects` - List all available projects
- `articles` - List all available articles
- `clear` - Clear terminal history

### Keyboard Shortcuts

- **Tab**: Autocomplete commands and file names
- **↑/↓**: Navigate command history
- **Ctrl+C**: Clear current input

## Configuration

Termolio uses a JSON-based configuration system located at `src/config.json`. You can customize various aspects of the application:

### Configuration Structure

```json
{
  "site": {
    "name": "Termolio",
    "description": "A terminal-style portfolio and blog",
    "author": "Your Name",
    "url": "https://termolio.example.com"
  },
  "theme": {
    "syntax_highlighting": "dracula",
    "terminal_theme": "dark",
    "font_family": "monospace"
  },
  "content": {
    "articles_path": "content/articles",
    "projects_path": "content/projects",
    "max_recent_items": 5
  },
  "terminal": {
    "prompt_symbol": "❯",
    "default_path": "/",
    "welcome_message": "Welcome to Termolio! Type `help` to see available commands."
  },
  "navigation": {
    "show_breadcrumbs": true,
    "enable_autocomplete": true,
    "history_limit": 100
  }
}
```

### Configuration Options

#### Site Configuration
- `name`: Application name displayed in the terminal title
- `description`: Site description for meta tags
- `author`: Author name
- `url`: Site URL

#### Theme Configuration
- `syntax_highlighting`: Code syntax theme ("dracula", "materialDark")
- `terminal_theme`: Terminal color scheme
- `font_family`: Font family for the terminal

#### Content Configuration
- `articles_path`: Path to articles directory
- `projects_path`: Path to projects directory
- `max_recent_items`: Maximum number of recent items to display

#### Terminal Configuration
- `prompt_symbol`: Symbol used in the terminal prompt
- `default_path`: Default starting path
- `welcome_message`: Message displayed when the terminal loads

#### Navigation Configuration
- `show_breadcrumbs`: Enable/disable breadcrumb navigation
- `enable_autocomplete`: Enable/disable autocomplete functionality
- `history_limit`: Maximum number of commands to keep in history

## Content Management

### Adding Articles

1. Create a new markdown file in `src/content/articles/`
2. Add the filename to the articles list in `src/utils/contentLoader.ts`
3. The article will automatically be available via the `articles` and `cat` commands

### Adding Projects

1. Create a new markdown file in `src/content/projects/`
2. Add the filename to the projects list in `src/utils/contentLoader.ts`
3. The project will automatically be available via the `projects` and `cat` commands

### Markdown Features

Termolio supports:
- **GitHub Flavored Markdown** (tables, strikethrough, task lists, etc.)
- **Code blocks** with syntax highlighting
- **Mathematical expressions** using LaTeX syntax
- **Inline code** formatting

Example markdown with LaTeX:
```markdown
# Sample Article

Here's some inline math: $E = mc^2$

And a code block:
```javascript
function hello() {
  console.log('Hello, World!');
}
```

Block math:
$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$
```

## Docker Support

### Development

```bash
# Build and run development container
docker build -f Dockerfile.dev -t termolio:dev .
docker run -p 5173:5173 -v $(pwd):/app termolio:dev
```

### Production

```bash
# Build and run production container
docker build -f Dockerfile.prod -t termolio:prod .
docker run -p 4173:4173 termolio:prod
```

## Build Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

## GitHub Actions

The project includes a GitHub Actions workflow for automated Docker image builds on push/PR to the main branch.

## Technologies Used

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Markdown** - Markdown rendering
- **React Syntax Highlighter** - Code syntax highlighting
- **KaTeX** - LaTeX math rendering
- **Tailwind CSS** - Utility-first CSS framework

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Customization

### Changing Syntax Highlighting Theme

Edit `src/config.json`:
```json
{
  "theme": {
    "syntax_highlighting": "materialDark"
  }
}
```

Available themes: `dracula`, `materialDark`

### Adding New Themes

1. Import the theme in `src/App.tsx`:
```typescript
import { dracula, materialDark, newTheme } from 'react-syntax-highlighter/dist/esm/styles/prism';
```

2. Add it to the `getSyntaxTheme()` function:
```typescript
const getSyntaxTheme = () => {
  switch (themeConfig.syntax_highlighting) {
    case 'dracula':
      return dracula;
    case 'materialDark':
      return materialDark;
    case 'newTheme':
      return newTheme;
    default:
      return dracula;
  }
};
```

3. Update your `config.json` to use the new theme.

### Custom CSS Variables

The application uses CSS custom properties that are dynamically set based on configuration:

- `--terminal-font-family`: Terminal font family
- `--terminal-prompt-symbol`: Prompt symbol
- `--site-name`: Site name
- `--terminal-welcome-message`: Welcome message

You can override these in your CSS or add new ones by modifying the `useEffect` in `App.tsx`.

---

Built with ❤️ for developers who love terminals.
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
