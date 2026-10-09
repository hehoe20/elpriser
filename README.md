# DK1 Electricity Price Dashboard (Clever Power)

[Dansk](#dansk) | [English](#english)

---

## Dansk

Et simpelt, selvhostet Node.js-dashboard til visualisering af elspotpriser for DK1 (Vestdanmark) med indbygget beregning af moms, Energinets tariffer og **Vores Elnet** C-tariffer (inkl. tidsafhængig spidslast). Dashboardet viser et stakket søjlediagram, udregner automatisk de billigste og dyreste sammenhængende timer (3, 4 og 5 timer), og har en indbygget varsling for kvartalsvise tarifændringer.

### Sådan starter du containeren (Docker)

Sørg for, at du har Docker og Docker Compose installeret, og kør følgende kommando i mappen med projektet:

```bash
docker compose up -d --build
```

Derefter kan dashboardet tilgås i din browser på:
http://localhost:3000

## English
A simple, self-hosted Node.js dashboard for visualizing DK1 electricity spot prices (Western Denmark), featuring built-in calculations for VAT, Energinet tariffs, and Vores Elnet C-tariffs (including time-of-use peak loads). The dashboard features a stacked bar chart, automatically calculates the cheapest and most expensive continuous hours (3, 4, and 5-hour slots), and includes a warning banner for upcoming quarterly tariff changes.
