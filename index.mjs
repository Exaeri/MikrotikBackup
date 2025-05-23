import { runWithSchedule } from './scripts/scheduler.mjs'
import logger from './scripts/logger.mjs';

// Вызов основной функции программы
runWithSchedule().catch(async (err) => {
  await logger.addLine(`Program failure: ${err.message}`);
  console.error(`Program failure: ${err.message}`);
  process.exit(1);
});

//Напишем в консоли и логах, если остановили в терминале через Ctrl+C
process.on('SIGINT', ctrlcStop); 
async function ctrlcStop() {
  console.log('\nProgram was stopped by user');
  await logger.addLine('Program was stopped by user', true);
  process.exit(0);
}

process.on('uncaughtException', (err) => {
  logger.addLine(`Uncaught Exception: ${err}`);
  console.error(`Uncaught Exception: ${err}`);
});

process.on('unhandledRejection', (err) => {
  logger.addLine(`Unhandled Exception: ${err}`);
  console.error(`Unhandled Exception: ${err}`);
});