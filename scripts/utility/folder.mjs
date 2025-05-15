import fs from 'fs/promises';

/**
 * Создаёт папку (включая все вложенные директории, если нужно).
 * @param {string} folderName - Путь к папке.
 * @returns {Promise<void>} - Промис, который разрешается после создания папки.
 * @throws {Error} - Если произошла ошибка при создании.
 * 
 * @example
 * // Создание папки 'backups'
 * await createFolder('backups');
 */
export default async function(folderName) {
    try {
        await fs.mkdir(folderName, { recursive: true });
    } catch (err) {
        console.error('Creating folder error:', err);
        throw err;
    }
}