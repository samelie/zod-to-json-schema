#!/usr/bin/env node

import type { $ZodType } from "zod/v4/core";
import type { $refStrategy, ConverterOptions } from "../types";
import { readFile, writeFile } from "node:fs/promises";
import { basename, dirname, extname, resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { Command } from "commander";
import { zodToJsonSchema } from "../converter";

const program = new Command();

program
    .name("zod-to-json-schema")
    .description("Convert Zod v4 schemas to JSON Schema")
    .version("0.0.1");

program
    .command("convert <input>")
    .description("Convert a Zod schema file to JSON Schema")
    .option("-o, --output <file>", "Output file path (default: <input>.schema.json)")
    .option("-n, --name <name>", "Schema name/title")
    .option("-e, --export <name>", "Named export to convert (default: 'default')")
    .option("--no-schema-url", "Don't include $schema URL")
    .option("--strict", "Strict mode - fail on unsupported features")
    .option("--pretty", "Pretty print JSON output")
    .option("--ref-strategy <strategy>", "Reference strategy: root, relative, none", "root")
    .action(async (input: string, options: {
        output?: string;
        name?: string;
        export: string;
        schemaUrl: boolean;
        strict: boolean;
        pretty: boolean;
        refStrategy: string;
    }) => {
        try {
            // Resolve input path
            const inputPath = resolve(process.cwd(), input);
            const inputUrl = pathToFileURL(inputPath).href;

            // Import the module
            const module = await import(inputUrl);

            // Get the export
            const exportName = options.export || "default";
            const zodSchema = module[exportName];

            if (!zodSchema) {
                console.error(`Export "${exportName}" not found in ${input}`);
                process.exit(1);
            }

            // Check if it's a Zod v4 schema
            if (!zodSchema._zod || !zodSchema._zod.def) {
                console.error(`Export "${exportName}" is not a Zod v4 schema`);
                process.exit(1);
            }

            // Cast to proper type
            const schema = zodSchema as $ZodType<unknown>;

            // Convert to JSON Schema
            const converterOptions: ConverterOptions = {
                ...(options.name ? { name: options.name } : {}),
                $schemaUrl: options.schemaUrl,
                strict: options.strict,
                $refStrategy: options.refStrategy as $refStrategy,
            };

            const jsonSchema = zodToJsonSchema(schema, converterOptions);

            // Determine output path
            const outputPath = options.output
                ? resolve(process.cwd(), options.output)
                : resolve(
                        dirname(inputPath),
                        `${basename(inputPath, extname(inputPath))}.schema.json`,
                    );

            // Write output
            const jsonString = options.pretty
                ? JSON.stringify(jsonSchema, null, 2)
                : JSON.stringify(jsonSchema);

            await writeFile(outputPath, jsonString, "utf-8");

            console.log(`✓ JSON Schema written to ${outputPath}`);
        } catch (error) {
            console.error("Error:", error instanceof Error ? error.message : String(error));
            process.exit(1);
        }
    });

program
    .command("validate <schema> <data>")
    .description("Validate data against a JSON Schema (generated from Zod)")
    .action(async (schemaPath: string, dataPath: string) => {
        try {
            // Read schema and data
            const schemaContent = await readFile(resolve(process.cwd(), schemaPath), "utf-8");
            const dataContent = await readFile(resolve(process.cwd(), dataPath), "utf-8");

            const schema = JSON.parse(schemaContent);
            const data = JSON.parse(dataContent);

            // Note: This is a placeholder - proper JSON Schema validation would require
            // a validation library like ajv
            console.log("Schema:", schema);
            console.log("Data:", data);
            console.log("\nNote: Full validation requires a JSON Schema validator like ajv");
        } catch (error) {
            console.error("Error:", error instanceof Error ? error.message : String(error));
            process.exit(1);
        }
    });

program.parse();
