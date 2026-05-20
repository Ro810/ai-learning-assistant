// Pool nhiều Gemini API key + xoay vòng khi 1 key hết quota (429).
//
// Mục tiêu: free-tier Gemini giới hạn requests/ngày (RPD) mỗi key. Khi key đang
// dùng chạm RPD, ta tự chuyển sang key kế tiếp thay vì fail. Key bị 429 được
// đánh dấu "cooldown" để không probe lại liên tục (RPD reset theo ngày — cooldown
// mặc định đủ dài để tránh spam mà vẫn tự thử lại sau khi có thể đã reset).
//
// Cấu hình qua .env:
//   GEMINI_API_KEYS=key1,key2,key3   (ưu tiên; CSV)
//   GEMINI_API_KEY=key1              (fallback nếu không có GEMINI_API_KEYS)
//   GEMINI_KEY_COOLDOWN_MIN=60       (số phút cooldown sau khi key dính 429)

const DEFAULT_COOLDOWN_MIN = 60;

interface KeyState {
  key: string;
  // Epoch ms; key sẵn sàng khi Date.now() >= cooldownUntil. 0 = chưa từng cạn.
  cooldownUntil: number;
}

class GeminiKeyPool {
  private keys: KeyState[] = [];
  // Key được dùng thành công gần nhất — ưu tiên thử đầu tiên ở request sau.
  private preferred: string | null = null;
  private loaded = false;

  // Lazy-load từ env (gọi runtime, không lúc import — để test/đổi env linh hoạt).
  private load(): void {
    if (this.loaded) return;
    const csv = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '';
    const seen = new Set<string>();
    this.keys = csv
      .split(',')
      .map((k) => k.trim())
      .filter((k) => k.length > 0 && !seen.has(k) && (seen.add(k), true))
      .map((key) => ({ key, cooldownUntil: 0 }));
    this.loaded = true;
  }

  private cooldownMs(): number {
    const min = Number(process.env.GEMINI_KEY_COOLDOWN_MIN || DEFAULT_COOLDOWN_MIN);
    return (Number.isFinite(min) && min > 0 ? min : DEFAULT_COOLDOWN_MIN) * 60_000;
  }

  hasKeys(): boolean {
    this.load();
    return this.keys.length > 0;
  }

  size(): number {
    this.load();
    return this.keys.length;
  }

  // Thứ tự thử key: key sẵn sàng trước (preferred lên đầu), rồi mới tới các key
  // đang cooldown (xếp theo cooldown sắp hết nhất) làm phương án cuối.
  candidates(): string[] {
    this.load();
    const now = Date.now();
    const ready = this.keys.filter((k) => k.cooldownUntil <= now);
    const cooling = this.keys
      .filter((k) => k.cooldownUntil > now)
      .sort((a, b) => a.cooldownUntil - b.cooldownUntil);

    // Đưa preferred lên đầu nhóm ready nếu nó đang sẵn sàng.
    ready.sort((a, b) => {
      if (a.key === this.preferred) return -1;
      if (b.key === this.preferred) return 1;
      return 0;
    });

    return [...ready, ...cooling].map((k) => k.key);
  }

  // Đánh dấu key vừa dùng thành công → ưu tiên cho request kế.
  markGood(key: string): void {
    this.preferred = key;
    const state = this.keys.find((k) => k.key === key);
    if (state) state.cooldownUntil = 0;
  }

  // Đánh dấu key dính 429 → cho nghỉ cooldown, hạ ưu tiên.
  markExhausted(key: string): void {
    const state = this.keys.find((k) => k.key === key);
    if (state) state.cooldownUntil = Date.now() + this.cooldownMs();
    if (this.preferred === key) this.preferred = null;
  }
}

export const geminiKeyPool = new GeminiKeyPool();
