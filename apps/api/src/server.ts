import http from 'node:http';
import { createBootstrapSummary } from '@bug-agent/orchestrator';

export function createApiServer() {
  return http.createServer((req, res) => {
    if (req.url === '/health') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok' }));
      return;
    }

    if (req.url === '/bootstrap') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify(createBootstrapSummary()));
      return;
    }

    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(
      JSON.stringify({
        name: 'AI Bug Resolution Agent API',
        phase: 1,
        status: 'scaffolded',
      }),
    );
  });
}
