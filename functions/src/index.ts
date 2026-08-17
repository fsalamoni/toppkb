import * as admin from 'firebase-admin';
import { onUserCreated, onUserDeleted, onUserConsent } from './handlers/auth';
import { api } from './handlers/api';
import { cleanupOldRecords, generateWeeklySummaries, checkAcutePain } from './handlers/scheduled';
import { sentryInit } from './services/sentry';

// Init
admin.initializeApp();
sentryInit();

// Auth lifecycle
export { onUserCreated, onUserDeleted, onUserConsent };

// API
export { api };

// Scheduled
export const cleanup = cleanupOldRecords;
export const weeklySummary = generateWeeklySummaries;
export const painCheck = checkAcutePain;
