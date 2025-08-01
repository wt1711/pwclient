import React from 'react';
import { Box, Text, IconButton, Icon, Icons, Scroll, Button, config, toRem } from 'folds';
import { Page, PageContent, PageHeader } from '../../../components/page';
import { SequenceCard } from '../../../components/sequence-card';
import { SequenceCardStyle } from '../styles.css';
import { SettingTile } from '../../../components/setting-tile';
import PocketWingmanSVG from '../../../../../public/res/svg/pocket-wingman.svg';
import cons from '../../../../client/state/cons';
import { clearCacheAndReload } from '../../../../client/initMatrix';
import { useMatrixClient } from '../../../hooks/useMatrixClient';

type AboutProps = {
  requestClose: () => void;
};
export function About({ requestClose }: AboutProps) {
  const mx = useMatrixClient();

  return (
    <Page>
      <PageHeader outlined={false}>
        <Box grow="Yes" gap="200">
          <Box grow="Yes" alignItems="Center" gap="200">
            <Text size="H3" truncate>
              About
            </Text>
          </Box>
          <Box shrink="No">
            <IconButton onClick={requestClose} variant="Surface">
              <Icon src={Icons.Cross} />
            </IconButton>
          </Box>
        </Box>
      </PageHeader>
      <Box grow="Yes">
        <Scroll hideTrack visibility="Hover">
          <PageContent>
            <Box direction="Column" gap="700">
              <Box gap="400">
                <Box shrink="No">
                  <img
                    style={{ width: toRem(60), height: toRem(60) }}
                    src={PocketWingmanSVG}
                    alt="Pocket Wingman logo"
                  />
                </Box>
                <Box direction="Column" gap="300">
                  <Box direction="Column" gap="100">
                    <Box gap="100" alignItems="End">
                      <Text size="H3">Pocket Wingman</Text>
                      <Text size="T200">v{cons.version}</Text>
                    </Box>
                  </Box>

                  <Box gap="200" wrap="Wrap">
                    <Button
                      as="a"
                      href="https://github.com"
                      rel="noreferrer noopener"
                      target="_blank"
                      variant="Secondary"
                      fill="Soft"
                      size="300"
                      radii="300"
                      before={<Icon src={Icons.Code} size="100" filled />}
                    >
                      <Text size="B300">Source Code</Text>
                    </Button>
                    <Button
                      as="a"
                      href="https://lvbrd.xyz"
                      rel="noreferrer noopener"
                      target="_blank"
                      variant="Critical"
                      fill="Soft"
                      size="300"
                      radii="300"
                      before={<Icon src={Icons.Heart} size="100" filled />}
                    >
                      <Text size="B300">Support</Text>
                    </Button>
                  </Box>
                </Box>
              </Box>
              <Box direction="Column" gap="100">
                <Text size="L400">Options</Text>
                <SequenceCard
                  className={SequenceCardStyle}
                  variant="SurfaceVariant"
                  direction="Column"
                  gap="400"
                >
                  <SettingTile
                    title="Clear Cache & Reload"
                    description="Clear all your locally stored data and reload from server."
                    after={
                      <Button
                        onClick={() => clearCacheAndReload(mx)}
                        variant="Secondary"
                        fill="Soft"
                        size="300"
                        radii="300"
                        outlined
                      >
                        <Text size="B300">Clear Cache</Text>
                      </Button>
                    }
                  />
                </SequenceCard>
              </Box>
            </Box>
          </PageContent>
        </Scroll>
      </Box>
    </Page>
  );
}
