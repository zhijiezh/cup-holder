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
 * 罩杯计算参数
 */
interface CupCalculation {
	baseDifference: number; // 基础差值
	stepSize: number; // 步进大小
	tolerance: number; // 容差范围
	aaDifference?: number; // AA 的特殊差值（如果不同）
}

/**
 * 各地区尺码系统配置（数学化）
 */
interface RegionConfig {
	// band 尺码系统参数
	bandStart: number; // 起始 band 尺码（显示值）
	bandStep: number; // band 尺码之间的步进（显示值）
	bandMinUnderbust: number; // 最小下胸围（cm），用于生成 band 选项
	bandMaxUnderbust: number; // 最大下胸围（cm），用于生成 band 选项
	bandToCm: (band: number) => number; // 将 band 尺码转换为下胸围中位数（cm）
	cmToBand: (underbust: number) => number; // 将下胸围（cm）转换为 band 尺码
	bandStepInCm: number; // band 步进转换为 cm
	// 罩杯系统
	cupSystem: 'standard' | 'uk'; // 标准系统或英国系统
	cupCalculation: CupCalculation; // 罩杯计算参数
}

// UK 罩杯映射表（索引 -> 名称）
const UK_CUP_MAPPING: Record<number, string> = {
	1: 'A', 2: 'B', 3: 'C', 4: 'D', 5: 'DD',
	6: 'E', 7: 'F', 8: 'FF', 9: 'G', 10: 'GG',
	11: 'H', 12: 'HH', 13: 'J', 14: 'JJ',
	15: 'K', 16: 'KK', 17: 'L', 18: 'LL',
	19: 'M', 20: 'MM', 21: 'N', 22: 'NN',
	23: 'O', 24: 'OO', 25: 'P', 26: 'PP'
};

// UK 罩杯反向映射表（名称 -> 索引）
const UK_CUP_REVERSE_MAPPING: Record<string, number> = Object.fromEntries(
	Object.entries(UK_CUP_MAPPING).map(([k, v]) => [v, parseInt(k)])
);

// 共享的配置常量
const SHARED_CONFIG = {
	bandMinUnderbust: 30,
	bandMaxUnderbust: 200
};

// 创建 US/UK 共享的转换函数
// 标准转换：band 28=60cm, 30=65cm, 32=70cm, 34=75cm, 36=80cm...
const         createInchBasedBandConverter = (bandStart: number, baseCm: number) => ({
	bandToCm: (band: number) => baseCm + (band - bandStart) * 2.5,
	cmToBand: (underbust: number) => {
		// 反向计算：bandToCm(band) = baseCm + (band - bandStart) * 2.5
		// 所以：band = bandStart + (underbust - baseCm) / 2.5
		const diff = underbust - baseCm;
		const calculatedBand = bandStart + Math.round(diff / 2.5);
		// 确保是偶数（US/UK band都是偶数）
		return calculatedBand % 2 === 0 ? calculatedBand : calculatedBand + 1;
	}
});

// 创建 cm 基础的转换函数
const createCmBasedBandConverter = (step: number) => ({
	bandToCm: (band: number) => band,
	cmToBand: (underbust: number) => Math.round(underbust / step) * step
});

const REGION_CONFIGS: Record<Region, RegionConfig> = {
	// 中国：使用 70, 75, 80, 85, 90 等（cm 为基础，步进 5cm）
	CN: {
		bandStart: 70,
		bandStep: 5,
		...SHARED_CONFIG,
		...createCmBasedBandConverter(5),
		bandStepInCm: 5,
		cupSystem: 'standard',
		cupCalculation: {
			baseDifference: 10, // A 的起始差值（12cm，但为了计算方便用10）
			stepSize: 2, // 每个罩杯增加的差值（2cm）
			tolerance: 1, // 每个罩杯的容差范围（±1cm）
			aaDifference: 7.5 // AA 的特殊差值
		}
	},
	// 美国：使用 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48... 等（英寸为基础，步进 2 英寸）
	// 标准转换：band 28=60cm, 30=65cm, 32=70cm, 34=75cm, 36=80cm...
	US: {
		bandStart: 28,
		bandStep: 2,
		...SHARED_CONFIG,
		...createInchBasedBandConverter(28, 60), // band 28 对应 60cm，band 32 对应 70cm
		bandStepInCm: 5, // 2 英寸 = 5cm
		cupSystem: 'standard',
		cupCalculation: {
			baseDifference: -2.54, // AA 的起始差值（-1 inch）
			stepSize: 2.54, // 每个罩杯增加的差值（1 inch = 2.54cm）
			tolerance: 1.27 // 每个罩杯的容差范围（±0.5 inch）
		}
	},
	// 日本：使用 60, 65, 70, 75, 80, 85, 90, 95, 100 等（cm 为基础，步进 5cm）
	JP: {
		bandStart: 60,
		bandStep: 5,
		...SHARED_CONFIG,
		...createCmBasedBandConverter(5),
		bandStepInCm: 5,
		cupSystem: 'standard',
		cupCalculation: {
			baseDifference: 10, // A 的起始差值（12cm，但为了计算方便用10）
			stepSize: 2, // 每个罩杯增加的差值（2cm）
			tolerance: 1, // 每个罩杯的容差范围（±1cm）
			aaDifference: 7.5 // AA 的特殊差值
		}
	},
	// 英国：使用 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48... 等（和美国类似，但罩杯系统不同）
	// 标准转换：band 28=60cm, 30=65cm, 32=70cm, 34=75cm, 36=80cm...
	UK: {
		bandStart: 28,
		bandStep: 2,
		...SHARED_CONFIG,
		...createInchBasedBandConverter(28, 60), // band 28 对应 60cm，band 32 对应 70cm
		bandStepInCm: 5, // 2 英寸 = 5cm
		cupSystem: 'uk',
		cupCalculation: {
			baseDifference: -2.54, // AA 的起始差值（-1 inch）
			stepSize: 2.54, // 每个罩杯增加的差值（1 inch = 2.54cm）
			tolerance: 1.27 // 每个罩杯的容差范围（±0.5 inch）
		}
	}
};

/**
 * 生成标准罩杯名称（AA, A, B, C, ..., Z, 2A, 2B, ...）
 */
function generateStandardCupName(index: number): string {
	if (index === 0) return 'AA';
	
	// A-Z 对应索引 1-26
	if (index <= 26) {
		return String.fromCharCode(64 + index); // 65 是 'A'，所以 64+index
	}
	
	// Z 之后：2A, 2B, 2C, ...
	const letterIndex = ((index - 1) % 26) + 1;
	const number = Math.floor((index - 1) / 26) + 1;
	const letter = String.fromCharCode(64 + letterIndex);
	return `${number}${letter}`;
}

/**
 * 生成英国罩杯名称（AA, A, B, C, D, DD, E, F, FF, G, GG, H, HH, J, JJ, K, KK, ...）
 */
function generateUKCupName(index: number): string {
	if (index === 0) return 'AA';
	
	// 使用预定义的映射
	if (UK_CUP_MAPPING[index]) {
		return UK_CUP_MAPPING[index];
	}
	
	// 如果超出预定义范围，使用通用规则
	// 从索引 27 开始，使用数字+字母
	const baseIndex = index - 1;
	const letterIndex = (baseIndex % 26) + 1;
	const number = Math.floor(baseIndex / 26);
	const letter = String.fromCharCode(64 + letterIndex);
	
	// 检查是否需要双字母（某些字母需要双写）
	const needsDouble = ['D', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'O', 'P'].includes(letter);
	if (needsDouble && (baseIndex % 26) % 2 === 1) {
		return `${number}${letter}${letter}`;
	}
	
	return number > 0 ? `${number}${letter}` : letter;
}

/**
 * 根据索引获取罩杯名称（考虑不同系统）
 */
function getCupFromIndex(index: number, region: Region): string {
	if (index < 0) index = 0;
	
	const config = REGION_CONFIGS[region];
	return config.cupSystem === 'uk' 
		? generateUKCupName(index) 
		: generateStandardCupName(index);
}

/**
 * 解析数字+字母格式的罩杯（如 2A, 2B）
 */
function parseNumberedCup(cup: string): { number: number; letter: string } | null {
	const match = cup.match(/^(\d+)([A-Z]+)$/);
	if (!match) return null;
	
	return {
		number: parseInt(match[1]),
		letter: match[2]
	};
}

/**
 * 根据罩杯名称获取索引（考虑不同系统）
 */
function getCupIndex(cup: string, region: Region): number {
	const config = REGION_CONFIGS[region];
	
	// 特殊处理 AA
	if (cup === 'AA') return 0;
	
	if (config.cupSystem === 'uk') {
		// 英国系统：查找预定义的映射
		if (UK_CUP_REVERSE_MAPPING[cup]) {
			return UK_CUP_REVERSE_MAPPING[cup];
		}
		
		// 处理数字+字母的情况
		const parsed = parseNumberedCup(cup);
		if (parsed) {
			const letterIndex = parsed.letter.charCodeAt(0) - 64;
			return parsed.number * 26 + letterIndex;
		}
		
		// 单字母情况
		if (cup.length === 1 && /[A-Z]/.test(cup)) {
			return cup.charCodeAt(0) - 64;
		}
		
		return 0; // 默认返回 AA
	} else {
		// 标准系统
		const parsed = parseNumberedCup(cup);
		if (parsed) {
			const letterIndex = parsed.letter.charCodeAt(0) - 64;
			return parsed.number * 26 + letterIndex;
		}
		
		// 单字母情况（A-Z）
		if (cup.length === 1 && /[A-Z]/.test(cup)) {
			return cup.charCodeAt(0) - 64;
		}
		
		return 0; // 默认返回 AA
	}
}

/**
 * 根据地区获取可用的罩杯选项（动态生成）
 */
export function getCupOptions(region: Region, maxCups: number = 100): string[] {
	const cups: string[] = [];
	for (let i = 0; i < maxCups; i++) {
		cups.push(getCupFromIndex(i, region));
	}
	return cups;
}

/**
 * 根据下胸围（cm）转换为不同地区的band尺码
 */
export function underbustToBand(underbust: number, region: Region): number {
	return REGION_CONFIGS[region].cmToBand(underbust);
}

/**
 * 根据band尺码转换为下胸围范围（cm）
 */
export function bandToUnderbustRange(band: number, region: Region): SizeRange {
	const config = REGION_CONFIGS[region];
	const medianUnderbust = config.bandToCm(band);
	const range = config.bandStepInCm / 2;
	
	return {
		min: medianUnderbust - range,
		max: medianUnderbust + range,
		median: medianUnderbust
	};
}

/**
 * 根据上胸围和下胸围的差值计算罩杯（函数式实现）
 */
export function calculateCup(difference: number, region: Region): string {
	const config = REGION_CONFIGS[region];
	const { baseDifference, stepSize, aaDifference } = config.cupCalculation;
	
	// 处理 AA 的情况
	const aaThreshold = aaDifference ?? baseDifference;
	if (difference < aaThreshold) {
		return getCupFromIndex(0, region); // AA
	}
	
	// 计算罩杯索引
	let cupIndex: number;
	if (config.cupSystem === 'uk' || (config.cupSystem === 'standard' && region === 'US')) {
		// UK/US系统：索引直接对应差值
		cupIndex = Math.floor((difference - baseDifference) / stepSize);
	} else {
		// EU/标准系统：A从12cm开始
		cupIndex = Math.floor((difference - 10) / stepSize) + 1;
	}
	
	return getCupFromIndex(cupIndex, region);
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
	const config = REGION_CONFIGS[region];
	const cupIndex = getCupIndex(cup, region);
	const { baseDifference, stepSize, tolerance, aaDifference } = config.cupCalculation;
	
	if (cupIndex < 0) {
		// 如果找不到罩杯，返回默认范围
		return { min: underbust, max: underbust + 10, median: underbust + 5 };
	}
	
	// 计算基础差值
	let baseDiff: number;
	if (cupIndex === 0) {
		// AA 使用特殊差值
		baseDiff = aaDifference ?? baseDifference;
	} else if (config.cupSystem === 'uk' || region === 'US') {
		// UK/US系统：索引直接对应差值
		baseDiff = cupIndex * stepSize + baseDifference;
	} else {
		// EU/标准系统：A=12cm, B=14cm...
		baseDiff = 10 + (cupIndex - 1) * stepSize;
	}
	
	return {
		min: underbust + baseDiff - tolerance,
		max: underbust + baseDiff + tolerance,
		median: underbust + baseDiff
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

/**
 * 根据地区获取可用的 band 选项（动态生成，基于下胸围范围）
 */
export function getBandOptions(region: Region, minUnderbust?: number, maxUnderbust?: number): number[] {
	const config = REGION_CONFIGS[region];
	const min = minUnderbust ?? config.bandMinUnderbust;
	const max = maxUnderbust ?? config.bandMaxUnderbust;
	
	const bands: number[] = [];
	const seenBands = new Set<number>();
	
	// 从最小下胸围开始，生成所有可能的 band 尺码
	const step = 0.5; // 0.5cm 步进，确保不遗漏任何 band
	let currentUnderbust = min;
	
	while (currentUnderbust <= max) {
		const band = config.cmToBand(currentUnderbust);
		const bandCm = config.bandToCm(band);
		
		// 只添加在范围内的 band，且该 band 对应的下胸围在范围内
		if (bandCm >= min && bandCm <= max && !seenBands.has(band)) {
			bands.push(band);
			seenBands.add(band);
		}
		
		currentUnderbust += step;
	}
	
	// 排序
	return bands.sort((a, b) => a - b);
}
