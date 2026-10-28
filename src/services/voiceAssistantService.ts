import { ExtractedCargoRequest, AssistantLanguage } from '../types/assistant';
import { GoodsCategory } from '../types';
import { toLatinDigits } from '../context/LanguageContext';

export interface ProductCatalogItem {
  canonical: string;
  category: GoodsCategory;
  shelfLifeHours: number | null;
  urgency: 'URGENT' | 'TODAY' | 'FLEXIBLE';
  aliases: string[];
  displayName: {
    mr: string;
    hi: string;
    en: string;
  };
}

export const PRODUCT_CATALOG: ProductCatalogItem[] = [
  {
    canonical: 'mango',
    category: 'FRUITS',
    shelfLifeHours: 12,
    urgency: 'TODAY',
    aliases: ['mango', 'mangoes', 'aam', 'amba', 'आंबा', 'आम', 'हापूस', 'hapus', 'alphonso'],
    displayName: {
      mr: 'हापूस आंबा (Alphonso Mango)',
      hi: 'हापूस आम (Alphonso Mango)',
      en: 'Alphonso Mango'
    }
  },
  {
    canonical: 'fish',
    category: 'FISHERIES',
    shelfLifeHours: 4,
    urgency: 'URGENT',
    aliases: ['fish', 'machhli', 'machli', 'मछली', 'मासे', 'मासळी', 'masali', 'surmai', 'सुरमई', 'jhinga', 'prawns', 'pomfret', 'kolambi', 'कोळंबी'],
    displayName: {
      mr: 'ताजी मासळी (Fresh Marine Fish)',
      hi: 'ताज़ी मछली (Fresh Fish)',
      en: 'Fresh Fish / Marine Catch'
    }
  },
  {
    canonical: 'cashew',
    category: 'PROCESSED_FOOD',
    shelfLifeHours: 72,
    urgency: 'FLEXIBLE',
    aliases: ['cashew', 'cashews', 'kaju', 'काजू', 'kaju katli', 'काजू कतली', 'processed cashew'],
    displayName: {
      mr: 'काजू व काजू प्रक्रिया उत्पादने (Cashews)',
      hi: 'काजू एवं काजू उत्पाद (Cashews)',
      en: 'Cashew Nuts & Sweets'
    }
  },
  {
    canonical: 'kokum',
    category: 'PERISHABLE_AGRI',
    shelfLifeHours: 72,
    urgency: 'FLEXIBLE',
    aliases: ['kokum', 'कोकम', 'amsul', 'आमसूल', 'kokum sharbat', 'kokum syrup', 'solkadhi'],
    displayName: {
      mr: 'सेंद्रिय कोकण कोकम (Organic Kokum)',
      hi: 'ऑर्गेनिक कोकम (Organic Kokum)',
      en: 'Organic Konkan Kokum'
    }
  },
  {
    canonical: 'grapes',
    category: 'FRUITS',
    shelfLifeHours: 12,
    urgency: 'TODAY',
    aliases: ['grapes', 'grape', 'draksh', 'द्राक्षे', 'द्राक्ष', 'angur', 'अंगूर'],
    displayName: {
      mr: 'निर्यातक्षम द्राक्षे (Grapes)',
      hi: 'ताज़ा अंगूर (Grapes)',
      en: 'Fresh Table Grapes'
    }
  },
  {
    canonical: 'vegetables',
    category: 'VEGETABLES',
    shelfLifeHours: 12,
    urgency: 'TODAY',
    aliases: ['vegetable', 'vegetables', 'bhaji', 'भाजी', 'भाजीपाला', 'sabzi', 'सब्जी', 'tamatar', 'tomato', 'onion', 'kanda', 'कांदा', 'बटाटा', 'potato'],
    displayName: {
      mr: 'ताजी भाजीपाला (Fresh Vegetables)',
      hi: 'ताज़ी सब्ज़ियाँ (Fresh Vegetables)',
      en: 'Fresh Farm Vegetables'
    }
  },
  {
    canonical: 'dairy',
    category: 'DAIRY',
    shelfLifeHours: 12,
    urgency: 'TODAY',
    aliases: ['milk', 'dairy', 'doodh', 'दूध', 'dahi', 'दही', 'paneer', 'पनीर'],
    displayName: {
      mr: 'ताजे दूध व दुग्धजन्य पदार्थ (Fresh Dairy)',
      hi: 'ताज़ा दूध एवं डेयरी (Fresh Dairy)',
      en: 'Fresh Milk & Dairy'
    }
  },
  {
    canonical: 'handicrafts',
    category: 'HANDICRAFTS',
    shelfLifeHours: null,
    urgency: 'FLEXIBLE',
    aliases: ['bamboo', 'बांबू', 'handicrafts', 'handicraft', 'हस्तकला', 'baskets', 'tokri', 'टोपली', 'warli', 'वारली'],
    displayName: {
      mr: 'वारली बांबू हस्तकला (Bamboo Crafts)',
      hi: 'हैंडीक्राफ्ट एवं बांस उत्पाद (Handicrafts)',
      en: 'Handmade Bamboo Crafts'
    }
  },
  {
    canonical: 'spices',
    category: 'SPICES',
    shelfLifeHours: 72,
    urgency: 'FLEXIBLE',
    aliases: ['spices', 'masale', 'मसाले', 'haldi', 'हळद', 'हल्दी', 'mirchi', 'मिरची', 'chilli'],
    displayName: {
      mr: 'कोकणी मसाले व हळद (Spices)',
      hi: 'पारंपरिक मसाले (Spices)',
      en: 'Rural Spices & Turmeric'
    }
  }
];

export const KNOWN_DESTINATIONS = [
  { name: 'Chiplun', aliases: ['chiplun', 'चिपळूण', 'चिपलूण', 'chiplunla', 'chiplun ko', 'chiplun me', 'chiplun madhe'] },
  { name: 'Khed', aliases: ['khed', 'खेड', 'khedla', 'khed ko', 'khed me', 'khed madhe'] },
  { name: 'Panvel', aliases: ['panvel', 'पनवेल', 'panvella', 'panvel ko', 'panvel me', 'panvel madhe'] },
  { name: 'Dapoli', aliases: ['dapoli', 'दापोली', 'dapolila', 'dapoli ko', 'dapoli madhe'] },
  { name: 'Harnai', aliases: ['harnai', 'हर्णे', 'हर्णे बंदर', 'harnaila'] },
  { name: 'Mandangad', aliases: ['mandangad', 'मंडणगड', 'mandangadla'] },
  { name: 'Ratnagiri', aliases: ['ratnagiri', 'रत्नागिरी', 'ratnagirila'] },
  { name: 'Nashik', aliases: ['nashik', 'नाशिक', 'पंचवटी', 'panchavati', 'nashikla'] },
  { name: 'Dindori', aliases: ['dindori', 'दिंडोरी', 'dindorila'] },
  { name: 'Pune', aliases: ['pune', 'पुणे', 'हडपसर', 'hadapsar', 'punela'] },
  { name: 'Vashi', aliases: ['vashi', 'वाशी', 'vashila', 'apmc vashi'] },
  { name: 'Mumbai', aliases: ['mumbai', 'मुंबई', 'mumbaila'] }
];

export const KNOWN_PICKUPS = [
  { name: 'Dapoli', aliases: ['dapoli', 'दापोली', 'dapoli se', 'दापोलीहून', 'दापोली मधून'] },
  { name: 'Gimhavane', aliases: ['gimhavane', 'गिमवणे', 'gimhavane se', 'गिमवणेहून'] },
  { name: 'Harnai', aliases: ['harnai', 'हर्णे', 'harnai se', 'हर्णेहून'] },
  { name: 'Asud', aliases: ['asud', 'आसूद', 'asud se'] },
  { name: 'Janori', aliases: ['janori', 'जानोरी', 'janori se'] },
  { name: 'Khed', aliases: ['khed', 'खेड', 'khed se', 'खेडहून'] },
  { name: 'Panvel', aliases: ['panvel', 'पनवेल', 'panvel se'] }
];

/**
 * Detect language from text tokens or characters
 */
export function detectLanguage(text: string, defaultLang: AssistantLanguage = 'hi'): AssistantLanguage {
  const marathiWords = ['मला', 'पाठवायचे', 'आहे', 'करा', 'हो', 'नाही', 'ला', 'किलो', 'गाडी', 'पाहिजे', 'द्या'];
  const hindiWords = ['mere ko', 'mujhe', 'bhejna', 'hai', 'chahiye', 'karo', 'gaadi', 'kahan', 'kitna', 'karna', 'hoga', 'mera'];
  const englishWords = ['send', 'to', 'kg', 'kilo', 'fish', 'mango', 'cashew', 'transport', 'book', 'please', 'need', 'vehicle'];

  const lower = text.toLowerCase();

  // Check for distinct Marathi markers
  for (const w of marathiWords) {
    if (lower.includes(w)) return 'mr';
  }

  // Check for English markers
  let engCount = 0;
  for (const w of englishWords) {
    if (new RegExp(`\\b${w}\\b`, 'i').test(lower)) engCount++;
  }
  if (engCount >= 2 || (engCount >= 1 && !/[^\x00-\x7F]/.test(text) && !hindiWords.some(h => lower.includes(h)))) {
    return 'en';
  }

  // Check for Hindi markers
  for (const w of hindiWords) {
    if (lower.includes(w)) return 'hi';
  }

  return defaultLang;
}

/**
 * Local Rule-Based Entity Parser (used as fallback or offline)
 */
export function parseCargoRequestLocally(
  rawText: string,
  currentLang: AssistantLanguage = 'hi',
  userPickupLocation?: string
): ExtractedCargoRequest {
  const text = (rawText || '').trim();
  const normalizedDigitsText = toLatinDigits(text);
  const lower = normalizedDigitsText.toLowerCase();

  const detectedLang = detectLanguage(text, currentLang);

  // 1. Weight Extraction
  let extractedWeight: number | null = null;
  // Match e.g. "40 kilo", "40 kg", "३० किलो", "50kg", "40 kgs"
  const weightRegex = /(\d+(?:\.\d+)?)\s*(?:kilo|kg|kilos|किलो|कि\.ग्रॅ|किग्रा|केजी)\b/i;
  const matchWeight = lower.match(weightRegex);
  if (matchWeight) {
    const parsed = parseFloat(matchWeight[1]);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 10000) {
      extractedWeight = parsed;
    }
  } else {
    // Secondary match: standalone number followed or preceded closely by product/destination
    const standaloneNumRegex = /\b(\d{1,4})\b/;
    const numMatch = lower.match(standaloneNumRegex);
    if (numMatch) {
      const parsed = parseInt(numMatch[1], 10);
      if (!isNaN(parsed) && parsed >= 5 && parsed <= 3000) {
        extractedWeight = parsed;
      }
    }
  }

  // 2. Product Extraction
  let matchedProductItem: ProductCatalogItem | null = null;
  let productOriginalTerm: string | null = null;

  for (const item of PRODUCT_CATALOG) {
    for (const alias of item.aliases) {
      const regex = new RegExp(`(^|[^a-zA-Z0-9\u0900-\u097F])${alias}([^a-zA-Z0-9\u0900-\u097F]|$)`, 'i');
      if (regex.test(lower) || lower.includes(alias.toLowerCase())) {
        matchedProductItem = item;
        productOriginalTerm = alias;
        break;
      }
    }
    if (matchedProductItem) break;
  }

  // 3. Destination Extraction
  let extractedDestination: string | null = null;
  for (const dest of KNOWN_DESTINATIONS) {
    for (const alias of dest.aliases) {
      const regex = new RegExp(`(^|[^a-zA-Z0-9\u0900-\u097F])${alias}([^a-zA-Z0-9\u0900-\u097F]|$)`, 'i');
      if (regex.test(lower) || lower.includes(alias.toLowerCase())) {
        extractedDestination = dest.name;
        break;
      }
    }
    if (extractedDestination) break;
  }

  // 4. Pickup Extraction
  let extractedPickup: string | null = null;
  for (const p of KNOWN_PICKUPS) {
    for (const alias of p.aliases) {
      if (lower.includes(alias.toLowerCase())) {
        extractedPickup = p.name;
        break;
      }
    }
    if (extractedPickup) break;
  }
  if (!extractedPickup) {
    extractedPickup = userPickupLocation || 'Dapoli';
  }

  // 5. Check if sentence is unrelated (no product, no weight, no destination)
  const isUnrelated = !matchedProductItem && extractedWeight === null && !extractedDestination;

  // 6. Identify Missing Essential Fields
  const missingFields: ('product' | 'weight_kg' | 'destination')[] = [];
  if (!matchedProductItem) missingFields.push('product');
  if (extractedWeight === null) missingFields.push('weight_kg');
  if (!extractedDestination) missingFields.push('destination');

  // 7. Generate Follow-Up Question if fields are missing
  let followUpQuestion: string | null = null;
  let followUpKey: string | undefined;
  let followUpParams: Record<string, string | number> | undefined;
  if (!isUnrelated && missingFields.length > 0) {
    followUpQuestion = generateFollowUpQuestion(missingFields, matchedProductItem, extractedDestination, extractedWeight, detectedLang);
    const keyAndParams = getFollowUpKeyAndParams(missingFields, matchedProductItem, extractedDestination, extractedWeight);
    followUpKey = keyAndParams.key;
    followUpParams = keyAndParams.params;
  }

  return {
    product: matchedProductItem ? matchedProductItem.canonical : null,
    product_original: productOriginalTerm || (matchedProductItem ? matchedProductItem.canonical : undefined),
    category: matchedProductItem ? matchedProductItem.category : undefined,
    shelf_life_hours: matchedProductItem ? matchedProductItem.shelfLifeHours : null,
    urgency: matchedProductItem ? matchedProductItem.urgency : null,
    weight_kg: extractedWeight,
    destination: extractedDestination,
    pickup_village: extractedPickup,
    language: detectedLang,
    missing_fields: missingFields,
    follow_up_question: followUpQuestion,
    follow_up_key: followUpKey,
    follow_up_params: followUpParams,
    is_fallback: true,
    is_unrelated: isUnrelated
  };
}

/**
 * Determine translation key and parameters for follow-up questions
 */
export function getFollowUpKeyAndParams(
  missingFields: ('product' | 'weight_kg' | 'destination')[],
  productItem: ProductCatalogItem | null | string,
  destination: string | null,
  weightKg: number | null
): { key: string; params: Record<string, string | number> } {
  const prodCanonical = typeof productItem === 'string' ? productItem : productItem?.canonical;

  // Case 1: Missing Destination AND Weight (e.g. "aam bhejna hai")
  if (missingFields.includes('destination') && missingFields.includes('weight_kg')) {
    return {
      key: 'assistant_ask_dest_and_weight',
      params: { product: prodCanonical || 'cargo', product_key: prodCanonical || 'produce' }
    };
  }

  // Case 2: Missing only Destination
  if (missingFields.includes('destination')) {
    if (weightKg !== null && weightKg > 0) {
      return {
        key: 'assistant_ask_destination_with_weight',
        params: { weight: weightKg, product: prodCanonical || 'cargo', product_key: prodCanonical || 'produce' }
      };
    }
    return {
      key: 'assistant_ask_destination',
      params: { product: prodCanonical || 'cargo', product_key: prodCanonical || 'produce' }
    };
  }

  // Case 3: Missing only Weight
  if (missingFields.includes('weight_kg')) {
    if (destination) {
      return {
        key: 'assistant_ask_weight',
        params: { destination, destination_key: destination, product: prodCanonical || 'cargo', product_key: prodCanonical || 'produce' }
      };
    }
    return {
      key: 'assistant_ask_weight_general',
      params: { product: prodCanonical || 'cargo', product_key: prodCanonical || 'produce' }
    };
  }

  // Case 4: Missing only Product
  if (missingFields.includes('product')) {
    if (weightKg !== null && weightKg > 0) {
      return {
        key: 'assistant_ask_product_with_weight',
        params: { weight: weightKg }
      };
    }
    return {
      key: 'assistant_ask_product',
      params: {}
    };
  }

  return {
    key: 'assistant_more_details',
    params: {}
  };
}

/**
 * Generate ONE short follow-up question in the appropriate language
 */
export function generateFollowUpQuestion(
  missingFields: ('product' | 'weight_kg' | 'destination')[],
  productItem: ProductCatalogItem | null,
  destination: string | null,
  weightKg: number | null,
  lang: AssistantLanguage
): string {
  const prodNameMr = productItem ? productItem.displayName.mr.split(' ')[0] : 'माल';
  const prodNameHi = productItem ? productItem.displayName.hi.split(' ')[0] : 'सामान';
  const prodNameEn = productItem ? productItem.canonical : 'cargo';

  // Case 1: Missing Destination AND Weight (e.g. "aam bhejna hai")
  if (missingFields.includes('destination') && missingFields.includes('weight_kg')) {
    if (lang === 'mr') {
      return `${prodNameMr} कुठे पाठवायचा आहे आणि किती किलो आहे?`;
    }
    if (lang === 'en') {
      return `Where do you want to send the ${prodNameEn}, and how many kg?`;
    }
    return `${prodNameHi} कहाँ भेजना है और कितना किलो है?`;
  }

  // Case 2: Missing only Destination
  if (missingFields.includes('destination')) {
    if (lang === 'mr') {
      return `${weightKg ? weightKg + ' किलो ' : ''}${prodNameMr} कुठे पाठवायचा आहे? चिपळूण, खेड की पनवेल?`;
    }
    if (lang === 'en') {
      return `Where would you like to send the ${weightKg ? weightKg + ' kg ' : ''}${prodNameEn}? (e.g. Chiplun, Khed, Panvel)`;
    }
    return `${weightKg ? weightKg + ' किलो ' : ''}${prodNameHi} कहाँ भेजना है? चिपळूण, खेड या पनवेल?`;
  }

  // Case 3: Missing only Weight
  if (missingFields.includes('weight_kg')) {
    if (lang === 'mr') {
      return `${destination ? destination + 'साठी ' : ''}किती किलो ${prodNameMr} पाठवायचा आहे?`;
    }
    if (lang === 'en') {
      return `How many kg of ${prodNameEn} do you want to send${destination ? ' to ' + destination : ''}?`;
    }
    return `${destination ? destination + ' के लिए ' : ''}कितना किलो ${prodNameHi} भेजना है?`;
  }

  // Case 4: Missing only Product
  if (missingFields.includes('product')) {
    if (lang === 'mr') {
      return `${weightKg ? weightKg + ' किलो ' : ''}कोणता माल पाठवायचा आहे? (उदा. आंबा, काजू किंवा मासळी)`;
    }
    if (lang === 'en') {
      return `What cargo do you want to send? (e.g., mango, cashew, fish)`;
    }
    return `${weightKg ? weightKg + ' किलो ' : ''}क्या सामान भेजना है? (जैसे आम, काजू या मछली)`;
  }

  return lang === 'mr' ? 'कृपया अधिक माहिती सांगा.' : lang === 'en' ? 'Please provide more details.' : 'कृपया अधिक जानकारी बताएं।';
}

/**
 * Validate LLM JSON payload on the client
 */
export function validateLlmExtraction(data: any): ExtractedCargoRequest | null {
  if (!data || typeof data !== 'object') return null;

  // Normalize weight
  let weight: number | null = null;
  if (typeof data.weight_kg === 'number' && !isNaN(data.weight_kg)) {
    weight = data.weight_kg;
  } else if (typeof data.weight_kg === 'string') {
    const parsed = parseFloat(toLatinDigits(data.weight_kg));
    if (!isNaN(parsed)) weight = parsed;
  }

  const lang: AssistantLanguage = ['mr', 'hi', 'en'].includes(data.language) ? data.language : 'hi';

  const product = typeof data.product === 'string' && data.product.trim().length > 0 ? data.product.toLowerCase().trim() : null;
  const destination = typeof data.destination === 'string' && data.destination.trim().length > 0 ? data.destination.trim() : null;
  const pickup_village = typeof data.pickup_village === 'string' ? data.pickup_village.trim() : null;

  // Match canonical catalog item
  let matchedCatalog: ProductCatalogItem | undefined;
  if (product) {
    matchedCatalog = PRODUCT_CATALOG.find(p => 
      p.canonical === product || p.aliases.some(a => a.toLowerCase() === product)
    );
  }

  const category = (data.category as GoodsCategory) || matchedCatalog?.category;
  const shelfLife = data.shelf_life_hours !== undefined ? data.shelf_life_hours : (matchedCatalog?.shelfLifeHours ?? null);
  const urgency = data.urgency || matchedCatalog?.urgency || (shelfLife === 4 ? 'URGENT' : shelfLife === 12 ? 'TODAY' : 'FLEXIBLE');

  const missingFields: ('product' | 'weight_kg' | 'destination')[] = [];
  if (!product) missingFields.push('product');
  if (weight === null) missingFields.push('weight_kg');
  if (!destination) missingFields.push('destination');

  const isUnrelated = !product && weight === null && !destination;

  let followUp = data.follow_up_question || null;
  let followUpKey: string | undefined;
  let followUpParams: Record<string, string | number> | undefined;

  if (!isUnrelated && missingFields.length > 0) {
    const keyAndParams = getFollowUpKeyAndParams(missingFields, matchedCatalog || product || null, destination, weight);
    followUpKey = keyAndParams.key;
    followUpParams = keyAndParams.params;
    if (!followUp) {
      followUp = generateFollowUpQuestion(missingFields, matchedCatalog || null, destination, weight, lang);
    }
  }

  return {
    product: matchedCatalog ? matchedCatalog.canonical : product,
    product_original: data.product_original || product || undefined,
    category,
    shelf_life_hours: shelfLife,
    urgency,
    weight_kg: weight,
    destination,
    pickup_village,
    language: lang,
    missing_fields: missingFields,
    follow_up_question: followUp,
    follow_up_key: followUpKey,
    follow_up_params: followUpParams,
    is_fallback: false,
    is_unrelated: isUnrelated
  };
}

/**
 * Main Client API caller: attempts /api/assistant, falls back cleanly on error, key missing, or offline.
 */
export async function extractCargoRequestWithAssistant(
  sentence: string,
  preferredLang: AssistantLanguage = 'hi',
  userPickupLocation?: string
): Promise<ExtractedCargoRequest> {
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  // 1. Immediate offline check: if device is offline, use local rule-based parser directly
  if (!isOnline) {
    return parseCargoRequestLocally(sentence, preferredLang, userPickupLocation);
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

    const response = await fetch('/api/assistant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: sentence.slice(0, 200),
        language: preferredLang,
        pickup_village: userPickupLocation || 'Dapoli'
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const json = await response.json();

      // If server responded that LLM_API_KEY is missing or fallback requested
      if (json.fallback) {
        return parseCargoRequestLocally(sentence, preferredLang, userPickupLocation);
      }

      const validated = validateLlmExtraction(json);
      if (validated) {
        return validated;
      }
    }

    // On non-200 or unexpected structure: fall back locally
    return parseCargoRequestLocally(sentence, preferredLang, userPickupLocation);
  } catch {
    // Network failure, timeout, abort, or offline
    return parseCargoRequestLocally(sentence, preferredLang, userPickupLocation);
  }
}
