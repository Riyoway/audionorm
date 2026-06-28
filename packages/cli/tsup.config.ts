import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node18",
  platform: "node",
  clean: true,
  // Bundle the workspace core (TS source) into the output...
  noExternal: ["@audio-normalizer/core"],
  // ...but keep the runtime deps external so ffmpeg-static can resolve its binary.
  external: ["ffmpeg-static", "tinyglobby"],
  banner: { js: "#!/usr/bin/env node" },
});
