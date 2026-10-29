/**
 * Mentorship Management Page
 */
import { api } from '../services/api.js';
import { authState } from '../auth/authContext.js';
import { showToast } from '../components/toast.js';

export async function renderMentorshipPage() {
  const isAlumni = authState.role === 'alumni';

  return `
    <div>
      <div style="margin-bottom: 24px;">
        <h1 style="font-size: 24px; font-weight: 800; color: var(--navy-900);">Mentorship Central</h1>
        <p style="color: var(--slate-500); font-size: 14px;">Structured 1-on-1 career guidance, interview preparation, and mentorship tracking.</p>
      </div>

      ${isAlumni ? `
        <!-- Alumni Preferences Card -->
        <div class="card" style="margin-bottom: 24px; border: 1px solid var(--teal-500); background: #ffffff;">
          <h3 class="card-title" style="margin-bottom: 12px;">Mentorship Availability Settings</h3>
          <div style="display: flex; gap: 20px; align-items: center; flex-wrap: wrap;">
            <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; font-size: 14px; font-weight: 600;">
              <input type="checkbox" id="mentor-avail-toggle" style="width: 18px; height: 18px; accent-color: var(--teal-600);">
              Accepting New Student Mentees
            </label>
            <div style="display: flex; align-items: center; gap: 8px;">
              <label for="max-mentees-input" style="font-size: 13px; color: var(--slate-600);">Max Capacity:</label>
              <input type="number" id="max-mentees-input" class="form-control" style="width: 80px;" min="1" max="10" value="4">
            </div>
            <button type="button" id="save-mentor-pref-btn" class="btn btn-primary btn-sm">Save Preferences</button>
          </div>
        </div>
      ` : ''}

      <div class="card">
        <h2 class="card-title" style="margin-bottom: 16px;">Mentorship Connections & Inquiries</h2>
        <div id="mentorship-list">
          <div style="color: var(--slate-400); text-align: center; padding: 30px;">Loading mentorships...</div>
        </div>
      </div>
    </div>
  `;
}

export async function initMentorshipPage() {
  const listContainer = document.getElementById('mentorship-list');
  const availToggle = document.getElementById('mentor-avail-toggle');
  const maxInput = document.getElementById('max-mentees-input');
  const savePrefBtn = document.getElementById('save-mentor-pref-btn');

  const currentUid = authState.user?.uid;
  const isAlumni = authState.role === 'alumni';

  if (isAlumni && availToggle && maxInput) {
    const prof = authState.user?.profile || {};
    availToggle.checked = prof.isMentoringAvailable !== false;
    maxInput.value = prof.maxMentees || 4;

    savePrefBtn.addEventListener('click', async () => {
      try {
        const isMentoringAvailable = availToggle.checked;
        const maxMentees = parseInt(maxInput.value, 10) || 4;
        await api.updateMentorshipPreferences({ isMentoringAvailable, maxMentees });
        showToast('Mentorship preferences updated successfully!', 'success');
      } catch (e) {
        showToast(e.message || 'Error updating preferences.', 'error');
      }
    });
  }

  const loadMentorships = async () => {
    try {
      const res = await api.getMentorships();
      const mentorships = res.data || [];

      if (mentorships.length === 0) {
        listContainer.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">🎯</div>
            <div class="empty-state-title">No mentorship relationships yet</div>
            <p>${isAlumni ? 'Incoming mentorship inquiries from students will appear here.' : 'Search the Alumni Directory to request a mentor.'}</p>
          </div>
        `;
        return;
      }

      listContainer.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 14px;">
          ${mentorships.map(m => {
            const isMentor = m.mentorId === currentUid;
            const partnerName = isMentor ? m.studentName : m.mentorName;
            const isPending = m.status === 'pending';
            const isAccepted = m.status === 'accepted';

            return `
              <div style="border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 18px; background: #ffffff;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                  <div>
                    <strong style="font-size: 16px; color: var(--navy-900);">
                      ${isMentor ? `Mentee: ${escapeHtml(partnerName || 'Student')}` : `Mentor: ${escapeHtml(partnerName || 'Alumnus')}`}
                    </strong>
                    <div style="font-size: 13px; color: var(--slate-500); margin-top: 2px;">
                      Goals: <em>${escapeHtml(m.goals || 'Career preparation')}</em>
                    </div>
                  </div>
                  <span class="badge ${
                    m.status === 'accepted' ? 'badge-emerald' :
                    m.status === 'completed' ? 'badge-teal' : 'badge-warning'
                  }">
                    ${(m.status || 'pending').toUpperCase()}
                  </span>
                </div>

                ${m.message ? `
                  <p style="font-size: 13px; color: var(--slate-600); margin: 8px 0; background: var(--slate-50); padding: 10px; border-radius: var(--radius-sm);">
                    "${escapeHtml(m.message)}"
                  </p>
                ` : ''}

                <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 12px; border-top: 1px solid var(--border-color); padding-top: 10px;">
                  ${isPending && isMentor ? `
                    <button type="button" class="btn btn-outline btn-sm reject-mentor-btn" data-id="${m.id}">Reject</button>
                    <button type="button" class="btn btn-primary btn-sm accept-mentor-btn" data-id="${m.id}">Accept Request</button>
                  ` : ''}

                  ${isAccepted ? `
                    <a href="#/messages" class="btn btn-navy btn-sm">Direct Chat</a>
                    <button type="button" class="btn btn-outline btn-sm complete-mentor-btn" data-id="${m.id}">Complete Mentorship</button>
                  ` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;

      // Wire accept
      document.querySelectorAll('.accept-mentor-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          await api.updateMentorshipStatus(id, 'accepted');
          showToast('Accepted mentorship request!', 'success');
          loadMentorships();
        });
      });

      // Wire reject
      document.querySelectorAll('.reject-mentor-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          await api.updateMentorshipStatus(id, 'rejected');
          showToast('Mentorship request rejected.', 'info');
          loadMentorships();
        });
      });

      // Wire complete
      document.querySelectorAll('.complete-mentor-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          if (confirm('Mark this mentorship as completed?')) {
            await api.updateMentorshipStatus(id, 'completed');
            showToast('Mentorship completed.', 'success');
            loadMentorships();
          }
        });
      });

    } catch (e) {
      listContainer.innerHTML = `<p style="color: var(--color-danger);">Failed to load mentorships.</p>`;
    }
  };

  // Initial load
  loadMentorships();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

