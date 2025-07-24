import React, { MouseEventHandler, useCallback, useMemo, useState } from 'react';
import {
  Button,
  color,
  config,
  Icon,
  Icons,
  Menu,
  MenuItem,
  PopOut,
  RectCords,
  Spinner,
  Text,
} from 'folds';
import { HistoryVisibility, MatrixError } from 'matrix-js-sdk';
import { RoomHistoryVisibilityEventContent } from 'matrix-js-sdk/lib/types';
import FocusTrap from 'focus-trap-react';
import { SequenceCard } from '../../../components/sequence-card';
import { SequenceCardStyle } from '../../room-settings/styles.css';
import { SettingTile } from '../../../components/setting-tile';
import { IPowerLevels, powerLevelAPI } from '../../../hooks/usePowerLevels';
import { useMatrixClient } from '../../../hooks/useMatrixClient';
import { useRoom } from '../../../hooks/useRoom';
import { StateEvent } from '../../../../types/matrix/room';
import { AsyncStatus, useAsyncCallback } from '../../../hooks/useAsyncCallback';
import { useStateEvent } from '../../../hooks/useStateEvent';
import { stopPropagation } from '../../../utils/keyboard';

const useVisibilityStr = () =>
  useMemo(
    () => ({
      [HistoryVisibility.Invited]: 'After Invite',
      [HistoryVisibility.Joined]: 'After Join',
      [HistoryVisibility.Shared]: 'All Messages',
      [HistoryVisibility.WorldReadable]: 'All Messages (Guests)',
    }),
    []
  );

const useVisibilityMenu = () =>
  useMemo(
    () => [
      HistoryVisibility.Shared,
      HistoryVisibility.Invited,
      HistoryVisibility.Joined,
      HistoryVisibility.WorldReadable,
    ],
    []
  );

type RoomHistoryVisibilityProps = {
  powerLevels: IPowerLevels;
};
export function RoomHistoryVisibility({ powerLevels }: RoomHistoryVisibilityProps) {
  const mx = useMatrixClient();
  const room = useRoom();
  const userPowerLevel = powerLevelAPI.getPowerLevel(powerLevels, mx.getSafeUserId());
  const canEdit = powerLevelAPI.canSendStateEvent(
    powerLevels,
    StateEvent.RoomHistoryVisibility,
    userPowerLevel
  );

  const visibilityEvent = useStateEvent(room, StateEvent.RoomHistoryVisibility);
  const historyVisibility: HistoryVisibility =
    visibilityEvent?.getContent<RoomHistoryVisibilityEventContent>().history_visibility ??
    HistoryVisibility.Shared;
  const visibilityMenu = useVisibilityMenu();
  const visibilityStr = useVisibilityStr();

  const [menuAnchor, setMenuAnchor] = useState<RectCords>();

  const handleOpenMenu: MouseEventHandler<HTMLButtonElement> = (evt) => {
    setMenuAnchor(evt.currentTarget.getBoundingClientRect());
  };

  const [submitState, submit] = useAsyncCallback(
    useCallback(
      async (visibility: HistoryVisibility) => {
        const content: RoomHistoryVisibilityEventContent = {
          history_visibility: visibility,
        };
        await mx.sendStateEvent(room.roomId, StateEvent.RoomHistoryVisibility as any, content);
      },
      [mx, room.roomId]
    )
  );
  const submitting = submitState.status === AsyncStatus.Loading;

  const handleChange = (visibility: HistoryVisibility) => {
    submit(visibility);
    setMenuAnchor(undefined);
  };

  return (
    <SequenceCard
      className={SequenceCardStyle}
      variant="SurfaceVariant"
      direction="Column"
      gap="400"
    >
      <SettingTile
        title="Message History Visibility"
        description="Changes to history visibility will only apply to future messages. The visibility of existing history will have no effect."
        after={
          <PopOut
            anchor={menuAnchor}
            position="Bottom"
            align="End"
            content={
              <FocusTrap
                focusTrapOptions={{
                  initialFocus: false,
                  returnFocusOnDeactivate: false,
                  onDeactivate: () => setMenuAnchor(undefined),
                  clickOutsideDeactivates: true,
                  isKeyForward: (evt: KeyboardEvent) => evt.key === 'ArrowDown',
                  isKeyBackward: (evt: KeyboardEvent) => evt.key === 'ArrowUp',
                  escapeDeactivates: stopPropagation,
                }}
              >
                <Menu style={{ padding: config.space.S100 }}>
                  {visibilityMenu.map((visibility) => (
                    <MenuItem
                      key={visibility}
                      size="300"
                      radii="300"
                      onClick={() => handleChange(visibility)}
                      aria-pressed={visibility === historyVisibility}
                    >
                      <Text as="span" size="T300" truncate>
                        {visibilityStr[visibility]}
                      </Text>
                    </MenuItem>
                  ))}
                </Menu>
              </FocusTrap>
            }
          >
            <Button
              variant="Secondary"
              fill="Soft"
              size="300"
              radii="300"
              outlined
              disabled={!canEdit || submitting}
              onClick={handleOpenMenu}
              after={
                submitting ? (
                  <Spinner size="100" variant="Secondary" />
                ) : (
                  <Icon size="100" src={Icons.ChevronBottom} />
                )
              }
            >
              <Text size="B300">{visibilityStr[historyVisibility]}</Text>
            </Button>
          </PopOut>
        }
      >
        {submitState.status === AsyncStatus.Error && (
          <Text style={{ color: color.Critical.Main }} size="T200">
            {(submitState.error as MatrixError).message}
          </Text>
        )}
      </SettingTile>
    </SequenceCard>
  );
}
