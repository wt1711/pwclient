import { useEffect, useMemo } from 'react';

export const useObjectURL = (object?: Blob): string | undefined => {
  const url = useMemo(() => {
    if (object) return URL.createObjectURL(object);
    return undefined;
  }, [object]);

  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url);
    },
    [url]
  );

  return url;
};
