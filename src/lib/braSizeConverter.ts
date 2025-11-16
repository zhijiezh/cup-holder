import type { Region } from './i18n';

export interface BraSize {
	band: number; // 下胸围对应的尺码（如32, 34, 36等）
	cup: string; // 罩杯（如A, B, C, D等）
}

export interface SizeRange {
	min: number;
	max: number;
	median: number;
}

/**
 * 根据下胸围（cm）转换为不同地区的band尺码
 */
export function underbustToBand(underbust: number, region: Region): number {
	// 中国和美国的尺码系统类似
	if (region === 'CN' || region === 'US') {
		// 下胸围范围对应band尺码
		// 70cm = 32, 75cm = 34, 80cm = 36, 85cm = 38, 90cm = 40
		if (underbust < 72.5) return 30;
		if (underbust < 77.5) return 32;
		if (underbust < 82.5) return 34;
		if (underbust < 87.5) return 36;
		if (underbust < 92.5) return 38;
		if (underbust < 97.5) return 40;
		return 42;
	} else {
		// 日本尺码系统（使用65, 70, 75, 80等）
		if (underbust < 72.5) return 60;
		if (underbust < 77.5) return 65;
		if (underbust < 82.5) return 70;
		if (underbust < 87.5) return 75;
		if (underbust < 92.5) return 80;
		if (underbust < 97.5) return 85;
		return 90;
	}
}

/**
 * 根据band尺码转换为下胸围范围（cm）
 */
export function bandToUnderbustRange(band: number, region: Region): SizeRange {
	if (region === 'CN' || region === 'US') {
		const ranges: { [key: number]: SizeRange } = {
			30: { min: 68, max: 72, median: 70 },
			32: { min: 73, max: 77, median: 75 },
			34: { min: 78, max: 82, median: 80 },
			36: { min: 83, max: 87, median: 85 },
			38: { min: 88, max: 92, median: 90 },
			40: { min: 93, max: 97, median: 95 },
			42: { min: 98, max: 102, median: 100 }
		};
		return ranges[band] || ranges[34];
	} else {
		// 日本
		const ranges: { [key: number]: SizeRange } = {
			60: { min: 58, max: 62, median: 60 },
			65: { min: 63, max: 67, median: 65 },
			70: { min: 68, max: 72, median: 70 },
			75: { min: 73, max: 77, median: 75 },
			80: { min: 78, max: 82, median: 80 },
			85: { min: 83, max: 87, median: 85 },
			90: { min: 88, max: 92, median: 90 }
		};
		return ranges[band] || ranges[70];
	}
}

/**
 * 根据上胸围和下胸围的差值计算罩杯
 */
export function calculateCup(difference: number, region: Region): string {
	// 罩杯计算（差值，单位：cm）
	// A: 7.5-10, B: 10-12.5, C: 12.5-15, D: 15-17.5, E: 17.5-20, F: 20-22.5, G: 22.5+
	const cupSizes = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
	
	if (difference < 7.5) return 'AA';
	if (difference >= 7.5 && difference < 10) return 'A';
	if (difference >= 10 && difference < 12.5) return 'B';
	if (difference >= 12.5 && difference < 15) return 'C';
	if (difference >= 15 && difference < 17.5) return 'D';
	if (difference >= 17.5 && difference < 20) return 'E';
	if (difference >= 20 && difference < 22.5) return 'F';
	if (difference >= 22.5 && difference < 25) return 'G';
	if (difference >= 25 && difference < 27.5) return 'H';
	if (difference >= 27.5 && difference < 30) return 'I';
	return 'J';
}

/**
 * 根据罩杯字母计算对应的上胸围范围
 */
export function cupToBustRange(
	band: number,
	cup: string,
	underbust: number,
	region: Region
): SizeRange {
	const cupIndex = ['AA', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].indexOf(cup);
	if (cupIndex === -1) {
		return { min: underbust, max: underbust + 10, median: underbust + 5 };
	}

	// 每个罩杯大约增加2.5cm
	const baseDiff = cupIndex * 2.5 + 7.5;
	const minDiff = baseDiff - 1.25;
	const maxDiff = baseDiff + 1.25;
	const medianDiff = baseDiff;

	return {
		min: underbust + minDiff,
		max: underbust + maxDiff,
		median: underbust + medianDiff
	};
}

/**
 * 从上下胸围计算完整的bra尺码
 */
export function calculateBraSize(
	underbust: number,
	bust: number,
	region: Region
): BraSize {
	const band = underbustToBand(underbust, region);
	const difference = bust - underbust;
	const cup = calculateCup(difference, region);
	return { band, cup };
}

/**
 * 从band和cup计算对应的上下胸围中位数
 */
export function braSizeToMeasurements(
	band: number,
	cup: string,
	region: Region
): { underbust: number; bust: number } {
	const underbustRange = bandToUnderbustRange(band, region);
	const bustRange = cupToBustRange(band, cup, underbustRange.median, region);
	return {
		underbust: underbustRange.median,
		bust: bustRange.median
	};
}

