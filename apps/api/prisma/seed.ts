import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create test user
  const hashedPassword = await bcrypt.hash('Password123', 12);

  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      username: 'testuser',
      displayName: 'Test User',
      password: hashedPassword,
      settings: {
        create: {
          notificationsEnabled: true,
          nudgeFrequency: 'MODERATE',
          defaultSessionDuration: 25,
          idleThreshold: 120,
          profileVisibility: 'FRIENDS_ONLY',
          showOnLeaderboard: true,
        },
      },
    },
  });

  console.log(`✓ Created test user: ${testUser.email}`);

  // Create a sample focus session
  const session = await prisma.focusSession.create({
    data: {
      userId: testUser.id,
      startTime: new Date(Date.now() - 30 * 60 * 1000), // 30 mins ago
      endTime: new Date(),
      plannedDuration: 1800, // 30 minutes in seconds
      actualDuration: 1800,
      status: 'COMPLETED',
      focusScore: 85,
      idleTime: 270, // 4.5 minutes idle
      nudgeCount: 2,
      pointsEarned: 45,
      tags: ['study', 'coding'],
    },
  });

  console.log(`✓ Created sample session: ${session.id}`);

  // Create some achievements
  const achievements = await prisma.userAchievement.createMany({
    data: [
      {
        userId: testUser.id,
        achievementId: 'focus_1h',
        currentValue: 3600,
        targetValue: 3600,
      },
      {
        userId: testUser.id,
        achievementId: 'sessions_10',
        currentValue: 10,
        targetValue: 10,
      },
    ],
  });

  console.log(`✓ Created ${achievements.count} achievements`);

  // Create points transaction
  await prisma.pointsTransaction.create({
    data: {
      userId: testUser.id,
      amount: 45,
      type: 'SESSION_COMPLETE',
      description: 'Completed 30-minute focus session',
      referenceId: session.id,
    },
  });

  console.log('✓ Created points transaction');

  // Create a study group
  const group = await prisma.studyGroup.create({
    data: {
      name: 'CS Study Group',
      description: 'Computer Science students helping each other focus',
      ownerId: testUser.id,
      isPrivate: false,
      maxMembers: 20,
      weeklyGoal: 36000, // 10 hours in seconds
      inviteCode: 'CS2025',
      members: {
        create: {
          userId: testUser.id,
          role: 'OWNER',
        },
      },
    },
  });

  console.log(`✓ Created study group: ${group.name}`);

  console.log('\n✅ Seeding completed!');
}

main()
  .catch(e => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
