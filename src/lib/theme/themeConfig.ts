/**
 * 主题配置和工具函数
 */

export type ThemeName = 'spongebob' | 'barbie' | 'toon' | 'cyberpunk' | 'alien';

export interface ThemeDefinition {
	background: number | string;
	accent: string;
	surface: string;
	luminanceSample?: number;
}

export interface ThemeColors {
	background: string;
	textColor: string;
	textShadow: string;
	textColorSecondary: string;
	textColorTertiary: string;
	accent: string;
	surface: string;
}

const THEME_DEFINITIONS: Record<ThemeName, ThemeDefinition> = {
	spongebob: {
		background: 0x87ceeb, // 天蓝色
		accent: '#ffe44f',
		surface: 'rgba(255, 255, 255, 0.2)'
	},
	barbie: {
		background: 0xffc0cb, // 芭比粉色
		accent: '#ff69b4',
		surface: 'rgba(255, 255, 255, 0.3)'
	},
	toon: {
		background: 0xbde8ff, // 柔和天蓝
		accent: '#4a6b96',
		surface: 'rgba(255, 255, 255, 0.25)'
	},
	cyberpunk: {
		background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // 紫色渐变
		accent: '#ff00ff',
		surface: 'rgba(255, 255, 255, 0.08)',
		luminanceSample: 0x667eea
	},
	alien: {
		background: 0x05020d, // 深空紫
		accent: '#32cd32',
		surface: 'rgba(255, 255, 255, 0.06)'
	}
};

const DEFAULT_THEME: ThemeName = 'spongebob';

/**
 * 将十六进制颜色转换为 RGB
 */
function hexToRgb(hex: number): { r: number; g: number; b: number } {
	return {
		r: (hex >> 16) & 255,
		g: (hex >> 8) & 255,
		b: hex & 255
	};
}

/**
 * 将十六进制颜色转换为 CSS 颜色字符串
 */
export function hexToCssColor(hex: number): string {
	const { r, g, b } = hexToRgb(hex);
	return `rgb(${r}, ${g}, ${b})`;
}

/**
 * 计算颜色的亮度（使用相对亮度公式）
 * 返回 0-1 之间的值，0 为黑色，1 为白色
 */
function getLuminance(hex: number): number {
	const { r, g, b } = hexToRgb(hex);
	const [rs, gs, bs] = [r, g, b].map((val) => {
		val = val / 255;
		return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
	});
	return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * 判断颜色是否为深色
 */
export function isDarkColor(hex: number): boolean {
	return getLuminance(hex) < 0.5;
}

function normalizeBackgroundValue(background: number | string): {
	value: string;
	sampleHex?: number;
} {
	if (typeof background === 'string') {
		return { value: background };
	}
	return { value: hexToCssColor(background), sampleHex: background };
}

/**
 * 根据主题获取背景色和文字颜色
 */
export function getThemeColors(themeName: ThemeName): ThemeColors {
	const definition = THEME_DEFINITIONS[themeName] ?? THEME_DEFINITIONS[DEFAULT_THEME];
	const { value, sampleHex } = normalizeBackgroundValue(definition.background);

	const luminanceHex =
		definition.luminanceSample ??
		sampleHex ??
		(typeof definition.background === 'number' ? definition.background : 0x111111);

	const isDark = typeof luminanceHex === 'number' ? isDarkColor(luminanceHex) : false;

	return {
		background: value,
		textColor: isDark ? '#ffffff' : '#1a1a1a',
		textShadow: isDark ? '0 4px 20px rgba(0, 0, 0, 0.3)' : 'none',
		textColorSecondary: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(26, 26, 26, 0.7)',
		textColorTertiary: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(26, 26, 26, 0.5)',
		accent: definition.accent,
		surface: definition.surface
	};
}

/**
 * 将主题颜色映射为 CSS 变量
 */
export function buildThemeCssVariables(colors: ThemeColors): Record<string, string> {
	return {
		'--theme-background': colors.background,
		'--theme-text-primary': colors.textColor,
		'--theme-text-secondary': colors.textColorSecondary,
		'--theme-text-tertiary': colors.textColorTertiary,
		'--theme-text-shadow': colors.textShadow,
		'--theme-accent': colors.accent,
		'--theme-surface': colors.surface
	};
}
