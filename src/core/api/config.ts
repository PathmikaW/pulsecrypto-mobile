// EXPO_PUBLIC_-prefixed vars are inlined at build time (Expo's documented client-env
// mechanism) — no secret belongs behind this prefix, only the backend's public host.
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';
export const WS_BASE_URL = process.env.EXPO_PUBLIC_WS_BASE_URL ?? 'ws://localhost:3000';
