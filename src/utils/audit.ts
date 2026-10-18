import { QUESTIONS_BANK, CATEGORIES, Question } from '../data/questions';

/**
 * دالة تطبيع النصوص العربية والإنجليزية لاحتساب بصمة المحتوى الاحتياطية ومنع التكرار:
 * - حذف التشكيل
 * - توحيد الألف (إ، أ، آ، ٱ -> ا)
 * - توحيد الياء والألف المقصورة (ى -> ي)
 * - توحيد التاء المربوطة والهاء (ة -> ه)
 * - حذف علامات الترقيم والرموز والمسافات الزائدة
 * - تحويل الإنجليزية لأحرف صغيرة (lowercase)
 */
export function normalizeArabicText(text: string): string {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/[\u064B-\u0652\u0670\u0640]/g, '') // حذف التشكيل والتطويل
    .replace(/[إأآٱ]/g, 'ا') // توحيد الألف
    .replace(/ى/g, 'ي')     // توحيد الياء
    .replace(/ة/g, 'ه')     // توحيد التاء المربوطة
    .toLowerCase()         // أحرف إنجليزية صغيرة
    .replace(/[.,\/#!$%\^&\*;:{}=\-_~()؟?،!\"\'\[\]]/g, ' ') // حذف علامات الترقيم
    .replace(/\s+/g, ' ')  // توحيد المسافات المتعددة
    .trim();
}

/**
 * استخراج النص الأساسي للسؤال لحساب البصمة
 */
export function getQuestionText(q: Question): string {
  if (q.type === 'fill') return q.text || '';
  if (q.type === 'match') return q.title || '';
  if (q.type === 'hints') return (q.hints || []).join(' ');
  return q.question || '';
}

/**
 * احتساب البصمة النصية المطبّعة للسؤال
 */
export function getQuestionFingerprint(q: Question): string {
  return normalizeArabicText(getQuestionText(q));
}

/**
 * استخراج الإجابة المطبّعة لمنع تكرار الإجابات داخل اللعبة الواحدة
 */
export function getQuestionNormalizedAnswer(q: Question): string {
  if (q.type === 'mcq') {
    const choice = q.choices ? q.choices[q.correctIndex] : '';
    return normalizeArabicText(choice);
  }
  if (q.type === 'tf') {
    return q.answer ? 'صحيح' : 'خطأ';
  }
  if (q.type === 'match') {
    return (q.pairs || [])
      .map(p => `${normalizeArabicText(p.right)}=${normalizeArabicText(p.left)}`)
      .sort()
      .join(';');
  }
  return normalizeArabicText(q.answer || '');
}

export interface AuditReport {
  totalCount: number;
  distributionByCategory: Record<string, number>;
  distributionByType: Record<string, number>;
  distributionByDifficulty: Record<string, number>;
  duplicateIds: Array<{ id: string; category: string; text: string }>;
  duplicateTexts: Array<{ text: string; id1: string; id2: string; category1: string; category2: string }>;
  duplicateAnswersSameCategory: Array<{ category: string; answer: string; id1: string; id2: string }>;
  structuralIssues: Array<{ id: string; reason: string }>;
}

/**
 * دالة تشخيص بنك الأسئلة auditQuestionBank
 * قراءة فقط (Read-only) لا تعدّل في بيانات اللعبة
 */
export function auditQuestionBank(): AuditReport {
  const bank = QUESTIONS_BANK;
  const validCategoryIds = new Set<string>((CATEGORIES as readonly { id: string }[]).map(c => c.id));

  const byCategory: Record<string, number> = {};
  const byType: Record<string, number> = {};
  const byDifficulty: Record<string, number> = {};

  const idMap = new Map<string, Question>();
  const duplicateIds: AuditReport['duplicateIds'] = [];

  const textMap = new Map<string, Question>();
  const duplicateTexts: AuditReport['duplicateTexts'] = [];

  const catAnswerMap = new Map<string, Question>();
  const duplicateAnswersSameCategory: AuditReport['duplicateAnswersSameCategory'] = [];

  const structuralIssues: AuditReport['structuralIssues'] = [];

  for (const q of bank) {
    // إحصائيات التوزيع
    byCategory[q.category] = (byCategory[q.category] || 0) + 1;
    byType[q.type] = (byType[q.type] || 0) + 1;
    byDifficulty[q.difficulty] = (byDifficulty[q.difficulty] || 0) + 1;

    // فحص المعرفات المكررة
    if (idMap.has(q.id)) {
      duplicateIds.push({
        id: q.id,
        category: q.category,
        text: getQuestionText(q).slice(0, 50)
      });
    } else {
      idMap.set(q.id, q);
    }

    // فحص البصمة النصية المطبّعة
    const normText = getQuestionFingerprint(q);
    if (normText) {
      if (textMap.has(normText)) {
        const prev = textMap.get(normText)!;
        duplicateTexts.push({
          text: normText.slice(0, 60),
          id1: prev.id,
          id2: q.id,
          category1: prev.category,
          category2: q.category
        });
      } else {
        textMap.set(normText, q);
      }
    }

    // فحص تكرار الإجابات داخل التصنيف الواحد (استثناء صح/خطأ والمطابقة)
    if (q.type !== 'tf' && q.type !== 'match') {
      const normAns = getQuestionNormalizedAnswer(q);
      if (normAns) {
        const key = `${q.category}:::${normAns}`;
        if (catAnswerMap.has(key)) {
          const prev = catAnswerMap.get(key)!;
          duplicateAnswersSameCategory.push({
            category: q.category,
            answer: normAns,
            id1: prev.id,
            id2: q.id
          });
        } else {
          catAnswerMap.set(key, q);
        }
      }
    }

    // فحص سلامة البنية
    const raw = q as any;
    if (!raw.id || !raw.type || !raw.category || !raw.difficulty) {
      structuralIssues.push({ id: raw.id || 'unknown', reason: 'نقص في الحقول الأساسية' });
    }
    if (!validCategoryIds.has(raw.category)) {
      structuralIssues.push({ id: raw.id, reason: `تصنيف غير معتمد: ${raw.category}` });
    }
    if (raw.type === 'mcq') {
      if (!Array.isArray(raw.choices) || raw.choices.length !== 4) {
        structuralIssues.push({ id: raw.id, reason: 'خيارات الاختيار من متعدد ليست 4' });
      }
      if (typeof raw.correctIndex !== 'number' || raw.correctIndex < 0 || raw.correctIndex > 3) {
        structuralIssues.push({ id: raw.id, reason: 'مؤشر الإجابة الصحيحة خارج النطاق 0-3' });
      }
      if (!raw.explanation) {
        structuralIssues.push({ id: raw.id, reason: 'غياب الشرح (explanation) في سؤال خيارات' });
      }
    } else if (raw.type === 'tf') {
      if (typeof raw.answer !== 'boolean') {
        structuralIssues.push({ id: raw.id, reason: 'قيمة الإجابة في صح وخطأ ليست boolean' });
      }
      if (!raw.explanation) {
        structuralIssues.push({ id: raw.id, reason: 'غياب الشرح (explanation) في صح وخطأ' });
      }
    } else if (raw.type === 'fill') {
      if (!raw.text || !raw.answer) {
        structuralIssues.push({ id: raw.id, reason: 'نقص نص السؤال أو الإجابة في أكمل الفراغ' });
      }
    } else if (raw.type === 'match') {
      if (!raw.title || !Array.isArray(raw.pairs) || raw.pairs.length !== 4) {
        structuralIssues.push({ id: raw.id, reason: 'أزواج المطابقة ليست 4 أزواج مكتملة' });
      }
    } else if (raw.type === 'hints') {
      if (!Array.isArray(raw.hints) || raw.hints.length !== 5 || !raw.answer) {
        structuralIssues.push({ id: raw.id, reason: 'تلميحات السؤال ليست 5 أو الإجابة مفقودة' });
      }
    } else if (raw.type === 'direct') {
      if (!raw.question || !raw.answer) {
        structuralIssues.push({ id: raw.id, reason: 'نقص في نص السؤال المباشر أو إجابته' });
      }
    }
  }

  // طباعة النتائج في وحدة التحكم (Console) بشكل منسّق وجداول واضحة
  console.group('%c🔍 [تحدي الثلاثين] تقرير فحص وتشخيص بنك الأسئلة (auditQuestionBank)', 'color: #D4AF37; font-size: 14px; font-weight: bold;');
  console.log(`%cإجمالي الأسئلة المسجلة في البنك: ${bank.length}`, 'font-size: 13px; font-weight: bold; color: #38BDF8;');

  console.log('%cالتوزيع حسب التصنيف:', 'font-weight: bold;');
  console.table(Object.entries(byCategory).map(([cat, count]) => ({ 'التصنيف': cat, 'العدد': count })));

  console.log('%cالتوزيع حسب النمط:', 'font-weight: bold;');
  console.table(Object.entries(byType).map(([type, count]) => ({ 'النمط': type, 'العدد': count })));

  console.log('%cالتوزيع حسب مستوى الصعوبة:', 'font-weight: bold;');
  console.table(Object.entries(byDifficulty).map(([diff, count]) => ({ 'الصعوبة': diff, 'العدد': count })));

  if (duplicateIds.length > 0) {
    console.warn(`⚠️ تم العثور على ${duplicateIds.length} معرفات مكررة:`);
    console.table(duplicateIds);
  } else {
    console.log('%c✅ المعرفات (IDs): جميعها فريدة تماماً (0 تكرار)', 'color: #10B981; font-weight: bold;');
  }

  if (duplicateTexts.length > 0) {
    console.warn(`⚠️ تم العثور على ${duplicateTexts.length} نصوص مطبعة مكررة (تم تفعيل حماية البصمة لتجاوزها تلقائياً):`);
    console.table(duplicateTexts);
  } else {
    console.log('%c✅ البصمات النصية: لا يوجد أي تكرار لنصوص الأسئلة', 'color: #10B981; font-weight: bold;');
  }

  if (duplicateAnswersSameCategory.length > 0) {
    console.warn(`⚠️ تم العثور على ${duplicateAnswersSameCategory.length} إجابات مكررة ضمن التصنيف نفسه:`);
    console.table(duplicateAnswersSameCategory);
  } else {
    console.log('%c✅ إجابات التصنيف: لا توجد إجابات مكررة ضمن التصنيف الواحد', 'color: #10B981; font-weight: bold;');
  }

  if (structuralIssues.length > 0) {
    console.warn(`⚠️ تم العثور على ${structuralIssues.length} أسئلة ببنية ناقصة أو غير معتمدة:`);
    console.table(structuralIssues);
  } else {
    console.log('%c✅ السلامة الهيكلية: جميع الأسئلة مكتملة البنية ومطابقة لقائمة CATEGORIES الرسمية', 'color: #10B981; font-weight: bold;');
  }

  console.groupEnd();

  return {
    totalCount: bank.length,
    distributionByCategory: byCategory,
    distributionByType: byType,
    distributionByDifficulty: byDifficulty,
    duplicateIds,
    duplicateTexts,
    duplicateAnswersSameCategory,
    structuralIssues
  };
}

// إتاحة الدالة على كائن window العالمي
if (typeof window !== 'undefined') {
  (window as unknown as { auditQuestionBank?: typeof auditQuestionBank }).auditQuestionBank = auditQuestionBank;
}
