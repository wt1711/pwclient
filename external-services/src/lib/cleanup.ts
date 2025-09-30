import { SessionManager } from './db';

const sessionManager = new SessionManager();

/**
 * Cleanup expired Instagram sessions
 * This function should be called periodically (e.g., via cron job)
 */
export async function cleanupExpiredSessions(): Promise<void> {
  try {
    console.log('🧹 Starting cleanup of expired Instagram sessions...');
    await sessionManager.cleanupExpiredInstagramSessions();
    console.log('✅ Cleanup completed successfully');
  } catch (error) {
    console.error('❌ Error during session cleanup:', error);
    throw error;
  }
}

/**
 * Setup periodic cleanup (runs every hour)
 */
export function setupPeriodicCleanup(): void {
  // Run cleanup every hour (3600000 ms)
  setInterval(async () => {
    try {
      await cleanupExpiredSessions();
    } catch (error) {
      console.error('❌ Periodic cleanup failed:', error);
    }
  }, 3600000);

  console.log('⏰ Periodic cleanup scheduled to run every hour');
}

// Auto-start cleanup when module is imported
if (process.env.NODE_ENV === 'production') {
  setupPeriodicCleanup();
}