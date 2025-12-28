import { PrismaClient, UserRole, ClientType, BuildingStatus, ApartmentStatus, BookingStatus, DealStatus, DealStage } from '@prisma/client';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');
  console.log('Database URL:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':***@'));

  // 1. Clean up database
  const deletedBookings = await prisma.booking.deleteMany();
  console.log(`Deleted ${deletedBookings.count} bookings`);

  await prisma.deal.deleteMany();
  await prisma.task.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.courseProgress.deleteMany();
  await prisma.course.deleteMany();
  await prisma.mortgageProgram.deleteMany();
  await prisma.client.deleteMany();
  await prisma.apartment.deleteMany();
  await prisma.project.deleteMany();
  await prisma.leadForm.deleteMany(); // Clean Forms

  const deletedUsers = await prisma.user.deleteMany();
  console.log(`Deleted ${deletedUsers.count} users`);

  console.log('🧹 Database cleaned');

  // ... (Users creation remains same) ...
  // 2. Create Users (Admin, Developers, Brokers)
  const passwordHash = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@casa.kz',
      password: passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      phone: '+77010000000',
    },
  });

  const developer = await prisma.user.create({
    data: {
      email: 'developer@bi.group',
      password: passwordHash,
      firstName: 'BI',
      lastName: 'Group',
      role: UserRole.DEVELOPER,
      phone: '+77011111111',
    },
  });

  const brokers = [];
  for (let i = 0; i < 5; i++) {
    const broker = await prisma.user.create({
      data: {
        email: `broker${i + 1}@casa.kz`,
        password: passwordHash,
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        role: UserRole.BROKER,
        phone: faker.phone.number(),
        balance: parseFloat(faker.finance.amount({ min: 0, max: 1000000, dec: 2 })),
      },
    });
    brokers.push(broker);
  }

  console.log('👥 Users created');

  // ... (Projects & Apartments creation remains same) ...
  // 3. Create Projects & Apartments
  const projectNames = ['Green Quarter', 'Nova City', 'Sensata Park', 'Grand Turan', 'Highvill'];
  const districts = ['Есильский', 'Алматинский', 'Сарыаркинский', 'Нура'];

  for (const name of projectNames) {
    const project = await prisma.project.create({
      data: {
        name,
        description: faker.lorem.paragraphs(2),
        city: 'Astana',
        district: faker.helpers.arrayElement(districts),
        address: faker.location.streetAddress(),
        class: faker.helpers.arrayElement(['Comfort', 'Business', 'Premium']),
        buildingStatus: faker.helpers.arrayElement([BuildingStatus.UNDER_CONSTRUCTION, BuildingStatus.COMPLETED]),
        deliveryDate: faker.date.future(),
        developerId: developer.id,
        developerName: 'BI Group',
        developerPhone: '+77019999999',
        images: [
          'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=60',
          'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop&q=60',
          'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=60'
        ],
        bonus: '2% bonus for brokers',
      },
    });

    for (let i = 0; i < 20; i++) {
      await prisma.apartment.create({
        data: {
          projectId: project.id,
          number: `${i + 1}`, // Sequential numbering
          floor: faker.number.int({ min: 1, max: 20 }),
          rooms: faker.number.int({ min: 1, max: 4 }),
          area: faker.number.float({ min: 35, max: 150, fractionDigits: 1 }),
          price: parseFloat(faker.finance.amount({ min: 15000000, max: 80000000, dec: 0 })),
          status: faker.helpers.arrayElement([ApartmentStatus.AVAILABLE, ApartmentStatus.RESERVED, ApartmentStatus.SOLD]),
        },
      });
    }
  }

  console.log('buildings Projects & Apartments created');

  // 4. Create Clients
  const clients = [];
  for (const broker of brokers) {
    for (let i = 0; i < 5; i++) { // Increased clients per broker
      const client = await prisma.client.create({
        data: {
          firstName: faker.person.firstName(),
          lastName: faker.person.lastName(),
          phone: faker.phone.number(),
          email: faker.internet.email(),
          clientType: faker.helpers.arrayElement([ClientType.BUYER, ClientType.SELLER, ClientType.NEW_BUILDING]),
          budget: parseFloat(faker.finance.amount({ min: 20000000, max: 60000000, dec: 0 })),
          brokerId: broker.id,
          status: 'NEW',
          iin: faker.string.numeric(12),
        },
      });
      clients.push(client);
    }
  }

  console.log('🧑‍🤝‍🧑 Clients created');

  // ... (Mortgage, Courses, Notifications remain same) ...
  // 5. Create Mortgage Programs
  const banks = ['Halyk Bank', 'Kaspi Bank', 'BCC', 'Freedom Finance'];
  for (const bank of banks) {
    await prisma.mortgageProgram.create({
      data: {
        bankName: bank,
        programName: `${bank} Mortgage Standard`,
        interestRate: faker.number.float({ min: 12, max: 18, fractionDigits: 1 }),
        minDownPayment: faker.number.int({ min: 20, max: 50 }),
        maxTerm: 20,
        propertyType: 'NEW_BUILDING',
        requirements: 'Standard requirements: ID, income proof, etc.',
        isActive: true,
      },
    });
  }

  console.log('🏦 Mortgage Programs created');

  // 6. Create Courses
  const courses = [
    { title: 'Основы продаж недвижимости', description: 'Базовый курс для начинающих брокеров' },
    { title: 'Юридические аспекты сделок', description: 'Все о договорах и проверке документов' },
    { title: 'Ипотечное кредитование', description: 'Как работать с ипотечными программами' },
  ];

  for (const c of courses) {
    const course = await prisma.course.create({
      data: {
        title: c.title,
        description: c.description,
        content: 'Course content placeholder...',
        duration: 120,
      },
    });

    for (const broker of brokers) {
      await prisma.courseProgress.create({
        data: {
          userId: broker.id,
          courseId: course.id,
          progressPercent: faker.number.int({ min: 0, max: 100 }),
          isCompleted: faker.datatype.boolean(),
        },
      });
    }
  }

  console.log('📚 Courses created');

  // 7. Create Notifications
  for (const broker of brokers) {
    for (let i = 0; i < 5; i++) {
      await prisma.notification.create({
        data: {
          userId: broker.id,
          type: 'SYSTEM',
          title: faker.lorem.sentence(3),
          message: faker.lorem.sentence(),
          isRead: faker.datatype.boolean(),
        },
      });
    }
  }

  console.log('🔔 Notifications created');

  // 8. Create DEALS for Kanban
  const stages = [DealStage.CONSULTATION, DealStage.CONTRACT, DealStage.PROMOTION, DealStage.SHOWINGS];
  const dealColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  for (const broker of brokers) {
    // Each broker gets 10 random deals
    for (let i = 0; i < 10; i++) {
      const client = faker.helpers.arrayElement(clients.filter(c => c.brokerId === broker.id));
      if (!client) continue;

      await prisma.deal.create({
        data: {
          brokerId: broker.id,
          clientId: client.id,
          amount: parseFloat(faker.finance.amount({ min: 10000000, max: 50000000, dec: 2 })),
          commission: parseFloat(faker.finance.amount({ min: 100000, max: 500000, dec: 2 })),
          casaFee: 50000,
          status: DealStatus.IN_PROGRESS,
          stage: faker.helpers.arrayElement(stages),
          color: faker.helpers.arrayElement(dealColors),
          source: faker.helpers.arrayElement(['MANUAL', 'FORM', 'BOT']),
          objectType: 'APARTMENT',
          notes: faker.lorem.sentence(),
        }
      });
    }
  }

  console.log('💼 Deals for Kanban created');

  // 8. Create Bookings (Old logic)
  // ...

  // 9. Create Sample Forms
  await prisma.leadForm.create({
    data: {
      title: 'Consultation Request',
      fields: [
        { label: 'Имя', type: 'text', required: true },
        { label: 'Телефон', type: 'tel', required: true },
        { label: 'Район', type: 'select', required: false, options: ['Есиль', 'Нура'] }
      ],
      distributionType: 'ROUND_ROBIN',
      brokers: {
        connect: brokers.map(b => ({ id: b.id }))
      }
    }
  });

  console.log('📝 Sample Forms created');

  console.log('✅ Seed completed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
