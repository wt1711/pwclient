import { as, ContainerColor as TContainerColor } from 'folds';
import React from 'react';
import classNames from 'classnames';
import { ContainerColor } from '../../styles/ContainerColor.css';
import * as css from './CutoutCard.css';

export const CutoutCard = as<'div', { variant?: TContainerColor }>(
  ({ as: AsCutoutCard = 'div', className, variant = 'Surface', ...props }, ref) => (
    <AsCutoutCard
      className={classNames(ContainerColor({ variant }), css.CutoutCard, className)}
      {...props}
      ref={ref}
    />
  )
);
