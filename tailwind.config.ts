import type { Config } from 'tailwindcss';

// Theme changes go through a [contract] PR (owner O1). O2 proposes the visual direction in task O2-B1.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
} satisfies Config;
