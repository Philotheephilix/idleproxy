import { z } from "zod";
import { createPublicClient, http, getAddress, type Address } from "viem";

const envSchema = z.object({
  PORT: z.coerce.number().default(8787),
  BASE_URL: z.string().default("http://localhost:8787"),
  DATABASE_PATH: z.string().default("./idleproxy.db"),
  SETTLEMENT_HMAC_SECRET: z.string().default("dev-secret-change-me"),

  CHAIN_ID: z.coerce.number().default(84532),
  RPC_URL: z.string().default("https://sepolia.base.org"),
  USDC_ADDRESS: z.string().default("0x036CbD53842c5426634e7929541eC2318f3dCF7e"),
  EXPLORER_BASE: z.string().default("https://sepolia.basescan.org"),
  PAY_TO_ADDRESS: z.string().default("0x0000000000000000000000000000000000dEaD"),

  KEEPERHUB_API_BASE: z.string().default("https://app.keeperhub.com/api"),
  KEEPERHUB_API_KEY: z.string().default(""),
  KEEPERHUB_TREASURY_ADDRESS: z.string().default("0x0000000000000000000000000000000000dEaD"),

  NODE_TOKEN: z.string().default(""),
  ROUTER_WS_URL: z.string().default("ws://localhost:8787/node"),
  CLAUDE_CREDENTIALS_PATH: z.string().default("~/.claude/.credentials.json"),

  KEEPERHUB_MCP_URL: z.string().default("https://app.keeperhub.com/mcp"),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(): Env {
  return envSchema.parse(process.env);
}

/** The minimal ERC-3009 read surface needed for the EIP-712 domain. */
const ERC20_NAME_VERSION_ABI = [
  { type: "function", name: "name", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { type: "function", name: "version", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
] as const;

export interface Eip712Domain {
  name: string;
  version: string;
  chainId: number;
  verifyingContract: Address;
}

export interface ChainProfile {
  chainId: number;
  usdcAddress: Address;
  explorerBase: string;
  eip712Domain: Eip712Domain;
}

/**
 * Reads name()/version() off the USDC contract at boot instead of hardcoding
 * them — the two Base Sepolia/mainnet FiatToken deployments use different
 * EIP-712 domain names, and a wrong domain makes every signature verify
 * locally but revert on settle. SPEC.md §6, §9 R1.
 */
export async function resolveChainProfile(env: Env): Promise<ChainProfile> {
  const usdcAddress = getAddress(env.USDC_ADDRESS);
  const client = createPublicClient({ transport: http(env.RPC_URL) });

  const [name, version] = await Promise.all([
    client.readContract({ address: usdcAddress, abi: ERC20_NAME_VERSION_ABI, functionName: "name" }),
    client.readContract({ address: usdcAddress, abi: ERC20_NAME_VERSION_ABI, functionName: "version" }),
  ]);

  return {
    chainId: env.CHAIN_ID,
    usdcAddress,
    explorerBase: env.EXPLORER_BASE,
    eip712Domain: {
      name,
      version,
      chainId: env.CHAIN_ID,
      verifyingContract: usdcAddress,
    },
  };
}
