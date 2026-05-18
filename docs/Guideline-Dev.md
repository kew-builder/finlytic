# Guideline-Dev.md — Finlytic Development Roadmap

> ไฟล์นี้คือ "แผนที่" ของ project ทั้งหมด
> เปิดดูทุกครั้งที่เริ่ม session ใหม่ เพื่อรู้ว่าตัวเองอยู่ตรงไหนและต้องทำอะไรต่อ

---

## 📍 สถานะปัจจุบัน

> ⬜ = ยังไม่เริ่ม | 🔄 = กำลังทำ | ✅ = เสร็จแล้ว
>
> **อัพเดท field นี้ทุกครั้งที่จบ task**

| Phase | สถานะ | วันที่เริ่ม | วันที่เสร็จ |
|-------|--------|-----------|-----------|
| Phase 0: Design & Setup | ✅ | 2026-05-04 | 2026-05-04 |
| Phase 1: Foundation | ✅ | 2026-05-04 | 2026-05-04 |
| Phase 2: Transaction CRUD | ✅ | 2026-05-16 | 2026-05-17 |
| Phase 3: AI Integration | ✅ | 2026-05-17 | 2026-05-17 |
| Phase 4: Dashboard | ⬜ | - | - |
| Phase 5: Polish & Deploy | ⬜ | - | - |

---

## 🗺️ ภาพรวมทั้ง Project (อ่านก่อนเริ่มทุกครั้ง)

```
Phase 0          Phase 1          Phase 2          Phase 3          Phase 4          Phase 5
Design &         Foundation       Transaction      AI               Dashboard        Polish &
Setup            (โครงบ้าน)       CRUD (ห้องแรก)   Integration      (หน้าต่าง)       Deploy
                                                   (สมองบ้าน)                        (ทาสี+ส่งมอบ)
────────────────────────────────────────────────────────────────────────────────────────────────
│                │                │                │                │                │
├─ Requirements  ├─ .NET skeleton ├─ Entity        ├─ AI Service    ├─ Aggregation   ├─ Security
├─ Architecture  ├─ EF Core setup ├─ Repository    ├─ Categorize    │  APIs          ├─ Docker
├─ ER Diagram    ├─ Auth (JWT)    ├─ Service layer ├─ CSV Import    ├─ Charts        ├─ CI/CD
├─ ADR-001       ├─ Angular setup ├─ Controller    ├─ AI Insights   ├─ Forecast      ├─ README
├─ Repo setup    ├─ Routing       ├─ DTOs          ├─ Resilience    ├─ Performance   ├─ Demo video
│                ├─ Auth UI       ├─ Validation    │  (Polly)       │  tuning        ├─ Blog post
│                ├─ Layout        ├─ Angular CRUD  ├─ Angular AI UI │                │
│                │                ├─ Unit tests    │                │                │
│                │                │                │                │                │
⏱️ 3 วัน         ⏱️ 4 วัน         ⏱️ 7 วัน         ⏱️ 7 วัน         ⏱️ 6 วัน         ⏱️ 5-7 วัน
```

---

## 📋 Phase 0: Design & Setup (3 วัน)

### เป้าหมาย
วางรากฐานทั้งหมดให้แข็งแรง ห้ามเขียนโค้ดใน phase นี้

### Tasks

```
⬜ 0.1  เขียน requirements.md (Problem, Users, MVP Features, Non-goals, Success Criteria)
⬜ 0.2  วาด System Diagram (Excalidraw → export PNG)
⬜ 0.3  วาด User Flow 2 อัน (Mermaid):
        - CSV Import + AI Categorize
        - Add Transaction Manual
⬜ 0.4  สร้าง ER Diagram (dbdiagram.io → export PNG + DBML)
⬜ 0.5  เขียน ADR-001: Tech Stack Decision
✅ 0.6  สร้าง GitHub repo "finlytic" (monorepo)
✅ 0.7  Setup: .gitignore, .editorconfig, README skeleton, branch protection
⬜ 0.8  ออกแบบ UI ใน Claude Design (ทุกหน้า)
        - Login / Register
        - Dashboard
        - Transaction List
        - Add/Edit Transaction
        - CSV Import
        - AI Insights
```

### Definition of Done
- [ ] `docs/requirements.md` อยู่ใน repo
- [ ] `docs/architecture/system-diagram.png` อยู่ใน repo
- [ ] `docs/flows/` มี flow 2 ไฟล์
- [ ] `docs/database/schema.dbml` อยู่ใน repo
- [ ] `docs/decisions/ADR-001.md` อยู่ใน repo
- [ ] GitHub repo มี branch protection on main
- [ ] Claude Design prototype ของทุกหน้าเสร็จ

### ⚠️ กฎ
- **ห้ามเปิด IDE เขียนโค้ดจนกว่า Phase 0 จะเสร็จ**
- ถ้าอยากเขียนโค้ดมาก = สัญญาณว่ากำลังข้ามขั้นตอน

---

## 📋 Phase 1: Foundation (4 วัน)

### เป้าหมาย
โครง project ทำงานได้ end-to-end (register → login → เห็นหน้า dashboard เปล่าๆ)

### Tasks

**Backend:**
```
✅ 1.1  สร้าง .NET 8 Web API project (apps/api/)
✅ 1.2  Setup folder structure (Api / Application / Domain / Infrastructure)
✅ 1.3  Setup EF Core + PostgreSQL connection
✅ 1.4  สร้าง User entity + first migration
✅ 1.5  Setup Serilog (structured logging)
✅ 1.6  Health check endpoint (/health)
✅ 1.7  Swagger UI
✅ 1.8  Register endpoint (email + password → BCrypt hash → save)
✅ 1.9  Login endpoint (email + password → return JWT + refresh token)
✅ 1.10 JWT middleware (validate token on protected routes)
✅ 1.11 Refresh token endpoint
```

**Frontend:**
```
✅ 1.12 สร้าง Angular 19 project (apps/web/)
✅ 1.13 Setup TailwindCSS
✅ 1.14 Routing setup (login, register, dashboard)
✅ 1.15 Auth service (login, register, store JWT, auto-refresh)
✅ 1.16 HTTP interceptor (attach JWT to every request)
✅ 1.17 Auth guard (redirect to login if not authenticated)
⬜ 1.18 Layout component (header + sidebar + main content) — เลื่อนไป Phase 4
✅ 1.19 Login page (connect to API)
✅ 1.20 Register page (connect to API)
✅ 1.21 Dashboard page (empty shell — "Welcome, [name]")
```

### Definition of Done
- [ ] สามารถ register user ใหม่ได้
- [ ] สามารถ login ได้ → redirect ไป dashboard
- [ ] Dashboard แสดง "Welcome, [name]"
- [ ] Refresh token ทำงาน (token หมดอายุ → auto-refresh)
- [ ] ถ้าไม่ได้ login → redirect ไป login page
- [ ] Swagger UI เปิดได้ที่ /swagger

### 🎓 Skill Focus
- JWT auth flow end-to-end
- EF Core setup + migration
- Angular HTTP interceptor pattern
- Layered architecture hands-on

---

## 📋 Phase 2: Transaction CRUD (7 วัน)

### เป้าหมาย
Feature หลักของ app ทำงานได้ + ฝึก EF Core ลึก

### Tasks

**Backend:**
```
✅ 2.1  สร้าง entities: Transaction, Category, Budget
✅ 2.2  Migration สำหรับ 3 ตารางใหม่ (AddTransactionCategoryBudget)
✅ 2.3  Seed default categories (อาหาร, เดินทาง, ที่อยู่, etc.)
✅ 2.4  Transaction Repository (ITransactionRepository)
✅ 2.5  Transaction Service (business logic)
✅ 2.6  Request/Response DTOs (ห้ามส่ง entity ตรงๆ)
✅ 2.7  FluentValidation rules
✅ 2.8  TransactionController: GET (list + filter by type/date)
✅ 2.9  TransactionController: GET by ID
✅ 2.10 TransactionController: POST (create)
✅ 2.11 TransactionController: PUT (update)
✅ 2.12 TransactionController: DELETE
```

**⭐ EF Core Deep Dive (สำคัญมาก — ใช้เวลากับส่วนนี้):**
```
✅ 2.13 เขียน query ใช้ Include → log SQL ที่ generate
✅ 2.14 เพิ่ม AsNoTracking → benchmark ความเร็ว
✅ 2.15 เขียนใหม่ใช้ Select projection → เทียบ SQL
✅ 2.16 จำลอง N+1 problem → แก้ → เขียนบันทึกสิ่งที่เรียนรู้
✅ 2.17 เขียน ADR-002: EF Core Query Strategy
```

**Frontend:**
```
✅ 2.18 Transaction service (API calls)
✅ 2.19 Transaction list page (table)
✅ 2.20 Filter: by date range + type (category filter รอ seed ก่อน)
✅ 2.21 Add Transaction form
✅ 2.22 Edit Transaction form
✅ 2.23 Delete with confirmation dialog
✅ 2.24 Loading states + error handling
```

**Testing:**
```
✅ 2.25 Unit tests: TransactionService (8 tests, xUnit + Moq)
✅ 2.26 Integration tests: TransactionController (3 tests)
```

### Definition of Done
- [ ] CRUD ทำงานครบ (Create, Read, Update, Delete)
- [ ] Pagination + Filter ทำงาน
- [ ] Validation ทำงานทั้ง frontend + backend
- [ ] มี unit tests + integration tests
- [ ] ADR-002 เขียนเสร็จ
- [ ] เข้าใจ Include vs AsNoTracking vs Select ลึกพอตอบ interview ได้

### 🎓 Skill Focus
- **EF Core ลึก** (gap ที่ต้องปิด)
- Repository + Service pattern
- FluentValidation
- Reactive Forms (Angular)
- Unit testing + Integration testing

---

## 📋 Phase 3: AI Integration (7 วัน)

### เป้าหมาย
จุดขายของ project — AI ที่ทำงานจริง ไม่ใช่ของเล่น

### Tasks

**AI Service:**
```
✅ 3.1  สร้าง IAiService interface (abstraction)
✅ 3.2  สร้าง GeminiAiService (implementation — Gemini 1.5 Flash per ADR-001)
✅ 3.3  Prompt template: categorize transaction (categorize-v1.txt)
✅ 3.4  Prompt template: generate insights (insights-v1.txt)
✅ 3.5  Response parsing + validation (ถ้า AI ตอบไม่ตรง format)
✅ 3.6  Resilience: Polly retry + circuit breaker + timeout
✅ 3.7  Caching: cache categorization result (same description = same category)
✅ 3.8  Token usage logging (cost tracking)
✅ 3.9  ADR-003: AI Integration Strategy
```

**CSV Import:**
```
✅ 3.10 CSV upload endpoint (POST /import/csv)
✅ 3.11 CSV parser (BOM, comma/semicolon/tab, date formats, sign-inferred type)
✅ 3.12 Batch categorization (ส่งทุก transaction ใน 1 Gemini call)
✅ 3.13 Background processing ด้วย Task.Run + ImportJobStore (ไม่ใช้ Hangfire — over-engineered สำหรับ MVP)
✅ 3.14 Progress tracking (GET /import/jobs/{jobId} polling)
✅ 3.15 Error handling: partial failure บันทึกใน job.Errors
```

**AI Insights:**
```
✅ 3.16 Insights endpoint (GET /insights — last 30d expense transactions → Gemini → return insights)
✅ 3.17 Insight types: overspending, trend, anomaly, saving_opportunity (defined in prompt)
✅ 3.18 Cache insights 1 hour per userId (auto-expire)
```

**Frontend:**
```
✅ 3.19 CSV Import page (/import) — drag-drop, upload, progress polling, result summary
✅ 3.20 AI category suggestion ใน Add Transaction form (debounce 600ms, apply button)
✅ 3.21 Import result page — แสดง imported/failed/total หลัง job เสร็จ
✅ 3.22 Insights card บน dashboard — real data จาก GET /insights
✅ 3.23 Loading states — skeleton cards + spinner + suggestingCategory pill
```

### Definition of Done
- [ ] Import CSV → AI categorize → save → user review ทำงาน end-to-end
- [ ] Add Transaction → AI suggest category ทำงาน
- [ ] Dashboard แสดง AI insights
- [ ] ถ้า AI ล่ม → app ยังทำงานได้ (graceful degradation)
- [ ] มี token usage log
- [ ] ADR-003 เขียนเสร็จ

### 🎓 Skill Focus
- AI API integration (production-grade)
- Resilience patterns (Polly)
- Background jobs (Hangfire)
- Prompt engineering
- Caching strategy

---

## 📋 Phase 4: Dashboard & Visualization (6 วัน)

### เป้าหมาย
ทำให้ข้อมูลมีความหมาย — user เห็นภาพการเงินของตัวเองชัด

### Tasks

**Backend:**
```
⬜ 4.1  Monthly summary API (group by category)
⬜ 4.2  Spending trend API (last 6 months)
⬜ 4.3  Budget vs Actual API
⬜ 4.4  Cash flow forecast API (Claude AI predict)
⬜ 4.5  Budget CRUD API
⬜ 4.6  Performance: add indexes, optimize slow queries
```

**Frontend:**
```
⬜ 4.7  Dashboard layout (responsive grid)
⬜ 4.8  Summary cards (total income, total expense, net, top category)
⬜ 4.9  Pie chart: spending by category (Chart.js)
⬜ 4.10 Line chart: trend over time
⬜ 4.11 Bar chart: budget vs actual
⬜ 4.12 Forecast chart: predicted next 3 months
⬜ 4.13 Budget management page (set budget per category)
⬜ 4.14 Date range selector (filter ทุก chart)
⬜ 4.15 Responsive design (mobile-friendly)
```

### Definition of Done
- [ ] Dashboard แสดง charts ครบ 4 อัน
- [ ] Charts update เมื่อเปลี่ยน date range
- [ ] Budget management ทำงาน
- [ ] Forecast จาก AI ทำงาน
- [ ] หน้า dashboard โหลด < 2 วินาที
- [ ] Mobile responsive

### 🎓 Skill Focus
- SQL aggregation (GROUP BY, window functions)
- Performance optimization (indexes, query tuning)
- Data visualization (Chart.js)
- Responsive design

---

## 📋 Phase 5: Polish & Deploy (5-7 วัน)

### เป้าหมาย
ทำให้ project พร้อมโชว์ + พร้อม deploy + พร้อมใส่ resume

### Tasks

**Security:**
```
⬜ 5.1  Rate limiting (auth endpoints)
⬜ 5.2  Input sanitization
⬜ 5.3  CORS proper config
⬜ 5.4  Secrets → environment variables
⬜ 5.5  HTTPS only
```

**DevOps:**
```
⬜ 5.6  Dockerfile (backend)
⬜ 5.7  Dockerfile (frontend)
⬜ 5.8  docker-compose (local dev)
⬜ 5.9  GitHub Actions: build + test on PR
⬜ 5.10 GitHub Actions: deploy on merge to main
⬜ 5.11 Deploy backend → Railway/Render
⬜ 5.12 Deploy frontend → Vercel/Railway
⬜ 5.13 Deploy database → Supabase/Neon
```

**Documentation:**
```
⬜ 5.14 README.md: project description, screenshots, setup guide, live demo URL
⬜ 5.15 Architecture diagram (update ถ้าเปลี่ยนไปจาก Phase 0)
⬜ 5.16 API documentation (Swagger)
⬜ 5.17 Demo video (Loom 2-3 นาที)
```

**Showcase:**
```
⬜ 5.18 เขียน blog post 1 บทความ (LinkedIn/Medium)
⬜ 5.19 Update LinkedIn profile กับ project นี้
⬜ 5.20 Update resume กับ project นี้
```

### Definition of Done
- [ ] Live URL ใช้งานได้จริง
- [ ] CI/CD ทำงาน (push to main → auto deploy)
- [ ] README มี screenshots + demo video
- [ ] Blog post เผยแพร่แล้ว
- [ ] Resume อัพเดทแล้ว

### 🎓 Skill Focus
- Docker + containerization
- CI/CD pipeline
- Cloud deployment
- Technical writing

---

## 🔄 Daily Workflow

### เริ่มต้นทุกวัน (5 นาที)
1. เปิดไฟล์นี้ → ดูว่าอยู่ Phase ไหน task ไหน
2. เลือก 1-3 tasks ที่จะทำวันนี้
3. เปิด Claude Code → "วันนี้จะทำ task [X] ตาม Guideline-Dev.md"

### จบทุกวัน (10 นาที)
1. อัพเดท ⬜ → ✅ สำหรับ tasks ที่เสร็จ
2. Commit + push งานวันนี้
3. จดใน Notion diary:
   - วันนี้เรียนอะไรใหม่?
   - ตรงไหนที่ AI ช่วยมากเกินไป? (ยังไม่เข้าใจ)
   - พรุ่งนี้ทำ task อะไร?

### Weekly Review (เสาร์ 1 ชม.)
1. Review code ของทั้งสัปดาห์ → refactor 2-3 จุด
2. อัพเดทตาราง Phase status ข้างบน
3. ถามตัวเอง: "ถ้าสัมภาษณ์พรุ่งนี้ เล่า project นี้ได้กี่นาที?"
4. **สมัครงานไปอีก 3-5 ที่ (ห้ามลืม!)**

---

## 🚨 Rules ที่ห้ามลืก

### 1. ลำดับความสำคัญ
```
สมัครงาน > ทำ project > ทวน technical > เรียนภาษา
```
Project นี้คือ bonus ไม่ใช่ prerequisite ของการสมัครงาน

### 2. ห้าม skip phase
Phase 0 → 1 → 2 → 3 → 4 → 5 ตามลำดับ
ห้ามข้าม เพราะ phase หลังต่อยอดจาก phase ก่อน

### 3. ห้าม over-engineer
ถ้า task ไม่อยู่ในลิสต์ = ไม่ทำ
ถ้าอยากเพิ่ม feature → เช็ค Non-goals ใน requirements.md ก่อน

### 4. ห้ามใช้ AI โดยไม่เข้าใจ
ทุก line ที่ commit → ต้องอธิบายได้
ถ้าอธิบายไม่ได้ → ถาม Claude Code ว่า "อธิบายโค้ดนี้ให้ฟัง"

### 5. เวลาที่แนะนำ
- วันธรรมดา: 1-2 ชม. หลังเลิกงาน
- เสาร์-อาทิตย์: 3-4 ชม.
- รวม ~10-15 ชม./สัปดาห์
- **ถ้าเหนื่อย พัก ดีกว่าฝืนแล้วได้โค้ดห่วย**

---

## 📊 Skill Tracking

อัพเดททุกสัปดาห์ — ให้คะแนนตัวเอง 1-5

| Skill | W1 | W2 | W3 | W4 | W5 | W6 | เป้า |
|-------|----|----|----|----|----|----|------|
| EF Core (Include, AsNoTracking, projection) | - | - | - | - | - | - | 4/5 |
| async/await ลึก | - | - | - | - | - | - | 4/5 |
| REST API design | - | - | - | - | - | - | 4/5 |
| Angular Signals | - | - | - | - | - | - | 3/5 |
| Resilience patterns (Polly) | - | - | - | - | - | - | 3/5 |
| Docker + CI/CD | - | - | - | - | - | - | 3/5 |
| AI API integration | - | - | - | - | - | - | 4/5 |
| SQL optimization | - | - | - | - | - | - | 3/5 |
| Testing (unit + integration) | - | - | - | - | - | - | 3/5 |
| Trade-off thinking | - | - | - | - | - | - | 4/5 |

---

## 🏁 เมื่อ Project เสร็จ

### สิ่งที่ Kew ควรมี:
1. ✅ Live URL ที่ใช้งานได้จริง
2. ✅ GitHub repo ที่มี commit history สวยงาม
3. ✅ README + demo video
4. ✅ Blog post 1 บทความ
5. ✅ Resume ที่มี project นี้
6. ✅ ความมั่นใจที่จะตอบ interview ได้ 30-60 นาทีเกี่ยวกับ project นี้

### คำถาม interview ที่ต้องตอบได้:
- "เล่า project นี้ให้ฟังหน่อย — ทำอะไร ทำไม ใช้ tech อะไร"
- "ทำไมเลือก PostgreSQL ไม่ใช่ SQL Server?"
- "EF Core — มี performance issue อะไรบ้าง แก้ยังไง?"
- "AI integrate ยังไง? ถ้า API ล่มเกิดอะไรขึ้น?"
- "ถ้าวันนี้ต้อง refactor project นี้ใหม่ จะเปลี่ยนอะไร?"

---

*Last updated: 2026-05-04*
*อัพเดทไฟล์นี้ทุกวันที่ทำ project*
