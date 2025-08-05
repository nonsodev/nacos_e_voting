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
            colors: {
                primary: {
                    light: '#A78BFA',
                    DEFAULT: '#8B5CF6',
                    dark: '#6D28D9'
                },
                secondary: {
                    light: '#FDBA74',
                    DEFAULT: '#F97316',
                    dark: '#C2410C'
                },
                neutral: {
                    50: '#F9FAFB',
                    100: '#F3F4F6',
                    200: '#E5E7EB',
                    300: '#D1D5DB',
                    400: '#9CA3AF',
                    500: '#6B7280',
                    600: '#4B5563',
                    700: '#374151',
                    800: '#1F2937',
                    900: '#111827'
                },
                success: {
                    DEFAULT: '#10B981',
                    light: '#6EE7B7'
                },
                danger: {
                    DEFAULT: '#EF4444',
                    light: '#FCA5A5'
                }
            }
        }
    },
    plugins: []
}