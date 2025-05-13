import checkFolder  from './utility/folder.mjs';
import { getDate } from './utility/formattedDate.mjs';
import { appendFile, writeFile} from 'fs/promises';

export default class logger {
    static #logsFolder = `./logs`;
    static #fileName = `${getDate()}.log`;
    static #logsFilePath = `${this.#logsFolder}/${this.#fileName}`;
    static #savedBackups = 0;
    static #failed = 0;
    static #startTime = null;
    static #elapsedTime = 0;

    static get savedBackups() {
        return this.#savedBackups;
    }

    static get failed() {
        return this.#failed;
    }

    static get fileName() {
        return this.#fileName;
    }

    static get elapsedTime() {
        return this.#elapsedTime;
    }

    static getTime() {
        let tstamp = new Date();
        return tstamp.toTimeString().split(' ')[0]; // Время в формате часы:минуты:секунды
    }

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

    static countSaved() {
        this.#savedBackups++;
    }

    static countFailed() {
        this.#failed++;
    }

    static #flushCounters() {
        this.#savedBackups = 0;
        this.#failed = 0;
    }

    static async addSummary() {
        let summary = 
        `Hosts list has been processed.
        Total saved backups: ${this.#savedBackups}.
        Total failed: ${this.#failed}.
        Elapsed time: ${this.#elapsedTime} seconds.`;
        await this.addLine(summary);
    }

    static async clearLog() {
        this.#flushCounters();
        try {
            await writeFile(this.#logsFilePath, '');
        } catch (err) {
            console.error(`Clearing log file error: ${err.message}`);
        }
    }

    static startTimer() {
        this.#startTime = performance.now();
    }

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