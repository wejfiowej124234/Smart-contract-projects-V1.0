const path = require("node:path");
const fs = require("node:fs");

const { getCompilersDir } = require("hardhat/internal/util/global-dir");

async function main() {
  const compilersDir = await getCompilersDir();
  const version = "0.8.19";
  const longVersion = "0.8.19+commit.7dd6d404";

  const windowsPlatform = "windows-amd64";
  const wasmPlatform = "wasm";

  const windowsDir = path.join(compilersDir, windowsPlatform);
  const wasmDir = path.join(compilersDir, wasmPlatform);

  fs.mkdirSync(windowsDir, { recursive: true });
  fs.mkdirSync(wasmDir, { recursive: true });

  // 1) Seed a dummy Windows entry so Hardhat won't download, and will then
  // fall back to the WASM compiler.
  const dummyExeName = `solc-${longVersion}.exe`;
  const dummyExePath = path.join(windowsDir, dummyExeName);
  if (!fs.existsSync(dummyExePath)) {
    fs.writeFileSync(dummyExePath, "not-a-real-exe");
  }

  const windowsListPath = path.join(windowsDir, "list.json");
  const windowsList = {
    builds: [
      {
        path: dummyExeName,
        version,
        build: "local-dummy",
        longVersion,
        keccak256: "0x",
        urls: [],
        platform: windowsPlatform,
      },
    ],
    releases: {
      [version]: dummyExeName,
    },
    latestRelease: version,
  };
  fs.writeFileSync(windowsListPath, JSON.stringify(windowsList, null, 2));

  // 2) Seed the WASM compiler using solc-js from node_modules.
  const soljsonSource = require.resolve("solc/soljson.js");
  const wasmFileName = `soljson-v${longVersion}.js`;
  const wasmFilePath = path.join(wasmDir, wasmFileName);
  if (!fs.existsSync(wasmFilePath)) {
    fs.copyFileSync(soljsonSource, wasmFilePath);
  }

  const wasmListPath = path.join(wasmDir, "list.json");
  const wasmList = {
    builds: [
      {
        path: wasmFileName,
        version,
        build: "local-solcjs",
        longVersion,
        keccak256: "0x",
        urls: [],
        platform: wasmPlatform,
      },
    ],
    releases: {
      [version]: wasmFileName,
    },
    latestRelease: version,
  };
  fs.writeFileSync(wasmListPath, JSON.stringify(wasmList, null, 2));

  console.log("Seeded Hardhat compiler cache:");
  console.log("compilersDir:", compilersDir);
  console.log("windows list:", windowsListPath);
  console.log("windows dummy:", dummyExePath);
  console.log("wasm list:", wasmListPath);
  console.log("wasm soljson:", wasmFilePath);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
