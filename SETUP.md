# 우리 학교 쌤톡 설치 안내

이 문서는 비개발자 선생님과 선생님의 Codex가 함께 따라가는 안내입니다. 명령 실행과 설정 편집은 Codex가 맡고, 로그인·학교 정보·배포 대상 확인은 선생님이 맡습니다. 화면에서 계정 비밀번호를 직접 입력하고 채팅에 전달하지 마세요.

## 1. 준비물

- 학교 담당자의 GitHub·Vercel 계정, Firebase를 만들 Google 계정
- 학교 정식 이름, 짧은 이름, 교표(없으면 기본 교표 사용)
- 관리자 Google 이메일 1개, 학번 자리 수, 요일별 상담 시간표
- Node.js 22.12 이상(22/24 계열). 보안 규칙 시험에는 Java 21 이상

학교 내부의 개인정보 안내·보관·삭제 절차와 서비스 이용 조건을 확인하세요. 무료 범위와 유료 전환 조건은 바뀔 수 있으므로 결제 수단 등록·유료 전환 전 담당자가 확인해야 합니다.

완료 확인: 준비한 계정과 자료가 해당 학교 소유인지 확인합니다.

## 2. 템플릿 복제와 Codex 열기

[공식 Starter 저장소](https://github.com/rollers765/ssam-talk-school-starter)의 `Use this template`에서 새 저장소를 만듭니다. 학교 저장소는 비공개를 권장합니다. 원본 제작자의 저장소나 운영 프로젝트를 수정하는 방식이 아닙니다. 복제본에도 MIT 저작권·라이선스 표시를 유지하세요.

새 저장소를 컴퓨터에 복제하고 그 폴더를 Codex 작업 폴더로 엽니다. [CODEX-PROMPT.md](CODEX-PROMPT.md)의 문장을 보냅니다.

Codex 할 일: 현재 폴더와 Git 원격 주소를 읽어 새 학교 저장소인지 확인하고 `npm ci`로 잠금 파일에 지정된 의존성을 설치합니다.

완료 확인: 현재 폴더에 `config/school.config.json`이 있고 원격 주소가 학교 소유 저장소입니다.

## 3. 학교 화면과 시간표 설정

`config/school.config.json`을 수정합니다. 구조는 `config/school.config.example.json`을 참고하세요.

| 항목 | 입력 내용 |
| --- | --- |
| school.name / shortName | 정식 이름 / 짧은 이름 |
| school.logoPath | public 안의 교표 경로. 기본 `/school-logo.svg` |
| student.numberLength / numberExample | 숫자 학번 길이 1~12 / 같은 길이 가상 예시 |
| consultation.weeksAvailable | 오늘부터 예약 가능한 주 수 1~12 |
| consultation.topics | 표시할 상담 주제 목록 |
| consultation.weeklySchedule | 월~금의 시작·종료·표시 이름·유형 |
| branding | 앱 이름, 설명, 대표 색상(`#` 뒤 6자리) |

예: 월요일 시간 목록에 `{"start":"09:30","end":"09:45","label":"쉬는 시간","type":"break"}`를 넣습니다. 시간 유형은 `break`, `lunch`, `after` 중 하나입니다. 쉬는 요일은 빈 목록으로 둡니다. 한 주에 상담 시간이 최소 1개는 있어야 하며 겹친 시간은 저장하지 않습니다.

교표를 직접 넣을 때는 학교가 사용 권한을 가진 PNG/JPG/SVG/WebP 파일만 사용하세요. 기본 공유 이미지 `public/og.png`는 학교 고유 정보를 포함하지 않습니다. 변경하려면 1200×630 PNG로 교체합니다.

```sh
npm run check:setup -- --demo
npm run dev:demo
```

완료 확인: 미리보기 학교명·교표·학번 안내·시간표가 학교 설정과 맞습니다. 이 단계에서는 실계정 로그인을 시험하지 않습니다.

## 4. 학교 Firebase 준비

선생님 할 일: Firebase Console에서 새 프로젝트와 웹 앱을 만들고, Firestore Database를 만듭니다. 데이터 위치를 신중히 선택하고 보안 규칙은 잠긴 상태로 시작합니다. Authentication에서 Google 로그인을 켜고 지원 이메일을 지정합니다. 일반 학생·교사는 서버에서 발급한 사용자 토큰으로 로그인하므로 이메일/비밀번호나 익명 인증을 추가로 켤 필요가 없습니다.

Codex 할 일: 웹 앱 설정의 프로젝트 ID, API key, storageBucket, messagingSenderId, appId를 해당 학교 연결값으로 정리합니다. 이 공개 웹 설정만으로는 학생 데이터 접근 권한이 생기지 않습니다.

서비스 계정 비공개 키는 해당 학교 프로젝트에서만 발급합니다. 다운로드한 JSON은 비밀번호처럼 취급하고 GitHub·채팅·스크린샷에 넣지 마세요. Vercel의 `FIREBASE_SERVICE_ACCOUNT`에는 JSON 전체를 한 줄로 입력합니다. 키를 잃거나 노출하면 담당자가 교체해야 합니다.

완료 확인: Firebase 프로젝트 ID가 원본 제작자의 것이 아니라 새 학교 프로젝트입니다.

## 5. Vercel 프로젝트와 주소 확보

선생님 할 일: 새 학교 GitHub 저장소를 Vercel로 가져오고 프로젝트 이름·소유 팀·예정 운영 도메인을 확인합니다. Framework는 Vite, 출력 폴더는 `dist`, 운영 Build Command는 `npm run build`입니다.

설정 전 첫 빌드가 실패하는 것은 정상적인 보호 장치입니다. 프로젝트 설정에서 실제 배정된 운영 도메인을 확인하세요. 주소를 확보하기 위해 운영 보호 검사를 제거하거나 원본 학교의 값을 넣지 마세요.

완료 확인: `https://…vercel.app` 또는 학교 도메인을 정확히 확인합니다. Preview 임시 주소를 운영 주소로 쓰지 않습니다.

## 6. 연결값과 자동 설정

Codex 할 일: `config/deployment.example.json`을 참고해 Git에서 제외되는 `work/deployment.private.json`을 준비합니다. 이 파일의 `env`에는 해당 학교 연결값을 채웁니다. 비밀값은 채팅에 요구하지 않습니다.

```sh
npm run configure:school -- --input work/deployment.private.json
```

도구는 공개 학교 설정, `.env.local`, 관리자용 `firestore.rules`, `vercel.json`을 준비합니다. PIN 보안값은 최초에만 생성하고 재실행 시 유지합니다. 파일 일부를 변경하다 오류가 나면 이전 내용으로 복구합니다. 원본 학교 주소나 샘플 연결값을 넣으면 거부합니다.

`VITE_FIREBASE_AUTH_DOMAIN`은 실제 Vercel 운영 도메인으로 자동 설정됩니다. `/__/auth/…` 요청은 해당 학교의 Firebase 인증 처리 주소로 중계됩니다.

| 변수 | 보관 위치와 의미 |
| --- | --- |
| VITE_ADMIN_EMAIL | 관리자 Google 이메일. 브라우저에도 전달되는 공개 식별값이며 비밀번호가 아닙니다. |
| VITE_SITE_URL | 실제 HTTPS 운영 주소 |
| VITE_FIREBASE_* | 해당 학교 Firebase 웹 연결값 |
| VITE_GOOGLE_HOSTED_DOMAIN | 선택 사항. 관리자 계정 선택 도움말이며 보안 권한 검사를 대신하지 않습니다. |
| STUDENT_AUTH_SECRET | 최초 생성 후 유지할 64자리 서버 비밀값 |
| FIREBASE_SERVICE_ACCOUNT | 같은 프로젝트의 서버 전용 서비스 계정 JSON |

`.env.local`을 화면에 통째로 출력하지 마세요. 서비스 계정은 로컬에서 읽어 넣거나 Vercel에서 직접 입력합니다. 로컬 환경 파일에서 서비스 계정 JSON을 단일 인용부호로 감싸면 JSON 안의 `\n` 표현을 그대로 유지할 수 있습니다.

이 값들을 해당 Vercel 프로젝트의 Production 환경 변수에도 등록합니다. 브라우저로 전달되는 `VITE_` 이름에 서비스 계정이나 PIN 비밀값을 넣으면 안 됩니다. 학생 자료를 보호하기 위해 Preview에는 운영 자격 증명을 공유하지 않는 것을 기본으로 합니다.

완료 확인: `npm run check:deploy`가 통과합니다. 이 검사는 연결값 형식과 규칙 일치를 검사하며 실제 외부 로그인 성공을 보장하는 검사는 아닙니다.

## 7. 관리자 모바일 Google 로그인 설정

Firebase Authentication의 승인된 도메인에 실제 사이트의 호스트 이름을 추가합니다. Google Cloud의 해당 OAuth 클라이언트에는 `https://실제사이트/__/auth/handler`를 승인된 리디렉션 URI로 등록합니다. 해당 값은 본인 프로젝트에서 확인한 주소로만 바꿉니다.

Firebase 인증 처리 중계는 단순 페이지 이동이 아니라 동일 출처 프록시입니다. 관련 설정은 [Firebase 공식 리디렉션 로그인 안내](https://firebase.google.com/docs/auth/web/redirect-best-practices)의 reverse proxy 옵션을 따릅니다.

완료 확인: 최종 배포 후 관리자 Google 로그인을 PC와 모바일에서 각각 확인합니다.

## 8. 검사와 별도 보안 규칙 배포

```sh
npm test
npm run lint
npm run build
npm run test:rules
npm run prepare:rules
npm run check:deploy
```

로컬 규칙 시험은 `demo-school-starter` 에뮬레이터 전용 프로젝트를 사용합니다. 실제 학교 자료를 읽지 않습니다. Java가 없으면 이 검사를 생략한 채 보안 검증 완료라고 표시하지 마세요.

선생님이 대상 프로젝트 ID를 확인한 뒤 Firebase CLI로 로그인하고 아래 명령의 `YOUR_SCHOOL_PROJECT_ID`를 실제 값으로 바꿔 규칙만 배포합니다.

```sh
npx firebase login
npx firebase deploy --only firestore:rules --project YOUR_SCHOOL_PROJECT_ID
```

Firestore 규칙은 Vercel 배포로 자동 갱신되지 않습니다. 관리자 이메일을 변경할 때는 규칙 재생성과 Firebase 배포, Vercel 환경 변수 갱신·재배포를 함께 진행해야 합니다.

## 9. Vercel 운영 배포와 확인

설정된 공개 파일만 학교 저장소에 커밋·푸시하고 Vercel에서 새 배포를 시작합니다. `.env.local`, 서비스 계정, `.vercel`, 생성된 규칙, `work/`는 Git에 포함하지 않습니다.

다음 흐름을 가짜 자료로 직접 확인하세요.

1. 지정 관리자 Google 로그인과 등록 관리 화면
2. 교사 이름·부서·PIN 신청 → 관리자 승인 → 교사 로그인
3. 학생 이름·학번·PIN 등록 → 선생님 선택 → 상담 신청
4. 교사 확정·시간 제안 → 학생 화면 반영·응답
5. 취소·완료·기록 삭제와 예약 시간 해제
6. 같은 학번의 다른 PIN 등록과 등록별 이력 분리
7. PIN 초기화와 정확히 선택한 계정만 삭제
8. 다른 교사의 상담이 보이지 않는지, 새로고침·모바일 로그인 정상인지 확인

가짜 계정 삭제는 시험 계정 ID를 다시 확인한 뒤 진행합니다. 운영 학생 자료를 시험 정리 대상으로 사용하지 마세요.

## 10. 운영·업데이트·문제 해결

- 설정 재실행: 비밀값은 유지됩니다. PIN 비밀값이나 Firebase 프로젝트 ID를 바꾸는 작업은 단순 재설정이 아니라 계정 이전 작업입니다.
- 학번 길이: 운영 후 변경하면 기존 로그인에 영향을 줍니다. 도구가 자동 변경을 막으므로 별도 이전 계획을 세우세요.
- 시간표 변경: 과거 상담은 삭제하지 않으며 미래 시간표만 바꿉니다. 이미 잡힌 상담을 먼저 확인하세요.
- 학생·교사 PIN: 원문을 관리자에게 보여주거나 이메일로 전달하는 기능은 없습니다.
- 설정 오류: 오류에 표시된 항목만 수정합니다. 비밀값 전체를 복사해 채팅에 붙여넣지 마세요.
- Google 로그인 오류: 운영 도메인, 승인 도메인, OAuth 리디렉션 URI, Vercel 인증 중계 경로를 대조합니다.
- 업데이트: 새 버전 변경 안내를 읽고 필요한 부분만 적용합니다. 기존 비밀값·학생 자료는 덮어쓰지 않습니다.

GitHub Template 지정은 저장소 설정에서 수행합니다. [GitHub 공식 안내](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-template-repository), Vite 배포는 [Vercel 공식 안내](https://vercel.com/docs/frameworks/frontend/vite)를 참고하세요.
