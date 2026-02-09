
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        where: {
            firstName: 'Йфвы',
            lastName: 'Фыв',
        },
        include: {
            curator: true,
        }
    });

    console.log('Target Realtor:', JSON.stringify(users, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
