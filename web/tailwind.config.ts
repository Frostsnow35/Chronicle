import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f9fafb",
          100: "#f3f4f6",
          200: "#e5e7eb",
          300: "#d1d5db",
          400: "#9ca3af",
          500: "#6b7280",
          600: "#4b5563",
          700: "#374151",
          800: "#1f2937",
          900: "#111827",
          950: "#0f172a"
        },
        "hermes-orange": {
          50: "#FFF4EC",
          100: "#FFE2CA",
          200: "#FFC494",
          300: "#FFA55E",
          400: "#FF8628",
          500: "#FF6B00",
          600: "#E05E00",
          700: "#B84D00",
          800: "#8F3B00",
          900: "#662A00"
        },
        "sky-blue": {
          50: "#ECF9FF",
          100: "#CAEFFE",
          200: "#94DEFD",
          300: "#5ECDFB",
          400: "#28BCF9",
          500: "#38BDF8",
          600: "#0EA5E0",
          700: "#0B85B4",
          800: "#086588",
          900: "#05455C"
        },
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          strong: "rgb(var(--accent-strong) / <alpha-value>)",
          secondary: "rgb(var(--accent-2) / <alpha-value>)"
        }
      },
      fontFamily: {
        serif: [
          '"Source Han Serif SC"',
          '"Songti SC"',
          '"STSong"',
          '"SimSun"',
          "Georgia",
          '"Times New Roman"',
          "serif"
        ],
        sans: [
          '"PingFang SC"',
          '"Microsoft YaHei"',
          '"Hiragino Sans GB"',
          "system-ui",
          "-apple-system",
          "sans-serif"
        ]
      },
      boxShadow: {
        glass:
          "0 1px 2px rgba(0,0,0,0.04), 0 8px 32px rgba(31,38,135,0.08)",
        "glass-lg":
          "0 2px 6px rgba(0,0,0,0.06), 0 16px 64px rgba(31,38,135,0.12)"
      },
      keyframes: {
        "float-gradient": {
          "0%,100%": { transform: "translate(0,0) scale(1)" },
          "50%": { transform: "translate(-3%,2%) scale(1.04)" }
        },
        "float-gradient-reverse": {
          "0%,100%": { transform: "translate(0,0) scale(1)" },
          "50%": { transform: "translate(3%,-2%) scale(1.05)" }
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        }
      },
      animation: {
        "float-gradient": "float-gradient 22s ease-in-out infinite",
        "float-gradient-reverse":
          "float-gradient-reverse 28s ease-in-out infinite",
        "fade-up": "fade-up 600ms ease-out both"
      }
    }
  },
  plugins: []
};

export default config;
