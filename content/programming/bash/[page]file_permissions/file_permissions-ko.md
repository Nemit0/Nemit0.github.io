---
title: "파일 권한 (chmod, chown)"
description: "Unix/Linux 파일 권한 — rwx 권한, 8진수 표기, chmod, chown, umask, SUID/SGID/Sticky Bit, ACL."
date: "2026-03-05"
category: "programming/bash"
tags: ["bash", "Linux", "파일 권한", "chmod", "chown", "umask", "보안"]
author: "Nemit"
featured: false
pinned: false
---

# 파일 권한 (chmod, chown)

## 기본 권한 체계

Unix/Linux에서 모든 파일과 디렉토리에는 세 가지 유형의 사용자에 대해 세 가지 권한이 있습니다.

### 권한 유형

| 권한 | 파일에 대한 의미 | 디렉토리에 대한 의미 | 문자 | 숫자 |
|---|---|---|---|---|
| 읽기 | 내용 읽기 가능 | 목록 보기 가능 | `r` | 4 |
| 쓰기 | 내용 수정 가능 | 파일 생성/삭제 가능 | `w` | 2 |
| 실행 | 실행 가능 | 디렉토리 진입 가능 | `x` | 1 |

### 사용자 유형

| 구분 | 약자 | 설명 |
|---|---|---|
| 소유자 | `u` (user) | 파일을 소유한 사용자 |
| 그룹 | `g` (group) | 파일의 그룹에 속한 사용자들 |
| 기타 | `o` (other) | 나머지 모든 사용자 |
| 전체 | `a` (all) | u + g + o |

### `ls -l` 출력 읽기

```
-rwxr-xr-- 1 alice devs 4096 Mar  5 10:30 script.sh
│└┬┘└┬┘└┬┘
│ │  │  └── 기타(other): r-- (읽기만)
│ │  └───── 그룹(group): r-x (읽기+실행)
│ └──────── 소유자(user): rwx (모든 권한)
└────────── 파일 유형 (- = 일반 파일, d = 디렉토리, l = 심볼릭 링크)
```

---

## 8진수 표기

권한을 숫자로 표현합니다. 각 자리 = r(4) + w(2) + x(1):

| 8진수 | 이진수 | 권한 | 의미 |
|---|---|---|---|
| 0 | 000 | `---` | 권한 없음 |
| 1 | 001 | `--x` | 실행만 |
| 2 | 010 | `-w-` | 쓰기만 |
| 3 | 011 | `-wx` | 쓰기+실행 |
| 4 | 100 | `r--` | 읽기만 |
| 5 | 101 | `r-x` | 읽기+실행 |
| 6 | 110 | `rw-` | 읽기+쓰기 |
| 7 | 111 | `rwx` | 모든 권한 |

### 일반적인 권한 조합

| 8진수 | 권한 | 용도 |
|---|---|---|
| `755` | `rwxr-xr-x` | 실행 파일, 스크립트 |
| `644` | `rw-r--r--` | 일반 파일 |
| `600` | `rw-------` | 비밀 파일 (SSH 키 등) |
| `700` | `rwx------` | 개인 디렉토리, 스크립트 |
| `775` | `rwxrwxr-x` | 공유 디렉토리 |
| `444` | `r--r--r--` | 읽기 전용 |

---

## chmod — 권한 변경

### 기호 모드

```bash
chmod u+x script.sh         # 소유자에게 실행 권한 추가
chmod g-w file.txt           # 그룹에서 쓰기 권한 제거
chmod o=r file.txt           # 기타를 읽기 전용으로 설정
chmod a+r file.txt           # 모든 사용자에게 읽기 권한 추가
chmod u+x,g+r,o-rwx file.txt  # 여러 변경 동시에
chmod ug=rw,o=r file.txt     # 소유자+그룹=읽기쓰기, 기타=읽기
```

연산자:
- `+`: 권한 추가
- `-`: 권한 제거
- `=`: 권한을 정확히 설정

### 8진수 모드

```bash
chmod 755 script.sh          # rwxr-xr-x
chmod 644 file.txt           # rw-r--r--
chmod 600 secret.key         # rw-------
chmod 777 public.txt         # rwxrwxrwx (보안 위험!)
```

### 재귀적 적용

```bash
chmod -R 755 /path/to/dir    # 디렉토리와 모든 하위 항목에 적용

# 디렉토리와 파일에 다른 권한 적용
find /path -type d -exec chmod 755 {} \;   # 디렉토리: 755
find /path -type f -exec chmod 644 {} \;   # 파일: 644
```

---

## chown — 소유자 변경

```bash
chown alice file.txt             # 소유자 변경
chown alice:devs file.txt        # 소유자와 그룹 변경
chown :devs file.txt             # 그룹만 변경
chgrp devs file.txt              # 그룹만 변경 (chgrp 사용)
chown -R alice:devs /path/to/dir # 재귀적 적용
```

---

## umask — 기본 권한 설정

`umask`는 새로 생성되는 파일과 디렉토리의 **기본 권한을 결정하는 마스크**입니다.

```
기본 권한     = 최대 권한 - umask
파일:  666 - umask
디렉토리: 777 - umask
```

```bash
umask              # 현재 umask 표시 (예: 0022)
umask 022          # umask 설정

# umask 0022일 때:
# 새 파일:     666 - 022 = 644 (rw-r--r--)
# 새 디렉토리: 777 - 022 = 755 (rwxr-xr-x)

# umask 0077일 때:
# 새 파일:     666 - 077 = 600 (rw-------)
# 새 디렉토리: 777 - 077 = 700 (rwx------)
```

### 영구 설정

```bash
# ~/.bashrc 또는 ~/.profile에 추가
umask 022
```

---

## 특수 권한 비트

### SUID (Set User ID) — 4000

파일이 실행될 때 **소유자의 권한**으로 실행됩니다.

```bash
chmod u+s executable          # SUID 설정
chmod 4755 executable         # 8진수로 설정
ls -l /usr/bin/passwd
# -rwsr-xr-x 1 root root ... /usr/bin/passwd
#    ^ s = SUID (소유자 실행 위치에 s)
```

`passwd` 명령이 root 소유지만 일반 사용자도 비밀번호를 변경할 수 있는 이유입니다.

### SGID (Set Group ID) — 2000

**파일**: 그룹의 권한으로 실행.
**디렉토리**: 새로 생성되는 파일이 디렉토리의 그룹을 상속.

```bash
chmod g+s directory           # SGID 설정
chmod 2775 shared_dir         # 8진수로 설정
ls -ld shared_dir
# drwxrwsr-x 2 alice devs ... shared_dir
#       ^ s = SGID (그룹 실행 위치에 s)
```

### Sticky Bit — 1000

디렉토리에 설정하면 **파일 소유자만** 해당 파일을 삭제할 수 있습니다.

```bash
chmod +t directory            # Sticky Bit 설정
chmod 1777 /tmp               # 8진수로 설정
ls -ld /tmp
# drwxrwxrwt 22 root root ... /tmp
#          ^ t = Sticky Bit (기타 실행 위치에 t)
```

`/tmp` 디렉토리가 모든 사용자가 쓸 수 있지만 다른 사용자의 파일을 삭제할 수 없는 이유입니다.

### 대문자 S, T

실행 권한 없이 특수 비트만 설정된 경우 대문자로 표시됩니다:
- `S` (대문자): SUID/SGID 있지만 실행 권한 없음
- `T` (대문자): Sticky Bit 있지만 기타 실행 권한 없음

---

## ACL (접근 제어 목록)

기본 Unix 권한(소유자/그룹/기타)보다 **세밀한 권한 제어**가 필요할 때 사용합니다.

```bash
# ACL 지원 확인
mount | grep acl

# ACL 조회
getfacl file.txt

# ACL 설정
setfacl -m u:bob:rw file.txt       # bob에게 읽기+쓰기 권한
setfacl -m g:devs:rx file.txt      # devs 그룹에 읽기+실행 권한
setfacl -m o::r file.txt           # 기타에 읽기 권한

# 기본 ACL (디렉토리에서 새 파일에 상속)
setfacl -d -m u:bob:rw directory/

# ACL 삭제
setfacl -x u:bob file.txt         # bob의 ACL 항목 삭제
setfacl -b file.txt               # 모든 ACL 삭제

# 재귀적 ACL 설정
setfacl -R -m u:bob:rx /path/to/dir
```

### ACL이 적용된 파일

`ls -l` 출력에서 권한 끝에 `+`가 표시됩니다:

```
-rw-rw-r--+ 1 alice devs 4096 Mar  5 10:30 file.txt
          ^ ACL이 적용되어 있음
```

---

## 보안 모범 사례

```bash
# SSH 키 파일 권한
chmod 700 ~/.ssh
chmod 600 ~/.ssh/id_rsa              # 개인 키
chmod 644 ~/.ssh/id_rsa.pub          # 공개 키
chmod 600 ~/.ssh/authorized_keys

# 웹 서버 파일
chmod 644 /var/www/html/*.html       # HTML 파일
chmod 755 /var/www/html/             # 웹 루트 디렉토리
chmod 755 /var/www/html/cgi-bin/*.cgi  # CGI 스크립트

# 설정 파일
chmod 600 /etc/shadow                # 패스워드 해시
chmod 644 /etc/passwd                # 사용자 정보 (해시 제외)

# 777 권한은 절대 사용하지 마세요!
chmod 777 file    # ✗ 보안 위험: 모든 사용자가 읽기/쓰기/실행 가능
```
