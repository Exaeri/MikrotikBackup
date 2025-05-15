import { saveBackup } from './scripts/backup.mjs';
import logger from './scripts/logger.mjs';
import { delay } from './scripts/utility/delay.mjs';
import { loadConfig } from './scripts/configLoader.mjs';
import { getHosts } from './scripts/hostsParser.mjs';

const config = await loadConfig();

async function backupHosts() {
  await logger.clearLog();

  const hosts = await getHosts();

  console.log('Starting backup process\n')
  await logger.addLine('Starting backup process', true);

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

  let summary = 
    'Hosts list has been processed.\n' +
    `Total saved backups: ${logger.savedBackups}.\n` +
    `Total failed: ${logger.failed}.\n` +
    `Success rate: ${Math.round((logger.savedBackups/hosts.length)*100)}%\n` +
    `Elapsed time: ${logger.elapsedTime} seconds`;
    
  console.log(summary);
  await logger.addLine(summary);
  console.log(`Log file ${logger.fileName} created.`);
}

backupHosts();
