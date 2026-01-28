#!/usr/bin/env node

/**
 * Тестовый скрипт для проверки улучшенного парсера OpenAPI
 * 
 * Запуск: node test-parser.js
 */

const { parseOpenAPI } = require('./lib/openapi/parser');
const { generateExample, generateRequestExample, generateResponseExample, getAllExamples } = require('./lib/openapi/example-generator');

async function testParser() {
  console.log('🔍 Тестирование парсера OpenAPI - Коды ответов\n');

  try {
    // Парсим OpenAPI спецификацию
    console.log('📖 Парсинг OpenAPI спецификации...');
    const api = await parseOpenAPI();
    console.log(`✅ Успешно распарсено ${api.endpoints.length} эндпоинтов\n`);

    // Находим эндпоинт с множественными кодами ответов
    const testEndpoint = api.endpoints.find(e => e.id === 'SecurityOperations_getAuditEvents');

    if (!testEndpoint) {
      console.log('⚠️  Не найден эндпоинт SecurityOperations_getAuditEvents');
      return;
    }

    console.log(`🎯 Тестовый эндпоинт: ${testEndpoint.method} ${testEndpoint.path}`);
    console.log(`   ID: ${testEndpoint.id}\n`);

    // Тест: Проверка кодов ответов и их схем
    console.log('📥 Коды ответов и их схемы:\n');
    for (const [status, response] of Object.entries(testEndpoint.responses)) {
      console.log(`━━━ Статус ${status} ━━━`);
      console.log(`Описание: ${response.description}`);
      
      const jsonContent = response.content?.['application/json'];
      if (jsonContent) {
        if (jsonContent.schema) {
          console.log(`✅ Схема найдена:`);
          console.log(`   Тип: ${jsonContent.schema.type || 'unknown'}`);
          
          if (jsonContent.schema.$ref) {
            console.log(`   $ref: ${jsonContent.schema.$ref}`);
          }
          
          if (jsonContent.schema.properties) {
            const propCount = Object.keys(jsonContent.schema.properties).length;
            console.log(`   Свойств: ${propCount}`);
            
            // Показываем все свойства
            Object.entries(jsonContent.schema.properties).forEach(([name, prop]) => {
              console.log(`      - ${name}: ${prop.type || 'unknown'}${prop.description ? ` (${prop.description})` : ''}`);
            });
          }
          
          // Проверяем примеры
          if (jsonContent.example) {
            console.log(`✅ Пример найден`);
          }
        } else {
          console.log('⚠️  Схема не найдена');
        }
      } else {
        console.log('⚠️  JSON контент не найден');
      }
      console.log();
    }

    console.log('✅ Тестирование завершено!');

  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Запуск тестов
if (require.main === module) {
  testParser().catch(console.error);
}

module.exports = { testParser };
