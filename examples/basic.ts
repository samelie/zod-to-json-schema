import * as z from "zod/v4";
import { zodToJsonSchema } from "../src";

// Define a user schema
const UserSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    email: z.string().email(),
    age: z.number().int().positive(),
    role: z.enum(["admin", "user", "guest"]),
    settings: z
        .object({
            theme: z.enum(["light", "dark"]),
            notifications: z.boolean(),
        })
        .optional(),
    tags: z.array(z.string()),
});

// Convert to JSON Schema
const jsonSchema = zodToJsonSchema(UserSchema, {
    name: "User",
    $schemaUrl: true,
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(jsonSchema, null, 2));

export default UserSchema;
