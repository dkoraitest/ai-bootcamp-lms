import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import test from 'node:test';
import { loadTypeScriptModule } from './helpers/load-ts.mjs';
const modulePath = 'src/lib/program/submission.ts';
const submission = existsSync(modulePath) ? loadTypeScriptModule(modulePath) : {};
const blank = {githubUrl:'',videoUrl:'',liveUrl:'',artifact:''};

test('ДЗ 2 второго потока принимает ссылку на сетап без обязательного сайта', () => {
  assert.equal(typeof submission.isAssignmentSubmitDisabled, 'function');
  assert.equal(submission.isAssignmentSubmitDisabled('flow-2', 2, {...blank,githubUrl:'https://example.test/setup'}), false);
  assert.equal(submission.isAssignmentSubmitDisabled('flow-1', 2, {...blank,githubUrl:'https://example.test/setup'}), true);
});
test('ДЗ 5 принимает отчёт о препятствии без обязательного видео и отклоняет пустую сдачу', () => {
  assert.equal(typeof submission.isAssignmentSubmitDisabled, 'function');
  assert.equal(submission.isAssignmentSubmitDisabled('flow-2', 5, {...blank,artifact:'Нет доступа к входу; проверен запрос; нужна помощь с разрешениями.'}), false);
  assert.equal(submission.isAssignmentSubmitDisabled('flow-2', 5, {...blank,artifact:'   '}), true);
  assert.equal(submission.isAssignmentSubmitDisabled('flow-1', 5, {...blank,artifact:'Описание'}), true);
});
test('поля ДЗ 6 позволяют приложить все три обязательных артефакта', () => {
  assert.equal(typeof submission.getAssignmentSubmissionFields, 'function');
  assert.deepEqual(submission.getAssignmentSubmissionFields(6).filter(f=>f.required).map(f=>f.key), ['githubUrl','videoUrl','artifact']);
  assert.equal(submission.isAssignmentSubmitDisabled('flow-2', 6, {...blank,videoUrl:'https://example.test/video'}), true);
  assert.equal(submission.isAssignmentSubmitDisabled('flow-2', 6, {githubUrl:'https://example.test/repo',videoUrl:'https://example.test/video',liveUrl:'',artifact:'Артефакт результата и проверка'}), false);
  assert.equal(submission.isAssignmentSubmitDisabled('flow-1', 6, {...blank,videoUrl:'https://example.test/video'}), false);
});
test('ДЗ 7 не отправляет пустую работу, а legacy-правила сохраняются', () => {
  assert.equal(typeof submission.isAssignmentSubmitDisabled, 'function');
  assert.equal(submission.isAssignmentSubmitDisabled('flow-2', 7, blank), true);
  assert.equal(submission.isAssignmentSubmitDisabled('flow-1', 7, blank), false);
});

test('публикация открывает новое ДЗ flow-2, скрытое блокируется, сданное сохраняется', () => {
  assert.equal(typeof submission.getScheduledAssignmentStatus, 'function');
  assert.equal(submission.getScheduledAssignmentStatus('flow-2', 'locked', true), 'not_started');
  assert.equal(submission.getScheduledAssignmentStatus('flow-2', 'not_started', false), 'locked');
  assert.equal(submission.getScheduledAssignmentStatus('flow-2', 'submitted', false), 'submitted');
  assert.equal(submission.getScheduledAssignmentStatus('flow-2', 'reviewed', false), 'reviewed');
  assert.equal(submission.getScheduledAssignmentStatus('flow-1', 'locked', true), 'locked');
});
