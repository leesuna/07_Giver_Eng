# Daily 10-Min English - 디자인 가이드 문서 (DESIGN.md)

본 문서는 *Daily 10-Min English (The Giver Learner)* 애플리케이션의 디자인 시스템, 토큰 명세, 컴포넌트 라이브러리 및 각 화면별 UI 컴포넌트 구조를 상세히 정의합니다.

---

## 1. 디자인 시스템 토큰 명세 (Design Tokens)

### 🎨 컬러 팔레트 (Color Palette)

#### 메인 테마 & 배경 (Backgrounds)
| 변수명 | Hex / Value | 사용 용도 |
|---|---|---|
| `--bg-primary` | `#0f172a` (Slate 900) | 애플리케이션 기본 최하단 배경 |
| `--bg-secondary` | `#1e293b` (Slate 800) | 카드 백면, 모달 카드, 세컨더리 컨테이너 |
| `--bg-card` | `rgba(30, 41, 59, 0.7)` | Glassmorphism 메인 카드 배경 |
| `--bg-card-hover` | `rgba(51, 65, 85, 0.8)` | 호버 상태 카드 배경 |
| `--border-color` | `rgba(255, 255, 255, 0.1)` | 기본 구분선 및 은은한 카드 테두리 |
| `--border-accent` | `rgba(59, 130, 246, 0.3)` | 포커스 및 강조 테두리 (Blue 500 alpha) |

#### 텍스트 & 타이포그래피 (Typography Colors)
| 변수명 | Hex / Value | 사용 용도 |
|---|---|---|
| `--text-primary` | `#f8fafc` (Slate 50) | 메인 헤딩, 강조 텍스트 |
| `--text-secondary` | `#94a3b8` (Slate 400) | 본문 서브 설명, 메타 정보 |
| `--text-muted` | `#64748b` (Slate 500) | 캡션, 비활성 힌트, 레이블 |

#### 포인트 & 상태 색상 (Accent Colors)
| 변수명 | Hex / Value | 사용 용도 |
|---|---|---|
| `--accent-blue` | `#3b82f6` | 1단계 루틴, 프라이머리 버튼, 문장 하이라이트 |
| `--accent-cyan` | `#06b6d4` | 타이머 카운트다운, 챕터 셀렉터, 어휘 토큰 호버 |
| `--accent-emerald` | `#10b981` | 2단계 루틴, 단어 뜻(성공), 정답 테두리 |
| `--accent-amber` | `#f59e0b` | 3단계 루틴, 퀴즈 힌트, 연속 학습(Streak) 불꽃 |
| `--accent-purple` | `#8b5cf6` | 4단계 학습 완료 요약 |
| `--accent-rose` | `#f43f5e` | 퀴즈 오답 경고 및 취소 상태 |

#### 네온 글로우 효과 (Glow Shadows)
| 변수명 | Value | 사용 용도 |
|---|---|---|
| `--glow-blue` | `rgba(59, 130, 246, 0.25)` | 프라이머리 버튼 및 활성 탭 후광 |
| `--glow-emerald` | `rgba(16, 185, 129, 0.25)` | 암기 완료 뱃지 후광 |

---

### 🔤 타이포그래피 스케일 (Typography Scale)

#### 글꼴 폰트 패밀리 (Font Family)
- **헤더 & 타이틀**: `'Outfit', sans-serif` (Google Fonts, Wght 400~800)
- **본문 & UI 텍스트**: `'Inter', sans-serif` (Google Fonts, Wght 300~700)

#### 글자 크기 및 두께 (Type Scale)

| 레벨 | 폰트 패밀리 | Size | Weight | Line Height | 주요 적용 대상 |
|---|---|---|---|---|---|
| **Display Level** | Outfit | 2.2rem (35px) | 800 (Bold) | 1.1 | 10분 타이머 카운트다운 (`.timer-countdown`) |
| **Title 1 (H1)** | Outfit | 1.75rem (28px) | 700 (Bold) | 1.3 | 소설 리더 뷰 챕터 제목 (`.novel-title`) |
| **Title 2 (H2)** | Outfit | 1.6rem (25.6px) | 700 (Bold) | 1.35 | 탭별 메인 뷰 섹션 제목 (`h2`) |
| **Title 3 (H3)** | Outfit | 1.25rem (20px) | 700 (Bold) | 1.4 | 모달 단어 제목 (`.word-title`), 브랜드 로고 |
| **Subtitle / Sub** | Outfit | 1.2rem (19.2px) | 600 (SemiBold)| 1.4 | 10분 가이드 단계 헤딩 (`.phase-info h3`) |
| **Body Large** | Inter | 1.15rem (18.4px) | 400 (Regular) | 1.9 | 소설 원문 본문 단락 (`.paragraph-block`) |
| **Body Base** | Inter | 1.0rem (16px) | 400 (Regular) | 1.6 | 일반 폼 레이블, 퀴즈 정답 입력 필드 |
| **Body Small** | Inter | 0.88rem (14px) | 500 (Medium) | 1.5 | 툴바 제어 버튼, 팝업 설명 문구 |
| **Caption / Badge**| Inter | 0.8rem (12.8px) | 600 (SemiBold)| 1.2 | 연속 일수 뱃지, 챕터 뱃지, 발음 기호 |

---

### 📐 간격 체계 (Spacing System)

기본 `0.25rem` (4px) 단위 8pt 그리드 시스템에 기반합니다.

| 간격 토큰 | 크기 | 주요 사용 용도 |
|---|---|---|
| `space-xs` | `0.25rem` (4px) | 아이콘과 텍스트 사이 간격 (`gap: 0.25rem`) |
| `space-sm` | `0.5rem` (8px) | 탭 버튼 간격, 헤더 액션 요소 간격 |
| `space-md` | `0.75rem` (12px) | 모달 내부 요소, 카드 내부 헤더 간격 |
| `space-lg` | `1.0rem` (16px) | 컨트롤바 내부 여백, 폼 인풋 사이 간격 |
| `space-xl` | `1.25rem` ~ `1.5rem` (20~24px) | 카드 내부 여백(`padding: 1.25rem`), 컨테이너 padding |
| `space-2xl` | `2.0rem` (32px) | 소설 컨테이너 padding (`padding: 2rem`), 큰 섹션 간격 |

---

### 🔘 모서리 반경 (Border Radius)

| 변수명 | 값 | 적용 컴포넌트 |
|---|---|---|
| `--radius-sm` | `8px` | 문장 하이라이트 span, 소형 발음 버튼, 안내 정보 박스 |
| `--radius-md` | `12px` | 브랜드 로고 아이콘, 퀴즈 입력창, 챕터 선택 셀렉트박스 |
| `--radius-lg` | `20px` | 10분 타이머 바너, 리더 컨테이너, 플래시카드, 퀴즈 카드 |
| `--radius-full`| `9999px` | 메인 탭바 래퍼, 연속 학습 뱃지, 재생 컨트롤 원형 버튼 |

---

### 🌑 그림자 & 글로우 체계 (Shadows & Elevation)

| Elevation | Shadow CSS Value | 주요 적용 대상 |
|---|---|---|
| **Low Drop** | `0 4px 12px var(--glow-blue)` | 활성화된 탭 버튼, 프라이머리 버튼 기본 상태 |
| **Medium Card**| `0 8px 32px rgba(0, 0, 0, 0.3)` | 10분 가이드 학습 타이머 배너 |
| **High Sticky**| `0 10px 30px rgba(0,0,0,0.4), 0 0 20px rgba(59,130,246,0.15)` | 상단 스티키 오디오 플레이어 바 (`.audio-player-bar`) |
| **Floating Pop**| `0 20px 50px rgba(0, 0, 0, 0.5)` | 단어 팝업 팝오버 모달 카드 (`.modal-card`) |

---

## 2. 화면별 컴포넌트 구조 (Screen Component Tree)

```mermaid
graph TD
    AppShell[App Shell Header & Sticky Audio Bar]
    AppShell --> View1[VIEW 1: 10-Min Session Overview]
    AppShell --> View2[VIEW 2: Novel Reader View]
    AppShell --> View3[VIEW 3: Vocabulary Book View]
    AppShell --> View4[VIEW 4: Cloze Quiz View]
    AppShell --> View5[VIEW 5: Stats & Backup View]

    View2 --> Modal[Word Definition Modal Popover]
```

### 1. 래퍼 & 헤더 (App Shell & Navigation)
- **Top Header (`<header>`)**:
  - `Brand Logo`: 오렌지/블루 그라데이션 아이콘 + App Title
  - `Navigation Tabs (`<nav class="tabs">`)`: 5개 탭 분기 조작 버튼 (루틴, 소설, 단어장, 퀴즈, 통계)
  - `Header Actions`: 챕터 선택 셀렉트박스 (`.chapter-select-box`) + 연속 학습 불꽃 뱃지 (`.streak-badge`) + 10분 학습 시작 버튼 (`.btn-primary`)

---

### 2. 10분 가이드 학습 루틴 뷰 (`#session-view`)
- **Timer Banner (`.timer-banner`)**:
  - 현재 학습 단계 명칭 & 카운트다운 타이머 디스플레이 (`.timer-countdown`)
  - 전체 프로그레스 진행 바 (`.progress-track` -> `.progress-fill`)
- **Routine Phase Cards (4 Column Grid)**:
  - 1단계 (0~3분): 🔊 문장 듣기 (Blue Theme)
  - 2단계 (3~6분): 📖 단어 수집 (Emerald Theme)
  - 3단계 (6~9분): ✏️ 괄호 퀴즈 (Amber Theme)
  - 4단계 (9~10분): 📊 마무리 & 저장 (Purple Theme)

---

### 3. 소설 리더 뷰 (`#reader-view`)
- **Sticky Audio Player Bar (`.audio-player-bar`)**:
  - 재생/일시정지/반복/이전/다음/정지 아이콘 버튼 그룹 (`.player-controls`)
  - 현재 읽는 문장 실시간 미니 프리뷰 (`.playing-sentence-preview`)
  - 폰트 크기 조절기 (A- / A+) + TTS 재생 속도 선택기 (`.speed-select`)
  - 연속 재생 ON/OFF 토글 + 🔁 챕터 무한 반복 토글 (`.toggle-pill.loop-active`)
- **Novel Content Container (`.reader-container`)**:
  - 챕터 제목 & 메타 정보 (작가, 현재 문장 위치)
  - 챕터 요약 정보 박스 (`#chapter-desc-box`)
  - 클릭 가능한 단락 블록 (`.paragraph-block`) -> 문장 요소 (`.sentence-span.active`) -> 어휘 토큰 (`.word-token`)

---

### 4. 팝업 사전 모달 컴포넌트 (`#word-modal`)
- **Modal Overlay (`.modal-overlay.active`)**: 배경 딤(Dimmed Background with Backdrop Blur 8px)
- **Modal Card (`.modal-card`)**:
  - 헤더: 단어명 (`.word-title`) + 발음기호 (`.word-phonetic`) + 발음 듣기 🔊 버튼
  - 본문: 한국어 주요 뜻 박스 (`.word-meaning`) + 원문 내 문맥 예문 (`.word-context`)
  - 하단 액션: `닫기` 버튼 + `⭐ 단어장에 저장` 버튼

---

### 5. 나만의 단어장 뷰 (`#vocab-view`)
- **Filter Bar**: `전체`, `복습 필요`, `암기 완료` 세컨더리 필터 버튼 그룹
- **Vocab Card Grid (`.vocab-grid`)**:
  - **Flashcard Component (`.flashcard`)**: 3D 카드 뒤집기 애니메이션 (`rotateY(180deg)`)
  - **Card Front (`.card-front`)**: 단어 표제어, 발음기호, 뒤집기 힌트
  - **Card Back (`.card-back`)**: 한국어 뜻, 문맥 예문, 🔊 원어민 발음 재생 버튼

---

### 6. 문장 괄호 채우기 퀴즈 뷰 (`#quiz-view`)
- **Quiz Card (`.quiz-card`)**:
  - 카드 상단: 퀴즈 타이틀 + 현재 선택 챕터 뱃지 (`.chapter-badge`) + 문제 진행률 (`문제 1 / 5`)
  - 퀴즈 문장 상자 (`.quiz-sentence`): 정답 빈칸 마스킹 (`( ____ )`)
  - 입력 컨트롤 그룹: `정답 입력 필드 (.cloze-input)` + `확인` 버튼 + `🔊 문장 읽기` 버튼 + `💡 힌트` 버튼
  - 피드백 박스 (`#quiz-feedback-box`): 힌트 클릭 시 첫 글자/글자수/뜻 해설 표시, 제출 시 정답(초록)/오답(분홍) 시각화

---

### 7. 학습 기록 & 통계 뷰 (`#stats-view`)
- **Stats 4-Grid (`.stats-grid`)**:
  - 🔥 연속 학습 일수 카체
  - ⏱️ 총 학습 시간 카드
  - 📚 읽은 총 문장 수 카드
  - 💡 수집한 단어 수 카드
- **Backup & Restore Card**:
  - JSON 백업 데이터 내보내기 버튼 (`#export-json-btn`)
  - JSON 백업 파일 불러오기 버튼 (`#import-json-btn`)
