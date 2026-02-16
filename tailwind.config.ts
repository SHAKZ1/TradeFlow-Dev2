import type { Config } from "tailwindcss";

const config: Config = {
  corePlugins: {
    preflight: false, // We handle this manually in globals.css for the landing page
  },
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      colors: {
        // BRAND COLOR (From Logo)
        tradeflow: {
          DEFAULT: "#0038A8", // The deep Royal Blue from your logo
          light: "#0055FF",   // A brighter variant for hovers
          dark: "#002266",    // A darker variant for active states
          50: "#F0F5FF",      // Subtle backgrounds
          100: "#E0EAFF",
        },
        // APPLE SYSTEM COLORS
        ios: {
          bg: "#F5F5F7",       // The classic light gray background
          surface: "#FFFFFF",
          text: "#1D1D1F",     // Off-black
          subtext: "#86868B",  // Secondary gray
          border: "#E5E5EA",   // Subtle borders
          blue: "#007AFF",     // System Blue (Action)
          green: "#34C759",    // Success
          red: "#FF3B30",      // Destructive
          orange: "#FF9500",   // Warning
          indigo: "#5856D6",   // Purple/Indigo
        }
      },
      boxShadow: {
        'ios': '0 4px 20px rgba(0, 0, 0, 0.04)',
        'ios-hover': '0 10px 40px rgba(0, 0, 0, 0.08)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
      }
    },
  },
  plugins: [],
};
export default config;