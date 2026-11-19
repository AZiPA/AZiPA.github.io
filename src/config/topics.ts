import type {
  StarlightSidebarTopicsUserConfig,
  StarlightSidebarTopicsUserOptions,
} from 'starlight-sidebar-topics';
import { chatAutomationTopic } from './topics/chat-automation.ts';

export const SIDEBAR_TOPICS: StarlightSidebarTopicsUserConfig = [chatAutomationTopic];

export const TOPICS_EXCLUDE: NonNullable<
  NonNullable<StarlightSidebarTopicsUserOptions>['exclude']
> = [
  '/',
  '/fa',
  '/fa/',
  '/about',
  '/about/',
  '/fa/about',
  '/fa/about/',
  '/404',
  '/404/',
  '/fa/404',
  '/fa/404/',
];
