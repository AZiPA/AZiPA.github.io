import { defineRouteMiddleware } from '@astrojs/starlight/route-data';
import { applySeoRouteHead } from './lib/seo/head.ts';

export const onRequest = defineRouteMiddleware(async (context, next) => {
  await next();
  await applySeoRouteHead(context);
});
