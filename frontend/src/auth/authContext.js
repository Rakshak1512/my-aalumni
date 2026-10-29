/**
 * Authentication Context & State Management
 * Connects Firebase Client Authentication with Backend Profile Sync.
 */
import { firebaseSignIn, firebaseSignUp, firebaseSignOut, firebaseSignInWithCustomToken } from '../config/firebase.js';
import { api } from '../services/api.js';

const DEMO_FALLBACK_USERS = {
  admin: {
    uid: "demo_admin_uid",
    email: "admin.demo@myalumni.test",
    displayName: "Dr. Sarah Admin",
    role: "admin",
    accountStatus: "active",
    bio: "Chief Portal Administrator & Systems Overseer at MyAlumni.",
    profile: {}
  },
  faculty: {
    uid: "demo_faculty_uid",
    email: "faculty.demo@myalumni.test",
    displayName: "Prof. Marcus Vance",
    role: "faculty",
    accountStatus: "active",
    bio: "Professor of Computer Science & Academic Department Chair.",
    profile: {
      department: "Computer Science & Engineering",
      designation: "Associate Professor & Student Advisor"
    }
  },
  student: {
    uid: "demo_student_uid",
    email: "student.demo@myalumni.test",
    displayName: "Alex Chen",
    role: "student",
    accountStatus: "active",
    bio: "Final year CS student passionate about full-stack web architectures and cloud engineering.",
    profile: {
      courseName: "B.S. in Computer Science",
      academicYearName: "2025-2026",
      skills: ["JavaScript", "Python", "Flask", "Docker", "Git"]
    }
  },
  alumni: {
    uid: "demo_alumni_uid",
    email: "alumni.demo@myalumni.test",
    displayName: "Elena Rostova",
    role: "alumni",
    accountStatus: "active",
    bio: "Senior Cloud Software Engineer at Apex Technologies. Alumna of Batch 2021.",
    profile: {
      graduationYear: "2021",
      company: "Apex Technologies",
      jobTitle: "Senior Cloud Software Engineer",
      skills: ["Python", "Go", "Kubernetes", "GCP"]
    }
  }
};

class AuthState {
  constructor() {
    this.user = null;
    this.token = localStorage.getItem('myalumni_token') || null;
    this.role = localStorage.getItem('myalumni_role') || null;
    this.subscribers = [];
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  notify() {
    for (const cb of this.subscribers) {
      cb({
        user: this.user,
        role: this.role,
        isAuthenticated: !!this.user,
        token: this.token
      });
    }
  }

  async demoLogin(roleOrEmail) {
    const rawKey = (roleOrEmail || 'student').toLowerCase();
    let normalizedRole = 'student';
    if (rawKey.includes('admin')) normalizedRole = 'admin';
    else if (rawKey.includes('faculty')) normalizedRole = 'faculty';
    else if (rawKey.includes('alumni')) normalizedRole = 'alumni';

    try {
      const res = await api.demoLogin(roleOrEmail);
      if (res && res.data) {
        const { user, token, role } = res.data;
        this.token = token;
        this.user = user;
        this.role = role || user.role;
        localStorage.setItem('myalumni_token', token);
        localStorage.setItem('myalumni_role', this.role);
        api.setToken(token);
        this.notify();
        return this.user;
      }
    } catch (err) {
      console.warn("Backend demo API not responding, using direct demo profile:", err.message);
    }

    // Direct client fallback ensures instant login even if backend is offline/starting
    const fallbackUser = DEMO_FALLBACK_USERS[normalizedRole] || DEMO_FALLBACK_USERS.student;
    const token = `demo-token-${normalizedRole}`;
    this.token = token;
    this.user = fallbackUser;
    this.role = normalizedRole;
    localStorage.setItem('myalumni_token', token);
    localStorage.setItem('myalumni_role', this.role);
    api.setToken(token);
    this.notify();
    return this.user;
  }

  async loginWithOtp(email, code) {
    const verified = await api.verifyOtp({ email, code, purpose: 'login' });
    const { user, token } = await firebaseSignInWithCustomToken(verified.data.customToken);
    this.token = token;
    this.user = user;
    api.setToken(token);
    localStorage.setItem('myalumni_token', token);
    const profile = await api.getCurrentUser();
    this.user = profile.data;
    this.role = profile.data.role;
    localStorage.setItem('myalumni_role', this.role);
    this.notify();
    return this.user;
  }

  async login(email, password) {
    // 1. Authenticate with Firebase Client Auth
    const { user, token } = await firebaseSignIn(email, password);
    this.token = token;
    localStorage.setItem('myalumni_token', token);
    api.setToken(token);

    // 2. Fetch or sync profile from Flask REST API
    const res = await api.getCurrentUser().catch(async (err) => {
      // If user profile not in Firestore yet, trigger sync
      if (err.status === 404) {
        return await api.syncProfile({
          displayName: user.displayName || email.split('@')[0],
          email: user.email
        });
      }
      throw err;
    });

    this.user = res.data;
    this.role = this.user.role;
    localStorage.setItem('myalumni_role', this.role);
    this.notify();
    return this.user;
  }

  async register(email, password, displayName, role, extraProfile = {}) {
    // 1. Create account in Firebase
    const { user, token } = await firebaseSignUp(email, password);
    this.token = token;
    localStorage.setItem('myalumni_token', token);
    api.setToken(token);

    // 2. Provision user record in Firestore via Flask API
    const res = await api.syncProfile({
      displayName,
      role,
      profile: extraProfile
    });

    this.user = res.data;
    this.role = this.user.role;
    localStorage.setItem('myalumni_role', this.role);
    this.notify();
    return this.user;
  }

  async logout() {
    try {
      await api.logout().catch(() => null);
      await firebaseSignOut().catch(() => null);
    } finally {
      this.user = null;
      this.role = null;
      this.token = null;
      localStorage.removeItem('myalumni_token');
      localStorage.removeItem('myalumni_role');
      api.setToken(null);
      this.notify();
    }
  }

  async restoreSession() {
    if (!this.token) {
      return null;
    }
    api.setToken(this.token);
    try {
      const res = await api.getCurrentUser();
      this.user = res.data;
      this.role = this.user.role;
      localStorage.setItem('myalumni_role', this.role);
      this.notify();
      return this.user;
    } catch (err) {
      if (this.token.startsWith('demo-token-')) {
        const role = this.token.replace('demo-token-', '');
        this.user = DEMO_FALLBACK_USERS[role] || DEMO_FALLBACK_USERS.student;
        this.role = role;
        this.notify();
        return this.user;
      }
      console.warn("Session expired or token invalid. Clearing credentials.");
      this.logout();
      return null;
    }
  }

  setUser(updatedUser) {
    this.user = updatedUser;
    if (updatedUser?.role) {
      this.role = updatedUser.role;
      localStorage.setItem('myalumni_role', this.role);
    }
    this.notify();
  }

  isAuthenticated() {
    return !!this.user;
  }

  hasRole(allowedRoles) {
    if (!this.user || !this.role) return false;
    if (typeof allowedRoles === 'string') return this.role === allowedRoles;
    return allowedRoles.includes(this.role);
  }
}

export const authState = new AuthState();

