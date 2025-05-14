import { createReadStream } from 'node:fs';
import csv from 'csv-parser';

/**
 * Читает CSV-файл и возвращает массив объектов.
 * @param {string} file - Путь к CSV-файлу.
 * @returns {Promise<Array<object>>} - Промис с массивом данных.
 */
export async function readCSV(file) {
  return new Promise((resolve, reject) => {
    const results = [];
    createReadStream(file)
      .pipe(csv({ separator: ';' })) // Если разделитель в csv файле это ;
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
}