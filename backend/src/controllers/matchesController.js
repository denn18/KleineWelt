import { listCaregivers } from '../services/caregiversService.js';
import { findMatchesByPostalCode, listMatches, recordMatch } from '../services/matchingService.js';

export function getMatches(req, res) {
  const caregivers = listCaregivers({ postalCode: req.query.postalCode });
  const result = findMatchesByPostalCode(req.query.postalCode, caregivers);
  res.json(result);
}

export function postMatch(req, res) {
  const match = recordMatch(req.body);
  res.status(201).json(match);
}

export function getMatchHistory(req, res) {
  res.json(listMatches());
}
