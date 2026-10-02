/** Exporte le schéma JSON du profil (draft 2020-12) vers schema/profile.v1.json. */
import { writeFileSync } from 'node:fs';
import { z } from 'zod';
import { profileSchema } from '../src/core/profile/schema.js';
import { SCHEMA_VERSION } from '../src/core/shared/meta.js';

const jsonSchema = z.toJSONSchema(profileSchema, { target: 'draft-2020-12' });
const out = { $id: `https://astra.local/schema/profile.v${SCHEMA_VERSION}.json`, title: `ASTRA Profile ${SCHEMA_VERSION}`, ...jsonSchema };
writeFileSync(new URL('../schema/profile.v1.json', import.meta.url), `${JSON.stringify(out, null, 2)}\n`);
console.log('schema/profile.v1.json écrit');
