/**
 * AttendTrack - HR & Trainer Portal Logic
 * UNRWA HR Staff Development & Training Division
 * Real-time Firebase Sync + Isolated Course Folders + Strict Language Separation
 */

(function () {
  'use strict';

  // 1. Application State & Language (Declared first to avoid TDZ ReferenceError)
  let currentLang = 'ar'; // Default Arabic for HR Portal
  let currentSession = null;
  let allSessions = [];
  let adminQr = null;
  let projectorQr = null;
  let flyerQr = null;
  let isInitialFirebaseLoad = true;
  let currentQrMode = 'attendance'; // 'attendance' | 'evaluation'

  // Official UNRWA Level 1 Evaluation Template (21 Questions from FinalEvaluationForm (Arb-Eng).docx)
  const DEFAULT_EVAL_QUESTIONS = [
    // Section 1: The Programme Objectives and Course content (1 - 5)
    { id: 'q1', section: 1, type: 'likert_5', textAr: 'أهداف البرنامج التدريبي كانت واضحة', textEn: 'The programme objectives were clear.', enabled: true },
    { id: 'q2', section: 1, type: 'likert_5', textAr: 'محتوى البرنامج التدريبي والأنشطة ذات صلة بأهداف البرنامج التدريبي', textEn: 'The programme content and activities were relevant to the programme objectives.', enabled: true },
    { id: 'q3', section: 1, type: 'likert_5', textAr: 'مدة البرنامج التدريبي مناسبة', textEn: 'The length of the programme was adequate.', enabled: true },
    { id: 'q4', section: 1, type: 'likert_5', textAr: 'الأمثلة والنقاشات والأنشطة المطروحة ذات صلة بعملي', textEn: 'The examples, discussions and activities were relevant to my job.', enabled: true },
    { id: 'q5', section: 1, type: 'likert_5', textAr: 'المادة التدريبية واضحة ومهنية', textEn: 'The materials were clear and professional.', enabled: true },

    // Section 2: The Trainer and Course Delivery (6 - 14)
    { id: 'q6', section: 2, type: 'likert_5', textAr: 'حدد نتائج التدريب وأهدافه التعليمية', textEn: 'The trainer stated the learning outcomes.', enabled: true },
    { id: 'q7', section: 2, type: 'likert_5', textAr: 'محضر ومنظم بشكل جيد', textEn: 'The trainer was well organized and prepared.', enabled: true },
    { id: 'q8', section: 2, type: 'likert_5', textAr: 'خلق جو تعلم إيجابي ومحفز', textEn: 'The trainer created a positive learning atmosphere.', enabled: true },
    { id: 'q9', section: 2, type: 'likert_5', textAr: 'أظهر خبرة وتمكناً بالمادة التدريبية', textEn: 'The trainer showed expertise in the subject.', enabled: true },
    { id: 'q10', section: 2, type: 'likert_5', textAr: 'قدم المادة التدريبية بطريقة منطقية وسلسة', textEn: 'The trainer presented the material in a logical way.', enabled: true },
    { id: 'q11', section: 2, type: 'likert_5', textAr: 'سأل وأجاب عن الأسئلة بشكل كامل ومتمكن', textEn: 'The trainer asked and answered questions competently.', enabled: true },
    { id: 'q12', section: 2, type: 'likert_5', textAr: 'قادر على إدارة الجلسة وتعامل مع المتدربين بمساواة واحترام', textEn: 'The trainer was able to control the session and deal with participants fairly, and with respect.', enabled: true },
    { id: 'q13', section: 2, type: 'likert_5', textAr: 'ممتعاً ومحفزاً للمشاركين', textEn: 'The trainer was interesting and motivated me.', enabled: true },
    { id: 'q14', section: 2, type: 'likert_5', textAr: 'أداء المدرب كان ممتازاً بشكل عام', textEn: 'The trainer was excellent.', enabled: true },

    // Section 3: Training Venue and Organization (15 - 17)
    { id: 'q15', section: 3, type: 'likert_5', textAr: 'هل تلقيت إشعاراً عن التدريب بوقت كافٍ؟', textEn: 'Did you receive sufficient notice about this training?', enabled: true },
    { id: 'q16', section: 3, type: 'likert_5', textAr: 'هل تلقيت الدعم الكافي لحضور التدريب؟', textEn: 'Did you receive sufficient support to attend this training?', enabled: true },
    { id: 'q17', section: 3, type: 'likert_5', textAr: 'مكان التدريب كان مريحاً ومناسباً', textEn: 'Was the training venue comfortable?', enabled: true },

    // Section 4: Overall Rating of the course (18 - 19)
    { id: 'q18', section: 4, type: 'overall_5', textAr: 'تقييم التدريب بشكل إجمالي', textEn: 'Overall Rating of the course', enabled: true },
    { id: 'q19', section: 4, type: 'text', textAr: 'يرجى تزويدنا بأي ملاحظات أو مقترحات عامة حول الدورة أو المدرب:', textEn: 'Please provide us with some overall comments about the course/trainer:', enabled: true },

    // Section 5: Impact & Relevance to Job (20 - 21)
    { id: 'q20', section: 5, type: 'relevance_5', textAr: 'هل كان هذا التدريب ذا صلة بعملك ودورك الوظيفي الحالي؟', textEn: 'Was this training relevant to your current job role?', enabled: true },
    { id: 'q21', section: 5, type: 'perform_3', textAr: 'هل سيساعدك التدريب على الأداء بشكل أفضل في منصبك الحالي؟', textEn: 'Will this training help you to perform better in your current position?', enabled: true }
  ];

  let evalQuestions = [];

  // 2. Firebase Configuration & Initialization
  const firebaseConfig = {
    apiKey: "AIzaSyAMZ9MPm-SRsJJ4yVcjugnbZluFFTrWkYU",
    authDomain: "unrwa-attend.firebaseapp.com",
    databaseURL: "https://unrwa-attend-default-rtdb.firebaseio.com",
    projectId: "unrwa-attend",
    storageBucket: "unrwa-attend.firebasestorage.app",
    messagingSenderId: "171058306827",
    appId: "1:171058306827:web:878d2cfcffc35b19524c0e",
    measurementId: "G-PWX4CL84BV"
  };

  let db = null;
  try {
    if (typeof firebase !== 'undefined') {
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      db = firebase.database();
      console.log('Firebase Realtime Database initialized in Admin Portal.');
      updateAdminCloudStatus(true);
    } else {
      console.warn('Firebase SDK not found; using local mode.');
      updateAdminCloudStatus(false);
    }
  } catch (err) {
    console.error('Firebase Admin init error:', err);
    updateAdminCloudStatus(false);
  }

  function updateAdminCloudStatus(isOnline) {
    const badge = document.getElementById('adminCloudStatus');
    const text = document.getElementById('adminCloudText');
    if (!badge || !text) return;
    if (isOnline) {
      badge.className = 'status-pill status-connected';
      text.textContent = (currentLang === 'ar') ? 'متصل سحابياً' : 'Cloud Connected';
    } else {
      badge.className = 'status-pill status-offline';
      text.textContent = (currentLang === 'ar') ? 'وضع محلي' : 'Local Mode';
    }
  }

  // 3. Catalogs for Bilingual Dynamic Dropdowns
  const courseCatalog = [
    { key: 'conflict_resolution', en: 'Conflict Resolution & Anger Management', ar: 'حل النزاعات وإدارة الغضب' },
    { key: 'effective_communication', en: 'Effective Communication & Team Building', ar: 'مهارات التواصل الفعال وبناء الفريق' },
    { key: 'code_of_conduct', en: 'UN Code of Conduct & Ethics Awareness', ar: 'مدونة قواعد السلوك وأخلاقيات العمل' },
    { key: 'supervisory_skills', en: 'Supervisory Skills & Modern Leadership', ar: 'المهارات الإشرافية والقيادة الحديثة' },
    { key: 'stress_management', en: 'Psychosocial Support & Stress Management', ar: 'الدعم النفسي والاجتماعي وإدارة ضغوط العمل' },
    { key: 'field_safety', en: 'Humanitarian Principles & Safety in Field', ar: 'المبادئ الإنسانية والسلامة الميدانية' },
    { key: 'cybersecurity', en: 'Cybersecurity & UNRWA Data Protection', ar: 'الأمن السيبراني وحماية البيانات' },
    { key: 'epas_system', en: 'e-PAS Performance Management System', ar: 'نظام إدارة الأداء وتقييم الموظفين (e-PAS)' }
  ];

  const locationCatalog = [
    { key: 'hq_damascus', en: 'Damascus - UNRWA Headquarters (HQ)', ar: 'دمشق - رئاسة الأونروا (HQ)' },
    { key: 'dtc', en: 'Damascus - Damascus Training Centre (DTC)', ar: 'دمشق - معهد دمشق المتوسط (DTC)' },
    { key: 'mezzeh', en: 'Damascus Area Office - Mezzeh', ar: 'مكتب منطقة دمشق - المزة' },
    { key: 'daraa', en: 'Daraa Area Office', ar: 'مكتب منطقة درعا' },
    { key: 'homs', en: 'Homs Area Office', ar: 'مكتب منطقة حمص' },
    { key: 'hama', en: 'Hama Area Office', ar: 'مكتب منطقة حماة' },
    { key: 'latakia', en: 'Latakia / Tartous Sub-Office', ar: 'مكتب اللاذقية وطرطوس' }
  ];

  // 4. Clean Audio Chime (Official Notification Sound)
  function playCheckinChime() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.32);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.33);
    } catch (e) {
      // AudioContext unavailable
    }
  }

  // 5. Bilingual Translation Dictionaries
  const translations = {
    en: {
      portalSubTitle: 'Staff Development & Training Division · UNRWA HQ',
      adminHeroTitle: 'UNRWA Training & Attendance Management Portal',
      adminHeroDesc: 'Official electronic attendance tracking and automated training documentation system.',
      badgeOfficial: 'Official UNRWA Staff Development Console',
      badgeHrConsole: 'HR Console',
      cloudOnline: 'Cloud Connected',
      cloudOffline: 'Local Mode',
      statRegistered: 'Total Registered Attendees',
      statActiveSession: 'Active Training Sessions',
      sessionSetupTitle: 'Training Session Configuration',
      sessionSetupHint: 'Enter session parameters to generate active check-in QR code',
      lblCourseName: 'Training Course Title',
      lblTrainerName: 'Trainer Name',
      lblLocation: 'Training Venue / Location',
      lblDate: 'Session Date',
      lblTime: 'Session Timing',
      optSelectCourse: '-- Select Training Course --',
      optCustomCourse: '+ Enter Custom Course Title...',
      phCustomCourse: 'Type custom course title here...',
      phTrainer: 'e.g. Dr. Ahmad Al-Khatib',
      optSelectLocation: '-- Select Training Venue --',
      optCustomLocation: '+ Enter Custom Venue...',
      phCustomLocation: 'Type custom venue/room name...',
      phTime: 'e.g. 09:00 AM - 02:00 PM',
      btnGenerateQR: 'Activate Session & Generate QR',
      qrDisplayTitle: 'Session Attendance QR Code',
      statusStandby: 'Awaiting Session Setup',
      statusActive: 'Session Live & Ready for Scanning',
      standbyTitle: 'No Active Session Configured',
      standbyDesc: 'Fill in the training parameters on the left and click "Activate Session & Generate QR" to display the official session QR code.',
      btnProjectorMode: 'Projector Mode',
      btnPrintFlyer: 'Print A4 Poster',
      btnCopyLink: 'Copy Check-in Link',
      btnTestCheckin: 'Test Trainee View',
      hostLabel: 'Trainee Check-In URL:',
      btnEditHost: 'Change URL',
      sessionsArchiveTitle: 'Training Sessions Archive & Attendance Records',
      sessionsArchiveSubtitle: 'Each course has a dedicated record folder, independent attendee roster, and direct Excel download.',
      searchArchivePh: 'Search by course, trainer, or attendee...',
      thEmpNo: 'Employee #',
      thTraineeName: 'Trainee Name (English)',
      thGender: 'Gender',
      thDepartment: 'Department',
      thJobTitle: 'Job Title',
      thGrade: 'Grade',
      thTimestamp: 'Check-in Time',
      thActions: 'Actions',
      projInstructionTitle: 'Scan QR with phone camera to record official attendance',
      projInstructionDesc: 'Ensure your name is typed accurately in English for official certificate issuance.',
      projLiveCount: 'Registered Attendees:',
      btnPrintNow: 'Print Poster',
      btnClose: 'Close',
      flyerHeaderTitle: 'HUMAN RESOURCES · STAFF DEVELOPMENT & TRAINING DIVISION',
      flyerBadge: 'OFFICIAL TRAINING ATTENDANCE',
      flyerInstructionsTitle: 'Electronic Attendance Instructions:',
      flyerStep1: 'Open your smartphone camera and point it at this QR Code.',
      flyerStep2: 'Tap the notification banner to open the UNRWA Attendance Portal.',
      flyerStep3: 'Enter your Employee Number and Full Name in English.',
      flyerStep4: 'Verify the live certificate preview on your screen to ensure correct spelling.',
      flyerStep5: 'Click "Confirm & Submit Attendance" to record your presence.',
      noSessionsTitle: 'No Training Sessions Created Yet',
      noSessionsDesc: 'Configure course parameters above and click "Activate Session & Generate QR" to initialize your first session folder.',
      noFilterResults: 'No courses or attendees matching your search.',
      noAttendeesYet: 'No Attendees Registered Yet',
      noAttendeesYetSub: 'Scan the session QR code to register attendees in real-time.',
      badgeLiveNow: 'Active Session',
      lblAttendeesCount: 'Attendees',
      lblEvaluationsCount: 'Evaluations',
      lblSatisfactionRate: 'Satisfaction',
      btnExportExcel: 'Attendance (.xlsx)',
      btnExportEvalExcel: 'Evaluation (.xlsx)',
      btnActivateQR: 'Activate QR',
      tabModeAttendance: 'Attendance QR (Check-In)',
      tabModeEvaluation: 'Anonymous Evaluation QR',
      btnCopyEvalLink: 'Copy Evaluation Link',
      btnTestEval: 'Test Trainee Evaluation',
      statTotalRegistered: 'Registered:',
      statGenderRatio: 'Gender (M/F):',
      statDepartments: 'Departments:',
      statEvaluations: 'Anonymous Evals:',
      statSatisfaction: 'Satisfaction Rate:',
      statCheckinLink: 'Check-in URL:',
      statEvalLink: 'Evaluation URL:',
      toastEvalLinkCopied: 'Evaluation link copied to clipboard.',
      projEvalInstructionTitle: 'Scan QR with phone camera for anonymous training evaluation',
      projEvalInstructionDesc: 'Your feedback is 100% confidential. No identity or employee number is recorded.',
      flyerEvalBadge: 'ANONYMOUS TRAINING EVALUATION',
      flyerEvalInstructionsTitle: 'Training Evaluation Instructions:',
      flyerEvalStep1: 'Open your smartphone camera and point it at this QR Code.',
      flyerEvalStep2: 'Tap the notification banner to open the UNRWA Training Evaluation Form.',
      flyerEvalStep3: 'Complete the 5 evaluation sections freely and objectively.',
      flyerEvalStep4: 'Your responses are 100% confidential and anonymous (no identity is tracked).',
      flyerEvalStep5: 'Click "Submit Final Evaluation" to contribute to training development.',
      btnQuestionsSettings: 'Edit Questions',
      qmTitle: 'Customize Evaluation Form Questions',
      qmSubtitle: 'Customize question texts, enable/disable items, or add new questions to the evaluation form.',
      qmAddNewTitle: 'Add New Question to Form',
      qmSecLabel: 'Evaluation Section:',
      qmTypeLabel: 'Answer Type:',
      qmTextLabel: 'Question Text (English / Arabic):',
      qmInputPlaceholder: 'Enter question text here...',
      qmBtnAdd: 'Add Question',
      qmListTitle: 'Current Form Questions',
      qmQuestionsUnit: 'Active Questions',
      qmBtnReset: 'Reset to UN Official Template (21 Questions)',
      qmBtnSave: 'Save & Apply Changes',
      qmToggleActive: 'Active',
      qmToggleDisabled: 'Disabled',
      qmToggleTitle: 'Enable or disable this question',
      qmDeleteTitle: 'Delete this question',
      toastQuestionsSaved: 'Evaluation questions configuration saved successfully.',
      toastQuestionsReset: 'Evaluation questions reset to official UNRWA template (21 questions).',
      confirmResetQuestions: 'Are you sure you want to reset all evaluation questions to the official UN template (21 questions)?',
      confirmDeleteQuestion: 'Are you sure you want to remove this question from the evaluation form?',
      toastQuestionDeleted: 'Question removed from list.',
      toastQuestionAdded: 'Question added. Click "Save & Apply Changes" to commit.',
      toastQuestionTextRequired: 'Please enter question text first.',
      linkOpenForm: 'Open Form',
      confirmClearArchive: 'Are you sure you want to delete all session archives? This action cannot be undone.',
      confirmDeleteAttendee: 'Are you sure you want to remove this attendee?',
      confirmDeleteSession: 'Are you sure you want to delete this course and all its attendance records?',
      toastLinkCopied: 'Check-in link copied to clipboard.',
      toastHostUpdated: 'Host URL updated successfully.',
      toastHostReset: 'Host URL reset to auto-detection.',
      toastSessionActivated: 'Session activated and folder created successfully.',
      toastSessionDeleted: 'Course deleted successfully.',
      toastArchiveCleared: 'Archive cleared successfully.',
      toastAttendeeDeleted: 'Attendee removed.',
      excelHeaderEmpNo: 'Employee Number',
      excelHeaderName: 'Trainee Name (English)',
      excelHeaderGender: 'Gender',
      excelHeaderDept: 'Department',
      excelHeaderJob: 'Job Title',
      excelHeaderGrade: 'Grade',
      excelHeaderCourse: 'Course Title',
      excelHeaderLocation: 'Venue',
      excelHeaderTrainer: 'Trainer',
      excelHeaderDate: 'Date',
      excelHeaderTime: 'Check-in Time'
    },
    ar: {
      portalSubTitle: 'قسم تطوير الموظفين والتدريب · رئاسة الأونروا',
      adminHeroTitle: 'بوابة إدارة التدريب وتطوير الموظفين - الأونروا',
      adminHeroDesc: 'المنظومة الرسمية لإدارة الحضور الإلكتروني والتوثيق المعتمد للدورات التدريبية.',
      badgeOfficial: 'بوابة التدريب الرسمية - دائرة الموارد البشرية',
      badgeHrConsole: 'لوحة المشرف',
      cloudOnline: 'متصل سحابياً',
      cloudOffline: 'وضع محلي',
      statRegistered: 'إجمالي الحضور المسجلين',
      statActiveSession: 'الدورات التدريبية النشطة',
      sessionSetupTitle: 'بيانات الجلسة التدريبية',
      sessionSetupHint: 'حدد تفاصيل الجلسة لتوليد رمز الـ QR وتفعيل التسجيل',
      lblCourseName: 'اسم الدورة التدريبية',
      lblTrainerName: 'اسم المدرب',
      lblLocation: 'مكان التدريب / المركز',
      lblDate: 'تاريخ الجلسة',
      lblTime: 'التوقيت',
      optSelectCourse: '-- اختر الدورة التدريبية --',
      optCustomCourse: '+ إدخال اسم دورة أخرى...',
      phCustomCourse: 'اكتب اسم الدورة هنا...',
      phTrainer: 'مثال: د. أحمد الخطيب',
      optSelectLocation: '-- اختر مكان التدريب --',
      optCustomLocation: '+ تحديد مكان آخر...',
      phCustomLocation: 'اكتب اسم المركز أو القاعة هنا...',
      phTime: 'مثال: 09:00 صباحاً - 02:00 ظهراً',
      btnGenerateQR: 'تفعيل الجلسة وتوليد رمز QR',
      qrDisplayTitle: 'رمز الحضور للجلسة (QR Code)',
      statusStandby: 'في انتظار إعداد الجلسة',
      statusActive: 'الجلسة نشطة ومستعدة للمسح',
      standbyTitle: 'لم يتم تفعيل أي جلسة حالياً',
      standbyDesc: 'يرجى تعبئة بيانات التدريب في الطرف الأيمن والضغط على "تفعيل الجلسة وتوليد رمز QR" لعرض رمز الحضور الرسمي.',
      btnProjectorMode: 'عرض البروجيكتور',
      btnPrintFlyer: 'طباعة إعلان A4',
      btnCopyLink: 'نسخ رابط الحضور',
      btnTestCheckin: 'تجربة صفحة المتدرب',
      hostLabel: 'رابط تسجيل حضور المتدربين:',
      btnEditHost: 'تعديل الرابط',
      sessionsArchiveTitle: 'سجل الدورات التدريبية وقوائم الحضور',
      sessionsArchiveSubtitle: 'لكل دورة مجلد خاص وقائمة حضور مستقلة مع إمكانية تنزيل ملف الإكسل الرسمي مباشرة.',
      searchArchivePh: 'بحث باسم الدورة، المدرب، أو المتدرب...',
      thEmpNo: 'الرقم الوظيفي',
      thTraineeName: 'اسم المتدرب (بالإنكليزية)',
      thGender: 'الجنس',
      thDepartment: 'القسم / الدائرة',
      thJobTitle: 'المسمى الوظيفي',
      thGrade: 'الدرجة',
      thTimestamp: 'وقت التسجيل',
      thActions: 'إجراء',
      projInstructionTitle: 'امسح الرمز بكاميرا الهاتف لتسجيل الحضور الرسمي',
      projInstructionDesc: 'يرجى كتابة الاسم بدقة باللغة الإنكليزية لطباعة الشهادة الرسمية.',
      projLiveCount: 'المسجلون حالياً:',
      btnPrintNow: 'طباعة الإعلان',
      btnClose: 'إغلاق',
      flyerHeaderTitle: 'الموارد البشرية · قسم تطوير الموظفين والتدريب',
      flyerBadge: 'كشف الحضور الرسمي للتدريب',
      flyerInstructionsTitle: 'تعليمات تسجيل الحضور الإلكتروني:',
      flyerStep1: 'افتح تطبيق الكاميرا على هاتفك المحمول ووجّهه نحو هذا الرمز.',
      flyerStep2: 'اضغط على الرابط الظاهر لفتح استمارة الحضور الرسمية للأونروا.',
      flyerStep3: 'أدخل رقمك الوظيفي واسمك الكامل باللغة الإنكليزية.',
      flyerStep4: 'تأكد من معاينة الاسم على الشهادة الظاهرة في شاشتك للتحقق من صحة التهجئة.',
      flyerStep5: 'اضغط "تأكيد وتسجيل الحضور" لتوثيق حضورك رسمياً.',
      noSessionsTitle: 'لا توجد دورات تدريبية مسجلة بعد',
      noSessionsDesc: 'قم بإدخال بيانات الجلسة في الأعلى واضغط "تفعيل الجلسة وتوليد رمز QR" لإنشاء مجلد الدورة وكشف الحضور.',
      noFilterResults: 'لا توجد نتائج مطابقة لبحثك.',
      noAttendeesYet: 'لا يوجد حضور مسجلون في هذه الدورة بعد',
      noAttendeesYetSub: 'امسح رمز الحضور المخصص لهذه الجلسة لتسجيل المشاركين فورياً.',
      badgeLiveNow: 'الجلسة النشطة',
      lblAttendeesCount: 'مشارك',
      lblEvaluationsCount: 'تقييم سري',
      lblSatisfactionRate: 'نسبة الرضا',
      btnExportExcel: 'كشف الحضور (.xlsx)',
      btnExportEvalExcel: 'نتائج التقييم (.xlsx)',
      btnActivateQR: 'تفعيل الرمز',
      tabModeAttendance: 'رمز الحضور (Check-In)',
      tabModeEvaluation: 'رمز التقييم السري (Evaluation)',
      btnCopyEvalLink: 'نسخ رابط التقييم',
      btnTestEval: 'تجربة استمارة التقييم',
      statTotalRegistered: 'المسجلون:',
      statGenderRatio: 'النوع (ذكور / إناث):',
      statDepartments: 'الأقسام:',
      statEvaluations: 'التقييمات السرية:',
      statSatisfaction: 'نسبة الرضا العام:',
      statCheckinLink: 'رابط الحضور:',
      statEvalLink: 'رابط التقييم:',
      toastEvalLinkCopied: 'تم نسخ رابط استمارة التقييم السرية إلى الحافظة.',
      projEvalInstructionTitle: 'امسح الرمز بكاميرا الهاتف لتعبئة استمارة التقييم السرية',
      projEvalInstructionDesc: 'تقييمك سري ومجهول الهوية بالكامل بنسبة 100% لتطوير التدريب دون تسجيل أي بيانات شخصية.',
      flyerEvalBadge: 'استمارة تقييم التدريب السرية',
      flyerEvalInstructionsTitle: 'تعليمات تقييم الدورة التدريبية:',
      flyerEvalStep1: 'افتح تطبيق الكاميرا على هاتفك المحمول ووجّهه نحو هذا الرمز.',
      flyerEvalStep2: 'اضغط على الرابط الظاهر لفتح استمارة تقييم التدريب الرسمية للأونروا.',
      flyerEvalStep3: 'أجب على أقسام التقييم الخمسة بكل شفافية وحيادية وموضوعية.',
      flyerEvalStep4: 'الاستمارة مجهولة الهوية بالكامل وسرية بنسبة 100% (لا يُطلب اسم أو رقم وظيفي).',
      flyerEvalStep5: 'اضغط "إرسال التقييم النهائي" للمساهمة في تحسين جودة برامج التدريب المستقبلي.',
      btnQuestionsSettings: 'تعديل الأسئلة',
      qmTitle: 'إدارة وتخصيص أسئلة استمارة التقييم',
      qmSubtitle: 'يمكنك تعديل نصوص الأسئلة، تفعيل أو تعطيل أي سؤال، أو إضافة أسئلة مخصصة للدورة.',
      qmAddNewTitle: 'إضافة سؤال جديد إلى الاستمارة',
      qmSecLabel: 'قسم التقييم:',
      qmTypeLabel: 'نوع الإجابة:',
      qmTextLabel: 'نص السؤال (باللغة العربية / الإنكليزية):',
      qmInputPlaceholder: 'اكتب صيغة السؤال هنا...',
      qmBtnAdd: 'إضافة السؤال للاستمارة',
      qmListTitle: 'الأسئلة الحالية في الاستمارة',
      qmQuestionsUnit: 'سؤال مفعّل',
      qmBtnReset: 'استعادة القالب الرسمي (21 سؤال)',
      qmBtnSave: 'حفظ وتطبيق التغييرات',
      qmToggleActive: 'مفعّل',
      qmToggleDisabled: 'معطّل',
      qmToggleTitle: 'تفعيل أو تعطيل هذا السؤال في الاستمارة',
      qmDeleteTitle: 'حذف هذا السؤال',
      toastQuestionsSaved: 'تم حفظ وتحديث أسئلة استمارة التقييم بنجاح.',
      toastQuestionsReset: 'تمت استعادة الأسئلة إلى القالب الرسمي المعتمد للأونروا (21 سؤال).',
      confirmResetQuestions: 'هل أنت متأكد من رغبتك في إعادة تعيين الأسئلة إلى القالب القياسي الرسمي (21 سؤال)؟',
      confirmDeleteQuestion: 'هل أنت متأكد من حذف هذا السؤال من الاستمارة؟',
      toastQuestionDeleted: 'تم حذف السؤال من القائمة.',
      toastQuestionAdded: 'تمت إضافة السؤال بنجاح. لا تنسَ الضغط على "حفظ وتطبيق التغييرات".',
      toastQuestionTextRequired: 'يرجى كتابة نص السؤال أولاً.',
      linkOpenForm: 'فتح الاستمارة',
      confirmClearArchive: 'هل أنت متأكد من رغبتك في مسح كامل أرشيف الدورات التدريبية؟ لا يمكن التراجع عن هذا الإجراء.',
      confirmDeleteAttendee: 'هل أنت متأكد من حذف هذا المتدرب من سجل الحضور؟',
      confirmDeleteSession: 'هل أنت متأكد من حذف هذه الدورة بالكامل مع كافة سجلات الحضور الخاصة بها؟',
      toastLinkCopied: 'تم نسخ رابط الحضور إلى الحافظة بنجاح.',
      toastHostUpdated: 'تم تحديث عنوان الرابط بنجاح.',
      toastHostReset: 'تمت استعادة العنوان التلقائي.',
      toastSessionActivated: 'تم تفعيل الجلسة وإنشاء مجلد الحضور بنجاح.',
      toastSessionDeleted: 'تم حذف الدورة التدريبية بنجاح.',
      toastArchiveCleared: 'تم مسح سجل الدورات بنجاح.',
      toastAttendeeDeleted: 'تم حذف المتدرب من القائمة.',
      excelHeaderEmpNo: 'الرقم الوظيفي',
      excelHeaderName: 'اسم المتدرب (بالإنكليزية)',
      excelHeaderGender: 'الجنس',
      excelHeaderDept: 'القسم أو البرنامج',
      excelHeaderJob: 'المسمى الوظيفي',
      excelHeaderGrade: 'الدرجة الوظيفية',
      excelHeaderCourse: 'الدورة التدريبية',
      excelHeaderLocation: 'مكان التدريب',
      excelHeaderTrainer: 'اسم المدرب',
      excelHeaderDate: 'تاريخ الدورة',
      excelHeaderTime: 'وقت التسجيل'
    }
  };

  // 6. Dynamic Dropdowns Population (Pure language per choice)
  function populateCourseSelect(lang) {
    const sel = document.getElementById('courseSelect');
    if (!sel) return;
    const currentVal = sel.value;
    const dict = translations[lang];

    let html = `<option value="" disabled ${!currentVal ? 'selected' : ''}>${dict.optSelectCourse}</option>`;
    courseCatalog.forEach(c => {
      const text = c[lang];
      const isSelected = (currentVal === c.en || currentVal === c.ar);
      html += `<option value="${text}" ${isSelected ? 'selected' : ''}>${text}</option>`;
    });
    html += `<option value="__custom__" ${currentVal === '__custom__' ? 'selected' : ''}>${dict.optCustomCourse}</option>`;
    sel.innerHTML = html;
  }

  function populateLocationSelect(lang) {
    const sel = document.getElementById('locationSelect');
    if (!sel) return;
    const currentVal = sel.value;
    const dict = translations[lang];

    let html = `<option value="" disabled ${!currentVal ? 'selected' : ''}>${dict.optSelectLocation}</option>`;
    locationCatalog.forEach(loc => {
      const text = loc[lang];
      const isSelected = (currentVal === loc.en || currentVal === loc.ar);
      html += `<option value="${text}" ${isSelected ? 'selected' : ''}>${text}</option>`;
    });
    html += `<option value="__custom__" ${currentVal === '__custom__' ? 'selected' : ''}>${dict.optCustomLocation}</option>`;
    sel.innerHTML = html;
  }

  function populateQuestionsManagerDropdowns(lang) {
    const secSel = document.getElementById('qmNewSection');
    const typeSel = document.getElementById('qmNewType');
    const qInput = document.getElementById('qmNewTextAr');

    if (qInput) {
      qInput.placeholder = (lang === 'ar') ? 'اكتب صيغة السؤال هنا...' : 'Enter question text here...';
    }

    if (secSel) {
      const currentSec = secSel.value || '1';
      const sections = [
        { val: '1', ar: '1. أهداف البرنامج ومحتوى الدورة', en: '1. Programme Objectives & Content' },
        { val: '2', ar: '2. المدرب/ة وتقديم الدورة', en: '2. Trainer & Delivery' },
        { val: '3', ar: '3. مكان التدريب والتنظيم', en: '3. Venue & Organization' },
        { val: '4', ar: '4. التقييم الإجمالي والملاحظات', en: '4. Overall Rating & Comments' },
        { val: '5', ar: '5. الأثر والارتباط بالعمل', en: '5. Impact & Relevance to Job' }
      ];
      secSel.innerHTML = sections.map(s => 
        `<option value="${s.val}" ${s.val === currentSec ? 'selected' : ''}>${(lang === 'ar') ? s.ar : s.en}</option>`
      ).join('');
    }

    if (typeSel) {
      const currentType = typeSel.value || 'likert_5';
      const types = [
        { 
          val: 'likert_5', 
          ar: 'مقياس ليكرت خماسي: غير موافق بشدة إلى موافق بشدة (1-5)', 
          en: '5-Point Likert Scale: Strongly Disagree to Strongly Agree (1-5)' 
        },
        { 
          val: 'overall_5', 
          ar: 'تقييم إجمالي خماسي: ضعيف جداً إلى ممتاز (1-5)', 
          en: '5-Point Overall Rating: Very Poor to Excellent (1-5)' 
        },
        { 
          val: 'relevance_5', 
          ar: 'ارتباط بالوظيفة: لا صلة إلى وثيق الصلة (1-5)', 
          en: '5-Point Job Relevance: Not at all to Highly Relevant (1-5)' 
        },
        { 
          val: 'perform_3', 
          ar: 'أثر الأداء: نعم بالتأكيد / ربما / لا', 
          en: 'Performance Impact: Yes definitely / Maybe / No' 
        },
        { 
          val: 'yes_somewhat_no', 
          ar: 'خيارات: نعم / إلى حد ما / لا', 
          en: 'Choices: Yes / Somewhat / No' 
        },
        { 
          val: 'yes_no', 
          ar: 'خيارات: نعم / لا', 
          en: 'Choices: Yes / No' 
        },
        { 
          val: 'rating_4', 
          ar: 'تقييم: ممتاز / جيد جداً / جيد / ضعيف', 
          en: 'Rating: Excellent / Very Good / Good / Poor' 
        },
        { 
          val: 'text', 
          ar: 'حقل نصي حر (ملاحظات ومقترحات)', 
          en: 'Free Text Field (Comments & Suggestions)' 
        }
      ];
      typeSel.innerHTML = types.map(t => 
        `<option value="${t.val}" ${t.val === currentType ? 'selected' : ''}>${(lang === 'ar') ? t.ar : t.en}</option>`
      ).join('');
    }
  }

  function applyLanguage(lang) {
    currentLang = lang;
    document.documentElement.lang = lang;
    document.documentElement.dir = (lang === 'ar') ? 'rtl' : 'ltr';

    const langLabel = document.getElementById('currentLangLabel');
    if (langLabel) {
      langLabel.textContent = (lang === 'ar') ? 'English' : 'العربية';
    }

    const dict = translations[lang];
    if (!dict) return;

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict[key]) el.textContent = dict[key];
    });

    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
      const key = el.getAttribute('data-i18n-ph');
      if (dict[key]) el.placeholder = dict[key];
    });

    populateCourseSelect(lang);
    populateLocationSelect(lang);
    populateQuestionsManagerDropdowns(lang);
    renderQuestionsManagerList();
    updateAdminCloudStatus(db !== null);

    const statusText = document.getElementById('qrStatusText');
    if (statusText) {
      statusText.textContent = currentSession ? dict.statusActive : dict.statusStandby;
    }

    renderSessionsAccordion();
  }

  // 7. Host URL Resolution
  function getBaseHostUrl() {
    const customHost = localStorage.getItem('attendtrack_custom_host_v1');
    if (customHost && customHost.trim() !== '') {
      return customHost.trim().replace(/\/+$/, '');
    }

    if (window.location.protocol === 'file:') {
      return 'https://unrwa-training.netlify.app';
    }

    return window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '').replace(/\/+$/, '');
  }

  function generateCheckinUrl(session = null) {
    const targetSession = session || currentSession;
    if (!targetSession) return '';
    const base = getBaseHostUrl();
    const cleanBase = (base.startsWith('http') || base.startsWith('file:')) ? base : 'https://' + base;
    const url = new URL(cleanBase + '/checkin.html');
    url.searchParams.set('c', targetSession.course);
    url.searchParams.set('loc', targetSession.location);
    url.searchParams.set('tr', targetSession.trainer);
    url.searchParams.set('d', targetSession.date);
    url.searchParams.set('t', targetSession.time);
    url.searchParams.set('sid', targetSession.sessionId);
    return url.toString();
  }

  function generateEvalUrl(session = null) {
    const targetSession = session || currentSession;
    if (!targetSession) return '';
    const base = getBaseHostUrl();
    const cleanBase = (base.startsWith('http') || base.startsWith('file:')) ? base : 'https://' + base;
    const url = new URL(cleanBase + '/eval.html');
    url.searchParams.set('c', targetSession.course);
    url.searchParams.set('loc', targetSession.location);
    url.searchParams.set('tr', targetSession.trainer);
    url.searchParams.set('d', targetSession.date);
    url.searchParams.set('t', targetSession.time);
    url.searchParams.set('sid', targetSession.sessionId);
    return url.toString();
  }

  // 8. QR Code Rendering
  function renderQrCodes() {
    if (!currentSession) return;
    const targetUrl = (currentQrMode === 'evaluation')
      ? generateEvalUrl(currentSession)
      : generateCheckinUrl(currentSession);
    if (!targetUrl) return;

    if (typeof QRCode === 'undefined') {
      setTimeout(renderQrCodes, 250);
      return;
    }

    const dict = translations[currentLang];

    const displayHost = document.getElementById('hostCurrentUrlDisplay');
    if (displayHost) {
      displayHost.textContent = targetUrl;
    }

    // Update buttons text based on mode
    const copyBtnText = document.getElementById('btnCopyLinkText');
    const testBtnText = document.getElementById('btnTestCheckinText');
    if (copyBtnText) {
      copyBtnText.textContent = (currentQrMode === 'evaluation') ? dict.btnCopyEvalLink : dict.btnCopyLink;
    }
    if (testBtnText) {
      testBtnText.textContent = (currentQrMode === 'evaluation') ? dict.btnTestEval : dict.btnTestCheckin;
    }

    const qrColor = (currentQrMode === 'evaluation') ? '#0072bc' : '#002d62';

    // 1. Admin Dashboard QR
    const qrAdminContainer = document.getElementById('qrcode');
    if (qrAdminContainer) {
      qrAdminContainer.innerHTML = '';
      adminQr = new QRCode(qrAdminContainer, {
        text: targetUrl,
        width: 210,
        height: 210,
        colorDark: qrColor,
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M
      });
    }

    // 2. Projector Modal QR
    const qrProjContainer = document.getElementById('projectorQrcode');
    if (qrProjContainer) {
      qrProjContainer.innerHTML = '';
      projectorQr = new QRCode(qrProjContainer, {
        text: targetUrl,
        width: 320,
        height: 320,
        colorDark: qrColor,
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M
      });
    }

    const projTitle = document.querySelector('[data-i18n="projInstructionTitle"]');
    const projDesc = document.querySelector('[data-i18n="projInstructionDesc"]');
    if (projTitle) {
      projTitle.textContent = (currentQrMode === 'evaluation') ? dict.projEvalInstructionTitle : dict.projInstructionTitle;
    }
    if (projDesc) {
      projDesc.textContent = (currentQrMode === 'evaluation') ? dict.projEvalInstructionDesc : dict.projInstructionDesc;
    }

    // 3. A4 Table Flyer QR
    const qrFlyerContainer = document.getElementById('flyerQrcode');
    if (qrFlyerContainer) {
      qrFlyerContainer.innerHTML = '';
      flyerQr = new QRCode(qrFlyerContainer, {
        text: targetUrl,
        width: 220,
        height: 220,
        colorDark: qrColor,
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M
      });
    }

    const flyerBadge = document.querySelector('.flyer-badge');
    const flyerInstrTitle = document.querySelector('[data-i18n="flyerInstructionsTitle"]');
    const flyerStep1 = document.querySelector('[data-i18n="flyerStep1"]');
    const flyerStep2 = document.querySelector('[data-i18n="flyerStep2"]');
    const flyerStep3 = document.querySelector('[data-i18n="flyerStep3"]');
    const flyerStep4 = document.querySelector('[data-i18n="flyerStep4"]');
    const flyerStep5 = document.querySelector('[data-i18n="flyerStep5"]');

    if (currentQrMode === 'evaluation') {
      if (flyerBadge) flyerBadge.textContent = dict.flyerEvalBadge;
      if (flyerInstrTitle) flyerInstrTitle.textContent = dict.flyerEvalInstructionsTitle;
      if (flyerStep1) flyerStep1.textContent = dict.flyerEvalStep1;
      if (flyerStep2) flyerStep2.textContent = dict.flyerEvalStep2;
      if (flyerStep3) flyerStep3.textContent = dict.flyerEvalStep3;
      if (flyerStep4) flyerStep4.textContent = dict.flyerEvalStep4;
      if (flyerStep5) flyerStep5.textContent = dict.flyerEvalStep5;
    } else {
      if (flyerBadge) flyerBadge.textContent = dict.flyerBadge;
      if (flyerInstrTitle) flyerInstrTitle.textContent = dict.flyerInstructionsTitle;
      if (flyerStep1) flyerStep1.textContent = dict.flyerStep1;
      if (flyerStep2) flyerStep2.textContent = dict.flyerStep2;
      if (flyerStep3) flyerStep3.textContent = dict.flyerStep3;
      if (flyerStep4) flyerStep4.textContent = dict.flyerStep4;
      if (flyerStep5) flyerStep5.textContent = dict.flyerStep5;
    }
  }

  // 9. Session Activation
  function activateSession(sessionObj) {
    currentSession = sessionObj;
    localStorage.setItem('attendtrack_active_session_v1', JSON.stringify(sessionObj));

    let existingIndex = allSessions.findIndex(s => s.sessionId === sessionObj.sessionId);
    if (existingIndex >= 0) {
      allSessions[existingIndex] = { ...allSessions[existingIndex], ...sessionObj, isExpanded: true };
    } else {
      allSessions.unshift({ ...sessionObj, attendees: [], isExpanded: true });
    }
    saveLocalSessions();

    const placeholder = document.getElementById('qrStandbyPlaceholder');
    const content = document.getElementById('qrActiveContent');
    const statusPill = document.getElementById('qrLiveStatus');
    const statusText = document.getElementById('qrStatusText');
    const dict = translations[currentLang];

    if (placeholder) placeholder.classList.add('hidden');
    if (content) content.classList.remove('hidden');
    if (statusPill) statusPill.className = 'status-pill status-active';
    if (statusText) statusText.textContent = dict.statusActive;

    document.getElementById('displayCourseTitle').textContent = sessionObj.course;
    document.getElementById('displayLocation').textContent = sessionObj.location;
    document.getElementById('displayTrainer').textContent = sessionObj.trainer;
    document.getElementById('displayDate').textContent = sessionObj.date;
    document.getElementById('displayTime').textContent = sessionObj.time;

    // Projector Modal
    document.getElementById('projCourseTitle').textContent = sessionObj.course;
    document.getElementById('projLocation').textContent = sessionObj.location;
    document.getElementById('projTrainer').textContent = sessionObj.trainer;
    document.getElementById('projDate').textContent = sessionObj.date;
    document.getElementById('projTime').textContent = sessionObj.time;

    // A4 Flyer
    document.getElementById('flyerCourseTitle').textContent = sessionObj.course;
    document.getElementById('flyerLocation').textContent = sessionObj.location;
    document.getElementById('flyerTrainer').textContent = sessionObj.trainer;
    document.getElementById('flyerDate').textContent = sessionObj.date;
    document.getElementById('flyerTime').textContent = sessionObj.time;

    renderQrCodes();

    if (db) {
      db.ref('active_session').set(sessionObj).catch(console.warn);
      db.ref('sessions/' + sessionObj.sessionId + '/meta').set(sessionObj).catch(console.warn);
    }

    renderSessionsAccordion();
    updateGlobalStats();
  }

  // 10. Real-time Firebase Sync
  function initRealtimeFirebaseSync() {
    if (!db) return;

    db.ref('sessions').on('value', (snapshot) => {
      const val = snapshot.val();
      if (!val) {
        allSessions = [];
        saveLocalSessions();
        renderSessionsAccordion();
        updateGlobalStats();
        return;
      }

      let hasChanges = false;
      let newAttendeeArrival = null;
      let newEvalArrival = null;

      Object.keys(val).forEach(sid => {
        const remoteSession = val[sid];
        const meta = remoteSession.meta || {};
        const remoteAttendeesMap = remoteSession.attendees || {};
        const remoteAttendeesList = Object.values(remoteAttendeesMap);
        const remoteEvaluationsMap = remoteSession.evaluations || {};
        const remoteEvaluationsList = Object.values(remoteEvaluationsMap);

        let localSession = allSessions.find(s => s.sessionId === sid);
        if (!localSession) {
          localSession = {
            sessionId: sid,
            course: meta.course || 'Training Session',
            trainer: meta.trainer || 'Trainer',
            location: meta.location || 'UNRWA Station',
            date: meta.date || new Date().toISOString().split('T')[0],
            time: meta.time || '09:00 AM - 02:00 PM',
            attendees: [],
            evaluations: [],
            isExpanded: (currentSession && currentSession.sessionId === sid)
          };
          allSessions.push(localSession);
          hasChanges = true;
        }

        const prevCount = localSession.attendees.length;
        localSession.attendees = remoteAttendeesList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        const prevEvalCount = (localSession.evaluations || []).length;
        localSession.evaluations = remoteEvaluationsList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        if (!isInitialFirebaseLoad && localSession.attendees.length > prevCount) {
          hasChanges = true;
          newAttendeeArrival = {
            attendee: localSession.attendees[0],
            course: localSession.course
          };
        }

        if (!isInitialFirebaseLoad && localSession.evaluations.length > prevEvalCount) {
          hasChanges = true;
          newEvalArrival = {
            course: localSession.course
          };
        }
      });

      if (hasChanges || isInitialFirebaseLoad) {
        saveLocalSessions();
        renderSessionsAccordion();
        updateGlobalStats();

        if (newAttendeeArrival && !isInitialFirebaseLoad) {
          playCheckinChime();
          const dict = translations[currentLang];
          const msg = (currentLang === 'ar')
            ? `تسجيل حضور جديد في [${newAttendeeArrival.course}]: ${newAttendeeArrival.attendee.name} (${newAttendeeArrival.attendee.department})`
            : `New check-in in [${newAttendeeArrival.course}]: ${newAttendeeArrival.attendee.name} (${newAttendeeArrival.attendee.department})`;
          showToast(msg, 'success');
        }

        if (newEvalArrival && !isInitialFirebaseLoad) {
          playCheckinChime();
          const msg = (currentLang === 'ar')
            ? `تم استلام تقييم تدريب سري جديد لدورة [${newEvalArrival.course}]`
            : `New anonymous evaluation received for [${newEvalArrival.course}]`;
          showToast(msg, 'info');
        }
      }
    });

    setTimeout(() => {
      isInitialFirebaseLoad = false;
    }, 2000);
  }

  function saveLocalSessions() {
    try {
      localStorage.setItem('attendtrack_all_sessions_v2', JSON.stringify(allSessions));
    } catch (e) {
      console.warn(e);
    }
  }

  // 11. Render Sessions Archive Folders
  function renderSessionsAccordion(searchQuery = '') {
    const container = document.getElementById('sessionsAccordionContainer');
    if (!container) return;
    const dict = translations[currentLang];

    if (allSessions.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="padding: 3rem 1rem;">
          <i class="fa-solid fa-folder-open" style="font-size: 2.8rem; color: var(--text-light); margin-bottom: 0.85rem;"></i>
          <h4>${dict.noSessionsTitle}</h4>
          <p>${dict.noSessionsDesc}</p>
        </div>
      `;
      return;
    }

    const filtered = allSessions.filter(s => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase().trim();
      const inCourse = s.course.toLowerCase().includes(q);
      const inTrainer = s.trainer.toLowerCase().includes(q);
      const inLocation = s.location.toLowerCase().includes(q);
      const inAttendees = (s.attendees || []).some(a =>
        a.name.toLowerCase().includes(q) ||
        a.empNumber.toLowerCase().includes(q) ||
        a.department.toLowerCase().includes(q)
      );
      return inCourse || inTrainer || inLocation || inAttendees;
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>${dict.noFilterResults}</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(session => {
      const isActive = currentSession && currentSession.sessionId === session.sessionId;
      const attendeeCount = (session.attendees || []).length;
      const evalList = session.evaluations || [];
      const evalCount = evalList.length;

      let highSatCount = 0;
      evalList.forEach(e => {
        const r = (e.ratings && e.ratings.q11) || '';
        if (r === 'excellent' || r === 'very_good') highSatCount++;
      });
      const satisfactionRate = evalCount > 0 ? Math.round((highSatCount / evalCount) * 100) : 0;

      const expandedClass = session.isExpanded ? 'expanded' : '';
      const activeClass = isActive ? 'is-active-session' : '';

      const liveBadge = isActive
        ? `<span class="badge-live-now">${dict.badgeLiveNow}</span>`
        : '';

      const maleCount = (session.attendees || []).filter(a => a.gender === 'Male').length;
      const femaleCount = (session.attendees || []).filter(a => a.gender === 'Female').length;
      const deptsCount = new Set((session.attendees || []).map(a => a.department)).size;

      // Table Rows
      let tableRows = '';
      if (attendeeCount === 0) {
        tableRows = `
          <tr class="empty-row">
            <td colspan="9">
              <div class="empty-state" style="padding: 1.5rem;">
                <h5>${dict.noAttendeesYet}</h5>
                <p><small>${dict.noAttendeesYetSub}</small></p>
              </div>
            </td>
          </tr>
        `;
      } else {
        tableRows = (session.attendees || []).map((att, idx) => {
          const genderText = att.gender === 'Male'
            ? ((currentLang === 'ar') ? 'ذكر' : 'Male')
            : ((currentLang === 'ar') ? 'أنثى' : 'Female');

          const genderBadge = att.gender === 'Male'
            ? `<span class="badge badge-male">${genderText}</span>`
            : `<span class="badge badge-female">${genderText}</span>`;

          return `
            <tr>
              <td>${idx + 1}</td>
              <td><strong>${escapeHtml(att.empNumber)}</strong></td>
              <td class="font-bold text-unrwa">${escapeHtml(att.name)}</td>
              <td>${genderBadge}</td>
              <td>${escapeHtml(att.department)}</td>
              <td>${escapeHtml(att.jobTitle)}</td>
              <td><span class="badge badge-grade">${escapeHtml(att.grade)}</span></td>
              <td><small class="text-muted">${escapeHtml(att.displayTime || '')}</small></td>
              <td>
                <button class="btn-icon text-danger" title="${dict.thActions}" onclick="event.stopPropagation(); window.AttendTrackAdmin.deleteAttendee('${session.sessionId}', '${att.id}')">
                  <i class="fa-solid fa-trash-can"></i>
                </button>
              </td>
            </tr>
          `;
        }).join('');
      }

      return `
        <div class="session-folder ${activeClass} ${expandedClass}" id="folder_${session.sessionId}">
          <!-- Folder Header -->
          <div class="folder-header" onclick="window.AttendTrackAdmin.toggleFolder('${session.sessionId}')">
            
            <div class="folder-left-info">
              <div class="folder-icon-box">
                <i class="fa-solid ${isActive ? 'fa-folder-open' : 'fa-folder'}"></i>
              </div>
              <div class="folder-title-group">
                <h3 class="folder-course-title">
                  <span>${escapeHtml(session.course)}</span>
                  ${liveBadge}
                </h3>
                <div class="folder-meta-row">
                  <span><i class="fa-solid fa-location-dot"></i> ${escapeHtml(session.location)}</span>
                  <span><i class="fa-solid fa-user-tie"></i> ${escapeHtml(session.trainer)}</span>
                  <span><i class="fa-solid fa-calendar"></i> ${escapeHtml(session.date)}</span>
                  <span><i class="fa-solid fa-clock"></i> ${escapeHtml(session.time)}</span>
                </div>
              </div>
            </div>

            <!-- Folder Right Controls -->
            <div class="folder-right-controls" onclick="event.stopPropagation();">
              
              <span class="folder-attendee-counter" title="${dict.lblAttendeesCount}">
                <i class="fa-solid fa-user-check"></i>
                <b>${attendeeCount}</b> ${dict.lblAttendeesCount}
              </span>

              <span class="folder-eval-counter" title="${dict.lblEvaluationsCount}" style="background: rgba(0, 114, 188, 0.1); color: #0072bc; padding: 4px 9px; border-radius: var(--radius-full); font-size: 0.78rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px; border: 1px solid rgba(0, 114, 188, 0.2);">
                <i class="fa-solid fa-square-poll-vertical"></i>
                <b>${evalCount}</b> ${dict.lblEvaluationsCount}
                ${evalCount > 0 ? `<span style="color: #107c41;">(${satisfactionRate}%)</span>` : ''}
              </span>

              <button type="button" class="btn-folder-excel" onclick="window.AttendTrackAdmin.exportSessionExcel('${session.sessionId}')" title="${dict.btnExportExcel}">
                <i class="fa-solid fa-file-excel"></i>
                <span>${dict.btnExportExcel}</span>
              </button>

              <button type="button" class="btn-folder-excel-eval" onclick="window.AttendTrackAdmin.exportEvaluationExcel('${session.sessionId}')" title="${dict.btnExportEvalExcel}">
                <i class="fa-solid fa-chart-pie"></i>
                <span>${dict.btnExportEvalExcel}</span>
              </button>

              ${!isActive ? `
                <button type="button" class="btn-folder-activate" onclick="window.AttendTrackAdmin.activateSessionQr('${session.sessionId}')" title="${dict.btnActivateQR}">
                  <i class="fa-solid fa-qrcode"></i>
                  <span>${dict.btnActivateQR}</span>
                </button>
              ` : ''}

              <button type="button" class="btn-icon text-danger" onclick="window.AttendTrackAdmin.deleteSession('${session.sessionId}')" title="${dict.confirmDeleteSession}">
                <i class="fa-solid fa-trash-can"></i>
              </button>

              <div class="folder-chevron" onclick="window.AttendTrackAdmin.toggleFolder('${session.sessionId}')">
                <i class="fa-solid fa-chevron-down"></i>
              </div>

            </div>

          </div>

          <!-- Folder Body -->
          <div class="folder-body">
            
            <div class="folder-summary-stats">
              <div class="folder-stat-pill">
                <span>${dict.statTotalRegistered}</span>
                <strong>${attendeeCount}</strong>
              </div>
              <div class="folder-stat-pill">
                <span>${dict.statGenderRatio}</span>
                <strong>${maleCount} / ${femaleCount}</strong>
              </div>
              <div class="folder-stat-pill">
                <span>${dict.statEvaluations}</span>
                <strong style="color: #0072bc;">${evalCount}</strong>
              </div>
              <div class="folder-stat-pill">
                <span>${dict.statSatisfaction}</span>
                <strong style="color: ${satisfactionRate >= 75 ? '#107c41' : '#b78103'};">${evalCount > 0 ? satisfactionRate + '%' : '--'}</strong>
              </div>
              <div class="folder-stat-pill">
                <span>${dict.statCheckinLink}</span>
                <a href="${generateCheckinUrl(session)}" target="_blank" style="color: var(--un-blue-primary); font-size: 0.8rem; text-decoration: underline;">
                  ${dict.linkOpenForm}
                </a>
              </div>
              <div class="folder-stat-pill">
                <span>${dict.statEvalLink}</span>
                <a href="${generateEvalUrl(session)}" target="_blank" style="color: #0072bc; font-size: 0.8rem; text-decoration: underline;">
                  ${dict.linkOpenForm}
                </a>
              </div>
            </div>

            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th width="40">#</th>
                    <th>${dict.thEmpNo}</th>
                    <th>${dict.thTraineeName}</th>
                    <th>${dict.thGender}</th>
                    <th>${dict.thDepartment}</th>
                    <th>${dict.thJobTitle}</th>
                    <th>${dict.thGrade}</th>
                    <th>${dict.thTimestamp}</th>
                    <th>${dict.thActions}</th>
                  </tr>
                </thead>
                <tbody>
                  ${tableRows}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      `;
    }).join('');
  }

  // 12. Update Global Stats
  function updateGlobalStats() {
    let grandTotal = 0;
    allSessions.forEach(s => {
      grandTotal += (s.attendees || []).length;
    });

    const elHeroTotal = document.getElementById('heroTotalAttendees');
    const elActiveSessions = document.getElementById('heroActiveSessions');
    const elProjCount = document.getElementById('projAttendeeCount');

    if (elHeroTotal) elHeroTotal.textContent = grandTotal;
    if (elActiveSessions) elActiveSessions.textContent = allSessions.length;

    if (elProjCount && currentSession) {
      const activeObj = allSessions.find(s => s.sessionId === currentSession.sessionId);
      elProjCount.textContent = activeObj ? (activeObj.attendees || []).length : 0;
    }
  }

  // 13. Questions Manager Logic (Form Builder)
  function loadEvalQuestions() {
    const saved = localStorage.getItem('attendtrack_eval_questions_v2');
    if (saved) {
      try {
        evalQuestions = JSON.parse(saved);
      } catch (e) {
        evalQuestions = JSON.parse(JSON.stringify(DEFAULT_EVAL_QUESTIONS));
      }
    } else {
      evalQuestions = JSON.parse(JSON.stringify(DEFAULT_EVAL_QUESTIONS));
      localStorage.setItem('attendtrack_eval_questions_v2', JSON.stringify(evalQuestions));
    }

    if (db) {
      db.ref('settings/eval_questions_v2').once('value').then(snap => {
        const val = snap.val();
        if (val && Array.isArray(val) && val.length > 0) {
          evalQuestions = val;
          renderQuestionsManagerList();
        } else {
          db.ref('settings/eval_questions_v2').set(DEFAULT_EVAL_QUESTIONS).catch(console.warn);
        }
      }).catch(console.warn);
    }
  }

  function renderQuestionsManagerList() {
    const container = document.getElementById('qmQuestionsListContainer');
    if (!container) return;
    const countEl = document.getElementById('qmActiveCount');
    const activeCount = evalQuestions.filter(q => q.enabled !== false).length;
    if (countEl) countEl.textContent = activeCount;

    const sectionNames = {
      1: (currentLang === 'ar') ? '1. أهداف ومحتوى الدورة' : '1. Objectives & Content',
      2: (currentLang === 'ar') ? '2. أداء المدرب/ة' : '2. Trainer Delivery',
      3: (currentLang === 'ar') ? '3. مكان التدريب والتنظيم' : '3. Venue & Organization',
      4: (currentLang === 'ar') ? '4. التقييم الإجمالي' : '4. Overall Rating',
      5: (currentLang === 'ar') ? '5. الأثر والارتباط بالعمل' : '5. Impact & Relevance'
    };

    const typeNames = {
      likert_5: (currentLang === 'ar') ? 'مقياس ليكرت (1-5)' : '5-Point Likert (1-5)',
      overall_5: (currentLang === 'ar') ? 'تقييم شامل (1-5)' : 'Overall Rating (1-5)',
      relevance_5: (currentLang === 'ar') ? 'صلة بالعمل (1-5)' : 'Job Relevance (1-5)',
      perform_3: (currentLang === 'ar') ? 'أثر الأداء (3 خيارات)' : 'Performance (3 choices)',
      yes_somewhat_no: (currentLang === 'ar') ? 'نعم / إلى حد ما / لا' : 'Yes / Somewhat / No',
      yes_no: (currentLang === 'ar') ? 'نعم / لا' : 'Yes / No',
      rating_4: (currentLang === 'ar') ? 'تقييم 4 نجوم' : 'Rating (4 stars)',
      text: (currentLang === 'ar') ? 'حقل نصي' : 'Free Text'
    };

    const dict = translations[currentLang] || translations.ar;

    container.innerHTML = evalQuestions.map((q, idx) => {
      const isEnabled = (q.enabled !== false);
      const disabledClass = isEnabled ? '' : 'disabled';
      const toggleBtnClass = isEnabled ? 'active' : 'inactive';
      const toggleBtnText = isEnabled ? dict.qmToggleActive : dict.qmToggleDisabled;
      const qText = (currentLang === 'ar') ? (q.textAr || q.textEn) : (q.textEn || q.textAr);

      return `
        <div class="qm-question-item ${disabledClass}" id="qmItem_${q.id}">
          <div class="qm-question-top">
            <div class="qm-badges-group">
              <span class="qm-item-number">#${idx + 1}</span>
              <span class="qm-badge-sec">${sectionNames[q.section] || ''}</span>
              <span class="qm-badge-type">${typeNames[q.type] || q.type}</span>
            </div>
            <div class="qm-actions-group">
              <button type="button" class="btn-qm-toggle ${toggleBtnClass}" onclick="window.AttendTrackAdmin.toggleQuestionEnable('${q.id}')" title="${dict.qmToggleTitle}">
                <i class="fa-solid ${isEnabled ? 'fa-check' : 'fa-ban'}"></i> ${toggleBtnText}
              </button>
              <button type="button" class="btn-qm-delete" onclick="window.AttendTrackAdmin.deleteQuestion('${q.id}')" title="${dict.qmDeleteTitle}">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </div>
          <div>
            <input type="text" class="form-input form-input-sm qm-input-text" value="${escapeHtml(qText)}" 
              onchange="window.AttendTrackAdmin.updateQuestionText('${q.id}', this.value)"
              placeholder="${dict.qmInputPlaceholder}">
          </div>
        </div>
      `;
    }).join('');
  }

  // 14. Isolated Excel Export (100% pure language headers)
  function exportSessionExcel(sessionId) {
    const session = allSessions.find(s => s.sessionId === sessionId);
    if (!session) {
      showToast('Session not found', 'error');
      return;
    }

    const dict = translations[currentLang];
    const sessionAttendees = session.attendees || [];
    if (sessionAttendees.length === 0) {
      showToast((currentLang === 'ar') ? `لا يوجد حضور مسجلون في دورة [${session.course}] لتصديرهم.` : `No attendees registered in [${session.course}] to export.`, 'error');
      return;
    }

    if (typeof XLSX === 'undefined') {
      showToast('SheetJS Excel library not loaded', 'error');
      return;
    }

    const headers = {
      idx: '#',
      empNo: dict.excelHeaderEmpNo,
      name: dict.excelHeaderName,
      gender: dict.excelHeaderGender,
      dept: dict.excelHeaderDept,
      job: dict.excelHeaderJob,
      grade: dict.excelHeaderGrade,
      course: dict.excelHeaderCourse,
      location: dict.excelHeaderLocation,
      trainer: dict.excelHeaderTrainer,
      date: dict.excelHeaderDate,
      time: dict.excelHeaderTime
    };

    const excelData = sessionAttendees.map((item, idx) => ({
      [headers.idx]: idx + 1,
      [headers.empNo]: item.empNumber,
      [headers.name]: item.name,
      [headers.gender]: (item.gender === 'Male') ? ((currentLang === 'ar') ? 'ذكر' : 'Male') : ((currentLang === 'ar') ? 'أنثى' : 'Female'),
      [headers.dept]: item.department,
      [headers.job]: item.jobTitle,
      [headers.grade]: item.grade,
      [headers.course]: session.course,
      [headers.location]: session.location,
      [headers.trainer]: session.trainer,
      [headers.date]: session.date,
      [headers.time]: item.displayTime || item.timestamp
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sanitizeSheetName(session.course));

    const fileName = `UNRWA_${session.date}_${sanitizeFileName(session.course)}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    showToast((currentLang === 'ar') ? `تم تصدير ملف إكسل الخاص بدورة [${session.course}] بنجاح.` : `Excel file downloaded for [${session.course}].`, 'success');
  }

  // 14. Dynamic Evaluation Excel Export (Sheet 1: Stats & Percentages | Sheet 2: Anonymous Responses)
  function exportEvaluationExcel(sessionId) {
    const session = allSessions.find(s => s.sessionId === sessionId);
    if (!session) {
      showToast('Session not found', 'error');
      return;
    }

    const dict = translations[currentLang];
    const evaluations = session.evaluations || [];
    if (evaluations.length === 0) {
      showToast((currentLang === 'ar')
        ? `لا توجد تقييمات مسجلة لدورة [${session.course}] حتى الآن.`
        : `No evaluations submitted for [${session.course}] yet.`, 'error');
      return;
    }

    if (typeof XLSX === 'undefined') {
      showToast('SheetJS Excel library not loaded', 'error');
      return;
    }

    const isAr = (currentLang === 'ar');

    function translateVal(v, qType) {
      if (!v) return isAr ? 'غير محدد' : 'N/A';
      const cleanKey = String(v).toLowerCase().trim().replace(/\s+/g, '_');
      if (qType === 'likert_5') {
        const likertMapAr = { '5': '5 - أوافق وبشدة', '4': '4 - موافق', '3': '3 - محايد', '2': '2 - غير موافق', '1': '1 - غير موافق وبشدة' };
        const likertMapEn = { '5': '5 - Strongly Agree', '4': '4 - Agree', '3': '3 - Neutral', '2': '2 - Disagree', '1': '1 - Strongly Disagree' };
        return (isAr ? likertMapAr[v] : likertMapEn[v]) || v;
      }
      if (qType === 'overall_5') {
        const overallMapAr = { '5': '5 - ممتاز', '4': '4 - جيد', '3': '3 - متوسط', '2': '2 - ضعيف', '1': '1 - ضعيف جداً' };
        const overallMapEn = { '5': '5 - Excellent', '4': '4 - Good', '3': '3 - Average', '2': '2 - Poor', '1': '1 - Very Poor' };
        return (isAr ? overallMapAr[v] : overallMapEn[v]) || v;
      }
      if (qType === 'relevance_5') {
        const relMapAr = { '5': '5 - ذو صلة وثيقة جداً', '4': '4 - ذو صلة', '3': '3 - غير متأكد', '2': '2 - ذو صلة جزئياً', '1': '1 - غير ذي صلة إطلاقاً' };
        const relMapEn = { '5': '5 - Highly relevant', '4': '4 - Relevant', '3': '3 - Unsure', '2': '2 - Partially relevant', '1': '1 - Not at all' };
        return (isAr ? relMapAr[v] : relMapEn[v]) || v;
      }
      if (qType === 'perform_3') {
        const perfMapAr = { 'yes': 'نعم، بالتأكيد سيساعدني', 'maybe': 'ربما، لست متأكداً', 'no': 'لا، لا أعتقد ذلك' };
        const perfMapEn = { 'yes': 'Yes, it definitely will.', 'maybe': 'Maybe, I am not sure.', 'no': 'No, I don’t think so.' };
        return (isAr ? perfMapAr[cleanKey] : perfMapEn[cleanKey]) || v;
      }
      const valMap = isAr ? {
        yes: 'نعم', somewhat: 'إلى حد ما', no: 'لا',
        excellent: 'ممتاز', very_good: 'جيد جداً', good: 'جيد', poor: 'ضعيف'
      } : {
        yes: 'Yes', somewhat: 'Somewhat', no: 'No',
        excellent: 'Excellent', very_good: 'Very Good', good: 'Good', poor: 'Poor'
      };
      return valMap[cleanKey] || v;
    }

    const activeQuestions = evalQuestions.filter(q => q.enabled !== false);
    const totalEvals = evaluations.length;

    function countChoice(qId, targetVal) {
      const targetClean = String(targetVal).toLowerCase().trim().replace(/\s+/g, '_');
      return evaluations.filter(e => {
        const r = (e.ratings && e.ratings[qId]) || e[qId] || '';
        return String(r).toLowerCase().trim().replace(/\s+/g, '_') === targetClean;
      }).length;
    }

    function calcPct(count) {
      return totalEvals > 0 ? Math.round((count / totalEvals) * 100) + '%' : '0%';
    }

    // High satisfaction rate across all 5-point questions (rated 4 or 5)
    let total5ptRatings = 0;
    let highSatCount = 0;
    activeQuestions.forEach(q => {
      if (q.type === 'likert_5' || q.type === 'overall_5' || q.type === 'relevance_5') {
        evaluations.forEach(e => {
          const val = (e.ratings && e.ratings[q.id]) || e[q.id];
          if (val) {
            total5ptRatings++;
            if (val === '5' || val === '4' || val === 5 || val === 4) {
              highSatCount++;
            }
          }
        });
      }
    });

    const highSatPct = total5ptRatings > 0 ? Math.round((highSatCount / total5ptRatings) * 100) + '%' : '0%';

    const c1 = isAr ? 'المؤشر / البيان' : 'Indicator / Metric';
    const c2 = isAr ? 'النتيجة / الإحصائية' : 'Result / Statistic';
    const c3 = isAr ? 'التفاصيل والنسب' : 'Details & Percentages';

    const sheet1Rows = [
      { [c1]: isAr ? 'نموذج الاستمارة' : 'Form Template', [c2]: isAr ? 'استمارة تقييم التدريب - المستوى الأول (للدورات أقل من 3 أيام)' : 'Learning Evaluation Form Level 1 (Under 3 days)', [c3]: 'UNRWA HR Standard' },
      { [c1]: isAr ? 'اسم الدورة التدريبية' : 'Course Title', [c2]: session.course, [c3]: '' },
      { [c1]: isAr ? 'مكان التدريب / المركز' : 'Venue / Center', [c2]: session.location, [c3]: '' },
      { [c1]: isAr ? 'اسم المدرب' : 'Trainer Name', [c2]: session.trainer, [c3]: '' },
      { [c1]: isAr ? 'تاريخ الدورة وتوقيتها' : 'Date & Timing', [c2]: `${session.date} (${session.time})`, [c3]: '' },
      { [c1]: isAr ? 'إجمالي التقييمات السرية المستلمة' : 'Total Anonymous Evaluations Received', [c2]: totalEvals, [c3]: isAr ? `${totalEvals} مقيّم (بدون هوية 100%)` : `${totalEvals} respondents (100% anonymous)` },
      { [c1]: isAr ? 'نسبة الرضا العام الكلية (أوافق وبشدة + موافق)' : 'Overall High Satisfaction Rate (Strongly Agree + Agree)', [c2]: highSatPct, [c3]: isAr ? `${highSatCount} إجابة إيجابية من أصل ${total5ptRatings}` : `${highSatCount} positive ratings of ${total5ptRatings}` },
      { [c1]: '', [c2]: '', [c3]: '' },
      { [c1]: isAr ? '--- مؤشرات ونسب الأسئلة المعتمدة في الاستمارة (21 سؤال) ---' : '--- Detailed Question Indicators Breakdown ---', [c2]: '', [c3]: '' }
    ];

    activeQuestions.forEach((q, qIndex) => {
      const qNum = qIndex + 1;
      const qText = isAr ? (q.textAr || q.textEn) : (q.textEn || q.textAr);

      if (q.type === 'likert_5') {
        const c5 = countChoice(q.id, '5');
        const c4 = countChoice(q.id, '4');
        const c3 = countChoice(q.id, '3');
        const c2 = countChoice(q.id, '2');
        const c1Val = countChoice(q.id, '1');
        const avgScore = totalEvals > 0 ? ((c5 * 5 + c4 * 4 + c3 * 3 + c2 * 2 + c1Val * 1) / totalEvals).toFixed(2) : '0.00';

        sheet1Rows.push({
          [c1]: `${qNum}. ${qText}`,
          [c2]: isAr ? `المتوسط: ${avgScore} / 5.0 (أوافق: ${calcPct(c5 + c4)})` : `Avg: ${avgScore} / 5.0 (Agree: ${calcPct(c5 + c4)})`,
          [c3]: isAr
            ? `أوافق وبشدة (5): ${c5} (${calcPct(c5)}) | موافق (4): ${c4} (${calcPct(c4)}) | محايد (3): ${c3} (${calcPct(c3)}) | غير موافق (2): ${c2} (${calcPct(c2)}) | غير موافق وبشدة (1): ${c1Val} (${calcPct(c1Val)})`
            : `Strongly Agree (5): ${c5} (${calcPct(c5)}) | Agree (4): ${c4} (${calcPct(c4)}) | Neutral (3): ${c3} (${calcPct(c3)}) | Disagree (2): ${c2} (${calcPct(c2)}) | Strongly Disagree (1): ${c1Val} (${calcPct(c1Val)})`
        });
      } else if (q.type === 'overall_5') {
        const c5 = countChoice(q.id, '5');
        const c4 = countChoice(q.id, '4');
        const c3 = countChoice(q.id, '3');
        const c2 = countChoice(q.id, '2');
        const c1Val = countChoice(q.id, '1');
        const avgScore = totalEvals > 0 ? ((c5 * 5 + c4 * 4 + c3 * 3 + c2 * 2 + c1Val * 1) / totalEvals).toFixed(2) : '0.00';

        sheet1Rows.push({
          [c1]: `${qNum}. ${qText}`,
          [c2]: isAr ? `المتوسط: ${avgScore} / 5.0 (ممتاز وجيد: ${calcPct(c5 + c4)})` : `Avg: ${avgScore} / 5.0 (Positive: ${calcPct(c5 + c4)})`,
          [c3]: isAr
            ? `ممتاز (5): ${c5} (${calcPct(c5)}) | جيد (4): ${c4} (${calcPct(c4)}) | متوسط (3): ${c3} (${calcPct(c3)}) | ضعيف (2): ${c2} (${calcPct(c2)}) | ضعيف جداً (1): ${c1Val} (${calcPct(c1Val)})`
            : `Excellent (5): ${c5} | Good (4): ${c4} | Average (3): ${c3} | Poor (2): ${c2} | Very Poor (1): ${c1Val}`
        });
      } else if (q.type === 'relevance_5') {
        const c5 = countChoice(q.id, '5');
        const c4 = countChoice(q.id, '4');
        const c3 = countChoice(q.id, '3');
        const c2 = countChoice(q.id, '2');
        const c1Val = countChoice(q.id, '1');
        const avgScore = totalEvals > 0 ? ((c5 * 5 + c4 * 4 + c3 * 3 + c2 * 2 + c1Val * 1) / totalEvals).toFixed(2) : '0.00';

        sheet1Rows.push({
          [c1]: `${qNum}. ${qText}`,
          [c2]: isAr ? `المتوسط: ${avgScore} / 5.0 (ذو صلة: ${calcPct(c5 + c4)})` : `Avg: ${avgScore} / 5.0 (Relevant: ${calcPct(c5 + c4)})`,
          [c3]: isAr
            ? `وثيقة جداً (5): ${c5} (${calcPct(c5)}) | صلة (4): ${c4} (${calcPct(c4)}) | غير متأكد (3): ${c3} (${calcPct(c3)}) | جزئياً (2): ${c2} (${calcPct(c2)}) | إطلاقاً (1): ${c1Val} (${calcPct(c1Val)})`
            : `Highly relevant (5): ${c5} | Relevant (4): ${c4} | Unsure (3): ${c3} | Partially (2): ${c2} | Not at all (1): ${c1Val}`
        });
      } else if (q.type === 'perform_3') {
        const yesC = countChoice(q.id, 'yes');
        const maybeC = countChoice(q.id, 'maybe');
        const noC = countChoice(q.id, 'no');
        sheet1Rows.push({
          [c1]: `${qNum}. ${qText}`,
          [c2]: isAr ? `نعم بالتأكيد: ${calcPct(yesC)}` : `Definitely: ${calcPct(yesC)}`,
          [c3]: isAr
            ? `نعم بالتأكيد: ${yesC} (${calcPct(yesC)}) | ربما/غير متأكد: ${maybeC} (${calcPct(maybeC)}) | لا أعتقد: ${noC} (${calcPct(noC)})`
            : `Definitely: ${yesC} (${calcPct(yesC)}) | Maybe: ${maybeC} (${calcPct(maybeC)}) | No: ${noC} (${calcPct(noC)})`
        });
      } else if (q.type === 'yes_somewhat_no') {
        const yesC = countChoice(q.id, 'yes');
        const swC = countChoice(q.id, 'somewhat');
        const noC = countChoice(q.id, 'no');
        sheet1Rows.push({
          [c1]: `${qNum}. ${qText}`,
          [c2]: isAr ? `نعم: ${calcPct(yesC)}` : `Yes: ${calcPct(yesC)}`,
          [c3]: isAr ? `نعم: ${yesC} (${calcPct(yesC)}) | إلى حد ما: ${swC} (${calcPct(swC)}) | لا: ${noC} (${calcPct(noC)})` : `Yes: ${yesC} | Somewhat: ${swC} | No: ${noC}`
        });
      } else if (q.type === 'yes_no') {
        const yesC = countChoice(q.id, 'yes');
        const noC = countChoice(q.id, 'no');
        sheet1Rows.push({
          [c1]: `${qNum}. ${qText}`,
          [c2]: isAr ? `نعم: ${calcPct(yesC)}` : `Yes: ${calcPct(yesC)}`,
          [c3]: isAr ? `نعم: ${yesC} (${calcPct(yesC)}) | لا: ${noC} (${calcPct(noC)})` : `Yes: ${yesC} | No: ${noC}`
        });
      } else if (q.type === 'rating_4') {
        const exC = countChoice(q.id, 'excellent');
        const vgC = countChoice(q.id, 'very_good');
        const gdC = countChoice(q.id, 'good');
        const prC = countChoice(q.id, 'poor');
        sheet1Rows.push({
          [c1]: `${qNum}. ${qText}`,
          [c2]: isAr ? `ممتاز وجيد جداً: ${calcPct(exC + vgC)}` : `Satisfaction: ${calcPct(exC + vgC)}`,
          [c3]: isAr ? `ممتاز: ${exC} (${calcPct(exC)}) | جيد جداً: ${vgC} (${calcPct(vgC)}) | جيد: ${gdC} (${calcPct(gdC)}) | ضعيف: ${prC} (${calcPct(prC)})` : `Excellent: ${exC} | Very Good: ${vgC} | Good: ${gdC} | Poor: ${prC}`
        });
      } else {
        const commentsCount = evaluations.filter(e => {
          const c = (e.ratings && e.ratings[q.id]) || e[q.id] || '';
          return c.trim().length > 0;
        }).length;
        sheet1Rows.push({
          [c1]: `${qNum}. ${qText}`,
          [c2]: isAr ? `${commentsCount} مقترح / ملاحظة` : `${commentsCount} comments submitted`,
          [c3]: isAr ? `نسبة المشاركة بالملاحظات: ${calcPct(commentsCount)}` : `Participation rate: ${calcPct(commentsCount)}`
        });
      }
    });

    // Sheet 2: Anonymous Responses (Dynamic columns per active question)
    const hIdx = isAr ? 'م' : '#';
    const hTime = isAr ? 'وقت التقييم' : 'Submission Time';

    const sheet2Rows = evaluations.map((item, index) => {
      const r = item.ratings || {};
      const respondentLabel = isAr ? `مقيّم سري رقم ${index + 1}` : `Respondent #${index + 1} (Anonymous)`;
      const displayTime = item.displayTime || (item.timestamp ? new Date(item.timestamp).toLocaleString() : '');

      const rowObj = {
        [hIdx]: respondentLabel,
        [hTime]: displayTime
      };

      activeQuestions.forEach((q, qIndex) => {
        const qNum = qIndex + 1;
        const qText = isAr ? (q.textAr || q.textEn) : (q.textEn || q.textAr);
        const colHeader = `${isAr ? 'س' : 'Q'}${qNum}: ${qText}`;
        const val = r[q.id] || item[q.id] || '';

        if (q.type === 'text') {
          rowObj[colHeader] = val || (isAr ? 'لا توجد ملاحظات' : 'No comments');
        } else {
          rowObj[colHeader] = translateVal(val, q.type);
        }
      });

      return rowObj;
    });

    const ws1 = XLSX.utils.json_to_sheet(sheet1Rows);
    const ws2 = XLSX.utils.json_to_sheet(sheet2Rows);
    const wb = XLSX.utils.book_new();

    const sheet1Title = isAr ? 'الإحصائيات والنسب العامة' : 'Stats & Summary';
    const sheet2Title = isAr ? 'إجابات المقيمين (مجهولة)' : 'Anonymous Responses';

    XLSX.utils.book_append_sheet(wb, ws1, sheet1Title);
    XLSX.utils.book_append_sheet(wb, ws2, sheet2Title);

    const fileName = `UNRWA_${session.date}_${sanitizeFileName(session.course)}_Evaluation.xlsx`;
    XLSX.writeFile(wb, fileName);

    showToast(isAr
      ? `تم تصدير ملف إكسل لتقييمات دورة [${session.course}] بنجاح (ورقتان: الإحصائيات + الإجابات).`
      : `Evaluation Excel exported for [${session.course}] (Summary + Responses).`,
      'success'
    );
  }

  // 15. Global Actions
  window.AttendTrackAdmin = {
    toggleFolder: function (sessionId) {
      const s = allSessions.find(item => item.sessionId === sessionId);
      if (s) {
        s.isExpanded = !s.isExpanded;
        const el = document.getElementById('folder_' + sessionId);
        if (el) el.classList.toggle('expanded', s.isExpanded);
      }
    },

    activateSessionQr: function (sessionId) {
      const s = allSessions.find(item => item.sessionId === sessionId);
      if (s) {
        activateSession(s);
        const dict = translations[currentLang];
        showToast((currentLang === 'ar') ? `تم تفعيل الرمز لدورة: ${s.course}` : `Active session switched to: ${s.course}`, 'info');
      }
    },

    exportSessionExcel: function (sessionId) {
      exportSessionExcel(sessionId);
    },

    exportEvaluationExcel: function (sessionId) {
      exportEvaluationExcel(sessionId);
    },

    toggleQuestionEnable: function (qId) {
      const q = evalQuestions.find(item => item.id === qId);
      if (q) {
        q.enabled = (q.enabled === false) ? true : false;
        renderQuestionsManagerList();
      }
    },

    deleteQuestion: function (qId) {
      const dict = translations[currentLang];
      if (confirm(dict.confirmDeleteQuestion)) {
        evalQuestions = evalQuestions.filter(item => item.id !== qId);
        renderQuestionsManagerList();
        showToast(dict.toastQuestionDeleted, 'info');
      }
    },

    updateQuestionText: function (qId, newText) {
      const q = evalQuestions.find(item => item.id === qId);
      if (q && newText.trim()) {
        if (currentLang === 'ar') {
          q.textAr = newText.trim();
        } else {
          q.textEn = newText.trim();
        }
      }
    },

    deleteAttendee: function (sessionId, attendeeId) {
      const dict = translations[currentLang];
      if (confirm(dict.confirmDeleteAttendee)) {
        const session = allSessions.find(s => s.sessionId === sessionId);
        if (session) {
          session.attendees = (session.attendees || []).filter(a => a.id !== attendeeId);
          saveLocalSessions();

          if (db) {
            db.ref('sessions/' + sessionId + '/attendees').once('value').then(snap => {
              snap.forEach(child => {
                if (child.val().id === attendeeId) {
                  child.ref.remove();
                }
              });
            });
          }

          renderSessionsAccordion();
          updateGlobalStats();
          showToast(dict.toastAttendeeDeleted, 'info');
        }
      }
    },

    deleteSession: function (sessionId) {
      const session = allSessions.find(s => s.sessionId === sessionId);
      const name = session ? session.course : '';
      const dict = translations[currentLang];

      if (confirm((currentLang === 'ar') ? `هل أنت متأكد من حذف دورة [${name}] بالكامل مع كافة سجلات الحضور؟` : `Are you sure you want to delete course [${name}] and all its attendee records?`)) {
        allSessions = allSessions.filter(s => s.sessionId !== sessionId);
        saveLocalSessions();

        if (db) {
          db.ref('sessions/' + sessionId).remove().catch(console.warn);
        }

        if (currentSession && currentSession.sessionId === sessionId) {
          currentSession = allSessions.length > 0 ? allSessions[0] : null;
          if (currentSession) {
            activateSession(currentSession);
          } else {
            localStorage.removeItem('attendtrack_active_session_v1');
            const placeholder = document.getElementById('qrStandbyPlaceholder');
            const content = document.getElementById('qrActiveContent');
            if (placeholder) placeholder.classList.remove('hidden');
            if (content) content.classList.add('hidden');
          }
        }

        renderSessionsAccordion();
        updateGlobalStats();
        showToast(dict.toastSessionDeleted, 'info');
      }
    }
  };

  // 15. Event Listeners Setup
  function initEventListeners() {
    const btnUpdate = document.getElementById('btnUpdateSession');
    if (btnUpdate) {
      btnUpdate.addEventListener('click', handleSessionConfigSubmit);
    }

    const courseSel = document.getElementById('courseSelect');
    const courseCustom = document.getElementById('courseCustomInput');
    if (courseSel && courseCustom) {
      courseSel.addEventListener('change', function () {
        if (this.value === '__custom__') {
          courseCustom.classList.remove('hidden');
          courseCustom.focus();
        } else {
          courseCustom.classList.add('hidden');
        }
      });
    }

    const locSel = document.getElementById('locationSelect');
    const locCustom = document.getElementById('locationCustomInput');
    if (locSel && locCustom) {
      locSel.addEventListener('change', function () {
        if (this.value === '__custom__') {
          locCustom.classList.remove('hidden');
          locCustom.focus();
        } else {
          locCustom.classList.add('hidden');
        }
      });
    }

    const btnLang = document.getElementById('langToggleBtn');
    if (btnLang) {
      btnLang.addEventListener('click', () => {
        applyLanguage(currentLang === 'en' ? 'ar' : 'en');
      });
    }

    const btnClearAll = document.getElementById('btnClearAllSessions');
    if (btnClearAll) {
      btnClearAll.addEventListener('click', () => {
        const dict = translations[currentLang];
        if (confirm(dict.confirmClearArchive)) {
          allSessions = [];
          currentSession = null;
          saveLocalSessions();
          localStorage.removeItem('attendtrack_active_session_v1');

          if (db) {
            db.ref('sessions').remove().catch(console.warn);
            db.ref('active_session').remove().catch(console.warn);
          }

          const placeholder = document.getElementById('qrStandbyPlaceholder');
          const content = document.getElementById('qrActiveContent');
          if (placeholder) placeholder.classList.remove('hidden');
          if (content) content.classList.add('hidden');

          renderSessionsAccordion();
          updateGlobalStats();
          showToast(dict.toastArchiveCleared, 'info');
        }
      });
    }

    const searchInput = document.getElementById('archiveSearch');
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        renderSessionsAccordion(this.value);
      });
    }

    const btnCopy = document.getElementById('btnCopyCheckinLink');
    if (btnCopy) {
      btnCopy.addEventListener('click', () => {
        const link = (currentQrMode === 'evaluation') ? generateEvalUrl() : generateCheckinUrl();
        const dict = translations[currentLang];
        navigator.clipboard.writeText(link).then(() => {
          showToast((currentQrMode === 'evaluation') ? dict.toastEvalLinkCopied : dict.toastLinkCopied, 'success');
        }).catch(() => {
          showToast(link, 'info');
        });
      });
    }

    const btnTest = document.getElementById('btnTestMobileView');
    if (btnTest) {
      btnTest.addEventListener('click', () => {
        const link = (currentQrMode === 'evaluation') ? generateEvalUrl() : generateCheckinUrl();
        window.open(link, '_blank');
      });
    }

    const tabAttendance = document.getElementById('tabModeAttendance');
    const tabEvaluation = document.getElementById('tabModeEvaluation');
    if (tabAttendance && tabEvaluation) {
      tabAttendance.addEventListener('click', () => {
        currentQrMode = 'attendance';
        tabAttendance.classList.add('active');
        tabEvaluation.classList.remove('active');
        renderQrCodes();
      });

      tabEvaluation.addEventListener('click', () => {
        currentQrMode = 'evaluation';
        tabEvaluation.classList.add('active');
        tabAttendance.classList.remove('active');
        renderQrCodes();
      });
    }

    // Questions Manager Modal Setup
    const btnOpenQM = document.getElementById('btnOpenQuestionsModal');
    const btnHeaderQM = document.getElementById('btnHeaderQuestionsManager');
    const modalQM = document.getElementById('questionsManagerModal');
    const btnCloseQM = document.getElementById('btnCloseQuestionsModal');
    const btnCloseQMBottom = document.getElementById('btnCloseQuestionsModalBottom');
    const btnAddQ = document.getElementById('btnAddQuestionSubmit');
    const btnSaveQ = document.getElementById('btnSaveQuestionsConfig');
    const btnResetQ = document.getElementById('btnResetDefaultQuestions');

    function openQuestionsModal() {
      if (!modalQM) return;
      populateQuestionsManagerDropdowns(currentLang);
      modalQM.classList.remove('hidden');
      renderQuestionsManagerList();
    }

    if (btnOpenQM) btnOpenQM.addEventListener('click', openQuestionsModal);
    if (btnHeaderQM) btnHeaderQM.addEventListener('click', openQuestionsModal);

    if (btnCloseQM && modalQM) {
      btnCloseQM.addEventListener('click', () => {
        modalQM.classList.add('hidden');
      });
    }
    if (btnCloseQMBottom && modalQM) {
      btnCloseQMBottom.addEventListener('click', () => {
        modalQM.classList.add('hidden');
      });
    }

    if (modalQM) {
      modalQM.addEventListener('click', (e) => {
        if (e.target === modalQM) {
          modalQM.classList.add('hidden');
        }
      });
    }

    if (btnAddQ) {
      btnAddQ.addEventListener('click', () => {
        const sec = parseInt(document.getElementById('qmNewSection').value) || 1;
        const type = document.getElementById('qmNewType').value;
        const textInput = document.getElementById('qmNewTextAr');
        const textVal = textInput ? textInput.value.trim() : '';

        const dict = translations[currentLang];
        if (!textVal) {
          showToast(dict.toastQuestionTextRequired, 'error');
          return;
        }

        const newQ = {
          id: 'q_' + Date.now(),
          section: sec,
          type: type,
          textAr: textVal,
          textEn: textVal,
          enabled: true
        };

        evalQuestions.push(newQ);
        if (textInput) textInput.value = '';
        renderQuestionsManagerList();
        showToast(dict.toastQuestionAdded, 'info');
      });
    }

    if (btnSaveQ) {
      btnSaveQ.addEventListener('click', () => {
        try {
          localStorage.setItem('attendtrack_eval_questions_v2', JSON.stringify(evalQuestions));
        } catch (e) {
          console.warn(e);
        }

        if (db) {
          db.ref('settings/eval_questions_v2').set(evalQuestions).catch(console.warn);
        }

        const dict = translations[currentLang];
        showToast(dict.toastQuestionsSaved, 'success');
        if (modalQM) modalQM.classList.add('hidden');
      });
    }

    if (btnResetQ) {
      btnResetQ.addEventListener('click', () => {
        const dict = translations[currentLang];
        if (confirm(dict.confirmResetQuestions)) {
          evalQuestions = JSON.parse(JSON.stringify(DEFAULT_EVAL_QUESTIONS));
          try {
            localStorage.setItem('attendtrack_eval_questions_v2', JSON.stringify(evalQuestions));
          } catch (e) {
            console.warn(e);
          }

          if (db) {
            db.ref('settings/eval_questions_v2').set(evalQuestions).catch(console.warn);
          }

          renderQuestionsManagerList();
          showToast(dict.toastQuestionsReset, 'success');
        }
      });
    }

    const btnProj = document.getElementById('btnOpenProjector');
    const modalProj = document.getElementById('projectorModal');
    const btnCloseProj = document.getElementById('btnCloseProjector');
    if (btnProj && modalProj) {
      btnProj.addEventListener('click', () => {
        modalProj.classList.remove('hidden');
        renderQrCodes();
      });
    }
    if (btnCloseProj && modalProj) {
      btnCloseProj.addEventListener('click', () => {
        modalProj.classList.add('hidden');
      });
    }

    const btnFlyer = document.getElementById('btnPrintFlyer');
    const modalFlyer = document.getElementById('printFlyerModal');
    const btnCloseFlyer = document.getElementById('btnClosePrintFlyer');
    const btnExecPrint = document.getElementById('btnExecutePrint');
    if (btnFlyer && modalFlyer) {
      btnFlyer.addEventListener('click', () => {
        modalFlyer.classList.remove('hidden');
        renderQrCodes();
      });
    }
    if (btnCloseFlyer && modalFlyer) {
      btnCloseFlyer.addEventListener('click', () => {
        modalFlyer.classList.add('hidden');
      });
    }
    if (btnExecPrint) {
      btnExecPrint.addEventListener('click', () => {
        window.print();
      });
    }

    const btnToggleHost = document.getElementById('btnToggleHostEdit');
    const hostEditForm = document.getElementById('hostEditForm');
    const customHostInput = document.getElementById('customHostInput');
    const btnSaveHost = document.getElementById('btnSaveHost');
    const btnResetHost = document.getElementById('btnResetHost');

    if (btnToggleHost && hostEditForm) {
      btnToggleHost.addEventListener('click', () => {
        hostEditForm.classList.toggle('hidden');
        if (customHostInput) customHostInput.value = getBaseHostUrl();
      });
    }
    if (btnSaveHost && customHostInput) {
      btnSaveHost.addEventListener('click', () => {
        const val = customHostInput.value.trim();
        const dict = translations[currentLang];
        if (val) {
          localStorage.setItem('attendtrack_custom_host_v1', val);
          hostEditForm.classList.add('hidden');
          renderQrCodes();
          showToast(dict.toastHostUpdated, 'success');
        }
      });
    }
    if (btnResetHost) {
      btnResetHost.addEventListener('click', () => {
        const dict = translations[currentLang];
        localStorage.removeItem('attendtrack_custom_host_v1');
        hostEditForm.classList.add('hidden');
        renderQrCodes();
        showToast(dict.toastHostReset, 'info');
      });
    }
  }

  function handleSessionConfigSubmit() {
    const courseSel = document.getElementById('courseSelect');
    const courseCustom = document.getElementById('courseCustomInput');
    const trainerInput = document.getElementById('trainerInput');
    const locSel = document.getElementById('locationSelect');
    const locCustom = document.getElementById('locationCustomInput');
    const dateInput = document.getElementById('sessionDate');
    const timeInput = document.getElementById('sessionTime');

    let course = courseSel ? courseSel.value : '';
    if (course === '__custom__' && courseCustom) course = courseCustom.value.trim();

    const trainer = trainerInput ? trainerInput.value.trim() : '';

    let location = locSel ? locSel.value : '';
    if (location === '__custom__' && locCustom) location = locCustom.value.trim();

    const date = dateInput ? dateInput.value : '';
    const time = timeInput ? timeInput.value.trim() : '';

    if (!course || course === '__custom__') {
      showToast((currentLang === 'ar') ? 'يرجى اختيار اسم الدورة التدريبية.' : 'Please select Course Name.', 'error');
      return;
    }
    if (!trainer) {
      showToast((currentLang === 'ar') ? 'يرجى كتابة اسم المدرب.' : 'Please enter Trainer Name.', 'error');
      return;
    }
    if (!location || location === '__custom__') {
      showToast((currentLang === 'ar') ? 'يرجى تحديد مكان التدريب.' : 'Please select Venue / Location.', 'error');
      return;
    }
    if (!date) {
      showToast((currentLang === 'ar') ? 'يرجى تحديد تاريخ الجلسة.' : 'Please select Date.', 'error');
      return;
    }
    if (!time) {
      showToast((currentLang === 'ar') ? 'يرجى إدخال توقيت الجلسة.' : 'Please enter Timing.', 'error');
      return;
    }

    const sessionId = 'session_' + encodeURIComponent((course + '_' + date).replace(/[^a-zA-Z0-9]/g, '_'));

    const sessionObj = {
      course: course,
      trainer: trainer,
      location: location,
      date: date,
      time: time,
      sessionId: sessionId
    };

    activateSession(sessionObj);
    const dict = translations[currentLang];
    showToast((currentLang === 'ar') ? `تم تفعيل دورة [${course}] بنجاح.` : `Session [${course}] activated successfully.`, 'success');
  }

  function showToast(msg, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <i class="fa-solid ${type === 'success' ? 'fa-circle-check' : type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-info'}"></i>
      <span>${msg}</span>
    `;
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 400);
    }, 4000);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, function (m) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
    });
  }

  function sanitizeFileName(str) {
    return str.replace(/[^a-zA-Z0-9-_]/g, '_').substring(0, 30);
  }

  function sanitizeSheetName(str) {
    return str.replace(/[\\/*?:[\]]/g, '_').substring(0, 31);
  }

  // Initialize Page
  document.addEventListener('DOMContentLoaded', () => {
    const dateInput = document.getElementById('sessionDate');
    if (dateInput && !dateInput.value) {
      dateInput.value = new Date().toISOString().split('T')[0];
    }

    initEventListeners();
    applyLanguage(currentLang);

    const savedSessions = localStorage.getItem('attendtrack_all_sessions_v2');
    if (savedSessions) {
      try {
        allSessions = JSON.parse(savedSessions);
      } catch (e) {
        console.warn(e);
      }
    }

    try {
      const localEvals = JSON.parse(localStorage.getItem('attendtrack_local_evaluations_v1') || '{}');
      allSessions.forEach(s => {
        if (!s.evaluations || s.evaluations.length === 0) {
          if (localEvals[s.sessionId]) {
            s.evaluations = localEvals[s.sessionId];
          }
        }
      });
    } catch (e) {
      console.warn(e);
    }

    currentSession = null;
    const placeholder = document.getElementById('qrStandbyPlaceholder');
    const content = document.getElementById('qrActiveContent');
    const statusPill = document.getElementById('qrLiveStatus');
    const statusText = document.getElementById('qrStatusText');
    const dict = translations[currentLang];

    if (placeholder) placeholder.classList.remove('hidden');
    if (content) content.classList.add('hidden');
    if (statusPill) statusPill.className = 'status-pill';
    if (statusText) statusText.textContent = dict.statusStandby;

    const sessionForm = document.getElementById('sessionForm');
    if (sessionForm) sessionForm.reset();

    renderSessionsAccordion();
    updateGlobalStats();
    initRealtimeFirebaseSync();
    loadEvalQuestions();
  });

})();
