import { readCSV } from './utility/csvParse.mjs';
import { checkFile } from './utility/fileExists.mjs';
import logger from './logger.mjs';
import path from 'path';

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
export async function getHosts(fileName) {
    let filePath = `./hosts/${fileName}`;
    
    try {
        // Проверка существования файла
        if (!await checkFile(filePath)) {
            throw new Error(`File not found at: ${path.resolve(filePath)}`);
        }

        console.log(`Fetching hosts from ${fileName}`);
        await logger.addLine(`Fetching hosts from ${fileName}`);

        //Чтение и парсинг CSV файла с хостами
        let hosts = await readCSV(filePath);

        //Проверка наличия хостов в файле
        if (!hosts.length) {
            throw new Error('List is empty');
        }

        //Проверка наличия обязательных полей
        let requiredFields = ['host', 'username', 'password', 'port'];
        let missingFields = requiredFields.filter(field => !(field in hosts[0]));
        if (missingFields.length) {
            throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }

        console.log(`Total hosts found: ${hosts.length}\n`);
        await logger.addLine(`Total hosts found: ${hosts.length}`, true);
        return hosts;
    } catch (err) {
        //При ошибке пишем лог и завершаем программу, т.к. без хостов выполнять программу далее нет смысла.
        console.error(`Hosts reading error: ${err.message}`);
        await logger.addLine(`Hosts reading error: ${err.message}`);
        process.exit(1);
    }
}