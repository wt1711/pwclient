import React from 'react';

type SvgIconProps = {
  src: string;
  size: string;
};

export function SvgIcon({ src, size }: SvgIconProps) {
  return <img src={src} width={size} height={size} alt="icon" />;
}
