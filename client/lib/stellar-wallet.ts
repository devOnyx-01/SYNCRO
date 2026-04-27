/**
 * Stellar Wallet Integration with Freighter
 * Handles wallet connection, message signing, and verification
 */

export interface FreighterAPI {
  isConnected: () => Promise<boolean>;
  getPublicKey: () => Promise<string>;
  signMessage: (message: string) => Promise<string>;
}

declare global {
  interface Window {
    freighter?: FreighterAPI;
  }
}

export class StellarWalletError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StellarWalletError";
  }
}

/**
 * Check if Freighter wallet extension is installed
 */
export function isFreighterInstalled(): boolean {
  return typeof window !== "undefined" && !!window.freighter;
}

/**
 * Connect to Freighter wallet and get public key
 */
export async function connectFreighterWallet(): Promise<string> {
  if (!isFreighterInstalled()) {
    throw new StellarWalletError(
      "Freighter wallet extension is not installed. Please install it from https://www.freighter.app/"
    );
  }

  try {
    const publicKey = await window.freighter!.getPublicKey();
    if (!publicKey) {
      throw new StellarWalletError("Failed to retrieve public key from Freighter");
    }
    return publicKey;
  } catch (error) {
    if (error instanceof StellarWalletError) {
      throw error;
    }
    throw new StellarWalletError(
      `Failed to connect to Freighter: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Generate a verification message for signing
 */
export function generateVerificationMessage(publicKey: string): string {
  const timestamp = Date.now();
  return `SYNCRO Wallet Verification\n\nPublic Key: ${publicKey}\nTimestamp: ${timestamp}\n\nBy signing this message, you prove ownership of this Stellar wallet address.`;
}

/**
 * Sign a message with Freighter wallet
 */
export async function signMessageWithFreighter(message: string): Promise<string> {
  if (!isFreighterInstalled()) {
    throw new StellarWalletError("Freighter wallet extension is not installed");
  }

  try {
    const signature = await window.freighter!.signMessage(message);
    if (!signature) {
      throw new StellarWalletError("Failed to sign message");
    }
    return signature;
  } catch (error) {
    if (error instanceof StellarWalletError) {
      throw error;
    }
    throw new StellarWalletError(
      `Failed to sign message: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Complete wallet verification flow
 */
export async function verifyWalletOwnership(): Promise<{
  publicKey: string;
  message: string;
  signature: string;
}> {
  // Step 1: Connect wallet and get public key
  const publicKey = await connectFreighterWallet();

  // Step 2: Generate verification message
  const message = generateVerificationMessage(publicKey);

  // Step 3: Sign the message
  const signature = await signMessageWithFreighter(message);

  return {
    publicKey,
    message,
    signature,
  };
}
