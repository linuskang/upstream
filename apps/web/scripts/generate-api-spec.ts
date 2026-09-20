import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { buildOpenApiSpec } from "../lib/openapi"

const scriptDir = dirname(fileURLToPath(import.meta.url))
const outputPath = resolve(scriptDir, "../app/openapi.json/spec.generated.json")

const spec = buildOpenApiSpec()

mkdirSync(dirname(outputPath), { recursive: true })
writeFileSync(outputPath, `${JSON.stringify(spec, null, 2)}\n`, "utf8")

const paths = Object.keys(spec.paths).length
const operations = Object.values(spec.paths).reduce(
  (total, path) => total + Object.keys(path).length,
  0
)

console.log(
  `Generated OpenAPI spec with ${paths} paths (${operations} operations) -> ${outputPath}`
)
