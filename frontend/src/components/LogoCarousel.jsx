import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { assetUrl } from '../utils/file.js';

function LogoCarousel() {
  const [logos, setLogos] = useState([]);

  useEffect(() => {
    let ignore = false;

    async function fetchLogos() {
      const response = await axios.get('/api/caregivers');
      const nextLogos = (response.data ?? [])
        .filter((caregiver) => caregiver.logoImageUrl)
        .map((caregiver) => ({
          src: assetUrl(caregiver.logoImageUrl),
          alt: `Logo von ${caregiver.daycareName || caregiver.name || 'Kindertagespflege'}`,
          id: caregiver.id,
        }))
        .filter((logo) => logo.src);

      if (!ignore) {
        setLogos(nextLogos);
      }
    }

    fetchLogos().catch((error) => {
      console.error('Logos konnten nicht geladen werden', error);
      if (!ignore) {
        setLogos([]);
      }
    });

    return () => {
      ignore = true;
    };
  }, []);

  const doubledLogos = useMemo(() => [...logos, ...logos], [logos]);

  if (!logos.length) {
    return null;
  }

  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-semibold text-brand-700">Kindertagespflegen auf Kleine Welt</h2>

      <div className="relative overflow-hidden rounded-2xl">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-brand-50 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-brand-50 to-transparent" />

        <div className="animate-scroll flex w-max items-center gap-12 py-2">
          {doubledLogos.map((logo, index) => (
            <article key={`${logo.id}-${index}`} className="h-20 w-32 shrink-0 rounded-xl bg-card/80 p-3 shadow-sm transition hover:shadow-md">
              <img src={logo.src} alt={logo.alt} loading="lazy" className="h-full w-full object-contain" />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default LogoCarousel;
