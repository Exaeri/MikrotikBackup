import { Client } from 'ssh2';
import fs from 'fs';
import { NodeSSH } from 'node-ssh';

/**
 * Устанавливает SSH-подключение к удалённому хосту.
 * 
 * @param {string} params.host - IP-адрес.
 * @param {number} params.port - Порт подключения.
 * @param {string} params.username - Имя пользователя.
 * @param {string} params.password - Пароль.
 * @param {number} params.readyTimeout - Таймаут готовности соединения в миллисекундах.
 * @returns {Promise<Client>} Объект установленного SSH-соединения.
 */
export function sshConnect({ host, port, username, password, readyTimeout }) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    conn.on('ready', () => resolve(conn))
        .on('error', reject)
        .connect({ host, port, username, password, readyTimeout });
  });
}

/**
 * Выполняет команду на удалённом хосте через SSH.
 * 
 * @param {Client} connection - Установленное SSH-соединение.
 * @param {string} command - Команда, которую необходимо выполнить.
 * @param {number} [timeout=0] - Максимальное время ожидания выполнения команды (мс).
 * @returns {Promise<string>} Вывод выполненной команды.
 */
export async function execCommand(connection, command, timeout = 0) {
  const ssh = new NodeSSH();
  ssh.connection = connection;

  const timeoutError = new Error(`Command ${command} timeout`);

  return Promise.race([
    (async () => {
      const result = await ssh.execCommand(command);

      if (result.stderr) {
        throw new Error(`Command ${command} failed: ${result.stderr}`);
      }

      return result.stdout;
    })(),
    timeout
      ? new Promise((_, reject) => setTimeout(() => reject(timeoutError), timeout))
      : new Promise(() => {})
  ]);
}

/**
 * Скачивает файл с удалённого устройства через SFTP.
 * 
 * @param {Client} connection - Установленное SSH-соединение.
 * @param {string} remotePath - Путь к файлу на удалённом хосте.
 * @param {string} localPath - Локальный путь для сохранения файла.
 * @param {number} [timeout=0] - Таймаут скачивания в миллисекундах.
 * @returns {Promise<void>} Промис, завершающийся при успешной загрузке файла.
 */
export function downloadBackup(connection, remotePath, localPath, timeout = 0) {
  return new Promise((resolve, reject) => {
    connection.sftp((err, sftp) => {
      if (err) return reject(err);

      let timer;
      if (timeout) timer = setTimeout(() => reject(new Error(`SFTP timeout: ${remotePath}`)), timeout);

      sftp.fastGet(remotePath, localPath, (err) => {
        if (timer) clearTimeout(timer);
        if (err) return reject(err);
        resolve();
      });
    });
  });
}

/**
 * Выполняет команду '/export compact' на удалённом хосте и сохраняет вывод в файл.
 * 
 * @param {Client} connection - Установленное SSH-соединение.
 * @param {string} localPath - Путь к локальному файлу для сохранения конфигурации.
 * @param {number} [timeout=0] - Таймаут выполнения команды в миллисекундах.
 * @returns {Promise<void>} Промис, завершающийся после успешного экспорта и записи в файл.
 */
export async function exportCompact(connection, localPath, timeout = 0) {
  const ssh = new NodeSSH();
  ssh.connection = connection;

  const timeoutError = new Error('Export compact timeout');

  return Promise.race([
    (async () => {
      const result = await ssh.execCommand('/export compact');

      if (result.stderr) {
        throw new Error(`Export compact failed: ${result.stderr}`);
      }

      await writeFile(localPath, result.stdout);
    })(),
    timeout
      ? new Promise((_, reject) => setTimeout(() => reject(timeoutError), timeout))
      : new Promise(() => {})
  ]);
}