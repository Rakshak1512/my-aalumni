# MyAlumni 2.0 — Smart Alumni & Student Career Networking Portal

**MyAlumni 2.0** is an enterprise-grade full-stack networking platform connecting university students, verified alumni, academic faculty, and administrators.

Built from scratch with **Vanilla JavaScript (ES Modules)**, **Vite**, **Python (Flask REST API)**, **Firebase Authentication**, and **Google Cloud Firestore**.

---

## 🌟 Key Capabilities

- **Strict Role-Based Access Control (RBAC)**: Exactly 4 discrete roles (**Student**, **Alumni**, **Faculty**, and **Admin**) enforced server-side via Python decorators.
- **Direct Human-to-Human Messaging**: Authentic, persistent peer communication. Zero AI chatbots, zero floating assistant widgets, zero LLM noise.
- **Alumni Directory & Mentorship Network**: Search alumni by name, employer, technical skills, graduation year, and mentoring availability. Structured 1-on-1 career mentorship workflow.
- **Jobs, Internships & Private Application Tracker**: Curated opportunities with private status tracking (*Interested, Applied, Interviewing, Offered, Not Selected*).
- **Academic Resources & Notices**: Departmental study archives, previous examination question papers, and prioritized announcements.
- **Birthday Celebrations Corner**: Community greetings with strict privacy guarantees (birth years are never publicized).
- **Alumni Success Showcase**: Moderated promotions, placements, awards, and milestones.
- **Events & Class Reunions**: Webinar schedules, reunion planning, attendee tracking, and capacity management.
- **Class Batch Communities**: Cohort discussion forums and reunion planning.
- **Student Career Growth Tracker**: Milestone targets with automatic percentage progress calculation.
- **Deterministic Rule-Based Career Guide**: Curated technical roadmaps for Software Engineering, Data Science, DevOps, and Cybersecurity.
- **Administrative Governance & Audit Trail**: Immutable logging of privilege escalations, suspensions, and ticket resolution.

---

## 🛠️ Mandatory Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript (ES6 Modules), Vite, Fetch API |
| **Backend** | Python 3.10+, Flask REST API, Flask Blueprints, Firebase Admin SDK |
| **Database** | Google Cloud Firestore (Primary persistent data platform) |
| **Authentication** | Firebase Authentication (Email/Password, ID-Token verification) |
| **Email Relay** | SMTP with TLS (Configurable for Gmail App Passwords, SendGrid, Amazon SES) |

---

## 📁 Project Structure

```text
MyAlumni/
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── .env
│   ├── .env.example
│   ├── public/
│   └── src/
│       ├── main.js
│       ├── router.js
│       ├── styles/
│       │   └── main.css
│       ├── components/
│       │   ├── navbar.js
│       │   ├── sidebar.js
│       │   ├── modal.js
│       │   └── toast.js
│       ├── pages/
│       │   ├── landing.js
│       │   ├── login.js
│       │   ├── register.js
│       │   ├── forgotPassword.js
│       │   ├── dashboard.js
│       │   ├── directory.js
│       │   ├── chat.js
│       │   ├── opportunities.js
│       │   ├── events.js
│       │   ├── achievements.js
│       │   ├── birthdays.js
│       │   ├── batches.js
│       │   ├── resources.js
│       │   ├── careerTracker.js
│       │   ├── careerGuide.js
│       │   ├── notifications.js
│       │   ├── contactAdmin.js
│       │   ├── mentorship.js
│       │   ├── adminConsole.js
│       │   ├── moderation.js
│       │   ├── promotion.js
│       │   └── settings.js
│       ├── services/
│       │   └── api.js
│       ├── auth/
│       │   └── authContext.js
│       └── config/
│           └── firebase.js
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── config.py
│   │   ├── firebase.py
│   │   ├── auth/
│   │   │   ├── __init__.py
│   │   │   └── decorators.py
│   │   ├── routes/
│   │   │   ├── health_routes.py
│   │   │   ├── auth_routes.py
│   │   │   ├── users_routes.py
│   │   │   ├── connection_routes.py
│   │   │   ├── mentorship_routes.py
│   │   │   ├── chat_routes.py
│   │   │   ├── opportunity_routes.py
│   │   │   ├── event_routes.py
│   │   │   ├── achievement_routes.py
│   │   │   ├── birthday_routes.py
│   │   │   ├── batch_routes.py
│   │   │   ├── resource_routes.py
│   │   │   ├── career_routes.py
│   │   │   ├── notification_routes.py
│   │   │   └── admin_routes.py
│   │   ├── repositories/
│   │   │   ├── base_repository.py
│   │   │   ├── user_repository.py
│   │   │   ├── academic_repository.py
│   │   │   ├── networking_repository.py
│   │   │   ├── chat_repository.py
│   │   │   ├── opportunity_repository.py
│   │   │   ├── event_repository.py
│   │   │   ├── achievement_repository.py
│   │   │   ├── resource_repository.py
│   │   │   ├── community_repository.py
│   │   │   ├── career_repository.py
│   │   │   ├── notification_repository.py
│   │   │   └── admin_repository.py
│   │   ├── services/
│   │   │   └── email_service.py
│   │   ├── validators/
│   │   │   └── validators.py
│   │   └── utils/
│   │       ├── responses.py
│   │       ├── serializers.py
│   │       └── audit.py
│   ├── tests/
│   │   ├── conftest.py
│   │   ├── test_auth_rbac.py
│   │   └── test_features.py
│   ├── requirements.txt
│   ├── run.py
│   ├── .env
│   └── .env.example
├── scripts/
│   ├── check_firebase.py
│   ├── seed_demo_users.py
│   └── seed_demo_data.py
├── commands/
│   ├── README.md
│   └── COMMANDS.md
├── docs/
│   ├── API_DOCUMENTATION.md
│   ├── FIREBASE_SETUP.md
│   ├── SMTP_SETUP.md
│   ├── SECURITY.md
│   └── TEST_REPORT.md
├── firebase/
│   ├── firestore.rules
│   ├── firestore.indexes.json
│   └── storage.rules
├── .gitignore
├── README.md
└── START_HERE.md
```

---

## 🎨 Premium UI/UX Design System

- **Colors**: Deep Navy (`#0a192f`), Vibrant Teal (`#0d9488`, `#14b8a6`), Emerald Green (`#10b981`), Clean White, Warm Off-White (`#f8fafc`), and Slate Gray typography.
- **Strict Brand Rule**: Completely free from purple-and-pink styling.
- **Accessibility & Devices**: Fully responsive across mobile, tablet, laptop, and 4K displays. Touch-friendly targets, visible focus indicators, and semantic HTML elements.

---

## 👥 Demo Test Accounts

The platform includes four pre-configured demonstration accounts:

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin.demo@myalumni.test` | `Demo@MyAlumni2026!` |
| **Faculty** | `faculty.demo@myalumni.test` | `Demo@MyAlumni2026!` |
| **Student** | `student.demo@myalumni.test` | `Demo@MyAlumni2026!` |
| **Alumni** | `alumni.demo@myalumni.test` | `Demo@MyAlumni2026!` |

---

## 🚀 Quick Start

Refer to [`START_HERE.md`](./START_HERE.md) for the 3-step setup guide or [`commands/COMMANDS.md`](./commands/COMMANDS.md) for terminal commands.

