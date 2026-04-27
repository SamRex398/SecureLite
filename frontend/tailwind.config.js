/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#07111f",
          900: "#0c1930",
          800: "#122341",
        },
        signal: {
          cyan: "#6ee7f9",
          lime: "#bef264",
          amber: "#fbbf24",
          coral: "#fb7185",
        },
      },
      boxShadow: {
        glow: "0 20px 60px rgba(110, 231, 249, 0.18)",
      },
      backgroundImage: {
        mesh:
          "radial-gradient(circle at top left, rgba(110, 231, 249, 0.16), transparent 30%), radial-gradient(circle at top right, rgba(190, 242, 100, 0.14), transparent 28%), linear-gradient(135deg, #07111f 0%, #0c1930 55%, #07111f 100%)",
      },
      fontFamily: {
        display: ['"Space Grotesk"', "sans-serif"],
        body: ['"DM Sans"', "sans-serif"],
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
