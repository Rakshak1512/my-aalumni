/**
 * Admin Console & Governance Page
 */
import { api } from '../services/api.js';
import { authState } from '../auth/authContext.js';
import { showToast } from '../components/toast.js';
import { openModal } from '../components/modal.js';
import { renderUnauthorizedPage } from './unauthorized.js';

export async function renderAdminConsolePage() {
  if (authState.role !== 'admin') {
    return renderUnauthorizedPage(authState.role, ['admin']);
  }

  return `
    <div>
      <div style="margin-bottom: 24px;">
        <h1 style="font-size: 24px; font-weight: 800; color: var(--navy-900);">Administration & Governance Console</h1>
        <p style="color: var(--slate-500); font-size: 14px;">User authorization, role elevation, academic curriculum, and system audit logs.</p>
      </div>

      <!-- Navigation Tabs -->
      <div style="display: flex; gap: 8px; border-bottom: 1px solid var(--border-color); margin-bottom: 24px;">
        <button type="button" class="btn btn-outline admin-tab active" data-tab="users">Users & Roles</button>
        <button type="button" class="btn btn-outline admin-tab" data-tab="tickets">Support Desk</button>
        <button type="button" class="btn btn-outline admin-tab" data-tab="curriculum">Curriculum & Cohorts</button>
        <button type="button" class="btn btn-outline admin-tab" data-tab="audit">Security Audit Trail</button>
      </div>

      <!-- Users & Roles View -->
      <div id="admin-users-view">
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">User Accounts & Authorization</h2>
          </div>
          <div id="admin-users-table-container">
            <div style="text-align: center; padding: 30px; color: var(--slate-400);">Loading registered users...</div>
          </div>
        </div>
      </div>

      <!-- Tickets View -->
      <div id="admin-tickets-view" style="display: none;">
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">All Support Requests (SMTP Email Dispatch)</h2>
          </div>
          <div id="admin-tickets-table-container">
            <div style="text-align: center; padding: 30px; color: var(--slate-400);">Loading support requests...</div>
          </div>
        </div>
      </div>

      <!-- Curriculum View -->
      <div id="admin-curriculum-view" style="display: none;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Academic Courses</h3>
              <button type="button" id="add-course-btn" class="btn btn-primary btn-sm">+ Course</button>
            </div>
            <div id="admin-courses-list"><p style="color: var(--slate-400);">Loading courses...</p></div>
          </div>

          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Academic Years</h3>
              <button type="button" id="add-year-btn" class="btn btn-primary btn-sm">+ Year</button>
            </div>
            <div id="admin-years-list"><p style="color: var(--slate-400);">Loading academic years...</p></div>
          </div>
        </div>
      </div>

      <!-- Audit Logs View -->
      <div id="admin-audit-view" style="display: none;">
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">Immutable Security Audit Logs</h2>
          </div>
          <div id="admin-audit-container">
            <div style="text-align: center; padding: 30px; color: var(--slate-400);">Loading audit logs...</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

export async function initAdminConsolePage() {
  if (authState.role !== 'admin') {
    return;
  }

  const tabs = document.querySelectorAll('.admin-tab');
  const usersView = document.getElementById('admin-users-view');
  const ticketsView = document.getElementById('admin-tickets-view');
  const curriculumView = document.getElementById('admin-curriculum-view');
  const auditView = document.getElementById('admin-audit-view');

  const usersContainer = document.getElementById('admin-users-table-container');
  const ticketsContainer = document.getElementById('admin-tickets-table-container');
  const coursesList = document.getElementById('admin-courses-list');
  const yearsList = document.getElementById('admin-years-list');
  const auditContainer = document.getElementById('admin-audit-container');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.getAttribute('data-tab');

      usersView.style.display = target === 'users' ? 'block' : 'none';
      ticketsView.style.display = target === 'tickets' ? 'block' : 'none';
      curriculumView.style.display = target === 'curriculum' ? 'block' : 'none';
      auditView.style.display = target === 'audit' ? 'block' : 'none';

      if (target === 'users') loadUsers();
      if (target === 'tickets') loadTickets();
      if (target === 'curriculum') loadCurriculum();
      if (target === 'audit') loadAudit();
    });
  });

  const loadUsers = async () => {
    try {
      const res = await api.getAdminUsers();
      const users = res.data || [];

      usersContainer.innerHTML = `
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Account Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${users.map(u => `
                <tr>
                  <td><strong>${escapeHtml(u.displayName || 'User')}</strong></td>
                  <td>${escapeHtml(u.email || '')}</td>
                  <td>
                    ${(u.id === 'demo_admin_uid' || (u.id === authState.user?.uid && u.role === 'admin')) ? `
                      <span class="badge badge-emerald" style="padding: 4px 8px; font-weight: 700;">ADMIN</span>
                    ` : `
                      <select class="form-control role-select" data-id="${u.id}" style="padding: 4px 8px; font-size: 13px; width: 110px;">
                        <option value="student" ${u.role === 'student' ? 'selected' : ''}>Student</option>
                        <option value="alumni" ${u.role === 'alumni' ? 'selected' : ''}>Alumni</option>
                        <option value="faculty" ${u.role === 'faculty' ? 'selected' : ''}>Faculty</option>
                        <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
                      </select>
                    `}
                  </td>
                  <td>
                    <span class="badge ${u.accountStatus === 'active' ? 'badge-emerald' : 'badge-danger'}">
                      ${(u.accountStatus || 'active').toUpperCase()}
                    </span>
                  </td>
                  <td>
                    ${u.id === 'demo_admin_uid' ? '<span style="color: var(--slate-400); font-size: 12px; font-style: italic;">Protected</span>' : `
                      <button type="button" class="btn btn-outline btn-sm toggle-status-btn" data-id="${u.id}" data-status="${u.accountStatus || 'active'}">
                        ${u.accountStatus === 'suspended' ? 'Activate' : 'Suspend'}
                      </button>
                    `}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;

      // Role changes
      document.querySelectorAll('.role-select').forEach(sel => {
        sel.addEventListener('change', async () => {
          const id = sel.getAttribute('data-id');
          const newRole = sel.value;
          try {
            await api.updateUserRole(id, newRole);
            showToast(`User role elevated to ${newRole}`, 'success');
          } catch (e) {
            showToast(e.message || 'Error updating role', 'error');
            loadUsers();
          }
        });
      });

      // Status toggle
      document.querySelectorAll('.toggle-status-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          const curr = btn.getAttribute('data-status');
          const next = curr === 'suspended' ? 'active' : 'suspended';
          try {
            await api.updateUserStatus(id, next);
            showToast(`User status set to ${next}`, 'info');
            loadUsers();
          } catch (e) {
            showToast(e.message || 'Error updating status', 'error');
          }
        });
      });

    } catch (e) {
      usersContainer.innerHTML = `<p style="color: var(--color-danger);">Failed to load users: ${escapeHtml(e.message)}</p>`;
    }
  };

  const loadTickets = async () => {
    try {
      const res = await api.getAllTickets();
      const tickets = res.data || [];

      if (tickets.length === 0) {
        ticketsContainer.innerHTML = `<p style="color: var(--slate-400); text-align: center; padding: 20px;">No support tickets found.</p>`;
        return;
      }

      ticketsContainer.innerHTML = `
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Requester</th>
                <th>Category</th>
                <th>Subject</th>
                <th>Status</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${tickets.map(t => `
                <tr>
                  <td><strong>${escapeHtml(t.requesterName || 'User')}</strong><br><span style="font-size: 11px; color: var(--slate-400);">${escapeHtml(t.requesterEmail || '')}</span></td>
                  <td>${escapeHtml(t.category || 'general')}</td>
                  <td>${escapeHtml(t.subject)}</td>
                  <td>
                    <span class="badge ${t.status === 'resolved' ? 'badge-emerald' : 'badge-warning'}">
                      ${(t.status || 'open').toUpperCase()}
                    </span>
                  </td>
                  <td>${t.createdAt ? new Date(t.createdAt).toLocaleDateString() : ''}</td>
                  <td>
                    <button type="button" class="btn btn-primary btn-sm reply-ticket-btn" data-id="${t.id}" data-subject="${escapeHtml(t.subject)}" data-desc="${escapeHtml(t.description)}">
                      Respond
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;

      document.querySelectorAll('.reply-ticket-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          const subject = btn.getAttribute('data-subject');
          const desc = btn.getAttribute('data-desc');
          openReplyModal(id, subject, desc);
        });
      });

    } catch (e) {
      ticketsContainer.innerHTML = `<p style="color: var(--color-danger); text-align: center; padding: 20px;">Failed to load tickets: ${escapeHtml(e.message || 'Error communicating with backend.')}</p>`;
    }
  };

  const openReplyModal = (ticketId, subject, desc) => {
    const content = `
      <div style="margin-bottom: 12px; font-size: 13px; color: var(--slate-600);">
        <strong>Inquiry:</strong> <em>"${escapeHtml(desc)}"</em>
      </div>
      <div class="form-group">
        <label class="form-label" for="ticket-reply-text">Administrator Response</label>
        <textarea id="ticket-reply-text" class="form-control" placeholder="Write the response that will be emailed to the requester via SMTP..." required style="min-height: 120px;"></textarea>
      </div>
      <div class="form-group">
        <label class="form-label" for="ticket-next-status">Update Ticket Status</label>
        <select id="ticket-next-status" class="form-control">
          <option value="resolved" selected>Resolved</option>
          <option value="in_progress">In Progress</option>
          <option value="closed">Closed</option>
        </select>
      </div>
    `;

    const footer = `
      <button type="button" class="btn btn-outline" id="cancel-reply-btn">Cancel</button>
      <button type="button" class="btn btn-primary" id="send-reply-btn">Dispatch Response</button>
    `;

    const { close } = openModal({ title: `Reply: ${subject}`, contentHtml: content, footerHtml: footer });

    document.getElementById('cancel-reply-btn').addEventListener('click', close);
    document.getElementById('send-reply-btn').addEventListener('click', async () => {
      const responseText = document.getElementById('ticket-reply-text').value.trim();
      const status = document.getElementById('ticket-next-status').value;

      if (!responseText) {
        showToast('Response message is required.', 'error');
        return;
      }

      try {
        await api.respondToTicket(ticketId, responseText, status);
        showToast('Response dispatched and user notified via SMTP!', 'success');
        close();
        loadTickets();
      } catch (e) {
        showToast(e.message || 'Error responding to ticket.', 'error');
      }
    });
  };

  const loadCurriculum = async () => {
    try {
      const [cRes, yRes] = await Promise.all([
        api.getCourses().catch(() => ({ data: [] })),
        api.getAcademicYears().catch(() => ({ data: [] }))
      ]);

      const courses = cRes.data || [];
      const years = yRes.data || [];

      coursesList.innerHTML = courses.map(c => `
        <div style="border: 1px solid var(--border-color); padding: 12px; border-radius: var(--radius-sm); margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong>${escapeHtml(c.name)}</strong> <span class="badge badge-navy" style="font-size: 11px;">${escapeHtml(c.code)}</span>
            <div style="font-size: 12px; color: var(--slate-500); margin-top: 2px;">${escapeHtml(c.department || 'General')} • ${c.durationYears || 4} Years (${escapeHtml(c.degreeType || 'Undergraduate')})</div>
          </div>
          <button type="button" class="btn btn-outline btn-sm delete-course-btn" data-id="${c.id}" data-name="${escapeHtml(c.name)}" style="color: var(--color-danger); border-color: rgba(239, 68, 68, 0.3); padding: 4px 8px;">
            Delete
          </button>
        </div>
      `).join('') || '<p style="color: var(--slate-400); padding: 10px;">No courses found.</p>';

      yearsList.innerHTML = years.map(y => `
        <div style="border: 1px solid var(--border-color); padding: 12px; border-radius: var(--radius-sm); margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong>${escapeHtml(y.name)}</strong> ${y.isCurrent ? '<span class="badge badge-emerald" style="font-size: 11px;">CURRENT</span>' : ''}
            <div style="font-size: 12px; color: var(--slate-500); margin-top: 2px;">${y.startDate || 'N/A'} to ${y.endDate || 'N/A'}</div>
          </div>
          <button type="button" class="btn btn-outline btn-sm delete-year-btn" data-id="${y.id}" data-name="${escapeHtml(y.name)}" style="color: var(--color-danger); border-color: rgba(239, 68, 68, 0.3); padding: 4px 8px;">
            Delete
          </button>
        </div>
      `).join('') || '<p style="color: var(--slate-400); padding: 10px;">No academic years found.</p>';

      // Delete course handler
      document.querySelectorAll('.delete-course-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          const name = btn.getAttribute('data-name');
          if (confirm(`Are you sure you want to delete the course "${name}"?`)) {
            try {
              await api.deleteCourse(id);
              showToast(`Course "${name}" deleted successfully.`, 'info');
              loadCurriculum();
            } catch (err) {
              showToast(err.message || 'Error deleting course.', 'error');
            }
          }
        });
      });

      // Delete year handler
      document.querySelectorAll('.delete-year-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          const name = btn.getAttribute('data-name');
          if (confirm(`Are you sure you want to delete academic year "${name}"?`)) {
            try {
              await api.deleteAcademicYear(id);
              showToast(`Academic year "${name}" deleted successfully.`, 'info');
              loadCurriculum();
            } catch (err) {
              showToast(err.message || 'Error deleting academic year.', 'error');
            }
          }
        });
      });

    } catch (e) {
      coursesList.innerHTML = `<p style="color: var(--color-danger);">Failed to load courses.</p>`;
      yearsList.innerHTML = `<p style="color: var(--color-danger);">Failed to load academic years.</p>`;
    }
  };

  // Attach Add Course and Add Year Modal Handlers
  const addCourseBtn = document.getElementById('add-course-btn');
  if (addCourseBtn) {
    addCourseBtn.addEventListener('click', () => {
      const content = `
        <div class="form-group">
          <label class="form-label" for="new-course-name">Course Name</label>
          <input type="text" id="new-course-name" class="form-control" placeholder="e.g. B.S. in Software Engineering" required>
        </div>
        <div class="form-group">
          <label class="form-label" for="new-course-code">Course Code</label>
          <input type="text" id="new-course-code" class="form-control" placeholder="e.g. SE-101" required>
        </div>
        <div class="form-group">
          <label class="form-label" for="new-course-dept">Department</label>
          <input type="text" id="new-course-dept" class="form-control" placeholder="e.g. Computer Science & Engineering" required>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div class="form-group">
            <label class="form-label" for="new-course-years">Duration (Years)</label>
            <input type="number" id="new-course-years" class="form-control" value="4" min="1" max="6">
          </div>
          <div class="form-group">
            <label class="form-label" for="new-course-degree">Degree Level</label>
            <select id="new-course-degree" class="form-control">
              <option value="Undergraduate">Undergraduate</option>
              <option value="Postgraduate">Postgraduate</option>
              <option value="Doctorate">Doctorate</option>
            </select>
          </div>
        </div>
      `;

      const footer = `
        <button type="button" class="btn btn-outline" id="cancel-course-modal">Cancel</button>
        <button type="button" class="btn btn-primary" id="save-course-modal">Create Course</button>
      `;

      const { close } = openModal({ title: 'Add Academic Course', contentHtml: content, footerHtml: footer });
      document.getElementById('cancel-course-modal').addEventListener('click', close);
      document.getElementById('save-course-modal').addEventListener('click', async () => {
        const name = document.getElementById('new-course-name').value.trim();
        const code = document.getElementById('new-course-code').value.trim();
        const dept = document.getElementById('new-course-dept').value.trim();
        const duration = parseInt(document.getElementById('new-course-years').value) || 4;
        const degree = document.getElementById('new-course-degree').value;

        if (!name || !code) {
          showToast('Please provide course name and code.', 'error');
          return;
        }

        try {
          await api.createCourse({
            name,
            code,
            department: dept,
            durationYears: duration,
            degreeType: degree,
            isActive: true
          });
          showToast(`Course "${name}" created successfully!`, 'success');
          close();
          loadCurriculum();
        } catch (err) {
          showToast(err.message || 'Failed to create course.', 'error');
        }
      });
    });
  }

  const addYearBtn = document.getElementById('add-year-btn');
  if (addYearBtn) {
    addYearBtn.addEventListener('click', () => {
      const content = `
        <div class="form-group">
          <label class="form-label" for="new-year-name">Academic Year Name</label>
          <input type="text" id="new-year-name" class="form-control" placeholder="e.g. 2026-2027" required>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div class="form-group">
            <label class="form-label" for="new-year-start">Start Date</label>
            <input type="date" id="new-year-start" class="form-control" value="2026-09-01">
          </div>
          <div class="form-group">
            <label class="form-label" for="new-year-end">End Date</label>
            <input type="date" id="new-year-end" class="form-control" value="2027-06-30">
          </div>
        </div>
        <div class="form-group" style="margin-top: 8px;">
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 14px;">
            <input type="checkbox" id="new-year-current">
            <span>Mark as Current Academic Year</span>
          </label>
        </div>
      `;

      const footer = `
        <button type="button" class="btn btn-outline" id="cancel-year-modal">Cancel</button>
        <button type="button" class="btn btn-primary" id="save-year-modal">Create Academic Year</button>
      `;

      const { close } = openModal({ title: 'Add Academic Year', contentHtml: content, footerHtml: footer });
      document.getElementById('cancel-year-modal').addEventListener('click', close);
      document.getElementById('save-year-modal').addEventListener('click', async () => {
        const name = document.getElementById('new-year-name').value.trim();
        const startDate = document.getElementById('new-year-start').value;
        const endDate = document.getElementById('new-year-end').value;
        const isCurrent = document.getElementById('new-year-current').checked;

        if (!name) {
          showToast('Please enter an academic year name.', 'error');
          return;
        }

        if (startDate && endDate && startDate >= endDate) {
          showToast('End Date must be after Start Date.', 'error');
          return;
        }

        try {
          await api.createAcademicYear({
            name,
            startDate,
            endDate,
            isCurrent
          });
          showToast(`Academic Year "${name}" created successfully!`, 'success');
          close();
          loadCurriculum();
        } catch (err) {
          showToast(err.message || 'Failed to create academic year.', 'error');
        }
      });
    });
  }

  const loadAudit = async () => {
    try {
      const res = await api.getAuditLogs(50);
      const logs = res.data || [];

      auditContainer.innerHTML = `
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Action</th>
                <th>Actor Email</th>
                <th>Role</th>
                <th>Target</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${logs.map(l => `
                <tr>
                  <td style="font-size: 12px; color: var(--slate-500);">${l.createdAt ? new Date(l.createdAt).toLocaleString() : ''}</td>
                  <td><code>${escapeHtml(l.action || '')}</code></td>
                  <td>${escapeHtml(l.actorEmail || l.actorId || 'system')}</td>
                  <td><span class="user-role-badge role-${l.actorRole || 'admin'}">${l.actorRole || 'admin'}</span></td>
                  <td>${escapeHtml(l.targetType || '')}:${escapeHtml(l.targetId || '')}</td>
                  <td><span class="badge ${l.status === 'SUCCESS' ? 'badge-emerald' : 'badge-danger'}">${l.status || 'SUCCESS'}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (e) {
      auditContainer.innerHTML = `<p style="color: var(--color-danger);">Failed to load audit trail.</p>`;
    }
  };

  // Initial load
  loadUsers();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

