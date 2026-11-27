import type { SupportedLanguage, SupportedScript, TranslationQualityStatus } from "../../../packages/shared/src/types/notice";

export const I18N_NAMESPACES = [
  "common",
  "dashboard",
  "students",
  "assessments",
  "learning-gaps",
  "remedial-plans",
  "activities",
  "progress",
  "reports",
  "parent-bridge",
  "settings",
  "tutorial",
] as const;

export type I18nNamespace = (typeof I18N_NAMESPACES)[number];

export interface ScriptVariant {
  script: SupportedScript;
  label: string;
  nativeLabel: string;
  dir: "ltr" | "rtl";
  googleFontFamily?: string;
  fontVariable: string;
  fontStack: string;
  numberingSystem: string;
}

export interface LanguageConfig {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  region: "Global" | "North" | "West" | "East" | "South" | "Northeast" | "Classical";
  defaultScript: SupportedScript;
  scriptVariants: ScriptVariant[];
  dir: "ltr" | "rtl";
  bcp47: string;
  numberingSystem: string;
  isScheduledIndianLanguage: boolean;
  supportStage: "verified" | "partial" | "framework_ready";
  defaultQualityStatus: TranslationQualityStatus;
  aiTier: "high" | "moderate" | "limited";
  searchAliases: string[];
}

const SCRIPT_FONTS: Record<
  SupportedScript,
  { googleFontFamily?: string; fontVariable: string; fontStack: string; numberingSystem: string; dir: "ltr" | "rtl" }
> = {
  Latn: {
    fontVariable: "--font-latin",
    fontStack: "'Lexend', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    numberingSystem: "latn",
    dir: "ltr",
  },
  Deva: {
    googleFontFamily: "Noto+Sans+Devanagari:wght@400;500;600;700",
    fontVariable: "--font-devanagari",
    fontStack: "'Noto Sans Devanagari', 'Lexend', 'Inter', sans-serif",
    numberingSystem: "deva",
    dir: "ltr",
  },
  Gujr: {
    googleFontFamily: "Noto+Sans+Gujarati:wght@400;500;600;700",
    fontVariable: "--font-gujarati",
    fontStack: "'Noto Sans Gujarati', 'Lexend', 'Inter', sans-serif",
    numberingSystem: "gujr",
    dir: "ltr",
  },
  Beng: {
    googleFontFamily: "Noto+Sans+Bengali:wght@400;500;600;700",
    fontVariable: "--font-bengali",
    fontStack: "'Noto Sans Bengali', 'Lexend', 'Inter', sans-serif",
    numberingSystem: "beng",
    dir: "ltr",
  },
  Guru: {
    googleFontFamily: "Noto+Sans+Gurmukhi:wght@400;500;600;700",
    fontVariable: "--font-gurmukhi",
    fontStack: "'Noto Sans Gurmukhi', 'Lexend', 'Inter', sans-serif",
    numberingSystem: "guru",
    dir: "ltr",
  },
  Orya: {
    googleFontFamily: "Noto+Sans+Oriya:wght@400;500;600;700",
    fontVariable: "--font-odia",
    fontStack: "'Noto Sans Oriya', 'Lexend', 'Inter', sans-serif",
    numberingSystem: "orya",
    dir: "ltr",
  },
  Taml: {
    googleFontFamily: "Noto+Sans+Tamil:wght@400;500;600;700",
    fontVariable: "--font-tamil",
    fontStack: "'Noto Sans Tamil', 'Lexend', 'Inter', sans-serif",
    numberingSystem: "tamldec",
    dir: "ltr",
  },
  Telu: {
    googleFontFamily: "Noto+Sans+Telugu:wght@400;500;600;700",
    fontVariable: "--font-telugu",
    fontStack: "'Noto Sans Telugu', 'Lexend', 'Inter', sans-serif",
    numberingSystem: "telu",
    dir: "ltr",
  },
  Knda: {
    googleFontFamily: "Noto+Sans+Kannada:wght@400;500;600;700",
    fontVariable: "--font-kannada",
    fontStack: "'Noto Sans Kannada', 'Lexend', 'Inter', sans-serif",
    numberingSystem: "knda",
    dir: "ltr",
  },
  Mlym: {
    googleFontFamily: "Noto+Sans+Malayalam:wght@400;500;600;700",
    fontVariable: "--font-malayalam",
    fontStack: "'Noto Sans Malayalam', 'Lexend', 'Inter', sans-serif",
    numberingSystem: "mlym",
    dir: "ltr",
  },
  Arab: {
    googleFontFamily: "Noto+Nastaliq+Urdu:wght@400;500;600;700&family=Noto+Naskh+Arabic:wght@400;500;600;700",
    fontVariable: "--font-arabic-rtl",
    fontStack: "'Noto Nastaliq Urdu', 'Noto Naskh Arabic', Tahoma, sans-serif",
    numberingSystem: "arabext",
    dir: "rtl",
  },
  Mtei: {
    googleFontFamily: "Noto+Sans+Meetei+Mayek:wght@400;500;600;700",
    fontVariable: "--font-meetei",
    fontStack: "'Noto Sans Meetei Mayek', 'Noto Sans Bengali', 'Lexend', sans-serif",
    numberingSystem: "latn",
    dir: "ltr",
  },
  Olck: {
    googleFontFamily: "Noto+Sans+Ol+Chiki:wght@400;500;600;700",
    fontVariable: "--font-olchiki",
    fontStack: "'Noto Sans Ol Chiki', 'Noto Sans Devanagari', 'Lexend', sans-serif",
    numberingSystem: "latn",
    dir: "ltr",
  },
};

function variant(script: SupportedScript, label: string, nativeLabel: string): ScriptVariant {
  const cfg = SCRIPT_FONTS[script];
  return {
    script,
    label,
    nativeLabel,
    dir: cfg.dir,
    googleFontFamily: cfg.googleFontFamily,
    fontVariable: cfg.fontVariable,
    fontStack: cfg.fontStack,
    numberingSystem: cfg.numberingSystem,
  };
}

export const LANGUAGE_REGISTRY: Record<SupportedLanguage, LanguageConfig> = {
  en: {
    code: "en",
    name: "English",
    nativeName: "English",
    region: "Global",
    defaultScript: "Latn",
    scriptVariants: [variant("Latn", "Latin", "English")],
    dir: "ltr",
    bcp47: "en-IN",
    numberingSystem: "latn",
    isScheduledIndianLanguage: false,
    supportStage: "verified",
    defaultQualityStatus: "Approved",
    aiTier: "high",
    searchAliases: ["english", "ingreji", "en"],
  },
  hi: {
    code: "hi",
    name: "Hindi",
    nativeName: "हिन्दी",
    region: "North",
    defaultScript: "Deva",
    scriptVariants: [variant("Deva", "Devanagari", "देवनागरी")],
    dir: "ltr",
    bcp47: "hi-IN",
    numberingSystem: "deva",
    isScheduledIndianLanguage: true,
    supportStage: "framework_ready",
    defaultQualityStatus: "Machine Draft",
    aiTier: "high",
    searchAliases: ["hindi", "हिन्दी", "हिंदी", "devanagari", "hi"],
  },
  gu: {
    code: "gu",
    name: "Gujarati",
    nativeName: "ગુજરાતી",
    region: "West",
    defaultScript: "Gujr",
    scriptVariants: [variant("Gujr", "Gujarati", "ગુજરાતી")],
    dir: "ltr",
    bcp47: "gu-IN",
    numberingSystem: "gujr",
    isScheduledIndianLanguage: true,
    supportStage: "verified",
    defaultQualityStatus: "Reviewed",
    aiTier: "high",
    searchAliases: ["gujarati", "ગુજરાતી", "guj", "gu"],
  },
  mr: {
    code: "mr",
    name: "Marathi",
    nativeName: "मराठी",
    region: "West",
    defaultScript: "Deva",
    scriptVariants: [variant("Deva", "Devanagari", "देवनागरी")],
    dir: "ltr",
    bcp47: "mr-IN",
    numberingSystem: "deva",
    isScheduledIndianLanguage: true,
    supportStage: "framework_ready",
    defaultQualityStatus: "Machine Draft",
    aiTier: "high",
    searchAliases: ["marathi", "मराठी", "mr"],
  },
  bn: {
    code: "bn",
    name: "Bengali",
    nativeName: "বাংলা",
    region: "East",
    defaultScript: "Beng",
    scriptVariants: [variant("Beng", "Bengali", "বাংলা")],
    dir: "ltr",
    bcp47: "bn-IN",
    numberingSystem: "beng",
    isScheduledIndianLanguage: true,
    supportStage: "framework_ready",
    defaultQualityStatus: "Machine Draft",
    aiTier: "high",
    searchAliases: ["bengali", "bangla", "বাংলা", "bn"],
  },
  pa: {
    code: "pa",
    name: "Punjabi",
    nativeName: "ਪੰਜਾਬੀ",
    region: "North",
    defaultScript: "Guru",
    scriptVariants: [
      variant("Guru", "Gurmukhi", "ਗੁਰਮੁਖੀ"),
      variant("Arab", "Shahmukhi", "شاہ مکھی"),
    ],
    dir: "ltr",
    bcp47: "pa-IN",
    numberingSystem: "guru",
    isScheduledIndianLanguage: true,
    supportStage: "framework_ready",
    defaultQualityStatus: "Machine Draft",
    aiTier: "moderate",
    searchAliases: ["punjabi", "panjabi", "ਪੰਜਾਬੀ", "gurmukhi", "shahmukhi", "pa"],
  },
  ta: {
    code: "ta",
    name: "Tamil",
    nativeName: "தமிழ்",
    region: "South",
    defaultScript: "Taml",
    scriptVariants: [variant("Taml", "Tamil", "தமிழ்")],
    dir: "ltr",
    bcp47: "ta-IN",
    numberingSystem: "tamldec",
    isScheduledIndianLanguage: true,
    supportStage: "framework_ready",
    defaultQualityStatus: "Machine Draft",
    aiTier: "high",
    searchAliases: ["tamil", "தமிழ்", "tamizh", "ta"],
  },
  te: {
    code: "te",
    name: "Telugu",
    nativeName: "తెలుగు",
    region: "South",
    defaultScript: "Telu",
    scriptVariants: [variant("Telu", "Telugu", "తెలుగు")],
    dir: "ltr",
    bcp47: "te-IN",
    numberingSystem: "telu",
    isScheduledIndianLanguage: true,
    supportStage: "framework_ready",
    defaultQualityStatus: "Machine Draft",
    aiTier: "high",
    searchAliases: ["telugu", "తెలుగు", "te"],
  },
  kn: {
    code: "kn",
    name: "Kannada",
    nativeName: "ಕನ್ನಡ",
    region: "South",
    defaultScript: "Knda",
    scriptVariants: [variant("Knda", "Kannada", "ಕನ್ನಡ")],
    dir: "ltr",
    bcp47: "kn-IN",
    numberingSystem: "knda",
    isScheduledIndianLanguage: true,
    supportStage: "framework_ready",
    defaultQualityStatus: "Machine Draft",
    aiTier: "high",
    searchAliases: ["kannada", "ಕನ್ನಡ", "kn"],
  },
  ml: {
    code: "ml",
    name: "Malayalam",
    nativeName: "മലയാളം",
    region: "South",
    defaultScript: "Mlym",
    scriptVariants: [variant("Mlym", "Malayalam", "മലയാളം")],
    dir: "ltr",
    bcp47: "ml-IN",
    numberingSystem: "mlym",
    isScheduledIndianLanguage: true,
    supportStage: "framework_ready",
    defaultQualityStatus: "Machine Draft",
    aiTier: "high",
    searchAliases: ["malayalam", "മലയാളം", "ml"],
  },
  as: {
    code: "as",
    name: "Assamese",
    nativeName: "অসমীয়া",
    region: "Northeast",
    defaultScript: "Beng",
    scriptVariants: [variant("Beng", "Bengali-Assamese", "অসমীয়া")],
    dir: "ltr",
    bcp47: "as-IN",
    numberingSystem: "beng",
    isScheduledIndianLanguage: true,
    supportStage: "framework_ready",
    defaultQualityStatus: "Machine Draft",
    aiTier: "moderate",
    searchAliases: ["assamese", "oxomiya", "অসমীয়া", "as"],
  },
  or: {
    code: "or",
    name: "Odia",
    nativeName: "ଓଡ଼ିଆ",
    region: "East",
    defaultScript: "Orya",
    scriptVariants: [variant("Orya", "Odia", "ଓଡ଼ିଆ")],
    dir: "ltr",
    bcp47: "or-IN",
    numberingSystem: "orya",
    isScheduledIndianLanguage: true,
    supportStage: "framework_ready",
    defaultQualityStatus: "Machine Draft",
    aiTier: "moderate",
    searchAliases: ["odia", "oriya", "ଓଡ଼ିଆ", "or"],
  },
  ur: {
    code: "ur",
    name: "Urdu",
    nativeName: "اردو",
    region: "North",
    defaultScript: "Arab",
    scriptVariants: [variant("Arab", "Perso-Arabic (Nastaliq)", "نستعلیق")],
    dir: "rtl",
    bcp47: "ur-IN",
    numberingSystem: "arabext",
    isScheduledIndianLanguage: true,
    supportStage: "framework_ready",
    defaultQualityStatus: "Machine Draft",
    aiTier: "high",
    searchAliases: ["urdu", "اردو", "nastaliq", "rtl", "ur"],
  },
  sa: {
    code: "sa",
    name: "Sanskrit",
    nativeName: "संस्कृतम्",
    region: "Classical",
    defaultScript: "Deva",
    scriptVariants: [variant("Deva", "Devanagari", "देवनागरी")],
    dir: "ltr",
    bcp47: "sa-IN",
    numberingSystem: "deva",
    isScheduledIndianLanguage: true,
    supportStage: "framework_ready",
    defaultQualityStatus: "Machine Draft",
    aiTier: "moderate",
    searchAliases: ["sanskrit", "संस्कृतम्", "संस्कृत", "sa"],
  },
  ks: {
    code: "ks",
    name: "Kashmiri",
    nativeName: "کٲشُر",
    region: "North",
    defaultScript: "Arab",
    scriptVariants: [
      variant("Arab", "Perso-Arabic", "کٲشُر"),
      variant("Deva", "Devanagari", "कॉशुर"),
    ],
    dir: "rtl",
    bcp47: "ks-IN",
    numberingSystem: "arabext",
    isScheduledIndianLanguage: true,
    supportStage: "framework_ready",
    defaultQualityStatus: "Machine Draft",
    aiTier: "limited",
    searchAliases: ["kashmiri", "koshur", "کٲشُر", "कॉशुर", "ks"],
  },
  kok: {
    code: "kok",
    name: "Konkani",
    nativeName: "कोंकणी",
    region: "West",
    defaultScript: "Deva",
    scriptVariants: [
      variant("Deva", "Devanagari", "देवनागरी"),
      variant("Latn", "Roman (Latin)", "Romi"),
    ],
    dir: "ltr",
    bcp47: "kok-IN",
    numberingSystem: "deva",
    isScheduledIndianLanguage: true,
    supportStage: "framework_ready",
    defaultQualityStatus: "Machine Draft",
    aiTier: "limited",
    searchAliases: ["konkani", "कोंकणी", "kok"],
  },
  mai: {
    code: "mai",
    name: "Maithili",
    nativeName: "मैथिली",
    region: "East",
    defaultScript: "Deva",
    scriptVariants: [variant("Deva", "Devanagari", "देवनागरी")],
    dir: "ltr",
    bcp47: "mai-IN",
    numberingSystem: "deva",
    isScheduledIndianLanguage: true,
    supportStage: "framework_ready",
    defaultQualityStatus: "Machine Draft",
    aiTier: "limited",
    searchAliases: ["maithili", "मैथिली", "mai"],
  },
  mni: {
    code: "mni",
    name: "Manipuri",
    nativeName: "মৈতৈলোন",
    region: "Northeast",
    defaultScript: "Beng",
    scriptVariants: [
      variant("Beng", "Bengali", "মৈতৈলোন"),
      variant("Mtei", "Meetei Mayek", "ꯃꯩꯇꯩꯂꯣꯟ"),
    ],
    dir: "ltr",
    bcp47: "mni-IN",
    numberingSystem: "beng",
    isScheduledIndianLanguage: true,
    supportStage: "framework_ready",
    defaultQualityStatus: "Machine Draft",
    aiTier: "limited",
    searchAliases: ["manipuri", "meitei", "মৈতৈলোন", "ꯃꯩꯇꯩꯂꯣꯟ", "mni"],
  },
  ne: {
    code: "ne",
    name: "Nepali",
    nativeName: "नेपाली",
    region: "Northeast",
    defaultScript: "Deva",
    scriptVariants: [variant("Deva", "Devanagari", "देवनागरी")],
    dir: "ltr",
    bcp47: "ne-IN",
    numberingSystem: "deva",
    isScheduledIndianLanguage: true,
    supportStage: "framework_ready",
    defaultQualityStatus: "Machine Draft",
    aiTier: "moderate",
    searchAliases: ["nepali", "नेपाली", "ne"],
  },
  sd: {
    code: "sd",
    name: "Sindhi",
    nativeName: "سنڌي",
    region: "West",
    defaultScript: "Arab",
    scriptVariants: [
      variant("Arab", "Perso-Arabic", "سنڌي"),
      variant("Deva", "Devanagari", "सिंधी"),
    ],
    dir: "rtl",
    bcp47: "sd-IN",
    numberingSystem: "arabext",
    isScheduledIndianLanguage: true,
    supportStage: "framework_ready",
    defaultQualityStatus: "Machine Draft",
    aiTier: "limited",
    searchAliases: ["sindhi", "سنڌي", "सिंधी", "sd"],
  },
  brx: {
    code: "brx",
    name: "Bodo",
    nativeName: "बड़ो",
    region: "Northeast",
    defaultScript: "Deva",
    scriptVariants: [variant("Deva", "Devanagari", "देवनागरी")],
    dir: "ltr",
    bcp47: "brx-IN",
    numberingSystem: "deva",
    isScheduledIndianLanguage: true,
    supportStage: "framework_ready",
    defaultQualityStatus: "Machine Draft",
    aiTier: "limited",
    searchAliases: ["bodo", "boro", "बड़ो", "बर'", "brx"],
  },
  doi: {
    code: "doi",
    name: "Dogri",
    nativeName: "डोगरी",
    region: "North",
    defaultScript: "Deva",
    scriptVariants: [variant("Deva", "Devanagari", "देवनागरी")],
    dir: "ltr",
    bcp47: "doi-IN",
    numberingSystem: "deva",
    isScheduledIndianLanguage: true,
    supportStage: "framework_ready",
    defaultQualityStatus: "Machine Draft",
    aiTier: "limited",
    searchAliases: ["dogri", "डोगरी", "doi"],
  },
  sat: {
    code: "sat",
    name: "Santali",
    nativeName: "ᱥᱟᱱᱛᱟᱲᱤ",
    region: "East",
    defaultScript: "Olck",
    scriptVariants: [
      variant("Olck", "Ol Chiki", "ᱥᱟᱱᱛᱟᱲᱤ"),
      variant("Deva", "Devanagari", "संताली"),
    ],
    dir: "ltr",
    bcp47: "sat-IN",
    numberingSystem: "latn",
    isScheduledIndianLanguage: true,
    supportStage: "framework_ready",
    defaultQualityStatus: "Machine Draft",
    aiTier: "limited",
    searchAliases: ["santali", "santhali", "ᱥᱟᱱᱛᱟᱲᱤ", "ol chiki", "sat"],
  },
};

export const ALL_LANGUAGES: LanguageConfig[] = Object.values(LANGUAGE_REGISTRY);

export const SCHEDULED_INDIAN_LANGUAGES: LanguageConfig[] = ALL_LANGUAGES.filter(
  (l) => l.isScheduledIndianLanguage
);

export function isValidLanguageCode(code: unknown): code is SupportedLanguage {
  return typeof code === "string" && code in LANGUAGE_REGISTRY;
}

export function getLanguageMeta(code?: string | null): LanguageConfig {
  if (code && isValidLanguageCode(code)) {
    return LANGUAGE_REGISTRY[code];
  }
  return LANGUAGE_REGISTRY.en;
}

export function resolveEffectiveScript(
  langCode: SupportedLanguage,
  requestedScript?: string | null
): ScriptVariant {
  const meta = getLanguageMeta(langCode);
  if (requestedScript) {
    const matched = meta.scriptVariants.find((v) => v.script === requestedScript);
    if (matched) return matched;
  }
  return meta.scriptVariants[0] || SCRIPT_FONTS.Latn as unknown as ScriptVariant;
}

export function getDirection(langCode: SupportedLanguage, script?: SupportedScript | null): "ltr" | "rtl" {
  return resolveEffectiveScript(langCode, script).dir;
}

export function getScriptFontStack(langCode: SupportedLanguage, script?: SupportedScript | null): string {
  return resolveEffectiveScript(langCode, script).fontStack;
}

export function searchLanguages(query: string): LanguageConfig[] {
  const q = query.trim().normalize("NFC").toLowerCase();
  if (!q) return ALL_LANGUAGES;
  return ALL_LANGUAGES.filter((lang) => {
    if (lang.code.toLowerCase().includes(q)) return true;
    if (lang.name.toLowerCase().includes(q)) return true;
    if (lang.nativeName.normalize("NFC").toLowerCase().includes(q)) return true;
    if (lang.region.toLowerCase().includes(q)) return true;
    if (lang.scriptVariants.some((v) => v.label.toLowerCase().includes(q) || v.nativeLabel.toLowerCase().includes(q))) {
      return true;
    }
    return lang.searchAliases.some((a) => a.toLowerCase().includes(q));
  });
}
