/**
 * JSON Schema Draft 7 Types
 */
export type JsonSchema7 = {
    $schema?: string;
    $id?: string;
    $ref?: string;
    $comment?: string;
    title?: string;
    description?: string;
    default?: unknown;
    examples?: unknown[];
    readOnly?: boolean;
    writeOnly?: boolean;

    // Type
    type?: JsonSchema7Type | JsonSchema7Type[];
    enum?: unknown[];
    const?: unknown;

    // Numeric
    multipleOf?: number;
    maximum?: number;
    exclusiveMaximum?: number;
    minimum?: number;
    exclusiveMinimum?: number;

    // String
    maxLength?: number;
    minLength?: number;
    pattern?: string;
    format?: string;

    // Array
    items?: JsonSchema7 | JsonSchema7[];
    additionalItems?: JsonSchema7 | boolean;
    maxItems?: number;
    minItems?: number;
    uniqueItems?: boolean;
    contains?: JsonSchema7;

    // Object
    maxProperties?: number;
    minProperties?: number;
    required?: string[];
    properties?: Record<string, JsonSchema7>;
    patternProperties?: Record<string, JsonSchema7>;
    additionalProperties?: JsonSchema7 | boolean;
    dependencies?: Record<string, JsonSchema7 | string[]>;
    propertyNames?: JsonSchema7;

    // Composition
    allOf?: JsonSchema7[];
    anyOf?: JsonSchema7[];
    oneOf?: JsonSchema7[];
    not?: JsonSchema7;

    // Definitions
    definitions?: Record<string, JsonSchema7>;
    $defs?: Record<string, JsonSchema7>;

    // Allow any additional properties for flexibility
    [key: string]: unknown;
};

export type JsonSchema7Type =
    | "string"
    | "number"
    | "integer"
    | "boolean"
    | "object"
    | "array"
    | "null";

/**
 * Converter Options
 */
export type ConverterOptions = {
    /**
     * Name for the root schema
     */
    name?: string;

    /**
     * Base path for $ref resolution
     * @default ["#"]
     */
    basePath?: string[];

    /**
     * Definition path segment
     * @default "$defs"
     */
    definitionPath?: string;

    /**
     * Reference strategy
     * @default "root"
     */
    $refStrategy?: $refStrategy;

    /**
     * Target JSON Schema version
     * @default "jsonSchema7"
     */
    target?: "jsonSchema7" | "jsonSchema2019-09" | "openApi3";

    /**
     * Whether to include the $schema property
     * @default false
     */
    $schemaUrl?: boolean;

    /**
     * Custom error messages
     */
    errorMessages?: boolean;

    /**
     * Strict mode - fail on unsupported features
     * @default false
     */
    strict?: boolean;

    /**
     * Mark all properties as readonly
     */
    markdownDescription?: boolean;

    /**
     * Definitions to include in the schema
     */
    definitions?: Record<string, JsonSchema7>;
};

export type $refStrategy = "root" | "relative" | "none";

/**
 * Internal refs tracking
 */
export type Refs = {
    seen: Map<unknown, SeenItem>;
    currentPath: string[];
    basePath: string[];
    definitionPath: string;
    $refStrategy: $refStrategy;
    target: ConverterOptions["target"];
    errorMessages: boolean;
    strict: boolean;
    markdownDescription: boolean;
};

export type SeenItem = {
    def: unknown;
    path: string[];
    jsonSchema?: JsonSchema7;
};
