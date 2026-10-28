/**
 * AttendTrack - Anonymous Training Evaluation Logic
 * UNRWA HR Staff Development & Training Division
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

  const DEFAULT_QUESTIONS = [
    { id: 'q1', section: 1, type: 'yes_somewhat_no', textAr: 'هل كانت محتويات الدورة واضحة ومفهومة؟', textEn: 'Were the course contents clear and understandable?', enabled: true },
    { id: 'q2', section: 1, type: 'yes_somewhat_no', textAr: 'هل كانت المعلومات المقدمة في الدورة مفيدة لعملك؟', textEn: 'Was the information provided in the course useful for your job?', enabled: true },
    { id: 'q3', section: 1, type: 'yes_somewhat_no', textAr: 'هل كانت مواد التدريب (العروض التقديمية، الملاحظات، إلخ) ذات جودة عالية؟', textEn: 'Were the training materials (slides, notes, etc.) of high quality?', enabled: true },
    { id: 'q4', section: 2, type: 'yes_somewhat_no', textAr: 'هل كان المدرب على دراية بالموضوع؟', textEn: 'Was the instructor knowledgeable about the subject?', enabled: true },
    { id: 'q5', section: 2, type: 'yes_no', textAr: 'هل كان المدرب مفيداً ومستعداً للإجابة على الأسئلة؟', textEn: 'Was the instructor helpful and willing to answer questions?', enabled: true },
    { id: 'q6', section: 2, type: 'yes_no', textAr: 'هل كانت طريقة تقديم المدرب فعالة؟', textEn: 'Was the instructor\'s delivery method effective?', enabled: true },
    { id: 'q7', section: 3, type: 'yes_somewhat_no', textAr: 'هل كانت الدورة منظمة جيداً؟ (الوقت، المكان، الجدول الزمني، إلخ)؟', textEn: 'Was the course well-organized? (timing, location, schedule, etc.)?', enabled: true },
    { id: 'q8', section: 3, type: 'yes_no', textAr: 'هل كانت مدة الدورة مناسبة لتغطية المواضيع؟', textEn: 'Was the duration of the course appropriate to cover the topics?', enabled: true },
    { id: 'q9', section: 4, type: 'yes_no', textAr: 'هل تعتقد أنك ستكون قادراً على تطبيق ما تعلمته في عملك اليومي؟', textEn: 'Do you believe you will be able to apply what you learned in your daily work?', enabled: true },
    { id: 'q10', section: 4, type: 'yes_no', textAr: 'هل تعتقد أن الدورة ستساهم في تحسين أدائك في العمل؟', textEn: 'Do you think the course will contribute to improving your job performance?', enabled: true },
    { id: 'q11', section: 5, type: 'rating_4', textAr: 'ما تقييمك العام للدورة التدريبية ككل؟', textEn: 'What is your overall rating of the course?', enabled: true },
    { id: 'q12', section: 5, type: 'text', textAr: 'هل لديك أي اقتراحات أو ملاحظات لتحسين وتطوير التدريب؟', textEn: 'Do you have any suggestions or comments to improve training?', enabled: true }
  ];

  let evalQuestions = [];

  // 2. Bilingual Dictionary
  const translations = {
    ar: {
      portalSubTitle: 'استمارة تقييم التدريب السرية',
      cloudOnline: 'متصل سحابياً',
      cloudOffline: 'وضع محلي',
      evalBannerBadge: 'تقييم سري ومجهول الهوية 100%',
      noticeTitle: 'ملاحظة السرية التامة',
      noticeDesc: 'هذا التقييم مجهول الهوية تماماً ولا يسجل اسمك أو رقمك الوظيفي أو بريدك. إجاباتك تساعدنا على تحسين وتطوير جودة البرامج التدريبية المستقبلية.',
      grpContentTitle: 'تقييم محتوى التدريب (Course Content)',
      q1Title: '1. هل كانت محتويات الدورة واضحة ومفهومة؟',
      q2Title: '2. هل كانت المعلومات المقدمة في الدورة مفيدة لعملك؟',
      q3Title: '3. هل كانت مواد التدريب (العروض التقديمية، الملاحظات، إلخ) ذات جودة عالية؟',
      grpTrainerTitle: 'تقييم المدرب (Trainer Evaluation)',
      q4Title: '4. هل كان المدرب على دراية بالموضوع؟',
      q5Title: '5. هل كان المدرب مفيداً ومستعداً للإجابة على الأسئلة؟',
      q6Title: '6. هل كانت طريقة تقديم المدرب فعالة؟',
      grpOrgTitle: 'تنظيم الدورة والجدول الزمني (Course Organization)',
      q7Title: '7. هل كانت الدورة منظمة جيداً؟ (الوقت، المكان، الجدول الزمني، إلخ)؟',
      q8Title: '8. هل كانت مدة الدورة مناسبة لتغطية المواضيع؟',
      grpImpactTitle: 'الأثر والتطبيق في العمل (Impact and Application)',
      q9Title: '9. هل تعتقد أنك ستكون قادراً على تطبيق ما تعلمته في عملك اليومي؟',
      q10Title: '10. هل تعتقد أن الدورة ستساهم في تحسين أدائك في العمل؟',
      grpOverallTitle: 'التقييم العام والمقترحات (Overall Evaluation & Feedback)',
      q11Title: '11. ما تقييمك العام للدورة؟',
      q12Title: '12. هل لديك أي اقتراحات لتحسين الدورات المستقبلية؟',
      q12Placeholder: 'اكتب ملاحظاتك ومقترحاتك بكل حرية...',
      optYes: 'نعم',
      optSomewhat: 'إلى حد ما',
      optNo: 'لا',
      rateExcellent: 'ممتاز',
      rateVGood: 'جيد جداً',
      rateGood: 'جيد',
      ratePoor: 'ضعيف',
      btnSubmitEvaluation: 'إرسال التقييم السري',
      btnSubmitting: 'جاري إرسال التقييم...',
      evalSuccessTitle: 'شكراً لمشاركتك القيّمة!',
      evalSuccessDesc: 'تم استلام تقييمك بنجاح وبسرية تامة. رأيك يساهم بشكل مباشر في تطوير البرامج التدريبية لدى الأونروا.',
      evalSuccessSub: 'UNITED NATIONS RELIEF AND WORKS AGENCY · HR TRAINING',
      toastIncomplete: 'يرجى الإجابة على جميع أسئلة التقييم الإلزامية قبل الإرسال.',
      toastSuccess: 'تم إرسال تقييمك السري بنجاح. شكراً لتعاونك!'
    },
    en: {
      portalSubTitle: 'Anonymous Training Evaluation Form',
      cloudOnline: 'Cloud Connected',
      cloudOffline: 'Local Mode',
      evalBannerBadge: '100% Confidential & Anonymous Evaluation',
      noticeTitle: 'Full Confidentiality Notice',
      noticeDesc: 'This evaluation is completely anonymous and does not record your name, employee number, or email. Your honest feedback directly supports training quality improvement.',
      grpContentTitle: 'Course Content Evaluation',
      q1Title: '1. Were the course contents clear and understandable?',
      q2Title: '2. Was the information provided in the course useful for your job?',
      q3Title: '3. Were the training materials (slides, notes, etc.) of high quality?',
      grpTrainerTitle: 'Trainer Evaluation',
      q4Title: '4. Was the instructor knowledgeable about the subject?',
      q5Title: '5. Was the instructor helpful and willing to answer questions?',
      q6Title: '6. Was the instructor\'s delivery method effective?',
      grpOrgTitle: 'Course Organization',
      q7Title: '7. Was the course well-organized? (timing, location, schedule, etc.)?',
      q8Title: '8. Was the duration of the course appropriate to cover the topics?',
      grpImpactTitle: 'Impact and Application',
      q9Title: '9. Do you believe you will be able to apply what you learned in your daily work?',
      q10Title: '10. Do you think the course will contribute to improving your job performance?',
      grpOverallTitle: 'Overall Evaluation & Feedback',
      q11Title: '11. What is your overall rating of the course?',
      q12Title: '12. Do you have any suggestions for improving future courses?',
      q12Placeholder: 'Share any suggestions or recommendations freely...',
      optYes: 'Yes',
      optSomewhat: 'Somewhat',
      optNo: 'No',
      rateExcellent: 'Excellent',
      rateVGood: 'Very good',
      rateGood: 'Good',
      ratePoor: 'Poor',
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
    const saved = localStorage.getItem('attendtrack_eval_questions_v1');
    if (saved) {
      try {
        evalQuestions = JSON.parse(saved);
      } catch (e) {
        evalQuestions = JSON.parse(JSON.stringify(DEFAULT_QUESTIONS));
      }
    } else {
      evalQuestions = JSON.parse(JSON.stringify(DEFAULT_QUESTIONS));
    }

    if (db) {
      db.ref('settings/eval_questions').once('value').then(snap => {
        const val = snap.val();
        if (val && Array.isArray(val) && val.length > 0) {
          evalQuestions = val;
          renderDynamicQuestions();
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

        if (q.type === 'yes_somewhat_no') {
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
        } else if (q.type === 'yes_no') {
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
        } else if (q.type === 'rating_4') {
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
        } else {
          return `
            <div class="eval-question-item">
              <label class="eval-q-label" for="${q.id}">
                <span>${qNum}. ${escapeHtml(qText)}</span>
              </label>
              <textarea id="${q.id}" name="${q.id}" class="form-input eval-textarea" rows="3" placeholder="${dict.q12Placeholder}"></textarea>
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
      displayTime: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      ratings: ratings,
      ...ratings // for direct access
    };

    // 1. Send to Firebase RTDB under sessions/{sessionId}/evaluations
    if (db) {
      try {
        const evalRef = db.ref('sessions/' + sessionData.sessionId + '/evaluations');
        const pushPromise = evalRef.push(evalRecord);
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Firebase timeout')), 3500));
        await Promise.race([pushPromise, timeoutPromise]);
      } catch (err) {
        console.warn('Firebase error/timeout in evaluation submission:', err);
      }
    }

    // 2. Local Backup
    try {
      const localEvals = JSON.parse(localStorage.getItem('attendtrack_local_evaluations_v1') || '[]');
      localEvals.push(evalRecord);
      localStorage.setItem('attendtrack_local_evaluations_v1', JSON.stringify(localEvals));
    } catch (e) {
      console.warn(e);
    }

    // Show Success Screen
    const formCard = document.getElementById('evalFormCard');
    const successCard = document.getElementById('evalSuccessCard');
    if (formCard) formCard.classList.add('hidden');
    if (successCard) successCard.classList.remove('hidden');

    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast(dict.toastSuccess, 'success');
  }

  // Toast Function
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

  // Initialize Page
  document.addEventListener('DOMContentLoaded', () => {
    initSessionFromUrl();
    loadEvalQuestions();

    const btnLang = document.getElementById('langToggleBtn');
    if (btnLang) {
      btnLang.addEventListener('click', () => {
        applyLanguage(currentLang === 'ar' ? 'en' : 'ar');
      });
    }

    const btnSubmit = document.getElementById('btnSubmitEval');
    if (btnSubmit) {
      btnSubmit.addEventListener('click', handleSubmitEvaluation);
    }

    applyLanguage(currentLang);
  });

})();
