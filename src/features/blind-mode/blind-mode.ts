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

type BlindModeListener = () => void;

const listeners = new Set<BlindModeListener>();

export function subscribeBlindMode(listener: BlindModeListener): () => void {
  listeners.add(listener);
  window.addEventListener("storage", handleStorage);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", handleStorage);
  };
}

function handleStorage(event: StorageEvent): void {
  if (event.key === BLIND_MODE_STORAGE_KEY) {
    listeners.forEach((listener) => listener());
  }
}

export function writeBlindMode(enabled: boolean): void {
  window.localStorage.setItem(BLIND_MODE_STORAGE_KEY, String(enabled));
  listeners.forEach((listener) => listener());
}

export function getBlindModeSnapshot(): boolean {
  return readBlindMode();
}

export function getBlindModeServerSnapshot(): boolean {
  return false;
}
