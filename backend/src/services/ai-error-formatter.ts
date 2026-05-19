// Chuẩn hoá error trả từ AI provider (Gemini) thành { status, message, retryAfterSec }
// để các controllers trả response thân thiện cho FE (429 quota, 503 overloaded, ...).
// Gemini SDK ném ApiError với message là JSON string — cần parse thủ công.

export interface FormattedAIError {
  status: number;
  message: string;
  // Số giây nên đợi trước khi retry (chỉ có khi quota/rate-limit).
  retryAfterSec?: number;
  // Chi tiết kỹ thuật để dev xem trong console (không show trực tiếp cho user).
  detail?: string;
}

const tryParseJson = (s: string): any | null => {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
};

// Trích retryDelay từ payload Gemini dạng "58s" hoặc "58.7s" → 59 (round up).
const parseRetryDelay = (raw: unknown): number | undefined => {
  if (typeof raw !== 'string') return undefined;
  const m = raw.match(/^([\d.]+)s?$/);
  if (!m) return undefined;
  const n = Number(m[1]);
  return Number.isFinite(n) ? Math.ceil(n) : undefined;
};

export const formatAIError = (err: any): FormattedAIError => {
  const rawMsg: string = err?.message ?? String(err ?? 'unknown');
  // Gemini SDK: message thường chứa cả JSON `{"error": {...}}`.
  // Tìm khối JSON đầu tiên trong message và parse.
  const jsonMatch = rawMsg.match(/\{[\s\S]*\}/);
  const parsed = jsonMatch ? tryParseJson(jsonMatch[0]) : null;
  const inner = parsed?.error;

  const code: number | undefined = inner?.code ?? err?.status;
  const statusStr: string | undefined = inner?.status;

  // 429 / RESOURCE_EXHAUSTED — Gemini free tier hết quota ngày.
  if (code === 429 || statusStr === 'RESOURCE_EXHAUSTED') {
    const violation = inner?.details?.find?.(
      (d: any) => d?.['@type']?.includes('QuotaFailure'),
    )?.violations?.[0];
    const retryInfo = inner?.details?.find?.(
      (d: any) => d?.['@type']?.includes('RetryInfo'),
    );
    const retryAfterSec = parseRetryDelay(retryInfo?.retryDelay);
    const quotaValue = violation?.quotaValue;
    const model = violation?.quotaDimensions?.model;
    return {
      status: 429,
      message:
        `Đã hết quota Gemini miễn phí` +
        (quotaValue ? ` (${quotaValue} req/ngày cho ${model ?? 'model'})` : '') +
        `. Vui lòng thử lại sau` +
        (retryAfterSec ? ` ~${retryAfterSec}s.` : ' (reset sau 24h).'),
      retryAfterSec,
      detail: inner?.message,
    };
  }

  // 503 / UNAVAILABLE — Gemini overloaded.
  if (code === 503 || statusStr === 'UNAVAILABLE') {
    return {
      status: 503,
      message: 'Gemini đang quá tải. Vui lòng thử lại sau vài giây.',
      detail: inner?.message,
    };
  }

  // 400 / INVALID_ARGUMENT — prompt sai format / quá dài.
  if (code === 400 || statusStr === 'INVALID_ARGUMENT') {
    return {
      status: 400,
      message: 'Yêu cầu AI không hợp lệ.',
      detail: inner?.message ?? rawMsg,
    };
  }

  // 401/403 — API key sai hoặc chưa cấp quyền.
  if (code === 401 || code === 403) {
    return {
      status: 502,
      message: 'AI service chưa được cấu hình đúng (API key/permission).',
      detail: inner?.message ?? rawMsg,
    };
  }

  // Không khớp pattern nào → trả 502 với message gốc.
  return {
    status: 502,
    message: 'AI question generation failed',
    detail: rawMsg,
  };
};
