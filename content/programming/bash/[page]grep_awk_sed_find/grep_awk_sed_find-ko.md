---
title: "텍스트 처리 도구 (grep, awk, sed, find)"
description: "Unix/Linux 텍스트 처리 핵심 도구 — grep 패턴 검색, awk 컬럼 처리, sed 스트림 편집, find 파일 검색, xargs 활용, 도구 조합 기법."
date: "2026-03-05"
category: "programming/bash"
tags: ["bash", "Linux", "grep", "awk", "sed", "find", "텍스트 처리"]
author: "Nemit"
featured: false
pinned: false
---

# 텍스트 처리 도구 (grep, awk, sed, find)

## grep — 패턴 검색

`grep`은 파일이나 입력에서 **정규표현식 패턴**과 일치하는 줄을 검색합니다.

### 기본 사용법

```bash
grep "패턴" 파일명              # 파일에서 패턴 검색
grep "error" log.txt            # log.txt에서 "error" 포함 줄 출력
grep -i "error" log.txt         # 대소문자 무시
grep -n "error" log.txt         # 줄 번호 표시
grep -c "error" log.txt         # 일치하는 줄 수 출력
grep -v "debug" log.txt         # 일치하지 않는 줄 출력 (반전)
grep -r "TODO" ./src            # 디렉토리 재귀 검색
grep -l "error" *.log           # 일치하는 파일명만 출력
grep -w "error" log.txt         # 단어 단위 일치 (errors는 불일치)
```

### 정규표현식과 함께 사용

```bash
grep "^Error" log.txt           # "Error"로 시작하는 줄
grep "failed$" log.txt          # "failed"로 끝나는 줄
grep "error\|warning" log.txt   # error 또는 warning (BRE)
grep -E "error|warning" log.txt # 확장 정규표현식 (ERE)
grep -E "[0-9]{3}" log.txt      # 숫자 3자리 이상 패턴
grep -P "\d{3}" log.txt         # Perl 호환 정규표현식 (PCRE)
```

### 컨텍스트 표시

```bash
grep -A 3 "error" log.txt       # 일치 줄 + 뒤 3줄
grep -B 2 "error" log.txt       # 일치 줄 + 앞 2줄
grep -C 2 "error" log.txt       # 일치 줄 + 앞뒤 2줄
```

### 유용한 조합

```bash
# 여러 파일에서 검색 후 결과 정렬
grep -rn "TODO" ./src | sort

# 특정 파일 유형만 검색
grep -rn --include="*.py" "import" ./

# 바이너리 파일 제외
grep -rI "pattern" ./

# 프로세스 검색 (자기 자신 제외)
ps aux | grep "[n]ginx"
```

---

## awk — 컬럼 기반 텍스트 처리

`awk`는 구조화된 텍스트 데이터를 **필드(컬럼) 단위**로 처리하는 프로그래밍 언어입니다.

### 기본 구조

```
awk '패턴 { 동작 }' 파일
```

- `$0`: 전체 줄
- `$1`, `$2`, ...: 첫 번째, 두 번째 필드
- `$NF`: 마지막 필드
- `NR`: 현재 줄 번호
- `NF`: 필드 개수
- `FS`: 필드 구분자 (기본값: 공백/탭)

### 기본 사용법

```bash
# 특정 컬럼 출력
awk '{print $1}' file.txt            # 첫 번째 컬럼
awk '{print $1, $3}' file.txt        # 첫 번째, 세 번째 컬럼
awk '{print $NF}' file.txt           # 마지막 컬럼

# 구분자 지정
awk -F: '{print $1, $3}' /etc/passwd # : 구분자로 파싱
awk -F, '{print $2}' data.csv        # CSV 파싱

# 조건부 출력
awk '$3 > 100 {print $1, $3}' data.txt   # 3번째 컬럼 > 100인 줄
awk '/error/ {print $0}' log.txt          # "error" 포함 줄
awk 'NR >= 10 && NR <= 20' file.txt       # 10~20번째 줄
```

### 계산과 집계

```bash
# 합계
awk '{sum += $3} END {print "합계:", sum}' data.txt

# 평균
awk '{sum += $3; count++} END {print "평균:", sum/count}' data.txt

# 최대값
awk 'BEGIN {max=0} $3 > max {max=$3} END {print "최대:", max}' data.txt

# 고유 값 세기
awk '{count[$1]++} END {for (k in count) print k, count[k]}' data.txt
```

### 포맷팅

```bash
# printf로 형식 지정 출력
awk '{printf "%-20s %10.2f\n", $1, $3}' data.txt

# BEGIN/END 블록
awk 'BEGIN {print "이름", "점수"} {print $1, $3} END {print "---끝---"}' data.txt

# 구분자 변경하여 출력
awk -F: 'BEGIN {OFS=","} {print $1, $3, $6}' /etc/passwd
```

---

## sed — 스트림 편집기

`sed`는 텍스트를 **줄 단위로 변환**하는 스트림 편집기입니다.

### 치환 (s 명령)

```bash
sed 's/old/new/' file.txt         # 각 줄의 첫 번째 매치만 치환
sed 's/old/new/g' file.txt        # 모든 매치 치환 (global)
sed 's/old/new/gi' file.txt       # 대소문자 무시 + 전체 치환
sed 's/old/new/2' file.txt        # 각 줄의 두 번째 매치만 치환
```

### 파일 수정

```bash
sed -i 's/old/new/g' file.txt          # 원본 파일 직접 수정
sed -i.bak 's/old/new/g' file.txt      # 백업 후 수정 (.bak 생성)
```

### 줄 선택과 삭제

```bash
sed -n '5p' file.txt              # 5번째 줄만 출력
sed -n '5,10p' file.txt           # 5~10번째 줄
sed -n '/pattern/p' file.txt      # 패턴 일치 줄만 출력

sed '5d' file.txt                 # 5번째 줄 삭제
sed '/^#/d' file.txt              # 주석(#으로 시작) 줄 삭제
sed '/^$/d' file.txt              # 빈 줄 삭제
sed '1,3d' file.txt               # 1~3번째 줄 삭제
```

### 삽입과 추가

```bash
sed '3i\새로운 줄' file.txt        # 3번째 줄 앞에 삽입
sed '3a\새로운 줄' file.txt        # 3번째 줄 뒤에 추가
sed '/pattern/a\새로운 줄' file.txt # 패턴 일치 줄 뒤에 추가
```

### 다중 명령

```bash
# -e로 여러 명령 실행
sed -e 's/foo/bar/g' -e 's/baz/qux/g' file.txt

# 세미콜론으로 구분
sed 's/foo/bar/g; s/baz/qux/g' file.txt
```

### 정규표현식 그룹

```bash
# 캡처 그룹과 역참조
sed 's/\(.*\):\(.*\)/\2:\1/' file.txt    # "a:b" → "b:a"

# 확장 정규표현식
sed -E 's/([0-9]+)-([0-9]+)/\2-\1/' file.txt
```

---

## find — 파일 검색

`find`는 디렉토리 트리를 순회하며 조건에 맞는 **파일과 디렉토리를 검색**합니다.

### 이름으로 검색

```bash
find /path -name "*.txt"          # 이름 패턴 (대소문자 구분)
find /path -iname "*.txt"         # 대소문자 무시
find . -name "*.py" -o -name "*.js"  # OR 조건
```

### 유형으로 검색

```bash
find . -type f                    # 파일만
find . -type d                    # 디렉토리만
find . -type l                    # 심볼릭 링크만
```

### 크기로 검색

```bash
find . -size +100M                # 100MB보다 큰 파일
find . -size -1k                  # 1KB보다 작은 파일
find . -empty                     # 빈 파일/디렉토리
```

### 시간으로 검색

```bash
find . -mtime -7                  # 최근 7일 이내 수정된 파일
find . -mtime +30                 # 30일 이상 전에 수정된 파일
find . -mmin -60                  # 최근 60분 이내 수정
find . -newer reference.txt       # reference.txt보다 새로운 파일
```

### 권한으로 검색

```bash
find . -perm 644                  # 정확히 644 권한
find . -perm -u+x                 # 사용자 실행 권한 있는 파일
find . -user alice                # alice 소유 파일
```

### 검색 후 동작 실행

```bash
# -exec: 검색 결과에 명령 실행
find . -name "*.tmp" -exec rm {} \;           # 각 파일에 rm 실행
find . -name "*.txt" -exec grep "pattern" {} +  # 여러 파일을 한 번에 grep

# -delete: 직접 삭제
find . -name "*.tmp" -delete

# -print0과 xargs: 특수 문자가 있는 파일명 안전 처리
find . -name "*.log" -print0 | xargs -0 rm
```

---

## xargs — 표준 입력을 명령 인자로 변환

```bash
# 기본 사용법
echo "file1 file2 file3" | xargs rm

# 한 번에 하나씩 실행
echo -e "file1\nfile2" | xargs -I {} cp {} /backup/

# 병렬 실행
find . -name "*.png" | xargs -P 4 -I {} convert {} {}.jpg

# NULL 구분자 (파일명에 공백이 있을 때)
find . -name "*.txt" -print0 | xargs -0 wc -l

# 최대 인자 수 제한
find . -name "*.log" | xargs -n 10 rm    # 10개씩 묶어서 rm 실행
```

---

## 도구 조합 예제

```bash
# 로그에서 IP 주소 추출 후 빈도 정렬
grep -oP '\d+\.\d+\.\d+\.\d+' access.log | sort | uniq -c | sort -rn | head

# 소스 코드에서 TODO 찾아서 파일별 정리
grep -rn "TODO" ./src | awk -F: '{print $1}' | sort | uniq -c | sort -rn

# CSV의 특정 컬럼 합계
awk -F, '{sum += $3} END {print sum}' data.csv

# 7일 이상 된 로그 파일 삭제
find /var/log -name "*.log" -mtime +7 -exec rm {} \;

# 모든 Python 파일에서 특정 함수명 변경
find . -name "*.py" -exec sed -i 's/old_func/new_func/g' {} +

# 큰 파일 찾기 (크기순 정렬)
find . -type f -exec du -h {} + | sort -rh | head -20

# 설정 파일에서 주석과 빈 줄 제거
grep -v '^#' config.conf | grep -v '^$'
# 또는
sed '/^#/d; /^$/d' config.conf
```
