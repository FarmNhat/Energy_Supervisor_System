
export default {
  content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FFFCFA',
          100: '#FDF8F3',
          200: '#F7EFE5',
          300: '#EFE3D5'
        },
        warmgreen: {
          50: '#F2F7F4',
          100: '#E1EFE6',
          400: '#7AB893',
          500: '#549F75',
          600: '#3F7A59'
        },
        amber: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          400: '#FBBF24',
          500: '#F59E0B'
        },
        coral: {
          50: '#FDF3F2',
          100: '#FBE4E2',
          400: '#F08A81',
          500: '#EB6559'
        }
      },
      fontFamily: {
        heading: ['Sora', 'sans-serif'],
        body: ['Manrope', 'sans-serif']
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}
