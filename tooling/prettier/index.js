import { fileURLToPath } from "node:url"

const tailwindStylesheet = fileURLToPath(
  new URL("../../packages/ui/src/styles/globals.css", import.meta.url)
)

/** @type {import("prettier").Config} */
export default {
  endOfLine: "lf",
  semi: false,
  singleQuote: false,
  tabWidth: 2,
  trailingComma: "es5",
  printWidth: 80,
  plugins: ["prettier-plugin-tailwindcss"],
  tailwindStylesheet,
  tailwindFunctions: ["cn", "cva"],
}
