# Coaching-App – Projektkontext für Claude

## Umgebungen

| | DEV | PRD |
|---|---|---|
| **GitHub** | `lata-8888/coaching-app` | – (noch nicht angelegt) |
| **Supabase** | `ofdkpdmcfqnelqoaeshx` | – |
| **GitHub Pages** | `lata-8888.github.io/coaching-app/` | – |

**Regel:** Änderungen zuerst in DEV. Die Coaching-App hat ein eigenes Supabase-Projekt und teilt nichts mit der FBRO-App (`lata-8888/fbro-dev`, dient nur als Konzeptvorlage).

## Übersicht
Vanilla JS Single-Page-App, kein Build-Schritt, Backend Supabase. Vier Seiten (Chat, Notes, Prep, Profil), drei Rollen (admin, mentor, talent). Details: `README.md`.

## Aus FBRO übernommene Konzepte
- Login: Handynummer → synthetische Adresse `<Nummer ohne +>@<EMAIL_DOMAIN>`, PIN = letzte 6 Ziffern, bis ein eigener PIN gesetzt ist (`pin_changed`, gelber Hinweisbalken). `EMAIL_DOMAIN` muss in `config.js` aktiv gesetzt sein und zu `auth.users` passen.
- Personen legt nur ein Admin an (temporärer Supabase-Client + Zugangscode `club_code` aus `app_settings`); keine Selbstregistrierung in der UI.
- Sprache und Darstellung (`profiles.language`, `profiles.theme`) werden pro Person gespeichert und lokal zwischengespeichert (`coaching-lang`, `coaching-theme`).
- Rollen und Rechte liegen in der Datenbank (RLS, `security definer`-RPCs), die App prüft zusätzlich im Client.
- Realtime-Kanal `coaching-daten`, `esc()` für alle Nutzerdaten, Service Worker mit Netz-zuerst.

## Regeln
- `service_role`-Schlüssel nie in `config.js`; dort nur der `anon public`-Key.
- Neue Tabellen: RLS aktivieren, Policy, Realtime-Publication (Listen am Ende von `schema.sql` ergänzen).
- Neue Texte: in **allen 4 Sprachen** (de, en, fr, it) im `DICT` in `app.js`; Platzhalter müssen übereinstimmen.
- Jede Ausgabe von Nutzerdaten über `esc()`; Admin-Aktionen mit Client-Guard (`S.me.role === 'admin'`) **und** serverseitiger Prüfung (`is_admin()`).
- `sw.js`: `CACHE` (`coaching-vN`) um 1 erhöhen, sobald eine Shell-Datei ändert; alle Pfade in `SHELL` müssen existieren.
- Rolle und Handynummer ändern nur über RPC (`set_role`, `update_own_phone`); die Spalten sind für Clients nicht direkt schreibbar.
- Chat, Notizen und Prep-Punkte sind privat (`user_id = auth.uid()`); Queries filtern zusätzlich mit `.eq('user_id', …)`.

- Jede Person hat `first_name`, `last_name`, `phone`, `email` (Pflicht, alle Rollen). Login nur Handynummer + PIN; `email` ist reine Kontaktangabe, nicht `auth.users.email`. `profiles.name` ist generiert (nicht schreibbar).

## Bot und Titel
- `planBot()` bestimmt aus dem letzten Bot-Eintrag (`kind`: greet, q1, q2, q3, offer, done) die nächste Antwort; `chips` einer Bot-Nachricht sind die angebotenen Schnellantworten. Nutzer-Nachrichten haben `kind = null` (Freitext) oder `'chip'`.
- `gatherSession()` sammelt die Freitext-Antworten ab der Nachricht, die `q1` ausgelöst hat; daraus entstehen Notiz und Prep-Punkt.
- `makeTitle()` erzeugt den Notiz-Titel (Heuristik). `notes.title_manual = true` schützt einen von Hand gesetzten Titel.

## Tests (nicht im Repo)
Statisch: `node --check`, Übersetzungs-Parität, `SHELL`-Dateien, Tabellen/RPCs gegen `schema.sql`. Verhalten: jsdom gegen ein In-Memory-Supabase mit RLS-Nachbildung (Login, Bot-Ablauf, Notes, Prep, Profil, Rollen, Datenisolation).
Nicht getestet: echtes Supabase (Schema ist ausgeführt und per SQL geprüft; Realtime und Signup-Ablauf noch nicht live) und echte Browser/Android-PWA-Installation.

## Konventionen
- Zip-Name: `Coaching-App_DEV_v<N>.zip` (N = `CACHE`-Nummer in `sw.js`), nur versionierte Dateien, ohne `.git`.

## Offene Aufgaben
- [x] `schema.sql` im DEV-Supabase ausgeführt, Zugangscode gesetzt (nicht im Repo)
- [ ] „Confirm email“ in Supabase Auth ausschalten; ersten Admin anlegen (README)
- [ ] GitHub Pages aktivieren (`main` → `/(root)`)
- [ ] Bot an ein Sprachmodell anbinden (Edge Function) – optional
- [ ] Mentor ↔ Talent zuordnen und Inhalte freigeben
- [ ] PRD-Umgebung festlegen
