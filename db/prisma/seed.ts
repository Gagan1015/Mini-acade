import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const gameConfigs = [
    {
      gameId: 'wordel',
      name: 'Wordel',
      description: 'Guess the hidden word with friends.',
      minPlayers: 1,
      maxPlayers: 4,
      defaultRounds: 1,
      roundTime: 180,
    },
    {
      gameId: 'flagel',
      name: 'Flagel',
      description: 'Identify countries from their flags.',
      minPlayers: 1,
      maxPlayers: 4,
      defaultRounds: 5,
      roundTime: 60,
    },
    {
      gameId: 'trivia',
      name: 'Trivia',
      description: 'Realtime quiz battles.',
      minPlayers: 1,
      maxPlayers: 10,
      defaultRounds: 5,
      roundTime: 20,
    },
    {
      gameId: 'skribble',
      name: 'Skribble',
      description: 'Draw and guess together.',
      minPlayers: 2,
      maxPlayers: 8,
      defaultRounds: 5,
      roundTime: 80,
    },
  ]

  for (const config of gameConfigs) {
    await prisma.gameConfig.upsert({
      where: { gameId: config.gameId },
      update: config,
      create: config,
    })
  }

  const triviaQuestions = [
    {
      hash: 'seed-trivia-gaming-playstation',
      question: 'Which company created the PlayStation console brand?',
      answers: [
        { id: 'a', text: 'Sony' },
        { id: 'b', text: 'Nintendo' },
        { id: 'c', text: 'Sega' },
        { id: 'd', text: 'Atari' },
      ],
      correctId: 'a',
      explanation: 'Sony launched the original PlayStation in the 1990s.',
      category: 'Gaming',
      difficulty: 'easy',
      tags: ['playstation', 'gaming-history'],
      source: 'seed',
    },
    {
      hash: 'seed-trivia-sports-cricket-world-cup',
      question: 'Which sport is associated with the Cricket World Cup?',
      answers: [
        { id: 'a', text: 'Cricket' },
        { id: 'b', text: 'Rugby' },
        { id: 'c', text: 'Tennis' },
        { id: 'd', text: 'Golf' },
      ],
      correctId: 'a',
      explanation: 'The Cricket World Cup is the major international championship for cricket.',
      category: 'Sports',
      difficulty: 'easy',
      tags: ['cricket'],
      source: 'seed',
    },
    {
      hash: 'seed-trivia-tech-iphone',
      question: 'Which company introduced the first iPhone?',
      answers: [
        { id: 'a', text: 'Google' },
        { id: 'b', text: 'Apple' },
        { id: 'c', text: 'Microsoft' },
        { id: 'd', text: 'Samsung' },
      ],
      correctId: 'b',
      explanation: 'Apple introduced the first iPhone in 2007.',
      category: 'Internet & Tech',
      difficulty: 'easy',
      tags: ['apple', 'gadgets'],
      source: 'seed',
    },
    {
      hash: 'seed-trivia-science-red-planet',
      question: 'Which planet is known as the Red Planet?',
      answers: [
        { id: 'a', text: 'Venus' },
        { id: 'b', text: 'Mars' },
        { id: 'c', text: 'Jupiter' },
        { id: 'd', text: 'Saturn' },
      ],
      correctId: 'b',
      explanation: 'Mars looks reddish because of iron oxide on its surface.',
      category: 'Science & Nature',
      difficulty: 'easy',
      tags: ['space', 'planets'],
      source: 'seed',
    },
    {
      hash: 'seed-trivia-geography-france-capital',
      question: 'What is the capital city of France?',
      answers: [
        { id: 'a', text: 'London' },
        { id: 'b', text: 'Paris' },
        { id: 'c', text: 'Berlin' },
        { id: 'd', text: 'Madrid' },
      ],
      correctId: 'b',
      explanation: 'Paris is the capital and largest city of France.',
      category: 'Geography & Travel',
      difficulty: 'easy',
      tags: ['world-capitals', 'europe'],
      source: 'seed',
    },
  ]

  for (const question of triviaQuestions) {
    await prisma.triviaQuestion.upsert({
      where: { hash: question.hash },
      update: question,
      create: question,
    })
  }

  await prisma.systemSetting.upsert({
    where: { key: 'platform.name' },
    update: { value: 'Mini Arcade', type: 'string', category: 'general' },
    create: {
      key: 'platform.name',
      value: 'Mini Arcade',
      type: 'string',
      category: 'general',
    },
  })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exitCode = 1
  })
