<img src="src/assets/images/logo_title-removebg.png" alt="title" width="300">

InternHub is a role-based internship management platform designed to connect students, companies, and academic supervisors in one centralized ecosystem.

Built with React, Vite, and Firebase, InternHub streamlines the complete internship lifecycle — from opportunity discovery and candidate application to company recruitment and academic oversight.

---

## Overview

InternHub addresses a common challenge in educational institutions: inefficient communication between students seeking internships, companies recruiting interns, and professors supervising academic progress.

The platform provides a digital bridge where:

- **Students** discover internship opportunities, apply with personalized profiles and CVs, and track their progress.
- **Companies** publish offers, evaluate candidates, and manage internship placements.
- **Professors** supervise internship processes and support academic validation.

---

## Core Features

### Student Portal
- Student registration & authentication
- Professional profile settings
- CV upload & management
- Internship board
- Application tracking
- Active internship dashboard

### Company Portal
- Company registration & authentication
- Internship posting system
- Candidate review dashboard
- Accept / Reject workflows
- Internship management

### Professor Portal
- Teacher registration
- Profile management
- Academic internship supervision

---

## Technical Stack

### Frontend
- React 19
- Vite 7
- Custom Router System
- React Leaflet + Leaflet
- jsPDF + PDF.js

### Backend / Services
- Firebase Authentication
- Firebase Firestore
- Cloudinary (media & document storage)

---

## Architecture Highlights

- Role-Based Access Control (RBAC)
- Protected Routes
- Modular Component Structure
- Real-Time Firestore Integration
- Scalable Internship Workflow

---

## User Roles

| Role | Purpose |
|------|---------|
| Student | Apply and manage internships |
| Company | Recruit and manage interns |
| Professor | Academic supervision |

---

## Project Structure

```bash
Frontend/
│── src/
│   ├── pages/
│   ├── routes/
│   ├── services/
│   ├── components/
│   └── assets/
│── public/
│── package.json
