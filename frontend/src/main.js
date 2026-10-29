/**
 * MyAlumni 2.0 — Application Entry Point
 * Vanilla JavaScript & Vite
 */
import { initRouter } from './router.js';
import { authState } from './auth/authContext.js';

console.log("==========================================");
console.log("  MyAlumni 2.0 Web Portal Initialized");
console.log(`  Environment: ${import.meta.env.MODE}`);
console.log(`  API Base URL: ${import.meta.env.VITE_API_BASE_URL}`);
console.log("==========================================");

// Bootstrap Application
async function bootstrap() {
  // Attempt session restoration from saved token
  await authState.restoreSession().catch(() => null);

  // Initialize SPA Hash Router
  initRouter();
}

bootstrap();

