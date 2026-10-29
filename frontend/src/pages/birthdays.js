/**
 * Birthday Corner Page
 * Strictly adheres to privacy: does not expose birth year or sensitive data.
 */
import { api } from '../services/api.js';
import { showToast } from '../components/toast.js';
import { openModal } from '../components/modal.js';

export async function renderBirthdaysPage() {
  return `
    <div>
      <div style="margin-bottom: 24px;">
        <h1 style="font-size: 24px; font-weight: 800; color: var(--navy-900);">Birthday Corner 🎂</h1>
        <p style="color: var(--slate-500); font-size: 14px;">Celebrate alumni birthdays, foster community warmth, and send well wishes.</p>
      </div>

      <!-- Tab Buttons -->
      <div style="display: flex; gap: 8px; border-bottom: 1px solid var(--border-color); margin-bottom: 24px;">
        <button type="button" class="btn btn-outline bday-tab active" data-tab="active-bdays">
          Community Celebrations
        </button>
        <button type="button" class="btn btn-outline bday-tab" data-tab="my-greetings">
          Received Greetings
        </button>
      </div>

      <!-- Celebrations View -->
      <div id="bday-celebrations-view">
        <!-- Today's Section -->
        <div class="card" style="margin-bottom: 24px; border: 2px solid var(--teal-500); background: linear-gradient(135deg, #f0fdfa, #ffffff);">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px;">
            <span style="font-size: 26px;">🎉</span>
            <h2 style="font-size: 20px; color: var(--teal-700);">Today's Birthdays</h2>
          </div>
          <div id="today-bdays-container" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;">
            <div style="color: var(--slate-500); padding: 10px;">Checking today's birthdays...</div>
          </div>
        </div>

        <!-- Upcoming Section -->
        <div class="card">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px;">
            <span style="font-size: 22px;">🗓</span>
            <h2 style="font-size: 18px; color: var(--navy-900);">Upcoming Birthdays (Next 30 Days)</h2>
          </div>
          <div id="upcoming-bdays-container" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;">
            <div style="color: var(--slate-500); padding: 10px;">Checking upcoming birthdays...</div>
          </div>
        </div>
      </div>

      <!-- Received Greetings View -->
      <div id="bday-greetings-view" style="display: none;">
        <div class="card">
          <h3 class="card-title" style="margin-bottom: 16px;">Greetings Sent to You</h3>
          <div id="greetings-list" style="display: flex; flex-direction: column; gap: 12px;">
            <div style="color: var(--slate-400); padding: 20px; text-align: center;">Loading received greetings...</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

export async function initBirthdaysPage() {
  const tabs = document.querySelectorAll('.bday-tab');
  const celebrationsView = document.getElementById('bday-celebrations-view');
  const greetingsView = document.getElementById('bday-greetings-view');
  const todayContainer = document.getElementById('today-bdays-container');
  const upcomingContainer = document.getElementById('upcoming-bdays-container');
  const greetingsList = document.getElementById('greetings-list');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.getAttribute('data-tab');
      celebrationsView.style.display = target === 'active-bdays' ? 'block' : 'none';
      greetingsView.style.display = target === 'my-greetings' ? 'block' : 'none';
      if (target === 'my-greetings') loadGreetings();
    });
  });

  const loadBirthdays = async () => {
    try {
      const res = await api.getBirthdays();
      const { today = [], upcoming = [] } = res.data || {};

      // Render Today
      if (today.length === 0) {
        todayContainer.innerHTML = `<p style="font-size: 14px; color: var(--slate-500);">No community birthdays today.</p>`;
      } else {
        todayContainer.innerHTML = today.map(b => renderBirthdayCard(b, true)).join('');
      }

      // Render Upcoming
      if (upcoming.length === 0) {
        upcomingContainer.innerHTML = `<p style="font-size: 14px; color: var(--slate-500);">No upcoming birthdays in the current window.</p>`;
      } else {
        upcomingContainer.innerHTML = upcoming.map(b => renderBirthdayCard(b, false)).join('');
      }

      attachGreetingListeners();
    } catch (e) {
      todayContainer.innerHTML = `<p style="color: var(--color-danger);">Failed to load birthdays: ${escapeHtml(e.message)}</p>`;
    }
  };

  const loadGreetings = async () => {
    try {
      const res = await api.getMyGreetings();
      const greetings = res.data || [];

      if (greetings.length === 0) {
        greetingsList.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">💌</div>
            <div class="empty-state-title">No greetings yet</div>
            <p>Birthday greetings received from peers will appear here.</p>
          </div>
        `;
        return;
      }

      greetingsList.innerHTML = greetings.map(g => `
        <div style="border: 1px solid var(--border-color); padding: 14px; border-radius: var(--radius-md); background: #ffffff;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <strong style="color: var(--navy-900); font-size: 14px;">${escapeHtml(g.senderName || 'Peer')}</strong>
            <span style="font-size: 12px; color: var(--slate-400);">${g.createdAt ? new Date(g.createdAt).toLocaleDateString() : ''}</span>
          </div>
          <p style="font-size: 13px; color: var(--slate-700); line-height: 1.5;">${escapeHtml(g.greetingText)}</p>
        </div>
      `).join('');
    } catch (e) {
      greetingsList.innerHTML = `<p style="color: var(--color-danger);">Error loading greetings.</p>`;
    }
  };

  const renderBirthdayCard = (b, isToday) => {
    return `
      <div style="border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px; background: #ffffff; display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
            <div style="font-weight: 700; color: var(--navy-900); font-size: 15px;">${escapeHtml(b.displayName)}</div>
            ${isToday ? `<span class="badge badge-emerald">Today!</span>` : `<span class="badge badge-navy">Month ${b.month}/${b.day}</span>`}
          </div>
          <div style="font-size: 13px; color: var(--slate-500); margin-bottom: 6px;">
            ${escapeHtml(b.jobTitle || 'Alumnus')} • ${escapeHtml(b.company || '')}
          </div>
          <div style="font-size: 12px; color: var(--slate-400); margin-bottom: 12px;">
            Class of ${escapeHtml(b.graduationYear || 'N/A')}
          </div>
        </div>

        <button type="button" class="btn btn-outline btn-sm send-greeting-btn" data-id="${b.userId}" data-name="${escapeHtml(b.displayName)}" style="width: 100%;">
          💌 Send Birthday Greeting
        </button>
      </div>
    `;
  };

  const attachGreetingListeners = () => {
    document.querySelectorAll('.send-greeting-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const uid = btn.getAttribute('data-id');
        const name = btn.getAttribute('data-name');
        openGreetingModal(uid, name);
      });
    });
  };

  const openGreetingModal = (targetUid, targetName) => {
    const templates = [
      "Wishing you a very Happy Birthday! May this year bring continued success and happiness in your career.",
      "Happy Birthday! Proud to be in the same alumni network with you. Have a wonderful celebration!",
      "Warmest birthday greetings from the university alumni family! Best wishes on your milestones."
    ];

    const content = `
      <p style="font-size: 14px; color: var(--slate-600); margin-bottom: 14px;">
        Compose a birthday greeting for <strong>${escapeHtml(targetName)}</strong>:
      </p>
      <div class="form-group">
        <label class="form-label">Quick Template</label>
        <select id="greeting-template-picker" class="form-control" style="margin-bottom: 8px;">
          <option value="">-- Choose a warm message template --</option>
          ${templates.map(t => `<option value="${escapeHtml(t)}">${escapeHtml(t.substring(0, 50))}...</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label" for="custom-greeting-text">Your Birthday Greeting</label>
        <textarea id="custom-greeting-text" class="form-control" placeholder="Write your personalized wishes...">${templates[0]}</textarea>
      </div>
    `;

    const footer = `
      <button type="button" class="btn btn-outline" id="cancel-greet-btn">Cancel</button>
      <button type="button" class="btn btn-primary" id="confirm-greet-btn">Dispatch Greeting</button>
    `;

    const { close } = openModal({ title: 'Send Birthday Greeting', contentHtml: content, footerHtml: footer });

    const picker = document.getElementById('greeting-template-picker');
    const textarea = document.getElementById('custom-greeting-text');

    picker.addEventListener('change', () => {
      if (picker.value) textarea.value = picker.value;
    });

    document.getElementById('cancel-greet-btn').addEventListener('click', close);
    document.getElementById('confirm-greet-btn').addEventListener('click', async () => {
      const text = textarea.value.trim();
      if (!text) {
        showToast('Greeting message cannot be empty.', 'error');
        return;
      }
      try {
        await api.sendBirthdayGreeting(targetUid, text);
        showToast('Birthday greeting dispatched to ' + targetName, 'success');
        close();
      } catch (err) {
        showToast(err.message || 'Failed to send greeting.', 'error');
      }
    });
  };

  // Initial load
  loadBirthdays();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

