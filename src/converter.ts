import type { $ZodType } from "zod/v4/core";
import type { ConverterOptions, JsonSchema7 } from "./types.ts";
import { toJSONSchema as zodToJSONSchema } from "zod/v4/core";

/**
 * Convert a Zod v4 schema to JSON Schema
 * This is a wrapper around Zod's built-in toJSONSchema with a simpler API
 */
export const zodToJsonSchema = <T = unknown>(
    schema: $ZodType<T>,
    options: ConverterOptions = {},
): JsonSchema7 => {
    // Map our options to Zod's native toJSONSchema options
    const zodOptions = {
        target: options.target === "jsonSchema7"
            ? "draft-7" as const :
            options.target === "jsonSchema2019-09"
                ? "draft-2020-12" as const :
                options.target === "openApi3"
                    ? "openapi-3.0" as const :
                    "draft-7" as const,
        unrepresentable: options.strict ? "throw" as const : "any" as const,
        io: "output" as const,
        cycles: options.$refStrategy === "none" ? "throw" as const : "ref" as const,
        reused: options.$refStrategy === "root" ? "ref" as const : "inline" as const,
    };

    // Convert using Zod's native implementation
    const result = zodToJSONSchema(schema, zodOptions) as JsonSchema7;

    // Add custom options
    if (options.name && !result.title) {
        result.title = options.name;
    }

    // Add or remove $schema URL
    if (options.$schemaUrl === false) {
        delete result.$schema;
    } else if (options.$schemaUrl === true && !result.$schema) {
        result.$schema = "http://json-schema.org/draft-07/schema#";
    }

    // Merge custom definitions if provided
    if (options.definitions) {
        const defKey = options.definitionPath || "$defs";
        if (!result[defKey]) {
            result[defKey] = {};
        }
        Object.assign(result[defKey]!, options.definitions);
    }

    return result;
};
