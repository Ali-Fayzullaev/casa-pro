import { describe, it, expect, beforeAll } from 'vitest';

const BASE = 'http://localhost:3001/api';

// Helper: login and get token
async function login(email: string, password: string): Promise<{ token: string; user: any }> {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`Login failed for ${email}: ${res.status}`);
  return res.json() as Promise<{ token: string; user: any }>;
}

// Helper: authenticated GET
async function get(path: string, token: string) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return { status: res.status, data: await res.json().catch(() => null) as any };
}

// Helper: authenticated POST
async function post(path: string, token: string, body?: any) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json().catch(() => null) as any };
}

// Helper: authenticated PUT
async function put(path: string, token: string, body?: any) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json().catch(() => null) as any };
}

// Helper: authenticated DELETE
async function del(path: string, token: string) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  return { status: res.status, data: await res.json().catch(() => null) as any };
}

// ── Tokens ──
let adminToken = '';
let brokerToken = '';
let developerToken = '';
let realtorToken = '';
let agencyToken = '';

beforeAll(async () => {
  const admin = await login('admin@casa.kz', 'Test1234');
  adminToken = admin.token;

  const broker = await login('broker@casa.kz', 'Test1234');
  brokerToken = broker.token;

  const developer = await login('developer@casa.kz', 'Test1234');
  developerToken = developer.token;

  const realtor = await login('realtor@casa.kz', 'Test1234');
  realtorToken = realtor.token;

  const agency = await login('agency@casa.kz', 'Test1234');
  agencyToken = agency.token;
});

// ═══════════════════════════════════════════
// 1. AUTH
// ═══════════════════════════════════════════
describe('Auth', () => {
  it('POST /auth/login — valid credentials', async () => {
    const res = await post('/auth/login', '', { email: 'admin@casa.kz', password: 'Test1234' });
    expect(res.status).toBe(200);
    expect(res.data.token).toBeDefined();
    expect(res.data.user.role).toBe('ADMIN');
  });

  it('POST /auth/login — invalid password', async () => {
    const res = await post('/auth/login', '', { email: 'admin@casa.kz', password: 'wrong' });
    expect([400, 401]).toContain(res.status);
  });

  it('GET /auth/me — authenticated', async () => {
    const res = await get('/auth/me', adminToken);
    expect(res.status).toBe(200);
    expect(res.data.email).toBe('admin@casa.kz');
  });

  it('GET /auth/me — no token', async () => {
    const res = await get('/auth/me', '');
    expect(res.status).toBe(401);
  });
});

// ═══════════════════════════════════════════
// 2. HEALTH
// ═══════════════════════════════════════════
describe('Health', () => {
  it('GET /health', async () => {
    const res = await fetch(`http://localhost:3001/health`);
    const data: any = await res.json();
    expect(res.status).toBe(200);
    expect(data.status).toBe('ok');
    expect(data.db).toBe('connected');
  });
});

// ═══════════════════════════════════════════
// 3. USERS (ADMIN only)
// ═══════════════════════════════════════════
describe('Users (ADMIN)', () => {
  it('GET /admin/users — admin can list', async () => {
    const res = await get('/admin/users', adminToken);
    expect(res.status).toBe(200);
  });

  it('GET /admin/users — broker forbidden', async () => {
    const res = await get('/admin/users', brokerToken);
    expect(res.status).toBe(403);
  });

  it('GET /admin/users — realtor forbidden', async () => {
    const res = await get('/admin/users', realtorToken);
    expect(res.status).toBe(403);
  });
});

// ═══════════════════════════════════════════
// 4. DASHBOARD
// ═══════════════════════════════════════════
describe('Dashboard', () => {
  it('GET /dashboard/stats — admin', async () => {
    const res = await get('/dashboard/stats', adminToken);
    expect([200, 404]).toContain(res.status);
  });

  it('GET /dashboard/stats — broker', async () => {
    const res = await get('/dashboard/stats', brokerToken);
    expect([200, 404]).toContain(res.status);
  });
});

// ═══════════════════════════════════════════
// 5. SELLERS
// ═══════════════════════════════════════════
describe('Sellers', () => {
  let sellerId = '';

  it('GET /sellers — broker can list', async () => {
    const res = await get('/sellers', brokerToken);
    expect(res.status).toBe(200);
    expect(res.data.sellers).toBeDefined();
  });

  it('POST /sellers — broker can create', async () => {
    const res = await post('/sellers', brokerToken, {
      firstName: 'Тест',
      lastName: 'Продавец',
      phone: '+77770001111',
    });
    expect(res.status).toBe(201);
    expect(res.data.id).toBeDefined();
    sellerId = res.data.id;
  });

  it('GET /sellers/:id — broker can view own', async () => {
    if (!sellerId) return;
    const res = await get(`/sellers/${sellerId}`, brokerToken);
    expect(res.status).toBe(200);
    expect(res.data.firstName).toBe('Тест');
  });

  it('PUT /sellers/:id — broker can update', async () => {
    if (!sellerId) return;
    const res = await put(`/sellers/${sellerId}`, brokerToken, { firstName: 'Обновлён' });
    expect(res.status).toBe(200);
    expect(res.data.firstName).toBe('Обновлён');
  });

  it('DELETE /sellers/:id — broker can archive', async () => {
    if (!sellerId) return;
    const res = await del(`/sellers/${sellerId}`, brokerToken);
    expect(res.status).toBe(200);
  });

  it('POST /sellers/:id/restore — broker can restore', async () => {
    if (!sellerId) return;
    const res = await post(`/sellers/${sellerId}/restore`, brokerToken);
    expect(res.status).toBe(200);
  });

  it('DELETE /sellers/:id/permanent — broker can permanently delete', async () => {
    if (!sellerId) return;
    const res = await del(`/sellers/${sellerId}/permanent`, brokerToken);
    expect([200, 204]).toContain(res.status);
  });
});

// ═══════════════════════════════════════════
// 6. CLIENTS
// ═══════════════════════════════════════════
describe('Clients', () => {
  let clientId = '';

  it('GET /clients — broker can list', async () => {
    const res = await get('/clients', brokerToken);
    expect(res.status).toBe(200);
  });

  it('POST /clients — broker can create', async () => {
    const res = await post('/clients', brokerToken, {
      firstName: 'Тест',
      lastName: 'Клиент',
      phone: '+77770002222',
      iin: '990101000111',
    });
    expect(res.status).toBe(201);
    clientId = res.data.id;
  });

  it('GET /clients/:id — broker can view', async () => {
    if (!clientId) return;
    const res = await get(`/clients/${clientId}`, brokerToken);
    expect(res.status).toBe(200);
  });

  it('DELETE /clients/:id — broker can delete', async () => {
    if (!clientId) return;
    const res = await del(`/clients/${clientId}`, brokerToken);
    expect(res.status).toBe(200);
  });
});

// ═══════════════════════════════════════════
// 7. PROJECTS (DEVELOPER/ADMIN)
// ═══════════════════════════════════════════
describe('Projects', () => {
  let projectId = '';

  it('GET /projects — all roles can list', async () => {
    const res = await get('/projects', brokerToken);
    expect(res.status).toBe(200);
    expect(res.data.projects).toBeDefined();
  });

  it('POST /projects — developer can create', async () => {
    const res = await post('/projects', developerToken, {
      name: 'Тест ЖК',
      city: 'Астана',
      address: 'ул. Тестовая 1',
    });
    expect(res.status).toBe(201);
    projectId = res.data.id;
  });

  it('POST /projects — broker forbidden', async () => {
    const res = await post('/projects', brokerToken, {
      name: 'Тест',
      city: 'Астана',
      address: 'ул. Тест',
    });
    expect(res.status).toBe(403);
  });

  it('DELETE /projects/:id — developer can delete own', async () => {
    if (!projectId) return;
    const res = await del(`/projects/${projectId}`, developerToken);
    expect(res.status).toBe(200);
  });
});

// ═══════════════════════════════════════════
// 8. DEALS
// ═══════════════════════════════════════════
describe('Deals', () => {
  let dealId = '';

  it('GET /deals — broker can list', async () => {
    const res = await get('/deals', brokerToken);
    expect(res.status).toBe(200);
    expect(res.data.deals).toBeDefined();
  });

  it('POST /deals — broker can create', async () => {
    const res = await post('/deals', brokerToken, {
      amount: 50000000,
      commission: 500000,
      casaFee: 100000,
      objectType: 'PROPERTY',
    });
    expect(res.status).toBe(201);
    dealId = res.data.id;
  });

  it('PUT /deals/:id — broker can update', async () => {
    if (!dealId) return;
    const res = await put(`/deals/${dealId}`, brokerToken, { notes: 'Тестовая заметка' });
    expect(res.status).toBe(200);
  });

  it('DELETE /deals/:id — broker can delete own', async () => {
    if (!dealId) return;
    const res = await del(`/deals/${dealId}`, brokerToken);
    expect(res.status).toBe(200);
  });
});

// ═══════════════════════════════════════════
// 9. NOTIFICATIONS
// ═══════════════════════════════════════════
describe('Notifications', () => {
  it('GET /notifications — broker can list', async () => {
    const res = await get('/notifications', brokerToken);
    expect(res.status).toBe(200);
  });
});

// ═══════════════════════════════════════════
// 10. MORTGAGE
// ═══════════════════════════════════════════
describe('Mortgage', () => {
  it('POST /mortgage/calculate — broker can calculate', async () => {
    const res = await post('/mortgage/calculate', brokerToken, {
      propertyPrice: 50000000,
      initialPayment: 10000000,
      interestRate: 7.5,
      termMonths: 240,
      clientId: 'test',
    });
    expect([200, 400]).toContain(res.status);
  });
});

// ═══════════════════════════════════════════
// 11. MORTGAGE PROGRAMS
// ═══════════════════════════════════════════
describe('Mortgage Programs', () => {
  it('GET /mortgage-programs — all can list', async () => {
    const res = await get('/mortgage-programs', brokerToken);
    expect(res.status).toBe(200);
  });
});

// ═══════════════════════════════════════════
// 12. COURSES
// ═══════════════════════════════════════════
describe('Courses', () => {
  it('GET /courses — broker can list', async () => {
    const res = await get('/courses', brokerToken);
    expect(res.status).toBe(200);
  });
});

// ═══════════════════════════════════════════
// 13. IMPORT (ADMIN only)
// ═══════════════════════════════════════════
describe('Import (ADMIN)', () => {
  it('POST /import/upload — broker forbidden', async () => {
    const res = await post('/import/upload', brokerToken);
    expect(res.status).toBe(403);
  });

  it('POST /import/execute — realtor forbidden', async () => {
    const res = await post('/import/execute', realtorToken);
    expect(res.status).toBe(403);
  });
});

// ═══════════════════════════════════════════
// 14. SUBSCRIPTIONS
// ═══════════════════════════════════════════
describe('Subscriptions', () => {
  it('GET /subscriptions/my — broker can get own', async () => {
    const res = await get('/subscriptions/my', brokerToken);
    expect(res.status).toBe(200);
  });

  it('GET /subscriptions — admin can list all', async () => {
    const res = await get('/subscriptions', adminToken);
    expect(res.status).toBe(200);
  });

  it('GET /subscriptions — broker forbidden', async () => {
    const res = await get('/subscriptions', brokerToken);
    expect(res.status).toBe(403);
  });
});

// ═══════════════════════════════════════════
// 15. SETTINGS (ADMIN only)
// ═══════════════════════════════════════════
describe('Settings (ADMIN)', () => {
  it('GET /admin/settings — admin can access', async () => {
    const res = await get('/admin/settings', adminToken);
    expect(res.status).toBe(200);
  });

  it('GET /admin/settings — broker forbidden', async () => {
    const res = await get('/admin/settings', brokerToken);
    expect(res.status).toBe(403);
  });
});

// ═══════════════════════════════════════════
// 16. AGENCY
// ═══════════════════════════════════════════
describe('Agency', () => {
  it('GET /agency/team — agency can list team', async () => {
    const res = await get('/agency/team', agencyToken);
    expect(res.status).toBe(200);
  });

  it('GET /agency/team — broker forbidden', async () => {
    const res = await get('/agency/team', brokerToken);
    expect(res.status).toBe(403);
  });

  it('GET /agency/team — admin forbidden', async () => {
    const res = await get('/agency/team', adminToken);
    expect(res.status).toBe(403);
  });
});

// ═══════════════════════════════════════════
// 17. CRM PROPERTIES
// ═══════════════════════════════════════════
describe('CRM Properties', () => {
  it('GET /crm-properties — broker can list', async () => {
    const res = await get('/crm-properties', brokerToken);
    expect(res.status).toBe(200);
    expect(res.data.properties).toBeDefined();
  });

  it('GET /crm-properties/funnel-stats — broker can get stats', async () => {
    const res = await get('/crm-properties/funnel-stats', brokerToken);
    expect(res.status).toBe(200);
  });
});

// ═══════════════════════════════════════════
// 18. BUYERS
// ═══════════════════════════════════════════
describe('Buyers', () => {
  it('GET /buyers — broker can list', async () => {
    const res = await get('/buyers', brokerToken);
    expect(res.status).toBe(200);
  });
});

// ═══════════════════════════════════════════
// 19. TASKS
// ═══════════════════════════════════════════
describe('Tasks', () => {
  it('GET /tasks — broker can list', async () => {
    const res = await get('/tasks', brokerToken);
    expect(res.status).toBe(200);
  });
});

// ═══════════════════════════════════════════
// 20. PAYMENTS
// ═══════════════════════════════════════════
describe('Payments', () => {
  it('GET /payments — admin can list', async () => {
    const res = await get('/payments', adminToken);
    expect(res.status).toBe(200);
  });
});

// ═══════════════════════════════════════════
// 21. FORMS
// ═══════════════════════════════════════════
describe('Forms', () => {
  it('GET /forms — broker can list', async () => {
    const res = await get('/forms', brokerToken);
    expect(res.status).toBe(200);
  });
});

// ═══════════════════════════════════════════
// 22. CUSTOM FUNNELS
// ═══════════════════════════════════════════
describe('Custom Funnels', () => {
  it('GET /custom-funnels — broker can list', async () => {
    const res = await get('/custom-funnels', brokerToken);
    expect(res.status).toBe(200);
  });
});

// ═══════════════════════════════════════════
// 23. EVENTS
// ═══════════════════════════════════════════
describe('Events', () => {
  it('GET /events — broker can list', async () => {
    const res = await get('/events', brokerToken);
    expect(res.status).toBe(200);
  });
});

// ═══════════════════════════════════════════
// 24. ANALYTICS
// ═══════════════════════════════════════════
describe('Analytics', () => {
  it('GET /analytics/dashboard — broker can access', async () => {
    const res = await get('/analytics/dashboard', brokerToken);
    expect([200, 404]).toContain(res.status);
  });
});

// ═══════════════════════════════════════════
// 25. MORTGAGE APPLICATIONS
// ═══════════════════════════════════════════
describe('Mortgage Applications', () => {
  it('GET /mortgage-applications — broker can list', async () => {
    const res = await get('/mortgage-applications', brokerToken);
    expect(res.status).toBe(200);
  });
});

// ═══════════════════════════════════════════
// 26. CROSS-ROLE ACCESS TESTS
// ═══════════════════════════════════════════
describe('Cross-Role Access', () => {
  it('Broker cannot access admin users', async () => {
    const res = await get('/admin/users', brokerToken);
    expect(res.status).toBe(403);
  });

  it('Realtor cannot access admin settings', async () => {
    const res = await get('/admin/settings', realtorToken);
    expect(res.status).toBe(403);
  });

  it('Developer cannot access agency team', async () => {
    const res = await get('/agency/team', developerToken);
    expect(res.status).toBe(403);
  });

  it('Agency cannot access admin users', async () => {
    const res = await get('/admin/users', agencyToken);
    expect(res.status).toBe(403);
  });

  it('No token — all protected routes return 401', async () => {
    const routes = ['/sellers', '/clients', '/deals', '/projects', '/dashboard', '/notifications'];
    for (const route of routes) {
      const res = await get(route, '');
      expect(res.status).toBe(401);
    }
  });
});
