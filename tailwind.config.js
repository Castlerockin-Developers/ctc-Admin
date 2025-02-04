/** @type {import('tailwindcss').Config} */
export default {
    content: ["./src/**/*.{js,jsx,ts,tsx}",],
    theme: {
        extend: {},
        screens: {
            sm: "640px",  // Small devices (phones)
            md: "768px",  // Tablets
            lg: "1024px", // Laptops
            xl: "1280px", // Desktops
        },
    },
    plugins: [],
}