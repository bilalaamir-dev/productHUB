# Selenium Test Lab

A small React + FastAPI + MongoDB product inventory application designed to practice browser automation against realistic UI and API behavior. Products have a name, category, price, and description, and are stored in MongoDB.

## Selenium scenarios

1. **Credential testing:** sign in with the seeded valid account, then verify that invalid credentials show an error.
2. **Navigation testing:** use the sidebar to move between Dashboard, Products, and Settings.
3. **Form validation and persistence:** submit an incomplete product without required fields, then add a valid product and verify it appears in the list.
4. **Search testing:** filter products by name or category.

The UI uses stable labels, accessible form controls, and `data-testid` attributes for Selenium selectors.

## Run the Selenium scenarios

First start the app using the local instructions below. With Chrome installed, open another terminal:

```powershell
python -m venv .selenium-venv
.\.selenium-venv\Scripts\Activate.ps1
pip install -r tests\requirements.txt
pytest tests\test_selenium_scenarios.py
```

The tests cover valid/invalid credentials, navigation, browser form validation, product creation, and search. Selenium Manager will locate or download the matching ChromeDriver.

## Run locally

Use Python 3.14 or another version supported by the dependencies.

Start MongoDB separately, then in one terminal:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

In another terminal:

```powershell
cd frontend
npm install
npm run dev
```

Set `MONGODB_URL` and `MONGODB_DATABASE` in the environment if you want to override the defaults (`mongodb://localhost:27017` and `selenium_test_lab`). Open http://localhost:5173. The API is at http://localhost:8000 and its interactive docs are at http://localhost:8000/docs.

Demo credentials:

- Email: `admin@example.com`
- Password: `Selenium123!`

## Deploy the backend to Render

Push this project to GitHub, GitLab, or Bitbucket. The repository-root
`render.yaml` defines a free Python web service with the following settings:

| Setting | Value |
| --- | --- |
| Root directory | `backend` |
| Python version | `3.14.7` |
| Build command | `pip install -r requirements.txt` |
| Start command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| Health check path | `/api/health` |

Either create a Blueprint from `render.yaml`, or create a Web Service and enter
the settings above. Select the Free instance type. Configure these environment
variables in Render:

- `MONGODB_URL`: your MongoDB Atlas connection string, including the database-user
  credentials. Enter this only in Render's environment settings.
- `MONGODB_DATABASE`: `selenium_test_lab`
- `FRONTEND_ORIGIN`: `https://selenium-fronted-1.vercel.app`
- `PYTHON_VERSION`: `3.14.7`

Atlas Network Access must allow the Render service's outbound IP ranges. Find
these in the service's Connect menu, under Outbound, and add them to Atlas.

After deployment, verify `https://YOUR-SERVICE.onrender.com/api/health` returns
`{"status":"ok"}`. In the Vercel frontend project's environment settings, set
`VITE_API_URL` to `https://YOUR-SERVICE.onrender.com` (without `/api` or a trailing
slash), then redeploy the frontend so Vite includes the new API URL in its build.
The API documentation is available at `https://YOUR-SERVICE.onrender.com/docs`.

This is a Selenium practice application: its product endpoints are intentionally
public, and the demo login does not issue an authentication token. Use sample
data for the hosted lab. Database credentials belong in Render environment
variables and must never be committed to the repository.
