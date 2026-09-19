import { createContext, useContext, type ReactNode } from "react";

const StandardUiContext = createContext(false);

export const useStandardUiScope = () => useContext(StandardUiContext);

/** Keep general navigation styles out of study screens, including portalled dialogs. */
export function StandardUiScope({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  return (
    <StandardUiContext.Provider value={enabled}>
      {enabled ? <div className="app-standard-ui contents">{children}</div> : children}
    </StandardUiContext.Provider>
  );
}
