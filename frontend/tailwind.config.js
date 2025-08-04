/** @type {import('tailwindcss').Config} */
const { fontFamily } = require('tailwindcss/defaultTheme')

module.exports = {
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}'
    ],
    theme: {
        extend: {
            // 1. Our Custom Color Palette
            colors: {
                primary: {
                    light: '#4A6FA5', // Lighter blue for hover states
                    DEFAULT: '#1E3A8A', // Main brand blue (a deep, rich blue)
                    dark: '#1D3557' // Darker blue for active states or text
                },
                secondary: {
                    light: '#FFD700',
                    DEFAULT: '#FFC107', // A vibrant gold for accents
                    dark: '#FFA000'
                },
                neutral: {
                    50: '#F9FAFB', // Very light gray for page backgrounds
                    100: '#F3F4F6', // Light backgrounds for cards/sections
                    200: '#E5E7EB', // Light borders
                    300: '#D1D5DB',
                    400: '#9CA3AF', // Muted text, icons
                    500: '#6B7280', // Sub-headings, less important text
                    600: '#4B5563', // Body text
                    700: '#374151',
                    800: '#1F2937', // Main headings
                    900: '#111827' // Almost black
                },
                success: {
                    DEFAULT: '#10B981', // Green for success messages
                    light: '#6EE7B7'
                },
                danger: {
                    DEFAULT: '#EF4444', // Red for error messages
                    light: '#FCA5A5'
                }
            },
            fontFamily: {
                sans: ['var(--font-sans)', ...fontFamily.sans]
            }
        }
    },
    plugins: []
}