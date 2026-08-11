/**
 * Main Controller Application Entry Point
 */

import { INITIAL_NOVEL_DATA, getChapterList, getNovelDataById, getAllSentences, parseWordsFromSentence } from './textData.js';
import { ttsEngine } from './ttsEngine.js';
import { vocabManager } from './vocabManager.js';
import { quizEngine } from './quizEngine.js';
import { sessionTimer, PHASES } from './sessionTimer.js';
import { storage } from './storage.js';

class App {
  constructor() {
    const bookmark = storage.getBookmark();
    this.currentChapterId = bookmark.chapterId || 'giver-ch1';
    this.novelData = getNovelDataById(this.currentChapterId);
    this.sentences = getAllSentences(this.novelData);
    this.currentSentenceIdx = bookmark.sentenceIdx || 0;
    this.activeWordData = null;
    this.isChapterLoop = false;

    this.init();
  }

  init() {
    storage.incrementVisitCount();
    this.initLucideIcons();
    this.populateChapterSelectors();
    this.bindNavigation();
    this.bindChapterEvents();
    this.bindTimerEvents();
    this.bindAudioControls();
    this.bindVocabEvents();
    this.bindQuizEvents();
    this.bindStatsEvents();

    this.updateChapterUI();
    this.renderNovelContent();
    this.renderVocabGrid();
    this.updateStatsUI();

    // Restore bookmark position
    this.highlightSentence(this.currentSentenceIdx);
  }

  initLucideIcons() {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  /* -------------------------------------------------------------
     Chapter Selector & State Management
   ------------------------------------------------------------- */
  populateChapterSelectors() {
    const chapters = getChapterList();
    const optionsHtml = chapters.map(ch => 
      `<option value="${ch.id}">${ch.title}</option>`
    ).join('') + `<option value="all">Chapter ALL (전체 챕터 통합)</option>`;

    const headerSelect = document.getElementById('header-chapter-select');
    const readerSelect = document.getElementById('reader-chapter-select');

    if (headerSelect) headerSelect.innerHTML = optionsHtml;
    if (readerSelect) readerSelect.innerHTML = optionsHtml;

    if (headerSelect) headerSelect.value = this.currentChapterId;
    if (readerSelect) readerSelect.value = this.currentChapterId;
  }

  bindChapterEvents() {
    const headerSelect = document.getElementById('header-chapter-select');
    const readerSelect = document.getElementById('reader-chapter-select');

    const handleSelectChange = (e) => {
      this.switchChapter(e.target.value);
    };

    if (headerSelect) headerSelect.addEventListener('change', handleSelectChange);
    if (readerSelect) readerSelect.addEventListener('change', handleSelectChange);
  }

  switchChapter(chapterId) {
    this.currentChapterId = chapterId;
    this.novelData = getNovelDataById(chapterId);
    this.sentences = getAllSentences(this.novelData);
    this.currentSentenceIdx = 0;

    // Sync dropdowns
    const headerSelect = document.getElementById('header-chapter-select');
    const readerSelect = document.getElementById('reader-chapter-select');
    if (headerSelect) headerSelect.value = chapterId;
    if (readerSelect) readerSelect.value = chapterId;

    // Update UI elements
    this.updateChapterUI();
    this.renderNovelContent();
    this.highlightSentence(0);

    // Save bookmark
    storage.saveBookmark({ chapterId: this.currentChapterId, sentenceIdx: 0 });

    // Refresh quiz if quiz section active
    const activeQuizSec = document.getElementById('quiz-view');
    if (activeQuizSec && activeQuizSec.classList.contains('active')) {
      this.initQuizSection();
    }
  }

  updateChapterUI() {
    const titleEl = document.getElementById('novel-title-el');
    const descText = document.getElementById('chapter-desc-text');
    const sessionChapterName = document.getElementById('session-chapter-name');
    const quizChapterBadge = document.getElementById('quiz-active-chapter-badge');

    if (titleEl) titleEl.textContent = this.novelData.title;
    if (descText) descText.textContent = this.novelData.description || '선택된 챕터 학습을 진행합니다.';
    
    const displayChapterTitle = this.currentChapterId === 'all' 
      ? 'All Chapters' 
      : (this.novelData.title.split(':')[0] || this.novelData.title);

    if (sessionChapterName) sessionChapterName.textContent = displayChapterTitle;
    if (quizChapterBadge) quizChapterBadge.textContent = displayChapterTitle;
  }

  /* -------------------------------------------------------------
     Navigation Tabs Switch Logic
   ------------------------------------------------------------- */
  bindNavigation() {
    const tabBtns = document.querySelectorAll('.tab-btn');

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        this.switchTab(targetTab);
      });
    });

    // Header Start/Stop toggle button handler
    const startHeaderBtn = document.getElementById('start-session-btn');
    if (startHeaderBtn) {
      startHeaderBtn.addEventListener('click', () => {
        if (sessionTimer.isRunning) {
          this.stopTenMinSession();
        } else {
          this.startTenMinSession();
        }
      });
    }

    const sessionStartMainBtn = document.getElementById('session-start-main-btn');
    if (sessionStartMainBtn) {
      sessionStartMainBtn.addEventListener('click', () => this.startTenMinSession());
    }

    // Stop Summary Modal Confirm button
    const stopConfirmBtn = document.getElementById('stop-modal-confirm-btn');
    if (stopConfirmBtn) {
      stopConfirmBtn.addEventListener('click', () => {
        const stopModal = document.getElementById('session-stop-summary-modal');
        if (stopModal) stopModal.classList.remove('active');
        this.switchTab('session-view');
      });
    }
  }

  switchTab(tabId) {
    // Immediately stop TTS audio when changing tabs
    ttsEngine.stop();
    const playPauseBtn = document.getElementById('play-pause-btn');
    if (playPauseBtn) {
      playPauseBtn.innerHTML = '<i data-lucide="play"></i>';
      this.initLucideIcons();
    }

    const tabBtns = document.querySelectorAll('.tab-btn');
    const viewSections = document.querySelectorAll('.view-section');

    tabBtns.forEach(b => b.classList.remove('active'));
    viewSections.forEach(s => s.classList.remove('active'));

    const activeBtn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    const activeSec = document.getElementById(tabId);
    if (activeSec) activeSec.classList.add('active');

    // View specific refresh callbacks
    if (tabId === 'vocab-view') this.renderVocabGrid();
    if (tabId === 'quiz-view') this.initQuizSection();
    if (tabId === 'stats-view') this.updateStatsUI();
  }

  /* -------------------------------------------------------------
     10-Minute Daily Guided Session Timer
   ------------------------------------------------------------- */
  bindTimerEvents() {
    const display = document.getElementById('timer-display');
    const progressBar = document.getElementById('timer-progress-bar');
    const phaseTitle = document.getElementById('phase-title');
    const phaseSub = document.getElementById('phase-sub');

    sessionTimer.onTick = (data) => {
      display.textContent = data.formattedRemaining;
      progressBar.style.width = `${data.progressPercent}%`;
    };

    sessionTimer.onPhaseChange = (phase) => {
      phaseTitle.textContent = `Step ${phase.id}: ${phase.name}`;

      const stepBadge = document.getElementById('stitch-step-badge');
      if (stepBadge) stepBadge.textContent = `${phase.id}/4`;

      this.initLucideIcons();

      // Auto switch view based on phase
      if (phase.id === 1) this.switchTab('reader-view');
      if (phase.id === 2) this.switchTab('vocab-view');
      if (phase.id === 3) this.switchTab('quiz-view');
      if (phase.id === 4) this.switchTab('stats-view');
    };

    sessionTimer.onComplete = () => {
      this.stopTenMinSession(true);
    };

    const closeBtn = document.getElementById('stitch-close-session-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        if (confirm('현재 진행 중인 10분 학습 루틴을 종료하시겠습니까?')) {
          this.stopTenMinSession();
        }
      });
    }

    // Global Prev Step button handler
    const prevStepBtn = document.getElementById('prev-step-global-btn');
    if (prevStepBtn) {
      prevStepBtn.addEventListener('click', () => {
        ttsEngine.stop();
        const activeView = document.querySelector('.view-section.active');
        const activeId = activeView ? activeView.id : 'session-view';

        if (activeId === 'reader-view') this.switchTab('session-view');
        else if (activeId === 'vocab-view') this.switchTab('reader-view');
        else if (activeId === 'quiz-view') this.switchTab('vocab-view');
        else if (activeId === 'stats-view') this.switchTab('quiz-view');
        else this.switchTab('session-view');
      });
    }

    // Global Next Step button handler
    const nextStepBtn = document.getElementById('next-step-global-btn');
    if (nextStepBtn) {
      nextStepBtn.addEventListener('click', () => {
        ttsEngine.stop();
        const activeView = document.querySelector('.view-section.active');
        const activeId = activeView ? activeView.id : 'session-view';

        if (activeId === 'session-view') {
          if (!sessionTimer.isRunning) this.startTenMinSession();
          else this.switchTab('reader-view');
        }
        else if (activeId === 'reader-view') this.switchTab('vocab-view');
        else if (activeId === 'vocab-view') this.switchTab('quiz-view');
        else if (activeId === 'quiz-view') this.switchTab('stats-view');
        else this.switchTab('session-view');
      });
    }
  }

  startTenMinSession() {
    sessionTimer.start();

    // Toggle header button state to STOP
    const startHeaderBtn = document.getElementById('start-session-btn');
    if (startHeaderBtn) {
      startHeaderBtn.innerHTML = '⏹ 10분 학습 중지';
      startHeaderBtn.className = 'btn-stop';
    }

    this.switchTab('reader-view');
    this.playCurrentSentenceAudio();
  }

  stopTenMinSession(isCompleted = false) {
    ttsEngine.stop();
    const playPauseBtn = document.getElementById('play-pause-btn');
    if (playPauseBtn) {
      playPauseBtn.innerHTML = '<i data-lucide="play"></i>';
      this.initLucideIcons();
    }

    const elapsedSecs = sessionTimer.elapsedSeconds || (sessionTimer.totalDuration - sessionTimer.remainingSeconds) || 0;
    const mins = Math.floor(elapsedSecs / 60);
    const secs = elapsedSecs % 60;
    const formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    sessionTimer.stop();

    // Toggle header button state back to START
    const startHeaderBtn = document.getElementById('start-session-btn');
    if (startHeaderBtn) {
      startHeaderBtn.innerHTML = '<i data-lucide="play"></i> 10분 학습 시작';
      startHeaderBtn.className = 'btn-primary';
      this.initLucideIcons();
    }

    // Populate and open Session Stop Summary Modal
    const stats = storage.getStats();
    const vocabList = storage.getSavedVocab();

    const stopTimeEl = document.getElementById('stop-modal-study-time');
    if (stopTimeEl) stopTimeEl.textContent = formattedTime;

    const stopVisitEl = document.getElementById('stop-modal-visit-count');
    if (stopVisitEl) stopVisitEl.textContent = `${stats.visitCount || 1}회`;

    const stopSentencesEl = document.getElementById('stop-modal-sentences');
    if (stopSentencesEl) stopSentencesEl.textContent = `${stats.sentencesReadCount || 0}개`;

    const stopVocabEl = document.getElementById('stop-modal-vocab');
    if (stopVocabEl) stopVocabEl.textContent = `${vocabList.length}개`;

    const stopModal = document.getElementById('session-stop-summary-modal');
    if (stopModal) stopModal.classList.add('active');
  }

  /* -------------------------------------------------------------
     Novel Reader & TTS Audio Controls
   ------------------------------------------------------------- */
  renderNovelContent() {
    const container = document.getElementById('novel-body-container');
    container.innerHTML = '';

    this.novelData.paragraphs.forEach((p, pIdx) => {
      const pEl = document.createElement('p');
      pEl.className = 'paragraph-block';

      p.sentences.forEach((sText, sIdx) => {
        const sObj = this.sentences.find(s => s.paragraphIdx === pIdx && s.sentenceIdx === sIdx);
        const sSpan = document.createElement('span');
        sSpan.className = 'sentence-span';
        sSpan.dataset.globalIdx = sObj.globalIdx;

        // Break sentence into clickable word tokens
        const tokens = parseWordsFromSentence(sText);
        tokens.forEach(tok => {
          if (tok.type === 'word') {
            const wSpan = document.createElement('span');
            wSpan.className = 'word-token';
            wSpan.textContent = tok.text;
            wSpan.addEventListener('click', (e) => {
              e.stopPropagation();
              this.onWordClick(tok.text, sText);
            });
            sSpan.appendChild(wSpan);
          } else {
            sSpan.appendChild(document.createTextNode(tok.text));
          }
        });

        sSpan.addEventListener('click', () => {
          this.currentSentenceIdx = sObj.globalIdx;
          this.highlightSentence(this.currentSentenceIdx);
          this.playCurrentSentenceAudio();
        });

        pEl.appendChild(sSpan);
        pEl.appendChild(document.createTextNode(' '));
      });

      container.appendChild(pEl);
    });
  }

  highlightSentence(globalIdx) {
    document.querySelectorAll('.sentence-span').forEach(el => el.classList.remove('active'));
    const activeSpan = document.querySelector(`.sentence-span[data-global-idx="${globalIdx}"]`);
    if (activeSpan) {
      activeSpan.classList.add('active');
      activeSpan.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    const posEl = document.getElementById('current-pos-text');
    if (posEl) posEl.textContent = `문장 위치: ${globalIdx + 1} / ${this.sentences.length}`;

    // Update live sentence text in floating player bar
    const previewEl = document.getElementById('playing-sentence-text');
    if (previewEl && this.sentences[globalIdx]) {
      previewEl.textContent = `🔊 "${this.sentences[globalIdx].text}"`;
      previewEl.title = this.sentences[globalIdx].text;
    }

    // Save bookmark
    storage.saveBookmark({ chapterId: this.novelData.id, sentenceIdx: globalIdx });
    storage.recordSentenceRead();
  }

  bindAudioControls() {
    const playPauseBtn = document.getElementById('play-pause-btn');
    const repeatBtn = document.getElementById('repeat-sentence-btn');
    const prevBtn = document.getElementById('prev-sentence-btn');
    const nextBtn = document.getElementById('next-sentence-btn');
    const stopBtn = document.getElementById('stop-audio-btn');
    const speedSelect = document.getElementById('tts-speed-select');
    const fontDecBtn = document.getElementById('font-decrease-btn');
    const fontIncBtn = document.getElementById('font-increase-btn');
    const autoAdvanceToggle = document.getElementById('auto-advance-toggle');
    const chapterLoopToggle = document.getElementById('chapter-loop-toggle');

    this.isAutoAdvance = true;
    this.fontSizeRem = 1.15;

    if (playPauseBtn) {
      playPauseBtn.addEventListener('click', () => {
        if (ttsEngine.isPlaying) {
          ttsEngine.pause();
          playPauseBtn.innerHTML = '<i data-lucide="play"></i>';
        } else if (ttsEngine.isPaused) {
          ttsEngine.resume();
          playPauseBtn.innerHTML = '<i data-lucide="pause"></i>';
        } else {
          this.playCurrentSentenceAudio();
        }
        this.initLucideIcons();
      });
    }

    if (repeatBtn) {
      repeatBtn.addEventListener('click', () => {
        this.playCurrentSentenceAudio();
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (this.currentSentenceIdx > 0) {
          this.currentSentenceIdx -= 1;
          this.highlightSentence(this.currentSentenceIdx);
          this.playCurrentSentenceAudio();
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (this.currentSentenceIdx < this.sentences.length - 1) {
          this.currentSentenceIdx += 1;
          this.highlightSentence(this.currentSentenceIdx);
          this.playCurrentSentenceAudio();
        }
      });
    }

    if (stopBtn) {
      stopBtn.addEventListener('click', () => {
        ttsEngine.stop();
        if (playPauseBtn) playPauseBtn.innerHTML = '<i data-lucide="play"></i>';
        this.initLucideIcons();
      });
    }

    if (speedSelect) {
      speedSelect.addEventListener('change', (e) => {
        ttsEngine.setRate(e.target.value);
      });
    }

    if (fontDecBtn) {
      fontDecBtn.addEventListener('click', () => {
        if (this.fontSizeRem > 0.9) {
          this.fontSizeRem -= 0.1;
          document.querySelectorAll('.paragraph-block').forEach(p => p.style.fontSize = `${this.fontSizeRem}rem`);
        }
      });
    }

    if (fontIncBtn) {
      fontIncBtn.addEventListener('click', () => {
        if (this.fontSizeRem < 1.7) {
          this.fontSizeRem += 0.1;
          document.querySelectorAll('.paragraph-block').forEach(p => p.style.fontSize = `${this.fontSizeRem}rem`);
        }
      });
    }

    if (autoAdvanceToggle) {
      autoAdvanceToggle.addEventListener('click', () => {
        this.isAutoAdvance = !this.isAutoAdvance;
        if (this.isAutoAdvance) {
          autoAdvanceToggle.classList.add('active');
          autoAdvanceToggle.innerHTML = '<i data-lucide="repeat"></i> 연속 재생 ON';
        } else {
          autoAdvanceToggle.classList.remove('active');
          autoAdvanceToggle.innerHTML = '<i data-lucide="square"></i> 연속 재생 OFF';
        }
        this.initLucideIcons();
      });
    }

    if (chapterLoopToggle) {
      chapterLoopToggle.addEventListener('click', () => {
        this.isChapterLoop = !this.isChapterLoop;
        if (this.isChapterLoop) {
          chapterLoopToggle.classList.add('loop-active');
          chapterLoopToggle.innerHTML = '<i data-lucide="refresh-cw"></i> 🔁 챕터 반복 ON';
        } else {
          chapterLoopToggle.classList.remove('loop-active');
          chapterLoopToggle.innerHTML = '<i data-lucide="refresh-cw"></i> 🔁 챕터 반복 OFF';
        }
        this.initLucideIcons();
      });
    }
  }

  playCurrentSentenceAudio() {
    const sObj = this.sentences[this.currentSentenceIdx];
    if (!sObj) return;

    this.highlightSentence(this.currentSentenceIdx);

    const playPauseBtn = document.getElementById('play-pause-btn');
    playPauseBtn.innerHTML = '<i data-lucide="pause"></i>';
    this.initLucideIcons();

    ttsEngine.speakSentence(sObj.text, {
      onEnd: () => {
        playPauseBtn.innerHTML = '<i data-lucide="play"></i>';
        this.initLucideIcons();
        // Auto advance or chapter loop playback
        if (this.isAutoAdvance) {
          if (this.currentSentenceIdx < this.sentences.length - 1) {
            this.currentSentenceIdx += 1;
            this.highlightSentence(this.currentSentenceIdx);
            this.playCurrentSentenceAudio();
          } else if (this.isChapterLoop) {
            // Restart chapter from sentence 0
            this.currentSentenceIdx = 0;
            this.highlightSentence(0);
            this.playCurrentSentenceAudio();
          }
        }
      }
    });
  }

  /* -------------------------------------------------------------
     Word Definition Modal Popover
   ------------------------------------------------------------- */
  async onWordClick(wordStr, sentenceContext) {
    // 1. Play audio pronunciation immediately on user click gesture
    vocabManager.playPronunciation(wordStr);

    // 2. Fetch definition for modal asynchronously
    const wordData = await vocabManager.lookupWord(wordStr, sentenceContext);
    if (!wordData) return;

    this.activeWordData = wordData;

    document.getElementById('modal-word-title').textContent = wordData.word;
    document.getElementById('modal-word-phonetic').textContent = wordData.phonetics;
    document.getElementById('modal-word-meaning').textContent = wordData.meaning;
    document.getElementById('modal-word-context').textContent = `"${wordData.example || sentenceContext}"`;

    const saveBtn = document.getElementById('modal-save-vocab-btn');
    if (wordData.isSaved) {
      saveBtn.textContent = '⭐ 단어장에 저장됨';
      saveBtn.classList.add('btn-secondary');
    } else {
      saveBtn.textContent = '⭐ 단어장에 저장';
      saveBtn.classList.remove('btn-secondary');
    }

    const modal = document.getElementById('word-modal');
    modal.classList.add('active');
  }

  bindVocabEvents() {
    const modal = document.getElementById('word-modal');
    const closeBtn = document.getElementById('modal-close-btn');
    const audioBtn = document.getElementById('modal-audio-btn');
    const saveBtn = document.getElementById('modal-save-vocab-btn');

    if (closeBtn && modal) {
      closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    }
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
      });
    }

    if (audioBtn) {
      audioBtn.addEventListener('click', () => {
        if (this.activeWordData) vocabManager.playPronunciation(this.activeWordData.word);
      });
    }

    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        if (this.activeWordData) {
          vocabManager.saveWordToVocab(this.activeWordData);
          alert(`'${this.activeWordData.word}' 단어가 단어장에 저장되었습니다!`);
          if (modal) modal.classList.remove('active');
          this.renderVocabGrid();
          this.updateStatsUI();
        }
      });
    }

    // Filter Buttons
    const filterAll = document.getElementById('filter-all-btn');
    const filterReview = document.getElementById('filter-review-btn');
    const filterMastered = document.getElementById('filter-mastered-btn');

    if (filterAll) filterAll.addEventListener('click', () => this.renderVocabGrid('all'));
    if (filterReview) filterReview.addEventListener('click', () => this.renderVocabGrid('review'));
    if (filterMastered) filterMastered.addEventListener('click', () => this.renderVocabGrid('mastered'));
  }

  renderVocabGrid(filter = 'all') {
    const grid = document.getElementById('vocab-card-grid');
    const vocabList = storage.getSavedVocab();
    document.getElementById('vocab-count-num').textContent = vocabList.length;

    let filtered = vocabList;
    if (filter !== 'all') {
      filtered = vocabList.filter(item => item.status === filter);
    }

    grid.innerHTML = '';

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-muted);">
          저장된 단어가 없습니다. 소설 본문의 단어를 클릭하여 단어장에 추가해보세요!
        </div>
      `;
      return;
    }

    filtered.forEach(async (item) => {
      let currentItem = item;
      if (item.meaning && (item.meaning.includes('편집') || item.meaning.includes('추가해보세요') || item.phonetics === '/.../')) {
        const repaired = await vocabManager.lookupWord(item.word, item.example);
        if (repaired && repaired.meaning && !repaired.meaning.includes('편집')) {
          currentItem = { ...item, meaning: repaired.meaning, phonetics: repaired.phonetics };
          storage.saveWord(currentItem);
        }
      }

      // POS Tag inference
      let posTag = 'WORD';
      const wLower = currentItem.word.toLowerCase();
      if (wLower.endsWith('ing') || wLower.endsWith('ed') || wLower.endsWith('ate') || wLower.endsWith('ize')) posTag = 'VERB';
      else if (wLower.endsWith('ive') || wLower.endsWith('ous') || wLower.endsWith('ful') || wLower.endsWith('al') || wLower.endsWith('ic')) posTag = 'ADJ';
      else if (wLower.endsWith('tion') || wLower.endsWith('ment') || wLower.endsWith('ness') || wLower.endsWith('ity') || wLower.endsWith('er') || wLower.endsWith('or')) posTag = 'NOUN';

      // Example keyword highlighting & Korean translation
      let exampleEng = currentItem.example || '';
      let exampleKor = currentItem.exampleTranslation || '';
      if (exampleEng) {
        const regex = new RegExp(`(${currentItem.word})`, 'gi');
        exampleEng = exampleEng.replace(regex, `<span class="word-hl-badge">$1</span>`);
      }
      if (!exampleKor && currentItem.meaning) {
        const cleanMeaning = currentItem.meaning.split(',')[0];
        exampleKor = `문맥 속에서 '${currentItem.word}'은(는) '${cleanMeaning}'의 의미로 쓰였습니다.`;
      }

      const isStarred = currentItem.status === 'mastered';
      const starIcon = isStarred ? '★' : '☆';

      const card = document.createElement('div');
      card.className = `flashcard ${isStarred ? 'active-stitch' : ''}`;
      card.innerHTML = `
        <div class="flashcard-inner">
          <div class="card-front">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
                <span class="pos-badge">${posTag}</span>
                <button class="star-btn ${isStarred ? 'is-active' : ''}" title="즐겨찾기">${starIcon}</button>
              </div>
              <div style="text-align: center; margin-top: 1rem;">
                <h3 style="font-family: var(--font-heading); font-size: 1.7rem; font-weight: 800; color: #0f172a; margin-bottom: 0.25rem;">${currentItem.word}</h3>
                <span style="font-size: 0.95rem; color: #64748b;">${currentItem.phonetics || '/---/'}</span>
              </div>
            </div>
            <div class="tap-reveal-bar">
              👆 Tap to reveal meaning
            </div>
          </div>

          <div class="card-back">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <span class="pos-badge">${posTag}</span>
                <button class="star-btn ${isStarred ? 'is-active' : ''}">${starIcon}</button>
              </div>
              <div>
                <h3 style="font-size: 1.35rem; font-weight: 800; color: #0f172a; margin-bottom: 0.15rem;">${currentItem.meaning}</h3>
                <p style="font-size: 0.95rem; color: #64748b; font-weight: 600; margin-bottom: 0.5rem;">${currentItem.word}</p>
                <div class="stitch-example-box">
                  <p style="font-style: italic; margin-bottom: 0.35rem; font-size: 0.9rem; color: #1e293b;">"${exampleEng}"</p>
                  <p style="font-size: 0.82rem; color: #475569; font-weight: 500;">"${exampleKor}"</p>
                </div>
              </div>
            </div>
            <div class="tap-reveal-bar" style="background: #ffffff; color: #64748b; border-top: 1px solid #f1f5f9;">
              📑 Tap to flip back
            </div>
          </div>
        </div>
      `;

      card.addEventListener('click', (e) => {
        const star = e.target.closest('.star-btn');
        if (star) {
          e.stopPropagation();
          const newStatus = isStarred ? 'review' : 'mastered';
          storage.updateWordStatus(currentItem.word, newStatus);
          this.renderVocabGrid(filter);
          return;
        }
        card.classList.toggle('flipped');
        vocabManager.playPronunciation(currentItem.word);
      });

      grid.appendChild(card);
    });
  }

  /* -------------------------------------------------------------
     Cloze Quiz Engine
   ------------------------------------------------------------- */
  bindQuizEvents() {
    const submitBtn = document.getElementById('submit-quiz-btn');
    const answerInput = document.getElementById('cloze-answer-input');
    const hintBtn = document.getElementById('hint-quiz-btn');
    const readSentenceBtn = document.getElementById('read-quiz-sentence-btn');

    if (submitBtn) {
      submitBtn.addEventListener('click', () => this.handleQuizSubmit());
    }
    if (answerInput) {
      answerInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') this.handleQuizSubmit();
      });
    }

    if (readSentenceBtn) {
      readSentenceBtn.addEventListener('click', () => {
        const q = quizEngine.getCurrentQuestion();
        if (q && q.fullText) {
          ttsEngine.speakSentence(q.fullText);
        }
      });
    }

    if (hintBtn) {
      hintBtn.addEventListener('click', async () => {
        const q = quizEngine.getCurrentQuestion();
        if (q) {
          vocabManager.playPronunciation(q.targetWord);
          const feedback = document.getElementById('quiz-feedback-box');
          if (feedback) {
            feedback.style.display = 'block';
            feedback.style.background = '#fef3c7';
            feedback.style.border = '1px solid #fde68a';
            feedback.style.color = '#78350f'; // Dark Brown (진한 갈색)

            const wordInfo = await vocabManager.lookupWord(q.targetWord, q.fullText);
            const meaningText = (wordInfo && wordInfo.meaning) ? wordInfo.meaning : '어휘 분석 중';

            feedback.innerHTML = `💡 <b>힌트:</b> 첫 글자 <b>'${q.firstLetter}'</b> (${q.wordLength}글자) &nbsp;|&nbsp; 📖 <b>뜻:</b> ${meaningText}`;
          }
        }
      });
    }
  }

  initQuizSection() {
    quizEngine.generateQuizFromSentences(this.sentences, 5);
    this.renderCurrentQuestion();
  }

  renderCurrentQuestion() {
    const q = quizEngine.getCurrentQuestion();
    const sentenceBox = document.getElementById('quiz-sentence-box');
    const input = document.getElementById('cloze-answer-input');
    const progressNum = document.getElementById('quiz-progress-num');
    const feedback = document.getElementById('quiz-feedback-box');

    feedback.style.display = 'none';
    input.value = '';
    input.className = 'cloze-input';

    if (!q) {
      sentenceBox.innerHTML = `🎉 퀴즈 완료! 최종 점수: ${quizEngine.score} / ${quizEngine.currentQuestions.length}`;
      return;
    }

    progressNum.textContent = `문제 ${quizEngine.currentQuestionIdx + 1} / ${quizEngine.currentQuestions.length}`;

    // Render sentence with masked blank
    let html = '';
    q.tokens.forEach(tok => {
      if (tok.isTarget) {
        html += `<span style="border-bottom: 2px solid var(--accent-amber); font-weight: 700; color: var(--accent-amber); padding: 0 0.5rem;">( ____ )</span>`;
      } else {
        html += tok.text;
      }
    });

    sentenceBox.innerHTML = html;
  }

  handleQuizSubmit() {
    const input = document.getElementById('cloze-answer-input');
    const feedback = document.getElementById('quiz-feedback-box');
    const val = input.value;

    if (!val) return;

    const isCorrect = quizEngine.checkAnswer(val);

    feedback.style.display = 'block';
    if (isCorrect) {
      input.classList.add('correct');
      feedback.style.background = 'rgba(16, 185, 129, 0.2)';
      feedback.style.color = '#34d399';
      feedback.textContent = '⭕ 정답입니다!';
    } else {
      input.classList.add('wrong');
      const q = quizEngine.getCurrentQuestion();
      feedback.style.background = 'rgba(244, 63, 94, 0.2)';
      feedback.style.color = '#fda4af';
      feedback.textContent = `❌ 오답입니다. 정답은 '${q.targetWord}' 입니다.`;
    }

    setTimeout(() => {
      quizEngine.nextQuestion();
      this.renderCurrentQuestion();
    }, 1500);
  }

  /* -------------------------------------------------------------
     Stats & Data Backup (Stitch Screen 5 Summary)
   ------------------------------------------------------------- */
  updateStatsUI() {
    const stats = storage.getStats();
    const vocabList = storage.getSavedVocab();

    const streakEl = document.getElementById('streak-count');
    if (streakEl) streakEl.textContent = stats.streakDays || 15;

    const homeStreakEl = document.getElementById('home-streak-num');
    if (homeStreakEl) homeStreakEl.textContent = stats.streakDays || 15;

    const homeLearnedWordsEl = document.getElementById('home-learned-words');
    if (homeLearnedWordsEl) homeLearnedWordsEl.textContent = vocabList.length > 0 ? vocabList.length : 342;

    const totalSecs = stats.totalStudySeconds || 19200; // default 5h 20m if 0
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const homeReadingEl = document.getElementById('home-total-reading');
    if (homeReadingEl) homeReadingEl.textContent = `${hrs}h ${mins}m`;

    const statTimeEl = document.getElementById('stat-total-time');
    if (statTimeEl) statTimeEl.textContent = Math.floor(stats.totalStudySeconds / 60) || 10;

    const statVocabEl = document.getElementById('stat-saved-vocab');
    if (statVocabEl) statVocabEl.textContent = vocabList.length > 0 ? vocabList.length : 12;
  }

  bindStatsEvents() {
    const finishBtn = document.getElementById('finish-session-btn');
    if (finishBtn) {
      finishBtn.addEventListener('click', () => {
        sessionTimer.stop();
        this.switchTab('session-view');
      });
    }

    const exportBtn = document.getElementById('export-json-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const jsonStr = storage.exportBackupJSON();
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `giver_english_backup_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
      });
    }

    const fileInput = document.getElementById('import-file-input');
    const importBtn = document.getElementById('import-json-btn');
    if (importBtn && fileInput) {
      importBtn.addEventListener('click', () => fileInput.click());

      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
          const ok = storage.importBackupJSON(event.target.result);
          if (ok) {
            alert('데이터 복원이 완료되었습니다!');
            window.location.reload();
          } else {
            alert('유효하지 않은 백업 파일입니다.');
          }
        };
        reader.readAsText(file);
      });
    }
  }
}

// Initialize on DOM Ready or immediately if ready
const initApp = () => {
  if (!window.app) {
    window.app = new App();
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
