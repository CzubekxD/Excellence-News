// Failure modes: covers change from request to request (no cache
// can hold them); an issue's date reads wrong across a month; a daily ignores its leading category.
import { tag } from './setup.ts';
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { sql, closeDb } from '@aihot/backend/db';
import { stopBoss } from '@aihot/backend/jobs/queue';
import { publishArticle } from '@aihot/backend/publication/publish';
import { upsertMaterial } from '@aihot/backend/content/materials';
import { coverMotif, coverRasterSvg } from '@aihot/backend/media/cover';
import { issueDateLabel } from '@aihot/backend/publication/covers';
import { buildApp } from '../apps/api/src/app.ts';

const app = await buildApp();
const T = tag();
let id: string;
before(async () => {
  await sql`INSERT INTO sources(id,name,kind,tier,participation_mode,site_fulltext,syndicate_fulltext)
    VALUES(${T},'Cover example','rss','T1','editorial',false,false)`;
  id = (await upsertMaterial({ sourceId:T, url:`https://example.com/${T}`,title:'Gemba walk w biurze',
    bodyText:'Tekst przykładowy. '.repeat(50),bodyStatus:'ok',via:'fetch',publishedAt:new Date() })).articleId;
  await sql`INSERT INTO analyses(article_id,input_revision,origin,relevance,category,title_zh,summary_zh,score,selected)
    VALUES(${id},1,'rule','pass','lean','Gemba walk wraca do biur','Streszczenie',90,true)`;
  await publishArticle(id,{releasedAt:new Date(Date.now()-60000)});
  const entry = {itemId:id,title:'Gemba walk wraca do biur',summary:'Streszczenie'};
  await sql`INSERT INTO reports(kind,key,window_start,window_end,content,origin,generated_at)
    VALUES('daily','2099-11-02',now()-interval '1 day',now(),${sql.json({sections:[{label:'Łańcuch dostaw',items:[entry]}],flashes:[]})},'manual',now())`;
});
after(async()=>{await app.close();await stopBoss();await closeDb();});

test('issue dates read the way readers say them', () => {
  assert.equal(issueDateLabel('daily','2026-10-29'),'29.10.2026');
  assert.equal(issueDateLabel('weekly','2026-W43'),'19–25.10.2026');
  assert.equal(issueDateLabel('weekly','2026-W40'),'28.09–4.10.2026');
  assert.equal(issueDateLabel('monthly','2026-10'),'Październik 2026');
});

test('a daily takes the motif of its first section; other issues their default', () => {
  assert.equal(coverMotif('daily',['Łańcuch dostaw','Lean i TPS']).key,'supply-chain');
  assert.equal(coverMotif('daily',['Nieznany dział']).key,'lean');
  assert.equal(coverMotif('weekly',['Łańcuch dostaw']).key,'agile');
});

test('the cover picture is the same on every request and differs between issues', async () => {
  const m = coverMotif('daily',['Lean i TPS']);
  const a = await coverRasterSvg('daily','2026-10-29',m);
  assert.equal(a, await coverRasterSvg('daily','2026-10-29',m));
  assert.notEqual(a, await coverRasterSvg('daily','2026-10-30',m));
  assert.match(a,/^<svg [^>]*viewBox="0 0 300 400"/);
});

test('the front page covers carry the latest issue, its picture and its share card', async () => {
  const res = await app.inject({method:'GET',url:'/api/site/covers'});
  assert.equal(res.statusCode,200);
  const daily = res.json().covers.find((c:{kind:string})=>c.kind==='daily');
  assert.equal(daily.key,'2099-11-02');
  assert.equal(daily.dateLabel,'2.11.2099');
  assert.equal(daily.count,1);
  assert.equal(daily.href,'/daily/2099-11-02');
  const raster = await app.inject({method:'GET',url:daily.raster});
  assert.equal(raster.statusCode,200);
  assert.equal(raster.headers['content-type'],'image/svg+xml');
  const card = await app.inject({method:'GET',url:'/og/reports/daily/2099-11-02.png'});
  assert.equal(card.headers['content-type'],'image/png');
});
