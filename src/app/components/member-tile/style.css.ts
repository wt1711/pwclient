import { style } from '@vanilla-extract/css';
import { color, config, DefaultReset, Disabled, FocusOutline } from 'folds';

export const MemberTile = style([
  DefaultReset,
  {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: config.space.S200,

    padding: config.space.S100,
    borderRadius: config.radii.R500,

    selectors: {
      'button&': {
        cursor: 'pointer',
      },
      '&[aria-pressed=true]': {
        backgroundColor: color.Surface.ContainerActive,
      },
      'button&:hover, &:focus-visible': {
        backgroundColor: color.Surface.ContainerHover,
      },
      'button&:active': {
        backgroundColor: color.Surface.ContainerActive,
      },
    },
  },
  FocusOutline,
  Disabled,
]);
