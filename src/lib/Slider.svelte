<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	let {
		value = 0,
		min = 0,
		max = 100,
		step = 1,
		label = '',
		unit = ''
	}: {
		value?: number;
		min?: number;
		max?: number;
		step?: number;
		label?: string;
		unit?: string;
	} = $props();

	const dispatch = createEventDispatcher();

	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		const newValue = Number(target.value);
		dispatch('input', newValue);
	}
</script>

<div class="slider-container">
	<label class="slider-label">
		{label}: <span class="slider-value">{value.toFixed(unit === 'cm' ? 0 : 2)}{unit}</span>
	</label>
	<input
		type="range"
		class="slider"
		min={min}
		max={max}
		step={step}
		value={value}
		on:input={handleInput}
	/>
</div>

<style>
	.slider-container {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		width: 100%;
	}

	.slider-label {
		font-size: 0.875rem;
		color: rgba(255, 255, 255, 0.8);
		font-weight: 500;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.slider-value {
		font-size: 1.125rem;
		font-weight: 600;
		color: white;
	}

	.slider {
		width: 100%;
		height: 8px;
		border-radius: 4px;
		background: rgba(255, 255, 255, 0.2);
		outline: none;
		-webkit-appearance: none;
		appearance: none;
		cursor: pointer;
	}

	.slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: white;
		cursor: pointer;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
		transition: transform 0.2s ease;
	}

	.slider::-webkit-slider-thumb:hover {
		transform: scale(1.1);
	}

	.slider::-moz-range-thumb {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: white;
		cursor: pointer;
		border: none;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
		transition: transform 0.2s ease;
	}

	.slider::-moz-range-thumb:hover {
		transform: scale(1.1);
	}

	/* 移动端优化 */
	@media (max-width: 768px) {
		.slider {
			height: 10px;
		}

		.slider::-webkit-slider-thumb {
			width: 28px;
			height: 28px;
		}

		.slider::-moz-range-thumb {
			width: 28px;
			height: 28px;
		}
	}
</style>

