import { getCollection, type CollectionEntry } from 'astro:content';
import type { Locale } from '../config/ui.ts';

export type ProjectEntry = CollectionEntry<'projects'>;

/** Fetch localized project entries ordered by featured status, then newest date. */
export async function getLocalizedProjects(lang: Locale): Promise<ProjectEntry[]> {
  const entries = await getCollection('projects', ({ data }) => data.lang === lang);
  return entries.sort((a, b) => {
    const featuredDiff = Number(b.data.featured) - Number(a.data.featured);
    if (featuredDiff !== 0) return featuredDiff;
    const dateDiff = b.data.date.getTime() - a.data.date.getTime();
    if (dateDiff !== 0) return dateDiff;
    return a.data.title.localeCompare(b.data.title);
  });
}

/** Extract sorted unique tag names across a list of projects. */
export function getUniqueTags(projects: ProjectEntry[]): string[] {
  const tags = new Set<string>();
  for (const project of projects) {
    for (const tag of project.data.tags) {
      tags.add(tag);
    }
  }
  return Array.from(tags).sort((a, b) => a.localeCompare(b));
}

/** Resolve the localized documentation path for a project when docs exist. */
export function getProjectDocsUrl(project: ProjectEntry, lang: Locale): string | undefined {
  if (!project.data.hasDocs || !project.data.docsSlug) return undefined;
  return lang === 'fa'
    ? `/fa/projects/${project.data.docsSlug}/`
    : `/projects/${project.data.docsSlug}/`;
}
