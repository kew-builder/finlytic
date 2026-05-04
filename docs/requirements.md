## Define Requirements

### 1. Problem

อยากรู้ว่าเงินตัวเองหายไปไหน แต่การจดรายรับ-รายจ่ายด้วยมือทุกวันมันน่าเบื่อจนเลิกทำกลางทาง ผลคือไม่มีข้อมูลพอจะตัดสินใจเรื่องการเงินได้ ไม่มีรีพอร์ทให้เห็นภาพชัดเจน ทำให้เก็บเงินไม่อยู่และจัดการการเงินไม่ได้

---

### 2. Users

**Primary:** พนักงานเงินเดือนหรือคนที่มีรายได้ประจำ ไม่มีเวลาจดเอง พอคุ้นเคยกับ AI tools

**Secondary:** คนที่พยายามหาทางปลดหนี้ หรือไม่รู้แนวทางจัดการการเงิน

---

### 3. MVP Features (5 เท่านั้น)

1. Register / Login
2. Add / Edit / Delete transaction (รายรับ-รายจ่าย)
   - AI suggest category จาก description, user confirm หรือแก้ได้เสมอ
   - รองรับทั้ง manual entry และ CSV import (import = หลาย records พร้อมกัน)
   - Fields จะ define หลังจาก DB design เสร็จ
3. AI auto-categorize transaction จาก description
4. Dashboard สรุปรายเดือน + chart
5. AI insights: วิเคราะห์ spending pattern + แจ้งเตือนความผิดปกติ (จาก transaction history เท่านั้น)

---

### 4. Non-goals

- ไม่รองรับการแชร์บัญชีกับคนอื่น (1 user = 1 account)
- ไม่ทำเรื่องภาษี / การลงทุน
- ไม่มี mobile app (web responsive พอ)
- ไม่เชื่อมต่อธนาคารอัตโนมัติ (manual entry + CSV import เท่านั้น)
- ไม่มี Goal management และ Goal-based AI guideline ใน MVP → เลื่อนไป v1.1

---

### 5. Success Criteria

- [ ] ใช้งานครบ 5 MVP features ได้บน live URL
- [ ] ใช้ track เงินตัวเองได้จริงครบ 30 วัน calendar
- [ ] มีคน beta test 3 คน + ได้รับ feedback
- [ ] โหลดหน้า dashboard < 2 วินาที
- [ ] มี automated tests cover happy paths
- [ ] README พร้อม + demo video < 3 นาที
- [ ] Deploy ขึ้น production แล้ว
- [ ] เขียน blog post 1 บทความเกี่ยวกับ project

---

### 6. Post-MVP (v1.1)

- Goal management: user กรอก financial goals เอง
- AI guideline: ช่วยวางแผนและแจ้งเตือนตาม goals

---

*Last updated: 2026-05-03*
