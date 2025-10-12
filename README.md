# @adddog/zod-to-json-schema

Convert [Zod v4](https://zod.dev) schemas to [JSON Schema Draft 7](https://json-schema.org/draft-07/json-schema-release-notes.html).

**A lightweight wrapper around Zod's built-in `toJSONSchema` with a simpler API and CLI tool.**

## Features

- ✅ **Uses Zod's Native Implementation** - Wraps Zod v4's built-in JSON Schema generator
- 🎯 **Simpler API** - Easy-to-use options for common use cases
- 🚀 **CLI Included** - Convert schemas from files with a simple command
- 📦 **Tiny Bundle** - Only 11 kB total (leverages Zod's implementation)
- 🔧 **Type-Safe** - Full TypeScript support
- 🧪 **Well-Tested** - 22 passing tests

## Installation

```bash
pnpm add @adddog/zod-to-json-schema
# or
npm install @adddog/zod-to-json-schema
# or
yarn add @adddog/zod-to-json-schema
```

## Usage

### Programmatic API

```typescript
import * as z from "zod/v4";
import { zodToJsonSchema } from "@adddog/zod-to-json-schema";

// Define your Zod schema
const userSchema = z.object({
  name: z.string(),
  age: z.number().int().positive(),
  email: z.string().email(),
  role: z.enum(["admin", "user", "guest"]),
  settings: z.object({
    theme: z.enum(["light", "dark"]),
    notifications: z.boolean(),
  }).optional(),
});

// Convert to JSON Schema
const jsonSchema = zodToJsonSchema(userSchema, {
  name: "User",
  $schemaUrl: true,
});

console.log(JSON.stringify(jsonSchema, null, 2));
```

Output:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "User",
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "age": { "type": "number" },
    "email": { "type": "string", "format": "email" },
    "role": { "enum": ["admin", "user", "guest"] },
    "settings": {
      "anyOf": [
        {
          "type": "object",
          "properties": {
            "theme": { "enum": ["light", "dark"] },
            "notifications": { "type": "boolean" }
          },
          "required": ["theme", "notifications"]
        },
        { "not": {} }
      ]
    }
  },
  "required": ["name", "age", "email", "role"]
}
```

### CLI Usage

```bash
# Convert a schema file
zod-to-json-schema convert ./schemas/user.schema.ts --output ./schemas/user.json --pretty

# With options
zod-to-json-schema convert ./schemas/user.schema.ts \
  --name "User Schema" \
  --export "userSchema" \
  --pretty \
  --strict
```

#### CLI Options

- `-o, --output <file>` - Output file path (default: `<input>.schema.json`)
- `-n, --name <name>` - Schema name/title
- `-e, --export <name>` - Named export to convert (default: 'default')
- `--no-schema-url` - Don't include $schema URL
- `--strict` - Strict mode - fail on unsupported features
- `--pretty` - Pretty print JSON output
- `--ref-strategy <strategy>` - Reference strategy: root, relative, none (default: root)

## API

### `zodToJsonSchema(schema, options?)`

Convert a Zod schema to JSON Schema.

#### Parameters

- `schema` - A Zod schema instance
- `options` - Optional configuration object

#### Options

```typescript
type ConverterOptions = {
  // Name for the root schema (added as "title")
  name?: string;

  // Base path for $ref resolution (default: ["#"])
  basePath?: string[];

  // Definition path segment (default: "$defs")
  definitionPath?: string;

  // Reference strategy (default: "root")
  $refStrategy?: "root" | "relative" | "none";

  // Target JSON Schema version (default: "jsonSchema7")
  target?: "jsonSchema7" | "jsonSchema2019-09" | "openApi3";

  // Whether to include the $schema property (default: false)
  $schemaUrl?: boolean;

  // Custom error messages
  errorMessages?: boolean;

  // Strict mode - fail on unsupported features (default: false)
  strict?: boolean;

  // Mark all properties as readonly
  markdownDescription?: boolean;

  // Definitions to include in the schema
  definitions?: Record<string, JsonSchema7>;
};
```

## Supported Zod Types

### Fully Supported (with JSON Schema representation)

**Primitives:**
- ✅ `z.string()` - with formats (email, url, uuid, etc.) and constraints (min, max, regex)
- ✅ `z.number()` - with constraints (min, max, int, positive, etc.)
- ✅ `z.boolean()`
- ✅ `z.null()`
- ✅ `z.any()`
- ✅ `z.unknown()`
- ✅ `z.never()`
- ✅ `z.literal()`
- ✅ `z.enum()`
- ✅ `z.nativeEnum()`

**Complex Types:**
- ✅ `z.array()` - with min/max items
- ✅ `z.object()` - with nested properties and required fields
- ✅ `z.record()` - with property name validation
- ✅ `z.tuple()` - with prefix items and rest elements

**Wrappers:**
- ✅ `z.optional()`
- ✅ `z.nullable()`
- ✅ `z.default()` - includes default value in schema
- ✅ `z.readonly()` - marks as readOnly
- ✅ `z.catch()` - includes default/fallback value
- ✅ `z.branded()` - transparent (uses underlying type)
- ✅ `z.pipeline()` - uses input or output type based on `io` option

**Unions & Intersections:**
- ✅ `z.union()` - becomes `anyOf`
- ✅ `z.discriminatedUnion()` - optimized union representation
- ✅ `z.intersection()` - becomes `allOf`

### Limited Support (unrepresentable in JSON)

These types become `{}` (any) in non-strict mode, or throw errors in strict mode:

- ⚠️ `z.bigint()` - No native JSON representation
- ⚠️ `z.date()` - No native JSON representation (use `z.string().datetime()` instead)
- ⚠️ `z.symbol()` - No native JSON representation
- ⚠️ `z.undefined()` - No native JSON representation (use `z.optional()` instead)
- ⚠️ `z.void()` - No native JSON representation
- ⚠️ `z.map()` - No native JSON representation
- ⚠️ `z.set()` - No native JSON representation (use `z.array().unique()` instead)
- ⚠️ `z.function()` - Functions cannot be serialized to JSON
- ⚠️ `z.custom()` - Custom validators cannot be represented

**Tip:** Set `strict: true` in options to throw errors for unrepresentable types instead of converting them to `{}`.

## Examples

### Basic Types

```typescript
import * as z from "zod/v4";
import { zodToJsonSchema } from "@adddog/zod-to-json-schema";

// String
zodToJsonSchema(z.string());
// => { "type": "string" }

// Number with constraints
zodToJsonSchema(z.number().min(0).max(100));
// => { "type": "number", "minimum": 0, "maximum": 100 }

// Enum
zodToJsonSchema(z.enum(["red", "green", "blue"]));
// => { "enum": ["red", "green", "blue"] }

// Literal
zodToJsonSchema(z.literal("hello"));
// => { "const": "hello" }
```

### Complex Schemas

```typescript
// Array
zodToJsonSchema(z.array(z.string()));
// => { "type": "array", "items": { "type": "string" } }

// Object with nested properties
const schema = z.object({
  user: z.object({
    id: z.string().uuid(),
    name: z.string(),
    email: z.string().email(),
  }),
  posts: z.array(
    z.object({
      title: z.string(),
      content: z.string(),
    })
  ),
});

zodToJsonSchema(schema);
```

### Union Types

```typescript
// Simple union
zodToJsonSchema(z.union([z.string(), z.number()]));
// => { "anyOf": [{ "type": "string" }, { "type": "number" }] }

// Nullable
zodToJsonSchema(z.string().nullable());
// => { "anyOf": [{ "type": "string" }, { "type": "null" }] }

// Optional
zodToJsonSchema(z.string().optional());
// => { "anyOf": [{ "type": "string" }, { "not": {} }] }
```

## Architecture

This library is a **lightweight wrapper** around Zod v4's native `toJSONSchema` implementation:

```
src/
├── types.ts              # Type definitions
├── converter.ts          # Wrapper around Zod's toJSONSchema
├── cli/
│   └── index.ts         # CLI implementation
└── converter.test.ts     # Test suite
```

### Why This Wrapper?

While Zod v4 has excellent built-in JSON Schema support, this library provides:

1. **Simpler API** - Easy-to-understand options instead of Zod's lower-level API
2. **CLI Tool** - Convert schemas from files without writing code
3. **Consistent Defaults** - Sensible defaults for common use cases
4. **Better Documentation** - Clear examples and usage patterns

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Test
pnpm test

# Type check
pnpm types

# Lint
pnpm lint

# Run all checks (same as prepublish)
pnpm run prepublishOnly
```

### Publishing

The package includes automated release tooling with `bumpp` and a `prepublishOnly` script:

**Full Release Workflow:**

```bash
# 1. Bump version (creates commit and tag)
pnpm run release           # Interactive version selection
pnpm run release -- --patch  # 0.0.1 → 0.0.2
pnpm run release -- --minor  # 0.0.1 → 0.1.0
pnpm run release -- --major  # 0.0.1 → 1.0.0

# 2. Publish to npm (prepublishOnly runs automatically)
pnpm publish
```

**What `prepublishOnly` does:**

```bash
pnpm run prepublishOnly
# Runs: test → lint → types → build
```

This ensures all checks pass before the package is published to npm. The script runs automatically when you execute `pnpm publish`.

**Manual verification (optional):**

```bash
# Run all checks without publishing
pnpm run prepublishOnly
```

## License

MIT © Sam Elie

## Related

- [Zod](https://github.com/colinhacks/zod) - TypeScript-first schema validation
- [JSON Schema](https://json-schema.org/) - JSON Schema specification
- [zod-to-json-schema](https://github.com/StefanTerdell/zod-to-json-schema) - Original Zod v3 converter (inspiration)
