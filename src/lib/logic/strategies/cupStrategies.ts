import { cm, inch, Measurement } from '../measurements';
import { generateCupName, parseCupName } from './cupNameUtils';

export interface CupStrategy {
	measurementToCupName: (difference: Measurement, cupNames: string[]) => string;
	cupNameToMeasurement: (cup: string, cupNames: string[]) => Measurement;
}

interface LinearCupStrategyOptions {
	firstCupThreshold: Measurement;
	cupStep: Measurement;
	belowFirstCupName: string;
	belowFirstCupValue: Measurement;
}

function toUnitValue(value: Measurement, useInches: boolean): number {
	return useInches ? value.toInch() : value.toCm();
}

function fromUnitValue(value: number, useInches: boolean): Measurement {
	return useInches ? inch(value) : cm(value);
}

export function createLinearCupStrategy(options: LinearCupStrategyOptions): CupStrategy {
	const useInches = options.firstCupThreshold.unit === 'inch';
	const thresholdValue = toUnitValue(options.firstCupThreshold, useInches);
	const stepValue = toUnitValue(options.cupStep, useInches);
	const belowValue = toUnitValue(options.belowFirstCupValue, useInches);

	return {
		measurementToCupName: (difference: Measurement, cupNames: string[]) => {
			const diffValue = toUnitValue(difference, useInches);
			if (diffValue < thresholdValue) {
				return options.belowFirstCupName;
			}
			const index = Math.floor((diffValue - thresholdValue) / stepValue) + 1;
			return generateCupName(index, cupNames);
		},
		cupNameToMeasurement: (cup: string, cupNames: string[]) => {
			const index = parseCupName(cup, cupNames);
			if (index === 0) {
				return fromUnitValue(belowValue, useInches);
			}
			return fromUnitValue(thresholdValue + (index - 1) * stepValue, useInches);
		}
	};
}
