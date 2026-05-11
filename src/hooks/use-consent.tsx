import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const POLICY_VERSION = "1.0";
export const CONSENT_CATEGORIES = ["necessary", "analytics", "marketing", "personalization"] as const;
export type ConsentCategory = (typeof CONSENT_CATEGORIES)[number];
export type ConsentMap = Record<ConsentCategory, boolean>;

const STORAGE_KEY = "musren_consent_v1";

type StoredConsent = { version: string; choices: ConsentMap; ts: number };

const DEFAULT: ConsentMap = {
  necessary: true,
  analytics: false,
  marketing: false,
  personalization: false,
};

export const ACCEPT_ALL: ConsentMap = {
  necessary: true,
  analytics: true,
  marketing: true,
  personalization: true,
};

function readLocal(): StoredConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredConsent;
  } catch { return null; }
}

function writeLocal(choices: ConsentMap) {
  if (typeof window === "undefined") return;
  const payload: StoredConsent = { version: POLICY_VERSION, choices, ts: Date.now() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

interface ConsentContextValue {
  ready: boolean;
  needsPrompt: boolean;
  choices: ConsentMap;
  policyVersion: string;
  save: (choices: ConsentMap, source?: string) => Promise<void>;
  withdraw: () => Promise<void>;
  reopenBanner: () => void;
}

const ConsentContext = createContext<ConsentContextValue | undefined>(undefined);

export function ConsentProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [choices, setChoices] = useState<ConsentMap>(DEFAULT);
  const [needsPrompt, setNeedsPrompt] = useState(false);
  const [ready, setReady] = useState(false);

  // Hydrate from localStorage immediately
  useEffect(() => {
    const local = readLocal();
    if (local && local.version === POLICY_VERSION) {
      setChoices({ ...DEFAULT, ...local.choices });
      setNeedsPrompt(false);
    } else {
      setNeedsPrompt(true);
    }
    setReady(true);
  }, []);

  // When user logs in, sync DB → local. DB is source of truth for logged-in users.
  useEffect(() => {
    if (authLoading || !user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("current_user_consents")
        .select("category, granted, policy_version")
        .eq("user_id", user.id);
      if (cancelled) return;
      if (data && data.length > 0) {
        const versionsOk = data.every((r) => r.policy_version === POLICY_VERSION);
        if (versionsOk) {
          const merged: ConsentMap = { ...DEFAULT };
          for (const r of data) {
            merged[r.category as ConsentCategory] = !!r.granted;
          }
          merged.necessary = true;
          setChoices(merged);
          writeLocal(merged);
          setNeedsPrompt(false);
          return;
        }
      }
      // No DB record (or stale version): if local already covers current version, persist it to DB silently.
      const local = readLocal();
      if (local && local.version === POLICY_VERSION) {
        await persist(local.choices, "sync");
        setNeedsPrompt(false);
      } else {
        setNeedsPrompt(true);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const persist = useCallback(async (next: ConsentMap, source: string) => {
    if (!user) return;
    const items = CONSENT_CATEGORIES.map((c) => ({ category: c, granted: next[c] }));
    await supabase.rpc("record_user_consents", {
      _items: items,
      _policy_version: POLICY_VERSION,
      _source: source,
    });
  }, [user]);

  const save = useCallback(async (next: ConsentMap, source = "banner") => {
    const sanitized: ConsentMap = { ...next, necessary: true };
    setChoices(sanitized);
    writeLocal(sanitized);
    setNeedsPrompt(false);
    if (user) await persist(sanitized, source);
  }, [user, persist]);

  const withdraw = useCallback(async () => {
    const next: ConsentMap = { ...DEFAULT };
    await save(next, "withdraw");
    setNeedsPrompt(true);
  }, [save]);

  const reopenBanner = useCallback(() => setNeedsPrompt(true), []);

  return (
    <ConsentContext.Provider value={{ ready, needsPrompt, choices, policyVersion: POLICY_VERSION, save, withdraw, reopenBanner }}>
      {children}
    </ConsentContext.Provider>
  );
}

export function useConsent() {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error("useConsent must be used within ConsentProvider");
  return ctx;
}
