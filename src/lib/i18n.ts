export type Language = 'zh' | 'en';
export type Region = 'CN' | 'US' | 'US_CLASSIC' | 'JP' | 'UK';
export type Unit = 'cm' | 'inch';

export const translations = {
	zh: {
		title: '您的罩杯是',
		underbust: '下胸围',
		bust: '上胸围',
		cm: '厘米',
		region: '地区',
		language: '语言',
		theme: '主题',
		unit: '单位',
		regions: {
			CN: '中国',
			US: '美国',
			US_CLASSIC: '美国 (经典)',
			JP: '日本',
			UK: '英国'
		},
		languages: {
			zh: '中文',
			en: 'English'
		},
		themes: {
			spongebob: '海绵宝宝',
			barbie: '芭比',
			toon: '卡通',
			cyberpunk: '赛博朋克',
			alien: '外星人'
		},
		units: {
			cm: '厘米',
			inch: '英寸'
		},
		dragHint: '上下拖动'
	},
	en: {
		title: 'Your bra size is',
		underbust: 'Underbust',
		bust: 'Bust',
		cm: 'cm',
		region: 'Region',
		language: 'Language',
		theme: 'Theme',
		unit: 'Unit',
		regions: {
			CN: 'China',
			US: 'USA',
			US_CLASSIC: 'USA (Classic)',
			JP: 'Japan',
			UK: 'UK'
		},
		languages: {
			zh: '中文',
			en: 'English'
		},
		themes: {
			spongebob: 'Spongebob',
			barbie: 'Barbie',
			toon: 'Toon',
			cyberpunk: 'Cyberpunk',
			alien: 'Alien'
		},
		units: {
			cm: 'cm',
			inch: 'inch'
		},
		dragHint: 'Drag up/down'
	}
};

export function getTranslation(lang: Language) {
	return translations[lang];
}

