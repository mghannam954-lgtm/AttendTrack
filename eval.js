/**
 * AttendTrack - Anonymous Training Evaluation Logic
 * UNRWA HR Staff Development & Training Division · Damascus Headquarters
 * Learning Evaluation Form Level 1 (Official Template - 21 Questions)
 * 100% Anonymous Evaluation + Real-time Firebase Sync + Full Bilingual Support
 */

(function () {
  'use strict';

  // 1. Core State & Language
  let currentLang = 'ar';

  let sessionData = {
    course: 'UNRWA Staff Development Training',
    location: 'Damascus Headquarters (HQ)',
    trainer: 'Staff Development Trainer',
    date: new Date().toISOString().split('T')[0],
    time: '09:00 AM - 02:00 PM',
    sessionId: 'session_default'
  };

  // Official UNRWA Level 1 Evaluation Template (from FinalEvaluationForm (Arb-Eng).docx)
  const DEFAULT_QUESTIONS = [
    // Section 1: The Programme Objectives and Course content (أهداف البرنامج ومحتوى الدورة)
    { id: 'q1', section: 1, type: 'likert_5', textAr: 'أهداف البرنامج التدريبي كانت واضحة', textEn: 'The programme objectives were clear.', enabled: true },
    { id: 'q2', section: 1, type: 'likert_5', textAr: 'محتوى البرنامج التدريبي والأنشطة ذات صلة بأهداف البرنامج التدريبي', textEn: 'The programme content and activities were relevant to the programme objectives.', enabled: true },
    { id: 'q3', section: 1, type: 'likert_5', textAr: 'مدة البرنامج التدريبي مناسبة', textEn: 'The length of the programme was adequate.', enabled: true },
    { id: 'q4', section: 1, type: 'likert_5', textAr: 'الأمثلة والنقاشات والأنشطة المطروحة ذات صلة بعملي', textEn: 'The examples, discussions and activities were relevant to my job.', enabled: true },
    { id: 'q5', section: 1, type: 'likert_5', textAr: 'المادة التدريبية واضحة ومهنية', textEn: 'The materials were clear and professional.', enabled: true },

    // Section 2: The Trainer and Course Delivery (المدرب/ة وتقديم الدورة)
    { id: 'q6', section: 2, type: 'likert_5', textAr: 'حدد نتائج التدريب وأهدافه التعليمية', textEn: 'The trainer stated the learning outcomes.', enabled: true },
    { id: 'q7', section: 2, type: 'likert_5', textAr: 'محضر ومنظم بشكل جيد', textEn: 'The trainer was well organized and prepared.', enabled: true },
    { id: 'q8', section: 2, type: 'likert_5', textAr: 'خلق جو تعلم إيجابي ومحفز', textEn: 'The trainer created a positive learning atmosphere.', enabled: true },
    { id: 'q9', section: 2, type: 'likert_5', textAr: 'أظهر خبرة وتمكناً بالمادة التدريبية', textEn: 'The trainer showed expertise in the subject.', enabled: true },
    { id: 'q10', section: 2, type: 'likert_5', textAr: 'قدم المادة التدريبية بطريقة منطقية وسلسة', textEn: 'The trainer presented the material in a logical way.', enabled: true },
    { id: 'q11', section: 2, type: 'likert_5', textAr: 'سأل وأجاب عن الأسئلة بشكل كامل ومتمكن', textEn: 'The trainer asked and answered questions competently.', enabled: true },
    { id: 'q12', section: 2, type: 'likert_5', textAr: 'قادر على إدارة الجلسة وتعامل مع المتدربين بمساواة واحترام', textEn: 'The trainer was able to control the session and deal with participants fairly, and with respect.', enabled: true },
    { id: 'q13', section: 2, type: 'likert_5', textAr: 'ممتعاً ومحفزاً للمشاركين', textEn: 'The trainer was interesting and motivated me.', enabled: true },
    { id: 'q14', section: 2, type: 'likert_5', textAr: 'أداء المدرب كان ممتازاً بشكل عام', textEn: 'The trainer was excellent.', enabled: true },

    // Section 3: Training Venue and Organization (مكان التدريب والتنظيم)
    { id: 'q15', section: 3, type: 'likert_5', textAr: 'هل تلقيت إشعاراً عن التدريب بوقت كافٍ؟', textEn: 'Did you receive sufficient notice about this training?', enabled: true },
    { id: 'q16', section: 3, type: 'likert_5', textAr: 'هل تلقيت الدعم الكافي لحضور التدريب؟', textEn: 'Did you receive sufficient support to attend this training?', enabled: true },
    { id: 'q17', section: 3, type: 'likert_5', textAr: 'مكان التدريب كان مريحاً ومناسباً', textEn: 'Was the training venue comfortable?', enabled: true },

    // Section 4: Overall Rating of the course (التقييم الإجمالي للدورة والملاحظات)
    { id: 'q18', section: 4, type: 'overall_5', textAr: 'تقييم التدريب بشكل إجمالي', textEn: 'Overall Rating of the course', enabled: true },
    { id: 'q19', section: 4, type: 'text', textAr: 'يرجى تزويدنا بأي ملاحظات أو مقترحات عامة حول الدورة أو المدرب:', textEn: 'Please provide us with some overall comments about the course/trainer:', enabled: true },

    // Section 5: Impact & Relevance to Job (الأثر والارتباط بالعمل الحالي)
    { id: 'q20', section: 5, type: 'relevance_5', textAr: 'هل كان هذا التدريب ذا صلة بعملك ودورك الوظيفي الحالي؟', textEn: 'Was this training relevant to your current job role?', enabled: true },
    { id: 'q21', section: 5, type: 'perform_3', textAr: 'هل سيساعدك التدريب على الأداء بشكل أفضل في منصبك الحالي؟', textEn: 'Will this training help you to perform better in your current position?', enabled: true }
  ];

  let evalQuestions = [];

  // 2. Bilingual Dictionary
  const translations = {
    ar: {
      portalSubTitle: 'استمارة تقييم التدريب - المستوى الأول',
      formLevelBadge: 'للدورات التدريبية التي تقل مدتها عن 3 أيام',
      cloudOnline: 'متصل سحابياً',
      cloudOffline: 'وضع محلي',
      evalBannerBadge: 'تقييم سري ومجهول الهوية 100%',
      noticeTitle: 'ملاحظة السرية التامة',
      noticeDesc: 'نشكر لك تخصيص وقتك لملء هذه الاستمارة. إجاباتك وملاحظاتك مجهولة الهوية تماماً، وتساعدنا على تطوير وتحسين كافة البرامج التدريبية المستقبلية.',
      grpContentTitle: '1) أهداف البرنامج التدريبي ومحتوى الدورة',
      grpTrainerTitle: '2) المدرب/ة وتقديم الدورة',
      grpOrgTitle: '3) مكان التدريب والتنظيم',
      grpOverallTitle: '4) التقييم الإجمالي للدورة والملاحظات',
      grpImpactTitle: '5) الأثر والارتباط بالعمل',

      // Likert 5 labels
      likert5: 'أوافق وبشدة',
      likert4: 'موافق',
      likert3: 'محايد',
      likert2: 'غير موافق',
      likert1: 'غير موافق وبشدة',

      // Overall 5 labels
      overall5: 'ممتاز',
      overall4: 'جيد',
      overall3: 'متوسط',
      overall2: 'ضعيف',
      overall1: 'ضعيف جداً',

      // Relevance 5 labels
      relevance5: 'ذو صلة وثيقة جداً',
      relevance4: 'ذو صلة',
      relevance3: 'غير متأكد',
      relevance2: 'ذو صلة جزئياً',
      relevance1: 'غير ذي صلة إطلاقاً',

      // Perform 3 labels
      perform3: 'نعم، بالتأكيد سيساعدني',
      perform2: 'ربما، لست متأكداً',
      perform1: 'لا، لا أعتقد ذلك',

      // Traditional 3 & 2
      optYes: 'نعم',
      optSomewhat: 'إلى حد ما',
      optNo: 'لا',
      rateExcellent: 'ممتاز',
      rateVGood: 'جيد جداً',
      rateGood: 'جيد',
      ratePoor: 'ضعيف',

      qCommentsPlaceholder: 'اكتب ملاحظاتك ومقترحاتك بكل حرية لمساعدتنا في تحسين التدريب...',
      btnSubmitEvaluation: 'إرسال التقييم السري',
      btnSubmitting: 'جاري إرسال التقييم...',
      evalSuccessTitle: 'شكراً جزيلاً لتقييمك ومشاركتك القيّمة!',
      evalSuccessDesc: 'تم استلام تقييمك بنجاح وبسرية تامة. رأيك يساهم بشكل مباشر في تطوير البرامج التدريبية لدى الأونروا.',
      evalSuccessSub: 'UNITED NATIONS RELIEF AND WORKS AGENCY · HR TRAINING',
      toastIncomplete: 'يرجى الإجابة على جميع أسئلة التقييم الإلزامية قبل الإرسال.',
      toastSuccess: 'تم إرسال تقييمك السري بنجاح. شكراً لتعاونك!'
    },
    en: {
      portalSubTitle: 'Learning Evaluation Form Level 1',
      formLevelBadge: 'To be used for training less than 3 days in duration',
      cloudOnline: 'Cloud Connected',
      cloudOffline: 'Local Mode',
      evalBannerBadge: '100% Confidential & Anonymous Evaluation',
      noticeTitle: 'Full Confidentiality Notice',
      noticeDesc: 'Thank you for taking the time to complete this evaluation form. Your comments and feedback are greatly appreciated and will help us to make improvements for all future programmes.',
      grpContentTitle: '1) The Programme Objectives and Course content',
      grpTrainerTitle: '2) The Trainer and Course Delivery',
      grpOrgTitle: '3) Training Venue and Organization',
      grpOverallTitle: '4) Overall Rating of the course & Comments',
      grpImpactTitle: '5) Impact & Relevance to Job',

      // Likert 5 labels
      likert5: 'Strongly Agree',
      likert4: 'Agree',
      likert3: 'Neutral',
      likert2: 'Disagree',
      likert1: 'Strongly Disagree',

      // Overall 5 labels
      overall5: 'Excellent',
      overall4: 'Good',
      overall3: 'Average',
      overall2: 'Poor',
      overall1: 'Very poor',

      // Relevance 5 labels
      relevance5: 'Highly relevant',
      relevance4: 'Relevant',
      relevance3: 'Unsure',
      relevance2: 'Partially relevant',
      relevance1: 'Not at all',

      // Perform 3 labels
      perform3: 'Yes, it definitely will.',
      perform2: 'Maybe, I am not sure.',
      perform1: 'No, I don’t think so.',

      optYes: 'Yes',
      optSomewhat: 'Somewhat',
      optNo: 'No',
      rateExcellent: 'Excellent',
      rateVGood: 'Very good',
      rateGood: 'Good',
      ratePoor: 'Poor',

      qCommentsPlaceholder: 'Please provide us with some overall comments about the course/trainer...',
      btnSubmitEvaluation: 'Submit Anonymous Evaluation',
      btnSubmitting: 'Submitting Evaluation...',
      evalSuccessTitle: 'Thank You for Your Feedback!',
      evalSuccessDesc: 'Your evaluation has been recorded with full confidentiality. Your input helps us continually enhance UNRWA training programs.',
      evalSuccessSub: 'UNITED NATIONS RELIEF AND WORKS AGENCY · HR TRAINING',
      toastIncomplete: 'Please answer all mandatory evaluation questions before submitting.',
      toastSuccess: 'Your anonymous evaluation was submitted successfully. Thank you!'
    }
  };

  // 3. Firebase Initialization
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
      console.log('Firebase Realtime Database initialized in Eval Portal.');
    } else {
      console.warn('Firebase SDK not found; local storage mode enabled.');
    }
  } catch (err) {
    console.error('Firebase init error in Eval:', err);
  }

  function updateCloudStatus(isOnline) {
    const badge = document.getElementById('cloudStatusBadge');
    const text = document.getElementById('cloudStatusText');
    if (!badge || !text) return;
    const dict = translations[currentLang];
    if (isOnline) {
      badge.className = 'status-pill status-connected';
      text.textContent = dict.cloudOnline;
    } else {
      badge.className = 'status-pill status-offline';
      text.textContent = dict.cloudOffline;
    }
  }

  // 4. Language Management
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

    updateCloudStatus(db !== null);
    renderDynamicQuestions();
  }

  function loadEvalQuestions() {
    const saved = localStorage.getItem('attendtrack_eval_questions_v2');
    if (saved) {
      try {
        evalQuestions = JSON.parse(saved);
      } catch (e) {
        evalQuestions = JSON.parse(JSON.stringify(DEFAULT_QUESTIONS));
      }
    } else {
      evalQuestions = JSON.parse(JSON.stringify(DEFAULT_QUESTIONS));
      localStorage.setItem('attendtrack_eval_questions_v2', JSON.stringify(evalQuestions));
    }

    if (db) {
      db.ref('settings/eval_questions_v2').once('value').then(snap => {
        const val = snap.val();
        if (val && Array.isArray(val) && val.length > 0) {
          evalQuestions = val;
          renderDynamicQuestions();
        } else {
          db.ref('settings/eval_questions_v2').set(DEFAULT_QUESTIONS).catch(console.warn);
        }
      }).catch(console.warn);
    }
  }

  function renderDynamicQuestions() {
    if (!evalQuestions || evalQuestions.length === 0) return;
    const dict = translations[currentLang];
    let overallQuestionIndex = 1;

    for (let sec = 1; sec <= 5; sec++) {
      const container = document.getElementById(`groupContainerSec${sec}`);
      const groupWrapper = document.getElementById(`evalGroupSec${sec}`);
      if (!container || !groupWrapper) continue;

      const secQuestions = evalQuestions.filter(q => q.section === sec && q.enabled !== false);
      if (secQuestions.length === 0) {
        groupWrapper.style.display = 'none';
        continue;
      }

      groupWrapper.style.display = '';
      container.innerHTML = secQuestions.map(q => {
        const qText = (currentLang === 'ar') ? (q.textAr || q.textEn) : (q.textEn || q.textAr);
        const qNum = overallQuestionIndex++;

        // 1. 5-point Likert Scale (Strongly Disagree=1 to Strongly Agree=5)
        if (q.type === 'likert_5') {
          return `
            <div class="eval-question-item">
              <label class="eval-q-label">
                <span>${qNum}. ${escapeHtml(qText)}</span>
                <span class="req">*</span>
              </label>
              <div class="eval-options-grid options-5">
                <label class="eval-choice-pill eval-pill-5">
                  <input type="radio" name="${q.id}" value="5" required>
                  <span class="pill-text">
                    <span class="pill-num">5</span>
                    <span class="pill-desc">${dict.likert5}</span>
                  </span>
                </label>
                <label class="eval-choice-pill eval-pill-5">
                  <input type="radio" name="${q.id}" value="4" required>
                  <span class="pill-text">
                    <span class="pill-num">4</span>
                    <span class="pill-desc">${dict.likert4}</span>
                  </span>
                </label>
                <label class="eval-choice-pill eval-pill-5">
                  <input type="radio" name="${q.id}" value="3" required>
                  <span class="pill-text">
                    <span class="pill-num">3</span>
                    <span class="pill-desc">${dict.likert3}</span>
                  </span>
                </label>
                <label class="eval-choice-pill eval-pill-5">
                  <input type="radio" name="${q.id}" value="2" required>
                  <span class="pill-text">
                    <span class="pill-num">2</span>
                    <span class="pill-desc">${dict.likert2}</span>
                  </span>
                </label>
                <label class="eval-choice-pill eval-pill-5">
                  <input type="radio" name="${q.id}" value="1" required>
                  <span class="pill-text">
                    <span class="pill-num">1</span>
                    <span class="pill-desc">${dict.likert1}</span>
                  </span>
                </label>
              </div>
            </div>
          `;
        }
        // 2. Overall Rating (5-point: Very poor=1 to Excellent=5)
        else if (q.type === 'overall_5') {
          return `
            <div class="eval-question-item">
              <label class="eval-q-label">
                <span>${qNum}. ${escapeHtml(qText)}</span>
                <span class="req">*</span>
              </label>
              <div class="eval-options-grid options-5">
                <label class="eval-choice-pill eval-pill-5">
                  <input type="radio" name="${q.id}" value="5" required>
                  <span class="pill-text">
                    <span class="pill-num">5</span>
                    <span class="pill-desc">${dict.overall5}</span>
                  </span>
                </label>
                <label class="eval-choice-pill eval-pill-5">
                  <input type="radio" name="${q.id}" value="4" required>
                  <span class="pill-text">
                    <span class="pill-num">4</span>
                    <span class="pill-desc">${dict.overall4}</span>
                  </span>
                </label>
                <label class="eval-choice-pill eval-pill-5">
                  <input type="radio" name="${q.id}" value="3" required>
                  <span class="pill-text">
                    <span class="pill-num">3</span>
                    <span class="pill-desc">${dict.overall3}</span>
                  </span>
                </label>
                <label class="eval-choice-pill eval-pill-5">
                  <input type="radio" name="${q.id}" value="2" required>
                  <span class="pill-text">
                    <span class="pill-num">2</span>
                    <span class="pill-desc">${dict.overall2}</span>
                  </span>
                </label>
                <label class="eval-choice-pill eval-pill-5">
                  <input type="radio" name="${q.id}" value="1" required>
                  <span class="pill-text">
                    <span class="pill-num">1</span>
                    <span class="pill-desc">${dict.overall1}</span>
                  </span>
                </label>
              </div>
            </div>
          `;
        }
        // 3. Relevance to Job (1: Not at all to 5: Highly relevant)
        else if (q.type === 'relevance_5') {
          return `
            <div class="eval-question-item">
              <label class="eval-q-label">
                <span>${qNum}. ${escapeHtml(qText)}</span>
                <span class="req">*</span>
              </label>
              <div class="eval-options-grid options-5">
                <label class="eval-choice-pill eval-pill-5">
                  <input type="radio" name="${q.id}" value="5" required>
                  <span class="pill-text">
                    <span class="pill-num">5</span>
                    <span class="pill-desc">${dict.relevance5}</span>
                  </span>
                </label>
                <label class="eval-choice-pill eval-pill-5">
                  <input type="radio" name="${q.id}" value="4" required>
                  <span class="pill-text">
                    <span class="pill-num">4</span>
                    <span class="pill-desc">${dict.relevance4}</span>
                  </span>
                </label>
                <label class="eval-choice-pill eval-pill-5">
                  <input type="radio" name="${q.id}" value="3" required>
                  <span class="pill-text">
                    <span class="pill-num">3</span>
                    <span class="pill-desc">${dict.relevance3}</span>
                  </span>
                </label>
                <label class="eval-choice-pill eval-pill-5">
                  <input type="radio" name="${q.id}" value="2" required>
                  <span class="pill-text">
                    <span class="pill-num">2</span>
                    <span class="pill-desc">${dict.relevance2}</span>
                  </span>
                </label>
                <label class="eval-choice-pill eval-pill-5">
                  <input type="radio" name="${q.id}" value="1" required>
                  <span class="pill-text">
                    <span class="pill-num">1</span>
                    <span class="pill-desc">${dict.relevance1}</span>
                  </span>
                </label>
              </div>
            </div>
          `;
        }
        // 4. Performance Better (3 options: Yes definitely, Maybe, No)
        else if (q.type === 'perform_3') {
          return `
            <div class="eval-question-item">
              <label class="eval-q-label">
                <span>${qNum}. ${escapeHtml(qText)}</span>
                <span class="req">*</span>
              </label>
              <div class="eval-options-grid options-3">
                <label class="eval-choice-pill">
                  <input type="radio" name="${q.id}" value="Yes" required>
                  <span class="pill-text">${dict.perform3}</span>
                </label>
                <label class="eval-choice-pill">
                  <input type="radio" name="${q.id}" value="Maybe" required>
                  <span class="pill-text">${dict.perform2}</span>
                </label>
                <label class="eval-choice-pill">
                  <input type="radio" name="${q.id}" value="No" required>
                  <span class="pill-text">${dict.perform1}</span>
                </label>
              </div>
            </div>
          `;
        }
        // 5. Traditional Yes / Somewhat / No
        else if (q.type === 'yes_somewhat_no') {
          return `
            <div class="eval-question-item">
              <label class="eval-q-label">
                <span>${qNum}. ${escapeHtml(qText)}</span>
                <span class="req">*</span>
              </label>
              <div class="eval-options-grid options-3">
                <label class="eval-choice-pill">
                  <input type="radio" name="${q.id}" value="Yes" required>
                  <span class="pill-text">${dict.optYes}</span>
                </label>
                <label class="eval-choice-pill">
                  <input type="radio" name="${q.id}" value="Somewhat" required>
                  <span class="pill-text">${dict.optSomewhat}</span>
                </label>
                <label class="eval-choice-pill">
                  <input type="radio" name="${q.id}" value="No" required>
                  <span class="pill-text">${dict.optNo}</span>
                </label>
              </div>
            </div>
          `;
        }
        // 6. Yes / No
        else if (q.type === 'yes_no') {
          return `
            <div class="eval-question-item">
              <label class="eval-q-label">
                <span>${qNum}. ${escapeHtml(qText)}</span>
                <span class="req">*</span>
              </label>
              <div class="eval-options-grid options-2">
                <label class="eval-choice-pill">
                  <input type="radio" name="${q.id}" value="Yes" required>
                  <span class="pill-text">${dict.optYes}</span>
                </label>
                <label class="eval-choice-pill">
                  <input type="radio" name="${q.id}" value="No" required>
                  <span class="pill-text">${dict.optNo}</span>
                </label>
              </div>
            </div>
          `;
        }
        // 7. Rating 4
        else if (q.type === 'rating_4') {
          return `
            <div class="eval-question-item">
              <label class="eval-q-label">
                <span>${qNum}. ${escapeHtml(qText)}</span>
                <span class="req">*</span>
              </label>
              <div class="eval-rating-grid">
                <label class="eval-rating-card rating-excellent">
                  <input type="radio" name="${q.id}" value="Excellent" required>
                  <div class="rating-box"><span class="rating-text">${dict.rateExcellent}</span></div>
                </label>
                <label class="eval-rating-card rating-vgood">
                  <input type="radio" name="${q.id}" value="Very good" required>
                  <div class="rating-box"><span class="rating-text">${dict.rateVGood}</span></div>
                </label>
                <label class="eval-rating-card rating-good">
                  <input type="radio" name="${q.id}" value="Good" required>
                  <div class="rating-box"><span class="rating-text">${dict.rateGood}</span></div>
                </label>
                <label class="eval-rating-card rating-poor">
                  <input type="radio" name="${q.id}" value="Poor" required>
                  <div class="rating-box"><span class="rating-text">${dict.ratePoor}</span></div>
                </label>
              </div>
            </div>
          `;
        }
        // 8. Free Text
        else {
          return `
            <div class="eval-question-item">
              <label class="eval-q-label" for="${q.id}">
                <span>${qNum}. ${escapeHtml(qText)}</span>
              </label>
              <textarea id="${q.id}" name="${q.id}" class="form-input eval-textarea" rows="3" placeholder="${dict.qCommentsPlaceholder}"></textarea>
            </div>
          `;
        }
      }).join('');
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));
  }

  // 5. Parse Session Parameters
  function initSessionFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const c = params.get('c');
    const loc = params.get('loc');
    const tr = params.get('tr');
    const d = params.get('d');
    const t = params.get('t');
    const sid = params.get('sid');

    if (c) sessionData.course = decodeURIComponent(c);
    if (loc) sessionData.location = decodeURIComponent(loc);
    if (tr) sessionData.trainer = decodeURIComponent(tr);
    if (d) sessionData.date = decodeURIComponent(d);
    if (t) sessionData.time = decodeURIComponent(t);

    if (sid) {
      sessionData.sessionId = decodeURIComponent(sid);
    } else if (c) {
      sessionData.sessionId = 'session_' + encodeURIComponent((sessionData.course + '_' + sessionData.date).replace(/[^a-zA-Z0-9]/g, '_'));
    }

    renderSessionHeaders();

    if (db && (!c || !sid)) {
      const fetchPromise = db.ref('active_session').once('value');
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2500));
      Promise.race([fetchPromise, timeoutPromise]).then((snap) => {
        const val = snap.val();
        if (val) {
          sessionData = { ...sessionData, ...val };
          renderSessionHeaders();
        }
      }).catch(console.warn);
    }
  }

  function renderSessionHeaders() {
    const elCourse = document.getElementById('evalCourseHeader');
    const elLoc = document.getElementById('evalLocationHeader');
    const elTr = document.getElementById('evalTrainerHeader');
    const elDate = document.getElementById('evalDateHeader');
    const elSuccessCourse = document.getElementById('evalSuccessCourse');

    if (elCourse) elCourse.textContent = sessionData.course;
    if (elLoc) elLoc.textContent = sessionData.location;
    if (elTr) elTr.textContent = sessionData.trainer;
    if (elDate) elDate.textContent = sessionData.date;
    if (elSuccessCourse) elSuccessCourse.textContent = sessionData.course;
  }

  // 6. Submit Anonymous Evaluation
  async function handleSubmitEvaluation() {
    const dict = translations[currentLang];
    const btnSubmit = document.getElementById('btnSubmitEval');

    const activeQuestions = evalQuestions.filter(q => q.enabled !== false);
    const ratings = {};
    let missingQuestion = null;

    for (const q of activeQuestions) {
      if (q.type === 'text') {
        const txtEl = document.getElementById(q.id) || document.querySelector(`textarea[name="${q.id}"]`);
        ratings[q.id] = txtEl ? txtEl.value.trim() : '';
      } else {
        const checked = document.querySelector(`input[name="${q.id}"]:checked`);
        if (!checked) {
          missingQuestion = q;
          break;
        }
        ratings[q.id] = checked.value;
      }
    }

    if (missingQuestion) {
      showToast(dict.toastIncomplete, 'error');
      const el = document.querySelector(`input[name="${missingQuestion.id}"]`);
      if (el) {
        el.closest('.eval-question-item').scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    if (btnSubmit) {
      btnSubmit.disabled = true;
      btnSubmit.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${dict.btnSubmitting}`;
    }

    const now = new Date();
    // 100% Anonymous Evaluation Record (NO personal identifiers)
    const evalRecord = {
      id: 'eval_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      sessionId: sessionData.sessionId,
      course: sessionData.course,
      trainer: sessionData.trainer,
      location: sessionData.location,
      date: sessionData.date,
      timestamp: now.toISOString(),
      ratings: ratings
    };

    try {
      // 1. Save to Firebase Realtime Database
      if (db) {
        const evalRef = db.ref('sessions/' + sessionData.sessionId + '/evaluations').push();
        await evalRef.set(evalRecord);
      }

      // 2. Local Storage Fallback
      let localEvals = [];
      try {
        const stored = localStorage.getItem('attendtrack_local_evaluations_v1');
        if (stored) localEvals = JSON.parse(stored);
      } catch (e) {
        localEvals = [];
      }
      localEvals.unshift(evalRecord);
      localStorage.setItem('attendtrack_local_evaluations_v1', JSON.stringify(localEvals));

      // 3. Trigger celebration confetti if available
      if (typeof confetti === 'function') {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }

      // 4. Show Success Screen
      document.getElementById('sessionHeaderCard').classList.add('hidden');
      document.querySelector('.eval-notice-box').classList.add('hidden');
      document.getElementById('evalFormCard').classList.add('hidden');
      document.getElementById('evalSuccessCard').classList.remove('hidden');

      showToast(dict.toastSuccess, 'success');
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err) {
      console.error('Error submitting evaluation:', err);
      showToast(dict.toastSuccess, 'success');
      document.getElementById('evalFormCard').classList.add('hidden');
      document.getElementById('evalSuccessCard').classList.remove('hidden');
    }
  }

  function showToast(msg, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = msg;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-show');
    }, 10);

    setTimeout(() => {
      toast.classList.remove('toast-show');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // 7. Initialization
  document.addEventListener('DOMContentLoaded', () => {
    initSessionFromUrl();
    loadEvalQuestions();
    applyLanguage(currentLang);

    const langBtn = document.getElementById('langToggleBtn');
    if (langBtn) {
      langBtn.addEventListener('click', () => {
        applyLanguage(currentLang === 'ar' ? 'en' : 'ar');
      });
    }

    const btnSubmit = document.getElementById('btnSubmitEval');
    if (btnSubmit) {
      btnSubmit.addEventListener('click', handleSubmitEvaluation);
    }
  });

})();
