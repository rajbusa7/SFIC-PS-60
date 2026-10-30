/**
 * StudySaathi AI — Pedagogical Prescription Engine (Phase 4)
 *
 * Centralized, deterministic recommendation engine generating concept-aware,
 * status-aware, and diagnosis-aware pedagogical prescriptions.
 *
 * Adheres strictly to Gujarat primary education standards, low-cost classroom
 * materials, and transparent rule-based logic without random AI generation.
 */

import type { DiagnosisCategory } from "../../../packages/shared/src/types/gap";

export type RecommendationType =
  | "Remedial Practice"
  | "Focused Practice"
  | "Diagnostic Activity"
  | "Mastery Maintenance";

export interface PedagogicalPrescriptionInput {
  conceptId?: string;
  conceptName?: string;
  subject?: string;
  subjectCode?: string;
  learningObjective?: string;
  status: "Needs Support" | "Developing" | "Mastered" | string;
  diagnosisType?: DiagnosisCategory | string;
  previousScore?: number | null;
  currentScore?: number | null;
  scoreDelta?: number | null;
  trend?: "Improving" | "Stable" | "Declining" | string;
  language?: "en" | "gu";
}

export interface PedagogicalPrescription {
  conceptKey: string;
  conceptDisplayName: string;
  activity: string;
  reason: string;
  duration: string;
  reassessment: string;
  recommendationType: RecommendationType;
  recommendationTypeGu: string;
  remedialPlanEligible: boolean;
  planStatusLabel: string;
  planStatusLabelGu: string;
}

// Normalized concept keys
export type KnownConceptKey =
  | "PLACE_VALUE"
  | "ADDITION_REGROUPING"
  | "MULTIPLICATION_TABLES"
  | "DIVISION_EQUAL_SHARING"
  | "READING_COMPREHENSION"
  | "WATER_CYCLE"
  | "FRACTIONS"
  | "SUBJECT_VERB_AGREEMENT"
  | "PHONETIC_BLENDS"
  | "GUJARATI_MATRAS"
  | "GUJARATI_CONJUNCTS"
  | "PLANT_PARTS"
  | "COMMUNITY_HELPERS"
  | "UNKNOWN_CONCEPT";

interface ConceptTemplate {
  key: KnownConceptKey;
  defaultSubject: "MATH" | "ENG" | "GUJ" | "EVS";
  nameEn: string;
  nameGu: string;
  needsSupport: {
    activityEn: string;
    activityGu: string;
    whyEn: string;
    whyGu: string;
    durationEn: string;
    durationGu: string;
    reassessmentEn: string;
    reassessmentGu: string;
  };
  developing: {
    activityEn: string;
    activityGu: string;
    whyEn: string;
    whyGu: string;
    durationEn: string;
    durationGu: string;
    reassessmentEn: string;
    reassessmentGu: string;
  };
}

const CONCEPT_TEMPLATES: Record<Exclude<KnownConceptKey, "UNKNOWN_CONCEPT">, ConceptTemplate> = {
  PLACE_VALUE: {
    key: "PLACE_VALUE",
    defaultSubject: "MATH",
    nameEn: "Place Value",
    nameGu: "સ્થાનકિંમત",
    needsSupport: {
      activityEn:
        "Use a place-value chart, base-10 blocks, or bundled objects to reinforce hundreds, tens, and ones. Ask the student to represent numbers physically and explain the value of each digit.",
      activityGu:
        "સેંકડા, દશક અને એકમને સ્પષ્ટ કરવા સ્થાનકિંમત ચાર્ટ, દશકના બ્લોક્સ અથવા દિવાસળીની જૂથ-બંડલનો ઉપયોગ કરો. વિદ્યાર્થીને ભૌતિક રીતે સંખ્યાઓ દર્શાવવા અને દરેક અંકની સ્થાનકિંમત સમજાવવા કહો.",
      whyEn:
        "Concrete representations help students understand how digits represent different place values.",
      whyGu:
        "મૂર્ત સાધનો દ્વારા રજૂઆત વિદ્યાર્થીઓને સમજવામાં મદદ કરે છે કે અંકો અલગ-અલગ સ્થાનકિંમત કેવી રીતે દર્શાવે છે.",
      durationEn: "10 minutes",
      durationGu: "૧૦ મિનિટ",
      reassessmentEn:
        "Ask the student to represent 3–5 new numbers using a place-value chart.",
      reassessmentGu:
        "વિદ્યાર્થીને સ્થાનકિંમત ચાર્ટનો ઉપયોગ કરીને નવી ૩–૫ સંખ્યાઓ દર્શાવવા કહો.",
    },
    developing: {
      activityEn:
        "Provide focused place-value practice using expanded notation and 2-to-3 digit comparison cards. Have the student identify the digit in each place value independently.",
      activityGu:
        "વિસ્તૃત લેખન અને ૨-૩ અંકની સરખામણી કાર્ડ્સનો ઉપયોગ કરીને સ્થાનકિંમતનો લક્ષિત મહાવરો કરાવો. વિદ્યાર્થીને દરેક સ્થાનકિંમતના અંકને સ્વતંત્ર રીતે ઓળખવા કહો.",
      whyEn:
        "Targeted expansion practice bridges concrete models to symbolic numerical understanding.",
      whyGu:
        "લક્ષિત વિસ્તૃત મહાવરો મૂર્ત મોડેલોથી પ્રતીકાત્મક સંખ્યાત્મક સમજ તરફ સેતુ બાંધે છે.",
      durationEn: "10 minutes",
      durationGu: "૧૦ મિનિટ",
      reassessmentEn:
        "Ask the student to decompose 4 multi-digit numbers into hundreds, tens, and ones.",
      reassessmentGu:
        "વિદ્યાર્થીને ૪ બહુઅંકી સંખ્યાઓને સેંકડા, દશક અને એકમમાં છૂટા પાડવા કહો.",
    },
  },

  ADDITION_REGROUPING: {
    key: "ADDITION_REGROUPING",
    defaultSubject: "MATH",
    nameEn: "3-Digit Addition / Regrouping",
    nameGu: "૩-અંકના સરવાળા / વદ્દીવાળા સરવાળા",
    needsSupport: {
      activityEn:
        "Use base-10 blocks or a place-value chart to model regrouping across tens and hundreds. Follow with 3–5 guided addition examples.",
      activityGu:
        "દશક અને સેંકડા વચ્ચે વદ્દીની પ્રક્રિયા સમજાવવા બેઝ-૧૦ બ્લોક્સ અથવા સ્થાનકિંમત ચાર્ટનો ઉપયોગ કરો. ત્યારબાદ ૩–૫ માર્ગદર્શિત સરવાળાના ઉદાહરણો કરાવો.",
      whyEn:
        "Visual regrouping helps students understand how units are exchanged between place values during addition.",
      whyGu:
        "દૃશ્યમાન વદ્દીકરણ પ્રક્રિયા વિદ્યાર્થીઓને સમજવામાં મદદ કરે છે કે સરવાળા દરમિયાન સ્થાનકિંમતો વચ્ચે એકમોની આપ-લે કેવી રીતે થાય છે.",
      durationEn: "10–15 minutes",
      durationGu: "૧૦–૧૫ મિનિટ",
      reassessmentEn:
        "Give 3 similar addition problems requiring regrouping.",
      reassessmentGu:
        "વદ્દીની જરૂર હોય તેવા ૩ સમાન સરવાળાના દાખલા આપો.",
    },
    developing: {
      activityEn:
        "Provide 4–5 multi-digit addition problems with regrouping. Guide the student through column-by-column carry-over alignment before independent execution.",
      activityGu:
        "વદ્દીવાળા ૪–૫ બહુ-અંકી સરવાળાના દાખલા આપો. સ્વતંત્ર ગણતરી પહેલાં વિદ્યાર્થીને સ્તંભવાર વદ્દી ગોઠવણીમાં માર્ગદર્શન આપો.",
      whyEn:
        "Structured column alignment practice reinforces correct operational sequencing and eliminates carry-over slips.",
      whyGu:
        "સ્તંભવાર ગોઠવણીનો મહાવરો પ્રક્રિયાત્મક ક્રમ મજબૂત કરે છે અને વદ્દી ભૂલ અટકાવે છે.",
      durationEn: "10–15 minutes",
      durationGu: "૧૦–૧૫ મિનિટ",
      reassessmentEn:
        "Provide 3 addition problems with varying regrouping steps (ones to tens, tens to hundreds).",
      reassessmentGu:
        "વિવિધ વદ્દી પગલાં (એકમથી દશક, દશકથી સેંકડા) વાળા ૩ સરવાળા આપો.",
    },
  },

  MULTIPLICATION_TABLES: {
    key: "MULTIPLICATION_TABLES",
    defaultSubject: "MATH",
    nameEn: "Multiplication Tables",
    nameGu: "ઘડિયા / ગુણાકાર કોષ્ટકો",
    needsSupport: {
      activityEn:
        "Use skip counting, equal groups, and arrays with counters to demonstrate multiplication facts. Finish with short retrieval-practice questions.",
      activityGu:
        "ગુણાકારના તથ્યો દર્શાવવા માટે કૂદકા ગણતરી, સમાન જૂથો અને કાઉન્ટર્સ સાથે એરેનો ઉપયોગ કરો. ટૂંકા પુનરાવર્તન પ્રશ્નો સાથે સમાપ્ત કરો.",
      whyEn:
        "Repeated retrieval and visual grouping help strengthen multiplication fact recall and understanding.",
      whyGu:
        "વારંવાર પુનરાવર્તન અને દ્રશ્ય જૂથીકરણ ગુણાકારના તથ્યો યાદ રાખવા અને સમજવામાં મદદ કરે છે.",
      durationEn: "5–10 minutes",
      durationGu: "૫–૧૦ મિનિટ",
      reassessmentEn:
        "Ask 5–10 multiplication questions covering the same table or fact family.",
      reassessmentGu:
        "સમાન ઘડિયા અથવા કુટુંબને આવરી લેતા ૫–૧૦ ગુણાકાર પ્રશ્નો પૂછો.",
    },
    developing: {
      activityEn:
        "Use skip counting, equal groups, and arrays to demonstrate multiplication facts. Finish with short retrieval-practice questions.",
      activityGu:
        "ગુણાકારના તથ્યો દર્શાવવા માટે કૂદકા ગણતરી, સમાન જૂથો અને એરેનો ઉપયોગ કરો. ટૂંકા પુનરાવર્તન પ્રશ્નો સાથે પૂર્ણ કરો.",
      whyEn:
        "Repeated retrieval and visual grouping help strengthen multiplication fact recall and understanding.",
      whyGu:
        "વારંવાર પુનરાવર્તન અને દ્રશ્ય જૂથીકરણ ગુણાકારના તથ્યો યાદ રાખવા અને સમજવામાં મદદ કરે છે.",
      durationEn: "5–10 minutes",
      durationGu: "૫–૧૦ મિનિટ",
      reassessmentEn:
        "Ask 5–10 multiplication questions covering the same table or fact family.",
      reassessmentGu:
        "સમાન ઘડિયા અથવા કુટુંબને આવરી લેતા ૫–૧૦ ગુણાકાર પ્રશ્નો પૂછો.",
    },
  },

  DIVISION_EQUAL_SHARING: {
    key: "DIVISION_EQUAL_SHARING",
    defaultSubject: "MATH",
    nameEn: "Division / Equal Sharing",
    nameGu: "ભાગાકાર / સમાન વહેંચણી",
    needsSupport: {
      activityEn:
        "Use physical objects such as counters or blocks to create equal groups. Ask the student to distribute objects equally before introducing symbolic division.",
      activityGu:
        "સમાન જૂથો બનાવવા માટે કાઉન્ટર્સ અથવા બ્લોક્સ જેવી ભૌતિક વસ્તુઓનો ઉપયોગ કરો. પ્રતીકાત્મક ભાગાકાર રજૂ કરતાં પહેલાં વિદ્યાર્થીને વસ્તુઓની સમાન વહેંચણી કરવા કહો.",
      whyEn:
        "Concrete equal-sharing activities connect the meaning of division with its symbolic representation.",
      whyGu:
        "મૂર્ત સમાન વહેંચણી પ્રવૃત્તિઓ ભાગાકારના અર્થને તેના પ્રતીકાત્મક સંકેત સાથે જોડે છે.",
      durationEn: "10 minutes",
      durationGu: "૧૦ મિનિટ",
      reassessmentEn:
        "Provide 3 equal-sharing problems with different quantities and group sizes.",
      reassessmentGu:
        "વિવિધ જથ્થા અને જૂથ કદ સાથે ૩ સમાન વહેંચણીની સમસ્યાઓ આપો.",
    },
    developing: {
      activityEn:
        "Practice equal sharing using number line jumps and circular grouping diagrams, linking distributions directly to division expressions (e.g. 15 ÷ 3 = 5).",
      activityGu:
        "સંખ્યા રેખા કૂદકા અને ગોળાકાર જૂથ આકૃતિઓનો ઉપયોગ કરીને વહેંચણીનો મહાવરો કરાવો, અને તેને ભાગાકાર પદાવલિ સાથે જોડો (દા.ત. ૧૫ ÷ ૩ = ૫).",
      whyEn:
        "Connecting visual models directly to division sentences solidifies the inverse link with multiplication.",
      whyGu:
        "દૃશ્ય મોડેલોને ભાગાકાર વાક્યો સાથે સીધા જોડવાથી ગુણાકાર સાથેનો વ્યસ્ત સંબંધ મજબૂત બને છે.",
      durationEn: "10 minutes",
      durationGu: "૧૦ મિનિટ",
      reassessmentEn:
        "Ask the student to solve 3 single-digit division problems using diagrams.",
      reassessmentGu:
        "આકૃતિઓનો ઉપયોગ કરીને ૩ એક-અંકી ભાગાકાર દાખલા ઉકેલવા કહો.",
    },
  },

  READING_COMPREHENSION: {
    key: "READING_COMPREHENSION",
    defaultSubject: "ENG",
    nameEn: "Reading Comprehension",
    nameGu: "વાંચન અર્થગ્રહણ",
    needsSupport: {
      activityEn:
        "Provide a short, age-appropriate passage. Ask explicit who, what, where, and why questions. Encourage the student to identify the sentence or detail supporting each answer.",
      activityGu:
        "એક ટૂંકો, વય-યોગ્ય ફકરો આપો. સ્પષ્ટ 'કોણ', 'શું', 'ક્યાં' અને 'શા માટે' પ્રશ્નો પૂછો. વિદ્યાર્થીને દરેક જવાબને સમર્થન આપતું વાક્ય શોધવા પ્રોત્સાહિત કરો.",
      whyEn:
        "Questioning and evidence-finding practice develop understanding of key information and the ability to support answers using text.",
      whyGu:
        "પ્રશ્નોત્તરી અને પુરાવા શોધવાનો મહાવરો મુખ્ય માહિતીની સમજ અને લખાણમાંથી જવાબ શોધવાની ક્ષમતા વિકસાવે છે.",
      durationEn: "10–15 minutes",
      durationGu: "૧૦–૧૫ મિનિટ",
      reassessmentEn:
        "Provide a new short passage and ask 3–5 comprehension questions.",
      reassessmentGu:
        "નવો ટૂંકો ફકરો આપો અને ૩–૫ અર્થગ્રહણ પ્રશ્નો પૂછો.",
    },
    developing: {
      activityEn:
        "Read a short passage together and have the student underline key details and topic sentences. Follow with 3–4 inferential and literal comprehension questions.",
      activityGu:
        "સાથે મળીને ટૂંકો ફકરો વાંચો અને વિદ્યાર્થીને મુખ્ય વિગતો નીચે લીટી દોરવા કહો. ત્યારબાદ ૩–૪ અનુમાનિત અને સીધા પ્રશ્નો પૂછો.",
      whyEn:
        "Highlighting core details trains students to extract main ideas and synthesize textual evidence.",
      whyGu:
        "મુખ્ય વિગતો તારવવાથી વિદ્યાર્થીઓ લખાણના મુખ્ય વિચારને સમજવામાં સક્ષમ બને છે.",
      durationEn: "10–15 minutes",
      durationGu: "૧૦–૧૫ મિનિટ",
      reassessmentEn:
        "Provide a new 4-sentence paragraph and ask 3 focused comprehension questions.",
      reassessmentGu:
        "નવો ૪-વાક્યનો ફકરો આપો અને ૩ લક્ષિત અર્થગ્રહણ પ્રશ્નો પૂછો.",
    },
  },

  WATER_CYCLE: {
    key: "WATER_CYCLE",
    defaultSubject: "EVS",
    nameEn: "Water Cycle",
    nameGu: "જળચક્ર અને જળ સંરક્ષણ",
    needsSupport: {
      activityEn:
        "Use a simple labelled visual sequence showing evaporation, condensation, and precipitation. Ask the student to explain each stage in their own words.",
      activityGu:
        "બાષ્પીભવન, ઘનીભવન અને વરસાદ દર્શાવતો સરળ ક્રમિક આકૃતિ ચાર્ટ વાપરો. વિદ્યાર્થીને દરેક તબક્કો પોતાના શબ્દોમાં સમજાવવા કહો.",
      whyEn:
        "Visual sequencing and verbal explanation help students connect the stages of the water cycle.",
      whyGu:
        "દૃશ્ય ક્રમ અને મૌખિક સમજૂતી વિદ્યાર્થીઓને જળચક્રના તબક્કાઓ સમજવામાં મદદ કરે છે.",
      durationEn: "10 minutes",
      durationGu: "૧૦ મિનિટ",
      reassessmentEn:
        "Ask the student to arrange the stages in the correct sequence and explain each one.",
      reassessmentGu:
        "વિદ્યાર્થીને તબક્કાઓ યોગ્ય ક્રમમાં ગોઠવવા અને દરેક સમજાવવા કહો.",
    },
    developing: {
      activityEn:
        "Use a simple labelled visual sequence showing evaporation, condensation, and precipitation. Ask the student to explain each stage in their own words.",
      activityGu:
        "બાષ્પીભવન, ઘનીભવન અને વરસાદ દર્શાવતો સરળ ક્રમિક આકૃતિ ચાર્ટ વાપરો. વિદ્યાર્થીને દરેક તબક્કો પોતાના શબ્દોમાં સમજાવવા કહો.",
      whyEn:
        "Visual sequencing and verbal explanation help students connect the stages of the water cycle.",
      whyGu:
        "દૃશ્ય ક્રમ અને મૌખિક સમજૂતી વિદ્યાર્થીઓને જળચક્રના તબક્કાઓ સમજવામાં મદદ કરે છે.",
      durationEn: "10 minutes",
      durationGu: "૧૦ મિનિટ",
      reassessmentEn:
        "Ask the student to arrange the stages in the correct sequence and explain each one.",
      reassessmentGu:
        "વિદ્યાર્થીને તબક્કાઓ યોગ્ય ક્રમમાં ગોઠવવા અને દરેક સમજાવવા કહો.",
    },
  },

  FRACTIONS: {
    key: "FRACTIONS",
    defaultSubject: "MATH",
    nameEn: "Fractions Introduction",
    nameGu: "અપૂર્ણાંક પરિચય (અડધું, પા)",
    needsSupport: {
      activityEn:
        "Use circular paper cut-outs and strips to fold into halves and quarters. Have the student color and name equal parts before writing fractions.",
      activityGu:
        "કાગળના વર્તુળાકાર કટ-આઉટ્સ અને પટ્ટીઓનો ઉપયોગ કરી અડધા અને પા ભાગમાં વાળો. અપૂર્ણાંક લખતાં પહેલાં સમાન ભાગો રંગવા અને નામ આપવા કહો.",
      whyEn:
        "Physical paper folding demonstrates that fractions require strictly equal parts of a whole.",
      whyGu:
        "કાગળ વાળવાની પ્રવૃત્તિ સ્પષ્ટ કરે છે કે અપૂર્ણાંક માટે સમગ્રના સરખા ભાગ હોવા જરૂરી છે.",
      durationEn: "10 minutes",
      durationGu: "૧૦ મિનિટ",
      reassessmentEn:
        "Ask the student to shade 1/2 and 1/4 on 3 paper shapes.",
      reassessmentGu:
        "૩ કાગળના આકારો પર ૧/૨ અને ૧/૪ ભાગ છાયાંકિત કરવા કહો.",
    },
    developing: {
      activityEn:
        "Present divided shape cards and ask the student to identify which show true fractions (equal parts) versus unequal divisions.",
      activityGu:
        "વિભાજિત આકાર કાર્ડ્સ રજૂ કરો અને વિદ્યાર્થીને ઓળખવા કહો કે કયા સાચા અપૂર્ણાંક (સરખા ભાગ) દર્શાવે છે.",
      whyEn:
        "Discrimination tasks prevent the common misconception of counting unequal pieces as fractions.",
      whyGu:
        "સરખામણી પ્રવૃત્તિ અસમાન ટુકડાઓને અપૂર્ણાંક તરીકે ગણવાની ભૂલ અટકાવે છે.",
      durationEn: "10 minutes",
      durationGu: "૧૦ મિનિટ",
      reassessmentEn:
        "Provide 4 fraction diagrams and ask the student to write the corresponding fraction symbol.",
      reassessmentGu:
        "૪ અપૂર્ણાંક આકૃતિઓ આપો અને અનુરૂપ અપૂર્ણાંક લખવા કહો.",
    },
  },

  SUBJECT_VERB_AGREEMENT: {
    key: "SUBJECT_VERB_AGREEMENT",
    defaultSubject: "ENG",
    nameEn: "Subject-Verb Agreement",
    nameGu: "કર્તા-ક્રિયાપદ સંબંધ",
    needsSupport: {
      activityEn:
        "Use paired subject and verb cards (e.g., 'He runs' vs 'They run'). Have the student physically match singular subjects to singular verbs and plural to plural.",
      activityGu:
        "જોડીવાળા કર્તા અને ક્રિયાપદ કાર્ડ્સનો ઉપયોગ કરો. એકવચન કર્તા સાથે એકવચન ક્રિયાપદ અને બહુવચન સાથે બહુવચન ક્રિયાપદ જોડાવો.",
      whyEn:
        "Physical card sorting reinforces singular and plural inflection rules through tactile categorization.",
      whyGu:
        "કાર્ડ વર્ગીકરણ એકવચન અને બહુવચન નિયમોને મૂર્ત રીતે સમજવામાં મદદ કરે છે.",
      durationEn: "10 minutes",
      durationGu: "૧૦ મિનિટ",
      reassessmentEn:
        "Provide 4 fill-in-the-blank sentences choosing between singular and plural verbs.",
      reassessmentGu:
        "એકવચન અને બહુવચન ક્રિયાપદ વચ્ચે પસંદગી કરવા માટે ૪ ખાલી જગ્યા પૂરો.",
    },
    developing: {
      activityEn:
        "Present sentences with collective nouns and compound subjects. Guide the student to identify the true subject before choosing the verb form.",
      activityGu:
        "સામૂહિક સંજ્ઞા અને સંયુક્ત કર્તાવાળા વાક્યો રજૂ કરો. ક્રિયાપદ પસંદ કરતાં પહેલાં સાચો કર્તા ઓળખવા માર્ગદર્શન આપો.",
      whyEn:
        "Analyzing sentence subjects in context builds reliable syntactic precision for complex structures.",
      whyGu:
        "વાક્યના કર્તાનું વિશ્લેષણ જટિલ વાક્ય રચનાઓમાં વ્યાકરણની ચોકસાઈ વધારે છે.",
      durationEn: "10 minutes",
      durationGu: "૧૦ મિનિટ",
      reassessmentEn:
        "Give 4 sentences with error detection: student circles and corrects incorrect verb agreements.",
      reassessmentGu:
        "ભૂલ શોધવા માટે ૪ વાક્યો આપો: વિદ્યાર્થી ખોટા ક્રિયાપદ સુધારે છે.",
    },
  },

  PHONETIC_BLENDS: {
    key: "PHONETIC_BLENDS",
    defaultSubject: "ENG",
    nameEn: "Phonetic Blends (ch, sh, th, wh)",
    nameGu: "ધ્વનિ સંયોજનો (ch, sh, th, wh)",
    needsSupport: {
      activityEn:
        "Use blend flashcards paired with picture objects (e.g., ship, chair). Practice producing the combined digraph sound before reading whole words.",
      activityGu:
        "ચિત્ર વસ્તુઓ સાથે જોડેલા ફ્લેશકાર્ડ્સ વાપરો. આખા શબ્દો વાંચતા પહેલાં સંયુક્ત ધ્વનિ ઉચ્ચારવાની પ્રેક્ટિસ કરાવો.",
      whyEn:
        "Multi-sensory phoneme blending connects digraph spelling to distinct auditory sounds.",
      whyGu:
        "બહુ-ઇન્દ્રિય ધ્વનિ સંયોજન ડાયગ્રાફ જોડણીને ચોક્કસ શ્રાવ્ય અવાજો સાથે જોડે છે.",
      durationEn: "10 minutes",
      durationGu: "૧૦ મિનિટ",
      reassessmentEn:
        "Have the student read aloud 5 new words containing the target blends.",
      reassessmentGu:
        "વિદ્યાર્થીને લક્ષિત સંયોજનો ધરાવતા ૫ નવા શબ્દો મોટેથી વાંચવા કહો.",
    },
    developing: {
      activityEn:
        "Conduct a quick word-building exercise using blend onset and rime cards (e.g., 'sh' + 'op' = 'shop').",
      activityGu:
        "શબ્દ નિર્માણ કસરત કરાવો: 'sh' + 'op' = 'shop'.",
      whyEn:
        "Onset-rime manipulation strengthens rapid word recognition and decoding fluency.",
      whyGu:
        "શબ્દ નિર્માણ ઝડપી શબ્દ ઓળખ અને વાંચન ક્ષમતા વધારે છે.",
      durationEn: "5–10 minutes",
      durationGu: "૫–૧૦ મિનિટ",
      reassessmentEn:
        "Ask the student to write 4 dictated blend words.",
      reassessmentGu:
        "શ્રુતલેખન દ્વારા ૪ સંયોજન શબ્દો લખવા કહો.",
    },
  },

  GUJARATI_MATRAS: {
    key: "GUJARATI_MATRAS",
    defaultSubject: "GUJ",
    nameEn: "Gujarati Matras",
    nameGu: "કાનો-માત્રા અને દીર્ઘ-હ્રસ્વ સ્વર ચિહ્નો",
    needsSupport: {
      activityEn:
        "Use consonant-matra flashcards and tactile sand trays. Have the student pronounce the consonant sound change when adding કાનો (ા), હ્રસ્વ-ઇ (િ), and દીર્ઘ-ઈ (ી).",
      activityGu:
        "વ્યંજન-માત્રા ફ્લેશકાર્ડ્સનો ઉપયોગ કરો. કાનો (ા), હ્રસ્વ-ઇ (િ) અને દીર્ઘ-ઈ (ી) ઉમેરતી વખતે ઉચ્ચારણ પરિવર્તન બોલાવો.",
      whyEn:
        "Visual-phonetic mapping reinforces how vowel matras alter the root consonant sound.",
      whyGu:
        "દૃશ્ય-ધ્વનિ જોડાણ સ્પષ્ટ કરે છે કે સ્વર ચિહ્નો મૂળ વ્યંજનના ઉચ્ચારણને કેવી રીતે બદલે છે.",
      durationEn: "10 minutes",
      durationGu: "૧૦ મિનિટ",
      reassessmentEn:
        "Dictate 4 simple words with different matras for the student to write correctly.",
      reassessmentGu:
        "વિદ્યાર્થીને યોગ્ય રીતે લખવા માટે વિવિધ માત્રાઓવાળા ૪ સરળ શબ્દો બોલો.",
    },
    developing: {
      activityEn:
        "Provide a word list with missing matras. Ask the student to insert the correct matra to complete familiar words and read them aloud.",
      activityGu:
        "ખૂટતી માત્રાવાળી શબ્દ સૂચિ આપો. પરિચિત શબ્દો પૂર્ણ કરવા સાચી માત્રા મૂકવા અને મોટેથી વાંચવા કહો.",
      whyEn:
        "Contextual insertion cements semantic recognition of subtle vowel sound contrasts.",
      whyGu:
        "સંદર્ભિત શબ્દ પૂર્તિ સૂક્ષ્મ સ્વર ધ્વનિ ભેદની સમજને મજબૂત કરે છે.",
      durationEn: "10 minutes",
      durationGu: "૧૦ મિનિટ",
      reassessmentEn:
        "Ask the student to read 4 sentences with contrasting short and long vowels.",
      reassessmentGu:
        "હ્રસ્વ અને દીર્ઘ સ્વરોવાળા ૪ વાક્યો વાંચવા કહો.",
    },
  },

  GUJARATI_CONJUNCTS: {
    key: "GUJARATI_CONJUNCTS",
    defaultSubject: "GUJ",
    nameEn: "Gujarati Conjuncts (Jodakshar)",
    nameGu: "જોડાક્ષર શબ્દોનું વાંચન-લેખન",
    needsSupport: {
      activityEn:
        "Deconstruct conjunct characters on a slate into half-letter and full-letter components. Guide the student through joint pronunciation.",
      activityGu:
        "સ્લેટ પર જોડાક્ષરોને અડધા અને પૂરા અક્ષરોમાં છૂટા પાડીને દર્શાવો. સંયુક્ત ઉચ્ચારણમાં માર્ગદર્શન આપો.",
      whyEn:
        "Breaking down visual ligatures helps students grasp the phonetic blend without cognitive overload.",
      whyGu:
        "જોડાક્ષરનું વિશ્લેષણ વિદ્યાર્થીઓને સંયુક્ત અવાજ સરળતાથી સમજવામાં મદદ કરે છે.",
      durationEn: "10 minutes",
      durationGu: "૧૦ મિનિટ",
      reassessmentEn:
        "Have the student read and write 3 common conjunct words (e.g. પપ્પા, રસ્તો).",
      reassessmentGu:
        "૩ સામાન્ય જોડાક્ષર શબ્દો (જેમ કે પપ્પા, રસ્તો) વાંચવા અને લખવા કહો.",
    },
    developing: {
      activityEn:
        "Provide a short passage containing 4–5 conjunct words. Have the student highlight and pronounce each conjunct word.",
      activityGu:
        "૪–૫ જોડાક્ષર શબ્દો ધરાવતો ટૂંકો ફકરો આપો. વિદ્યાર્થીને જોડાક્ષર શબ્દો ઓળખી મોટેથી વાંચવા કહો.",
      whyEn:
        "Contextual reading builds automaticity in recognizing merged consonant characters.",
      whyGu:
        "સંદર્ભિત વાંચન સંયુક્ત વ્યંજન અક્ષરોને ઝડપથી ઓળખવાની ક્ષમતા કેળવે છે.",
      durationEn: "10 minutes",
      durationGu: "૧૦ મિનિટ",
      reassessmentEn:
        "Ask the student to read 3 new sentences containing conjunct words.",
      reassessmentGu:
        "જોડાક્ષર શબ્દો ધરાવતા ૩ નવા વાક્યો વાંચવા કહો.",
    },
  },

  PLANT_PARTS: {
    key: "PLANT_PARTS",
    defaultSubject: "EVS",
    nameEn: "Parts of Plants & Functions",
    nameGu: "વનસ્પતિના ભાગો અને તેના કાર્યો",
    needsSupport: {
      activityEn:
        "Examine a real potted plant or diagram. Guide the student to identify roots, stem, leaves, and flowers, discussing what each does.",
      activityGu:
        "વાસ્તવિક છોડ અથવા ચિત્રનું નિરીક્ષણ કરો. મૂળ, થડ, પર્ણ અને ફૂલ ઓળખાવો અને દરેકનું કાર્ય ચર્ચો.",
      whyEn:
        "Hands-on botanical observation connects physical structures directly to life functions.",
      whyGu:
        "પ્રત્યક્ષ વનસ્પતિ નિરીક્ષણ શારીરિક રચનાઓને જીવન કાર્યો સાથે સીધું જોડે છે.",
      durationEn: "10 minutes",
      durationGu: "૧૦ મિનિટ",
      reassessmentEn:
        "Ask the student to label 4 parts on a plant sketch and explain one function.",
      reassessmentGu:
        "છોડના રેખાચિત્ર પર ૪ ભાગોના નામ લખવા અને એક કાર્ય સમજાવવા કહો.",
    },
    developing: {
      activityEn:
        "Use matching cards pairing plant parts (roots, leaves, stem) to their specific functions (absorbing water, photosynthesis, transport).",
      activityGu:
        "વનસ્પતિના ભાગો (મૂળ, પર્ણ, થડ) ને તેમના વિશિષ્ટ કાર્યો (પાણી શોષણ, ખોરાક નિર્માણ) સાથે જોડતા કાર્ડ્સ વાપરો.",
      whyEn:
        "Function matching solidifies ecological roles and structural differentiation.",
      whyGu:
        "કાર્ય જોડાણ જૈવિક ભૂમિકાઓ અને રચનાત્મક ભેદને સ્પષ્ટ કરે છે.",
      durationEn: "10 minutes",
      durationGu: "૧૦ મિનિટ",
      reassessmentEn:
        "Provide 3 function statements and have the student identify the corresponding plant part.",
      reassessmentGu:
        "૩ કાર્યોના વિધાનો આપો અને વિદ્યાર્થીને અનુરૂપ ભાગ ઓળખવા કહો.",
    },
  },

  COMMUNITY_HELPERS: {
    key: "COMMUNITY_HELPERS",
    defaultSubject: "EVS",
    nameEn: "Community Helpers & Sanitation",
    nameGu: "આપણા સેવકો અને સ્વચ્છતા",
    needsSupport: {
      activityEn:
        "Use picture cards of community workers (doctor, farmer, sanitation worker, teacher). Discuss their tools and civic contributions.",
      activityGu:
        "સમાજ સેવકો (ડૉક્ટર, ખેડૂત, સફાઈ કામદાર, શિક્ષક) ના ચિત્ર કાર્ડ્સ વાપરો. તેમના સાધનો અને સેવાઓ વિશે ચર્ચા કરો.",
      whyEn:
        "Visual storytelling grounds civic understanding in familiar real-world community roles.",
      whyGu:
        "દૃશ્ય ચર્ચા સામાજિક ભૂમિકાઓની વાસ્તવિક સમજ કેળવે છે.",
      durationEn: "10 minutes",
      durationGu: "૧૦ મિનિટ",
      reassessmentEn:
        "Ask the student to match 3 helpers to their respective tools and community duties.",
      reassessmentGu:
        "૩ સેવકોને તેમના સાધનો અને ફરજો સાથે જોડવા કહો.",
    },
    developing: {
      activityEn:
        "Discuss a real-world scenario (e.g., maintaining clean water and clean streets) and have the student explain how community helpers collaborate.",
      activityGu:
        "વાસ્તવિક દૃશ્ય (જેમ કે સ્વચ્છ પાણી અને રસ્તાઓની જાળવણી) ચર્ચો અને સેવકો કેવી રીતે સહયોગ કરે છે તે સમજાવો.",
      whyEn:
        "Scenario analysis connects individual helpers to broader public sanitation and health systems.",
      whyGu:
        "દૃશ્ય વિશ્લેષણ વ્યક્તિગત સેવકોને જાહેર સ્વચ્છતા અને આરોગ્ય પ્રણાલી સાથે જોડે છે.",
      durationEn: "10 minutes",
      durationGu: "૧૦ મિનિટ",
      reassessmentEn:
        "Ask 2 scenario questions on whom to contact and what actions to take for civic cleanliness.",
      reassessmentGu:
        "નાગરિક સ્વચ્છતા માટે કોનો સંપર્ક કરવો તે અંગે ૨ પરિસ્થિતિ પ્રશ્નો પૂછો.",
    },
  },
};

/**
 * Accurately resolve concept key using ID, normalized name, or objective
 */
export function identifyConceptKey(
  conceptId?: string,
  conceptName?: string,
  subject?: string
): KnownConceptKey {
  const id = (conceptId || "").toLowerCase().trim();
  const name = (conceptName || "").toLowerCase().trim();

  // 1. Direct ID matching
  if (id === "c-div-01") return "DIVISION_EQUAL_SHARING";
  if (id === "c-mult-01") return "MULTIPLICATION_TABLES";
  if (id === "c-place-01") {
    // If name specifically singles out 3-digit addition without place value focus
    if (name.includes("3-digit addition") && !name.includes("place value")) {
      return "ADDITION_REGROUPING";
    }
    return "PLACE_VALUE";
  }
  if (id === "c-frac-01") return "FRACTIONS";
  if (id === "c-eng-blend-01") return "PHONETIC_BLENDS";
  if (id === "c-eng-comp-01") return "READING_COMPREHENSION";
  if (id === "c-eng-verb-01") return "SUBJECT_VERB_AGREEMENT";
  if (id === "c-guj-matra-01") return "GUJARATI_MATRAS";
  if (id === "c-guj-conj-01") return "GUJARATI_CONJUNCTS";
  if (id === "c-evs-water-01") return "WATER_CYCLE";
  if (id === "c-evs-plant-01") return "PLANT_PARTS";
  if (id === "c-evs-comm-01") return "COMMUNITY_HELPERS";

  // 2. Name-based semantic resolution (prioritizing specific terms over broad ones)
  if (name.includes("3-digit addition") || name.includes("regrouping") || name.includes("carry-over")) {
    return "ADDITION_REGROUPING";
  }
  if (name.includes("place value") || name.includes("place-value") || name.includes("સ્થાનકિંમત")) {
    return "PLACE_VALUE";
  }
  if (name.includes("multiplication") || name.includes("ઘડિયા") || name.includes("ગુણાકાર")) {
    return "MULTIPLICATION_TABLES";
  }
  if (name.includes("division") || name.includes("equal sharing") || name.includes("ભાગાકાર")) {
    return "DIVISION_EQUAL_SHARING";
  }
  if (name.includes("reading comprehension") || name.includes("short passage") || name.includes("અર્થગ્રહણ")) {
    return "READING_COMPREHENSION";
  }
  if (name.includes("water cycle") || name.includes("જળચક્ર") || name.includes("evaporation")) {
    return "WATER_CYCLE";
  }
  if (name.includes("fraction") || name.includes("અપૂર્ણાંક")) {
    return "FRACTIONS";
  }
  if (name.includes("subject-verb") || name.includes("subject verb") || name.includes("કર્તા-ક્રિયાપદ")) {
    return "SUBJECT_VERB_AGREEMENT";
  }
  if (name.includes("blend") || name.includes("digraph") || name.includes("phonetic")) {
    return "PHONETIC_BLENDS";
  }
  if (name.includes("matra") || name.includes("કાનો-માત્રા") || name.includes("સ્વર ચિહ્નો")) {
    return "GUJARATI_MATRAS";
  }
  if (name.includes("conjunct") || name.includes("જોડાક્ષર")) {
    return "GUJARATI_CONJUNCTS";
  }
  if (name.includes("plant") || name.includes("વનસ્પતિ")) {
    return "PLANT_PARTS";
  }
  if (name.includes("community") || name.includes("સેવકો") || name.includes("sanitation")) {
    return "COMMUNITY_HELPERS";
  }

  return "UNKNOWN_CONCEPT";
}

/**
 * Standardize status input
 */
function normalizeStatus(status?: string): "Needs Support" | "Developing" | "Mastered" {
  if (!status) return "Needs Support";
  const s = status.toLowerCase();
  if (s.includes("master")) return "Mastered";
  if (s.includes("develop") || s.includes("intervention")) return "Developing";
  return "Needs Support";
}

/**
 * Generate Centralized Pedagogical Prescription (Phase 4)
 */
export function generatePedagogicalPrescription(
  input: PedagogicalPrescriptionInput
): PedagogicalPrescription {
  const lang = input.language === "gu" ? "gu" : "en";
  const status = normalizeStatus(input.status);
  const conceptKey = identifyConceptKey(input.conceptId, input.conceptName, input.subject || input.subjectCode);

  // -------------------------------------------------------------
  // 1. MASTERED COMPETENCY HANDLING (Section 5 & 10)
  // Must NOT recommend remediation or display "Ready for 5-Step Plan"
  // -------------------------------------------------------------
  if (status === "Mastered") {
    const template = conceptKey !== "UNKNOWN_CONCEPT" ? CONCEPT_TEMPLATES[conceptKey] : null;
    const conceptDisplayName = template
      ? lang === "gu" ? template.nameGu : template.nameEn
      : input.conceptName || (lang === "gu" ? "સંકલ્પના" : "Concept");

    return {
      conceptKey,
      conceptDisplayName,
      activity:
        lang === "gu"
          ? `નિપુણતા પ્રાપ્ત થઈ છે. સમયાંતરે ૫ મિનિટનો પુનરાવર્તન મહાવરો કરાવો અને ${conceptDisplayName} સંકલ્પનાને નવા વાસ્તવિક ઉદાહરણોમાં લાગુ કરવા પ્રોત્સાહિત કરો.`
          : `Mastery achieved. Conduct periodic 5-minute retrieval practice and encourage the student to apply ${conceptDisplayName} to new examples and advanced problems.`,
      reason:
        lang === "gu"
          ? "સામયિક પુનરાવર્તન અને સંકલ્પના ટ્રાન્સફર બિનજરૂરી ઉપચાર વિના લાંબા ગાળાની જાળવણી સુનિશ્ચિત કરે છે."
          : "Periodic retrieval practice and concept transfer maintain long-term retention without unnecessary remediation.",
      duration: lang === "gu" ? "૫ મિનિટ" : "5 minutes",
      reassessment:
        lang === "gu"
          ? "લાંબા ગાળાની જાળવણીનું નિરીક્ષણ કરવા માટે ભાવિ મૂલ્યાંકનોમાં ૧–૨ સમીક્ષા પ્રશ્નો શામેલ કરો."
          : "Include 1–2 periodic check questions in future assessments to monitor retention.",
      recommendationType: "Mastery Maintenance",
      recommendationTypeGu: "નિપુણતા જાળવણી",
      remedialPlanEligible: false,
      planStatusLabel: "Mastery achieved — continue periodic retrieval practice.",
      planStatusLabelGu: "નિપુણતા પ્રાપ્ત થઈ — સામયિક પુનરાવર્તન જાળવો.",
    };
  }

  // -------------------------------------------------------------
  // 2. UNSUPPORTED OR AMBIGUOUS CONCEPTS (Section 8)
  // Safe diagnostic fallback
  // -------------------------------------------------------------
  if (conceptKey === "UNKNOWN_CONCEPT") {
    const subject = (input.subject || input.subjectCode || "").toUpperCase();

    let activity = lang === "gu"
      ? "શીખવાના ઉદ્દેશ્યની મૂળભૂત સમજ તપાસવા માટે વિદ્યાર્થી સાથે ટૂંકી ૫-મિનિટની નિદાન ચર્ચા કરો."
      : "Conduct a brief diagnostic conversation with the student to assess foundational understanding of the learning objective.";
    let reason = lang === "gu"
      ? "ઉપલબ્ધ માહિતીમાંથી હજુ સુધી વિશિષ્ટ માર્ગદર્શન બનાવી શકાતું નથી; લક્ષિત ઉપચાર પહેલાં નિરીક્ષણ જરૂરી છે."
      : "A specific prescription cannot yet be generated from the available information; diagnostic observation is required.";
    let duration = lang === "gu" ? "૫–૧૦ મિનિટ" : "5–10 minutes";
    let reassessment = lang === "gu"
      ? "યોગ્ય શૈક્ષણિક સહાય નક્કી કરવા માટે વિદ્યાર્થીના જવાબોની નોંધ લો."
      : "Record student responses to determine the appropriate pedagogical intervention.";

    if (subject.includes("MATH")) {
      activity = lang === "gu"
        ? "વિદ્યાર્થીની ચોક્કસ ગણિત મુશ્કેલી ઓળખવા માટે મૂર્ત કાઉન્ટર્સ અથવા કાગળ આધારિત ટૂંકી નિદાન પ્રવૃત્તિ કરાવો."
        : "Conduct a short diagnostic math activity using concrete counters or paper representations to identify the student's specific difficulty.";
      reason = lang === "gu"
        ? "વિષય-સ્તરીય નિદાન પ્રવૃત્તિ મૂળ સંકલ્પનાત્મક અવરોધને ઓળખવામાં મદદ કરે છે."
        : "Subject-level diagnostic practice helps identify the underlying conceptual obstacle.";
      duration = lang === "gu" ? "૧૦ મિનિટ" : "10 minutes";
      reassessment = lang === "gu"
        ? "મૂળભૂત ક્રિયાઓને આવરી લેતા ૩ લક્ષિત નિદાન પ્રશ્નો આપો."
        : "Administer 3 targeted diagnostic questions covering core operations.";
    } else if (subject.includes("ENG")) {
      activity = lang === "gu"
        ? "વિદ્યાર્થીની વાંચન અને સમજણ પ્રક્રિયાનું નિરીક્ષણ કરવા માટે ટૂંકું ભાષા નિદાન કાર્ય આપો."
        : "Provide a short language and reading diagnostic task to observe the student's decoding and comprehension process.";
      reason = lang === "gu"
        ? "મોટેથી વાંચનનું નિરીક્ષણ શબ્દભંડોળ અથવા વ્યાકરણની ચોક્કસ મુશ્કેલીને અલગ કરવામાં મદદ કરે છે."
        : "Observing language tasks aloud helps isolate specific vocabulary or grammatical roadblocks.";
      duration = lang === "gu" ? "૧૦ મિનિટ" : "10 minutes";
      reassessment = lang === "gu"
        ? "૩ ટૂંકા ભાષા પ્રશ્નો પર વિદ્યાર્થીના જવાબોની સમીક્ષા કરો."
        : "Review student responses on 3 short language tasks.";
    } else if (subject.includes("GUJ")) {
      activity = lang === "gu"
        ? "વિદ્યાર્થીને ટૂંકા ગુજરાતી વાક્યો વાંચવા અને લખવા કહો જેથી ચોક્કસ મુશ્કેલી ઓળખી શકાય."
        : "Ask the student to read and write short Gujarati sentences to observe letter and vowel recognition.";
      reason = lang === "gu"
        ? "ભાષાકીય નિરીક્ષણ ચોક્કસ ભાષા ખામી ઓળખવામાં મદદ કરે છે."
        : "Direct linguistic observation isolates the specific reading or writing roadblock.";
      duration = lang === "gu" ? "૧૦ મિનિટ" : "10 minutes";
      reassessment = lang === "gu"
        ? "ટૂંકા ૨-પ્રશ્નોના કાર્ય દ્વારા મૂલ્યાંકન કરો."
        : "Assess responses on 2 short guided tasks.";
    } else if (subject.includes("EVS")) {
      activity = lang === "gu"
        ? "પર્યાવરણની મુખ્ય વિભાવનાઓ તપાસવા માટે ચિત્ર-આધારિત ટૂંકી નિદાન ચર્ચા કરો."
        : "Use a simple picture-based diagnostic discussion to check the student's understanding of key environmental concepts.";
      reason = lang === "gu"
        ? "દૃશ્ય ચર્ચા દર્શાવે છે કે મુશ્કેલી સંકલ્પનાત્મક છે કે શબ્દભંડોળ આધારિત."
        : "Visual discussion reveals whether difficulty is conceptual or vocabulary-related.";
      duration = lang === "gu" ? "૧૦ મિનિટ" : "10 minutes";
      reassessment = lang === "gu"
        ? "આકૃતિઓનો ઉપયોગ કરીને ૨ સમજૂતી પ્રશ્નો પૂછો."
        : "Ask 2 explanation questions using diagrams.";
    }

    return {
      conceptKey: "UNKNOWN_CONCEPT",
      conceptDisplayName: input.conceptName || (lang === "gu" ? "અજાણી સંકલ્પના" : "Unsupported Concept"),
      activity,
      reason,
      duration,
      reassessment,
      recommendationType: "Diagnostic Activity",
      recommendationTypeGu: "નિદાન પ્રવૃત્તિ",
      remedialPlanEligible: true,
      planStatusLabel: "Ready for 5-Step Concrete Remedial Plan",
      planStatusLabelGu: "૫-પગલાં પ્રવૃત્તિ આધારિત ઉપચાર માટે તૈયાર",
    };
  }

  // -------------------------------------------------------------
  // 3. SUPPORTED CONCEPT PRESCRIPTION
  // -------------------------------------------------------------
  const template = CONCEPT_TEMPLATES[conceptKey];
  const conceptDisplayName = lang === "gu" ? template.nameGu : template.nameEn;
  const content = status === "Needs Support" ? template.needsSupport : template.developing;

  let activity = lang === "gu" ? content.activityGu : content.activityEn;
  let reason = lang === "gu" ? content.whyGu : content.whyEn;
  let duration = lang === "gu" ? content.durationGu : content.durationEn;
  let reassessment = lang === "gu" ? content.reassessmentGu : content.reassessmentEn;

  let recommendationType: RecommendationType =
    status === "Needs Support" ? "Remedial Practice" : "Focused Practice";

  // -------------------------------------------------------------
  // 4. DIAGNOSIS-AWARE REFINEMENTS (Section 4)
  // Must influence the recommendation without overriding the concept
  // -------------------------------------------------------------
  const diag = input.diagnosisType || "";

  if (diag === "Insufficient Evidence") {
    recommendationType = "Diagnostic Activity";
    activity = lang === "gu"
      ? `ચોક્કસ જ્ઞાનાત્મક અવરોધ નક્કી કરવા માટે ${conceptDisplayName} પર ૫-મિનિટનું ટૂંકું નિદાન કાર્ય લો.`
      : `Administer a short 5-minute diagnostic task covering varied problem types in ${conceptDisplayName} to isolate the cognitive obstacle.`;
    reason = lang === "gu"
      ? "ચોક્કસ જ્ઞાનાત્મક અવરોધને ઓળખવા માટે ઉપલબ્ધ મૂલ્યાંકન ડેટા અપૂરતો છે; લક્ષિત હસ્તક્ષેપ પહેલાં નિદાન પ્રવૃત્તિ જરૂરી છે."
      : "Available assessment data is insufficient to identify the specific cognitive obstacle; diagnostic observation is needed before targeted intervention.";
    duration = lang === "gu" ? "૫–૧૦ મિનિટ" : "5–10 minutes";
    reassessment = lang === "gu"
      ? "નિદાન પરિણામોની સમીક્ષા કરી યોગ્ય મૂર્ત અથવા પ્રક્રિયાત્મક સહાય પસંદ કરો."
      : "Review diagnostic responses to select the appropriate concrete or procedural intervention.";
  } else if (diag === "Conceptual Gap") {
    const noteEn = " Concrete demonstration and student verbal explanation are emphasized to rebuild the mental model.";
    const noteGu = " માનસિક મોડેલને ફરીથી બનાવવા માટે મૂર્ત નિદર્શન અને વિદ્યાર્થીની મૌખિક સમજૂતી પર ભાર મૂકવામાં આવ્યો છે.";
    if (!reason.includes("Concrete") && !reason.includes("મૂર્ત")) {
      reason += lang === "gu" ? noteGu : noteEn;
    }
  } else if (diag === "Procedural Error") {
    const noteEn = " Use step-by-step worked examples to scaffold sequential operational execution.";
    const noteGu = " ક્રમિક કાર્યપદ્ધતિ અમલીકરણને ટેકો આપવા માટે પગલાંવાર ઉકેલાયેલા ઉદાહરણોનો ઉપયોગ કરો.";
    if (!reason.includes("worked examples") && !reason.includes("ઉકેલાયેલા ઉદાહરણો")) {
      reason += lang === "gu" ? noteGu : noteEn;
    }
  } else if (diag === "Possible Careless Error") {
    const noteEn = " Guide the student through an error-checking checklist on 2–3 questions to confirm understanding.";
    const noteGu = " સમજણની પુષ્ટિ કરવા માટે ૨–૩ પ્રશ્નો પર ભૂલ-તપાસણી ચેકલિસ્ટ દ્વારા વિદ્યાર્થીને માર્ગદર્શન આપો.";
    duration = lang === "gu" ? "૫–૧૦ મિનિટ" : "5–10 minutes";
    reason += lang === "gu" ? noteGu : noteEn;
  } else if (diag === "Prerequisite Weakness") {
    const noteEn = " Briefly revisit the foundational prerequisite before proceeding to current grade-level problems.";
    const noteGu = " વર્તમાન ધોરણ-સ્તરની સમસ્યાઓ પર આગળ વધતાં પહેલાં પાયાની પૂર્વશરત સંકલ્પનાનું પુનરાવર્તન કરો.";
    reason += lang === "gu" ? noteGu : noteEn;
  }

  // -------------------------------------------------------------
  // 5. PROGRESS TREND INTEGRATION (Section 6)
  // When valid historical trend is available
  // -------------------------------------------------------------
  const trend = input.trend || "";
  const delta = input.scoreDelta;

  if (trend === "Improving" || (delta !== null && delta !== undefined && delta > 2)) {
    const trendNoteEn = " Progress is improving. Continue the current focused practice and gradually introduce more challenging examples.";
    const trendNoteGu = " પ્રગતિ સુધરી રહી છે. વર્તમાન લક્ષિત મહાવરો ચાલુ રાખો અને ધીમે ધીમે વધુ પડકારરૂપ ઉદાહરણો રજૂ કરો.";
    reason += lang === "gu" ? trendNoteGu : trendNoteEn;
  } else if (trend === "Stable" || (delta !== null && delta !== undefined && delta >= -2 && delta <= 2 && input.previousScore !== null && input.previousScore !== undefined)) {
    const trendNoteEn = " Progress is stable. Try a different representation or practice strategy to strengthen understanding.";
    const trendNoteGu = " પ્રગતિ સ્થિર છે. સમજ મજબૂત કરવા માટે એક અલગ રજૂઆત અથવા પ્રેક્ટિસ વ્યૂહરચના અજમાવો.";
    reason += lang === "gu" ? trendNoteGu : trendNoteEn;
  } else if (trend === "Declining" || (delta !== null && delta !== undefined && delta < -2)) {
    const trendNoteEn = " Recent performance has declined. Review the concept using guided examples and investigate possible learning difficulties before progressing.";
    const trendNoteGu = " તાજેતરનું પ્રદર્શન ઘટ્યું છે. માર્ગદર્શિત ઉદાહરણોનો ઉપયોગ કરીને સંકલ્પનાની સમીક્ષા કરો અને આગળ વધતાં પહેલાં મુશ્કેલીઓની તપાસ કરો.";
    reason += lang === "gu" ? trendNoteGu : trendNoteEn;
  }

  const recommendationTypeGu =
    recommendationType === "Remedial Practice"
      ? "ઉપચારાત્મક મહાવરો"
      : recommendationType === "Focused Practice"
      ? "લક્ષિત મહાવરો"
      : "નિદાન પ્રવૃત્તિ";

  return {
    conceptKey,
    conceptDisplayName,
    activity,
    reason,
    duration,
    reassessment,
    recommendationType,
    recommendationTypeGu,
    remedialPlanEligible: true,
    planStatusLabel: "Ready for 5-Step Concrete Remedial Plan",
    planStatusLabelGu: "૫-પગલાં પ્રવૃત્તિ આધારિત ઉપચાર માટે તૈયાર",
  };
}

