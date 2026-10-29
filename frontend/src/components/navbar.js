/**
 * Topbar / Navbar Component
 */
import { authState } from '../auth/authContext.js';

export function renderTopbar(title = 'Dashboard', unreadNotifs = 0) {
  const user = authState.user;
  const displayName = user?.displayName || 'User';

  return `
    <header class="topbar">
      <div style="display: flex; align-items: center; gap: 14px;">
        <button type="button" class="btn btn-outline btn-sm" id="mobile-toggle-btn" style="display: none;" aria-label="Toggle navigation">
          ☰
        </button>
        <h2 style="font-size: 20px; font-weight: 700; color: var(--navy-900);">${title}</h2>
      </div>

      <div style="display: flex; align-items: center; gap: 16px;">
        <a href="#/notifications" class="btn btn-outline btn-sm" style="position: relative; padding: 6px 12px;" title="Notifications">
          🔔
          ${unreadNotifs > 0 ? `<span class="badge badge-emerald" style="position: absolute; top: -6px; right: -6px; padding: 2px 5px; font-size: 10px;">${unreadNotifs}</span>` : ''}
        </a>

        <div style="display: flex; align-items: center; gap: 10px;">
          <a href="#/settings" style="display: flex; align-items: center; gap: 8px; color: var(--navy-900); font-weight: 600; font-size: 14px;">
            <span>${escapeHtml(displayName)}</span>
          </a>
        </div>
      </div>
    </header>
  `;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

