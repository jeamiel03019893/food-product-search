"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { dictionaries, getByPath } from "./dictionary";

import type { ReactNode } from "react";
import type { DictionaryKey } from "./dictionary";
import type { SupportedLanguage } from "@/types/language.types";

interface LanguageContextValue {
  language: SupportedLanguage;
  setLanguage: (next: SupportedLanguage) => void;
  switchingLanguage: boolean;
  notifyLanguageApplied: () => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

// Replaces "{varName}" tokens in a resolved dictionary string with the
// given values — the only interpolation this dictionary needs (e.g.
// "{interval} Subscription", "Page {page} of {pageCount}").
const interpolate = (template: string, vars?: Record<string, string>): string => {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, token: string) =>
    Object.prototype.hasOwnProperty.call(vars, token) ? vars[token] : match,
  );
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>("en");
  const [switchingLanguage, setSwitchingLanguage] = useState(false);

  const setLanguage = useCallback((next: SupportedLanguage) => {
    setLanguageState((current) => {
      if (current === next) return current;
      setSwitchingLanguage(true);
      return next;
    });
  }, []);

  const notifyLanguageApplied = useCallback(() => {
    setSwitchingLanguage(false);
  }, []);

  return (
    <LanguageContext.Provider
      value={{ language, setLanguage, switchingLanguage, notifyLanguageApplied }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }

  const t = useCallback(
    (key: DictionaryKey, vars?: Record<string, string>): string => {
      const dict = dictionaries[ctx.language];
      const resolved = getByPath(dict, key);
      // Fall back to English if this language's dictionary somehow
      // resolved to the raw key (shouldn't happen given the compile-time
      // check on Dictionary, but never show a raw dot-path in the UI).
      const value = resolved === key ? getByPath(dictionaries.en, key) : resolved;
      return interpolate(value, vars);
    },
    [ctx.language],
  );

  return {
    t,
    language: ctx.language,
    setLanguage: ctx.setLanguage,
    switchingLanguage: ctx.switchingLanguage,
    notifyLanguageApplied: ctx.notifyLanguageApplied,
  };
};
