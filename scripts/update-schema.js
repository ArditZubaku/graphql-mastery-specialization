import { readFileSync, writeFileSync } from 'node:fs';

const src = readFileSync('src/server.js', 'utf8');
const match = src.match(/typeDefs\s*=\s*`([\s\S]*?)`/);

if (match) {
  writeFileSync('schema.graphql', match[1].trim() + '\n');
  console.log('schema.graphql updated');
} else {
  console.error('Could not find typeDefs in src/server.js');
  process.exit(1);
}
