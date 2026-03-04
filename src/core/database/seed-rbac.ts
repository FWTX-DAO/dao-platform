import { db } from './index';
import { membershipTiers, roles, permissions, rolePermissions } from './schema';
import { generateId } from '../../shared/utils/id-generator';
import { sql } from 'drizzle-orm';

const RBAC_RESOURCES = ['forum', 'projects', 'bounties', 'members', 'documents', 'meetings', 'admin'] as const;
const RBAC_ACTIONS = ['create', 'read', 'update', 'delete', 'manage'] as const;

async function seedRbac() {
  console.log('Seeding RBAC data...');

  // --------------------------------------------------------
  // 1. Membership Tiers
  // --------------------------------------------------------
  const tierCount = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(membershipTiers)
    .then((r) => r[0]?.count ?? 0);

  if (tierCount === 0) {
    console.log('  Inserting membership tiers...');
    await db.insert(membershipTiers).values([
      {
        id: generateId(),
        name: 'free',
        displayName: 'Free',
        description: 'Basic community access',
        priceCents: 0,
        billingInterval: 'lifetime',
        features: ['Forum access', 'Project browsing', 'Community events'],
        isActive: true,
        sortOrder: 0,
      },
      {
        id: generateId(),
        name: 'pro',
        displayName: 'Pro ($5/mo)',
        description: 'Enhanced member benefits',
        priceCents: 500,
        billingInterval: 'month',
        features: [
          'Forum access',
          'Project creation & collaboration',
          'Bounty submissions',
          'Meeting notes access',
          'Member directory',
          'Priority support',
        ],
        isActive: true,
        sortOrder: 1,
      },
      {
        id: generateId(),
        name: 'annual',
        displayName: 'Annual ($49/yr)',
        description: 'Best value — all Pro features at a discount',
        priceCents: 4900,
        billingInterval: 'year',
        features: [
          'Everything in Pro',
          '2 months free vs monthly',
          'Early access to new features',
          'Exclusive annual member badge',
        ],
        isActive: true,
        sortOrder: 2,
      },
    ]);
    console.log('  Tiers inserted (3 rows)');
  } else {
    console.log(`  Tiers already exist (${tierCount} rows) — skipping`);
  }

  // --------------------------------------------------------
  // 2. Roles
  // --------------------------------------------------------
  const roleCount = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(roles)
    .then((r) => r[0]?.count ?? 0);

  if (roleCount === 0) {
    console.log('  Inserting roles...');
    await db.insert(roles).values([
      {
        id: generateId(),
        name: 'admin',
        displayName: 'Admin',
        description: 'Full platform administration',
        level: 100,
        isSystem: true,
      },
      {
        id: generateId(),
        name: 'moderator',
        displayName: 'Moderator',
        description: 'Content moderation and community management',
        level: 50,
        isSystem: true,
      },
      {
        id: generateId(),
        name: 'member',
        displayName: 'Member',
        description: 'Standard DAO member',
        level: 10,
        isSystem: true,
      },
      {
        id: generateId(),
        name: 'guest',
        displayName: 'Guest',
        description: 'Read-only access',
        level: 0,
        isSystem: true,
      },
    ]);
    console.log('  Roles inserted (4 rows)');
  } else {
    console.log(`  Roles already exist (${roleCount} rows) — skipping`);
  }

  // --------------------------------------------------------
  // 3. Permissions (7 resources x 5 actions = 35 rows)
  // --------------------------------------------------------
  const permCount = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(permissions)
    .then((r) => r[0]?.count ?? 0);

  if (permCount === 0) {
    console.log('  Inserting permissions...');
    const permValues = [];
    for (const resource of RBAC_RESOURCES) {
      for (const action of RBAC_ACTIONS) {
        permValues.push({
          id: generateId(),
          resource,
          action,
          description: `${action} on ${resource}`,
        });
      }
    }
    await db.insert(permissions).values(permValues);
    console.log(`  Permissions inserted (${permValues.length} rows)`);
  } else {
    console.log(`  Permissions already exist (${permCount} rows) — skipping`);
  }

  // --------------------------------------------------------
  // 4. Role-Permission matrix
  // --------------------------------------------------------
  const rpCount = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(rolePermissions)
    .then((r) => r[0]?.count ?? 0);

  if (rpCount === 0) {
    console.log('  Linking role-permissions...');

    // Fetch all roles and permissions
    const allRoles = await db.select().from(roles);
    const allPerms = await db.select().from(permissions);

    const roleMap = new Map(allRoles.map((r) => [r.name, r.id]));
    const now = new Date();

    const rpValues: { roleId: string; permissionId: string; createdAt: Date }[] = [];

    for (const perm of allPerms) {
      // Admin: ALL permissions
      rpValues.push({ roleId: roleMap.get('admin')!, permissionId: perm.id, createdAt: now });

      // Moderator: all except admin.* and *.manage
      if (perm.resource !== 'admin' && perm.action !== 'manage') {
        rpValues.push({ roleId: roleMap.get('moderator')!, permissionId: perm.id, createdAt: now });
      }

      // Member: create, read, update for non-admin resources
      if (perm.resource !== 'admin' && ['create', 'read', 'update'].includes(perm.action)) {
        rpValues.push({ roleId: roleMap.get('member')!, permissionId: perm.id, createdAt: now });
      }

      // Guest: read only for non-admin resources
      if (perm.resource !== 'admin' && perm.action === 'read') {
        rpValues.push({ roleId: roleMap.get('guest')!, permissionId: perm.id, createdAt: now });
      }
    }

    await db.insert(rolePermissions).values(rpValues);
    console.log(`  Role-permissions linked (${rpValues.length} rows)`);
  } else {
    console.log(`  Role-permissions already exist (${rpCount} rows) — skipping`);
  }

  console.log('RBAC seed complete!');
}

seedRbac()
  .then(() => {
    console.log('Seed script finished');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
