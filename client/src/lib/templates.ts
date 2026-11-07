import type { MsgKey } from '../i18n';
import type { StoryPoints, TodoPriority, TodoType } from '../types/api';

export interface TodoTemplate {
  id: string;
  name: string;
  title: string;
  description: string;
  type: TodoType;
  priority: TodoPriority;
  storyPoints: StoryPoints | null;
  labels: string[];
}

interface BuiltIn {
  id: string;
  name: MsgKey;
  title: MsgKey;
  description: MsgKey;
  type: TodoType;
  priority: TodoPriority;
  storyPoints: StoryPoints | null;
  labels: string[];
}

export const BUILT_IN: BuiltIn[] = [
  { id: 'bug', name: 'tpl.bug', title: 'tpl.bug.title', description: 'tpl.bug.desc', type: 'bug', priority: 'high', storyPoints: 2, labels: ['bug'] },
  { id: 'story', name: 'tpl.story', title: 'tpl.story.title', description: 'tpl.story.desc', type: 'story', priority: 'medium', storyPoints: 3, labels: [] },
  { id: 'spike', name: 'tpl.spike', title: 'tpl.spike.title', description: 'tpl.spike.desc', type: 'task', priority: 'medium', storyPoints: 2, labels: ['research'] },
  { id: 'chore', name: 'tpl.chore', title: 'tpl.chore.title', description: 'tpl.chore.desc', type: 'task', priority: 'low', storyPoints: 1, labels: ['chore'] },
];
