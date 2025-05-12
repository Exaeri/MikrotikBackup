export function getDate() {
    return new Date().toISOString().split('T')[0]; // Дата вида год-месяц-число
}