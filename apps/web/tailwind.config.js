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
                gold: '#c8a84b',
                'gold-dark': '#9e7b3a',
                'navy': '#060f2c',
                'midnight': '#2d3b75',
            },
        },
    },
    plugins: [],
};