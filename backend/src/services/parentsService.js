import Parent from '../models/Parent.js';

export async function listParents() {
  return Parent.find().sort({ createdAt: -1 });
}

export async function createParent(data) {
  const parent = await Parent.create({
    name: data.name,
    email: data.email,
    phone: data.phone,
    address: data.address,
    postalCode: data.postalCode,
    numberOfChildren: data.numberOfChildren,
    childrenAges: data.childrenAges,
    notes: data.notes,
  });

  return parent;
}

export async function findParentById(id) {
  return Parent.findById(id);
}
