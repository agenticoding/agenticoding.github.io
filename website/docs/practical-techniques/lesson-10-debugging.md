---
sidebar_position: 5
sidebar_label: 'Lesson 10: Debugging'
---

# Lesson 10: Debugging with AI Agents

Debugging with AI agents isn't about asking "what's wrong with my code?" It's about systematically placing agents in diagnostic environments where they can observe, reproduce, and verify fixes with evidence.

## Learning Objectives

- Apply systematic debugging methodology with AI agents as diagnostic tools
- Build reproducible environments that isolate bugs for agent inspection
- Configure agents with direct access to logs, databases, and runtime state
- Establish evidence-based verification before accepting proposed solutions

## The Debugging Mindset: Scientific Method Over Guesswork

Traditional debugging with AI assistants often looks like this:

```
Engineer: "This endpoint is returning 500 errors. Fix it."
Agent: "The issue is likely in the database query. Try this..."
Engineer: *applies patch blindly*
Result: Bug persists, or new bug introduced
```

Production debugging requires the scientific method:

1. **Observe** - Collect data (logs, metrics, traces)
2. **Hypothesize** - Form testable theories about root cause
3. **Reproduce** - Isolate the bug in a controlled environment
4. **Test** - Verify the hypothesis with evidence
5. **Fix** - Apply solution with regression tests
6. **Verify** - Confirm fix resolves the issue without side effects

AI agents excel when you give them access to the full diagnostic environment, not just a description of symptoms.

## Code Inspection: Teaching Agents to Read Runtime State

Before diving into reproduction, agents need to understand what's actually happening in your system.

### Static Analysis First

Give agents the full execution path:

```bash
# Bad: "Debug this API endpoint"
# Good: Give context
"""
Debug the `/api/orders/:id` endpoint returning 500 errors.

Stack trace from production:
[paste stack trace]

Read these files to understand the flow:
- src/api/orders.ts (HTTP handler)
- src/services/OrderService.ts (business logic)
- src/db/OrderRepository.ts (data access)
- src/middleware/auth.ts (authentication)

Check for:
- Unhandled promise rejections
- Missing null checks
- Race conditions in async operations
"""
```

### Dynamic Inspection with Debug Scripts

For production issues, create inspection scripts that agents can run:

```typescript
// scripts/debug-order-500.ts
import { OrderService } from '../src/services/OrderService';
import { logger } from '../src/utils/logger';

async function inspectOrder(orderId: string) {
  logger.info('Starting order inspection', { orderId });

  // Check database state
  const order = await db.orders.findById(orderId);
  logger.info('Order record', { order });

  // Check related entities
  const items = await db.orderItems.findByOrderId(orderId);
  logger.info('Order items', { items, count: items.length });

  // Check user state
  const user = await db.users.findById(order.userId);
  logger.info('User state', {
    userId: user.id,
    status: user.status,
    permissions: user.permissions,
  });

  // Reproduce the operation
  try {
    const result = await OrderService.calculateTotal(orderId);
    logger.info('Calculate total succeeded', { result });
  } catch (error) {
    logger.error('Calculate total failed', { error, orderId });
    throw error;
  }
}

// Run with: npm run debug:order -- <order-id>
const orderId = process.argv[2];
inspectOrder(orderId).catch((err) => {
  logger.error('Inspection failed', { err });
  process.exit(1);
});
```

**Agent workflow:**

```
Engineer: "Run scripts/debug-order-500.ts with order ID abc123 and analyze the output."
Agent: *executes script, reads logs, identifies null reference in items array*
Agent: "The bug is in OrderService.calculateTotal() - it doesn't handle orders with zero items."
Engineer: "Show me the evidence in the logs."
Agent: *points to specific log line showing items.length === 0 causing undefined access*
```

## Reproduction: Isolating Bugs in Controlled Environments

Reproducibility is everything. If you can't reproduce it, you can't verify the fix.

### Docker-Based Reproduction

Create isolated environments that capture production state:

```dockerfile
# Dockerfile.debug
FROM node:20-alpine

WORKDIR /app

# Install debugging tools
RUN apk add --no-cache curl jq postgresql-client redis

# Copy application code
COPY package*.json ./
RUN npm ci --only=production
COPY . .

# Add debug entrypoint
COPY scripts/debug-entrypoint.sh /debug-entrypoint.sh
RUN chmod +x /debug-entrypoint.sh

ENTRYPOINT ["/debug-entrypoint.sh"]
```

```bash
# scripts/debug-entrypoint.sh
#!/bin/sh
set -e

echo "=== Debug Environment Setup ==="
echo "Node version: $(node --version)"
echo "Environment: ${NODE_ENV}"
echo "Database: ${DATABASE_URL}"

# Verify connectivity
echo "Testing database connection..."
pg_isready -h ${DB_HOST} -p ${DB_PORT} || exit 1

echo "Testing Redis connection..."
redis-cli -h ${REDIS_HOST} ping || exit 1

echo "=== Starting application in debug mode ==="
exec node --inspect=0.0.0.0:9229 dist/server.js
```

```yaml
# docker-compose.debug.yml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.debug
    ports:
      - '3000:3000'
      - '9229:9229' # Node debugger
    environment:
      NODE_ENV: development
      DATABASE_URL: postgres://user:pass@postgres:5432/app_db
      REDIS_URL: redis://redis:6379
      LOG_LEVEL: debug
    volumes:
      - ./logs:/app/logs
      - ./scripts:/app/scripts
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: app_db
    volumes:
      - ./db/dump.sql:/docker-entrypoint-initdb.d/dump.sql

  redis:
    image: redis:7-alpine

  pgadmin:
    image: dpage/pgadmin4
    ports:
      - '5050:80'
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@example.com
      PGADMIN_DEFAULT_PASSWORD: admin
```

**Agent workflow:**

```
Engineer: "Reproduce the order calculation bug using docker-compose.debug.yml"

Agent workflow:
1. Reads docker-compose.debug.yml to understand environment
2. Runs: docker-compose -f docker-compose.debug.yml up -d
3. Waits for services to be healthy
4. Loads test data: docker-compose exec postgres psql -U user -d app_db -f /scripts/test-data.sql
5. Executes reproduction script: docker-compose exec app node scripts/debug-order-500.ts abc123
6. Collects logs: docker-compose logs app > logs/reproduction.log
7. Analyzes logs and identifies root cause
```

### Reproduction Scripts with Snapshots

For complex state-dependent bugs, capture and restore exact state:

```typescript
// scripts/snapshot-production-state.ts
import { db } from '../src/db';
import { writeFileSync } from 'fs';

async function captureState(orderId: string) {
  const snapshot = {
    timestamp: new Date().toISOString(),
    order: await db.orders.findById(orderId),
    items: await db.orderItems.findByOrderId(orderId),
    user: await db.users.findById(order.userId),
    inventory: await db.inventory.findByProductIds(
      items.map((i) => i.productId)
    ),
    config: await db.config.findActive(),
  };

  writeFileSync(
    `snapshots/${orderId}-${Date.now()}.json`,
    JSON.stringify(snapshot, null, 2)
  );

  return snapshot;
}
```

```typescript
// scripts/restore-snapshot.ts
import { db } from '../src/db';
import { readFileSync } from 'fs';

async function restoreState(snapshotPath: string) {
  const snapshot = JSON.parse(readFileSync(snapshotPath, 'utf-8'));

  await db.transaction(async (tx) => {
    // Restore in dependency order
    await tx.users.upsert(snapshot.user);
    await tx.config.upsert(snapshot.config);
    await tx.orders.upsert(snapshot.order);
    await tx.orderItems.bulkUpsert(snapshot.items);
    await tx.inventory.bulkUpsert(snapshot.inventory);
  });

  console.log(`Restored state from ${snapshot.timestamp}`);
}
```

**Agent prompt:**

```
"Restore snapshot snapshots/abc123-1738123456.json in the debug environment
and reproduce the calculation bug. Provide evidence of the failure."
```

## Agents Inspecting Logs and Databases

Don't make agents guess. Give them read access to actual system state.

### Structured Log Analysis

Format logs for agent consumption:

```typescript
// src/utils/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: 'logs/debug.log',
      level: 'debug',
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),
  ],
});

// Usage in code
logger.debug('OrderService.calculateTotal called', {
  orderId: order.id,
  itemCount: items.length,
  userTier: user.tier,
});
```

**Agent analysis workflow:**

```bash
# Give agent grep-friendly access
Engineer: "Analyze logs/debug.log for order abc123 failures"

Agent: *runs grep commands*
grep -A 10 '"orderId":"abc123"' logs/debug.log | grep '"level":"error"'

Agent: *identifies pattern*
"Found 15 error logs. Common pattern: items array is empty causing
undefined reference in calculateDiscount(). Evidence:
- Line 4521: items.length === 0
- Line 4523: items[0].price throws TypeError
- Stack trace points to src/services/OrderService.ts:87"
```

### Database Inspection Helpers

Create read-only access for agents:

```typescript
// scripts/db-inspector.ts
import { db } from '../src/db';

const inspectors = {
  async order(orderId: string) {
    const order = await db.orders.findById(orderId);
    const items = await db.orderItems.findByOrderId(orderId);
    const user = await db.users.findById(order.userId);

    return {
      order,
      items,
      user,
      diagnostics: {
        totalItems: items.length,
        totalValue: items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        ),
        userStatus: user.status,
        orderStatus: order.status,
      },
    };
  },

  async user(userId: string) {
    const user = await db.users.findById(userId);
    const orders = await db.orders.findByUserId(userId);
    const recentActivity = await db.activity.findByUserId(userId, {
      limit: 50,
    });

    return { user, orders, recentActivity };
  },
};

// CLI: npm run inspect -- order abc123
const [type, id] = process.argv.slice(2);
inspectors[type](id).then((data) => console.log(JSON.stringify(data, null, 2)));
```

**Agent workflow:**

```
Engineer: "Inspect order abc123 and user xyz789 in the debug environment"

Agent:
1. Runs: docker-compose exec app npm run inspect -- order abc123
2. Runs: docker-compose exec app npm run inspect -- user xyz789
3. Analyzes both outputs
4. Identifies: "User xyz789 has status='suspended' but order abc123
   was created after suspension. Bug is in order creation validation."
```

## Remote Debugging with Helper Scripts

For production issues that can't be fully reproduced locally, create safe debugging interfaces.

### Read-Only Production Queries

```typescript
// scripts/prod-readonly-query.ts
import { createReadOnlyConnection } from '../src/db';

const ALLOWED_QUERIES = {
  orderDetails: `
    SELECT o.*, json_agg(oi.*) as items
    FROM orders o
    LEFT JOIN order_items oi ON oi.order_id = o.id
    WHERE o.id = $1
    GROUP BY o.id
  `,
  userOrders: `
    SELECT * FROM orders
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT 50
  `,
};

async function query(queryName: keyof typeof ALLOWED_QUERIES, params: any[]) {
  const db = createReadOnlyConnection(process.env.PROD_REPLICA_URL);

  try {
    const result = await db.query(ALLOWED_QUERIES[queryName], params);
    return result.rows;
  } finally {
    await db.end();
  }
}

// Usage: npm run prod:query -- orderDetails abc123
const [queryName, ...params] = process.argv.slice(2);
query(queryName as any, params).then((data) =>
  console.log(JSON.stringify(data, null, 2))
);
```

### Production Log Streaming

```bash
# scripts/stream-prod-logs.sh
#!/bin/bash
set -e

NAMESPACE=${1:-production}
POD_FILTER=${2:-app}

echo "Streaming logs from ${NAMESPACE}/${POD_FILTER}..."

kubectl logs -f -n ${NAMESPACE} \
  -l app=${POD_FILTER} \
  --tail=100 \
  --timestamps \
  | jq -r 'select(.level == "error" or .level == "warn") | "\(.timestamp) [\(.level | ascii_upcase)] \(.message) \(.context | tostring)"'
```

**Agent workflow:**

```
Engineer: "Stream production logs and identify patterns in order failures"

Agent:
1. Runs: bash scripts/stream-prod-logs.sh production order-service > logs/prod-stream.log
2. Waits 60 seconds to collect sample
3. Analyzes logs: grep -E "OrderService|calculateTotal" logs/prod-stream.log
4. Identifies: "Pattern found: 23 failures in the last minute, all for
   orders with promo codes. Database query timeout after 30s."
```

## Requiring Evidence Before Accepting Solutions

Never accept "this should fix it" without proof.

### Evidence-Based Verification Workflow

````
Step 1: Agent proposes a fix
Step 2: Engineer demands evidence

Engineer: "Show me proof this fix works. I need:
1. Reproduction showing the bug BEFORE your fix
2. Test output showing the bug is fixed AFTER your change
3. Regression tests proving no side effects"

Step 3: Agent provides evidence

Agent:
1. Runs reproduction: npm run debug:order -- abc123
   Output: "TypeError: Cannot read property 'price' of undefined"

2. Applies fix to OrderService.calculateTotal():
   ```diff
   -  const firstItem = items[0];
   +  if (items.length === 0) {
   +    return { total: 0, discount: 0 };
   +  }
   +  const firstItem = items[0];
````

3. Reruns reproduction: npm run debug:order -- abc123
   Output: "Order total: $0 (no items)"

4. Runs tests: npm test -- OrderService
   Output: "12/12 tests passed"

5. Runs integration tests: npm run test:integration
   Output: "45/45 tests passed"

Step 4: Engineer reviews and approves

````

### Automated Verification Scripts

Build verification into your debugging workflow:

```typescript
// scripts/verify-fix.ts
import { execSync } from 'child_process';
import { logger } from '../src/utils/logger';

interface VerificationStep {
  name: string;
  command: string;
  expectedOutput?: RegExp;
  mustFail?: boolean;
}

const VERIFICATION_STEPS: VerificationStep[] = [
  {
    name: 'Reproduce bug (should fail)',
    command: 'npm run debug:order -- abc123',
    mustFail: true,
  },
  {
    name: 'Run unit tests',
    command: 'npm test -- OrderService',
    expectedOutput: /\d+ passed/,
  },
  {
    name: 'Run integration tests',
    command: 'npm run test:integration',
    expectedOutput: /\d+ passed/,
  },
  {
    name: 'Verify fix (should succeed)',
    command: 'npm run debug:order -- abc123',
    expectedOutput: /Order total: \$\d+/,
  },
];

async function verify() {
  for (const step of VERIFICATION_STEPS) {
    logger.info(`Running: ${step.name}`);

    try {
      const output = execSync(step.command, { encoding: 'utf-8' });

      if (step.mustFail) {
        logger.error(`FAILED: ${step.name} should have failed but succeeded`);
        return false;
      }

      if (step.expectedOutput && !step.expectedOutput.test(output)) {
        logger.error(`FAILED: ${step.name} output doesn't match expected pattern`);
        return false;
      }

      logger.info(`PASSED: ${step.name}`);
    } catch (error) {
      if (!step.mustFail) {
        logger.error(`FAILED: ${step.name}`, { error });
        return false;
      }
      logger.info(`PASSED: ${step.name} (expected failure)`);
    }
  }

  logger.info('All verification steps passed');
  return true;
}

verify().then((success) => process.exit(success ? 0 : 1));
````

**Agent workflow:**

```
Engineer: "Fix the order calculation bug and run scripts/verify-fix.ts to prove it works"

Agent:
1. Proposes fix
2. Applies fix
3. Runs: npm run verify:fix
4. Reports: "All 4 verification steps passed. Evidence: [logs output]"
```

### Regression Test Requirements

Every fix must include a regression test:

```typescript
// tests/bugs/order-empty-items-regression.test.ts
import { OrderService } from '../../src/services/OrderService';
import { createTestOrder } from '../fixtures/orders';

describe('Bug: Order with zero items causes TypeError', () => {
  it('should handle orders with no items gracefully', async () => {
    // Reproduce the exact scenario from production
    const order = await createTestOrder({
      id: 'test-order',
      userId: 'test-user',
      items: [], // Empty items array caused the bug
    });

    // This threw TypeError before the fix
    const result = await OrderService.calculateTotal(order.id);

    // After fix, should return zero total
    expect(result).toEqual({
      total: 0,
      discount: 0,
      tax: 0,
      grandTotal: 0,
    });
  });

  it('should handle null items array', async () => {
    const order = await createTestOrder({
      id: 'test-order-2',
      userId: 'test-user',
      items: null as any, // Edge case
    });

    const result = await OrderService.calculateTotal(order.id);
    expect(result.total).toBe(0);
  });
});
```

**Engineer requirement:**

```
"Before I accept this fix, show me:
1. The regression test you added
2. Proof the test fails on the broken code
3. Proof the test passes on the fixed code
4. Full test suite still passing"
```

## Hands-On Exercise: Debug a Production Memory Leak

**Scenario:** Your Node.js API is experiencing memory leaks in production. Memory usage grows steadily until the process crashes with OOM errors after 6-8 hours of uptime.

**Your Task:**

1. **Setup Reproduction Environment**
   - Create a Docker Compose setup that includes your API, PostgreSQL, and monitoring tools (Prometheus/Grafana)
   - Add heap dump capture on OOM: `node --max-old-space-size=512 --heapsnapshot-on-oom`
   - Load test script to simulate production traffic

2. **Build Inspection Tools**
   - Script to capture heap snapshots on demand
   - Script to analyze heap growth over time
   - Database query to check for connection leaks

3. **Agent-Driven Investigation**

   ```
   Prompt: "Investigate the memory leak in this application. Steps:
   1. Start the reproduction environment
   2. Run the load test for 30 minutes
   3. Capture heap snapshots every 5 minutes
   4. Analyze heap growth patterns
   5. Identify the source of the leak
   6. Propose a fix with evidence"
   ```

4. **Verify the Fix**
   - Run 8-hour load test before and after
   - Compare memory profiles
   - Ensure fix doesn't impact performance

**Expected Outcome:**

- Reproducible environment that demonstrates the leak
- Agent identifies the root cause (e.g., event listener accumulation, unclosed DB connections)
- Fix includes regression tests
- Evidence showing stable memory usage after fix

**Bonus Challenge:**

- Implement automated memory monitoring that alerts before OOM
- Create a memory leak detection test in CI

## Key Takeaways

- **Systematic debugging beats guesswork** - Apply scientific method: observe, hypothesize, reproduce, test, verify
- **Reproducibility is everything** - Use Docker, snapshots, and scripts to isolate bugs in controlled environments
- **Give agents full diagnostic access** - Logs, databases, runtime state, not just code
- **Remote debugging requires safety** - Read-only queries, controlled access, helper scripts
- **Demand evidence before accepting fixes** - Reproduction before/after, tests passing, no regressions
- **Every bug needs a regression test** - Prevent the same issue from recurring

**Production debugging checklist:**

1. Can you reproduce it in isolation?
2. Does the agent have access to all diagnostic data?
3. Is the fix verified with evidence?
4. Does a regression test prevent recurrence?
5. Are there monitoring gaps to address?

Debugging with AI agents is about **building the right diagnostic environment** and requiring **evidence-based solutions**. The agent is your systematic investigator - give it the tools and demand proof.

---

**Next:** Advanced Topics Module - Optimization and Performance
