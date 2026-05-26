아, Agent Town README 형식으로 맞춰달라는 거구나! 다시 정리할게요.

---

# CodeBeat

A typing rhythm game for web development students. Type falling code keywords before they hit the ground — chain combos, track your WPM, and beat your high score.

---

## What it does

화면 위에서 코드 관련 단어들이 아래로 떨어진다. 단어를 정확히 타이핑해서 제거하면 점수를 얻고, 놓치면 목숨이 깎인다. 연속으로 성공할수록 콤보 배수가 쌓여 점수가 올라간다. 60초 안에 최고 점수를 노리는 것이 목표다.

**게임 흐름**

**시작 화면** — 난이도(Easy / Normal / Hard)를 선택하고 게임을 시작한다. 이전 최고 점수가 표시된다.

**게임 중** — 단어가 위에서 아래로 떨어진다. 입력창에 타이핑하면 매칭되는 단어가 실시간으로 하이라이트된다. Enter 또는 Space로 제출하면 단어가 제거되고 점수와 콤보가 올라간다. 단어가 화면 아래 위험 구역을 넘으면 목숨이 하나 감소한다. ESC로 일시정지할 수 있다.

**결과 화면** — 최종 점수, WPM, 정확도가 표시된다. 최고 점수 갱신 시 배지가 뜬다. 다시하기 또는 메뉴로 돌아갈 수 있다.

---

## Architecture

```
codebeat/
├── index.html       ← 게임 진입점, 화면 구조 (Start / Game / Result)
├── style.css        ← 레이아웃, 낙하 애니메이션, 다크 테마
├── game.js          ← 게임 루프 (requestAnimationFrame), 단어 스폰·낙하·충돌
├── input.js         ← 키보드 입력, 단어 매칭, WPM·정확도 계산
└── audio.js         ← Web Audio API 타이핑 효과음, 성공·실패 사운드
```

외부 라이브러리 없이 순수 HTML/CSS/JS로 구성. Canvas API로 배경 파티클을 렌더링하고, DOM으로 단어 오브젝트를 관리한다. 점수는 localStorage에 저장된다.

---

## 난이도 설정

| 항목 | Easy | Normal | Hard |
|---|---|---|---|
| 낙하 속도 | 느림 | 보통 | 빠름 |
| 스폰 주기 | 2.2초 | 1.6초 | 1.0초 |
| 최대 동시 단어 수 | 5개 | 7개 | 10개 |
| 목숨 | 5 | 3 | 2 |
| 단어 풀 | 짧은 HTML/CSS 키워드 | JS 함수·속성명 | 긴 Web API 메서드명 |

---

## 기술 스택

| 레이어 | 기술 |
|---|---|
| UI | HTML5 + CSS3 |
| 게임 로직 | Vanilla JS (ES6+) |
| 그래픽 | Canvas API (파티클, 배경) |
| 사운드 | Web Audio API |
| 저장 | localStorage |

---

## 개발 일정

| 일차 | 작업 |
|---|---|
| Day 1 오전 | HTML/CSS 레이아웃, 단어 낙하 애니메이션 |
| Day 1 오후 | 키보드 입력 감지, 단어 매칭 로직, 점수·콤보 시스템 |
| Day 2 오전 | 난이도 분기, Web Audio 효과음, 결과 화면 |
| Day 2 오후 | localStorage 최고 점수, 버그 수정, UI 마무리 |