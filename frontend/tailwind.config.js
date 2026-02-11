/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'umbrella-red': '#DC0000',
                'umbrella-accent': '#FF0000',
                'umbrella-white': '#FFFFFF',
                'umbrella-black': '#121212',
                'umbrella-dark': '#1a1a1a',
                pharmacy: {
                    50: '#f0fdf4',
                    100: '#dcfce7',
                    600: '#16a34a',
                    700: '#15803d',
                }
            },
            fontFamily: {
                sans: ['Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
                mono: ['Consolas', 'Monaco', 'Courier New', 'monospace'],
            }
        }
    },
    plugins: [],
}
