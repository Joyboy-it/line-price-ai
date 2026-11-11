# คู่มือติดตั้ง AI Skills สำหรับโปรเจกต์ใหม่

คู่มือนี้ใช้ติดตั้งชุด skill ของ agent ใน Cursor ให้เหมือนกันทุกโปรเจกต์ โดยแต่ละขั้นของงานมี skill ที่รับผิดชอบเพียงตัวเดียว

Skill เป็นคำสั่งที่ agent อ่านตอนช่วยเขียนโค้ด ไม่ถูก build เข้าแอป และไม่เปลี่ยนพฤติกรรมของระบบที่รันอยู่

---

## 1. ชุดที่ใช้และหน้าที่

| ชุด | หน้าที่ | วิธีใช้ |
|---|---|---|
| [Matt Pocock Skills](https://github.com/mattpocock/skills) | วิเคราะห์โจทย์ ออกแบบ เขียนโค้ด เทส รีวิว | ติดตั้งเป็น skill |
| [Superpowers](https://github.com/obra/superpowers) | วางแผน ดีบัก ยืนยันผล ส่งมอบ | ติดตั้งเป็น skill (เลือกบางตัว) |
| [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | ระบบดีไซน์ สี ฟอนต์ layout responsive accessibility | ติดตั้งเป็น skill (เฉพาะโปรเจกต์ที่มี UI) |
| [Karpathy Skills](https://github.com/multica-ai/andrej-karpathy-skills) | เขียนเท่าที่จำเป็น แก้เฉพาะจุด | ไม่ติดตั้ง ใส่หลักการลงไฟล์กฎแทน |

### ชุดที่ไม่ใช้

- **[Ponytail](https://github.com/dietrichgebert/ponytail):** ทำหน้าที่เดียวกับ Karpathy และมี `/ponytail-review` ที่ทับกับ `code-review` ของ Matt ใช้แทน Karpathy ได้ (ระดับ `lite` และห้ามใช้ `/ponytail-review`) ถ้า agent ยังเขียนโค้ดเกินจำเป็นบ่อย ห้ามใช้คู่กับ Karpathy
- **[Taste Skill](https://github.com/leonxlnx/taste-skill):** ทำมาสำหรับเว็บบริษัทหรือ landing page (hero, ภาพถ่าย, shader) ไม่เหมาะกับระบบ ERP หรือหน้า admin และจะสร้างระบบดีไซน์ชุดที่สองมาชนกับ UI UX Pro Max

### Skill ของ Superpowers ที่ไม่ติดตั้ง

| Skill | เหตุผล |
|---|---|
| `brainstorming` | ซ้ำกับ `grill-with-docs` และสั่งให้รันก่อนทุกงาน |
| `test-driven-development` | ซ้ำกับ `tdd` ที่ `implement` เรียกอยู่แล้ว |
| `requesting-code-review` | ซ้ำกับ `code-review` ที่ `implement` เรียกอยู่แล้ว |
| `executing-plans`, `subagent-driven-development` | ซ้ำกับ `implement` / `implement-spec` |
| `using-superpowers` | บังคับให้ทุกงานใช้ workflow ของ Superpowers ซึ่งจะชนกับลำดับในคู่มือนี้ |

---

## 2. ลำดับการทำงาน

```mermaid
flowchart TD
  analyze["1 วิเคราะห์: grill-with-docs"] --> design["2 ออกแบบ: domain-modeling, codebase-design"]
  design --> ui{"มีหน้าจอ?"}
  ui -->|ใช่| uiux["2b ui-ux-pro-max"]
  ui -->|ไม่| gate1
  uiux --> gate1["อนุมัติการออกแบบ"]
  gate1 --> plan["3 วางแผน: writing-plans"]
  plan --> gate2["อนุมัติแผน"]
  gate2 --> impl["4 พัฒนา: implement หรือ implement-spec"]
  impl --> test["5 tdd และ code-review"]
  test --> bug{"เจอบั๊ก?"}
  bug -->|ใช่| debug["systematic-debugging"]
  debug --> test
  bug -->|ไม่| verify["6 verification-before-completion"]
  verify --> finish["finishing-a-development-branch"]
  finish --> gate3["อนุมัติก่อน merge"]
```

| ขั้น | บทบาท | Skill | ผลลัพธ์ |
|---|---|---|---|
| 1 วิเคราะห์โจทย์ | System Architect | `grill-with-docs` (Matt) | ความต้องการ กฎธุรกิจ ข้อจำกัด ไม่มีคำถามค้าง |
| 2 ออกแบบระบบ | System Architect | `domain-modeling`, `codebase-design` (Matt) | ศัพท์ใน glossary, ADR, ขอบเขตโมดูล, ผลกระทบต่อฐานข้อมูล |
| 2b ออกแบบ UI | UI/UX Designer | `ui-ux-pro-max` | `design-system/<project>/MASTER.md` |
| 3 วางแผน | Senior Developer | `writing-plans` (Superpowers) | ขั้นงาน ไฟล์ที่จะแก้ วิธีตรวจแต่ละขั้น |
| 4 พัฒนา | Senior Developer | `implement` (หนึ่งงาน) / `implement-spec` (หลายงาน แบ่ง agent ย่อย) (Matt) | โค้ดตามแผน |
| 5 ทดสอบ | QA Engineer | `tdd` (Matt), `systematic-debugging` เมื่อเจอบั๊ก (Superpowers) | เทสผ่าน บั๊กมีเทสกันซ้ำ |
| 5b รีวิว | Code Reviewer | `code-review` (Matt) | ผลรีวิวด้านมาตรฐานและด้านสเปก |
| 6 ส่งมอบ | QA Engineer | `verification-before-completion`, `finishing-a-development-branch` (Superpowers) | หลักฐานว่าตรวจผ่านจริง แล้วเลือก merge / PR |

งานเล็กที่ระบุไฟล์และพฤติกรรมชัดแล้ว (แก้คำ, แก้บั๊กบรรทัดเดียว) ข้ามขั้น 1–3 ได้ แต่ต้องผ่านขั้น 6 เสมอ

---

## 3. สิ่งที่ต้องมีในเครื่อง

- Node.js 22.20 ขึ้นไป (สำหรับ `npx skills`)
- Python 3 (สำหรับสคริปต์ค้นหาของ UI UX Pro Max)
- Git และโปรเจกต์ต้องเป็น git repo (`finishing-a-development-branch` และ `code-review` อ่าน diff จาก git)

ตรวจสอบ:

```powershell
node --version
python --version
git status
```

---

## 4. ขั้นตอนติดตั้ง

รันทุกคำสั่งที่ root ของโปรเจกต์ ติดตั้งแบบรายโปรเจกต์ (ไม่ใส่ `-g`) เพื่อให้คนในทีมที่ clone repo ได้ชุดเดียวกัน

**ห้ามติดตั้งชุดเดียวกันซ้ำสองทาง** เช่น ติดตั้งปลั๊กอิน Cursor (`/add-plugin superpowers`) พร้อมกับ `npx skills add` เพราะ skill จะถูกโหลดซ้ำ

### 4.1 Matt Pocock

```powershell
npx skills@latest add mattpocock/skills --skill grill-me grill-with-docs grilling domain-modeling codebase-design implement implement-spec to-spec to-tickets tdd code-review setup-matt-pocock-skills -a cursor
```

- `grilling` ต้องมี เพราะ `grill-me` และ `grill-with-docs` เรียกใช้
- `to-spec` และ `to-tickets` ใช้สร้างสเปกและแตกงานให้ `implement-spec` ถ้าไม่ใช้ `implement-spec` ตัดออกได้

จากนั้นใน Cursor chat รันครั้งเดียวต่อโปรเจกต์:

```
/setup-matt-pocock-skills
```

คำตอบที่แนะนำ:

- Issue tracker: local files
- Triage labels: ใช้ค่าเริ่มต้น
- ที่เก็บเอกสาร: `docs/domain` (glossary, ADR) และ `docs/specs` (สเปก)

### 4.2 Superpowers

```powershell
npx skills@latest add obra/superpowers --skill writing-plans systematic-debugging verification-before-completion finishing-a-development-branch -a cursor
```

### 4.3 UI UX Pro Max (เฉพาะโปรเจกต์ที่มี UI)

```powershell
npx ui-ux-pro-max-cli init --ai cursor
```

สร้างระบบดีไซน์ของโปรเจกต์ครั้งแรก (แก้คำค้นและชื่อโปรเจกต์ให้ตรงงาน):

```powershell
python .cursor/skills/ui-ux-pro-max/scripts/search.py "internal admin dashboard" --design-system --persist -p "ProjectName" --stack nextjs
```

ผลลัพธ์อยู่ที่ `design-system/<project-slug>/MASTER.md` ถ้ามีหน้าที่ต้องต่างจากหลัก ให้สร้างไฟล์แยกด้วย `--page "<page-name>"`

### 4.4 ไฟล์กฎของโปรเจกต์

สร้าง `.cursor/rules/ai-workflow.mdc` จากเทมเพลตในหัวข้อ 5 แล้วกรอกส่วน "กฎเฉพาะโปรเจกต์"

### 4.5 ตรวจหลังติดตั้ง

1. ดูว่า skill อยู่ใน `.agents/skills/` หรือ `.cursor/skills/` (ตำแหน่งขึ้นกับเวอร์ชันของ CLI) และไม่มีชื่อซ้ำกันสองที่
2. เปิด Cursor chat ใหม่ พิมพ์ `/` แล้วต้องเห็น `grill-with-docs`, `writing-plans`, `implement`
3. ลบ skill ที่ไม่อยู่ในรายการของคู่มือนี้ออก ถ้า installer เลือกเกินมา
4. Commit โฟลเดอร์ skill, `.cursor/rules/ai-workflow.mdc` และ `design-system/` เข้า repo

---

## 5. เทมเพลตไฟล์กฎ `.cursor/rules/ai-workflow.mdc`

คัดลอกทั้งบล็อก แล้วแก้ส่วนที่อยู่ใน `<...>`

```markdown
---
description: ลำดับการใช้ skill และกฎของโปรเจกต์
alwaysApply: true
---

# AI Workflow

## ลำดับงาน
1. โจทย์ยังไม่ชัด: `/grill-with-docs` จนไม่มีคำถามค้าง
2. ออกแบบ: `domain-modeling` และ `codebase-design` ถ้ามีหน้าจอให้อ่าน `design-system/<project>/MASTER.md` และใช้ `ui-ux-pro-max` จากนั้นหยุดรออนุมัติ
3. วางแผน: `/writing-plans` ระบุไฟล์ที่จะแก้และวิธีตรวจทุกขั้น จากนั้นหยุดรออนุมัติ
4. พัฒนา: `/implement` (หนึ่งงาน) หรือ `/implement-spec` (หลายงาน)
5. บั๊ก: `/systematic-debugging` เท่านั้น
6. ก่อนบอกว่าเสร็จ: `verification-before-completion` แล้ว `finishing-a-development-branch` หยุดรออนุมัติก่อน merge

งานเล็กที่ผู้ใช้ระบุไฟล์และพฤติกรรมชัดแล้ว ข้ามขั้น 1–3 ได้ ขั้น 6 ข้ามไม่ได้

## ห้ามซ้ำซ้อน
- TDD ใช้ `tdd` ชุดเดียว และ review ใช้ `code-review` ชุดเดียวต่องาน
- ระบบดีไซน์มีแหล่งเดียวคือ `design-system/<project>/MASTER.md`
- ห้ามสลับ workflow ดีบักกลางงาน

## หลักการเขียนโค้ด
- เขียนเท่าที่โจทย์ต้องการ ไม่เพิ่มฟีเจอร์ abstraction หรือ config ที่ไม่ได้ขอ
- แก้เฉพาะบรรทัดที่เกี่ยวกับงาน ไม่จัดรูปแบบ ไม่ refactor โค้ดข้างเคียง
- ลบเฉพาะของที่การแก้ของเราทำให้ไม่ถูกใช้ ถ้าเจอโค้ดตายเดิมให้แจ้ง ไม่ต้องลบ
- ห้ามตัด validation, การจัดการ error, ความปลอดภัย หรือ accessibility เพื่อให้โค้ดสั้นลง
- ไม่แน่ใจให้ถาม ไม่เดาแล้วทำต่อ

## กฎเฉพาะโปรเจกต์
- ฐานข้อมูล: <ตำแหน่งไฟล์ migration> ห้ามแก้ไฟล์ migration ที่มีอยู่ ถ้าต้องเปลี่ยนสคีมาให้เพิ่มไฟล์ใหม่เลขถัดไป และห้ามรันกับฐานข้อมูลจนกว่าผู้ใช้สั่ง
- โมดูลกลาง: <รายชื่อไฟล์ เช่น db, auth, permissions, middleware> ถ้าต้องแตะ แผนต้องระบุไว้ก่อนลงมือ
- การตรวจ: <คำสั่งที่ใช้ได้จริง เช่น npm run lint, npm run build, npm test> ห้ามอ้างว่าเทสผ่านถ้าไม่ได้รัน
- ไฟล์ลับ: ห้ามอ่านค่าใน `.env*` ไปแสดง และห้าม commit
```

---

## 6. Checklist สำหรับโปรเจกต์ใหม่

- [ ] เครื่องมี Node 22.20+, Python 3 และโปรเจกต์เป็น git repo
- [ ] ติดตั้ง Matt Pocock (หัวข้อ 4.1) และรัน `/setup-matt-pocock-skills`
- [ ] ติดตั้ง Superpowers 4 ตัว (หัวข้อ 4.2)
- [ ] ถ้ามี UI: ติดตั้ง UI UX Pro Max และสร้าง `MASTER.md` (หัวข้อ 4.3)
- [ ] สร้าง `.cursor/rules/ai-workflow.mdc` และกรอกกฎเฉพาะโปรเจกต์
- [ ] ตรวจว่าไม่มี skill ซ้ำ และไม่ได้ติดตั้งชุดที่ตัดออก
- [ ] ถ้ายังไม่มีตัวรันเทส ให้บันทึกในกฎว่าใช้คำสั่งตรวจอะไรแทน และวางแผนเพิ่มตัวรันเทสเป็นงานแยก
- [ ] Commit ไฟล์ทั้งหมดเข้า repo

## 7. การอัปเดต

```powershell
npx skills@latest update
npx ui-ux-pro-max-cli update
```

หลังอัปเดตให้ตรวจหัวข้อ 4.5 อีกครั้ง เพราะเวอร์ชันใหม่อาจเพิ่มหรือเปลี่ยนชื่อ skill
