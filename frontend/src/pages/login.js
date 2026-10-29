/**
 * Login Page Component
 */
import { authState } from '../auth/authContext.js';
import { showToast } from '../components/toast.js';

export function renderLoginPage() {
  return `
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg-page); padding: 20px;">
      <div class="card" style="max-width: 440px; width: 100%; padding: 36px 32px;">
        <div style="text-align: center; margin-bottom: 28px;">
          <a href="#/" class="brand-logo" style="justify-content: center; color: var(--navy-900); margin-bottom: 6px;">
            <span>MyAlumni</span>
            <span class="brand-badge">2.0</span>
          </a>
          <p style="color: var(--slate-500); font-size: 14px;">Sign in to access your role-based dashboard</p>
        </div>

        <form id="login-form">
          <div class="form-group">
            <label class="form-label" for="login-email">Email Address</label>
            <input type="email" id="login-email" class="form-control" placeholder="name@domain.com" required autocomplete="email">
          </div>

          <div class="form-group">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <label class="form-label" for="login-password" style="margin-bottom: 0;">Password</label>
              <a href="#/forgot-password" style="font-size: 12px; font-weight: 600;">Forgot password?</a>
            </div>
            <div style="position: relative;">
              <input type="password" id="login-password" class="form-control" placeholder="••••••••••••" required autocomplete="current-password" style="padding-right: 44px;">
              <button type="button" id="toggle-password-btn" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: var(--slate-400); font-size: 14px;" aria-label="Toggle password visibility">
                👁
              </button>
            </div>
          </div>

          <button type="submit" id="login-submit-btn" class="btn btn-primary" style="width: 100%; margin-top: 10px; padding: 11px;">
            Sign In
          </button>
        </form>

        <!-- Quick Demo Accounts (No Authentication Required) -->
        <div style="margin-top: 28px; border-top: 1px solid var(--border-color); padding-top: 20px;">
          <div style="font-size: 12px; font-weight: 700; color: var(--teal-700); text-transform: uppercase; margin-bottom: 12px; text-align: center;">
            ✦ Instant 1-Click Demo Login (No Auth Required)
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <button type="button" class="btn btn-navy btn-sm demo-login-btn" data-role="admin">
              🛡️ Admin Demo
            </button>
            <button type="button" class="btn btn-navy btn-sm demo-login-btn" data-role="faculty">
              🎓 Faculty Demo
            </button>
            <button type="button" class="btn btn-navy btn-sm demo-login-btn" data-role="student">
              👨‍🎓 Student Demo
            </button>
            <button type="button" class="btn btn-navy btn-sm demo-login-btn" data-role="alumni">
              💼 Alumni Demo
            </button>
          </div>
          <p style="font-size: 11px; color: var(--slate-400); margin-top: 10px; text-align: center;">
            Click any demo role above to sign in immediately without password or authentication.
          </p>
        </div>

        <div style="margin-top: 24px; text-align: center; font-size: 13px; color: var(--slate-600);">
          Don't have an account? <a href="#/register" style="font-weight: 600;">Register here</a>
        </div>
      </div>
    </div>
  `;
}

export function initLoginPage() {
  const form = document.getElementById('login-form');
  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');
  const toggleBtn = document.getElementById('toggle-password-btn');
  const submitBtn = document.getElementById('login-submit-btn');

  if (toggleBtn && passwordInput) {
    toggleBtn.addEventListener('click', () => {
      const isPwd = passwordInput.type === 'password';
      passwordInput.type = isPwd ? 'text' : 'password';
      toggleBtn.textContent = isPwd ? '🔒' : '👁';
    });
  }

  // 1-Click Instant Demo Login (No authentication required)
  document.querySelectorAll('.demo-login-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const role = btn.getAttribute('data-role');
      btn.disabled = true;
      btn.textContent = 'Signing In...';
      try {
        await authState.demoLogin(role);
        showToast(`Instant access granted as ${role.toUpperCase()} Demo!`, 'success');
        window.location.hash = '#/dashboard';
      } catch (err) {
        showToast(err.message || 'Demo login failed.', 'error');
        btn.disabled = false;
        btn.textContent = `${role.toUpperCase()} Demo`;
      }
    });
  });

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = emailInput.value.trim().toLowerCase();
      const password = passwordInput.value;

      submitBtn.disabled = true;
      submitBtn.textContent = 'Authenticating...';

      // If demo email or role, bypass password auth completely
      if (email.includes('demo') || email.includes('myalumni') || ['admin', 'faculty', 'student', 'alumni'].includes(email)) {
        try {
          await authState.demoLogin(email);
          showToast('Signed in successfully with demo account!', 'success');
          window.location.hash = '#/dashboard';
          return;
        } catch (err) {
          showToast(err.message || 'Demo login failed.', 'error');
          submitBtn.disabled = false;
          submitBtn.textContent = 'Sign In';
          return;
        }
      }

      if (!email || !password) {
        showToast('Please enter both email and password.', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In';
        return;
      }

      try {
        await authState.login(email, password);
        showToast('Authentication successful. Welcome!', 'success');
        window.location.hash = '#/dashboard';
      } catch (err) {
        console.error('Login error:', err);
        showToast(err.message || 'Authentication failed. Please check your credentials.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In';
      }
    });
  }
}

