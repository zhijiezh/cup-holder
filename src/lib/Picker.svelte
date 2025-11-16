<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	let {
		options = [],
		value = '',
		label = '',
		displayMap = {},
		size = 'normal',
		brandMap = {}
	}: {
		options?: string[] | number[];
		value?: string | number;
		label?: string;
		displayMap?: Record<string | number, string>;
		size?: 'large' | 'normal';
		brandMap?: Record<string | number, string>;
	} = $props();

	const dispatch = createEventDispatcher();

	function handleChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		const newValue = typeof options[0] === 'number' ? Number(target.value) : target.value;
		dispatch('change', newValue);
	}

	function getDisplayValue(option: string | number): string {
		return displayMap[option] || String(option);
	}

	function getBrand(option: string | number): string | undefined {
		return brandMap[option];
	}
</script>

<div class="picker-container">
	{#if label}
		<label class="picker-label">{label}</label>
	{/if}
	<div class="picker-wrapper">
		<select class="picker" class:large={size === 'large'} value={value} on:change={handleChange}>
			{#each options as option}
				<option value={option}>{getDisplayValue(option)}</option>
			{/each}
		</select>
	</div>
	<span class="brand-tag" class:hidden={!getBrand(value)}>
		{getBrand(value) || '\u00A0'}
	</span>
</div>

<style>
	.picker-container {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
	}

	.picker-label {
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.7);
		font-weight: 500;
		margin-bottom: 0;
	}

	.picker-wrapper {
		display: flex;
		align-items: center;
		position: relative;
	}

	.picker {
		appearance: none;
		-webkit-appearance: none;
		-moz-appearance: none;
		background: transparent;
		border: none;
		border-radius: 0;
		padding: 0;
		font-size: 1rem;
		font-weight: 600;
		color: white;
		text-align: left;
		cursor: pointer;
		transition: all 0.3s ease;
		min-width: auto;
		text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
		line-height: 1.4;
	}

	.picker.large {
		font-size: 128px;
		font-weight: 700;
		text-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
		line-height: 1.1;
		letter-spacing: -0.02em;
		white-space: nowrap;
		flex-shrink: 0;
	}

	.picker:hover {
		opacity: 0.8;
		transform: scale(1.05);
	}

	.picker:focus {
		outline: none;
		opacity: 0.9;
	}

	.brand-tag {
		font-size: 0.65rem;
		color: rgba(255, 255, 255, 0.5);
		background: rgba(255, 255, 255, 0.1);
		padding: 0.15rem 0.4rem;
		border-radius: 0.25rem;
		font-weight: 500;
		white-space: nowrap;
		backdrop-filter: blur(4px);
		-webkit-backdrop-filter: blur(4px);
		margin-top: 0.25rem;
		align-self: flex-start;
		min-height: 1.2em;
		display: inline-block;
	}

	.brand-tag.hidden {
		visibility: hidden;
		opacity: 0;
	}

	.picker-wrapper:has(.picker.large) ~ .brand-tag {
		font-size: 1rem;
		padding: 0.25rem 0.6rem;
		margin-top: 0.5rem;
	}

	/* 移动端优化 */
	@media (max-width: 768px) {
		.picker.large {
			font-size: 100px;
		}

		.picker-label {
			font-size: 0.75rem;
		}

		.brand-tag {
			font-size: 0.6rem;
		}

		.picker-wrapper:has(.picker.large) ~ .brand-tag {
			font-size: 0.85rem;
		}
	}
</style>

