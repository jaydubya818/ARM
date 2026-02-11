/**
 * Integration tests for feature flags
 */
import { convexTest } from 'convex-test';
import { expect, test } from 'vitest';
import { api } from './_generated/api';
import schema from './schema';

const modules = import.meta.glob('./**/*.ts');

test('feature flag is disabled when not created', async () => {
  const t = convexTest(schema, modules);
  const tenantId = await t.run(async (ctx) => await ctx.db.insert('tenants', {
    name: 'Test Tenant',
    slug: 'test-tenant',
  }));

  const enabled = await t.query(api.featureFlags.isEnabled, {
    tenantId,
    flagKey: 'new_feature',
  });

  expect(enabled).toBe(false);
});

test('feature flag can be created and enabled', async () => {
  const t = convexTest(schema, modules);
  const [tenantId, operatorId] = await t.run(async (ctx) => {
    const tId = await ctx.db.insert('tenants', {
      name: 'Test Tenant',
      slug: 'test-tenant',
    });
    const oId = await ctx.db.insert('operators', {
      tenantId: tId,
      authIdentity: 'auth|test',
      email: 'test@test.com',
      name: 'Test',
      role: 'admin',
    });
    return [tId, oId];
  });

  await t.mutation(api.featureFlags.create, {
    tenantId,
    key: 'test_flag',
    name: 'Test Flag',
    enabled: true,
    rolloutPercentage: 100,
    createdBy: operatorId,
  });

  const enabled = await t.query(api.featureFlags.isEnabled, {
    tenantId,
    flagKey: 'test_flag',
    operatorId,
  });

  expect(enabled).toBe(true);
});
