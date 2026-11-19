import { z } from 'astro/zod';

export const projectSchema = z
  .strictObject({
    title: z.string().min(1),
    description: z.string().min(50).max(160),
    date: z.coerce.date(),
    tags: z.array(z.string().min(1)).nonempty(),
    lang: z.enum(['en', 'fa']),
    status: z.enum(['active', 'experimental', 'archived']).default('active'),
    featured: z.boolean().default(false),
    repo: z.url().optional(),
    hasDocs: z.boolean().default(false),
    docsSlug: z
      .string()
      .regex(/^[a-z0-9-]+$/)
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.hasDocs && !data.docsSlug) {
      ctx.addIssue({
        code: 'custom',
        path: ['docsSlug'],
        message: 'docsSlug is required when hasDocs is true',
      });
    }
    if (!data.hasDocs && data.docsSlug !== undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['docsSlug'],
        message: 'docsSlug must be omitted when hasDocs is false',
      });
    }
  });
