import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";

async function loadDataFile(filePath) {
  const source = await fs.readFile(filePath, "utf8");
  const match = source.match(/const\s+([A-Za-z0-9_]+)\s*=\s*\{/);

  if (!match) {
    throw new Error(`Could not find exported const in ${filePath}`);
  }

  const symbolName = match[1];
  const context = {};
  vm.createContext(context);
  vm.runInContext(`${source}\nthis.__exported = ${symbolName};`, context, {
    filename: filePath,
  });

  return context.__exported;
}

async function main() {
  const repoRoot = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
  const files = [
    path.join(repoRoot, "data", "t6b", "data.js"),
    path.join(repoRoot, "data", "t44c", "data.js"),
    path.join(repoRoot, "data", "t45c", "data.js"),
  ];

  const payload = [];
  for (const file of files) {
    payload.push(await loadDataFile(file));
  }

  process.stdout.write(JSON.stringify(payload, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
