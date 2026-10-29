/**
 * Centralized API Client Service for MyAlumni 2.0
 * Connects Frontend to the Flask REST API.
 */
import { getFreshIdToken } from '../config/firebase.js';

// Read API Base URL strictly from Vite environment
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000/api/v1';

class ApiService {
  constructor() {
    this.baseUrl = API_BASE_URL;
    this.token = null;
  }

  setToken(token) {
    this.token = token;
  }

  getToken() {
    return this.token || localStorage.getItem('myalumni_token');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    // Attach fresh token if available
    let token = this.getToken();
    try {
      const freshToken = await getFreshIdToken();
      if (freshToken) {
        token = freshToken;
        this.setToken(token);
      }
    } catch (e) {
      // Continue with stored token
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const errorMsg = data?.error?.message || data?.message || `Request failed with status ${response.status}`;
        const errorObj = new Error(errorMsg);
        errorObj.status = response.status;
        errorObj.code = data?.error?.code || 'API_ERROR';
        errorObj.details = data?.error?.details || null;
        throw errorObj;
      }

      return data;
    } catch (err) {
      if (err.status === 401 && !endpoint.includes('/auth/')) {
        // Token expired or invalid
        console.warn("Unauthorized API call. Triggering session cleanup.");
      }
      throw err;
    }
  }

  // HTTP Method Helpers
  get(endpoint, params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${endpoint}?${query}` : endpoint;
    return this.request(url, { method: 'GET' });
  }

  post(endpoint, body = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  put(endpoint, body = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // --- Specific API Endpoints ---
  // Health
  checkHealth() {
    return this.get('/health');
  }

  checkFirebaseHealth() {
    return this.get('/health/firebase');
  }

  // Demo Login (No authentication required)
  demoLogin(roleOrEmail) {
    return this.post('/auth/demo-login', { role: roleOrEmail, email: roleOrEmail });
  }

  // Auth
  syncProfile(profileData) {
    return this.post('/auth/sync-profile', profileData);
  }

  getCurrentUser() {
    return this.get('/auth/me');
  }

  logout() {
    return this.post('/auth/logout');
  }

  // Users & Alumni Directory
  searchAlumni(params) {
    return this.get('/users/alumni', params);
  }

  getUserProfile(userId) {
    return this.get(`/users/${userId}`);
  }

  updateProfile(profileData) {
    return this.put('/users/profile', profileData);
  }

  promoteToAlumni(data) {
    return this.post('/users/promote-to-alumni', data);
  }

  // Connections & Mentorship
  sendConnectionRequest(recipientId, message) {
    return this.post('/connections/request', { recipientId, message });
  }

  getConnections() {
    return this.get('/connections');
  }

  updateConnectionStatus(requestId, status) {
    return this.put(`/connections/${requestId}/status`, { status });
  }

  requestMentorship(mentorId, goals, message) {
    return this.post('/mentorship/request', { mentorId, goals, message });
  }

  getMentorships() {
    return this.get('/mentorship');
  }

  updateMentorshipStatus(requestId, status) {
    return this.put(`/mentorship/${requestId}/status`, { status });
  }

  updateMentorshipPreferences(preferences) {
    return this.put('/mentorship/preferences', preferences);
  }

  // Human-to-Human Chat
  getConversations() {
    return this.get('/chat/conversations');
  }

  startConversation(recipientId) {
    return this.post('/chat/conversations', { recipientId });
  }

  getMessages(conversationId) {
    return this.get(`/chat/conversations/${conversationId}/messages`);
  }

  sendMessage(conversationId, text) {
    return this.post(`/chat/conversations/${conversationId}/messages`, { text });
  }

  // Opportunities
  getOpportunities() {
    return this.get('/opportunities');
  }

  getPendingOpportunities() {
    return this.get('/opportunities/pending');
  }

  postOpportunity(oppData) {
    return this.post('/opportunities', oppData);
  }

  reviewOpportunity(oppId, status, reviewNotes) {
    return this.put(`/opportunities/${oppId}/review`, { status, reviewNotes });
  }

  toggleSaveOpportunity(oppId) {
    return this.post(`/opportunities/${oppId}/save`);
  }

  getSavedOpportunities() {
    return this.get('/opportunities/saved');
  }

  getApplications() {
    return this.get('/opportunities/applications');
  }

  trackApplication(oppId, status, notes) {
    return this.post(`/opportunities/${oppId}/apply`, { status, notes });
  }

  // Events
  getEvents() {
    return this.get('/events');
  }

  getPendingEvents() {
    return this.get('/events/pending');
  }

  createEvent(eventData) {
    return this.post('/events', eventData);
  }

  reviewEvent(eventId, status) {
    return this.put(`/events/${eventId}/review`, { status });
  }

  registerForEvent(eventId) {
    return this.post(`/events/${eventId}/register`);
  }

  cancelEventRegistration(eventId) {
    return this.delete(`/events/${eventId}/register`);
  }

  getMyRegistrations() {
    return this.get('/events/my-registrations');
  }

  getEventAttendees(eventId) {
    return this.get(`/events/${eventId}/attendees`);
  }

  // Achievements
  getAchievements() {
    return this.get('/achievements');
  }

  getPendingAchievements() {
    return this.get('/achievements/pending');
  }

  getMyAchievements() {
    return this.get('/achievements/my');
  }

  submitAchievement(data) {
    return this.post('/achievements', data);
  }

  reviewAchievement(achievementId, status, reviewNotes) {
    return this.put(`/achievements/${achievementId}/review`, { status, reviewNotes });
  }

  // Birthdays
  getBirthdays() {
    return this.get('/birthdays');
  }

  sendBirthdayGreeting(recipientId, greetingText) {
    return this.post('/birthdays/greet', { recipientId, greetingText });
  }

  getMyGreetings() {
    return this.get('/birthdays/my-greetings');
  }

  // Batches
  getBatches() {
    return this.get('/batches');
  }

  getMyBatches() {
    return this.get('/batches/my');
  }

  joinBatch(batchId) {
    return this.post(`/batches/${batchId}/join`);
  }

  getBatchMembers(batchId) {
    return this.get(`/batches/${batchId}/members`);
  }

  getBatchPosts(batchId) {
    return this.get(`/batches/${batchId}/posts`);
  }

  createBatchPost(batchId, title, content) {
    return this.post(`/batches/${batchId}/posts`, { title, content });
  }

  getPostComments(postId) {
    return this.get(`/batches/posts/${postId}/comments`);
  }

  addComment(postId, content) {
    return this.post(`/batches/posts/${postId}/comments`, { content });
  }

  // Resources & Announcements
  getResources(courseId, category) {
    return this.get('/resources', { courseId, category });
  }

  createResource(data) {
    return this.post('/resources', data);
  }

  deleteResource(resourceId) {
    return this.delete(`/resources/${resourceId}`);
  }

  getAnnouncements() {
    return this.get('/announcements');
  }

  createAnnouncement(data) {
    return this.post('/announcements', data);
  }

  // Career Growth Tracker & Guide
  getCareerGuide(track) {
    return this.get('/career/guide', { track });
  }

  getGoals() {
    return this.get('/career/goals');
  }

  createGoal(goalData) {
    return this.post('/career/goals', goalData);
  }

  addMilestone(goalId, title) {
    return this.post(`/career/goals/${goalId}/milestones`, { title });
  }

  toggleMilestone(milestoneId, isCompleted) {
    return this.put(`/career/milestones/${milestoneId}/toggle`, { isCompleted });
  }

  getProjects() {
    return this.get('/career/projects');
  }

  addProject(data) {
    return this.post('/career/projects', data);
  }

  deleteProject(projectId) {
    return this.delete(`/career/projects/${projectId}`);
  }

  getCertifications() {
    return this.get('/career/certifications');
  }

  addCertification(data) {
    return this.post('/career/certifications', data);
  }

  // Notifications
  getNotifications() {
    return this.get('/notifications');
  }

  getUnreadNotificationCount() {
    return this.get('/notifications/unread-count');
  }

  markNotificationAsRead(id) {
    return this.put(`/notifications/${id}/read`);
  }

  markAllNotificationsAsRead() {
    return this.post('/notifications/read-all');
  }

  // Admin & Support Tickets
  getAdminStats() {
    return this.get('/admin/stats');
  }

  getAdminUsers() {
    return this.get('/admin/users');
  }

  updateUserRole(userId, role) {
    return this.put(`/admin/users/${userId}/role`, { role });
  }

  updateUserStatus(userId, status) {
    return this.put(`/admin/users/${userId}/status`, { status });
  }

  getCourses() {
    return this.get('/admin/courses');
  }

  createCourse(data) {
    return this.post('/admin/courses', data);
  }

  deleteCourse(courseId) {
    return this.delete(`/admin/courses/${courseId}`);
  }

  getAcademicYears() {
    return this.get('/admin/academic-years');
  }

  createAcademicYear(data) {
    return this.post('/admin/academic-years', data);
  }

  deleteAcademicYear(yearId) {
    return this.delete(`/admin/academic-years/${yearId}`);
  }

  submitSupportTicket(ticketData) {
    return this.post('/admin/tickets', ticketData);
  }

  getMyTickets() {
    return this.get('/admin/my-tickets');
  }

  getAllTickets(status) {
    return this.get('/admin/tickets', { status });
  }

  respondToTicket(ticketId, response, status) {
    return this.put(`/admin/tickets/${ticketId}/respond`, { response, status });
  }

  getAuditLogs(limit) {
    return this.get('/admin/audit-logs', { limit });
  }

  createReport(reportData) {
    return this.post('/admin/reports', reportData);
  }
}

export const api = new ApiService();

