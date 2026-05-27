
  # Vitawatch

  This is a code bundle for Vitawatch. The original project is available at https://www.figma.com/design/5UGVYcO6mA3AebwyUEccHK/Vitawatch.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  ## Deploying to Railway

  Use `frontend` as the service root directory.

  Set the build command to `pnpm install --frozen-lockfile && pnpm build`.

  Set the start command to `pnpm start`.

  Set `VITE_API_BASE_URL` to the deployed backend API root, for example `https://<your-backend-service>.up.railway.app/api/v1`.

  Railway will provide the `PORT` environment variable automatically, and the app will listen on that port in production.
  