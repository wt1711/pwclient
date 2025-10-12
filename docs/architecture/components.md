# Components

## Component Library: Folds

Pocket Wingman uses **Folds v2.2.0** as its primary component library and design system.

## Core Folds Components

### Layout Components

#### Box

The fundamental layout component. Used for structure and spacing.

```typescript
import { Box } from 'folds';

<Box direction="Column" gap="300" alignItems="Center">
  <Text>Content</Text>
</Box>;
```

**Props:**

- `direction`: `'Row' | 'Column'` - Flex direction
- `gap`: `'100' | '200' | '300' | '400' | '500'` - Spacing between children
- `alignItems`: `'Start' | 'Center' | 'End' | 'Stretch'`
- `justifyContent`: `'Start' | 'Center' | 'End' | 'SpaceBetween'`
- `style`: Inline styles object
- `grow`: Flex grow
- `shrink`: Flex shrink

### Typography

#### Text

Typography component with design system integration.

```typescript
import { Text } from 'folds';

<Text size="T400" priority="400">
  Hello World
</Text>;
```

**Props:**

- `size`: `'T100' | 'T200' | 'T300' | 'T400' | 'T500' | 'T600'` - Font size scale
- `priority`: `'100' | '200' | '300' | '400' | '500'` - Font weight
- `truncate`: Boolean - Enable text truncation
- `as`: HTML element type (`'p' | 'span' | 'div' | 'h1'`, etc.)

### Interactive Components

#### Button

Standard button component.

```typescript
import { Button } from 'folds';

<Button variant="Primary" size="400" onClick={handleClick}>
  Click Me
</Button>;
```

**Props:**

- `variant`: `'Primary' | 'Secondary' | 'Critical' | 'Success' | 'Surface' | 'SurfaceVariant'`
- `size`: `'300' | '400' | '500'`
- `outlined`: Boolean - Outlined style
- `fill`: `'Soft' | 'None'` - Fill style
- `radii`: `'300' | '400' | 'Pill'` - Border radius
- `onClick`: Click handler
- `disabled`: Boolean

#### IconButton

Button with icon content.

```typescript
import { IconButton } from 'folds';

<IconButton variant="SurfaceVariant" size="300" radii="300" onClick={handleClick}>
  <Icon />
</IconButton>;
```

**Props:** Similar to Button, but optimized for icon-only content

### Feedback Components

#### Spinner

Loading spinner component.

```typescript
import { Spinner } from 'folds';

<Spinner size="300" variant="Primary" />;
```

**Props:**

- `size`: `'100' | '200' | '300' | '400' | '500'`
- `variant`: Color variant

#### Modal

Modal/dialog component.

```typescript
import { Modal } from 'folds';

<Modal open={isOpen} onOpenChange={setIsOpen}>
  <Modal.Content>
    <Modal.Header>Title</Modal.Header>
    <Modal.Description>Content</Modal.Description>
  </Modal.Content>
</Modal>;
```

### Utility Components

#### Scroll

Scrollable container with custom scrollbar styling.

```typescript
import { Scroll } from 'folds';

<Scroll size="300" variant="Primary">
  <Content />
</Scroll>;
```

## Design Tokens (from Folds)

### Spacing

```typescript
import { config } from 'folds';

// Use in Vanilla Extract
padding: config.space.S100; // Smallest
padding: config.space.S200;
padding: config.space.S300; // Default
padding: config.space.S400;
padding: config.space.S500; // Largest
```

### Radii (Border Radius)

```typescript
borderRadius: config.radii.R300; // Small
borderRadius: config.radii.R400; // Default
borderRadius: config.radii.R500; // Large
borderRadius: config.radii.Pill; // Fully rounded
```

### Colors

```typescript
import { color } from 'folds';

// Color scale by variant
color.Primary.Container; // Background color
color.Primary.OnContainer; // Text color
color.Primary.ContainerLine; // Border color

// Available variants:
// - Primary
// - Secondary
// - Success
// - Critical
// - Warning
// - Surface
// - SurfaceVariant
// - Background
```

### Border Width

```typescript
borderWidth: config.borderWidth.B300; // Standard border
```

## Custom Components

### Application-Specific Components

#### AI Assistant Components

##### GenerateResponseButton

Trigger button for response generation.

**Location**: `src/app/features/ai-assistant/gen-response/GenerateResponseButton.tsx`

```typescript
import { GenerateResponseButton } from '~/app/features/ai-assistant/gen-response/GenerateResponseButton';

<GenerateResponseButton />;
```

**Behavior:**

- Shows different icons based on state: idle, loading, active
- Uses `Spinner` during generation
- Integrated with `AIAssistantContext`

##### GeneratedResponseBox

Container for response generation controls.

**Location**: `src/app/features/ai-assistant/gen-response/GeneratedResponseBox.tsx`

```typescript
import { GeneratedResponseBox } from '~/app/features/ai-assistant/gen-response/GeneratedResponseBox';

<GeneratedResponseBox />;
```

**Features:**

- Persona selector
- Tone sliders
- Integrated with `AIAssistantContext`

##### PersonaSelector

Select AI response persona.

**Location**: `src/app/features/ai-assistant/gen-response/persona-selector/PersonaSelector.tsx`

##### ToneSelector

Select tone properties for response.

**Location**: `src/app/features/ai-assistant/gen-response/tone-selector/ToneSelector.tsx`

##### Slider

Adjust tone property values.

**Location**: `src/app/features/ai-assistant/gen-response/tone-slider/Slider.tsx`

## Component Composition Patterns

### Container-Presenter Pattern

- **Container**: Handles state and logic, uses hooks
- **Presenter**: Pure rendering component, receives props

### Compound Components

Use Folds compound component pattern (e.g., Modal):

```typescript
<Modal>
  <Modal.Content>
    <Modal.Header />
    <Modal.Description />
  </Modal.Content>
</Modal>
```

### Render Props (Minimal Use)

Prefer hooks over render props for logic sharing.

## Styling Components

### Vanilla Extract Integration

```typescript
// Component.css.ts
import { recipe } from '@vanilla-extract/recipes';
import { config, color } from 'folds';

export const MyComponent = recipe({
  base: {
    padding: config.space.S300,
    backgroundColor: color.Surface.Container,
  },
  variants: {
    highlighted: {
      true: {
        borderColor: color.Primary.ContainerLine,
      },
    },
  },
});

// Component.tsx
import * as css from './Component.css';

<Box className={css.MyComponent({ highlighted: true })}>Content</Box>;
```

### Inline Styles with Folds

For one-off or dynamic styles:

```typescript
<Box
  style={{
    padding: '10px',
    background: 'rgba(255, 255, 255, 0.10)',
    backdropFilter: 'blur(50px)',
  }}
>
  Content
</Box>
```

## Icon Usage

### SVG Icons

- **Location**: `public/res/ic/outlined/` and `public/res/ic/filled/`
- **Usage**: Import as images or inline SVG components

```typescript
import GenResponseIcon from '~/app/features/ai-assistant/assets/gen-response.svg';

<img src={GenResponseIcon} alt="Generate Response" height={30} />;
```

## Component Testing

### Unit Testing Components

```typescript
import { render, screen } from '@testing-library/react';
import { GenerateResponseButton } from './GenerateResponseButton';

it('renders button', () => {
  render(<GenerateResponseButton />);
  expect(screen.getByRole('button')).toBeInTheDocument();
});
```

## Accessibility Guidelines

- Use Folds semantic components (they have built-in accessibility)
- Provide `alt` text for images
- Ensure buttons have accessible labels
- Use ARIA attributes when necessary
- Test keyboard navigation

## Performance Best Practices

- Use `React.memo` for expensive pure components
- Avoid inline function definitions in render (use `useCallback`)
- Use `useMemo` for expensive computations
- Lazy load heavy components with `React.lazy()`
