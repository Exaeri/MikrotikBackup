import fs from 'fs/promises';

export async function readJSON(file) {
    try {
        const jsonData = await fs.readFile(file, 'utf8'); 
        return JSON.parse(jsonData); 
    } catch (error) {
        console.error('Json reading error:', error);
        return null;
    }
}