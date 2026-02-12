import raw from "./deployments.json";

/** Addresses for the current chain so we connect to the same contracts the backend deployed. */
export type Deployments = {
  chainId: number;
  usd8Address: string;
  wethAddress: string;
  simpleLendingAddress: string;
};

/** Multi-chain: deployments.json is Record<chainId, Deployments> keyed by string. Legacy: single object. */
type RawDeployments = Deployments | Record<string, Deployments>;

function toMap(data: RawDeployments): Record<string, Deployments> {
  if (
    typeof data === "object" &&
    data !== null &&
    "chainId" in data &&
    typeof (data as Deployments).usd8Address === "string"
  ) {
    const single = data as Deployments;
    return { [String(single.chainId)]: single };
  }
  return data as Record<string, Deployments>;
}

const deploymentsMap: Record<string, Deployments> = toMap(raw as RawDeployments);

/** Returns deployment addresses for the given chain so we only talk to contracts on that chain. */
export function getDeployments(chainId: number | undefined): Deployments | undefined {
  if (chainId === undefined) return undefined;
  return deploymentsMap[String(chainId)];
}

export function getSupportedChainIds(): number[] {
  return Object.keys(deploymentsMap).map((k) => Number(k)).filter((n) => !Number.isNaN(n));
}

/** Default chain for display when not connected; first supported chain or 31337. */
export function getDefaultChainId(): number {
  const ids = getSupportedChainIds();
  return ids.length > 0 ? ids[0]! : 31337;
}

/** @deprecated Use getDeployments(chainId) for multi-chain. Returns deployments for default chain. */
function getDefaultDeployments(): Deployments {
  const key = String(getDefaultChainId());
  const entry = deploymentsMap[key];
  if (entry) return entry;
  const first = Object.values(deploymentsMap)[0];
  if (first) return first;
  throw new Error("Deployments map is empty. Run the deploy script (e.g. npx hardhat run scripts/deploy.ts --network localhost) first.");
}
export const deployments: Deployments = getDefaultDeployments();
