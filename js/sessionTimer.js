/**
 * 10-Minute Guided Daily Session Timer Logic
 */

import { storage } from './storage.js';

export const PHASES = {
  READING: {
    id: 1,
    name: '1단계: 본문 읽기 & 듣기',
    sub: '소설 문장을 순서대로 읽고 TTS 오디오로 청취하세요 (3분)',
    durationRatio: 0.3, // 3 mins out of 10
    color: '#3b82f6'
  },
  VOCABULARY: {
    id: 2,
    name: '2단계: 핵심 단어 학습',
    sub: '어려운 단어를 검색하고 나만의 단어장에 저장하세요 (3분)',
    durationRatio: 0.3, // 3 mins out of 10
    color: '#10b981'
  },
  QUIZ: {
    id: 3,
    name: '3단계: 문장 괄호 넣기 퀴즈',
    sub: '읽은 문장의 빈칸을 채워 문장력을 완성하세요 (3분)',
    durationRatio: 0.3, // 3 mins out of 10
    color: '#f59e0b'
  },
  SUMMARY: {
    id: 4,
    name: '4단계: 학습 마무리 & 기록',
    sub: '오늘의 학습 결과를 확인하고 누적 진도를 저장합니다 (1분)',
    durationRatio: 0.1, // 1 min out of 10
    color: '#8b5cf6'
  }
};

export class SessionTimer {
  constructor(totalDurationSeconds = 600) { // Default 10 minutes = 600s
    this.totalDuration = totalDurationSeconds;
    this.remainingSeconds = totalDurationSeconds;
    this.timerId = null;
    this.isRunning = false;
    this.currentPhase = PHASES.READING;
    this.onTick = null;
    this.onPhaseChange = null;
    this.onComplete = null;
  }

  setDuration(seconds) {
    this.totalDuration = seconds;
    this.remainingSeconds = seconds;
    this.updateCurrentPhase();
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    
    this.timerId = setInterval(() => {
      this.remainingSeconds -= 1;
      storage.addStudyTime(1);
      
      this.updateCurrentPhase();

      if (this.onTick) {
        this.onTick({
          remaining: this.remainingSeconds,
          elapsed: this.totalDuration - this.remainingSeconds,
          formattedRemaining: this.formatTime(this.remainingSeconds),
          progressPercent: Math.min(100, Math.floor(((this.totalDuration - this.remainingSeconds) / this.totalDuration) * 100)),
          phase: this.currentPhase
        });
      }

      if (this.remainingSeconds <= 0) {
        this.stop();
        if (this.onComplete) this.onComplete();
      }
    }, 1000);
  }

  pause() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.isRunning = false;
  }

  stop() {
    this.pause();
    this.remainingSeconds = this.totalDuration;
    this.updateCurrentPhase();
  }

  updateCurrentPhase() {
    const elapsed = this.totalDuration - this.remainingSeconds;
    const ratio = elapsed / this.totalDuration;

    let newPhase = PHASES.READING;
    if (ratio >= 0.9) {
      newPhase = PHASES.SUMMARY;
    } else if (ratio >= 0.6) {
      newPhase = PHASES.QUIZ;
    } else if (ratio >= 0.3) {
      newPhase = PHASES.VOCABULARY;
    }

    if (this.currentPhase.id !== newPhase.id) {
      this.currentPhase = newPhase;
      if (this.onPhaseChange) this.onPhaseChange(newPhase);
    }
  }

  formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
}

export const sessionTimer = new SessionTimer();
