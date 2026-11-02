/**
 * StudySaathi AI — Role-Aware Learning Gap & Parent Bridge Engine (Phase 6)
 *
 * Implements deterministic multi-role interpretation of student learning gaps:
 * 1. TEACHER: Professional diagnosis, triggers, root cause, evidence, severity score, prescriptions.
 * 2. STUDENT: Growth-oriented, age-appropriate language (NEVER "deficit", "obstacle", "failure").
 * 3. PARENT: Non-technical language, strengths, current focus, and one simple 5–10 min home activity.
 *
 * Multilingual support: English (en), Gujarati (gu), Hindi (hi).
 */

import type {
  LearningGap,
  AudienceRole,
  RoleAwareGapInterpretation,
  ParentHomeActivity,
} from "../../../packages/shared/src/types/gap";

// =========================================================================
// PARENT HOME ACTIVITIES CATALOG (Gujarat Primary Context, Low-Cost Household Items)
// =========================================================================

interface HomeActivityTemplate {
  conceptKeys: string[];
  durationMinutes: number;
  materialsEn: string[];
  materialsGu: string[];
  materialsHi: string[];
  titleEn: string;
  titleGu: string;
  titleHi: string;
  whatParentDoesEn: string;
  whatParentDoesGu: string;
  whatParentDoesHi: string;
  whatChildPracticesEn: string;
  whatChildPracticesGu: string;
  whatChildPracticesHi: string;
  conversationalPromptEn: string;
  conversationalPromptGu: string;
  conversationalPromptHi: string;
}

const HOME_ACTIVITIES_CATALOG: HomeActivityTemplate[] = [
  {
    conceptKeys: ["PLACE_VALUE", "c-pv-01", "tens and ones", "સ્થાનકિંમત"],
    durationMinutes: 5,
    materialsEn: ["Matchsticks or toothpicks", "2 rubber bands or string"],
    materialsGu: ["દિવાસળી અથવા ટૂથપિક", "૨ રબર બેન્ડ અથવા દોરો"],
    materialsHi: ["माचिस की तीलियां या टूथपिक", "२ रबर बैंड या धागा"],
    titleEn: "5-Minute Bundle Builder",
    titleGu: "૫-મિનિટ જૂથ બનાવો પ્રવૃત્તિ",
    titleHi: "५-मिनट बंडल बनाओ गतिविधि",
    whatParentDoesEn:
      "Bundle 10 matchsticks together with a rubber band to represent 'Ten'. Keep individual sticks as 'Ones'. Call out a number like 24 and ask your child to show it with bundles and loose sticks.",
    whatParentDoesGu:
      "૧૦ દિવાસળીઓને રબર બેન્ડથી બાંધીને 'દશક'નું જૂથ બનાવો. છૂટી દિવાસળીને 'એકમ' ગણો. ૨૪ જેવો નંબર બોલો અને બાળકને જૂથ અને છૂટી દિવાસળીથી દર્શાવવા કહો.",
    whatParentDoesHi:
      "१० माचिस की तीलियों को रबर बैंड से बांधकर 'दहाई' का बंडल बनाएं। खुली तीलियों को 'इकाई' मानें। २४ जैसी संख्या बोलें और बच्चे से बंडल और खुली तीलियों से दिखाने को कहें।",
    whatChildPracticesEn:
      "Seeing that a two-digit number is made of groups of tens and single ones, building strong mental models.",
    whatChildPracticesGu:
      "બે અંકની સંખ્યા દશકના જૂથ અને છૂટા એકમથી બને છે તે મૂર્ત રીતે સમજવું.",
    whatChildPracticesHi:
      "दो अंकों की संख्या दहाई और इकाई के समूहों से मिलकर बनती है, इसे मूर्त रूप से समझना।",
    conversationalPromptEn:
      "\"Show me 34 using your bundles of ten and loose sticks! How many tens and how many ones do you have?\"",
    conversationalPromptGu:
      "\"દશકના જૂથ અને છૂટી દિવાસળીથી ૩૪ બનાવી બતાવ! તારી પાસે કેટલા દશક અને કેટલા એકમ છે?\"",
    conversationalPromptHi:
      "\"दहाई के बंडल और खुली तीलियों से ३४ बनाकर दिखाओ! तुम्हारे पास कितनी दहाई और कितनी इकाई हैं?\"",
  },
  {
    conceptKeys: ["ADDITION_REGROUPING", "c-add-01", "3-digit addition", "વદ્દીવાળા સરવાળા", "regrouping"],
    durationMinutes: 8,
    materialsEn: ["20 small beans, rajma, or coins", "2 small bowls or paper cups"],
    materialsGu: ["૨૦ નાના દાણા, રાજમા અથવા સિક્કા", "૨ નાની વાટકી અથવા કાગળના કપ"],
    materialsHi: ["२० छोटे दाने, राजमा या सिक्के", "२ छोटी कटोरी या कागज के कप"],
    titleEn: "8-Minute Bean Regrouping Game",
    titleGu: "૮-મિનિટ રાજમા વદ્દી રમત",
    titleHi: "८-मिनट राजमा हासिल खेल",
    whatParentDoesEn:
      "Make two small piles (e.g. 18 beans and 15 beans). Have your child count the ones beans together. When they reach 10, have them trade those 10 beans for 1 coin into the 'Tens cup'.",
    whatParentDoesGu:
      "બે નાના ઢગલા કરો (દા.ત. ૧૮ દાણા અને ૧૫ દાણા). બાળકને એકમના દાણા ભેગા ગણવા કહો. જ્યારે ૧૦ થાય, ત્યારે તે ૧૦ દાણાના બદલામાં ૧ સિક્કો 'દશકની વાટકી'માં મૂકવા કહો.",
    whatParentDoesHi:
      "दो छोटे ढेर बनाएं (जैसे १८ दाने और १५ दाने)। बच्चे से इकाई के दाने एक साथ गिनने को कहें। जब १० हो जाएं, तो उन १० दानों के बदले १ सिक्का 'दहाई की कटोरी' में रखने को कहें।",
    whatChildPracticesEn:
      "Understanding why carrying over (regrouping) happens when ones exceed 9, instead of memorizing abstract steps.",
    whatChildPracticesGu:
      "૯થી વધુ એકમ થાય ત્યારે વદ્દી કેમ ચડે છે તે ગોખવાને બદલે મૂર્ત અનુભવથી સમજવું.",
    whatChildPracticesHi:
      "इकाई ९ से अधिक होने पर हासिल क्यों लगता है, इसे रटने के बजाय मूर्त अनुभव से समझना।",
    conversationalPromptEn:
      "\"When we count 10 loose beans, what do we trade them for? Where does the new ten go?\"",
    conversationalPromptGu:
      "\"જ્યારે ૧૦ છૂટા દાણા થાય, ત્યારે તેના બદલામાં આપણે શું લઈએ છીએ? તે નવો દશક ક્યાં જાય?\"",
    conversationalPromptHi:
      "\"जब १० खुले दाने हो जाते हैं, तो उनके बदले हम क्या लेते हैं? वह नई दहाई कहाँ जाती है?\"",
  },
  {
    conceptKeys: ["MULTIPLICATION_TABLES", "c-mult-01", "multiplication", "ઘડિયા", "ગુણાકાર"],
    durationMinutes: 5,
    materialsEn: ["12 to 24 spoons, bottle caps, or buttons"],
    materialsGu: ["૧૨ થી ૨૪ ચમચી, બોટલના ઢાંકણા અથવા બટન"],
    materialsHi: ["१२ से २४ चम्मच, ढक्कन या बटन"],
    titleEn: "5-Minute Equal Groups Challenge",
    titleGu: "૫-મિનિટ સરખા જૂથ પડકાર",
    titleHi: "५-मिनट बराबर समूह चुनौती",
    whatParentDoesEn:
      "Place 12 spoons on the table. Ask your child to arrange them into 3 equal rows of 4 spoons, then 4 equal rows of 3 spoons. Ask how rows and groups relate to multiplication.",
    whatParentDoesGu:
      "ટેબલ પર ૧૨ ચમચી મૂકો. બાળકને ૪ ચમચીની ૩ સરખી હરોળ, પછી ૩ ચમચીની ૪ સરખી હરોળ ગોઠવવા કહો. હરોળ અને જૂથ ગુણાકાર સાથે કેવી રીતે જોડાય છે તે પૂછો.",
    whatParentDoesHi:
      "मेज पर १२ चम्मच रखें। बच्चे से ४ चम्मचों की ३ बराबर पंक्तियाँ, फिर ३ चम्मचों की ४ बराबर पंक्तियाँ बनाने को कहें। पंक्तियाँ और समूह गुणा से कैसे जुड़े हैं, यह पूछें।",
    whatChildPracticesEn:
      "Seeing that multiplication is equal groups (arrays), building genuine mathematical reasoning before speed drill.",
    whatChildPracticesGu:
      "ગુણાકાર એટલે સમાન જૂથોનો સરવાળો તે સમજીને ઘડિયા પાકા કરવા.",
    whatChildPracticesHi:
      "गुणा का मतलब समान समूहों का जोड़ है, इसे समझकर पहाड़े पक्के करना।",
    conversationalPromptEn:
      "\"If we have 3 plates with 4 spoons each, how many spoons do we have altogether? 3 times 4 is...?\"",
    conversationalPromptGu:
      "\"જો આપણી પાસે ૪ ચમચીવાળી ૩ થાળી હોય, તો કુલ કેટલી ચમચી થાય? ૩ ગુણ્યા ૪ એટલે...?\"",
    conversationalPromptHi:
      "\"अगर हमारे पास ४ चम्मचों वाली ३ प्लेटें हों, तो कुल कितनी चम्मचें हुईं? ३ गुणा ४ कितना हुआ?\"",
  },
  {
    conceptKeys: ["DIVISION_EQUAL_SHARING", "c-div-01", "division", "ભાગાકાર", "equal sharing"],
    durationMinutes: 5,
    materialsEn: ["12 biscuits, grapes, or bottle caps", "3 small plates or bowls"],
    materialsGu: ["૧૨ બિસ્કિટ, દ્રાક્ષ અથવા બોટલના ઢાંકણા", "૩ નાની પ્લેટ"],
    materialsHi: ["१२ बिस्कुट, अंगूर या ढक्कन", "३ छोटी प्लेटें"],
    titleEn: "5-Minute Fair Sharing Snack Time",
    titleGu: "૫-મિનિટ સરખે ભાગે વહેંચણી રમત",
    titleHi: "५-मिनट बराबर बंटवारा खेल",
    whatParentDoesEn:
      "Give your child 12 biscuits and 3 plates. Ask them to share the biscuits one by one fairly so every plate gets the exact same amount. Then count each plate.",
    whatParentDoesGu:
      "બાળકને ૧૨ બિસ્કિટ અને ૩ પ્લેટ આપો. દરેક પ્લેટમાં એક-એક કરીને બિસ્કિટ સરખે ભાગે વહેંચવા કહો જેથી બધાને સરખા મળે. પછી દરેક પ્લેટ ગણો.",
    whatParentDoesHi:
      "बच्चे को १२ बिस्कुट और ३ प्लेटें दें। हर प्लेट में एक-एक करके बिस्कुट बराबर बांटने को कहें ताकि सबको बराबर मिलें। फिर हर प्लेट को गिनें।",
    whatChildPracticesEn:
      "Connecting real-life sharing to mathematical division (12 ÷ 3 = 4) before doing symbolic arithmetic.",
    whatChildPracticesGu:
      "વાસ્તવિક વહેંચણીને ગણિતના ભાગાકાર (૧૨ ÷ ૩ = ૪) સાથે સાંકળવી.",
    whatChildPracticesHi:
      "वास्तविक बंटवारे को गणित के भाग (१२ ÷ ३ = ४) से जोड़ना।",
    conversationalPromptEn:
      "\"We shared 12 biscuits among 3 plates. How many does each plate get? How do we write that in math?\"",
    conversationalPromptGu:
      "\"આપણે ૧૨ બિસ્કિટ ૩ પ્લેટમાં વહેંચ્યા. દરેકને કેટલા મળ્યા? તેને ગણિતમાં કેવી રીતે લખાય?\"",
    conversationalPromptHi:
      "\"हमने १२ बिस्कुट ३ प्लेटों में बांटे। हर प्लेट को कितने मिले? इसे गणित में कैसे लिखेंगे?\"",
  },
  {
    conceptKeys: ["FRACTIONS", "c-frac-01", "fractions", "અપૂર્ણાંક"],
    durationMinutes: 6,
    materialsEn: ["1 roti, paratha, or a paper circle", "A child-safe plate or knife"],
    materialsGu: ["૧ રોટલી, પરાઠા અથવા કાગળનું વર્તુળ", "કાતર અથવા સલામત પ્લેટ"],
    materialsHi: ["१ रोटी, पराठा या कागज का गोला", "कैंची या सुरक्षित प्लेट"],
    titleEn: "6-Minute Kitchen Fraction Folding",
    titleGu: "૬-મિનિટ રોટલી અપૂર્ણાંક રમત",
    titleHi: "६-मिनट रोटी भिन्न खेल",
    whatParentDoesEn:
      "Take a roti or paper circle. Ask your child to fold or cut it into 2 equal halves. Then fold each half again to make 4 equal quarters. Ask them to point to 1/2 and 1/4.",
    whatParentDoesGu:
      "એક રોટલી અથવા કાગળનું ગોળ લો. બાળકને તેના ૨ સરખા અડધા ભાગ કરવા કહો. પછી ફરીથી વાળીને ૪ સરખા પા ભાગ બનાવો. ૧/૨ અને ૧/૪ બતાવવા કહો.",
    whatParentDoesHi:
      "एक रोटी या कागज का गोला लें। बच्चे से उसके २ बराबर आधे हिस्से करने को कहें। फिर दोबारा मोड़कर ४ बराबर चौथाई हिस्से बनाएं। १/२ और १/४ दिखाने को कहें।",
    whatChildPracticesEn:
      "Grasping that fractions represent equal pieces of one whole object.",
    whatChildPracticesGu:
      "અપૂર્ણાંક એ એક આખી વસ્તુના સરખા ભાગ દર્શાવે છે તે પ્રત્યક્ષ જોવું.",
    whatChildPracticesHi:
      "भिन्न एक पूरी वस्तु के बराबर हिस्सों को दर्शाता है, इसे प्रत्यक्ष देखना।",
    conversationalPromptEn:
      "\"If you eat 1 of these 4 equal pieces, what fraction of the whole roti did you eat? 1 out of 4 is 1/4!\"",
    conversationalPromptGu:
      "\"જો તું ૪ સરખા ભાગમાંથી ૧ ભાગ ખાય, તો આખી રોટલીનો કેટલો ભાગ ખાધો કહેવાય? ૪ માંથી ૧ એટલે ૧/૪!\"",
    conversationalPromptHi:
      "\"अगर तुम इन ४ बराबर टुकड़ों में से १ टुकड़ा खाओ, तो पूरी रोटी का कितना हिस्सा खाया? ४ में से १ यानी १/४!\"",
  },
  {
    conceptKeys: ["READING_COMPREHENSION", "c-comp-01", "comprehension", "વાંચન અને સમજણ", "reading"],
    durationMinutes: 7,
    materialsEn: ["A short 4–5 sentence storybook, Gujarati textbook, or newspaper snippet"],
    materialsGu: ["૪–૫ વાક્યની ટૂંકી વાર્તા અથવા પાઠ્યપુસ્તકનો ફકરો"],
    materialsHi: ["४–५ वाक्यों की छोटी कहानी या पाठ्यपुस्तक का पैराग्राफ"],
    titleEn: "7-Minute Story Detective",
    titleGu: "૭-મિનિટ વાર્તા ડિટેક્ટીવ રમત",
    titleHi: "७-मिनट कहानी जासूस खेल",
    whatParentDoesEn:
      "Read a short 4-sentence story together with your child. Stop and ask 2 gentle detective questions: 'Who is the main person?' and 'Where are they going?' Ask them to point with their finger to where the story tells us.",
    whatParentDoesGu:
      "બાળક સાથે ૪ વાક્યની ટૂંકી વાર્તા વાંચો. પછી ૨ સરળ પ્રશ્નો પૂછો: 'આ વાર્તામાં કોણ છે?' અને 'તે ક્યાં જાય છે?' વાર્તામાં જ્યાં જવાબ હોય ત્યાં આંગળી મૂકી બતાવવા કહો.",
    whatParentDoesHi:
      "बच्चे के साथ ४ वाक्यों की छोटी कहानी पढ़ें। फिर २ आसान सवाल पूछें: 'इस कहानी में कौन है?' और 'वह कहाँ जा रहा है?' कहानी में जहाँ जवाब हो वहाँ उंगली रखकर दिखाने को कहें।",
    whatChildPracticesEn:
      "Finding explicit textual evidence rather than guessing answers from memory.",
    whatChildPracticesGu:
      "અંદાજ લગાવવાને બદલે લખાણમાં આંગળી મૂકી ચોક્કસ જવાબ શોધવાની ટેવ પાડવી.",
    whatChildPracticesHi:
      "अंदाजा लगाने के बजाय पाठ में देखकर सही उत्तर ढूंढने की आदत डालना।",
    conversationalPromptEn:
      "\"Can you point with your finger to the exact sentence that told us what the bird did?\"",
    conversationalPromptGu:
      "\"પક્ષીએ શું કર્યું તે વાર્તામાં કયા વાક્યમાં લખ્યું છે તેના પર આંગળી મૂકી બતાવ!\"",
    conversationalPromptHi:
      "\"पक्षी ने क्या किया, यह कहानी में किस वाक्य में लिखा है, उस पर उंगली रखकर बताओ!\"",
  },
  {
    conceptKeys: ["WATER_CYCLE", "c-evs-01", "water cycle", "જળચક્ર"],
    durationMinutes: 5,
    materialsEn: ["A transparent glass of cold water with ice cubes"],
    materialsGu: ["બરફવાળા ઠંડા પાણીનો કાચનો ગ્લાસ"],
    materialsHi: ["बर्फ वाले ठंडे पानी का कांच का गिलास"],
    titleEn: "5-Minute Droplet Mystery",
    titleGu: "૫-મિનિટ પાણીના ટીપાંનું રહસ્ય",
    titleHi: "५-मिनट पानी की बूंदों का रहस्य",
    whatParentDoesEn:
      "Place a cold glass of ice water on the table for 2 minutes. Watch moisture droplets form on the outside glass surface. Ask your child where the drops came from.",
    whatParentDoesGu:
      "ટેબલ પર ૨ મિનિટ માટે બરફના પાણીનો ગ્લાસ મૂકો. બહારની સપાટી પર પાણીના ટીપાં જામતા બતાવો. બાળકને પૂછો કે આ ટીપાં ક્યાંથી આવ્યા?",
    whatParentDoesHi:
      "मेज पर २ मिनट के लिए बर्फ के पानी का गिलास रखें। बाहर की सतह पर पानी की बूंदें बनते दिखाएं। बच्चे से पूछें कि ये बूंदें कहाँ से आईं?",
    whatChildPracticesEn:
      "Observing condensation in daily life, connecting invisible water vapor to clouds and rain.",
    whatChildPracticesGu:
      "હવામાં રહેલી વરાળ ઠંડી પડીને ટીપાં બને છે (ઘનીભવન) તે પ્રત્યક્ષ જોઈને જળચક્ર સમજવું.",
    whatChildPracticesHi:
      "हवा में मौजूद भाप ठंडी होकर बूंदें बनती है (संघनन), इसे प्रत्यक्ष देखकर जलचक्र समझना।",
    conversationalPromptEn:
      "\"The glass is not leaking! Where did this water on the outside come from? (Hint: The air has hidden water vapor!)\"",
    conversationalPromptGu:
      "\"ગ્લાસ ફૂટેલો નથી! તો બહાર પાણી ક્યાંથી આવ્યું? (સંકેત: હવામાં છૂપી વરાળ હોય છે!)\"",
    conversationalPromptHi:
      "\"गिलास टूटा नहीं है! तो बाहर पानी कहाँ से आया? (संकेत: हवा में छुपी भाप होती है!)\"",
  },
];

// =========================================================================
// PUBLIC HELPER: GENERATE PARENT HOME ACTIVITY
// =========================================================================

export function generateParentHomeActivity(
  gap: {
    id?: string;
    conceptId?: string;
    conceptName?: string;
    subjectCode?: string;
  },
  language: "en" | "gu" | "hi" = "en"
): ParentHomeActivity {
  const cName = String(gap.conceptName || "").toLowerCase();
  const cId = String(gap.conceptId || "").toLowerCase();

  // Find matching template in catalog
  const matched = HOME_ACTIVITIES_CATALOG.find((t) =>
    t.conceptKeys.some((k) => cName.includes(k.toLowerCase()) || cId.includes(k.toLowerCase()))
  );

  if (matched) {
    const materials =
      language === "gu"
        ? matched.materialsGu
        : language === "hi"
        ? matched.materialsHi
        : matched.materialsEn;

    const title =
      language === "gu"
        ? matched.titleGu
        : language === "hi"
        ? matched.titleHi
        : matched.titleEn;

    const whatParentDoes =
      language === "gu"
        ? matched.whatParentDoesGu
        : language === "hi"
        ? matched.whatParentDoesHi
        : matched.whatParentDoesEn;

    const whatChildPractices =
      language === "gu"
        ? matched.whatChildPracticesGu
        : language === "hi"
        ? matched.whatChildPracticesHi
        : matched.whatChildPracticesEn;

    const conversationalPrompt =
      language === "gu"
        ? matched.conversationalPromptGu
        : language === "hi"
        ? matched.conversationalPromptHi
        : matched.conversationalPromptEn;

    return {
      id: `act-${gap.conceptId || "generic"}-${Date.now()}`,
      conceptId: gap.conceptId,
      conceptName: gap.conceptName || "Curricular Concept",
      title,
      titleGu: matched.titleGu,
      titleHi: matched.titleHi,
      durationMinutes: matched.durationMinutes,
      commonHouseholdMaterials: materials,
      whatParentDoes,
      whatParentDoesGu: matched.whatParentDoesGu,
      whatParentDoesHi: matched.whatParentDoesHi,
      whatChildPractices,
      whatChildPracticesGu: matched.whatChildPracticesGu,
      whatChildPracticesHi: matched.whatChildPracticesHi,
      conversationalPrompt,
      conversationalPromptGu: matched.conversationalPromptGu,
      conversationalPromptHi: matched.conversationalPromptHi,
      language,
      status: "Suggested",
    };
  }

  // Safe universal fallback using pencil and paper
  const defaultTitle =
    language === "gu"
      ? "૫-મિનિટ ઘર ચર્ચા પ્રવૃત્તિ"
      : language === "hi"
      ? "५-मिनट घर चर्चा गतिविधि"
      : "5-Minute Kitchen Chat & Practice";

  const defaultParentDoes =
    language === "gu"
      ? `આજે સાંજે બાળક સાથે બેસીને ${gap.conceptName || "આ વિષય"} વિશે ૩ સરળ પ્રશ્નો પૂછો અને તેની સમજણને પ્રોત્સાહિત કરો.`
      : language === "hi"
      ? `आज शाम बच्चे के साथ बैठकर ${gap.conceptName || "इस विषय"} पर ३ सरल प्रश्न पूछें और उसकी समझ को प्रोत्साहित करें।`
      : `Sit together for 5 minutes and ask your child to explain ${gap.conceptName || "this concept"} in their own words using everyday examples.`;

  const defaultChildPractices =
    language === "gu"
      ? "પોતાના શબ્દોમાં સમજાવવાથી વિભાવના મજબૂત બને છે."
      : language === "hi"
      ? "अपने शब्दों में समझाने से अवधारणा मजबूत होती है।"
      : "Explaining in their own words clarifies understanding and builds confidence.";

  const defaultPrompt =
    language === "gu"
      ? `"આજે તમે વર્ગમાં આ વિષયમાં શું નવું શીખ્યા? મને એક ઉદાહરણ આપી સમજાવો!"`
      : language === "hi"
      ? `"आज आपने कक्षा में इस विषय में क्या नया सीखा? मुझे एक उदाहरण देकर समझाओ!"`
      : `"Can you teach me how you solved this in class today? Give me one real-life example!"`;

  return {
    id: `act-${gap.conceptId || "generic"}-${Date.now()}`,
    conceptId: gap.conceptId,
    conceptName: gap.conceptName || "Curricular Concept",
    title: defaultTitle,
    titleGu: "૫-મિનિટ ઘર ચર્ચા પ્રવૃત્તિ",
    titleHi: "५-मिनट घर चर्चा गतिविधि",
    durationMinutes: 5,
    commonHouseholdMaterials:
      language === "gu"
        ? ["કાગળ અને પેન્સિલ"]
        : language === "hi"
        ? ["कागज और पेंसिल"]
        : ["Paper and pencil"],
    whatParentDoes: defaultParentDoes,
    whatParentDoesGu: `આજે સાંજે બાળક સાથે બેસીને ${gap.conceptName || "આ વિષય"} વિશે ૩ સરળ પ્રશ્નો પૂછો અને તેની સમજણને પ્રોત્સાહિત કરો.`,
    whatParentDoesHi: `आज शाम बच्चे के साथ बैठकर ${gap.conceptName || "इस विषय"} पर ३ सरल प्रश्न पूछें और उसकी समझ को प्रोत्साहित करें।`,
    whatChildPractices: defaultChildPractices,
    whatChildPracticesGu: "પોતાના શબ્દોમાં સમજાવવાથી વિભાવના મજબૂત બને છે.",
    whatChildPracticesHi: "अपने शब्दों में समझाने से अवधारणा मजबूत होती है।",
    conversationalPrompt: defaultPrompt,
    conversationalPromptGu: `"આજે તમે વર્ગમાં આ વિષયમાં શું નવું શીખ્યા? મને એક ઉદાહરણ આપી સમજાવો!"`,
    conversationalPromptHi: `"आज आपने कक्षा में इस विषय में क्या नया सीखा? मुझे एक उदाहरण देकर समझाओ!"`,
    language,
    status: "Suggested",
  };
}

// =========================================================================
// MAIN ENGINE: ROLE-AWARE LEARNING GAP INTERPRETATION
// =========================================================================

export function getRoleAwareGapInterpretation(
  gap: LearningGap & {
    dynamicStatus?: string;
    dynamicPriority?: string;
    dynamicSeverityScore?: number;
    dynamicDiagnosis?: string;
    dynamicGapType?: string;
    dynamicTriggerRule?: string;
    dynamicRootConcept?: { name: string };
    dynamicPrescription?: any;
    assessmentHistory?: any[];
  },
  role: AudienceRole = "teacher",
  language: "en" | "gu" | "hi" = "en"
): RoleAwareGapInterpretation {
  const studentName = gap.studentName || (language === "gu" ? "વિદ્યાર્થી" : "Student");
  const conceptName = gap.conceptName || (language === "gu" ? "સંકલ્પના" : "Concept");
  const currentScore = gap.currentScore ?? gap.latestPercentage ?? 0;
  const previousScore = gap.previousScore ?? gap.previousPercentage;
  const status = gap.dynamicStatus || gap.masteryStatus || (currentScore >= 80 ? "Mastered" : currentScore >= 60 ? "Developing" : "Needs Support");
  const isMastered = status === "Mastered" || currentScore >= 80;
  const isDeveloping = status === "Developing";
  const trend = gap.trend || (gap.latestScoreDelta && gap.latestScoreDelta > 0 ? "Improving" : "Stable");

  // Pre-generate parent home activity using common household materials
  const homeActivity = generateParentHomeActivity(gap, language);

  // -------------------------------------------------------------------------
  // 1. STUDENT VIEW (Growth-oriented, age-appropriate, zero negative labels)
  // -------------------------------------------------------------------------
  if (role === "student") {
    let badgeLabel = "On Track";
    let badgeVariant: RoleAwareGapInterpretation["badgeVariant"] = "mint";
    let headline = "Great job!";
    let studentEncouragement = "You're doing awesome work!";
    let currentGoal = `Mastering ${conceptName}`;
    let nextActivityPrompt = `Play the ${homeActivity.durationMinutes}-minute challenge!`;

    if (isMastered) {
      badgeLabel = language === "gu" ? "તારક સિદ્ધિ (Mastered)" : language === "hi" ? "शानदार उपलब्धि (Mastered)" : "Star Skill Mastered!";
      badgeVariant = "mastered";
      headline = language === "gu" ? "શાબાશ! તમે આ સંકલ્પના જીતી લીધી છે!" : language === "hi" ? "शाबाश! आपने यह अवधारणा सीख ली है!" : "Awesome! You've mastered this skill!";
      studentEncouragement = language === "gu"
        ? `તમે ${conceptName} માં ખૂબ જ સરસ પ્રદર્શન કર્યું છે. આ જ રીતે આગળ વધતા રહો!`
        : language === "hi"
        ? `आपने ${conceptName} में बहुत अच्छा प्रदर्शन किया है। ऐसे ही आगे बढ़ते रहें!`
        : `You understand ${conceptName} thoroughly! Keep applying it to new fun challenges.`;
      nextActivityPrompt = language === "gu" ? "નવા પડકારો માટે તૈયાર રહો!" : language === "hi" ? "नई चुनौतियों के लिए तैयार रहें!" : "Ready for next exciting adventure!";
    } else if (isDeveloping || trend === "Improving") {
      badgeLabel = language === "gu" ? "તમે નજીક છો! (Developing)" : language === "hi" ? "आप लक्ष्य के करीब हैं!" : "You're getting there!";
      badgeVariant = "saffron";
      headline = language === "gu" ? "સરસ પ્રગતિ — નિપુણતા ફક્ત એક ડગલું દૂર છે!" : language === "hi" ? "शानदार प्रगति — सफलता बस एक कदम दूर है!" : "Great progress — one more step to mastery!";
      studentEncouragement = language === "gu"
        ? `તમે પાયાના ખ્યાલો સમજો છો. હવે ${conceptName} નો થોડો વધુ મહાવરો કરીએ!`
        : language === "hi"
        ? `आप मुख्य बातें समझ रहे हैं। अब ${conceptName} का थोड़ा और अभ्यास करते हैं!`
        : `You understand the key steps. Let's do a quick fun practice to cross the bridge!`;
      nextActivityPrompt = language === "gu" ? "૫ મિનિટની રમૂજી પ્રવૃત્તિ રમો" : language === "hi" ? "५ मिनट की मजेदार गतिविधि खेलें" : "Play a 5-minute practice game";
    } else {
      // Needs Support: STRICT RULE -> NEVER say "Critical deficit", "Failure", or "Obstacle"
      badgeLabel = language === "gu" ? "ચાલો સાથે શીખીએ" : language === "hi" ? "चलो साथ सीखें" : "Let's Practice Together!";
      badgeVariant = "saffron";
      headline = language === "gu" ? "ચાલો સાથે મળીને આ સંકલ્પના જીતીએ!" : language === "hi" ? "चलो मिलकर यह कौशल सीखें!" : "You can do this! Let's build your superpower!";
      studentEncouragement = language === "gu"
        ? `દરેક નવો વિચાર શીખવામાં સમય લાગે છે. મૂર્ત વસ્તુઓ સાથે ${conceptName} સરળ બની જશે!`
        : language === "hi"
        ? `हर नई बात सीखने में थोड़ा समय लगता है। खेल-खेल में ${conceptName} बहुत आसान हो जाएगा!`
        : `Every champion practices! Using counting blocks or drawings makes ${conceptName} easy and fun.`;
      nextActivityPrompt = language === "gu" ? "બ્લોક્સ સાથે ૫-મિનિટની પ્રવૃત્તિ શરૂ કરો" : language === "hi" ? "ब्लॉक्स के साथ ५-मिनट खेल शुरू करें" : "Try a 5-minute hands-on activity";
    }

    const progressNarrative = previousScore !== undefined
      ? language === "gu"
        ? `તમારો સ્કોર ${previousScore}% થી વધીને ${currentScore}% થયો છે! (+${Math.max(0, currentScore - previousScore)} પોઇન્ટ વધારો)`
        : language === "hi"
        ? `आपका स्कोर ${previousScore}% से बढ़कर ${currentScore}% हो गया है! (+${Math.max(0, currentScore - previousScore)} अंक सुधार)`
        : `Your score improved from ${previousScore}% to ${currentScore}%! (+${Math.max(0, currentScore - previousScore)} points improvement)`
      : language === "gu"
      ? `તમે અત્યારે ${currentScore}% સ્કોર પર છો. દરરોજ થોડો મહાવરો તમને આગળ લઈ જશે!`
      : language === "hi"
      ? `आप अभी ${currentScore}% स्कोर पर हैं। हर दिन थोड़ा अभ्यास आपको आगे ले जाएगा!`
      : `You are currently at ${currentScore}%. A little daily practice will take you to the top!`;

    const skillsMastered = [
      language === "gu" ? "પ્રશ્નો ધ્યાનથી વાંચવા" : "Reading problem carefully",
      language === "gu" ? "પાયાની ગણતરી સમજવી" : "Understanding foundation steps",
      ...(isMastered ? [language === "gu" ? "સ્વતંત્ર ઉકેલ મેળવવો" : "Independent problem solving"] : []),
    ];

    return {
      role: "student",
      language,
      badgeLabel,
      badgeVariant,
      headline,
      subheadline: studentEncouragement,
      currentFocus: conceptName,
      growthFocus: conceptName,
      currentGoal,
      progressNarrative,
      studentEncouragement,
      nextActivityPrompt,
      nextLearningStep: nextActivityPrompt,
      skillsMastered,
      milestones: skillsMastered,
      teacherRecommendation: language === "gu"
        ? "તમારા શિક્ષકે તમારા માટે એક મનોરંજક પ્રવૃત્તિ તૈયાર કરી છે."
        : "Your teacher prepared an enjoyable activity for you.",
    };
  }

  // -------------------------------------------------------------------------
  // 2. PARENT VIEW (Simple non-technical language, no internal AI jargon)
  // -------------------------------------------------------------------------
  if (role === "parent") {
    let badgeLabel = "Practising";
    let badgeVariant: RoleAwareGapInterpretation["badgeVariant"] = "developing";
    let headline = `${studentName} is currently practising ${conceptName}`;

    if (isMastered) {
      badgeLabel = language === "gu" ? "નિપુણતા પ્રાપ્ત" : language === "hi" ? "सफलतापूर्वक सीखा" : "Mastered Concept";
      badgeVariant = "mastered";
      headline = language === "gu"
        ? `${studentName} એ ${conceptName} માં નિપુણતા મેળવી છે!`
        : language === "hi"
        ? `${studentName} ने ${conceptName} में महारत हासिल कर ली है!`
        : `${studentName} has successfully mastered ${conceptName}!`;
    } else if (isDeveloping) {
      badgeLabel = language === "gu" ? "સારી પ્રગતિ" : language === "hi" ? "अच्छी प्रगति" : "Steady Progress";
      badgeVariant = "developing";
      headline = language === "gu"
        ? `${studentName} ${conceptName} શીખવામાં સારી પ્રગતિ કરી રહ્યો/રહી છે`
        : language === "hi"
        ? `${studentName} ${conceptName} सीखने में अच्छी प्रगति कर रहा/रही है`
        : `${studentName} is making steady progress in ${conceptName}`;
    } else {
      badgeLabel = language === "gu" ? "ઘરે થોડો સહકાર જરૂરી" : language === "hi" ? "घर पर थोड़ा अभ्यास जरूरी" : "Practice Support Recommended";
      badgeVariant = "needsSupport";
      headline = language === "gu"
        ? `${studentName} ને ${conceptName} માં ૫-મિનિટના સહકારની જરૂર છે`
        : language === "hi"
        ? `${studentName} को ${conceptName} में ५-मिनट अभ्यास की जरूरत है`
        : `${studentName} will benefit from a 5-minute home practice in ${conceptName}`;
    }

    const strengthsSummary = language === "gu"
      ? `${studentName} વર્ગમાં નિયમિત હાજરી આપે છે, શિક્ષકની સૂચનાઓ ધ્યાનથી સાંભળે છે અને પાયાની સંકલ્પનાઓમાં સારો પ્રયાસ દર્શાવે છે.`
      : language === "hi"
      ? `${studentName} कक्षा में नियमित रहता है, शिक्षक के निर्देशों को ध्यान से सुनता है और सीखने में अच्छा प्रयास करता है।`
      : `${studentName} attends classroom sessions actively, follows teacher instructions well, and demonstrates positive engagement in foundational topics.`;

    const progressNarrative = previousScore !== undefined
      ? language === "gu"
        ? `શાળામાં લીધેલ મૂલ્યાંકનો દર્શાવે છે કે ${studentName} નો સ્કોર ${previousScore}% થી વધીને ${currentScore}% થયો છે.`
        : language === "hi"
        ? `कक्षा में लिए गए आकलनों से पता चलता है कि ${studentName} का स्कोर ${previousScore}% से बढ़कर ${currentScore}% हुआ है।`
        : `Recent classroom checks show ${studentName}'s score progressed from ${previousScore}% to ${currentScore}%.`
      : language === "gu"
      ? `${studentName} હાલમાં ${currentScore}% સ્કોર પર છે. નિયમિત ૫-મિનિટનો મહાવરો પ્રગતિ ઝડપી બનાવશે.`
      : language === "hi"
      ? `${studentName} का वर्तमान स्कोर ${currentScore}% है। नियमित ५-मिनट का अभ्यास प्रगति को तेज करेगा।`
      : `${studentName} is currently scoring ${currentScore}%. Short daily home reinforcement will help bridge the remaining steps.`;

    const teacherRecommendation = isMastered
      ? language === "gu"
        ? "બાળકને અભિનંદન આપો! સમયાંતરે ઘરના રોજિંદા ઉદાહરણોમાં આ ગણતરી વાપરવા પ્રોત્સાહિત કરો."
        : language === "hi"
        ? "बच्चे को बधाई दें! घर के रोजमर्रा के कामों में इस गणना का उपयोग करने के लिए प्रोत्साहित करें।"
        : "Congratulate your child! Encourage them to apply this skill during everyday household tasks."
      : language === "gu"
      ? "શિક્ષકની ભલામણ: નીચે આપેલી ૫-મિનિટની સરળ રમત રમો જેથી બાળકને શાળામાં વધુ આત્મવિશ્વાસ મળે."
      : language === "hi"
      ? "शिक्षक की सलाह: नीचे दी गई ५-मिनट की सरल गतिविधि करें ताकि बच्चे का आत्मविश्वास बढ़े।"
      : "Teacher recommendation: Try the simple 5-minute home game below to reinforce classroom confidence.";

    const reassessmentUpdate = language === "gu"
      ? "આવતા સપ્તાહે શાળામાં એક નાનું પુનરાવર્તન કાર્ય લેવામાં આવશે જેથી બાળકની પ્રગતિ ચકાસી શકાય."
      : language === "hi"
      ? "अगले सप्ताह कक्षा में एक छोटी समीक्षा की जाएगी ताकि बच्चे की प्रगति देखी जा सके।"
      : "A gentle check-in will take place in class next week to celebrate continued progress.";

    return {
      role: "parent",
      language,
      badgeLabel,
      badgeVariant,
      headline,
      strengthsSummary,
      currentFocus: conceptName,
      growthFocus: conceptName,
      progressNarrative,
      homeActivity,
      parentHomeActivity: homeActivity,
      teacherRecommendation,
      reassessmentUpdate,
    };
  }

  // -------------------------------------------------------------------------
  // 3. TEACHER VIEW (Professional explainable diagnosis, decision-making focus)
  // -------------------------------------------------------------------------
  return {
    role: "teacher",
    language,
    badgeLabel: gap.dynamicPriority || gap.priority || "Medium Priority",
    badgeVariant: status === "Mastered" ? "mastered" : status === "Developing" ? "developing" : "needsSupport",
    headline: `${conceptName} — ${status} (${gap.dynamicSeverityScore ?? gap.severityScore ?? 75}/100)`,
    subheadline: gap.reason || "Learning gap diagnosed with deterministic pedagogical rule evaluation.",
    currentFocus: conceptName,
    growthFocus: gap.dynamicRootConcept?.name ? `Root: ${gap.dynamicRootConcept.name}` : conceptName,
    progressNarrative: `Current Score: ${currentScore}% | Previous: ${previousScore ?? "N/A"}% | Trend: ${trend}`,
    homeActivity,
    parentHomeActivity: homeActivity,
    teacherRecommendation: gap.dynamicPrescription?.recommendedAction || gap.suggestedAction || "Deploy concrete manipulative 5-step plan.",
    reassessmentUpdate: gap.reassessmentDue ? "Reassessment Due" : "Monitoring",
    professionalDiagnosis: {
      severityScore: gap.dynamicSeverityScore ?? gap.severityScore,
      severityLevel: gap.dynamicPriority || gap.priority,
      gapType: gap.dynamicGapType || gap.gapType,
      triggerRule: gap.dynamicTriggerRule || gap.triggerRule,
      rootConceptName: gap.dynamicRootConcept?.name || gap.rootConcept?.name,
      evidenceCount: gap.evidenceCount || gap.attemptsCount || 1,
      confidenceLevel: gap.confidenceLevel || "High",
    },
  };
}
