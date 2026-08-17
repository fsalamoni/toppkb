import * as admin from 'firebase-admin';
import { onUserCreated, onUserDeleted, onUserConsent } from './handlers/auth';
import { api } from './handlers/api';
import { cleanupOldRecords, generateWeeklySummaries, checkAcutePain, aggregateAnalytics } from './handlers/scheduled';

// LLM Config
import {
  getLLMConfig, setLLMConfig, deleteLLMConfig,
  adminGetGlobalLLM, adminSetGlobalLLM, listLLMModels,
  adminListAdmins, adminGrantAdmin, adminRevokeAdmin, adminListUserLLM,
} from './handlers/llm-config';

// Agents Config
import {
  adminGetAgentsConfig, adminSaveAgentsConfig,
  getUserAgentsConfig, setUserAgentsConfig,
} from './handlers/agents-config';

// User
import { getMeHandler, updateMeHandler } from './handlers/profile';
import { saveFeedback } from './handlers/feedback';
import { listConversationsHandler, listMessagesHandler, deleteConversaHandler } from './handlers/history';

// Admin
import { adminListDocuments, adminGetDocument, adminDeleteDocument, adminGetStats } from './handlers/admin-documents';
import { adminGetPlatformStats } from './handlers/admin-stats';
import { bootstrapAdmin } from './handlers/bootstrap-admin';
import { deleteAccount } from './handlers/delete-account';

import { sentryInit } from './services/sentry';

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
export const aggregateMetrics = aggregateAnalytics;

// LLM Config
export {
  getLLMConfig, setLLMConfig, deleteLLMConfig,
  adminGetGlobalLLM, adminSetGlobalLLM, listLLMModels,
  adminListAdmins, adminGrantAdmin, adminRevokeAdmin, adminListUserLLM,
};

// Agents Config
export {
  adminGetAgentsConfig, adminSaveAgentsConfig,
  getUserAgentsConfig, setUserAgentsConfig,
};

// User
export const getMe = getMeHandler;
export const updateMe = updateMeHandler;
export { saveFeedback };
export const listConversas = listConversationsHandler;
export const listMensagens = listMessagesHandler;
export const deleteConversa = deleteConversaHandler;

// Admin
export {
  adminListDocuments, adminGetDocument, adminDeleteDocument, adminGetStats,
  adminGetPlatformStats, bootstrapAdmin, deleteAccount,
};
