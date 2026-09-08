export const readString = (value: unknown): string | null => {
	return typeof value === 'string' && value.trim().length > 0 ? value : null;
};

export const toCamelCase = (str: string) => {
	return str
		.toLowerCase()
		.replace(/[_-]+(.)/g, (_, chr) => chr.toUpperCase());
};
