import React, { ReactNode } from 'react';
import { Box, Text, Scroll } from 'folds';
import { CutoutCard } from '../cutout-card';
import * as css from './styles.css';

export function PickerColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box direction="Column" gap="100">
      <Text className={css.PickerColumnLabel} size="L400">
        {title}
      </Text>
      <Box grow="Yes">
        <CutoutCard variant="Background">
          <Scroll variant="Background" size="300" hideTrack>
            <Box className={css.PickerColumnContent} direction="Column" gap="100">
              {children}
            </Box>
          </Scroll>
        </CutoutCard>
      </Box>
    </Box>
  );
}
