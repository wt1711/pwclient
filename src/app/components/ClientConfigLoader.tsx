import { ReactNode } from 'react';
import { ClientConfig } from '../hooks/useClientConfig';

const embeddedConfig: ClientConfig = {
  defaultHomeserver: 1,
  homeserverList: ['matrix.lvbrd.xyz'],
  allowCustomHomeservers: true,
  featuredCommunities: {
    openAsDefault: false,
    spaces: [],
    rooms: [],
    servers: ['matrix.lvbrd.xyz'],
  },
};

type ClientConfigLoaderProps = {
  children: (config: ClientConfig) => ReactNode;
};

export function ClientConfigLoader({ children }: ClientConfigLoaderProps) {
  return children(embeddedConfig);
}
