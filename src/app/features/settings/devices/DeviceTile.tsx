import React, { FormEventHandler, ReactNode, useCallback, useEffect, useState } from 'react';
import {
  Box,
  Text,
  IconButton,
  Icon,
  Icons,
  Chip,
  Input,
  Button,
  color,
  Spinner,
  toRem,
  Overlay,
  OverlayBackdrop,
  OverlayCenter,
} from 'folds';
import { CryptoApi } from 'matrix-js-sdk/lib/crypto-api';
import FocusTrap from 'focus-trap-react';
import { IMyDevice, MatrixError } from 'matrix-js-sdk';
import { SettingTile } from '../../../components/setting-tile';
import { useMatrixClient } from '../../../hooks/useMatrixClient';
import { timeDayMonYear, timeHourMinute, today, yesterday } from '../../../utils/time';
import { BreakWord } from '../../../styles/Text.css';
import { AsyncStatus, useAsyncCallback } from '../../../hooks/useAsyncCallback';
import { SequenceCard } from '../../../components/sequence-card';
import { SequenceCardStyle } from '../styles.css';
import { LogoutDialog } from '../../../components/LogoutDialog';
import { stopPropagation } from '../../../utils/keyboard';

export function DeviceTilePlaceholder() {
  return (
    <SequenceCard
      className={SequenceCardStyle}
      style={{ height: toRem(66) }}
      variant="SurfaceVariant"
      direction="Column"
      gap="400"
    />
  );
}

function DeviceActiveTime({ ts }: { ts: number }) {
  return (
    <Text className={BreakWord} size="T200">
      <Text size="Inherit" as="span" priority="300">
        {'Last activity: '}
      </Text>
      <>
        {today(ts) && 'Today'}
        {yesterday(ts) && 'Yesterday'}
        {!today(ts) && !yesterday(ts) && timeDayMonYear(ts)} {timeHourMinute(ts)}
      </>
    </Text>
  );
}

function DeviceDetails({ device }: { device: IMyDevice }) {
  return (
    <>
      {typeof device.device_id === 'string' && (
        <Text className={BreakWord} size="T200" priority="300">
          Device ID: <i>{device.device_id}</i>
        </Text>
      )}
      {typeof device.last_seen_ip === 'string' && (
        <Text className={BreakWord} size="T200" priority="300">
          IP Address: <i>{device.last_seen_ip}</i>
        </Text>
      )}
    </>
  );
}

type DeviceKeyDetailsProps = {
  crypto: CryptoApi;
};
export function DeviceKeyDetails({ crypto }: DeviceKeyDetailsProps) {
  const [keysState, loadKeys] = useAsyncCallback(
    useCallback(() => {
      const keys = crypto.getOwnDeviceKeys();
      return keys;
    }, [crypto])
  );

  useEffect(() => {
    loadKeys();
  }, [loadKeys]);

  if (keysState.status === AsyncStatus.Error) return null;

  return (
    <Text className={BreakWord} size="T200" priority="300">
      Device Key:{' '}
      <i>{keysState.status === AsyncStatus.Success ? keysState.data.ed25519 : 'loading...'}</i>
    </Text>
  );
}

type DeviceRenameProps = {
  device: IMyDevice;
  onCancel: () => void;
  onRename: () => void;
  refreshDeviceList: () => Promise<void>;
};
function DeviceRename({ device, onCancel, onRename, refreshDeviceList }: DeviceRenameProps) {
  const mx = useMatrixClient();

  const [renameState, rename] = useAsyncCallback<void, MatrixError, [string]>(
    useCallback(
      async (name: string) => {
        await mx.setDeviceDetails(device.device_id, { display_name: name });
        await refreshDeviceList();
      },
      [mx, device.device_id, refreshDeviceList]
    )
  );

  const renaming = renameState.status === AsyncStatus.Loading;

  useEffect(() => {
    if (renameState.status === AsyncStatus.Success) {
      onRename();
    }
  }, [renameState, onRename]);

  const handleSubmit: FormEventHandler<HTMLFormElement> = (evt) => {
    evt.preventDefault();
    if (renaming) return;

    const target = evt.target as HTMLFormElement | undefined;
    const nameInput = target?.nameInput as HTMLInputElement | undefined;
    if (!nameInput) return;
    const deviceName = nameInput.value.trim();
    if (!deviceName || deviceName === device.display_name) return;

    rename(deviceName);
  };

  return (
    <Box as="form" onSubmit={handleSubmit} direction="Column" gap="100">
      <Text size="L400">Device Name</Text>
      <Box gap="200">
        <Box grow="Yes" direction="Column">
          <Input
            name="nameInput"
            size="300"
            variant="Secondary"
            radii="300"
            defaultValue={device.display_name}
            autoFocus
            required
            readOnly={renaming}
          />
        </Box>
        <Box shrink="No" gap="200">
          <Button
            type="submit"
            size="300"
            variant="Success"
            radii="300"
            fill="Solid"
            disabled={renaming}
            before={renaming && <Spinner size="100" variant="Success" fill="Solid" />}
          >
            <Text size="B300">Save</Text>
          </Button>
          <Button
            type="button"
            size="300"
            variant="Secondary"
            radii="300"
            fill="Soft"
            onClick={onCancel}
            disabled={renaming}
          >
            <Text size="B300">Cancel</Text>
          </Button>
        </Box>
      </Box>
      {renameState.status === AsyncStatus.Error ? (
        <Text size="T200" style={{ color: color.Critical.Main }}>
          {renameState.error.message}
        </Text>
      ) : (
        <Text size="T200">Device names are visible to public.</Text>
      )}
    </Box>
  );
}

export function DeviceLogoutBtn() {
  const [prompt, setPrompt] = useState(false);

  const handleClose = () => setPrompt(false);

  return (
    <>
      <Chip variant="Secondary" fill="Soft" radii="Pill" onClick={() => setPrompt(true)}>
        <Text size="B300">Logout</Text>
      </Chip>
      {prompt && (
        <Overlay open backdrop={<OverlayBackdrop />}>
          <OverlayCenter>
            <FocusTrap
              focusTrapOptions={{
                onDeactivate: handleClose,
                clickOutsideDeactivates: true,
                escapeDeactivates: stopPropagation,
              }}
            >
              <LogoutDialog handleClose={handleClose} />
            </FocusTrap>
          </OverlayCenter>
        </Overlay>
      )}
    </>
  );
}

type DeviceDeleteBtnProps = {
  deviceId: string;
  deleted: boolean;
  onDeleteToggle: (deviceId: string) => void;
  disabled?: boolean;
};
export function DeviceDeleteBtn({
  deviceId,
  deleted,
  onDeleteToggle,
  disabled,
}: DeviceDeleteBtnProps) {
  return deleted ? (
    <Chip
      variant="Critical"
      fill="None"
      radii="Pill"
      onClick={() => onDeleteToggle(deviceId)}
      disabled={disabled}
    >
      <Text size="B300">Undo</Text>
    </Chip>
  ) : (
    <Chip
      variant="Secondary"
      fill="None"
      radii="Pill"
      onClick={() => onDeleteToggle(deviceId)}
      disabled={disabled}
    >
      <Icon size="50" src={Icons.Delete} />
    </Chip>
  );
}

type DeviceTileProps = {
  device: IMyDevice;
  deleted?: boolean;
  refreshDeviceList: () => Promise<void>;
  disabled?: boolean;
  options?: ReactNode;
  children?: ReactNode;
};
export function DeviceTile({
  device,
  deleted,
  refreshDeviceList,
  disabled,
  options,
  children,
}: DeviceTileProps) {
  const activeTs = device.last_seen_ts;
  const [details, setDetails] = useState(false);
  const [edit, setEdit] = useState(false);

  const handleRename = useCallback(() => {
    setEdit(false);
  }, []);

  return (
    <>
      <SettingTile
        before={
          <IconButton
            variant={deleted ? 'Critical' : 'Secondary'}
            outlined={deleted}
            radii="300"
            onClick={() => setDetails(!details)}
          >
            <Icon size="50" src={details ? Icons.ChevronBottom : Icons.ChevronRight} />
          </IconButton>
        }
        after={
          !edit && (
            <Box shrink="No" alignItems="Center" gap="200">
              {options}
              {!deleted && (
                <Chip
                  variant="Secondary"
                  radii="Pill"
                  onClick={() => setEdit(true)}
                  disabled={disabled}
                >
                  <Text size="B300">Edit</Text>
                </Chip>
              )}
            </Box>
          )
        }
      >
        <Text size="T300">{device.display_name ?? device.device_id}</Text>
        <Box direction="Column">
          {typeof activeTs === 'number' && <DeviceActiveTime ts={activeTs} />}
          {details && (
            <>
              <DeviceDetails device={device} />
              {children}
            </>
          )}
        </Box>
      </SettingTile>
      {edit && (
        <DeviceRename
          device={device}
          onCancel={() => setEdit(false)}
          onRename={handleRename}
          refreshDeviceList={refreshDeviceList}
        />
      )}
    </>
  );
}
