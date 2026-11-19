import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { docsLoader, i18nLoader } from '@astrojs/starlight/loaders';
import { docsSchema, i18nSchema } from '@astrojs/starlight/schema';
import { topicSchema } from 'starlight-sidebar-topics/schema';
import { projectSchema } from './schemas/project.ts';

const docs = defineCollection({
  loader: docsLoader(),
  schema: docsSchema({ extend: topicSchema }),
});

const i18n = defineCollection({
  loader: i18nLoader(),
  schema: i18nSchema(),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: projectSchema,
});

export const collections = { docs, i18n, projects };
