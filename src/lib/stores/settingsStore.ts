import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import type { Language, Region, Unit } from '$lib/i18n';
import type { ThemeName } from '$lib/theme/themeConfig';
import { DEFAULT_SETTINGS } from '$lib/config/constants';

const STORAGE_KEY = 'cup-holder:settings';

export interface SettingsState {
	language: Language;
	region: Region;
	theme: ThemeName;
	unit: Unit;
}

const DEFAULT_STATE: SettingsState = {
	language: DEFAULT_SETTINGS.LANGUAGE,
	region: DEFAULT_SETTINGS.REGION,
	theme: DEFAULT_SETTINGS.THEME,
	unit: DEFAULT_SETTINGS.UNIT
};

function loadFromStorage(): SettingsState {
	if (!browser) return DEFAULT_STATE;
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return DEFAULT_STATE;
		const parsed = JSON.parse(raw) as Partial<SettingsState>;
		return { ...DEFAULT_STATE, ...parsed };
	} catch {
		return DEFAULT_STATE;
	}
}

function persist(state: SettingsState) {
	if (!browser) return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
	} catch {
		// Silently ignore storage errors
	}
}

function createSettingsStore() {
	const { subscribe, update } = writable<SettingsState>(loadFromStorage(), (set) => {
		// ensure latest defaults when store is first used
		if (browser) {
			const state = loadFromStorage();
			set(state);
		}
		return () => {};
	});

	function patch(partial: Partial<SettingsState>) {
		update((current) => {
			const next = { ...current, ...partial };
			persist(next);
			return next;
		});
	}

	return {
		subscribe,
		setLanguage(language: Language) {
			patch({ language });
		},
		setRegion(region: Region) {
			patch({ region });
		},
		setTheme(theme: ThemeName) {
			patch({ theme });
		},
		setUnit(unit: Unit) {
			patch({ unit });
		},
		reset() {
			patch(DEFAULT_STATE);
		}
	};
}

export const settingsStore = createSettingsStore();
