/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    // add more paths if needed
  ],
  darkMode: ["class"],
  plugins: ["tailwindcss-animate"],
}