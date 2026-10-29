/**
 * Role-Based Dashboard Component
 */
import { authState } from '../auth/authContext.js';
import { api } from '../services/api.js';
import { showToast } from '../components/toast.js';

export async function renderDashboardPage() {
  const user = authState.user;
  const role = (authState.role || 'student').toLowerCase();
  const displayName = user?.displayName || 'User';

  if (role === 'admin') {
    return await renderAdminDashboard(displayName);
  } else if (role === 'faculty') {
    return await renderFacultyDashboard(displayName, user);
  } else if (role === 'alumni') {
    return await renderAlumniDashboard(displayName, user);
  } else {
    return await renderStudentDashboard(displayName, user);
  }
}

// Student Dashboard
async function renderStudentDashboard(displayName, user) {
  let stats = { connections: 0, mentorships: 0, applications: 0, events: 0 };
  let opportunities = [];
  let birthdays = { today: [], upcoming: [] };
  let goals = [];

  try {
    const [cRes, mRes, aRes, eRes, oRes, bRes, gRes] = await Promise.all([
      api.getConnections().catch(() => ({ data: [] })),
      api.getMentorships().catch(() => ({ data: [] })),
      api.getApplications().catch(() => ({ data: [] })),
      api.getMyRegistrations().catch(() => ({ data: [] })),
      api.getOpportunities().catch(() => ({ data: [] })),
      api.getBirthdays().catch(() => ({ data: { today: [], upcoming: [] } })),
      api.getGoals().catch(() => ({ data: [] }))
    ]);

    stats.connections = cRes.data?.filter(c => c.status === 'accepted').length || 0;
    stats.mentorships = mRes.data?.filter(m => m.status === 'accepted').length || 0;
    stats.applications = aRes.data?.length || 0;
    stats.events = eRes.data?.length || 0;
    opportunities = oRes.data?.slice(0, 3) || [];
    birthdays = bRes.data || { today: [], upcoming: [] };
    goals = gRes.data?.slice(0, 2) || [];
  } catch (e) {
    console.warn('Dashboard fetch warning:', e);
  }

  const courseName = user?.profile?.courseName || 'Computer Science & Engineering';

  return `
    <div>
      <!-- Banner -->
      <div class="card" style="background: linear-gradient(135deg, var(--navy-900), var(--navy-800)); color: #ffffff; margin-bottom: 24px; padding: 28px;">
        <span class="user-role-badge role-student" style="margin-bottom: 10px;">Student Portal</span>
        <h1 style="color: #ffffff; font-size: 26px; margin-bottom: 6px;">Welcome back, ${escapeHtml(displayName)}!</h1>
        <p style="color: var(--teal-100); font-size: 14px;">${escapeHtml(courseName)} • Ready to network and accelerate your career trajectory.</p>
      </div>

      <!-- Stat Cards -->
      <div class="stat-grid">
        <div class="stat-card">
          <div>
            <div class="stat-label">Active Connections</div>
            <div class="stat-value">${stats.connections}</div>
          </div>
          <div class="stat-icon">👥</div>
        </div>

        <div class="stat-card">
          <div>
            <div class="stat-label">Mentorships</div>
            <div class="stat-value">${stats.mentorships}</div>
          </div>
          <div class="stat-icon">🎯</div>
        </div>

        <div class="stat-card">
          <div>
            <div class="stat-label">Applications Tracked</div>
            <div class="stat-value">${stats.applications}</div>
          </div>
          <div class="stat-icon">💼</div>
        </div>

        <div class="stat-card">
          <div>
            <div class="stat-label">Registered Events</div>
            <div class="stat-value">${stats.events}</div>
          </div>
          <div class="stat-icon">📅</div>
        </div>
      </div>

      <!-- Main Layout -->
      <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 24px;">
        <!-- Left: Opportunities & Career Goals -->
        <div style="display: flex; flex-direction: column; gap: 24px;">
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Recent Approved Opportunities</h3>
              <a href="#/opportunities" class="btn btn-outline btn-sm">View All</a>
            </div>
            ${opportunities.length === 0 ? `
              <div class="empty-state">
                <div class="empty-state-title">No opportunities found</div>
                <p>New approved jobs and internships will appear here.</p>
              </div>
            ` : `
              <div style="display: flex; flex-direction: column; gap: 12px;">
                ${opportunities.map(opp => `
                  <div style="border: 1px solid var(--border-color); padding: 14px; border-radius: var(--radius-md); display: flex; justify-content: space-between; align-items: center;">
                    <div>
                      <div style="font-weight: 700; color: var(--navy-900); font-size: 15px;">${escapeHtml(opp.title)}</div>
                      <div style="font-size: 13px; color: var(--slate-500);">${escapeHtml(opp.company)} • ${escapeHtml(opp.location)}</div>
                    </div>
                    <span class="badge badge-teal">${opp.type}</span>
                  </div>
                `).join('')}
              </div>
            `}
          </div>

          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Career Goals & Progress</h3>
              <a href="#/career-tracker" class="btn btn-outline btn-sm">Manage Goals</a>
            </div>
            ${goals.length === 0 ? `
              <div class="empty-state">
                <div class="empty-state-title">No active career goals set</div>
                <p>Track your milestones and get transparent roadmaps in the Career Tracker.</p>
              </div>
            ` : `
              <div style="display: flex; flex-direction: column; gap: 16px;">
                ${goals.map(g => `
                  <div>
                    <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: 600; margin-bottom: 4px;">
                      <span>${escapeHtml(g.title)}</span>
                      <span style="color: var(--teal-600);">${g.progressPercentage || 0}%</span>
                    </div>
                    <div class="progress-container">
                      <div class="progress-bar" style="width: ${g.progressPercentage || 0}%;"></div>
                    </div>
                  </div>
                `).join('')}
              </div>
            `}
          </div>
        </div>

        <!-- Right: Birthdays & Shortcuts -->
        <div style="display: flex; flex-direction: column; gap: 24px;">
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Birthday Corner 🎂</h3>
              <a href="#/birthdays" class="btn btn-outline btn-sm">All</a>
            </div>
            ${birthdays.today.length > 0 ? `
              <div style="background: var(--teal-50); border: 1px solid var(--teal-100); padding: 14px; border-radius: var(--radius-md); margin-bottom: 12px;">
                <div style="font-weight: 700; color: var(--teal-700); font-size: 13px; margin-bottom: 4px;">Celebrating Today!</div>
                ${birthdays.today.map(b => `
                  <div style="font-weight: 600; font-size: 14px; color: var(--navy-900);">${escapeHtml(b.displayName)} (${escapeHtml(b.company || 'Alumnus')})</div>
                `).join('')}
              </div>
            ` : `
              <p style="font-size: 13px; color: var(--slate-500); margin-bottom: 12px;">No alumni birthdays today.</p>
            `}
            <a href="#/birthdays" class="btn btn-outline btn-sm" style="width: 100%;">View Upcoming Birthdays</a>
          </div>

          <div class="card">
            <h3 class="card-title" style="margin-bottom: 14px;">Quick Actions</h3>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              <a href="#/directory" class="btn btn-outline btn-sm" style="justify-content: flex-start;">🔍 Search Alumni Directory</a>
              <a href="#/career-guide" class="btn btn-outline btn-sm" style="justify-content: flex-start;">🧭 Rule-Based Career Guide</a>
              <a href="#/batches" class="btn btn-outline btn-sm" style="justify-content: flex-start;">🎓 Class Batch Community</a>
              <a href="#/contact-admin" class="btn btn-outline btn-sm" style="justify-content: flex-start;">✉️ Contact Administration</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Alumni Dashboard
async function renderAlumniDashboard(displayName, user) {
  const prof = user?.profile || {};
  const isAvailable = prof.isMentoringAvailable !== false;
  const currentMentees = prof.currentMenteesCount || 0;
  const maxMentees = prof.maxMentees || 4;

  return `
    <div>
      <div class="card" style="background: linear-gradient(135deg, #064e3b, #047857); color: #ffffff; margin-bottom: 24px; padding: 28px;">
        <span class="user-role-badge role-alumni" style="margin-bottom: 10px;">Alumni Portal</span>
        <h1 style="color: #ffffff; font-size: 26px; margin-bottom: 6px;">Welcome back, ${escapeHtml(displayName)}!</h1>
        <p style="color: var(--emerald-100); font-size: 14px;">
          ${escapeHtml(prof.jobTitle || 'Alumnus')} at ${escapeHtml(prof.company || 'Tech Industry')} • Class of ${prof.graduationYear || '2021'}
        </p>
      </div>

      <div class="stat-grid">
        <div class="stat-card">
          <div>
            <div class="stat-label">Mentorship Status</div>
            <div class="stat-value" style="font-size: 20px; color: ${isAvailable ? 'var(--emerald-600)' : 'var(--slate-500)'};">
              ${isAvailable ? 'AVAILABLE' : 'PAUSED'}
            </div>
          </div>
          <div class="stat-icon">🎯</div>
        </div>

        <div class="stat-card">
          <div>
            <div class="stat-label">Active Mentees</div>
            <div class="stat-value">${currentMentees} / ${maxMentees}</div>
          </div>
          <div class="stat-icon">👨‍🎓</div>
        </div>

        <div class="stat-card">
          <div>
            <div class="stat-label">Direct Messages</div>
            <div class="stat-value"><a href="#/messages" style="color: inherit;">Inbox</a></div>
          </div>
          <div class="stat-icon">💬</div>
        </div>

        <div class="stat-card">
          <div>
            <div class="stat-label">Reunion Events</div>
            <div class="stat-value"><a href="#/events" style="color: inherit;">Calendar</a></div>
          </div>
          <div class="stat-icon">📅</div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 24px;">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Alumni Contributions & Actions</h3>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <a href="#/opportunities" class="card" style="text-align: center; border: 1px dashed var(--teal-600); text-decoration: none;">
              <div style="font-size: 28px; margin-bottom: 8px;">💼</div>
              <div style="font-weight: 700; color: var(--navy-900);">Post Job / Referral</div>
              <p style="font-size: 12px; color: var(--slate-500); margin-top: 4px;">Share opportunities with verified students</p>
            </a>

            <a href="#/achievements" class="card" style="text-align: center; border: 1px dashed var(--emerald-600); text-decoration: none;">
              <div style="font-size: 28px; margin-bottom: 8px;">🏆</div>
              <div style="font-weight: 700; color: var(--navy-900);">Submit Achievement</div>
              <p style="font-size: 12px; color: var(--slate-500); margin-top: 4px;">Share your promotion or milestone</p>
            </a>
          </div>
        </div>

        <div class="card">
          <h3 class="card-title" style="margin-bottom: 14px;">Mentorship Preferences</h3>
          <p style="font-size: 13px; color: var(--slate-600); margin-bottom: 16px;">Toggle your availability to accept student mentorship requests.</p>
          <a href="#/mentorship" class="btn btn-primary" style="width: 100%;">Manage Mentorship Settings</a>
        </div>
      </div>
    </div>
  `;
}

// Faculty Dashboard
async function renderFacultyDashboard(displayName, user) {
  let pendingOpps = 0;
  let pendingAch = 0;
  try {
    const [oRes, aRes] = await Promise.all([
      api.getPendingOpportunities().catch(() => ({ data: [] })),
      api.getPendingAchievements().catch(() => ({ data: [] }))
    ]);
    pendingOpps = oRes.data?.length || 0;
    pendingAch = aRes.data?.length || 0;
  } catch (e) {}

  return `
    <div>
      <div class="card" style="background: linear-gradient(135deg, #78350f, #b45309); color: #ffffff; margin-bottom: 24px; padding: 28px;">
        <span class="user-role-badge role-faculty" style="margin-bottom: 10px;">Faculty Portal</span>
        <h1 style="color: #ffffff; font-size: 26px; margin-bottom: 6px;">Welcome back, ${escapeHtml(displayName)}!</h1>
        <p style="color: #fef3c7; font-size: 14px;">Department Administration, Resource Curation & Moderation Console</p>
      </div>

      <div class="stat-grid">
        <div class="stat-card">
          <div>
            <div class="stat-label">Pending Opportunities</div>
            <div class="stat-value" style="color: var(--color-warning);">${pendingOpps}</div>
          </div>
          <div class="stat-icon">💼</div>
        </div>

        <div class="stat-card">
          <div>
            <div class="stat-label">Pending Achievements</div>
            <div class="stat-value" style="color: var(--color-warning);">${pendingAch}</div>
          </div>
          <div class="stat-icon">🏆</div>
        </div>

        <div class="stat-card">
          <div>
            <div class="stat-label">Student Directory</div>
            <div class="stat-value"><a href="#/directory" style="color: inherit;">Inspect</a></div>
          </div>
          <div class="stat-icon">👥</div>
        </div>

        <div class="stat-card">
          <div>
            <div class="stat-label">Academic Resources</div>
            <div class="stat-value"><a href="#/resources" style="color: inherit;">Manage</a></div>
          </div>
          <div class="stat-icon">📚</div>
        </div>
      </div>

      <div class="card">
        <h3 class="card-title" style="margin-bottom: 16px;">Administrative & Academic Actions</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px;">
          <a href="#/faculty/moderation" class="btn btn-navy" style="padding: 14px;">🛡️ Moderation Queue (${pendingOpps + pendingAch} Pending)</a>
          <a href="#/faculty/promotion" class="btn btn-outline" style="padding: 14px;">🎓 Student to Alumni Promotion</a>
          <a href="#/resources" class="btn btn-outline" style="padding: 14px;">📤 Upload Academic Notes / Papers</a>
          <a href="#/resources" class="btn btn-outline" style="padding: 14px;">📢 Post Official Announcement</a>
        </div>
      </div>
    </div>
  `;
}

// Admin Dashboard
async function renderAdminDashboard(displayName) {
  let stats = { totalUsers: 0, openTickets: 0, pendingOpps: 0, pendingAch: 0, approvedEvents: 0 };
  let fbStatus = { initialized: false };

  try {
    const [sRes, fbRes] = await Promise.all([
      api.getAdminStats().catch(() => ({ data: {} })),
      api.checkFirebaseHealth().catch(() => ({ data: { initialized: false } }))
    ]);
    stats = sRes.data || stats;
    fbStatus = fbRes.data || fbStatus;
  } catch (e) {}

  return `
    <div>
      <div class="card" style="background: linear-gradient(135deg, var(--navy-950), #1e1e2f); color: #ffffff; margin-bottom: 24px; padding: 28px;">
        <span class="user-role-badge role-admin" style="margin-bottom: 10px;">Administrator Overseer</span>
        <h1 style="color: #ffffff; font-size: 26px; margin-bottom: 6px;">Chief Administrative Console</h1>
        <p style="color: var(--teal-100); font-size: 14px;">System governance, Firebase persistence oversight, user roles & audit security.</p>
      </div>

      <!-- Cloud Health Indicator -->
      <div class="card" style="margin-bottom: 24px; background: ${fbStatus.initialized ? 'var(--emerald-50)' : '#fff1f2'}; border-color: ${fbStatus.initialized ? 'var(--emerald-100)' : '#fecdd3'}; padding: 16px 20px;">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 20px;">${fbStatus.initialized ? '🟢' : '🔴'}</span>
            <div>
              <div style="font-weight: 700; color: ${fbStatus.initialized ? 'var(--emerald-700)' : 'var(--color-danger)'};">
                Cloud Firestore & Firebase Admin: ${fbStatus.initialized ? 'CONNECTED & OPERATIONAL' : 'CONFIGURATION NEEDED'}
              </div>
              <div style="font-size: 12px; color: var(--slate-600);">
                Project ID: <code>${fbStatus.project_id || 'Not Set'}</code> • Service Account File: <code>${fbStatus.credentials_path || 'firebase-service-account.json'}</code>
              </div>
            </div>
          </div>
          <a href="#/admin" class="btn btn-outline btn-sm">Inspect Status</a>
        </div>
      </div>

      <!-- System KPIs -->
      <div class="stat-grid">
        <div class="stat-card">
          <div>
            <div class="stat-label">Total Registered Users</div>
            <div class="stat-value">${stats.totalUsers || 4}</div>
          </div>
          <div class="stat-icon">👥</div>
        </div>

        <div class="stat-card">
          <div>
            <div class="stat-label">Open Support Tickets</div>
            <div class="stat-value" style="color: ${stats.openSupportTickets > 0 ? 'var(--color-danger)' : 'inherit'};">
              ${stats.openSupportTickets || 0}
            </div>
          </div>
          <div class="stat-icon">🎫</div>
        </div>

        <div class="stat-card">
          <div>
            <div class="stat-label">Pending Moderation</div>
            <div class="stat-value" style="color: var(--color-warning);">
              ${(stats.pendingOpportunities || 0) + (stats.pendingAchievements || 0)}
            </div>
          </div>
          <div class="stat-icon">🛡️</div>
        </div>

        <div class="stat-card">
          <div>
            <div class="stat-label">Published Events</div>
            <div class="stat-value">${stats.approvedEvents || 2}</div>
          </div>
          <div class="stat-icon">📅</div>
        </div>
      </div>

      <!-- Core Admin Sections -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
        <div class="card">
          <h3 class="card-title" style="margin-bottom: 12px;">Governance Controls</h3>
          <div style="display: flex; flex-direction: column; gap: 10px;">
            <a href="#/admin/users" class="btn btn-navy" style="justify-content: flex-start;">👥 Manage Users, Elevate Roles & Suspensions</a>
            <a href="#/admin/tickets" class="btn btn-outline" style="justify-content: flex-start;">🎫 Support Tickets & Inquiries (SMTP Response)</a>
            <a href="#/admin/audit-logs" class="btn btn-outline" style="justify-content: flex-start;">📜 Immutable Security Audit Trail</a>
          </div>
        </div>

        <div class="card">
          <h3 class="card-title" style="margin-bottom: 12px;">Curriculum & Structure</h3>
          <div style="display: flex; flex-direction: column; gap: 10px;">
            <a href="#/admin" class="btn btn-outline" style="justify-content: flex-start;">🏛️ Manage Academic Degrees & Courses</a>
            <a href="#/admin" class="btn btn-outline" style="justify-content: flex-start;">📅 Configure Academic Cohort Years</a>
            <a href="#/batches" class="btn btn-outline" style="justify-content: flex-start;">🎓 Verified Class Batch Communities</a>
          </div>
        </div>
      </div>
    </div>
  `;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

