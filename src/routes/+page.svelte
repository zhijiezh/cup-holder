<script lang="ts">
	import { onMount } from 'svelte';
	import ModelViewer from '$lib/ModelViewer.svelte';
	import Picker from '$lib/Picker.svelte';
	import NumberPicker from '$lib/NumberPicker.svelte';
	import { getTranslation, type Language, type Region, type Unit } from '$lib/i18n';
	import {
		calculateBraSize,
		braSizeToMeasurements,
		getBandOptions,
		getCupOptions,
		type BraSize
	} from '$lib/braSizeConverter';
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
	} from '$lib/constants';

	// ============================================================================
	// 状态管理
	// ============================================================================

	let language: Language = DEFAULT_SETTINGS.LANGUAGE;
	let region: Region = DEFAULT_SETTINGS.REGION;
	let currentTheme: string = DEFAULT_SETTINGS.THEME;
	let unit: Unit = DEFAULT_SETTINGS.UNIT;
	let modelViewer: ModelViewer;

	// 测量值状态（内部始终使用 cm 存储）
	let underbust: number = MEASUREMENT_RANGES.UNDERBUST_DEFAULT;
	let bust: number = MEASUREMENT_RANGES.BUST_DEFAULT;
	
	// 计算上胸围的动态范围（基于下胸围）
	$: bustMin = underbust;
	$: bustMax = underbust + MEASUREMENT_RANGES.BUST_RANGE_OFFSET;
	
	// 尺码选择状态（根据地区初始化）
	// 使用响应式语句确保 band 选项根据地区正确初始化
	// 根据测量值范围动态生成 band 选项
	$: bandOptions = getBandOptions(
		region,
		MEASUREMENT_RANGES.UNDERBUST_MIN,
		MEASUREMENT_RANGES.UNDERBUST_MAX
	);
	let selectedBand: number = 75; // 初始值，会在响应式中更新
	$: {
		// 如果当前选中的 band 不在新地区的选项中，选择中间值
		if (!bandOptions.includes(selectedBand)) {
			selectedBand = bandOptions[Math.floor(bandOptions.length / 2)] || 75;
		}
	}
	let selectedCup: string = DEFAULT_SIZES.CUP;

	// 国际化翻译
	$: t = getTranslation(language);

	// ============================================================================
	// 工具函数
	// ============================================================================

	// 动态生成 cup 选项（根据当前地区）
	$: cupOptions = getCupOptions(region);

	/**
	 * 单位转换函数
	 */
	function inchToCm(inch: number): number {
		return inch * 2.54;
	}

	function cmToInch(cm: number): number {
		return cm / 2.54;
	}

	/**
	 * 将值转换为显示单位
	 */
	function toDisplayUnit(value: number, targetUnit: Unit): number {
		if (targetUnit === 'inch') {
			// inch 显示为整数
			return Math.round(cmToInch(value));
		}
		return value;
	}

	/**
	 * 将显示单位的值转换为内部存储的 cm 值
	 */
	function fromDisplayUnit(value: number, sourceUnit: Unit): number {
		if (sourceUnit === 'inch') {
			return inchToCm(value);
		}
		return value;
	}

	// 计算显示值（根据当前单位）
	$: underbustDisplay = toDisplayUnit(underbust, unit);
	$: bustDisplay = toDisplayUnit(bust, unit);

	// 计算显示范围（根据当前单位）
	$: underbustMinDisplay = toDisplayUnit(MEASUREMENT_RANGES.UNDERBUST_MIN, unit);
	$: underbustMaxDisplay = toDisplayUnit(MEASUREMENT_RANGES.UNDERBUST_MAX, unit);
	$: bustMinDisplay = toDisplayUnit(bustMin, unit);
	$: bustMaxDisplay = toDisplayUnit(bustMax, unit);

	// ============================================================================
	// 核心计算函数
	// ============================================================================

	/**
	 * 从上下胸围测量值计算对应的bra尺码
	 */
	function calculateFromMeasurements() {
		const braSize = calculateBraSize(underbust, bust, region);
		selectedBand = braSize.band;
		selectedCup = braSize.cup;
		updateModel();
	}

	/**
	 * 从选择的bra尺码反推上下胸围测量值
	 */
	function calculateFromSize() {
		const measurements = braSizeToMeasurements(selectedBand, selectedCup, region);
		underbust = measurements.underbust;
		bust = measurements.bust;
		updateModel();
	}

	/**
	 * 更新3D模型显示
	 */
	function updateModel() {
		if (modelViewer) {
			modelViewer.updateState(underbust, bust);
		} else {
			// 如果 modelViewer 还没准备好，延迟执行
			setTimeout(() => {
				if (modelViewer) {
					modelViewer.updateState(underbust, bust);
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
		// 将显示单位的值转换为 cm
		underbust = fromDisplayUnit(event.detail, unit);
		// 确保上胸围不会小于下胸围
		if (bust < underbust) {
			bust = underbust;
		}
		// 确保上胸围不会超过最大范围
		const maxBust = underbust + MEASUREMENT_RANGES.BUST_RANGE_OFFSET;
		if (bust > maxBust) {
			bust = maxBust;
		}
		calculateFromMeasurements();
	}

	/**
	 * 处理上胸围测量值变化
	 */
	function handleBustChange(event: CustomEvent<number>) {
		// 将显示单位的值转换为 cm
		bust = fromDisplayUnit(event.detail, unit);
		calculateFromMeasurements();
	}

	/**
	 * 处理地区变化
	 * 保持测量值不变，重新计算对应地区的尺码
	 */
	function handleRegionChange(event: CustomEvent<Region>) {
		region = event.detail;
		calculateFromMeasurements();
	}

	/**
	 * 处理语言变化
	 */
	function handleLanguageChange(event: CustomEvent<Language>) {
		language = event.detail;
	}

	/**
	 * 处理主题变化
	 */
	function handleThemeChange(event: CustomEvent<string>) {
		currentTheme = event.detail;
		// 延迟执行，确保modelViewer已经初始化
		setTimeout(() => {
			if (modelViewer && typeof modelViewer.setTheme === 'function') {
				modelViewer.setTheme(currentTheme);
			}
		}, THEME_CHANGE_DELAY);
	}

	/**
	 * 处理单位变化
	 * 单位变化时，保持内部 cm 值不变，只改变显示
	 */
	function handleUnitChange(event: CustomEvent<Unit>) {
		unit = event.detail;
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
		}, MODEL_UPDATE_DELAY);
	});
</script>

<div class="background-layer"></div>
<div class="app-container">
	<!-- 顶部标题 -->
	<div class="header">
		<h1 class="title">{t.title}</h1>
	</div>

	<!-- 大号尺码显示 -->
	<div class="size-display">
		<Picker
			options={bandOptions}
			value={selectedBand}
			label=""
			size="large"
			on:change={(e) => handleBandChange(e)}
		/>
		<Picker
			options={cupOptions}
			value={selectedCup}
			label=""
			size="large"
			on:change={(e) => handleCupChange(e)}
		/>
	</div>

		<!-- 测量值显示（平行文字） -->
		<div class="measurements">
			<div class="measurement-item">
				<NumberPicker
					value={bustDisplay}
					min={bustMinDisplay}
					max={bustMaxDisplay}
					step={unit === 'inch' ? 1 : 0.5}
					label={t.bust}
					unit={unit}
					dragHint=""
					on:change={(e) => handleBustChange(e)}
				/>
			</div>
			<div class="measurement-item">
				<NumberPicker
					value={underbustDisplay}
					min={underbustMinDisplay}
					max={underbustMaxDisplay}
					step={unit === 'inch' ? 1 : 1}
					label={t.underbust}
					unit={unit}
					dragHint=""
					on:change={(e) => handleUnderbustChange(e)}
				/>
			</div>
		</div>

	<!-- 设置区域（主题、地区、语言、单位） -->
	<div class="settings-section">
		<Picker
			options={THEME_OPTIONS}
			value={currentTheme}
			label={t.theme}
			displayMap={t.themes}
			on:change={(e) => handleThemeChange(e)}
		/>
		<Picker
			options={REGION_OPTIONS}
			value={region}
			label={t.region}
			displayMap={t.regions}
			on:change={(e) => handleRegionChange(e)}
		/>
		<Picker
			options={LANGUAGE_OPTIONS}
			value={language}
			label={t.language}
			displayMap={t.languages}
			on:change={(e) => handleLanguageChange(e)}
		/>
		<Picker
			options={UNIT_OPTIONS}
			value={unit}
			label={t.unit}
			displayMap={t.units}
			on:change={(e) => handleUnitChange(e)}
		/>
	</div>

	<!-- 3D模型 -->
	<div class="model-section">
		<ModelViewer bind:this={modelViewer} />
	</div>
</div>

<style>
	.background-layer {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		z-index: -1;
	}

	.background-layer::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
			radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
		pointer-events: none;
	}

	.app-container {
		min-height: 100vh;
		display: grid;
		grid-template-areas:
			'header'
			'size'
			'measurements'
			'settings'
			'main';
		grid-template-columns: 1fr;
		grid-template-rows: auto auto auto auto 1fr;
		gap: 1.5rem;
		padding: 2rem;
		position: relative;
		overflow-x: hidden;
		overflow-y: auto;
		max-width: 1200px;
		margin: 0 auto;
		width: 100%;
		box-sizing: border-box;
		z-index: 1;
	}


	.header {
		grid-area: header;
		position: relative;
		z-index: 2;
		pointer-events: none; /* 不阻挡模型交互 */
	}

	.header :global(*) {
		pointer-events: auto; /* 但文字本身可以选中 */
	}

	.title {
		font-size: clamp(48px, 8vw, 128px);
		font-weight: 700;
		color: white;
		margin: 0;
		line-height: 1.1;
		text-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
		letter-spacing: -0.02em;
		white-space: nowrap;
		overflow: visible;
		word-break: keep-all;
	}

	.size-display {
		grid-area: size;
		display: flex;
		justify-content: flex-start;
		align-items: baseline;
		gap: 0.5rem;
		position: relative;
		z-index: 2;
		flex-wrap: nowrap;
		overflow: hidden;
		pointer-events: none; /* 不阻挡模型交互 */
	}

	.size-display :global(*) {
		pointer-events: auto; /* 但选择器可以交互 */
	}

	.measurements {
		grid-area: measurements;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		position: relative;
		z-index: 2;
		pointer-events: none; /* 不阻挡模型交互 */
	}

	.measurements :global(*) {
		pointer-events: auto; /* 但输入控件可以交互 */
	}

	.measurement-item {
		display: flex;
		align-items: baseline;
		gap: 0;
		font-size: 0.9375rem;
		flex-wrap: nowrap;
	}

	.settings-section {
		grid-area: settings;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		position: relative;
		z-index: 2;
		align-items: flex-start;
		pointer-events: none; /* 不阻挡模型交互 */
	}

	.settings-section :global(*) {
		pointer-events: auto; /* 但选择器可以交互 */
	}

	.model-section {
		grid-area: model;
		position: fixed;
		top: 0;
		right: 0;
		bottom: 0;
		left: 0;
		min-height: 100vh;
		height: 100vh;
		width: 100vw;
		margin: 0;
		padding: 0;
		overflow: visible;
		pointer-events: none; /* 容器本身不阻挡，但canvas会 */
		z-index: 1; /* 在背景上方，但在文字下方 */
		/* 透明背景，让模型融入页面，像封面图 */
	}

	.model-section :global(div) {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 120vw !important;
		height: 120vh !important;
		min-width: 100vw;
		min-height: 100vh;
		margin: 0;
		padding: 0;
		pointer-events: none;
	}

	.model-section :global(canvas) {
		display: block !important;
		width: 100% !important;
		height: 100% !important;
		background: transparent !important;
		margin: 0;
		padding: 0;
		pointer-events: auto;
		object-fit: cover;
	}

	/* 移动端布局 */
	@media (max-width: 768px) {
		.app-container {
		grid-template-areas:
			'header'
			'size'
			'measurements'
			'settings'
			'main';
			grid-template-columns: 1fr;
			grid-template-rows: auto auto auto auto auto;
			padding: 1rem;
			gap: 0.5rem;
		}

		.title {
			font-size: clamp(48px, 12vw, 128px);
			line-height: 1.1;
			white-space: nowrap;
			overflow: visible;
			word-break: keep-all;
		}

		.size-display {
			justify-content: flex-start;
			gap: 0.25rem;
			flex-wrap: nowrap;
			overflow: hidden;
		}

		.measurement-item {
			font-size: 0.875rem;
			gap: 0;
		}

		.settings-section {
			flex-direction: column;
			gap: 0.5rem;
		}

		.model-section {
			position: fixed;
			top: 0;
			right: 0;
			bottom: 0;
			left: 0;
			min-height: 100vh;
			height: 100vh;
			width: 100vw;
			margin: 0;
			padding: 0;
			overflow: visible;
		}

		.model-section :global(div) {
			position: absolute;
			top: 66.67%;
			left: 0;
			right: 0;
			transform: translateY(-50%);
			width: 100vw !important;
			height: 96vh !important;
			min-width: 100vw;
			min-height: 96vh;
			margin: 0;
			padding: 0;
			pointer-events: none;
		}

		.model-section :global(canvas) {
			width: 100% !important;
			height: 100% !important;
			margin: 0;
			padding: 0;
			pointer-events: auto;
			object-fit: cover;
			/* 确保canvas延伸到屏幕边缘，消除左侧缝隙 */
			position: absolute;
			left: 0;
			right: 0;
			top: 0;
			bottom: 0;
		}
	}
</style>
