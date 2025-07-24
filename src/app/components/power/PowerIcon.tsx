import React from 'react';
import * as css from './style.css';
import { JUMBO_EMOJI_REG } from '../../utils/regex';

type PowerIconProps = css.PowerIconVariants & {
  iconSrc: string;
  name?: string;
};
export function PowerIcon({ size, iconSrc, name }: PowerIconProps) {
  return JUMBO_EMOJI_REG.test(iconSrc) ? (
    <span className={css.PowerIcon({ size })}>{iconSrc}</span>
  ) : (
    <img className={css.PowerIcon({ size })} src={iconSrc} alt={name} />
  );
}
