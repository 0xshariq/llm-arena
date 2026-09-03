export const BLIND_MODE_STORAGE_KEY = "llm-arena:blind-mode";

export function getDisplayName(
  modelName: string,
  index: number,
  isBlindMode: boolean,
): string {
  return isBlindMode ? `Model ${String.fromCharCode(65 + index)}` : modelName;
}

export function readBlindMode(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(BLIND_MODE_STORAGE_KEY) === "true";
}

export function writeBlindMode(enabled: boolean): void {
  window.localStorage.setItem(BLIND_MODE_STORAGE_KEY, String(enabled));
}
