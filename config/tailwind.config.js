/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./assets/js/**/*.js",
    "./data/**/*.json"
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          blue: "#00f2fe",
          purple: "#ab47bc",
        },
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0,0,0,0.37)",
      },
      borderRadius: {
        xl: "16px",
      },
    },
  },
  plugins: [],
};
