// EXPO_PUBLIC_-prefixed vars are inlined at build time (Expo's documented client-env
// mechanism) — no secret belongs behind this prefix, only the backend's public host.
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';
export const WS_BASE_URL = process.env.EXPO_PUBLIC_WS_BASE_URL ?? 'ws://localhost:3000';

// Plaintext http/ws is expected in dev (the Android Emulator loopback, ws://10.0.2.2:3000)
// but must never silently ship in a production build - fail fast instead of sending market
// data traffic over an unencrypted connection because an env var was left unset/wrong.
if (!__DEV__ && (!API_BASE_URL.startsWith('https://') || !WS_BASE_URL.startsWith('wss://'))) {
  throw new Error(
    `API_BASE_URL/WS_BASE_URL must use https/wss in a production build - got: ${API_BASE_URL}, ${WS_BASE_URL}`
  );
}
