/**
 * Student-to-Alumni Promotion Tool (Faculty & Admin)
 */
import { api } from '../services/api.js';
import { showToast } from '../components/toast.js';

export async function renderPromotionPage() {
  return `
    <div>
      <div style="margin-bottom: 24px;">
        <h1 style="font-size: 24px; font-weight: 800; color: var(--navy-900);">Student-to-Alumni Promotion Desk</h1>
        <p style="color: var(--slate-500); font-size: 14px;">Authorize graduating seniors for promotion into the verified Alumni network.</p>
      </div>

      <div class="card" style="max-width: 600px;">
        <h2 class="card-title" style="margin-bottom: 16px;">Promote Student to Alumni Status</h2>
        <form id="promotion-form">
          <div class="form-group">
            <label class="form-label" for="promo-student-id">Select Student</label>
            <select id="promo-student-id" class="form-control" required>
              <option value="">-- Choose registered student --</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" for="promo-year">Graduation Year</label>
            <input type="number" id="promo-year" class="form-control" value="2026" required>
          </div>

          <div class="form-group">
            <label class="form-label" for="promo-company">Placed Company / Organization</label>
            <input type="text" id="promo-company" class="form-control" placeholder="e.g. Apex Technologies">
          </div>

          <div class="form-group">
            <label class="form-label" for="promo-role">Job Title / Designation</label>
            <input type="text" id="promo-role" class="form-control" placeholder="e.g. Associate Cloud Engineer">
          </div>

          <button type="submit" id="promo-submit-btn" class="btn btn-primary" style="width: 100%; margin-top: 10px;">
            Confirm Promotion to Alumni
          </button>
        </form>
      </div>
    </div>
  `;
}

export async function initPromotionPage() {
  const form = document.getElementById('promotion-form');
  const studentSelect = document.getElementById('promo-student-id');
  const submitBtn = document.getElementById('promo-submit-btn');

  // Load students
  try {
    const res = await api.getAdminUsers();
    const users = res.data || [];
    const students = users.filter(u => u.role === 'student');

    studentSelect.innerHTML = `
      <option value="">-- Choose registered student (${students.length} found) --</option>
      ${students.map(s => `
        <option value="${s.id}">${escapeHtml(s.displayName || 'Student')} (${escapeHtml(s.email || '')})</option>
      `).join('')}
    `;
  } catch (e) {
    studentSelect.innerHTML = `<option value="">Failed to load students</option>`;
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const studentId = studentSelect.value;
      const graduationYear = document.getElementById('promo-year').value;
      const company = document.getElementById('promo-company').value.trim();
      const jobTitle = document.getElementById('promo-role').value.trim();

      if (!studentId || !graduationYear) {
        showToast('Please select a student and graduation year.', 'error');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Processing Promotion...';

      try {
        await api.promoteToAlumni({ studentId, graduationYear, company, jobTitle });
        showToast('Student successfully promoted to Alumni network!', 'success');
        form.reset();
      } catch (err) {
        showToast(err.message || 'Promotion failed.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Confirm Promotion to Alumni';
      }
    });
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

