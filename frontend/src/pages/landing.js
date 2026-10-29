/**
 * Landing Page Component
 */
export function renderLandingPage() {
  return `
    <div style="min-height: 100vh; display: flex; flex-direction: column; background: #ffffff;">
      <!-- Landing Header -->
      <header style="border-bottom: 1px solid var(--border-color); background: #ffffff; padding: 18px 40px; display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="font-family: var(--font-heading); font-size: 24px; font-weight: 800; color: var(--navy-900);">
            MyAlumni <span style="color: var(--teal-600); font-size: 16px;">2.0</span>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 14px;">
          <a href="#/login" class="btn btn-outline">Sign In</a>
          <a href="#/register" class="btn btn-primary">Join Community</a>
        </div>
      </header>

      <!-- Hero Section -->
      <section style="background: linear-gradient(135deg, var(--navy-950) 0%, var(--navy-900) 100%); color: #ffffff; padding: 80px 24px; text-align: center;">
        <div style="max-width: 900px; margin: 0 auto;">
          <span class="badge badge-teal" style="margin-bottom: 18px; padding: 6px 14px; font-size: 13px;">
            ✦ Smart Career Networking & Mentorship Portal
          </span>
          <h1 style="font-size: 48px; font-weight: 800; color: #ffffff; margin-bottom: 20px; line-height: 1.15;">
            Bridging Students and Alumni for Career Excellence
          </h1>
          <p style="font-size: 18px; color: var(--slate-300); max-width: 720px; margin: 0 auto 36px; line-height: 1.6;">
            Connect with verified alumni in leading tech and engineering roles, receive 1-on-1 career mentorship, discover exclusive job referrals, and accelerate your professional growth.
          </p>
          <div style="display: flex; justify-content: center; gap: 16px; flex-wrap: wrap;">
            <a href="#/register" class="btn btn-primary btn-lg">Get Started Free</a>
            <a href="#/login" class="btn btn-outline btn-lg" style="color: #ffffff; border-color: rgba(255,255,255,0.25);">Explore Demo Portals</a>
          </div>
        </div>
      </section>

      <!-- Highlights Section -->
      <section style="padding: 70px 24px; background: var(--bg-page);">
        <div style="max-width: 1200px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 50px;">
            <h2 style="font-size: 32px; font-weight: 800; color: var(--navy-900);">Engineered for Career Advancement</h2>
            <p style="color: var(--slate-500); margin-top: 8px;">A comprehensive ecosystem connecting students, alumni, faculty, and administrators.</p>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 28px;">
            <div class="card">
              <div style="font-size: 32px; margin-bottom: 14px;">🎯</div>
              <h3 class="card-title" style="margin-bottom: 8px;">1-on-1 Mentorship</h3>
              <p style="color: var(--slate-600); font-size: 14px; line-height: 1.6;">Direct structured mentorship between students and experienced alumni. Track career goals and interview preparation.</p>
            </div>

            <div class="card">
              <div style="font-size: 32px; margin-bottom: 14px;">💼</div>
              <h3 class="card-title" style="margin-bottom: 8px;">Exclusive Opportunities</h3>
              <p style="color: var(--slate-600); font-size: 14px; line-height: 1.6;">Curated full-time jobs, internships, and internal employee referrals posted directly by verified alumni.</p>
            </div>

            <div class="card">
              <div style="font-size: 32px; margin-bottom: 14px;">💬</div>
              <h3 class="card-title" style="margin-bottom: 8px;">Human-to-Human Messaging</h3>
              <p style="color: var(--slate-600); font-size: 14px; line-height: 1.6;">Direct, persistent peer-to-peer conversations. Zero fake chatbot noise, 100% authentic human collaboration.</p>
            </div>

            <div class="card">
              <div style="font-size: 32px; margin-bottom: 14px;">🎓</div>
              <h3 class="card-title" style="margin-bottom: 8px;">Batch Communities</h3>
              <p style="color: var(--slate-600); font-size: 14px; line-height: 1.6;">Course cohorts, reunion planning, discussion forums, and milestone event organization for every graduating class.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Demo Accounts Callout -->
      <section style="padding: 60px 24px; background: #ffffff; border-top: 1px solid var(--border-color);">
        <div style="max-width: 900px; margin: 0 auto; text-align: center;">
          <h2 style="font-size: 26px; margin-bottom: 12px;">Instant Testing with 4 Pre-Configured Roles</h2>
          <p style="color: var(--slate-500); margin-bottom: 24px;">Experience the portal across all authorization tiers using pre-seeded test accounts.</p>
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 30px;">
            <div style="border: 1px solid var(--border-color); padding: 16px; border-radius: var(--radius-md); background: var(--slate-50);">
              <span class="user-role-badge role-admin">Admin</span>
              <div style="font-weight: 600; font-size: 13px; margin-top: 6px;">admin.demo@myalumni.test</div>
            </div>
            <div style="border: 1px solid var(--border-color); padding: 16px; border-radius: var(--radius-md); background: var(--slate-50);">
              <span class="user-role-badge role-faculty">Faculty</span>
              <div style="font-weight: 600; font-size: 13px; margin-top: 6px;">faculty.demo@myalumni.test</div>
            </div>
            <div style="border: 1px solid var(--border-color); padding: 16px; border-radius: var(--radius-md); background: var(--slate-50);">
              <span class="user-role-badge role-student">Student</span>
              <div style="font-weight: 600; font-size: 13px; margin-top: 6px;">student.demo@myalumni.test</div>
            </div>
            <div style="border: 1px solid var(--border-color); padding: 16px; border-radius: var(--radius-md); background: var(--slate-50);">
              <span class="user-role-badge role-alumni">Alumni</span>
              <div style="font-weight: 600; font-size: 13px; margin-top: 6px;">alumni.demo@myalumni.test</div>
            </div>
          </div>

          <a href="#/login" class="btn btn-navy">Proceed to Sign In</a>
        </div>
      </section>

      <!-- Footer -->
      <footer style="margin-top: auto; border-top: 1px solid var(--border-color); padding: 30px 40px; background: var(--navy-950); color: var(--slate-400); font-size: 13px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
        <div>&copy; 2026 MyAlumni 2.0. Built with Vanilla JavaScript, Vite, Flask, Cloud Firestore & Firebase Auth.</div>
        <div style="color: var(--teal-400);">Cloud Data Platform & Full-Stack Portal</div>
      </footer>
    </div>
  `;
}

