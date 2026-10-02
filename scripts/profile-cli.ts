/** Usage : npm run profile -- '{"firstName":"Jean",...}'  -> affiche le profil JSON. */
import { buildProfile } from '../src/index.js';

const arg = process.argv[2];
if (!arg) {
  console.error('Usage : npm run profile -- \'<json>\'');
  process.exit(1);
}
console.log(JSON.stringify(buildProfile(JSON.parse(arg)), null, 2));
