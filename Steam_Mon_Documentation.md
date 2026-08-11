# STe-MoN (Steam Mon) Documentation

## Project Overview
STe-MoN is an application designed to manage and interact with Steam accounts and related data. The system follows a client-server architecture, consisting of a central backend API running on a server and a desktop client application used by end-users.

### Architecture
1. **Backend**: A Node.js and Express REST API handling authentication, account management, streaming data, and activity logging. It utilizes Prisma as its Object-Relational Mapper (ORM) to interact with the database (configured for SQLite by default, but adaptable to PostgreSQL).
2. **Frontend**: A desktop application built with Electron, React, Vite, and Tailwind CSS. It communicates with the backend via HTTP requests.

## How It Works

### Authentication and Authorization
- **Users and Roles**: Users are stored in the database with hashed passwords (via `bcrypt`). Roles include standard users and `owner` (admin). The system automatically creates a default admin account upon the first run.
- **JWT Authentication**: Upon successful login, the backend issues a JSON Web Token (JWT). The frontend stores this token and attaches it as a Bearer token in the `Authorization` header for subsequent requests to secure API endpoints.
- **Access Control**: Users can have `FULL` or `SELECTIVE` access plans, which determine what Steam accounts or library features they can interact with.

### Core Features (Backend API)
The backend exposes several routes:
- `/api/auth`: Handles user registration, login, and token validation.
- `/api/accounts`: Manages the Steam library, including alias names, Steam credentials, working status voting, and user assignments.
- `/api/stream`: Potentially handles data streaming or real-time status updates related to the application.
- `/api/banner`: Manages application banners or UI configuration for the client (image URLs, zoom size, alignment).
- `/api/health`: A simple health check endpoint to verify the server is running.

### Desktop Client (Frontend)
The frontend provides a rich UI using React. 
- It uses `axios` to make HTTP calls to the backend API.
- It uses `react-router-dom` for navigation between views (e.g., login, dashboard, account management).
- It uses `framer-motion` for animations and `lucide-react` for icons, ensuring a modern look.
- Built using Electron, meaning users simply install/run the `.exe` (on Windows) without opening a web browser.

## Ports and Network

### Backend Ports
- **`3001` (TCP)**: The primary and only port the backend Node.js Express server listens on. All API requests from the Electron client are sent to this port.
- **Database Port**: If switching to PostgreSQL (as hinted by the `.env` file), the database typically uses port `5432` internally on the server, though it doesn't necessarily need to be exposed to the internet.

### Frontend Ports
- The Electron application does not bind or listen to any incoming ports. It acts purely as a client making outbound requests to the backend IP on port `3001`.
- During frontend development, Vite runs a local dev server, but this is only for the developer, not end-users.

## Security Considerations
- Ensure the `JWT_SECRET` in the backend `.env` is a strong, random string.
- Currently, the API uses HTTP with a raw IP address in the frontend configuration. For a production environment, it is highly recommended to place the backend behind a reverse proxy (like Nginx) and secure it with SSL/TLS (HTTPS) to prevent credentials and JWT tokens from being sent in plaintext. If doing so, the frontend API base URL should be updated to `https://...`.
