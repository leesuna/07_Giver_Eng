/**
 * LocalStorage Persistence & Learning Stats Manager
 */

const STORAGE_KEYS = {
  BOOKMARK: 'giver_app_bookmark',
  VOCABULARY: 'giver_app_vocab',
  STATS: 'giver_app_stats',
  CUSTOM_NOVELS: 'giver_app_custom_novels'
};

export const storage = {
  // Bookmark Progress (current chapter/sentence)
  getBookmark() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BOOKMARK);
      return data ? JSON.parse(data) : { chapterId: 'giver-ch1', sentenceIdx: 0, paragraphIdx: 0 };
    } catch (e) {
      return { chapterId: 'giver-ch1', sentenceIdx: 0, paragraphIdx: 0 };
    }
  },

  saveBookmark(bookmark) {
    try {
      localStorage.setItem(STORAGE_KEYS.BOOKMARK, JSON.stringify(bookmark));
    } catch (e) {
      console.error('Save bookmark error:', e);
    }
  },

  // Saved Vocabulary
  getSavedVocab() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.VOCABULARY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  saveWord(wordObj) {
    const list = this.getSavedVocab();
    const existingIdx = list.findIndex(item => item.word.toLowerCase() === wordObj.word.toLowerCase());
    
    if (existingIdx >= 0) {
      list[existingIdx] = { ...list[existingIdx], ...wordObj, updatedAt: Date.now() };
    } else {
      list.push({
        ...wordObj,
        status: wordObj.status || 'review', // 'new', 'review', 'mastered'
        addedAt: Date.now(),
        updatedAt: Date.now()
      });
    }

    try {
      localStorage.setItem(STORAGE_KEYS.VOCABULARY, JSON.stringify(list));
    } catch (e) {
      console.error('Save word error:', e);
    }
    return list;
  },

  removeWord(wordStr) {
    const list = this.getSavedVocab().filter(item => item.word.toLowerCase() !== wordStr.toLowerCase());
    try {
      localStorage.setItem(STORAGE_KEYS.VOCABULARY, JSON.stringify(list));
    } catch (e) {
      console.error('Remove word error:', e);
    }
    return list;
  },

  updateWordStatus(wordStr, status) {
    const list = this.getSavedVocab();
    const target = list.find(item => item.word.toLowerCase() === wordStr.toLowerCase());
    if (target) {
      target.status = status;
      target.updatedAt = Date.now();
      localStorage.setItem(STORAGE_KEYS.VOCABULARY, JSON.stringify(list));
    }
    return list;
  },

  // Learning Stats & Daily Streak
  getStats() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STATS);
      const stats = data ? JSON.parse(data) : null;
      
      const defaultStats = {
        totalStudySeconds: 0,
        sentencesReadCount: 0,
        quizAttemptCount: 0,
        quizCorrectCount: 0,
        streakDays: 1,
        visitCount: 1,
        lastStudyDate: new Date().toISOString().slice(0, 10),
        dailyHistory: {}
      };

      if (!stats) return defaultStats;

      // Update streak calculation
      const today = new Date().toISOString().slice(0, 10);
      const lastDate = stats.lastStudyDate;

      if (lastDate !== today) {
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        if (lastDate === yesterday) {
          // Streak continues
        } else if (lastDate < yesterday) {
          // Streak reset
          stats.streakDays = 1;
        }
        stats.lastStudyDate = today;
      }

      return { ...defaultStats, ...stats };
    } catch (e) {
      return {
        totalStudySeconds: 0,
        sentencesReadCount: 0,
        quizAttemptCount: 0,
        quizCorrectCount: 0,
        streakDays: 1,
        visitCount: 1,
        lastStudyDate: new Date().toISOString().slice(0, 10),
        dailyHistory: {}
      };
    }
  },

  incrementVisitCount() {
    const stats = this.getStats();
    stats.visitCount = (stats.visitCount || 0) + 1;
    this.saveStats(stats);
    return stats.visitCount;
  },

  addStudyTime(seconds) {
    const stats = this.getStats();
    stats.totalStudySeconds += seconds;

    const today = new Date().toISOString().slice(0, 10);
    if (!stats.dailyHistory[today]) {
      stats.dailyHistory[today] = { seconds: 0, sentences: 0, quizCorrect: 0 };
    }
    stats.dailyHistory[today].seconds += seconds;

    try {
      localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
    } catch (e) {
      console.error('Save stats error:', e);
    }
    return stats;
  },

  recordSentenceRead() {
    const stats = this.getStats();
    stats.sentencesReadCount += 1;

    const today = new Date().toISOString().slice(0, 10);
    if (!stats.dailyHistory[today]) {
      stats.dailyHistory[today] = { seconds: 0, sentences: 0, quizCorrect: 0 };
    }
    stats.dailyHistory[today].sentences += 1;

    try {
      localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
    } catch (e) {
      console.error('Record sentence error:', e);
    }
    return stats;
  },

  recordQuizResult(isCorrect) {
    const stats = this.getStats();
    stats.quizAttemptCount += 1;
    if (isCorrect) stats.quizCorrectCount += 1;

    const today = new Date().toISOString().slice(0, 10);
    if (!stats.dailyHistory[today]) {
      stats.dailyHistory[today] = { seconds: 0, sentences: 0, quizCorrect: 0 };
    }
    if (isCorrect) stats.dailyHistory[today].quizCorrect += 1;

    try {
      localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
    } catch (e) {
      console.error('Record quiz error:', e);
    }
    return stats;
  },

  // Export / Import Backup Data
  exportBackupJSON() {
    const backupData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      bookmark: this.getBookmark(),
      vocabulary: this.getSavedVocab(),
      stats: this.getStats()
    };
    return JSON.stringify(backupData, null, 2);
  },

  importBackupJSON(jsonStr) {
    try {
      const data = JSON.parse(jsonStr);
      if (data.bookmark) this.saveBookmark(data.bookmark);
      if (data.vocabulary) localStorage.setItem(STORAGE_KEYS.VOCABULARY, JSON.stringify(data.vocabulary));
      if (data.stats) localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(data.stats));
      return true;
    } catch (e) {
      console.error('Import error:', e);
      return false;
    }
  }
};
