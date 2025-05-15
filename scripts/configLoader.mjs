import { readJSON } from './utility/readJson.mjs';
import { checkFile } from './utility/fileExists.mjs';
import logger from './logger.mjs';
import path from 'path';

/**
 * Загружает и валидирует конфиг программы
 * @returns {Promise<Object>} Возвращает прочитанные настройки
 * @throws {Error} Если конфиг некорректен или файл не найден
 * 
 * @example
 * const config = await loadConfig();
 */
export async function loadConfig() {
    let configFile = './config.json';
    
    try {
        // Проверка существования файла
        if (!await checkFile(configFile)) {
            throw new Error(`File not found at: ${path.resolve(configFile)}`);
        }
            
        let config = await readJSON(configFile);

        // Обязательные поля
        let requiredFields = [
        'files.hostList',
        'delays.creatingBackup',
        'delays.listStep'
        ];

        // Проверка наличия обязательных полей
        for (let field of requiredFields) {
            if (!field.split('.').reduce((obj, key) => obj?.[key], config)) {
                throw new Error(`Missing required field: ${field}`);
            }
        }

        return config;
    } catch (err) {
        console.error(`Config reading error: ${err.message}`);
        await logger.clearLog();
        await logger.addLine(`Config reading error: ${err.message}`);
        process.exit(1);
    }
}