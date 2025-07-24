import { ComplexStyleRule } from '@vanilla-extract/css';
import { recipe, RecipeVariants } from '@vanilla-extract/recipes';
import { ContainerColor, DefaultReset, color, config, toRem } from 'folds';

const getVariant = (variant: ContainerColor): ComplexStyleRule => ({
  backgroundColor: color[variant].Container,
});

export const LinePlaceholder = recipe({
  base: [
    DefaultReset,
    {
      width: '100%',
      height: toRem(16),
      borderRadius: config.radii.R300,
    },
  ],
  variants: {
    variant: {
      Background: getVariant('Background'),
      Surface: getVariant('Surface'),
      SurfaceVariant: getVariant('SurfaceVariant'),
      Primary: getVariant('Primary'),
      Secondary: getVariant('Secondary'),
      Success: getVariant('Success'),
      Warning: getVariant('Warning'),
      Critical: getVariant('Critical'),
    },
  },
  defaultVariants: {
    variant: 'SurfaceVariant',
  },
});

export type LinePlaceholderVariants = RecipeVariants<typeof LinePlaceholder>;
