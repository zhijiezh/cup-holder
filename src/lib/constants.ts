/**
 * 应用常量配置
 */

// 测量值范围
export const MEASUREMENT_RANGES = {
	UNDERBUST_MIN: 30,
	UNDERBUST_MAX: 200,
	BUST_RANGE_OFFSET: 200, // 上胸围相对于下胸围的最大差值
	UNDERBUST_DEFAULT: 80,
	BUST_DEFAULT: 95
} as const;

// 默认尺码
export const DEFAULT_SIZES = {
	BAND: 34,
	CUP: 'C'
} as const;

// 罩杯选项
export const CUP_OPTIONS: string[] = ['AA', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

// 主题选项
export const THEME_OPTIONS: string[] = ['spongebob', 'classic', 'toon', 'cyberpunk', 'alien'];

// 地区选项
export const REGION_OPTIONS: string[] = ['CN', 'US', 'JP'];

// 语言选项
export const LANGUAGE_OPTIONS: string[] = ['zh', 'en'];

// 单位选项
export const UNIT_OPTIONS: string[] = ['cm', 'inch'];

// 默认设置
export const DEFAULT_SETTINGS = {
	THEME: 'spongebob' as const,
	REGION: 'CN' as const,
	LANGUAGE: 'zh' as const,
	UNIT: 'cm' as const
} as const;

// 模型更新延迟（毫秒）
export const MODEL_UPDATE_DELAY = 100;

// 主题切换延迟（毫秒）
export const THEME_CHANGE_DELAY = 0;

