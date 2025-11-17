<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		controlId,
		label = '',
		brand,
		hint,
		direction = 'column',
		children
	}: {
		controlId?: string;
		label?: string;
		brand?: string;
		hint?: string;
		direction?: 'column' | 'row';
		children?: Snippet;
	} = $props();
</script>

<div class="form-field" data-direction={direction}>
	{#if label}
		<label class="form-label" for={controlId ?? undefined}>
			{label}
		</label>
	{/if}
	<div class="form-control">
		{@render children?.()}
	</div>
	{#if brand}
		<span class="brand-tag">{brand}</span>
	{/if}
	{#if hint}
		<p class="form-hint">{hint}</p>
	{/if}
</div>

<style>
	.form-field {
		display: flex;
		flex-direction: var(--form-direction, column);
		gap: 0.25rem;
		align-items: flex-start;
	}

	.form-field[data-direction='row'] {
		--form-direction: row;
		align-items: center;
		gap: 0.75rem;
	}

	.form-control {
		width: 100%;
	}
</style>
