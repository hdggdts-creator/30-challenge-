import json

with open('/tmp/pack107_final.json', 'r', encoding='utf-8') as f:
    qs = json.load(f)

replacements_5 = {
  "q6_eco_03": {
    "id": "q6_eco_03",
    "type": "mcq",
    "category": "اقتصاد ومال",
    "difficulty": "easy",
    "question": "ما هو التكتل الاقتصادي والسوق المشتركة الذي تأسس عام 1991 بموجب معاهدة أسونسيون ويضم دولاً في أمريكا الجنوبية؟",
    "options": ["تكتل ميركوسور (Mercosur)", "رابطة الآسيان", "اتفاقية نافتا", "مجموعة الكوميسا"],
    "answer": "تكتل ميركوسور (Mercosur)",
    "explanation": "ميركوسور هو تكتل اقتصادي يضم البرازيل والأرجنتين والأوروغواي والباراغواي لتحقيق التكامل التجاري."
  },
  "q6_spo_06": {
    "id": "q6_spo_06",
    "type": "fill",
    "category": "الرياضة",
    "difficulty": "medium",
    "question": "النادي الهولندي التاريخي العريق من العاصمة أمستردام والذي توج بـ 4 ألقاب في دوري أبطال أوروبا هو نادي ____.",
    "answer": "أياكس أمستردام",
    "accept": ["أياكس أمستردام", "اياكس امستردام", "أياكس", "اياكس", "Ajax"]
  },
  "q6_mat_02": {
    "id": "q6_mat_02",
    "type": "direct",
    "category": "الرياضيات",
    "difficulty": "medium",
    "question": "مستطيل طوله 9 أمتار وعرضه 6 أمتار، ما هي مساحته الإجمالية بالمتر المربع؟",
    "answer": "54",
    "hint": "مساحة المستطيل = الطول × العرض (9 × 6)",
    "accept": ["54", "٥٤", "54 م²", "54 متر مربع"]
  },
  "q6_eng_01": {
    "id": "q6_eng_01",
    "type": "direct",
    "category": "قواعد الإنجليزية",
    "difficulty": "easy",
    "question": "ما هو صيغة الجمع الشاذة الصحيحة لكلمة الإوزة بالإنجليزية: goose؟",
    "answer": "geese",
    "hint": "جمع شاذ بتحويل الحرفين oo إلى ee",
    "accept": ["geese", "Geese"]
  },
  "q6_eng_02": {
    "id": "q6_eng_02",
    "type": "direct",
    "category": "قواعد الإنجليزية",
    "difficulty": "medium",
    "question": "ما هو التصريف الثاني للماضي البسيط (Past Simple) من الفعل الشاذ: drive (يقود)؟",
    "answer": "drove",
    "hint": "يبدأ بحرف d وينتهي بـ ove",
    "accept": ["drove", "Drove"]
  }
}

final_qs = []
for q in qs:
    qid = q['id']
    if qid in replacements_5:
        final_qs.append(replacements_5[qid])
    else:
        final_qs.append(q)

with open('/tmp/pack107_final.json', 'w', encoding='utf-8') as f:
    json.dump(final_qs, f, ensure_ascii=False, indent=2)

print('Updated 5 remaining items.')
