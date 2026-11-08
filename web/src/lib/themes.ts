import { lget, lset } from './util'

type Vars = Record<string, string>
export type Theme = { id: string; name: string; swatch: string; light: Vars; dark: Vars }

const base = { '--go': '#d9a21b', '--rd': '#dc4a4a', '--vi': '#1e3a8a' }
const baseDark = { '--go': '#f0b93a', '--rd': '#ef6a6a' }

/** Renk ailesinden (ton) açık/koyu nötr renkleri üretir. */
function make(
  id: string,
  name: string,
  h: number,
  c: { a1: string; a2: string; h1: string; h2: string; h3: string; pk: string; te: string },
): Theme {
  return {
    id,
    name,
    swatch: `${c.a1},${c.a2}`,
    light: {
      ...base,
      '--bg': `hsl(${h} 22% 93%)`,
      '--bg2': `hsl(${h} 35% 97%)`,
      '--card': '#ffffff',
      '--ink': `hsl(${h} 50% 12%)`,
      '--mut': `hsl(${h} 14% 40%)`,
      '--ln': `hsl(${h} 18% 84%)`,
      '--pk': c.pk,
      '--te': c.te,
      '--a1': c.a1,
      '--a2': c.a2,
      '--h1': c.h1,
      '--h2': c.h2,
      '--h3': c.h3,
    },
    dark: {
      ...baseDark,
      '--bg': `hsl(${h} 40% 7%)`,
      '--bg2': `hsl(${h} 36% 10%)`,
      '--card': `hsl(${h} 34% 13%)`,
      '--ink': `hsl(${h} 30% 94%)`,
      '--mut': `hsl(${h} 16% 68%)`,
      '--ln': `hsl(${h} 28% 21%)`,
      '--pk': c.a1,
      '--te': c.te,
      '--a1': c.a1,
      '--a2': c.a2,
      '--h1': c.h1,
      '--h2': c.h2,
      '--h3': c.h3,
    },
  }
}

export const THEMES: Theme[] = [
  {
    id: 'zumrut',
    name: 'Zümrüt',
    swatch: '#14b8a6,#0b4f6c',
    light: {
      ...base, '--bg': '#e9f0ef', '--bg2': '#f6faf9', '--card': '#ffffff', '--ink': '#0b2a2e', '--mut': '#5b7775', '--ln': '#d3e2e0',
      '--pk': '#0f766e', '--te': '#0d9f8a', '--a1': '#14b8a6', '--a2': '#0b4f6c', '--h1': '#0a1f33', '--h2': '#0b3b45', '--h3': '#0f5f5b',
    },
    dark: {
      ...baseDark, '--bg': '#06151a', '--bg2': '#0b2127', '--card': '#0f2a31', '--ink': '#e6f4f1', '--mut': '#8db1ac', '--ln': '#1c434a',
      '--pk': '#14b8a6', '--te': '#2dd4bf', '--a1': '#14b8a6', '--a2': '#0b4f6c', '--h1': '#0a1f33', '--h2': '#0b3b45', '--h3': '#0f5f5b',
    },
  },
  {
    id: 'okyanus',
    name: 'Okyanus',
    swatch: '#3b82f6,#1e3a8a',
    light: {
      ...base, '--bg': '#e6edf8', '--bg2': '#f4f7fc', '--card': '#ffffff', '--ink': '#0b1b3a', '--mut': '#5a6d8f', '--ln': '#cfdaee',
      '--pk': '#1d4ed8', '--te': '#0ea5e9', '--a1': '#3b82f6', '--a2': '#1e3a8a', '--h1': '#0a1230', '--h2': '#12306b', '--h3': '#1d4ed8',
    },
    dark: {
      ...baseDark, '--bg': '#070d1f', '--bg2': '#0d1630', '--card': '#111d3d', '--ink': '#e8eefc', '--mut': '#93a6d0', '--ln': '#233463',
      '--pk': '#3b82f6', '--te': '#38bdf8', '--a1': '#3b82f6', '--a2': '#1e3a8a', '--h1': '#0a1230', '--h2': '#12306b', '--h3': '#1d4ed8',
    },
  },
  {
    id: 'ametist',
    name: 'Ametist',
    swatch: '#8b5cf6,#4c1d95',
    light: {
      ...base, '--bg': '#eee9f8', '--bg2': '#f8f5fd', '--card': '#ffffff', '--ink': '#1d1236', '--mut': '#74649a', '--ln': '#ddd2f1',
      '--pk': '#6d28d9', '--te': '#10b981', '--a1': '#8b5cf6', '--a2': '#4c1d95', '--h1': '#1a1033', '--h2': '#3b1d7a', '--h3': '#6d28d9',
    },
    dark: {
      ...baseDark, '--bg': '#110a20', '--bg2': '#1b1233', '--card': '#251a44', '--ink': '#f0eaff', '--mut': '#b8a6e0', '--ln': '#3a2c66',
      '--pk': '#8b5cf6', '--te': '#34d399', '--a1': '#8b5cf6', '--a2': '#4c1d95', '--h1': '#1a1033', '--h2': '#3b1d7a', '--h3': '#6d28d9',
    },
  },
  {
    id: 'gunbatimi',
    name: 'Gün batımı',
    swatch: '#f97316,#9a1b3b',
    light: {
      ...base, '--bg': '#f8ece6', '--bg2': '#fdf7f3', '--card': '#ffffff', '--ink': '#34140f', '--mut': '#8f6a5e', '--ln': '#f0d9cd',
      '--pk': '#c2410c', '--te': '#0d9f8a', '--a1': '#f97316', '--a2': '#9a1b3b', '--h1': '#2b0f1a', '--h2': '#5a1830', '--h3': '#b4412a',
    },
    dark: {
      ...baseDark, '--bg': '#1a0c0c', '--bg2': '#2a1414', '--card': '#361b1a', '--ink': '#ffeee6', '--mut': '#d3a999', '--ln': '#573029',
      '--pk': '#f97316', '--te': '#2dd4bf', '--a1': '#f97316', '--a2': '#9a1b3b', '--h1': '#2b0f1a', '--h2': '#5a1830', '--h3': '#b4412a',
    },
  },
  make('orman', 'Orman', 150, { a1: '#22c55e', a2: '#14532d', h1: '#07210f', h2: '#0f4a24', h3: '#166534', pk: '#15803d', te: '#16a34a' }),
  make('kehribar', 'Kehribar', 36, { a1: '#f59e0b', a2: '#92400e', h1: '#26140a', h2: '#5a2d0c', h3: '#b45309', pk: '#b45309', te: '#0d9f8a' }),
  make('indigo', 'İndigo', 240, { a1: '#6366f1', a2: '#312e81', h1: '#0f0d2e', h2: '#1e1b6b', h3: '#4338ca', pk: '#4f46e5', te: '#06b6d4' }),
  make('lagun', 'Lagün', 190, { a1: '#06b6d4', a2: '#155e75', h1: '#06222b', h2: '#0b4152', h3: '#0e7490', pk: '#0e7490', te: '#10b981' }),
  make('yakut', 'Yakut', 355, { a1: '#ef4444', a2: '#7f1d1d', h1: '#250a0d', h2: '#5a1217', h3: '#b91c1c', pk: '#b91c1c', te: '#0d9f8a' }),
  make('grafit', 'Grafit', 215, { a1: '#94a3b8', a2: '#334155', h1: '#0b1220', h2: '#1e293b', h3: '#334155', pk: '#475569', te: '#14b8a6' }),
]

export type Mode = 'auto' | 'light' | 'dark'
export const getCt = () => {
  const c = lget('bt_ct') || 'zumrut'
  return THEMES.some((t) => t.id === c) ? c : 'zumrut'
}
export const getMode = (): Mode => {
  const m = lget('bt_th')
  return m === 'dark' || m === 'light' ? m : 'auto'
}
export const getFs = () => {
  const v = lget('bt_fs')
  return v === '.85' || v === '1' ? v : '.9'
}
export const resolveDark = (m: Mode = getMode()) =>
  m === 'dark' || (m === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)

export function applyTheme() {
  const t = THEMES.find((x) => x.id === getCt()) as Theme
  const dark = resolveDark()
  const root = document.documentElement
  const vars = dark ? t.dark : t.light
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v))
  root.dataset.theme = dark ? 'dark' : 'light'
  root.style.colorScheme = dark ? 'dark' : 'light'
  root.style.setProperty('--fs', getFs())
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', vars['--h1'])
}
export function setCt(id: string) {
  lset('bt_ct', id)
  applyTheme()
}
export function setMode(m: Mode) {
  if (m === 'auto') {
    try {
      localStorage.removeItem('bt_th')
    } catch {
      /* ignore */
    }
  } else lset('bt_th', m)
  applyTheme()
}
export function setFs(v: string) {
  lset('bt_fs', v)
  applyTheme()
}
