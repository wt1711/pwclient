import { NextRequest, NextResponse } from 'next/server';
import { IgApiClient } from 'instagram-private-api';
import jwt from 'jsonwebtoken';
import { SessionManager } from '@/lib/db';
import { getRealtimeService } from '@/lib/realtime';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.CORS_ALLOW_ORIGIN ?? 'http://localhost:5173',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
};

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

// Initialize session manager
const sessionManager = new SessionManager();

// Keep a small in-memory cache for Instagram client instances and 2FA challenges
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const igClientCache = new Map<string, any>();

// Helper function to handle successful login flow
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSuccessfulLogin(loggedInUser: any, username: string, ig: IgApiClient) {
  // Debug: Log the structure of loggedInUser
  console.log('🔍 loggedInUser structure:', JSON.stringify(loggedInUser, null, 2));
  console.log('🔍 loggedInUser keys:', Object.keys(loggedInUser || {}));
  
  // Create session ID
  const sessionId = `${username}_${Date.now()}`;

  // Extract user ID - handle different possible structures
  let userId: string;
  if (loggedInUser?.pk) {
    userId = loggedInUser.pk.toString();
  } else if (loggedInUser?.logged_in_user?.pk) {
    userId = loggedInUser.logged_in_user.pk.toString();
  } else if (loggedInUser?.account?.pk) {
    userId = loggedInUser.account.pk.toString();
  } else {
    console.error('❌ Unable to find user ID in loggedInUser object');
    throw new Error('User ID not found in login response');
  }

  // Extract username - handle different possible structures
  let userUsername: string;
  if (loggedInUser?.username) {
    userUsername = loggedInUser.username;
  } else if (loggedInUser?.logged_in_user?.username) {
    userUsername = loggedInUser.logged_in_user.username;
  } else if (loggedInUser?.account?.username) {
    userUsername = loggedInUser.account.username;
  } else {
    userUsername = username; // Fallback to the provided username
  }

  // Create JWT token
  const token = jwt.sign(
    {
      userId: userId,
      username: userUsername,
      sessionId: sessionId,
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  // Store session data in Redis
  await sessionManager.setSession(
    sessionId,
    {
      userId: userId,
      username: userUsername,
      fullName: loggedInUser?.full_name || loggedInUser?.logged_in_user?.full_name || loggedInUser?.account?.full_name || '',
      profilePicUrl: loggedInUser?.profile_pic_url || loggedInUser?.logged_in_user?.profile_pic_url || loggedInUser?.account?.profile_pic_url || '',
      loginTime: new Date().toISOString(),
    },
    86400
  ); // 24 hours expiration

  // Debug: Check cookies before storing
  console.log(`🔍 Login successful for user ${userId}:`);
  console.log(
    `- Cookies after login: ${ig.state.cookieJar.getCookies('https://instagram.com').length}`
  );

  let cookieUserId = 'Not set';
  try {
    cookieUserId = ig.state.cookieUserId || 'Not set';
  } catch (error) {
    console.log(
      `- Cookie error after login: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
  console.log(`- User ID after login: ${cookieUserId}`);

  // Store Instagram client instance in database instead of memory cache
  await sessionManager.storeInstagramClient(userId, ig, 24);

  // Initialize realtime service for this user
  try {
    const realtimeService = getRealtimeService();
    await realtimeService.initialize(username, ''); // Don't pass password for security
    console.log('✅ Realtime service initialized for user:', username);
  } catch (realtimeError) {
    console.warn('⚠️ Failed to initialize realtime service:', realtimeError);
    // Don't fail the login if realtime service fails
  }

  // Clean up old client instances from memory cache (if any remain)
  const userSessions = Array.from(igClientCache.keys()).filter((key: string) =>
    key.startsWith(`${username}_`)
  );

  userSessions.forEach((sessionId: string) => {
    igClientCache.delete(sessionId);
  });

  return NextResponse.json(
    {
      success: true,
      token,
      user: {
        id: userId,
        username: userUsername,
        fullName: loggedInUser?.full_name || loggedInUser?.logged_in_user?.full_name || loggedInUser?.account?.full_name || '',
        profilePicUrl: loggedInUser?.profile_pic_url || loggedInUser?.logged_in_user?.profile_pic_url || loggedInUser?.account?.profile_pic_url || '',
      },
    },
    {
      headers: corsHeaders,
    }
  );
}

// Handle preflight OPTIONS request
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function POST(request: NextRequest) {
  try {
    const { username, password, verificationCode, challengeId, verificationMethod } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Create Instagram API client
    const ig = new IgApiClient();

    // Generate device ID based on username
    ig.state.generateDevice(username);

    try {
      // If we have a verification code and challenge ID, handle 2FA verification
      if (verificationCode && challengeId) {
        console.log(`🔐 Processing 2FA verification for user: ${username}`);
        
        // Retrieve the stored challenge data from cache
        const cachedData = igClientCache.get(`challenge_${challengeId}`);
        if (!cachedData) {
          return NextResponse.json(
            { error: '2FA challenge expired or not found. Please restart the login process.' },
            { status: 400, headers: corsHeaders }
          );
        }

        try {
          // Process the 2FA verification using the cached Instagram client
          console.log(`🔐 Attempting 2FA verification with code: ${verificationCode}`);
          console.log(`🔐 Two-factor identifier: ${cachedData.twoFactorIdentifier}`);
          
          // Create a fresh Instagram client for 2FA verification
          const ig = new IgApiClient();
          
          // Generate device for the username to maintain consistency
          ig.state.generateDevice(cachedData.username);
          
          // Convert verification code to string FIRST and ensure it's properly formatted
          const codeAsString = String(verificationCode).trim();
          
          // Validate the verification code format
          if (!/^\d{6}$/.test(codeAsString)) {
            console.error(`❌ Invalid verification code format: ${codeAsString}`);
            return NextResponse.json(
              { error: 'Invalid verification code format. Please enter a 6-digit code.' },
              { status: 400, headers: corsHeaders }
            );
          }
          
          console.log(`🔐 Verification code type: ${typeof verificationCode}, value: ${verificationCode}`);
          console.log(`🔐 Code as string: ${codeAsString}, length: ${codeAsString.length}`);
          console.log(`🔐 Username: ${cachedData.username}`);
          console.log(`🔐 Cached two factor identifier: ${cachedData.twoFactorIdentifier}`);
          
          // Perform a fresh login attempt with the cached credentials
          // This ensures we have the proper session state for 2FA
          let freshTwoFactorIdentifier = cachedData.twoFactorIdentifier;
          
          try {
            await ig.account.login(cachedData.username, cachedData.password);
            // If login succeeds without 2FA, something changed - proceed normally
            console.log('✅ Login succeeded without 2FA - account settings may have changed');
            const loggedInUser = await ig.account.currentUser();
            
            // Clean up the challenge from cache
            igClientCache.delete(`challenge_${challengeId}`);
            
            return await handleSuccessfulLogin(loggedInUser, cachedData.username, ig);
          } catch (loginError) {
             // Expected: login should fail with 2FA required, giving us the proper session state
             console.log('🔐 Login failed as expected, proceeding with 2FA verification');
             
             // eslint-disable-next-line @typescript-eslint/no-explicit-any
             const errorBody = (loginError as any)?.response?.body;
             const is2FARequired = errorBody?.two_factor_required;
             
             if (!is2FARequired) {
               console.error('❌ Unexpected login error during 2FA setup:', loginError);
               throw loginError;
             }
             
             // Extract the fresh 2FA identifier from the login error response
             const freshIdentifierFromResponse = errorBody?.two_factor_info?.two_factor_identifier;
             
             if (freshIdentifierFromResponse) {
               console.log(`🔐 Using fresh two-factor identifier: ${freshIdentifierFromResponse}`);
               freshTwoFactorIdentifier = freshIdentifierFromResponse;
             } else {
               console.log(`🔐 Using cached two-factor identifier: ${freshTwoFactorIdentifier}`);
             }
           }
          
          // Determine the verification method to use
          let methodToUse = '0'; // Default to TOTP
          
          if (verificationMethod) {
            // If user provided a specific method, use it
            methodToUse = verificationMethod;
          } else {
            // Fallback: try to determine from available methods in cached data
            const availableMethods = cachedData.availableMethods;
            if (availableMethods && availableMethods.length > 0) {
              // Use the first available method as default
              methodToUse = availableMethods[0].verificationMethod;
            }
          }
          
          console.log(`🔐 Using verification method: ${methodToUse} (${methodToUse === '0' ? 'TOTP/Google Authenticator' : 'SMS'})`);
          console.log(`🔐 Final two factor identifier: ${freshTwoFactorIdentifier}`);
          
          const loggedInUser = await ig.account.twoFactorLogin({
            username: cachedData.username,
            verificationCode: codeAsString,
            twoFactorIdentifier: freshTwoFactorIdentifier,
            verificationMethod: methodToUse,
            trustThisDevice: '1', // Can be omitted as '1' is used by default
          });
          
          console.log(`✅ 2FA verification successful for user: ${username}`);
          
          // Clean up the challenge from cache
          igClientCache.delete(`challenge_${challengeId}`);
          
          // Continue with successful login flow
          return await handleSuccessfulLogin(loggedInUser, username, ig);
          
        } catch (verificationError: unknown) {
          console.error('❌ 2FA verification failed:', verificationError);
          console.error('❌ Error type:', typeof verificationError);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          console.error('❌ Error name:', (verificationError as any)?.name);
          console.error('❌ Error message:', verificationError instanceof Error ? verificationError.message : String(verificationError));
          
          // Log additional error details for debugging
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if ((verificationError as any)?.response) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            console.error(`❌ Response status: ${(verificationError as any)?.response?.status}`);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            console.error(`❌ Response body:`, (verificationError as any)?.response?.body);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            console.error(`❌ Response headers:`, (verificationError as any)?.response?.headers);
          }
          
          // Log the exact parameters that were used in the failed request
          console.error(`❌ Failed request parameters:`);
          console.error(`   - Username: ${cachedData.username}`);
          console.error(`   - Verification code: [REDACTED]`);
          console.error(`   - Two factor identifier: [REDACTED]`);
          console.error(`   - Verification method: [REDACTED]`);
          console.error(`   - Trust this device: 1`);
          
          return NextResponse.json(
            { 
              error: 'Invalid verification code. Please try again.',
              suggestion: 'Make sure you entered the 6-digit code correctly from your authenticator app or SMS.'
            },
            { status: 401, headers: corsHeaders }
          );
        }
      }

      // Attempt to login (initial login attempt)
      const loggedInUser = await ig.account.login(username, password);

      // If login is successful without 2FA, proceed normally
      return await handleSuccessfulLogin(loggedInUser, username, ig);
      
    } catch (loginError: unknown) {
      console.error('Instagram login error:', loginError);
      console.error('Error type:', typeof loginError);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      console.error('Error name:', (loginError as any)?.name);
      console.error('Error message:', loginError instanceof Error ? loginError.message : String(loginError));
      console.error('Full error object:', JSON.stringify(loginError, null, 2));

      const errorMessage = loginError instanceof Error ? loginError.message : String(loginError);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errorName = (loginError as any)?.name || '';

      // Handle 2FA challenge requirement - check multiple patterns
      const is2FARequired = 
        errorMessage.includes('challenge_required') ||
        errorMessage.includes('two_factor_required') ||
        errorMessage.includes('checkpoint_required') ||
        errorName === 'IgChallengeWrongCodeError' ||
        errorName === 'IgCheckpointError' ||
        errorName === 'IgTwoFactorAuthRequiredError' ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (loginError as any)?.response?.body?.two_factor_required ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (loginError as any)?.response?.body?.challenge?.url;

      if (is2FARequired) {
        console.log(`🔐 2FA challenge required for user: ${username}`);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        console.log('Challenge details:', (loginError as any)?.response?.body);
        
        try {
          // Generate a unique challenge ID
          const challengeId = `${username}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          // Extract the two-factor identifier from the error response
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const twoFactorIdentifier = (loginError as any)?.response?.body?.two_factor_info?.two_factor_identifier;
          
          if (!twoFactorIdentifier) {
            console.error('❌ No two-factor identifier found in response');
            return NextResponse.json(
              { error: 'Two-factor authentication setup incomplete. Please try again.' },
              { status: 400, headers: corsHeaders }
            );
          }
          
          // Extract available 2FA methods from the response
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const twoFactorInfo = (loginError as any)?.response?.body?.two_factor_info;
          const availableMethods = [];
          
          // Check if SMS is available
          if (twoFactorInfo?.sms_two_factor_on) {
            availableMethods.push({
              method: 'sms',
              label: 'SMS',
              description: 'Send code via SMS',
              verificationMethod: '1'
            });
          }
          
          // Check if TOTP (Google Authenticator) is available
          if (twoFactorInfo?.totp_two_factor_on) {
            availableMethods.push({
              method: 'totp',
              label: 'Authenticator App',
              description: 'Use Google Authenticator or similar app',
              verificationMethod: '0'
            });
          }
          
          // Fallback: if we can't determine available methods, provide both options
          if (availableMethods.length === 0) {
            availableMethods.push(
              {
                method: 'sms',
                label: 'SMS',
                description: 'Send code via SMS',
                verificationMethod: '1'
              },
              {
                method: 'totp',
                label: 'Authenticator App',
                description: 'Use Google Authenticator or similar app',
                verificationMethod: '0'
              }
            );
          }
          
          // Store only the essential data needed for 2FA verification
          igClientCache.set(`challenge_${challengeId}`, {
            twoFactorIdentifier: twoFactorIdentifier,
            username: username,
            password: password, // Store password to retry login after 2FA
            timestamp: Date.now(),
            availableMethods: availableMethods // Store available methods for fallback
          });
          
          // Set expiration for the challenge (5 minutes)
          setTimeout(() => {
            igClientCache.delete(`challenge_${challengeId}`);
          }, 5 * 60 * 1000);
          
          return NextResponse.json(
            {
              requires2FA: true,
              challengeId: challengeId,
              message: 'Two-factor authentication required. Please choose your verification method and enter your code.',
              availableMethods: availableMethods,
            },
            { status: 200, headers: corsHeaders }
          );
        } catch (challengeError) {
          console.error('Error handling 2FA challenge:', challengeError);
          return NextResponse.json(
            {
              error: 'Account verification required. Please log in through the Instagram app first.',
            },
            { status: 400, headers: corsHeaders }
          );
        }
      }

      if (errorMessage.includes('bad_password') || errorMessage.includes('You can log in with your linked Facebook account')) {
        return NextResponse.json(
          { 
            error: 'Invalid credentials. If you use Facebook login for Instagram, please use your Facebook credentials or enable Instagram password login in your account settings.',
            suggestion: 'Try logging in with your Facebook credentials, or enable password login in Instagram settings.'
          },
          { status: 401, headers: corsHeaders }
        );
      }

      if (errorMessage.includes('rate_limit')) {
        return NextResponse.json(
          { error: 'Too many login attempts. Please try again later.' },
          { status: 429, headers: corsHeaders }
        );
      }

      return NextResponse.json(
        { error: 'Login failed. Please check your credentials and try again.' },
        { status: 401, headers: corsHeaders }
      );
    }
  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Export the session manager and client cache for use in other API routes
export { sessionManager, igClientCache };
