import type { JsonSchema7 } from "./types";

/**
 * Count conditional branches (anyOf/oneOf) in a JSON Schema
 */
export function countBranches(schema: JsonSchema7): number {
    let count = 0;
    JSON.stringify(schema, (key, value) => {
        if (key === "anyOf" || key === "oneOf") {
            count += Array.isArray(value) ? value.length : 0;
        }
        return value;
    });
    return count;
}

/**
 * Simplify JSON Schema for LLM compatibility
 * - Removes anyOf for nullable types (uses base type directly)
 * - Flattens single-item anyOf/oneOf
 * - Removes null type from unions
 *
 * This reduces conditional branches which some LLM APIs limit (e.g., Anthropic limits to 8)
 */
export function simplifySchemaForLLM(schema: JsonSchema7): JsonSchema7 {
    return traverseAndSimplify(structuredClone(schema));
}

function isNullSchema(s: unknown): boolean {
    if (!s || typeof s !== "object") return false;
    const schema = s as Record<string, unknown>;
    return schema.type === "null" || schema.const === null;
}

function traverseAndSimplify(node: unknown): JsonSchema7 {
    if (!node || typeof node !== "object") return node as JsonSchema7;

    const schema = node as Record<string, unknown>;

    // Handle anyOf (nullable pattern: anyOf: [{type: "null"}, {actual type}])
    if (Array.isArray(schema.anyOf)) {
        const nonNull = schema.anyOf.filter(s => !isNullSchema(s));

        if (nonNull.length === 0) {
            // All null - just return string type as fallback
            delete schema.anyOf;
            schema.type = "string";
        } else if (nonNull.length === 1) {
            // Single non-null type - use it directly, remove anyOf
            const base = traverseAndSimplify(nonNull[0]);
            delete schema.anyOf;
            Object.assign(schema, base);
        } else if (nonNull.length < schema.anyOf.length) {
            // Multiple non-null types - keep them but remove null entries
            schema.anyOf = nonNull.map(s => traverseAndSimplify(s));
        } else {
            // No nulls to remove - just recurse
            schema.anyOf = schema.anyOf.map(s => traverseAndSimplify(s));
        }
    }

    // Handle oneOf similarly
    if (Array.isArray(schema.oneOf)) {
        const nonNull = schema.oneOf.filter(s => !isNullSchema(s));

        if (nonNull.length === 1) {
            const base = traverseAndSimplify(nonNull[0]);
            delete schema.oneOf;
            Object.assign(schema, base);
        } else if (nonNull.length < schema.oneOf.length) {
            schema.oneOf = nonNull.map(s => traverseAndSimplify(s));
        } else {
            schema.oneOf = schema.oneOf.map(s => traverseAndSimplify(s));
        }
    }

    // Recurse into properties
    if (schema.properties && typeof schema.properties === "object") {
        const props = schema.properties as Record<string, unknown>;
        for (const key of Object.keys(props)) {
            props[key] = traverseAndSimplify(props[key]);
        }
    }

    // Recurse into items (array items)
    if (schema.items) {
        if (Array.isArray(schema.items)) {
            schema.items = schema.items.map(s => traverseAndSimplify(s));
        } else {
            schema.items = traverseAndSimplify(schema.items);
        }
    }

    // Recurse into additionalProperties
    if (schema.additionalProperties && typeof schema.additionalProperties === "object") {
        schema.additionalProperties = traverseAndSimplify(schema.additionalProperties);
    }

    // Recurse into $defs/definitions
    if (schema.$defs && typeof schema.$defs === "object") {
        const defs = schema.$defs as Record<string, unknown>;
        for (const key of Object.keys(defs)) {
            defs[key] = traverseAndSimplify(defs[key]);
        }
    }
    if (schema.definitions && typeof schema.definitions === "object") {
        const defs = schema.definitions as Record<string, unknown>;
        for (const key of Object.keys(defs)) {
            defs[key] = traverseAndSimplify(defs[key]);
        }
    }

    return schema as JsonSchema7;
}
