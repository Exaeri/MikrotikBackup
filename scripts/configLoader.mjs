import { readJSON } from './utility/readJson.mjs';
import { checkFile } from './utility/fileExists.mjs';
import logger from './logger.mjs';
import path from 'path';

function convertDayOfWeek(day) {
  const daysMap = {
    'sunday': 0,
    'monday': 1,
    'tuesday': 2,
    'wednesday': 3,
    'thursday': 4,
    'friday': 5,
    'saturday': 6,
  };

  if (typeof day === 'number') {
    if (day >= 0 && day <= 6) return day;
    throw new Error('Day of week number must be 0-6');
  }

  
  let converted = String(day).trim().toLowerCase();
  if (daysMap[converted] === undefined) {
    let validValues = Object.keys(daysMap).filter(k => k.length > 3);
    throw new Error(`Incorrect dayOfWeek. Use: ${validValues.join(', ')} or 0-6`);
  }
  
  return daysMap[converted];
}

/**
 * Загружает и валидирует конфиг программы
 * @returns {Promise<Object>} Возвращает прочитанные настройки
 * @throws {Error} Если конфиг некорректен или файл не найден
 * 
 * @example
 * const config = await getConfig();
 */
export async function getConfig() {
    let configFile = './config.json';
    
    try {
        // Проверка существования файла
        if (!await checkFile(configFile)) {
            throw new Error(`File not found at: ${path.resolve(configFile)}`);
        }
        
        //Чтение и парсинг JSON файла c настройками
        let config = await readJSON(configFile);

        // Обязательные поля
        let requiredFields = [
        'files.hostList',
        'delays.creatingBackup',
        'delays.listStep',
        'timeouts.sshconnect',
        'timeouts.sshdownload',
        'timeouts.keepaliveInterval',
        'timeouts.keepaliveCountMax'
        ];

        // Проверка наличия обязательных полей
        for (let field of requiredFields) {
            if (!field.split('.').reduce((obj, key) => obj?.[key], config)) {
                throw new Error(`Missing required field: ${field}`);
            }
        }

        // Обязательные поля расписания, если оно включено
        if (config.schedule?.enabled) {
            let scheduleFields = [
                'schedule.dayOfWeek',
                'schedule.hours',
                'schedule.minutes',
                'schedule.timezone'
            ];

            // Проверка наличия обязательных полей расписания
            for (const field of scheduleFields) {
                if (field.split('.').reduce((obj, key) => obj?.[key], config) === undefined) {
                    throw new Error(`Missing required field when schedule enabled: ${field}`);
                }
            }

            // Проверка корректности часов
            if (!Number.isInteger(config.schedule.hours) || 
            config.schedule.hours < 0 || 
            config.schedule.hours > 23) {
                throw new Error('Schedule hours must be number between 0 and 23');
            }

            // Проверка корректности часов минут
            if (!Number.isInteger(config.schedule.minutes) || 
            config.schedule.minutes < 0 || 
            config.schedule.minutes > 59) {
                throw new Error('Schedule minutes must be number between 0 and 59');
            }

            // Проверка корректности часового пояса
            try {
                new Intl.DateTimeFormat(undefined, { timeZone: config.schedule.timezone });
            } catch (err) {
                throw new Error(`Invalid timezone: ${config.schedule.timezone}`);
            }
            config.schedule.dayOfWeek = convertDayOfWeek(config.schedule.dayOfWeek);
        }   
        return config;
    } catch (err) {
        //При ошибке пишем лог и завершаем программу, т.к. без конфига она не будет работать.
        console.error(`Config reading error: ${err.message}`);
        await logger.clearLog();
        await logger.addLine(`Config reading error: ${err.message}`);
        process.exit(1);
    }
}