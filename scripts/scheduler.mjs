import { CronJob } from 'cron';
import logger from './logger.mjs';
import { doBackupingProcess } from './backupingProcess.mjs';
import { getConfig } from './configLoader.mjs';
import { nextScheduled } from './utility/formattedDate.mjs';

const config = await getConfig();

/**
 * Создает и настраивает задание для автоматического бэкапа по расписанию
 * 
 * @param {string} cronExpression - Cron выражение для расписания
 * @param {string} timezone - Часовой пояс (например, `"Europe/Moscow"`)
 * @returns {CronJob} Объект CronJob, который уже запущен (autoStart = true)
 */
export function createSchedule(cronExpression, timezone) {
    const job = new CronJob(
        cronExpression,
        async () => {
            await logger.clearLog();
            console.log('Planned scheduled run is started\n');
            await logger.addLine('Planned scheduled run is started', true);
            await doBackupingProcess();
            
            let nextRun = nextScheduled(job.nextDate());
            console.log(`Next scheduled run ${nextRun}\n`);
            await logger.addLine(`Next scheduled run ${nextRun}`);
        },
        null,
        true,
        timezone
    );
    return job;
}

/**
 * Основная функция запуска программы
 * @description Подробный процесс работы:
 * 1. Очищает лог файл на случай, если это повторный запуск в данный день
 * 2. Запускает процесс бэкапинга хостов
 * 3. Если расписание выключено в конфиге завершает работу
 * 4. Если расписание включено - вызывает функцию запуска работы по расписанию
 */
export async function runWithSchedule() {
    //Очищаем лог и вызываем бэкапинг хостов
    await logger.clearLog();
    await doBackupingProcess();

    //Если расписание выключено в конфиге - завершет работу
    if (!config.schedule.enabled) {
        console.log('Schedule disabled in config. No runs planned.');
        await logger.addLine('Schedule disabled in config. No runs planned.');
        return;
    }

    //Если расписание включено - переходим на работу по расписанию
    let cronExpression = `${config.schedule.minutes} ${config.schedule.hours} * * ${config.schedule.dayOfWeek}`;
    const job = createSchedule(cronExpression, config.schedule.timezone);

    let nextRun = nextScheduled(job.nextDate());
    console.log(`Next scheduled run ${nextRun}\n`);
    await logger.addLine(`Next scheduled run ${nextRun}`);
}