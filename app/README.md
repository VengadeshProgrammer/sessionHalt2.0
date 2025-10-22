# sessionHalt

[![npm version](https://img.shields.io/npm/v/sessionHalt)](https://www.npmjs.com/package/sessionHalt)
[![npm downloads](https://img.shields.io/npm/dt/sessionHalt)](https://www.npmjs.com/package/sessionHalt)
[![License](https://img.shields.io/npm/l/sessionHalt)](LICENSE)

**sessionHalt** is a JavaScript npm package designed to prevent **session hijacking** by generating a unique device fingerprint. It works alongside session IDs to make unauthorized session reuse extremely difficult.

---

## 🔒 Problem

Session hijacking occurs when a malicious user steals an active session to gain unauthorized access. Even major platforms like Instagram, Netflix, and YouTube face these threats, potentially leading to privacy breaches and account misuse.

---

## 🚀 Solution

`sessionHalt` generates a **unique fingerprint** for each device by combining:

- **Canvas fingerprinting** (with tampering detection)
- **Device information**:
  - OS (`navigator.platform`)
  - Browser (`navigator.userAgent`)
  - Screen width & height
  - Device pixel ratio
  - Device memory
  - Color depth
  - Hardware concurrency (CPU cores)

The fingerprint is stored alongside the session ID, preventing session reuse on different devices. Canvas tampering detection stops malicious browser extensions from faking fingerprints.

---

## 📊 Demo / Metrics

Simulated tests show:

| Attempt Type          | Total Attempts | Blocked | TPR / FPR |
|----------------------|----------------|---------|-----------|
| Session reuse attack  | 2              | 2       | 100%      |
| Legitimate login      | 5              | 0       | ~0%        |

> True-positive rate (TPR): % of attacks blocked  
> False-positive rate (FPR): % of legitimate logins incorrectly blocked

---

## 💻 Installation

Install via npm:

```bash
npm install sessionHalt
```
```bash
##⚡ Usage
`import { getFingerprintString } from 'sessionHalt';

(async () => {
  const fingerprint = await getFingerprintString();
  console.log("Device Fingerprint:", fingerprint);
})();`
```
Integrate this fingerprint with your session authentication system to prevent session hijacking.

## 📦 Source Code
The npm package source code is available on GitHub:
[Go to the source code of the npm package](https://github.com/VengadeshProgrammer/sessionHalt-fingerprint-npm/tree/main)
Demo Website Source Code
## ⚡ Features
* Unique device fingerprint generation
* Canvas tampering detection
* Works with HTTPS
* Easy to integrate with existing session-based systems
* Reduces risk of session hijacking
