import { createContext, useContext } from "react";

export const ComingSoonContext = createContext<{
    comingSoonTab: string | null;
    setComingSoonTab: (tab: string | null) => void;
}>({ comingSoonTab: null, setComingSoonTab: () => {} });

export const useComingSoon = () => useContext(ComingSoonContext);
