# Testing Strategy

## Current Testing State

**Note**: The project currently has minimal automated testing infrastructure. This document defines the testing strategy for new development.

## Testing Philosophy

- Write tests for business-critical functionality
- Focus on integration tests over unit tests for UI components
- Test user-facing behavior, not implementation details
- Maintain fast test execution

## Test Organization

### Test File Location

- **Co-located with source**: Place test files next to the code they test
  ```
  src/app/features/ai-assistant/
  ├── utils/
  │   ├── ai.ts
  │   └── ai.test.ts          # Test file next to implementation
  ```

### Test File Naming

- Use `.test.ts` or `.test.tsx` suffix
- Match the source file name: `ai.ts` → `ai.test.ts`

## Testing Scope

### What to Test

#### API Client Functions

Test all API integration functions:

- Request payload construction
- Response parsing
- Error handling
- Edge cases (empty payloads, null values)

**Example: Testing `generateResponseFromMessage()`**

```typescript
// ai.test.ts
import { describe, it, expect, vi } from 'vitest';
import { generateResponseFromMessage } from './ai';

describe('generateResponseFromMessage', () => {
  it('should call the correct endpoint with proper payload', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ text: 'Generated response' }),
    });

    const result = await generateResponseFromMessage({
      message: 'Test message',
      context: [],
      spec: { tone: 'friendly' },
    });

    expect(fetch).toHaveBeenCalledWith(
      'https://pwai.vercel.app/api/generate-response',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    );
    expect(result).toBe('Generated response');
  });

  it('should handle empty payload gracefully', async () => {
    // Test with all optional fields omitted
  });

  it('should handle API errors', async () => {
    // Test error response handling
  });
});
```

#### Utility Functions

- Test pure functions with various inputs
- Test edge cases and error conditions
- Test data transformations

#### State Management

- Test Jotai atoms with expected state transitions
- Test derived atoms compute correctly
- Test context providers supply correct values

### What NOT to Test (Initially)

- UI component rendering (visual tests deferred)
- Matrix SDK integration (external library)
- Electron main process (platform-specific)
- Third-party library behavior

## Testing Tools

### Test Framework

- **Not yet configured** - Recommended: Vitest (Vite-native test runner)
- Alternative: Jest with ts-jest

### Mocking

- Mock `fetch` for API tests
- Mock external dependencies
- Use `vi.fn()` or `jest.fn()` for function mocks

### Test Utilities

- **For React components** (when implemented): @testing-library/react
- **For hooks** (when implemented): @testing-library/react-hooks

## Test Execution

### Running Tests

```bash
# Run all tests (when configured)
yarn test

# Run tests in watch mode
yarn test:watch

# Run tests with coverage
yarn test:coverage
```

### CI Integration

- Tests should run on every pull request
- Block merges if tests fail
- Generate coverage reports

## Testing Requirements for Story 1.1

For the AI backend integration story, the following MUST be tested:

1. **API Client Function** (`generateResponseFromMessage`):

   - Sends POST request to correct endpoint
   - Includes proper headers
   - Serializes payload correctly
   - Handles successful response
   - Handles error response
   - Handles network errors

2. **Edge Cases**:

   - Empty message
   - Empty context array
   - Empty spec object
   - All fields optional/omitted

3. **Type Safety**:
   - Ensure TypeScript types match API contract
   - Test that response is properly typed

## Coverage Goals

- **API Functions**: 90%+ coverage
- **Utilities**: 80%+ coverage
- **Components**: Deferred (future story)

## Test Data

### Sample Message Type

```typescript
export const mockMessage: Message = {
  sender: '@user:matrix.org',
  text: 'Hello, how are you?',
  timestamp: '2025-01-01T00:00:00Z',
  is_from_me: false,
};

export const mockContext: Message[] = [
  mockMessage,
  {
    sender: '@me:matrix.org',
    text: 'I am fine, thanks!',
    timestamp: '2025-01-01T00:01:00Z',
    is_from_me: true,
  },
];
```

## Best Practices

1. **Arrange-Act-Assert Pattern**:

   ```typescript
   it('should do something', () => {
     // Arrange: Set up test data
     const input = { message: 'test' };

     // Act: Execute the code
     const result = doSomething(input);

     // Assert: Verify the result
     expect(result).toBe(expected);
   });
   ```

2. **Test Isolation**: Each test should be independent
3. **Clear Test Names**: Describe what is being tested and expected outcome
4. **Mock External Dependencies**: Don't make real API calls in tests
5. **Fast Execution**: Keep tests fast (< 1s per test file)

## Future Testing Enhancements

- Visual regression testing (Chromatic/Percy)
- E2E testing (Playwright/Cypress)
- Performance testing
- Accessibility testing
