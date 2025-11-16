import type { Region } from './i18n';

export interface BraSize {
	band: number;
	cup: string;
}

export interface SizeRange {
	min: Measurement;
	max: Measurement;
	median: Measurement;
}

type Unit = 'cm' | 'inch';

const INCH_TO_CM = 2.54;
const CM_TO_INCH = 1 / 2.54;

export class Measurement {
	constructor(public value: number, public unit: Unit) {}

	toCm(): number {
		return this.unit === 'inch' ? this.value * INCH_TO_CM : this.value;
	}

	toInch(): number {
		return this.unit === 'cm' ? this.value * CM_TO_INCH : this.value;
	}

	add(other: Measurement): Measurement {
		if (this.unit === 'inch') {
			return new Measurement(this.value + other.toInch(), this.unit);
		}
		return new Measurement(this.value + other.toCm(), this.unit);
	}

	subtract(other: Measurement): Measurement {
		if (this.unit === 'inch') {
			return new Measurement(this.value - other.toInch(), this.unit);
		}
		return new Measurement(this.value - other.toCm(), this.unit);
	}

	multiply(factor: number): Measurement {
		return new Measurement(this.value * factor, this.unit);
	}

	divide(divisor: number): Measurement {
		return new Measurement(this.value / divisor, this.unit);
	}

	lessThan(other: Measurement): boolean {
		return this.toCm() < other.toCm();
	}

	equals(other: Measurement): boolean {
		return Math.abs(this.toCm() - other.toCm()) < 0.001;
	}
}

export function cm(value: number): Measurement {
	return new Measurement(value, 'cm');
}

export function inch(value: number): Measurement {
	return new Measurement(value, 'inch');
}

const DEFAULT_BAND_MIN_UNDERBUST = cm(30);
const DEFAULT_BAND_MAX_UNDERBUST = cm(200);

interface RegionConfig {
	// Band configuration
	bandStep: Measurement;
	bandStart?: number;
	bandToMeasurement: (band: number) => Measurement;
	measurementToBand: (underbust: Measurement) => number;
	
	// Cup configuration
	cupStep: Measurement;
	firstCupThreshold: Measurement;
	cupNames: string[];
	measurementToCupName: (difference: Measurement, cupNames: string[]) => string;
	cupNameToMeasurement: (cup: string, cupNames: string[]) => Measurement;
	
}

const CN_CUP_NAMES = ['AA', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

const US_CUP_NAMES = ['AA', 'A', 'B', 'C', 'D', 'DD', 'DDD', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

const UK_CUP_NAMES = ['AA', 'A', 'B', 'C', 'D', 'DD', 'E', 'F', 'FF', 'G', 'GG', 'H', 'HH', 'J', 'JJ', 'K', 'KK', 'L', 'LL', 'M', 'MM', 'N', 'NN', 'O', 'OO', 'P', 'PP', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

const JP_CUP_NAMES = ['AAA', 'AA', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

function extendBeyondZ(index: number, baseArrayLength: number): string {
	const beyondIndex = index - baseArrayLength;
	const letterIndex = (beyondIndex % 26) + 1;
	const number = Math.floor(beyondIndex / 26) + 1;
	const letter = String.fromCharCode(64 + letterIndex);
	return `${number}${letter}`;
}

function parseExtendedCupName(cup: string, baseArray: string[]): number {
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

function generateCupName(index: number, baseArray: string[]): string {
	if (index < baseArray.length) {
		return baseArray[index];
	}
	return extendBeyondZ(index, baseArray.length);
}

function parseCupName(cup: string, baseArray: string[]): number {
	return parseExtendedCupName(cup, baseArray);
}

function createInchBasedBandConverter() {
	return {
		bandToMeasurement: (band: number) => inch(band),
		measurementToBand: (underbust: Measurement) => {
			const underbustInch = Math.round(underbust.toInch());
			const addInches = underbustInch % 2 === 0 ? 4 : 5;
			return underbustInch + addInches;
		}
	};
}

function createCmBasedBandConverter(step: number) {
	return {
		bandToMeasurement: (band: number) => cm(band),
		measurementToBand: (underbust: Measurement) => {
			const underbustCm = underbust.toCm();
			return Math.round(underbustCm / step) * step;
		}
	};
}

const REGION_CONFIGS: Record<Region, RegionConfig> = {
	CN: {
		bandStep: cm(5),
		bandStart: 70,
		...createCmBasedBandConverter(5),
		cupStep: cm(2.5),
		firstCupThreshold: cm(7.5),
		cupNames: CN_CUP_NAMES,
		measurementToCupName: (diff: Measurement, cupNames: string[]) => {
			const diffCm = diff.toCm();
			if (diffCm < 10) {
				return 'AA';
			}
			const index = Math.floor((diffCm - 10) / 2.5) + 1;
			return generateCupName(index, cupNames);
		},
		cupNameToMeasurement: (cup: string, cupNames: string[]) => {
			const index = parseCupName(cup, cupNames);
			if (index === 0) {
				return cm(7.5);
			}
			return cm(10 + (index - 1) * 2.5);
		}
	},
	US: {
		bandStep: inch(2),
		bandStart: 28,
		...createInchBasedBandConverter(),
		cupStep: inch(1),
		firstCupThreshold: inch(-1),
		cupNames: US_CUP_NAMES,
		measurementToCupName: (diff: Measurement, cupNames: string[]) => {
			const diffInch = diff.toInch();
			if (diffInch < -1) {
				return 'AA';
			}
			const index = Math.max(0, Math.floor(diffInch + 1));
			return generateCupName(index, cupNames);
		},
		cupNameToMeasurement: (cup: string, cupNames: string[]) => {
			const index = parseCupName(cup, cupNames);
			return inch(index - 1);
		},
	},
	JP: {
		bandStep: cm(5),
		bandStart: 65,
		...createCmBasedBandConverter(5),
		cupStep: cm(2.5),
		firstCupThreshold: cm(5),
		cupNames: JP_CUP_NAMES,
		measurementToCupName: (diff: Measurement, cupNames: string[]) => {
			const diffCm = diff.toCm();
			if (diffCm < 5) {
				return 'AAA';
			}
			const index = Math.floor((diffCm - 5) / 2.5);
			return generateCupName(index, cupNames);
		},
		cupNameToMeasurement: (cup: string, cupNames: string[]) => {
			const index = parseCupName(cup, cupNames);
			return cm(5 + index * 2.5);
		}
	},
	UK: {
		bandStep: inch(2),
		bandStart: 28,
		...createInchBasedBandConverter(),
		cupStep: inch(1),
		firstCupThreshold: inch(-1),
		cupNames: UK_CUP_NAMES,
		measurementToCupName: (diff: Measurement, cupNames: string[]) => {
			const diffInch = diff.toInch();
			if (diffInch < -1) {
				return 'AA';
			}
			const index = Math.max(0, Math.floor(diffInch + 1));
			return generateCupName(index, cupNames);
		},
		cupNameToMeasurement: (cup: string, cupNames: string[]) => {
			const index = parseCupName(cup, cupNames);
			return inch(index - 1);
		}
	}
};

export function getCupOptions(region: Region, maxCups: number = 100): string[] {
	const config = REGION_CONFIGS[region];
	const cups: string[] = [];
	const seen = new Set<string>();
	
	for (let i = 0; i < maxCups; i++) {
		const diff = config.firstCupThreshold.add(config.cupStep.multiply(i));
		const cup = config.measurementToCupName(diff, config.cupNames);
		if (!seen.has(cup)) {
			cups.push(cup);
			seen.add(cup);
		}
	}
	
	return cups;
}

export function underbustToBand(underbust: Measurement, region: Region): number {
	return REGION_CONFIGS[region].measurementToBand(underbust);
}

export function bandToUnderbustRange(band: number, region: Region): SizeRange {
	const config = REGION_CONFIGS[region];
	const medianUnderbust = config.bandToMeasurement(band);
	const range = config.bandStep.divide(2);
	
	return {
		min: medianUnderbust.subtract(range),
		max: medianUnderbust.add(range),
		median: medianUnderbust
	};
}

export function calculateCup(difference: Measurement, region: Region): string {
	const config = REGION_CONFIGS[region];
	return config.measurementToCupName(difference, config.cupNames);
}

export function cupToBustRange(
	band: number,
	cup: string,
	region: Region
): SizeRange {
	const config = REGION_CONFIGS[region];
	const cupDiff = config.cupNameToMeasurement(cup, config.cupNames);
	const baseValue = config.bandToMeasurement(band);
	
	if (cupDiff.toCm() < 0) {
		const defaultDiff = cm(5);
		return { 
			min: baseValue, 
			max: baseValue.add(cm(10)), 
			median: baseValue.add(defaultDiff) 
		};
	}
	
	const tolerance = config.cupStep.divide(2);
	const medianBust = baseValue.add(cupDiff);
	
	return {
		min: medianBust.subtract(tolerance),
		max: medianBust.add(tolerance),
		median: medianBust
	};
}

export function calculateBraSize(
	underbust: Measurement,
	bust: Measurement,
	region: Region
): BraSize {
	const config = REGION_CONFIGS[region];
	const band = underbustToBand(underbust, region);
	const bandMeasurement = config.bandToMeasurement(band);
	const difference = bust.subtract(bandMeasurement);
	const cup = calculateCup(difference, region);
	return { band, cup };
}

export function braSizeToMeasurements(
	band: number,
	cup: string,
	region: Region
): { underbust: Measurement; bust: Measurement } {
	const underbustRange = bandToUnderbustRange(band, region);
	const bustRange = cupToBustRange(band, cup, region);
	return {
		underbust: underbustRange.median,
		bust: bustRange.median
	};
}

export function getBandOptions(region: Region, minUnderbust?: Measurement, maxUnderbust?: Measurement): number[] {
	const config = REGION_CONFIGS[region];
	const min = minUnderbust ?? DEFAULT_BAND_MIN_UNDERBUST;
	const max = maxUnderbust ?? DEFAULT_BAND_MAX_UNDERBUST;
	
	const bands: number[] = [];
	const seenBands = new Set<number>();
	
	const step = cm(0.5);
	let currentUnderbust = min;
	
	while (currentUnderbust.toCm() <= max.toCm()) {
		const band = config.measurementToBand(currentUnderbust);
		const bandMeasurement = config.bandToMeasurement(band);
		
		if (bandMeasurement.toCm() >= min.toCm() && bandMeasurement.toCm() <= max.toCm() && !seenBands.has(band)) {
			bands.push(band);
			seenBands.add(band);
		}
		
		currentUnderbust = currentUnderbust.add(step);
	}
	
	return bands.sort((a, b) => a - b);
}
