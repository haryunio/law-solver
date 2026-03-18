const hex = (value: number) => value.toString(16).padStart(2, "0");

const fallbackUuid = () => {
  if (typeof globalThis !== "undefined" && globalThis.crypto?.getRandomValues) {
    const bytes = new Uint8Array(16);
    globalThis.crypto.getRandomValues(bytes);
    const byte6 = bytes[6] ?? 0;
    const byte8 = bytes[8] ?? 0;
    bytes[6] = (byte6 & 0x0f) | 0x40;
    bytes[8] = (byte8 & 0x3f) | 0x80;
    const parts = [
      Array.from(bytes.slice(0, 4), hex).join(""),
      Array.from(bytes.slice(4, 6), hex).join(""),
      Array.from(bytes.slice(6, 8), hex).join(""),
      Array.from(bytes.slice(8, 10), hex).join(""),
      Array.from(bytes.slice(10, 16), hex).join(""),
    ];
    return parts.join("-");
  }

  const now = Date.now().toString(16);
  const rand = Math.floor(Math.random() * 1e12).toString(16);
  return `${now}-${rand}`;
};

export const createId = () => {
  if (typeof globalThis !== "undefined" && globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return fallbackUuid();
};
