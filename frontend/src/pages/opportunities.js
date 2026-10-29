/**
 * Opportunities (Jobs, Internships, Referrals) & Career Application Tracker
 */
import { api } from '../services/api.js';
import { authState } from '../auth/authContext.js';
import { showToast } from '../components/toast.js';
import { openModal } from '../components/modal.js';

export async function renderOpportunitiesPage() {
  const role = authState.role;
  const canPost = ['alumni', 'faculty', 'admin'].includes(role);

  return `
    <div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 14px;">
        <div>
          <h1 style="font-size: 24px; font-weight: 800; color: var(--navy-900);">Jobs, Internships & Referrals</h1>
          <p style="color: var(--slate-500); font-size: 14px;">Explore curated opportunities directly verified by alumni and faculty.</p>
        </div>
        ${canPost ? `
          <button type="button" id="post-opp-btn" class="btn btn-primary">
            + Post Opportunity
          </button>
        ` : ''}
      </div>

      <!-- Tab Navigation -->
      <div style="display: flex; gap: 8px; border-bottom: 1px solid var(--border-color); margin-bottom: 24px;">
        <button type="button" class="btn btn-outline opp-tab active" data-tab="catalog" style="border-bottom: none; border-radius: var(--radius-md) var(--radius-md) 0 0;">
          All Opportunities
        </button>
        <button type="button" class="btn btn-outline opp-tab" data-tab="tracker" style="border-bottom: none; border-radius: var(--radius-md) var(--radius-md) 0 0;">
          My Application Tracker
        </button>
        <button type="button" class="btn btn-outline opp-tab" data-tab="saved" style="border-bottom: none; border-radius: var(--radius-md) var(--radius-md) 0 0;">
          Saved Bookmarks
        </button>
      </div>

      <!-- Tab Contents -->
      <div id="opp-catalog-view">
        <div id="opp-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 20px;">
          <div style="text-align: center; padding: 40px; color: var(--slate-400); grid-column: 1 / -1;">
            Loading opportunities...
          </div>
        </div>
      </div>

      <div id="opp-tracker-view" style="display: none;">
        <div class="card" style="margin-bottom: 20px;">
          <h3 class="card-title" style="margin-bottom: 8px;">Private Career Application Tracker</h3>
          <p style="font-size: 13px; color: var(--slate-600);">Keep private records of roles you have bookmarked, applied to, or interviewed for.</p>
        </div>
        <div id="tracker-table-container">
          <div style="text-align: center; padding: 30px; color: var(--slate-400);">Loading application tracker...</div>
        </div>
      </div>

      <div id="opp-saved-view" style="display: none;">
        <div id="saved-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 20px;">
          <div style="text-align: center; padding: 40px; color: var(--slate-400); grid-column: 1 / -1;">
            Loading saved bookmarks...
          </div>
        </div>
      </div>
    </div>
  `;
}

export async function initOpportunitiesPage() {
  const tabs = document.querySelectorAll('.opp-tab');
  const catalogView = document.getElementById('opp-catalog-view');
  const trackerView = document.getElementById('opp-tracker-view');
  const savedView = document.getElementById('opp-saved-view');
  const oppGrid = document.getElementById('opp-grid');
  const trackerContainer = document.getElementById('tracker-table-container');
  const savedGrid = document.getElementById('saved-grid');
  const postBtn = document.getElementById('post-opp-btn');

  // Tab switching
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.getAttribute('data-tab');

      catalogView.style.display = target === 'catalog' ? 'block' : 'none';
      trackerView.style.display = target === 'tracker' ? 'block' : 'none';
      savedView.style.display = target === 'saved' ? 'block' : 'none';

      if (target === 'tracker') loadTracker();
      if (target === 'saved') loadSaved();
    });
  });

  const loadCatalog = async () => {
    try {
      const res = await api.getOpportunities();
      const opps = res.data || [];

      if (opps.length === 0) {
        oppGrid.innerHTML = `
          <div class="card empty-state" style="grid-column: 1 / -1;">
            <div class="empty-state-icon">💼</div>
            <div class="empty-state-title">No approved opportunities yet</div>
            <p>Check back soon or post a new referral opportunity.</p>
          </div>
        `;
        return;
      }

      oppGrid.innerHTML = opps.map(o => renderOpportunityCard(o)).join('');
      attachCardListeners();
    } catch (e) {
      oppGrid.innerHTML = `<div class="card" style="grid-column: 1 / -1; color: var(--color-danger);">Failed to load opportunities.</div>`;
    }
  };

  const loadSaved = async () => {
    try {
      const res = await api.getSavedOpportunities();
      const saved = res.data || [];

      if (saved.length === 0) {
        savedGrid.innerHTML = `
          <div class="card empty-state" style="grid-column: 1 / -1;">
            <div class="empty-state-icon">🔖</div>
            <div class="empty-state-title">No saved bookmarks</div>
            <p>Click "Save" on any opportunity card to bookmark it here.</p>
          </div>
        `;
        return;
      }

      savedGrid.innerHTML = saved.map(o => renderOpportunityCard(o)).join('');
      attachCardListeners();
    } catch (e) {
      savedGrid.innerHTML = `<div class="card" style="grid-column: 1 / -1; color: var(--color-danger);">Failed to load bookmarks.</div>`;
    }
  };

  const loadTracker = async () => {
    try {
      const res = await api.getApplications();
      const apps = res.data || [];

      if (apps.length === 0) {
        trackerContainer.innerHTML = `
          <div class="card empty-state">
            <div class="empty-state-icon">📋</div>
            <div class="empty-state-title">No tracked applications</div>
            <p>Click "Track Application" on any job or internship card to manage your interview progress.</p>
          </div>
        `;
        return;
      }

      trackerContainer.innerHTML = `
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Opportunity</th>
                <th>Company</th>
                <th>Status</th>
                <th>Applied Date</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${apps.map(a => `
                <tr>
                  <td><strong>${escapeHtml(a.opportunityTitle || 'Opportunity')}</strong></td>
                  <td>${escapeHtml(a.company || 'N/A')}</td>
                  <td>
                    <span class="badge ${
                      a.status === 'offered' ? 'badge-emerald' :
                      a.status === 'interviewing' ? 'badge-teal' :
                      a.status === 'not_selected' ? 'badge-danger' : 'badge-navy'
                    }">
                      ${a.status.toUpperCase()}
                    </span>
                  </td>
                  <td>${a.appliedDate ? new Date(a.appliedDate).toLocaleDateString() : 'N/A'}</td>
                  <td style="max-width: 250px; font-size: 13px; color: var(--slate-600);">${escapeHtml(a.notes || 'No private notes added.')}</td>
                  <td>
                    <button type="button" class="btn btn-outline btn-sm edit-track-btn" data-id="${a.opportunityId}" data-status="${a.status}" data-notes="${escapeHtml(a.notes || '')}">
                      Update
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;

      document.querySelectorAll('.edit-track-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const oppId = btn.getAttribute('data-id');
          const currentStatus = btn.getAttribute('data-status');
          const currentNotes = btn.getAttribute('data-notes');
          openTrackModal(oppId, 'Update Application', currentStatus, currentNotes);
        });
      });

    } catch (e) {
      trackerContainer.innerHTML = `<div class="card" style="color: var(--color-danger);">Failed to load tracker: ${escapeHtml(e.message)}</div>`;
    }
  };

  const renderOpportunityCard = (o) => {
    const isExternal = !!o.applicationUrl;
    return `
      <div class="card" style="display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
            <span class="badge badge-teal">${o.type.toUpperCase()}</span>
            <button type="button" class="btn btn-outline btn-sm save-opp-btn" data-id="${o.id}" style="padding: 4px 8px;" title="Bookmark">
              🔖
            </button>
          </div>

          <h3 style="font-size: 17px; font-weight: 700; color: var(--navy-900); margin-bottom: 4px;">
            ${escapeHtml(o.title)}
          </h3>
          <div style="font-size: 13px; font-weight: 600; color: var(--teal-700); margin-bottom: 8px;">
            ${escapeHtml(o.company)} • ${escapeHtml(o.location)} ${o.isRemote ? '(Remote)' : ''}
          </div>

          <p style="font-size: 13px; color: var(--slate-600); margin-bottom: 14px; line-height: 1.5; min-height: 50px;">
            ${escapeHtml(o.description)}
          </p>

          <div style="font-size: 12px; color: var(--slate-500); margin-bottom: 14px; border-top: 1px solid var(--border-color); padding-top: 10px;">
            Posted by <strong>${escapeHtml(o.postedByName || 'Alumni')}</strong> (${o.postedByRole})
          </div>
        </div>

        <div style="display: flex; gap: 8px; border-top: 1px solid var(--border-color); padding-top: 12px;">
          ${isExternal ? `
            <a href="${escapeHtml(o.applicationUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm" style="flex: 1; text-align: center;">
              Apply Now ↗
            </a>
          ` : `
            <span class="btn btn-outline btn-sm" style="flex: 1; text-align: center; cursor: default;">Direct Contact</span>
          `}
          <button type="button" class="btn btn-outline btn-sm track-opp-btn" data-id="${o.id}" data-title="${escapeHtml(o.title)}">
            Track Role
          </button>
        </div>
      </div>
    `;
  };

  const attachCardListeners = () => {
    document.querySelectorAll('.save-opp-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        try {
          const res = await api.toggleSaveOpportunity(id);
          showToast(res.message, 'success');
        } catch (e) {
          showToast(e.message || 'Error updating bookmark', 'error');
        }
      });
    });

    document.querySelectorAll('.track-opp-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const title = btn.getAttribute('data-title');
        openTrackModal(id, title);
      });
    });
  };

  const openTrackModal = (oppId, title, currentStatus = 'applied', currentNotes = '') => {
    const content = `
      <p style="font-size: 14px; color: var(--slate-600); margin-bottom: 14px;">
        Track application status for <strong>${escapeHtml(title)}</strong>:
      </p>
      <div class="form-group">
        <label class="form-label" for="track-status">Application Status</label>
        <select id="track-status" class="form-control">
          <option value="interested" ${currentStatus === 'interested' ? 'selected' : ''}>Interested</option>
          <option value="applied" ${currentStatus === 'applied' ? 'selected' : ''}>Applied</option>
          <option value="interviewing" ${currentStatus === 'interviewing' ? 'selected' : ''}>Interviewing</option>
          <option value="offered" ${currentStatus === 'offered' ? 'selected' : ''}>Offered</option>
          <option value="not_selected" ${currentStatus === 'not_selected' ? 'selected' : ''}>Not Selected</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label" for="track-notes">Private Notes</label>
        <textarea id="track-notes" class="form-control" placeholder="Add interview dates, recruiter contact, interview feedback...">${escapeHtml(currentNotes)}</textarea>
      </div>
    `;

    const footer = `
      <button type="button" class="btn btn-outline" id="cancel-track-btn">Cancel</button>
      <button type="button" class="btn btn-primary" id="save-track-btn">Save to Tracker</button>
    `;

    const { close } = openModal({ title: 'Application Tracker', contentHtml: content, footerHtml: footer });

    document.getElementById('cancel-track-btn').addEventListener('click', close);
    document.getElementById('save-track-btn').addEventListener('click', async () => {
      const status = document.getElementById('track-status').value;
      const notes = document.getElementById('track-notes').value.trim();

      try {
        await api.trackApplication(oppId, status, notes);
        showToast('Application tracker updated successfully!', 'success');
        close();
        if (trackerView.style.display === 'block') loadTracker();
      } catch (e) {
        showToast(e.message || 'Failed to update application tracker.', 'error');
      }
    });
  };

  // Post Opportunity Modal
  if (postBtn) {
    postBtn.addEventListener('click', () => {
      const content = `
        <form id="create-opp-form">
          <div class="form-group">
            <label class="form-label" for="opp-title">Job / Internship Title</label>
            <input type="text" id="opp-title" class="form-control" placeholder="e.g. Graduate Cloud Engineer" required>
          </div>
          <div class="form-group">
            <label class="form-label" for="opp-company">Company Name</label>
            <input type="text" id="opp-company" class="form-control" placeholder="e.g. Apex Technologies" required>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div class="form-group">
              <label class="form-label" for="opp-type">Opportunity Type</label>
              <select id="opp-type" class="form-control">
                <option value="job">Full-Time Job</option>
                <option value="internship">Internship</option>
                <option value="referral">Internal Referral</option>
                <option value="graduate_trainee">Graduate Trainee</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="opp-location">Location</label>
              <input type="text" id="opp-location" class="form-control" placeholder="Seattle / Remote">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label" for="opp-desc">Role Description</label>
            <textarea id="opp-desc" class="form-control" placeholder="Describe the team, core responsibilities, and qualifications..." required></textarea>
          </div>
          <div class="form-group">
            <label class="form-label" for="opp-url">Application URL or Email</label>
            <input type="text" id="opp-url" class="form-control" placeholder="https://company.com/apply or mailto:referrals@company.com">
          </div>
        </form>
      `;

      const footer = `
        <button type="button" class="btn btn-outline" id="cancel-opp-btn">Cancel</button>
        <button type="button" class="btn btn-primary" id="submit-opp-btn">Submit Opportunity</button>
      `;

      const { close } = openModal({ title: 'Post New Opportunity', contentHtml: content, footerHtml: footer });

      document.getElementById('cancel-opp-btn').addEventListener('click', close);
      document.getElementById('submit-opp-btn').addEventListener('click', async () => {
        const title = document.getElementById('opp-title').value.trim();
        const company = document.getElementById('opp-company').value.trim();
        const type = document.getElementById('opp-type').value;
        const location = document.getElementById('opp-location').value.trim() || 'Remote';
        const description = document.getElementById('opp-desc').value.trim();
        const applicationUrl = document.getElementById('opp-url').value.trim();

        if (!title || !company || !description) {
          showToast('Please fill in all required fields.', 'error');
          return;
        }

        try {
          const res = await api.postOpportunity({ title, company, type, location, description, applicationUrl });
          showToast(res.message || 'Opportunity submitted!', 'success');
          close();
          loadCatalog();
        } catch (err) {
          showToast(err.message || 'Failed to submit opportunity.', 'error');
        }
      });
    });
  }

  // Initial load
  loadCatalog();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

