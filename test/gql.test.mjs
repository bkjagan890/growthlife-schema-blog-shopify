import {readFileSync, readdirSync} from 'node:fs';
import {join} from 'node:path';
import {parse} from 'graphql';

const root = 'extensions/app-home/src';
const walk = (dir) =>
  readdirSync(dir, {withFileTypes: true}).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)],
  );

let count = 0;
const ops = new Set();
for (const file of walk(root)) {
  const src = readFileSync(file, 'utf8');
  for (const m of src.matchAll(/`#graphql\s*([\s\S]*?)`/g)) {
    const doc = m[1];
    try {
      const ast = parse(doc);
      for (const def of ast.definitions) {
        if (def.name) {
          if (ops.has(def.name.value)) throw new Error(`duplicate operation name ${def.name.value}`);
          ops.add(def.name.value);
        }
        if (!def.name) throw new Error('anonymous operation');
      }
      count++;
    } catch (err) {
      console.error(`FAIL ${file}: ${err.message}\n${doc.slice(0, 200)}`);
      process.exit(1);
    }
  }
}
console.log(`${count} GraphQL documents parsed, all named and unique:`);
console.log([...ops].sort().join(', '));
