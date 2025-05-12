import fs from 'fs/promises';

export async function readJSON(fileName) {
    try {
        const jsonData = await fs.readFile(fileName, 'utf8'); 
        return JSON.parse(jsonData); 
    } catch (error) {
        console.error('Json reading error:', error);
        return null;
    }
}