<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { onMount } from 'svelte';

	import { createComponentId } from '$lib/utils/id';

	let {
		id,
		value = 0,
		min = 0,
		max = 100,
		step = 1,
		label = '',
		unit = '',
		dragHint = '上下拖动'
	}: {
		id?: string;
		value?: number;
		min?: number;
		max?: number;
		step?: number;
		label?: string;
		unit?: string;
		dragHint?: string;
	} = $props();

	const dispatch = createEventDispatcher();
	const pickerId = id ?? createComponentId('number-picker');
	const labelId = label ? `${pickerId}-label` : undefined;

	let numberDisplayElement: HTMLDivElement;
	// 触摸起始位置（X坐标，用于水平拖动）
	let touchStartX = 0;
	let touchStartValue = 0;
	let isDragging = $state(false);

	/**
	 * 格式化显示值
	 */
	function formatValue(val: number): string {
		if (unit === 'inch' || unit === 'cm') {
			return val.toFixed(0);
		}
		return val.toFixed(2);
	}

	/**
	 * 获取前一个值（用于显示）
	 */
	function getPrevValue(): number | null {
		const prev = value - step;
		return prev >= min ? prev : null;
	}

	/**
	 * 获取下一个值（用于显示）
	 */
	function getNextValue(): number | null {
		const next = value + step;
		return next <= max ? next : null;
	}

	/**
	 * 处理触摸开始事件
	 */
	function handleTouchStart(event: TouchEvent) {
		touchStartX = event.touches[0].clientX;
		touchStartValue = value;
		isDragging = true;
	}

	/**
	 * 处理触摸移动事件（水平拖动调整数值）
	 */
	function handleTouchMove(event: TouchEvent) {
		if (!isDragging) return;
		event.preventDefault();
		const deltaX = event.touches[0].clientX - touchStartX;
		// 每20px移动一个步进
		const DRAG_SENSITIVITY = 20;
		const steps = Math.round(deltaX / DRAG_SENSITIVITY);
		const newValue = Math.round(Math.max(min, Math.min(max, touchStartValue + steps * step)));
		if (newValue !== value) {
			dispatch('change', newValue);
		}
	}

	/**
	 * 处理触摸结束事件
	 */
	function handleTouchEnd() {
		isDragging = false;
	}

	/**
	 * 处理鼠标按下事件
	 */
	function handleMouseDown(event: MouseEvent) {
		event.preventDefault();
		touchStartX = event.clientX;
		touchStartValue = value;
		isDragging = true;
	}

	/**
	 * 处理鼠标移动事件（水平拖动调整数值）
	 */
	function handleMouseMove(event: MouseEvent) {
		if (!isDragging) return;
		event.preventDefault();
		const deltaX = event.clientX - touchStartX;
		// 每20px移动一个步进
		const DRAG_SENSITIVITY = 20;
		const steps = Math.round(deltaX / DRAG_SENSITIVITY);
		const newValue = Math.round(Math.max(min, Math.min(max, touchStartValue + steps * step)));
		if (newValue !== value) {
			dispatch('change', newValue);
		}
	}

	/**
	 * 处理鼠标抬起事件
	 */
	function handleMouseUp() {
		isDragging = false;
	}

	/**
	 * 处理鼠标滚轮事件（水平滚动调整数值）
	 */
	function handleWheel(event: WheelEvent) {
		event.preventDefault();
		const delta = event.deltaX > 0 ? step : -step;
		const newValue = Math.round(Math.max(min, Math.min(max, value + delta)));
		if (newValue !== value) {
			dispatch('change', newValue);
		}
	}

	onMount(() => {
		if (numberDisplayElement) {
			// 触摸事件（移动端）
			numberDisplayElement.addEventListener('touchstart', handleTouchStart, { passive: false });
			numberDisplayElement.addEventListener('touchmove', handleTouchMove, { passive: false });
			numberDisplayElement.addEventListener('touchend', handleTouchEnd, { passive: false });

			// 鼠标事件（桌面端）
			numberDisplayElement.addEventListener('mousedown', handleMouseDown);

			// 滚轮事件
			numberDisplayElement.addEventListener('wheel', handleWheel, { passive: false });

			// 全局鼠标事件（用于处理鼠标移出元素外的情况）
			const handleGlobalMouseMove = (event: MouseEvent) => {
				if (isDragging) {
					handleMouseMove(event);
				}
			};

			const handleGlobalMouseUp = () => {
				if (isDragging) {
					handleMouseUp();
				}
			};

			document.addEventListener('mousemove', handleGlobalMouseMove);
			document.addEventListener('mouseup', handleGlobalMouseUp);

			return () => {
				numberDisplayElement.removeEventListener('touchstart', handleTouchStart);
				numberDisplayElement.removeEventListener('touchmove', handleTouchMove);
				numberDisplayElement.removeEventListener('touchend', handleTouchEnd);
				numberDisplayElement.removeEventListener('mousedown', handleMouseDown);
				numberDisplayElement.removeEventListener('wheel', handleWheel);
				document.removeEventListener('mousemove', handleGlobalMouseMove);
				document.removeEventListener('mouseup', handleGlobalMouseUp);
			};
		}
	});
</script>

<div class="number-picker-container">
	{#if label}
		<div class="number-picker-label form-label" id={labelId}>{label}</div>
	{/if}
	<div class="number-picker">
		<div
			id={pickerId}
			bind:this={numberDisplayElement}
			class="number-display"
			class:dragging={isDragging}
			role="slider"
			aria-valuemin={min}
			aria-valuemax={max}
			aria-valuenow={value}
			aria-labelledby={labelId}
		>
			<div class="prev-value">{getPrevValue() !== null ? formatValue(getPrevValue()!) : ''}</div>
			<div class="current-value">
				{formatValue(value)}
				{unit}
			</div>
			<div class="next-value">{getNextValue() !== null ? formatValue(getNextValue()!) : ''}</div>
		</div>
	</div>
</div>

<style>
	.number-picker-container {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 0.75rem;
		width: auto;
	}

	.number-picker-label {
		font-size: 0.875rem;
		color: var(--theme-text-secondary, rgba(255, 255, 255, 0.9));
		font-weight: 500;
		margin-bottom: 0;
		min-width: 80px;
		text-align: left;
		transition: color 0.3s ease;
	}

	.number-picker {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
	}

	.number-display {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		position: relative;
		width: auto;
		cursor: grab;
		user-select: none;
		-webkit-user-select: none;
		touch-action: none;
		transition: transform 0.2s ease;
		padding: 0.25rem 0.5rem;
		gap: 0.5rem;
	}

	.number-display:active,
	.number-display.dragging {
		cursor: grabbing;
		transform: scale(0.98);
	}

	.prev-value,
	.next-value {
		font-size: 1.25rem;
		font-weight: 400;
		color: var(--theme-text-tertiary, rgba(255, 255, 255, 0.3));
		line-height: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 40px;
		transition: color 0.3s ease;
	}

	.current-value {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--theme-text-primary, white);
		line-height: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 60px;
		text-align: center;
		text-shadow: var(--theme-text-shadow, 0 2px 10px rgba(0, 0, 0, 0.3));
		transition:
			color 0.3s ease,
			text-shadow 0.3s ease;
	}

	/* 移动端优化 */
	@media (max-width: 768px) {
		.current-value {
			font-size: 0.9375rem;
		}

		.prev-value,
		.next-value {
			font-size: 0.875rem;
		}
	}
</style>
