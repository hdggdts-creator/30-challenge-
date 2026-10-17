/**
 * بنك الأسئلة الجديد - 60 سؤالاً للتصنيفات الثلاثة الجديدة:
 * 1. الرياضة (20 سؤالاً)
 * 2. الرياضيات (20 سؤالاً)
 * 3. قواعد الإنجليزية (20 سؤالاً)
 * 
 * الأنماط الستة الموزعة في كل تصنيف:
 * - 4 أسئلة مباشرة (direct)
 * - 6 أسئلة اختيار من متعدد (mcq) مع 4 خيارات وشرح
 * - 4 أسئلة صح أو خطأ (tf) مع تعليل
 * - سؤالان أكمل الناقص (fill) مع خيارات الإجابة المقبولة
 * - سؤالان مطابقة وتوصيل (match) مع 4 أزواج متناسقة
 * - سؤالان خمن من التلميحات (hints) مع 5 تلميحات متتالية
 */

(function () {
  'use strict';

  var NEW_QUESTIONS = [
    // ========================================================
    // 1. الرياضة (Sports) - 20 سؤالاً
    // ========================================================
    {
      id: 'new_spo_01',
      type: 'direct',
      category: 'الرياضة',
      difficulty: 'easy',
      question: 'ما هي الدولة التي استضافت أول بطولة لكأس العالم لكرة القدم عام 1930م وتوجت بلقبها؟',
      answer: 'الأوروغواي',
      hint: 'دولة في أمريكا الجنوبية عاصمتها مونتيفيديو'
    },
    {
      id: 'new_spo_02',
      type: 'direct',
      category: 'الرياضة',
      difficulty: 'medium',
      question: 'كم يبلغ عدد لاعبي فريق كرة السلة داخل أرضية الملعب أثناء سير المباراة لكل فريق؟',
      answer: '5 لاعبين',
      hint: 'نصف عدد أصابع اليدين'
    },
    {
      id: 'new_spo_03',
      type: 'direct',
      category: 'الرياضة',
      difficulty: 'medium',
      question: 'ما اسم السباق الشهير في ألعاب القوى الذي تبلغ مسافته الرسمية 42.195 كيلومتراً؟',
      answer: 'الماراثون',
      hint: 'سُمي تيمناً بسهل وقرية تاريخية في اليونان القديمة'
    },
    {
      id: 'new_spo_04',
      type: 'direct',
      category: 'الرياضة',
      difficulty: 'hard',
      question: 'من هو العدّاء الأسطوري صاحب الرقم القياسي العالمي في سباق 100 متر بزمن (9.58 ثانية)؟',
      answer: 'يوسين بولت (Usain Bolt)',
      hint: 'عدّاء جامايكي شهير لُقب بالبرق'
    },
    {
      id: 'new_spo_05',
      type: 'mcq',
      category: 'الرياضة',
      difficulty: 'easy',
      question: 'كم عدد الحلقات المتشابكة في الشعار الرسمي للألعاب الأولمبية والتي ترمز لقارات العالم؟',
      choices: ['5 حلقات', '4 حلقات', '6 حلقات', '7 حلقات'],
      correctIndex: 0,
      explanation: 'ترمز الحلقات الخمس الملونة إلى قارات العالم الخمس المأهولة بروح التنافس الشريف.'
    },
    {
      id: 'new_spo_06',
      type: 'mcq',
      category: 'الرياضة',
      difficulty: 'easy',
      question: 'في أي رياضة قتالية يُستخدم مصطلح "الضربة القاضية" (Knockout / KO)؟',
      choices: ['الملاكمة', 'الجودو', 'المبارزة بالسيف', 'الرماية بالسهام'],
      correctIndex: 0,
      explanation: 'تُنهي الضربة القاضية في الملاكمة النزال فوراً عند عدم قدرة الملاكم على الوقوف قبل انتهاء العد.'
    },
    {
      id: 'new_spo_07',
      type: 'mcq',
      category: 'الرياضة',
      difficulty: 'medium',
      question: 'ما هي الدولة الأكثر تتويجاً ببطولة كأس العالم لكرة القدم للرجال عبر التاريخ برصيد 5 ألقاب؟',
      choices: ['البرازيل', 'ألمانيا', 'إيطاليا', 'الأرجنتين'],
      correctIndex: 0,
      explanation: 'توج منتخب البرازيل باللقب 5 مرات (1958، 1962، 1970، 1994، 2002).'
    },
    {
      id: 'new_spo_08',
      type: 'mcq',
      category: 'الرياضة',
      difficulty: 'medium',
      question: 'كم عدد التبديلات المسموح بها لكل فريق في مباريات كرة القدم الرسمية في الوقت الأصلي وفق القوانين الحديثة؟',
      choices: ['5 تبديلات', '3 تبديلات', '4 تبديلات', '6 تبديلات'],
      correctIndex: 0,
      explanation: 'أقر المجلس الدولي لكرة القدم (IFAB) نظام الـ 5 تبديلات في 3 توقفات بصفة دائمة ورسمية.'
    },
    {
      id: 'new_spo_09',
      type: 'mcq',
      category: 'الرياضة',
      difficulty: 'hard',
      question: 'أي من بطولات التنس الكبرى (غراند سلام) التالية تُقام مبارياتها حصرياً على الملاعب العشبية الخضراء؟',
      choices: ['بطولة ويمبلدون', 'رولان غاروس', 'أمريكا المفتوحة', 'أستراليا المفتوحة'],
      correctIndex: 0,
      explanation: 'بطولة ويمبلدون الإنجليزية هي أقدم بطولة في رياضة التنس وتلعب تاريخياً على العشب الطبيعي.'
    },
    {
      id: 'new_spo_10',
      type: 'mcq',
      category: 'الرياضة',
      difficulty: 'hard',
      question: 'كم يبلغ الوزن الرسمي القياسي لقرص هوكي الجليد (Puck) المصنوع من المطاط المقسّى تقريباً؟',
      choices: ['حوالي 160 إلى 170 غراماً', 'حوالي 250 غراماً', 'حوالي 90 غراماً', 'حوالي 320 غراماً'],
      correctIndex: 0,
      explanation: 'يزن قرص هوكي الجليد القياسي ما بين 5.5 إلى 6 أونصات (أي بين 156 و170 غراماً).'
    },
    {
      id: 'new_spo_11',
      type: 'tf',
      category: 'الرياضة',
      difficulty: 'easy',
      question: 'مدة الشوط الواحد في مباراة كرة القدم الرسمية للرجال هي 45 دقيقة بدون الوقت بدل الضائع.',
      answer: true,
      explanation: 'تتكون مباراة كرة القدم من شوطين متساويين، مدة كل منهما 45 دقيقة بإجمالي 90 دقيقة.'
    },
    {
      id: 'new_spo_12',
      type: 'tf',
      category: 'الرياضة',
      difficulty: 'easy',
      question: 'في رياضة التنس الأرضي، يُطلق على تسجيل الصفر في النقاط مصطلح "Love".',
      answer: true,
      explanation: 'يعود مصطلح Love في التنس إلى الكلمة الفرنسية l\'oeuf (البيضة) التي ترمز للصفر لشكله البيضاوي.'
    },
    {
      id: 'new_spo_13',
      type: 'tf',
      category: 'الرياضة',
      difficulty: 'medium',
      question: 'يُسمح لحارس المرمى في كرة اليد بالجري بالكرة في كامل أرجاء الملعب دون تنطيطها.',
      answer: false,
      explanation: 'خارج منطقة الـ 6 أمتار الخاصة به، يعامل حارس المرمى كأي لاعب ميدان ولا يجوز له أخذ أكثر من 3 خطوات دون تنطيط.'
    },
    {
      id: 'new_spo_14',
      type: 'tf',
      category: 'الرياضة',
      difficulty: 'hard',
      question: 'أُقيمت أول دورة ألعاب أولمبية صيفية في العصر الحديث عام 1896م في العاصمة الفرنسية باريس.',
      answer: false,
      explanation: 'أُقيمت أول دورة أولمبية حديثة عام 1896 في مدينة أثينا باليونان، مهد الألعاب الأولمبية القديمة.'
    },
    {
      id: 'new_spo_15',
      type: 'fill',
      category: 'الرياضة',
      difficulty: 'easy',
      kind: 'مقاييس رياضية',
      text: 'يبلغ طول حوض السباحة الأولمبي القياسي المعتمد في البطولات الكبرى ____ متراً.',
      answer: '50',
      accept: ['50', '٥٠', 'خمسين', '50 مترا', '50 متر'],
      explanation: 'الحوض الأولمبي المعتمد من الاتحاد الدولي للألعاب المائية يبلغ طوله 50 متراً وعرضه 25 متراً.'
    },
    {
      id: 'new_spo_16',
      type: 'fill',
      category: 'الرياضة',
      difficulty: 'medium',
      kind: 'ألقاب المنتخبات',
      text: 'اللقب الشعبي الشهير الذي يُطلق عالمياً على منتخب البرازيل لكرة القدم هو منتخب ____.',
      answer: 'السامبا',
      accept: ['السامبا', 'سامبا', 'السيليساو', 'سيليساو'],
      explanation: 'يشتهر منتخب البرازيل بلقب راقصي السامبا نسبة إلى الرقصة والريتم البرازيلي الوطني الشهير.'
    },
    {
      id: 'new_spo_17',
      type: 'match',
      category: 'الرياضة',
      difficulty: 'medium',
      title: 'صل كل أسطورة رياضية بالرياضة التي أبدع فيها:',
      pairs: [
        { right: 'مايكل جوردان', left: 'كرة السلة' },
        { right: 'روجر فيدرير', left: 'كرة التنس' },
        { right: 'مايكل فيلبس', left: 'السباحة' },
        { right: 'محمد علي كلاي', left: 'الملاكمة' }
      ]
    },
    {
      id: 'new_spo_18',
      type: 'match',
      category: 'الرياضة',
      difficulty: 'hard',
      title: 'صل كل نادٍ أوروبي شهير بلقبه التاريخي المعروف:',
      pairs: [
        { right: 'ريال مدريد', left: 'المرنغي (الملكي)' },
        { right: 'يوفنتوس الإيطالي', left: 'السيدة العجوز' },
        { right: 'مانشستر يونايتد', left: 'الشياطين الحمر' },
        { right: 'بايرن ميونخ', left: 'العملاق البافاري' }
      ]
    },
    {
      id: 'new_spo_19',
      type: 'hints',
      category: 'الرياضة',
      difficulty: 'medium',
      hints: [
        'رياضة قتالية ودفاعية يابانية عريقة أصبحت رياضة أولمبية شهيرة.',
        'يعني اسمها باللغة اليابانية حرفياً "الطريق اللين" أو "الأسلوب المرن".',
        'لا تعتمد على اللكمات أو الركلات، بل على الرمي وحركات الإخضاع والتثبيت.',
        'يرتدي ممارسوها بدلة بيضاء أو زرقاء متينة تُربط بحزام ملون يدل على الدرجة.',
        'أسسها المعلم الياباني الشهير جيغورو كانو في طوكيو عام 1882م.'
      ],
      answer: 'الجودو (Judo)',
      accept: ['الجودو', 'جودو', 'Judo', 'رياضة الجودو']
    },
    {
      id: 'new_spo_20',
      type: 'hints',
      category: 'الرياضة',
      difficulty: 'easy',
      hints: [
        'نجم كرة قدم أرجنتيني يُعتبر على نطاق واسع من أعظم اللاعبين عبر العصور.',
        'قضى الجزء الأكبر من مسيرته التاريخية في صفوف نادي برشلونة الإسباني.',
        'يحمل الرقم القياسي التاريخي بالفوز بجائزة الكرة الذهبية 8 مرات.',
        'قاد منتخب التانغو الأرجنتيني لحصد كأس العالم في مونديال قطر 2022م.',
        'يُلقب بـ "البرغوث" ويرتدي القميص رقم 10 الأيقوني.'
      ],
      answer: 'ليونيل ميسي (Lionel Messi)',
      accept: ['ليونيل ميسي', 'ميسي', 'Lionel Messi', 'Messi']
    },

    // ========================================================
    // 2. الرياضيات (Mathematics) - 20 سؤالاً
    // ========================================================
    {
      id: 'new_mat_01',
      type: 'direct',
      category: 'الرياضيات',
      difficulty: 'easy',
      question: 'ما هو العدد الأولي الزوجي الوحيد في مجموعة الأعداد الصحيحة؟',
      answer: '2 (العدد اثنان)',
      hint: 'هو أيضاً أصغر عدد أولي'
    },
    {
      id: 'new_mat_02',
      type: 'direct',
      category: 'الرياضيات',
      difficulty: 'medium',
      question: 'كم يبلغ مجموع قياسات الزوايا الداخلية لأي مثلث في الهندسة الإقليدية المستوية؟',
      answer: '180 درجة',
      hint: 'يعادل نصف دورة كاملة أو زاوية مستقيمة'
    },
    {
      id: 'new_mat_03',
      type: 'direct',
      category: 'الرياضيات',
      difficulty: 'medium',
      question: 'ما هو النظير الضربي (المقلوب) للكسر الاعتيادي 4/7؟',
      answer: '7/4 (سبعة أرباع أو 1.75)',
      hint: 'نعكس موقعي البسط والمقام'
    },
    {
      id: 'new_mat_04',
      type: 'direct',
      category: 'الرياضيات',
      difficulty: 'hard',
      question: 'ما اسم النظرية الهندسية الشهيرة التي تنص على أن مربع الوتر يساوي مجموع مربعي الضلعين الآخرين (a² + b² = c²)؟',
      answer: 'نظرية فيثاغورس',
      hint: 'تنسب لعالم وفيلسوف إغريقي عاش في القرن السادس قبل الميلاد'
    },
    {
      id: 'new_mat_05',
      type: 'mcq',
      category: 'الرياضيات',
      difficulty: 'easy',
      question: 'ما هو حاصل ضرب العددين: 8 × 7؟',
      choices: ['56', '54', '48', '64'],
      correctIndex: 0,
      explanation: '8 × 7 = 56، وهو من الحقائق الأساسية لجدول الضرب.'
    },
    {
      id: 'new_mat_06',
      type: 'mcq',
      category: 'الرياضيات',
      difficulty: 'easy',
      question: 'ما هي القيمة التقريبية الكسرية العشرية الأشهر للثابت الرياضي باي (π)؟',
      choices: ['3.14', '2.71', '1.61', '3.41'],
      correctIndex: 0,
      explanation: 'الثابت باي (π) يمثل النسبة بين محيط الدائرة وقطرها ويساوي تقريباً 3.14159 أو 22/7.'
    },
    {
      id: 'new_mat_07',
      type: 'mcq',
      category: 'الرياضيات',
      difficulty: 'medium',
      question: 'ما هو الناتج الصحيح للعملية الحسابية وفق ترتيب العمليات: 6 + 2 × 5؟',
      choices: ['16', '40', '22', '30'],
      correctIndex: 0,
      explanation: 'وفق أولوية العمليات (BODMAS)، نُجري الضرب أولاً: 2 × 5 = 10، ثم نجمع: 6 + 10 = 16.'
    },
    {
      id: 'new_mat_08',
      type: 'mcq',
      category: 'الرياضيات',
      difficulty: 'medium',
      question: 'كم عدد أضلاع الشكل الهندسي ذي الأضلاع الثمانية (Octagon)؟',
      choices: ['8 أضلاع', '6 أضلاع', '7 أضلاع', '10 أضلاع'],
      correctIndex: 0,
      explanation: 'المضلع الثماني يمتلك ثمانية أضلاع وثماني زوايا داخلية يبلغ مجموعها 1080 درجة.'
    },
    {
      id: 'new_mat_09',
      type: 'mcq',
      category: 'الرياضيات',
      difficulty: 'hard',
      question: 'ما هو الجذر التربيعي الموجب الدقيق للعدد 196 (أي √196)؟',
      choices: ['14', '16', '13', '15'],
      correctIndex: 0,
      explanation: 'لأن 14 × 14 = 196.'
    },
    {
      id: 'new_mat_10',
      type: 'mcq',
      category: 'الرياضيات',
      difficulty: 'hard',
      question: 'إذا أُلقيت قطعة نقود متوازنة مرتين، فما احتمال ظهور الوجه (صورة) في الرميتين معاً؟',
      choices: ['1/4 (25%)', '1/2 (50%)', '1/3 (33%)', '1/8 (12.5%)'],
      correctIndex: 0,
      explanation: 'احتمال الصورة في الرمية الأولى هو 1/2 وفي الثانية 1/2، وبما أنهما حدثان مستقلان: (1/2) × (1/2) = 1/4.'
    },
    {
      id: 'new_mat_11',
      type: 'tf',
      category: 'الرياضيات',
      difficulty: 'easy',
      question: 'حاصل ضرب أي عدد حقيقي في العدد صفر يساوي صفراً دائماً (x × 0 = 0).',
      answer: true,
      explanation: 'الصفر هو العنصر الماص لعملية الضرب في الحقل الرياضي لجميع الأعداد الحقيقية.'
    },
    {
      id: 'new_mat_12',
      type: 'tf',
      category: 'الرياضيات',
      difficulty: 'easy',
      question: 'يُصنف العدد واحد (1) في الرياضيات كأحد الأعداد الأولية.',
      answer: false,
      explanation: 'العدد الأولي هو عدد صحيح أكبر تماماً من 1 وله عاملان موجبان فقط، ولذلك فالعدد 1 ليس أولياً بحكم التعريف.'
    },
    {
      id: 'new_mat_13',
      type: 'tf',
      category: 'الرياضيات',
      difficulty: 'medium',
      question: 'قياس الزاوية القائمة في الهندسة المستوية يساوي 90 درجة بالضبط.',
      answer: true,
      explanation: 'تنشأ الزاوية القائمة من تعامد خطين مستقيمين وقياسها 90 درجة أو π/2 راديان.'
    },
    {
      id: 'new_mat_14',
      type: 'tf',
      category: 'الرياضيات',
      difficulty: 'hard',
      question: 'مجموع الزوايا الداخلية لأي شكل رباعي محدب (كالمربع والمستطيل والمعين) يساوي 180 درجة.',
      answer: false,
      explanation: 'مجموع زوايا الشكل الرباعي هو 360 درجة، لأن أي شكل رباعي ينقسم داخلياً إلى مثلثين (2 × 180 = 360).'
    },
    {
      id: 'new_mat_15',
      type: 'fill',
      category: 'الرياضيات',
      difficulty: 'easy',
      kind: 'مسألة هندسية',
      text: 'محيط المربع الذي يبلغ طول ضلعه 6 سنتيمترات يساوي ____ سنتيمتراً.',
      answer: '24',
      accept: ['24', '٢٤', '24 سم', 'أربعة وعشرون', 'اربعه وعشرون'],
      explanation: 'محيط المربع = طول الضلع × 4 = 6 × 4 = 24 سم.'
    },
    {
      id: 'new_mat_16',
      type: 'fill',
      category: 'الرياضيات',
      difficulty: 'medium',
      kind: 'معادلات جبرية',
      text: 'حل المعادلة الخطية البسيطة: 3x + 6 = 21 هو قيمة x = ____.',
      answer: '5',
      accept: ['5', '٥', 'خمسة', 'خمسه', 'x=5', 'x = 5'],
      explanation: 'نطرح 6 من الطرفين فنحصل على 3x = 15، ثم بالقسمة على 3 ينتج x = 5.'
    },
    {
      id: 'new_mat_17',
      type: 'match',
      category: 'الرياضيات',
      difficulty: 'medium',
      title: 'صل كل شكل هندسي بقانون حساب مساحته السطحية:',
      pairs: [
        { right: 'المستطيل', left: 'الطول × العرض' },
        { right: 'المربع', left: 'طول الضلع × نفسه' },
        { right: 'المثلث', left: 'نصف القاعدة × الارتفاع' },
        { right: 'الدائرة', left: 'ط نق² (π × r²)' }
      ]
    },
    {
      id: 'new_mat_18',
      type: 'match',
      category: 'الرياضيات',
      difficulty: 'hard',
      title: 'صل كل مقدار عددي بقيمة جذره التربيعي الصحيحة:',
      pairs: [
        { right: '√81', left: '9' },
        { right: '√121', left: '11' },
        { right: '√144', left: '12' },
        { right: '√225', left: '15' }
      ]
    },
    {
      id: 'new_mat_19',
      type: 'hints',
      category: 'الرياضيات',
      difficulty: 'medium',
      hints: [
        'عالم رياضيات وفلك مسلم بارز ارتبط اسمه بالعصر الذهبي للعلوم في بغداد.',
        'عمل في بيت الحكمة في عهد الخليفة العباسي عبد الله المأمون.',
        'يُلقب عالمياً بـ "أبي الجبر" وألّف "المختصر في حساب الجبر والمقابلة".',
        'اشتُقت كلمة "الخوارزميات" (Algorithms) في علوم الحاسوب من اسمه اللاتيني.',
        'أدخل مفهوم الصفر والأرقام الهندية-العربية إلى الحساب ونقلها للعالم.'
      ],
      answer: 'محمد بن موسى الخوارزمي',
      accept: ['الخوارزمي', 'محمد بن موسى الخوارزمي', 'محمد الخوارزمي', 'Al-Khwarizmi']
    },
    {
      id: 'new_mat_20',
      type: 'hints',
      category: 'الرياضيات',
      difficulty: 'easy',
      hints: [
        'مضلع هندسي مستوٍ ورباعي الأضلاع منتظم.',
        'أضلاعه الأربعة متساوية تماماً في أطوالها.',
        'زواياه الأربع الداخلية قائمة وتساوي 90 درجة بالضبط.',
        'قطراه متعامدان ومتطابقان وينصف كل منهما الآخر عند نقطة التقائهما.',
        'مساحته تساوي حاصل ضرب طول ضلعه في نفسه.'
      ],
      answer: 'المربع (Square)',
      accept: ['المربع', 'مربع', 'Square']
    },

    // ========================================================
    // 3. قواعد الإنجليزية (English Grammar) - 20 سؤالاً
    // ========================================================
    {
      id: 'new_eng_01',
      type: 'direct',
      category: 'قواعد الإنجليزية',
      difficulty: 'easy',
      question: "What is the past simple form of the irregular verb 'go'?",
      answer: 'went',
      hint: 'A four-letter word starting with the letter w'
    },
    {
      id: 'new_eng_02',
      type: 'direct',
      category: 'قواعد الإنجليزية',
      difficulty: 'medium',
      question: "What possessive pronoun replaces 'his book' in: 'This book is _____.'?",
      answer: 'his',
      hint: 'It is a 3-letter word identical to the possessive adjective'
    },
    {
      id: 'new_eng_03',
      type: 'direct',
      category: 'قواعد الإنجليزية',
      difficulty: 'medium',
      question: "What is the irregular plural form of the noun 'child'?",
      answer: 'children',
      hint: 'It ends with the suffix -ren'
    },
    {
      id: 'new_eng_04',
      type: 'direct',
      category: 'قواعد الإنجليزية',
      difficulty: 'hard',
      question: "What is the past participle (V3) form of the verb 'write'?",
      answer: 'written',
      hint: 'It features a double t: -tt-'
    },
    {
      id: 'new_eng_05',
      type: 'mcq',
      category: 'قواعد الإنجليزية',
      difficulty: 'easy',
      question: "Choose the correct subject pronoun: 'Sara and I are ready. _____ will leave now.'",
      choices: ['We', 'They', 'Us', 'Them'],
      correctIndex: 0,
      explanation: "'We' is the first-person plural subject pronoun that replaces 'Sara and I'."
    },
    {
      id: 'new_eng_06',
      type: 'mcq',
      category: 'قواعد الإنجليزية',
      difficulty: 'easy',
      question: "Choose the correct indefinite article: 'I saw _____ elephant at the safari.'",
      choices: ['an', 'a', 'the', 'no article'],
      correctIndex: 0,
      explanation: "We use 'an' before singular countable nouns starting with a vowel sound (e in elephant)."
    },
    {
      id: 'new_eng_07',
      type: 'mcq',
      category: 'قواعد الإنجليزية',
      difficulty: 'medium',
      question: "Choose the correct verb form: 'He _____ football with his friends every Saturday.'",
      choices: ['plays', 'play', 'playing', 'is play'],
      correctIndex: 0,
      explanation: "In the Present Simple tense, we add -s to the verb with third-person singular subjects (He, She, It)."
    },
    {
      id: 'new_eng_08',
      type: 'mcq',
      category: 'قواعد الإنجليزية',
      difficulty: 'medium',
      question: "Choose the correct preposition of time: 'The train arrives _____ 8:30 AM.'",
      choices: ['at', 'on', 'in', 'to'],
      correctIndex: 0,
      explanation: "We use 'at' for precise clock times (at 8:30 AM, at noon, at midnight)."
    },
    {
      id: 'new_eng_09',
      type: 'mcq',
      category: 'قواعد الإنجليزية',
      difficulty: 'hard',
      question: 'Identify the grammatically correct sentence in the Present Perfect tense:',
      choices: [
        'She has lived here for three years.',
        'She lived here for three years ago.',
        'She is living here since three years.',
        'She have live here for three years.'
      ],
      correctIndex: 0,
      explanation: "The Present Perfect uses has/have + past participle, with 'for' indicating duration up to the present."
    },
    {
      id: 'new_eng_10',
      type: 'mcq',
      category: 'قواعد الإنجليزية',
      difficulty: 'hard',
      question: "Complete the First Conditional sentence: 'If it rains tomorrow, we _____ at home.'",
      choices: ['will stay', 'would stay', 'stayed', 'had stayed'],
      correctIndex: 0,
      explanation: "First Conditional structure: If + Present Simple (rains), will + base verb (will stay)."
    },
    {
      id: 'new_eng_11',
      type: 'tf',
      category: 'قواعد الإنجليزية',
      difficulty: 'easy',
      question: "في اللغة الإنجليزية، كلمة 'beautiful' تُصنف كاسم (Noun) وليس كصفة (Adjective).",
      answer: false,
      explanation: "كلمة 'beautiful' هي صفة (Adjective) تصف الاسم، والاسم المجرد منها هو 'beauty'."
    },
    {
      id: 'new_eng_12',
      type: 'tf',
      category: 'قواعد الإنجليزية',
      difficulty: 'easy',
      question: "The sentence 'They are reading a new story.' is in the Present Continuous tense.",
      answer: true,
      explanation: "It follows the structure: subject + are + verb-ing, describing an action happening right now."
    },
    {
      id: 'new_eng_13',
      type: 'tf',
      category: 'قواعد الإنجليزية',
      difficulty: 'medium',
      question: "صيغة المقارنة الصحيحة (Comparative) من الصفة 'good' هي 'more good'.",
      answer: false,
      explanation: "الصفة 'good' شاذة وغير منتظمة، وصيغة المقارنة منها هي 'better'، وصيغة التفضيل هي 'the best'."
    },
    {
      id: 'new_eng_14',
      type: 'tf',
      category: 'قواعد الإنجليزية',
      difficulty: 'hard',
      question: "كلمة 'information' في اللغة الإنجليزية اسم غير معدود (Uncountable Noun) ولا تجمع بإضافة حرف s.",
      answer: true,
      explanation: "كلمة 'information' اسم غير معدود دائماً؛ ولا يصح قول informations، بل يقال pieces of information."
    },
    {
      id: 'new_eng_15',
      type: 'fill',
      category: 'قواعد الإنجليزية',
      difficulty: 'easy',
      kind: 'أفعال مساعدة',
      text: "Complete with the correct auxiliary verb: 'She ____ listening to music right now.'",
      answer: 'is',
      accept: ['is', 'IS'],
      explanation: "The subject 'She' is singular third-person, so it takes the auxiliary verb 'is' in Present Continuous."
    },
    {
      id: 'new_eng_16',
      type: 'fill',
      category: 'قواعد الإنجليزية',
      difficulty: 'medium',
      kind: 'أفعال شاذة',
      text: "Fill with the irregular past tense of 'buy': 'Yesterday, my brother ____ a new laptop.'",
      answer: 'bought',
      accept: ['bought', 'BOUGHT'],
      explanation: "The verb 'buy' is irregular; its past simple and past participle form is 'bought'."
    },
    {
      id: 'new_eng_17',
      type: 'match',
      category: 'قواعد الإنجليزية',
      difficulty: 'medium',
      title: 'Match each base verb with its irregular past simple form:',
      pairs: [
        { right: 'speak', left: 'spoke' },
        { right: 'take', left: 'took' },
        { right: 'eat', left: 'ate' },
        { right: 'see', left: 'saw' }
      ]
    },
    {
      id: 'new_eng_18',
      type: 'match',
      category: 'قواعد الإنجليزية',
      difficulty: 'hard',
      title: 'Match each singular noun with its irregular plural form:',
      pairs: [
        { right: 'man', left: 'men' },
        { right: 'foot', left: 'feet' },
        { right: 'mouse', left: 'mice' },
        { right: 'tooth', left: 'teeth' }
      ]
    },
    {
      id: 'new_eng_19',
      type: 'hints',
      category: 'قواعد الإنجليزية',
      difficulty: 'medium',
      hints: [
        'A fundamental English tense used for actions completed in the past.',
        'Regular verbs form this tense by adding the suffix -ed.',
        'Common time markers used with it include: yesterday, last week, in 2010, and ago.',
        'Negative sentences and questions in this tense use the auxiliary verb: did / didn\'t.',
        'It is formally referred to in English grammar as the Past Simple tense.'
      ],
      answer: 'الماضي البسيط (Past Simple)',
      accept: ['Past Simple', 'Simple Past', 'past simple', 'الماضي البسيط']
    },
    {
      id: 'new_eng_20',
      type: 'hints',
      category: 'قواعد الإنجليزية',
      difficulty: 'easy',
      hints: [
        'The most essential linking and auxiliary verb in English grammar.',
        'In the present simple tense, it conjugates into three forms: am, is, are.',
        'In the past simple tense, it conjugates into two forms: was, were.',
        'Its past participle (V3) form is: been.',
        'It translates into Arabic as فعل الكينونة (Verb to be).'
      ],
      answer: 'فعل الكينونة (Verb to be)',
      accept: ['Verb to be', 'be', 'to be', 'فعل الكينونة', 'فعل to be']
    }
  ];

  window.QUESTION_BANK_NEW = NEW_QUESTIONS;

  if (typeof window.QUESTION_BANK !== 'undefined' && Array.isArray(window.QUESTION_BANK)) {
    for (var i = 0; i < NEW_QUESTIONS.length; i++) {
      window.QUESTION_BANK.push(NEW_QUESTIONS[i]);
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      NEW_CATEGORIES_QUESTIONS: NEW_QUESTIONS
    };
  }
})();
