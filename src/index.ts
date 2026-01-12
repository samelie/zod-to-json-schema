/**
 * @adddog/zod-to-json-schema
 *
 * Convert Zod v4 schemas to JSON Schema Draft 7
 */

export { zodToJsonSchema } from "./converter";
export { countBranches, simplifySchemaForLLM } from "./simplify";
export type {
    ConverterOptions,
    JsonSchema7,
    JsonSchema7Type,
    Refs,
    SeenItem,
} from "./types";
