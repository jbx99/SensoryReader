import type { Preset, ReaderConfig } from '../types';
import { getDefaultConfig } from './defaults';

let counter = Date.now();

export function createPreset(name: string, config: ReaderConfig): Preset {
  return {
    id: `preset_${counter++}`,
    name,
    builtIn: false,
    config: structuredClone(config),
  };
}

export function duplicatePreset(preset: Preset): Preset {
  return {
    id: `preset_${counter++}`,
    name: `${preset.name} (copy)`,
    builtIn: false,
    config: structuredClone(preset.config),
  };
}

export function exportPreset(preset: Preset): string {
  return JSON.stringify(preset, null, 2);
}

export function importPreset(json: string): Preset {
  const parsed = JSON.parse(json);
  return {
    id: `preset_${counter++}`,
    name: parsed.name ?? 'Imported',
    builtIn: false,
    config: mergeWithDefaults(parsed.config ?? {}),
  };
}

export function mergeWithDefaults(partial: Partial<ReaderConfig>): ReaderConfig {
  const defaults = getDefaultConfig();
  return {
    speed: { ...defaults.speed, ...partial.speed },
    typography: { ...defaults.typography, ...partial.typography },
    background: { ...defaults.background, ...partial.background },
    display: { ...defaults.display, ...partial.display },
  };
}
