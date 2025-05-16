import { getConfig } from "./configLoader.mjs";
import { getHosts } from "./hostsParser.mjs";
import logger from "./logger.mjs";
import { saveBackup } from "./saveBackup.mjs";
import { delay } from "./utility/delay.mjs";

const config = await getConfig();

/**
 * Выполняет алгоритм бэкапинга хостов
 * @description Подробный процесс работы:
 * 1. Получает список хостов
 * 2. Вызывает функцию скачивания бэкапа по SSH к каждому хосту по очереди, засекая общее время работы
 * 3. Выводит суммарную статистику и сохраняет лог
 */
export async function doBackupingProcess() {
  try {
    //Получаем список хостов
    const hosts = await getHosts(config.files.hostList);

    console.log('Starting backup process\n');
    await logger.addLine('Starting backup process', true);

    //Запускаем таймер, выполняем бэкапинг всех полученных хостов
    logger.startTimer();
    for (const [index, host] of hosts.entries()) {
      try {
        console.log(`Host ${index + 1} of ${hosts.length}`);
        await saveBackup(host.host, host.username, host.password, host.port);

        if (index < hosts.length - 1) 
          await delay(config.delays.listStep);

      } catch (err) {
        console.error(`Error on ${host.host}: ${err.message}\n`);
        await logger.addLine(`Error on ${host.host}: ${err.message}`, true);
      }
    }
    logger.stopTimer();

    //После прохода всех хостов остановили таймер, выводим итоговую статистику в консоль и лог файл
    let successRate = Math.round((logger.savedBackups / hosts.length) * 100);
    let summary = 
      'Hosts list has been processed.\n' +
      `Total saved backups: ${logger.savedBackups}.\n` +
      `Total failed: ${logger.failed}.\n` +
      `Success rate: ${successRate}%\n` +
      `Elapsed time: ${logger.elapsedTime} seconds\n`;
      
    console.log(summary);
    await logger.addLine(summary);
    console.log(`Log file ${logger.fileName} created.`);
  } catch (err) {
    console.error('Backuping process error:', err.message);
    await logger.addLine(`Backuping process error:: ${err.message}`, true);
  }
}