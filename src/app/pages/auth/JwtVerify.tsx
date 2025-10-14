import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Spinner, Text, color } from 'folds';
import { Page, PageContent, PageContentCenter, PageHeader } from '../../components/page';
import { isAuthenticated } from '../../../client/state/auth';
import { DM_PATH } from '../paths';
import { AsyncStatus, useAsyncCallback } from '~/app/hooks/useAsyncCallback';
import { CustomLoginResponse, login, useLoginComplete } from './login/loginUtil';
import { MatrixError } from 'matrix-js-sdk';
import { setAfterLoginRedirectPath } from '../afterLoginRedirectPath';

type ApiResponse = {
  message: string;
  data?: {
    userId: string;
    accessToken: string;
    deviceId: string;
    homeServer: string;
    randomString: string;
  };
};

const getTokenFromQuery = (): string | undefined => {
  const params = new URLSearchParams(window.location.search);
  // Prefer 'token', fallback to 'loginToken'
  return params.get('token') ?? params.get('loginToken') ?? undefined;
};

export function JwtVerify() {
  const [loginState, startLogin] = useAsyncCallback<
    CustomLoginResponse,
    MatrixError,
    Parameters<typeof login>
  >(useCallback(login, []));

  useLoginComplete(loginState.status === AsyncStatus.Success ? loginState.data : undefined);

  const handleUserIdLogin = (userId: string, password: string, baseUrl: string) => {
    startLogin(baseUrl, {
      type: 'm.login.password',
      identifier: {
        type: 'm.id.user',
        user: userId,
      },
      password,
      initial_device_display_name: 'Cinny Web',
    });
  };
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');
  const [data, setData] = useState<ApiResponse['data']>();

  const token = useMemo(getTokenFromQuery, []);
  const navigate = useNavigate();

  useEffect(() => {
    // If already logged in, redirect to DM page immediately
    if (isAuthenticated()) {
      navigate(DM_PATH, { replace: true });
      return;
    }

    const verify = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Missing token in URL');
        return;
      }

      setStatus('loading');
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/check`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const json = (await res.json()) as ApiResponse;
        const data = json?.data;

        if (
          !res.ok ||
          !(
            data &&
            data.accessToken &&
            data.deviceId &&
            data.userId &&
            data.homeServer &&
            data.randomString
          )
        ) {
          setStatus('error');
          setMessage(json?.message || 'Token verification failed');
          return;
        }

        setStatus('success');
        setMessage(json?.message || 'Token is valid. Redirecting ...');
        setData(data);
        // Store session directly to multi-account storage
        try {
          setAfterLoginRedirectPath(DM_PATH);
          handleUserIdLogin(data.userId, data.randomString, data.homeServer);
          return;
        } catch (e) {
          // ignore storage errors
        }
      } catch (err) {
        setStatus('error');
        setMessage('Token verification failed');
      }
    };

    verify();
  }, [navigate, token]);

  return (
    <Page>
      <PageHeader>
        <Text size="H4">Authenticating…</Text>
      </PageHeader>
      <Box grow="Yes">
        <PageContent>
          <PageContentCenter>
            {status === 'loading' && (
              <Box direction="Column" alignItems="Center" gap="200">
                <Spinner size="300" variant="Primary" fill="Solid" />
                <Text size="T300">Verifying token…</Text>
              </Box>
            )}
            {status === 'error' && (
              <Text size="T300" style={{ color: color.Critical.Main }}>
                <b>{message}</b>
              </Text>
            )}
            {status === 'success' && (
              <Box direction="Column" gap="100">
                <Text size="T300" style={{ color: color.Success.Main }}>
                  <b>{message}</b>
                </Text>
                {data && <Text size="T200">User ID: {data.userId}</Text>}
              </Box>
            )}
          </PageContentCenter>
        </PageContent>
      </Box>
    </Page>
  );
}

export default JwtVerify;
