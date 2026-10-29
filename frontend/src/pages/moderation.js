/**
 * Faculty Moderation Queue Page
 */
import { api } from '../services/api.js';
import { showToast } from '../components/toast.js';

export async function renderModerationPage() {
  return `
    <div>
      <div style="margin-bottom: 24px;">
        <h1 style="font-size: 24px; font-weight: 800; color: var(--navy-900);">Faculty Moderation Desk</h1>
        <p style="color: var(--slate-500); font-size: 14px;">Review submitted alumni opportunities, success stories, and proposed campus events.</p>
      </div>

      <div style="display: flex; flex-direction: column; gap: 28px;">
        <!-- Opportunities Review -->
        <div class="card">
          <h2 class="card-title" style="margin-bottom: 16px;">Pending Opportunity Submissions</h2>
          <div id="mod-opps-container">
            <div style="color: var(--slate-400);">Loading pending opportunities...</div>
          </div>
        </div>

        <!-- Achievements Review -->
        <div class="card">
          <h2 class="card-title" style="margin-bottom: 16px;">Pending Alumni Achievements</h2>
          <div id="mod-achieve-container">
            <div style="color: var(--slate-400);">Loading pending achievements...</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

export async function initModerationPage() {
  const oppsContainer = document.getElementById('mod-opps-container');
  const achieveContainer = document.getElementById('mod-achieve-container');

  const loadAll = async () => {
    try {
      const [oRes, aRes] = await Promise.all([
        api.getPendingOpportunities().catch(() => ({ data: [] })),
        api.getPendingAchievements().catch(() => ({ data: [] }))
      ]);

      const opps = oRes.data || [];
      const achieve = aRes.data || [];

      // Render Opps
      if (opps.length === 0) {
        oppsContainer.innerHTML = `<p style="font-size: 13px; color: var(--slate-400);">No pending opportunities in review queue.</p>`;
      } else {
        oppsContainer.innerHTML = `
          <div style="display: flex; flex-direction: column; gap: 14px;">
            ${opps.map(o => `
              <div style="border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px; background: #ffffff;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                  <strong style="color: var(--navy-900); font-size: 15px;">${escapeHtml(o.title)}</strong>
                  <span class="badge badge-warning">PENDING REVIEW</span>
                </div>
                <div style="font-size: 13px; color: var(--teal-700); font-weight: 600; margin-bottom: 8px;">
                  ${escapeHtml(o.company)} • ${escapeHtml(o.location)} • Posted by ${escapeHtml(o.postedByName || 'Alumnus')}
                </div>
                <p style="font-size: 13px; color: var(--slate-600); line-height: 1.5; margin-bottom: 12px;">
                  ${escapeHtml(o.description)}
                </p>
                <div style="display: flex; gap: 8px; justify-content: flex-end;">
                  <button type="button" class="btn btn-outline btn-sm reject-opp-btn" data-id="${o.id}">Reject</button>
                  <button type="button" class="btn btn-primary btn-sm approve-opp-btn" data-id="${o.id}">Approve & Publish</button>
                </div>
              </div>
            `).join('')}
          </div>
        `;
      }

      // Render Achievements
      if (achieve.length === 0) {
        achieveContainer.innerHTML = `<p style="font-size: 13px; color: var(--slate-400);">No pending achievements in review queue.</p>`;
      } else {
        achieveContainer.innerHTML = `
          <div style="display: flex; flex-direction: column; gap: 14px;">
            ${achieve.map(a => `
              <div style="border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px; background: #ffffff;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                  <strong style="color: var(--navy-900); font-size: 15px;">${escapeHtml(a.title)}</strong>
                  <span class="badge badge-warning">PENDING REVIEW</span>
                </div>
                <div style="font-size: 13px; color: var(--slate-500); margin-bottom: 8px;">
                  Submitted by <strong>${escapeHtml(a.userName || 'Alumnus')}</strong> (${a.category})
                </div>
                <p style="font-size: 13px; color: var(--slate-600); line-height: 1.5; margin-bottom: 12px;">
                  ${escapeHtml(a.description)}
                </p>
                <div style="display: flex; gap: 8px; justify-content: flex-end;">
                  <button type="button" class="btn btn-outline btn-sm reject-ach-btn" data-id="${a.id}">Reject</button>
                  <button type="button" class="btn btn-primary btn-sm approve-ach-btn" data-id="${a.id}">Approve & Showcase</button>
                </div>
              </div>
            `).join('')}
          </div>
        `;
      }

      // Wire opp buttons
      document.querySelectorAll('.approve-opp-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          await api.reviewOpportunity(id, 'approved', 'Approved by faculty.');
          showToast('Opportunity approved and published!', 'success');
          loadAll();
        });
      });
      document.querySelectorAll('.reject-opp-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          await api.reviewOpportunity(id, 'rejected', 'Did not meet criteria.');
          showToast('Opportunity rejected.', 'info');
          loadAll();
        });
      });

      // Wire ach buttons
      document.querySelectorAll('.approve-ach-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          await api.reviewAchievement(id, 'approved', 'Verified and approved.');
          showToast('Achievement approved!', 'success');
          loadAll();
        });
      });
      document.querySelectorAll('.reject-ach-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          await api.reviewAchievement(id, 'rejected', 'Submission requires revision.');
          showToast('Achievement rejected.', 'info');
          loadAll();
        });
      });

    } catch (e) {
      oppsContainer.innerHTML = `<p style="color: var(--color-danger);">Error loading moderation queue.</p>`;
    }
  };

  // Initial load
  loadAll();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

