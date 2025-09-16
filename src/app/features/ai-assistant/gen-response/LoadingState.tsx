import React from 'react';
import { Box, Spinner } from 'folds';
import './LoadingState.scss';

export function LoadingState() {
  return (
    <Box alignItems="Center" justifyContent="Center" className="loadingState">
      <Spinner size="200" />
    </Box>
  );
}
