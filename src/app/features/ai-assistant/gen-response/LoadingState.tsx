import React from 'react';
import { Box, Spinner } from 'folds';

export function LoadingState() {
  return (
    <Box
      alignItems="Center"
      justifyContent="Center"
      className="loadingState"
      style={{ height: '300px' }}
    >
      <Spinner size="600" />
    </Box>
  );
}
