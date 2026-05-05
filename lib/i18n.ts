export type Lang = 'en' | 'de';

export const translations = {
  en: {
    // Verify — General
    verify_label:       'Ticket Bot',
    verify_title:       'Verify your Server',
    verify_subtitle:    'Link your GitHub account and Discord server to receive your API key.',

    // Steps
    step_github:        'GitHub',
    step_discord:       'Discord',
    step_select:        'Select Server',
    step_done:          'Done',

    // Step 1 — GitHub
    github_title:       'Connect GitHub',
    github_desc:        'To check your sponsorship status, you need to sign in with GitHub.',
    github_btn:         'Sign in with GitHub',

    // Step 2 — Discord
    discord_title:      'Connect Discord',
    discord_signed_as:  'Signed in as',
    discord_desc:       'Connect your Discord account to see your servers.',
    discord_btn:        'Sign in with Discord',

    // Step 3 — Select Server
    select_title:       'Select Server',
    select_desc:        'Choose the Discord server you want to generate the API key for. You only see servers where you are an Administrator.',
    select_warning:     'If you have already verified this server, your current API key will become invalid immediately. You must update the key in your bot\'s .env and restart it.',
    select_no_guilds:   'No servers found where you are an Administrator.',
    select_btn:         'Generate API Key',
    select_btn_loading: 'Processing...',

    // Step 4 — Done
    done_title:         'Verification complete!',
    done_tier:          'Your tier:',
    done_instruction:   'Add the API key to your bot\'s',
    done_warning:       '⚠️ Never share this key. Anyone who has it can upload transcripts on your behalf.',
    done_close:         '✅ You can close this page once you have safely copied the key.',
    done_copy:          'Copy',
    done_copied:        'Copied!',
    done_docs:          'Documentation',
    done_dashboard:     'Go to Dashboard (Custom Domain)',

    // Errors
    err_invalid_state:        'Security check failed. Please try again.',
    err_github_token_failed:  'GitHub authentication failed. Please try again.',
    err_github_user_failed:   'Could not retrieve GitHub user data.',
    err_discord_token_failed: 'Discord authentication failed. Please try again.',
    err_discord_guilds_failed:'Could not retrieve Discord servers.',
    err_github_required:      'Please connect your GitHub account first.',
  },

  de: {
    // Verify — General
    verify_label:       'Ticket Bot',
    verify_title:       'Server verifizieren',
    verify_subtitle:    'Verknüpfe deinen GitHub-Account und Discord-Server um deinen API Key zu erhalten.',

    // Steps
    step_github:        'GitHub',
    step_discord:       'Discord',
    step_select:        'Server auswählen',
    step_done:          'Fertig',

    // Step 1 — GitHub
    github_title:       'GitHub verbinden',
    github_desc:        'Damit wir deinen Sponsoring-Status überprüfen können, musst du dich mit GitHub anmelden.',
    github_btn:         'Mit GitHub anmelden',

    // Step 2 — Discord
    discord_title:      'Discord verbinden',
    discord_signed_as:  'Angemeldet als',
    discord_desc:       'Verbinde nun deinen Discord-Account um deine Server zu sehen.',
    discord_btn:        'Mit Discord anmelden',

    // Step 3 — Select Server
    select_title:       'Server auswählen',
    select_desc:        'Wähle den Discord-Server für den du den API Key generieren möchtest. Du siehst nur Server auf denen du Administrator bist.',
    select_warning:     'Falls du diesen Server bereits verifiziert hast, wird dein bisheriger API Key sofort ungültig. Du musst den neuen Key in der .env deines Bots eintragen und ihn neu starten.',
    select_no_guilds:   'Keine Server gefunden auf denen du Administrator bist.',
    select_btn:         'API Key generieren',
    select_btn_loading: 'Wird verarbeitet...',

    // Step 4 — Done
    done_title:         'Verifizierung abgeschlossen!',
    done_tier:          'Dein Tier:',
    done_instruction:   'Trage den API Key in die',
    done_warning:       '⚠️ Teile diesen Key mit niemandem. Wer ihn kennt, kann Transkripte in deinem Namen hochladen.',
    done_close:         '✅ Du kannst diese Seite schließen, sobald du den Key sicher kopiert hast.',
    done_copy:          'Kopieren',
    done_copied:        'Kopiert!',
    done_docs:          'Zur Installationsanleitung',
    done_dashboard:     'Zum Dashboard (Eigene Domain)',

    // Errors
    err_invalid_state:        'Sicherheitsüberprüfung fehlgeschlagen. Bitte versuche es erneut.',
    err_github_token_failed:  'GitHub-Authentifizierung fehlgeschlagen. Bitte versuche es erneut.',
    err_github_user_failed:   'GitHub-Nutzerdaten konnten nicht abgerufen werden.',
    err_discord_token_failed: 'Discord-Authentifizierung fehlgeschlagen. Bitte versuche es erneut.',
    err_discord_guilds_failed:'Discord-Server konnten nicht abgerufen werden.',
    err_github_required:      'Bitte verbinde zuerst deinen GitHub-Account.',
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

// Dashboard translations
export const dashboardTranslations = {
  en: {
    label:            'Ticket Bot',
    title:            'Dashboard',
    server_id:        'Server ID:',
    upgrade:          'Upgrade →',
    domain_title:     'Custom Domain',
    domain_desc:      'Serve transcripts under your own domain — e.g.',
    domain_instead:   'instead of',
    no_premium:       'Custom domains are available from',
    no_premium_link:  'Premium (€5/month)',
    no_premium_link2: 'Upgrade now →',
    domain_placeholder: 'tickets.yourserver.com',
    domain_btn:       'Set',
    domain_btn_loading: 'Setting...',
    dns_title:        '📋 DNS Setup Required',
    dns_desc:         'Add the following A-Record at your domain registrar:',
    dns_type:         'Type',
    dns_name:         'Name',
    dns_target:       'Target (IP)',
    dns_note:         '⏱ DNS propagation can take up to 24 hours. Click "Check DNS" once done.',
    dns_check:        'Check DNS',
    dns_checking:     'Checking...',
    active_label:     'Active',
    pending_label:    'DNS Pending',
    remove_title:     'Remove domain',
    new_api_key:      'Generate new API key',
    docs:             'Documentation',
    tier_basic:       'Basic (Free)',
    tier_premium:     'Premium',
    tier_premium_plus:'Premium+',
  },
  de: {
    label:            'Ticket Bot',
    title:            'Dashboard',
    server_id:        'Server-ID:',
    upgrade:          'Upgrade →',
    domain_title:     'Eigene Domain',
    domain_desc:      'Transkripte unter deiner eigenen Domain abrufbar — z.B.',
    domain_instead:   'statt',
    no_premium:       'Eigene Domains sind ab',
    no_premium_link:  'Premium (5 €/Monat)',
    no_premium_link2: 'Jetzt upgraden →',
    domain_placeholder: 'tickets.deinserver.de',
    domain_btn:       'Setzen',
    domain_btn_loading: 'Wird gesetzt...',
    dns_title:        '📋 DNS-Einstellung erforderlich',
    dns_desc:         'Trage bei deinem Domain-Anbieter folgenden A-Record ein:',
    dns_type:         'Typ',
    dns_name:         'Name',
    dns_target:       'Ziel (IP)',
    dns_note:         '⏱ DNS-Änderungen können bis zu 24 Stunden dauern. Klicke danach auf „DNS prüfen".',
    dns_check:        'DNS prüfen',
    dns_checking:     'Wird geprüft...',
    active_label:     'Aktiv',
    pending_label:    'DNS ausstehend',
    remove_title:     'Domain entfernen',
    new_api_key:      'Neuen API Key generieren',
    docs:             'Dokumentation',
    tier_basic:       'Basic (Kostenlos)',
    tier_premium:     'Premium',
    tier_premium_plus:'Premium+',
  },
} as const;
