/**
 * Events & Reunions Page
 */
import { api } from '../services/api.js';
import { authState } from '../auth/authContext.js';
import { showToast } from '../components/toast.js';
import { openModal } from '../components/modal.js';

export async function renderEventsPage() {
  return `
    <div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 14px;">
        <div>
          <h1 style="font-size: 24px; font-weight: 800; color: var(--navy-900);">Events & Alumni Reunions</h1>
          <p style="color: var(--slate-500); font-size: 14px;">Participate in webinars, networking reunions, and career workshops.</p>
        </div>
        <button type="button" id="create-event-btn" class="btn btn-primary">
          + Create Event
        </button>
      </div>

      <!-- Tabs: Upcoming Events / My Registrations -->
      <div style="display: flex; gap: 8px; border-bottom: 1px solid var(--border-color); margin-bottom: 24px;">
        <button type="button" class="btn btn-outline evt-tab active" data-tab="upcoming">
          Upcoming Events
        </button>
        <button type="button" class="btn btn-outline evt-tab" data-tab="registered">
          My Registrations
        </button>
      </div>

      <div id="events-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 20px;">
        <div style="text-align: center; padding: 40px; color: var(--slate-400); grid-column: 1 / -1;">
          Loading events...
        </div>
      </div>
    </div>
  `;
}

export async function initEventsPage() {
  const grid = document.getElementById('events-grid');
  const tabs = document.querySelectorAll('.evt-tab');
  const createBtn = document.getElementById('create-event-btn');
  let currentTab = 'upcoming';

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentTab = tab.getAttribute('data-tab');
      loadEvents();
    });
  });

  const loadEvents = async () => {
    try {
      let events = [];
      if (currentTab === 'upcoming') {
        const res = await api.getEvents();
        events = res.data || [];
      } else {
        const res = await api.getMyRegistrations();
        events = res.data || [];
      }

      if (events.length === 0) {
        grid.innerHTML = `
          <div class="card empty-state" style="grid-column: 1 / -1;">
            <div class="empty-state-icon">📅</div>
            <div class="empty-state-title">No events found</div>
            <p>${currentTab === 'upcoming' ? 'Check back soon for new webinars and reunion announcements.' : 'You have not registered for any events yet.'}</p>
          </div>
        `;
        return;
      }

      grid.innerHTML = events.map(e => {
        const isRegistered = currentTab === 'registered';
        const startStr = e.startDate ? new Date(e.startDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'TBD';

        return `
          <div class="card" style="display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                <span class="badge badge-teal">${(e.eventType || 'event').toUpperCase()}</span>
                <span style="font-size: 12px; color: var(--slate-500); font-weight: 600;">
                  ${e.registeredCount || 0} ${e.capacity ? `/ ${e.capacity}` : ''} attending
                </span>
              </div>

              <h3 style="font-size: 17px; font-weight: 700; color: var(--navy-900); margin-bottom: 6px;">
                ${escapeHtml(e.title)}
              </h3>

              <div style="font-size: 13px; color: var(--teal-700); font-weight: 600; margin-bottom: 10px;">
                🗓 ${startStr}
              </div>

              <div style="font-size: 13px; color: var(--slate-600); margin-bottom: 12px;">
                📍 <strong>Location:</strong> ${escapeHtml(e.venueOrUrl || 'Virtual / TBA')}
              </div>

              <p style="font-size: 13px; color: var(--slate-600); margin-bottom: 16px; line-height: 1.5; min-height: 40px;">
                ${escapeHtml(e.description)}
              </p>
            </div>

            <div style="border-top: 1px solid var(--border-color); padding-top: 14px; display: flex; gap: 8px;">
              ${!isRegistered ? `
                <button type="button" class="btn btn-primary btn-sm reg-btn" data-id="${e.id}" style="flex: 1;">
                  Register Now
                </button>
              ` : `
                <button type="button" class="btn btn-danger btn-sm cancel-reg-btn" data-id="${e.id}" style="flex: 1;">
                  Cancel Registration
                </button>
              `}
              <button type="button" class="btn btn-outline btn-sm view-attendees-btn" data-id="${e.id}" data-title="${escapeHtml(e.title)}">
                Attendees
              </button>
            </div>
          </div>
        `;
      }).join('');

      // Wire register
      document.querySelectorAll('.reg-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          try {
            await api.registerForEvent(id);
            showToast('Registered for event successfully!', 'success');
            loadEvents();
          } catch (err) {
            showToast(err.message || 'Registration failed.', 'error');
          }
        });
      });

      // Wire cancel
      document.querySelectorAll('.cancel-reg-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          try {
            await api.cancelEventRegistration(id);
            showToast('Registration cancelled.', 'info');
            loadEvents();
          } catch (err) {
            showToast(err.message || 'Error cancelling registration.', 'error');
          }
        });
      });

      // Wire attendees modal
      document.querySelectorAll('.view-attendees-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          const title = btn.getAttribute('data-title');
          try {
            const res = await api.getEventAttendees(id);
            const attendees = res.data || [];
            openAttendeesModal(title, attendees);
          } catch (err) {
            showToast(err.message || 'Could not load attendees.', 'error');
          }
        });
      });

    } catch (e) {
      grid.innerHTML = `<div class="card" style="grid-column: 1 / -1; color: var(--color-danger);">Failed to load events.</div>`;
    }
  };

  const openAttendeesModal = (title, attendees) => {
    const content = `
      <p style="font-size: 13px; color: var(--slate-600); margin-bottom: 14px;">
        Registered attendees for <strong>${escapeHtml(title)}</strong>:
      </p>
      ${attendees.length === 0 ? `
        <div class="empty-state"><p>No registered attendees yet.</p></div>
      ` : `
        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${attendees.map(a => `
            <div style="border: 1px solid var(--border-color); padding: 10px 14px; border-radius: var(--radius-md); display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-weight: 700; font-size: 14px;">${escapeHtml(a.userName || 'Attendee')}</div>
                <div style="font-size: 12px; color: var(--slate-500);">${escapeHtml(a.userEmail || '')}</div>
              </div>
              <span class="user-role-badge role-${a.userRole || 'student'}">${a.userRole || 'student'}</span>
            </div>
          `).join('')}
        </div>
      `}
    `;

    openModal({ title: 'Attendee List', contentHtml: content });
  };

  // Create Event Modal
  if (createBtn) {
    createBtn.addEventListener('click', () => {
      const content = `
        <form id="create-event-form">
          <div class="form-group">
            <label class="form-label" for="evt-title">Event Title</label>
            <input type="text" id="evt-title" class="form-control" placeholder="e.g. Alumni Cloud Engineering Masterclass" required>
          </div>
          <div class="form-group">
            <label class="form-label" for="evt-type">Event Type</label>
            <select id="evt-type" class="form-control">
              <option value="webinar">Webinar</option>
              <option value="reunion">Batch Reunion</option>
              <option value="career_talk">Career Talk</option>
              <option value="workshop">Technical Workshop</option>
              <option value="mentorship_session">Mentorship Session</option>
            </select>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div class="form-group">
              <label class="form-label" for="evt-start">Start Date & Time</label>
              <input type="datetime-local" id="evt-start" class="form-control" required>
            </div>
            <div class="form-group">
              <label class="form-label" for="evt-end">End Date & Time</label>
              <input type="datetime-local" id="evt-end" class="form-control" required>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label" for="evt-venue">Meeting URL or Physical Venue</label>
            <input type="text" id="evt-venue" class="form-control" placeholder="https://meet.google.com/... or Campus Auditorium" required>
          </div>
          <div class="form-group">
            <label class="form-label" for="evt-capacity">Attendee Capacity (Optional)</label>
            <input type="number" id="evt-capacity" class="form-control" placeholder="e.g. 100">
          </div>
          <div class="form-group">
            <label class="form-label" for="evt-desc">Event Description</label>
            <textarea id="evt-desc" class="form-control" placeholder="Describe the topics covered, speakers, and schedule..." required></textarea>
          </div>
        </form>
      `;

      const footer = `
        <button type="button" class="btn btn-outline" id="cancel-evt-btn">Cancel</button>
        <button type="button" class="btn btn-primary" id="submit-evt-btn">Submit Event</button>
      `;

      const { close } = openModal({ title: 'Schedule New Event', contentHtml: content, footerHtml: footer });

      document.getElementById('cancel-evt-btn').addEventListener('click', close);
      document.getElementById('submit-evt-btn').addEventListener('click', async () => {
        const title = document.getElementById('evt-title').value.trim();
        const eventType = document.getElementById('evt-type').value;
        const startDate = document.getElementById('evt-start').value;
        const endDate = document.getElementById('evt-end').value;
        const venueOrUrl = document.getElementById('evt-venue').value.trim();
        const capacity = document.getElementById('evt-capacity').value;
        const description = document.getElementById('evt-desc').value.trim();

        if (!title || !startDate || !endDate || !venueOrUrl || !description) {
          showToast('Please fill in all required event details.', 'error');
          return;
        }

        try {
          const res = await api.createEvent({
            title, eventType, startDate, endDate, venueOrUrl, capacity, description
          });
          showToast(res.message || 'Event created successfully!', 'success');
          close();
          loadEvents();
        } catch (err) {
          showToast(err.message || 'Failed to create event.', 'error');
        }
      });
    });
  }

  // Initial load
  loadEvents();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

