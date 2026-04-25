import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    fontFamily: {
      sans:    ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      display: ['"Gloock"', 'Georgia', 'serif'],
      mono:    ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
    },
    extend: {
      colors: {
        background:    "hsl(var(--background))",
        foreground:    "hsl(var(--foreground))",
        card: {
          DEFAULT:     "hsl(var(--card))",
          foreground:  "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT:     "hsl(var(--popover))",
          foreground:  "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT:     "hsl(var(--primary))",
          foreground:  "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT:     "hsl(var(--secondary))",
          foreground:  "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT:     "hsl(var(--muted))",
          foreground:  "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:     "hsl(var(--accent))",
          foreground:  "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT:     "hsl(var(--destructive))",
          foreground:  "hsl(var(--destructive-foreground))",
        },
        border:        "hsl(var(--border))",
        input:         "hsl(var(--input))",
        ring:          "hsl(var(--ring))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      backgroundImage: {
        "hero-glow":   "var(--gradient-glow)",
      },
      boxShadow: {
        glow:          "var(--shadow-glow)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 0 0 hsl(var(--primary) / 0.45)" },
          "50%":      { boxShadow: "0 0 30px 6px hsl(var(--primary) / 0.35)" },
        },
      },
      animation: {
        "fade-up":    "fade-up 0.6s ease-out both",
        "glow-pulse": "glow-pulse 2.8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
