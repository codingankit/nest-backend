import { Prisma } from '@prisma/client';
import { uuidv7 } from 'uuidv7';

export const Uuidv7Extension = Prisma.defineExtension({
  name: 'uuidv7',
  query: {
    $allModels: {
      async create({ args, query }) {
        if (!args.data.id) {
          args.data.id = uuidv7();
        }
        return query(args);
      },
    },
  },
});
