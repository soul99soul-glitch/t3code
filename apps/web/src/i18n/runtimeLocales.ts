export function readRuntimeLocales(): ReadonlyArray<string> {
  const desktopLocale =
    typeof window === "undefined" ? null : (window.desktopBridge?.getSystemLocale?.() ?? null);
  const browserLocales =
    typeof navigator === "undefined"
      ? []
      : navigator.languages.length > 0
        ? [...navigator.languages]
        : navigator.language
          ? [navigator.language]
          : [];
  return desktopLocale ? [desktopLocale, ...browserLocales] : browserLocales;
}
