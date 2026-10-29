/**
 * Forgot Password Page Component
 */
import { firebaseSendPasswordReset } from '../config/firebase.js';
import { showToast } from '../components/toast.js';

export function renderForgotPasswordPage() {
  return `
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg-page); padding: 20px;">
      <div class="card" style="max-width: 440px; width: 100%; padding: 36px 32px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <a href="#/" class="brand-logo" style="justify-content: center; color: var(--navy-900); margin-bottom: 6px;">
            <span>MyAlumni</span>
            <span class="brand-badge">2.0</span>
          </a>
          <h2 style="font-size: 20px; font-weight: 700; color: var(--navy-900); margin-top: 8px;">Reset Password</h2>
          <p style="color: var(--slate-500); font-size: 13px; margin-top: 4px;">
            Enter your account email to receive a secure password reset link via Firebase Authentication.
          </p>
        </div>

        <form id="reset-form">
          <div class="form-group">
            <label class="form-label" for="reset-email">Account Email</label>
            <input type="email" id="reset-email" class="form-control" placeholder="name@domain.com" required autocomplete="email">
          </div>

          <button type="submit" id="reset-submit-btn" class="btn btn-primary" style="width: 100%; padding: 11px;">
            Send Password Reset Link
          </button>
        </form>

        <div id="reset-confirmation" style="display: none; margin-top: 20px; padding: 16px; background: var(--teal-50); border: 1px solid var(--teal-100); border-radius: var(--radius-md); text-align: center;">
          <div style="color: var(--teal-700); font-weight: 700; font-size: 14px; margin-bottom: 4px;">Reset Email Dispatched</div>
          <p style="font-size: 13px; color: var(--slate-600); line-height: 1.5;">
            If an account exists for this address, a password reset link has been dispatched. Please check your inbox and spam folder.
          </p>
        </div>

        <div style="margin-top: 24px; text-align: center; font-size: 13px; color: var(--slate-600);">
          Remembered your password? <a href="#/login" style="font-weight: 600;">Back to sign in</a>
        </div>
      </div>
    </div>
  `;
}

export function initForgotPasswordPage() {
  const form = document.getElementById('reset-form');
  const emailInput = document.getElementById('reset-email');
  const submitBtn = document.getElementById('reset-submit-btn');
  const confirmBox = document.getElementById('reset-confirmation');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = emailInput.value.trim();

      if (!email) {
        showToast('Please enter your email address.', 'error');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Processing...';

      try {
        await firebaseSendPasswordReset(email);
        confirmBox.style.display = 'block';
        showToast('Password reset link requested successfully.', 'success');
        form.style.display = 'none';
      } catch (err) {
        console.error('Password reset error:', err);
        showToast(err.message || 'Could not process password reset. Please try again.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Password Reset Link';
      }
    });
  }
}

