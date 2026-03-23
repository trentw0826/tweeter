import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const runtimeDeps = ["date-fns", "uuid"];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serverRoot = path.resolve(__dirname, "..");
const sharedRoot = path.resolve(serverRoot, "../tweeter-shared");
const layerRoot = path.resolve(serverRoot, "layers/shared-runtime");
const layerNodeModules = path.join(layerRoot, "nodejs/node_modules");
const layerSharedPackageRoot = path.join(layerNodeModules, "tweeter-shared");

const sharedDistPath = path.join(sharedRoot, "dist");
const sharedPackageJsonPath = path.join(sharedRoot, "package.json");

if (!existsSync(sharedDistPath)) {
  throw new Error(
    `Missing tweeter-shared build output at ${sharedDistPath}. Run "npm run compile" in tweeter-shared first.`,
  );
}

rmSync(layerRoot, { recursive: true, force: true });
mkdirSync(layerSharedPackageRoot, { recursive: true });

cpSync(sharedDistPath, path.join(layerSharedPackageRoot, "dist"), {
  recursive: true,
});

const sharedPackageJson = JSON.parse(
  readFileSync(sharedPackageJsonPath, "utf8"),
);
const layerPackageJson = {
  name: "tweeter-shared",
  version: sharedPackageJson.version,
  type: "module",
  main: "dist/index.js",
  types: "dist/index.d.ts",
};

writeFileSync(
  path.join(layerSharedPackageRoot, "package.json"),
  `${JSON.stringify(layerPackageJson, null, 2)}\n`,
);

for (const dependency of runtimeDeps) {
  const sourcePath = path.join(serverRoot, "node_modules", dependency);
  const destinationPath = path.join(layerNodeModules, dependency);

  if (!existsSync(sourcePath)) {
    throw new Error(
      `Missing runtime dependency at ${sourcePath}. Run \"npm install\" in tweeter-server first.`,
    );
  }

  cpSync(sourcePath, destinationPath, { recursive: true });
}

console.log(`Synced shared runtime layer at ${layerRoot}`);
