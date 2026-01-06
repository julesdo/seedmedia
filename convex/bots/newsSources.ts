/**
 * Sources RSS gratuites d'actualités par pays/langue
 * Mise à jour : Janvier 2026
 * Toutes ces sources sont gratuites et accessibles sans API key
 * 
 * CRITÈRES DE SÉLECTION :
 * - Objectivité et fact-checking
 * - Sources réputées pour leur neutralité
 * - Éviter les médias partisans, propagandistes ou trop idéologiques
 * - Privilégier agences de presse, médias publics, et sources académiques
 */

export interface NewsSource {
  url: string;
  source: string;
  country: string;
  language: string;
  category?: string; // politique, économie, général, fact-checking, académique
  reliability?: "high" | "medium" | "verified"; // Niveau de fiabilité
}

/**
 * Sources RSS par pays/langue
 */
export const newsSources: NewsSource[] = [
  // ===== AGENCES DE PRESSE (HAUTE FIABILITÉ) =====
  {
    url: "https://www.reuters.com/rssFeed/worldNews",
    source: "Reuters",
    country: "INT",
    language: "en",
    category: "général",
    reliability: "high",
  },
  {
    url: "https://www.reuters.com/rssFeed/topNews",
    source: "Reuters Top News",
    country: "INT",
    language: "en",
    category: "général",
    reliability: "high",
  },
  {
    url: "https://apnews.com/apf-topnews",
    source: "Associated Press",
    country: "US",
    language: "en",
    category: "général",
    reliability: "high",
  },
  {
    url: "https://www.afp.com/fr/actualites/rss",
    source: "Agence France-Presse",
    country: "FR",
    language: "fr",
    category: "général",
    reliability: "high",
  },
  {
    url: "https://www.afp.com/en/news/rss",
    source: "Agence France-Presse",
    country: "INT",
    language: "en",
    category: "général",
    reliability: "high",
  },
  {
    url: "https://www.dpa.de/rss",
    source: "Deutsche Presse-Agentur",
    country: "DE",
    language: "de",
    category: "général",
    reliability: "high",
  },
  {
    url: "https://www.ansa.it/sito/notizie/mondo/mondo_rss.xml",
    source: "ANSA",
    country: "IT",
    language: "it",
    category: "général",
    reliability: "high",
  },
  {
    url: "https://www.efe.com/rss",
    source: "EFE",
    country: "ES",
    language: "es",
    category: "général",
    reliability: "high",
  },

  // ===== FRANCE (SOURCES FACTUELLES) =====
  {
    url: "https://www.lemonde.fr/rss/une.xml",
    source: "Le Monde",
    country: "FR",
    language: "fr",
    category: "général",
    reliability: "medium",
  },
  {
    url: "https://www.francetvinfo.fr/titres.rss",
    source: "France Info",
    country: "FR",
    language: "fr",
    category: "général",
    reliability: "high",
  },
  {
    url: "https://www.lesechos.fr/rss.xml",
    source: "Les Echos",
    country: "FR",
    language: "fr",
    category: "économie",
    reliability: "medium",
  },
  {
    url: "https://www.france24.com/fr/rss",
    source: "France 24",
    country: "FR",
    language: "fr",
    category: "général",
    reliability: "high",
  },
  {
    url: "https://www.france24.com/en/rss",
    source: "France 24",
    country: "INT",
    language: "en",
    category: "général",
    reliability: "high",
  },
  {
    url: "https://www.rfi.fr/fr/rss",
    source: "RFI",
    country: "FR",
    language: "fr",
    category: "général",
    reliability: "high",
  },
  {
    url: "https://www.rfi.fr/en/rss",
    source: "RFI",
    country: "INT",
    language: "en",
    category: "général",
    reliability: "high",
  },
  {
    url: "https://www.courrierinternational.com/rss",
    source: "Courrier International",
    country: "FR",
    language: "fr",
    category: "général",
    reliability: "medium",
  },

  // ===== ROYAUME-UNI / ANGLETERRE (SOURCES FACTUELLES) =====
  {
    url: "https://feeds.bbci.co.uk/news/rss.xml",
    source: "BBC News",
    country: "GB",
    language: "en",
    category: "général",
    reliability: "high",
  },
  {
    url: "https://feeds.bbci.co.uk/news/world/rss.xml",
    source: "BBC World News",
    country: "INT",
    language: "en",
    category: "général",
    reliability: "high",
  },
  {
    url: "https://www.ft.com/rss",
    source: "Financial Times",
    country: "GB",
    language: "en",
    category: "économie",
    reliability: "high",
  },
  {
    url: "https://www.economist.com/rss",
    source: "The Economist",
    country: "GB",
    language: "en",
    category: "économie",
    reliability: "high",
  },
  {
    url: "https://www.theguardian.com/world/rss",
    source: "The Guardian",
    country: "GB",
    language: "en",
    category: "général",
    reliability: "medium",
  },
  {
    url: "https://www.independent.co.uk/rss",
    source: "The Independent",
    country: "GB",
    language: "en",
    category: "général",
    reliability: "medium",
  },

  // ===== ÉTATS-UNIS (SOURCES FACTUELLES) =====
  {
    url: "https://apnews.com/apf-topnews",
    source: "Associated Press",
    country: "US",
    language: "en",
    category: "général",
    reliability: "high",
  },
  {
    url: "https://feeds.npr.org/1001/rss.xml",
    source: "NPR",
    country: "US",
    language: "en",
    category: "général",
    reliability: "high",
  },
  {
    url: "https://www.pbs.org/newshour/feed",
    source: "PBS NewsHour",
    country: "US",
    language: "en",
    category: "général",
    reliability: "high",
  },
  {
    url: "https://www.wsj.com/xml/rss/3_7085.xml",
    source: "Wall Street Journal",
    country: "US",
    language: "en",
    category: "économie",
    reliability: "high",
  },
  {
    url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml",
    source: "New York Times",
    country: "US",
    language: "en",
    category: "général",
    reliability: "medium",
  },
  {
    url: "https://feeds.washingtonpost.com/rss/world",
    source: "Washington Post",
    country: "US",
    language: "en",
    category: "général",
    reliability: "medium",
  },
  {
    url: "https://feeds.abcnews.com/abcnews/topstories",
    source: "ABC News",
    country: "US",
    language: "en",
    category: "général",
    reliability: "medium",
  },
  {
    url: "https://feeds.nbcnews.com/nbcnews/public/world",
    source: "NBC News",
    country: "US",
    language: "en",
    category: "général",
    reliability: "medium",
  },
  {
    url: "https://www.cbsnews.com/latest/rss/main",
    source: "CBS News",
    country: "US",
    language: "en",
    category: "général",
    reliability: "medium",
  },
  {
    url: "https://www.usatoday.com/rss",
    source: "USA Today",
    country: "US",
    language: "en",
    category: "général",
    reliability: "medium",
  },

  // ===== ALLEMAGNE =====
  {
    url: "https://www.spiegel.de/international/index.rss",
    source: "Der Spiegel",
    country: "DE",
    language: "de",
    category: "général",
  },
  {
    url: "https://www.zeit.de/index",
    source: "Die Zeit",
    country: "DE",
    language: "de",
    category: "général",
  },
  {
    url: "https://www.faz.net/rss/aktuell/",
    source: "Frankfurter Allgemeine",
    country: "DE",
    language: "de",
    category: "général",
  },
  {
    url: "https://www.sueddeutsche.de/rss",
    source: "Süddeutsche Zeitung",
    country: "DE",
    language: "de",
    category: "général",
  },

  // ===== ESPAGNE =====
  {
    url: "https://elpais.com/rss/feed.html?feedId=1722725119222",
    source: "El País",
    country: "ES",
    language: "es",
    category: "général",
  },
  {
    url: "https://www.elmundo.es/rss/portada.xml",
    source: "El Mundo",
    country: "ES",
    language: "es",
    category: "général",
  },
  {
    url: "https://www.abc.es/rss/feeds/abcPortada.xml",
    source: "ABC",
    country: "ES",
    language: "es",
    category: "général",
  },
  {
    url: "https://www.lavanguardia.com/rss/home.xml",
    source: "La Vanguardia",
    country: "ES",
    language: "es",
    category: "général",
  },

  // ===== ITALIE =====
  {
    url: "https://www.repubblica.it/rss/homepage/rss2.0.xml",
    source: "La Repubblica",
    country: "IT",
    language: "it",
    category: "général",
  },
  {
    url: "https://www.corriere.it/rss/homepage.xml",
    source: "Corriere della Sera",
    country: "IT",
    language: "it",
    category: "général",
  },
  {
    url: "https://www.ansa.it/sito/notizie/mondo/mondo_rss.xml",
    source: "ANSA",
    country: "IT",
    language: "it",
    category: "général",
  },

  // ===== PORTUGAL =====
  {
    url: "https://feeds.feedburner.com/publico/rss",
    source: "Público",
    country: "PT",
    language: "pt",
    category: "général",
  },
  {
    url: "https://www.jn.pt/rss/ultimas.xml",
    source: "Jornal de Notícias",
    country: "PT",
    language: "pt",
    category: "général",
  },

  // ===== PAYS-BAS =====
  {
    url: "https://www.nrc.nl/rss/",
    source: "NRC Handelsblad",
    country: "NL",
    language: "nl",
    category: "général",
  },
  {
    url: "https://www.volkskrant.nl/nieuws-achtergrond/rss.xml",
    source: "de Volkskrant",
    country: "NL",
    language: "nl",
    category: "général",
  },

  // ===== BELGIQUE =====
  {
    url: "https://www.lesoir.be/rss.xml",
    source: "Le Soir",
    country: "BE",
    language: "fr",
    category: "général",
  },
  {
    url: "https://www.standaard.be/rss/section/1f2838d4-99ea-49f0-8802-16353cffb0f8",
    source: "De Standaard",
    country: "BE",
    language: "nl",
    category: "général",
  },

  // ===== SUISSE =====
  {
    url: "https://www.letemps.ch/rss.xml",
    source: "Le Temps",
    country: "CH",
    language: "fr",
    category: "général",
  },
  {
    url: "https://www.nzz.ch/international.rss",
    source: "Neue Zürcher Zeitung",
    country: "CH",
    language: "de",
    category: "général",
  },

  // ===== CANADA =====
  {
    url: "https://www.cbc.ca/cmlink/rss-world",
    source: "CBC News",
    country: "CA",
    language: "en",
    category: "général",
  },
  {
    url: "https://www.ledevoir.com/rss/actualite.xml",
    source: "Le Devoir",
    country: "CA",
    language: "fr",
    category: "général",
  },

  // ===== BRÉSIL =====
  {
    url: "https://feeds.folha.uol.com.br/mundo/rss091.xml",
    source: "Folha de S.Paulo",
    country: "BR",
    language: "pt",
    category: "général",
  },
  {
    url: "https://oglobo.globo.com/rss.xml",
    source: "O Globo",
    country: "BR",
    language: "pt",
    category: "général",
  },
  {
    url: "https://www.estadao.com.br/rss/politica",
    source: "Estadão",
    country: "BR",
    language: "pt",
    category: "général",
  },

  // ===== ARGENTINE =====
  {
    url: "https://www.clarin.com/rss/mundo/",
    source: "Clarín",
    country: "AR",
    language: "es",
    category: "général",
  },
  {
    url: "https://www.lanacion.com.ar/rss",
    source: "La Nación",
    country: "AR",
    language: "es",
    category: "général",
  },

  // ===== MEXIQUE =====
  {
    url: "https://www.jornada.com.mx/rss/ultimas.xml",
    source: "La Jornada",
    country: "MX",
    language: "es",
    category: "général",
  },
  {
    url: "https://www.eluniversal.com.mx/rss.xml",
    source: "El Universal",
    country: "MX",
    language: "es",
    category: "général",
  },

  // ===== JAPON =====
  {
    url: "https://www3.nhk.or.jp/rss/news/cat0.xml",
    source: "NHK",
    country: "JP",
    language: "ja",
    category: "général",
  },
  {
    url: "https://www.asahi.com/rss/asahi/newsheadlines.rdf",
    source: "Asahi Shimbun",
    country: "JP",
    language: "ja",
    category: "général",
  },

  // ===== CHINE =====
  {
    url: "https://www.bbc.com/zhongwen/simp/rss.xml",
    source: "BBC Chinese",
    country: "CN",
    language: "zh",
    category: "général",
  },

  // ===== INDE =====
  {
    url: "https://www.thehindu.com/news/international/feeder/default.rss",
    source: "The Hindu",
    country: "IN",
    language: "en",
    category: "général",
  },
  {
    url: "https://timesofindia.indiatimes.com/rssfeeds/296589292.cms",
    source: "Times of India",
    country: "IN",
    language: "en",
    category: "général",
  },

  // ===== AUSTRALIE =====
  {
    url: "https://www.abc.net.au/news/feed/45910/rss.xml",
    source: "ABC Australia",
    country: "AU",
    language: "en",
    category: "général",
  },
  {
    url: "https://www.theaustralian.com.au/rss",
    source: "The Australian",
    country: "AU",
    language: "en",
    category: "général",
  },

  // ===== AFRIQUE DU SUD =====
  {
    url: "https://www.news24.com/rss",
    source: "News24",
    country: "ZA",
    language: "en",
    category: "général",
  },

  // ===== RUSSIE =====
  {
    url: "https://www.bbc.com/russian/index.xml",
    source: "BBC Russian",
    country: "RU",
    language: "ru",
    category: "général",
  },

  // ===== TURQUIE =====
  {
    url: "https://www.hurriyet.com.tr/rss/gundem",
    source: "Hürriyet",
    country: "TR",
    language: "tr",
    category: "général",
  },

  // ===== ARABIE SAOUDITE / MONDE ARABE =====
  {
    url: "https://www.bbc.com/arabic/index.xml",
    source: "BBC Arabic",
    country: "SA",
    language: "ar",
    category: "général",
  },
  {
    url: "https://www.aljazeera.com/xml/rss/all.xml",
    source: "Al Jazeera",
    country: "QA",
    language: "ar",
    category: "général",
  },

  // ===== ISRAËL =====
  {
    url: "https://www.haaretz.com/rss",
    source: "Haaretz",
    country: "IL",
    language: "he",
    category: "général",
  },

  // ===== CORÉE DU SUD =====
  {
    url: "https://www.bbc.com/korean/rss.xml",
    source: "BBC Korean",
    country: "KR",
    language: "ko",
    category: "général",
  },

  // ===== VIETNAM =====
  {
    url: "https://www.bbc.com/vietnamese/rss.xml",
    source: "BBC Vietnamese",
    country: "VN",
    language: "vi",
    category: "général",
  },

  // ===== THAÏLANDE =====
  {
    url: "https://www.bbc.com/thai/rss.xml",
    source: "BBC Thai",
    country: "TH",
    language: "th",
    category: "général",
  },

  // ===== INDONÉSIE =====
  {
    url: "https://www.bbc.com/indonesia/rss.xml",
    source: "BBC Indonesian",
    country: "ID",
    language: "id",
    category: "général",
  },

  // ===== POLOGNE =====
  {
    url: "https://www.bbc.com/polish/rss.xml",
    source: "BBC Polish",
    country: "PL",
    language: "pl",
    category: "général",
  },
  {
    url: "https://www.gazeta.pl/0,0.html?ticaid=117093",
    source: "Gazeta Wyborcza",
    country: "PL",
    language: "pl",
    category: "général",
  },

  // ===== ROUMANIE =====
  {
    url: "https://www.bbc.com/romanian/rss.xml",
    source: "BBC Romanian",
    country: "RO",
    language: "ro",
    category: "général",
  },

  // ===== GRÈCE =====
  {
    url: "https://www.bbc.com/greek/rss.xml",
    source: "BBC Greek",
    country: "GR",
    language: "el",
    category: "général",
  },

  // ===== SUÈDE =====
  {
    url: "https://www.svd.se/feed/articles.rss",
    source: "Svenska Dagbladet",
    country: "SE",
    language: "sv",
    category: "général",
  },

  // ===== NORVÈGE =====
  {
    url: "https://www.aftenposten.no/rss",
    source: "Aftenposten",
    country: "NO",
    language: "no",
    category: "général",
  },

  // ===== DANEMARK =====
  {
    url: "https://www.dr.dk/nyheder/service/feeds/allenyheder",
    source: "DR",
    country: "DK",
    language: "da",
    category: "général",
  },

  // ===== FINLANDE =====
  {
    url: "https://www.hs.fi/rss/tuoreimmat.xml",
    source: "Helsingin Sanomat",
    country: "FI",
    language: "fi",
    category: "général",
  },
];

/**
 * Récupère les sources par pays
 */
export function getSourcesByCountry(country: string): NewsSource[] {
  return newsSources.filter((source) => source.country === country);
}

/**
 * Récupère les sources par langue
 */
export function getSourcesByLanguage(language: string): NewsSource[] {
  return newsSources.filter((source) => source.language === language);
}

/**
 * Récupère toutes les sources
 */
export function getAllSources(): NewsSource[] {
  return newsSources;
}

/**
 * Récupère les sources par catégorie
 */
export function getSourcesByCategory(category: string): NewsSource[] {
  return newsSources.filter((source) => source.category === category);
}

/**
 * Récupère les sources par niveau de fiabilité
 * Privilégier "high" pour éviter les sources partisanes/propagandistes
 */
export function getSourcesByReliability(
  reliability: "high" | "medium" | "verified"
): NewsSource[] {
  return newsSources.filter((source) => source.reliability === reliability);
}

/**
 * Récupère les sources les plus fiables (high + verified)
 */
export function getMostReliableSources(): NewsSource[] {
  return newsSources.filter(
    (source) => source.reliability === "high" || source.reliability === "verified"
  );
}

