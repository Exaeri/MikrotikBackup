/**
 * Возвращает текущую дату в указанном формате
 * @param {boolean} [compact=false] - По умолчанию формат год-месяц-число. Если true, возвращает дату без разделителей (годмесяцчисло).
 * @returns {string} - Строка с датой в нужном формате
 *
 * @example
 * getDate();       // "2023-12-31"
 * @example
 * getDate(true);   // "20231231"
 */
export function getDate(compact = false) {
    const date = new Date().toISOString().split('T')[0];
    return compact ? date.replace(/-/g, '') : date;
}

/**
 * Форматирует полученный объект с датой и временем планировщика
 * @param {Date} dateObj - Объект Date
 * @returns {String} Возвращает строку с датой и временем следующей работы планировщика
 */
export function nextScheduled(dateTimeObj) {
    const date = dateTimeObj.toISODate();
    const time = dateTimeObj.toFormat('HH:mm');
    return `on ${date} at ${time}`;
}
