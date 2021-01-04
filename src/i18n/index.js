import {
  enUS,
  ja,
  es,
  de,
  ptBR,
  fr,
  id,
  pl,
  fi,
  it,
  cs,
  bn,
  hi,
  uk,
  zhTW,
  arSA,
  ru,
  th,
  faIR,
} from "date-fns/locale";

// Add new languages and their emoji flag here. Make sure the array indices line up.
export const LANGUAGES = [
  "en",
  "ja",
  "id",
  "cs",
  "de",
  "es",
  "fr",
  "it",
  "pl",
  "pt",
  "fi",
  "bn",
  "hi",
  "uk",
  "zh",
  "ar",
  "ru",
  "th",
  "fa",
];
export const LANGUAGE_NAMES = [
  "English",
  "日本語",
  "Bahasa Indonesia",
  "Čeština",
  "Deutsch",
  "Español",
  "Français",
  "Italiano",
  "Polski",
  "Português",
  "Suomi",
  "বাংলা",
  "हिंदी",
  "Українська",
  "中文 (繁體)",
  "العربية",
  "Русский",
  "ภาษาไทย",
  "فارسی",
];

// Add locales for date-fns here. Make sure the keys match the languages in LANGUAGES.
export const LOCALES = {
  en: enUS,
  ja: ja,
  es: es,
  de: de,
  pt: ptBR,
  fr: fr,
  id: id,
  pl: pl,
  it: it,
  fi: fi,
  cs: cs,
  bn: bn,
  hi: hi,
  uk: uk,
  zh: zhTW,
  ar: arSA,
  ru: ru,
  th: th,
  fa: faIR,
};

const generateExport = () => {
  const resources = {};
  for (const language of LANGUAGES) {
    resources[language] = {
      translation: require(`./${language}.json`),
    };
  }
  return resources;
};

export const maybeIntlNumberFormat = (lang) => {
  if (window.Intl && window.Intl.NumberFormat) {
    return window.Intl.NumberFormat(lang).format;
  }
  return (o) => {
    return "" + o;
  };
};

export default generateExport();
