# ADR-003: AI Integration Strategy

## Status
Accepted

## Context

Finlytic ต้องการ AI สำหรับ 2 งานหลัก:
1. **Auto-categorization** — จัดหมวดหมู่ transaction จาก description
2. **Spending insights** — วิเคราะห์ pattern การใช้เงินและให้คำแนะนำ

ปัญหาที่ต้องแก้ในการ integrate AI:
- **Reliability:** AI API อาจ timeout หรือ rate-limited — app ต้องยังทำงานได้
- **Cost:** ถ้าใช้ paid API ทุก request cost จะพุ่งถ้ามีคน import CSV 500 rows
- **Response quality:** AI อาจตอบ format ผิด — ต้องจัดการได้โดยไม่ crash
- **Testability:** ต้องสลับ provider หรือ mock ได้ง่ายในการ test

## Decision

### 1. Provider: Gemini 1.5 Flash (MVP)

ใช้ Google Gemini 1.5 Flash สำหรับ MVP เนื่องจาก free tier (1,500 req/day, 1M tokens/day) เพียงพอสำหรับ personal use และ beta testing โดยไม่มี cost

**Upgrade path:** เมื่อ quality ไม่เพียงพอหรือ project พร้อม monetize → เปลี่ยนเป็น Claude API ผ่าน `IAiService` abstraction โดยไม่แตะ business logic

### 2. Abstraction: IAiService Interface

```
Application/Common/Interfaces/IAiService.cs
```

Interface นี้เป็น boundary ระหว่าง business logic และ AI provider ทำให้:
- Swap provider (Gemini → Claude) ได้โดยแก้แค่ DI registration
- Mock ได้ในการ unit test โดยไม่ต้องเรียก external API
- Test failure path (return null/empty) ได้ง่าย

### 3. Resilience: Polly (3 layers)

```
Retry → Circuit Breaker → Timeout
```

| Layer | Config | เหตุผล |
|-------|--------|--------|
| Retry | 3 ครั้ง, exponential backoff (2s, 4s, 8s) | transient error เช่น network blip |
| Circuit Breaker | เปิดหลัง 5 failure, ปิด 30 วินาที | ป้องกัน cascade ถ้า Gemini ล่มทั้งระบบ |
| Timeout | 35 วินาที (HttpClient.Timeout) | AI call อาจนาน แต่ต้องมี hard limit |

**Graceful degradation:** ถ้า AI ไม่ตอบ → `CategorizeAsync` return `null`, `GenerateInsightsAsync` return `[]` — user ยังใช้ app ได้ แค่ไม่มี AI suggestion

### 4. Caching: IMemoryCache

Categorization ของ description เดิมจะได้ผลเหมือนเดิมทุกครั้ง ดังนั้น cache key = `categorize:{description.ToLower()}:{type}` TTL 30 นาที

ประหยัด API call ได้มากเมื่อ user import CSV ที่มี duplicate merchant (เช่น Grab ปรากฏ 50 ครั้ง → เรียก AI แค่ 1 ครั้ง)

### 5. Prompt Management

Prompt files อยู่ใน `Infrastructure/Ai/Prompts/` เป็น EmbeddedResource — bundle ไปกับ DLL ไม่หาย

ตั้งชื่อแบบ versioned (`categorize-v1.txt`) เพื่อให้รู้ว่า prompt เปลี่ยนเมื่อไหร่ เมื่อ prompt เปลี่ยนนัยสำคัญ → ตั้งชื่อใหม่เป็น `v2` และ update การอ้างอิงใน service

### 6. Token Usage Logging

ทุก Gemini call log `promptTokenCount`, `candidatesTokenCount`, `totalTokenCount` ผ่าน Serilog เพื่อ:
- Track cost เมื่อ upgrade เป็น paid provider
- ตรวจสอบว่า prompt ยาวเกินไปไหม

## Alternatives Considered

**Option A: เรียก Gemini API โดยตรงใน Service ไม่มี abstraction**
- ง่ายกว่า แต่ swap provider ไม่ได้, test ยาก
- ปัดทิ้ง: coupling สูงเกินไป

**Option B: ใช้ Claude API ตั้งแต่ต้น**
- Quality สูงกว่า structured output reliable กว่า
- แต่ต้องมี cost ตั้งแต่ MVP — ขัดกับ constraint zero-cost infrastructure
- เก็บไว้เป็น upgrade target

**Option C: Local model (Ollama)**
- ไม่มี API cost, latency ต่ำ
- ต้องการ hardware + setup ซับซ้อน, ไม่เหมาะกับ free-tier deployment
- ปัดทิ้ง

**Option D: OpenAI GPT-4o**
- Quality ดี แต่ pricing สูงสุดในกลุ่ม ไม่มี free tier ที่ practical
- ปัดทิ้ง

## Consequences

**ได้:**
- Free tier รองรับ MVP และ beta testing ได้สบาย
- App ไม่พัง ถ้า Gemini ล่ม (graceful degradation)
- Cache ลด API call อย่างมากสำหรับ CSV import
- Swap provider ได้ง่ายเมื่อถึงเวลา

**เสีย:**
- Gemini Thai language quality ต่ำกว่า Claude เล็กน้อย — ต้องทดสอบ accuracy กับ Thai merchant names จริง
- In-memory cache หาย ทุกครั้งที่ restart server — ยอมรับได้สำหรับ MVP (ถ้าต้องการ persistent cache → ใช้ Redis)
- Circuit breaker state ไม่ share ระหว่าง instances — ยอมรับได้สำหรับ single-instance MVP

---

*Last updated: 2026-05-17*
