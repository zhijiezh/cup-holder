/**
 * 主题配置和工具函数
 */

export const THEME_BACKGROUNDS: Record<string, number | string> = {
	spongebob: 0x87ceeb, // 天蓝色
	classic: 0x2a2a2a, // 深灰色
	toon: 0xbde8ff, // 柔和天蓝
	cyberpunk: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // 紫色渐变
	alien: 0x05020d // 深空紫
};

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
	// 相对亮度公式 (ITU-R BT.709)
	const [rs, gs, bs] = [r, g, b].map(val => {
		val = val / 255;
		return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
	});
	return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * 判断颜色是否为深色
 * 如果亮度小于 0.5，认为是深色
 */
export function isDarkColor(hex: number): boolean {
	return getLuminance(hex) < 0.5;
}

/**
 * 根据主题获取背景色和文字颜色
 */
export function getThemeColors(themeName: string): {
	background: string;
	textColor: string;
	textShadow: string;
	textColorSecondary: string;
	textColorTertiary: string;
} {
	const backgroundValue = THEME_BACKGROUNDS[themeName] || THEME_BACKGROUNDS.spongebob;
	
	// 如果是渐变字符串，直接使用
	if (typeof backgroundValue === 'string') {
		// 对于渐变，使用起始颜色来判断亮度（#667eea）
		const gradientStartHex = 0x667eea;
		const isDark = isDarkColor(gradientStartHex);
		
		return {
			background: backgroundValue,
			textColor: isDark ? '#ffffff' : '#1a1a1a',
			textShadow: isDark 
				? '0 4px 20px rgba(0, 0, 0, 0.3)' 
				: '0 2px 10px rgba(0, 0, 0, 0.2)',
			textColorSecondary: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(26, 26, 26, 0.7)',
			textColorTertiary: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(26, 26, 26, 0.5)'
		};
	}
	
	// 如果是十六进制数字，转换为 CSS 颜色
	const background = hexToCssColor(backgroundValue);
	const isDark = isDarkColor(backgroundValue);
	
	return {
		background,
		textColor: isDark ? '#ffffff' : '#1a1a1a',
		textShadow: isDark 
			? '0 4px 20px rgba(0, 0, 0, 0.3)' 
			: '0 2px 10px rgba(0, 0, 0, 0.2)',
		textColorSecondary: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(26, 26, 26, 0.7)',
		textColorTertiary: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(26, 26, 26, 0.5)'
	};
}

