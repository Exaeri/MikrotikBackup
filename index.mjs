import { readJSON } from './utility/readJson.mjs';
import { readCSV } from './utility/csvParse.mjs';
import { saveBackup } from './backup.mjs';
import logger from './logger.mjs';
import { delay } from './utility/delay.mjs';

const config = await readJSON('config.json');

async function backupHosts() {
  await logger.clearLog();

  let hosts;
  try {
    hosts = await readCSV(`./hosts/${config.files.hostList}`);
  } catch (err) {
    console.error(err.message);
    await logger.addLine(err.message);
  return;
  }

  console.log(`Total hosts found: ${hosts.length}`);
  await logger.addLine(`Total hosts found: ${hosts.length}`, true);
  console.log('Starting backup process\n')
  await logger.addLine('Starting backup process');

  logger.startTimer();
  for (const [index, host] of hosts.entries()) {
    try {
      console.log(`Host ${index + 1} of ${hosts.length}`);
      await saveBackup(host.host, host.username, host.password, host.port);

      if (index < hosts.length - 1) 
        await delay(config.delays.listStep);

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
}

backupHosts();
