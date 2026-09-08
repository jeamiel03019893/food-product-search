import { en } from './translations/en';
import { de } from './translations/de';
import { fr } from './translations/fr';

import type { SupportedLanguage } from '@/types/language.types';

// `en` uses `as const` so its own leaf values are string *literal*
// types — useful for precision, but it means `typeof en` on its own
// would require every other language's text to literally equal the
// English text. Widen every leaf to plain `string` while preserving
// the nested key structure, so `Dictionary` enforces "same keys" (via
// TypeScript's excess/missing property checking on object literals)
// without also enforcing "same text".
type Widen<T> = T extends string ? string : { [K in keyof T]: Widen<T[K]> };

export type Dictionary = Widen<typeof en>;

type DotPaths<T, Prefix extends string = ''> = {
	[K in keyof T & string]: T[K] extends string
		? `${Prefix}${K}`
		: DotPaths<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

export type DictionaryKey = DotPaths<Dictionary>;

// Resolves a dot-separated path (e.g. "subscription.interval.month")
// against a Dictionary at runtime. The path is guaranteed valid by
// DictionaryKey at every call site, so an unresolved lookup here means
// a translation file's structure has drifted from `en` despite the
// type check — return the raw key rather than throwing, so a UI bug
// surfaces as visibly-wrong text instead of a crash.
export const getByPath = (dict: Dictionary, key: DictionaryKey): string => {
	const value = key
		.split('.')
		.reduce<unknown>(
			(node, segment) =>
				node && typeof node === 'object'
					? (node as Record<string, unknown>)[segment]
					: undefined,
			dict,
		);
	return typeof value === 'string' ? value : key;
};

export const dictionaries: Record<SupportedLanguage, Dictionary> = {
	en,
	de,
	fr,
};
