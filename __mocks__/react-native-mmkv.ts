// Manual Jest mock for react-native-mmkv. The real package's `createMMKV` claims to
// self-mock under Jest (`isTest()`), but its module-level `import { NitroModules } from
// 'react-native-nitro-modules'` is evaluated eagerly regardless of that branch, and throws
// in a plain Jest environment with no native Nitro runtime — verified directly against the
// installed package's source, not assumed. This in-memory stand-in implements the subset
// of the v4 API this project actually uses.
class InMemoryMMKV {
  private store = new Map<string, boolean | string | number>();

  set(key: string, value: boolean | string | number): void {
    this.store.set(key, value);
  }

  getString(key: string): string | undefined {
    const value = this.store.get(key);
    return typeof value === 'string' ? value : undefined;
  }

  getBoolean(key: string): boolean | undefined {
    const value = this.store.get(key);
    return typeof value === 'boolean' ? value : undefined;
  }

  getNumber(key: string): number | undefined {
    const value = this.store.get(key);
    return typeof value === 'number' ? value : undefined;
  }

  contains(key: string): boolean {
    return this.store.has(key);
  }

  remove(key: string): boolean {
    return this.store.delete(key);
  }

  getAllKeys(): string[] {
    return [...this.store.keys()];
  }

  clearAll(): void {
    this.store.clear();
  }
}

export function createMMKV() {
  return new InMemoryMMKV();
}
