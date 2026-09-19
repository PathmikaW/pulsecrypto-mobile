// EXPO_PUBLIC_ vars are inlined at build time; only public hosts belong behind this prefix.
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';
export const WS_BASE_URL = process.env.EXPO_PUBLIC_WS_BASE_URL ?? 'ws://localhost:3000';

// Plaintext http/ws is expected in dev (e.g. the Android emulator loopback) but must never ship in a production build.
if (!__DEV__ && (!API_BASE_URL.startsWith('https://') || !WS_BASE_URL.startsWith('wss://'))) {
  throw new Error(
    `API_BASE_URL/WS_BASE_URL must use https/wss in a production build - got: ${API_BASE_URL}, ${WS_BASE_URL}`
  );
}
