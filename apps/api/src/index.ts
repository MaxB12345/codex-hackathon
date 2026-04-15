import { createApiServer } from './server.js';

const port = Number(process.env.PORT ?? 4000);

const server = createApiServer();
server.listen(port, () => {
  console.log(`[api] listening on http://localhost:${port}`);
});
