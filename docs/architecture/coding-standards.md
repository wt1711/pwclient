# Coding Standards

## Language and Type Safety

### TypeScript Usage

- **All new code MUST be TypeScript** (`.ts` or `.tsx`)
- Enable strict mode (configured in `tsconfig.json`)
- Avoid `any` type; use `unknown` for truly unknown types
- Define interfaces for component props and function parameters

### Type Definitions

```typescript
// Component Props
interface GeneratedResponseBoxProps {
  message?: string;
  onClose?: () => void;
}

// API Response Types
type GenerateResponsePayload = {
  message?: string;
  context?: Message[];
  spec?: object;
};

type GenerateResponseResult = {
  text: string;
};
```

## Component Standards

### React Component Structure

```typescript
// 1. Imports
import React from 'react';
import { Box } from 'folds';
import { useAIAssistant } from '~/app/features/ai-assistant/AIAssistantContext';

// 2. Type Definitions
interface MyComponentProps {
  title: string;
  onAction?: () => void;
}

// 3. Component Definition
export function MyComponent({ title, onAction }: MyComponentProps) {
  // 4. Hooks (top level)
  const { state } = useAIAssistant();

  // 5. Event Handlers
  const handleClick = () => {
    onAction?.();
  };

  // 6. Render
  return <Box>{title}</Box>;
}
```

### Component Naming

- **Function Components**: Use named exports with PascalCase
  ```typescript
  export function GeneratedResponseBox() {}
  ```
- **Avoid default exports** for components (prefer named exports)

### Hook Usage

- Always call hooks at the top level
- Use meaningful hook names: `useAIAssistant()`, `useRoomEditor()`
- Custom hooks MUST start with `use`

## State Management

### Jotai Atoms

```typescript
// Define atoms in feature directory or src/app/state/
import { atom } from 'jotai';

// Atom naming: descriptive and suffixed with Atom
export const isGeneratingResponseAtom = atom(false);
export const generatedResponseAtom = atom('');

// Derived atoms
export const hasResponseAtom = atom((get) => get(generatedResponseAtom).length > 0);
```

### Context Pattern

- Use React Context for feature-level state
- Combine with Jotai for complex state management
- Provide custom hooks for context access
  ```typescript
  export function useAIAssistant() {
    const context = useContext(AIAssistantContext);
    if (!context) throw new Error('useAIAssistant must be used within AIAssistantProvider');
    return context;
  }
  ```

## Styling Standards

### Vanilla Extract

```typescript
// Component.css.ts
import { style } from '@vanilla-extract/css';
import { recipe } from '@vanilla-extract/recipes';
import { config, color } from 'folds';

// Use recipe for variants
export const MyComponent = recipe({
  base: {
    padding: config.space.S300,
    borderRadius: config.radii.R400,
  },
  variants: {
    variant: {
      primary: {
        backgroundColor: color.Primary.Container,
      },
      secondary: {
        backgroundColor: color.Secondary.Container,
      },
    },
  },
});

// Apply in component
import * as css from './Component.css';
<div className={css.MyComponent({ variant: 'primary' })} />;
```

### Folds Design System

- **Use Folds components** as building blocks: `Box`, `Text`, `Button`, `Spinner`
- **Use Folds design tokens**: `config.space.*`, `config.radii.*`, `color.*`
- **Inline styles**: Acceptable for one-off styles, but prefer Vanilla Extract for reusable patterns

## API Integration

### Fetch API Pattern

```typescript
export async function callAPI<T>(endpoint: string, payload: object): Promise<T> {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Request failed');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}
```

### Error Handling

- Use try-catch for async operations
- Provide user-friendly error messages
- Log errors to console for debugging
- Return error states to UI for display

## Code Quality

### Linting

- **ESLint**: Run `yarn check:eslint` before committing
- Follow Airbnb style guide (configured)
- Fix all linting errors

### Formatting

- **Prettier**: Run `yarn fix:prettier` to auto-format
- Configured for consistent formatting

### Type Checking

- Run `yarn typecheck` before committing
- Resolve all TypeScript errors

## File Organization

### Import Organization

```typescript
// 1. React
import React, { useState, useCallback } from 'react';

// 2. Third-party libraries
import { atom, useAtom } from 'jotai';
import { Box, Text } from 'folds';

// 3. Absolute imports from app
import { useAIAssistant } from '~/app/features/ai-assistant/AIAssistantContext';
import { useRoomEditor } from '~/app/hooks/useRoomEditor';

// 4. Relative imports
import { PersonaSelector } from './personal-selector/PersonaSelector';
import * as css from './Component.css';

// 5. Types
import type { Message } from '~/app/features/ai-assistant/utils/ai';
```

### Export Organization

- Named exports preferred over default exports
- Group related exports together
- Export types alongside implementations when related

## Comments and Documentation

### When to Comment

- Complex business logic
- Non-obvious algorithms
- Workarounds or hacks (with explanation)
- Public API functions (JSDoc)

### JSDoc for Functions

```typescript
/**
 * Generates a response using the AI backend service.
 *
 * @param message - The message to generate a response for
 * @param context - Previous conversation context
 * @param spec - Response specification (tone, persona)
 * @returns The generated response text
 * @throws {Error} If the API request fails
 */
export async function generateResponseFromMessage({
  message,
  context,
  spec,
}: GenerateResponseParams): Promise<string> {
  // Implementation
}
```

## Performance Considerations

- Use `useCallback` for event handlers passed as props
- Use `useMemo` for expensive calculations
- Avoid unnecessary re-renders
- Code split large features using React.lazy() when appropriate

## Accessibility

- Use semantic HTML elements
- Provide ARIA labels where needed
- Ensure keyboard navigation works
- Test with screen readers when implementing interactive features
