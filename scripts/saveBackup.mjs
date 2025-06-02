import { sshConnect, execCommand, downloadBackup, exportCompact } from './utility/ssh.mjs';
import { delay } from './utility/delay.mjs';
import { getDate } from './utility/formattedDate.mjs';
import checkFolder from './utility/folder.mjs';
import logger from './logger.mjs';
import { getConfig } from './configLoader.mjs';
import { checkFile } from './utility/fileExists.mjs';
import path from 'path';

const config = await getConfig();

/**
 * Создаёт и скачивает backup файл файл с MikroTik роутера, сохраняет вывод export compact через SSH.
 * 
 * @param {string} address - IP-адрес
 * @param {string} name - Имя пользователя SSH
 * @param {string} key - Пароль пользователя SSH
 * @param {number} sshport - SSH-порт
 * @returns {Promise<void>}
 * 
 * @throws {Error} При ошибке подключения или выполнении команд
 * 
 * @example
 * await saveBackup('192.168.0.5', 'admin', 'password', 22);
 * 
 * @description Подробный алгоритм:
 * 1. Подключение по SSH
 * 2. Создание backup-файла
 * 3. Ожидание времени для создания backup-файла
 * 4. Создание папок для сохранения
 * 5. Скачивание backup-файла
 * 6. Удаление backup-файла с хоста
 * 7. Выполнение /export compact и сохранение вывода в файл
 * 8. Закрытие соединения
 * 9. Логирование результата
 * 10. Profit. (ну либо ошибка)
 */
export async function saveBackup(address, name, key, sshport) {
  console.log(`Connecting to ${address}`);
  await logger.addLine(`Connecting to ${address}`);

  const hostTimeout = config.timeouts.perHost || 180000;
  let timeoutHandle;
  let connection;

  try {
    await Promise.race([
      (async () => {
        // Подключение по SSH
        connection = await sshConnect({
          host: address,
          port: sshport,
          username: name,
          password: key,
          readyTimeout: config.timeouts.sshconnect
        });

        // Отправляем команду на создание бэкапа
        await execCommand(connection, '/system backup save name=backup', config.timeouts.execCommand);
        console.log('Creating backup file');
        await logger.addLine('Creating backup file');

        // Ждем заданное в конфиге время, чтобы роутер успел создать бэкап
        await delay(config.delays.creatingBackup);

        // Готовим папки и названия файлов
        const date = getDate();
        const shortDate = getDate(true);
        const backupsFolder = `./output/${date}/backups`;
        const exportsFolder = `./output/${date}/exports`;
        const backupName = `${address}-${shortDate}.backup`;
        const exportName = `${address}-${shortDate}.txt`;
        const backupFilePath = path.join(backupsFolder, backupName);
        const exportFilePath = path.join(exportsFolder, exportName);

        await checkFolder(backupsFolder);
        await checkFolder(exportsFolder);

        // Скачиваем backup файл
        console.log('Downloading backup file');
        await logger.addLine('Downloading backup file');
        await downloadBackup(connection, '/backup.backup', backupFilePath, config.timeouts.fileDownload);
        if (!await checkFile(backupFilePath)) {
          throw new Error(`Backup file wasn't saved for some reason`);
        }

        // После скачивания удаляем файл на роутере
        await execCommand(connection, '/file remove backup.backup', config.timeouts.execCommand);
        console.log(`File ${backupName} downloaded. Creating export.`);
        await logger.addLine(`File ${backupName} downloaded. Creating export.`);

        // Выполняем export compact
        await exportCompact(connection, exportFilePath, config.timeouts.exportCompact);
        if (!await checkFile(exportFilePath)) {
          throw new Error(`Export file wasn't saved for some reason`);
        }
        console.log(`Export saved to ${exportName}. Disconnecting`);
        await logger.addLine(`Export saved to ${exportName}. Disconnecting`);

        // Закрывем ssh подключение и логируем успех
        connection.end();
        console.log('Success\n');
        await logger.addLine('Success', true);
        logger.countSaved();
      })(),
      new Promise((_, reject) => {
        timeoutHandle = setTimeout(() => {
          try {
            if (connection) connection.end();
          } catch {}
          reject(new Error(`Host processing timeout after ${hostTimeout}ms`));
        }, hostTimeout);
      })
    ]);
  } catch (err) {
    logger.countFailed();
    throw err;
  } finally {
    if (timeoutHandle) clearTimeout(timeoutHandle);
    try {
      if (connection) connection.end();
    } catch {}
  }
}