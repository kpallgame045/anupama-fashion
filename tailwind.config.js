/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        boutique: {
          bg: "#FAF7F2",
          surface: "#FFFFFF",
          surfaceWarm: "#F7F2EA",
          cardBg: "rgba(255, 255, 255, 0.85)",
          champagne: "#F0E6D8",
          champagneDark: "#E2D4C1",
          gold: "#C5A059",
          goldBright: "#D4AF37",
          goldLight: "#F5E8C7",
          goldMuted: "#A8833B",
          textPrimary: "#1C1917",
          textSecondary: "#57534E",
          textMuted: "#78716C",
          borderGold: "rgba(197, 160, 89, 0.25)",
        },
      },
      fontFamily: {
        serif: ["Playfair Display", "Cormorant Garamond", "Georgia", "serif"],
        sans: ["Plus Jakarta Sans", "Inter", "sans-serif"],
      },
      backgroundImage: {
        "gold-gradient": "linear-gradient(135deg, #E6D29A 0%, #C5A059 50%, #9E7B35 100%)",
        "light-radial": "radial-gradient(circle at 50% 0%, #FFFFFF 0%, #FAF7F2 80%)",
        "gold-shimmer-bg": "linear-gradient(90deg, rgba(197, 160, 89, 0.05) 0%, rgba(197, 160, 89, 0.15) 50%, rgba(197, 160, 89, 0.05) 100%)",
      },
      boxShadow: {
        "logo-highlight": "0 20px 40px -15px rgba(197, 160, 89, 0.35), 0 0 20px 0 rgba(197, 160, 89, 0.15)",
        "card-light": "0 10px 30px -5px rgba(28, 25, 23, 0.06), 0 4px 12px 0 rgba(197, 160, 89, 0.08)",
        "gold-btn": "0 8px 20px -4px rgba(197, 160, 89, 0.4)",
      },
    },
  },
  plugins: [],
};
