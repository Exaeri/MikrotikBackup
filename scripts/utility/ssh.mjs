import { Client } from 'ssh2';
import fs from 'fs';

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
export function execCommand(connection, command, timeout = 0) {
  return new Promise((resolve, reject) => {
    let timer;
    if (timeout) timer = setTimeout(() => reject(new Error(`Timeout: ${command}`)), timeout);

    connection.exec(command, (err, stream) => {
      if (err) {
        if (timer) clearTimeout(timer);
        return reject(err);
      }

      let stdout = '', stderr = '';
      stream.on('close', (code) => {
        if (timer) clearTimeout(timer);
        if (code !== 0) return reject(new Error(`Command failed: ${cmd}\n${stderr}`));
        resolve(stdout);
      }).on('data', data => stdout += data.toString())
        .stderr.on('data', data => stderr += data.toString())
        .on('error', err => {
          if (timer) clearTimeout(timer);
          reject(err);
        });
    });
  });
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
export function exportCompact(connection, localPath, timeout = 0) {
  return new Promise((resolve, reject) => {
    let timer;
    if (timeout) timer = setTimeout(() => reject(new Error('Export compact timeout')), timeout);

    connection.exec('/export compact', (err, stream) => {
      if (err) {
        if (timer) clearTimeout(timer);
        return reject(err);
      }

      const writeStream = fs.createWriteStream(localPath);
      stream.pipe(writeStream);

      stream.on('close', (code) => {
        if (timer) clearTimeout(timer);
        if (code !== 0) return reject(new Error('Export command failed'));
        resolve();
      });

      stream.on('error', (err) => {
        if (timer) clearTimeout(timer);
        reject(err);
      });

      writeStream.on('error', (err) => {
        if (timer) clearTimeout(timer);
        reject(err);
      });
    });
  });
}