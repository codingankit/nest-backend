import { Prisma } from '@prisma/client';
import slugify from 'slugify';

export const PostSlugExtension = Prisma.defineExtension({
  name: 'postSlug',
  query: {
    post: {
      async create({ args, query }) {
        if (typeof args.data.title === 'string' && !args.data.slug) {
          args.data.slug = slugify(args.data.title, {
            lower: true,
            strict: true,
          });
        }
        return query(args);
      },

      async update({ args, query }) {
        const titleInput = args.data.title;
        const slugInput = args.data.slug;

        let titleValue: string | undefined;

        if (typeof titleInput === 'string') {
          titleValue = titleInput;
        } else if (typeof titleInput === 'object' && 'set' in titleInput) {
          titleValue = titleInput.set;
        }

        if (titleValue && !slugInput) {
          args.data.slug = slugify(titleValue, { lower: true, strict: true });
        }

        return query(args);
      },
    },
  },
});
