import { useMemo, useState } from 'react';
import {
  ChatBubbleLeftRightIcon,
  ChevronDownIcon,
  QuestionMarkCircleIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

const faqData = [
  {
    category: 'Allgemeines',
    icon: QuestionMarkCircleIcon,
    questions: [
      {
        q: 'Was ist eine Kindertagespflege?',
        a: 'Kindertagespflege ist eine familiennahe Form der Kinderbetreuung. Kinder werden meist in kleinen Gruppen von einer qualifizierten Tagesmutter oder einem Tagesvater betreut – häufig im eigenen Haushalt der Betreuungsperson.',
      },
      {
        q: 'Ab welchem Alter können Kinder in die Kindertagespflege?',
        a: 'In der Regel können Kinder bereits ab dem ersten Lebensjahr betreut werden. Viele Angebote richten sich speziell an Kinder unter drei Jahren.',
      },
      {
        q: 'Wie viele Kinder betreut eine Tagesmutter gleichzeitig?',
        a: 'Eine Kindertagespflegeperson darf in Deutschland normalerweise bis zu fünf Kinder gleichzeitig betreuen.',
      },
      {
        q: 'Was kostet ein Platz in der Kindertagespflege?',
        a: 'Die Kosten hängen von der jeweiligen Stadt oder dem Jugendamt ab. In vielen Städten werden die Beiträge ähnlich wie bei Kitas vom Jugendamt festgelegt oder bezuschusst.',
      },
      {
        q: 'Wie finde ich einen freien Betreuungsplatz?',
        a: 'Über Plattformen wie Wimmel Welt können Eltern gezielt nach freien Betreuungsplätzen suchen und direkt Kontakt zu Kindertagespflegepersonen aufnehmen.',
      },
      {
        q: 'Ist Kindertagespflege genauso sicher wie eine Kita?',
        a: 'Ja. Kindertagespflegepersonen benötigen eine Pflegeerlaubnis vom Jugendamt, müssen Qualifizierungen nachweisen und regelmäßig Fortbildungen besuchen.',
      },
      {
        q: 'Wie läuft die Eingewöhnung ab?',
        a: 'Die Eingewöhnung erfolgt meist nach dem Berliner Modell. Dabei begleiten Eltern ihr Kind in den ersten Tagen, bis es sich an die neue Umgebung gewöhnt hat.',
      },
      {
        q: 'Welche Vorteile hat Kindertagespflege gegenüber einer Kita?',
        a: 'Die Betreuung bietet kleinere Gruppen, individuellere Förderung, eine familiäre Atmosphäre und häufig flexiblere Betreuungszeiten.',
      },
      {
        q: 'Was passiert, wenn die Tagesmutter krank ist?',
        a: 'Viele Kommunen organisieren Vertretungsmodelle, sodass Kinder im Krankheitsfall weiterhin betreut werden können.',
      },
    ],
  },
  {
    category: 'Für Familien',
    icon: UsersIcon,
    questions: [
      {
        q: 'Wie viel kostet es mich, die Plattform Wimmel Welt zu benutzen?',
        a: 'Die Plattform ist für Eltern komplett kostenlos – ohne Kaufoption oder versteckte Gebühren.',
      },
      {
        q: 'Wie teuer ist die Betreuung meines Kindes bei einer Kindertagespflegeperson?',
        a: 'Die Kosten sind je nach Kommune und Einkommen unterschiedlich. Bei höherem Einkommen teilen sich Eltern und Kommune die Kosten, bei niedrigerem Einkommen kann die Kommune die Finanzierung vollständig übernehmen.',
      },
      {
        q: 'Warum sollte ich mein Kind bei einer Tagesmutter oder einem Tagesvater betreuen lassen?',
        a: 'Im Vergleich zum Kindergarten sind die Gruppen meist kleiner. Dadurch können Kinder individueller begleitet und gefördert werden.',
      },
      {
        q: 'Können nur Eltern aus meiner Stadt mein Profil sehen?',
        a: 'Nein. Eltern können Kindertagespflegepersonen in jeder beliebigen Stadt sehen. Das ist bewusst so, damit Familien zum Beispiel bei einem geplanten Umzug frühzeitig suchen können.',
      },
    ],
  },
  {
    category: 'Für Tagespflegepersonen',
    icon: UserGroupIcon,
    questions: [
      {
        q: 'Was ist Wimmel Welt?',
        a: 'Wimmel Welt ist eine digitale Plattform, auf der Kindertagespflegepersonen ihre freien Betreuungsplätze sichtbar machen können, damit Eltern schneller eine passende Betreuung finden.',
      },
      {
        q: 'Für wen ist die Plattform gedacht?',
        a: 'Die Plattform richtet sich an Kindertagespflegepersonen, Eltern auf der Suche nach Betreuung und kleine Betreuungseinrichtungen.',
      },
      {
        q: 'Wie kann ich mich auf Wimmel Welt registrieren?',
        a: 'Sie können sich einfach über unsere Website registrieren und ein Profil für Ihre Kindertagespflege erstellen.',
      },
      {
        q: 'Welche Informationen kann ich in meinem Profil angeben?',
        a: 'Zum Beispiel Betreuungszeiten, Anzahl freier Plätze, Alter der Kinder, Bilder Ihrer Räumlichkeiten und Ihr pädagogisches Konzept.',
      },
      {
        q: 'Kostet die Nutzung der Plattform etwas?',
        a: 'Ja. Die Nutzung kostet aktuell 20 €.',
      },
      {
        q: 'Wie können Eltern mich kontaktieren?',
        a: 'Eltern können direkt über die Plattform eine Betreuungsanfrage senden.',
      },
      {
        q: 'Kann ich mein Profil jederzeit ändern?',
        a: 'Ja. Sie können freie Plätze, Betreuungszeiten und Informationen jederzeit aktualisieren.',
      },
      {
        q: 'In welchen Städten ist Wimmel Welt verfügbar?',
        a: 'Wimmel Welt wird aktuell ausgebaut und ist bereits in Gütersloh aktiv, wo erste Betreuungsanfragen von Eltern an Kindertagespflegepersonen gesendet wurden.',
      },
      {
        q: 'Muss ich eine Pflegeerlaubnis haben, um mich anzumelden?',
        a: 'Ja. Nur qualifizierte Kindertagespflegepersonen mit gültiger Pflegeerlaubnis dürfen Betreuungsangebote einstellen. Bei der Profilerstellung wird die jeweilige Kommune zur Verifizierung kontaktiert.',
      },
      {
        q: 'Wie hilft mir Wimmel Welt dabei, neue Familien zu finden?',
        a: 'Die Plattform macht Ihre freien Plätze online sichtbar, sodass Eltern gezielt suchen und Sie direkt ohne Umwege kontaktieren können.',
      },
    ],
  },
  {
    category: 'Sicherheit & Datenschutz',
    icon: ShieldCheckIcon,
    questions: [
      {
        q: 'Wie werden meine Daten geschützt?',
        a: 'Wir achten auf einen verantwortungsvollen Umgang mit personenbezogenen Daten und orientieren uns an den geltenden Datenschutzstandards. Details finden Sie in unserer Datenschutzerklärung.',
      },
      {
        q: 'Wer darf auf Profile und Betreuungsinformationen zugreifen?',
        a: 'Informationen sind für die Nutzung der Plattform vorgesehen, damit Eltern und Tagespflegepersonen zueinander finden. Sensible Daten werden nicht öffentlich dargestellt.',
      },
      {
        q: 'Wo finde ich weitere rechtliche Informationen?',
        a: 'Alle Details finden Sie auf unseren Seiten zu Datenschutz und Impressum.',
      },
    ],
  },
];

function FAQPage() {
  const [activeCategory, setActiveCategory] = useState(faqData[0].category);

  const activeSection = useMemo(
    () => faqData.find((section) => section.category === activeCategory) ?? faqData[0],
    [activeCategory],
  );

  const [openQuestion, setOpenQuestion] = useState(activeSection.questions[0]?.q ?? '');

  function handleCategoryChange(category) {
    setActiveCategory(category);
    const section = faqData.find((entry) => entry.category === category);
    setOpenQuestion(section?.questions[0]?.q ?? '');
  }

  function handleQuestionToggle(question) {
    setOpenQuestion((current) => (current === question ? '' : question));
  }

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-8 rounded-3xl bg-white/85 p-6 shadow-lg sm:p-10">
      <header className="space-y-3 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-500">Häufige Fragen</p>
        <h1 className="text-3xl font-semibold text-brand-700 sm:text-4xl">Antworten rund um Wimmel Welt</h1>
        <p className="mx-auto max-w-2xl text-sm text-slate-600 sm:text-base">
          Hier finden Familien und Tagespflegepersonen die wichtigsten Informationen zur Plattform, Betreuung und Sicherheit.
        </p>
      </header>

      <div className="flex flex-wrap justify-center gap-3">
        {faqData.map((section) => {
          const Icon = section.icon;
          const isActive = section.category === activeCategory;

          return (
            <button
              key={section.category}
              type="button"
              onClick={() => handleCategoryChange(section.category)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition duration-200 ${
                isActive
                  ? 'border-brand-600 bg-brand-600 text-white shadow-sm'
                  : 'border-brand-100 bg-white text-slate-700 hover:-translate-y-0.5 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700'
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {section.category}
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        {activeSection.questions.map((entry) => {
          const isOpen = openQuestion === entry.q;

          return (
            <article key={entry.q} className="overflow-hidden rounded-2xl border border-brand-100 bg-white">
              <button
                type="button"
                onClick={() => handleQuestionToggle(entry.q)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <span className="font-medium text-slate-800">{entry.q}</span>
                <ChevronDownIcon
                  className={`h-5 w-5 shrink-0 text-brand-600 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                />
              </button>
              {isOpen ? <p className="border-t border-brand-100 px-5 py-4 text-sm text-slate-600">{entry.a}</p> : null}
            </article>
          );
        })}
      </div>

      <div className="rounded-3xl bg-gradient-to-r from-brand-600 to-brand-500 p-6 text-white shadow-lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-100">Noch Fragen?</p>
            <h2 className="text-2xl font-semibold">Wir helfen gerne persönlich weiter.</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/kontakt"
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-700 transition duration-200 hover:-translate-y-0.5 hover:bg-brand-50"
            >
              <ChatBubbleLeftRightIcon className="h-4 w-4" aria-hidden="true" />
              Kontakt
            </Link>
            <Link
              to="/kindertagespflege"
              className="inline-flex items-center rounded-full border border-white/50 px-4 py-2 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-white/10"
            >
              Tagespflege finden
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default FAQPage;
