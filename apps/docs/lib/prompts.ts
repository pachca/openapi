// Фразы человека в компоненте <Prompt ask="..."> и в его Markdown-версии.
// Одна строка `ask` может содержать несколько просьб в «ёлочках»: каждая
// просьба верхнего уровня становится отдельным пузырём, а кавычки внутри
// («Релизы» в названии чата) остаются текстом.

/** Делит `ask` на просьбы верхнего уровня в «…». Без кавычек — одна просьба целиком. */
export function splitAsks(ask: string): string[] {
  const phrases: string[] = [];
  let depth = 0;
  let start = -1;
  for (let i = 0; i < ask.length; i++) {
    const ch = ask[i];
    if (ch === '«') {
      if (depth === 0) start = i + 1;
      depth++;
    } else if (ch === '»' && depth > 0) {
      depth--;
      if (depth === 0 && start >= 0) {
        phrases.push(ask.slice(start, i).trim());
        start = -1;
      }
    }
  }
  return phrases.length > 0 ? phrases : [ask.trim()];
}
