import { getValue } from 'tools/redis';

export default function () {
  const prismaConOptions = await getValue({ key: 'prisma' });
  let conOptions = {};
  try {
    conOptions = JSON.parse(prismaConOptions);
  } catch (err) {
    conOptions = prismaConOptions;
  };
  
}