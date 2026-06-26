import { generateSpec } from '../src/openapi/index.js'
import { writeFileSync } from 'fs'
import YAML from 'yaml'

const spec = generateSpec()
writeFileSync('api-spec.json', JSON.stringify(spec, null, 2))
writeFileSync('api-spec.yaml', YAML.stringify(spec))
console.log(`Spec generated: ${Object.keys(spec.paths).length} paths`)
