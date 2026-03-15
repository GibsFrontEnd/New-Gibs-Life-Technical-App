import { CHAR_SET } from "./constants";

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Copies the given text to the clipboard.
 *
 * @param {string} text - The text to be copied to the clipboard.
 * @returns {Promise<void>} - A promise that resolves when the text is successfully copied.
 * @throws {Error} - If copying fails, an error is logged to the console.
 */
export const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  } catch (err) {
    console.error("Failed to copy: ", err);
  }
};

export const generateHash = () => {
  const array = new Uint8Array(9); // 72 bits
  crypto.getRandomValues(array);

  // Convert to a BigInt
  let value = BigInt(0);
  for (const byte of array) {
    value = (value << 8n) + BigInt(byte);
  }

  // Encode to Base62
  let hash = "";
  while (value > 0n && hash.length < 12) {
    hash = CHAR_SET[Number(value % 62n)] + hash;
    value /= 62n;
  }

  // Pad if shorter than 12
  while (hash.length < 12) {
    hash = CHAR_SET[Math.floor(Math.random() * 62)] + hash;
  }

  return hash;
};
