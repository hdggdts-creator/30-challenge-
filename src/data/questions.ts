export type QuestionType = 'direct' | 'mcq' | 'tf' | 'fill' | 'match' | 'hints';
import { EXTRA_QUESTIONS } from './questions-extra';
import { NEW_CATEGORIES_QUESTIONS } from './questions-new';
import { QUESTIONS_PACK_75 } from './questions-75';
import { QUESTIONS_EXTRA_5 } from './questions-extra-5';
import { QUESTIONS_EXTRA_6 } from './questions-extra-6';

export interface BaseQuestion {
  id: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  type: QuestionType;
}

export interface DirectQuestion extends BaseQuestion {
  type: 'direct';
  question: string;
  answer: string;
  hint: string;
  accept?: string[];
}

export interface McqQuestion extends BaseQuestion {
  type: 'mcq';
  question: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
}

export interface TfQuestion extends BaseQuestion {
  type: 'tf';
  question: string;
  answer: boolean;
  explanation: string;
}

export interface FillQuestion extends BaseQuestion {
  type: 'fill';
  kind?: string;
  text: string;
  answer: string;
  accept?: string[];
  explanation: string;
}

export interface MatchPair {
  right: string;
  left: string;
}

export interface MatchQuestion extends BaseQuestion {
  type: 'match';
  title: string;
  pairs: MatchPair[];
}

export interface HintsQuestion extends BaseQuestion {
  type: 'hints';
  hints: string[];
  answer: string;
  accept?: string[];
}

export type Question = DirectQuestion | McqQuestion | TfQuestion | FillQuestion | MatchQuestion | HintsQuestion;

export interface ModeMetadata {
  id: QuestionType;
  name: string;
  shortName: string;
  desc: string;
  badge: string;
  iconName: string;
}

export const QUESTION_MODES: ModeMetadata[] = [
  {
    id: 'direct',
    name: 'سؤال مباشر',
    shortName: 'مباشر',
    desc: 'السؤال الكلاسيكي مع حكم المقدّم وزر إظهار الإجابة',
    badge: '🎤 مباشر',
    iconName: 'HelpCircle'
  },
  {
    id: 'mcq',
    name: 'اختيار من متعدد',
    shortName: 'اختيارات',
    desc: '4 خيارات تفاعلية مع تصحيح آلي فوري وشرح توضيحي',
    badge: '🎯 اختيار من متعدد',
    iconName: 'ListChecks'
  },
  {
    id: 'tf',
    name: 'صح أو خطأ',
    shortName: 'صح/خطأ',
    desc: 'بطاقتان تفاعليتان عريضتان مع تقييم آلي وتعليل فوري',
    badge: '⚡ صح أو خطأ',
    iconName: 'CheckCircle2'
  },
  {
    id: 'fill',
    name: 'أكمل الناقص',
    shortName: 'أكمل',
    desc: 'أبيات شعر وأمثال وحكم وفراغ متوهج يُكشف بنقرة',
    badge: '✍️ أكمل الناقص',
    iconName: 'PenLine'
  },
  {
    id: 'match',
    name: 'المطابقة والتوصيل',
    shortName: 'مطابقة',
    desc: 'توصيل 4 أزواج بين عمودين مع مؤقت موسع (45 ثانية)',
    badge: '🧩 المطابقة',
    iconName: 'Layers'
  },
  {
    id: 'hints',
    name: 'خمّن من التلميحات',
    shortName: 'تلميحات',
    desc: '5 تلميحات متتالية تتكشف وتتناقص النقاط من 5 إلى 1',
    badge: '💡 خمّن من التلميحات',
    iconName: 'Lightbulb'
  }
];

export const CATEGORIES = [
  { id: 'تاريخ', name: 'تاريخ', icon: 'landmark', color: '#D4AF37' },
  { id: 'جغرافيا', name: 'جغرافيا', icon: 'globe', color: '#38BDF8' },
  { id: 'علوم', name: 'علوم', icon: 'atom', color: '#34D399' },
  { id: 'ثقافة إسلامية', name: 'ثقافة إسلامية', icon: 'moon', color: '#FBBF24' },
  { id: 'أدب وشعر عربي', name: 'أدب وشعر عربي', icon: 'feather', color: '#E879F9' },
  { id: 'فنون وسينما', name: 'فنون وسينما', icon: 'palette', color: '#F472B6' },
  { id: 'تقنية', name: 'تقنية', icon: 'cpu', color: '#818CF8' },
  { id: 'لغة عربية', name: 'لغة عربية', icon: 'book-open', color: '#2DD4BF' },
  { id: 'اقتصاد ومال', name: 'اقتصاد ومال', icon: 'coins', color: '#F59E0B' },
  { id: 'ألغاز ومنطق', name: 'ألغاز ومنطق', icon: 'brain', color: '#A78BFA' },
  { id: 'الرياضة', name: 'الرياضة', icon: 'trophy', color: '#FB923C' },
  { id: 'الرياضيات', name: 'الرياضيات', icon: 'calculator', color: '#22D3EE' },
  { id: 'قواعد الإنجليزية', name: 'قواعد الإنجليزية', icon: 'languages', color: '#F43F5E' },
] as const;

export const QUESTIONS_BANK: Question[] = [
  // ========================================================
  // 1. نمط الاختيار من متعدد (MCQ)
  // ========================================================
  {
    id: 'mcq_01',
    type: 'mcq',
    category: 'تاريخ',
    difficulty: 'easy',
    question: 'في أي عام تم توحيد المملكة العربية السعودية على يد الملك عبد العزيز آل سعود؟',
    choices: ['1932م', '1925م', '1940م', '1919م'],
    correctIndex: 0,
    explanation: 'أُعلن توحيد المملكة العربية السعودية في 23 سبتمبر 1932م وهو اليوم الوطني السعودي.'
  },
  {
    id: 'mcq_02',
    type: 'mcq',
    category: 'تاريخ',
    difficulty: 'medium',
    question: 'ما المعركة التاريخية التي انتصر فيها المسلمون بقيادة طارق بن زياد في الأندلس عام 711م؟',
    choices: ['معركة وادي لكة', 'معركة بلاط الشهداء', 'معركة الزلاقة', 'معركة الأرك'],
    correctIndex: 0,
    explanation: 'معركة وادي لكة فتحت الطريق لدخول المسلمين إلى شبه الجزيرة الإيبيرية (الأندلس).'
  },
  {
    id: 'mcq_03',
    type: 'mcq',
    category: 'تاريخ',
    difficulty: 'medium',
    question: 'من هو القائد المسلم الذي نجح في استرداد بيت المقدس بعد معركة حطين عام 1187م؟',
    choices: ['صلاح الدين الأيوبي', 'نور الدين زنكي', 'عماد الدين زنكي', 'سيف الدين قطز'],
    correctIndex: 0,
    explanation: 'قاد السلطان الناصر صلاح الدين الأيوبي جيوش المسلمين للنصر في حطين وتحرير القدس.'
  },
  {
    id: 'mcq_04',
    type: 'mcq',
    category: 'جغرافيا',
    difficulty: 'easy',
    question: 'ما هي الدولة الإفريقية الوحيدة التي تطل سواحلها على البحر الأبيض المتوسط والمحيط الأطلسي معاً؟',
    choices: ['المملكة المغربية', 'الجمهورية الجزائرية', 'الجمهورية التونسية', 'جمهورية مصر العربية'],
    correctIndex: 0,
    explanation: 'يتمتع المغرب بموقع استراتيجي فريد يطل شمالاً على المتوسط وغرباً على المحيط الأطلسي عبر مضيق جبل طارق.'
  },
  {
    id: 'mcq_05',
    type: 'mcq',
    category: 'جغرافيا',
    difficulty: 'medium',
    question: 'ما هي عاصمة أستراليا الفيدرالية الرسمية؟',
    choices: ['كانبرا', 'سيدني', 'ملبورن', 'بريسبان'],
    correctIndex: 0,
    explanation: 'اختيرت كانبرا كعاصمة تسوية بين المدينتين الأكبر سيدني وملبورن عام 1908م.'
  },
  {
    id: 'mcq_06',
    type: 'mcq',
    category: 'علوم',
    difficulty: 'easy',
    question: 'ما هو العنصر الكيميائي الأكثر وفرة وانتشاراً في الكون بأسره؟',
    choices: ['الهيدروجين', 'الهيليوم', 'الأكسجين', 'النيتروجين'],
    correctIndex: 0,
    explanation: 'يشكل الهيدروجين حوالي 75% من الكتلة العنصرية للكون وهو الوقود الأساسي للنجوم.'
  },
  {
    id: 'mcq_07',
    type: 'mcq',
    category: 'علوم',
    difficulty: 'medium',
    question: 'ما هي أسرع حاسة في استجابة الدماغ البشري؟',
    choices: ['حاسة السمع', 'حاسة البصر', 'حاسة اللمس', 'حاسة الشم'],
    correctIndex: 0,
    explanation: 'يستغرق الدماغ البشري حوالي 0.05 ثانية فقط للتعرف على الصوت، وهو أسرع بكثير من معالجة الصورة.'
  },
  {
    id: 'mcq_08',
    type: 'mcq',
    category: 'ثقافة إسلامية',
    difficulty: 'easy',
    question: 'ما هي السورة القرآنية الوحيدة التي لا تبدأ بالبسملة؟',
    choices: ['سورة التوبة', 'سورة الأنفال', 'سورة النمل', 'سورة الحشر'],
    correctIndex: 0,
    explanation: 'سورة التوبة (براءة) لم تبدأ بالبسملة لأنها نزلت بالسيف ونبذ عهود المشركين، بينما ذُكرت البسملة مرتين في سورة النمل.'
  },
  {
    id: 'mcq_09',
    type: 'mcq',
    category: 'أدب وشعر عربي',
    difficulty: 'medium',
    question: 'من صاحب المعلقة الشهيرة التي مطلعها: قِفا نَبكِ مِن ذِكرى حَبيبٍ وَمَنزِلِ؟',
    choices: ['امرؤ القيس', 'عنترة بن شداد', 'زهير بن أبي سلمى', 'طرف بن العبد'],
    correctIndex: 0,
    explanation: 'امرؤ القيس الكندي الملقب بالملك الضليل هو قائل أشهر مطالع الشعر العربي الجاهلي.'
  },
  {
    id: 'mcq_10',
    type: 'mcq',
    category: 'تقنية',
    difficulty: 'easy',
    question: 'ما هي لغة البرمجة التي تشغل التفاعل في صفحات الويب بصورة أساسية في المتصفحات؟',
    choices: ['جافاسكريبت (JavaScript)', 'بايثون (Python)', 'سي بلس بلس (C++)', 'روبي (Ruby)'],
    correctIndex: 0,
    explanation: 'جافاسكريبت هي اللغة القياسية الوحيدة المدعومة أصلياً للتنفيذ داخل جميع متصفحات الويب الحديثة.'
  },
  {
    id: 'mcq_11',
    type: 'mcq',
    category: 'لغة عربية',
    difficulty: 'easy',
    question: 'ما الحرف الذي تتميز به اللغة العربية ويسمى تيمناً به لغة الضاد؟',
    choices: ['الضاد', 'الظاء', 'القاف', 'الغين'],
    correctIndex: 0,
    explanation: 'سُميت لغة الضاد لصعوبة نطق هذا الحرف وخصوصيته التي لا توجد بنفس المخرج الصوتي في اللغات الأخرى.'
  },
  {
    id: 'mcq_12',
    type: 'mcq',
    category: 'اقتصاد ومال',
    difficulty: 'medium',
    question: 'ما هو البنك المركزي للولايات المتحدة الأمريكية المسؤول عن السياسة النقدية؟',
    choices: ['الاحتياطي الفيدرالي', 'بنك التسويات الدولية', 'صندوق النقد العربي', 'البنك الدولي'],
    correctIndex: 0,
    explanation: 'نظام الاحتياطي الفيدرالي الأمريكي (Federal Reserve) هو الذي يحدد أسعار الفائدة ويطبع الدولار.'
  },
  {
    id: 'mcq_13',
    type: 'mcq',
    category: 'فنون وسينما',
    difficulty: 'easy',
    question: 'من هو الفنان الإيطالي الشهير الذي رسم لوحة الموناليزا؟',
    choices: ['ليوناردو دافنشي', 'ميكيلانجيلو', 'رافاييل', 'كارافاجيو'],
    correctIndex: 0,
    explanation: 'رسم العبقري الموسوعي ليوناردو دافنشي لوحة الموناليزا في بدايات القرن السادس عشر والمعروضة حالياً بمتحف اللوفر.'
  },
  {
    id: 'mcq_14',
    type: 'mcq',
    category: 'ألغاز ومنطق',
    difficulty: 'easy',
    question: 'ما هو الشيء الذي يمشي بأربع أرجل في الصباح، واثنتين في الظهيرة، وثلاث في المساء؟',
    choices: ['الإنسان', 'الساعة', 'الظل', 'الشمس'],
    correctIndex: 0,
    explanation: 'لغز أبو الهول الشهير: يحبو طفلاً (4)، ويمشي يافعاً (2)، ويتوكأ على عصا عند الكبر (3).'
  },

  // ========================================================
  // 2. نمط صح أو خطأ (TF)
  // ========================================================
  {
    id: 'tf_01',
    type: 'tf',
    category: 'علوم',
    difficulty: 'easy',
    question: 'الشمس عبارة عن نجم متوسط الحجم وليست كوكباً.',
    answer: true,
    explanation: 'صحيح، الشمس نجم من النوع القزم الأصفر وتولد طاقتها عبر الاندماج النووي للهيدروجين.'
  },
  {
    id: 'tf_02',
    type: 'tf',
    category: 'علوم',
    difficulty: 'easy',
    question: 'الصوت ينتقل في الفراغ أسرع من انتقاله في الماء.',
    answer: false,
    explanation: 'خطأ، الصوت موجة ميكانيكية تحتاج لوسط مادي ملموس ولا يمكنه الانتقال مطلقاً في الفراغ التام.'
  },
  {
    id: 'tf_03',
    type: 'tf',
    category: 'جغرافيا',
    difficulty: 'easy',
    question: 'نهر الأمازون هو أطول نهر في العالم متفوقاً على نهر النيل.',
    answer: false,
    explanation: 'خطأ، نهر النيل هو الأطول تاريخياً ورسمياً، بينما الأمازون هو الأغزر تدفقاً والأكبر حوضاً.'
  },
  {
    id: 'tf_04',
    type: 'tf',
    category: 'ثقافة إسلامية',
    difficulty: 'easy',
    question: 'الصلوات المفروضة فُرضت ليلة الإسراء والمعراج في السماء العلا.',
    answer: true,
    explanation: 'صحيح، الصلاة هي العبادة الوحيدة التي فُرضت مباشرة دون واسطة الوحي جبريل عليه السلام.'
  },
  {
    id: 'tf_05',
    type: 'tf',
    category: 'تاريخ',
    difficulty: 'medium',
    question: 'سور الصين العظيم يمكن رؤيته بوضوح بالعين المجردة من سطح القمر دون أدوات تكبير.',
    answer: false,
    explanation: 'خطأ، أكد رواد الفضاء ووكالة ناسا أن السور لا يمكن رؤيته بالعين المجردة من مدار الأرض المنخفض فكيف بالقمر.'
  },
  {
    id: 'tf_06',
    type: 'tf',
    category: 'أدب وشعر عربي',
    difficulty: 'easy',
    question: 'أحمد شوقي لُقّب بـ "أمير الشعراء" في العصر الحديث.',
    answer: true,
    explanation: 'صحيح، بايعه شعراء العرب عام 1927م في حفل مهيب بالقاهرة أميراً للشعراء.'
  },
  {
    id: 'tf_07',
    type: 'tf',
    category: 'تقنية',
    difficulty: 'easy',
    question: 'نظام التشغيل أندرويد للهواتف الذكية مبني في نواته على لينكس (Linux).',
    answer: true,
    explanation: 'صحيح، يعتمد أندرويد على نواة لينكس لإدارة الذاكرة والعتاد والمعالجات.'
  },
  {
    id: 'tf_08',
    type: 'tf',
    category: 'لغة عربية',
    difficulty: 'medium',
    question: 'كلمة "أخطبوط" كلمة عربية أصيلة وليست معربة من أصل يوناني.',
    answer: false,
    explanation: 'خطأ، هي كلمة معربة من اليونانية (Octopus) وتعني ثماني الأقدام.'
  },
  {
    id: 'tf_09',
    type: 'tf',
    category: 'اقتصاد ومال',
    difficulty: 'easy',
    question: 'التضخم الاقتصادي يعني انخفاض المستوى العام لأسعار السلع والخدمات.',
    answer: false,
    explanation: 'خطأ، التضخم هو الارتفاع المستمر في المستوى العام للأسعار وتراجع القوة الشرائية للنقود.'
  },
  {
    id: 'tf_10',
    type: 'tf',
    category: 'ألغاز ومنطق',
    difficulty: 'easy',
    question: 'الرقم صفر (0) هو عدد زوجي.',
    answer: true,
    explanation: 'صحيح رياضياً، فالصفر يقبل القسمة على 2 بدون باقٍ (0 ÷ 2 = 0) ويقع بين فرديين (-1 و 1).'
  },

  // ========================================================
  // 3. نمط أكمل الناقص (Fill)
  // ========================================================
  {
    id: 'fill_01',
    type: 'fill',
    category: 'أدب وشعر عربي',
    difficulty: 'easy',
    kind: 'بيت شعر',
    text: 'إذا رَأيتَ نُيُوبَ اللّيثِ بارِزَةً ... فلا تَظُنَّنَّ أنّ اللّيثَ ____',
    answer: 'يبتسم',
    accept: ['يبتسم', 'يبتسمُ'],
    explanation: 'من روائع المتنبي في التحذير من مكر الخصم وعدم الانخداع بمظهره.'
  },
  {
    id: 'fill_02',
    type: 'fill',
    category: 'أدب وشعر عربي',
    difficulty: 'easy',
    kind: 'بيت شعر',
    text: 'الأُمُّ مَدرَسَةٌ إِذا أَعدَدتَها ... أَعدَدتَ شَعباً طَيِّبَ ____',
    answer: 'الأعراق',
    accept: ['الأعراق', 'الاعراق'],
    explanation: 'من قصيدة حافظ إبراهيم الخالدة في فضل الأم ودورها في بناء الأمة.'
  },
  {
    id: 'fill_03',
    type: 'fill',
    category: 'أدب وشعر عربي',
    difficulty: 'easy',
    kind: 'مثل عربي',
    text: 'رُبّ أخٍ لكَ لم تَلِدْهُ ____',
    answer: 'أمك',
    accept: ['أمك', 'امك'],
    explanation: 'مثل عربي شهير يضرب لوفاء الأصدقاء المخلصين وعظم منزلتهم كالإخوة.'
  },
  {
    id: 'fill_04',
    type: 'fill',
    category: 'أدب وشعر عربي',
    difficulty: 'easy',
    kind: 'مثل عربي',
    text: 'على أهلها جَنَتْ ____',
    answer: 'براقش',
    accept: ['براقش'],
    explanation: 'براقش كلبة نبحت على جنود فاستدلوا بصوتها على قومها وقتلوهم.'
  },
  {
    id: 'fill_05',
    type: 'fill',
    category: 'أدب وشعر عربي',
    difficulty: 'easy',
    kind: 'حكمة شهيرة',
    text: 'العقل السليم في الجسم ____',
    answer: 'السليم',
    accept: ['السليم'],
    explanation: 'حكمة خالدة تبين الترابط القوي بين سلامة البدن والصفاء الذهني.'
  },
  {
    id: 'fill_06',
    type: 'fill',
    category: 'تاريخ',
    difficulty: 'medium',
    kind: 'قول تاريخي',
    text: 'متى استعبدتم الناس وقد ولدتهم أمهاتهم ____',
    answer: 'أحراراً',
    accept: ['أحراراً', 'احرارا', 'أحرار'],
    explanation: 'قول أمير المؤمنين عمر بن الخطاب رضي الله عنه لوالي مصر عمرو بن العاص.'
  },
  {
    id: 'fill_07',
    type: 'fill',
    category: 'ثقافة إسلامية',
    difficulty: 'easy',
    kind: 'حديث شريف',
    text: 'إنما الأعمال بـ ____ وإنما لكل امرئ ما نوى',
    answer: 'النيات',
    accept: ['النيات', 'النيّات'],
    explanation: 'حديث نبوي شريف متفق عليه، ويعد أصلاً عظيماً من أصول الدين وقبول العمل.'
  },

  // ========================================================
  // 4. نمط المطابقة والتوصيل (Match)
  // ========================================================
  {
    id: 'match_01',
    type: 'match',
    category: 'جغرافيا',
    difficulty: 'easy',
    title: 'طابق كل دولة عربية بعاصمتها الرسمية:',
    pairs: [
      { right: 'المملكة العربية السعودية', left: 'الرياض' },
      { right: 'جمهورية مصر العربية', left: 'القاهرة' },
      { right: 'المملكة المغربية', left: 'الرباط' },
      { right: 'الجمهورية العراقية', left: 'بغداد' }
    ]
  },
  {
    id: 'match_02',
    type: 'match',
    category: 'تاريخ',
    difficulty: 'medium',
    title: 'طابق كل قائد إسلامي بالمعركة الفاصلة التي قادها:',
    pairs: [
      { right: 'صلاح الدين الأيوبي', left: 'حطين' },
      { right: 'طارق بن زياد', left: 'وادي لكة' },
      { right: 'سيف الدين قطز', left: 'عين جالوت' },
      { right: 'خالد بن الوليد', left: 'اليرموك' }
    ]
  },
  {
    id: 'match_03',
    type: 'match',
    category: 'علوم',
    difficulty: 'easy',
    title: 'طابق كل عنصر كيميائي برمزه اللاتيني في الجدول الدوري:',
    pairs: [
      { right: 'الذهب', left: 'Au' },
      { right: 'الفضة', left: 'Ag' },
      { right: 'الحديد', left: 'Fe' },
      { right: 'النحاس', left: 'Cu' }
    ]
  },
  {
    id: 'match_04',
    type: 'match',
    category: 'أدب وشعر عربي',
    difficulty: 'medium',
    title: 'طابق كل عمل أدبي بمؤلفه وكاتبه:',
    pairs: [
      { right: 'مقدمة ابن خلدون', left: 'ابن خلدون' },
      { right: 'كليلة ودمنة (المعرب)', left: 'ابن المقفع' },
      { right: 'الأغاني', left: 'أبو الفرج الأصفهاني' },
      { right: 'البخلاء', left: 'الجاحظ' }
    ]
  },
  {
    id: 'match_05',
    type: 'match',
    category: 'تقنية',
    difficulty: 'easy',
    title: 'طابق كل نظام تشغيل بالشركة العالمية المطورة له:',
    pairs: [
      { right: 'ويندوز (Windows)', left: 'مايكروسوفت' },
      { right: 'آي أو إس (iOS)', left: 'أبل' },
      { right: 'أندرويد (Android)', left: 'غوغل' },
      { right: 'بلايستيشن OS', left: 'سوني' }
    ]
  },

  // ========================================================
  // 5. نمط خمّن من التلميحات (Hints)
  // ========================================================
  {
    id: 'hints_01',
    type: 'hints',
    category: 'تاريخ',
    difficulty: 'easy',
    hints: [
      'شخصية تاريخية وفاتح عظيم وُلد في مقدونيا عام 356 ق.م.',
      'تتلمذ صغيراً على يد الفيلسوف الإغريقي أرسطو.',
      'لم يهزم في أي معركة خاضها طوال حياته العسكرية القصيرة.',
      'أسس إمبراطورية امتدت من اليونان إلى حدود الهند ومصر.',
      'سُمي "الأكبر" وأسس مدينة الإسكندرية المصرية.'
    ],
    answer: 'الإسكندر الأكبر',
    accept: ['الإسكندر الأكبر', 'الاسكندر الاكبر', 'الإسكندر المقدوني']
  },
  {
    id: 'hints_02',
    type: 'hints',
    category: 'علوم',
    difficulty: 'easy',
    hints: [
      'جرم سماوي وتابع طبيعي يدور حول كوكب الأرض.',
      'يبعد عنا مسافة تقارب 384 ألف كيلومتر في الفضاء.',
      'يؤثر بجاذبيته على حركتي المد والجزر في محيطات الأرض.',
      'هبط عليه أول إنسان من رواد الفضاء عام 1969م (نيل أرمسترونغ).',
      'يمر بأطوار شهيرة كالهلال والتربيع والبدر كل شهر قمري.'
    ],
    answer: 'القمر',
    accept: ['القمر']
  },
  {
    id: 'hints_03',
    type: 'hints',
    category: 'جغرافيا',
    difficulty: 'easy',
    hints: [
      'أكبر دولة عربية من حيث المساحة الجغرافية حالياً.',
      'تقع في شمال قارة إفريقيا وتطل شمالاً على البحر المتوسط.',
      'تغطي الصحراء الكبرى أكثر من ثمانين بالمئة من إجمالي أراضيها.',
      'لُقبت تاريخياً ببلد المليون ونصف المليون شهيد.',
      'عاصمتها تحمل نفس اسمها وتلقب بالجزائر البيضاء أو البهجة.'
    ],
    answer: 'الجزائر',
    accept: ['الجزائر']
  },
  {
    id: 'hints_04',
    type: 'hints',
    category: 'ثقافة إسلامية',
    difficulty: 'easy',
    hints: [
      'سورة كريمة تقع في أواخر المصحف الشريف في الجزء الثلاثين.',
      'تعدل في فضلها وثواب قراءتها ثلث القرآن الكريم كما صح في الحديث النبوي.',
      'تتضمن صفات التوحيد الخالص ونفي الشريك والولد عن الله سبحانه.',
      'تتكون من أربع آيات كريمة فقط ولا يُذكر فيها اسم السورة في آياتها.',
      'تبدأ بالآية الكريمة: قُلْ هُوَ اللَّهُ أَحَدٌ.'
    ],
    answer: 'سورة الإخلاص',
    accept: ['سورة الإخلاص', 'الإخلاص', 'الاخلاص']
  },
  {
    id: 'hints_05',
    type: 'hints',
    category: 'فنون وسينما',
    difficulty: 'medium',
    hints: [
      'تحفة معمارية وهندسية ضخمة مصنوعة من الحديد في القرن التاسع عشر.',
      'شُيدت بمناسبة المعرض الدولي لعام 1889م واحتفالاً بمئوية الثورة الفرنسية.',
      'ظلت أطول هيكل بناه الإنسان في العالم لعدة عقود بارتفاع 300 متر.',
      'صممها المهندس غوستاف وسُميت تيمناً باسمه العائلي.',
      'تقع على ضفاف نهر السين وتعد المعلم الأشهر لمدينة باريس الفرنسية.'
    ],
    answer: 'برج إيفل',
    accept: ['برج إيفل', 'برج ايفل']
  },

  // ========================================================
  // 6. نمط السؤال المباشر الكلاسيكي (Direct)
  // ========================================================
  {
    id: 'his-1',
    category: 'تاريخ',
    difficulty: 'easy',
    type: 'direct',
    question: 'ما هي أقدم عاصمة مأهولة بالسكان بشكل مستمر في العالم حتى اليوم؟',
    answer: 'دمشق',
    hint: 'عاصمة عربية تقع في بلاد الشام'
  },
  {
    id: 'his-2',
    category: 'تاريخ',
    difficulty: 'easy',
    type: 'direct',
    question: 'في أي قارة نشأت حضارة الإنكا القديمة وازدهرت؟',
    answer: 'أمريكا الجنوبية',
    hint: 'قارة جبال الأنديز وغابات الأمازون'
  },
  {
    id: 'his-3',
    category: 'تاريخ',
    difficulty: 'easy',
    type: 'direct',
    question: 'ما هي الحضارة التي شيدت أهرامات الجيزة الخالدة؟',
    answer: 'الحضارة المصرية القديمة (الفراعنة)',
    hint: 'قامت على ضفاف نهر النيل'
  },
  {
    id: 'geo-1',
    category: 'جغرافيا',
    difficulty: 'easy',
    type: 'direct',
    question: 'ما هي عاصمة اليابان وعاصمتها الاقتصادية والتجارية؟',
    answer: 'طوكيو',
    hint: 'أكبر تجمع سكاني وحضري في العالم'
  },
  {
    id: 'geo-2',
    category: 'جغرافيا',
    difficulty: 'easy',
    type: 'direct',
    question: 'ما هو أكبر محيط في العالم من حيث المساحة والحجم؟',
    answer: 'المحيط الهادئ',
    hint: 'يغطي ثلث مساحة الكرة الأرضية تقريباً'
  },
  {
    id: 'sci-1',
    category: 'علوم',
    difficulty: 'easy',
    type: 'direct',
    question: 'ما هو أقرب كوكب إلى الشمس في المجموعة الشمسية؟',
    answer: 'عطارد',
    hint: 'كوكب صخري صغير وسريع الدوران'
  },
  {
    id: 'sci-2',
    category: 'علوم',
    difficulty: 'medium',
    type: 'direct',
    question: 'ما هو الغاز الرئيسي المسبب لظاهرة الاحتباس الحراري على كوكب الأرض؟',
    answer: 'ثاني أكسيد الكربون',
    hint: 'ينتج عن الاحتراق والتنفس وصيغته CO2'
  },
  {
    id: 'isl-1',
    category: 'ثقافة إسلامية',
    difficulty: 'easy',
    type: 'direct',
    question: 'ما هي أطول سورة في القرآن الكريم؟',
    answer: 'سورة البقرة',
    hint: 'الجزء الأول والثاني وتتضمن آية الكرسي'
  },
  {
    id: 'lit-1',
    category: 'أدب وشعر عربي',
    difficulty: 'easy',
    type: 'direct',
    question: 'من هو الشاعر العربي الشهير الملقب بـ "المتنبي"؟',
    answer: 'أحمد بن الحسين الجعفي',
    hint: 'شاعر الكبرياء والحكمة في بلاط سيف الدولة'
  },
  {
    id: 'tech-1',
    category: 'تقنية',
    difficulty: 'easy',
    type: 'direct',
    question: 'ماذا يرمز اختصار شبكة الويب العالمية WWW؟',
    answer: 'World Wide Web',
    hint: 'الشبكة العنكبوتية العالمية'
  },
  {
    id: 'lang-1',
    category: 'لغة عربية',
    difficulty: 'easy',
    type: 'direct',
    question: 'كم عدد حروف الهجاء في اللغة العربية؟',
    answer: '28 حرفاً',
    hint: 'أولها الألف وآخرها الياء'
  },
  {
    id: 'econ-1',
    category: 'اقتصاد ومال',
    difficulty: 'easy',
    type: 'direct',
    question: 'ما هي عملة اليابان الرسمية المتداولة؟',
    answer: 'الين الياباني',
    hint: 'إحدى العملات الاحتياطية الكبرى في آسيا'
  },
  {
    id: 'puz-1',
    category: 'ألغاز ومنطق',
    difficulty: 'easy',
    type: 'direct',
    question: 'شيء يملك أسناناً كثيرة ولكنه لا يعض أحداً، فما هو؟',
    answer: 'المشط',
    hint: 'نستخدمه لتسريح الشعر كل يوم'
  },
  ...EXTRA_QUESTIONS,
  ...NEW_CATEGORIES_QUESTIONS,
  ...QUESTIONS_PACK_75,
  ...QUESTIONS_EXTRA_5,
  ...QUESTIONS_EXTRA_6
];

