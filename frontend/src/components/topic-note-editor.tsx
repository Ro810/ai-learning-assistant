'use client';

// Ô ghi chú học tập theo chủ đề. Tự nạp ghi chú hiện có khi đổi chủ đề,
// lưu qua nút (content rỗng = xóa ghi chú ở backend).

import { useEffect, useState } from 'react';
import { NotebookPen } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { noteApi } from '@/lib/api-services';
import { getErrorMessage } from '@/lib/api-client';

export function TopicNoteEditor({
  subjectId,
  topicId,
}: {
  subjectId: string;
  topicId: string;
}) {
  const [content, setContent] = useState('');
  const [saved, setSaved] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    noteApi
      .get(topicId)
      .then((note) => {
        if (!active) return;
        const c = note?.content ?? '';
        setContent(c);
        setSaved(c);
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [topicId]);

  const dirty = content !== saved;

  const save = async () => {
    if (saving || !dirty) return;
    setSaving(true);
    try {
      await noteApi.save({ subjectId, topicId, content });
      setSaved(content);
      toast.success(content.trim() ? 'Đã lưu ghi chú.' : 'Đã xóa ghi chú.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-2 flex items-center gap-2">
        <NotebookPen className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Ghi chú của bạn</h3>
        {dirty && <span className="text-xs text-amber-600">• chưa lưu</span>}
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onBlur={save}
        disabled={loading || saving}
        rows={4}
        placeholder="Ghi chú kiến thức, mẹo nhớ, chỗ hay nhầm… (tự lưu khi rời ô)"
        className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
      />
      <div className="mt-2 flex justify-end">
        <Button size="sm" onClick={save} disabled={!dirty || saving || loading}>
          {saving ? 'Đang lưu…' : 'Lưu ghi chú'}
        </Button>
      </div>
    </div>
  );
}
