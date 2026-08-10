import {
  generateKeyPairSync,
  sign as edSign,
  verify as edVerify,
  createHash,
  createPrivateKey,
  createPublicKey,
  type KeyObject,
} from "node:crypto";

/**
 * ed25519 attestation over the CLI's self-reported model. SPEC.md D7, §7:
 * not proof, a deterrent — the strongest honest claim available without a
 * TEE, since these CLIs are nondeterministic and canary re-execution is
 * dead on arrival.
 */

export interface AttestationInput {
  requestId: string;
  adapter: string;
  modelReported: string;
  promptHash: string;
  outputHash: string;
  inputTokens: number;
  outputTokens: number;
  costUsdMicros: bigint;
}

export interface NodeKeypair {
  publicKeyHex: string;
  privateKeyDer: Buffer; // PKCS8 DER, persisted by the node under its data dir
}

export function generateNodeKeypair(): NodeKeypair {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  return {
    publicKeyHex: publicKey.export({ type: "spki", format: "der" }).toString("hex"),
    privateKeyDer: privateKey.export({ type: "pkcs8", format: "der" }) as Buffer,
  };
}

function loadPrivateKey(der: Buffer): KeyObject {
  return createPrivateKey({ key: der, format: "der", type: "pkcs8" });
}

function loadPublicKey(hex: string): KeyObject {
  return createPublicKey({ key: Buffer.from(hex, "hex"), format: "der", type: "spki" });
}

export function canonicalMessage(input: AttestationInput): Buffer {
  const parts = [
    input.requestId,
    input.adapter,
    input.modelReported,
    input.promptHash,
    input.outputHash,
    String(input.inputTokens),
    String(input.outputTokens),
    input.costUsdMicros.toString(),
  ];
  return Buffer.from(parts.join("|"), "utf8");
}

export function signAttestation(input: AttestationInput, privateKeyDer: Buffer): string {
  const digest = createHash("sha256").update(canonicalMessage(input)).digest();
  const key = loadPrivateKey(privateKeyDer);
  const sig = edSign(null, digest, key);
  return sig.toString("hex");
}

export function verifyAttestation(input: AttestationInput, signatureHex: string, publicKeyHex: string): boolean {
  const digest = createHash("sha256").update(canonicalMessage(input)).digest();
  const key = loadPublicKey(publicKeyHex);
  try {
    return edVerify(null, digest, key, Buffer.from(signatureHex, "hex"));
  } catch {
    return false;
  }
}

export function sha256Hex(data: string): string {
  return createHash("sha256").update(data, "utf8").digest("hex");
}
