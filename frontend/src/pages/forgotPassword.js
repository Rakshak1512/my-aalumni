/** Password reset using a six-digit email OTP; no reset link. */
import { api } from '../services/api.js';
import { firebaseSignInWithCustomToken } from '../config/firebase.js';
import { showToast } from '../components/toast.js';

export function renderForgotPasswordPage() {
 return `<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg-page);padding:20px"><div class="card" style="max-width:440px;width:100%;padding:36px 32px">
 <div style="text-align:center;margin-bottom:24px"><a href="#/" class="brand-logo" style="justify-content:center;color:var(--navy-900)"><span>MyAlumni</span><span class="brand-badge">2.0</span></a><h2 style="margin-top:12px">Reset Password</h2><p style="color:var(--slate-500);font-size:13px">Verify your email with a six-digit code, then choose a new password.</p></div>
 <form id="reset-otp-form"><div class="form-group"><label class="form-label" for="reset-email">Account email</label><input id="reset-email" type="email" class="form-control" autocomplete="email" required></div>
 <div class="form-group" id="reset-code-wrap" style="display:none"><label class="form-label" for="reset-code">Six-digit code</label><input id="reset-code" class="form-control" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" autocomplete="one-time-code"></div>
 <div class="form-group" id="reset-password-wrap" style="display:none"><label class="form-label" for="reset-new-password">New password</label><input id="reset-new-password" type="password" class="form-control" minlength="8" autocomplete="new-password"></div>
 <button id="reset-submit-btn" type="submit" class="btn btn-primary" style="width:100%;padding:11px">Send six-digit code</button><button id="reset-resend-btn" type="button" class="btn btn-outline" style="width:100%;margin-top:8px;display:none">Resend code</button></form>
 <div style="margin-top:24px;text-align:center;font-size:13px"><a href="#/login">Back to sign in</a></div></div></div>`;
}
export function initForgotPasswordPage(){
 const form=document.getElementById('reset-otp-form'),email=document.getElementById('reset-email'),code=document.getElementById('reset-code'),pw=document.getElementById('reset-new-password'),btn=document.getElementById('reset-submit-btn'),resend=document.getElementById('reset-resend-btn');
 const codeWrap=document.getElementById('reset-code-wrap'),pwWrap=document.getElementById('reset-password-wrap');let stage=0;
 const request=async()=>{if(!email.value.trim()){showToast('Enter your email.','error');return;}btn.disabled=true;try{await api.requestOtp(email.value.trim().toLowerCase(),'reset');stage=1;codeWrap.style.display='block';resend.style.display='block';code.required=true;btn.textContent='Verify code and reset password';showToast('If the account is eligible and SMTP is configured, a code has been sent.','success');}catch(e){showToast(e.message||'Could not send verification code.','error');}finally{btn.disabled=false;}};
 resend.addEventListener('click',request);
 form.addEventListener('submit',async e=>{e.preventDefault();if(stage===0){await request();return;}if(stage===1){if(!/^[0-9]{6}$/.test(code.value.trim())){showToast('Enter the six-digit code.','error');return;}if(pw.value.length<8){pwWrap.style.display='block';pw.required=true;btn.textContent='Confirm new password';stage=2;showToast('Enter a new password of at least 8 characters.','info');return;}stage=2;}if(stage===2){if(pw.value.length<8){showToast('Password must be at least 8 characters.','error');return;}btn.disabled=true;try{await api.verifyOtp({email:email.value.trim().toLowerCase(),purpose:'reset',code:code.value.trim(),newPassword:pw.value});showToast('Password updated. You can now sign in with your new password.','success');window.location.hash='#/login';}catch(err){showToast(err.message||'Password reset failed.','error');}finally{btn.disabled=false;}}});
}
