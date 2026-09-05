import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { existsSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadTypeScriptModule } from './helpers/load-ts.mjs';

const course = loadTypeScriptModule('src/lib/program/assignments.ts');
const before = JSON.parse(readFileSync(new URL('./fixtures/flow1-assignments-before-week5.json', import.meta.url)));

test('обновление flow-2 не меняет содержание, номера и баллы первого потока', () => {
  assert.equal(typeof course.getProgramAssignments, 'function', 'нужен выбор содержания по потоку');
  course.getProgramAssignments('flow-2');
  for (const cohort of ['flow-1', null, 'unknown']) {
    assert.deepEqual(JSON.parse(JSON.stringify(course.getProgramAssignments(cohort))), before);
  }
  assert.deepEqual(course.getProgramAssignments('flow-2').map(({id,hwNumber,lessonId,points}) => [id,hwNumber,lessonId,points]),
    [[1,1,1,50],[2,2,3,50],[3,3,5,60],[4,4,7,70],[5,5,9,80],[6,6,10,100],[7,7,12,120]]);
});

test('карточки программы используют те же условия, что раздел ДЗ и поиск', () => {
  assert.equal(typeof course.getProgramAssignmentCards, 'function');
  const assignments = course.getProgramAssignments('flow-2');
  const cards = course.getProgramAssignmentCards('flow-2');
  assert.deepEqual(Object.keys(cards).map(Number), [1,3,5,7,9,10,12]);
  for (const hw of assignments) {
    const card = cards[hw.lessonId];
    assert.equal(card.title, hw.title);
    assert.equal(card.description, hw.description);
    assert.deepEqual(card.deliverables, hw.requirements);
    assert.deepEqual(card.checklist, hw.checklist.map(item => item.text));
    assert.equal(card.submissionHref, `/assignments#hw-${hw.hwNumber}`);
  }
});

test('инструкция и локальные материалы появляются только у второго потока', () => {
  const {getLocalCourseMaterials} = loadTypeScriptModule('src/lib/program/flow2Materials.ts');
  const {getHwMaterialIds} = loadTypeScriptModule('src/lib/program/hwMaterials.ts');
  const Notice = loadTypeScriptModule('src/components/program/WeekFiveNotice.tsx').default;
  for (const cohort of ['flow-1', null, 'unknown']) {
    assert.deepEqual(getLocalCourseMaterials(cohort), []);
    assert.equal(renderToStaticMarkup(React.createElement(Notice, {cohortId:cohort})), '');
    assert.deepEqual(getHwMaterialIds(cohort)[5], [39]);
  }
  assert.match(renderToStaticMarkup(React.createElement(Notice, {cohortId:'flow-2'})), /href="\/artifacts\/flow-2\/week-5\/index.html"/);
  const materials = getLocalCourseMaterials('flow-2');
  assert.equal(materials.length, 4);
  for (const material of materials) {
    assert.ok(existsSync(`public${material.url}`), `доступен файл ${material.url}`);
    assert.ok(getHwMaterialIds('flow-2')[5].includes(material.id));
  }
});
