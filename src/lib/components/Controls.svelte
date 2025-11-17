<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let appState: {
		underbust: number;
		targetBust: number;
		foundShape: number;
		mode?: string;
		x?: number;
		y?: number;
		r_A?: number;
	};

	const dispatch = createEventDispatcher();

	function update() {
		dispatch('update', appState);
	}

	function themeChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		dispatch('themeChange', target.value);
	}
</script>

<div id="controls">
	<label for="themeSelector">主题风格:</label>
	<select
		id="themeSelector"
		onchange={themeChange}
		style="width: 100%; padding: 5px; margin-bottom: 15px;"
	>
		<option value="spongebob">Spongebob</option>
		<option value="barbie">Barbie</option>
		<option value="toon">Toon</option>
		<option value="cyberpunk">Cyberpunk</option>
		<option value="alien">Alien</option>
	</select>

	<label for="underbust">下胸围 (cm): <span>{appState.underbust.toFixed(0)}</span></label>
	<input
		type="range"
		id="underbust"
		min="30"
		max="200"
		step="1"
		bind:value={appState.underbust}
		oninput={update}
	/>

	<label for="bustCirc">上胸围 (cm): <span>{appState.targetBust.toFixed(2)}</span></label>
	<input
		type="range"
		id="bustCirc"
		min={appState.underbust}
		max={appState.underbust + 200}
		step="0.01"
		bind:value={appState.targetBust}
		oninput={update}
	/>

	<div id="readouts">
		<div id="debug-readout">
			<b>统一数学值:</b><br />
			模式 = <span>{appState.mode || '...'}</span><br />
			x = <span>{appState.x?.toFixed(2) || '...'}</span>, y =
			<span>{appState.y?.toFixed(2) || '...'}</span>, r_A =
			<span>{appState.r_A?.toFixed(2) || '...'}</span>
			<br />
			<b>引擎状态:</b> 求解 shape = <span>{appState.foundShape.toFixed(2)}</span>
		</div>
	</div>
</div>

<style>
	#controls {
		position: absolute;
		top: 10px;
		left: 10px;
		background: rgba(0, 0, 0, 0.5);
		padding: 10px;
		border-radius: 5px;
		font-family: sans-serif;
		min-width: 350px;
		color: white;
	}
	#controls label,
	#readouts div {
		display: block;
		margin: 10px;
	}
	#readouts {
		margin-top: 15px;
		border-top: 1px solid #555;
		padding-top: 10px;
	}
	#readouts div {
		font-size: 1.1em;
		color: #8f0;
	}
	#debug-readout {
		font-size: 0.8em;
		color: #aaa;
		line-height: 1.6;
	}
</style>
