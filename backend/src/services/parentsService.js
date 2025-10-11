import crypto from 'node:crypto';

const parents = [];

export function listParents() {
  return parents;
}

export function createParent(data) {
  const parent = {
    id: crypto.randomUUID(),
    name: data.name,
    email: data.email,
    phone: data.phone,
    address: data.address,
    postalCode: data.postalCode,
    numberOfChildren: data.numberOfChildren,
    childrenAges: data.childrenAges,
    notes: data.notes,
    createdAt: new Date().toISOString(),
  };

  parents.push(parent);
  return parent;
}

export function findParentById(id) {
  return parents.find((parent) => parent.id === id);
}
