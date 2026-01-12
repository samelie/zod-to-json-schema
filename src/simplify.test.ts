import type { JsonSchema7 } from "./types";
import { describe, expect, it } from "vitest";
import { countBranches, simplifySchemaForLLM } from "./simplify";

describe("countBranches", () => {
    it("should count anyOf branches", () => {
        const schema: JsonSchema7 = {
            anyOf: [{ type: "string" }, { type: "null" }],
        };
        expect(countBranches(schema)).toBe(2);
    });

    it("should count oneOf branches", () => {
        const schema: JsonSchema7 = {
            oneOf: [{ type: "string" }, { type: "number" }, { type: "boolean" }],
        };
        expect(countBranches(schema)).toBe(3);
    });

    it("should count nested branches", () => {
        const schema: JsonSchema7 = {
            type: "object",
            properties: {
                field1: { anyOf: [{ type: "string" }, { type: "null" }] },
                field2: { anyOf: [{ type: "number" }, { type: "null" }] },
            },
        };
        expect(countBranches(schema)).toBe(4);
    });

    it("should return 0 for schema without branches", () => {
        const schema: JsonSchema7 = {
            type: "object",
            properties: {
                name: { type: "string" },
                age: { type: "number" },
            },
        };
        expect(countBranches(schema)).toBe(0);
    });
});

describe("simplifySchemaForLLM", () => {
    it("should simplify nullable string (anyOf with null)", () => {
        const schema = {
            anyOf: [{ type: "null" as const }, { type: "string" as const }],
        };
        const result = simplifySchemaForLLM(schema);
        expect(result.type).toBe("string");
        expect(result.anyOf).toBeUndefined();
    });

    it("should simplify nullable number", () => {
        const schema = {
            anyOf: [{ type: "number" as const }, { type: "null" as const }],
        };
        const result = simplifySchemaForLLM(schema);
        expect(result.type).toBe("number");
        expect(result.anyOf).toBeUndefined();
    });

    it("should simplify nested nullable properties", () => {
        const schema = {
            type: "object" as const,
            properties: {
                name: { anyOf: [{ type: "string" as const }, { type: "null" as const }] },
                age: { anyOf: [{ type: "number" as const }, { type: "null" as const }] },
            },
        };
        const result = simplifySchemaForLLM(schema);
        expect(result.properties?.name?.type).toBe("string");
        expect(result.properties?.name?.anyOf).toBeUndefined();
        expect(result.properties?.age?.type).toBe("number");
        expect(result.properties?.age?.anyOf).toBeUndefined();
    });

    it("should simplify array items with nullable", () => {
        const schema = {
            type: "array" as const,
            items: {
                anyOf: [{ type: "string" as const }, { type: "null" as const }],
            },
        };
        const result = simplifySchemaForLLM(schema);
        const items = result.items as JsonSchema7;
        expect(items?.type).toBe("string");
        expect(items?.anyOf).toBeUndefined();
    });

    it("should keep multiple non-null types in anyOf", () => {
        const schema = {
            anyOf: [
                { type: "string" as const },
                { type: "number" as const },
                { type: "null" as const },
            ],
        };
        const result = simplifySchemaForLLM(schema);
        // Should keep string and number, remove null
        expect(result.anyOf).toHaveLength(2);
        expect(result.anyOf?.[0]?.type).toBe("string");
        expect(result.anyOf?.[1]?.type).toBe("number");
    });

    it("should preserve non-nullable schemas", () => {
        const schema = {
            type: "object" as const,
            properties: {
                name: { type: "string" as const },
                tags: { type: "array" as const, items: { type: "string" as const } },
            },
            required: ["name"],
        };
        const result = simplifySchemaForLLM(schema);
        expect(result).toEqual(schema);
    });

    it("should handle oneOf with null", () => {
        const schema = {
            oneOf: [{ type: "string" as const }, { type: "null" as const }],
        };
        const result = simplifySchemaForLLM(schema);
        expect(result.type).toBe("string");
        expect(result.oneOf).toBeUndefined();
    });

    it("should reduce branch count significantly", () => {
        // Simulate a schema with many nullable fields (like ParkCaGovParkSchema)
        const schema: JsonSchema7 = {
            type: "object",
            properties: {},
        };
        // Add 50 nullable fields
        for (let i = 0; i < 50; i++) {
            schema.properties![`field${i}`] = {
                anyOf: [{ type: "string" }, { type: "null" }],
            };
        }

        const beforeCount = countBranches(schema);
        expect(beforeCount).toBe(100); // 50 fields × 2 branches each

        const result = simplifySchemaForLLM(schema);
        const afterCount = countBranches(result);
        expect(afterCount).toBe(0); // All anyOf removed
    });

    it("should handle const null in anyOf", () => {
        const schema = {
            anyOf: [{ type: "string" as const }, { const: null }],
        };
        const result = simplifySchemaForLLM(schema);
        expect(result.type).toBe("string");
        expect(result.anyOf).toBeUndefined();
    });

    it("should handle deeply nested schemas", () => {
        const schema = {
            type: "object" as const,
            properties: {
                level1: {
                    type: "object" as const,
                    properties: {
                        level2: {
                            anyOf: [
                                {
                                    type: "object" as const,
                                    properties: {
                                        level3: {
                                            anyOf: [{ type: "string" as const }, { type: "null" as const }],
                                        },
                                    },
                                },
                                { type: "null" as const },
                            ],
                        },
                    },
                },
            },
        };
        const result = simplifySchemaForLLM(schema);
        expect(result.properties?.level1?.properties?.level2?.type).toBe("object");
        expect(result.properties?.level1?.properties?.level2?.properties?.level3?.type).toBe("string");
    });

    it("should handle $defs", () => {
        const schema = {
            type: "object" as const,
            $defs: {
                NullableString: {
                    anyOf: [{ type: "string" as const }, { type: "null" as const }],
                },
            },
            properties: {
                name: { $ref: "#/$defs/NullableString" },
            },
        };
        const result = simplifySchemaForLLM(schema);
        expect(result.$defs?.NullableString?.type).toBe("string");
        expect(result.$defs?.NullableString?.anyOf).toBeUndefined();
    });
});
