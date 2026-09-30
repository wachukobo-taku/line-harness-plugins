export interface ThemePreset {
  id: string
  name: string
  description: string
  colors: {
    page: string
    surface: string
    text: string
    muted: string
    primary: string
    primaryHover: string
    border: string
    focus: string
  }
  radius: string
  font: string
}

export const themes: ThemePreset[] = [
  {
    id: 'line',
    name: 'LINE Green',
    description: 'LineHarnessらしい安心感のある標準テーマ',
    colors: {
      page: '#f3f7f5',
      surface: '#ffffff',
      text: '#14231b',
      muted: '#637269',
      primary: '#06c755',
      primaryHover: '#05ad4d',
      border: '#dce7e0',
      focus: '#087a36',
    },
    radius: '18px',
    font: '"Noto Sans JP", system-ui, sans-serif',
  },
  {
    id: 'midnight',
    name: 'Midnight Premium',
    description: '高額商品や限定オファー向けの上質なダークテーマ',
    colors: {
      page: '#07111f',
      surface: '#101d2e',
      text: '#f7f9fc',
      muted: '#9eacc0',
      primary: '#d6b878',
      primaryHover: '#ead39d',
      border: '#29384d',
      focus: '#f2d89c',
    },
    radius: '14px',
    font: '"Noto Sans JP", system-ui, sans-serif',
  },
  {
    id: 'ocean',
    name: 'Ocean Trust',
    description: '教育・コンサルティング向けの信頼感あるブルー',
    colors: {
      page: '#eef5ff',
      surface: '#ffffff',
      text: '#10233f',
      muted: '#60728b',
      primary: '#2563eb',
      primaryHover: '#1d4ed8',
      border: '#d7e4f7',
      focus: '#1e40af',
    },
    radius: '22px',
    font: '"Noto Sans JP", system-ui, sans-serif',
  },
  {
    id: 'sakura',
    name: 'Sakura Warm',
    description: '美容・コミュニティ向けの柔らかいテーマ',
    colors: {
      page: '#fff5f7',
      surface: '#ffffff',
      text: '#3b2027',
      muted: '#85666f',
      primary: '#d94f70',
      primaryHover: '#be3d5c',
      border: '#f2d7df',
      focus: '#9f2847',
    },
    radius: '26px',
    font: '"Noto Sans JP", system-ui, sans-serif',
  },
  {
    id: 'minimal',
    name: 'Minimal Ink',
    description: '業種を選ばず使える端正なモノクロテーマ',
    colors: {
      page: '#f5f5f3',
      surface: '#ffffff',
      text: '#171717',
      muted: '#6b6b68',
      primary: '#171717',
      primaryHover: '#333333',
      border: '#deded9',
      focus: '#171717',
    },
    radius: '8px',
    font: '"Noto Sans JP", system-ui, sans-serif',
  },
]

export function resolveTheme(requested: string | null, fallback = 'line'): ThemePreset {
  return themes.find(theme => theme.id === requested)
    ?? themes.find(theme => theme.id === fallback)
    ?? themes[0]
}
