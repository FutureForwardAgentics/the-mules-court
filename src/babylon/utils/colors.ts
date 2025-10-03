import type { GradientColors } from '../../types/babylon';

/**
 * Tailwind CSS color palette mapped to hex strings
 * Based on Tailwind CSS v3/v4 default colors
 */
const TAILWIND_COLORS: Record<string, Record<number, string>> = {
  slate: {
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },
  gray: {
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
    950: '#030712',
  },
  blue: {
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554',
  },
  indigo: {
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
    950: '#1e1b4b',
  },
  purple: {
    700: '#7e22ce',
    800: '#6b21a8',
    900: '#581c87',
    950: '#3b0764',
  },
  amber: {
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
    950: '#451a03',
  },
  cyan: {
    700: '#0e7490',
    800: '#155e75',
    900: '#164e63',
    950: '#083344',
  },
  rose: {
    700: '#be123c',
    800: '#9f1239',
    900: '#881337',
    950: '#4c0519',
  },
  red: {
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
    950: '#450a0a',
  },
  yellow: {
    700: '#a16207',
    800: '#854d0e',
    900: '#713f12',
    950: '#422006',
  },
  emerald: {
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
    950: '#022c22',
  },
};

/**
 * Parse Tailwind gradient class names and return hex color strings
 *
 * @param gradientClasses - Tailwind classes like "from-slate-700 to-slate-900"
 * @returns Object with startColor and endColor as hex strings
 */
export function parseTailwindGradient(gradientClasses: string): GradientColors {
  const classes = gradientClasses.split(' ');

  let startColor = '#000000';
  let endColor = '#000000';

  for (const cls of classes) {
    const fromMatch = cls.match(/^from-(\w+)-(\d+)$/);
    const toMatch = cls.match(/^to-(\w+)-(\d+)$/);

    if (fromMatch) {
      const [, colorName, shade] = fromMatch;
      if (colorName === 'black') {
        startColor = '#000000';
      } else {
        const colorMap = TAILWIND_COLORS[colorName];
        if (colorMap) {
          const shadeValue = parseInt(shade, 10);
          startColor = colorMap[shadeValue] ?? '#000000';
        }
      }
    }

    if (toMatch) {
      const [, colorName, shade] = toMatch;
      if (colorName === 'black') {
        endColor = '#000000';
      } else {
        const colorMap = TAILWIND_COLORS[colorName];
        if (colorMap) {
          const shadeValue = parseInt(shade, 10);
          endColor = colorMap[shadeValue] ?? '#000000';
        }
      }
    }
  }

  return { startColor, endColor };
}
