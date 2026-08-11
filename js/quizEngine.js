/**
 * Cloze Quiz (Fill-in-the-Blank) Generator & Evaluator
 */

import { getAllSentences, parseWordsFromSentence } from './textData.js';
import { storage } from './storage.js';

export class QuizEngine {
  constructor() {
    this.currentQuestions = [];
    this.currentQuestionIdx = 0;
    this.score = 0;
  }

  generateQuizFromSentences(sentenceList, limit = 5) {
    const savedVocabWords = new Set(storage.getSavedVocab().map(v => v.word.toLowerCase()));
    const questions = [];

    // Filter sentences long enough to make a good quiz
    const candidates = sentenceList.filter(s => s.text.split(' ').length >= 5);

    candidates.forEach((sObj, idx) => {
      const tokens = parseWordsFromSentence(sObj.text);
      const wordTokens = tokens.filter(t => t.type === 'word' && t.clean.length >= 3);

      if (wordTokens.length === 0) return;

      // Select target word to blank out (prefer saved vocab word, else longest interesting word)
      let targetToken = wordTokens.find(t => savedVocabWords.has(t.clean));
      if (!targetToken) {
        // Pick the longest word that isn't a common stop word
        const stopWords = new Set(['the', 'and', 'was', 'that', 'with', 'for', 'this', 'they', 'from', 'were', 'have', 'had', 'been', 'said']);
        const nonStop = wordTokens.filter(t => !stopWords.has(t.clean));
        if (nonStop.length > 0) {
          targetToken = nonStop.reduce((prev, curr) => (curr.clean.length > prev.clean.length ? curr : prev));
        } else {
          targetToken = wordTokens[Math.floor(Math.random() * wordTokens.length)];
        }
      }

      // Build masked sentence HTML representation
      const maskedTokens = tokens.map(t => {
        if (t === targetToken) {
          return { ...t, isTarget: true };
        }
        return t;
      });

      questions.push({
        id: `q-${idx}`,
        sentenceId: sObj.id,
        fullText: sObj.text,
        targetWord: targetToken.text,
        targetClean: targetToken.clean,
        tokens: maskedTokens,
        firstLetter: targetToken.clean[0].toUpperCase(),
        wordLength: targetToken.clean.length
      });
    });

    // Shuffle and pick requested limit
    this.currentQuestions = questions.sort(() => 0.5 - Math.random()).slice(0, limit);
    this.currentQuestionIdx = 0;
    this.score = 0;

    return this.currentQuestions;
  }

  getCurrentQuestion() {
    return this.currentQuestions[this.currentQuestionIdx] || null;
  }

  checkAnswer(userAnswer) {
    const q = this.getCurrentQuestion();
    if (!q) return false;

    const cleanInput = userAnswer.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const isCorrect = cleanInput === q.targetClean;

    if (isCorrect) {
      this.score += 1;
    }
    storage.recordQuizResult(isCorrect);
    return isCorrect;
  }

  nextQuestion() {
    this.currentQuestionIdx += 1;
    return this.getCurrentQuestion();
  }

  isFinished() {
    return this.currentQuestionIdx >= this.currentQuestions.length;
  }
}

export const quizEngine = new QuizEngine();
