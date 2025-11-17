<script lang="ts">
	import { onMount } from 'svelte';
	import ModelViewer from '$lib/components/ModelViewer.svelte';
	import Picker from '$lib/components/Picker.svelte';
	import NumberPicker from '$lib/components/NumberPicker.svelte';
	import { getTranslation, type Language, type Region, type Unit } from '$lib/i18n';
	import {
		calculateBraSize,
		braSizeToMeasurements,
		getBandOptions,
		getCupOptions,
		getRegionBrand,
		cm,
		inch,
		type Measurement
	} from '$lib/logic/braSizeConverter';
	import {
		MEASUREMENT_RANGES,
		DEFAULT_SIZES,
		THEME_OPTIONS,
		REGION_OPTIONS,
		LANGUAGE_OPTIONS,
		UNIT_OPTIONS,
		DEFAULT_SETTINGS,
		MODEL_UPDATE_DELAY,
		THEME_CHANGE_DELAY
	} from '$lib/config/constants';
	import { settingsStore, type SettingsState } from '$lib/stores/settingsStore';
	import { getThemeColors, buildThemeCssVariables, type ThemeName } from '$lib/theme/themeConfig';

	// ============================================================================
	// 状态管理
	// ============================================================================

	let language: Language = DEFAULT_SETTINGS.LANGUAGE;
	let region: Region = DEFAULT_SETTINGS.REGION;
	let currentTheme: ThemeName = DEFAULT_SETTINGS.THEME;
	let unit: Unit = DEFAULT_SETTINGS.UNIT;
	let settingsSnapshot: SettingsState = {
		language,
		region,
		theme: currentTheme,
		unit
	};

	$: settingsSnapshot = $settingsStore;
	$: ({ language, region, unit, theme: currentTheme } = settingsSnapshot);
	let modelViewer: ModelViewer;
	let themeCssVariables: Record<string, string> = {};
	let themeCssVarString = '';

	// 测量值状态（使用 Measurement 对象，内部始终使用 cm 存储）
	let underbust: Measurement = cm(MEASUREMENT_RANGES.UNDERBUST_DEFAULT);
	let bust: Measurement = cm(MEASUREMENT_RANGES.BUST_DEFAULT);

	// 计算上胸围的动态范围（基于下胸围）
	$: bustMin = underbust.toCm();
	$: bustMax = underbust.toCm() + MEASUREMENT_RANGES.BUST_RANGE_OFFSET;

	// 尺码选择状态（根据地区初始化）
	// 使用响应式语句确保 band 选项根据地区正确初始化
	// 根据测量值范围动态生成 band 选项
	$: bandOptions = getBandOptions(
		region,
		cm(MEASUREMENT_RANGES.UNDERBUST_MIN),
		cm(MEASUREMENT_RANGES.UNDERBUST_MAX)
	);
	let selectedBand: number = 70; // 初始值，会在响应式中更新
	$: {
		// 如果当前选中的 band 不在新地区的选项中，选择中间值
		if (!bandOptions.includes(selectedBand)) {
			selectedBand = bandOptions[Math.floor(bandOptions.length / 2)] || 75;
		}
	}
	let selectedCup: string = DEFAULT_SIZES.CUP;

	// 国际化翻译
	$: t = getTranslation(language);

	// 主题颜色（根据当前主题动态计算）
	$: themeColors = getThemeColors(currentTheme);
	$: themeCssVariables = buildThemeCssVariables(themeColors);
	$: themeCssVarString = toCssVarString(themeCssVariables);

	// 确保主题变化时，模型和背景同步更新
	$: {
		if (modelViewer && typeof modelViewer.setTheme === 'function') {
			// 使用 setTimeout 确保在下一个事件循环中执行，避免在初始化时冲突
			setTimeout(() => {
				if (modelViewer && typeof modelViewer.setTheme === 'function') {
					modelViewer.setTheme(currentTheme);
				}
			}, THEME_CHANGE_DELAY);
		}
	}

	// ============================================================================
	// 工具函数
	// ============================================================================

	function toCssVarString(vars: Record<string, string>): string {
		return Object.entries(vars)
			.map(([key, value]) => `${key}: ${value}`)
			.join('; ');
	}

	// 动态生成 cup 选项（根据当前地区）
	$: cupOptions = getCupOptions(region);

	// 创建品牌映射（根据当前语言）
	$: regionBrandMap = (() => {
		const map: Record<string, string> = {};
		for (const regionOption of REGION_OPTIONS) {
			const baseBrand = getRegionBrand(regionOption as Region);
			if (!baseBrand) continue;
			const localized = t.brandTags?.[regionOption as Region] ?? baseBrand;
			map[regionOption] = localized;
		}
		return map;
	})();

	/**
	 * 将 Measurement 转换为显示单位
	 */
	function toDisplayUnit(measurement: Measurement, targetUnit: Unit): number {
		if (targetUnit === 'inch') {
			// inch 显示为整数
			return Math.round(measurement.toInch());
		}
		// cm 也显示为整数
		return Math.round(measurement.toCm());
	}

	/**
	 * 将显示单位的值转换为 Measurement 对象
	 * 如果新值的显示值与当前值的显示值相同，保持原值不变以避免精度损失
	 */
	function fromDisplayUnit(
		value: number,
		sourceUnit: Unit,
		currentMeasurement?: Measurement
	): Measurement {
		// 如果提供了当前值，检查显示值是否相同
		if (currentMeasurement) {
			const currentDisplay = toDisplayUnit(currentMeasurement, sourceUnit);
			if (currentDisplay === value) {
				// 显示值相同，保持原值不变以避免精度损失
				return currentMeasurement;
			}
		}

		if (sourceUnit === 'inch') {
			// 直接使用 inch 单位，Measurement 类会自动处理单位转换
			return inch(value);
		}
		// NumberPicker 已经保证了 value 是整数（step=1），直接使用即可
		return cm(value);
	}

	// 计算显示值（根据当前单位）
	$: underbustDisplay = toDisplayUnit(underbust, unit);
	$: bustDisplay = toDisplayUnit(bust, unit);

	// 计算显示范围（根据当前单位）
	$: underbustMinDisplay = toDisplayUnit(cm(MEASUREMENT_RANGES.UNDERBUST_MIN), unit);
	$: underbustMaxDisplay = toDisplayUnit(cm(MEASUREMENT_RANGES.UNDERBUST_MAX), unit);
	$: bustMinDisplay = toDisplayUnit(cm(bustMin), unit);
	$: bustMaxDisplay = toDisplayUnit(cm(bustMax), unit);

	// ============================================================================
	// 核心计算函数
	// ============================================================================

	/**
	 * 从上下胸围测量值计算对应的bra尺码
	 */
	function calculateFromMeasurements(targetRegion: Region = region) {
		const braSize = calculateBraSize(underbust, bust, targetRegion);
		selectedBand = braSize.band;
		selectedCup = braSize.cup;
		updateModel();
	}

	/**
	 * 从选择的bra尺码反推上下胸围测量值
	 */
	function calculateFromSize(targetRegion: Region = region) {
		const measurements = braSizeToMeasurements(selectedBand, selectedCup, targetRegion);
		underbust = measurements.underbust;
		bust = measurements.bust;
		updateModel();
	}

	/**
	 * 更新3D模型显示
	 */
	function updateModel() {
		if (modelViewer) {
			modelViewer.updateState(underbust.toCm(), bust.toCm());
		} else {
			// 如果 modelViewer 还没准备好，延迟执行
			setTimeout(() => {
				if (modelViewer) {
					modelViewer.updateState(underbust.toCm(), bust.toCm());
				}
			}, MODEL_UPDATE_DELAY);
		}
	}

	// ============================================================================
	// 事件处理函数
	// ============================================================================

	/**
	 * 处理band尺码变化
	 */
	function handleBandChange(event: CustomEvent<number>) {
		selectedBand = event.detail;
		calculateFromSize();
	}

	/**
	 * 处理cup罩杯变化
	 */
	function handleCupChange(event: CustomEvent<string>) {
		selectedCup = event.detail;
		calculateFromSize();
	}

	/**
	 * 处理下胸围测量值变化
	 * 需要确保上胸围在有效范围内
	 */
	function handleUnderbustChange(event: CustomEvent<number>) {
		// 将显示单位的值转换为 Measurement，传入当前值以避免精度损失
		underbust = fromDisplayUnit(event.detail, unit, underbust);
		// 确保上胸围不会小于下胸围
		if (bust.lessThan(underbust)) {
			bust = underbust;
		}
		// 确保上胸围不会超过最大范围
		const maxBust = cm(underbust.toCm() + MEASUREMENT_RANGES.BUST_RANGE_OFFSET);
		if (bust.toCm() > maxBust.toCm()) {
			bust = maxBust;
		}
		calculateFromMeasurements();
	}

	/**
	 * 处理上胸围测量值变化
	 */
	function handleBustChange(event: CustomEvent<number>) {
		// 将显示单位的值转换为 Measurement，传入当前值以避免精度损失
		bust = fromDisplayUnit(event.detail, unit, bust);
		calculateFromMeasurements();
	}

	/**
	 * 处理地区变化
	 * 保持测量值不变，重新计算对应地区的尺码
	 */
	function handleRegionChange(event: CustomEvent<Region>) {
		const nextRegion = event.detail;
		settingsStore.setRegion(nextRegion);
		calculateFromMeasurements(nextRegion);
	}

	/**
	 * 处理语言变化
	 */
	function handleLanguageChange(event: CustomEvent<Language>) {
		settingsStore.setLanguage(event.detail);
	}

	/**
	 * 处理主题变化
	 */
	function handleThemeChange(event: CustomEvent<ThemeName>) {
		settingsStore.setTheme(event.detail);
	}

	/**
	 * 处理单位变化
	 * 单位变化时，保持内部 cm 值不变，只改变显示
	 */
	function handleUnitChange(event: CustomEvent<Unit>) {
		settingsStore.setUnit(event.detail);
		// 不需要重新计算，因为内部值已经是 cm
	}

	// ============================================================================
	// 生命周期
	// ============================================================================

	/**
	 * 组件挂载后初始化
	 */
	onMount(() => {
		// 延迟执行，确保modelViewer已经挂载
		setTimeout(() => {
			calculateFromMeasurements();
			// 确保初始化时主题同步
			if (modelViewer && typeof modelViewer.setTheme === 'function') {
				modelViewer.setTheme(currentTheme);
			}
		}, MODEL_UPDATE_DELAY);
	});
</script>

<div class="page-shell" style={themeCssVarString}>
	<div class="background-layer"></div>
	<div class="app-container">
		<!-- 顶部标题 -->
		<div class="header">
			<h1 class="title">{t.title}</h1>
		</div>

		<!-- 大号尺码显示 -->
		<div class="size-display">
			<div class="size-option text-right">
				<Picker
					options={bandOptions}
					value={selectedBand}
					label=""
					size="large"
					on:change={handleBandChange}
				/>
			</div>
			<div class="size-option text-left">
				<Picker
					options={cupOptions}
					value={selectedCup}
					label=""
					size="large"
					on:change={handleCupChange}
				/>
			</div>
		</div>

		<!-- 测量值显示（平行文字） -->
		<div class="measurements">
			<div class="measurement-item">
				<NumberPicker
					value={bustDisplay}
					min={bustMinDisplay}
					max={bustMaxDisplay}
					step={1}
					label={t.bust}
					{unit}
					unitDisplay={t.units[unit]}
					on:change={handleBustChange}
				/>
			</div>
			<div class="measurement-item">
				<NumberPicker
					value={underbustDisplay}
					min={underbustMinDisplay}
					max={underbustMaxDisplay}
					step={1}
					label={t.underbust}
					{unit}
					unitDisplay={t.units[unit]}
					on:change={handleUnderbustChange}
				/>
			</div>
		</div>

		<!-- 设置区域（主题、语言、单位、地区） -->
		<div class="settings-section">
			<Picker
				options={THEME_OPTIONS}
				value={currentTheme}
				label={t.theme}
				displayMap={t.themes}
				on:change={handleThemeChange}
			/>
			<Picker
				options={LANGUAGE_OPTIONS}
				value={language}
				label={t.language}
				displayMap={t.languages}
				on:change={handleLanguageChange}
			/>
			<Picker
				options={UNIT_OPTIONS}
				value={unit}
				label={t.unit}
				displayMap={t.units}
				on:change={handleUnitChange}
			/>
			<Picker
				options={REGION_OPTIONS}
				value={region}
				label={t.region}
				displayMap={t.regions}
				brandMap={regionBrandMap}
				on:change={handleRegionChange}
			/>
		</div>

		<!-- 3D模型 -->
		<div class="model-section">
			<ModelViewer bind:this={modelViewer} />
		</div>
	</div>
</div>
