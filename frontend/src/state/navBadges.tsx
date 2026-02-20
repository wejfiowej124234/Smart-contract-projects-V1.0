/* eslint-disable react-refresh/only-export-components -- hooks + provider in same file by design */
import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type NavBadges = {
  dashboard?: string;
  activity?: string;
  governance?: string;
};

const NavBadgesContext = createContext<{
  badges: NavBadges;
  setBadges: (update: Partial<NavBadges>) => void;
}>({ badges: {}, setBadges: () => {} });

export function NavBadgesProvider({ children }: { children: ReactNode }) {
  const [badges, setState] = useState<NavBadges>({});
  const setBadges = useCallback((update: Partial<NavBadges>) => {
    setState((prev) => ({ ...prev, ...update }));
  }, []);
  return (
    <NavBadgesContext.Provider value={{ badges, setBadges }}>
      {children}
    </NavBadgesContext.Provider>
  );
}

export function useNavBadges() {
  return useContext(NavBadgesContext).badges;
}

export function useSetNavBadges() {
  return useContext(NavBadgesContext).setBadges;
}
