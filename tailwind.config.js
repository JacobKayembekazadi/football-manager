/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdf4',
          500: '#22c55e', // FM-style green (primary CTA)
          600: '#16a34a',
          900: '#14532d',
          950: '#052e16',
        },
        // FM-style accent colors (calm, professional)
        accent: {
          green: '#22c55e',   // Primary CTA (Continue button)
          amber: '#f59e0b',   // Warnings, attention
          purple: '#9333ea',  // FM signature accent
          red: '#dc2626',     // Muted red for alerts
          blue: '#3b82f6',    // Info, links
        },
        // Subtle glass effects
        glass: {
          100: 'rgba(255, 255, 255, 0.03)',
          200: 'rgba(255, 255, 255, 0.06)',
          300: 'rgba(255, 255, 255, 0.1)',
          border: 'rgba(255, 255, 255, 0.08)',
        },
        // Dark theme (deep navy/charcoal, not pure black)
        dark: {
          bg: '#0f172a',      // Deep navy
          surface: '#1e293b', // Slate
          card: '#334155',    // Lighter slate for cards
        },
        // Legacy neon mappings (for transition - will be removed)
        neon: {
          blue: '#3b82f6',    // Now calm blue
          purple: '#9333ea',  // FM purple
          green: '#22c55e',   // FM green
          pink: '#ec4899'     // Calm pink
        },
        // New pitch colors
        pitch: {
          400: '#22c55e',
          500: '#16a34a',
        }
      },
      fontFamily: {
        sans: ['Space Grotesk', 'Inter', 'sans-serif'],
        display: ['Rajdhani', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'grid-pattern': "linear-gradient(to right, #1f2937 1px, transparent 1px), linear-gradient(to bottom, #1f2937 1px, transparent 1px)",
        'radial-glow': "radial-gradient(circle at center, var(--tw-gradient-stops))",
      },
      animation: {
        'pulse-fast': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'scanline': 'scanline 8s linear infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px #22c55e, 0 0 10px #22c55e' },
          '100%': { boxShadow: '0 0 15px #22c55e, 0 0 20px #22c55e' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    }
  },
  plugins: [],
}
