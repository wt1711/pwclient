# Unified Project Structure

## Source Tree Organization

```
pwclient/
├── src/
│   ├── app/                          # React application code
│   │   ├── atoms/                    # Atomic Design: Smallest UI components (legacy .jsx/.scss)
│   │   ├── components/               # Reusable UI components (.tsx/.ts)
│   │   ├── features/                 # Feature modules (self-contained)
│   │   │   ├── ai-assistant/         # AI Assistant feature
│   │   │   │   ├── dashboard/        # AI dashboard UI
│   │   │   │   ├── gen-response/     # Response generation feature
│   │   │   │   │   ├── GenerateResponseButton.tsx
│   │   │   │   │   ├── GeneratedResponseBox.tsx
│   │   │   │   │   ├── persona-selector/
│   │   │   │   │   └── tone-selector/
│   │   │   │   ├── utils/            # AI feature utilities
│   │   │   │   │   └── ai.ts         # AI API client functions
│   │   │   │   └── AIAssistantContext.tsx  # AI feature state
│   │   │   ├── room/                 # Chat room features
│   │   │   ├── settings/             # Settings features
│   │   │   └── [other features]/
│   │   ├── hooks/                    # Custom React hooks (.ts)
│   │   ├── molecules/                # Atomic Design: Compound components (legacy .jsx/.scss)
│   │   ├── organisms/                # Atomic Design: Complex components (legacy .jsx/.scss)
│   │   ├── pages/                    # Page-level components (.tsx/.ts)
│   │   ├── plugins/                  # Plugin integrations (.ts)
│   │   ├── state/                    # Global state management (Jotai atoms) (.ts)
│   │   ├── styles/                   # Global styles and style utilities (.ts)
│   │   ├── utils/                    # Utility functions (.ts)
│   │   └── cs-*.ts                   # Matrix client-server API utilities
│   ├── client/                       # Matrix client logic (legacy .js)
│   │   ├── action/                   # Redux-style actions
│   │   ├── state/                    # Legacy state management
│   │   ├── initMatrix.ts             # Matrix client initialization
│   │   └── dispatcher.js             # Event dispatcher
│   ├── electron/                     # Electron main process code
│   │   ├── main.ts                   # Electron entry point
│   │   ├── menu.ts                   # Application menu
│   │   ├── tray.ts                   # System tray
│   │   ├── preload.cts               # Preload script
│   │   └── [other electron modules]
│   ├── types/                        # TypeScript type definitions
│   │   └── matrix/                   # Matrix-specific types
│   ├── util/                         # Legacy utilities (.js)
│   ├── index.tsx                     # React application entry
│   ├── sw.ts                         # Service worker
│   ├── colors.css.ts                 # Color definitions (Vanilla Extract)
│   └── config.css.ts                 # Config variables (Vanilla Extract)
├── public/                           # Static assets
│   ├── res/                          # Resource files
│   │   ├── ic/                       # Icons
│   │   │   ├── outlined/
│   │   │   └── filled/
│   │   └── svg/
│   ├── sound/                        # Audio files
│   └── font/                         # Font files
├── docs/                             # Documentation
│   ├── prd/                          # Product requirements
│   ├── architecture/                 # Technical architecture (this directory)
│   └── stories/                      # User stories
├── dist-react/                       # Web build output
├── dist-electron/                    # Electron build output
└── [config files]                    # Root configuration files
```

## File Naming Conventions

### Component Files

- **React Components**: `PascalCase.tsx` (e.g., `GeneratedResponseBox.tsx`)
- **Styles**: `PascalCase.css.ts` or `kebab-case.css.ts` (e.g., `AIAssistant.css.ts`)
- **Type Definitions**: `camelCase.ts` or `PascalCase.ts`
- **Utilities**: `camelCase.ts` (e.g., `ai.ts`, `utils.ts`)

### Legacy Files

- **Legacy Components**: `.jsx` with corresponding `.scss` files
- **Legacy Utils**: `.js` files in `src/util/` and `src/client/`

## Module Organization Patterns

### Feature Modules (`src/app/features/`)

Each feature is self-contained with:

- Component files (`.tsx`)
- Context/state management
- Utilities specific to the feature
- Styles (`.css.ts`)
- Sub-features in nested directories

**Example: AI Assistant Feature**

```
features/ai-assistant/
├── AIAssistantContext.tsx       # Feature state (Jotai + React Context)
├── dashboard/                   # Dashboard sub-feature
├── gen-response/                # Response generation sub-feature
│   ├── GenerateResponseButton.tsx
│   ├── GeneratedResponseBox.tsx
│   ├── persona-selector/
│   └── tone-selector/
├── utils/
│   ├── ai.ts                    # API client functions
│   └── utils.ts                 # Feature utilities
└── assets/                      # Feature-specific assets
```

### Shared Components (`src/app/components/`)

Reusable components that can be used across features:

- Structured by component name
- Each component has its own directory if it has styles or sub-components
- Use TypeScript (.tsx/.ts)

### State Management (`src/app/state/`)

Global Jotai atoms are organized by domain:

- One file per state domain
- Export atoms and related selectors
- Co-located with feature when feature-specific

### Hooks (`src/app/hooks/`)

Custom React hooks:

- One hook per file
- Named with `use` prefix
- Organized by functionality

## Import Path Conventions

### Path Alias Usage

```typescript
// Use ~ alias for absolute imports from src/
import { useAIAssistant } from '~/app/features/ai-assistant/AIAssistantContext';
import { Button } from 'folds';
```

### Import Order (by convention)

1. React imports
2. Third-party libraries
3. Absolute imports using `~` alias
4. Relative imports
5. Type imports (if separated)

## Build Outputs

### Web Build (`dist-react/`)

- `index.html` - Entry HTML
- `assets/` - Bundled JS, CSS, and assets with hashed filenames
- `sw.js` - Service worker

### Electron Build (`dist-electron/`)

- Compiled TypeScript files from `src/electron/`
- `.js` and `.d.ts` files

## Asset Organization

### Icons

- **Outlined icons**: `public/res/ic/outlined/*.svg`
- **Filled icons**: `public/res/ic/filled/*.svg`
- **Brand icons**: `public/res/svg/*.svg`

### Sounds

- `public/sound/*.ogg` - Audio notification files

### Fonts

- `public/font/*.{ttf,woff2}` - Custom fonts (Twemoji)
