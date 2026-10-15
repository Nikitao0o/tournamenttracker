This is a project for fullstack course.

pages overview:
**Homepage** titles of tournaments
**tournament page** bracket
**match page** online scoreboard
**player profile** name, age
**team profile** list of players
**admin page** control match and tournament 

to setup frontend use:

1. Start the API (from the project root):

```bash
cd backend
python -m app.seed
python -m uvicorn app.main:app --reload
```

Run the seed command once to create and populate `backend/tracker.db`. Start the
API from `backend/` so the SQLite database is created in the expected location.

2. In a second terminal, start the frontend:

```bash
cd frontend
npm run dev
```

The Vite development server proxies `/api` requests to `http://127.0.0.1:8000`.
To use a different API URL, set `VITE_API_URL` in the frontend environment.
