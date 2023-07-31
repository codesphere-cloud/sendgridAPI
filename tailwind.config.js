/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./public/index.html','./public/success.html'],
  theme: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/forms')
  ],
}

