function TermsPage() {
  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 rounded-3xl bg-white/90 p-6 shadow-lg sm:p-10">
      <h1 className="text-3xl font-semibold text-brand-700">Allgemeine Geschäftsbedingungen (AGB) für „Wimmel Welt“</h1>
      <p className="text-sm text-slate-600">Stand: 29. April 2026</p>
      <article className="prose prose-slate max-w-none text-sm leading-relaxed">
        <p>
          Diese AGB regeln die Nutzung der Plattform „Wimmel Welt“ unter www.wimmel-welt.de. Betreiber ist Wimmel Welt,
          Falkenrecks Heide 6, 33332 Gütersloh, Deutschland.
        </p>
        <p>
          Die Plattform dient ausschließlich als Vermittlungsplattform zwischen Eltern und Kindertagespflegepersonen.
          Wimmel Welt wird nicht Vertragspartner von Betreuungsverträgen.
        </p>
        <p>
          Die vollständige AGB-Fassung enthält Regelungen zu Registrierung, Leistungsumfang, Nutzerpflichten, Haftung,
          Kündigung, Nutzungsrechten, Änderungen der AGB, Rechtswahl und Gerichtsstand.
        </p>
        <p>
          Durch Registrierung bestätigst du, dass du volljährig bist, die AGB gelesen hast und ihnen zustimmst.
        </p>
      </article>
    </section>
  );
}

export default TermsPage;
