import { useEffect, useState } from 'react';

export type Branding = {
  appName: string;         // App display name used in headers
  adminName: string;       // Admin shell name
  pageTitle?: string;      // Browser tab title override
  logoText: string;        // Fallback initials in logo badge
  logoUrl?: string;        // Optional data URL for custom logo
  faviconUrl?: string;     // Optional data URL for custom favicon
};

const STORAGE_KEY = 'branding';

export function getDefaultBranding(): Branding {
  return {
    appName: 'FaceID',
    adminName: 'FaceID Admin',
    pageTitle: 'FaceID',
    logoText: 'FI',
    logoUrl: undefined,
    faviconUrl: undefined,
  };
}

export function loadBranding(): Branding {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultBranding();
    const parsed = JSON.parse(raw);
    return { ...getDefaultBranding(), ...parsed } as Branding;
  } catch {
    return getDefaultBranding();
  }
}

export function saveBranding(branding: Branding): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(branding));
  // Notify other tabs/components
  window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY, newValue: JSON.stringify(branding) }));
}

export function useBranding() {
  const [branding, setBranding] = useState<Branding>(loadBranding());

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setBranding(loadBranding());
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const updateBranding = (next: Partial<Branding>) => {
    const merged = { ...branding, ...next } as Branding;
    setBranding(merged);
    saveBranding(merged);
  };

  return { branding, updateBranding };
}

// Apply favicon and title to document based on current branding
export function useApplyBranding() {
  const { branding } = useBranding();

  useEffect(() => {
    // Title
    const title = branding.pageTitle || branding.appName || 'App';
    if (typeof document !== 'undefined') {
      document.title = title;
    }

    // Favicon
    if (typeof document !== 'undefined') {
      const ensureLink = () => {
        let link = document.querySelector("link[rel='icon']") as HTMLLinkElement | null;
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.head.appendChild(link);
        }
        return link;
      };
      if (branding.faviconUrl) {
        const link = ensureLink();
        link.href = branding.faviconUrl;
      }
    }
  }, [branding]);
}


