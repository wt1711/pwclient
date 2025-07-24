import { style } from '@vanilla-extract/css';
import { color, config, DefaultReset, toRem } from 'folds';

export const ImagePackImage = style([
  DefaultReset,
  {
    width: toRem(36),
    height: toRem(36),
    objectFit: 'contain',
  },
]);

export const DeleteImageShortcode = style([
  DefaultReset,
  {
    color: color.Critical.Main,
    textDecoration: 'line-through',
  },
]);

export const ImagePackImageInputs = style([
  DefaultReset,
  {
    overflow: 'hidden',
    borderRadius: config.radii.R300,
  },
]);

export const UnsavedMenu = style({
  position: 'sticky',
  padding: config.space.S200,
  paddingLeft: config.space.S400,
  top: config.space.S400,
  left: config.space.S400,
  right: 0,
  zIndex: 1,
});
