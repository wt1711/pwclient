import React, { FormEventHandler, useState, useEffect } from 'react';
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
  onLogin: (username: string, password: string, verificationCode?: string, challengeId?: string, verificationMethod?: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  requires2FA?: boolean;
  challengeId?: string;
  availableMethods?: Array<{id: string, name: string}>;
  initialUsername?: string;
  initialPassword?: string;
};

export function InstagramLoginModal({
  isOpen,
  onClose,
  onLogin,
  isLoading,
  error,
  requires2FA = false,
  challengeId,
  availableMethods = [],
  initialUsername = '',
  initialPassword = '',
}: InstagramLoginModalProps) {
  const [username, setUsername] = useState(initialUsername);
  const [password, setPassword] = useState(initialPassword);
  const [verificationCode, setVerificationCode] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<string>('');

  // Update state when initial values change
  useEffect(() => {
    setUsername(initialUsername);
    setPassword(initialPassword);
  }, [initialUsername, initialPassword]);

  // Auto-select first method when available methods change
  useEffect(() => {
    if (availableMethods.length > 0 && !selectedMethod) {
      setSelectedMethod(availableMethods[0].id);
    }
  }, [availableMethods, selectedMethod]);

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (evt) => {
    evt.preventDefault();
    
    if (requires2FA) {
      // For 2FA verification, we need the verification code and challenge ID
      if (!verificationCode.trim() || !challengeId) return;
      
      try {
        await onLogin(username.trim(), password, verificationCode.trim(), challengeId, selectedMethod);
        // Clear form on successful login
        setUsername('');
        setPassword('');
        setVerificationCode('');
        setSelectedMethod('');
      } catch (err) {
        // Clear only the verification code on error to allow retry
        setVerificationCode('');
        // Error handling is done by parent component
      }
    } else {
      // Regular login flow
      if (!username.trim() || !password.trim()) return;
      
      try {
        await onLogin(username.trim(), password);
        // Clear form on successful login
        setUsername('');
        setPassword('');
        setVerificationCode('');
      } catch (err) {
        // Error handling is done by parent component
      }
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setUsername('');
      setPassword('');
      setVerificationCode('');
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
                  <Text size="H4">
                    {requires2FA ? 'Two-Factor Authentication' : 'Connect to Instagram'}
                  </Text>
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
                {!requires2FA && (
                  <>
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
                  </>
                )}

                {requires2FA && (
                  <>
                    <Box direction="Column" gap="200">
                      <Text size="T400" priority="300">
                        Please enter the 6-digit verification code from your authenticator app or SMS.
                      </Text>
                      <Text size="T300" priority="300">
                         Username: <strong>{username}</strong>
                       </Text>
                    </Box>

                    {/* 2FA Method Selection */}
                    {availableMethods.length > 1 && (
                      <Box direction="Column" gap="100">
                        <Text as="label" size="L400" priority="300">
                          Verification Method
                        </Text>
                        <Box direction="Column" gap="100">
                          {availableMethods.map((method) => (
                            <Box key={method.id} direction="Row" gap="100" alignItems="Center">
                              <input
                                type="radio"
                                id={`method-${method.id}`}
                                name="verificationMethod"
                                value={method.id}
                                checked={selectedMethod === method.id}
                                onChange={(e) => setSelectedMethod(e.target.value)}
                                disabled={isLoading}
                                style={{ margin: 0 }}
                              />
                              <Text as="label" htmlFor={`method-${method.id}`} size="T400" priority="300" style={{ cursor: 'pointer' }}>
                                {method.name}
                              </Text>
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    )}

                    <Box direction="Column" gap="100">
                      <Text as="label" size="L400" priority="300">
                        Verification Code
                      </Text>
                      <Input
                        value={verificationCode}
                        onChange={(evt) => setVerificationCode((evt.target as HTMLInputElement).value)}
                        name="verificationCode"
                        variant="Background"
                        size="500"
                        required
                        outlined
                        disabled={isLoading}
                        placeholder="Enter 6-digit code"
                        maxLength={6}
                        style={{ textAlign: 'center', fontSize: '1.2em', letterSpacing: '0.2em' }}
                      />
                    </Box>
                  </>
                )}

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
                    <Text 
                      size="T300" 
                      priority="400" 
                      style={{ 
                        color: 'var(--tc-danger)',
                        whiteSpace: 'pre-line' // This allows line breaks in the error message
                      }}
                    >
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
                    variant="Secondary"
                    size="400"
                  >
                    <Text as="span" size="B400">
                      Cancel
                    </Text>
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      isLoading || 
                      (requires2FA 
                        ? !verificationCode.trim() || !challengeId
                        : !username.trim() || !password.trim()
                      )
                    }
                    variant="Primary"
                    size="400"
                  >
                    {isLoading ? (
                      <Box direction="Row" alignItems="Center" gap="200">
                        <Spinner size="200" />
                        <Text as="span" size="B400">
                          {requires2FA ? 'Verifying...' : 'Connecting...'}
                        </Text>
                      </Box>
                    ) : (
                      <Text as="span" size="B400">
                        {requires2FA ? 'Verify' : 'Connect'}
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