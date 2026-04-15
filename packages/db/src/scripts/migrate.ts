import { getPhaseOneMigrationPlan } from '../index.js';

const plan = getPhaseOneMigrationPlan();
console.log(`[db] phase ${plan.phase} migration scaffold ready`);
console.log(`[db] planned tables: ${plan.pendingTables.join(', ')}`);
