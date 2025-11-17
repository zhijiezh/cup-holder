<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import FormField from '$lib/components/form/FormField.svelte';
	import { createComponentId } from '$lib/utils/id';

	type OptionValue = string | number;

	let {
		id,
		options = [],
		value = '',
		label = '',
		displayMap = {},
		size = 'normal',
		brandMap = {},
		disabled = false,
		placeholder
	}: {
		id?: string;
		options?: OptionValue[];
		value?: OptionValue;
		label?: string;
		displayMap?: Record<OptionValue, string>;
		size?: 'large' | 'normal';
		brandMap?: Record<OptionValue, string>;
		disabled?: boolean;
		placeholder?: string;
	} = $props();

	const dispatch = createEventDispatcher();
	const pickerId = id ?? createComponentId('picker');

	function handleChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		const newValue =
			options.length && typeof options[0] === 'number' ? Number(target.value) : target.value;
		dispatch('change', newValue);
	}

	function getDisplayValue(option: OptionValue): string {
		return displayMap[option] || String(option);
	}

	function getBrand(option: OptionValue): string | undefined {
		return brandMap[option];
	}
</script>

<FormField controlId={pickerId} {label} brand={getBrand(value)}>
	<div class="picker-wrapper">
		<select
			id={pickerId}
			class="picker"
			class:large={size === 'large'}
			{value}
			{disabled}
			onchange={handleChange}
		>
			{#if placeholder}
				<option value="" disabled selected={value === ''}>
					{placeholder}
				</option>
			{/if}
			{#each options as option (option)}
				<option value={option}>{getDisplayValue(option)}</option>
			{/each}
		</select>
	</div>
</FormField>

<style>
	:global(.form-field .picker-wrapper) {
		width: auto;
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
		color: var(--theme-text-primary, white);
		text-align: left;
		cursor: pointer;
		transition:
			all 0.3s ease,
			color 0.3s ease;
		min-width: auto;
		text-shadow: var(--theme-text-shadow, 0 2px 10px rgba(0, 0, 0, 0.2));
		line-height: 1.4;
	}

	.picker.large {
		font-size: 128px;
		font-weight: 700;
		text-shadow: var(--theme-text-shadow, 0 4px 20px rgba(0, 0, 0, 0.3));
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

	/* 移动端优化 */
	@media (max-width: 768px) {
		.picker.large {
			font-size: 100px;
		}
	}
</style>
