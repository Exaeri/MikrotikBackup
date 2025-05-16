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