# 🚀 TaskFlow Backend - API Services

Welcome to the backend core of **TaskFlow**, a robust task management system built with **FastAPI** and **MongoDB**. This service handles authentication, project orchestration, and real-time task analytics.

## 🏗️ Project Structure

The backend follows a modular structure for scalability and maintainability:

```text
Backend/
├── app/
│   ├── routes/         # API Endpoints (Auth, Projects, Tasks, Dashboard)
│   ├── schemas/        # Pydantic models for request/response validation
│   ├── utils/          # Helper logic (JWT, Password Hashing, Dependencies)
│   ├── database.py     # MongoDB connection & configuration
│   └── main.py         # Application entry point & middleware
├── .env                # Environment variables (DB URI, Secret Keys)
└── requirements.txt    # Python dependencies
```

## 🛠️ Key Functionalities

1. **Secure Authentication**
   - User signup and login using **JWT (JSON Web Tokens)**.
   - Password security powered by **bcrypt** hashing.
   - Role-based identification (Admin vs. Member).

2. **Project Management**
   - Full CRUD for projects.
   - Creator of a project automatically gains administrative rights for that project.
   - Dynamic member addition/removal logic.

3. **Task Orchestration**
   - Task creation with priority levels, due dates, and status tracking.
   - Assignment system allowing tasks to be delegated to specific users.
   - **Permission Guard**: Members can only view and update tasks specifically assigned to them.

4. **Analytics Engine (Dashboard)**
   - Real-time aggregation of task statuses.
   - Overdue task detection.
   - Workload distribution analysis (Tasks per user).

## 🚀 Tech Stack

- **FastAPI**: High-performance web framework.
- **MongoDB (Motor)**: Asynchronous driver for high-concurrency database operations.
- **Pydantic**: Strict data validation and settings management.
- **Jose (python-jose)**: Secure JWT handling for session management.

---
*Developed for efficient team collaboration.*
