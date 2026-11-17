/**
 * Small typed key/value store used to share state between steps of ONE scenario
 * (e.g. data loaded from Excel in a Given step and used in a When step).
 * A new instance is created for every scenario, so nothing leaks between tests.
 */
export class ScenarioContext {
  private readonly store = new Map<string, unknown>();

  set<T>(key: string, value: T): void {
    this.store.set(key, value);
  }

  get<T>(key: string): T {
    if (!this.store.has(key)) {
      throw new Error(`ScenarioContext has no value for "${key}". Did a previous step store it?`);
    }
    return this.store.get(key) as T;
  }

  has(key: string): boolean {
    return this.store.has(key);
  }
}
