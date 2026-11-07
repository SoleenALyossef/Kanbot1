# Kanbot client: سجل العمل والتسليم (HANDOFF)

> هذا الملف يُحدَّث مع كل تسليم. إذا انقطعت المحادثة، ابدأ من هنا: فيه ما تم، وكيف تشغّله، وما بقي.
> آخر تحديث: الجولة 6 — تدقيق متطلبات v1، تحسين Calendar والخطوط ونافذة Complete Sprint، وتحديث React 19. راجع `REQUIREMENTS-AUDIT.ar.md` قبل متابعة العمل.

## 1. ما هو المشروع
Kanbot: تطبيق إدارة مهام Agile (Backlog → Sprint → Board) مع مساعد AI.
المطلوب: **الـ Frontend فقط** (React + Vite). الـ backend جاهز في ريبو المشروع:
`https://github.com/mohammed-abdo-vec/kanbot` (مجلد `server`).

## 2. التشغيل
```bash
# terminal 1: الـ backend (من ريبو GitHub)
cd kanbot/server && npm install && cp .env.example .env && npm run seed && npm run dev   # http://localhost:4000

# terminal 2: الـ frontend
cd kanbot/client && npm install && npm run dev                                           # http://localhost:5173
```
- الحساب التجريبي: `demo@kanbot.dev` / `password123`.
- **المنفذ لازم يكون 5173** (الـ server يسمح به فقط في CORS). `vite.config.ts` فيه `strictPort: true`.
- الأمر الذي يجب تنفيذه مرة بعد كل تحديث: `npm install && npm run typecheck && npm run lint && npm test`
  (لم أستطع تشغيله في بيئتي لأنها بلا إنترنت؛ فحصت الـ syntax والاستيرادات ومفاتيح الترجمة بسكربت، واختبرت المنطق النقي).

### مفتاح الذكاء الاصطناعي (Google Gemini) في `server/.env`
```
AI_API_KEY=مفتاحك
AI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
AI_MODEL=gemini-2.5-flash
```
ثم أعد تشغيل الـ server وافتح `http://localhost:4000/api/ai/status` (يجب أن يظهر `"mode": "ai"`). لا تشارك المفتاح ولا ترفعه على GitHub.

## 3. التقنيات
React 19 · Vite · **TypeScript strict** · TanStack Query v5 · react-router v6 · dnd-kit · react-markdown · date-fns · lucide-react · CSS عادي بـ tokens (خصائص منطقية، RTL مدعوم) · Vitest.

## 4. هيكل المجلدات
```
src/types/api.ts     نسخة حرفية من server/src/types/api.ts (لا تعدّله)
src/api/             client.ts (ApiError, 401) + auth/projects/todos/sprints/ai
src/hooks/           useProjects/useTodos/useSprints/useAi + أدوات (typing, countUp, spotlight, reminders…)
src/context/         Auth, Theme(+accent), Toast(+Undo), Assistant, TodoDetails, Project
src/i18n/            en.ts + ar.ts (المفاتيح نفسها، النوع يفرض ذلك) + أدوات الجمع العربي
src/components/      ui/ (نظام التصميم) + dnd.tsx
src/features/        auth, layout, projects, overview, backlog, board, sprints, todos, ai, palette,
                     today, focus, calendar, activity
src/router.tsx       جدول المسارات
```

## 5. ما أُنجز (تراكمي)
### المتطلبات الأساسية (حسب docs/IMPLEMENTATION-PLAN)
AUTH-1…6 · PRJ-1…5 · BL-1…7 · SPR-1…7 · AI-1…5 + حالات التحميل/الفراغ/الخطأ، تأكيد الحذف، toasts، focus trap، سحب بالكيبورد، 404.

### إضافات سابقة
- **العربية + RTL** كاملة (جمع عربي، تواريخ، خطوط، قلب الأيقونات).
- **لوحة الأوامر** Ctrl+K، **اختصارات** (`?` `c` `/` و `g` ثم `p/l/b/s`).
- Burndown وVelocity، إجراءات جماعية، تصدير CSV/Markdown، مساعدات AI (ستاند-أب، تحسين/تقدير مهمة).
- **صفحة Overview** (دونات، أولويات، مستحقات، قائمة "ابدأ من هنا")، **صحة السبرنت** (على المسار/معرّض/متأخر)، **Undo** بعد النقل، **5 ألوان تمييز**.
- أنيميشن: كتابة حرف بحرف (صفحة الدخول، التحية، placeholders)، وهج المؤشر، حدود AI متدرجة، count-up، إلخ. كلها تتوقف مع `prefers-reduced-motion`.

### الجولة 5 (هذه الجولة)
**إصلاحات من لقطات الشاشة**
1. الشريط الجانبي: كان فيه scrollbar داخلي وعنصر "اللوحة" يتداخل مع منتقي الألوان → الشريط كله صار قابلاً للتمرير كوحدة، وتجميع الروابط، وصف واحد للغة والألوان.
2. لوحة AI: شارة "ذكاء تجريبي" كانت تتداخل مع أزرار الرأس → نُقلت تحت العنوان.
3. اللوحة (Board) على الشاشات الضيقة: scrollbar أفقي مشوّه → أعمدة بعرض ثابت مع scroll-snap وscrollbar رفيع، ومنع تمدد الصفحة.
4. Burndown: كان آخر تاريخ يُقصّ في RTL، والرسم ضخم → يقيس العرض فعلياً، هوامش أكبر، ارتفاع ثابت.
5. صفحة الدخول/التسجيل: **إعادة تصميم** (بطاقة زجاجية، أيقونات داخل الحقول، إظهار/إخفاء كلمة المرور، مقياس قوة كلمة المرور، لوحة هوية بصرية أغنى).

**ميزات جديدة**
- **Today**: المتأخرة، المستحقة اليوم، خلال 3 أيام، وقيد التنفيذ (`/projects/:id/today`).
- **Focus Mode**: مهمة واحدة + مؤقت Pomodoro مع استراحات وعدّاد جلسات اليوم (`/focus`).
- **Sprint Health / Capacity**: نقاط منجزة/متبقية، المرحَّل من السبرنت السابق، السعة (تُحسب من متوسط السرعة أو تُحدَّد يدوياً) مع تنبيه عند التجاوز.
- **تقرير Sprint قابل للطباعة/PDF** + تصدير CSV (`/sprints/:id/report`).
- **عرض تقويمي** حسب تاريخ الاستحقاق (`/calendar`).
- **قوالب مهام** محلية (4 جاهزة + قوالب خاصة، وحفظ أي مهمة كقالب).
- **تذكيرات المتصفح** اختيارية (بعد موافقة المستخدم على الإشعارات).
- **سجل النشاط** المبسّط محلياً (`/activity`)، آخر 200 حدث، يُسجَّل تلقائياً من كل عملية ناجحة.

### ملفات/مسارات أُضيفت في الجولة 5
| الميزة | المسار | الملف |
|---|---|---|
| اليوم | `/projects/:id/today` | `features/today/TodayPage.tsx` |
| التركيز | `/projects/:id/focus?todo=ID` | `features/focus/FocusPage.tsx` |
| التقويم | `/projects/:id/calendar` | `features/calendar/CalendarPage.tsx` |
| النشاط | `/projects/:id/activity` | `features/activity/ActivityPage.tsx` + `lib/activity.ts` + `main.tsx` (MutationCache) |
| تقرير السبرنت | `/projects/:id/sprints/:sid/report` | `features/sprints/SprintReportPage.tsx` (CSS `@media print`) |
| لوحة السعة | تظهر في صفحة اللوحة | `features/board/CapacityPanel.tsx` |
| القوالب | زر "من قالب" في الـ Backlog، و`?template=1` | `features/todos/TemplatesDialog.tsx`, `hooks/useTemplates.ts`, `lib/templates.ts` |
| التذكيرات | زر في صفحة اليوم | `hooks/useReminders.ts` (يعمل من `AppShell`) |
| الدخول/التسجيل | `/login` `/register` | `features/auth/*` (+ `PasswordField.tsx`)، CSS في `styles/views.css` |

آلية سجل النشاط: كل `useMutation` يحمل `meta: { activity: '...', projectId }`، و`MutationCache.onSuccess` في `main.tsx` يستدعي `recordActivity`. لإضافة حدث جديد: أضف `meta` للـ mutation، وأضف النوع في `lib/activity.ts` ومفتاح `act.<kind>` في `en.ts` و`ar.ts`.

## 6. ملاحظات مهمة
- بيانات القوالب/التذكيرات/السعة/سجل النشاط/جلسات التركيز **تُحفظ في المتصفح** (localStorage)، لأن الـ API لا يوفرها.
- الرسائل القادمة من الـ server تظهر بالإنجليزية ما عدا الشائعة منها.
- ملخص السبرنت من الـ AI لا يمكن توجيهه للعربية (يُنتَج في الـ server).
- التذكيرات تعمل فقط والتبويب مفتوح (لا service worker).

## 7. خطوات قادمة مقترحة
- تشغيل `typecheck` و`lint` و`test` وإصلاح أي ملاحظة.
- تسجيل فيديو الـ demo وكتابة README النهائي حسب التسليم.
- مقارنة الشاشات بالـ Wireframes في `design/`.
- مشاكل معروفة محتملة: لم تُجرَّب الواجهة في متصفح من طرفي، فإذا ظهر خطأ في الـ Console أرسل أول سطر منه مع اسم المكوّن.

## 8. سجل الأخطاء التي صُحّحت (للتذكير)
- CORS: الـ client لازم يعمل على `localhost:5173` (`strictPort`)، وإلا يرفضه الـ server.
- `ERR_CONNECTION_REFUSED`: الـ backend غير شغّال على 4000.
- `destroy is not a function`: كان `useEffect` يُرجع قيمة من `scrollIntoView`؛ القاعدة: لا تمرّر دالة تُرجع قيمة مباشرة إلى `useEffect`.


## 9. الجولة 6 — مطابقة المتطلبات وتجربة التقويم (6 نوفمبر 2026)

- قرأنا ملف المتطلبات الإنجليزي وImplementation Plan؛ English هي اللغة الافتراضية دائماً، والعربية تبقى خياراً إضافياً يفعّله المستخدم يدوياً.
- حدّثنا React وReact DOM وReact types إلى v19 تماشياً مع خطة التنفيذ.
- أعدنا تصميم Calendar: ملخص شهري، فلاتر All/Open/Done، دليل ألوان الأولوية، تحديد اليوم، ولوحة Agenda تعرض كل مهام اليوم المختار، مع تحسينات responsive.
- فصلنا منطق التقويم في `features/calendar/calendarModel.ts` وأضفنا اختبارات وحدة للتصفية والتجميع والإحصاءات.
- حسّنا الخطوط: Inter للإنجليزية وIBM Plex Sans Arabic للعربية، ورفعنا حجم النصوص الأساسية والتسميات، وخصوصاً عناصر Calendar الصغيرة على الهاتف.
- حسّنا `CompleteSprintDialog`: عدد المهام، نقاط القصة المنجزة/الإجمالية، Radio Cards لنقل غير المكتمل إلى Backlog أو أي Sprint مخطط، checkbox ملخص AI، وتعامل مع تحميل قائمة الدورات. أصلحنا أيضاً رسالة «كل المهام مكتملة» لتظهر فقط عندما تكون جميع المهام منتهية فعلاً.
- فحص المصدر: 122 ملف TS/TSX دون أخطاء صياغة أو transpilation، ولا استيرادات نسبية مكسورة؛ 638 مفتاح ترجمة متطابق لكل لغة؛ CSS في 9 ملفات متوازن. هذا لا يثبت نجاح typecheck/lint/test/build.
- جعلنا `.env` و`.env.*` مستثناة من Git مع إبقاء `.env.example`. أزلنا ملف `.env` المحلي من الحزمة.
- أضفنا `REQUIREMENTS-AUDIT.ar.md` وحدثنا README بتفسير قرارات التصميم، وتغطية المجموعات، والإضافات وحدود التخزين المحلي.
- تعذر إكمال `npm install` بسبب timeout؛ لذلك ما زالت نتائج typecheck/lint/test/build بحاجة إلى التنفيذ محلياً. لا تدّعِ نجاحها قبل ذلك.
