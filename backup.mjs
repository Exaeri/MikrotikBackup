import { NodeSSH } from 'node-ssh';
import { delay } from './utility/delay.mjs';
import { readJSON } from './utility/readJson.mjs';
import { getDate } from './utility/formattedDate.mjs';
import checkFolder  from './utility/folder.mjs';

const ssh = new NodeSSH();
const config = await readJSON('config.json');

export  async function saveBackup(address, name, key, sshport) {
    console.log(`Connecting to ${address}...`);
    try {
        await ssh.connect({
            host: address, 
            username: name,
            password: key, 
            port: sshport,
        });

        await ssh.execCommand('/system backup save name=backup');
        console.log('Creating backup file...')
        await delay(config.delays.creatingBackup); //даем роутеру время на создание бэкапа

        let date = getDate();
        let folderName = `backups/${date}`;
        let backupName = `backup-${address}-${date}.backup`;
        await checkFolder(folderName);

        console.log('Downloading backup file...');

        await ssh.getFile(
            `./${folderName}/${backupName}`,   // Локальный файл
            '/backup.backup'                   // Файл на роутере
        );

        await ssh.execCommand('/file remove backup.backup');
        console.log(`File ${backupName} downloaded. Disconnecting...`);
        ssh.dispose();
        console.log('Done');
    } catch (err) {
        console.error('Ошибка:', err.message);
        ssh.dispose();
    }
}