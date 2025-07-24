import { ValidatedAuthMetadata } from 'matrix-js-sdk';
import { createContext, useContext } from 'react';

const AuthMetadataContext = createContext<ValidatedAuthMetadata | undefined>(undefined);

export const AuthMetadataProvider = AuthMetadataContext.Provider;

export const useAuthMetadata = (): ValidatedAuthMetadata | undefined => {
  const metadata = useContext(AuthMetadataContext);

  return metadata;
};
