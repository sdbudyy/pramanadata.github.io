// The link-preview image for one study: /studies/<slug>/og.png (1200×630).
import type { APIRoute } from 'astro';
import { allStudies, type Study } from '../../../lib/studies';
import { studyOgPng } from '../../../lib/og';

export async function getStaticPaths() {
  const studies = await allStudies();
  return studies.map((study) => ({ params: { slug: study.id }, props: { study } }));
}

export const GET: APIRoute = async ({ props, site }) => {
  const { study } = props as { study: Study };
  const host = (site?.host ?? '') + import.meta.env.BASE_URL.replace(/\/$/, '');
  const png = await studyOgPng(study, host);
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
