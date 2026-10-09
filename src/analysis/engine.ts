import type {Analysis, Deadline, Decision, Finding, Message, Priority, Question, Task} from '../types';

const priority = (score: number): Priority =>
  score >= 88 ? 'Critical' : score >= 68 ? 'High' : score >= 42 ? 'Medium' : score >= 20 ? 'Low' : 'Informational';

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const normalized = (value: string) => value.toLowerCase().replace(/\s+/g, ' ').trim();
const isSystem = (message: Message) => message.kind === 'system' || message.deleted || message.media;

const deadlinePattern = /\b(today|tomorrow|tonight|this\s+(?:morning|afternoon|evening|week)|by\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|tonight|\d{1,2}(?:st|nd|rd|th)?(?:\s+of)?\s+[a-z]+)|next\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|week)|(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(?:,\s*\d{4})?|\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4})\b/i;

function toIsoDate(original: string): string | undefined {
  const trimmed = original.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const slash = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) return `${slash[3]}-${slash[2].padStart(2, '0')}-${slash[1].padStart(2, '0')}`;
  const month = trimmed.match(/^(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:,\s*(\d{4}))?$/i);
  if (month) {
    const monthIndex = new Date(`${month[1]} 1, 2000`).getMonth() + 1;
    const year = month[3] || new Date().getFullYear().toString();
    return `${year}-${String(monthIndex).padStart(2, '0')}-${month[2].padStart(2, '0')}`;
  }
  return undefined;
}

export function extractDeadline(text: string): Deadline | undefined {
  const match = text.match(deadlinePattern);
  if (!match) return undefined;
  const original = match[0].replace(/[.,;:!?]+$/, '');
  const ambiguous = /^(today|tomorrow|tonight|this\s|by\s|next\s)/i.test(original);
  const iso = toIsoDate(original);
  return {
    original,
    iso,
    ambiguous,
    label: ambiguous ? `${original} · resolve against conversation date` : original,
  };
}

function directMention(text: string, userName: string): boolean {
  const name = userName.trim();
  if (!name) return false;
  const escaped = escapeRegExp(name);
  return new RegExp(`(^|[^a-z0-9])@?${escaped}([^a-z0-9]|$)`, 'i').test(text);
}

function taskAssignee(text: string, userName: string): string | undefined {
  const mentioned = text.match(/@([A-Za-z][\w.-]*)\b/i);
  if (mentioned?.[1]) return mentioned[1].trim();
  const addressed = text.match(/^([A-Z][\w .-]{1,40}),\s+(?:please|could you|can you)\b/);
  if (addressed?.[1]) return addressed[1].trim();
  return directMention(text, userName) ? userName : undefined;
}

function isTask(text: string): boolean {
  if (text.includes('?') && !/^(?:please|can you|could you)\b/i.test(text.trim())) return false;
  return /\b(?:please|could you|can you|need to|todo|action item|follow up|review|submit|fix|prepare|confirm|send|share|schedule|write|update|test|check|record|complete|finish|deliver)\b/i.test(text);
}

function isCompleted(text: string): boolean {
  return /\b(?:done|complete(?:d)?|finished|fixed|shipped|submitted|sent|passed|resolved)\b/i.test(text);
}

function decisionType(text: string): Decision['type'] | undefined {
  if (/\b(?:decision|confirmed|approved|final)\b|\bwe will\b|\blet's\b/i.test(text)) return 'confirmed';
  if (/\b(?:proposal|proposed|maybe|consider|might|could)\b/i.test(text)) return 'tentative';
  if (/\b(?:recommend|suggest|should)\b/i.test(text)) return 'recommendation';
  return undefined;
}

function hasAnswer(messages: Message[], index: number, question: Message): boolean {
  return messages.slice(index + 1).some(message => {
    if (isSystem(message) || message.sender === question.sender) return false;
    return /\b(?:yes|no|confirmed|approved|done|will do|sounds good|agreed|not yet)\b/i.test(message.text) || message.text.trim().length > 28;
  });
}

function signalFor(message: Message, userName: string, deadline?: Deadline, task?: boolean, decision?: Decision['type']): {score: number; reasons: string[]} {
  const reasons: string[] = [];
  let score = 0;
  if (directMention(message.text, userName)) { score += 30; reasons.push('mentions your configured name'); }
  if (deadline) { score += 25; reasons.push(deadline.ambiguous ? 'contains an unresolved deadline expression' : 'contains a dated deadline'); }
  if (task) { score += 20; reasons.push('contains an explicit action'); }
  if (/\b(?:urgent|asap|blocking|blocked|failing|overdue|escalat)\w*\b/i.test(message.text)) { score += 24; reasons.push('signals urgency or a blocker'); }
  if (decision === 'confirmed') { score += 18; reasons.push('records a confirmed decision'); }
  if (message.text.includes('?')) { score += 10; reasons.push('requests a response'); }
  return {score: Math.min(100, score), reasons};
}

export function analyze(messages: Message[], userName = 'Alex'): Analysis {
  const tasks: Task[] = [];
  const deadlines: Deadline[] = [];
  const decisions: Decision[] = [];
  const questions: Question[] = [];
  const findings: Finding[] = [];
  const mentions: string[] = [];
  const seenDeadlines = new Set<string>();

  messages.forEach((message, index) => {
    if (isSystem(message)) return;
    const text = message.text.trim();
    const deadline = extractDeadline(text);
    if (deadline && !seenDeadlines.has(normalized(deadline.original))) {
      deadlines.push(deadline);
      seenDeadlines.add(normalized(deadline.original));
    }

    const mentioned = directMention(text, userName);
    if (mentioned) mentions.push(message.id);

    const task = isTask(text);
    const type = decisionType(text);
    if (task) {
      const assignee = taskAssignee(text, userName);
      const signal = signalFor(message, userName, deadline, true, type);
      tasks.push({
        id: `task-${tasks.length + 1}`,
        description: text.replace(/^(please|could you|can you)\s*/i, ''),
        sourceId: message.id,
        sender: message.sender,
        assignee,
        deadline,
        priority: priority(signal.score),
        confidence: assignee || mentioned ? 0.92 : 0.78,
        status: isCompleted(text) ? 'completed' : 'open',
        reason: signal.reasons.filter(reason => reason.includes('action') || reason.includes('deadline') || reason.includes('name')).join(' · ') || 'explicit action language',
      });
    }

    if (type) decisions.push({
      id: `d-${decisions.length + 1}`,
      statement: text,
      type,
      sourceId: message.id,
      sender: message.sender,
      confidence: type === 'confirmed' ? 0.9 : 0.76,
    });

    if (text.includes('?')) questions.push({
      id: `q-${questions.length + 1}`,
      text,
      sourceId: message.id,
      sender: message.sender,
      potentiallyUnanswered: !hasAnswer(messages, index, message),
      resolved: false,
    });

    const signal = signalFor(message, userName, deadline, task, type);
    if (signal.score > 0) {
      const level = priority(signal.score);
      findings.push({
        id: `f-${findings.length + 1}`,
        kind: mentioned ? 'mention' : deadline ? 'followup' : /blocked|failing|urgent|overdue/i.test(text) ? 'risk' : 'priority',
        title: level === 'Critical' ? 'Needs attention now' : level === 'High' ? 'Important follow-up' : 'Signal detected',
        detail: signal.reasons.join(' · '),
        sourceIds: [message.id],
        priority: level,
        score: signal.score,
      });
    }
  });

  const openTasks = tasks.filter(task => task.status === 'open').length;
  const confirmed = decisions.filter(decision => decision.type === 'confirmed').length;
  const unanswered = questions.filter(question => question.potentiallyUnanswered).length;
  const topic = messages.filter(message => !isSystem(message)).slice(0, 3).map(message => message.text.split(/[.!?]/)[0]).join(' · ').slice(0, 120) || 'Untitled conversation';
  const summary = `${messages.length} messages reviewed locally. ${tasks.length} action items surfaced (${openTasks} open), ${confirmed} confirmed decisions, and ${unanswered} questions may still need an answer.`;

  return {
    summary,
    topic,
    findings: findings.sort((a, b) => b.score - a.score),
    tasks,
    decisions,
    questions,
    deadlines,
    mentions,
    analyzedAt: new Date().toISOString(),
    engineVersion: 'rule-based-2.0',
  };
}
