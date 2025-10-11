import { findMatchesByPostalCode, listMatches, recordMatch } from '../services/matchingService.js';

export async function getMatches(req, res) {
  try {
    const caregivers = await findMatchesByPostalCode(req.query.postalCode);
    res.json(caregivers);
  } catch (error) {
    console.error('Failed to load matches', error);
    res.status(500).json({ message: 'Konnte Treffer nicht laden.' });
  }
}

export async function postMatch(req, res) {
  try {
    const match = await recordMatch(req.body);
    res.status(201).json(match);
  } catch (error) {
    console.error('Failed to record match', error);
    const status = error.status || 500;
    res.status(status).json({ message: 'Konnte Treffer nicht speichern.' });
  }
}

export async function getMatchHistory(_req, res) {
  try {
    const matches = await listMatches();
    res.json(matches);
  } catch (error) {
    console.error('Failed to load match history', error);
    res.status(500).json({ message: 'Konnte Trefferhistorie nicht laden.' });
  }
}
