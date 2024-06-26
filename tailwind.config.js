import typography from '@tailwindcss/typography'
import forms from '@tailwindcss/forms'
import aspectRatio from '@tailwindcss/aspect-ratio'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        tDarkPurple: '#27004D',
        tPurple: '#5603A8',
        tLightPurple: '#9E4AF1',
        tBeige: '#FFF8EA',
        tYellow: '#FFC665'
      }
    }
  },
  plugins: [typography, forms, aspectRatio]
}
