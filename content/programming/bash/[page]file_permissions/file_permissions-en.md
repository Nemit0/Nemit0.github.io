---
title: "File Permissions (chmod, chown, umask)"
description: "Unix file permission system — read/write/execute, octal notation, chmod, chown, chgrp, special permissions (SUID, SGID, sticky bit), umask, and ACLs."
date: "2026-03-05"
category: "programming/bash"
tags: ["bash", "Linux", "permissions", "chmod", "chown", "security", "file system"]
author: "Nemit"
featured: false
pinned: false
---

# File Permissions (chmod, chown, umask)

## The Permission Model

Every file and directory in Unix has three sets of permissions for three categories of users:

```
-rwxr-xr-- 1 alice developers 4096 Mar 5 10:00 script.sh
│├─┤├─┤├─┤
│ │  │  │
│ │  │  └── Others (everyone else)
│ │  └───── Group (developers)
│ └──────── Owner (alice)
└────────── File type (- = file, d = directory, l = symlink)
```

### Permission Bits

| Symbol | Octal | File | Directory |
|---|---|---|---|
| `r` (read) | 4 | Read file contents | List directory contents |
| `w` (write) | 2 | Modify file | Create/delete files in directory |
| `x` (execute) | 1 | Execute as program | Enter (cd into) directory |
| `-` | 0 | Permission denied | Permission denied |

### Reading Permission Strings

```
rwxr-xr--
│││││││││
│││││││└┘── Others: r-- (read only = 4)
│││││└┘──── Group:  r-x (read + execute = 5)
│││└┘────── Owner:  rwx (read + write + execute = 7)
```

Octal: `754`

---

## Octal Notation

Each permission set is a 3-bit number (0-7):

| Octal | Binary | Permissions |
|---|---|---|
| 0 | 000 | `---` |
| 1 | 001 | `--x` |
| 2 | 010 | `-w-` |
| 3 | 011 | `-wx` |
| 4 | 100 | `r--` |
| 5 | 101 | `r-x` |
| 6 | 110 | `rw-` |
| 7 | 111 | `rwx` |

### Common Permission Patterns

| Octal | String | Typical Use |
|---|---|---|
| `644` | `rw-r--r--` | Regular files |
| `755` | `rwxr-xr-x` | Executable files, directories |
| `600` | `rw-------` | Private files (SSH keys, configs) |
| `700` | `rwx------` | Private directories |
| `777` | `rwxrwxrwx` | Full access for everyone (avoid!) |
| `664` | `rw-rw-r--` | Group-writable files |
| `775` | `rwxrwxr-x` | Group-writable directories |

---

## chmod — Change Permissions

### Octal Mode

```bash
chmod 755 script.sh       # rwxr-xr-x
chmod 644 config.txt      # rw-r--r--
chmod 600 id_rsa          # rw------- (private key)
chmod 700 ~/.ssh           # rwx------
```

### Symbolic Mode

```bash
chmod u+x script.sh       # Add execute for owner
chmod g+w file.txt        # Add write for group
chmod o-r file.txt        # Remove read for others
chmod a+r file.txt        # Add read for all (a = all = u+g+o)
chmod u=rwx,g=rx,o=r file # Set exact permissions

chmod +x script.sh        # Add execute for all (same as a+x)
chmod -w file.txt         # Remove write for all
```

Symbolic mode operators:
- `+` — add permission
- `-` — remove permission
- `=` — set exact permission

Who:
- `u` — user (owner)
- `g` — group
- `o` — others
- `a` — all (default if omitted)

### Recursive

```bash
chmod -R 755 directory/    # Apply to all files and subdirs
chmod -R u+rw directory/   # Add read+write recursively

# Often you want different permissions for files vs directories:
find /path -type f -exec chmod 644 {} +    # Files: 644
find /path -type d -exec chmod 755 {} +    # Directories: 755
```

---

## chown — Change Owner and Group

```bash
chown alice file.txt              # Change owner to alice
chown alice:developers file.txt   # Change owner AND group
chown :developers file.txt        # Change group only
chown -R alice:staff directory/   # Recursive

# Only root can change ownership
sudo chown root:root /etc/config
```

## chgrp — Change Group

```bash
chgrp developers file.txt        # Change group
chgrp -R staff directory/        # Recursive
```

---

## umask — Default Permission Mask

`umask` determines the default permissions for newly created files and directories.

```bash
umask                # Show current umask (e.g., 0022)
umask 022            # Set umask
umask -S             # Show in symbolic form (e.g., u=rwx,g=rx,o=rx)
```

### How umask Works

Default full permissions:
- Files: `666` (no execute by default)
- Directories: `777`

The umask is **subtracted** (technically, bitwise AND with complement):

```
Files:       666 - 022 = 644 (rw-r--r--)
Directories: 777 - 022 = 755 (rwxr-xr-x)
```

| umask | File Default | Directory Default |
|---|---|---|
| `000` | `666 (rw-rw-rw-)` | `777 (rwxrwxrwx)` |
| `022` | `644 (rw-r--r--)` | `755 (rwxr-xr-x)` |
| `027` | `640 (rw-r-----)` | `750 (rwxr-x---)` |
| `077` | `600 (rw-------)` | `700 (rwx------)` |

Set umask in `~/.bashrc` or `~/.profile` for persistence:

```bash
umask 027    # Restrictive: no permissions for others
```

---

## Special Permissions

### SUID (Set User ID) — Octal `4000`

When set on an executable, it runs with the **owner's** permissions, not the invoker's:

```bash
ls -la /usr/bin/passwd
-rwsr-xr-x 1 root root 68208 /usr/bin/passwd
#  ^── 's' in owner execute position = SUID

chmod u+s executable        # Set SUID
chmod 4755 executable       # Set SUID with octal
```

`passwd` is owned by root and has SUID set, so any user running it can modify `/etc/shadow` (which requires root).

**Security concern**: SUID on scripts is generally ignored by kernels (only works on compiled binaries). SUID root programs are common attack targets.

### SGID (Set Group ID) — Octal `2000`

On executables: runs with the **group's** permissions.
On directories: new files inherit the **directory's group** instead of the creator's primary group.

```bash
chmod g+s directory/        # Set SGID on directory
chmod 2775 shared_dir/      # SGID + group-writable

ls -la
drwxrwsr-x 2 alice developers 4096 shared_dir/
#     ^── 's' in group execute position = SGID
```

SGID on directories is useful for shared workspaces — all files get the same group.

### Sticky Bit — Octal `1000`

On directories: only the file's owner (or root) can delete or rename files, even if others have write permission.

```bash
ls -la /tmp
drwxrwxrwt 24 root root 4096 /tmp
#        ^── 't' in others execute position = sticky bit

chmod +t directory/         # Set sticky bit
chmod 1777 directory/       # Sticky bit with full permissions
```

`/tmp` has the sticky bit — everyone can create files, but only the owner can delete their own files.

### Special Permission Summary

| Permission | Octal | On File | On Directory |
|---|---|---|---|
| SUID | `4000` | Execute as owner | (ignored) |
| SGID | `2000` | Execute as group | New files inherit group |
| Sticky | `1000` | (ignored on most systems) | Only owner can delete |

The `s` or `t` replaces the execute bit:
- `s` (lowercase): the underlying execute permission IS set
- `S` or `T` (uppercase): the underlying execute permission is NOT set

---

## Access Control Lists (ACLs)

Standard Unix permissions are limited to owner/group/other. ACLs provide **fine-grained** per-user and per-group permissions.

```bash
# View ACL
getfacl file.txt

# Set ACL — give user bob read access
setfacl -m u:bob:r file.txt

# Set ACL — give group interns read+write
setfacl -m g:interns:rw file.txt

# Remove specific ACL entry
setfacl -x u:bob file.txt

# Remove all ACLs
setfacl -b file.txt

# Default ACL (inherited by new files in directory)
setfacl -d -m g:developers:rwx shared_dir/

# Recursive
setfacl -R -m u:bob:rx project/
```

Files with ACLs show a `+` in `ls -l`:

```
-rw-rw-r--+ 1 alice developers 1024 file.txt
#         ^ ACL present
```

---

## Checking Permissions

```bash
ls -la file.txt              # Verbose listing
stat file.txt                # Detailed file info
stat -c "%a %U:%G %n" *      # Custom format: octal owner:group name
namei -l /path/to/file       # Show permissions along entire path

# Test permissions in scripts
test -r file.txt && echo "Readable"
test -w file.txt && echo "Writable"
test -x file.txt && echo "Executable"
[ -r file.txt ] && echo "Readable"   # Equivalent
```

### Effective Permission Resolution

When accessing a file, the kernel checks in order:
1. If you're the **owner** → use owner permissions
2. If you're in the **group** → use group permissions
3. Otherwise → use other permissions

Only one set applies — they don't combine. If the owner has `---` but group has `rwx`, the owner **cannot** read the file (even though they could `chmod` to fix it).
