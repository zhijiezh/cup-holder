let idCounter = 0;

export function createComponentId(prefix = 'field'): string {
	idCounter += 1;
	return `${prefix}-${idCounter}`;
}
