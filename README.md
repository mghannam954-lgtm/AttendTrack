# AttendTrack (UNRWA HR Smart Training & Attendance Portal)
### بوابة تسجيل حضور التدريبات وإعداد الشهادات الذكية - قسم الموارد البشرية (الأونروا)

---

## 📌 عن المشروع (Overview)
مشروع **AttendTrack** هو منصة ويب تفاعلية صُممت خصيصاً لمكتب تدريب وتطوير الموظفين (**HR Staff Development & Training**) في وكالة الغوث الدولية (الأونروا) في دمشق والمكاتب الميدانية (درعا، حمص، حماة، معهد DTC، وغيرها).

يقضي هذا النظام تماماً على مشكلة الكتابة اليدوية الورقية غير المقروءة، وتفادي الأخطاء الإملائية في طباعة شهادات المتدربين، مع توفير تجربة تسجيل سريعة عبر رمز الاستجابة السريعة (**QR Code**) وتصدير البيانات الموثقة إلى ملف إكسل منسق بضغطة زر واحدة مجاناً 100%.

---

## 🚀 الميزات الرئيسية (Key Features)

### 1. للمدرب ومسؤول الموارد البشرية (HR / Trainer Portal):
* **إعداد الجلسة التدريبية بدقة**:
  * **اسم الدورة (Course Name)**: حل النزاعات وإدارة الغضب، التواصل الفعال، مدونة قواعد السلوك، وغيرها أو إدخال دورة مخصصة.
  * **اسم المدرب (Trainer Name)**.
  * **المكان (Location / Venue)**: رئاسة الأونروا بدمشق، معهد دمشق DTC، مكتب المزة، درعا، حمص، حماة، وغيرها.
  * **التاريخ (Session Date)**.
  * **التوقيت (Timing)**: مثل `09:00 AM - 02:00 PM`.
* **رمز QR ديناميكي تفاعلي**:
  * يحمل تفاصيل الجلسة مشفرة في الرابط، بحيث عند مسحه من الموبايل تظهر تفاصيل الدورة والمكان محددة تلقائياً.
  * **وضعية شاشة العرض (Projector Mode)**: شاشة كاملة عالية التباين للعرض على أجهزة البروجيكتور بالقاعة.
  * **وضعية طباعة بوستر الطاولة (Print A4 Poster)**: صفحة A4 مجهزة بالتعليمات والرمز لوضعها على طاولات الاستقبال.
* **سجل الحضور المباشر (Live Attendance Feed)**:
  * عداد فوري للحاضرين.
  * نسبة وتوزيع الجنس (Male / Female) للمساعدة في تقارير الأمم المتحدة.
  * بحث وفلترة فورية بالاسم ورقم الموظف والقسم.
* **تصدير إكسل بنقرة واحدة (One-Click Excel Export)**:
  * تصدير فوري لملف `.xlsx` حقيقي منسق بالكامل بأسماء الحضور وأرقامهم الوظيفية وجاهز لبرامج طباعة الشهادات (Mail Merge).

### 2. للموظف والمتدرب عبر الموبايل (Trainee Mobile Check-In):
* **تعبئة البيانات الرسمية المطلوبة**:
  1. **Employee Number**: رقم الموظف الرسمي.
  2. **Trainee Name (in English)**: اسم المتدرب باللغة الإنجليزية مع منع الحروف العربية وتنسيق الأحرف الكبيرة آلياً (Capitalization).
  3. **Live Certificate Preview**: معاينة بصرية حية لشكل الشهادة والاسم وهو يُكتب في الوقت الفعلي لتأكيد صحة الحروف.
  4. **Gender**: اختيار الجنس (Male / ذكر أو Female / أنثى).
  5. **Department**: اختيار القسم أو البرنامج (التعليم، الصحة، الإغاثة RSSP، الموارد البشرية HR، إلخ).
  6. **Job Title**: المسمى الوظيفي.
  7. **Grade**: الدرجة الوظيفية (Grade 5 حتى Grade 18+، PL، العقود، المتطوعين).
* **إشعار تأكيد وبطاقة حضور رقمية (Digital Attendance Receipt)** مع تأثيرات احتفالية (Confetti).

### 3. دعم كامل للغتين (Arabic & English):
* زر فوري للتبديل بين العربية والإنجليزية مع ضبط اتجاه الواجهة (RTL / LTR) لكافة العناصر.

---

## 💻 طريقة تشغيل المشروع محلياً (How to Run Locally)

المشروع مصمم ليعمل مباشرة وبأعلى سرعة وبدون الحاجة لتثبيت أي خوادم أو برامج معقدة:

1. افتح المجلد:
   ```
   D:\مشاريعي\AttendTrack
   ```
2. انقر نقراً مزدوجاً (Double Click) على الملف:
   ```
   index.html
   ```
   سيفتح فوراً في متصفحك (Chrome، Edge، أو Firefox) ويعمل بكامل وظائفه محلياً.

---

## 🌐 طريقة رفع المشروع مجاناً مدى الحياة على GitHub Pages

لتتمكن من فتح الرابط على هاتفك المحمول وتجربة مسح الـ QR بكاميرا الهاتف في أي قاعة تدريبية:

1. افتح حسابك على [GitHub](https://github.com) وأنشئ مستودعاً جديداً (New Repository) باسم `AttendTrack` واجعله **Public**.
2. من داخل المجلد `D:\مشاريعي\AttendTrack` في سطر الأوامر (Terminal / PowerShell):
   ```bash
   git init
   git add .
   git commit -m "Initial commit of AttendTrack UNRWA"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/AttendTrack.git
   git push -u origin main
   ```
3. في إعدادات المستودع على GitHub:
   - اذهب إلى **Settings** > **Pages**.
   - تحت قسم **Build and deployment**، اختر الفرع **main** واضغط **Save**.
4. خلال دقيقة واحدة، سيمنحك GitHub رابطاً عالمياً مجانياً:
   ```
   https://YOUR_USERNAME.github.io/AttendTrack/
   ```
5. افتح هذا الرابط من لابتوب القاعة، واعرض كود الـ QR، وسيقوم أي متدرب بمسحه من كاميرا هاتفه للتسجيل فوراً!

---

## 🛠 التقنيات المستخدمة (Tech Stack)
* **HTML5 Semantic Markup**
* **CSS3 Custom Design System** (UNRWA Blue Theme `#0072bc`, Glassmorphism, Responsive Grid)
* **Modern ES6+ JavaScript** (No external frameworks needed, zero overhead)
* **QRCode.js** (High resolution dynamic QR rendering)
* **SheetJS (xlsx.full.min.js)** (Native Excel export)
* **Canvas-Confetti** (Micro-animations on success)
* **BroadcastChannel & LocalStorage** (Real-time synchronization between tabs)

---
*تم تطويره بواسطة متطوع قسم الموارد البشرية - تطوير وتأهيل الموظفين (UNRWA Damascus).*
