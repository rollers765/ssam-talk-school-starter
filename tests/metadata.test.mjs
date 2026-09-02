import { test } from 'node:test';
import assert from 'node:assert/strict';
import { schoolConfig } from '../shared/school-config.mjs';
test('학교명이 제목과 설명에 반영되고 HTML 삽입은 이스케이프된다', async () => {
  const { renderMetadata } = await import('../shared/metadata.mjs');
  const config=structuredClone(schoolConfig); config.school.name='가상 <학교> & "상담"';
  const html=renderMetadata('<title>__APP_TITLE__</title><meta content="__APP_DESCRIPTION__"><meta content="__OG_URL__">', config, 'https://sample-school.vercel.app');
  assert.ok(html.includes('가상 &lt;학교&gt; &amp; &quot;상담&quot;'));
  assert.ok(html.includes('https://sample-school.vercel.app/og.png'));
  assert.equal(html.includes('<학교>'),false);
  assert.equal(html.includes('__APP_'),false);
});
