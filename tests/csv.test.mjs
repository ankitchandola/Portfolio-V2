import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState, original, evaluate, parseAmount, compare, money} from '../src/csv-model.js';
test('changed amount is detected and the source is untouched', () => {
 const out = evaluate(initialState());
 assert.deepEqual(out.changed, ['002']); assert.equal(out.difference,7000);
 assert.deepEqual(out.unchanged,['001','003']); assert.equal(original[1].cents,85000);
});
test('inclusive tolerance has an exact penny boundary', () => {
 assert.deepEqual(evaluate({...initialState(),tolerance:70}).changed,[]);
 assert.deepEqual(evaluate({...initialState(),amount:'920.01',tolerance:70}).changed,['002']);
 assert.deepEqual(evaluate({...initialState(),amount:'850.01'}).changed,['002']);
});
test('row order never changes identity, including leading zeros', () => {
 const out=evaluate({...initialState(),scenario:'reorder'});
 assert.equal(out.changed.length,0); assert.equal(out.unchanged.length,3);
 assert.deepEqual(out.after.map(x=>x.sku),['003','001','002']);
});
test('duplicated key is ambiguous, never an add, removal or change', () => {
 const out=evaluate({...initialState(),scenario:'duplicate'});
 assert.deepEqual(out.problems,['002']);assert.deepEqual(out.changed,[]);
 assert.deepEqual(out.added,[]);assert.deepEqual(out.removed,[]);assert.equal(out.unchanged.length,2);
 assert.deepEqual(compare([...original,original[1]],original).problems,['002']);
});
test('amount validation accepts zero and upper bound, rejects invalid input', () => {
 assert.equal(parseAmount('0'),0);assert.equal(parseAmount('100000'),10000000);
 for(const bad of ['', '-1', '100000.01','NaN','Infinity','1e3','9.001']) assert.equal(parseAmount(bad),null,bad);
 assert.ok(evaluate({...initialState(),amount:''}).error);
});
test('all scenarios reset cleanly and invalid rules fail visibly', () => {
 for(const scenario of ['change','reorder','duplicate']) evaluate({...initialState(),scenario});
 assert.equal(evaluate(initialState()).difference,7000);
 assert.throws(()=>evaluate({...initialState(),tolerance:-1}));
 assert.throws(()=>evaluate({...initialState(),scenario:'unknown'}));
});
test('numbers format as decimal text without binary rounding leakage', () => {
 assert.equal(money(85001),'850.01');assert.equal(money(125000),'1,250.00');assert.equal(money(0),'0.00');
});
