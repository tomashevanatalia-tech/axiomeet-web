/**
 * AxioMeet SPA — minimal i18n.
 *
 * Priority for initial language:
 *   1. `?lang=<code>` query param (landings pass this so visitors stay in
 *      the language they picked on axiomeet.io / axiomeet.ru).
 *   2. localStorage('axiomeet_lang').
 *   3. Fallback — Russian (historical default).
 *
 * Keep translations grouped by logical screen (auth.*, nav.*, …) so that
 * partial coverage is acceptable — missing keys fall back to Russian.
 */

export const SUPPORTED_LANGS = ['ru', 'en', 'de', 'es'];
const DEFAULT_LANG = 'ru';
const STORAGE_KEY = 'axiomeet_lang';

export const LANG_LABELS = {
  ru: 'RU',
  en: 'EN',
  de: 'DE',
  es: 'ES',
};

const DICT = {
  ru: {
    'auth.login.title': 'Добро пожаловать',
    'auth.login.subtitle': 'Войдите в AxioMeet для управления встречами',
    'auth.email': 'Email',
    'auth.password': 'Пароль',
    'auth.password.placeholder': '••••••••',
    'auth.login.submit': 'Войти',
    'auth.login.submitting': 'Вход...',
    'auth.login.error.default': 'Ошибка входа',
    'auth.login.footer': 'Нет аккаунта?',
    'auth.login.footer.link': 'Зарегистрируйтесь',
    'auth.register.title': 'Создайте аккаунт',
    'auth.register.subtitle': 'Начните анализировать встречи с AxioMeet',
    'auth.register.name': 'Ваше имя',
    'auth.register.name.placeholder': 'Иван Петров',
    'auth.register.org': 'Название компании',
    'auth.register.org.placeholder': 'Ромашка',
    'auth.register.email.placeholder': 'your@company.com',
    'auth.register.password.placeholder': 'Минимум 8 символов',
    'auth.register.password.short': 'Пароль должен содержать минимум 8 символов',
    'auth.register.submit': 'Создать аккаунт',
    'auth.register.submitting': 'Создание...',
    'auth.register.error.default': 'Ошибка регистрации',
    'auth.register.hint': 'Бесплатно: 3 часа обработки в месяц',
    'auth.register.footer': 'Уже есть аккаунт?',
    'auth.register.footer.link': 'Войти',
  },
  en: {
    'auth.login.title': 'Welcome back',
    'auth.login.subtitle': 'Sign in to AxioMeet to manage your meetings',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.password.placeholder': '••••••••',
    'auth.login.submit': 'Sign In',
    'auth.login.submitting': 'Signing in...',
    'auth.login.error.default': 'Sign-in error',
    'auth.login.footer': "Don't have an account?",
    'auth.login.footer.link': 'Sign up',
    'auth.register.title': 'Create an account',
    'auth.register.subtitle': 'Start analysing meetings with AxioMeet',
    'auth.register.name': 'Your name',
    'auth.register.name.placeholder': 'John Smith',
    'auth.register.org': 'Company name',
    'auth.register.org.placeholder': 'Acme Inc.',
    'auth.register.email.placeholder': 'your@company.com',
    'auth.register.password.placeholder': 'At least 8 characters',
    'auth.register.password.short': 'Password must be at least 8 characters',
    'auth.register.submit': 'Create account',
    'auth.register.submitting': 'Creating...',
    'auth.register.error.default': 'Registration error',
    'auth.register.hint': 'Free plan: 3 hours of processing per month',
    'auth.register.footer': 'Already have an account?',
    'auth.register.footer.link': 'Sign in',
  },
  de: {
    'auth.login.title': 'Willkommen zurück',
    'auth.login.subtitle': 'Melden Sie sich bei AxioMeet an, um Ihre Meetings zu verwalten',
    'auth.email': 'E-Mail',
    'auth.password': 'Passwort',
    'auth.password.placeholder': '••••••••',
    'auth.login.submit': 'Anmelden',
    'auth.login.submitting': 'Anmeldung...',
    'auth.login.error.default': 'Anmeldefehler',
    'auth.login.footer': 'Noch kein Konto?',
    'auth.login.footer.link': 'Registrieren',
    'auth.register.title': 'Konto erstellen',
    'auth.register.subtitle': 'Beginnen Sie, Meetings mit AxioMeet zu analysieren',
    'auth.register.name': 'Ihr Name',
    'auth.register.name.placeholder': 'Max Mustermann',
    'auth.register.org': 'Firmenname',
    'auth.register.org.placeholder': 'Beispiel GmbH',
    'auth.register.email.placeholder': 'ihre@firma.com',
    'auth.register.password.placeholder': 'Mindestens 8 Zeichen',
    'auth.register.password.short': 'Das Passwort muss mindestens 8 Zeichen lang sein',
    'auth.register.submit': 'Konto erstellen',
    'auth.register.submitting': 'Wird erstellt...',
    'auth.register.error.default': 'Registrierungsfehler',
    'auth.register.hint': 'Kostenlos: 3 Stunden Verarbeitung pro Monat',
    'auth.register.footer': 'Sie haben bereits ein Konto?',
    'auth.register.footer.link': 'Anmelden',
  },
  es: {
    'auth.login.title': 'Bienvenido de nuevo',
    'auth.login.subtitle': 'Inicie sesión en AxioMeet para gestionar sus reuniones',
    'auth.email': 'Correo electrónico',
    'auth.password': 'Contraseña',
    'auth.password.placeholder': '••••••••',
    'auth.login.submit': 'Iniciar sesión',
    'auth.login.submitting': 'Iniciando...',
    'auth.login.error.default': 'Error de inicio de sesión',
    'auth.login.footer': '¿No tienes cuenta?',
    'auth.login.footer.link': 'Regístrate',
    'auth.register.title': 'Crear cuenta',
    'auth.register.subtitle': 'Comience a analizar reuniones con AxioMeet',
    'auth.register.name': 'Su nombre',
    'auth.register.name.placeholder': 'Juan García',
    'auth.register.org': 'Nombre de la empresa',
    'auth.register.org.placeholder': 'Acme S.L.',
    'auth.register.email.placeholder': 'su@empresa.com',
    'auth.register.password.placeholder': 'Al menos 8 caracteres',
    'auth.register.password.short': 'La contraseña debe tener al menos 8 caracteres',
    'auth.register.submit': 'Crear cuenta',
    'auth.register.submitting': 'Creando...',
    'auth.register.error.default': 'Error de registro',
    'auth.register.hint': 'Gratis: 3 horas de procesamiento al mes',
    'auth.register.footer': '¿Ya tienes cuenta?',
    'auth.register.footer.link': 'Iniciar sesión',
  },
};

function normalize(code) {
  if (!code) return null;
  const lower = code.toLowerCase().slice(0, 2);
  return SUPPORTED_LANGS.includes(lower) ? lower : null;
}

export function detectInitialLang() {
  try {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = normalize(params.get('lang'));
    if (fromQuery) {
      localStorage.setItem(STORAGE_KEY, fromQuery);
      return fromQuery;
    }
    const stored = normalize(localStorage.getItem(STORAGE_KEY));
    if (stored) return stored;
    const fromBrowser = normalize(navigator.language || navigator.userLanguage);
    if (fromBrowser) return fromBrowser;
  } catch {
    /* SSR or sandbox — fall through */
  }
  return DEFAULT_LANG;
}

export function persistLang(lang) {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* ignore */
  }
}

export function translate(lang, key) {
  const table = DICT[lang] || DICT[DEFAULT_LANG];
  return table[key] ?? DICT[DEFAULT_LANG][key] ?? key;
}
