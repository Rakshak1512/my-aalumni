/**
 * Registration Page Component
 */
import { authState } from '../auth/authContext.js';
import { showToast } from '../components/toast.js';

export function renderRegisterPage() {
  return `
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg-page); padding: 20px;">
      <div class="card" style="max-width: 480px; width: 100%; padding: 36px 32px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <a href="#/" class="brand-logo" style="justify-content: center; color: var(--navy-900); margin-bottom: 6px;">
            <span>MyAlumni</span>
            <span class="brand-badge">2.0</span>
          </a>
          <p style="color: var(--slate-500); font-size: 14px;">Create your verified portal account</p>
        </div>

        <form id="register-form">
          <div class="form-group">
            <label class="form-label" for="reg-name">Full Name</label>
            <input type="text" id="reg-name" class="form-control" placeholder="Alex Chen" required>
          </div>

          <div class="form-group">
            <label class="form-label" for="reg-email">Email Address</label>
            <input type="email" id="reg-email" class="form-control" placeholder="alex.chen@university.edu" required>
          </div>

          <div class="form-group">
            <label class="form-label" for="reg-role">I am registering as</label>
            <select id="reg-role" class="form-control" required>
              <option value="student" selected>Student (Undergraduate / Postgraduate)</option>
              <option value="alumni">Alumnus / Alumna (Graduated)</option>
            </select>
          </div>

          <div class="form-group" id="student-extra-fields">
            <label class="form-label" for="reg-course">Academic Course</label>
            <input type="text" id="reg-course" class="form-control" placeholder="B.S. in Computer Science">
          </div>

          <div class="form-group" id="alumni-extra-fields" style="display: none;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div>
                <label class="form-label" for="reg-grad-year">Graduation Year</label>
                <input type="number" id="reg-grad-year" class="form-control" placeholder="2022">
              </div>
              <div>
                <label class="form-label" for="reg-company">Current Company</label>
                <input type="text" id="reg-company" class="form-control" placeholder="Apex Tech">
              </div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="reg-password">Password</label>
            <input type="password" id="reg-password" class="form-control" placeholder="Minimum 8 characters" required minlength="8">
          </div>

          <button type="submit" id="reg-submit-btn" class="btn btn-primary" style="width: 100%; margin-top: 10px; padding: 11px;">
            Create Account
          </button>
        </form>

        <div style="margin-top: 24px; text-align: center; font-size: 13px; color: var(--slate-600);">
          Already have an account? <a href="#/login" style="font-weight: 600;">Sign in here</a>
        </div>
      </div>
    </div>
  `;
}

export function initRegisterPage() {
  const form = document.getElementById('register-form');
  const roleSelect = document.getElementById('reg-role');
  const studentFields = document.getElementById('student-extra-fields');
  const alumniFields = document.getElementById('alumni-extra-fields');
  const submitBtn = document.getElementById('reg-submit-btn');

  if (roleSelect) {
    roleSelect.addEventListener('change', () => {
      const isAlumni = roleSelect.value === 'alumni';
      studentFields.style.display = isAlumni ? 'none' : 'block';
      alumniFields.style.display = isAlumni ? 'block' : 'none';
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('reg-name').value.trim();
      const email = document.getElementById('reg-email').value.trim();
      const role = roleSelect.value;
      const password = document.getElementById('reg-password').value;

      let extraProfile = {};
      if (role === 'student') {
        extraProfile.courseName = document.getElementById('reg-course').value.trim() || 'General Studies';
      } else {
        extraProfile.graduationYear = document.getElementById('reg-grad-year').value.trim() || '2023';
        extraProfile.company = document.getElementById('reg-company').value.trim() || 'Independent';
        extraProfile.isMentoringAvailable = false;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Creating Account...';

      try {
        await authState.register(email, password, name, role, extraProfile);
        showToast('Registration complete! Welcome to MyAlumni.', 'success');
        window.location.hash = '#/dashboard';
      } catch (err) {
        console.error('Registration error:', err);
        showToast(err.message || 'Registration failed. Please verify your details.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Account';
      }
    });
  }
}

