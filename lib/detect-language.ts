const SCRIPT_LANGUAGES: Array<{ pattern: RegExp; language: string }> = [
  { pattern: /[\u3040-\u30FF\u31F0-\u31FF]/u, language: "ja-JP" },
  { pattern: /[\uAC00-\uD7AF\u1100-\u11FF]/u, language: "ko-KR" },
  { pattern: /[\u4E00-\u9FFF\u3400-\u4DBF]/u, language: "zh-CN" },
  { pattern: /[\u0B80-\u0BFF]/u, language: "ta-IN" },
  { pattern: /[\u0C00-\u0C7F]/u, language: "te-IN" },
  { pattern: /[\u0C80-\u0CFF]/u, language: "kn-IN" },
  { pattern: /[\u0D00-\u0D7F]/u, language: "ml-IN" },
  { pattern: /[\u0980-\u09FF]/u, language: "bn-IN" },
  { pattern: /[\u0A00-\u0A7F]/u, language: "pa-IN" },
  { pattern: /[\u0A80-\u0AFF]/u, language: "gu-IN" },
  { pattern: /[\u0B00-\u0B7F]/u, language: "or-IN" },
  { pattern: /[\u0D80-\u0DFF]/u, language: "si-LK" },
  { pattern: /[\u0900-\u097F]/u, language: "hi-IN" },
  { pattern: /[\u0E00-\u0E7F]/u, language: "th-TH" },
  { pattern: /[\u0E80-\u0EFF]/u, language: "lo-LA" },
  { pattern: /[\u1780-\u17FF]/u, language: "km-KH" },
  { pattern: /[\u1000-\u109F]/u, language: "my-MM" },
  { pattern: /[\u0590-\u05FF]/u, language: "he-IL" },
  { pattern: /[\u0600-\u06FF\u0750-\u077F]/u, language: "ar-SA" },
  { pattern: /[\u1200-\u137F]/u, language: "am-ET" },
  { pattern: /[\u0370-\u03FF\u1F00-\u1FFF]/u, language: "el-GR" },
  { pattern: /[\u0530-\u058F]/u, language: "hy-AM" },
  { pattern: /[\u10A0-\u10FF]/u, language: "ka-GE" },
  { pattern: /[\u0400-\u04FF]/u, language: "ru-RU" },
  { pattern: /[\u0F00-\u0FFF]/u, language: "bo-CN" },
  { pattern: /[\u1800-\u18AF]/u, language: "mn-MN" },
];

const LATIN_HINTS: Array<{ pattern: RegExp; language: string }> = [
  {
    pattern:
      /[ăâđêôơưĂÂĐÊÔƠƯ]|[àáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵ]/u,
    language: "vi-VN",
  },
  { pattern: /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/u, language: "pl-PL" },
  { pattern: /[ğışĞİŞ]/u, language: "tr-TR" },
  { pattern: /[äöüßÄÖÜ]/u, language: "de-DE" },
  { pattern: /[ñÑ¿¡]/u, language: "es-ES" },
  { pattern: /[ãõÃÕ]/u, language: "pt-BR" },
  { pattern: /[æøåÆØÅ]/u, language: "da-DK" },
  { pattern: /[ăâîșțĂÂÎȘȚ]/u, language: "ro-RO" },
  { pattern: /[àâæçéèêëïîôùûüÿœÀÂÆÇÉÈÊËÏÎÔÙÛÜŸŒ]/u, language: "fr-FR" },
  { pattern: /[àèéìíîòóùúÀÈÉÌÍÎÒÓÙÚ]/u, language: "it-IT" },
  { pattern: /[čďěňřšťůžČĎĚŇŘŠŤŮŽ]/u, language: "cs-CZ" },
  { pattern: /[áéíóöőúüűÁÉÍÓÖŐÚÜŰ]/u, language: "hu-HU" },
  { pattern: /[ďľĺňŕšťýžĎĽĹŇŔŠŤÝŽ]/u, language: "sk-SK" },
  { pattern: /[ćčđšžĆČĐŠŽ]/u, language: "hr-HR" },
  { pattern: /[åäöÅÄÖ]/u, language: "sv-SE" },
];

export function detectLanguage(text: string) {
  for (const { pattern, language } of SCRIPT_LANGUAGES) {
    if (pattern.test(text)) return language;
  }
  for (const { pattern, language } of LATIN_HINTS) {
    if (pattern.test(text)) return language;
  }
  return "en-US";
}

/** One language per paragraph. Any regional script present wins over English. */
export function detectParagraphLanguage(text: string) {
  return detectLanguage(text);
}
