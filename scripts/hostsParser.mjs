import { readCSV } from './utility/csvParse.mjs';
import { checkFile } from './utility/fileExists.mjs';
import { loadConfig } from './configLoader.mjs';
import logger from './logger.mjs';
import path from 'path';

const config = await loadConfig();

/**
 * Получает список хостов из CSV-файла
 * @function getHosts
 * @returns {Promise<Array<Object>>} Массив объектов с данными хостов
 * @throws {Error} В случае:
 *  - Отсутствия файла
 *  - Пустого списка хостов
 *  - Отсутствия обязательных полей
 * 
 * @example
 * const hosts = await getHosts();
 */
export async function getHosts() {
    let hostsFile = `./hosts/${config.files.hostList}`;
    
    try {
        // Проверка существования файла
        if (!await checkFile(hostsFile)) {
            throw new Error(`File not found at: ${path.resolve(hostsFile)}`);
        }

        console.log(`Fetching hosts from ${config.files.hostList}`);
        await logger.addLine(`Fetching hosts from ${config.files.hostList}`);

        let hosts = await readCSV(hostsFile);

        if (!hosts.length) {
            throw new Error('List is empty');
        }

        let requiredFields = ['host', 'username', 'password', 'port'];
        let missingFields = requiredFields.filter(field => !(field in hosts[0]));

        if (missingFields.length) {
            throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }

        console.log(`Total hosts found: ${hosts.length}\n`);
        await logger.addLine(`Total hosts found: ${hosts.length}`, true);
        return hosts;
    } catch (err) {
        console.error(`Hosts reading error: ${err.message}`);
        await logger.addLine(`Hosts reading error: ${err.message}`);
        process.exit(1);
    }
}