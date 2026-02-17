# خطة التطوير

## الأقسام الجديدة

| #   | القسم                                      | الحالة |
| --- | ------------------------------------------ | ------ |
| 1   | تحديث صفحة الطلاب (حقول إضافية + رفع صورة) | ✅     |
| 2   | مستويات الطالب (Students Level)            | ✅     |
| 3   | دروس الطالب (Students Lesson)              | ✅     |
| 4   | رصيد الطالب (Students Balance)             | ✅     |
| 5   | الشهادات (Certificates)                    | ✅     |
| 6   | تحديث api.ts                               | ✅     |
| 7   | تحديث Sidebar والمسارات                    | ✅     |

## ملخص التحديثات

### Students.tsx (محدث)

- إضافة حقول: birthdate, gender, address, mobile, avatarUrl
- رفع مباشر للصورة مع Drag & Drop
- أزرار للوصول السريع للمستويات والدروس والرصيد

### StudentLevels.tsx (جديد)

- عرض مستويات الطالب
- إضافة مستوى مع قائمة بحث
- حذف مستوى

### StudentLessons.tsx (جديد)

- عرض دروس الطالب
- إضافة درس مع قائمة بحث
- حذف درس

### StudentBalance.tsx (جديد)

- عرض الرصيد الحالي
- إضافة رصيد
- سجل المعاملات

### Certificates.tsx (جديد)

- عرض كل الشهادات
- إنشاء شهادة جديدة
- بحث في الشهادات

### api.ts (محدث)

- studentLevels, studentLessons, studentTransactions, studentAddBalance
- certificates, certificatesGenerate
