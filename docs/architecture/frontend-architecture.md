# Frontend Architecture

## Overview

Pocket Wingman uses a modern React architecture with TypeScript, functional components, and hooks. The application follows a feature-based organization pattern with shared components and utilities.

## Architecture Patterns

### Component Architecture

- **Functional Components**: All components use React function components
- **Hooks**: Use React hooks for state and side effects
- **TypeScript**: Strongly typed props and state
- **Composition**: Build complex UIs from simple, reusable components

### Design System Layers

#### Layer 1: Folds Design System

- Base component library: `Box`, `Text`, `Button`, `Spinner`, `IconButton`, etc.
- Design tokens: colors, spacing, radii, typography
- Provides consistent styling foundation

#### Layer 2: Atomic Components (Legacy)

- Located in `src/app/atoms/`, `src/app/molecules/`, `src/app/organisms/`
- Legacy components using `.jsx` and `.scss`
- Being gradually migrated to TypeScript + Vanilla Extract

#### Layer 3: Shared Components

- Located in `src/app/components/`
- Reusable TypeScript components built on Folds
- Examples: `InfoCard`, `UserAvatar`, `RoomCard`, `MessageLayout`

#### Layer 4: Feature Components

- Located in `src/app/features/`
- Feature-specific components
- Self-contained with own state, utils, and sub-components

## State Management Strategy

### Multi-Level State Management

#### 1. Jotai Atoms (Global State)

- **Location**: `src/app/state/` or co-located with features
- **Use Case**: Application-wide state, settings, user preferences
- **Example**:

  ```typescript
  // src/app/state/settings.ts
  import { atom } from 'jotai';

  export const settingsAtom = atom({
    theme: 'dark',
    notifications: true,
  });
  ```

#### 2. React Context (Feature State)

- **Location**: Feature root directory (e.g., `AIAssistantContext.tsx`)
- **Use Case**: State scoped to a feature or section
- **Pattern**:

  ```typescript
  // AIAssistantContext.tsx
  const AIAssistantContext = createContext<AIAssistantContextValue | undefined>(undefined);

  export function AIAssistantProvider({ children }: Props) {
    const [state, setState] = useState(initialState);

    return (
      <AIAssistantContext.Provider value={{ state, setState }}>
        {children}
      </AIAssistantContext.Provider>
    );
  }

  export function useAIAssistant() {
    const context = useContext(AIAssistantContext);
    if (!context) throw new Error('Must be used within AIAssistantProvider');
    return context;
  }
  ```

#### 3. Component State (Local State)

- **Use Case**: State local to a single component
- **Pattern**: `useState`, `useReducer`

#### 4. React Query (Server State)

- **Library**: @tanstack/react-query
- **Use Case**: Async data fetching, caching, and synchronization
- **Currently**: Limited usage; opportunity for expansion

### State Selection Guidelines

| State Type    | Storage            | Use Case                              |
| ------------- | ------------------ | ------------------------------------- |
| User settings | Jotai atom         | Global preferences, theme, language   |
| Feature state | React Context      | AI Assistant state, room editor state |
| Server data   | React Query        | API responses, cached data            |
| UI state      | Component useState | Form inputs, modal visibility         |
| Derived state | useMemo            | Computed values                       |

## Data Flow Patterns

### Unidirectional Data Flow

```
User Action → Event Handler → State Update → Re-render
```

### API Integration Flow

```
Component → API Client Function (utils/ai.ts) → Fetch API → Response → State Update → UI Update
```

### Context Propagation

```
Provider (Feature Root) → Context → Consumer Hook → Component
```

## Routing Architecture

### React Router v6

- **Location**: Routes defined in `src/app/pages/`
- **Pattern**: File-based organization by route
- **Navigation**: Use `react-router-dom` hooks (`useNavigate`, `useParams`)

## Styling Architecture

### Vanilla Extract CSS-in-TS

- **Type-Safe Styles**: Compile-time type checking
- **Zero Runtime**: Styles extracted at build time
- **Theme Integration**: Use Folds design tokens

### Styling Patterns

#### 1. Recipe Pattern (Variants)

```typescript
// Component.css.ts
import { recipe } from '@vanilla-extract/recipes';
import { config, color } from 'folds';

export const Button = recipe({
  base: {
    padding: config.space.S300,
    borderRadius: config.radii.R400,
  },
  variants: {
    variant: {
      primary: { backgroundColor: color.Primary.Container },
      secondary: { backgroundColor: color.Secondary.Container },
    },
    size: {
      small: { padding: config.space.S200 },
      large: { padding: config.space.S400 },
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: 'small',
  },
});
```

#### 2. Style Function

```typescript
import { style } from '@vanilla-extract/css';

export const Container = style({
  display: 'flex',
  flexDirection: 'column',
  gap: config.space.S300,
});
```

#### 3. Inline Styles (for one-offs)

```tsx
<Box style={{ padding: '10px', background: 'red' }}>Content</Box>
```

### Folds Component Usage

- **Prefer Folds components** over custom HTML elements
- **Use Folds design tokens** for consistent spacing, colors, borders
- **Common components**: `Box`, `Text`, `Button`, `Spinner`, `IconButton`, `Scroll`, `Modal`

## Feature Module Pattern

### Structure

```
features/ai-assistant/
├── AIAssistantContext.tsx       # Feature state provider
├── dashboard/                   # Sub-feature: dashboard
│   ├── desktop-ui/
│   │   └── AIAssistant.tsx
│   └── mobile-ui/
├── gen-response/                # Sub-feature: response generation
│   ├── GenerateResponseButton.tsx
│   ├── GeneratedResponseBox.tsx
│   ├── persona-selector/
│   │   └── PersonaSelector.tsx
│   └── tone-selector/
│       └── ToneSelector.tsx
├── utils/                       # Feature utilities
│   ├── ai.ts                    # API client
│   └── utils.ts
└── assets/                      # Feature assets
    └── gen-response.svg
```

### Feature Principles

1. **Self-Contained**: Feature has everything it needs (components, state, utils)
2. **Clear Entry Point**: Export main components and hooks from feature root
3. **Internal Organization**: Sub-directories for sub-features
4. **Shared State**: Context provider at feature root
5. **Co-located Assets**: Icons, images specific to feature stored in `assets/`

## Hooks Architecture

### Custom Hook Patterns

- **Prefix with `use`**: `useAIAssistant()`, `useRoomEditor()`
- **Return stable references**: Use `useCallback` for functions
- **Co-locate with features** or place in `src/app/hooks/` if shared

### Common Hooks

- `useMatrixClient()` - Access Matrix SDK client
- `useRoom()` - Access current room
- `useSetSetting()` - Update settings atom
- `useAIAssistant()` - Access AI Assistant state

## Performance Optimization

### Memoization

- **useMemo**: Expensive calculations
- **useCallback**: Event handlers passed as props
- **React.memo**: Pure components (use sparingly)

### Code Splitting

- Use `React.lazy()` for large features/routes
- Lazy load heavy dependencies (PDF viewer, etc.)

### Virtualization

- Use `@tanstack/react-virtual` for long lists
- Example: Message timeline, member lists

## Error Handling

### Error Boundaries

- Use `react-error-boundary` library
- Wrap feature modules in error boundaries
- Display user-friendly error messages

### API Error Handling

- Try-catch blocks for async operations
- Display error state in UI
- Log errors to console for debugging

## Accessibility

- Use semantic HTML elements via Folds components
- Provide ARIA labels where necessary
- Ensure keyboard navigation
- Focus management for modals and drawers

## Integration with Matrix SDK

- **Client Initialization**: `src/client/initMatrix.ts`
- **SDK Access**: Via custom hooks (`useMatrixClient`, `useRoom`)
- **Event Handling**: Matrix events propagate through context/state
- **E2E Encryption**: Handled by Matrix SDK (WASM crypto)

## Build and Development

### Hot Module Replacement (HMR)

- Vite provides fast HMR
- State preserved across updates

### Development Server

- Port: 5173
- Proxy configuration: None (direct API calls)

### Type Checking

- Strict TypeScript mode enabled
- Run `yarn typecheck` for validation
