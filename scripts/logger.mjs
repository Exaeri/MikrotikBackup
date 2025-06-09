import checkFolder  from './utility/folder.mjs';
import { getDate } from './utility/formattedDate.mjs';
import { appendFile, writeFile} from 'fs/promises';

/**
 * Класс для логирования работы программы
 * @class
 * @static
 * 
 * @property {string} fileName - Имя текущего лог-файла
 * @property {number} savedBackups - Количество успешно сохраненных бэкапов
 * @property {number} failed - Количество неудач при попытке получить бэкап
 * @property {number} elapsedTime - Время, полученное из таймера (в секундах)
 * 
 * @example
 * // Базовое использование
 * logger.startTimer();
 * await logger.addLine('Starting backup process', true);
 * 
 * try {
 *   await saveBackup(...);
 *   await logger.addLine(`Success`, true);
 *   logger.countSaved();
 * } catch (err) {
 *   logger.countFailed();
 *   await logger.addLine(`Error: ${err.message}`, true);
 * }
 * 
 * logger.stopTimer();
 */
export default class logger {
    static #logsFolder = `./logs`;
    static #savedBackups = 0;
    static #savedExports = 0;
    static #successHosts = 0;
    static #errors = 0;
    static #startTime = null;
    static #elapsedTime = 0;
    static #currentDate = null;

    /**
     * Динамически получаем имя файла в соответствии с текущей датой
     * @returns {string}
     */
    static get #fileName() {
        return `${this.#currentDate|| getDate()}.log`;
    }

    /**
     * Получаем актуальный путь для файла логов
     * @returns {string}
     */
    static get #logsFilePath() {
        return `${this.#logsFolder}/${this.#fileName}`;
    }

    /**
     * Количество сохраненных бэкапов
     * @returns {number}
     */
    static get savedBackups() {
        return this.#savedBackups;
    }

    /**
     * Количество сохраненных экспортов
     * @returns {number}
     */
    static get savedExports() {
        return this.#savedExports;
    }

    /**
     * Количество успешно сохраненных бэкапов
     * @returns {number}
     */
    static get successHosts() {
        return this.#successHosts;
    }

    /**
     * Количество неудач при попытке получить бэкап
     * @returns {number}
     */
    static get errors() {
        return this.#errors;
    }

    /**
     * Имя текущего лог-файла
     * @returns {string}
     */
    static get fileName() {
        return this.#fileName;
    }

    /**
     * Время, полученное из секундомера (в секундах)
     * @returns {string}
     */
    static get elapsedTime() {
        return this.#elapsedTime;
    }

    /**
     * Возвращает текущее время в формате часы:минуты:секунды
     * @returns {string}
     */
    static getTime() {
        let tstamp = new Date();
        return tstamp.toTimeString().split(' ')[0];
    }

    /**
     * Добавляет запись в лог-файл
     * @param {string} content - Содержимое лога
     * @param {boolean} [addEmptyLine=false] - Добавить пустую строку после
     * @returns {Promise<void>}
     * 
     * @example
     * await logger.addLine('Saving backup');
     * await logger.addLine('Before next block', true);
     */
    static async addLine(content, addEmptyLine = false) {
        await checkFolder(this.#logsFolder);
        let time = this.getTime();
        let line = `[${time}] ${content}\n${addEmptyLine ? '\n' : ''}`;
        try {
            await appendFile(this.#logsFilePath, line);
        } catch (err) {
            console.error(`Writing log file error: ${err.message}`);
        }
    }

    /**
     * Увеличивает счетчик сохраненных бэкапов
     */
    static countBackups() {
        this.#savedBackups++;
    }

    /**
     * Увеличивает счетчик сохраненных экспортов
     */
    static countExports() {
        this.#savedExports++;
    }

    /**
     * Увеличивает счетчик успешных хостов
     */
    static countSuccess() {
        this.#successHosts++;
    }

    /**
     * Увеличивает счетчик ошибок
     */
    static countErrors() {
        this.#errors++;
    }

    /**
     * Сбрасывает счетчики
     * @private
     */
    static #flushCounters() {
        this.#savedBackups = 0;
        this.#errors = 0;
        this.#savedExports = 0;
        this.#successHosts = 0;
    }

    /**
     * Очищает лог-файл и сбрасывает счетчики
     * @returns {Promise<void>}
     */
    static async clearLog() {
        await checkFolder(this.#logsFolder);
        this.#flushCounters();
        this.#currentDate = getDate();
        try {
            await writeFile(this.#logsFilePath, '');
        } catch (err) {
            console.error(`Clearing log file error: ${err.message}`);
        }
    }

    /**
     * Запускает таймер
     * @throws {Error} Если таймер уже запущен
     */
    static startTimer() {
        if (this.#startTime !== null) {
            throw new Error('Timer already started');
        }
        this.#startTime = performance.now();
    }

    /**
     * Останавливает таймер и вычисляет затраченное время
     * @throws {Error} Если таймер не был запущен
     */
    static stopTimer() {
        if (this.#startTime === null) {
            throw new Error('Timer wasnt started');
        }
        let endTime = performance.now();
        let difference = endTime - this.#startTime;
        this.#elapsedTime = (difference / 1000).toFixed(2); // С переводом в секунды
        this.#startTime = null;
    }
}