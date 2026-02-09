import { z } from 'zod';

const schema = z.coerce.number().positive().optional().or(z.literal(''));

console.log('--- Testing Current Pattern ---');
try {
    const result = schema.parse("");
    console.log('Result for "":', result, `(type: ${typeof result})`);
} catch (e: any) {
    console.log('Error for "":', JSON.stringify(e.errors, null, 2));
}

const unionSchema = z.union([
    z.literal(''),
    z.coerce.number().positive()
]).transform(val => val === '' ? undefined : val);

console.log('\n--- Testing Union Pattern ---');
try {
    const result = unionSchema.parse("");
    console.log('Result for "":', result, `(type: ${typeof result})`);
} catch (e: any) {
    console.log('Error for "":', JSON.stringify(e.errors, null, 2));
}

const trustLevelSchema = z.coerce.number().min(1).max(5).default(3);
console.log('\n--- Testing trustLevel ---');
try {
    const result = trustLevelSchema.parse("");
    console.log('Result for "":', result, `(type: ${typeof result})`);
} catch (e: any) {
    console.log('Error for "":', JSON.stringify(e.errors, null, 2));
}
