/**
 * Возвращает текущую дату в формате год-месяц-день.
 * @returns {string} - Строка с датой.
 *
 * @example
 * console.log(getDate()); // "2023-12-31"
 */
export function getDate() {
    return new Date().toISOString().split('T')[0];
}