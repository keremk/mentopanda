import * as React from "react";

const MOBILE_BREAKPOINT = 768;

/**
 * A local hook to check if the viewport width is considered mobile.
 * It returns `undefined` until the first client-side check is complete so that
 * callers can avoid acting on an indeterminate value.
 */
export function useIsMobileWidth() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    undefined
  );

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    const handleChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches);
    };

    // Initial value
    setIsMobile(mql.matches);

    // Listen for changes
    mql.addEventListener("change", handleChange);

    return () => mql.removeEventListener("change", handleChange);
  }, []);

  return isMobile; // undefined until first check, then true/false
}
