import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCaregiverDocument } from '../src/models/Caregiver.js';
import { isCaregiverPubliclyVisible, assertValidCarePermissionFile } from '../src/utils/caregiverVerification.js';
import { createCaregiver, listCaregivers, updateCaregiver, __setCaregiversCollectionForTesting, __resetCaregiversCollectionForTesting } from '../src/services/caregiversService.js';

function id(v){return { toString:()=>v };}
const file = { key:'x', url:'/api/files/x', fileName:'erlaubnis.pdf', mimeType:'application/pdf', size:100, uploadedAt:'2026-07-21T00:00:00.000Z' };
const base = { firstName:'A', lastName:'B', email:'a@example.com', phone:'1', address:'Str', postalCode:'12345', city:'Köln', daycareName:'Nest', username:'ab', password:'pw', carePermissionDocumentUrl:file };

test('new caregiver without care permission is rejected', async (t)=>{
  t.after(__resetCaregiversCollectionForTesting);
  __setCaregiversCollectionForTesting({ findOne: t.mock.fn(), insertOne: t.mock.fn() });
  await assert.rejects(() => createCaregiver({ ...base, carePermissionDocumentUrl:null }), /Missing required fields/);
});

test('new caregiver with valid care permission starts pending and unpublished', async (t)=>{
  t.after(__resetCaregiversCollectionForTesting);
  const inserted=[];
  __setCaregiversCollectionForTesting({ findOne: t.mock.fn(async()=>null), insertOne: t.mock.fn(async(d)=>{inserted.push(d);return {insertedId:id('new')};}) });
  const result = await createCaregiver(base);
  assert.equal(result.verificationStatus, 'pending');
  assert.equal(result.isPublished, false);
  assert.equal(inserted[0].carePermissionOriginalName, 'erlaubnis.pdf');
});

test('public visibility keeps legacy missing caregivers and hides pending/rejected unpublished', async (t)=>{
  t.after(__resetCaregiversCollectionForTesting);
  const docs = [
    { _id:id('legacy'), name:'Legacy', email:'l', verificationStatus:'missing', isPublished:true, createdAt:new Date() },
    { _id:id('pending'), name:'Pending', email:'p', verificationStatus:'pending', isPublished:false, createdAt:new Date() },
    { _id:id('rejected'), name:'Rejected', email:'r', verificationStatus:'rejected', isPublished:false, createdAt:new Date() },
  ];
  __setCaregiversCollectionForTesting({ find:()=>({ sort:()=>({ toArray:async()=>docs }) }) });
  const list = await listCaregivers();
  assert.deepEqual(list.map((c)=>c.id), ['legacy']);
  assert.equal(isCaregiverPubliclyVisible({ verificationStatus:'missing' }), true);
});

test('admin approval makes caregiver public; rejection unpublishes', async (t)=>{
  t.after(__resetCaregiversCollectionForTesting);
  const doc = { _id:id('1'), ...buildCaregiverDocument(base) };
  const collection = { findOne: t.mock.fn(async()=>doc), updateOne: t.mock.fn(async(_q,u)=>Object.assign(doc,u.$set)) };
  __setCaregiversCollectionForTesting(collection);
  let approved = await updateCaregiver('1', { verificationStatus:'approved', isPublished:true, verifiedAt:new Date(), publishedAt:new Date() });
  assert.equal(approved.verificationStatus, 'approved');
  assert.equal(approved.isPublished, true);
  let rejected = await updateCaregiver('1', { verificationStatus:'rejected', isPublished:false, verificationRejectionReason:'Unleserlich' });
  assert.equal(rejected.verificationStatus, 'rejected');
  assert.equal(rejected.isPublished, false);
});

test('care permission validation rejects oversize and invalid types', ()=>{
  assert.doesNotThrow(()=>assertValidCarePermissionFile(file));
  assert.throws(()=>assertValidCarePermissionFile({ ...file, size: 10*1024*1024+1 }), /maximal 10 MB/);
  assert.throws(()=>assertValidCarePermissionFile({ ...file, mimeType:'text/plain' }), /PDF, JPG oder PNG/);
});
