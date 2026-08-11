# 📖 소설 기반 10분 일일 영어 학습 웹 앱 (The Giver English Learner)

소설(기본: *The Giver*) 본문을 기반으로 매일 10분씩 효과적으로 영어를 학습할 수 있는 순수 정적 웹 애플리케이션입니다.

## ✨ 주요 기능

1. **⏱️ 10분 일일 가이드 루틴 (Guided 10-Min Session)**
   - 1단계 (3분): 문장 읽기 & 순서대로 듣기 (TTS)
   - 2단계 (3분): 본문 단어 검색 및 개인 단어장 학습
   - 3단계 (3분): 문장 괄호 넣기(Cloze Test) 빈칸 채우기 퀴즈
   - 4단계 (1분): 일일 학습 요약 및 진도 자동 저장

2. **🔊 문장 순서대로 읽기 (TTS Audio & Highlighting)**
   - 브라우저 내장 Web Speech API로 자연스러운 영어 음성 재생
   - 배속 조절 (0.75x, 1.0x, 1.25x), 문장 클릭 재생, 실시간 문장 하이라이트

3. **📖 단어 검색 & 나만의 단어장 (Vocabulary & Flashcards)**
   - 클릭 한 번으로 한국어 뜻, 발음 기호, 소설 속 예문 확인
   - 단어장 저장 및 발음 지원 플래시카드 뒤집기 암기 모드

4. **✏️ 문장 괄호 넣기 퀴즈 (Fill-in-the-Blank)**
   - 읽은 구절에서 주요 단어를 빈칸으로 자동 변환
   - 실시간 채점, 첫 글자 힌트 및 음성 힌트 지원

5. **📊 학습 진도 및 누적 기록 (Progress Tracking)**
   - 읽던 문장 위치 자동 북마크
   - 학습 시간, 읽은 문장 수, 암기 단어 수, 일일 스트릭(Streak) 누적
   - 데이터 백업 및 복원 (JSON 내보내기 / 불러오기)

---

## 🌐 무료 웹 배포 안내 (Deployment Guide)

본 앱은 **별도 백엔드 서버나 API 키가 필요 없는 100% 정적 웹 앱**입니다. 아래 방법 중 하나로 무상 배포할 수 있습니다:

### 1. Vercel 배포 (가장 추천 - 10초 완료)
1. [Vercel](https://vercel.com) 접속 및 로그인
2. `Add New` -> `Project` 선택 후 본 프로젝트 폴더 드래그 & 드롭
3. Deploy 버튼 클릭 끝!

### 2. GitHub Pages 배포
1. GitHub에 Repository 생성 후 소스 코드 푸시
2. Repository `Settings` -> `Pages` 이동
3. `Source`를 `Deploy from a branch` (main / root)로 선택 후 Save 클릭!

### 3. Netlify 배포
1. [Netlify App](https://app.netlify.com) 접속
2. `Sites` -> 프로젝트 폴더를 화면에 드래그 & 드롭하여 즉시 배포!

---

## 💻 로컬 실행 방법 (Local Development)

```bash
# 로컬 개발 서버 실행
npm start
# 또는
npx serve .
```

브라우저에서 `http://localhost:3000` (또는 표시된 포트)로 접속합니다.
