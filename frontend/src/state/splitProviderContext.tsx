import { createContext, useContext, type ReactNode } from "react";
import type { SplitProviderState } from "../hooks/useSplitProvider";

const defaultState: SplitProviderState = {
  readChainId: undefined,
  readRpcUrl: undefined,
  mismatch: false,
};

const SplitProviderContext = createContext<SplitProviderState>(defaultState);

export function SplitProviderContextProvider({
  value,
  children,
}: {
  value: SplitProviderState;
  children: ReactNode;
}) {
  return (
    <SplitProviderContext.Provider value={value}>
      {children}
    </SplitProviderContext.Provider>
  );
}

export function useSplitProviderState(): SplitProviderState {
  return useContext(SplitProviderContext);
}
