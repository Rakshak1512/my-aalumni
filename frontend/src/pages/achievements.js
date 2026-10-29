/**
 * Alumni Achievements Showcase Page
 */
import { api } from '../services/api.js';
import { authState } from '../auth/authContext.js';
import { showToast } from '../components/toast.js';
import { openModal } from '../components/modal.js';

export async function renderAchievementsPage() {
  const isAlumni = authState.role === 'alumni';

  return `
    <div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 14px;">
        <div>
          <h1 style="font-size: 24px; font-weight: 800; color: var(--navy-900);">Alumni Achievements & Success Stories</h1>
          <p style="color: var(--slate-500); font-size: 14px;">Celebrating career promotions, awards, placements, and milestones.</p>
        </div>
        ${isAlumni ? `
          <button type="button" id="submit-achieve-btn" class="btn btn-primary">
            + Submit Achievement
          </button>
        ` : ''}
      </div>

      <div id="achievements-feed" style="display: flex; flex-direction: column; gap: 18px; max-width: 800px;">
        <div style="text-align: center; padding: 40px; color: var(--slate-400);">
          Loading achievements showcase...
        </div>
      </div>
    </div>
  `;
}

export async function initAchievementsPage() {
  const feed = document.getElementById('achievements-feed');
  const submitBtn = document.getElementById('submit-achieve-btn');

  const loadAchievements = async () => {
    try {
      const res = await api.getAchievements();
      const achievements = res.data || [];

      if (achievements.length === 0) {
        feed.innerHTML = `
          <div class="card empty-state">
            <div class="empty-state-icon">🏆</div>
            <div class="empty-state-title">No approved achievements yet</div>
            <p>Alumni success stories and promotions will be showcased here.</p>
          </div>
        `;
        return;
      }

      feed.innerHTML = achievements.map(a => `
        <div class="card">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
            <div style="display: flex; gap: 12px; align-items: center;">
              <div style="width: 42px; height: 42px; border-radius: var(--radius-full); background: var(--teal-50); color: var(--teal-600); display: flex; align-items: center; justify-content: center; font-weight: 700;">
                ${(a.userName || 'A').substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div style="font-weight: 700; color: var(--navy-900); font-size: 15px;">${escapeHtml(a.userName || 'Alumnus')}</div>
                <div style="font-size: 12px; color: var(--slate-500);">${a.createdAt ? new Date(a.createdAt).toLocaleDateString() : ''}</div>
              </div>
            </div>
            <span class="badge badge-emerald">${(a.category || 'milestone').replace('_', ' ').toUpperCase()}</span>
          </div>

          <h3 style="font-size: 17px; font-weight: 700; color: var(--navy-900); margin-bottom: 8px;">
            ${escapeHtml(a.title)}
          </h3>

          <p style="font-size: 14px; color: var(--slate-700); line-height: 1.6; margin-bottom: 14px;">
            ${escapeHtml(a.description)}
          </p>

          ${a.supportingUrl ? `
            <div style="border-top: 1px solid var(--border-color); padding-top: 10px;">
              <a href="${escapeHtml(a.supportingUrl)}" target="_blank" rel="noopener noreferrer" style="font-size: 13px; font-weight: 600; color: var(--teal-600);">
                View Supporting Reference ↗
              </a>
            </div>
          ` : ''}
        </div>
      `).join('');
    } catch (e) {
      feed.innerHTML = `<div class="card" style="color: var(--color-danger);">Failed to load achievements.</div>`;
    }
  };

  if (submitBtn) {
    submitBtn.addEventListener('click', () => {
      const content = `
        <form id="achieve-form">
          <div class="form-group">
            <label class="form-label" for="ach-title">Achievement Headline</label>
            <input type="text" id="ach-title" class="form-control" placeholder="e.g. Promoted to Principal Architect at Tech Corp" required>
          </div>
          <div class="form-group">
            <label class="form-label" for="ach-cat">Category</label>
            <select id="ach-cat" class="form-control">
              <option value="promotion">Job Promotion</option>
              <option value="job_placement">New Placement</option>
              <option value="certification">Professional Certification</option>
              <option value="award">Honor / Award</option>
              <option value="higher_education">Higher Degree Admission</option>
              <option value="business_milestone">Startup / Business Milestone</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="ach-desc">Description & Narrative</label>
            <textarea id="ach-desc" class="form-control" placeholder="Share your journey, impact, and learnings with the community..." required></textarea>
          </div>
          <div class="form-group">
            <label class="form-label" for="ach-url">Supporting Link (LinkedIn Post, Press Release, Credential)</label>
            <input type="text" id="ach-url" class="form-control" placeholder="https://linkedin.com/posts/...">
          </div>
        </form>
      `;

      const footer = `
        <button type="button" class="btn btn-outline" id="cancel-ach-btn">Cancel</button>
        <button type="button" class="btn btn-primary" id="submit-ach-btn">Submit for Review</button>
      `;

      const { close } = openModal({ title: 'Submit Achievement', contentHtml: content, footerHtml: footer });

      document.getElementById('cancel-ach-btn').addEventListener('click', close);
      document.getElementById('submit-ach-btn').addEventListener('click', async () => {
        const title = document.getElementById('ach-title').value.trim();
        const category = document.getElementById('ach-cat').value;
        const description = document.getElementById('ach-desc').value.trim();
        const supportingUrl = document.getElementById('ach-url').value.trim();

        if (!title || !description) {
          showToast('Please fill in title and description.', 'error');
          return;
        }

        try {
          const res = await api.submitAchievement({ title, category, description, supportingUrl });
          showToast(res.message || 'Achievement submitted for moderation!', 'success');
          close();
        } catch (err) {
          showToast(err.message || 'Failed to submit achievement.', 'error');
        }
      });
    });
  }

  // Initial load
  loadAchievements();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

