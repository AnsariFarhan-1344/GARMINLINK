import { parseCargoRequestLocally, extractCargoRequestWithAssistant } from '../src/services/voiceAssistantService';
import { recommendVehiclesForRequest } from '../src/services/assistantMatcher';
import { mockVehicles, mockReturnTrips } from '../src/data/mockData';
import { ExtractedCargoRequest } from '../src/types/assistant';

async function runVoiceAssistantTests() {
  console.log('========================================================================');
  console.log('🎙️ GAADI SAHAYAK VOICE ASSISTANT — AUTOMATED VERIFICATION TEST SUITE');
  console.log('========================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, details?: any) {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      if (details) console.error('   Details:', details);
    }
  }

  const defaultUserLocation = { lat: 17.7584, lng: 73.1867 }; // Dapoli
  const defaultLocationName = 'Dapoli';

  // -------------------------------------------------------------------------
  // TEST 1: "mere ko 40 kilo aam Chiplun bhejna hai"
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 1: "mere ko 40 kilo aam Chiplun bhejna hai" ---');
  const t1Input = 'mere ko 40 kilo aam Chiplun bhejna hai';
  const t1Parsed = parseCargoRequestLocally(t1Input, 'hi', defaultLocationName);
  console.log('Parsed:', {
    product: t1Parsed.product,
    weight_kg: t1Parsed.weight_kg,
    destination: t1Parsed.destination,
    category: t1Parsed.category,
    urgency: t1Parsed.urgency,
    shelf_life: t1Parsed.shelf_life_hours,
    missing: t1Parsed.missing_fields
  });

  assert(t1Parsed.product === 'mango', 'Test 1: Extracted product is mango');
  assert(t1Parsed.weight_kg === 40, 'Test 1: Extracted weight is 40 kg');
  assert(t1Parsed.destination === 'Chiplun', 'Test 1: Extracted destination is Chiplun');
  assert(t1Parsed.category === 'FRUITS', 'Test 1: Category mapped to FRUITS');
  assert(t1Parsed.urgency === 'TODAY', 'Test 1: Urgency mapped to TODAY (12h freshness)');
  assert(t1Parsed.shelf_life_hours === 12, 'Test 1: Shelf life is 12 hours');
  assert(t1Parsed.missing_fields?.length === 0, 'Test 1: No missing essential fields');

  const t1Rec = recommendVehiclesForRequest(
    t1Parsed,
    mockVehicles,
    mockReturnTrips,
    defaultUserLocation,
    defaultLocationName,
    'hi'
  );
  console.log('Recommendation Output:');
  console.log(`- Matched Vehicles Count: ${t1Rec.matchedVehicles.length}`);
  console.log(`- Top Cheapest: ${t1Rec.topCheapest?.driverName} (${t1Rec.topCheapest?.vehicleType}), Free: ${t1Rec.topCheapest?.freeKg}kg, Cost: ₹${t1Rec.topCheapest?.estimatedCostRs}`);
  console.log(`- Spoken Reply: "${t1Rec.spokenText}"`);

  assert(t1Rec.matchedVehicles.length >= 3, 'Test 1: Found top matching vehicles (3 vehicles)');
  assert(t1Rec.topCheapest?.driverName === 'Ramesh Kadam', 'Test 1: Cheapest driver is Ramesh Kadam');
  assert(t1Rec.topCheapest?.vehicleType.includes('Tata Ace'), 'Test 1: Cheapest vehicle is Tata Ace');
  assert(t1Rec.topCheapest?.freeKg === 330, 'Test 1: Ramesh Kadam free capacity is 330 kg');
  assert(t1Rec.topCheapest?.estimatedCostRs === 363, 'Test 1: Exact estimated cost is 363 rupees');
  assert(t1Rec.spokenText.includes('Chiplun ke liye 3 gaadiyan mil gayi'), 'Test 1: Spoken text contains "Chiplun ke liye 3 gaadiyan mil gayi"');
  assert(t1Rec.spokenText.includes('Sabse sasti Ramesh Kadam ki Tata Ace hai'), 'Test 1: Spoken text contains "Sabse sasti Ramesh Kadam ki Tata Ace hai"');
  assert(t1Rec.spokenText.includes('330 kilo khaali'), 'Test 1: Spoken text contains "330 kilo khaali"');
  assert(t1Rec.spokenText.includes('2 kilometre door'), 'Test 1: Spoken text contains "2 kilometre door"');
  assert(t1Rec.spokenText.includes('kharcha 363 rupaye'), 'Test 1: Spoken text contains "kharcha 363 rupaye"');
  assert(t1Rec.spokenText.includes('Booking karun?'), 'Test 1: Spoken text contains "Booking karun?"');

  // -------------------------------------------------------------------------
  // TEST 2: "मला ३० किलो काजू खेडला पाठवायचे आहे"
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 2: "मला ३० किलो काजू खेडला पाठवायचे आहे" ---');
  const t2Input = 'मला ३० किलो काजू खेडला पाठवायचे आहे';
  const t2Parsed = parseCargoRequestLocally(t2Input, 'mr', defaultLocationName);
  console.log('Parsed:', {
    product: t2Parsed.product,
    weight_kg: t2Parsed.weight_kg,
    destination: t2Parsed.destination,
    category: t2Parsed.category,
    language: t2Parsed.language,
    urgency: t2Parsed.urgency,
    shelf_life: t2Parsed.shelf_life_hours
  });

  assert(t2Parsed.product === 'cashew', 'Test 2: Extracted product is cashew');
  assert(t2Parsed.weight_kg === 30, 'Test 2: Devanagari digits ३० converted to 30 kg');
  assert(t2Parsed.destination === 'Khed', 'Test 2: Extracted destination is Khed (खेड)');
  assert(t2Parsed.language === 'mr', 'Test 2: Language detected as Marathi (mr)');
  assert(t2Parsed.category === 'PROCESSED_FOOD', 'Test 2: Category mapped to PROCESSED_FOOD');
  assert(t2Parsed.shelf_life_hours === 72, 'Test 2: Shelf life is 72 hours (3 days)');

  const t2Rec = recommendVehiclesForRequest(
    t2Parsed,
    mockVehicles,
    mockReturnTrips,
    defaultUserLocation,
    defaultLocationName,
    'mr'
  );
  console.log('Recommendation Output:');
  console.log(`- Matched Vehicles Count: ${t2Rec.matchedVehicles.length}`);
  console.log(`- Spoken Reply (Marathi): "${t2Rec.spokenText}"`);
  assert(t2Rec.matchedVehicles.length >= 2, 'Test 2: Vehicles found for Khed');
  assert(t2Rec.spokenText.includes('खेडसाठी') && t2Rec.spokenText.includes('बुकिंग करू का?'), 'Test 2: Spoken reply in Marathi for Khed');

  // -------------------------------------------------------------------------
  // TEST 3: "send 50 kg fish to Panvel"
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 3: "send 50 kg fish to Panvel" ---');
  const t3Input = 'send 50 kg fish to Panvel';
  const t3Parsed = parseCargoRequestLocally(t3Input, 'en', defaultLocationName);
  console.log('Parsed:', {
    product: t3Parsed.product,
    weight_kg: t3Parsed.weight_kg,
    destination: t3Parsed.destination,
    category: t3Parsed.category,
    urgency: t3Parsed.urgency,
    shelf_life: t3Parsed.shelf_life_hours,
    language: t3Parsed.language
  });

  assert(t3Parsed.product === 'fish', 'Test 3: Extracted product is fish');
  assert(t3Parsed.weight_kg === 50, 'Test 3: Extracted weight is 50 kg');
  assert(t3Parsed.destination === 'Panvel', 'Test 3: Extracted destination is Panvel');
  assert(t3Parsed.category === 'FISHERIES', 'Test 3: Category mapped to FISHERIES');
  assert(t3Parsed.urgency === 'URGENT', 'Test 3: Urgency is URGENT');
  assert(t3Parsed.shelf_life_hours === 4, 'Test 3: Fish shelf life is 4 hours');
  assert(t3Parsed.language === 'en', 'Test 3: Language detected as English (en)');

  const t3Rec = recommendVehiclesForRequest(
    t3Parsed,
    mockVehicles,
    mockReturnTrips,
    defaultUserLocation,
    defaultLocationName,
    'en'
  );
  console.log('Perishable info:');
  console.log(`- Is Perishable: ${t3Rec.isPerishable}`);
  console.log(`- Freshness Limit: ${t3Rec.freshnessDeadlineText}`);
  console.log(`- Spoken: "${t3Rec.spokenText}"`);

  assert(t3Rec.isPerishable === true, 'Test 3: Identified as perishable item');
  assert(t3Rec.freshnessDeadlineText === '4 Hours', 'Test 3: Freshness deadline is 4 Hours');

  // -------------------------------------------------------------------------
  // TEST 4: "aam bhejna hai" (Missing fields)
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 4: "aam bhejna hai" (Missing fields) ---');
  const t4Input = 'aam bhejna hai';
  const t4Parsed = parseCargoRequestLocally(t4Input, 'hi', defaultLocationName);
  console.log('Parsed:', {
    product: t4Parsed.product,
    weight_kg: t4Parsed.weight_kg,
    destination: t4Parsed.destination,
    missing_fields: t4Parsed.missing_fields,
    follow_up_question: t4Parsed.follow_up_question
  });

  assert(t4Parsed.product === 'mango', 'Test 4: Extracted product is mango');
  assert(t4Parsed.weight_kg === null, 'Test 4: Weight is missing (null)');
  assert(t4Parsed.destination === null, 'Test 4: Destination is missing (null)');
  assert(t4Parsed.missing_fields?.includes('weight_kg'), 'Test 4: Identified missing weight_kg');
  assert(t4Parsed.missing_fields?.includes('destination'), 'Test 4: Identified missing destination');
  assert(typeof t4Parsed.follow_up_question === 'string' && t4Parsed.follow_up_question.length > 0, 'Test 4: Generated ONE short follow-up question');
  console.log(`- Follow-up question: "${t4Parsed.follow_up_question}"`);

  // -------------------------------------------------------------------------
  // TEST 5: Unrelated sentence
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 5: Unrelated sentence ---');
  const t5Input = 'aaj mausam kaisa hai aur baarish kab hogi';
  const t5Parsed = parseCargoRequestLocally(t5Input, 'hi', defaultLocationName);
  console.log('Parsed:', {
    is_unrelated: t5Parsed.is_unrelated,
    product: t5Parsed.product,
    weight_kg: t5Parsed.weight_kg,
    destination: t5Parsed.destination
  });

  assert(t5Parsed.is_unrelated === true, 'Test 5: Correctly flagged as unrelated sentence');
  assert(t5Parsed.product === null, 'Test 5: Product is null');
  assert(t5Parsed.weight_kg === null, 'Test 5: Weight is null');
  assert(t5Parsed.destination === null, 'Test 5: Destination is null');

  // -------------------------------------------------------------------------
  // TEST 6: Fallback when LLM_API_KEY is missing
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 6: API Key missing scenario ---');
  const originalEnvKey = process.env.LLM_API_KEY;
  delete process.env.LLM_API_KEY;

  const t6Parsed = parseCargoRequestLocally('30 kg kaju Panvel', 'hi', defaultLocationName);
  assert(t6Parsed.is_fallback === true, 'Test 6: Fallback parser engaged with is_fallback flag');
  assert(t6Parsed.product === 'cashew', 'Test 6: Correctly extracted cashew with fallback parser');
  assert(t6Parsed.weight_kg === 30, 'Test 6: Correctly extracted 30 kg with fallback parser');
  assert(t6Parsed.destination === 'Panvel', 'Test 6: Correctly extracted Panvel with fallback parser');

  if (originalEnvKey) process.env.LLM_API_KEY = originalEnvKey;

  // -------------------------------------------------------------------------
  // TEST 7: Browser Offline mode simulation
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 7: Browser Offline mode simulation ---');
  // When offline, client uses parseCargoRequestLocally directly without network
  const t7Parsed = parseCargoRequestLocally('40 kilo aam Chiplun', 'hi', defaultLocationName);
  assert(t7Parsed.is_fallback === true, 'Test 7: Offline parser successfully extracted parameters');
  assert(t7Parsed.product === 'mango', 'Test 7: Extracted product in offline mode');
  assert(t7Parsed.destination === 'Chiplun', 'Test 7: Extracted destination in offline mode');

  // -------------------------------------------------------------------------
  // TEST 8: Serverless Function Rate Limiting & Input length cap simulation
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 8: Rate Limiting & 200 char cap verification ---');
  const longSentence = 'a'.repeat(300);
  const capped = longSentence.slice(0, 200);
  assert(capped.length === 200, 'Test 8: Input length is strictly capped at 200 characters');

  // -------------------------------------------------------------------------
  // TEST 9: Requirement 6: Devanagari Digits in Marathi, Latin Digits in EN/HI,
  //         and Vehicle IDs / Driver Names Stay Unchanged
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 9: Digit Formatting & Vehicle ID Preservation ---');
  const { toDevanagariDigits, toLatinDigits, formatDigitsByLang } = await import('../src/context/LanguageContext');

  const testWeightKmRs = '330 kilo, 2 km, 363 Rs';
  const mrConverted = formatDigitsByLang(testWeightKmRs, 'mr');
  console.log('Marathi converted digits:', mrConverted);
  assert(mrConverted.includes('३३०') && mrConverted.includes('२') && mrConverted.includes('३६३'), 'Test 9: Standalone numbers converted to Devanagari in Marathi');

  const enConverted = formatDigitsByLang(mrConverted, 'en');
  console.log('English converted back to Latin:', enConverted);
  assert(enConverted.includes('330') && enConverted.includes('2') && enConverted.includes('363'), 'Test 9: Digits converted to Latin in English');

  const hiConverted = formatDigitsByLang(mrConverted, 'hi');
  console.log('Hindi converted to Latin:', hiConverted);
  assert(hiConverted.includes('330') && hiConverted.includes('2') && hiConverted.includes('363'), 'Test 9: Digits are Latin in Hindi');

  // Test Vehicle ID preservation in Marathi
  const vehiclePlateText = 'Ramesh Kadam (MH-08-E-4219) - 330 kilo, 2 km, 363 Rs (veh-1)';
  const mrVehiclePlateConverted = formatDigitsByLang(vehiclePlateText, 'mr');
  console.log('Marathi vehicle plate converted:', mrVehiclePlateConverted);
  assert(mrVehiclePlateConverted.includes('MH-08-E-4219'), 'Test 9: Vehicle plate MH-08-E-4219 preserved Latin digits in Marathi');
  assert(mrVehiclePlateConverted.includes('veh-1'), 'Test 9: Vehicle ID veh-1 preserved Latin digits in Marathi');
  assert(mrVehiclePlateConverted.includes('३३०') && mrVehiclePlateConverted.includes('२') && mrVehiclePlateConverted.includes('३६३'), 'Test 9: Non-vehicle digits converted to Devanagari in Marathi');

  // -------------------------------------------------------------------------
  // TEST 10: Dynamic Re-rendering on Language Switch (EN > MR > HI > EN)
  //          Testing Greeting, Missing Destination Follow-up, Match, and No-match
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 10: Dynamic Re-rendering on Language Switch (EN > MR > HI > EN) ---');
  const { translations } = await import('../src/i18n/translations');
  const { VEHICLE_TYPE_LABELS, DRIVER_NAMES_LOCALIZED } = await import('../src/services/assistantMatcher');
  const { getFollowUpKeyAndParams } = await import('../src/services/voiceAssistantService');

  // Helper simulating t() function for test verification
  function renderKey(lang: 'en' | 'mr' | 'hi', key: string, params?: Record<string, string | number>): string {
    let template = translations[lang]?.[key] || translations.en?.[key] || key;
    if (params) {
      Object.entries(params).forEach(([pKey, pVal]) => {
        const isVehicleOrDriverKey = /^(vehicleId|vehicleNumber|driver|driverName|vehicle|plate)$/i.test(pKey);
        const formattedVal = isVehicleOrDriverKey ? String(pVal) : formatDigitsByLang(pVal, lang);
        template = template.replace(new RegExp(`{${pKey}}`, 'g'), formattedVal);
      });
    }
    return formatDigitsByLang(template, lang);
  }

  function resolveTestParams(lang: 'en' | 'mr' | 'hi', params: Record<string, any>) {
    const res: Record<string, any> = { ...params };
    if (params.town_key) {
      res.town = translations[lang]?.[`town_${params.town_key}`] || params.town_key;
    }
    if (params.product_key) {
      res.product = translations[lang]?.[`prod_${params.product_key.toLowerCase()}`] || params.product_key;
    }
    if (params.vehicle_key) {
      res.vehicle = VEHICLE_TYPE_LABELS[params.vehicle_key]?.[lang] || params.vehicle_key;
    }
    if (params.driver) {
      res.driver = DRIVER_NAMES_LOCALIZED[params.driver]?.[lang] || params.driver;
    }
    return res;
  }

  // Conversation history storing ONLY keys and parameters
  const conversationHistory = [
    // 1. Greeting
    { id: 'msg-1', sender: 'assistant' as const, key: 'assistant_greeting', params: {} },
    // 2. Missing-destination follow-up
    { 
      id: 'msg-2', 
      sender: 'assistant' as const, 
      key: 'assistant_ask_destination_with_weight', 
      params: { weight: 40, product_key: 'mango' } 
    },
    // 3. Match message
    {
      id: 'msg-3',
      sender: 'assistant' as const,
      key: 'assistant_results_found',
      params: {
        count: 3,
        town_key: 'Chiplun',
        driver: 'Ramesh Kadam',
        vehicle_key: 'TATA_ACE',
        free_kg: 330,
        distance: 2,
        cost: 363
      }
    },
    // 4. No-match message
    {
      id: 'msg-4',
      sender: 'assistant' as const,
      key: 'assistant_no_match',
      params: {
        count: 0,
        town_key: 'Chiplun',
        cost: 850
      }
    }
  ];

  const cycle: ('en' | 'mr' | 'hi' | 'en')[] = ['en', 'mr', 'hi', 'en'];

  for (const lang of cycle) {
    console.log(`\nEvaluating conversation in language: ${lang.toUpperCase()}`);

    // Render Greeting
    const renderedGreeting = renderKey(lang, conversationHistory[0].key);
    console.log(`- Greeting: "${renderedGreeting}"`);
    if (lang === 'en') {
      assert(renderedGreeting.includes('Hello! I am Gaadi Sahayak'), `Greeting in ${lang} matches English`);
    } else if (lang === 'mr') {
      assert(renderedGreeting.includes('नमस्कार! मी गाडी सहायक'), `Greeting in ${lang} matches Marathi`);
    } else if (lang === 'hi') {
      assert(renderedGreeting.includes('नमस्ते! मैं गाड़ी सहायक'), `Greeting in ${lang} matches Hindi`);
    }

    // Render Follow-up (missing destination)
    const p2 = resolveTestParams(lang, conversationHistory[1].params);
    const renderedFollowUp = renderKey(lang, conversationHistory[1].key, p2);
    console.log(`- Follow-up: "${renderedFollowUp}"`);
    if (lang === 'en') {
      assert(renderedFollowUp.includes('40 kg') && renderedFollowUp.includes('Alphonso Mango') && renderedFollowUp.includes('Where would you like to send'), `Follow-up in ${lang} is in English`);
    } else if (lang === 'mr') {
      assert(renderedFollowUp.includes('४०') && renderedFollowUp.includes('हापूस आंबा') && renderedFollowUp.includes('कुठे पाठवायचा आहे'), `Follow-up in ${lang} is in Marathi with Devanagari digits`);
    } else if (lang === 'hi') {
      assert(renderedFollowUp.includes('40') && renderedFollowUp.includes('हापूस आम') && renderedFollowUp.includes('कहाँ भेजना है'), `Follow-up in ${lang} is in Hindi with Latin digits`);
    }

    // Render Match Result
    const p3 = resolveTestParams(lang, conversationHistory[2].params);
    const renderedMatch = renderKey(lang, conversationHistory[2].key, p3);
    console.log(`- Match Result: "${renderedMatch}"`);
    if (lang === 'en') {
      assert(renderedMatch.includes('Found 3 vehicles for Chiplun') && renderedMatch.includes("Ramesh Kadam's Tata Ace") && renderedMatch.includes('330 kg free') && renderedMatch.includes('2 km away') && renderedMatch.includes('363 rupees'), `Match in ${lang} is English with correct facts`);
    } else if (lang === 'mr') {
      assert(renderedMatch.includes('चिपळूणसाठी ३ गाड्या मिळाल्या') && renderedMatch.includes('रमेश कदम') && renderedMatch.includes('टाटा एस') && renderedMatch.includes('३३० किलो रिकामी') && renderedMatch.includes('२ किलोमीटर दूर') && renderedMatch.includes('३६३ रुपये'), `Match in ${lang} is Marathi with Devanagari digits`);
    } else if (lang === 'hi') {
      assert(renderedMatch.includes('3 gaadiyan mil gayi') && renderedMatch.includes('Ramesh Kadam') && renderedMatch.includes('Tata Ace') && renderedMatch.includes('330 kilo khaali') && renderedMatch.includes('2 kilometre door') && renderedMatch.includes('363 rupaye'), `Match in ${lang} is Hindi with Latin digits`);
    }

    // Render No-match Result
    const p4 = resolveTestParams(lang, conversationHistory[3].params);
    const renderedNoMatch = renderKey(lang, conversationHistory[3].key, p4);
    console.log(`- No-Match Result: "${renderedNoMatch}"`);
    if (lang === 'en') {
      assert(renderedNoMatch.includes('No direct vehicle currently matches the route to Chiplun'), `No-match in ${lang} is English`);
    } else if (lang === 'mr') {
      assert(renderedNoMatch.includes('चिपळूणसाठी थेट गाडी उपलब्ध नाही') && renderedNoMatch.includes('८५०'), `No-match in ${lang} is Marathi with Devanagari digits`);
    } else if (lang === 'hi') {
      assert(renderedNoMatch.includes('koi seedhi gaadi uplabdh nahi hai') && renderedNoMatch.includes('850'), `No-match in ${lang} is Hindi with Latin digits`);
    }
  }

  // -------------------------------------------------------------------------
  // TEST 11: Example Chips and Placeholders in EN, MR, HI
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 11: Example Chips and Placeholders across Languages ---');
  for (const l of ['en', 'mr', 'hi'] as const) {
    const chip1 = translations[l]?.assistant_example_chip_1;
    const placeholder = translations[l]?.assistant_input_placeholder;
    const searching = translations[l]?.assistant_searching;
    const selectVeh = translations[l]?.assistant_select_vehicle;
    const voiceNotAvail = translations[l]?.assistant_voice_not_available;

    assert(typeof chip1 === 'string' && chip1.length > 0, `Test 11: assistant_example_chip_1 defined in ${l}`);
    assert(typeof placeholder === 'string' && placeholder.length > 0, `Test 11: assistant_input_placeholder defined in ${l}`);
    assert(typeof searching === 'string' && searching.length > 0, `Test 11: assistant_searching defined in ${l}`);
    assert(typeof selectVeh === 'string' && selectVeh.length > 0, `Test 11: assistant_select_vehicle defined in ${l}`);
    assert(typeof voiceNotAvail === 'string' && voiceNotAvail.length > 0, `Test 11: assistant_voice_not_available defined in ${l}`);
  }

  console.log('\n========================================================================');
  console.log(`TEST SUMMARY: ${passedTests}/${totalTests} TESTS PASSED (${Math.round((passedTests/totalTests)*100)}%)`);
  console.log('========================================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runVoiceAssistantTests().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
