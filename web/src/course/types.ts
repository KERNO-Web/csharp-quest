export type Term = { k: 'term'; id: string; word: string; en?: string; def: string; like?: string; icon?: string };
export type Say = { k: 'say'; text: string; code?: string; hl?: number[]; viz?: string; vizProps?: Record<string, unknown> };
export type Quiz = { k: 'quiz'; q: string; options: string[]; answer: number; why: string; code?: string; mono?: boolean };
export type Predict = { k: 'predict'; q?: string; code: string; options: string[]; answer: number; why: string };
export type Blocks = { k: 'blocks'; q: string; lines: string[]; extra?: string[]; why: string };
export type Fill = { k: 'fill'; q: string; code: string; options: string[]; answer: number; why: string };
export type Bug = { k: 'bug'; q: string; code: string; line: number; why: string };
export type Check = {
  output?: string;          // exact output (trimmed, line endings normalized)
  match?: string;           // regex source the whole output must match
  contains?: string[];      // code must contain these
  notContains?: string[];   // code must not contain these
  lines?: number;           // minimum lines of output
};
export type CodeStep = {
  k: 'code'; id: string; task: string; start: string; check: Check;
  hint: string; solution: string; stdin?: string; harness?: string;
  game?: 'heroName' | 'heroStats';
};
export type Step = Term | Say | Quiz | Predict | Blocks | Fill | Bug | CodeStep;

export type Level = { id: string; title: string; boss?: boolean; steps: Step[]; unlocks?: string };
export type Topic = { id: string; n: number; title: string; sub: string; levels: Level[] };
export type World = { id: string; n: number; title: string; sub: string; color: string; topics: Topic[] };
