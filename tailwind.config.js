/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        amex: "#006FCF",
        aeroplan: "#F01428",
        pilot: "#7C5CFF",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-18px)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.35" },
          "50%": { opacity: "0.7" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        float: "float 8s ease-in-out infinite",
        "pulse-glow": "pulse-glow 6s ease-in-out infinite",
        "fade-in": "fade-in 0.3s ease-out",
      },
    },
  },
  plugins: [],
};
