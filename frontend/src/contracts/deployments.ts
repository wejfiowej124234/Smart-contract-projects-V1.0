import raw from "./deployments.json";

export type Deployments = {
  chainId: number;
  usd8Address: string;
  wethAddress: string;
  simpleLendingAddress: string;
};

export const deployments = raw as Deployments;
