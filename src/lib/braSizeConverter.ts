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
 * 所有数值都按照该国家的单位存储（cm或inch）
 */
interface CupCalculation {
	useInches: boolean; // 是否使用英寸作为单位（false表示使用cm）
	firstCupThreshold: number; // 第一个罩杯的阈值（按该国家的单位，小于此值返回第一个罩杯）
	baseDifference: number; // 基础差值（按该国家的单位）
	stepSize: number; // 步进大小（按该国家的单位）
	tolerance: number; // 容差范围（按该国家的单位）
	usesAdjustedBand?: boolean; // 是否使用调整后的band值计算罩杯（US/UK系统）
	// 罩杯索引计算函数：从差值计算罩杯索引
	// difference的单位与config.useInches一致（true=英寸，false=厘米）
	// 如果未提供，使用默认公式：(difference - baseDifference) / stepSize
	cupIndexFromDifference?: (difference: number, config: CupCalculation) => number;
	// 罩杯差值计算函数：从罩杯索引计算差值（cm）
	// 如果未提供，使用默认公式：cupIndex * stepSize + baseDifference
	cupIndexToDifference?: (cupIndex: number, config: CupCalculation) => number;
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
 	cupCalculation: CupCalculation; // 罩杯计算参数
	// 罩杯名称生成器：从索引生成罩杯名称（如 0 -> 'AA', 1 -> 'A'）
	cupNameGenerator: (index: number) => string;
	// 罩杯名称解析器：从罩杯名称解析索引（如 'AA' -> 0, 'A' -> 1）
	cupNameParser: (cup: string) => number;
}

// ========== 基础罩杯生成器（标准ABCD系统） ==========

/**
 * 生成标准罩杯名称（AA, A, B, C, ..., Z, 2A, 2B, ...）
 * 这是基础系统，其他国家可以基于此扩展
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
 * 解析标准罩杯名称
 */
function parseStandardCupName(cup: string): number {
	if (cup === 'AA') return 0;
	
	// 解析数字+字母格式（如 2A, 2B）
	const match = cup.match(/^(\d+)([A-Z]+)$/);
	if (match) {
		const letterIndex = match[2].charCodeAt(0) - 64;
		return parseInt(match[1]) * 26 + letterIndex;
	}
	
	// 单字母情况（A-Z）
	if (cup.length === 1 && /[A-Z]/.test(cup)) {
		return cup.charCodeAt(0) - 64;
	}
	
	return 0; // 默认返回 AA
}

// ========== 美国罩杯生成器（DD, DDD系统） ==========

/**
 * 美国罩杯映射表（索引 -> 名称）
 * 根据表格：0"=AA, 1"=A, 2"=B, 3"=C, 4"=D, 5"=DD/E, 6"=DDD/F, 7"=DDDD/G, 8"=H, 9"=I...
 * 注意：某些尺寸有多个名称（如DD/E），我们使用第一个
 */
const US_CUP_MAPPING: Record<number, string> = {
	0: 'AA', 1: 'A', 2: 'B', 3: 'C', 4: 'D', 5: 'DD', 6: 'DDD',
	7: 'G', 8: 'H', 9: 'I', 10: 'J', 11: 'K', 12: 'L', 13: 'M',
	14: 'N', 15: 'O', 16: 'P', 17: 'Q', 18: 'R', 19: 'S', 20: 'T',
	21: 'U', 22: 'V', 23: 'W', 24: 'X', 25: 'Y', 26: 'Z'
};

// 美国罩杯反向映射表（名称 -> 索引）
const US_CUP_REVERSE_MAPPING: Record<string, number> = Object.fromEntries(
	Object.entries(US_CUP_MAPPING).map(([k, v]) => [v, parseInt(k)])
);

/**
 * 生成美国罩杯名称
 */
function generateUSCupName(index: number): string {
	// 使用预定义的映射
	if (US_CUP_MAPPING[index] !== undefined) {
		return US_CUP_MAPPING[index];
	}
	
	// 超出预定义范围，使用标准系统（2A, 2B...）
	return generateStandardCupName(index);
}

/**
 * 解析美国罩杯名称
 */
function parseUSCupName(cup: string): number {
	// 查找预定义的映射
	if (US_CUP_REVERSE_MAPPING[cup] !== undefined) {
		return US_CUP_REVERSE_MAPPING[cup];
	}
	
	// 回退到标准解析
	return parseStandardCupName(cup);
}

// ========== 英国罩杯生成器（DD, FF, GG系统） ==========

/**
 * 英国罩杯映射表（索引 -> 名称）
 */
const UK_CUP_MAPPING: Record<number, string> = {
	0: 'AA', 1: 'A', 2: 'B', 3: 'C', 4: 'D', 5: 'DD',
	6: 'E', 7: 'F', 8: 'FF', 9: 'G', 10: 'GG',
	11: 'H', 12: 'HH', 13: 'J', 14: 'JJ',
	15: 'K', 16: 'KK', 17: 'L', 18: 'LL',
	19: 'M', 20: 'MM', 21: 'N', 22: 'NN',
	23: 'O', 24: 'OO', 25: 'P', 26: 'PP'
};

// 英国罩杯反向映射表（名称 -> 索引）
const UK_CUP_REVERSE_MAPPING: Record<string, number> = Object.fromEntries(
	Object.entries(UK_CUP_MAPPING).map(([k, v]) => [v, parseInt(k)])
);

/**
 * 生成英国罩杯名称
 */
function generateUKCupName(index: number): string {
	// 使用预定义的映射
	if (UK_CUP_MAPPING[index] !== undefined) {
		return UK_CUP_MAPPING[index];
	}
	
	// 超出预定义范围，使用通用规则
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
 * 解析英国罩杯名称
 */
function parseUKCupName(cup: string): number {
	// 查找预定义的映射
	if (UK_CUP_REVERSE_MAPPING[cup] !== undefined) {
		return UK_CUP_REVERSE_MAPPING[cup];
	}
	
	// 回退到标准解析
	return parseStandardCupName(cup);
}

// ========== 日本罩杯生成器（AAA系统） ==========

/**
 * 生成日本罩杯名称（AAA, AA, A, B, C, ..., Z, 2A, 2B, ...）
 */
function generateJapaneseCupName(index: number): string {
	if (index === 0) return 'AAA';
	if (index === 1) return 'AA';
	
	// A-Z 对应索引 2-27
	if (index <= 27) {
		return String.fromCharCode(63 + index); // 64是'@'，65是'A'，所以63+index
	}
	
	// Z 之后：2A, 2B, 2C, ...
	const letterIndex = ((index - 2) % 26) + 1;
	const number = Math.floor((index - 2) / 26) + 1;
	const letter = String.fromCharCode(64 + letterIndex);
	return `${number}${letter}`;
}

/**
 * 解析日本罩杯名称
 */
function parseJapaneseCupName(cup: string): number {
	if (cup === 'AAA') return 0;
	if (cup === 'AA') return 1;
	
	// 解析数字+字母格式
	const match = cup.match(/^(\d+)([A-Z]+)$/);
	if (match) {
		const letterIndex = match[2].charCodeAt(0) - 64;
		return parseInt(match[1]) * 26 + letterIndex + 1; // +1因为AAA占用了0
	}
	
	// 单字母情况（A-Z）
	if (cup.length === 1 && /[A-Z]/.test(cup)) {
		return cup.charCodeAt(0) - 64 + 1; // +1因为AAA占用了0
	}
	
	return 0; // 默认返回 AAA
}

// 共享的配置常量
const SHARED_CONFIG = {
	bandMinUnderbust: 30,
	bandMaxUnderbust: 200
};

// 创建 US/UK 共享的转换函数
// 标准转换：band 28=60cm, 30=65cm, 32=70cm, 34=75cm, 36=80cm...
// 注意：band值本身代表调整后的值（用于计算罩杯），不是原始测量值
const createInchBasedBandConverter = (bandStart: number, baseCm: number) => ({
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

// 单位转换常量
const INCH_TO_CM = 2.54;
const CM_TO_INCH = 1 / 2.54;

/**
 * 将值从配置单位转换为cm
 */
function toCm(value: number, useInches: boolean): number {
	return useInches ? value * INCH_TO_CM : value;
}

/**
 * 将值从cm转换为配置单位
 */
function fromCm(value: number, useInches: boolean): number {
	return useInches ? value * CM_TO_INCH : value;
}

// 创建英寸基础的罩杯计算配置（US/UK共享）
// 英寸系统共性：步进1英寸，容差±0.5英寸，使用调整后的band值
const createInchBasedCupCalculation = (
	firstCupThreshold: number, // 第一个罩杯的阈值（英寸）
	baseDifference: number, // 基础差值（英寸）
	usesAdjustedBand: boolean = true
): CupCalculation => ({
	useInches: true,
	firstCupThreshold, // 英寸
	baseDifference, // 英寸
	stepSize: 1, // 1英寸
	tolerance: 0.5, // ±0.5英寸
	usesAdjustedBand
});

// 创建厘米基础的罩杯计算配置
const createCmBasedCupCalculation = (
	firstCupThreshold: number, // 第一个罩杯的阈值（cm）
	baseDifference: number, // 基础差值（cm）
	stepSize: number, // 步进大小（cm）
	tolerance: number // 容差范围（cm）
): CupCalculation => ({
	useInches: false,
	firstCupThreshold, // cm
	baseDifference, // cm
	stepSize, // cm
	tolerance // cm
});

// 创建 cm 基础的转换函数
const createCmBasedBandConverter = (step: number) => ({
	bandToCm: (band: number) => band,
	cmToBand: (underbust: number) => Math.round(underbust / step) * step
});

const REGION_CONFIGS: Record<Region, RegionConfig> = {
	// 中国：使用 70, 75, 80, 85, 90 等（cm 为基础，步进 5cm）
	// 使用标准罩杯系统（AA, A, B, C, D, E, F...）
	CN: {
		bandStart: 70,
		bandStep: 5,
		...SHARED_CONFIG,
		...createCmBasedBandConverter(5),
		bandStepInCm: 5,
		cupCalculation: {
			...createCmBasedCupCalculation(
				7.5, // 第一个罩杯（AA）的阈值：7.5cm以下
				10, // A的起始差值
				2.5, // 每个罩杯增加的差值：2cm
				1.25 // 容差范围：±1cm
			),
			// 标准系统：A从12cm开始，所以需要特殊处理
			cupIndexFromDifference: (difference: number, config: CupCalculation) => {
				const threshold = toCm(config.firstCupThreshold, config.useInches);
				if (difference < threshold) {
					return 0; // AA
				}
				const baseDiff = toCm(config.baseDifference, config.useInches);
				const step = toCm(config.stepSize, config.useInches);
				return Math.floor((difference - baseDiff) / step) + 1;
			},
			cupIndexToDifference: (cupIndex: number, config: CupCalculation) => {
				if (cupIndex === 0) {
					return toCm(config.firstCupThreshold, config.useInches);
				}
				const baseDiff = toCm(config.baseDifference, config.useInches);
				const step = toCm(config.stepSize, config.useInches);
				return baseDiff + (cupIndex - 1) * step;
			}
		},
		cupNameGenerator: generateStandardCupName,
		cupNameParser: parseStandardCupName
	},
	// 美国：使用 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48... 等（英寸为基础，步进 2 英寸）
	// 美国系统特殊规则：测量下胸围后，偶数加4英寸，奇数加5英寸得到band
	// 然后上胸围减去band（调整后的值）计算罩杯
	// 美国罩杯系统：AA, A, B, C, D, DD, DDD, F, G, H...（不使用E）
	// 标准转换：band 28=60cm, 30=65cm, 32=70cm, 34=75cm, 36=80cm...
	US: {
		bandStart: 28,
		bandStep: 2,
		...SHARED_CONFIG,
		...createInchBasedBandConverter(28, 60), // band 28 对应 60cm，band 32 对应 70cm
		bandStepInCm: 5, // 2 英寸 = 5cm
		cupCalculation: {
			...createInchBasedCupCalculation(
				0, // 第一个罩杯（AA）的阈值：0英寸以下
				0, // 基础差值：0英寸（AA）
				true // 使用调整后的band值
			),
			// 美国系统：差值直接对应罩杯（0英寸=AA, 1英寸=A, 2英寸=B...）
			// difference参数已经是英寸（因为config.useInches=true）
			cupIndexFromDifference: (difference: number) => {
				return Math.max(0, Math.floor(difference));
			},
			// 美国系统：罩杯索引直接对应英寸数
			cupIndexToDifference: (cupIndex: number, config: CupCalculation) => {
				return toCm(cupIndex, config.useInches);
			}
		},
		cupNameGenerator: generateUSCupName,
		cupNameParser: parseUSCupName
	},
 	// 日本：使用 65, 70, 75, 80, 85, 90, 95, 100 等（cm 为基础，步进 5cm）
 	// 根据Wikipedia：日本罩杯从AAA开始（5±1.25cm差值），步进2.5cm
 	// 日本罩杯系统：AAA, AA, A, B, C, D, E, F...（从AAA开始）
 	// AAA=5cm, AA=7.5cm, A=10cm, B=12.5cm...
 	JP: {
 		bandStart: 65,
 		bandStep: 5,
 		...SHARED_CONFIG,
 		...createCmBasedBandConverter(5),
 		bandStepInCm: 5,
		cupCalculation: {
			...createCmBasedCupCalculation(
				5, // 第一个罩杯（AAA）的阈值：5cm以下
				5, // AAA的起始差值：5cm
				2.5, // 每个罩杯增加的差值：2.5cm
				1.25 // 容差范围：±1.25cm
			)
			// 日本系统使用默认的cupIndexFromDifference和cupIndexToDifference
		},
 		cupNameGenerator: generateJapaneseCupName,
 		cupNameParser: parseJapaneseCupName
 	},
	// 英国：使用 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48... 等（和美国类似，但罩杯系统不同）
	// 英国系统：直接测量下胸围，四舍五入到最接近的偶数作为band
	// 然后上胸围减去band（调整后的值）计算罩杯
	// 英国罩杯系统：AA, A, B, C, D, DD, E, F, FF, G, GG, H, HH, J, JJ...（使用双字母）
	// 标准转换：band 28=60cm, 30=65cm, 32=70cm, 34=75cm, 36=80cm...
	UK: {
		bandStart: 28,
		bandStep: 2,
		...SHARED_CONFIG,
		...createInchBasedBandConverter(28, 60), // band 28 对应 60cm，band 32 对应 70cm
		bandStepInCm: 5, // 2 英寸 = 5cm
		cupCalculation: {
			...createInchBasedCupCalculation(
				0, // 第一个罩杯（AA）的阈值：0英寸以下
				0, // 基础差值：0英寸（AA）
				true // 使用调整后的band值
			)
			// UK系统使用默认的cupIndexFromDifference和cupIndexToDifference
		},
		cupNameGenerator: generateUKCupName,
		cupNameParser: parseUKCupName
	}
};

/**
 * 根据索引获取罩杯名称（使用配置的生成器）
 */
function getCupFromIndex(index: number, region: Region): string {
	if (index < 0) index = 0;
	const config = REGION_CONFIGS[region];
	return config.cupNameGenerator(index);
}

/**
 * 根据罩杯名称获取索引（使用配置的解析器）
 */
function getCupIndex(cup: string, region: Region): number {
	const config = REGION_CONFIGS[region];
	return config.cupNameParser(cup);
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
 * @param difference 差值（单位取决于region的useInches配置）
 * @param region 地区
 */
export function calculateCup(difference: number, region: Region): string {
	const config = REGION_CONFIGS[region];
	const cupCalc = config.cupCalculation;
	
	// 处理第一个罩杯的阈值（difference已经是配置的单位）
	if (difference < cupCalc.firstCupThreshold) {
		return getCupFromIndex(0, region); // 第一个罩杯（AA或AAA）
	}
	
	// 使用配置的计算函数或默认公式
	// difference已经是配置的单位（英寸或厘米），直接传入即可
	const cupIndex = cupCalc.cupIndexFromDifference
		? cupCalc.cupIndexFromDifference(difference, cupCalc)
		: Math.floor((difference - cupCalc.baseDifference) / cupCalc.stepSize);
	
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
	const cupCalculation = config.cupCalculation;
	const { tolerance, usesAdjustedBand } = cupCalculation;
	
	if (cupIndex < 0) {
		// 如果找不到罩杯，返回默认范围
		return { min: underbust, max: underbust + 10, median: underbust + 5 };
	}
	
	// 计算基础差值：使用配置的计算函数或默认公式
	let baseDiff: number;
	if (cupIndex === 0) {
		// 第一个罩杯使用阈值
		baseDiff = toCm(cupCalculation.firstCupThreshold, cupCalculation.useInches);
	} else {
		baseDiff = cupCalculation.cupIndexToDifference
			? cupCalculation.cupIndexToDifference(cupIndex, cupCalculation)
			: (() => {
				const base = toCm(cupCalculation.baseDifference, cupCalculation.useInches);
				const step = toCm(cupCalculation.stepSize, cupCalculation.useInches);
				return cupIndex * step + base;
			})();
	}
	
	// 确定基准值（用于计算上胸围）
	let baseValue: number;
	if (usesAdjustedBand) {
		// 美国/英国系统：使用调整后的band值
		baseValue = config.bandToCm(band);
	} else {
		// 其他系统：使用原始下胸围
		baseValue = underbust;
	}
	
	// 将tolerance转换为cm
	const toleranceInCm = toCm(tolerance, cupCalculation.useInches);
	
	return {
		min: baseValue + baseDiff - toleranceInCm,
		max: baseValue + baseDiff + toleranceInCm,
		median: baseValue + baseDiff
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
	const config = REGION_CONFIGS[region];
	const band = underbustToBand(underbust, region);
	
	// 计算罩杯差值（使用配置的单位）
	let difference: number;
	if (config.cupCalculation.useInches) {
		// 英寸系统（US/UK）：使用调整后的band值来计算差值
		// band本身就是英寸值（如36），上胸围需要转换为英寸后减去band
		// 根据Wikipedia图表，UK系统也是用"bust circumference to band size"（上胸围减去band）
		const bustInInches = bust / 2.54;
		difference = bustInInches - band; // 差值保持为英寸
	} else {
		// 厘米系统（CN, JP等）：直接使用原始下胸围
		difference = bust - underbust; // 差值保持为厘米
	}
	
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
