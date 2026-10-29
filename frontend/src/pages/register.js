/** Registration with email OTP verification. */
import { api } from '../services/api.js';
import { showToast } from '../components/toast.js';

export function renderRegisterPage() {
 return `<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg-page);padding:20px"><div class="card" style="max-width:480px;width:100%;padding:36px 32px">
 <div style="text-align:center;margin-bottom:24px"><a href="#/" class="brand-logo" style="justify-content:center;color:var(--navy-900)"><span>MyAlumni</span><span class="brand-badge">2.0</span></a><p style="color:var(--slate-500);font-size:14px">Create your verified portal account</p></div>
 <form id="register-form"><div class="form-group"><label class="form-label" for="reg-name">Full Name</label><input id="reg-name" class="form-control" required autocomplete="name"></div>
 <div class="form-group"><label class="form-label" for="reg-email">Email Address</label><input id="reg-email" type="email" class="form-control" required autocomplete="email"></div>
 <div class="form-group"><label class="form-label" for="reg-role">Registering as</label><select id="reg-role" class="form-control"><option value="student">Student</option><option value="alumni">Alumni</option></select></div>
 <div class="form-group" id="reg-course-wrap"><label class="form-label" for="reg-course">Academic Course</label><input id="reg-course" class="form-control" placeholder="BCA"></div>
 <div class="form-group" id="reg-alumni-wrap" style="display:none"><label class="form-label" for="reg-grad-year">Graduation Year</label><input id="reg-grad-year" type="number" class="form-control" placeholder="2025"><label class="form-label" for="reg-company">Current Company</label><input id="reg-company" class="form-control" placeholder="Company"></div>
 <div class="form-group"><label class="form-label" for="reg-password">Password</label><input id="reg-password" type="password" minlength="8" class="form-control" required autocomplete="new-password"></div>
 <div class="form-group" id="reg-code-wrap" style="display:none"><label class="form-label" for="reg-code">Six-digit email code</label><input id="reg-code" class="form-control" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" autocomplete="one-time-code"></div>
 <button id="reg-submit-btn" type="submit" class="btn btn-primary" style="width:100%;margin-top:10px;padding:11px">Send verification code</button></form>
 <div style="margin-top:24px;text-align:center;font-size:13px">Already have an account? <a href="#/login">Sign in here</a></div></div></div>`;
}
export function initRegisterPage(){
 const form=document.getElementById('register-form'),role=document.getElementById('reg-role'),courseWrap=document.getElementById('reg-course-wrap'),alumniWrap=document.getElementById('reg-alumni-wrap'),codeWrap=document.getElementById('reg-code-wrap'),code=document.getElementById('reg-code'),btn=document.getElementById('reg-submit-btn');let stage=0;
 role.addEventListener('change',()=>{const a=role.value==='alumni';courseWrap.style.display=a?'none':'block';alumniWrap.style.display=a?'block':'none';});
 form.addEventListener('submit',async e=>{e.preventDefault();const email=document.getElementById('reg-email').value.trim().toLowerCase();if(stage===0){btn.disabled=true;try{await api.requestOtp(email,'register');stage=1;codeWrap.style.display='block';code.required=true;btn.textContent='Verify code and create account';showToast('Verification code sent if SMTP is configured.','success');}catch(err){showToast(err.message||'Could not send verification code.','error');}finally{btn.disabled=false;}return;}
 if(!/^[0-9]{6}$/.test(code.value.trim())){showToast('Enter the six-digit code.','error');return;}btn.disabled=true;btn.textContent='Verifying...';
 const r=role.value,profile=r==='student'?{courseName:document.getElementById('reg-course').value.trim()}:{graduationYear:document.getElementById('reg-grad-year').value,company:document.getElementById('reg-company').value.trim(),isMentoringAvailable:false};
 try{const result=await api.verifyOtp({email,purpose:'register',code:code.value.trim(),password:document.getElementById('reg-password').value,displayName:document.getElementById('reg-name').value.trim(),role:r,profile});showToast('Account created. Please sign in with email OTP.','success');window.location.hash='#/login';}
 catch(err){showToast(err.message||'Registration failed.','error');}finally{btn.disabled=false;btn.textContent='Verify code and create account';}
 });
}
