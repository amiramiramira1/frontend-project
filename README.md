# Boxify - Full Stack Project

A full-stack meal kit delivery web application built with React (frontend) and Node.js/Express (backend).

## Project Structure

```
boxify/
├── frontend/     # React + Vite app
└── backend/      # Node.js + Express + MongoDB API
```

## Quick Start

### Install all dependencies
```bash
npm run install:all
```

### Run both servers simultaneously
```bash
npm install        # installs concurrently
npm run dev        # starts frontend (port 5173) + backend (port 5000)
```

### Run individually
```bash
npm run frontend   # React dev server only
npm run backend    # Node.js API server only
```

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, Vite, TailwindCSS, React Router |
| Backend | Node.js, Express, MongoDB, Mongoose |
| Auth | JWT |
