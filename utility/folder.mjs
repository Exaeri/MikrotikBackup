import { promises as fs } from 'fs';

export default async function(folderName) {
    try {
        await fs.mkdir(folderName, { recursive: true });
    } catch (err) {
        console.error('Creating folder error:', err);
    }
}