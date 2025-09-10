/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    fontFamily: {
      'satisfy': ['Satisfy'],
      'rubik': ['Rubik'],
      'playfair': ['Playfair Display'],
    },
    colors: {
      'white': ['#ffffff'],
      'black': ['#000000'],
      'gray': ['#D9D9D9'],
      'red': ['#FF0000'],
      'darkGray': ['#7D7877'],
      'darkPink': ['#911439'],
      'lightPink': ['#FAEFED'],
      'accentDarkPink':['#B9677D'],
      'background-dark':['#EFCEC9'],
      'smallTitleColor':['#CE7F86'],
      'descriptionColor':['#666070'],
    },
    extend: {
      height: {
        'ownScreen': 'calc(100svh - 150px)',
        'ownScreenPicture': 'calc(100dvh - 80px)',
        'ownScreenSecondPicture': 'calc(100dvh - 50px)',
        'squareImageHeight': 'calc(100vw /2)',
        'squareImageHeightSmall': '100vw',

      },
      width: {
        'ownScreen': 'calc(100dvh - 150px)',
        'ownScreenPicture': 'calc(100dvh - 80px)',
        'ownScreenSecondPicture': 'calc(100dvh - 50px)',
        'squareImageWidth': 'calc(100vw /2)',
        'squareImageWidthSmall': '100vw',
        '90vw': '90vw'
      },
      screens: {
        'smallMobile': '0px',
        'mobile': '980px',
        'desktop': '1250px',
        'bigDesktop': '1440px',
      },
    },
    
  },
  plugins: [
    require('@tailwindcss/aspect-ratio'),
    function({ addUtilities }) {
      addUtilities({
        '.mobileTitle1': {
          'font-family': 'Satisfy, cursive',
          'font-size': '20px',
          'color': '#CE7F86',
        },
        '.desktopTitle1': {
          'font-family': 'Satisfy, cursive',
          'font-size': '20px',
          'color': '#CE7F86',
        },
        '.mobileTitle2': {
          'font-family': 'Playfair Display, serif',
          'font-size': '35px',
          'text-transform': 'uppercase',
          'color': '#000000',
        },
        '.desktopTitle2': {
          'font-family': 'Playfair Display, serif',
          'font-size': '70px',
          'text-transform': 'uppercase',
          'color': '#000000',
        },
        '.mobileTitle3': {
          'font-family': 'rubik, serif',
          'font-size': '15px',
          'color': '#666070',
        },
        '.desktopTitle3': {
          'font-family': 'rubik, serif',
          'font-size': '15px',
          'color': '#666070',
        },
      });
    },
  ],
}