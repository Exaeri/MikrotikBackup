import { readJSON } from './utility/readJson.mjs';
import { saveBackup } from './backup.mjs';

async function backupHosts() {
  try {
    const hosts = await readJSON('./hosts/hostList.json');
    
    if (!Array.isArray(hosts)) {
      console.error('Hosts file may be corrupted');
      return;
    }
    console.log(`Total hosts found: ${hosts.length}`);

    for (const host of hosts) {
      try {
        await saveBackup(host.host, host.username, host.password, host.port);
      } catch (err) {
        console.error(`Error in saving backup for ${host.host}:`, err.message);
      }
    }

  } catch (err) {
    console.error('Error in reading hostList.json:', err.message);
  }
}

backupHosts();
