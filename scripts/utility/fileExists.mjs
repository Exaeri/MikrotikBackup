import fs from 'fs/promises';

/**
 * Проверяет существование файла
 * @param {string} file - Путь к проверяемому файлу
 * @returns {Promise<boolean>} - true если файл существует, false если нет
 * 
 * @example
 * if (!await checkFile('./data/data.csv')) {
 *   throw new Error('File not found');
 * }
 */
export async function checkFile(file) {
    try {
        // Используем fs.constants.F_OK для проверки существования без прав доступа
        await fs.access(file, fs.constants.F_OK);
        return true;
    } catch {
        return false;
    }
}