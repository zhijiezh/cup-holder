import { cm, inch, Measurement } from '../measurements';

export interface BandStrategy {
	bandStep: Measurement;
	bandStart?: number;
	bandToMeasurement: (band: number) => Measurement;
	measurementToBand: (underbust: Measurement) => number;
}

interface MetricBandStrategyOptions {
	stepCm: number;
	bandStart?: number;
}

export function createMetricBandStrategy({
	stepCm,
	bandStart
}: MetricBandStrategyOptions): BandStrategy {
	return {
		bandStep: cm(stepCm),
		bandStart,
		bandToMeasurement: (band: number) => cm(band),
		measurementToBand: (underbust: Measurement) => {
			const underbustCm = underbust.toCm();
			return Math.round(underbustCm / stepCm) * stepCm;
		}
	};
}

interface InchBandStrategyOptions {
	bandStart?: number;
}

export function createModernInchBandStrategy({
	bandStart
}: InchBandStrategyOptions = {}): BandStrategy {
	return {
		bandStep: inch(2),
		bandStart,
		bandToMeasurement: (band: number) => inch(band),
		measurementToBand: (underbust: Measurement) => {
			const underbustInch = underbust.toInch();
			return Math.ceil(underbustInch / 2) * 2;
		}
	};
}

export function createClassicInchBandStrategy({
	bandStart
}: InchBandStrategyOptions = {}): BandStrategy {
	return {
		bandStep: inch(2),
		bandStart,
		bandToMeasurement: (band: number) => inch(band),
		measurementToBand: (underbust: Measurement) => {
			const underbustInch = Math.round(underbust.toInch());
			const addInches = underbustInch % 2 === 0 ? 4 : 5;
			return underbustInch + addInches;
		}
	};
}
