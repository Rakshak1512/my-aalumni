/**
 * Profile & Account Settings Page
 */
import { api } from '../services/api.js';
import { authState } from '../auth/authContext.js';
import { showToast } from '../components/toast.js';

export async function renderSettingsPage() {
  const user = authState.user;
  const role = authState.role || 'student';
  const prof = user?.profile || {};

  return `
    <div>
      <div style="margin-bottom: 24px;">
        <h1 style="font-size: 24px; font-weight: 800; color: var(--navy-900);">Account & Profile Settings</h1>
        <p style="color: var(--slate-500); font-size: 14px;">Manage your public directory presence, career skills, and privacy preferences.</p>
      </div>

      <div class="card" style="max-width: 640px;">
        <form id="settings-form">
          <div class="form-group">
            <label class="form-label" for="set-name">Display Name</label>
            <input type="text" id="set-name" class="form-control" value="${escapeHtml(user?.displayName || '')}" required>
          </div>

          <div class="form-group">
            <label class="form-label">Email Address (Managed via Firebase Auth)</label>
            <input type="email" class="form-control" value="${escapeHtml(user?.email || '')}" disabled style="background: var(--slate-100);">
          </div>

          <div class="form-group">
            <label class="form-label" for="set-bio">Professional Bio</label>
            <textarea id="set-bio" class="form-control" placeholder="Introduce yourself to students and alumni...">${escapeHtml(user?.bio || '')}</textarea>
          </div>

          <div class="form-group">
            <label class="form-label" for="set-phone">Phone Number (Optional)</label>
            <input type="text" id="set-phone" class="form-control" value="${escapeHtml(user?.phone || '')}" placeholder="+1 (555) 000-0000">
          </div>

          ${role === 'alumni' ? `
            <div style="border-top: 1px solid var(--border-color); padding-top: 16px; margin-top: 16px;">
              <h3 style="font-size: 15px; font-weight: 700; margin-bottom: 12px; color: var(--navy-900);">Alumni Professional Details</h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div class="form-group">
                  <label class="form-label" for="set-company">Current Company</label>
                  <input type="text" id="set-company" class="form-control" value="${escapeHtml(prof.company || '')}">
                </div>
                <div class="form-group">
                  <label class="form-label" for="set-role">Job Title</label>
                  <input type="text" id="set-role" class="form-control" value="${escapeHtml(prof.jobTitle || '')}">
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" for="set-skills">Skills (Comma separated)</label>
                <input type="text" id="set-skills" class="form-control" value="${escapeHtml((prof.skills || []).join(', '))}">
              </div>

              <div class="form-group">
                <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; font-size: 13px; font-weight: 600;">
                  <input type="checkbox" id="set-bday-public" ${prof.birthday?.isPublic !== false ? 'checked' : ''} style="width: 16px; height: 16px; accent-color: var(--teal-600);">
                  Show Birthday in Community Celebrations Corner (Excludes birth year)
                </label>
              </div>
            </div>
          ` : ''}

          ${role === 'student' ? `
            <div style="border-top: 1px solid var(--border-color); padding-top: 16px; margin-top: 16px;">
              <h3 style="font-size: 15px; font-weight: 700; margin-bottom: 12px; color: var(--navy-900);">Student Academic Details</h3>
              <div class="form-group">
                <label class="form-label" for="set-skills">Key Skills & Interests (Comma separated)</label>
                <input type="text" id="set-skills" class="form-control" value="${escapeHtml((prof.skills || []).join(', '))}">
              </div>
              <div class="form-group">
                <label class="form-label" for="set-github">GitHub Profile URL</label>
                <input type="text" id="set-github" class="form-control" value="${escapeHtml(prof.githubUrl || '')}" placeholder="https://github.com/username">
              </div>
            </div>
          ` : ''}

          <button type="submit" id="save-settings-btn" class="btn btn-primary" style="margin-top: 10px;">
            Save Profile Changes
          </button>
        </form>
      </div>
    </div>
  `;
}

export function initSettingsPage() {
  const form = document.getElementById('settings-form');
  const saveBtn = document.getElementById('save-settings-btn');
  const role = authState.role || 'student';

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const displayName = document.getElementById('set-name').value.trim();
      const bio = document.getElementById('set-bio').value.trim();
      const phone = document.getElementById('set-phone').value.trim();

      let profileData = {};
      const skillsInput = document.getElementById('set-skills');
      if (skillsInput) {
        profileData.skills = skillsInput.value.split(',').map(s => s.trim()).filter(Boolean);
      }

      if (role === 'alumni') {
        const company = document.getElementById('set-company')?.value.trim();
        const jobTitle = document.getElementById('set-role')?.value.trim();
        const isBdayPublic = document.getElementById('set-bday-public')?.checked;
        if (company) profileData.company = company;
        if (jobTitle) profileData.jobTitle = jobTitle;
        profileData.birthday = {
          month: authState.user?.profile?.birthday?.month || new Date().getMonth() + 1,
          day: authState.user?.profile?.birthday?.day || new Date().getDate(),
          isPublic: isBdayPublic !== false
        };
      } else if (role === 'student') {
        const githubUrl = document.getElementById('set-github')?.value.trim();
        if (githubUrl) profileData.githubUrl = githubUrl;
      }

      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';

      try {
        const res = await api.updateProfile({ displayName, bio, phone, profile: profileData });
        authState.setUser(res.data);
        showToast('Profile updated successfully!', 'success');
      } catch (err) {
        showToast(err.message || 'Failed to update profile.', 'error');
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Profile Changes';
      }
    });
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

