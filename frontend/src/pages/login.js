/** Email OTP sign-in: no password-reset link or password login UI. */
import { authState } from '../auth/authContext.js';
import { api } from '../services/api.js';
import { showToast } from '../components/toast.js';

export function renderLoginPage() {
  return `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg-page);padding:20px">
      <div class="card" style="max-width:440px;width:100%;padding:36px 32px">
        <div style="text-align:center;margin-bottom:24px">
          <a href="#/" class="brand-logo" style="justify-content:center;color:var(--navy-900);margin-bottom:6px"><span>MyAlumni</span><span class="brand-badge">2.0</span></a>
          <h2 style="font-size:20px;color:var(--navy-900)">Sign in with email OTP</h2>
          <p style="color:var(--slate-500);font-size:13px">We will email you a six-digit verification code.</p>
        </div>
        <form id="otp-login-form">
          <div class="form-group"><label class="form-label" for="login-email">Email Address</label><input type="email" id="login-email" class="form-control" autocomplete="email" required placeholder="name@domain.com"></div>
          <div class="form-group" id="login-code-wrap" style="display:none"><label class="form-label" for="login-code">Six-digit code</label><input inputmode="numeric" pattern="[0-9]{6}" maxlength="6" id="login-code" class="form-control" autocomplete="one-time-code" placeholder="000000"></div>
          <button type="submit" id="login-submit-btn" class="btn btn-primary" style="width:100%;padding:11px">Send verification code</button>
          <button type="button" id="login-resend-btn" class="btn btn-outline" style="width:100%;margin-top:8px;display:none">Resend code</button>
        </form>
        <div style="margin-top:18px;text-align:center;font-size:13px;color:var(--slate-600)"><a href="#/forgot-password">Forgot password?</a> · <a href="#/register">Create account</a></div>
        <div style="margin-top:24px;border-top:1px solid var(--border-color);padding-top:18px">
          <p style="font-size:12px;text-align:center;color:var(--slate-500);margin-bottom:10px">Demo account emails (must be provisioned in Firebase)</p>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            <button type="button" class="btn btn-outline btn-sm demo-fill" data-email="admin.demo@myalumni.test">Admin demo</button>
            <button type="button" class="btn btn-outline btn-sm demo-fill" data-email="faculty.demo@myalumni.test">Faculty demo</button>
            <button type="button" class="btn btn-outline btn-sm demo-fill" data-email="student.demo@myalumni.test">Student demo</button>
            <button type="button" class="btn btn-outline btn-sm demo-fill" data-email="alumni.demo@myalumni.test">Alumni demo</button>
          </div>
        </div>
      </div>
    </div>`;
}

export function initLoginPage() {
  const form=document.getElementById('otp-login-form');
  const email=document.getElementById('login-email');
  const code=document.getElementById('login-code');
  const codeWrap=document.getElementById('login-code-wrap');
  const submit=document.getElementById('login-submit-btn');
  const resend=document.getElementById('login-resend-btn');
  let stage='request';
  document.querySelectorAll('.demo-fill').forEach(b=>b.addEventListener('click',()=>{email.value=b.dataset.email;}));
  const requestCode=async()=>{
    const address=email.value.trim().toLowerCase();
    if(!address){showToast('Enter your email address.','error');return;}
    submit.disabled=true;
    try{
      await api.requestOtp(address,'login');
      stage='verify'; codeWrap.style.display='block'; resend.style.display='block';
      code.required=true; submit.textContent='Verify code and sign in';
      showToast('If this account is eligible and email is configured, a code has been sent.','success');
    }catch(e){showToast(e.message||'Could not send code. Check Firebase and SMTP configuration.','error');}
    finally{submit.disabled=false;}
  };
  resend.addEventListener('click',requestCode);
  form.addEventListener('submit',async e=>{
    e.preventDefault();
    if(stage==='request'){await requestCode();return;}
    if(!/^[0-9]{6}$/.test(code.value.trim())){showToast('Enter the six-digit code.','error');return;}
    submit.disabled=true;submit.textContent='Verifying...';
    try{await authState.loginWithOtp(email.value.trim().toLowerCase(),code.value.trim());showToast('Signed in successfully.','success');window.location.hash='#/dashboard';}
    catch(err){showToast(err.message||'Code verification failed.','error');}
    finally{submit.disabled=false;submit.textContent='Verify code and sign in';}
  });
}
