/**
 * StudySaathi AI - Google OAuth 2.0 / OpenID Connect Client
 * SFIC Gujarat Hackathon 2026 - Problem Statement PS-60
 *
 * Implements real Google Identity OAuth 2.0 Authorization Code flow with anti-CSRF state,
 * secure server-side token exchange, and verified OpenID profile retrieval.
 */

export interface GoogleUserInfo {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
}

export interface GoogleTokens {
  access_token: string;
  id_token?: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope?: string;
}

/**
 * Checks if Google OAuth credentials are provided in the environment.
 */
export function isGoogleAuthConfigured(): boolean {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  return Boolean(
    clientId &&
    clientSecret &&
    clientId.trim().length > 0 &&
    clientSecret.trim().length > 0 &&
    !clientId.includes("your-google-client-id")
  );
}

/**
 * Resolves the canonical app origin (e.g. https://shikshasetu-ai-iota.vercel.app or http://localhost:3000)
 */
export function getAppOrigin(request?: Request): string {
  // 1. Explicitly configured production / deployment URL
  if (process.env.APP_URL && process.env.APP_URL.startsWith("http")) {
    return process.env.APP_URL.replace(/\/$/, "");
  }
  if (process.env.NEXTAUTH_URL && process.env.NEXTAUTH_URL.startsWith("http")) {
    return process.env.NEXTAUTH_URL.replace(/\/$/, "");
  }

  // 2. Vercel deployment URL
  if (process.env.VERCEL_URL) {
    const proto = process.env.NODE_ENV === "development" ? "http" : "https";
    return `${proto}://${process.env.VERCEL_URL}`;
  }

  // 3. Request headers
  if (request) {
    const proto =
      request.headers.get("x-forwarded-proto") ||
      (request.url.startsWith("https") ? "https" : "http");
    const host =
      request.headers.get("x-forwarded-host") ||
      request.headers.get("host");
    if (host) {
      return `${proto}://${host}`;
    }
  }

  return "http://localhost:3000";
}

/**
 * Generates the official Google OAuth 2.0 authorization URL
 */
export function getGoogleAuthorizationUrl(origin: string, state: string): string {
  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const redirectUri = `${origin}/api/auth/callback/google`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "offline",
    prompt: "select_account",
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Exchanges the authorization code received from Google for access & id tokens.
 */
export async function exchangeGoogleCode(
  code: string,
  origin: string
): Promise<GoogleTokens> {
  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
  const redirectUri = `${origin}/api/auth/callback/google`;

  const params = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    let parsedMessage = errorBody;
    try {
      const json = JSON.parse(errorBody);
      parsedMessage = json.error_description || json.error || errorBody;
    } catch {}
    throw new Error(`Google token exchange failed (${response.status}): ${parsedMessage}`);
  }

  return (await response.json()) as GoogleTokens;
}

/**
 * Fetches verified user identity from Google's OpenID userinfo endpoint.
 */
export async function getGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Google userinfo (${response.status})`);
  }

  const data = (await response.json()) as GoogleUserInfo;
  return data;
}
