# Systemarchitektur

## Übersicht
Die Plattform besteht aus einem modularen Setup mit klar getrennten Verantwortlichkeiten:

1. **Frontend** – Nutzeroberfläche für Eltern und Tagespflegepersonen.
2. **Backend** – API- und Geschäftslogik-Schicht.
3. **Messaging & Benachrichtigungen** – Echtzeit-Kommunikation.
4. **Datenhaltung** – Relationale Datenbank + Dateiablage.
5. **Analytics & Monitoring**.

```
[Frontend (Next.js)] ⇄ [API Gateway] ⇄ [Backend-Services (NestJS)] ⇄ [PostgreSQL]
                                      ↘︎ [Realtime/Messaging (WebSocket, Redis)]
                                      ↘︎ [Object Storage (S3-kompatibel)]
```

## Frontend
- **Technologie:** Next.js 14 (App Router), TypeScript, Tailwind CSS.
- **Authentifizierung:** NextAuth mit Magic Links + OAuth (Apple/Google).
- **State-Management:** React Query + Zustand.
- **Internationalisierung:** next-intl für Mehrsprachigkeit (DE, EN, ggf. weitere).
- **Kartenintegration:** Mapbox GL JS.
- **PWA-Fähigkeit:** Offline-Modus für Messenger und Push-Benachrichtigungen.

## Backend
- **Framework:** NestJS (TypeScript) mit modularer Architektur.
- **API-Layer:** GraphQL (Apollo Server) für flexible Datenabfragen + REST-Endpunkte für Webhooks.
- **Authentifizierung:** JWTs (Access & Refresh Token), 2FA optional.
- **Module:**
  - Users & Profiles
  - Childcare Providers
  - Placements & Availability
  - Matching & Recommendations
  - Messaging (WebSocket Gateway)
  - Billing & Payments (Integration z. B. Stripe, GOCARDLESS für SEPA)
  - Notifications (E-Mail, Push, SMS via Twilio/Sendinblue)
  - Admin (Moderation, Reporting)
- **Hintergrundjobs:** BullMQ (Redis) für E-Mail-Versand, Matching-Läufe, Datenbereinigung.

## Datenbank & Storage
- **DB:** PostgreSQL 15, geospatial Erweiterung (PostGIS) für Umkreissuche.
- **ORM:** Prisma.
- **Storage:** AWS S3 oder MinIO für Dokumente und Bilder (verschlüsselt, signierte URLs).
- **Caching:** Redis für Sessions, Rate Limiting und Feed-Generierung.

## Infrastruktur
- **Hosting:** AWS (alternativ GCP/Azure). Beispiel-Setup:
  - Frontend: Vercel oder AWS Amplify.
  - Backend: AWS ECS/Fargate oder Kubernetes (EKS) mit CI/CD (GitHub Actions).
  - DB: AWS RDS (PostgreSQL) mit automatischen Backups.
  - Object Storage: S3 mit Server-Side Encryption.
  - Redis: ElastiCache.
- **CI/CD:** GitHub Actions mit Stages (Lint, Test, Build, Deploy).
- **Monitoring:**
  - Application Monitoring: Datadog oder Sentry.
  - Logging: OpenTelemetry + CloudWatch/ELK.
  - Alerting: PagerDuty/Slack.

## Sicherheit
- DSGVO-konforme Datenverarbeitung.
- Verschlüsselung in Transit (TLS) und at Rest.
- Rollen- & Rechtekonzept (RBAC) mit granularen Berechtigungen.
- Audit-Logs für kritische Aktionen (Profiländerungen, Vertragsabschluss).
- Penetration Tests & regelmäßige Security Audits.

## Skalierung
- Horizontale Skalierung des Backends via Container-Orchestrierung.
- Read Replicas in der Datenbank.
- CDN für statische Assets.
- Rate Limiting und Throttling pro API-Key bzw. Nutzer.

## Drittsysteme & Integrationen
- **Geocoding:** Mapbox/Here.
- **E-Mail:** Sendinblue, Postmark oder AWS SES.
- **Zahlungen:** Stripe für Karten, GoCardless für SEPA-Lastschriften.
- **Verträge/Signatur:** DocuSign oder Skribble.
- **KYC/Identität:** Verimi, IDnow (optional).

## Entwicklungsprozess
1. Infrastruktur als Code (Terraform) für reproduzierbare Setups.
2. Lokale Entwicklungsumgebung via Docker Compose (DB, Redis, Storage).
3. Teststrategie: Unit-Tests (Jest), Integrationstests (Supertest), End-to-End-Tests (Playwright).
4. Qualitätssicherung: Code Review, Static Code Analysis (ESLint, SonarCloud).

## Datenschutz-Workflow
- Privacy by Design: Minimale Datenerhebung.
- Löschkonzepte und Aufbewahrungsfristen.
- Einwilligungsmanagement (Cookies, Marketing).
- Rollenbasierte Maskierung sensibler Daten für Support-Teams.
