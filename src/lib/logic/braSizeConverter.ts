import type { Region } from '../i18n';
import { cm } from './measurements';
import type { Measurement } from './measurements';
import { REGION_CONFIGS } from './regionConfigs';

export { Measurement, cm, inch } from './measurements';
export { getRegionBrand } from './regionConfigs';

export interface BraSize {
	band: number;
	cup: string;
}

export interface SizeRange {
	min: Measurement;
	max: Measurement;
	median: Measurement;
}

const DEFAULT_BAND_MIN_UNDERBUST = cm(30);
const DEFAULT_BAND_MAX_UNDERBUST = cm(200);

export function getCupOptions(region: Region, maxCups: number = 100): string[] {
	const config = REGION_CONFIGS[region];
	const cups: string[] = [];
	const seen = new Set<string>();
	const generationStart = config.cupGenerationStart ?? config.firstCupThreshold;

	for (let i = 0; i < maxCups; i++) {
		const diff = generationStart.add(config.cupStep.multiply(i));
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

export function cupToBustRange(band: number, cup: string, region: Region): SizeRange {
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
	const baseMeasurement = config.useBandForDifference ? bandMeasurement : underbust;
	const difference = bust.subtract(baseMeasurement);
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

export function getBandOptions(
	region: Region,
	minUnderbust?: Measurement,
	maxUnderbust?: Measurement
): number[] {
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

		if (
			bandMeasurement.toCm() >= min.toCm() &&
			bandMeasurement.toCm() <= max.toCm() &&
			!seenBands.has(band)
		) {
			bands.push(band);
			seenBands.add(band);
		}

		currentUnderbust = currentUnderbust.add(step);
	}

	return bands.sort((a, b) => a - b);
}
