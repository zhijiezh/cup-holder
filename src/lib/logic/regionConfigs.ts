import type { Region } from '../i18n';
import { cm, inch, Measurement } from './measurements';
import {
	createClassicInchBandStrategy,
	createMetricBandStrategy,
	createModernInchBandStrategy
} from './strategies/bandStrategies';
import { createLinearCupStrategy } from './strategies/cupStrategies';

export interface RegionConfig {
	// Band configuration
	bandStep: Measurement;
	bandStart?: number;
	bandToMeasurement: (band: number) => Measurement;
	measurementToBand: (underbust: Measurement) => number;

	// Cup configuration
	cupStep: Measurement;
	firstCupThreshold: Measurement;
	cupGenerationStart?: Measurement;
	cupNames: string[];
	measurementToCupName: (difference: Measurement, cupNames: string[]) => string;
	cupNameToMeasurement: (cup: string, cupNames: string[]) => Measurement;

	// Difference calculation: true = use band, false = use underbust
	useBandForDifference: boolean;

	// Brand name for display (optional)
	brand?: string;
}

const CN_CUP_NAMES = [
	'AA',
	'A',
	'B',
	'C',
	'D',
	'E',
	'F',
	'G',
	'H',
	'I',
	'J',
	'K',
	'L',
	'M',
	'N',
	'O',
	'P',
	'Q',
	'R',
	'S',
	'T',
	'U',
	'V',
	'W',
	'X',
	'Y',
	'Z'
];

const US_CUP_NAMES = [
	'AA',
	'A',
	'B',
	'C',
	'D',
	'DD',
	'DDD',
	'G',
	'H',
	'I',
	'J',
	'K',
	'L',
	'M',
	'N',
	'O',
	'P',
	'Q',
	'R',
	'S',
	'T',
	'U',
	'V',
	'W',
	'X',
	'Y',
	'Z'
];

const UK_CUP_NAMES = [
	'AA',
	'A',
	'B',
	'C',
	'D',
	'DD',
	'E',
	'F',
	'FF',
	'G',
	'GG',
	'H',
	'HH',
	'J',
	'JJ',
	'K',
	'KK',
	'L',
	'LL',
	'M',
	'MM',
	'N',
	'NN',
	'O',
	'OO',
	'P',
	'PP',
	'Q',
	'R',
	'S',
	'T',
	'U',
	'V',
	'W',
	'X',
	'Y',
	'Z'
];

const JP_CUP_NAMES = [
	'AAA',
	'AA',
	'A',
	'B',
	'C',
	'D',
	'E',
	'F',
	'G',
	'H',
	'I',
	'J',
	'K',
	'L',
	'M',
	'N',
	'O',
	'P',
	'Q',
	'R',
	'S',
	'T',
	'U',
	'V',
	'W',
	'X',
	'Y',
	'Z'
];

const metricFiveBand70 = createMetricBandStrategy({ stepCm: 5, bandStart: 70 });
const metricFiveBand65 = createMetricBandStrategy({ stepCm: 5, bandStart: 65 });
const modernInchBand = createModernInchBandStrategy({ bandStart: 28 });
const classicInchBand = createClassicInchBandStrategy({ bandStart: 28 });

const cnCupStrategy = createLinearCupStrategy({
	firstCupThreshold: cm(10),
	cupStep: cm(2.5),
	belowFirstCupName: 'AA',
	belowFirstCupValue: cm(7.5)
});

const jpCupStrategy = createLinearCupStrategy({
	firstCupThreshold: cm(6.5),
	cupStep: cm(2.5),
	belowFirstCupName: 'AAA',
	belowFirstCupValue: cm(5)
});

const inchCupStrategy = createLinearCupStrategy({
	firstCupThreshold: inch(-1),
	cupStep: inch(1),
	belowFirstCupName: 'AA',
	belowFirstCupValue: inch(-1)
});

export const REGION_CONFIGS: Record<Region, RegionConfig> = {
	CN: {
		...metricFiveBand70,
		cupStep: cm(2.5),
		firstCupThreshold: cm(10),
		cupGenerationStart: cm(7.5),
		cupNames: CN_CUP_NAMES,
		...cnCupStrategy,
		useBandForDifference: false,
		brand: 'Naitangpai'
	},
	US: {
		...modernInchBand,
		cupStep: inch(1),
		firstCupThreshold: inch(-1),
		cupNames: US_CUP_NAMES,
		...inchCupStrategy,
		useBandForDifference: true,
		brand: 'Victoria Secret'
	},
	US_CLASSIC: {
		...classicInchBand,
		cupStep: inch(1),
		firstCupThreshold: inch(-1),
		cupNames: US_CUP_NAMES,
		...inchCupStrategy,
		useBandForDifference: true,
		brand: 'Skims'
	},
	JP: {
		...metricFiveBand65,
		cupStep: cm(2.5),
		firstCupThreshold: cm(6.5),
		cupGenerationStart: cm(5),
		cupNames: JP_CUP_NAMES,
		...jpCupStrategy,
		useBandForDifference: false,
		brand: 'WACOAL'
	},
	UK: {
		...modernInchBand,
		cupStep: inch(1),
		firstCupThreshold: inch(-1),
		cupNames: UK_CUP_NAMES,
		...inchCupStrategy,
		useBandForDifference: true,
		brand: 'Curvy Kate'
	}
};

export function getRegionBrand(region: Region): string | undefined {
	return REGION_CONFIGS[region].brand;
}
