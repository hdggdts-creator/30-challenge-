/**
 * توحيد بنك أسئلة تحدي الثلاثين لجميع الأنماط الستة:
 * direct (سؤال مباشر)
 * mcq (اختيار من متعدد)
 * tf (صح أو خطأ)
 * fill (أكمل الناقص)
 * match (المطابقة)
 * hints (خمّن من التلميحات)
 */

window.QUESTION_BANK = [
  ...(window.QUESTION_BANK_PART1 || []),
  ...(window.QUESTION_BANK_PART2 || []),
  ...(window.QUESTION_BANK_EXTRA || []),
  ...(window.QUESTION_BANK_NEW || []),
  ...(window.QUESTION_BANK_PACK3 || []),
  ...(window.QUESTION_BANK_EXTRA_5 || []),
  ...(window.QUESTION_BANK_EXTRA_6 || [])
];

// التأكد من توفر الأسئلة في البيئة العامة
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { QUESTION_BANK: window.QUESTION_BANK };
}
