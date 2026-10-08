# Coaching-App (DEV)

Vanilla-JS-PWA ohne Build-Schritt, Backend auf Supabase. Konzepte (Login per Handynummer und PIN, Sprachen, Hell/Dunkel, Tabbar, Rollen über die Datenbank, Live-Updates) stammen aus der FBRO-App.

| | DEV |
|---|---|
| **GitHub** | `lata-8888/coaching-app` |
| **Supabase** | `ofdkpdmcfqnelqoaeshx` |
| **URL** | `lata-8888.github.io/coaching-app/` (GitHub Pages: Settings → Pages → `main` → `/(root)`) |

Eine PRD-Umgebung gibt es noch nicht.

## Seiten

| Seite | Inhalt |
|---|---|
| **Chat** | Gespräch zwischen Coach-Bot und Talent im Messenger-Stil. Der Bot führt durch Thema → drei Fragen → Angebot, hält auf Wunsch eine Notiz fest oder legt den nächsten Schritt in Prep. Jede Nachricht lässt sich antippen und per «Als Notiz» / «In Prep» übernehmen. |
| **Notes** | Gedanken und Notizen mit Zeitstempel. Der Titel entsteht automatisch aus dem Inhalt und lässt sich von Hand überschreiben (leer lassen = wieder automatisch). |
| **Prep** | Checkliste / Agenda für ein Meeting. Punkte von Hand erfassen oder aus Chat und Notes übernehmen; die Herkunft bleibt als Chip sichtbar und springt zur Quelle. Erledigen, sortieren, bearbeiten, Erledigte entfernen. |
| **Admin** (nur Admins) | Teilnehmer als Karten (Bild, Name, Rolle, Edit-Knopf); suchen, nach Rolle filtern. Der Edit-Knopf öffnet ein Blatt mit allen Änderungen: Stammdaten bearbeiten (Vorname, Nachname, Geschlecht, E-Mail, Eigenschaften), Rolle ändern, Profilbild setzen, PIN zurücksetzen, Person anlegen oder entfernen. |
| **Profil** | Sprache (de, en, fr, it), Hell/Dunkel/Auto, Vorname, Nachname, Geschlecht, E-Mail, Profilbild, Handynummer (mit Ländervorwahl), PIN, Anrede (Du oder Sie). Talente wählen hier ausserdem ihren Assistenten.  |

## Personendaten

Jede Person (unabhängig von der Rolle) hat Vorname, Nachname, Geschlecht (m/w/x), Handynummer, E-Mail und ein Profilbild (optional; Initialen als Ersatz). Angemeldet wird ausschliesslich mit Handynummer und PIN; die E-Mail ist nur eine Kontaktadresse im Profil (`profiles.email`) und hat mit dem Login nichts zu tun. `profiles.name` ist eine berechnete Spalte (Vorname + Nachname). Dazu kommt ein Freitextfeld «Eigenschaften» (`profiles.traits`, höchstens 2000 Zeichen), das die Person selbst und Admins bearbeiten können (RPC `set_traits`). Das Profilbild wird im Browser quadratisch auf 256 px verkleinert und als kleines JPEG (Data-URL, höchstens ca. 90 KB) in `profiles.avatar` gespeichert; ein Storage-Bucket ist nicht nötig. Jede Person ändert ihr Bild im Profil selbst; Admins können es zusätzlich für alle Personen setzen oder entfernen (Tab Admin). Beides läuft über die Funktion `set_avatar`.

## Anmeldung, Anrede, Assistent

- **Telefonfeld:** Links wählt man das Land mit Vorwahl (Standard Schweiz, die letzte Wahl wird gemerkt), rechts steht die restliche Nummer. Eine führende 0 wird ignoriert; auch eine ganze Nummer mit «+» oder «00» im rechten Feld wird erkannt. Dasselbe Feld gilt beim Nummernwechsel im Profil und beim Anlegen einer Person.
- **Anrede (Du/Sie):** Im Profil neben der Sprache wählbar (`profiles.address_form`). Sie gilt für App-Texte und Bot-Nachrichten in Deutsch, Französisch (tu/vous) und Italienisch (tu/Lei); Englisch kennt keinen Unterschied. Bereits geschriebene Bot-Nachrichten ändern sich nicht nachträglich.
- **Assistent:** Jedes Talent wählt im Profil einen Assistenten (`profiles.assistant_id`). Die Liste liefert die Funktion `list_assistants`, gespeichert wird über `set_assistant`. Admins sehen die Wahl in der Personenliste.

## Rollen

`admin`, `mentor`, `assistent`, `talent` (Spalte `profiles.role`). Neue Konten sind immer `talent`; die Rolle ändert nur ein Admin (RPC `set_role`).

- **admin**: Personen anlegen, Rollen vergeben, Profilbilder setzen, PIN zurücksetzen, Personen entfernen (Tab Admin).
- **mentor**, **assistent** und **talent**: sehen dieselben vier Seiten. Chat, Notes und Prep sind streng privat (RLS: nur eigene Zeilen). Mentoren und Assistenten haben vorerst keine zusätzlichen Rechte.

## Einrichtung (DEV)

1. **Supabase-Projekt** (eigenes Projekt für die Coaching-App): angelegt, `ofdkpdmcfqnelqoaeshx`.
2. **Auth → Providers → Email**: «Confirm email» ausschalten (Login läuft über synthetische Adressen `<Nummer>@phone-login.app`).
3. **SQL Editor**: `supabase/schema.sql` ausführen (idempotent; hebt auch eine ältere Version mit nur «name» auf Vorname/Nachname/E-Mail an).
4. **Zugangscode setzen**: `update public.app_settings set value = '<geheimer Code>' where key = 'club_code';`
5. **config.js**: URL und Publishable Key des Projekts sind eingetragen. Den `service_role`-Schlüssel nie eintragen.
6. **Ersten Admin anlegen**: App öffnen, in der Browser-Konsole ausführen (Nummer, Name und Code anpassen):
   ```js
   const c = supabase.createClient(APP_CONFIG.SUPABASE_URL, APP_CONFIG.SUPABASE_ANON_KEY);
   await c.auth.signUp({ email: '41791234567@phone-login.app', password: '234567',
     options: { data: { first_name: 'Vorname', last_name: 'Nachname', email: 'name@example.com', gender: 'm', phone: '+41791234567', club_code: '<geheimer Code>' } } });
   ```
   Der PIN ist die Nummer ohne `+`, letzte 6 Ziffern. Danach im SQL Editor: `update public.profiles set role = 'admin' where phone = '+41791234567';`
7. Anmelden, im Profil den eigenen PIN setzen. Weitere Personen legt der Admin im Profil an.

## Dateien

| Datei | Beschreibung |
|---|---|
| `config.js` | Supabase-URL und Anon-Key, App-Name, `EMAIL_DOMAIN` |
| `app.js` | Gesamte App-Logik (Übersetzungen, Login, vier Seiten, Bot-Ablauf) |
| `styles.css` | Design-Token mit Hell/Dunkel, Chat-, Notiz- und Checklisten-Stile |
| `sw.js` | Service Worker (Cache-Version `coaching-vN` bei Änderungen an Shell-Dateien erhöhen) |
| `manifest.webmanifest`, `icon-*.png`, `apple-touch-icon.png`, `icons/` | PWA |
| `supabase/schema.sql` | Tabellen, RLS, Funktionen, Realtime |

## Bekannte Grenzen und nächste Schritte

- **Der Bot ist regelbasiert** (`planBot()` in `app.js`). Für echte Antworten kann `botSay()` später an ein Sprachmodell über eine Supabase Edge Function angebunden werden; der Schlüssel bleibt dann auf dem Server.
- **Der Auto-Titel ist eine Heuristik** (erster Satz, Füllwörter am Anfang entfernt, höchstens 7 Wörter), keine inhaltliche Zusammenfassung.
- **Standard-PIN = letzte 6 Ziffern der Handynummer** (wie FBRO). Das ist schwach; der gelbe Hinweisbalken erscheint für alle Rollen, bis ein eigener PIN gesetzt ist. Für sensible Inhalte lohnt sich später eine stärkere Anmeldung.
- Mentoren sehen noch keine Inhalte ihrer Talente (Zuordnung Mentor ↔ Talent und freigegebene Inhalte fehlen).
- Das Anmelden mit Handynummer und PIN setzt voraus, dass Supabase-Registrierungen nur mit Zugangscode möglich sind (Trigger `check_club_code`).
