// eslint.config.mjs
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Reutilizamos las reglas de Next (Core Web Vitals + TypeScript)
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // Reglas puntuales para silenciar tus avisos/errores actuales
  {
    rules: {
      // Warnings que listaste
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",

      // Mensaje de Next sobre <img>
      "@next/next/no-img-element": "off",

      // Comillas sin escapar en JSX
      "react/no-unescaped-entities": "off",
    },
  },
];

export default eslintConfig;
