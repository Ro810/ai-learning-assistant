// Syntax highlighting nhẹ cho code block (Python/JS) — không cần lib nặng.
// Tokenize chuỗi code bằng 1 regex có thứ tự ưu tiên (comment/string trước để
// không bắt nhầm keyword bên trong), trả về mảng <span> tô màu (sáng + tối).
//
// Phạm vi: đủ cho snippet Python (môn lập trình chính) và JS cơ bản. Không nhằm
// thay full grammar — chỉ tô keyword / string / number / comment / builtin.

import { Fragment, type ReactNode } from 'react';

// Nhóm bắt: 1=comment, 2=string, 3=number, 4=keyword, 5=builtin.
const TOKEN =
  /(#[^\n]*|\/\/[^\n]*)|("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(\b\d+\.?\d*\b)|(\b(?:def|return|if|elif|else|for|while|in|is|not|and|or|import|from|as|class|with|try|except|finally|raise|lambda|yield|pass|break|continue|global|nonlocal|del|assert|async|await|True|False|None|function|const|let|var|new|typeof|null|undefined|this|extends)\b)|(\b(?:print|len|range|input|int|str|float|list|dict|set|tuple|bool|type|abs|sum|min|max|sorted|enumerate|zip|map|filter|open|isinstance|append|format|console|log)\b)/g;

const CLASS: Record<number, string> = {
  1: 'text-zinc-400 italic', // comment
  2: 'text-emerald-600 dark:text-emerald-400', // string
  3: 'text-orange-600 dark:text-orange-400', // number
  4: 'text-violet-600 dark:text-violet-400 font-medium', // keyword
  5: 'text-sky-600 dark:text-sky-400', // builtin
};

export function highlightCode(code: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  // Reset lastIndex (regex có cờ /g, dùng lại an toàn).
  TOKEN.lastIndex = 0;
  while ((match = TOKEN.exec(code)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(<Fragment key={key++}>{code.slice(lastIndex, match.index)}</Fragment>);
    }
    // Xác định nhóm nào khớp (1..5).
    const groupIdx = [1, 2, 3, 4, 5].find((g) => match![g] !== undefined) ?? 0;
    nodes.push(
      <span key={key++} className={CLASS[groupIdx]}>
        {match[0]}
      </span>,
    );
    lastIndex = TOKEN.lastIndex;
  }
  if (lastIndex < code.length) {
    nodes.push(<Fragment key={key++}>{code.slice(lastIndex)}</Fragment>);
  }
  return nodes;
}
