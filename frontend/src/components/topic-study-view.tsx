'use client';

// Topic study layout giống W3Schools (dùng cho Python, English Communication, ...):
// LEFT — vertical sidebar danh sách chủ đề (click để chọn).
// RIGHT — tóm tắt kiến thức của chủ đề + slider 5-20 câu + nút "Bắt đầu làm bài".
// Click "Bắt đầu" gọi assessment create trực tiếp (skip /assessment/new).

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Play, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { assessmentApi } from '@/lib/api-services';
import { getErrorMessage } from '@/lib/api-client';
import { topicIcon } from '@/lib/topic-icon';
import { TopicNoteEditor } from '@/components/topic-note-editor';
import type { Subject } from '@/lib/types';

interface TopicStudyViewProps {
  subject: Subject;
  subjectId: string;
}

export function TopicStudyView({ subject, subjectId }: TopicStudyViewProps) {
  const router = useRouter();
  const topics = subject.topics;
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [questionCount, setQuestionCount] = useState(10);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingId, setExistingId] = useState<string | null>(null);
  // Đếm số giây trôi qua khi đang sinh câu hỏi — cho user biết tiến trình còn chạy.
  const [elapsed, setElapsed] = useState(0);

  // Bật/tắt đồng hồ theo trạng thái starting; reset về 0 khi dừng.
  useEffect(() => {
    if (!starting) {
      setElapsed(0);
      return;
    }
    const timer = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [starting]);

  const selected = topics[selectedIdx];

  const handleStart = async () => {
    if (!selected) return;
    setError(null);
    setExistingId(null);
    setStarting(true);
    try {
      const assessment = await assessmentApi.create({
        subjectId,
        topicIds: [selected._id],
        questionCount,
      });
      router.push(`/assessment/${assessment._id}`);
    } catch (err: unknown) {
      const e = err as {
        response?: { status?: number; data?: { data?: { existingId?: string } } };
      };
      if (e?.response?.status === 409 && e.response.data?.data?.existingId) {
        setExistingId(e.response.data.data.existingId);
      }
      setError(getErrorMessage(err));
    } finally {
      setStarting(false);
    }
  };

  if (topics.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border py-10 text-center">
        <p className="text-sm text-muted-foreground">Môn này chưa có chủ đề nào.</p>
      </div>
    );
  }

  const summaryLines = selected?.summary?.split('\n').map((s) => s.trim()).filter(Boolean) ?? [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[16rem_1fr] gap-4">
      <aside className="rounded-2xl border border-border bg-card p-2 self-start">
        <p className="text-xs font-semibold text-muted-foreground px-2 py-2">
          Chủ đề
        </p>
        <ul className="space-y-0.5">
          {topics.map((topic, idx) => {
            const Icon = topicIcon(topic.name);
            const active = idx === selectedIdx;
            return (
              <li key={topic._id}>
                <button
                  type="button"
                  onClick={() => setSelectedIdx(idx)}
                  className={`w-full text-left flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors ${
                    active
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 truncate">{topic.name}</span>
                  {active && <ChevronRight className="h-4 w-4 shrink-0" />}
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{selected.name}</h2>
          {selected.description && (
            <p className="text-sm text-muted-foreground mt-1">{selected.description}</p>
          )}
        </div>

        {summaryLines.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold mb-3">Tóm tắt kiến thức</h3>
            <ul className="space-y-2 list-disc pl-5 text-sm text-foreground/90">
              {summaryLines.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Ghi chú học tập theo chủ đề */}
        <TopicNoteEditor subjectId={subjectId} topicId={selected._id} />

        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div>
            <label className="text-sm font-medium block mb-2">
              Số câu hỏi: <span className="text-primary">{questionCount}</span>
            </label>
            <input
              type="range"
              min={5}
              max={20}
              step={1}
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              className="w-full"
              disabled={starting}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>5</span>
              <span>20</span>
            </div>
          </div>

          {error && (
            <div className="space-y-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              <p>{error}</p>
              {/* Khi hết quota Gemini, gợi ý dev workaround (bật mock) — text nhỏ. */}
              {/quota|Gemini/i.test(error) && (
                <p className="text-xs text-destructive/70">
                  (Dev: đặt <code>USE_MOCK_AI=1</code> trong backend/.env để dùng mock khi hết quota.)
                </p>
              )}
              {existingId && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => router.push(`/assessment/${existingId}`)}
                >
                  Tiếp tục bài đang dở →
                </Button>
              )}
            </div>
          )}

          <Button
            onClick={handleStart}
            disabled={starting || !selected}
            size="lg"
            className="gap-2 w-full sm:w-auto"
          >
            <Play className="h-4 w-4" />
            {starting ? `Đang sinh câu hỏi... ${elapsed}s` : 'Bắt đầu làm bài'}
          </Button>
        </div>
      </section>
    </div>
  );
}
