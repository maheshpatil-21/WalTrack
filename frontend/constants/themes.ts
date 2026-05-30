import { theme as baseTheme } from './theme';

export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  colors: {
    primary: {
      DEFAULT: string;
      dark: string;
      light: string;
      bg: string;
    };
    secondary: {
      DEFAULT: string;
      gray: string;
      lightGray: string;
      border: string;
    };
    background: string;
    surface: string;
    surfaceVariant: string;
    danger: string;
    warning: string;
    success: string;
    text: {
      primary: string;
      secondary: string;
      tertiary: string;
      inverse: string;
    };
    chart: {
      pieColors: string[];
      barPrimary: string;
      barSecondary: string;
      lineColor: string;
    };
  };
  spacing: typeof baseTheme.spacing;
  radius: typeof baseTheme.radius;
  typography: typeof baseTheme.typography;
}

export const lightTheme: ThemeColors = {
  colors: {
    primary: {
      DEFAULT: '#10B981',
      dark: '#059669',
      light: '#34D399',
      bg: '#ECFDF5',
    },
    secondary: {
      DEFAULT: '#111827',
      gray: '#6B7280',
      lightGray: '#F3F4F6',
      border: '#E5E7EB',
    },
    background: '#FFFFFF',
    surface: '#FAFAFA',
    surfaceVariant: '#F3F4F6',
    danger: '#EF4444',
    warning: '#F59E0B',
    success: '#10B981',
    text: {
      primary: '#111827',
      secondary: '#6B7280',
      tertiary: '#9CA3AF',
      inverse: '#FFFFFF',
    },
    chart: {
      pieColors: [
        '#10B981',
        '#3B82F6',
        '#F59E0B',
        '#EF4444',
        '#8B5CF6',
        '#EC4899',
        '#06B6D4',
        '#F97316',
      ],
      barPrimary: '#10B981',
      barSecondary: '#DBEAFE',
      lineColor: '#6B7280',
    },
  },
  spacing: baseTheme.spacing,
  radius: baseTheme.radius,
  typography: baseTheme.typography,
};

export const darkTheme: ThemeColors = {
  colors: {
    primary: {
      DEFAULT: '#14B8A6',
      dark: '#0D9488',
      light: '#2DD4BF',
      bg: '#0F766E20',
    },
    secondary: {
      DEFAULT: '#F1F5F9',
      gray: '#94A3B8',
      lightGray: '#1E293B',
      border: '#334155',
    },
    background: '#0F172A',
    surface: '#1E293B',
    surfaceVariant: '#334155',
    danger: '#F87171',
    warning: '#FBBF24',
    success: '#2DD4BF',
    text: {
      primary: '#F1F5F9',
      secondary: '#CBD5E1',
      tertiary: '#94A3B8',
      inverse: '#0F172A',
    },
    chart: {
      pieColors: [
        '#14B8A6',
        '#60A5FA',
        '#FBBF24',
        '#F87171',
        '#A78BFA',
        '#F472B6',
        '#22D3EE',
        '#FB923C',
      ],
      barPrimary: '#14B8A6',
      barSecondary: '#1E3A8A',
      lineColor: '#CBD5E1',
    },
  },
  spacing: baseTheme.spacing,
  radius: baseTheme.radius,
  typography: baseTheme.typography,
};

export const getTheme = (mode: ThemeMode): ThemeColors => {
  return mode === 'dark' ? darkTheme : lightTheme;
};
