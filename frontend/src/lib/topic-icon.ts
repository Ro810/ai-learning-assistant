// Mapping topic name → Lucide icon.
// Bao gồm: IELTS skills, English THPT 6 parts, Python topics (W3Schools style).

import {
  BookOpen,
  Headphones,
  Mic,
  PenLine,
  Code2,
  Hash,
  Type,
  Calculator,
  GitBranch,
  Repeat,
  Boxes,
  ListOrdered,
  Lock,
  CircleDot,
  KeyRound,
  Box,
  Layers,
  AlertTriangle,
  Package,
  type LucideIcon,
} from 'lucide-react';

export function topicIcon(name: string): LucideIcon {
  const n = name.toLowerCase();

  // English skills
  if (n.includes('listening') || n.includes('nghe')) return Headphones;
  if (n.includes('speaking') || n.includes('nói')) return Mic;
  if (n.includes('writing') || n.includes('viết')) return PenLine;

  // Python — match cụ thể trước, generic sau
  if (n.includes('syntax') || n.includes('variable') || n.includes('cú pháp') || n.includes('biến'))
    return Code2;
  if (n.includes('data type') || n.includes('kiểu dữ liệu')) return Type;
  if (n.includes('operator') || n.includes('toán tử')) return Calculator;
  if (n.includes('string') || n.includes('chuỗi')) return Hash;
  if (n.includes('if') || n.includes('else')) return GitBranch;
  if (n.includes('loop') || n.includes('vòng lặp')) return Repeat;
  if (n.includes('function') || n.includes('hàm')) return Boxes;
  if (n.includes('list')) return ListOrdered;
  if (n.includes('tuple')) return Lock;
  if (n.includes('set')) return CircleDot;
  if (n.includes('dict')) return KeyRound;
  if (n.includes('class') || n.includes('object') || n.includes('lớp') || n.includes('đối tượng'))
    return Box;
  if (n.includes('inheritance') || n.includes('kế thừa') || n.includes('đa hình')) return Layers;
  if (n.includes('try') || n.includes('except') || n.includes('exception')) return AlertTriangle;
  if (n.includes('module') || n.includes('thư viện')) return Package;

  return BookOpen;
}
