export interface Language {
  code: string;
  name: string;
  nativeName: string;
  script: string;
  bcp47: string;
  direction: "ltr" | "rtl";
}

/**
 * Complete configuration for all 22 Indian Scheduled Languages plus English.
 * Each entry includes the ISO 639 code, English name, native-script name,
 * script family, BCP 47 tag for the Web Speech API, and text direction.
 */
export const LANGUAGES: Language[] = [
  {
    code: "en",
    name: "English",
    nativeName: "English",
    script: "Latin",
    bcp47: "en-IN",
    direction: "ltr",
  },
  {
    code: "hi",
    name: "Hindi",
    nativeName: "हिन्दी",
    script: "Devanagari",
    bcp47: "hi-IN",
    direction: "ltr",
  },
  {
    code: "bn",
    name: "Bengali",
    nativeName: "বাংলা",
    script: "Bengali",
    bcp47: "bn-IN",
    direction: "ltr",
  },
  {
    code: "te",
    name: "Telugu",
    nativeName: "తెలుగు",
    script: "Telugu",
    bcp47: "te-IN",
    direction: "ltr",
  },
  {
    code: "mr",
    name: "Marathi",
    nativeName: "मराठी",
    script: "Devanagari",
    bcp47: "mr-IN",
    direction: "ltr",
  },
  {
    code: "ta",
    name: "Tamil",
    nativeName: "தமிழ்",
    script: "Tamil",
    bcp47: "ta-IN",
    direction: "ltr",
  },
  {
    code: "ur",
    name: "Urdu",
    nativeName: "اردو",
    script: "Arabic/Nastaliq",
    bcp47: "ur-IN",
    direction: "rtl",
  },
  {
    code: "gu",
    name: "Gujarati",
    nativeName: "ગુજરાતી",
    script: "Gujarati",
    bcp47: "gu-IN",
    direction: "ltr",
  },
  {
    code: "kn",
    name: "Kannada",
    nativeName: "ಕನ್ನಡ",
    script: "Kannada",
    bcp47: "kn-IN",
    direction: "ltr",
  },
  {
    code: "ml",
    name: "Malayalam",
    nativeName: "മലയാളം",
    script: "Malayalam",
    bcp47: "ml-IN",
    direction: "ltr",
  },
  {
    code: "or",
    name: "Odia",
    nativeName: "ଓଡ଼ିଆ",
    script: "Odia",
    bcp47: "or-IN",
    direction: "ltr",
  },
  {
    code: "pa",
    name: "Punjabi",
    nativeName: "ਪੰਜਾਬੀ",
    script: "Gurmukhi",
    bcp47: "pa-IN",
    direction: "ltr",
  },
  {
    code: "as",
    name: "Assamese",
    nativeName: "অসমীয়া",
    script: "Bengali",
    bcp47: "as-IN",
    direction: "ltr",
  },
  {
    code: "mai",
    name: "Maithili",
    nativeName: "मैथिली",
    script: "Devanagari",
    bcp47: "mai-IN",
    direction: "ltr",
  },
  {
    code: "sa",
    name: "Sanskrit",
    nativeName: "संस्कृतम्",
    script: "Devanagari",
    bcp47: "sa-IN",
    direction: "ltr",
  },
  {
    code: "ne",
    name: "Nepali",
    nativeName: "नेपाली",
    script: "Devanagari",
    bcp47: "ne-IN",
    direction: "ltr",
  },
  {
    code: "sd",
    name: "Sindhi",
    nativeName: "سنڌي",
    script: "Arabic",
    bcp47: "sd-IN",
    direction: "rtl",
  },
  {
    code: "ks",
    name: "Kashmiri",
    nativeName: "कॉशुर",
    script: "Arabic/Devanagari",
    bcp47: "ks-IN",
    direction: "rtl",
  },
  {
    code: "doi",
    name: "Dogri",
    nativeName: "डोगरी",
    script: "Devanagari",
    bcp47: "doi-IN",
    direction: "ltr",
  },
  {
    code: "kok",
    name: "Konkani",
    nativeName: "कोंकणी",
    script: "Devanagari",
    bcp47: "kok-IN",
    direction: "ltr",
  },
  {
    code: "sat",
    name: "Santali",
    nativeName: "ᱥᱟᱱᱛᱟᱲᱤ",
    script: "Ol Chiki",
    bcp47: "sat-IN",
    direction: "ltr",
  },
  {
    code: "mni",
    name: "Manipuri",
    nativeName: "মৈতৈলোন্",
    script: "Bengali",
    bcp47: "mni-IN",
    direction: "ltr",
  },
  {
    code: "brx",
    name: "Bodo",
    nativeName: "बड़ो",
    script: "Devanagari",
    bcp47: "brx-IN",
    direction: "ltr",
  },
];

/**
 * Pre-built lookup map for O(1) access by language code.
 */
const languageMap = new Map<string, Language>(
  LANGUAGES.map((lang) => [lang.code, lang])
);

/**
 * Returns the full Language object for a given ISO 639 code.
 * Returns undefined if the code is not found.
 */
export function getLanguageByCode(code: string): Language | undefined {
  return languageMap.get(code);
}

/**
 * Returns the English name of a language given its code.
 * Falls back to the code itself if not found.
 */
export function getLanguageName(code: string): string {
  return languageMap.get(code)?.name ?? code;
}

/**
 * Returns true if the language identified by the given code
 * uses a right-to-left script (Urdu, Sindhi, Kashmiri).
 * Defaults to false for unknown codes.
 */
export function isRTL(code: string): boolean {
  return languageMap.get(code)?.direction === "rtl";
}
