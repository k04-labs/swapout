import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import type { CompetencyCategory, DifficultyLevel } from "@prisma/client";
import questions from "./seed/questions.json";

const prisma = new PrismaClient();

type SeedQuestion = {
  text: string;
  category: CompetencyCategory;
  difficulty: DifficultyLevel;
  options: Array<{
    text: string;
    score: number;
    weightLabel: string;
  }>;
};

const seededQuestions = questions as SeedQuestion[];

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

async function seedSuperAdmin() {
  const username = requireEnv("ADMIN_USERNAME");
  const initialPassword = process.env.ADMIN_INITIAL_PASSWORD?.trim() || "password";
  const passwordHash = await bcrypt.hash(initialPassword, 12);

  await prisma.superAdmin.upsert({
    where: { username },
    update: {
      passwordHash,
    },
    create: {
      username,
      passwordHash,
    },
  });
}

async function seedQuestions() {
  for (const question of seededQuestions) {
    const existing = await prisma.question.findFirst({
      where: { text: question.text },
      include: { options: true },
    });

    if (existing) {
      await prisma.question.update({
        where: { id: existing.id },
        data: {
          category: question.category,
          difficulty: question.difficulty,
          isActive: true,
          options: {
            deleteMany: {},
            create: question.options,
          },
        },
      });
      continue;
    }

    await prisma.question.create({
      data: {
        text: question.text,
        category: question.category,
        difficulty: question.difficulty,
        options: {
          create: question.options,
        },
      },
    });
  }
}

async function main() {
  await seedSuperAdmin();
  await seedQuestions();
  console.log("Seed complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
