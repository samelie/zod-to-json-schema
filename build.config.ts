import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
    entries: [
        "src/index",
        "src/cli/index",
    ],
    declaration: "compatible",
    rollup: {
        emitCJS: false,
    },
    externals: ["zod", "commander"],
});
