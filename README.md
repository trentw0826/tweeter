# Tweeter-Web

A starter project for the Tweeter Web application.

## Setting Up the Project

1. cd into the project root folder
1. Run 'npm install'
1. cd into the tweeter-shared folder
1. Run 'npm install'
1. Run 'npm run build'
1. cd into the tweeter-web folder
1. Run 'npm install'
1. Run 'npm run build'

**Note:** VS Code seems to have a bug. After doing this, you should be able to run the project but code editors report that they can't see the 'tweeter-shared' module. Restarting VS Code fixes the problem. You will likely need to restart VS Code every time you compile or build the 'tweeter-shared' module.

**Note:** If you are using Windows, make sure to use a Git Bash terminal instead of Windows Powershell. Otherwise, the scripts won't run properly in tweeter-shared and it will cause errors when building tweeter-web.

## Rebuilding the Project

Rebuild either module of the project (tweeter-shared or tweeter-web) by running 'npm run build' after making any code or configuration changes in the module. The 'tweeter-web' module is dependent on 'tweeter-shared', so if you change 'tweeter-shared' you will also need to rebuild 'tweeter-web'. After rebuilding 'tweeter-shared' you will likely need to restart VS Code (see note above under 'Setting Up the Project').

## Running the Project

### Local development (frontend only)

1. cd into the `tweeter-web` folder.
2. Ensure `.env.local` has a `VITE_API_BASE_URL` value.
3. Run `npm start` to launch the Vite dev server.

### Local development with LocalStack + SAM (frontend + local Lambda + local AWS services)

This repo now supports a local AWS-emulated path that still reuses the same SAM template used for deploys.

1. Start LocalStack and bootstrap resources (tables and media bucket):
   - `npm run local:api`
2. In another terminal, start the frontend dev server:
   - `npm run dev:web`
3. Ensure `tweeter-web/.env.local` points at `http://127.0.0.1:3000`.

The LocalStack-backed API path uses `ApiStageName=local`, so local resource names mirror the SAM template naming pattern without maintaining a second template.

This keeps SAM local invocation on the host (most reliable for this repo) while LocalStack emulates the backing AWS services.

## SAM Deploy Config

The server deployment uses multiple SAM config environments defined in [tweeter-server/samconfig.toml](tweeter-server/samconfig.toml):

- `default` / local: convenience config for manual deploys with `ApiStageName=dev`.
- `dev`: dev stack (`tweeter-server-dev`) with `ApiStageName=dev`.
- `prod`: prod stack (`tweeter-server-prod`) with `ApiStageName=prod`.
- `ci`: used by GitHub Actions, currently targeting the prod-style configuration.

The CloudFormation stack exposes an `ApiBaseUrl` output that the CI workflow reads and injects into the frontend build as `VITE_API_BASE_URL`.

## Docker Compose Preview (Built Frontend)

Docker Compose lets you describe one or more containers in a single YAML file, then start and stop them with one command. In this project, Compose is useful for a simple production-like frontend preview: it builds the Vite app once, serves static files through Nginx, and runs on a stable local port.

What this gives you:

- A repeatable preview environment for teammates (same commands, same containerized runtime).
- A closer match to deployment behavior than `vite` dev mode.
- A clean way to add more services later (for example, local API simulation, reverse proxy, or observability tools).

Files:

- `docker-compose.yml`: defines `localstack`, `localstack-init`, and `frontend-preview` services.
- `tweeter-web/Dockerfile`: multi-stage build (Node build stage, Nginx runtime stage).
- `.env.docker-preview.example`: example `VITE_API_BASE_URL` for Compose builds.

Quick start:

1. Optionally copy `.env.docker-preview.example` to `.env` at the repo root and set `VITE_API_BASE_URL`.
2. Start the local infrastructure + frontend preview containers:
   - `npm run local:preview`
3. Start the local API (host SAM local against LocalStack):
   - `npm run local:api`
4. Open the app at `http://localhost:4173`.
5. Stop everything when done:
   - `npm run local:down`

Notes:

- `VITE_API_BASE_URL` is a build-time variable for Vite. If you change it, rebuild the image.
- Local API traffic still goes through host SAM local (`http://127.0.0.1:3000`) and uses LocalStack endpoints via environment variables.
- To use a different region, export `AWS_REGION` before starting Compose.
