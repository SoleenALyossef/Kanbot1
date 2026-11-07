# إصلاح أخطاء TypeScript — Kanbot

## ملخص

تم تعديل أربعة مواضع لمعالجة الأخطاء التي ظهرت عند تشغيل:

```bash
npm run typecheck
```

هذه التعديلات متوافقة مع React 19 و`@types/react` 19، ولا تغيّر سلوك التطبيق أو عقد الـBackend.

## الإصلاحات

### 1. `src/components/ui/Field.tsx`

**المشكلة:** كان التعبير `adornment && 'has-adornment'` يعيد أحياناً قيمة `ReactNode` نفسها (ومن ضمنها `0`) بدلاً من `false` أو اسم صنف CSS، بينما دالة `cn` لا تقبل هذا النوع.

**التعديل:**

```tsx
Boolean(adornment) && 'has-adornment'
```

بهذا تصبح النتيجة `true` أو `false` قبل تمريرها إلى `cn`، ويظل ظهور صنف CSS مرتبطاً بوجود عنصر إضافي.

### 2. `src/components/ui/Menu.tsx`

**المشكلة:** نوع الخاصية `ref` كان `RefObject<HTMLButtonElement>`، بينما `useRef<HTMLButtonElement>(null)` في أنواع React 19 يعطي مرجعاً يمكن أن تكون قيمته الحالية `null`.

**التعديل:**

```tsx
ref: RefObject<HTMLButtonElement | null>;
```

### 3. `src/hooks/useElementWidth.ts`

**المشكلة:** نوع القيمة المرجعة من الخطاف لم يوضح أن `ref.current` قد يكون `null` قبل تركيب العنصر في DOM.

**التعديل:**

```tsx
): [RefObject<T | null>, number] {
```

هذا يطابق المرجع المنشأ بواسطة `useRef<T>(null)` ويعكس دورة حياة عنصر DOM بشكل صحيح.

### 4. `src/i18n/index.tsx`

**المشكلة:** TypeScript وسّع نوع `dir` إلى `string`، بينما `I18nValue` يتطلب اتحاداً حرفياً محدداً.

**التعديل:**

```tsx
const dir: 'ltr' | 'rtl' = lang === 'ar' ? 'rtl' : 'ltr';
```

## الملفات المعدّلة

- `src/components/ui/Field.tsx`
- `src/components/ui/Menu.tsx`
- `src/hooks/useElementWidth.ts`
- `src/i18n/index.tsx`

## ما لم يتغير

- لم يتم تعديل الـBackend أو API.
- لم يتم تغيير سلوك الحقول أو القائمة أو قياس عرض العناصر أو اللغة.
- لم تتم إزالة أي ميزة من ميزات Kanbot.

## الخطوة التالية على جهازك

من مجلد `client` شغّل:

```powershell
npm run typecheck
```

إذا انتهى دون أخطاء TypeScript، تابعي الاختبارات:

```powershell
npm run lint
npm test
npm run build
```

**ملاحظة تحقق:** تم تطبيق التعديلات على المصدر، لكن لم أتمكن من تنفيذ فحص TypeScript الكامل داخل بيئة إعداد الحزمة لعدم توفر تثبيت الحزم وملفات تعريف `vite` و`vitest` فيها. لذلك يجب إعادة تنفيذ الأوامر محلياً للتأكد من النتيجة.
