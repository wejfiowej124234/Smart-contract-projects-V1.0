import type { Contract, Signer, TransactionResponse } from "ethers";

export type WriteToken = {
  approve(spender: string, value: bigint): Promise<TransactionResponse>;
};

export type WriteLending = {
  supply(amount: bigint): Promise<TransactionResponse>;
  withdraw(amount: bigint): Promise<TransactionResponse>;
  borrow(amount: bigint): Promise<TransactionResponse>;
  repay(amount: bigint): Promise<TransactionResponse>;
};

export function getWriteToken(token: Contract, signer: Signer): WriteToken {
  const withSigner = token.connect(signer);
  return {
    approve: (spender, value) => withSigner.getFunction("approve")(spender, value),
  };
}

export function getWriteLending(lending: Contract, signer: Signer): WriteLending {
  const withSigner = lending.connect(signer);
  return {
    supply: (amount) => withSigner.getFunction("supply")(amount),
    withdraw: (amount) => withSigner.getFunction("withdraw")(amount),
    borrow: (amount) => withSigner.getFunction("borrow")(amount),
    repay: (amount) => withSigner.getFunction("repay")(amount),
  };
}
