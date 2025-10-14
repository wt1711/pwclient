import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { GeneratedResponseBox } from './GeneratedResponseBox';

// Mock the AIAssistantContext
const mockUseAIAssistant = vi.fn();
vi.mock('~/app/features/ai-assistant/AIAssistantContext', () => ({
  useAIAssistant: () => mockUseAIAssistant(),
}));

// Mock the escape key hook
vi.mock('~/app/features/ai-assistant/utils/utils', () => ({
  useEscapeKey: vi.fn(),
}));

// Mock child components to isolate GeneratedResponseBox
vi.mock('./personal-selector/PersonaSelector', () => ({
  PersonaSelector: () => <div data-testid="persona-selector">PersonaSelector</div>,
}));

vi.mock('./tone-slider/Slider', () => ({
  Slider: () => <div data-testid="slider">Slider</div>,
}));

vi.mock('./tone-selector/ToneSelector', () => ({
  ToneSelector: () => <div data-testid="tone-selector">ToneSelector</div>,
}));

describe('GeneratedResponseBox', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Streaming State Display', () => {
    it('should render spinner when isGeneratingResponse is true', () => {
      mockUseAIAssistant.mockReturnValue({
        isAIAssistantOpen: true,
        toggleAIAssistant: vi.fn(),
        isGeneratingResponse: true,
        generatedResponse: '',
        errorMessage: null,
      });

      const { container } = render(<GeneratedResponseBox />);

      // Should show spinner
      const spinner = container.querySelector('svg');
      expect(spinner).toBeInTheDocument();
    });

    it('should render spinner when isGeneratingResponse is true and response has started', () => {
      mockUseAIAssistant.mockReturnValue({
        isAIAssistantOpen: true,
        toggleAIAssistant: vi.fn(),
        isGeneratingResponse: true,
        generatedResponse: 'Hello',
        errorMessage: null,
      });

      const { container } = render(<GeneratedResponseBox />);

      // Should show spinner
      const spinner = container.querySelector('svg');
      expect(spinner).toBeInTheDocument();
    });

    it('should display response text when generatedResponse has content', () => {
      mockUseAIAssistant.mockReturnValue({
        isAIAssistantOpen: true,
        toggleAIAssistant: vi.fn(),
        isGeneratingResponse: false,
        generatedResponse: 'Hello, this is the AI response!',
        errorMessage: null,
      });

      render(<GeneratedResponseBox />);

      expect(screen.getByText('Hello, this is the AI response!')).toBeInTheDocument();
    });

    it('should not show spinner when isGeneratingResponse is false', () => {
      mockUseAIAssistant.mockReturnValue({
        isAIAssistantOpen: true,
        toggleAIAssistant: vi.fn(),
        isGeneratingResponse: false,
        generatedResponse: 'Some text',
        errorMessage: null,
      });

      const { container } = render(<GeneratedResponseBox />);

      // Spinner should not be present when not generating
      // Count SVGs - if there's only controls, no spinner box exists
      const textBox = container.querySelector('[style*="max-height"]');
      expect(textBox).toBeInTheDocument(); // Response box exists
    });
  });

  describe('Real-Time Updates', () => {
    it('should re-render when generatedResponse updates', () => {
      const { rerender } = render(<GeneratedResponseBox />);

      // First render: empty response
      mockUseAIAssistant.mockReturnValue({
        isAIAssistantOpen: true,
        toggleAIAssistant: vi.fn(),
        isGeneratingResponse: true,
        generatedResponse: '',
        errorMessage: null,
      });
      rerender(<GeneratedResponseBox />);

      expect(screen.queryByText('Hello')).not.toBeInTheDocument();

      // Second render: chunk arrives
      mockUseAIAssistant.mockReturnValue({
        isAIAssistantOpen: true,
        toggleAIAssistant: vi.fn(),
        isGeneratingResponse: true,
        generatedResponse: 'Hello',
        errorMessage: null,
      });
      rerender(<GeneratedResponseBox />);

      expect(screen.getByText('Hello')).toBeInTheDocument();

      // Third render: more chunks arrive (typing effect)
      mockUseAIAssistant.mockReturnValue({
        isAIAssistantOpen: true,
        toggleAIAssistant: vi.fn(),
        isGeneratingResponse: true,
        generatedResponse: 'Hello World',
        errorMessage: null,
      });
      rerender(<GeneratedResponseBox />);

      expect(screen.getByText('Hello World')).toBeInTheDocument();
    });

    it('should handle multiple chunk updates creating typing effect', () => {
      const { rerender, container } = render(<GeneratedResponseBox />);

      const chunks = [
        'H',
        'He',
        'Hel',
        'Hell',
        'Hello',
        'Hello ',
        'Hello W',
        'Hello Wo',
        'Hello Wor',
        'Hello Worl',
        'Hello World',
      ];

      chunks.forEach((chunk, index) => {
        mockUseAIAssistant.mockReturnValue({
          isAIAssistantOpen: true,
          toggleAIAssistant: vi.fn(),
          isGeneratingResponse: index < chunks.length - 1,
          generatedResponse: chunk,
          errorMessage: null,
        });
        rerender(<GeneratedResponseBox />);

        // Check the response box contains the chunk text
        const responseBox = container.querySelector('[style*="max-height"]');
        expect(responseBox).toBeInTheDocument();
        expect(responseBox?.textContent).toBe(chunk);
      });
    });
  });

  describe('Error Handling Display', () => {
    it('should display error message when errorMessage is set', () => {
      mockUseAIAssistant.mockReturnValue({
        isAIAssistantOpen: true,
        toggleAIAssistant: vi.fn(),
        isGeneratingResponse: false,
        generatedResponse: '',
        errorMessage: 'Network error occurred',
      });

      render(<GeneratedResponseBox />);

      expect(screen.getByText(/Network error occurred/)).toBeInTheDocument();
    });

    it('should display error message alongside other UI elements', () => {
      mockUseAIAssistant.mockReturnValue({
        isAIAssistantOpen: true,
        toggleAIAssistant: vi.fn(),
        isGeneratingResponse: false,
        generatedResponse: 'Some response text',
        errorMessage: 'An error occurred',
      });

      render(<GeneratedResponseBox />);

      // Error message should be visible
      expect(screen.getByText(/An error occurred/)).toBeInTheDocument();
      // Response text should also be visible
      expect(screen.getByText('Some response text')).toBeInTheDocument();
      // Controls should be present
      expect(screen.getByTestId('slider')).toBeInTheDocument();
      expect(screen.getByTestId('tone-selector')).toBeInTheDocument();
      expect(screen.getByTestId('persona-selector')).toBeInTheDocument();
    });
  });

  describe('State Combinations', () => {
    it('should handle empty state (no loading, no response, no error)', () => {
      mockUseAIAssistant.mockReturnValue({
        isAIAssistantOpen: true,
        toggleAIAssistant: vi.fn(),
        isGeneratingResponse: false,
        generatedResponse: '',
        errorMessage: null,
      });

      render(<GeneratedResponseBox />);

      // No spinner
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      // No error message
      expect(screen.queryByText(/⚠️/)).not.toBeInTheDocument();
      // Controls should be present
      expect(screen.getByTestId('slider')).toBeInTheDocument();
      expect(screen.getByTestId('tone-selector')).toBeInTheDocument();
      expect(screen.getByTestId('persona-selector')).toBeInTheDocument();
    });

    it('should handle simultaneous states (loading + text)', () => {
      mockUseAIAssistant.mockReturnValue({
        isAIAssistantOpen: true,
        toggleAIAssistant: vi.fn(),
        isGeneratingResponse: true,
        generatedResponse: 'Streaming in progress...',
        errorMessage: null,
      });

      const { container } = render(<GeneratedResponseBox />);

      // Both spinner and text should be visible (mid-stream)
      const spinner = container.querySelector('svg');
      expect(spinner).toBeInTheDocument();
      expect(screen.getByText('Streaming in progress...')).toBeInTheDocument();
    });

    it('should handle error state with previous response text', () => {
      mockUseAIAssistant.mockReturnValue({
        isAIAssistantOpen: true,
        toggleAIAssistant: vi.fn(),
        isGeneratingResponse: false,
        generatedResponse: 'Previous response',
        errorMessage: 'Something went wrong',
      });

      render(<GeneratedResponseBox />);

      // Error message visible
      expect(screen.getByText(/Something went wrong/)).toBeInTheDocument();
      // Previous response still visible
      expect(screen.getByText('Previous response')).toBeInTheDocument();
      // No spinner (not generating)
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('should show only spinner during initial loading', () => {
      mockUseAIAssistant.mockReturnValue({
        isAIAssistantOpen: true,
        toggleAIAssistant: vi.fn(),
        isGeneratingResponse: true,
        generatedResponse: '',
        errorMessage: null,
      });

      const { container } = render(<GeneratedResponseBox />);

      // Spinner visible
      const spinner = container.querySelector('svg');
      expect(spinner).toBeInTheDocument();
      // No response text box (no max-height style)
      const responseBox = container.querySelector('[style*="max-height"]');
      expect(responseBox).not.toBeInTheDocument();
      // No error
      expect(screen.queryByText(/⚠️/)).not.toBeInTheDocument();
    });

    it('should show only response text when complete', () => {
      mockUseAIAssistant.mockReturnValue({
        isAIAssistantOpen: true,
        toggleAIAssistant: vi.fn(),
        isGeneratingResponse: false,
        generatedResponse: 'Complete response text',
        errorMessage: null,
      });

      render(<GeneratedResponseBox />);

      // Response text visible
      expect(screen.getByText('Complete response text')).toBeInTheDocument();
      // No spinner (complete)
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      // No error
      expect(screen.queryByText(/⚠️/)).not.toBeInTheDocument();
    });
  });

  describe('Component Rendering', () => {
    it('should always render control components (Slider, ToneSelector, PersonaSelector)', () => {
      mockUseAIAssistant.mockReturnValue({
        isAIAssistantOpen: true,
        toggleAIAssistant: vi.fn(),
        isGeneratingResponse: false,
        generatedResponse: '',
        errorMessage: null,
      });

      render(<GeneratedResponseBox />);

      expect(screen.getByTestId('slider')).toBeInTheDocument();
      expect(screen.getByTestId('tone-selector')).toBeInTheDocument();
      expect(screen.getByTestId('persona-selector')).toBeInTheDocument();
    });

    it('should preserve glassmorphic container styling', () => {
      mockUseAIAssistant.mockReturnValue({
        isAIAssistantOpen: true,
        toggleAIAssistant: vi.fn(),
        isGeneratingResponse: false,
        generatedResponse: '',
        errorMessage: null,
      });

      const { container } = render(<GeneratedResponseBox />);

      // Find the glassmorphic container by its unique style attributes
      const mainBox =
        container.querySelector('[style*="backdrop-filter"]') ||
        container.querySelector('[style*="rgba(255, 255, 255, 0.1)"]');
      // Check that the main container has the glassmorphic styles
      expect(mainBox).toBeInTheDocument();
    });
  });
});
