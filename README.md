# Project Continuum - Real-Time Kanban Board

A collaborative project management platform built with Laravel 12 featuring real-time updates, 
team collaboration, and Kanban-style task management.

## Features

- **Real-Time Collaboration** - Live updates via Laravel Reverb (WebSockets) - all team members see changes instantly
- **Kanban Boards** - Drag-and-drop task management with customizable columns
- **Project Management** - Create multiple projects with dedicated boards
- **Team Collaboration** - Invite members via email with role-based access (owner, admin, member)
- **Task Features** - Subtasks, labels, time tracking, comments, due dates, priorities
- **Activity Logging** - Track who did what and when
- **Email Notifications** - Task assignments, project invitations

## Tech Stack

- **Backend:** Laravel 12, PHP 8.4
- **Database:** MySQL 8.0
- **Cache/Queue:** Redis
- **Real-Time:** Laravel Reverb (WebSockets)
- **Frontend:** Inertia.js, React, TypeScript
- **Styling:** Tailwind CSS, shadcn/ui
- **Email:** Resend (transactional emails)
- **Infrastructure:** Docker, Nginx

## Architecture

```
app/
├── Actions/           # Single-purpose action classes
│   ├── CreateBoard.php
│   ├── CreateProject.php
│   └── InviteMember.php
├── Events/            # WebSocket broadcast events
│   ├── TaskCreated.php
│   ├── TaskUpdated.php
│   ├── TaskMoved.php
│   └── TaskDeleted.php
├── Http/
│   ├── Controllers/   # Thin controllers
│   ├── Middleware/    # Custom middleware
│   └── Requests/      # Form request validation
├── Models/            # Eloquent models with relationships
├── Notifications/     # Email notifications
├── Policies/          # Authorization policies
└── Traits/            # Reusable traits (LogsActivity)
```

## Database Schema

- **Users** - Authentication, profile management
- **Projects** - Project containers with team members
- **Boards** - Kanban boards within projects
- **Columns** - Board columns (To Do, In Progress, Done, etc.)
- **Tasks** - Task cards with subtasks support
- **Labels** - Color-coded task labels
- **Comments** - Task discussions
- **TimeEntries** - Time tracking per task
- **ActivityLogs** - Audit trail for all actions

## Getting Started

### Prerequisites

- Docker & Docker Compose
- PHP 8.4+
- Composer
- Node.js 18+

### Installation

```bash
# Clone repository
git clone https://github.com/ionelglavan1801-blip/project-continuum.git
cd project-continuum

# Copy environment file
cp .env.example .env

# Start Docker containers
docker compose up -d

# Install dependencies
docker compose exec app composer install
docker compose exec app npm install && npm run build

# Setup application
docker compose exec app php artisan key:generate
docker compose exec app php artisan migrate --seed
```

### Environment Variables

```env
# Database
DB_CONNECTION=mysql
DB_HOST=mysql
DB_DATABASE=project_continuum

# Real-Time (Reverb)
REVERB_APP_ID=your-app-id
REVERB_APP_KEY=your-app-key
REVERB_APP_SECRET=your-app-secret

# Email (Resend)
MAIL_MAILER=resend
RESEND_API_KEY=re_xxx
MAIL_FROM_ADDRESS=noreply@yourdomain.com
```

## Testing

```bash
# Run all tests
php artisan test

# Run specific test suite
php artisan test --filter=Task
php artisan test --filter=Project
php artisan test --filter=Board
```

## Real-Time Events

The application broadcasts the following events via WebSockets:

| Event | Channel | Description |
|-------|---------|-------------|
| `TaskCreated` | `board.{id}` | New task added to board |
| `TaskUpdated` | `board.{id}` | Task details changed |
| `TaskMoved` | `board.{id}` | Task moved between columns |
| `TaskDeleted` | `board.{id}` | Task removed from board |

## User Roles

| Role | Permissions |
|------|-------------|
| **Owner** | Full access, can delete project, manage all members |
| **Admin** | Can manage boards, tasks, and invite members |
| **Member** | Can create/edit tasks, add comments |

## Live Demo

[https://project-continuum.ionglavan.com](https://project-continuum.ionglavan.com/)

## License

MIT License
