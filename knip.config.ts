import { defineKnipConfig } from "@adddog/monorepo-consistency";

export default defineKnipConfig({
    entry: ["src/index.ts"],
    project: ["src/**/*.ts"],
    // WHY: knip binary used in scripts, not in this package's devDeps
    ignoreBinaries: ["knip"],
    ignoreDependencies: [
        // WHY: workspace config pkg, used for build/lint config
        "@rad/config",
        // WHY: only used in src/cli/ which is ignored below
        "commander",
    ],
    // WHY: CLI source built separately, not part of library exports
    ignore: ["src/cli/**"],
});
