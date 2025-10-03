import type { GradientColors } from '../../types/pixi';

/**
 * Tailwind CSS color palette mapped to hex values
 * Based on Tailwind CSS v3/v4 default colors
 * https://tailwindcss.com/docs/customizing-colors
 */
const TAILWIND_COLORS: Record<string, Record<number, number>> = {
  slate: {
    700: 0x334155,
    800: 0x1e293b,
    900: 0x0f172a,
    950: 0x020617,
  },
  gray: {
    700: 0x374151,
    800: 0x1f2937,
    900: 0x111827,
    950: 0x030712,
  },
  blue: {
    700: 0x1d4ed8,
    800: 0x1e40af,
    900: 0x1e3a8a,
    950: 0x172554,
  },
  indigo: {
    700: 0x4338ca,
    800: 0x3730a3,
    900: 0x312e81,
    950: 0x1e1b4b,
  },
  purple: {
    700: 0x7e22ce,
    800: 0x6b21a8,
    900: 0x581c87,
    950: 0x3b0764,
  },
  amber: {
    700: 0xb45309,
    800: 0x92400e,
    900: 0x78350f,
    950: 0x451a03,
  },
  cyan: {
    700: 0x0e7490,
    800: 0x155e75,
    900: 0x164e63,
    950: 0x083344,
  },
  rose: {
    700: 0xbe123c,
    800: 0x9f1239,
    900: 0x881337,
    950: 0x4c0519,
  },
  red: {
    700: 0xb91c1c,
    800: 0x991b1b,
    900: 0x7f1d1d,
    950: 0x450a0a,
  },
  yellow: {
    700: 0xa16207,
    800: 0x854d0e,
    900: 0x713f12,
    950: 0x422006,
  },
  emerald: {
    700: 0x047857,
    800: 0x065f46,
    900: 0x064e3b,
    950: 0x022c22,
  },
  black: {
    0: 0x000000,
  },
};

/**
 * Parse Tailwind gradient class names and return hex colors
 *
 * @param gradientClasses - Tailwind classes like "from-slate-700 to-slate-900"
 * @returns Object with startColor and endColor as hex numbers
 *
 * @example
 * parseTailwindGradient("from-slate-700 to-slate-900")
 * // Returns: { startColor: 0x334155, endColor: 0x0f172a }
 */
export function parseTailwindGradient(gradientClasses: string): GradientColors {
  const classes = gradientClasses.split(' ');

  let startColor = 0x000000; // Default to black
  let endColor = 0x000000;

  for (const cls of classes) {
    // Parse "from-{color}-{shade}" or "to-{color}-{shade}"
    const fromMatch = cls.match(/^from-(\w+)-(\d+)$/);
    const toMatch = cls.match(/^to-(\w+)-(\d+)$/);

    if (fromMatch) {
      const [, colorName, shade] = fromMatch;
      if (colorName === 'black') {
        startColor = 0x000000;
      } else {
        const colorMap = TAILWIND_COLORS[colorName];
        if (colorMap) {
          const shadeValue = parseInt(shade, 10);
          startColor = colorMap[shadeValue] ?? 0x000000;
        }
      }
    }

    if (toMatch) {
      const [, colorName, shade] = toMatch;
      if (colorName === 'black') {
        endColor = 0x000000;
      } else {
        const colorMap = TAILWIND_COLORS[colorName];
        if (colorMap) {
          const shadeValue = parseInt(shade, 10);
          endColor = colorMap[shadeValue] ?? 0x000000;
        }
      }
    }
  }

  return { startColor, endColor };
}

/**
 * Convert hex color to CSS rgba string (for debugging/testing)
 *
 * @param hex - Hex color number (e.g., 0x334155)
 * @param alpha - Alpha value 0-1
 * @returns CSS rgba string
 */
export function hexToRgba(hex: number, alpha: number = 1): string {
  const r = (hex >> 16) & 0xff;
  const g = (hex >> 8) & 0xff;
  const b = hex & 0xff;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
