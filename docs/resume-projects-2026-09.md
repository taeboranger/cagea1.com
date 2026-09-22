# SKKEDULE / SKKU Ping 이력서 변경

## 저장 및 운영 반영

- `lib/resume.ts`는 `process.cwd()/data/resume.json`을 읽고 쓴다. 프로젝트 필드는 `id, title, period, link, githubLink, description`을 그대로 사용한다.
- 로컬 데이터에서 두 항목이 없음을 확인하여 추가했다. 기존 6개 프로젝트와 이름·자기소개·기술·공개 여부·updatedAt 등 기존 필드는 변경하지 않았다. 기간은 확인되지 않아 빈 문자열로 두었다.
- `data/*.json`은 Git 제외 대상이며 Docker 빌드에서도 `data/`가 제외된다. 따라서 로컬 JSON 수정이나 코드 배포만으로 운영 이력서가 바뀌지 않는다.
- 현재 워크플로는 Docker 이미지를 빌드하고 별도 설정 저장소의 이미지 태그를 갱신한다. 로컬에서 확인한 `config/cagea1.com/base/cagea1/deployment.yaml`은 PVC `cagea1-data`를 `/app/data`에 연결한다. 이 설정이 적용된 운영에서는 PVC의 `/app/data/resume.json`이 원본이다. 실제 클러스터 상태 및 운영 데이터는 조회하거나 변경하지 않았다.
- 이번 작업은 로컬 수정·검증만 수행한다. 커밋, 푸시, 이미지 배포, 운영 편집은 수행하지 않는다.

## 추후 운영 적용 (이번에는 실행하지 않음)

운영 데이터와 로컬 데이터는 별개이므로 **로컬 resume.json 전체를 운영에 복사하지 않는다.**

1. 운영 최신 이력서 원본을 안전한 위치에 백업한다.
2. 운영 관리자 편집 화면에서 최신 데이터를 다시 불러온다. 동시에 다른 편집 세션에서 저장하지 않는다.
3. `content/resume-projects-2026-09.json`의 두 항목만 반영한다. 제목(대소문자·공백 무시), 서비스 주소, GitHub 주소로 기존 항목을 확인한다.
4. 동일 프로젝트가 있으면 기존 ID·순서·확인된 기간을 유지하며 제목·링크·설명만 수정한다. 다른 편집 내용이 섞여 있으면 비교 후 병합한다. 일치 후보가 여러 개면 자동 삭제·중복 추가하지 말고 먼저 확인한다.
5. 없는 항목만 추가하고, 확인되지 않은 기간은 비운다. 설명은 기존 HTML 문단 구조를 사용한다. 편집 화면에는 HTML 소스 대신 렌더링된 문단 텍스트를 입력한다.
6. 저장 후 로그인 상태에서 표시·링크·모바일 레이아웃을 확인한다. 공개 여부를 변경하지 않으며 비공개 상태라면 비로그인 404를 유지한다.

별도 변경 JSON은 검토·이관용이며 앱 시작 시 자동 병합하지 않는다. 이후 관리자 편집 내용을 덮어쓰지 않기 위한 선택이다.

## 문구 근거

SKKEDULE:
- backend의 `build.gradle`, `UserService.java`(입학년도·전공·인증영역별 요건), `CompletedCourseService.java`(이수 내역), `CourseFilterService.java`(남은 요건별 강의 탐색).
- fe의 `package.json`, `src/lib/api.ts`(졸업 요건·이수 과목·강의 검색 연결).
- extension의 `manifest.json` 및 JavaScript content script 구성(GLS 학적·이수 내역 연동).

SKKU Ping (README는 근거로 사용하지 않음):
- `server/src/campus/ai.ts`: 질문 필드 구조화, 과거 질문·답변 근거의 답변 생성과 출처 ID 검증.
- `service.ts`: 유사 질문 검색, 사용자 매칭, 푸시 발송 큐.
- `domain.ts`: 학과·거리·유사 질문 이력·답변 응답률을 이용한 점수화.
- `routes.ts`, `push.ts`: 푸시 발송과 해결 상태 전환.
- `server.ts`의 D1 바인딩, `wam/src/pages/Campus.tsx` 및 패키지 설정의 TypeScript·React.
- 현재 매칭의 history 조회는 답변자 이력이 아닌 **답변을 받은 질문 작성자의 이력**을 사용한다. 따라서 “유사 질문 답변 경험” 대신 “유사 질문 이력”으로 서술했다.
- 개인 담당 범위와 AI를 활용한 데모 초안 작업은 사용자가 제공한 역할 설명에 근거한다. 서비스 전체 구현을 개인 실적으로 표현하지 않는다.

## 검증

`npx playwright test tests/resume.spec.ts`로 기존 데이터 보존, 항목 중복 없음, 링크·문단, 1280/390/320px 레이아웃, 비공개 접근 제어를 검증한다. 테스트는 로컬 로그인 쿠키만 사용하며 이력서 데이터를 저장하거나 공개로 전환하지 않는다.
