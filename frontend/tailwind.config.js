/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,jsx}"],
  mode: "jit",
  theme: {
    fontFamily: {
      Roboto: ["Roboto", "sans-serif"],
      Poppins: ['Poppins', "sans-serif"],
    },
    
    extend: {
      
      screens: {
        "1000px": "1050px",
        "1100px": "1110px",
        "800px": "800px",
        "1300px": "1300px",
        "400px":"400px",
      
          'xs': '475px',
          'sm': '640px',
          'md': '768px',
          'lg': '1024px',
          'xl': '1280px',
          '2xl': '1536px',
      
        
      },
      gridTemplateColumns: {
        // Simple 16 column grid
        '14': 'repeat(14, minmax(0, 1fr))',

        // Complex site-specific column configuration
        'footer': '200px minmax(900px, 1fr) 100px',
      },
      animation: {
        border: 'border 4s ease infinite',
      },
      keyframes: {
        border: {
          '0%, 100%': {
            background: 'linear-gradient(45deg, #6366F1, #8B5CF6, #D946EF, #6366F1)',
            backgroundSize: '200% 200%',
            backgroundPosition: '0% 50%'
          },
          '50%': {
            backgroundPosition: '100% 50%'
          },
        },
      },
    },
  },
  plugins: [],
};