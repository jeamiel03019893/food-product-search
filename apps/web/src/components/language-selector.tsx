"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LANGUAGE_LABELS, SUPPORTED_LANGUAGES } from "@/types/language.types";
import { useTranslation } from "@/i18n/language-provider";

import type { SupportedLanguage } from "@/types/language.types";

export const LanguageSelector = () => {
  const { t, language, setLanguage } = useTranslation();

  return (
    <Select
      value={language}
      onValueChange={(next) => setLanguage(next as SupportedLanguage)}
    >
      <SelectTrigger className="w-40" aria-label={t("language.ariaLabel")}>
        <SelectValue>
          {(lang: SupportedLanguage) => LANGUAGE_LABELS[lang] ?? lang}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {SUPPORTED_LANGUAGES.map((lang) => (
          <SelectItem key={lang} value={lang}>
            {LANGUAGE_LABELS[lang]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
