# ADR-001: Tech Stack Selection

## Status
Accepted

## Context

Personal finance tracker ที่ต้องการแก้ปัญหา manual tracking ที่น่าเบื่อจนคนเลิกทำกลางทาง
ด้วย AI-assisted categorization และ spending insights

**Constraints:**
- Solo developer (1 คน) — stack ต้องไม่ซับซ้อนเกินที่จะ maintain คนเดียว
- Portfolio project — ต้องสะท้อน production-readiness และ senior thinking
- Zero-cost infrastructure — ทุก layer ต้องมี free tier รองรับ MVP ได้ครบ
- Developer มี .NET และ Angular experience อยู่แล้ว — learning curve ต้องจัดการได้

---

## Decisions

### Frontend: Angular 17+ (Standalone Components + Signals)

**Decision:** ใช้ Angular แทน React/Next.js หรือ Vue

**Reasoning:**
Angular เป็น stack ที่ developer คุ้นเคยอยู่แล้ว การเลือก framework ใหม่สำหรับ portfolio project
เพิ่ม risk สองชั้น — ต้องเรียน framework ใหม่ไปพร้อมกับ build feature ที่ซับซ้อน
ผลที่ได้มักเป็นโค้ดที่ไม่ได้แสดงให้เห็นว่าเขียน framework ได้ดี แต่แสดงว่ากำลังเรียนอยู่

Angular 17+ Standalone Components ตัด NgModule boilerplate ออก ทำให้โค้ดสะอาดขึ้นมาก
Signals เป็น reactive primitive ที่ Angular แนะนำแทน complex RxJS chains สำหรับ component state
ซึ่งเหมาะกับ dashboard และ form interactions ใน project นี้

**Alternatives considered:**
- **Next.js/React:** Popular กว่า แต่ switching cost สูงและไม่ได้ให้ technical advantage ที่คุ้มค่าสำหรับ use case นี้ Next.js SSR มีประโยชน์สำหรับ SEO แต่ finance tracker เป็น authenticated app ทั้งหมด ไม่ต้องการ SSR
- **Vue 3:** Learning curve ต่ำกว่า แต่ไม่มี existing experience และ enterprise adoption ต่ำกว่า Angular

---

### Backend: .NET 8 Web API

**Decision:** ใช้ .NET 8 แทน Node.js/Express, Python/FastAPI, หรือ Go

**Reasoning:**
.NET 8 เป็น stack ที่ developer มี experience — เหตุผลเดียวกับ Angular

นอกจากนี้ .NET 8 มี built-in support ที่เหมาะกับ project นี้จริง ๆ:
- Minimal API + Controller API ให้เลือกตาม complexity
- EF Core 8 เป็น mature ORM ที่ทำงานได้ดีกับ PostgreSQL
- Built-in DI container ไม่ต้องติดตั้ง library เพิ่ม
- Performance ดีกว่า Node.js สำหรับ CPU-bound operations (AI response processing)

**Alternatives considered:**
- **Node.js/Express:** Ecosystem ใหญ่กว่า แต่ type safety ต่ำกว่า และ developer ไม่มี production experience
- **Python/FastAPI:** เหมาะกับ AI-heavy workload แต่ AI logic ใน project นี้ delegate ไปที่ Claude API ทั้งหมด ไม่ต้องการ Python ML ecosystem
- **Go:** Performance ดีมาก แต่ learning curve สูงและ ORM ecosystem ยังไม่ mature เท่า

---

### Database: PostgreSQL (Supabase/Neon free tier)

**Decision:** ใช้ PostgreSQL แทน MySQL, MongoDB, หรือ SQLite

**Reasoning:**
Financial data มี structure ชัดเจนและ relation แน่นอน — users มี transactions, transactions มี categories
Relational model เหมาะกับ use case นี้มากกว่า document store

PostgreSQL ให้ ACID transactions ซึ่ง critical สำหรับ financial data
การที่ transaction หนึ่งบันทึกครึ่งทางแล้ว fail ต้องไม่ทำให้ข้อมูลเสียหาย

Supabase และ Neon ให้ managed PostgreSQL free tier ที่ production-ready
ไม่ต้องจัดการ infrastructure เอง เหมาะกับ solo developer

**Alternatives considered:**
- **MySQL:** ใกล้เคียงกัน แต่ PostgreSQL มี JSON support ดีกว่า ซึ่งจะมีประโยชน์สำหรับเก็บ AI response metadata
- **MongoDB:** Flexible schema ฟังดูดี แต่ financial data ไม่ได้ต้องการ flexibility นั้น และ ACID guarantees ของ MongoDB ซับซ้อนกว่า
- **SQLite:** ดีสำหรับ development แต่ไม่เหมาะกับ production multi-user scenario

---

### AI: Google Gemini 1.5 Flash (MVP) → Anthropic Claude API (post-MVP)

**Decision:** ใช้ Gemini 1.5 Flash สำหรับ MVP เพื่อ zero cost จากนั้น upgrade เป็น Claude API เมื่อ traffic เพิ่มหรือต้องการ quality สูงขึ้น

**Reasoning:**
Project นี้ต้องการ AI สำหรับ 2 งานหลัก: categorization และ spending insights
ทั้งสองงานต้องการ language understanding ที่ดี ไม่ใช่ specialized ML model

Gemini 1.5 Flash free tier ให้ 1,500 requests/day และ 1M tokens/day — เกินพอสำหรับ personal use และ beta testing
Structured JSON output ของ Gemini reliable เพียงพอสำหรับ auto-categorization use case นี้

**Upgrade path:** เมื่อ project พร้อม productionize หรือ quality ไม่เพียงพอ → เปลี่ยนเป็น Claude API
การ abstract ผ่าน `IAiService` interface ทำให้ swap provider ได้โดยไม่แตะ business logic เลย
นี่คือเหตุผลหลักที่ต้องมี abstraction layer ตั้งแต่ต้น

**Alternatives considered:**
- **Anthropic Claude API:** Quality สูงกว่า structured output reliable กว่า แต่มี cost — เลือกเป็น upgrade target
- **Groq (Llama 3):** Free tier ใจดีมาก (14,400 req/day) แต่ open-source model คุณภาพต่ำกว่าสำหรับ Thai language
- **OpenAI GPT-4:** Comparable quality แต่ pricing สูงและไม่มี free tier ที่ practical
- **Local model (Ollama):** ไม่มี API cost แต่ต้องการ hardware และ setup complexity สูงมาก ไม่เหมาะกับ free-tier deployment

---

### Infrastructure: Docker + GitHub Actions + Railway/Render

**Decision:** Containerize ด้วย Docker, CI/CD ด้วย GitHub Actions, deploy บน Railway หรือ Render

**Reasoning:**
Docker ทำให้ "works on my machine" หายไป — environment ระหว่าง local, CI, และ production เหมือนกัน
สำหรับ portfolio project นี้สำคัญมากเพราะ recruiter หรือ interviewer อาจ clone แล้วรัน locally

GitHub Actions เป็น CI/CD ที่ integrate กับ GitHub โดยตรง ไม่ต้องตั้งค่า external service
Free tier เพียงพอสำหรับ project ขนาดนี้

Railway และ Render รองรับ Docker deployment โดยตรงและมี free/low-cost tier
ทั้งสองมี PostgreSQL add-on แต่เลือกใช้ Supabase/Neon แยกต่างหากเพื่อ decouple database lifecycle จาก app deployment

**Alternatives considered:**
- **AWS/GCP/Azure:** Production-grade แต่ค่าใช้จ่ายและ setup complexity สูงเกินไปสำหรับ MVP
- **Vercel:** ดีสำหรับ frontend แต่ .NET backend support จำกัด
- **Fly.io:** ตัวเลือกที่ดี แต่ Railway/Render มี DX ที่ง่ายกว่าสำหรับ first deployment

---

## Consequences

**ได้:**
- Developer เริ่มต้นได้เร็วเพราะคุ้นเคยกับทุก layer
- Stack สะท้อน enterprise pattern (.NET + Angular) ที่มีคุณค่าสำหรับ job market ในไทย
- PostgreSQL + EF Core เป็น combination ที่ mature และมี documentation ดีมาก
- Docker ทำให้ onboarding และ demo ง่าย

**เสีย:**
- Angular มี bundle size ใหญ่กว่า React/Vue — ต้องระวัง initial load time
- .NET container image ใหญ่กว่า Node.js — cold start บน free tier อาจช้า ต้อง optimize
- Gemini 1.5 Flash Thai language quality ต่ำกว่า Claude — ต้องทดสอบ categorization accuracy กับ Thai transaction descriptions จริงก่อน go-live
- `IAiService` abstraction ต้องออกแบบให้รองรับ contract ของทั้งสอง provider (Gemini และ Claude) ตั้งแต่ต้น

---

*Last updated: 2026-05-03*
