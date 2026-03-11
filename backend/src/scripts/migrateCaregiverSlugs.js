import '../config/load-env.js';
import { connectDatabase, getClient } from '../config/database.js';
import { caregiversCollection } from '../models/Caregiver.js';
import { buildCaregiverSlugParts } from '../utils/slug.js';

async function migrateCaregiverSlugs() {
  await connectDatabase();

  const caregivers = await caregiversCollection().find({}).toArray();
  const usedProfilePaths = new Set();

  // Reserve existing canonical paths to keep stable URLs where possible.
  for (const caregiver of caregivers) {
    if (caregiver.profilePath) {
      usedProfilePaths.add(caregiver.profilePath);
    }
  }

  let updatedCount = 0;

  for (const caregiver of caregivers) {
    const slugParts = buildCaregiverSlugParts({
      city: caregiver.city,
      daycareName: caregiver.daycareName,
      name: caregiver.name,
      firstName: caregiver.firstName,
      lastName: caregiver.lastName,
    });

    let nextProfilePath = slugParts.profilePath;
    const [cityPart, daycarePart] = nextProfilePath.split('/');

    let counter = 2;
    while (usedProfilePaths.has(nextProfilePath) && nextProfilePath !== caregiver.profilePath) {
      nextProfilePath = `${cityPart}/${daycarePart}-${counter}`;
      counter += 1;
    }

    usedProfilePaths.add(nextProfilePath);

    const legacyProfilePaths = Array.isArray(caregiver.legacyProfilePaths) ? [...caregiver.legacyProfilePaths] : [];
    if (caregiver.profilePath && caregiver.profilePath !== nextProfilePath && !legacyProfilePaths.includes(caregiver.profilePath)) {
      legacyProfilePaths.push(caregiver.profilePath);
    }

    const shouldUpdate =
      caregiver.citySlug !== slugParts.citySlug ||
      caregiver.daycareSlug !== slugParts.daycareSlug ||
      caregiver.profilePath !== nextProfilePath ||
      JSON.stringify(caregiver.legacyProfilePaths ?? []) !== JSON.stringify(legacyProfilePaths);

    if (!shouldUpdate) {
      continue;
    }

    await caregiversCollection().updateOne(
      { _id: caregiver._id },
      {
        $set: {
          citySlug: slugParts.citySlug,
          daycareSlug: slugParts.daycareSlug,
          profilePath: nextProfilePath,
          legacyProfilePaths,
          updatedAt: new Date(),
        },
      },
    );

    updatedCount += 1;
  }

  await caregiversCollection().createIndex({ profilePath: 1 }, { unique: true, sparse: true });

  console.log(`✅ Migration abgeschlossen. Aktualisierte Datensätze: ${updatedCount}`);
}

migrateCaregiverSlugs()
  .catch((error) => {
    console.error('❌ Migration fehlgeschlagen', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    const client = getClient();
    if (client) {
      await client.close();
    }
  });
