import { NodeSSH } from 'node-ssh';
import { delay } from './utility/delay.mjs';
import { getDate } from './utility/formattedDate.mjs';
import checkFolder from './utility/folder.mjs';
import logger from './logger.mjs';
import { writeFile} from 'fs/promises';
import { getConfig } from './configLoader.mjs';

const ssh = new NodeSSH();
const config = await getConfig();

/**
 * Создает и скачивает backup файл с MikroTik роутера по SSH
 * @param {string} address - IP-адрес хоста
 * @param {string} name - Логин для SSH
 * @param {string} key - Пароль для SSH
 * @param {number} sshport - Порт SSH
 * @returns {Promise<void>}
 * 
 * @throws {Error} Возможные ошибки подключения или выполнения команд
 * 
 * @example
 * await saveBackup('192.168.88.1', 'admin', 'password', 22);
 * 
 * @description Подробный процесс работы:
 * 1. Устанавливает SSH соединение с роутером
 * 2. Выполняет команду создания backup файла
 * 3. Ждет указанное в конфиге время (config.delays.creatingBackup)
 * 4. Создает локальную папку вида ./backups/год-месяц-день/адрессхоста
 * 5. Скачивает backup файл с роутера в созданную папку
 * 6. Удаляет backup файл с роутера
 * 7. Выполняет команду export compact
 * 8. Сохраняет полученный вывод в текстовый файл
 * 9. Закрывает SSH соединение
 * 10. Логирует результат
 */
export async function saveBackup(address, name, key, sshport) {

    console.log(`Connecting to ${address}`);
    await logger.addLine(`Connecting to ${address}`);
    try {
        // Подключение по SSH
        await ssh.connect({
            host: address, 
            username: name,
            password: key, 
            port: sshport,
            readyTimeout: config.timeouts.sshconnect
        });

        // Отправляем команду на создание бэкапа
        await ssh.execCommand('/system backup save name=backup');
        console.log('Creating backup file');
        await logger.addLine('Creating backup file');

        //Ждем заданное в конфиге время, чтобы бэкап создался
        await delay(config.delays.creatingBackup);

        // Готовим папки и названия файлов
        const date = getDate();
        let backupsFolder = `./output/${date}/backups`;
        let backupName = `${address}-${getDate(true)}.backup`;
        let exportsFolder = `./output/${date}/exports`;
        let exportName = `${address}-${getDate(true)}.txt`;
        await checkFolder(backupsFolder);
        await checkFolder(exportsFolder);

        // Скачиваем backup файл
        console.log('Downloading backup file');
        await logger.addLine('Downloading backup file');

        try {
            await Promise.race([
                ssh.getFile(`${backupsFolder}/${backupName}`, '/backup.backup'),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('File download timeout')), 
                    config.timeouts.sshdownload)
                )
            ]);
        } catch (downloadErr) {
            throw downloadErr;
        }

        // После скачивания удаляем файл на роутере
        await ssh.execCommand('/file remove backup.backup');
        console.log(`File ${backupName} downloaded. Creating export.`);
        await logger.addLine(`File ${backupName} downloaded. Creating export.`);

        // Отправляем команду export compact
        let exportResult = await ssh.execCommand('/export compact');
        if (exportResult.stderr) {
            throw new Error(`Export failed: ${exportResult.stderr}`);
        }

        // Сохраняем вывод export в текстовый файл
        await writeFile(`${exportsFolder}/${exportName}`, exportResult.stdout);
        console.log(`Export saved to ${exportName}. Disconnecting`);
        await logger.addLine(`Export saved to ${exportName}. Disconnecting`);

        // Закрывем ssh подключение
        ssh.dispose();

        // Логирование успеха
        console.log('Success\n');
        await logger.addLine('Success', true);
        logger.countSaved();
    } catch (err) {
        // При ошибке закрываем подключение
        if (ssh.isConnected()) 
            ssh.dispose();

        logger.countFailed();
        throw err;
    }
}