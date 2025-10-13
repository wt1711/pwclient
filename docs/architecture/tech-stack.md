# Tech Stack

## Overview

Pocket Wingman is built as a cross-platform desktop and web application using modern web technologies.

## Core Technologies

### Frontend Framework

- **React 18.2.0** - UI framework
- **TypeScript 4.9.4** - Type-safe JavaScript
- **Vite 5.4.19** - Build tool and dev server

### Desktop Platform

- **Electron 37.2.4** - Cross-platform desktop application framework
- **electron-builder 26.0.12** - Application packaging and distribution

### State Management

- **Jotai 2.6.0** - Atomic state management library
  - Primary state management solution
  - Used throughout the application for global and local state
  - Atoms are defined co-located with features

### Styling

- **Vanilla Extract** (@vanilla-extract/css 1.9.3) - Zero-runtime CSS-in-TypeScript
  - All component styles use Vanilla Extract
  - Recipe pattern for variant styling
  - Theme integration via Folds design system

### UI Component Library

- **Folds 2.2.0** - Custom design system and component library
  - Provides base components (Box, Text, Button, etc.)
  - Design tokens (colors, spacing, radii)
  - Typography system

### Rich Text Editing

- **Slate 0.112.0** - Customizable rich text editor framework
  - slate-react 0.112.1
  - slate-history 0.110.3
  - slate-dom 0.112.2

### Communication Protocol

- **matrix-js-sdk 37.5.0** - Matrix protocol client SDK
- **@matrix-org/matrix-sdk-crypto-wasm** - E2E encryption (WASM)

### Routing

- **react-router-dom 6.20.0** - Client-side routing

### HTTP Client

- **Native Fetch API** - All HTTP requests use the standard Fetch API
- No additional HTTP client library (axios, etc.)

### Form Management

- **Formik 2.4.6** - Form state and validation

### Data Fetching

- **@tanstack/react-query 5.24.1** - Async state management and caching
- **@tanstack/react-query-devtools 5.24.1** - Development tools

### Utilities

- **dayjs 1.11.10** - Date/time manipulation
- **immer 9.0.16** - Immutable state updates
- **classnames 2.3.2** - Conditional CSS class composition
- **await-to-js 3.0.0** - Error handling pattern

### Development Tools

- **ESLint 8.29.0** - Linting
- **Prettier 2.8.1** - Code formatting
- **@typescript-eslint** - TypeScript-specific linting rules

## Module System

- **Type**: ES Modules (ESM)
- **Module Resolution**: Node
- **Path Aliases**:
  - `~/*` maps to `src/*`
  - Configured in tsconfig.json and vite.config.js

## Build Output

- **Web Build**: `dist-react/` - Production web application
- **Electron Build**: `dist-electron/` - Compiled Electron main process code
- **Source Maps**: Enabled for debugging

## Browser/Platform Support

- **Desktop**: macOS (ARM64), Windows (x64), Linux (x64)
- **Web**: Modern browsers with ES2015+ support
- **Node.js**: >=16.0.0

## Package Manager

- **Yarn** - Package manager (lockfile: yarn.lock)
