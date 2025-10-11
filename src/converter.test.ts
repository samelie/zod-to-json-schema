import { describe, expect, it } from "vitest";
import * as z from "zod/v4";
import { zodToJsonSchema } from "./converter.ts";

describe("zodToJsonSchema", () => {
    describe("primitives", () => {
        it("should convert string schema", () => {
            const schema = z.string();
            const result = zodToJsonSchema(schema);
            expect(result).toMatchObject({ type: "string" });
        });

        it("should convert number schema", () => {
            const schema = z.number();
            const result = zodToJsonSchema(schema);
            expect(result).toMatchObject({ type: "number" });
        });

        it("should convert boolean schema", () => {
            const schema = z.boolean();
            const result = zodToJsonSchema(schema);
            expect(result).toMatchObject({ type: "boolean" });
        });

        it("should convert null schema", () => {
            const schema = z.null();
            const result = zodToJsonSchema(schema);
            expect(result).toMatchObject({ type: "null" });
        });

        it("should convert literal schema", () => {
            const schema = z.literal("hello");
            const result = zodToJsonSchema(schema);
            expect(result.const).toBe("hello");
        });

        it("should convert enum schema", () => {
            const schema = z.enum(["a", "b", "c"]);
            const result = zodToJsonSchema(schema);
            expect(result.enum).toEqual(["a", "b", "c"]);
        });
    });

    describe("objects", () => {
        it("should convert object schema", () => {
            const schema = z.object({
                name: z.string(),
                age: z.number(),
            });
            const result = zodToJsonSchema(schema);
            expect(result).toMatchObject({
                type: "object",
                properties: {
                    name: { type: "string" },
                    age: { type: "number" },
                },
                required: ["name", "age"],
            });
        });

        it("should handle optional properties", () => {
            const schema = z.object({
                name: z.string(),
                nickname: z.string().optional(),
            });
            const result = zodToJsonSchema(schema);
            expect(result.type).toBe("object");
            expect(result.required).toEqual(["name"]);
            expect(result.properties?.nickname).toBeDefined();
        });
    });

    describe("arrays", () => {
        it("should convert array schema", () => {
            const schema = z.array(z.string());
            const result = zodToJsonSchema(schema);
            expect(result).toMatchObject({
                type: "array",
                items: { type: "string" },
            });
        });

        it("should convert tuple schema", () => {
            const schema = z.tuple([z.string(), z.number()]);
            const result = zodToJsonSchema(schema);
            expect(result.type).toBe("array");
            // Different JSON Schema drafts represent tuples differently
            expect(result.items || result.prefixItems).toBeDefined();
        });
    });

    describe("unions", () => {
        it("should convert union schema", () => {
            const schema = z.union([z.string(), z.number()]);
            const result = zodToJsonSchema(schema);
            expect(result.anyOf).toBeDefined();
            expect(result.anyOf?.length).toBe(2);
        });

        it("should convert nullable schema", () => {
            const schema = z.string().nullable();
            const result = zodToJsonSchema(schema);
            expect(result.anyOf).toBeDefined();
        });
    });

    describe("options", () => {
        it("should add title from name option", () => {
            const schema = z.string();
            const result = zodToJsonSchema(schema, { name: "MyString" });
            expect(result.title).toBe("MyString");
        });

        it("should add $schema when requested", () => {
            const schema = z.string();
            const result = zodToJsonSchema(schema, { $schemaUrl: true });
            expect(result.$schema).toBe("http://json-schema.org/draft-07/schema#");
        });

        it("should remove $schema when disabled", () => {
            const schema = z.string();
            const result = zodToJsonSchema(schema, { $schemaUrl: false });
            expect(result.$schema).toBeUndefined();
        });
    });

    describe("complex schemas", () => {
        it("should handle nested objects", () => {
            const schema = z.object({
                user: z.object({
                    name: z.string(),
                    email: z.string(),
                }),
                active: z.boolean(),
            });

            const result = zodToJsonSchema(schema);
            expect(result.type).toBe("object");
            expect(result.properties?.user).toMatchObject({
                type: "object",
                properties: {
                    name: { type: "string" },
                    email: { type: "string" },
                },
            });
        });

        it("should handle arrays of objects", () => {
            const schema = z.array(
                z.object({
                    id: z.number(),
                    name: z.string(),
                }),
            );

            const result = zodToJsonSchema(schema);
            expect(result.type).toBe("array");
            expect(result.items).toMatchObject({
                type: "object",
                properties: {
                    id: { type: "number" },
                    name: { type: "string" },
                },
            });
        });
    });

    describe("string constraints", () => {
        it("should handle min/max length", () => {
            const schema = z.string().min(5).max(10);
            const result = zodToJsonSchema(schema);
            expect(result.minLength).toBe(5);
            expect(result.maxLength).toBe(10);
        });

        it("should handle email format", () => {
            const schema = z.string().email();
            const result = zodToJsonSchema(schema);
            expect(result.format).toBe("email");
        });

        it("should handle url format", () => {
            const schema = z.string().url();
            const result = zodToJsonSchema(schema);
            expect(result.format).toBe("uri");
        });
    });

    describe("number constraints", () => {
        it("should handle min/max", () => {
            const schema = z.number().min(0).max(100);
            const result = zodToJsonSchema(schema);
            expect(result.minimum).toBe(0);
            expect(result.maximum).toBe(100);
        });

        it("should handle integer", () => {
            const schema = z.number().int();
            const result = zodToJsonSchema(schema);
            expect(result.type).toBe("integer");
        });
    });
});
