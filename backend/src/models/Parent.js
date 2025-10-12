import { ObjectId } from 'mongodb';
import { getDatabase } from '../config/database.js';

const COLLECTION_NAME = 'parents';

export function parentsCollection() {
  return getDatabase().collection(COLLECTION_NAME);
}

export function serializeParent(document) {
  if (!document) {
    return null;
  }

  const { _id, ...rest } = document;
  if (Object.prototype.hasOwnProperty.call(rest, 'password')) {
    delete rest.password;
  }
  return {
    id: _id.toString(),
    ...rest,
  };
}

export function toObjectId(id) {
  if (!id) {
    return null;
  }

  try {
    return new ObjectId(id);
  } catch (_error) {
    return null;
  }
}

function sanitizeChildren(childrenInput) {
  if (!Array.isArray(childrenInput)) {
    return [];
  }

  return childrenInput
    .map((child) => ({
      name: child?.name?.trim(),
      age: child?.age?.trim() || null,
      notes: child?.notes?.trim() || null,
    }))
    .filter((child) => child.name);
}

export function buildParentDocument(data) {
  const now = new Date();
  const children = sanitizeChildren(data.children ?? []);
  const numberOfChildren =
    typeof data.numberOfChildren === 'number'
      ? data.numberOfChildren
      : Number.parseInt(data.numberOfChildren ?? `${children.length || 1}`, 10) || children.length || 1;

  const fullName = [data.firstName?.trim(), data.lastName?.trim()].filter(Boolean).join(' ').trim();

  return {
    name: fullName || data.name?.trim(),
    firstName: data.firstName?.trim() || null,
    lastName: data.lastName?.trim() || null,
    email: data.email?.trim(),
    phone: data.phone?.trim(),
    address: data.address?.trim() || null,
    postalCode: data.postalCode?.trim(),
    username: data.username?.trim() || data.email?.trim(),
    password: data.password,
    numberOfChildren,
    childrenAges: data.childrenAges?.trim() || null,
    notes: data.notes?.trim() || null,
    children,
    profileImageUrl: data.profileImageUrl || null,
    role: 'parent',
    createdAt: now,
    updatedAt: now,
  };
}

export function buildParentUpdate(data) {
  const update = { updatedAt: new Date() };

  if (data.firstName !== undefined) {
    update.firstName = data.firstName?.trim() || null;
  }
  if (data.lastName !== undefined) {
    update.lastName = data.lastName?.trim() || null;
  }
  if (data.name !== undefined) {
    update.name = data.name?.trim() || null;
  } else if (data.firstName !== undefined || data.lastName !== undefined) {
    const fullName = [data.firstName?.trim(), data.lastName?.trim()].filter(Boolean).join(' ').trim();
    update.name = fullName || null;
  }

  if (data.email !== undefined) {
    update.email = data.email?.trim() || null;
  }
  if (data.phone !== undefined) {
    update.phone = data.phone?.trim() || null;
  }
  if (data.address !== undefined) {
    update.address = data.address?.trim() || null;
  }
  if (data.postalCode !== undefined) {
    update.postalCode = data.postalCode?.trim() || null;
  }
  if (data.username !== undefined) {
    update.username = data.username?.trim() || null;
  }
  if (data.password !== undefined) {
    update.password = data.password;
  }
  if (data.childrenAges !== undefined) {
    update.childrenAges = data.childrenAges?.trim() || null;
  }
  if (data.notes !== undefined) {
    update.notes = data.notes?.trim() || null;
  }
  if (data.children !== undefined) {
    update.children = sanitizeChildren(data.children);
    update.numberOfChildren = update.children.length;
  }
  if (data.numberOfChildren !== undefined && update.numberOfChildren === undefined) {
    update.numberOfChildren =
      typeof data.numberOfChildren === 'number'
        ? data.numberOfChildren
        : Number.parseInt(data.numberOfChildren ?? '0', 10) || 0;
  }
  if (data.profileImageUrl !== undefined) {
    update.profileImageUrl = data.profileImageUrl;
  }

  return update;
}
