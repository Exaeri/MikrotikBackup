/**
 * Создает задержку на указанное время.
 * @param {number} ms - Время задержки в миллисекундах.
 * @returns {Promise<void>} - Промис, который разрешится после задержки.
 *
 * @example
 * // Задержка на 2 секунды
 * await delay(2000);
 */
export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}