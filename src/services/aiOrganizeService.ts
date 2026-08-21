import { Channel, AIOrganizeResult } from '../types/channel';
import { AIOrganizeOptions } from '../components/AIOrganizeModal';
import { PREDEFINED_CATEGORIES, CategoryDefinition } from '../types/category';

export interface OrganizeProgressCallback {
  (stage: string, percent: number): void;
}

export class AIOrganizeService {
  /**
   * Run Smart Organization with User Configured Options, Categories & Custom Prompt
   */
  static async organizeWithOptions(
    channels: Channel[],
    options: AIOrganizeOptions,
    apiKey?: string,
    onProgress?: OrganizeProgressCallback
  ): Promise<AIOrganizeResult> {
    if (options.engineMode === 'ai') {
      if (!apiKey || apiKey.trim() === '') {
        throw new Error('API key is required for Google Gemini AI mode.');
      }
      onProgress?.('Sending custom instructions & channels to Gemini AI...', 30);
      return await this.organizeWithGemini(channels, options, apiKey, onProgress);
    }

    // Local Engine
    onProgress?.('Processing natural language prompt & frequency telemetry...', 40);
    const result = this.organizeOfflineRuleBased(channels, options);
    onProgress?.('Organization analysis complete!', 100);
    return result;
  }

  /**
   * Gemini Flash with Custom Categories, Prompt Injection & Confirmation Message
   */
  private static async organizeWithGemini(
    channels: Channel[],
    options: AIOrganizeOptions,
    apiKey: string,
    onProgress?: OrganizeProgressCallback
  ): Promise<AIOrganizeResult> {
    const channelPayload = channels.map((c) => ({
      id: c.srvId,
      name: c.srvName,
      type: c.typeLabel,
      freq: c.freq,
      qa: c.sigQa,
      err: c.bitErr,
      score: c.signalScore,
      scrambled: c.scrambled,
    }));

    const activeCats = (options.activeCategories || PREDEFINED_CATEGORIES)
      .filter((c) => c.enabled)
      .map((c) => `${c.icon} ${c.name}`);

    const customUserInstruction = options.customPrompt?.trim()
      ? `\n\nCRITICAL USER CUSTOM INSTRUCTIONS (HIGHEST PRIORITY):\n"""\n${options.customPrompt.trim()}\n"""\nYOU MUST OBEY THIS INSTRUCTION FULLY: If the user requests custom categories or reordering, create that exact category with the requested name, assign requested channels to it, and put it in the exact order requested. Also include a clear, friendly "aiResponse" text message confirming exactly how you handled the user's prompt!`
      : '';

    const systemInstruction = `
You are an expert satellite TV channel editor for Samsung Smart TVs (Nilesat, Arabsat, Hotbird).
You will receive an array of TV and Radio channels.

Your tasks:
1. CUSTOM INSTRUCTIONS: Always follow the user's custom instructions first and foremost!${customUserInstruction}
2. JUNK DETECTION: Identify placeholder, dead feeds, "Test", "spare", or zero signal channels.
3. FREQUENCY DEDUPLICATION: For channels broadcasting on multiple frequencies, pick the "keepSrvId" with highest signal quality/score, and put redundant frequencies into "hideSrvIds".
4. CATEGORIZATION & ORDERING: Group valid channels into ordered categories. Target categories in order:
${activeCats.map((c, i) => `${i + 1}. ${c}`).join('\n')}
5. CONFIRMATION MESSAGE: In "aiResponse", write a concise confirmation message explaining what was customized.

Return strictly valid JSON matching:
{
  "aiResponse": "I understood your request: organized channels into selected categories, resolved duplicate frequencies, and sorted the rest into logical categories.",
  "junkSrvIds": ["id1", "id2"],
  "duplicateGroups": [
    {
      "name": "Channel Name",
      "keepSrvId": "id_best",
      "hideSrvIds": ["id_dupe1"],
      "reason": "Highest signal quality"
    }
  ],
  "categories": [
    {
      "categoryName": "Category Name",
      "categoryIcon": "📁",
      "srvIds": ["id1", "id2"]
    }
  ]
}
`;

    onProgress?.('AI analyzing channel preferences...', 65);

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey.trim()}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `${systemInstruction}\n\nChannels to organize:\n${JSON.stringify(channelPayload)}`,
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API Error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) throw new Error('Empty response from AI');

    onProgress?.('Parsing AI results...', 90);
    return JSON.parse(rawText) as AIOrganizeResult;
  }

  /**
   * Advanced In-Browser NLP Rule Engine with Predefined Categories & Custom Presets
   */
  static organizeOfflineRuleBased(
    channels: Channel[],
    options?: Partial<AIOrganizeOptions>
  ): AIOrganizeResult {
    const opts: AIOrganizeOptions = {
      removeDuplicates: true,
      hideScrambled: true,
      organizeCategories: true,
      removeJunk: true,
      prioritizeHD: true,
      groupRadioAtEnd: true,
      renumberSequential: true,
      customPrompt: '',
      engineMode: 'local',
      activeCategories: PREDEFINED_CATEGORIES,
      ...options,
    };

    const promptText = (opts.customPrompt || '').trim();
    const promptLower = promptText.toLowerCase();
    const isArabic = opts.language === 'ar' || /[\u0600-\u06FF]/.test(promptText);

    const junkSrvIds: string[] = [];
    const duplicateGroups: AIOrganizeResult['duplicateGroups'] = [];

    // Prompt custom filtering cues
    const hideShoppingPrompt =
      promptLower.includes('shopping') ||
      promptLower.includes('تسوق') ||
      promptLower.includes('إعلانات') ||
      promptLower.includes('اعلانات');
    const hideMusicPrompt =
      promptLower.includes('hide music') ||
      promptLower.includes('أخفِ الأغاني') ||
      promptLower.includes('بدون موسيقى') ||
      promptLower.includes('بدون أغاني');

    // 1. Identify Junk & Placeholders
    const validChannels: Channel[] = [];
    for (const ch of channels) {
      const name = ch.srvName.toLowerCase().trim();
      const isShopping = hideShoppingPrompt && (/shop|shopping|souq|citruss|mall|ads|buy/i.test(name));
      const isMusic = hideMusicPrompt && (/music|mazzika|arabica|rotana\s*music|clip|melody/i.test(name));

      const isJunk =
        (opts.removeJunk &&
          (ch.isJunk ||
            name.startsWith('test') ||
            name === 'spare' ||
            name === 'feed' ||
            name === 'data' ||
            name === 'service' ||
            name === '.' ||
            name === '-' ||
            name.length <= 1 ||
            ch.srvType === 12)) ||
        isShopping ||
        isMusic;

      if (isJunk) {
        junkSrvIds.push(ch.srvId);
      } else {
        validChannels.push(ch);
      }
    }

    // 2. Identify Duplicates across frequencies
    const duplicateHiddenIds = new Set<string>();

    if (opts.removeDuplicates) {
      const nameMap = new Map<string, Channel[]>();
      for (const ch of validChannels) {
        const normName = ch.srvName
          .toLowerCase()
          .replace(/[^a-z0-9]/gi, '') // Strip all spaces, dashes, punctuation
          .replace(/hd|sd|fhd|4k/gi, '');
        if (!nameMap.has(normName)) {
          nameMap.set(normName, []);
        }
        nameMap.get(normName)!.push(ch);
      }

      nameMap.forEach((group) => {
        if (group.length > 1) {
          group.sort((a, b) => {
            if (opts.prioritizeHD) {
              const aIsHD = a.srvType === 25 ? 1 : 0;
              const bIsHD = b.srvType === 25 ? 1 : 0;
              if (bIsHD !== aIsHD) return bIsHD - aIsHD;
            }
            if (b.signalScore !== a.signalScore) return b.signalScore - a.signalScore;
            if (b.sigQa !== a.sigQa) return b.sigQa - a.sigQa;
            return a.bitErr - b.bitErr;
          });

          const best = group[0];
          const losers = group.slice(1);
          const hideIds = losers.map((l) => l.srvId);

          hideIds.forEach((id) => duplicateHiddenIds.add(id));

          duplicateGroups.push({
            name: best.srvName,
            keepSrvId: best.srvId,
            hideSrvIds: hideIds,
            reason: `Best signal frequency (${best.sigQa}% quality, bit error ${best.bitErr})`,
          });
        }
      });
    }

    // Active channels list
    const activeChannels = validChannels.filter(
      (c) => !duplicateHiddenIds.has(c.srvId) && (!opts.hideScrambled || !c.scrambled)
    );

    if (opts.prioritizeHD) {
      activeChannels.sort((a, b) => {
        const aIsHD = a.srvType === 25 ? 1 : 0;
        const bIsHD = b.srvType === 25 ? 1 : 0;
        return bIsHD - aIsHD;
      });
    }

    // 3. Custom Categories from Prompt
    const customPromptCategories: Array<{
      categoryName: string;
      categoryIcon: string;
      srvIds: string[];
      isFirst?: boolean;
    }> = [];

    const assignedSrvIds = new Set<string>();
    let customCategoryCreatedName: string | null = null;
    let customCategoryChannelsCount = 0;

    if (promptText) {
      const createCatMatch =
        promptLower.match(/(?:create|make|add)\s+([a-z0-9\s&]+?)\s+category/i) ||
        promptLower.match(/(?:انشئ|أنشئ|اصنع|اعمل)\s+(?:فئة|قسم|مجموعة)\s+([^\s,.]+)/i);

      if (createCatMatch) {
        const rawCatName = createCatMatch[1].trim();
        const catName = rawCatName
          .split(' ')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');

        customCategoryCreatedName = catName;
        const isFirst = /first|top|#1|بداية|الأول|الاولى|المقدمة/i.test(promptLower);

        const matchedIds: string[] = [];
        for (const ch of activeChannels) {
          const chClean = ch.srvName.toLowerCase().replace(/[^a-z0-9]/g, '');
          const words = promptLower.split(/[\s,]+/);
          let directlyMentioned = false;
          for (const w of words) {
            const wClean = w.replace(/[^a-z0-9]/g, '');
            if (wClean.length >= 3 && chClean.includes(wClean)) {
              directlyMentioned = true;
              break;
            }
          }

          const isThematicMatch =
            rawCatName.includes('movie') || rawCatName.includes('cinema') || rawCatName.includes('افلام')
              ? /mbc\s*2|mbc\s*max|mbc\s*action|mix|fox\s*movies|dubai\s*one|cima|cinema/i.test(ch.srvName)
              : rawCatName.includes('sport') || rawCatName.includes('رياض')
              ? /sport|kass|bein|ontime|ssc|ad\s*sport/i.test(ch.srvName)
              : rawCatName.includes('kid') || rawCatName.includes('طفل') || rawCatName.includes('كرتون')
              ? /spacetoon|cartoon|kids|toyor|majid|mbc\s*3/i.test(ch.srvName)
              : false;

          if (directlyMentioned || isThematicMatch) {
            matchedIds.push(ch.srvId);
            assignedSrvIds.add(ch.srvId);
          }
        }

        if (matchedIds.length > 0) {
          customCategoryChannelsCount = matchedIds.length;
          customPromptCategories.push({
            categoryName: catName,
            categoryIcon: '🎬',
            srvIds: matchedIds,
            isFirst,
          });
        }
      }
    }

    // 4. Predefined & Active Categories
    const configuredCategories: CategoryDefinition[] = (opts.activeCategories || PREDEFINED_CATEGORIES).filter(
      (c) => c.enabled
    );

    const categoryBuckets = new Map<string, string[]>();
    configuredCategories.forEach((r) => categoryBuckets.set(r.name, []));
    categoryBuckets.set('Regional & General', []);

    for (const ch of activeChannels) {
      if (assignedSrvIds.has(ch.srvId)) continue;

      let matched = false;

      // Check radio stations
      if (opts.groupRadioAtEnd && ch.srvType === 2) {
        const radioCat = configuredCategories.find((c) => c.id === 'radio' || c.name.toLowerCase().includes('radio'));
        if (radioCat) {
          categoryBuckets.get(radioCat.name)!.push(ch.srvId);
          continue;
        }
      }

      for (const rule of configuredCategories) {
        if (rule.typeCheck && rule.typeCheck(ch)) {
          categoryBuckets.get(rule.name)!.push(ch.srvId);
          matched = true;
          break;
        }
        if (rule.keywords && rule.keywords.test(ch.srvName)) {
          categoryBuckets.get(rule.name)!.push(ch.srvId);
          matched = true;
          break;
        }
      }

      if (!matched) {
        categoryBuckets.get('Regional & General')!.push(ch.srvId);
      }
    }

    // Build categories array
    const defaultCategories: AIOrganizeResult['categories'] = configuredCategories.map((r) => ({
      categoryName: isArabic ? (r.nameAr || r.name) : r.name,
      categoryIcon: r.icon,
      srvIds: categoryBuckets.get(r.name) || [],
    }));

    defaultCategories.push({
      categoryName: isArabic ? 'قنوات عامة وإقليمية' : 'Regional & General',
      categoryIcon: '📺',
      srvIds: categoryBuckets.get('Regional & General') || [],
    });

    const firstCustom = customPromptCategories.filter((c) => c.isFirst);
    const regularCustom = customPromptCategories.filter((c) => !c.isFirst);

    const mergedCategories: AIOrganizeResult['categories'] = [
      ...firstCustom.map((c) => ({
        categoryName: c.categoryName,
        categoryIcon: c.categoryIcon,
        srvIds: c.srvIds,
      })),
      ...defaultCategories.filter((cat) => cat.srvIds.length > 0),
      ...regularCustom.map((c) => ({
        categoryName: c.categoryName,
        categoryIcon: c.categoryIcon,
        srvIds: c.srvIds,
      })),
    ];

    // 5. Construct AI Text Response Confirmation Message
    let aiResponse = '';
    if (isArabic) {
      const parts: string[] = [];
      if (promptText) {
        parts.push(`تم استلام وتطبيق طلبك: "${promptText}".`);
      }
      if (customCategoryCreatedName) {
        parts.push(`✅ تم إنشاء فئة "${customCategoryCreatedName}" في المقدمة (#1) وتضم ${customCategoryChannelsCount} قناة مطابقة.`);
      }
      if (duplicateHiddenIds.size > 0) {
        parts.push(`🔄 تم حل ${duplicateHiddenIds.size} تردداً مكرراً مع إبقاء أفضل جودة إشارة.`);
      }
      if (junkSrvIds.length > 0) {
        parts.push(`🧹 تم تنظيف ${junkSrvIds.length} قناة تجريبية أو وهمية.`);
      }
      parts.push(`📁 تم ترتيب القنوات في ${mergedCategories.length} فئات رئيسية.`);
      aiResponse = parts.join(' ');
    } else {
      const parts: string[] = [];
      if (promptText) {
        parts.push(`Got your prompt: "${promptText}".`);
      }
      if (customCategoryCreatedName) {
        parts.push(`✅ Created custom category "${customCategoryCreatedName}" at position #1 with ${customCategoryChannelsCount} matching channels.`);
      }
      if (duplicateHiddenIds.size > 0) {
        parts.push(`🔄 Resolved ${duplicateHiddenIds.size} duplicate frequencies by keeping the best signal transponder.`);
      }
      if (junkSrvIds.length > 0) {
        parts.push(`🧹 Cleaned ${junkSrvIds.length} test / placeholder channels.`);
      }
      parts.push(`📂 Organized channels into ${mergedCategories.length} structured categories.`);
      aiResponse = parts.join(' ');
    }

    return {
      aiResponse,
      junkSrvIds,
      duplicateGroups,
      categories: mergedCategories.filter((cat) => cat.srvIds.length > 0),
    };
  }
}
