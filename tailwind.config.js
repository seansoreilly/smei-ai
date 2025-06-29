/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        smecai: {
          blue: "#1E3A8A",
          "light-blue": "#3B82F6",
          "dark-blue": "#1E40AF",
          gray: "#6B7280",
          "light-gray": "#F3F4F6",
          white: "#FFFFFF",
          black: "#000000",
        },
      },
      fontFamily: {
        metropolis: ["Metropolis-Light", "sans-serif"],
        sans: ["Metropolis-Light", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
