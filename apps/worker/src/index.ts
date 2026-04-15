import { bootstrapWorker } from '@bug-agent/orchestrator';

const port = Number(process.env.WORKER_PORT ?? 4500);
const worker = bootstrapWorker();

console.log(`[worker] ${worker.name} ready on port ${port}`);
console.log(`[worker] queues: ${worker.queues.join(', ')}`);
