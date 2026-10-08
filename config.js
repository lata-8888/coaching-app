// Konfiguration der App (Umgebung: DEV).
// Die Werte findest du in Supabase unter «Project Settings» → «API».
// Der «anon public»-Schlüssel ist für den Einsatz im Browser gedacht und darf öffentlich sein.
// Den «service_role»-Schlüssel darfst du hier NIE eintragen.
// Steht hier «DEIN-PROJEKT», zeigt die App eine Einrichtungsseite.
window.APP_CONFIG = {
  SUPABASE_URL: 'https://ofdkpdmcfqnelqoaeshx.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_zht_zPGbarvvksrgM3uAzQ_UuCdskhD',

  // Name der App (Anmeldeseite, Titel)
  APP_NAME: 'Coaching',

  // Domain der intern verwendeten Login-Adressen (<Nummer ohne +>@<Domain>).
  // Muss zu den Adressen in auth.users passen; nach dem ersten Konto nicht mehr ändern.
  EMAIL_DOMAIN: 'phone-login.app'
};
