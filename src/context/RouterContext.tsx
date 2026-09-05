import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';

type Route = {
  path: string;
  params: Record<string, string>;
};

interface RouterContextValue {
  route: Route;
  navigate: (path: string) => void;
}

const RouterContext = createContext<RouterContextValue | undefined>(undefined);

function parsePath(): Route {
  const hash = window.location.hash.slice(1) || '/';
  return { path: hash, params: {} };
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<Route>(parsePath);

  useEffect(() => {
    const onHashChange = () => setRoute(parsePath());
    window.addEventListener('hashchange', onHashChange);
    if (!window.location.hash) window.location.hash = '/';
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = useCallback((path: string) => {
    window.location.hash = path;
    window.scrollTo(0, 0);
  }, []);

  return (
    <RouterContext.Provider value={{ route, navigate }}>{children}</RouterContext.Provider>
  );
}

export function useRouter() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useRouter must be used within RouterProvider');
  return ctx;
}

// Match a path pattern like "/posts/:slug" against actual path
export function matchRoute(
  pattern: string,
  path: string
): { match: boolean; params: Record<string, string> } {
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = path.split('/').filter(Boolean);

  if (patternParts.length !== pathParts.length) return { match: false, params: {} };

  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      params[patternParts[i].slice(1)] = decodeURIComponent(pathParts[i]);
    } else if (patternParts[i] !== pathParts[i]) {
      return { match: false, params: {} };
    }
  }
  return { match: true, params };
}
