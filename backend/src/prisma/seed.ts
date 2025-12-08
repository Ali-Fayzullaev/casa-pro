import { PrismaClient, UserRole, ClientType, BuildingStatus, ApartmentStatus, BookingStatus, DealStatus } from '@prisma/client';
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

  const deletedUsers = await prisma.user.deleteMany();
  console.log(`Deleted ${deletedUsers.count} users`);

  console.log('🧹 Database cleaned');

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

    // Create Apartments for each project
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
    for (let i = 0; i < 3; i++) {
      const client = await prisma.client.create({
        data: {
          firstName: faker.person.firstName(),
          lastName: faker.person.lastName(),
          phone: faker.phone.number(),
          email: faker.internet.email(),
          clientType: faker.helpers.arrayElement([ClientType.BUYER, ClientType.SELLER, ClientType.NEW_BUILDING]),
          budget: parseFloat(faker.finance.amount({ min: 20000000, max: 60000000, dec: 0 })),
          brokerId: broker.id,
          status: 'NEW', // Valid enum value
          iin: faker.string.numeric(12), // Required field
        },
      });
      clients.push(client);
    }
  }

  console.log('🧑‍🤝‍🧑 Clients created');

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
        propertyType: 'NEW_BUILDING', // Required field
        requirements: 'Standard requirements: ID, income proof, etc.', // Required field
        // description removed
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
        duration: 120, // minutes
        // points removed as it doesn't exist in schema
      },
    });

    // Assign to some brokers
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

  // 8. Create Bookings & Deals
  // Find an available apartment and a client
  const availableApartment = await prisma.apartment.findFirst({ where: { status: ApartmentStatus.AVAILABLE } });
  const client = clients[0];
  const broker = brokers[0];

  if (availableApartment && client && broker) {
    await prisma.booking.create({
      data: {
        clientId: client.id,
        apartmentId: availableApartment.id,
        brokerId: broker.id,
        status: BookingStatus.PENDING,
        expiresAt: faker.date.future(),
      },
    });
  }

  console.log('🤝 Sample Booking created');
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
