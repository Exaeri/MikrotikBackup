import fs from 'fs/promises';

/**
 * Читает и парсит JSON-файл
 * @param {string} file - Путь к файлу
 * @returns {Promise<object|Array|null>} - Промис, который разрешается объектом или массивом, либо null, если ошибка.
 * @throws {SyntaxError} - Если файл содержит невалидный JSON
 * @throws {Error} - Если файл не существует или нет прав на чтение
 * 
 * @example
 * // Чтение конфига с обработкой ошибок
 * try {
 *   const data = await readJSON('data.json');
 * } catch (err) {
 *   console.error('Error in reading json file:', err.message);
 * }
 */
export async function readJSON(file) {
    try {
        const jsonData = await fs.readFile(file, 'utf8'); 
        return JSON.parse(jsonData); 
    } catch (error) {
        console.error('Json reading error:', error);
        return null;
    }
}