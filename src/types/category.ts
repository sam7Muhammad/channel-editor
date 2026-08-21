export interface CategoryDefinition {
  id: string;
  name: string;
  nameAr: string;
  icon: string;
  keywords: RegExp;
  typeCheck?: (channel: { srvType: number }) => boolean;
  enabled: boolean;
  isCustom?: boolean;
}

export interface CategoryPreset {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  categoryIds: string[];
}

export const PREDEFINED_CATEGORIES: CategoryDefinition[] = [
  {
    id: 'english_movies',
    name: 'English Movies & Series',
    nameAr: 'أفلام ومسلسلات أجنبية',
    icon: '🎬',
    keywords:
      /mbc\s*2|mbc\s*max|mbc\s*action|mix|mix\s*one|fox\s*movies|dubai\s*one|one\s*movies|top\s*movies|scare\s*tv|d\s*movies|action|hollywood|cinema\s*english|lbc\s*international/i,
    enabled: true,
  },
  {
    id: 'documentary',
    name: 'Documentary & Nature',
    nameAr: 'وثائقيات وطبيعة',
    icon: '🌍',
    keywords:
      /doc|documentary|wathaeqya|nat\s*geo|geographic|discovery|history|science|animal\s*planet|al\s*jazeera\s*doc/i,
    enabled: true,
  },
  {
    id: 'news',
    name: 'News & Info',
    nameAr: 'أخبار ومعلومات',
    icon: '📰',
    keywords:
      /jazeera|arabiya|hadath|news|akhbar|ekhbaria|sky\s*news|bbc|cnn|rt|france|cnbc|bloomberg|syria\s*news|ghad|sharqiya|nrt|rudaw|cairo\s*news|al\s*qahera/i,
    enabled: true,
  },
  {
    id: 'sports',
    name: 'Sports & Live',
    nameAr: 'رياضة ومباريات',
    icon: '⚽',
    keywords:
      /sport|sports|kass|alkass|bein|arryadia|on\s*time|ontime|ssc|dubai\s*sport|ad\s*sport|abu\s*dhabi\s*sport|riyadiah|football|match|kuwait\s*sport|sharjah\s*sport/i,
    enabled: true,
  },
  {
    id: 'arabic_movies',
    name: 'Arabic Cinema & Movies',
    nameAr: 'سينما وأفلام عربية',
    icon: '🍿',
    keywords:
      /cinema|cima|movie|movies|film|aflam|rotana\s*cinema|rotana\s*classic|tok\s*tok|star\s*cinema|shobra|al\s*bait|dar\s*el\s*qamar|zee\s*aflam|mbc\s*bollywood/i,
    enabled: true,
  },
  {
    id: 'arabic_drama',
    name: 'Arabic Drama & Series',
    nameAr: 'دراما ومسلسلات عربية',
    icon: '🎭',
    keywords:
      /drama|mosalsalat|zee\s*alwan|zee\s*drama|mbc\s*drama|mbc\s*masr|mbc\s*masr\s*2|mbc\s*iraq|rotana\s*drama|panorama\s*drama|lana|dolly|remas|alwan|cbc\s*drama|dmc\s*drama|on\s*drama|al\s*hayah\s*drama/i,
    enabled: true,
  },
  {
    id: 'kids',
    name: 'Kids & Cartoons',
    nameAr: 'أطفال وكرتون',
    icon: '👶',
    keywords:
      /spacetoon|space\s*toon|cartoon|kids|toyor|karameesh|majid|baraem|jeem|mbc\s*3|children|baby|hodhod|cn\s*arabic|cartoon\s*network/i,
    enabled: true,
  },
  {
    id: 'religious',
    name: 'Religious & Quran',
    nameAr: 'إسلاميات وقرآن كريم',
    icon: '📖',
    keywords:
      /quran|sunnah|resalah|iqraa|majd|al\s*majd|huda|zad|rahma|nas|fatwa|islam|kaaba|makkah|madinah|haqiqa|istiqama|karam|saudi\s*quran|al\s*afasy/i,
    enabled: true,
  },
  {
    id: 'cooking',
    name: 'Cooking & Lifestyle',
    nameAr: 'طبخ وأسلوب حياة',
    icon: '🍳',
    keywords:
      /cooking|cook|chef|tabkh|food|sofra|cbc\s*sofra|fatafeat|samira|lifestyle|matbakh/i,
    enabled: true,
  },
  {
    id: 'entertainment',
    name: 'General Entertainment',
    nameAr: 'منوعات وترفيه عام',
    icon: '⭐',
    keywords:
      /mbc\s*1|mbc\s*4|mbc\s*5|ro'?ya|amman|lbc|mtv|aljadeed|watan|al\s*sumaria|al\s*hayah|dmc|cbc|on\s*e|dubai\s*tv|sharjah|saudi\s*1/i,
    enabled: true,
  },
  {
    id: 'music',
    name: 'Music & Songs',
    nameAr: 'أغاني وموسيقى',
    icon: '🎵',
    keywords:
      /music|tarab|aghani|mazzika|arabica|rotana\s*music|rotana\s*clip|clip|melody|ghinwa|hawas/i,
    enabled: true,
  },
  {
    id: 'radio',
    name: 'Radio Stations',
    nameAr: 'محطات الراديو',
    icon: '📻',
    keywords: /radio|fm|sawt|idha'?a|quran\s*radio/i,
    typeCheck: (c) => c.srvType === 2,
    enabled: true,
  },
];

export const CATEGORY_PRESETS: CategoryPreset[] = [
  {
    id: 'nilesat_standard',
    name: 'Nilesat Standard Order',
    nameAr: '📺 الترتيب القياسي لنايل سات',
    description: 'Traditional TV order: Religious & Quran first, then Kids, News, Movies, Drama, Sports, and General.',
    descriptionAr: 'الترتيب التقليدي: القرآن والإسلاميات أولاً، ثم الأطفال، الأخبار، الأفلام، الدراما، والرياضة.',
    categoryIds: [
      'religious',
      'kids',
      'news',
      'english_movies',
      'arabic_movies',
      'arabic_drama',
      'sports',
      'documentary',
      'cooking',
      'entertainment',
      'music',
      'radio',
    ],
  },
  {
    id: 'english_first',
    name: 'English Movies & Series First',
    nameAr: '🎬 أفلام ومسلسلات أجنبية أولاً',
    description: 'English movies (MBC 2, Mix, etc.) at the top, followed by Documentaries, News, Cinema, Drama, Sports, and Kids.',
    descriptionAr: 'الأفلام الأجنبية في المقدمة، تليها الوثائقيات، الأخبار، السينما، الدراما، والرياضة.',
    categoryIds: [
      'english_movies',
      'documentary',
      'news',
      'sports',
      'arabic_movies',
      'arabic_drama',
      'kids',
      'religious',
      'cooking',
      'entertainment',
      'music',
      'radio',
    ],
  },
  {
    id: 'sports_news',
    name: 'Sports & News Focus',
    nameAr: '⚽ رياضة وأخبار أولاً',
    description: 'Sports and live match channels at #1, followed by breaking news and documentaries.',
    descriptionAr: 'قنوات الرياضة والمباريات أولاً، تليها القنوات الإخبارية والوثائقية.',
    categoryIds: [
      'sports',
      'news',
      'english_movies',
      'documentary',
      'arabic_movies',
      'arabic_drama',
      'kids',
      'religious',
      'cooking',
      'entertainment',
      'music',
      'radio',
    ],
  },
  {
    id: 'family_kids',
    name: 'Family & Kids Safe',
    nameAr: '👶 عائلي وآمن للأطفال',
    description: 'Kids and educational channels first, followed by Religious, Documentaries, Cooking, and Family Entertainment.',
    descriptionAr: 'قنوات الأطفال والكرتون أولاً، تليها القنوات الدينية، الوثائقيات، والطبخ.',
    categoryIds: [
      'kids',
      'religious',
      'documentary',
      'cooking',
      'news',
      'arabic_drama',
      'english_movies',
      'arabic_movies',
      'sports',
      'entertainment',
      'music',
      'radio',
    ],
  },
];
