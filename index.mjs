import { readJSON } from './utility/readJson.mjs';
import { saveBackup } from './backup.mjs';
import logger from './logger.mjs';

async function backupHosts() {
  await logger.clearLog();
  try {
    const hosts = await readJSON('./hosts/hostList.json');
    
    if (!Array.isArray(hosts)) {
      console.error('Hosts file may be corrupted');
      await logger.addLine('Error: Hosts file may be corrupted');
      return;
    }

    console.log('Starting backup process')
    console.log(`Total hosts found: ${hosts.length}\n`);
    await logger.addLine('Starting backup process');
    await logger.addLine(`Total hosts found: ${hosts.length}`, true);

    logger.startTimer();
    for (const host of hosts) {
      try {
        await saveBackup(host.host, host.username, host.password, host.port);
      } catch (err) {
        console.error(`Error in saving backup for ${host.host}:`, err.message);
        await logger.addLine(`Error in saving backup for ${host.host}: ${err.message}`, true);
      }
    }
    logger.stopTimer();

    console.log('Hosts list has been processed.');
    console.log(`Total saved backups: ${logger.savedBackups}.\nTotal failed: ${logger.failed}.`);
    console.log(`Elapsed time: ${logger.elapsedTime} seconds.`);
    await logger.addSummary();
    console.log(`Log file ${logger.fileName} created.`);
  } catch (err) {
    console.error('Error in reading hostList.json:', err.message);
    await logger.addLine(`Error in reading hostList.json: ${err.message}`);
  }
}

backupHosts();
