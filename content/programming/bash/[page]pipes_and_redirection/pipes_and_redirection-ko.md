---
title: "파이프와 리다이렉션"
description: "Unix/Linux 파이프와 리다이렉션 — 파일 디스크립터, stdout/stderr 리다이렉션, 파이프, Here Document, 프로세스 치환, 명명된 파이프, 서브쉘."
date: "2026-03-05"
category: "programming/bash"
tags: ["bash", "Linux", "파이프", "리다이렉션", "stdin", "stdout", "stderr"]
author: "Nemit"
featured: false
pinned: false
---

# 파이프와 리다이렉션

## 파일 디스크립터

모든 프로세스는 세 개의 표준 **파일 디스크립터(FD)**를 가집니다:

| FD | 이름 | 기본 대상 | 설명 |
|---|---|---|---|
| 0 | `stdin` | 키보드 | 표준 입력 |
| 1 | `stdout` | 터미널 | 표준 출력 |
| 2 | `stderr` | 터미널 | 표준 에러 |

```
         +----------+
stdin →  |          | → stdout
(FD 0)   | 프로세스 |
         |          | → stderr
         +----------+   (FD 2)
            (FD 1)
```

---

## 출력 리다이렉션

### 기본 리다이렉션

```bash
# stdout을 파일로 (덮어쓰기)
command > output.txt
echo "hello" > file.txt

# stdout을 파일로 (추가)
command >> output.txt
echo "추가 내용" >> file.txt

# stderr를 파일로
command 2> error.txt

# stderr를 파일에 추가
command 2>> error.txt

# stdout과 stderr 모두 파일로
command > output.txt 2>&1         # 전통적 방법
command &> output.txt              # Bash 단축 표기
command &>> output.txt             # 추가 모드

# stdout과 stderr를 다른 파일로
command > stdout.txt 2> stderr.txt
```

### 출력 버리기

```bash
# stdout 버리기
command > /dev/null

# stderr 버리기
command 2> /dev/null

# 모든 출력 버리기
command > /dev/null 2>&1
command &> /dev/null
```

### `2>&1`의 의미

`2>&1`은 "파일 디스크립터 2(stderr)를 FD 1(stdout)이 현재 가리키는 곳으로 리다이렉트"라는 뜻입니다.

```bash
# 순서가 중요합니다!
command > file 2>&1     # ✓ 올바름: stdout→file, 그 다음 stderr→(stdout이 가는 곳=file)
command 2>&1 > file     # ✗ 의도와 다름: stderr→터미널, stdout→file
```

---

## 입력 리다이렉션

```bash
# 파일에서 stdin 읽기
command < input.txt
sort < unsorted.txt

# 명령의 출력을 다른 명령의 입력으로
sort < <(generate_data)
```

---

## 파이프 (|)

파이프는 한 명령의 **stdout**을 다른 명령의 **stdin**으로 연결합니다.

```bash
# 기본 파이프
command1 | command2 | command3

# 실용 예시
ls -la | grep ".txt"                   # .txt 파일 필터링
cat log.txt | sort | uniq              # 정렬 후 중복 제거
ps aux | grep python | wc -l          # Python 프로세스 수 세기
history | grep "git" | tail -5        # 최근 git 명령 5개
```

### 파이프 vs 리다이렉션

```bash
# 파이프: 프로세스 간 연결 (메모리)
command1 | command2

# 리다이렉션: 프로세스와 파일 간 연결 (디스크)
command1 > file
command2 < file
```

### `|&` — stderr도 파이프로

```bash
# stderr도 함께 파이프
command1 |& command2

# 위는 아래와 동일
command1 2>&1 | command2
```

### 파이프 실패 처리

기본적으로 파이프라인의 종료 코드는 **마지막 명령**의 종료 코드입니다.

```bash
# pipefail: 파이프 내 어느 명령이든 실패하면 실패
set -o pipefail
false | true        # pipefail 없으면 성공(0), 있으면 실패(1)

# PIPESTATUS 배열: 각 명령의 종료 코드
cmd1 | cmd2 | cmd3
echo "${PIPESTATUS[0]} ${PIPESTATUS[1]} ${PIPESTATUS[2]}"
```

---

## tee — 출력 분기

`tee`는 stdin을 **stdout과 파일 모두**에 출력합니다.

```bash
# 화면에도 출력하고 파일에도 저장
command | tee output.txt

# 파일에 추가
command | tee -a output.txt

# 여러 파일에 동시 출력
command | tee file1.txt file2.txt

# 파이프라인 중간에서 디버깅
command1 | tee /dev/stderr | command2    # 중간 결과를 stderr에 출력
```

---

## Here Document와 Here String

### Here Document (<<)

여러 줄의 텍스트를 명령의 stdin으로 전달합니다.

```bash
# 기본 형태
cat << EOF
첫 번째 줄
두 번째 줄
변수 확장: $HOME
EOF

# 변수 확장 방지 (구분자를 따옴표로)
cat << 'EOF'
변수 확장 안 됨: $HOME
명령 치환 안 됨: $(whoami)
EOF

# 들여쓰기 제거 (<<-)
cat <<- EOF
	탭으로 들여쓴 줄 (탭이 제거됨)
	들여쓰기가 깔끔하게 유지됨
EOF

# 파일에 쓰기
cat << EOF > config.txt
설정 파일 내용
server=localhost
port=8080
EOF
```

### Here String (<<<)

한 줄의 문자열을 stdin으로 전달합니다.

```bash
# 변수를 stdin으로 전달
grep "pattern" <<< "$변수"

# 문자열을 명령에 전달
bc <<< "3 + 4"      # 7

# 읽기
read -r first rest <<< "hello world foo"
echo "$first"       # hello
echo "$rest"        # world foo
```

---

## 프로세스 치환

`<(command)`는 명령의 출력을 **파일처럼** 사용할 수 있게 합니다.

```bash
# 두 명령의 출력 비교
diff <(sort file1.txt) <(sort file2.txt)

# 두 디렉토리 내용 비교
diff <(ls dir1/) <(ls dir2/)

# 여러 소스를 파일처럼 사용
paste <(cut -f1 file.txt) <(cut -f3 file.txt)

# 루프에서 사용 (서브쉘 문제 회피)
while read -r line; do
    echo "$line"
done < <(find . -name "*.txt")
```

### `>(command)` — 출력 프로세스 치환

```bash
# 출력을 여러 곳에 동시에 보내기
command | tee >(grep "error" > errors.txt) >(grep "warning" > warnings.txt) > all.txt
```

---

## 명명된 파이프 (FIFO)

명명된 파이프는 파일 시스템에 존재하는 **특수 파일**로, 프로세스 간 통신에 사용됩니다.

```bash
# 생성
mkfifo my_pipe

# 터미널 1: 데이터 쓰기 (읽는 쪽이 있을 때까지 대기)
echo "hello" > my_pipe

# 터미널 2: 데이터 읽기
cat < my_pipe       # "hello" 출력

# 사용 후 삭제
rm my_pipe
```

---

## 파일 디스크립터 관리

### 사용자 정의 FD

```bash
# FD 3번에 파일 열기 (쓰기)
exec 3> output.txt
echo "FD 3에 쓰기" >&3
exec 3>&-              # FD 3 닫기

# FD 4번에 파일 열기 (읽기)
exec 4< input.txt
read -r line <&4
exec 4<&-              # FD 4 닫기

# 읽기+쓰기
exec 5<> file.txt
echo "쓰기" >&5
read -r line <&5
exec 5>&-
```

### stderr 분리 패턴

```bash
# 로그 파일에 stderr만 저장하고, stdout은 화면에 표시
command 2> error.log

# stdout과 stderr를 각각 다른 파일에 저장하면서 화면에도 표시
{ command | tee stdout.log; } 2>&1 | tee stderr.log
```

---

## 서브쉘과 변수 범위

파이프의 각 명령은 **서브쉘**에서 실행됩니다. 서브쉘의 변수 변경은 부모 쉘에 영향을 주지 않습니다.

```bash
# 문제: 파이프 내 변수 변경이 반영되지 않음
count=0
echo -e "a\nb\nc" | while read -r line; do
    ((count++))
done
echo $count    # 0 (서브쉘에서 변경됨)

# 해결 방법 1: 프로세스 치환
count=0
while read -r line; do
    ((count++))
done < <(echo -e "a\nb\nc")
echo $count    # 3

# 해결 방법 2: lastpipe (Bash 4.2+)
shopt -s lastpipe
count=0
echo -e "a\nb\nc" | while read -r line; do
    ((count++))
done
echo $count    # 3
```

---

## 실용 패턴

```bash
# 스크립트의 모든 출력을 로그 파일에 기록
exec > >(tee -a script.log) 2>&1

# 에러만 이메일로 전송
command 2>&1 >/dev/null | mail -s "에러 보고" admin@example.com

# 여러 파일 동시 검색
grep "pattern" <(cat file1.txt file2.txt file3.txt)

# 진행 상황 표시 (pv 사용)
pv large_file.gz | gunzip > output.txt

# 파이프라인으로 데이터 처리
cat data.csv |
    tail -n +2 |              # 헤더 제거
    awk -F, '{print $3}' |    # 3번째 컬럼 추출
    sort |                     # 정렬
    uniq -c |                  # 중복 세기
    sort -rn |                 # 빈도순 정렬
    head -10                   # 상위 10개
```
