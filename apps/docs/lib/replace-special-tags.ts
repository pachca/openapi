/**
 * Replace special tags with MDX components
 * Used for guide pages (markdown-content.tsx) where MDXRemote is used
 *
 * Tags are replaced with <Warning> and <Info> MDX component calls
 * Note: Content must be on single line for MDX to parse correctly
 */
export function replaceSpecialTagsForMDX(text: string): string {
  // #corporation_price_only tag (warning block)
  text = text.replace(
    /#corporation_price_only/g,
    `\n\n<Warning>Доступно только на тарифе **Корпорация**</Warning>\n\n`
  );

  // #admin_access_token_required tag
  text = text.replace(
    /#admin_access_token_required/g,
    `\n\n<Info>Данный метод доступен для работы только с \`access_token\` администратора пространства. Подробнее о том, как получить такой токен, вы можете прочитать в разделе [Запросы и ответы](/guides/requests-responses).<br />*Бот пока не может работать с подобными методами и взаимодействует с API на уровне обычного участника пространства.*</Info>\n\n`
  );

  // #owner_access_token_required tag
  text = text.replace(
    /#owner_access_token_required/g,
    `\n\n<Info>Экспорт сообщений доступен только с \`access_token\` владельца пространства. Подробнее о том, как получить такой токен — в разделе [Запросы и ответы](/guides/requests-responses).<br />*Бот пока не может работать с подобными методами и взаимодействует с API на уровне обычного участника пространства.*</Info>\n\n`
  );

  // #files_not_supported tag
  text = text.replace(
    /#files_not_supported/g,
    `\n\n<Info>На данный момент работа с дополнительными полями типа "Файл" недоступна.</Info>\n\n`
  );

  // #unfurling_bot_access_token_required tag
  text = text.replace(
    /#unfurling_bot_access_token_required/g,
    `\n\n<Info>Данный метод доступен для работы только с \`access_token\` unfurl бота. Подробнее о том, как получить такой токен и о том, как получать события об отправке ссылок в сообщении, вы можете прочитать в статье [Unfurling ссылок в Пачке](https://www.pachca.com/articles/unfurling-ssylok-v-pachce)</Info>\n\n`
  );

  // #bot_access_token_required tag
  text = text.replace(
    /#bot_access_token_required/g,
    `\n\n<Info>Данный метод доступен для работы только с \`access_token\` бота</Info>\n\n`
  );

  // #access_token_not_required tag
  text = text.replace(
    /#access_token_not_required/g,
    `\n\n<Info>Данный метод не требует авторизации.</Info>\n\n`
  );

  // Clean up multiple consecutive newlines (more than 2) to avoid huge gaps
  text = text.replace(/\n{3,}/g, '\n\n');

  return text;
}
