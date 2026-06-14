'use client';

// Nút "Giải thích thêm" mở hộp chat hỏi AI về 1 câu hỏi cụ thể.
// Khi mở lần đầu tự xin AI giải thích kỹ hơn; sau đó học sinh hỏi tiếp nhiều lượt.
// Câu trả lời render qua QuestionContent để hiện code/markdown đẹp.

import { useRef, useState } from 'react';
import { Sparkles, X, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { QuestionContent } from '@/components/question-content';
import { aiApi, type ChatMessage } from '@/lib/api-services';
import { getErrorMessage } from '@/lib/api-client';

interface QuestionCtx {
  questionText: string;
  options?: Array<{ id: string; text: string }>;
  correctAnswer?: string;
  explanation?: string;
}

export function AskAiButton({ question }: { question: QuestionCtx }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    // Cho DOM cập nhật trước khi cuộn.
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    });
  };

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const next = [...messages, { role: 'user' as const, content: trimmed }];
    setMessages(next);
    setInput('');
    setLoading(true);
    scrollToBottom();
    try {
      const reply = await aiApi.explainQuestion({ question, messages: next });
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      toast.error(getErrorMessage(err));
      // Bỏ tin user vừa thêm nếu lỗi để có thể thử lại.
      setMessages((prev) => prev.slice(0, -1));
      setInput(trimmed);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  const openChat = () => {
    setOpen(true);
    if (messages.length === 0) void send('Giải thích kỹ hơn câu này giúp mình.');
  };

  return (
    <>
      <button
        type="button"
        onClick={openChat}
        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
      >
        <Sparkles className="h-3.5 w-3.5" />
        Giải thích thêm
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="flex h-[80vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-border bg-card shadow-xl sm:h-[70vh] sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="h-4 w-4 text-primary" />
                Hỏi AI về câu này
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Đóng"
                className="rounded-md p-1 text-muted-foreground hover:bg-accent"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
              {/* Trích câu hỏi để tiện theo dõi */}
              <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                <span className="font-medium">Câu hỏi: </span>
                <QuestionContent text={question.questionText} className="inline" />
              </div>

              {messages.map((m, i) =>
                m.role === 'user' ? (
                  <div key={i} className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm text-primary-foreground">
                      {m.content}
                    </div>
                  </div>
                ) : (
                  <div key={i} className="flex justify-start">
                    <div className="max-w-[90%] rounded-2xl rounded-bl-sm bg-muted px-3 py-2 text-sm">
                      <QuestionContent text={m.content} />
                    </div>
                  </div>
                ),
              )}
              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-sm bg-muted px-3 py-2 text-sm text-muted-foreground">
                    Đang soạn câu trả lời…
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void send(input);
              }}
              className="flex items-center gap-2 border-t border-border p-3"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Hỏi thêm về câu này…"
                disabled={loading}
                className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
              />
              <Button type="submit" size="icon" disabled={loading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
