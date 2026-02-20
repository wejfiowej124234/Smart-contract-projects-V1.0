/**
 * Dual-Mode profile loader. Single entry for all deploy/acceptance scripts.
 * Local-first: default MODE=mock; local gate (p10:gate) never depends on real.
 * MODE=real is future production config only. Scripts must use loadProfile(chainId) only; no scattered env branches.
 */
import fs from "node:fs";
import path from "node:path";

const CONFIGS_ROOT = path.join(process.cwd(), "configs", "profiles");

export type OracleProfile =
  | { type: "mock"; heartbeatSeconds?: number; minAnswer?: number; maxAnswer?: number; usePriceBoundGuard?: boolean; maxDeviationBps?: number; feeds?: never }
  | { type: "chainlink"; feeds: Record<string, string>; heartbeatSeconds?: number; minAnswer?: number; maxAnswer?: number };

export type GovernanceProfile = {
  guardian: string | null;
  timelockMinDelaySeconds: number;
  votingDelayBlocks: number;
  votingPeriodBlocks: number;
  proposalThreshold: number;
  quorumNumerator: number;
};

export type SecurityGateProfile = {
  allowEoaChainIds: number[];
  allowSkipB1B2B3: boolean;
  allowSkipB4: boolean;
  allowSkipR1: boolean;
  requireSmokeC3aGovernanceE2EEvidencePack?: boolean;
  requireB4EvidenceOnL2Mainnet?: boolean;
};

export type Profile = {
  mode: "mock" | "real";
  description?: string;
  chainIds: number[];
  oracle: OracleProfile;
  tokens: "deploy" | Record<string, string>;
  reservesConfigPath: string | null;
  governance: GovernanceProfile;
  securityGate: SecurityGateProfile;
  b4EvidenceSigners?: string[];
};

/** Default mock; real only when explicitly MODE=real. Local gate never requires real. */
function getMode(): "mock" | "real" {
  const raw = process.env.MODE?.toLowerCase().trim();
  if (raw === "real") return "real";
  return "mock";
}

function loadJsonIfExists<T>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) return null;
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Load profile for current MODE. Optionally override with profile.<chainId>.json.
 */
export function loadProfile(chainId?: number): Profile {
  const mode = getMode();
  const profileDir = path.join(CONFIGS_ROOT, mode);
  const profilePath = path.join(profileDir, "profile.json");
  const base = loadJsonIfExists<Profile>(profilePath);
  if (!base) {
    throw new Error(`Profile not found: ${profilePath}. Ensure configs/profiles/${mode}/profile.json exists.`);
  }
  base.mode = mode;

  if (chainId != null) {
    const chainPath = path.join(profileDir, `${chainId}.json`);
    const override = loadJsonIfExists<Partial<Profile>>(chainPath);
    if (override) {
      return { ...base, ...override } as Profile;
    }
  }
  return base;
}

/**
 * Get MODE without loading full profile.
 */
export function getModeOnly(): "mock" | "real" {
  return getMode();
}

/**
 * Resolve reserves config path from profile (relative to cwd).
 */
export function getReservesConfigPath(profile: Profile): string | null {
  if (!profile.reservesConfigPath) return null;
  const absolute = path.isAbsolute(profile.reservesConfigPath)
    ? profile.reservesConfigPath
    : path.join(process.cwd(), profile.reservesConfigPath);
  return fs.existsSync(absolute) ? absolute : null;
}
