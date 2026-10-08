# Coaching-App – Projektkontext für Claude

## Umgebungen

| | DEV | PRD |
|---|---|---|
| **GitHub** | `lata-8888/coaching-app` | – (noch nicht angelegt) |
| **Supabase** | `ofdkpdmcfqnelqoaeshx` | – |
| **GitHub Pages** | `lata-8888.github.io/coaching-app/` | – |

**Regel:** Änderungen zuerst in DEV. Die Coaching-App hat ein eigenes Supabase-Projekt und teilt nichts mit der FBRO-App (`lata-8888/fbro-dev`, dient nur als Konzeptvorlage).

## Übersicht
Vanilla JS Single-Page-App, kein Build-Schritt, Backend Supabase. Vier Seiten (Chat, Notes, Prep, Profil) plus der Admin-Tab (nur für Admins, Personenverwaltung), vier Rollen (admin, mentor, assistent, talent). Details: `README.md`.

## Aus FBRO übernommene Konzepte
- Login: Handynummer → synthetische Adresse `<Nummer ohne +>@<EMAIL_DOMAIN>`, PIN = letzte 6 Ziffern, bis ein eigener PIN gesetzt ist (`pin_changed`, gelber Hinweisbalken). `EMAIL_DOMAIN` muss in `config.js` aktiv gesetzt sein und zu `auth.users` passen.
- Personen legt nur ein Admin an (temporärer Supabase-Client + Zugangscode `club_code` aus `app_settings`); keine Selbstregistrierung in der UI.
- Sprache und Darstellung (`profiles.language`, `profiles.theme`) werden pro Person gespeichert und lokal zwischengespeichert (`coaching-lang`, `coaching-theme`).
- Rollen und Rechte liegen in der Datenbank (RLS, `security definer`-RPCs), die App prüft zusätzlich im Client.
- Realtime-Kanal `coaching-daten`, `esc()` für alle Nutzerdaten, Service Worker mit Netz-zuerst.

## Regeln
- `service_role`-Schlüssel nie in `config.js`; dort nur der `anon public`-Key.
- Neue Tabellen: RLS aktivieren, Policy, Realtime-Publication (Listen am Ende von `schema.sql` ergänzen).
- Neue Texte: in **allen 4 Sprachen** (de, en, fr, it) im `DICT` in `app.js`; Platzhalter müssen übereinstimmen. Texte, die die Person direkt ansprechen, brauchen zusätzlich eine Sie-Variante mit Schlüssel + `F` (z. B. `botQ1F`) in de, fr, it; `L()` wählt sie, wenn `profiles.address_form = 'formal'`.
- Telefonfelder immer mit `phoneField()` (Land + Rest); der Submit-Handler setzt sie über `combinedPhone()` zusammen.
- Jede Ausgabe von Nutzerdaten über `esc()`; Admin-Aktionen mit Client-Guard (`S.me.role === 'admin'`) **und** serverseitiger Prüfung (`is_admin()`).
- `sw.js`: `CACHE` (`coaching-vN`) um 1 erhöhen, sobald eine Shell-Datei ändert; alle Pfade in `SHELL` müssen existieren.
- Rolle und Handynummer ändern nur über RPC (`set_role`, `update_own_phone`); die Spalten sind für Clients nicht direkt schreibbar.
- Admins ändern Stammdaten anderer Personen nur über `admin_update_person` (Handynummer bleibt bei der Person selbst).
- Den Assistenten eines Talents wählt nur `set_assistant` (nur Talente, nur für sich selbst); die Liste der Assistenten liefert `list_assistants`, weil Talente sonst keine fremden Profile sehen.
- Das Profilbild ändert ebenfalls nur die RPC `set_avatar`, die Eigenschaften (Freitext `traits`) nur `set_traits` – jeweils die Person selbst oder ein Admin für alle.
- Chat, Notizen und Prep-Punkte sind privat (`user_id = auth.uid()`); Queries filtern zusätzlich mit `.eq('user_id', …)`.

- Jede Person hat `first_name`, `last_name`, `gender` (m/w/x), `phone`, `email` (Pflicht, alle Rollen) und optional `avatar` (JPEG-Data-URL, im Browser auf 256 px verkleinert). Login nur Handynummer + PIN; `email` ist reine Kontaktangabe, nicht `auth.users.email`. `profiles.name` ist generiert (nicht schreibbar).

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
