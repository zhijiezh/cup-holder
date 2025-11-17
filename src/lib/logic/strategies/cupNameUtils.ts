function extendBeyondZ(index: number, baseArrayLength: number): string {
	const beyondIndex = index - baseArrayLength;
	const letterIndex = (beyondIndex % 26) + 1;
	const number = Math.floor(beyondIndex / 26) + 1;
	const letter = String.fromCharCode(64 + letterIndex);
	return `${number}${letter}`;
}

export function generateCupName(index: number, baseArray: string[]): string {
	if (index < baseArray.length) {
		return baseArray[index];
	}
	return extendBeyondZ(index, baseArray.length);
}

export function parseExtendedCupName(cup: string, baseArray: string[]): number {
	const baseIndex = baseArray.indexOf(cup);
	if (baseIndex !== -1) {
		return baseIndex;
	}

	const match = cup.match(/^(\d+)([A-Z]+)$/);
	if (match) {
		const letterIndex = match[2].charCodeAt(0) - 64;
		const number = parseInt(match[1]);
		return baseArray.length + (number - 1) * 26 + letterIndex - 1;
	}

	return 0;
}

export function parseCupName(cup: string, baseArray: string[]): number {
	return parseExtendedCupName(cup, baseArray);
}
