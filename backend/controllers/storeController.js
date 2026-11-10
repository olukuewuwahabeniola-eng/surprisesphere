import { dbState } from '../config/db.js';
import homepageData from '../utils/homepageData.js';

export function getHealth(req, res) {
  res.json({
    ok: true,
    service: 'surprise-fashion-sphere-api',
    database: dbState.status,
  });
}

export function getHomepage(req, res) {
  res.json(homepageData);
}
