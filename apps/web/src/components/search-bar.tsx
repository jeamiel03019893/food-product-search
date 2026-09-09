"use client";

import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/i18n/language-provider";
import { useRecentSearches } from "@/hooks/use-recent-searches";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

export const SearchBar = ({ value, onChange, onSubmit }: SearchBarProps) => {
  const { t } = useTranslation();
  const { data: recentSearches } = useRecentSearches();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const trimmed = value.trim().toLowerCase();
  const suggestions =
    trimmed.length > 0
      ? (recentSearches ?? []).filter((entry) =>
          entry.searchTerm.toLowerCase().includes(trimmed),
        )
      : [];
  const showDropdown = dropdownOpen && suggestions.length > 0;

  // Close on outside click — the dropdown isn't inside the <form>'s own
  // focus/blur chain in a way a plain onBlur could reliably distinguish
  // from "focus moved to one of the suggestion buttons".
  useEffect(() => {
    if (!showDropdown) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [showDropdown]);

  const selectSuggestion = (searchTerm: string) => {
    onChange(searchTerm);
    setDropdownOpen(false);
  };

  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim().length > 0) onSubmit();
      }}
    >
      <div ref={containerRef} className="relative max-w-md flex-1">
        <Input
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setDropdownOpen(true);
            // Reset here, at the keystroke itself, rather than in an
            // effect watching the derived filtered list — an old
            // highlighted index would otherwise point past the end of
            // a freshly-narrowed suggestion list for one extra render.
            setHighlightedIndex(-1);
          }}
          onFocus={() => setDropdownOpen(true)}
          onKeyDown={(e) => {
            if (!showDropdown) return;

            if (e.key === "ArrowDown") {
              e.preventDefault();
              setHighlightedIndex((i) => Math.min(i + 1, suggestions.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setHighlightedIndex((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter" && highlightedIndex >= 0) {
              e.preventDefault();
              selectSuggestion(suggestions[highlightedIndex].searchTerm);
            } else if (e.key === "Escape") {
              setDropdownOpen(false);
            }
          }}
          placeholder={t("search.placeholder")}
          aria-label={t("search.ariaLabel")}
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls="recent-searches-listbox"
          aria-autocomplete="list"
          autoComplete="off"
        />

        {showDropdown && (
          <ul
            id="recent-searches-listbox"
            role="listbox"
            aria-label={t("search.recentSearchesLabel")}
            className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-border bg-popover py-1 shadow-md"
          >
            {suggestions.map((entry, index) => (
              <li key={entry.searchTerm} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={index === highlightedIndex}
                  className={`w-full px-3 py-1.5 text-left text-sm ${
                    index === highlightedIndex
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent hover:text-accent-foreground"
                  }`}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onClick={() => selectSuggestion(entry.searchTerm)}
                >
                  {entry.searchTerm}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Button type="submit" disabled={value.trim().length === 0}>
        <Search />
        {t("search.submit")}
      </Button>
    </form>
  );
};
