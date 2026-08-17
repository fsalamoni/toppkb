import * as admin from 'firebase-admin';
import { onUserCreated, onUserDeleted, onUserConsent } from './handlers/auth';
import { api } from './handlers/api';
import { cleanupOldRecords, generateWeeklySummaries, checkAcutePain } from './handlers/scheduled';

// LLM Config (user + admin)
import {
  getLLMConfig,
  setLLMConfig,
  deleteLLMConfig,
  adminGetGlobalLLM,
  adminSetGlobalLLM,
  listLLMModels,
  adminListAdmins,
  adminGrantAdmin,
  adminRevokeAdmin,
  adminListUserLLM,
} from './handlers/llm-config';

// Agents Config (admin + user)
import {
  adminGetAgentsConfig,
  adminSaveAgentsConfig,
  getUserAgentsConfig,
  setUserAgentsConfig,
} from './handlers/agents-config';

import { sentryInit } from './services/sentry';

// Init
admin.initializeApp();
sentryInit();

// Auth lifecycle
export { onUserCreated, onUserDeleted, onUserConsent };

// API REST
export { api };

// Scheduled
export const cleanup = cleanupOldRecords;
export const weeklySummary = generateWeeklySummaries;
export const painCheck = checkAcutePain;

// LLM Config
export {
  getLLMConfig,
  setLLMConfig,
  deleteLLMConfig,
  adminGetGlobalLLM,
  adminSetGlobalLLM,
  listLLMModels,
  adminListAdmins,
  adminGrantAdmin,
  adminRevokeAdmin,
  adminListUserLLM,
};

// Agents Config
export {
  adminGetAgentsConfig,
  adminSaveAgentsConfig,
  getUserAgentsConfig,
  setUserAgentsConfig,
};
