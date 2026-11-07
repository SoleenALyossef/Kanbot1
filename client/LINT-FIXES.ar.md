# إصلاح تحذيرات ESLint في Kanbot

## النتيجة التي أرسلها المستخدم

نفّذ المستخدم `npm run lint`، وانتهى الأمر دون أخطاء، لكنه أظهر أربعة تحذيرات من قاعدة `react-hooks/exhaustive-deps`:

- تحذيران في `src/features/calendar/CalendarPage.tsx` بسبب إنشاء مصفوفة احتياطية جديدة من التعبير `query.data?.todos ?? []`، ثم استخدامها في اعتمادات `useMemo`.
- تحذيران في `src/features/palette/CommandPalette.tsx` للسبب نفسه مع قوائم المشاريع والمهام.

## التغييرات

### 1. `src/features/calendar/CalendarPage.tsx`

تم جعل القائمة الاحتياطية مستقرة:

```tsx
const allTodos = useMemo(() => query.data?.todos ?? [], [query.data?.todos]);
```

بهذا لا تُنشأ مصفوفة جديدة في كل render عندما لا تكون بيانات الاستعلام قد وصلت بعد، وتبقى قيم `summary` و`visibleTodos` و`byDay` معتمدة على قائمة مستقرة.

### 2. `src/features/palette/CommandPalette.tsx`

تمت إزالة المصفوفات الاحتياطية من قراءات الاستعلام:

```tsx
const projects = useProjects().data?.projects;
const todos = useTodos(projectId, {}).data?.todos;
```

ويجري بناء أوامر المشاريع والمهام عند توفر البيانات فقط:

```tsx
projects?.forEach((project) => { /* add project command */ });
todos?.forEach((todo) => { /* add todo command */ });
```

تبقى `projects` و`todos` إما `undefined` أو مراجع المصفوفات القادمة من React Query، فلا تُنشأ مصفوفة جديدة في كل render، وتبقى اعتمادات `useMemo` مستقرة.

## ما لم يتغير

- لا يوجد تعطيل لقواعد ESLint أو إضافة استثناءات.
- لا يتغير سلوك البحث أو التصفية أو التنقل في لوحة الأوامر.
- لا يتغير منطق التقويم أو تجميع المهام.
- لا يتغير عقد الـAPI أو الـBackend.

## التحقق المحلي المطلوب

بعد استبدال مجلد `client` بالنسخة المحدّثة، نفّذ:

```powershell
npm run lint
npm run typecheck
npm test
npm run build
```

المتوقع أن تختفي التحذيرات الأربعة المذكورة. لم أتمكن من تشغيل ESLint داخل بيئة إعداد الحزمة لعدم توفر `node_modules` محلياً هنا؛ لذلك لا أصف النتيجة بأنها فحص lint منفّذ، بل إصلاح مصدر التحذيرات بناءً على التقرير الفعلي الذي أرسله المستخدم.
