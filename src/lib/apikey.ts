const API_KEY_STORAGE_KEY = "user_openai_api_key";
// Get encryption key from environment variable, fallback to a default only in development
const ENCRYPTION_KEY =
  process.env.NEXT_PUBLIC_ENCRYPTION_KEY ||
  (process.env.NODE_ENV === "development" ? "dev-encryption-key" : "");

if (!ENCRYPTION_KEY) {
  throw new Error(
    "NEXT_PUBLIC_ENCRYPTION_KEY is not set in environment variables"
  );
}

async function getEncryptionKey(): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(ENCRYPTION_KEY);

  // Derive a key using PBKDF2
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode("mentopanda-salt"),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptData(text: string): Promise<string> {
  if (typeof window === "undefined") return text;

  try {
    const encoder = new TextEncoder();
    const key = await getEncryptionKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv,
      },
      key,
      encoder.encode(text)
    );

    const encryptedArray = new Uint8Array(encryptedData);
    const combined = new Uint8Array(iv.length + encryptedArray.length);
    combined.set(iv);
    combined.set(encryptedArray, iv.length);

    const base64Result = btoa(
      Array.from(combined)
        .map((byte) => String.fromCharCode(byte))
        .join("")
    );

    // Log sizes
    console.log({
      originalLength: text.length,
      encryptedLength: encryptedArray.length,
      combinedLength: combined.length,
      base64Length: base64Result.length,
      totalStorageUsed: JSON.stringify(localStorage).length,
    });

    return base64Result;
  } catch (error) {
    console.error("Encryption error:", error);
    throw error;
  }
}

async function decryptData(encryptedText: string): Promise<string> {
  if (typeof window === "undefined") return encryptedText;

  try {
    const decoder = new TextDecoder();
    const key = await getEncryptionKey();

    // Convert base64 string back to array
    const combined = new Uint8Array(
      atob(encryptedText)
        .split("")
        .map((char) => char.charCodeAt(0))
    );

    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const encryptedData = combined.slice(12);

    const decryptedData = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv,
      },
      key,
      encryptedData
    );

    return decoder.decode(decryptedData);
  } catch (error) {
    console.error("Decryption failed:", error);
    return "";
  }
}

export async function getStoredApiKey(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const encryptedKey = window.localStorage.getItem(API_KEY_STORAGE_KEY);
  if (!encryptedKey) return null;
  return decryptData(encryptedKey);
}

export async function storeApiKey(apiKey: string): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const encryptedKey = await encryptData(apiKey);
    window.localStorage.setItem(API_KEY_STORAGE_KEY, encryptedKey);
  } catch (error) {
    console.error("Failed to store API key:", error);
    throw new Error("Unable to store API key. Try clearing your browser data.");
  }
}

export async function removeApiKey(): Promise<void> {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(API_KEY_STORAGE_KEY);
}

export async function hasStoredApiKey(): Promise<boolean> {
  return !!(await getStoredApiKey());
}
