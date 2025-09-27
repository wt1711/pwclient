import React, { FormEventHandler, useState } from 'react';
import {
  Box,
  Button,
  Input,
  Modal,
  Overlay,
  OverlayBackdrop,
  OverlayCenter,
  Spinner,
  Text,
  Header,
  Icon,
  IconButton,
  Icons,
  config,
} from 'folds';
import FocusTrap from 'focus-trap-react';
import { PasswordInput } from './password-input';
import { stopPropagation } from '../utils/keyboard';

type InstagramLoginModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (username: string, password: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
};

export function InstagramLoginModal({
  isOpen,
  onClose,
  onLogin,
  isLoading,
  error,
}: InstagramLoginModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (evt) => {
    evt.preventDefault();
    if (!username.trim() || !password.trim()) return;
    
    try {
      await onLogin(username.trim(), password);
      // Clear form on successful login
      setUsername('');
      setPassword('');
    } catch (err) {
      // Error handling is done by parent component
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setUsername('');
      setPassword('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <Overlay open backdrop={<OverlayBackdrop />}>
      <OverlayCenter>
        <FocusTrap
          focusTrapOptions={{
            initialFocus: false,
            clickOutsideDeactivates: !isLoading,
            onDeactivate: handleClose,
            escapeDeactivates: isLoading ? false : stopPropagation,
          }}
        >
          <Modal size="500" variant="Background">
            <Box direction="Column" gap="400" style={{ padding: config.space.S400 }}>
              {/* Header */}
              <Box direction="Row" alignItems="Center" justifyContent="SpaceBetween">
                <Header size="400">
                  <Text size="H4">Connect to Instagram</Text>
                </Header>
                <IconButton
                  onClick={handleClose}
                  disabled={isLoading}
                  variant="Background"
                  size="300"
                  radii="300"
                >
                  <Icon src={Icons.Cross} />
                </IconButton>
              </Box>

              {/* Form */}
              <Box as="form" onSubmit={handleSubmit} direction="Column" gap="400">
                <Box direction="Column" gap="100">
                  <Text as="label" size="L400" priority="300">
                    Instagram Username
                  </Text>
                  <Input
                    value={username}
                    onChange={(evt) => setUsername((evt.target as HTMLInputElement).value)}
                    name="username"
                    variant="Background"
                    size="500"
                    required
                    outlined
                    disabled={isLoading}
                    placeholder="Enter your Instagram username"
                  />
                </Box>

                <Box direction="Column" gap="100">
                  <Text as="label" size="L400" priority="300">
                    Password
                  </Text>
                  <PasswordInput
                    value={password}
                    onChange={(evt) => setPassword((evt.target as HTMLInputElement).value)}
                    name="password"
                    variant="Background"
                    size="500"
                    outlined
                    required
                    disabled={isLoading}
                    placeholder="Enter your Instagram password"
                  />
                </Box>

                {/* Error Message */}
                {error && (
                  <Box
                    style={{
                      padding: config.space.S200,
                      backgroundColor: 'var(--bg-danger-soft)',
                      borderRadius: config.radii.R300,
                      border: '1px solid var(--bg-danger)',
                    }}
                  >
                    <Text size="T300" priority="400" style={{ color: 'var(--tc-danger)' }}>
                      {error}
                    </Text>
                  </Box>
                )}

                {/* Buttons */}
                <Box direction="Row" gap="200" justifyContent="End">
                  <Button
                    type="button"
                    onClick={handleClose}
                    disabled={isLoading}
                    variant="Background"
                    size="400"
                  >
                    <Text as="span" size="B400">
                      Cancel
                    </Text>
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading || !username.trim() || !password.trim()}
                    variant="Primary"
                    size="400"
                  >
                    {isLoading ? (
                      <Box direction="Row" alignItems="Center" gap="200">
                        <Spinner size="200" />
                        <Text as="span" size="B400">
                          Connecting...
                        </Text>
                      </Box>
                    ) : (
                      <Text as="span" size="B400">
                        Connect
                      </Text>
                    )}
                  </Button>
                </Box>
              </Box>
            </Box>
          </Modal>
        </FocusTrap>
      </OverlayCenter>
    </Overlay>
  );
}