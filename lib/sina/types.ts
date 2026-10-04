export type SinaChoice = { label: string; value: string };
export type SinaMessage = { id: number; role: 'sina' | 'visitor'; text: string };
export type SinaState = {
  version: 1;
  origin: string;
  service?: string;
  answers: Record<string, string>;
  notes: string[];
  messages: SinaMessage[];
  choices: SinaChoice[];
  question?: string;
  clarifying?: string;
  handoff: boolean;
  misses: number;
};
export type SinaInput = { text: string; choice?: string };
export type SinaEngine = {
  start: (pathname: string) => SinaState;
  reply: (state: SinaState, input: SinaInput) => SinaState;
};
export type SinaQuestion = {
  id: string;
  text: string;
  options?: string[];
  recognize?: { pattern: RegExp; answer: string }[];
};
export type SinaFlow = { opening: string; questions: SinaQuestion[] };
