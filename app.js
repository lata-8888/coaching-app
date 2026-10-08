(function () {
  'use strict';

  /* ---------- Konfiguration & Supabase ---------- */
  var cfg = window.APP_CONFIG || {};
  var configured = !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && cfg.SUPABASE_URL.indexOf('DEIN-PROJEKT') === -1);
  var sb = configured && window.supabase ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY) : null;

  /* ---------- Hilfsfunktionen ---------- */
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var pad = function (n) { return String(n).padStart(2, '0'); };
  var $ = function (id) { return document.getElementById(id); };
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var ROLES = ['admin', 'mentor', 'assistent', 'talent'];
  var TOPICS = ['goal', 'decision', 'blocked', 'meeting'];

  /* ---------- Sprachen (Übersetzungen) ---------- */
  var LANGS = ['de', 'en', 'fr', 'it'];
  var LANG_NAMES = { de: 'Deutsch', en: 'English', fr: 'Français', it: 'Italiano' };
  var LANG_LOCALE = { de: 'de-CH', en: 'en-GB', fr: 'fr-CH', it: 'it-CH' };
  var LANG_HTML = { de: 'de-CH', en: 'en', fr: 'fr-CH', it: 'it-CH' };

  var DICT = {
    de: {
      loading: 'Lädt …', ok: 'OK', dismiss: 'Abbrechen', save: 'Speichern', del: 'Löschen', edit: 'Bearbeiten', close: 'Schliessen',
      errFailed: 'Das hat nicht geklappt', loadFail: 'Die Daten konnten nicht geladen werden. Bitte später erneut versuchen.',
      navChat: 'Chat', navNotes: 'Notes', navPrep: 'Prep', navProfile: 'Profil',
      setupTitle: 'Einrichtung nötig', setupLead: 'Die App ist noch nicht mit Supabase verbunden.',
      setupStep1: 'Supabase-Projekt anlegen und supabase/schema.sql im SQL Editor ausführen.',
      setupStep2: 'In config.js die Project URL und den anon public key eintragen.',
      setupStep3: 'Seite neu laden.',
      setupNote: 'Den service_role-Schlüssel niemals in config.js eintragen.',
      loginSub: 'Anmelden', loginLead: 'Melde dich mit deiner Handynummer an. Solange du keinen eigenen PIN gesetzt hast, gelten die letzten 6 Ziffern deiner Nummer.',
      phone: 'Handynummer', pinOptional: 'PIN (optional)', signIn: 'Anmelden',
      phoneInvalid: 'Bitte eine gültige Handynummer eingeben.', pinExact: 'Der PIN besteht aus genau 6 Ziffern.',
      authInvalid: 'Handynummer oder PIN stimmt nicht.', authRate: 'Zu viele Versuche. Bitte warte einen Moment.', authFail: 'Anmeldung nicht möglich. Bitte erneut versuchen.',
      chatTitle: 'Gespräch', chatSub: 'Mit deinem Coach', chatPlaceholder: 'Nachricht schreiben …', chatSend: 'Senden',
      chatClear: 'Gespräch löschen', confirmClearChat: 'Das ganze Gespräch wird gelöscht. Punkte in Prep bleiben erhalten.',
      today: 'Heute', yesterday: 'Gestern', toNote: 'Als Notiz', toPrep: 'In Prep',
      noteSavedMsg: 'Als Notiz gespeichert', prepAddedMsg: 'Zu Prep hinzugefügt', chatCleared: 'Gespräch gelöscht',
      botGreet: 'Hallo {name}! Schön, dass du da bist. Worüber möchtest du heute sprechen?',
      chip_goal: 'Ein Ziel klären', chip_decision: 'Eine Entscheidung treffen', chip_blocked: 'Ich komme nicht weiter', chip_meeting: 'Ein Meeting vorbereiten',
      topicIntro_goal: 'Gut, lass uns dein Ziel schärfen.',
      topicIntro_decision: 'Verstanden, schauen wir uns die Entscheidung gemeinsam an.',
      topicIntro_blocked: 'Danke, dass du das ansprichst. Gehen wir es Schritt für Schritt an.',
      topicIntro_meeting: 'Gerne, bereiten wir dein Meeting vor.',
      topicIntro_other: 'Danke, dass du das teilst. Ich höre zu.',
      botQ1: 'Was genau beschäftigt dich dabei, und was wäre für dich ein gutes Ergebnis?',
      botQ2: 'Was hat dich bisher davon abgehalten, oder was macht es schwierig?',
      botQ3: 'Was ist der kleinste nächste Schritt, den du diese Woche machen könntest?',
      botOffer: 'Danke, das ergibt ein klares Bild. Soll ich dir etwas davon festhalten?',
      chip_saveNote: 'Als Notiz speichern', chip_addPrep: 'Nächsten Schritt in Prep', chip_newTopic: 'Neues Thema',
      botNoteSaved: 'Erledigt, die Notiz findest du unter «Notes».', botPrepAdded: 'Erledigt, der Punkt steht jetzt in «Prep».',
      botNewTopic: 'Gerne. Was möchtest du als Nächstes anschauen?', botNothing: 'Dazu habe ich noch nichts zum Festhalten. Erzähl mir zuerst etwas.',
      notesTitle: 'Gedanken & Notizen', notesSub: 'Mit Zeitstempel, der Titel entsteht aus dem Inhalt', notePlaceholder: 'Was geht dir durch den Kopf?', noteSave: 'Notiz speichern',
      notesEmpty: 'Noch keine Notizen. Schreib deinen ersten Gedanken auf.', noteUntitled: 'Notiz', titleLabel: 'Titel (leer = automatisch)', bodyLabel: 'Text',
      noteSaved: 'Notiz gespeichert', noteUpdated: 'Notiz aktualisiert', noteDeleted: 'Notiz gelöscht', confirmDelNote: 'Diese Notiz löschen?',
      prepTitle: 'Meeting-Vorbereitung', prepSub: 'Deine Agenda und Checkliste', prepAddPh: 'Punkt hinzufügen …', prepPick: 'Aus Chat / Notes',
      prepClearDone: 'Erledigte entfernen', prepEmpty: 'Noch keine Punkte. Füge einen hinzu oder übernimm etwas aus Chat und Notes.',
      prepProgress: '{done} von {n} erledigt', prepEditOn: 'Bearbeiten', prepEditOff: 'Fertig',
      pickTitle: 'Aus Chat / Notes übernehmen', pickNotes: 'Notizen', pickChat: 'Chat', pickEmpty: 'Hier gibt es noch nichts.', pickAdd: 'Übernehmen', pickAdded: 'Schon drin',
      srcNote: 'Notiz', srcChat: 'Chat', srcGone: 'Quelle gelöscht', moveUp: 'Nach oben', moveDown: 'Nach unten', confirmClearDone: 'Alle erledigten Punkte entfernen?',
      coachLabel: 'Coach', youLabel: 'Du',
      profileTitle: 'Mein Profil', roleLabel: 'Rolle', roleAdmin: 'Admin', roleMentor: 'Mentor', roleAssistant: 'Assistent', roleTalent: 'Talent', nameLabel: 'Name',
      nameChange: 'Persönliche Angaben', nameSave: 'Angaben speichern', nameSaved: 'Angaben gespeichert',
      phoneChange: 'Handynummer ändern', phoneNew: 'Neue Handynummer', phoneSave: 'Nummer speichern', phoneSaved: 'Handynummer gespeichert',
      phoneTaken: 'Diese Handynummer gehört schon jemand anderem.', phoneChangeNote: 'Du meldest dich danach mit der neuen Nummer an. Dein PIN bleibt gleich.',
      confirmPhone: 'Handynummer auf {phone} ändern?',
      language: 'Sprache', languageHint: 'Gilt für die ganze App.', langSaved: 'Sprache gespeichert',
      themeTitle: 'Darstellung', themeHint: 'Hell, Dunkel oder automatisch nach Gerät.', themeLight: 'Hell', themeDark: 'Dunkel', themeAuto: 'Auto',
      pinChange: 'PIN ändern', pinIntro: 'Wähle einen eigenen PIN aus 6 Ziffern. Er schützt deine Notizen und Gespräche.', pinNew: 'Neuer PIN', pinSave: 'PIN speichern',
      pinChanged: 'PIN geändert', pinChangeFail: 'Der PIN konnte nicht geändert werden.', pinDefault: 'Standard-PIN wiederherstellen',
      pinResetOk: 'Standard-PIN gesetzt', pinResetFail: 'Der PIN konnte nicht zurückgesetzt werden.',
      pinBannerMsg: 'Bitte setze deinen persönlichen PIN, damit nur du Zugriff hast.', pinBannerBtn: 'PIN jetzt setzen',
      installTitle: 'App installieren', installHint: 'Lege die App auf deinen Startbildschirm, dann öffnet sie sich im Vollbild.',
      installBtn: 'Auf dem Startbildschirm speichern', installIos: 'Tippe in Safari auf «Teilen» und dann auf «Zum Home-Bildschirm».', logout: 'Abmelden',
      peopleTitle: 'Personen', peopleHint: 'Nur für Admins sichtbar. Hier legst du Personen an und vergibst Rollen.', personAdd: 'Person hinzufügen',
      firstName: 'Vorname', lastName: 'Nachname', email: 'E-Mail', emailInvalid: 'Bitte eine gültige E-Mail-Adresse eingeben.', gender: 'Geschlecht', genderM: 'männlich', genderW: 'weiblich', genderX: 'divers', genderInvalid: 'Bitte ein Geschlecht wählen.', photoTitle: 'Profilbild', photoPick: 'Foto wählen', photoChange: 'Foto ändern', photoRemove: 'Foto entfernen', photoSaved: 'Foto gespeichert', photoRemoved: 'Foto entfernt', photoFail: 'Das Bild konnte nicht verwendet werden.', traits: 'Eigenschaften', traitsHint: 'Stichworte oder Sätze, z. B. Stärken, Interessen, Besonderheiten. Admins können das ebenfalls sehen und bearbeiten.', traitsPh: 'Frei formulieren …', traitsSave: 'Eigenschaften speichern', traitsSaved: 'Eigenschaften gespeichert', navAdmin: 'Admin', adminTitle: 'Teilnehmer verwalten', adminSearch: 'Name, E-Mail, Nummer suchen …', allRoles: 'Alle Rollen', peopleCount: '{n} Personen', noMatch: 'Keine Treffer.', editPerson: 'Bearbeiten', personSaved: 'Person gespeichert', country: 'Land / Vorwahl', assistantTitle: 'Mein Assistent', assistantHint: 'Wähle den Assistenten, der dich begleitet.', assistantNone: 'Keinen Assistenten', assistantSaved: 'Assistent gespeichert', assistantEmpty: 'Noch keine Assistenten verfügbar.', assistantOf: 'Assistent: {name}', addressTitle: 'Anrede', addressHint: 'Wie sollen wir dich ansprechen?', addressInformal: 'Du', addressFormal: 'Sie', addressSaved: 'Anrede gespeichert', assistantHintF: 'Wählen Sie den Assistenten, der Sie begleitet.', addressHintF: 'Wie sollen wir Sie ansprechen?', loginLeadF: 'Melden Sie sich mit Ihrer Handynummer an. Solange Sie keinen eigenen PIN gesetzt haben, gelten die letzten 6 Ziffern Ihrer Nummer.', chatSubF: 'Mit Ihrem Coach', botGreetF: 'Guten Tag {name}! Schön, dass Sie da sind. Worüber möchten Sie heute sprechen?', topicIntro_goalF: 'Gut, lassen Sie uns Ihr Ziel schärfen.', topicIntro_blockedF: 'Danke, dass Sie das ansprechen. Gehen wir es Schritt für Schritt an.', topicIntro_meetingF: 'Gerne, bereiten wir Ihr Meeting vor.', topicIntro_otherF: 'Danke, dass Sie das teilen. Ich höre zu.', botQ1F: 'Was genau beschäftigt Sie dabei, und was wäre für Sie ein gutes Ergebnis?', botQ2F: 'Was hat Sie bisher davon abgehalten, oder was macht es schwierig?', botQ3F: 'Was ist der kleinste nächste Schritt, den Sie diese Woche machen könnten?', botOfferF: 'Danke, das ergibt ein klares Bild. Soll ich Ihnen etwas davon festhalten?', botNoteSavedF: 'Erledigt, die Notiz finden Sie unter «Notes».', botNewTopicF: 'Gerne. Was möchten Sie als Nächstes anschauen?', botNothingF: 'Dazu habe ich noch nichts zum Festhalten. Erzählen Sie mir zuerst etwas.', notePlaceholderF: 'Was geht Ihnen durch den Kopf?', notesEmptyF: 'Noch keine Notizen. Schreiben Sie Ihren ersten Gedanken auf.', prepSubF: 'Ihre Agenda und Checkliste', youLabelF: 'Sie', youF: '(Sie)', phoneChangeNoteF: 'Sie melden sich danach mit der neuen Nummer an. Ihr PIN bleibt gleich.', pinIntroF: 'Wählen Sie einen eigenen PIN aus 6 Ziffern. Er schützt Ihre Notizen und Gespräche.', pinBannerMsgF: 'Bitte setzen Sie Ihren persönlichen PIN, damit nur Sie Zugriff haben.', installHintF: 'Legen Sie die App auf Ihren Startbildschirm, dann öffnet sie sich im Vollbild.', installIosF: 'Tippen Sie in Safari auf «Teilen» und dann auf «Zum Home-Bildschirm».', peopleHintF: 'Nur für Admins sichtbar. Hier legen Sie Personen an und vergeben Rollen.', memberAddNote: 'Die Person meldet sich mit der Handynummer an. Der PIN sind die letzten 6 Ziffern.',
      memberAdded: '{name} hinzugefügt', addFailed: 'Hinzufügen nicht möglich: {reason}', alreadyReg: 'Diese Handynummer ist schon registriert.', unknownError: 'unbekannter Fehler',
      resetPin: 'PIN zurücksetzen', confirmResetPin: 'PIN von {name} auf die letzten 6 Ziffern der Handynummer zurücksetzen?', pinReset: 'PIN zurückgesetzt',
      removeP: 'Entfernen', confirmRemove: '{name} entfernen? Konto, Gespräche, Notizen und Prep-Punkte werden gelöscht.', memberRemoved: 'Person entfernt',
      roleChanged: 'Rolle geändert', you: '(du)', roleSelect: 'Rolle'
    },
    en: {
      loading: 'Loading …', ok: 'OK', dismiss: 'Cancel', save: 'Save', del: 'Delete', edit: 'Edit', close: 'Close',
      errFailed: 'That did not work', loadFail: 'The data could not be loaded. Please try again later.',
      navChat: 'Chat', navNotes: 'Notes', navPrep: 'Prep', navProfile: 'Profile',
      setupTitle: 'Setup required', setupLead: 'The app is not connected to Supabase yet.',
      setupStep1: 'Create a Supabase project and run supabase/schema.sql in the SQL Editor.',
      setupStep2: 'Enter the Project URL and the anon public key in config.js.',
      setupStep3: 'Reload this page.',
      setupNote: 'Never put the service_role key in config.js.',
      loginSub: 'Sign in', loginLead: 'Sign in with your mobile number. Until you set your own PIN, the last 6 digits of your number apply.',
      phone: 'Mobile number', pinOptional: 'PIN (optional)', signIn: 'Sign in',
      phoneInvalid: 'Please enter a valid mobile number.', pinExact: 'The PIN has exactly 6 digits.',
      authInvalid: 'Mobile number or PIN is incorrect.', authRate: 'Too many attempts. Please wait a moment.', authFail: 'Sign-in failed. Please try again.',
      chatTitle: 'Conversation', chatSub: 'With your coach', chatPlaceholder: 'Write a message …', chatSend: 'Send',
      chatClear: 'Delete conversation', confirmClearChat: 'The whole conversation will be deleted. Items in Prep are kept.',
      today: 'Today', yesterday: 'Yesterday', toNote: 'As note', toPrep: 'To Prep',
      noteSavedMsg: 'Saved as note', prepAddedMsg: 'Added to Prep', chatCleared: 'Conversation deleted',
      botGreet: 'Hello {name}! Good to see you. What would you like to talk about today?',
      chip_goal: 'Clarify a goal', chip_decision: 'Make a decision', chip_blocked: 'I feel stuck', chip_meeting: 'Prepare a meeting',
      topicIntro_goal: 'Good, let’s sharpen your goal.',
      topicIntro_decision: 'Understood, let’s look at the decision together.',
      topicIntro_blocked: 'Thank you for bringing that up. Let’s take it step by step.',
      topicIntro_meeting: 'Happy to help, let’s prepare your meeting.',
      topicIntro_other: 'Thank you for sharing. I’m listening.',
      botQ1: 'What exactly is on your mind, and what would a good outcome look like for you?',
      botQ2: 'What has held you back so far, or what makes it difficult?',
      botQ3: 'What is the smallest next step you could take this week?',
      botOffer: 'Thank you, that gives a clear picture. Shall I keep something from this?',
      chip_saveNote: 'Save as note', chip_addPrep: 'Next step to Prep', chip_newTopic: 'New topic',
      botNoteSaved: 'Done, you will find the note under “Notes”.', botPrepAdded: 'Done, the item is now in “Prep”.',
      botNewTopic: 'Gladly. What would you like to look at next?', botNothing: 'I have nothing to keep yet. Tell me something first.',
      notesTitle: 'Thoughts & notes', notesSub: 'Timestamped, the title is created from the content', notePlaceholder: 'What’s on your mind?', noteSave: 'Save note',
      notesEmpty: 'No notes yet. Write down your first thought.', noteUntitled: 'Note', titleLabel: 'Title (empty = automatic)', bodyLabel: 'Text',
      noteSaved: 'Note saved', noteUpdated: 'Note updated', noteDeleted: 'Note deleted', confirmDelNote: 'Delete this note?',
      prepTitle: 'Meeting prep', prepSub: 'Your agenda and checklist', prepAddPh: 'Add an item …', prepPick: 'From Chat / Notes',
      prepClearDone: 'Remove completed', prepEmpty: 'No items yet. Add one or take something from Chat and Notes.',
      prepProgress: '{done} of {n} done', prepEditOn: 'Edit', prepEditOff: 'Done',
      pickTitle: 'Take from Chat / Notes', pickNotes: 'Notes', pickChat: 'Chat', pickEmpty: 'Nothing here yet.', pickAdd: 'Add', pickAdded: 'Already in',
      srcNote: 'Note', srcChat: 'Chat', srcGone: 'Source deleted', moveUp: 'Move up', moveDown: 'Move down', confirmClearDone: 'Remove all completed items?',
      coachLabel: 'Coach', youLabel: 'You',
      profileTitle: 'My profile', roleLabel: 'Role', roleAdmin: 'Admin', roleMentor: 'Mentor', roleAssistant: 'Assistant', roleTalent: 'Talent', nameLabel: 'Name',
      nameChange: 'Personal details', nameSave: 'Save details', nameSaved: 'Details saved',
      phoneChange: 'Change mobile number', phoneNew: 'New mobile number', phoneSave: 'Save number', phoneSaved: 'Mobile number saved',
      phoneTaken: 'This mobile number already belongs to someone else.', phoneChangeNote: 'You will then sign in with the new number. Your PIN stays the same.',
      confirmPhone: 'Change mobile number to {phone}?',
      language: 'Language', languageHint: 'Applies to the whole app.', langSaved: 'Language saved',
      themeTitle: 'Appearance', themeHint: 'Light, dark or automatic by device.', themeLight: 'Light', themeDark: 'Dark', themeAuto: 'Auto',
      pinChange: 'Change PIN', pinIntro: 'Choose your own 6-digit PIN. It protects your notes and conversations.', pinNew: 'New PIN', pinSave: 'Save PIN',
      pinChanged: 'PIN changed', pinChangeFail: 'The PIN could not be changed.', pinDefault: 'Restore default PIN',
      pinResetOk: 'Default PIN set', pinResetFail: 'The PIN could not be reset.',
      pinBannerMsg: 'Please set your personal PIN so that only you have access.', pinBannerBtn: 'Set PIN now',
      installTitle: 'Install app', installHint: 'Add the app to your home screen and it opens in full screen.',
      installBtn: 'Add to home screen', installIos: 'In Safari, tap “Share” and then “Add to Home Screen”.', logout: 'Sign out',
      peopleTitle: 'People', peopleHint: 'Visible to admins only. Add people and assign roles here.', personAdd: 'Add person',
      firstName: 'First name', lastName: 'Last name', email: 'Email', emailInvalid: 'Please enter a valid email address.', gender: 'Gender', genderM: 'male', genderW: 'female', genderX: 'other', genderInvalid: 'Please select a gender.', photoTitle: 'Profile picture', photoPick: 'Choose photo', photoChange: 'Change photo', photoRemove: 'Remove photo', photoSaved: 'Photo saved', photoRemoved: 'Photo removed', photoFail: 'The image could not be used.', traits: 'Traits', traitsHint: 'Keywords or sentences, e.g. strengths, interests, particularities. Admins can see and edit this too.', traitsPh: 'Write freely …', traitsSave: 'Save traits', traitsSaved: 'Traits saved', navAdmin: 'Admin', adminTitle: 'Manage participants', adminSearch: 'Search name, email, number …', allRoles: 'All roles', peopleCount: '{n} people', noMatch: 'No matches.', editPerson: 'Edit', personSaved: 'Person saved', country: 'Country / dial code', assistantTitle: 'My assistant', assistantHint: 'Choose the assistant who accompanies you.', assistantNone: 'No assistant', assistantSaved: 'Assistant saved', assistantEmpty: 'No assistants available yet.', assistantOf: 'Assistant: {name}', addressTitle: 'Form of address', addressHint: 'How should we address you?', addressInformal: 'Informal', addressFormal: 'Formal', addressSaved: 'Form of address saved', memberAddNote: 'The person signs in with their mobile number. The PIN is the last 6 digits.',
      memberAdded: '{name} added', addFailed: 'Could not add: {reason}', alreadyReg: 'This mobile number is already registered.', unknownError: 'unknown error',
      resetPin: 'Reset PIN', confirmResetPin: 'Reset the PIN of {name} to the last 6 digits of the mobile number?', pinReset: 'PIN reset',
      removeP: 'Remove', confirmRemove: 'Remove {name}? Account, conversations, notes and Prep items will be deleted.', memberRemoved: 'Person removed',
      roleChanged: 'Role changed', you: '(you)', roleSelect: 'Role'
    },
    fr: {
      loading: 'Chargement …', ok: 'OK', dismiss: 'Annuler', save: 'Enregistrer', del: 'Supprimer', edit: 'Modifier', close: 'Fermer',
      errFailed: 'Cela n’a pas fonctionné', loadFail: 'Impossible de charger les données. Réessaie plus tard.',
      navChat: 'Chat', navNotes: 'Notes', navPrep: 'Prép.', navProfile: 'Profil',
      setupTitle: 'Configuration requise', setupLead: 'L’application n’est pas encore connectée à Supabase.',
      setupStep1: 'Crée un projet Supabase et exécute supabase/schema.sql dans le SQL Editor.',
      setupStep2: 'Saisis la Project URL et la clé anon public dans config.js.',
      setupStep3: 'Recharge la page.',
      setupNote: 'Ne saisis jamais la clé service_role dans config.js.',
      loginSub: 'Connexion', loginLead: 'Connecte-toi avec ton numéro de mobile. Tant que tu n’as pas ton propre PIN, ce sont les 6 derniers chiffres de ton numéro qui comptent.',
      phone: 'Numéro de mobile', pinOptional: 'PIN (facultatif)', signIn: 'Se connecter',
      phoneInvalid: 'Saisis un numéro de mobile valide.', pinExact: 'Le PIN comporte exactement 6 chiffres.',
      authInvalid: 'Numéro de mobile ou PIN incorrect.', authRate: 'Trop de tentatives. Patiente un instant.', authFail: 'Connexion impossible. Réessaie.',
      chatTitle: 'Conversation', chatSub: 'Avec ton coach', chatPlaceholder: 'Écris un message …', chatSend: 'Envoyer',
      chatClear: 'Supprimer la conversation', confirmClearChat: 'Toute la conversation sera supprimée. Les points de Prép. sont conservés.',
      today: 'Aujourd’hui', yesterday: 'Hier', toNote: 'En note', toPrep: 'Vers Prép.',
      noteSavedMsg: 'Enregistré comme note', prepAddedMsg: 'Ajouté à Prép.', chatCleared: 'Conversation supprimée',
      botGreet: 'Bonjour {name} ! Content de te voir. De quoi aimerais-tu parler aujourd’hui ?',
      chip_goal: 'Clarifier un objectif', chip_decision: 'Prendre une décision', chip_blocked: 'Je suis bloqué(e)', chip_meeting: 'Préparer une réunion',
      topicIntro_goal: 'Bien, affinons ton objectif.',
      topicIntro_decision: 'Compris, regardons cette décision ensemble.',
      topicIntro_blocked: 'Merci d’en parler. Avançons étape par étape.',
      topicIntro_meeting: 'Avec plaisir, préparons ta réunion.',
      topicIntro_other: 'Merci de partager cela. Je t’écoute.',
      botQ1: 'Qu’est-ce qui te préoccupe exactement, et à quoi ressemblerait un bon résultat pour toi ?',
      botQ2: 'Qu’est-ce qui t’a freiné jusqu’ici, ou qu’est-ce qui rend cela difficile ?',
      botQ3: 'Quelle est la plus petite prochaine étape que tu pourrais faire cette semaine ?',
      botOffer: 'Merci, cela donne une image claire. Veux-tu que je retienne quelque chose ?',
      chip_saveNote: 'Enregistrer comme note', chip_addPrep: 'Prochaine étape dans Prép.', chip_newTopic: 'Nouveau sujet',
      botNoteSaved: 'C’est fait, tu trouveras la note sous « Notes ».', botPrepAdded: 'C’est fait, le point figure maintenant dans « Prép. ».',
      botNewTopic: 'Volontiers. Que souhaites-tu aborder ensuite ?', botNothing: 'Je n’ai encore rien à retenir. Raconte-moi d’abord quelque chose.',
      notesTitle: 'Pensées et notes', notesSub: 'Avec horodatage, le titre naît du contenu', notePlaceholder: 'À quoi penses-tu ?', noteSave: 'Enregistrer la note',
      notesEmpty: 'Pas encore de notes. Note ta première pensée.', noteUntitled: 'Note', titleLabel: 'Titre (vide = automatique)', bodyLabel: 'Texte',
      noteSaved: 'Note enregistrée', noteUpdated: 'Note mise à jour', noteDeleted: 'Note supprimée', confirmDelNote: 'Supprimer cette note ?',
      prepTitle: 'Préparation de réunion', prepSub: 'Ton ordre du jour et ta checklist', prepAddPh: 'Ajouter un point …', prepPick: 'Depuis Chat / Notes',
      prepClearDone: 'Retirer les points terminés', prepEmpty: 'Pas encore de points. Ajoutes-en un ou reprends quelque chose du chat et des notes.',
      prepProgress: '{done} sur {n} terminés', prepEditOn: 'Modifier', prepEditOff: 'Terminé',
      pickTitle: 'Reprendre depuis Chat / Notes', pickNotes: 'Notes', pickChat: 'Chat', pickEmpty: 'Rien ici pour l’instant.', pickAdd: 'Ajouter', pickAdded: 'Déjà ajouté',
      srcNote: 'Note', srcChat: 'Chat', srcGone: 'Source supprimée', moveUp: 'Monter', moveDown: 'Descendre', confirmClearDone: 'Retirer tous les points terminés ?',
      coachLabel: 'Coach', youLabel: 'Toi',
      profileTitle: 'Mon profil', roleLabel: 'Rôle', roleAdmin: 'Admin', roleMentor: 'Mentor', roleAssistant: 'Assistant(e)', roleTalent: 'Talent', nameLabel: 'Nom complet',
      nameChange: 'Données personnelles', nameSave: 'Enregistrer les données', nameSaved: 'Données enregistrées',
      phoneChange: 'Changer le numéro de mobile', phoneNew: 'Nouveau numéro de mobile', phoneSave: 'Enregistrer le numéro', phoneSaved: 'Numéro enregistré',
      phoneTaken: 'Ce numéro appartient déjà à quelqu’un d’autre.', phoneChangeNote: 'Tu te connecteras ensuite avec le nouveau numéro. Ton PIN reste le même.',
      confirmPhone: 'Changer le numéro de mobile en {phone} ?',
      language: 'Langue', languageHint: 'Valable pour toute l’application.', langSaved: 'Langue enregistrée',
      themeTitle: 'Affichage', themeHint: 'Clair, sombre ou automatique selon l’appareil.', themeLight: 'Clair', themeDark: 'Sombre', themeAuto: 'Auto',
      pinChange: 'Changer le PIN', pinIntro: 'Choisis ton propre PIN à 6 chiffres. Il protège tes notes et tes conversations.', pinNew: 'Nouveau PIN', pinSave: 'Enregistrer le PIN',
      pinChanged: 'PIN modifié', pinChangeFail: 'Le PIN n’a pas pu être modifié.', pinDefault: 'Rétablir le PIN standard',
      pinResetOk: 'PIN standard défini', pinResetFail: 'Le PIN n’a pas pu être réinitialisé.',
      pinBannerMsg: 'Définis ton PIN personnel pour que toi seul aies accès.', pinBannerBtn: 'Définir le PIN',
      installTitle: 'Installer l’application', installHint: 'Ajoute l’application à ton écran d’accueil, elle s’ouvrira alors en plein écran.',
      installBtn: 'Ajouter à l’écran d’accueil', installIos: 'Dans Safari, touche « Partager », puis « Sur l’écran d’accueil ».', logout: 'Se déconnecter',
      peopleTitle: 'Personnes', peopleHint: 'Visible uniquement pour les admins. Ici, tu crées des personnes et attribues des rôles.', personAdd: 'Ajouter une personne',
      firstName: 'Prénom', lastName: 'Nom de famille', email: 'E-mail', emailInvalid: 'Veuillez saisir une adresse e-mail valide.', gender: 'Genre', genderM: 'homme', genderW: 'femme', genderX: 'autre', genderInvalid: 'Veuillez choisir un genre.', photoTitle: 'Photo de profil', photoPick: 'Choisir une photo', photoChange: 'Changer la photo', photoRemove: 'Supprimer la photo', photoSaved: 'Photo enregistrée', photoRemoved: 'Photo supprimée', photoFail: 'L’image n’a pas pu être utilisée.', traits: 'Caractéristiques', traitsHint: 'Mots-clés ou phrases, p. ex. points forts, centres d’intérêt, particularités. Les admins peuvent aussi les voir et les modifier.', traitsPh: 'Écris librement …', traitsSave: 'Enregistrer les caractéristiques', traitsSaved: 'Caractéristiques enregistrées', navAdmin: 'Admin', adminTitle: 'Gérer les participants', adminSearch: 'Rechercher nom, e-mail, numéro …', allRoles: 'Tous les rôles', peopleCount: '{n} personnes', noMatch: 'Aucun résultat.', editPerson: 'Modifier', personSaved: 'Personne enregistrée', country: 'Pays / indicatif', assistantTitle: 'Mon assistant(e)', assistantHint: 'Choisis l’assistant(e) qui t’accompagne.', assistantNone: 'Aucun(e) assistant(e)', assistantSaved: 'Assistant(e) enregistré(e)', assistantEmpty: 'Aucun(e) assistant(e) disponible pour le moment.', assistantOf: 'Assistant(e) : {name}', addressTitle: 'Forme d’adresse', addressHint: 'Comment devons-nous nous adresser à toi ?', addressInformal: 'Tutoiement (tu)', addressFormal: 'Vouvoiement (vous)', addressSaved: 'Forme d’adresse enregistrée', assistantHintF: 'Choisissez l’assistant(e) qui vous accompagne.', addressHintF: 'Comment devons-nous nous adresser à vous ?', loginLeadF: 'Connectez-vous avec votre numéro de mobile. Tant que vous n’avez pas votre propre PIN, ce sont les 6 derniers chiffres de votre numéro qui comptent.', phoneInvalidF: 'Saisissez un numéro de mobile valide.', chatSubF: 'Avec votre coach', chatPlaceholderF: 'Écrivez un message …', botGreetF: 'Bonjour {name} ! Content de vous voir. De quoi aimeriez-vous parler aujourd’hui ?', topicIntro_goalF: 'Bien, affinons votre objectif.', topicIntro_meetingF: 'Avec plaisir, préparons votre réunion.', topicIntro_otherF: 'Merci de partager cela. Je vous écoute.', botQ1F: 'Qu’est-ce qui vous préoccupe exactement, et à quoi ressemblerait un bon résultat pour vous ?', botQ2F: 'Qu’est-ce qui a freiné votre progression jusqu’ici, ou qu’est-ce qui rend cela difficile ?', botQ3F: 'Quelle est la plus petite prochaine étape que vous pourriez faire cette semaine ?', botOfferF: 'Merci, cela donne une image claire. Souhaitez-vous que je retienne quelque chose ?', botNoteSavedF: 'C’est fait, vous trouverez la note sous « Notes ».', botNewTopicF: 'Volontiers. Que souhaitez-vous aborder ensuite ?', botNothingF: 'Je n’ai encore rien à retenir. Racontez-moi d’abord quelque chose.', notePlaceholderF: 'À quoi pensez-vous ?', notesEmptyF: 'Pas encore de notes. Notez votre première pensée.', prepSubF: 'Votre ordre du jour et votre checklist', youLabelF: 'Vous', youF: '(vous)', phoneChangeNoteF: 'Vous vous connecterez ensuite avec le nouveau numéro. Votre PIN reste le même.', pinIntroF: 'Choisissez votre propre PIN à 6 chiffres. Il protège vos notes et vos conversations.', pinBannerMsgF: 'Définissez votre PIN personnel pour que vous seul(e) y ayez accès.', installHintF: 'Ajoutez l’application à votre écran d’accueil, elle s’ouvrira alors en plein écran.', installIosF: 'Dans Safari, touchez « Partager », puis « Sur l’écran d’accueil ».', peopleHintF: 'Visible uniquement pour les admins. Ici, vous créez des personnes et attribuez des rôles.', traitsPhF: 'Écrivez librement …', memberAddNote: 'La personne se connecte avec son numéro de mobile. Le PIN correspond aux 6 derniers chiffres.',
      memberAdded: '{name} ajouté(e)', addFailed: 'Ajout impossible : {reason}', alreadyReg: 'Ce numéro est déjà enregistré.', unknownError: 'erreur inconnue',
      resetPin: 'Réinitialiser le PIN', confirmResetPin: 'Réinitialiser le PIN de {name} aux 6 derniers chiffres du numéro de mobile ?', pinReset: 'PIN réinitialisé',
      removeP: 'Retirer', confirmRemove: 'Retirer {name} ? Le compte, les conversations, les notes et les points de Prép. seront supprimés.', memberRemoved: 'Personne retirée',
      roleChanged: 'Rôle modifié', you: '(toi)', roleSelect: 'Rôle'
    },
    it: {
      loading: 'Caricamento …', ok: 'OK', dismiss: 'Annulla', save: 'Salva', del: 'Elimina', edit: 'Modifica', close: 'Chiudi',
      errFailed: 'Non ha funzionato', loadFail: 'Impossibile caricare i dati. Riprova più tardi.',
      navChat: 'Chat', navNotes: 'Note', navPrep: 'Prep', navProfile: 'Profilo',
      setupTitle: 'Configurazione necessaria', setupLead: 'L’app non è ancora collegata a Supabase.',
      setupStep1: 'Crea un progetto Supabase ed esegui supabase/schema.sql nell’SQL Editor.',
      setupStep2: 'Inserisci Project URL e chiave anon public in config.js.',
      setupStep3: 'Ricarica la pagina.',
      setupNote: 'Non inserire mai la chiave service_role in config.js.',
      loginSub: 'Accedi', loginLead: 'Accedi con il tuo numero di cellulare. Finché non imposti un PIN personale valgono le ultime 6 cifre del tuo numero.',
      phone: 'Numero di cellulare', pinOptional: 'PIN (facoltativo)', signIn: 'Accedi',
      phoneInvalid: 'Inserisci un numero di cellulare valido.', pinExact: 'Il PIN è composto da esattamente 6 cifre.',
      authInvalid: 'Numero di cellulare o PIN errato.', authRate: 'Troppi tentativi. Attendi un momento.', authFail: 'Accesso non riuscito. Riprova.',
      chatTitle: 'Conversazione', chatSub: 'Con il tuo coach', chatPlaceholder: 'Scrivi un messaggio …', chatSend: 'Invia',
      chatClear: 'Elimina conversazione', confirmClearChat: 'Tutta la conversazione verrà eliminata. I punti in Prep restano.',
      today: 'Oggi', yesterday: 'Ieri', toNote: 'Come nota', toPrep: 'In Prep',
      noteSavedMsg: 'Salvato come nota', prepAddedMsg: 'Aggiunto a Prep', chatCleared: 'Conversazione eliminata',
      botGreet: 'Ciao {name}! Che bello vederti. Di cosa vorresti parlare oggi?',
      chip_goal: 'Chiarire un obiettivo', chip_decision: 'Prendere una decisione', chip_blocked: 'Mi sento bloccato/a', chip_meeting: 'Preparare un incontro',
      topicIntro_goal: 'Bene, mettiamo a fuoco il tuo obiettivo.',
      topicIntro_decision: 'Capito, guardiamo la decisione insieme.',
      topicIntro_blocked: 'Grazie per averne parlato. Procediamo passo dopo passo.',
      topicIntro_meeting: 'Volentieri, prepariamo il tuo incontro.',
      topicIntro_other: 'Grazie per averlo condiviso. Ti ascolto.',
      botQ1: 'Cosa ti sta a cuore esattamente e quale sarebbe per te un buon risultato?',
      botQ2: 'Cosa ti ha frenato finora, o cosa lo rende difficile?',
      botQ3: 'Qual è il più piccolo passo successivo che potresti fare questa settimana?',
      botOffer: 'Grazie, ora il quadro è chiaro. Vuoi che conservi qualcosa?',
      chip_saveNote: 'Salva come nota', chip_addPrep: 'Prossimo passo in Prep', chip_newTopic: 'Nuovo tema',
      botNoteSaved: 'Fatto, trovi la nota sotto «Note».', botPrepAdded: 'Fatto, il punto ora è in «Prep».',
      botNewTopic: 'Volentieri. Cosa vorresti guardare ora?', botNothing: 'Non ho ancora nulla da conservare. Raccontami prima qualcosa.',
      notesTitle: 'Pensieri e note', notesSub: 'Con data e ora, il titolo nasce dal contenuto', notePlaceholder: 'Cosa ti passa per la mente?', noteSave: 'Salva nota',
      notesEmpty: 'Ancora nessuna nota. Scrivi il tuo primo pensiero.', noteUntitled: 'Nota', titleLabel: 'Titolo (vuoto = automatico)', bodyLabel: 'Testo',
      noteSaved: 'Nota salvata', noteUpdated: 'Nota aggiornata', noteDeleted: 'Nota eliminata', confirmDelNote: 'Eliminare questa nota?',
      prepTitle: 'Preparazione incontro', prepSub: 'La tua agenda e checklist', prepAddPh: 'Aggiungi un punto …', prepPick: 'Da Chat / Note',
      prepClearDone: 'Rimuovi completati', prepEmpty: 'Ancora nessun punto. Aggiungine uno o prendi qualcosa da chat e note.',
      prepProgress: '{done} di {n} completati', prepEditOn: 'Modifica', prepEditOff: 'Fatto',
      pickTitle: 'Prendi da Chat / Note', pickNotes: 'Note', pickChat: 'Chat', pickEmpty: 'Per ora non c’è nulla.', pickAdd: 'Aggiungi', pickAdded: 'Già presente',
      srcNote: 'Nota', srcChat: 'Chat', srcGone: 'Fonte eliminata', moveUp: 'Su', moveDown: 'Giù', confirmClearDone: 'Rimuovere tutti i punti completati?',
      coachLabel: 'Coach', youLabel: 'Tu',
      profileTitle: 'Il mio profilo', roleLabel: 'Ruolo', roleAdmin: 'Admin', roleMentor: 'Mentor', roleAssistant: 'Assistente', roleTalent: 'Talent', nameLabel: 'Nome e cognome',
      nameChange: 'Dati personali', nameSave: 'Salva i dati', nameSaved: 'Dati salvati',
      phoneChange: 'Cambia numero di cellulare', phoneNew: 'Nuovo numero di cellulare', phoneSave: 'Salva numero', phoneSaved: 'Numero salvato',
      phoneTaken: 'Questo numero appartiene già a un’altra persona.', phoneChangeNote: 'Poi accederai con il nuovo numero. Il tuo PIN resta uguale.',
      confirmPhone: 'Cambiare il numero di cellulare in {phone}?',
      language: 'Lingua', languageHint: 'Vale per tutta l’app.', langSaved: 'Lingua salvata',
      themeTitle: 'Aspetto', themeHint: 'Chiaro, scuro o automatico in base al dispositivo.', themeLight: 'Chiaro', themeDark: 'Scuro', themeAuto: 'Auto',
      pinChange: 'Cambia PIN', pinIntro: 'Scegli un PIN personale di 6 cifre. Protegge le tue note e conversazioni.', pinNew: 'Nuovo PIN', pinSave: 'Salva PIN',
      pinChanged: 'PIN modificato', pinChangeFail: 'Impossibile modificare il PIN.', pinDefault: 'Ripristina PIN standard',
      pinResetOk: 'PIN standard impostato', pinResetFail: 'Impossibile reimpostare il PIN.',
      pinBannerMsg: 'Imposta il tuo PIN personale, così solo tu hai accesso.', pinBannerBtn: 'Imposta PIN',
      installTitle: 'Installa l’app', installHint: 'Aggiungi l’app alla schermata Home: si aprirà a schermo intero.',
      installBtn: 'Aggiungi alla schermata Home', installIos: 'In Safari tocca «Condividi» e poi «Aggiungi a Home».', logout: 'Esci',
      peopleTitle: 'Persone', peopleHint: 'Visibile solo agli admin. Qui crei persone e assegni ruoli.', personAdd: 'Aggiungi persona',
      firstName: 'Nome', lastName: 'Cognome', email: 'E-mail', emailInvalid: 'Inserisci un indirizzo e-mail valido.', gender: 'Genere', genderM: 'maschile', genderW: 'femminile', genderX: 'altro', genderInvalid: 'Seleziona un genere.', photoTitle: 'Foto profilo', photoPick: 'Scegli foto', photoChange: 'Cambia foto', photoRemove: 'Rimuovi foto', photoSaved: 'Foto salvata', photoRemoved: 'Foto rimossa', photoFail: 'Impossibile usare l’immagine.', traits: 'Caratteristiche', traitsHint: 'Parole chiave o frasi, ad es. punti di forza, interessi, particolarità. Anche gli admin possono vederle e modificarle.', traitsPh: 'Scrivi liberamente …', traitsSave: 'Salva le caratteristiche', traitsSaved: 'Caratteristiche salvate', navAdmin: 'Admin', adminTitle: 'Gestisci i partecipanti', adminSearch: 'Cerca nome, e-mail, numero …', allRoles: 'Tutti i ruoli', peopleCount: '{n} persone', noMatch: 'Nessun risultato.', editPerson: 'Modifica', personSaved: 'Persona salvata', country: 'Paese / prefisso', assistantTitle: 'Il mio assistente', assistantHint: 'Scegli l’assistente che ti accompagna.', assistantNone: 'Nessun assistente', assistantSaved: 'Assistente salvato', assistantEmpty: 'Nessun assistente disponibile al momento.', assistantOf: 'Assistente: {name}', addressTitle: 'Forma di cortesia', addressHint: 'Come dobbiamo rivolgerci a te?', addressInformal: 'Tu', addressFormal: 'Lei', addressSaved: 'Forma di cortesia salvata', assistantHintF: 'Scelga l’assistente che la accompagna.', addressHintF: 'Come dobbiamo rivolgerci a Lei?', loginLeadF: 'Acceda con il Suo numero di cellulare. Finché non imposta un PIN personale valgono le ultime 6 cifre del Suo numero.', phoneInvalidF: 'Inserisca un numero di cellulare valido.', chatSubF: 'Con il Suo coach', chatPlaceholderF: 'Scriva un messaggio …', botGreetF: 'Buongiorno {name}! Piacere di averLa qui. Di cosa vorrebbe parlare oggi?', topicIntro_goalF: 'Bene, mettiamo a fuoco il Suo obiettivo.', topicIntro_meetingF: 'Volentieri, prepariamo il Suo incontro.', topicIntro_otherF: 'Grazie per averlo condiviso. La ascolto.', botQ1F: 'Cosa Le sta a cuore esattamente e quale sarebbe per Lei un buon risultato?', botQ2F: 'Che cosa ha ostacolato finora il Suo percorso, o cosa lo rende difficile?', botQ3F: 'Qual è il più piccolo passo successivo che potrebbe fare questa settimana?', botOfferF: 'Grazie, ora il quadro è chiaro. Vuole che conservi qualcosa?', botNoteSavedF: 'Fatto, trova la nota sotto «Note».', botNewTopicF: 'Volentieri. Cosa vorrebbe guardare ora?', botNothingF: 'Non ho ancora nulla da conservare. Mi racconti prima qualcosa.', notePlaceholderF: 'Cosa Le passa per la mente?', notesEmptyF: 'Ancora nessuna nota. Scriva il Suo primo pensiero.', prepSubF: 'La Sua agenda e checklist', youLabelF: 'Lei', youF: '(Lei)', phoneChangeNoteF: 'Poi accederà con il nuovo numero. Il Suo PIN resta uguale.', pinIntroF: 'Scelga un PIN personale di 6 cifre. Protegge le Sue note e conversazioni.', pinBannerMsgF: 'Imposti il Suo PIN personale, così solo Lei ha accesso.', installHintF: 'Aggiunga l’app alla schermata Home: si aprirà a schermo intero.', installIosF: 'In Safari tocchi «Condividi» e poi «Aggiungi a Home».', peopleHintF: 'Visibile solo agli admin. Qui crea persone e assegna ruoli.', traitsPhF: 'Scriva liberamente …', emailInvalidF: 'Inserisca un indirizzo e-mail valido.', prepAddPhF: 'Aggiunga un punto …', memberAddNote: 'La persona accede con il numero di cellulare. Il PIN sono le ultime 6 cifre.',
      memberAdded: '{name} aggiunto/a', addFailed: 'Impossibile aggiungere: {reason}', alreadyReg: 'Questo numero è già registrato.', unknownError: 'errore sconosciuto',
      resetPin: 'Reimposta PIN', confirmResetPin: 'Reimpostare il PIN di {name} sulle ultime 6 cifre del numero di cellulare?', pinReset: 'PIN reimpostato',
      removeP: 'Rimuovi', confirmRemove: 'Rimuovere {name}? Account, conversazioni, note e punti Prep verranno eliminati.', memberRemoved: 'Persona rimossa',
      roleChanged: 'Ruolo modificato', you: '(tu)', roleSelect: 'Ruolo'
    }
  };

  var lang = detectLang();
  function detectLang() {
    try { var s = localStorage.getItem('coaching-lang'); if (s && LANGS.indexOf(s) > -1) return s; } catch (e) { /* ignorieren */ }
    var n = String(navigator.language || 'de').toLowerCase().slice(0, 2);
    return LANGS.indexOf(n) > -1 ? n : 'de';
  }
  var formal = false;
  try { formal = localStorage.getItem('coaching-form') === 'formal'; } catch (e) { /* ignorieren */ }
  function setFormal(f) {
    formal = !!f;
    try { localStorage.setItem('coaching-form', formal ? 'formal' : 'informal'); } catch (e) { /* ignorieren */ }
  }
  function L(key, p) {
    var d = DICT[lang] || {};
    var s = (formal && lang !== 'en' && d[key + 'F']) || d[key] || DICT.de[key] || key;
    if (p) s = s.replace(/\{(\w+)\}/g, function (m, k) { return p[k] != null ? p[k] : m; });
    return s;
  }
  function setLang(l) {
    if (LANGS.indexOf(l) === -1) return;
    lang = l;
    try { localStorage.setItem('coaching-lang', l); } catch (e) { /* ignorieren */ }
    document.documentElement.lang = LANG_HTML[l];
  }

  /* ---------- Darstellung: Hell / Dunkel / Automatisch ---------- */
  // '' bedeutet automatisch (folgt der Geräteeinstellung); so früh wie möglich angewendet,
  // damit die Seite nicht kurz im falschen Modus aufblitzt.
  function detectTheme() {
    try { var t = localStorage.getItem('coaching-theme'); if (t === 'light' || t === 'dark') return t; } catch (e) { /* ignorieren */ }
    return '';
  }
  function applyTheme(t) {
    if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
    else document.documentElement.removeAttribute('data-theme');
  }
  var theme = detectTheme();
  applyTheme(theme);
  function setTheme(t) {
    theme = (t === 'light' || t === 'dark') ? t : '';
    try { if (theme) localStorage.setItem('coaching-theme', theme); else localStorage.removeItem('coaching-theme'); } catch (e) { /* ignorieren */ }
    applyTheme(theme);
  }
  function saveTheme() {
    if (!sb || !S.me) return;
    try { sb.from('profiles').update({ theme: theme || null }).eq('id', S.me.id).then(function () {}, function () {}); } catch (e) { /* ignorieren */ }
  }
  function saveLang() {
    if (!sb || !S.me) return;
    try { sb.from('profiles').update({ language: lang }).eq('id', S.me.id).then(function () {}, function () {}); } catch (e) { /* ignorieren */ }
  }

  /* ---------- Icons ---------- */
  function ic(path, size) {
    return '<svg viewBox="0 0 24 24" width="' + (size || 24) + '" height="' + (size || 24) + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + path + '</svg>';
  }
  var ICON = {
    chat: ic('<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>'),
    note: ic('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/>'),
    prep: ic('<path d="M9 6h11M9 12h11M9 18h11"/><path d="M3.5 6l1.5 1.5L7.5 5M3.5 12l1.5 1.5 2.5-2.5M3.5 18l1.5 1.5 2.5-2.5"/>'),
    user: ic('<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>'),
    plus: ic('<path d="M12 5v14M5 12h14"/>'),
    send: ic('<path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4z"/>'),
    trash: ic('<path d="M4 7h16M10 11v6M14 11v6"/><path d="M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
    up: ic('<path d="M6 15l6-6 6 6"/>'),
    down: ic('<path d="M6 9l6 6 6-6"/>'),
    edit: ic('<path d="M4 20h4L19 9l-4-4L4 16z"/>'),
    sun: ic('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
    moon: ic('<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>'),
    auto: ic('<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor"/>'),
    x: ic('<path d="M6 6l12 12M18 6L6 18"/>'),
    shield: ic('<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>'),
    logout: ic('<path d="M9 4H5v16h4M16 8l4 4-4 4M20 12H9"/>')
  };

  /* ---------- Datum & Zeit ---------- */
  function locale() { return LANG_LOCALE[lang] || 'de-CH'; }
  function fmtDT(iso) { return new Date(iso).toLocaleString(locale(), { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  function fmtTime(iso) { return new Date(iso).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' }); }
  function dayKey(d) { d = d instanceof Date ? d : new Date(d); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function dayLabel(iso) {
    var k = dayKey(iso);
    if (k === dayKey(new Date())) return L('today');
    if (k === dayKey(new Date(Date.now() - 864e5))) return L('yesterday');
    return new Date(iso).toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long' });
  }
  function monthLabel(iso) { return new Date(iso).toLocaleDateString(locale(), { month: 'long', year: 'numeric' }); }
  function monthKey(iso) { var d = new Date(iso); return d.getFullYear() + '-' + pad(d.getMonth() + 1); }

  /* ---------- Telefonnummer & Login ---------- */
  // Akzeptiert 079 123 45 67, +41 79 123 45 67, 0041 79 …; Leerschläge werden ignoriert.
  // Intern gespeichert wird immer das internationale Format (+41791234567).
  function genderLabel(g) { return L(g === 'm' ? 'genderM' : g === 'w' ? 'genderW' : 'genderX'); }
  function genderSelect(name, cur, withEmpty) {
    return '<select class="input" name="' + name + '"' + (withEmpty ? ' required' : '') + '>' + (withEmpty ? '<option value="">–</option>' : '') +
      ['m', 'w', 'x'].map(function (g) { return '<option value="' + g + '"' + (cur === g ? ' selected' : '') + '>' + esc(genderLabel(g)) + '</option>'; }).join('') + '</select>';
  }
  function avatarHtml(p, big) {
    var cls = 'avatar' + (big ? ' big' : '');
    if (p.avatar) return '<img class="' + cls + '" src="' + esc(p.avatar) + '" alt="">';
    var ini = ((p.first || '').charAt(0) + (p.last || '').charAt(0)).toUpperCase();
    return '<span class="' + cls + '" aria-hidden="true">' + esc(ini || '?') + '</span>';
  }
  // Bild quadratisch zuschneiden und auf 256 px verkleinern (JPEG), damit es klein bleibt
  function resizeImage(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        try {
          var side = Math.min(img.naturalWidth, img.naturalHeight), size = 256;
          var c = document.createElement('canvas'); c.width = size; c.height = size;
          var ctx = c.getContext('2d');
          ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, size, size);
          ctx.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, size, size);
          var out = c.toDataURL('image/jpeg', 0.82);
          URL.revokeObjectURL(url);
          if (out.indexOf('data:image/jpeg;base64,') !== 0 || out.length > 120000) reject(new Error('image')); else resolve(out);
        } catch (e) { reject(e); }
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('image')); };
      img.src = url;
    });
  }
  function isEmail(v) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(v || '').trim()) && String(v).length <= 120; }
  function normPhone(raw) {
    var d = String(raw).replace(/\(0\)/g, '').replace(/[^\d+]/g, '');
    if (d.indexOf('00') === 0) d = '+' + d.slice(2);
    else if (d.indexOf('0') === 0) d = '+41' + d.slice(1);
    else if (d.indexOf('+') !== 0) d = '+' + d;
    return /^\+\d{9,15}$/.test(d) ? d : null;
  }
  // Anzeige: Schweizer Nummern immer als 079 123 45 67
  function fmtPhone(p) {
    if (/^\+41\d{9}$/.test(p)) return '0' + p.slice(3, 5) + ' ' + p.slice(5, 8) + ' ' + p.slice(8, 10) + ' ' + p.slice(10);
    return p;
  }
  // Formatierung während der Eingabe im Feld
  function formatPhoneTyping(raw) {
    var v = String(raw).replace(/\(0\)/g, '').replace(/[^\d+]/g, '');
    if (v.indexOf('+41') === 0) v = '0' + v.slice(3);
    else if (v.indexOf('0041') === 0) v = '0' + v.slice(4);
    if (v.charAt(0) === '0' && v.charAt(1) !== '0') {
      var d = v.replace(/\D/g, '').slice(0, 10);
      return [d.slice(0, 3), d.slice(3, 6), d.slice(6, 8), d.slice(8, 10)].filter(Boolean).join(' ');
    }
    return v;
  }
  // Länder mit Vorwahl für das Telefonfeld (Auswahl links, Rest der Nummer rechts)
  var COUNTRIES = [['CH', 41], ['DE', 49], ['AT', 43], ['LI', 423], ['FR', 33], ['IT', 39], ['ES', 34], ['PT', 351], ['NL', 31], ['BE', 32], ['LU', 352], ['GB', 44], ['IE', 353],
    ['DK', 45], ['SE', 46], ['NO', 47], ['FI', 358], ['PL', 48], ['CZ', 420], ['SK', 421], ['HU', 36], ['SI', 386], ['HR', 385], ['RS', 381], ['RO', 40], ['BG', 359], ['GR', 30],
    ['TR', 90], ['UA', 380], ['RU', 7], ['US', 1], ['CA', 1], ['MX', 52], ['BR', 55], ['AR', 54], ['AU', 61], ['NZ', 64], ['IN', 91], ['CN', 86], ['JP', 81], ['KR', 82],
    ['AE', 971], ['IL', 972], ['ZA', 27], ['EG', 20]];
  function dialOf(iso) { for (var i = 0; i < COUNTRIES.length; i++) if (COUNTRIES[i][0] === iso) return COUNTRIES[i][1]; return 0; }
  function countryName(iso) { try { return new Intl.DisplayNames([lang], { type: 'region' }).of(iso) || iso; } catch (e) { return iso; } }
  function defaultCountry() {
    try { var c = localStorage.getItem('coaching-cc'); if (c && dialOf(c)) return c; } catch (e) { /* ignorieren */ }
    return 'CH';
  }
  function phoneField(keep, required) {
    var cur = S.drafts['cc-' + keep] || defaultCountry();
    return '<div class="phonerow"><select class="input" name="cc" data-cc="1" data-keep="cc-' + keep + '" aria-label="' + esc(L('country')) + '">' +
      COUNTRIES.map(function (c) { return '<option value="' + c[0] + '"' + (c[0] === cur ? ' selected' : '') + '>' + c[0] + ' +' + c[1] + ' · ' + esc(countryName(c[0])) + '</option>'; }).join('') +
      '</select><input class="input" name="phone" type="tel" inputmode="tel" autocomplete="tel-national" placeholder="79 123 45 67" data-keep="' + keep + '"' + (required ? ' required' : '') + '></div>';
  }
  // Vorwahl (links) + restliche Nummer (rechts) zu +<Vorwahl><Nummer> zusammensetzen
  function combinedPhone(f) {
    var nat = String(f.get('phone') || '').trim();
    if (/^(\+|00)/.test(nat)) return nat;
    var digits = nat.replace(/\(0\)/g, '').replace(/\D/g, '').replace(/^0+/, '');
    return digits ? '+' + dialOf(f.get('cc') || 'CH') + digits : '';
  }
  function defaultPin(p) { return String(p).replace(/\D/g, '').slice(-6); }
  function phoneToEmail(p) { return p.replace('+', '') + '@' + (cfg.EMAIL_DOMAIN || 'phone-login.app'); }

  /* ---------- Automatischer Titel für Notizen ---------- */
  // Der Titel entsteht aus dem Inhalt: erster Satz, ohne Füllwörter am Anfang, höchstens 7 Wörter.
  var FILLER = /^(?:(?:ich|i)\s+(?:muss|möchte|moechte|will|sollte|habe|hab|denke|glaube|finde|frage mich|need to|want to|would like to|should|have to|think|feel|wonder)\s+|je\s+(?:dois|veux|voudrais|pense)\s+|io\s+(?:devo|voglio|vorrei|penso)\s+|(?:notiz|gedanke|idee|note|idea|pensée|pensiero)\s*:\s*)+/i;
  function makeTitle(text) {
    var line = String(text || '').split(/\n/).map(function (x) { return x.trim(); }).filter(Boolean)[0] || '';
    line = line.replace(/\s+/g, ' ');
    var stripped = line.replace(FILLER, '');
    var base = stripped.length >= 3 ? stripped : line;
    var s = (base.split(/[.!?;:](?:\s|$)/)[0] || base).replace(/^[\s\-–•*#>"'„«]+/, '').replace(/[\s"'“”»]+$/, '');
    if (!s) return L('noteUntitled');
    var out = s.split(' ').slice(0, 7).join(' ');
    if (out.length > 50) out = out.slice(0, 50).replace(/\s+\S*$/, '');
    var cut = out.length < s.length;
    out = out.replace(/[,\-–]+$/, '');
    out = out.charAt(0).toUpperCase() + out.slice(1);
    return cut ? out + '…' : out;
  }
  function shorten(s, n) {
    s = String(s || '').replace(/\s+/g, ' ').trim();
    return s.length > n ? s.slice(0, n).replace(/\s+\S*$/, '') + '…' : s;
  }

  /* ---------- Zustand ---------- */
  function freshState() {
    return {
      step: 'loading', tab: 'chat', phone: '', err: '', busy: false, typing: false, stick: false,
      session: null, me: null, people: [], chat: [], notes: [], prep: [],
      drafts: {}, sel: null, openNotes: {}, editNote: null, prepEdit: false, pick: null, flash: null, addPerson: false, assistants: [], editPerson: null, q: '', roleFilter: '', greeting: false
    };
  }
  var S = freshState();
  var installPrompt = null;

  /* ---------- Daten laden ---------- */
  function mapProfile(r) {
    return { id: r.id, first: r.first_name, gender: ['m', 'w', 'x'].indexOf(r.gender) > -1 ? r.gender : 'x', avatar: r.avatar || '', addressForm: r.address_form === 'formal' ? 'formal' : 'informal', assistantId: r.assistant_id || null, traits: r.traits || '', last: r.last_name, name: r.name || ((r.first_name || '') + ' ' + (r.last_name || '')).trim(), email: r.email || '', phone: r.phone, role: ROLES.indexOf(r.role) > -1 ? r.role : 'talent', language: r.language || null, theme: r.theme || null, pinChanged: r.pin_changed === true };
  }
  async function loadAll() {
    var uid = S.session.user.id;
    var res = await Promise.all([
      sb.from('profiles').select('*'),
      sb.from('chat_messages').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(400),
      sb.from('notes').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
      sb.from('prep_items').select('*').eq('user_id', uid).order('sort', { ascending: true }).order('created_at', { ascending: true })
    ]);
    var bad = res.filter(function (r) { return r.error; })[0];
    if (bad) throw bad.error;
    S.people = (res[0].data || []).map(mapProfile).sort(function (a, b) { return a.name.localeCompare(b.name, lang); });
    S.me = S.people.filter(function (p) { return p.id === uid; })[0] || null;
    if (S.me) setFormal(S.me.addressForm === 'formal');
    S.assistants = [];
    if (S.me && S.me.role === 'talent') {
      var ar = await sb.rpc('list_assistants');
      if (!ar.error) S.assistants = (ar.data || []).map(function (r) { return { id: r.id, first: r.first_name, last: r.last_name, name: r.first_name + ' ' + r.last_name, avatar: r.avatar || '', traits: r.traits || '' }; });
    }
    S.chat = (res[1].data || []).slice().reverse();
    S.notes = res[2].data || [];
    S.prep = res[3].data || [];
  }
  async function refresh() {
    try { await loadAll(); softRender(); } catch (e) { console.error(e); }
  }
  // Führt eine Schreibaktion aus, meldet das Ergebnis und lädt danach neu
  async function act(fn, okMsg) {
    try {
      var res = await fn();
      if (res && res.error) throw res.error;
      if (okMsg) toast(okMsg);
      return true;
    } catch (e) {
      console.error(e);
      toast(L('errFailed') + (e && e.message ? ': ' + String(e.message).slice(0, 100) : '') + '.');
      return false;
    } finally {
      await refresh();
    }
  }

  /* ---------- Chat: Bot-Ablauf ---------- */
  // Der Bot folgt einem kurzen Coaching-Ablauf: Begrüssung → Thema → 3 Fragen → Angebot
  // (als Notiz festhalten / nächsten Schritt in Prep). Die Antworten entstehen hier im Client;
  // später kann botReply() durch einen Aufruf an ein Sprachmodell ersetzt werden.
  var TOPIC_RX = {
    goal: /(ziel|goal|objectif|obiettiv|vision|erreichen|achieve)/i,
    decision: /(entscheid|decision|decide|décision|décid|decisione|decid|wahl\b|choose|choix|scelta)/i,
    blocked: /(block|stuck|feststeck|nicht weiter|bloqu|coinc|bloccat|überfordert|overwhelm|angst|fear|peur|paura)/i,
    meeting: /(meeting|termin|vorbereit|prepar|préparer|réunion|riunione|appuntamento|incontro)/i
  };
  function detectTopic(text) {
    for (var i = 0; i < TOPICS.length; i++) if (TOPIC_RX[TOPICS[i]].test(text)) return TOPICS[i];
    return 'other';
  }
  function lastBot() {
    for (var i = S.chat.length - 1; i >= 0; i--) if (S.chat[i].sender === 'bot') return S.chat[i];
    return null;
  }
  // Die Antworten des laufenden Gesprächsabschnitts (ab der Nachricht, die die erste Frage ausgelöst hat)
  function gatherSession() {
    var c = S.chat, qi = -1, i;
    for (i = c.length - 1; i >= 0; i--) if (c[i].sender === 'bot' && c[i].kind === 'q1') { qi = i; break; }
    if (qi < 0) return { answers: [], hasDone: false };
    var answers = [], hasDone = false, offerSeen = false;
    for (i = Math.max(0, qi - 1); i < c.length; i++) {
      var m = c[i];
      if (m.sender === 'user' && !m.kind && !offerSeen) answers.push(m);
      if (m.sender === 'bot' && m.kind === 'offer') offerSeen = true;
      if (m.sender === 'bot' && m.kind === 'done') hasDone = true;
    }
    return { answers: answers, hasDone: hasDone };
  }
  function planBot(text, chipKey) {
    if (chipKey === 'saveNote' || chipKey === 'addPrep') return { action: chipKey };
    if (chipKey === 'newTopic') return { kind: 'greet', text: L('botNewTopic'), chips: TOPICS.join(',') };
    var lb = lastBot(), kind = lb && lb.kind;
    if (!lb || kind === 'greet' || kind === 'offer' || kind === 'done') {
      var topic = TOPICS.indexOf(chipKey) > -1 ? chipKey : detectTopic(text);
      return { kind: 'q1', topic: topic, text: L('topicIntro_' + topic) + '\n\n' + L('botQ1') };
    }
    if (kind === 'q1') return { kind: 'q2', topic: lb.topic, text: L('botQ2') };
    if (kind === 'q2') return { kind: 'q3', topic: lb.topic, text: L('botQ3') };
    return { kind: 'offer', topic: lb.topic, text: L('botOffer'), chips: 'saveNote,addPrep,newTopic' };
  }
  function botDelay(text) {
    if (cfg.BOT_DELAY_MS != null) return Number(cfg.BOT_DELAY_MS);
    return 600 + Math.min(900, String(text).length * 8);
  }
  async function insertChat(row) {
    row.user_id = S.me.id;
    var r = await sb.from('chat_messages').insert(row).select().single();
    if (r.error) throw r.error;
    S.chat.push(r.data);
    return r.data;
  }
  async function botSay(m) {
    S.typing = true; S.stick = true; drawChat();
    await sleep(botDelay(m.text));
    try { await insertChat({ sender: 'bot', body: m.text, kind: m.kind, topic: m.topic || null, chips: m.chips || null }); }
    catch (e) { console.error(e); toast(L('errFailed')); }
    finally { S.typing = false; S.stick = true; drawChat(); }
  }
  async function botTurn(text, chipKey) {
    var plan = planBot(text, chipKey);
    if (plan.action === 'saveNote') return doSaveNote();
    if (plan.action === 'addPrep') return doAddPrep();
    return botSay(plan);
  }
  async function doSaveNote() {
    var ss = gatherSession();
    if (!ss.answers.length) return botSay({ kind: 'done', text: L('botNothing'), chips: 'newTopic' });
    try { await createNote(ss.answers.map(function (a) { return a.body; }).join('\n\n')); }
    catch (e) { console.error(e); toast(L('errFailed')); return; }
    return botSay({ kind: 'done', text: L('botNoteSaved'), chips: ss.hasDone ? 'newTopic' : 'addPrep,newTopic' });
  }
  async function doAddPrep() {
    var ss = gatherSession();
    var last = ss.answers[ss.answers.length - 1];
    if (!last) return botSay({ kind: 'done', text: L('botNothing'), chips: 'newTopic' });
    try { await addPrepItem(shorten(last.body, 200), 'chat', last.id); }
    catch (e) { console.error(e); toast(L('errFailed')); return; }
    return botSay({ kind: 'done', text: L('botPrepAdded'), chips: ss.hasDone ? 'newTopic' : 'saveNote,newTopic' });
  }
  async function sendChat(text, chipKey) {
    text = String(text || '').trim();
    if (!text || S.busy || S.typing || !S.me) return;
    S.busy = true;
    if (!chipKey) { delete S.drafts.chat; var box = document.querySelector('[data-keep="chat"]'); if (box) { box.value = ''; growField(box); } }
    try {
      await insertChat({ sender: 'user', body: text, kind: chipKey ? 'chip' : null });
      S.stick = true; S.busy = false; drawChat();
      await botTurn(text, chipKey);
    } catch (e) {
      console.error(e);
      S.busy = false;
      if (!chipKey) { S.drafts.chat = text; var b2 = document.querySelector('[data-keep="chat"]'); if (b2) b2.value = text; }
      toast(L('errFailed'));
      drawChat();
    }
  }
  async function greetIfEmpty() {
    if (S.greeting || S.chat.length || !S.me) return;
    S.greeting = true;
    try { await botSay({ kind: 'greet', text: L('botGreet', { name: S.me.first }), chips: TOPICS.join(',') }); }
    finally { S.greeting = false; }
  }

  /* ---------- Notes & Prep: Datenzugriff ---------- */
  async function createNote(body) {
    var r = await sb.from('notes').insert({ user_id: S.me.id, title: makeTitle(body), body: body }).select().single();
    if (r.error) throw r.error;
    S.notes.unshift(r.data);
    return r.data;
  }
  async function addPrepItem(text, srcType, srcId) {
    var max = S.prep.reduce(function (m, x) { return Math.max(m, x.sort || 0); }, 0);
    var row = { user_id: S.me.id, text: text, sort: S.prep.length ? max + 1 : 0 };
    if (srcType && srcId) { row.source_type = srcType; row.source_id = srcId; }
    var r = await sb.from('prep_items').insert(row).select().single();
    if (r.error) throw r.error;
    S.prep.push(r.data);
    return r.data;
  }
  function inPrep(type, id) { return S.prep.some(function (x) { return x.source_type === type && x.source_id === id; }); }
  function findChat(id) { return S.chat.filter(function (m) { return m.id === id; })[0] || null; }
  function findNote(id) { return S.notes.filter(function (n) { return n.id === id; })[0] || null; }

  /* ---------- Bausteine für Ansichten ---------- */
  function fld(label, inner) { return '<label class="field"><span>' + label + '</span>' + inner + '</label>'; }
  function langSelect() {
    return '<select class="input" data-lang aria-label="Sprache / Language">' + LANGS.map(function (l) {
      return '<option value="' + l + '"' + (l === lang ? ' selected' : '') + '>' + esc(LANG_NAMES[l]) + '</option>';
    }).join('') + '</select>';
  }
  function themeSelect() {
    var opts = [
      { v: 'light', label: L('themeLight'), icon: ICON.sun },
      { v: 'dark', label: L('themeDark'), icon: ICON.moon },
      { v: '', label: L('themeAuto'), icon: ICON.auto }
    ];
    return '<div class="segctl" role="group" aria-label="' + esc(L('themeTitle')) + '">' + opts.map(function (o) {
      return '<button type="button" class="segbtn' + (theme === o.v ? ' on' : '') + '" data-act="set-theme" data-val="' + o.v + '" aria-pressed="' + (theme === o.v) + '">' + o.icon + '<span>' + o.label + '</span></button>';
    }).join('') + '</div>';
  }
  function roleLabel(r) { return L(r === 'admin' ? 'roleAdmin' : r === 'mentor' ? 'roleMentor' : r === 'assistent' ? 'roleAssistant' : 'roleTalent'); }

  /* ---------- Ansicht: Einrichtung & Anmeldung ---------- */
  function viewSetup() {
    return '<div class="login"><div class="langbar">' + langSelect() + '</div><h1>' + L('setupTitle') + '</h1>' +
      '<p class="lead">' + L('setupLead') + '</p>' +
      '<ol class="steps"><li>' + L('setupStep1') + '</li><li>' + L('setupStep2') + '</li><li>' + L('setupStep3') + '</li></ol>' +
      '<p class="small muted">' + L('setupNote') + '</p></div>';
  }
  function viewLogin() {
    return '<div class="login"><div class="langbar">' + langSelect() + '</div>' +
      '<div class="loginhead"><h1>' + esc(cfg.APP_NAME || 'Coaching') + '<br>' + L('loginSub') + '</h1>' +
      '<img class="loginlogo" src="icon-192.png" alt=""></div>' +
      '<p class="lead">' + L('loginLead') + '</p>' +
      '<form data-form="auth">' +
      fld(L('phone'), phoneField('phone', true)) +
      fld(L('pinOptional'), '<input class="input pin" name="pin" type="password" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" autocomplete="current-password" placeholder="······" data-keep="loginpin">') +
      (S.err ? '<p class="err" role="alert">' + esc(S.err) + '</p>' : '') +
      '<button class="btn" type="submit"' + (S.busy ? ' disabled' : '') + '>' + L('signIn') + '</button>' +
      '</form></div>';
  }

  /* ---------- Ansicht: Chat ---------- */
  function msgHtml(m) {
    var sel = S.sel === m.id, bot = m.sender === 'bot';
    var flash = S.flash && S.flash.type === 'chat' && S.flash.id === m.id;
    return '<div class="msg ' + (bot ? 'bot' : 'user') + (flash ? ' flash' : '') + '" data-mid="' + esc(m.id) + '">' +
      '<button type="button" class="bubble" data-act="msg-sel" data-id="' + esc(m.id) + '" aria-expanded="' + sel + '">' + esc(m.body) + '</button>' +
      (sel ? '<div class="msgmeta">' + esc(bot ? L('coachLabel') : L('youLabel')) + ' · ' + esc(fmtTime(m.created_at)) + '</div>' +
        '<div class="msgacts">' +
        '<button type="button" class="mini" data-act="msg-note" data-id="' + esc(m.id) + '">' + L('toNote') + '</button>' +
        '<button type="button" class="mini" data-act="msg-prep" data-id="' + esc(m.id) + '"' + (inPrep('chat', m.id) ? ' disabled' : '') + '>' + L('toPrep') + '</button>' +
        '</div>' : '') +
      '</div>';
  }
  function chatLogHtml() {
    var html = '', lastDay = '';
    S.chat.forEach(function (m) {
      var k = dayKey(m.created_at);
      if (k !== lastDay) { html += '<div class="daysep">' + esc(dayLabel(m.created_at)) + '</div>'; lastDay = k; }
      html += msgHtml(m);
    });
    if (S.typing) html += '<div class="typing" aria-label="' + esc(L('coachLabel')) + '"><i></i><i></i><i></i></div>';
    var lb = S.chat[S.chat.length - 1];
    if (!S.typing && lb && lb.sender === 'bot' && lb.chips) {
      html += '<div class="chips">' + lb.chips.split(',').map(function (k) {
        return '<button type="button" class="chip" data-act="chip" data-chip="' + esc(k) + '">' + esc(L('chip_' + k)) + '</button>';
      }).join('') + '</div>';
    }
    return html;
  }
  function viewChat() {
    return '<div class="chatpage">' +
      '<div class="top"><div><h1 class="pagetitle">' + L('chatTitle') + '</h1><p>' + L('chatSub') + '</p></div>' +
      '<button type="button" class="iconbtn del" data-act="chat-clear" aria-label="' + esc(L('chatClear')) + '" title="' + esc(L('chatClear')) + '">' + ICON.trash + '</button></div>' +
      '<div class="chatlog" id="chatlog" aria-live="polite">' + chatLogHtml() + '</div>' +
      '<form class="composer" data-form="chat">' +
      '<textarea name="text" class="autogrow" rows="1" data-keep="chat" placeholder="' + esc(L('chatPlaceholder')) + '" aria-label="' + esc(L('chatPlaceholder')) + '" maxlength="4000"></textarea>' +
      '<button type="submit" class="sendbtn" id="sendbtn" aria-label="' + esc(L('chatSend')) + '"' + (S.busy || S.typing ? ' disabled' : '') + '>' + ICON.send + '</button>' +
      '</form></div>';
  }
  // Aktualisiert nur den Nachrichtenverlauf, damit die Eingabe (und die Tastatur) unberührt bleiben
  function drawChat() {
    var el = $('chatlog');
    if (S.step !== 'app' || S.tab !== 'chat' || !el) { return; }
    el.innerHTML = chatLogHtml();
    var sb_ = $('sendbtn'); if (sb_) sb_.disabled = !!(S.busy || S.typing);
    if (S.stick) { S.stick = false; window.scrollTo(0, document.documentElement.scrollHeight); }
  }

  /* ---------- Ansicht: Notes ---------- */
  function noteHtml(n) {
    var open = !!S.openNotes[n.id], editing = S.editNote === n.id;
    var flash = S.flash && S.flash.type === 'note' && S.flash.id === n.id;
    var html = '<article class="note' + (flash ? ' flash' : '') + '" data-nid="' + esc(n.id) + '">';
    if (editing) {
      html += '<form class="editform" data-form="note-edit" data-id="' + esc(n.id) + '">' +
        fld(L('titleLabel'), '<input class="input" name="title" data-keep="nt-' + esc(n.id) + '" value="' + (n.title_manual ? esc(n.title) : '') + '" placeholder="' + esc(n.title) + '" maxlength="120">') +
        fld(L('bodyLabel'), '<textarea class="input autogrow" name="body" rows="4" data-keep="nb-' + esc(n.id) + '" maxlength="10000" required>' + esc(n.body) + '</textarea>') +
        '<div class="editbtns"><button class="btn accent inline" type="submit">' + L('save') + '</button>' +
        '<button type="button" class="btn ghost inline" data-act="note-edit-cancel">' + L('dismiss') + '</button></div></form>';
    } else {
      html += '<button type="button" class="notehead" data-act="note-toggle" data-id="' + esc(n.id) + '" aria-expanded="' + open + '">' +
        '<h3>' + esc(n.title) + '</h3><span class="when">' + esc(fmtDT(n.created_at)) + '</span>' +
        (open ? '' : '<span class="preview">' + esc(n.body) + '</span>') + '</button>';
      if (open) {
        html += '<div class="notebody">' + esc(n.body) + '</div>' +
          '<div class="noteacts">' +
          '<button type="button" class="mini" data-act="note-prep" data-id="' + esc(n.id) + '"' + (inPrep('note', n.id) ? ' disabled' : '') + '>' + L('toPrep') + '</button>' +
          '<button type="button" class="mini" data-act="note-edit" data-id="' + esc(n.id) + '">' + L('edit') + '</button>' +
          '<button type="button" class="mini del" data-act="note-del" data-id="' + esc(n.id) + '">' + L('del') + '</button></div>';
      }
    }
    return html + '</article>';
  }
  function viewNotes() {
    var html = '<div class="top"><div><h1 class="pagetitle">' + L('notesTitle') + '</h1><p>' + L('notesSub') + '</p></div></div>' +
      '<form class="panel notecomposer" data-form="note-new">' +
      '<textarea class="input autogrow" name="body" rows="3" data-keep="note-new" placeholder="' + esc(L('notePlaceholder')) + '" aria-label="' + esc(L('notePlaceholder')) + '" maxlength="10000"></textarea>' +
      '<button class="btn accent" type="submit">' + L('noteSave') + '</button></form>';
    if (!S.notes.length) return html + '<p class="empty">' + L('notesEmpty') + '</p>';
    var last = '';
    S.notes.forEach(function (n) {
      var mk = monthKey(n.created_at);
      if (mk !== last) { html += '<h2 class="monthhead">' + esc(monthLabel(n.created_at)) + '</h2>'; last = mk; }
      html += noteHtml(n);
    });
    return html;
  }

  /* ---------- Ansicht: Prep ---------- */
  function srcLabel(it) {
    if (it.source_type === 'note') { var n = findNote(it.source_id); return n ? { ok: true, icon: ICON.note, text: L('srcNote') + ': ' + shorten(n.title, 40) } : { ok: false, icon: ICON.note, text: L('srcGone') }; }
    if (it.source_type === 'chat') { var m = findChat(it.source_id); return m ? { ok: true, icon: ICON.chat, text: L('srcChat') + ': ' + shorten(m.body, 40) } : { ok: false, icon: ICON.chat, text: L('srcGone') }; }
    return null;
  }
  function prepItemHtml(it, i, n) {
    var src = srcLabel(it), ed = S.prepEdit;
    var srcBtn = src ? '<button type="button" class="src" data-act="src-jump" data-type="' + esc(it.source_type) + '" data-id="' + esc(it.source_id) + '"' + (src.ok ? '' : ' disabled') + '>' + src.icon.replace(/width="24" height="24"/, 'width="13" height="13"') + '<span>' + esc(src.text) + '</span></button>' : '';
    return '<li class="prepitem' + (it.done ? ' done' : '') + '" data-pid="' + esc(it.id) + '">' +
      '<input type="checkbox" class="cb" data-act="prep-toggle" data-id="' + esc(it.id) + '"' + (it.done ? ' checked' : '') + ' aria-label="' + esc(it.text) + '">' +
      '<div class="txt">' + (ed ? '<input class="input" data-prepedit="' + esc(it.id) + '" value="' + esc(it.text) + '" maxlength="1000" aria-label="' + esc(L('edit')) + '">' : esc(it.text)) + '<div>' + srcBtn + '</div></div>' +
      (ed ? '<div class="tools">' +
        '<button type="button" class="iconbtn" data-act="prep-up" data-id="' + esc(it.id) + '" aria-label="' + esc(L('moveUp')) + '"' + (i === 0 ? ' disabled' : '') + '>' + ICON.up + '</button>' +
        '<button type="button" class="iconbtn" data-act="prep-down" data-id="' + esc(it.id) + '" aria-label="' + esc(L('moveDown')) + '"' + (i === n - 1 ? ' disabled' : '') + '>' + ICON.down + '</button>' +
        '<button type="button" class="iconbtn del" data-act="prep-del" data-id="' + esc(it.id) + '" aria-label="' + esc(L('del')) + '">' + ICON.trash + '</button></div>' : '') +
      '</li>';
  }
  function pickSheetHtml() {
    var tab = S.pick.tab, items = '';
    if (tab === 'notes') {
      items = S.notes.map(function (n) {
        var added = inPrep('note', n.id);
        return '<div class="pick"><div class="l"><b>' + esc(n.title) + '</b><span>' + esc(n.body) + '</span></div>' +
          '<button type="button" class="mini" data-act="pick-add" data-type="note" data-id="' + esc(n.id) + '"' + (added ? ' disabled' : '') + '>' + (added ? L('pickAdded') : L('pickAdd')) + '</button></div>';
      }).join('');
    } else {
      items = S.chat.slice().reverse().slice(0, 60).map(function (m) {
        var added = inPrep('chat', m.id);
        return '<div class="pick"><div class="l"><b>' + esc(m.sender === 'bot' ? L('coachLabel') : L('youLabel')) + ' · ' + esc(fmtDT(m.created_at)) + '</b><span>' + esc(m.body) + '</span></div>' +
          '<button type="button" class="mini" data-act="pick-add" data-type="chat" data-id="' + esc(m.id) + '"' + (added ? ' disabled' : '') + '>' + (added ? L('pickAdded') : L('pickAdd')) + '</button></div>';
      }).join('');
    }
    return '<div class="sheetwrap" data-act="pick-close-bg"><div class="sheet" role="dialog" aria-modal="true" aria-label="' + esc(L('pickTitle')) + '">' +
      '<div class="sheethead"><h2>' + L('pickTitle') + '</h2><button type="button" class="iconbtn" data-act="pick-close" aria-label="' + esc(L('close')) + '">' + ICON.x + '</button></div>' +
      '<div class="sheettabs">' +
      '<button type="button" class="segbtn' + (tab === 'notes' ? ' on' : '') + '" data-act="pick-tab" data-val="notes" aria-pressed="' + (tab === 'notes') + '">' + ICON.note + '<span>' + L('pickNotes') + '</span></button>' +
      '<button type="button" class="segbtn' + (tab === 'chat' ? ' on' : '') + '" data-act="pick-tab" data-val="chat" aria-pressed="' + (tab === 'chat') + '">' + ICON.chat + '<span>' + L('pickChat') + '</span></button></div>' +
      '<div class="sheetlist">' + (items || '<p class="empty">' + L('pickEmpty') + '</p>') + '</div></div></div>';
  }
  function viewPrep() {
    var n = S.prep.length, done = S.prep.filter(function (x) { return x.done; }).length;
    var html = '<div class="top"><div><h1 class="pagetitle">' + L('prepTitle') + '</h1><p>' + L('prepSub') + '</p></div></div>';
    if (n) {
      html += '<div class="small muted">' + esc(L('prepProgress', { done: done, n: n })) + '</div>' +
        '<div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="' + n + '" aria-valuenow="' + done + '"><i style="width:' + Math.round(done / n * 100) + '%"></i></div>';
    }
    html += '<form class="prepadd" data-form="prep-add">' +
      '<input class="input" name="text" data-keep="prep-add" placeholder="' + esc(L('prepAddPh')) + '" aria-label="' + esc(L('prepAddPh')) + '" maxlength="1000" autocomplete="off">' +
      '<button type="submit" class="iconbtn" aria-label="' + esc(L('prepAddPh')) + '">' + ICON.plus + '</button></form>' +
      '<div class="preptools">' +
      '<button type="button" class="mini" data-act="pick-open">' + L('prepPick') + '</button>' +
      (n ? '<button type="button" class="mini" data-act="prep-edit-toggle" aria-pressed="' + S.prepEdit + '">' + (S.prepEdit ? L('prepEditOff') : L('prepEditOn')) + '</button>' : '') +
      (done ? '<button type="button" class="mini del" data-act="prep-clear-done">' + L('prepClearDone') + '</button>' : '') +
      '</div>';
    html += n ? '<ul class="preplist">' + S.prep.map(function (it, i) { return prepItemHtml(it, i, n); }).join('') + '</ul>' : '<p class="empty">' + L('prepEmpty') + '</p>';
    if (S.pick) html += pickSheetHtml();
    return html;
  }

  /* ---------- Ansicht: Profil ---------- */
  function viewAdmin() {
    var q = String(S.q || '').trim().toLowerCase(), rf = S.roleFilter || '';
    var list = S.people.filter(function (p) {
      return (!rf || p.role === rf) && (!q || (p.name + ' ' + p.email + ' ' + p.phone + ' ' + fmtPhone(p.phone) + ' ' + p.traits).toLowerCase().indexOf(q) > -1);
    });
    var rows = list.map(function (p) {
      var self = p.id === S.me.id, editing = S.editPerson === p.id;
      return '<li><div class="personhead">' + avatarHtml(p, false) + '<div style="flex:1;min-width:0"><b>' + esc(p.name) + (self ? ' <span class="muted small">' + L('you') + '</span>' : '') + '</b><div class="muted small">' + esc(fmtPhone(p.phone)) + (p.email ? ' · ' + esc(p.email) : '') + '</div></div>' +
        '<span class="badge">' + esc(roleLabel(p.role)) + '</span></div>' +
        (p.traits && !editing ? '<p class="small muted traits-line">' + esc(p.traits) + '</p>' : '') +
        (p.assistantId ? '<p class="small muted" style="margin:6px 0 0">' + L('assistantOf', { name: esc((S.people.filter(function (x) { return x.id === p.assistantId; })[0] || { name: '?' }).name) }) + '</p>' : '') +
        '<div class="personrow"><select class="input" data-role-for="' + esc(p.id) + '" aria-label="' + esc(L('roleSelect')) + '"' + (self ? ' disabled' : '') + '>' +
        ROLES.map(function (r) { return '<option value="' + r + '"' + (p.role === r ? ' selected' : '') + '>' + esc(roleLabel(r)) + '</option>'; }).join('') + '</select>' +
        '<button type="button" class="mini" data-act="person-edit-toggle" data-id="' + esc(p.id) + '" aria-expanded="' + editing + '">' + (editing ? L('dismiss') : L('editPerson')) + '</button>' +
        '<label class="mini" for="avatar-for-' + esc(p.id) + '">' + L(p.avatar ? 'photoChange' : 'photoPick') + '</label>' +
        '<input id="avatar-for-' + esc(p.id) + '" class="visually-hidden" type="file" accept="image/*" data-avatar-for="' + esc(p.id) + '" aria-label="' + esc(L('photoTitle')) + '">' +
        (p.avatar ? '<button type="button" class="mini" data-act="person-avatar-remove" data-id="' + esc(p.id) + '">' + L('photoRemove') + '</button>' : '') +
        '<button type="button" class="mini" data-act="person-reset" data-id="' + esc(p.id) + '">' + L('resetPin') + '</button>' +
        (self ? '' : '<button type="button" class="mini del" data-act="person-del" data-id="' + esc(p.id) + '">' + L('removeP') + '</button>') + '</div>' +
        (editing ? '<form data-form="person-edit" data-id="' + esc(p.id) + '" style="margin-top:10px">' +
          fld(L('firstName'), '<input class="input" name="first" data-keep="pe-first-' + esc(p.id) + '" value="' + esc(p.first) + '" maxlength="60" required>') +
          fld(L('lastName'), '<input class="input" name="last" data-keep="pe-last-' + esc(p.id) + '" value="' + esc(p.last) + '" maxlength="60" required>') +
          fld(L('gender'), genderSelect('gender', p.gender, true)) +
          fld(L('email'), '<input class="input" name="email" type="email" inputmode="email" data-keep="pe-email-' + esc(p.id) + '" value="' + esc(p.email) + '" maxlength="120" required>') +
          fld(L('traits'), '<textarea class="input autogrow" name="traits" rows="3" maxlength="2000" data-keep="pe-traits-' + esc(p.id) + '" placeholder="' + esc(L('traitsPh')) + '">' + esc(p.traits) + '</textarea>') +
          '<button class="btn" type="submit">' + L('nameSave') + '</button></form>' : '') + '</li>';
    }).join('');
    var add = S.addPerson ? '<form data-form="person-add" style="margin-top:6px">' +
      fld(L('firstName'), '<input class="input" name="first" data-keep="pa-first" autocomplete="off" maxlength="60" required>') +
      fld(L('lastName'), '<input class="input" name="last" data-keep="pa-last" autocomplete="off" maxlength="60" required>') +
      fld(L('gender'), genderSelect('gender', '', true)) +
      fld(L('phone'), phoneField('pa-phone', true)) +
      fld(L('email'), '<input class="input" name="email" type="email" inputmode="email" data-keep="pa-email" autocomplete="off" maxlength="120" required>') +
      fld(L('roleSelect'), '<select class="input" name="role">' + ROLES.slice().reverse().map(function (r) { return '<option value="' + r + '">' + esc(roleLabel(r)) + '</option>'; }).join('') + '</select>') +
      '<p class="small muted" style="margin-bottom:12px">' + L('memberAddNote') + '</p>' +
      '<button class="btn accent" type="submit"' + (S.busy ? ' disabled' : '') + '>' + L('personAdd') + '</button></form>' : '';
    return '<div class="top"><div><h1 class="pagetitle">' + L('adminTitle') + '</h1></div></div>' +
      '<section class="panel"><p>' + L('peopleHint') + '</p>' +
      '<div class="adminfilter"><input class="input" type="search" data-keep="admin-q" data-admin-q="1" value="' + esc(S.q) + '" placeholder="' + esc(L('adminSearch')) + '" aria-label="' + esc(L('adminSearch')) + '" autocomplete="off">' +
      '<select class="input" data-admin-rf="1" aria-label="' + esc(L('roleSelect')) + '"><option value="">' + esc(L('allRoles')) + '</option>' +
      ROLES.map(function (r) { return '<option value="' + r + '"' + (rf === r ? ' selected' : '') + '>' + esc(roleLabel(r)) + '</option>'; }).join('') + '</select></div>' +
      '<p class="small muted">' + L('peopleCount', { n: list.length }) + '</p>' +
      '<ul class="people">' + (rows || '<li class="muted">' + L('noMatch') + '</li>') + '</ul></section>' +
      '<section class="panel"><button type="button" class="btn ghost" data-act="person-add-toggle" aria-expanded="' + S.addPerson + '">' + (S.addPerson ? L('dismiss') : L('personAdd')) + '</button>' + add + '</section>';
  }
  function addressSelect() {
    return '<select class="input" data-addr="1" aria-label="' + esc(L('addressTitle')) + '">' +
      ['informal', 'formal'].map(function (v) { return '<option value="' + v + '"' + (S.me.addressForm === v ? ' selected' : '') + '>' + esc(L(v === 'formal' ? 'addressFormal' : 'addressInformal')) + '</option>'; }).join('') + '</select>';
  }
  function viewAssistantPick() {
    var cur = S.me.assistantId;
    var cards = S.assistants.map(function (a) {
      var on = a.id === cur;
      return '<button type="button" class="assistant-card' + (on ? ' on' : '') + '" data-act="assistant-pick" data-id="' + esc(a.id) + '" aria-pressed="' + on + '">' + avatarHtml(a, false) +
        '<span class="acbody"><b>' + esc(a.name) + '</b>' + (a.traits ? '<span class="small muted">' + esc(a.traits) + '</span>' : '') + '</span>' + (on ? '<span class="badge">✓</span>' : '') + '</button>';
    }).join('');
    return '<section class="panel"><h2>' + L('assistantTitle') + '</h2><p>' + L('assistantHint') + '</p>' +
      (cards ? '<div class="assistant-list">' + cards + '</div>' : '<p class="muted">' + L('assistantEmpty') + '</p>') +
      (cur ? '<button type="button" class="linkbtn" data-act="assistant-pick" data-id="">' + L('assistantNone') + '</button>' : '') + '</section>';
  }
  function viewProfile() {
    var iosHint = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.navigator.standalone;
    var standalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
    var install = '';
    if (!standalone) {
      if (installPrompt) install = '<section class="panel"><h2>' + L('installTitle') + '</h2><p>' + L('installHint') + '</p><button type="button" class="btn" data-act="install">' + L('installBtn') + '</button></section>';
      else if (iosHint) install = '<section class="panel"><h2>' + L('installTitle') + '</h2><p>' + L('installIos') + '</p></section>';
    }
    return '<div class="top"><div><h1 class="pagetitle">' + L('profileTitle') + '</h1></div></div>' +
      '<section class="panel avatar-panel">' + avatarHtml(S.me, true) +
      '<div class="avatar-actions"><label class="btn ghost small" for="avatar-file">' + L(S.me.avatar ? 'photoChange' : 'photoPick') + '</label>' +
      '<input id="avatar-file" class="visually-hidden" type="file" accept="image/*" data-avatar-file="1" aria-label="' + esc(L('photoTitle')) + '">' +
      (S.me.avatar ? '<button type="button" class="linkbtn" data-act="avatar-remove">' + L('photoRemove') + '</button>' : '') + '</div></section>' +
      '<section class="panel">' +
      '<div class="profile-row"><span class="muted">' + L('nameLabel') + '</span><b>' + esc(S.me.name) + '</b></div>' +
      '<div class="profile-row"><span class="muted">' + L('phone') + '</span><b>' + esc(fmtPhone(S.me.phone)) + '</b></div>' +
      '<div class="profile-row"><span class="muted">' + L('gender') + '</span><b>' + esc(genderLabel(S.me.gender)) + '</b></div>' +
      '<div class="profile-row"><span class="muted">' + L('email') + '</span><b>' + esc(S.me.email) + '</b></div>' +
      '<div class="profile-row"><span class="muted">' + L('roleLabel') + '</span><span class="badge">' + esc(roleLabel(S.me.role)) + '</span></div></section>' +
      (S.me.role === 'talent' ? viewAssistantPick() : '') +
      '<section class="panel"><h2>' + L('language') + '</h2><p>' + L('languageHint') + '</p>' + langSelect() +
      '<h3 class="subh">' + L('addressTitle') + '</h3><p>' + L('addressHint') + '</p>' + addressSelect() + '</section>' +
      '<section class="panel"><h2>' + L('themeTitle') + '</h2><p>' + L('themeHint') + '</p>' + themeSelect() + '</section>' +
      '<section class="panel"><h2>' + L('nameChange') + '</h2><form data-form="name">' +
      fld(L('firstName'), '<input class="input" name="first" data-keep="pf-first" value="' + esc(S.me.first) + '" required maxlength="60">') +
      fld(L('lastName'), '<input class="input" name="last" data-keep="pf-last" value="' + esc(S.me.last) + '" required maxlength="60">') +
      fld(L('gender'), genderSelect('gender', S.me.gender, true)) +
      fld(L('email'), '<input class="input" name="email" type="email" inputmode="email" data-keep="pf-email" value="' + esc(S.me.email) + '" required maxlength="120">') +
      '<button class="btn" type="submit">' + L('nameSave') + '</button></form></section>' +
      '<section class="panel"><h2>' + L('traits') + '</h2><p>' + L('traitsHint') + '</p><form data-form="traits">' +
      '<textarea class="input autogrow" name="traits" rows="4" maxlength="2000" data-keep="pf-traits" placeholder="' + esc(L('traitsPh')) + '" aria-label="' + esc(L('traits')) + '">' + esc(S.me.traits) + '</textarea>' +
      '<button class="btn" type="submit" style="margin-top:10px">' + L('traitsSave') + '</button></form></section>' +
      '<section class="panel"><h2>' + L('phoneChange') + '</h2><p>' + L('phoneChangeNote') + '</p><form data-form="phone">' +
      fld(L('phoneNew'), phoneField('pf-phone', true)) +
      '<button class="btn" type="submit">' + L('phoneSave') + '</button></form></section>' +
      '<section class="panel"><h2>' + L('pinChange') + '</h2><p>' + L('pinIntro') + '</p><form data-form="pin">' +
      fld(L('pinNew'), '<input class="input pin" name="pin" type="password" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" autocomplete="new-password" data-keep="pf-pin" required>') +
      '<button class="btn" type="submit">' + L('pinSave') + '</button></form>' +
      '<button type="button" class="linkbtn" data-act="pin-default" style="margin-top:10px">' + L('pinDefault') + '</button></section>' +
      install +
      '<button type="button" class="btn dangerbtn" data-act="logout">' + ICON.logout + L('logout') + '</button>';
  }

  /* ---------- Navigation & Rendering ---------- */
  function renderNav() {
    var nav = $('nav');
    if (S.step !== 'app') { nav.hidden = true; return; }
    nav.hidden = false;
    var tabs = [
      { id: 'chat', label: L('navChat'), icon: ICON.chat },
      { id: 'notes', label: L('navNotes'), icon: ICON.note },
      { id: 'prep', label: L('navPrep'), icon: ICON.prep },
      { id: 'profile', label: L('navProfile'), icon: ICON.user }
    ];
    if (S.me && S.me.role === 'admin') tabs.push({ id: 'admin', label: L('navAdmin'), icon: ICON.shield });
    nav.innerHTML = '<div class="in">' + tabs.map(function (t) {
      return '<button type="button" class="tab" data-act="tab" data-tab="' + t.id + '"' + (S.tab === t.id ? ' aria-current="page"' : '') + '>' + t.icon + '<span>' + t.label + '</span></button>';
    }).join('') + '</div>';
  }
  function growField(el) {
    if (!el || !el.classList || !el.classList.contains('autogrow')) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight + 2, 140) + 'px';
  }
  function render() {
    var app = $('app');
    var y = window.scrollY;
    var ae = document.activeElement;
    var fk = ae && ae.dataset && ae.dataset.keep && app.contains(ae) ? ae.dataset.keep : null;
    var fs = fk ? ae.selectionStart : null, fe = fk ? ae.selectionEnd : null;
    if (S.step === 'setup') app.innerHTML = viewSetup();
    else if (S.step === 'loading') app.innerHTML = '<div class="login"><p class="muted">' + L('loading') + '</p></div>';
    else if (S.step === 'login' || !S.me) app.innerHTML = viewLogin();
    else {
      if (S.tab === 'admin' && S.me.role !== 'admin') S.tab = 'chat';
      var page = S.tab === 'admin' ? viewAdmin() : S.tab === 'notes' ? viewNotes() : S.tab === 'prep' ? viewPrep() : S.tab === 'profile' ? viewProfile() : viewChat();
      var banner = '';
      if (!S.me.pinChanged) {
        banner = '<div class="pinbanner" role="alert"><span>' + esc(L('pinBannerMsg')) + '</span>' +
          '<button type="button" class="btn inline" data-act="tab" data-tab="profile">' + esc(L('pinBannerBtn')) + '</button></div>';
      }
      app.innerHTML = banner + page;
    }
    // Entwürfe zurückschreiben (bleiben beim Tabwechsel und bei Live-Updates erhalten)
    app.querySelectorAll('[data-keep]').forEach(function (el) {
      var d = S.drafts[el.dataset.keep];
      if (d != null) el.value = d;
      growField(el);
    });
    if (fk) {
      var el = app.querySelector('[data-keep="' + fk + '"]');
      if (el) { try { el.focus({ preventScroll: true }); el.setSelectionRange(fs, fe); } catch (e) { /* ignorieren */ } }
    }
    renderNav();
    fitTitles();
    if (S.step === 'app' && S.tab === 'chat' && S.stick) { S.stick = false; window.scrollTo(0, document.documentElement.scrollHeight); }
    else window.scrollTo(0, y);
    if (S.flash) {
      var f = app.querySelector('.flash');
      if (f && f.scrollIntoView) f.scrollIntoView({ block: 'center' });
      var fl = S.flash;
      if (!fl.timer) fl.timer = setTimeout(function () { if (S.flash === fl) { S.flash = null; softRender(); } }, 1800);
    }
  }
  // Seitentitel verkleinern, bis sie auf einer Zeile Platz haben (statt umzubrechen)
  function fitTitles() {
    document.querySelectorAll('.pagetitle').forEach(function (el) {
      el.style.fontSize = '';
      var size = parseFloat(getComputedStyle(el).fontSize) || 0;
      while (size > 15 && el.scrollWidth > el.clientWidth + 1) { size -= 1; el.style.fontSize = size + 'px'; }
    });
  }
  // Aktualisiert im Hintergrund, ohne eine laufende Eingabe zu stören
  function softRender() {
    if (S.step !== 'app') { render(); return; }
    if (S.tab === 'chat' && $('chatlog')) { drawChat(); return; }
    var a = document.activeElement;
    if (a && /^(INPUT|SELECT|TEXTAREA)$/.test(a.tagName) && $('app').contains(a)) return;
    render();
  }
  var toastTimer;
  function toast(msg) {
    var el = $('toast');
    el.textContent = msg;
    el.classList.toggle('nonav', S.step !== 'app');
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 2400);
  }
  function askConfirm(title, message, danger) {
    return new Promise(function (resolve) {
      var old = $('dlg'); if (old) old.remove();
      var prev = document.activeElement;
      var wrap = document.createElement('div');
      wrap.id = 'dlg'; wrap.className = 'dlg';
      wrap.innerHTML = '<div class="dlgcard" role="alertdialog" aria-modal="true" aria-labelledby="dlgT" aria-describedby="dlgM">' +
        '<h3 id="dlgT">' + esc(title) + '</h3><p id="dlgM">' + esc(message) + '</p>' +
        '<div class="dlgbtns"><button type="button" class="btn ghost inline" data-dlg="0">' + L('dismiss') + '</button>' +
        '<button type="button" class="btn inline' + (danger ? ' dangerbtn' : '') + '" data-dlg="1">' + L('ok') + '</button></div></div>';
      var done = function (v) {
        document.removeEventListener('keydown', onKey, true);
        wrap.remove();
        try { if (prev && prev.focus) prev.focus(); } catch (e) { /* ignorieren */ }
        resolve(v);
      };
      var onKey = function (e) {
        if (e.key === 'Escape') { e.preventDefault(); done(false); }
        if (e.key === 'Tab') {
          var b = wrap.querySelectorAll('button');
          if (e.shiftKey && document.activeElement === b[0]) { e.preventDefault(); b[b.length - 1].focus(); }
          else if (!e.shiftKey && document.activeElement === b[b.length - 1]) { e.preventDefault(); b[0].focus(); }
        }
      };
      wrap.addEventListener('click', function (e) {
        e.stopPropagation();
        var t = e.target.closest('[data-dlg]');
        if (t) done(t.dataset.dlg === '1'); else if (e.target === wrap) done(false);
      });
      document.addEventListener('keydown', onKey, true);
      document.body.appendChild(wrap);
      wrap.querySelector('[data-dlg="0"]').focus();   // Sicherer Standard: Abbrechen hat den Fokus
    });
  }

  /* ---------- Anmeldung ---------- */
  function authError(e) {
    var m = String((e && e.message) || '');
    if (/invalid login/i.test(m)) return L('authInvalid');
    if (/rate limit|too many/i.test(m)) return L('authRate');
    return L('authFail');
  }
  async function handleAuth(g) {
    var phone = normPhone(g('phone'));
    if (!phone) { S.err = L('phoneInvalid'); render(); return; }
    var custom = g('pin');
    if (custom && !/^\d{6}$/.test(custom)) { S.err = L('pinExact'); render(); return; }
    S.busy = true; S.err = ''; render();
    try {
      var res = await sb.auth.signInWithPassword({ email: phoneToEmail(phone), password: custom || defaultPin(phone) });
      if (res.error) throw res.error;
      S.busy = false;
      S.drafts = {};
      await enter(res.data.session);
    } catch (e) {
      console.error(e);
      S.busy = false; S.err = authError(e); S.step = 'login'; render();
    }
  }
  async function enter(session) {
    S.session = session;
    S.step = 'loading'; render();
    try {
      await loadAll();
      if (!S.me) throw new Error('Kein Profil gefunden');
      if (S.me.language && LANGS.indexOf(S.me.language) > -1) setLang(S.me.language); else saveLang();
      if (S.me.theme === 'light' || S.me.theme === 'dark') setTheme(S.me.theme); else if (theme) saveTheme();
      S.step = 'app'; S.tab = 'chat'; S.err = ''; S.stick = true;
      subscribe();
      render();
      greetIfEmpty();
    } catch (e) {
      console.error(e);
      S.step = 'login'; S.err = L('loadFail'); render();
    }
  }

  /* ---------- Live-Aktualisierung ---------- */
  var channel = null, reloadTimer;
  function scheduleReload() {
    clearTimeout(reloadTimer);
    reloadTimer = setTimeout(function () { if (S.step === 'app' && !S.busy && !S.typing) refresh(); }, 500);
  }
  function subscribe() {
    if (channel || !sb) return;
    try { channel = sb.channel('coaching-daten').on('postgres_changes', { event: '*', schema: 'public' }, scheduleReload).subscribe(); }
    catch (e) { console.error(e); }
  }
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') scheduleReload(); });

  /* ---------- Aktionen: Prep ---------- */
  async function movePrep(id, dir) {
    var list = S.prep.slice(), i = list.findIndex(function (x) { return x.id === id; }), j = i + dir;
    if (i < 0 || j < 0 || j >= list.length) return;
    var t = list[i]; list[i] = list[j]; list[j] = t;
    var changed = [];
    list.forEach(function (x, k) { if (x.sort !== k) { x.sort = k; changed.push(x); } });
    S.prep = list; render();
    await act(function () {
      return Promise.all(changed.map(function (x) { return sb.from('prep_items').update({ sort: x.sort }).eq('id', x.id).eq('user_id', S.me.id); }))
        .then(function (rs) { return { error: (rs.filter(function (r) { return r.error; })[0] || {}).error }; });
    });
  }
  function jumpTo(type, id) {
    if (type === 'note') {
      if (!findNote(id)) { toast(L('srcGone')); return; }
      S.tab = 'notes'; S.openNotes[id] = true;
    } else {
      if (!findChat(id)) { toast(L('srcGone')); return; }
      S.tab = 'chat'; S.sel = null;
    }
    S.pick = null; S.flash = { type: type === 'note' ? 'note' : 'chat', id: id };
    render();
  }

  /* ---------- Klicks ---------- */
  document.addEventListener('click', async function (e) {
    var el = e.target.closest('[data-act]');
    if (!el) return;
    var a = el.dataset.act, D = el.dataset;
    if (el.tagName === 'DIV' && a === 'pick-close-bg' && e.target !== el) return;   // nur Klick auf den Hintergrund
    if (!S.session && a !== 'noop') return;

    if (a === 'tab') { var toChat = D.tab === 'chat'; S.tab = D.tab; S.pick = null; S.stick = toChat; render(); if (!toChat) window.scrollTo(0, 0); return; }
    if (a === 'set-theme') { setTheme(D.val); S.me.theme = theme || null; saveTheme(); render(); return; }
    if (a === 'install') { if (installPrompt) { installPrompt.prompt(); await installPrompt.userChoice; installPrompt = null; render(); } return; }
    if (a === 'logout') {
      try { await sb.auth.signOut(); } catch (err) { console.error(err); }
      if (channel) { try { sb.removeChannel(channel); } catch (err2) { /* ignorieren */ } channel = null; }
      S = freshState(); S.step = 'login'; render(); window.scrollTo(0, 0);
      return;
    }
    if (a === 'assistant-pick' && S.me.role === 'talent') {
      var asid = D.id || null;
      await act(function () { return sb.rpc('set_assistant', { new_assistant: asid }); }, L('assistantSaved'));
      render();
      return;
    }
    if (a === 'avatar-remove') {
      await act(function () { return sb.rpc('set_avatar', { target: S.me.id, new_avatar: null }); }, L('photoRemoved'));
      render();
      return;
    }
    if (a === 'pin-default') {
      try {
        var pr = await sb.auth.updateUser({ password: defaultPin(S.me.phone) });
        if (pr.error) throw pr.error;
        S.me.pinChanged = false;
        await sb.from('profiles').update({ pin_changed: false }).eq('id', S.me.id);
        toast(L('pinResetOk')); render();
      } catch (err3) { console.error(err3); toast(L('pinResetFail')); }
      return;
    }

    /* Chat */
    if (a === 'msg-sel') { S.sel = S.sel === D.id ? null : D.id; drawChat(); return; }
    if (a === 'chip') { sendChat(L('chip_' + D.chip), D.chip); return; }
    if (a === 'msg-note') {
      var cm = findChat(D.id); if (!cm) return;
      try { await createNote(cm.body); toast(L('noteSavedMsg')); S.sel = null; drawChat(); } catch (err4) { console.error(err4); toast(L('errFailed')); }
      return;
    }
    if (a === 'msg-prep') {
      var pm = findChat(D.id); if (!pm || inPrep('chat', pm.id)) return;
      try { await addPrepItem(shorten(pm.body, 200), 'chat', pm.id); toast(L('prepAddedMsg')); S.sel = null; drawChat(); } catch (err5) { console.error(err5); toast(L('errFailed')); }
      return;
    }
    if (a === 'chat-clear') {
      if (!(await askConfirm(L('chatClear'), L('confirmClearChat'), true))) return;
      var okc = await act(function () { return sb.from('chat_messages').delete().eq('user_id', S.me.id); }, L('chatCleared'));
      if (okc) { S.sel = null; greetIfEmpty(); }
      return;
    }

    /* Notes */
    if (a === 'note-toggle') { S.openNotes[D.id] = !S.openNotes[D.id]; render(); return; }
    if (a === 'note-edit') { var en = findNote(D.id); if (!en) return; delete S.drafts['nt-' + D.id]; delete S.drafts['nb-' + D.id]; S.editNote = D.id; S.openNotes[D.id] = true; render(); return; }
    if (a === 'note-edit-cancel') { if (S.editNote) { delete S.drafts['nt-' + S.editNote]; delete S.drafts['nb-' + S.editNote]; } S.editNote = null; render(); return; }
    if (a === 'note-prep') {
      var np = findNote(D.id); if (!np || inPrep('note', np.id)) return;
      try { await addPrepItem(np.title, 'note', np.id); toast(L('prepAddedMsg')); render(); } catch (err6) { console.error(err6); toast(L('errFailed')); }
      return;
    }
    if (a === 'note-del') {
      if (!(await askConfirm(L('del'), L('confirmDelNote'), true))) return;
      await act(function () { return sb.from('notes').delete().eq('id', D.id).eq('user_id', S.me.id); }, L('noteDeleted'));
      return;
    }

    /* Prep */
    if (a === 'prep-toggle') {
      var it = S.prep.filter(function (x) { return x.id === D.id; })[0]; if (!it) return;
      it.done = el.checked; render();
      await act(function () { return sb.from('prep_items').update({ done: it.done }).eq('id', it.id).eq('user_id', S.me.id); });
      return;
    }
    if (a === 'prep-up') { movePrep(D.id, -1); return; }
    if (a === 'prep-down') { movePrep(D.id, 1); return; }
    if (a === 'prep-del') { await act(function () { return sb.from('prep_items').delete().eq('id', D.id).eq('user_id', S.me.id); }); return; }
    if (a === 'prep-edit-toggle') { S.prepEdit = !S.prepEdit; render(); return; }
    if (a === 'prep-clear-done') {
      if (!(await askConfirm(L('prepClearDone'), L('confirmClearDone'), true))) return;
      await act(function () { return sb.from('prep_items').delete().eq('user_id', S.me.id).eq('done', true); });
      return;
    }
    if (a === 'pick-open') { S.pick = { tab: 'notes' }; render(); return; }
    if (a === 'pick-close' || a === 'pick-close-bg') { S.pick = null; render(); return; }
    if (a === 'pick-tab') { S.pick.tab = D.val; render(); return; }
    if (a === 'pick-add') {
      try {
        var text = D.type === 'note' ? (findNote(D.id) || {}).title : shorten((findChat(D.id) || {}).body, 200);
        if (!text) return;
        await addPrepItem(text, D.type, D.id); toast(L('prepAddedMsg')); render();
      } catch (err7) { console.error(err7); toast(L('errFailed')); }
      return;
    }
    if (a === 'src-jump') { jumpTo(D.type, D.id); return; }

    /* Personenverwaltung (nur Admin; die Datenbank prüft zusätzlich) */
    if (!S.me || S.me.role !== 'admin') return;
    if (a === 'person-add-toggle') { S.addPerson = !S.addPerson; render(); return; }
    if (a === 'person-avatar-remove' && S.me.role === 'admin') {
      var avId = D.id;
      await act(function () { return sb.rpc('set_avatar', { target: avId, new_avatar: null }); }, L('photoRemoved'));
      render();
      return;
    }
    if (a === 'person-edit-toggle' && S.me.role === 'admin') {
      S.editPerson = S.editPerson === D.id ? null : D.id;
      Object.keys(S.drafts).forEach(function (k) { if (/^pe-/.test(k)) delete S.drafts[k]; });
      render();
      return;
    }
    if (a === 'person-reset') {
      var who = S.people.filter(function (p) { return p.id === D.id; })[0]; if (!who) return;
      if (!(await askConfirm(L('resetPin'), L('confirmResetPin', { name: who.name }), false))) return;
      await act(function () { return sb.rpc('reset_pin', { target: D.id }); }, L('pinReset'));
      return;
    }
    if (a === 'person-del') {
      var rm = S.people.filter(function (p) { return p.id === D.id; })[0]; if (!rm || rm.id === S.me.id) return;
      if (!(await askConfirm(L('removeP'), L('confirmRemove', { name: rm.name }), true))) return;
      await act(function () { return sb.rpc('remove_member', { target: D.id }); }, L('memberRemoved'));
      return;
    }
  });

  /* ---------- Formulare ---------- */
  async function addPerson(first, last, phoneRaw, email, gender, role) {
    var phone = normPhone(phoneRaw);
    var name = first + ' ' + last;
    if (!first || !last) return false;
    if (!isEmail(email)) { toast(L('emailInvalid')); return false; }
    if (['m', 'w', 'x'].indexOf(gender) < 0) { toast(L('genderInvalid')); return false; }
    if (!phone) { toast(L('phoneInvalid')); return false; }
    if (S.people.some(function (p) { return p.phone === phone; })) { toast(L('alreadyReg')); return false; }
    try {
      var code = await sb.rpc('get_club_code');
      if (code.error) throw code.error;
      // Eigener, kurzlebiger Client: die Sitzung des Admins bleibt unverändert
      var tmp = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
      var r = await tmp.auth.signUp({ email: phoneToEmail(phone), password: defaultPin(phone), options: { data: { first_name: first, last_name: last, email: email, gender: gender, phone: phone, club_code: code.data || '' } } });
      if (r.error) throw r.error;
      if (role !== 'talent' && r.data && r.data.user) {
        var rr = await sb.rpc('set_role', { target: r.data.user.id, new_role: role });
        if (rr.error) throw rr.error;
      }
      toast(L('memberAdded', { name: name }));
      return true;
    } catch (e) {
      console.error(e);
      toast(L('addFailed', { reason: /already/i.test(String(e.message)) ? L('alreadyReg') : String(e.message || L('unknownError')).slice(0, 100) }));
      return false;
    } finally {
      await refresh();
    }
  }
  document.addEventListener('submit', async function (e) {
    var form = e.target.closest('[data-form]');
    if (!form) return;
    e.preventDefault();
    var kind = form.dataset.form, f = new FormData(form);
    var g = function (k) { if (k === 'phone' && f.has('cc')) return combinedPhone(f); return String(f.get(k) || '').trim(); };
    if (kind === 'auth') { if (!S.busy) handleAuth(g); return; }
    if (!S.me || S.busy && kind !== 'chat') return;

    if (kind === 'chat') { sendChat(g('text')); return; }
    if (kind === 'note-new') {
      var body = g('body'); if (!body) return;
      delete S.drafts['note-new'];
      try { await createNote(body); toast(L('noteSaved')); render(); } catch (err) { console.error(err); S.drafts['note-new'] = body; toast(L('errFailed')); render(); }
      return;
    }
    if (kind === 'note-edit') {
      var n = findNote(form.dataset.id); if (!n) return;
      var nb = g('body'); if (!nb) return;
      var nt = g('title');
      var patch = { body: nb, updated_at: new Date().toISOString() };
      if (nt) { patch.title = nt; patch.title_manual = nt !== n.title || n.title_manual; }
      else { patch.title = makeTitle(nb); patch.title_manual = false; }
      delete S.drafts['nt-' + n.id]; delete S.drafts['nb-' + n.id];
      S.editNote = null;
      await act(function () { return sb.from('notes').update(patch).eq('id', n.id).eq('user_id', S.me.id); }, L('noteUpdated'));
      render();
      return;
    }
    if (kind === 'prep-add') {
      var pt = g('text'); if (!pt) return;
      delete S.drafts['prep-add'];
      try { await addPrepItem(pt, null, null); render(); var pi = document.querySelector('[data-keep="prep-add"]'); if (pi) pi.focus(); }
      catch (err2) { console.error(err2); S.drafts['prep-add'] = pt; toast(L('errFailed')); render(); }
      return;
    }
    if (kind === 'name') {
      if (!g('first') || !g('last')) return;
      if (!isEmail(g('email'))) { toast(L('emailInvalid')); return; }
      if (['m', 'w', 'x'].indexOf(g('gender')) < 0) { toast(L('genderInvalid')); return; }
      delete S.drafts['pf-first']; delete S.drafts['pf-last']; delete S.drafts['pf-email'];
      await act(function () { return sb.from('profiles').update({ first_name: g('first'), last_name: g('last'), gender: g('gender'), email: g('email') }).eq('id', S.me.id); }, L('nameSaved'));
      render();
      return;
    }
    if (kind === 'traits') {
      delete S.drafts['pf-traits'];
      await act(function () { return sb.rpc('set_traits', { target: S.me.id, new_traits: g('traits') }); }, L('traitsSaved'));
      render();
      return;
    }
    if (kind === 'person-edit') {
      if (S.me.role !== 'admin') return;
      var eid = form.dataset.id;
      if (!g('first') || !g('last')) return;
      if (!isEmail(g('email'))) { toast(L('emailInvalid')); return; }
      if (['m', 'w', 'x'].indexOf(g('gender')) < 0) { toast(L('genderInvalid')); return; }
      var okE = await act(function () { return sb.rpc('admin_update_person', { target: eid, p_first: g('first'), p_last: g('last'), p_gender: g('gender'), p_email: g('email'), p_traits: g('traits') }); }, L('personSaved'));
      if (okE) { S.editPerson = null; Object.keys(S.drafts).forEach(function (k) { if (/^pe-/.test(k)) delete S.drafts[k]; }); }
      render();
      return;
    }
    if (kind === 'phone') {
      var np = normPhone(g('phone'));
      if (!np) { toast(L('phoneInvalid')); return; }
      if (!(await askConfirm(L('phoneChange'), L('confirmPhone', { phone: fmtPhone(np) }), false))) return;
      S.busy = true;
      var ur = await sb.rpc('update_own_phone', { new_phone: np });
      S.busy = false;
      if (ur.error) {
        console.error(ur.error);
        toast(/PHONE_TAKEN|duplicate|unique/i.test(ur.error.message || '') ? L('phoneTaken') : L('errFailed') + ': ' + String(ur.error.message || '').slice(0, 100));
        return;
      }
      delete S.drafts['pf-phone'];
      try { await sb.auth.refreshSession(); } catch (x) { console.error(x); }
      toast(L('phoneSaved'));
      await refresh(); render();
      return;
    }
    if (kind === 'pin') {
      if (!/^\d{6}$/.test(g('pin'))) { toast(L('pinExact')); return; }
      try {
        var r = await sb.auth.updateUser({ password: g('pin') });
        if (r.error) throw r.error;
        delete S.drafts['pf-pin']; form.reset();
        S.me.pinChanged = true;
        await sb.from('profiles').update({ pin_changed: true }).eq('id', S.me.id);
        toast(L('pinChanged')); render();
      } catch (err3) { console.error(err3); toast(L('pinChangeFail')); }
      return;
    }
    if (kind === 'person-add') {
      if (S.me.role !== 'admin') return;
      S.busy = true; render();
      var role = ROLES.indexOf(g('role')) > -1 ? g('role') : 'talent';
      var ok = await addPerson(g('first'), g('last'), g('phone'), g('email'), g('gender'), role);
      S.busy = false;
      if (ok) { S.addPerson = false; delete S.drafts['pa-first']; delete S.drafts['pa-last']; delete S.drafts['pa-email']; delete S.drafts['pa-phone']; }
      render();
      return;
    }
  });

  document.addEventListener('change', async function (e) {
    var el = e.target;
    if (!el || !el.dataset) return;
    if ('avatarFile' in el.dataset && S.me) {
      var file = el.files && el.files[0];
      el.value = '';
      if (!file) return;
      try {
        var data = await resizeImage(file);
        await act(function () { return sb.rpc('set_avatar', { target: S.me.id, new_avatar: data }); }, L('photoSaved'));
      } catch (err4) { console.error(err4); toast(L('photoFail')); }
      return;
    }
    if (el.dataset.avatarFor && S.me && S.me.role === 'admin') {
      var af = el.files && el.files[0], aid = el.dataset.avatarFor;
      el.value = '';
      if (!af) return;
      try {
        var adata = await resizeImage(af);
        await act(function () { return sb.rpc('set_avatar', { target: aid, new_avatar: adata }); }, L('photoSaved'));
      } catch (err5) { console.error(err5); toast(L('photoFail')); }
      render();
      return;
    }
    if (el.dataset.cc !== undefined) {
      S.drafts[el.dataset.keep] = el.value;
      try { localStorage.setItem('coaching-cc', el.value); } catch (e) { /* ignorieren */ }
      return;
    }
    if (el.dataset.addr !== undefined && S.me) {
      var af2 = el.value === 'formal' ? 'formal' : 'informal';
      var okA = await act(function () { return sb.from('profiles').update({ address_form: af2 }).eq('id', S.me.id); });
      if (okA) { setFormal(af2 === 'formal'); toast(L('addressSaved')); }
      render();
      return;
    }
    if (el.dataset.adminRf !== undefined) { S.roleFilter = el.value; render(); return; }
    if ('lang' in el.dataset) {
      setLang(el.value);
      if (S.step === 'app' && S.me) { saveLang(); render(); toast(L('langSaved')); } else render();
      return;
    }
    if (el.dataset.roleFor && S.me && S.me.role === 'admin') {
      var id = el.dataset.roleFor, nr = el.value;
      await act(function () { return sb.rpc('set_role', { target: id, new_role: nr }); }, L('roleChanged'));
      render();
      return;
    }
    if (el.dataset.prepedit && S.me) {
      var val = String(el.value || '').trim(), it = S.prep.filter(function (x) { return x.id === el.dataset.prepedit; })[0];
      if (!it) return;
      if (!val) { el.value = it.text; return; }
      it.text = val;
      await act(function () { return sb.from('prep_items').update({ text: val }).eq('id', it.id).eq('user_id', S.me.id); });
    }
  });

  document.addEventListener('input', function (e) {
    var t = e.target;
    if (!t) return;
    if (t.dataset && t.dataset.keep) { S.drafts[t.dataset.keep] = t.value; growField(t); }
    if (t.dataset && t.dataset.adminQ) { S.q = t.value; render(); return; }
    if (t.name === 'phone' && t.closest('[data-form="auth"],[data-form="phone"],[data-form="person-add"]')) {
      var ccSel = t.form && t.form.elements && t.form.elements.cc;
      if (ccSel && ccSel.value !== 'CH') return;
      var pos = t.selectionStart, atEnd = pos === t.value.length;
      var before = t.value.slice(0, pos).replace(/\D/g, '').length;
      var fmt = formatPhoneTyping(t.value);
      if (fmt === t.value) return;
      t.value = fmt; S.drafts[t.dataset.keep] = fmt;
      if (atEnd) pos = fmt.length;
      else { var c = 0; pos = 0; while (pos < fmt.length && c < before) { if (/\d/.test(fmt.charAt(pos))) c++; pos++; } }
      try { t.setSelectionRange(pos, pos); } catch (x) { /* ignorieren */ }
    }
  });
  // Enter sendet im Chat (am Computer); Umschalt+Enter macht einen Zeilenumbruch
  document.addEventListener('keydown', function (e) {
    var t = e.target;
    if (!t || !t.dataset || t.dataset.keep !== 'chat' || e.key !== 'Enter' || e.shiftKey || e.isComposing) return;
    if ('ontouchstart' in window) return;
    e.preventDefault();
    sendChat(t.value);
  });
  // Der Senden-Knopf nimmt dem Eingabefeld den Fokus nicht weg (Tastatur bleibt offen)
  document.addEventListener('mousedown', function (e) { if (e.target.closest && e.target.closest('.sendbtn, .chip')) e.preventDefault(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && S.pick && !$('dlg')) { S.pick = null; render(); }
  });

  /* ---------- Installation & Start ---------- */
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault(); installPrompt = e;
    if (S.step === 'app' && S.tab === 'profile') softRender();
  });
  if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () { /* ignorieren */ }); });
  }

  async function init() {
    document.documentElement.lang = LANG_HTML[lang];
    if (!sb) { S.step = 'setup'; render(); return; }
    render();
    try {
      var res = await sb.auth.getSession();
      if (res.data && res.data.session) await enter(res.data.session);
      else { S.step = 'login'; render(); }
    } catch (e) { console.error(e); S.step = 'login'; render(); }
    sb.auth.onAuthStateChange(function (event) {
      if (event === 'SIGNED_OUT' && S.step === 'app') { S = freshState(); S.step = 'login'; render(); }
    });
  }
  if (cfg.EXPOSE_TEST) window.__coaching = { makeTitle: makeTitle, normPhone: normPhone, fmtPhone: fmtPhone, defaultPin: defaultPin, phoneToEmail: phoneToEmail, DICT: DICT, planBot: planBot, state: function () { return S; } };
  init();
})();
