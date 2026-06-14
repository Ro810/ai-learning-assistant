// Render nội dung câu hỏi/đáp án có thể kèm code mà không cần lib markdown nặng.
// Hỗ trợ:
//   - Code block bao bởi ```lang ... ```  → khối <pre> monospace, scroll ngang.
//   - Inline `code`                       → <code> nền nhạt.
//   - Xuống dòng giữ nguyên (whitespace-pre-wrap).
// Mục tiêu: câu hỏi tham chiếu "đoạn mã sau" hiển thị code rõ ràng, dễ nhìn.

import { Fragment, type ReactNode } from 'react';
import { highlightCode } from '@/lib/code-highlight';

type Segment = { type: 'code'; content: string } | { type: 'text'; content: string };

// Tách chuỗi thành các đoạn text và code block theo cú pháp ```...```.
function splitFencedCode(input: string): Segment[] {
  const segments: Segment[] = [];
  // ```lang\n<code>\n``` — lang tùy chọn, nội dung lấy non-greedy.
  const fence = /```[ \t]*\w*[ \t]*\r?\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = fence.exec(input)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: input.slice(lastIndex, match.index) });
    }
    // Bỏ newline thừa đầu/cuối trong code để khối gọn.
    segments.push({ type: 'code', content: match[1].replace(/^\n+|\n+$/g, '') });
    lastIndex = fence.lastIndex;
  }
  if (lastIndex < input.length) {
    segments.push({ type: 'text', content: input.slice(lastIndex) });
  }
  return segments;
}

// Trong đoạn text thường: bọc `...` thành <code> inline, giữ phần còn lại nguyên văn.
function renderInline(text: string): ReactNode[] {
  return text.split(/(`[^`]+`)/g).map((part, i) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length > 1) {
      return (
        <code
          key={i}
          className="rounded bg-muted px-1 py-0.5 font-mono text-[0.9em]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

export function QuestionContent({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const segments = splitFencedCode(text ?? '');
  return (
    <div className={className}>
      {segments.map((seg, i) =>
        seg.type === 'code' ? (
          <pre
            key={i}
            className="my-2 overflow-x-auto rounded-md border bg-muted/60 p-3 font-mono text-sm leading-relaxed"
          >
            <code>{highlightCode(seg.content)}</code>
          </pre>
        ) : (
          <span key={i} className="whitespace-pre-wrap">
            {renderInline(seg.content)}
          </span>
        ),
      )}
    </div>
  );
}
