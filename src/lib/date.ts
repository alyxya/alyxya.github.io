const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
	year: 'numeric',
	month: 'long',
	day: 'numeric',
	timeZone: 'UTC'
});

export const formatDate = (value: string) => {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

	const parsed = new Date(`${value}T00:00:00Z`);
	if (Number.isNaN(parsed.getTime())) return value;

	return DATE_FORMATTER.format(parsed);
};
