import { createParent, listParents } from '../services/parentsService.js';

export function getParents(req, res) {
  const parents = listParents();
  res.json(parents);
}

export function postParent(req, res) {
  const parent = createParent(req.body);
  res.status(201).json(parent);
}
