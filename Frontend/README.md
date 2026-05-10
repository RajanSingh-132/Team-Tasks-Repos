# ✨ TaskFlow Frontend - Management Portal

This is the interactive frontend for the **TaskFlow** platform. Built with **React** and **TypeScript**, it provides a premium, responsive user experience for managing teams and tracking productivity.

## 📂 Structure Breakdown

The source code is organized into logical directories to ensure clean separation of concerns:

```text
Frontend/my-app/
├── src/
│   ├── api/            # API service layers (Axios instances & endpoints)
│   ├── components/     # UI components (Modals, Avatars, Layouts, Tables)
│   ├── contexts/       # Global state management (Auth, Theme)
│   ├── pages/          # Main views (Dashboard, Users, Projects, Tasks)
│   ├── types/          # TypeScript interface definitions
│   ├── utils/          # Date formatting & error handling helpers
│   └── main.tsx        # App entry point & Routing configuration
```

## 🌟 Core Features

1. **Dynamic Dashboard**
   - High-impact data visualization using **Recharts**.
   - Real-time stats on project counts, progress, and team workload.
   - Smart alert system for tracking overdue tasks at a glance.

2. **Management Interface**
   - **User Management**: Admin-only portal to monitor system access and remove users.
   - **Project View**: Detailed project breakdowns, team member management, and task lists.
   - **Task Board**: Filterable workspace to update task statuses and track deadlines.

3. **Premium UX/UI**
   - **Dark/Light Mode**: Full theme support with persistent browser storage.
   - **Modern Design**: Aesthetic glassmorphism effects, smooth transitions, and a clean typography system.
   - **Mobile Friendly**: Fully responsive layout designed for desktops, tablets, and mobile devices.

## 🛠️ Tech Stack

- **React 18**: Component-driven architecture.
- **Vite**: Modern build pipeline for lightning-fast development.
- **Tailwind CSS**: Utility-first styling for high-performance UI components.
- **Lucide React**: Premium iconography.
- **Axios**: Robust HTTP client for backend integration.

---
*Designed for a seamless management experience.*
