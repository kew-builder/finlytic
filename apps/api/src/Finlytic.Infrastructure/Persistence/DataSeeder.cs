using Finlytic.Domain.Entities;
using Finlytic.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Finlytic.Infrastructure.Persistence;

/// <summary>
/// Seeds a demo user with 6 months of realistic transaction data so the dashboard
/// and AI insights have enough context to produce meaningful output.
/// Runs only in Development; idempotent (skips if demo user already exists).
/// Login: demo@finlytic.dev / Demo1234!
/// </summary>
public static class DataSeeder
{
    private const string DemoEmail = "demo@finlytic.dev";
    private const string DemoPassword = "Demo1234!";
    private const string DemoName = "Demo User";

    public static async Task SeedDemoAsync(IServiceProvider services, ILogger logger)
    {
        var db = services.GetRequiredService<AppDbContext>();

        if (await db.Users.AnyAsync(u => u.Email == DemoEmail))
        {
            logger.LogInformation("Demo data already exists — skipping seed");
            return;
        }

        logger.LogInformation("Seeding demo data for {Email}...", DemoEmail);

        // ── User ─────────────────────────────────────────────────────────────
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(DemoPassword, workFactor: 12);
        var user = User.Create(DemoEmail, passwordHash, DemoName);
        db.Users.Add(user);
        await db.SaveChangesAsync();

        // ── Categories ───────────────────────────────────────────────────────
        // Names match exactly the Thai names used in insights-v1.txt prompt
        var expense = TransactionType.Expense;
        var income = TransactionType.Income;

        var catFood    = Category.Create(user.Id, "อาหารและเครื่องดื่ม", expense, "#f97316", isDefault: true);
        var catTravel  = Category.Create(user.Id, "เดินทาง",             expense, "#3b82f6", isDefault: true);
        var catHousing = Category.Create(user.Id, "ที่อยู่อาศัย",        expense, "#8b5cf6", isDefault: true);
        var catShop    = Category.Create(user.Id, "ช้อปปิ้ง",            expense, "#ec4899", isDefault: true);
        var catEntert  = Category.Create(user.Id, "บันเทิง",             expense, "#06b6d4", isDefault: true);
        var catHealth  = Category.Create(user.Id, "สุขภาพ",              expense, "#22c55e", isDefault: true);
        var catEdu     = Category.Create(user.Id, "การศึกษา",            expense, "#eab308", isDefault: true);
        var catOtherEx = Category.Create(user.Id, "รายจ่ายอื่นๆ",        expense, "#6b7280", isDefault: true);

        var catSalary  = Category.Create(user.Id, "เงินเดือน",           income,  "#10b981", isDefault: true);
        var catFreelance = Category.Create(user.Id, "รายได้เสริม",       income,  "#3b82f6", isDefault: true);
        var catOtherIn = Category.Create(user.Id, "รายรับอื่นๆ",         income,  "#6b7280", isDefault: true);

        db.Categories.AddRange(catFood, catTravel, catHousing, catShop, catEntert,
                               catHealth, catEdu, catOtherEx, catSalary, catFreelance, catOtherIn);
        await db.SaveChangesAsync();

        // ── Budgets (monthly) ─────────────────────────────────────────────────
        var budgetStart = new DateOnly(2026, 1, 1);
        db.Budgets.AddRange(
            Budget.Create(user.Id, catFood.Id,    8_000m,  BudgetPeriod.Monthly, budgetStart),
            Budget.Create(user.Id, catTravel.Id,  3_000m,  BudgetPeriod.Monthly, budgetStart),
            Budget.Create(user.Id, catHousing.Id, 12_000m, BudgetPeriod.Monthly, budgetStart),
            Budget.Create(user.Id, catShop.Id,    2_500m,  BudgetPeriod.Monthly, budgetStart),
            Budget.Create(user.Id, catEntert.Id,  2_000m,  BudgetPeriod.Monthly, budgetStart),
            Budget.Create(user.Id, catHealth.Id,  3_000m,  BudgetPeriod.Monthly, budgetStart),
            Budget.Create(user.Id, catOtherEx.Id, 2_000m,  BudgetPeriod.Monthly, budgetStart)
        );
        await db.SaveChangesAsync();

        // ── Transactions ─────────────────────────────────────────────────────
        var uid = user.Id;
        var txns = new List<Transaction>();

        // Helper
        Transaction T(DateOnly date, decimal amount, TransactionType type, string desc, Category? cat = null)
            => Transaction.Create(uid, amount, type, date, desc, cat?.Id);

        DateOnly D(int year, int month, int day) => new(year, month, day);

        // ── November 2025 (income 58,000 | expenses 32,200) ──────────────────
        txns.Add(T(D(2025, 11, 1),  55_000m, income,  "เงินเดือน พฤศจิกายน",        catSalary));
        txns.Add(T(D(2025, 11, 5),  3_000m,  income,  "ค่าจ้าง Freelance งานกราฟิก", catFreelance));
        txns.Add(T(D(2025, 11, 1),  12_000m, expense, "ค่าเช่าอพาร์ตเมนต์",          catHousing));
        txns.Add(T(D(2025, 11, 3),  85m,     expense, "กาแฟ Cafe Amazon",             catFood));
        txns.Add(T(D(2025, 11, 4),  220m,    expense, "Grab ไปทำงาน",                catTravel));
        txns.Add(T(D(2025, 11, 5),  1_450m,  expense, "ซื้อของ Big C",               catFood));
        txns.Add(T(D(2025, 11, 7),  850m,    expense, "ร้านอาหาร สุกี้ MK",          catFood));
        txns.Add(T(D(2025, 11, 8),  279m,    expense, "Netflix รายเดือน",             catEntert));
        txns.Add(T(D(2025, 11, 10), 450m,    expense, "Grab รับส่ง",                 catTravel));
        txns.Add(T(D(2025, 11, 12), 1_200m,  expense, "ช้อปปิ้ง Shopee",             catShop));
        txns.Add(T(D(2025, 11, 14), 320m,    expense, "ค่ายา ร้านขายยา",             catHealth));
        txns.Add(T(D(2025, 11, 15), 1_800m,  expense, "ตลาด เซ็นทรัล ซื้อของ",      catFood));
        txns.Add(T(D(2025, 11, 18), 650m,    expense, "ดูหนัง SF Cinema",            catEntert));
        txns.Add(T(D(2025, 11, 20), 180m,    expense, "กาแฟ Starbucks",              catFood));
        txns.Add(T(D(2025, 11, 22), 980m,    expense, "เสื้อผ้า Uniqlo",             catShop));
        txns.Add(T(D(2025, 11, 25), 550m,    expense, "Grab ไปห้าง",                 catTravel));
        txns.Add(T(D(2025, 11, 26), 2_100m,  expense, "ซื้อของ Makro",               catFood));
        txns.Add(T(D(2025, 11, 28), 450m,    expense, "หนังสือ SE ใหม่",             catEdu));
        txns.Add(T(D(2025, 11, 29), 450m,    expense, "Spotify Family 3 เดือน",      catEntert));
        txns.Add(T(D(2025, 11, 30), 2_130m,  expense, "ค่าไฟ + น้ำ",                catOtherEx));

        // ── December 2025 (income 70,000 | expenses 46,350 — เทศกาล) ──────────
        txns.Add(T(D(2025, 12, 1),  55_000m, income,  "เงินเดือน ธันวาคม",           catSalary));
        txns.Add(T(D(2025, 12, 3),  15_000m, income,  "โบนัสปลายปี",                 catOtherIn));
        txns.Add(T(D(2025, 12, 1),  12_000m, expense, "ค่าเช่าอพาร์ตเมนต์",          catHousing));
        txns.Add(T(D(2025, 12, 2),  85m,     expense, "กาแฟ Cafe Amazon",             catFood));
        txns.Add(T(D(2025, 12, 5),  3_500m,  expense, "ของขวัญคริสต์มาส",           catShop));
        txns.Add(T(D(2025, 12, 7),  1_200m,  expense, "ซื้อของ Big C",               catFood));
        txns.Add(T(D(2025, 12, 10), 279m,    expense, "Netflix รายเดือน",             catEntert));
        txns.Add(T(D(2025, 12, 12), 2_800m,  expense, "อาหารเลี้ยงปาร์ตี้",          catFood));
        txns.Add(T(D(2025, 12, 14), 4_200m,  expense, "ช้อปปิ้ง Year End Sale",      catShop));
        txns.Add(T(D(2025, 12, 15), 750m,    expense, "Grab ไปงานปาร์ตี้",           catTravel));
        txns.Add(T(D(2025, 12, 18), 1_500m,  expense, "ดินเนอร์วันคริสต์มาส",       catFood));
        txns.Add(T(D(2025, 12, 20), 880m,    expense, "เสื้อผ้าออกงาน",             catShop));
        txns.Add(T(D(2025, 12, 22), 3_200m,  expense, "ซื้อของฝาก ขึ้นบ้านใหม่",    catShop));
        txns.Add(T(D(2025, 12, 25), 2_500m,  expense, "อาหารวันปีใหม่ล่วงหน้า",     catFood));
        txns.Add(T(D(2025, 12, 26), 980m,    expense, "ค่าเดินทาง BTS + Grab",       catTravel));
        txns.Add(T(D(2025, 12, 28), 2_100m,  expense, "ค่าไฟ + น้ำ",                catOtherEx));
        txns.Add(T(D(2025, 12, 29), 1_800m,  expense, "บัตรคอนเสิร์ต countdown",     catEntert));
        txns.Add(T(D(2025, 12, 31), 4_798m,  expense, "ฉลองปีใหม่ dinner",          catFood));

        // ── January 2026 (income 55,000 | expenses 28,150 — ประหยัด) ──────────
        txns.Add(T(D(2026, 1, 1),  55_000m, income,  "เงินเดือน มกราคม",            catSalary));
        txns.Add(T(D(2026, 1, 1),  12_000m, expense, "ค่าเช่าอพาร์ตเมนต์",          catHousing));
        txns.Add(T(D(2026, 1, 2),  85m,     expense, "กาแฟ Cafe Amazon",             catFood));
        txns.Add(T(D(2026, 1, 4),  1_200m,  expense, "ซื้อของ Big C",               catFood));
        txns.Add(T(D(2026, 1, 7),  279m,    expense, "Netflix รายเดือน",             catEntert));
        txns.Add(T(D(2026, 1, 8),  320m,    expense, "Grab ไปทำงาน",                catTravel));
        txns.Add(T(D(2026, 1, 10), 850m,    expense, "ร้านข้าวต้มริมทาง",           catFood));
        txns.Add(T(D(2026, 1, 12), 450m,    expense, "ยาและวิตามิน",                catHealth));
        txns.Add(T(D(2026, 1, 15), 1_600m,  expense, "ซื้อของ Makro",               catFood));
        txns.Add(T(D(2026, 1, 18), 380m,    expense, "Grab ไปห้าง",                 catTravel));
        txns.Add(T(D(2026, 1, 20), 550m,    expense, "Shopee (ของใช้บ้าน)",         catShop));
        txns.Add(T(D(2026, 1, 22), 650m,    expense, "ดูหนัง + popcorn",            catEntert));
        txns.Add(T(D(2026, 1, 25), 1_400m,  expense, "ซื้อของ Lotus's",             catFood));
        txns.Add(T(D(2026, 1, 27), 2_200m,  expense, "ค่าไฟ + น้ำ",                catOtherEx));
        txns.Add(T(D(2026, 1, 28), 180m,    expense, "กาแฟ ใกล้บ้าน",              catFood));
        txns.Add(T(D(2026, 1, 30), 5_000m,  expense, "ค่าคอร์สออนไลน์ Udemy",      catEdu));

        // ── February 2026 (income 55,000 | expenses 35,200) ──────────────────
        txns.Add(T(D(2026, 2, 1),  55_000m, income,  "เงินเดือน กุมภาพันธ์",        catSalary));
        txns.Add(T(D(2026, 2, 1),  12_000m, expense, "ค่าเช่าอพาร์ตเมนต์",          catHousing));
        txns.Add(T(D(2026, 2, 2),  85m,     expense, "กาแฟ Cafe Amazon",             catFood));
        txns.Add(T(D(2026, 2, 4),  1_350m,  expense, "ซื้อของ Big C",               catFood));
        txns.Add(T(D(2026, 2, 7),  279m,    expense, "Netflix รายเดือน",             catEntert));
        txns.Add(T(D(2026, 2, 8),  450m,    expense, "Grab ไปทำงาน",                catTravel));
        txns.Add(T(D(2026, 2, 10), 950m,    expense, "ร้านอาหาร วันวาเลนไทน์",      catFood));
        txns.Add(T(D(2026, 2, 12), 1_200m,  expense, "ดอกไม้ + ของขวัญ วาเลนไทน์", catShop));
        txns.Add(T(D(2026, 2, 14), 2_400m,  expense, "dinner วาเลนไทน์",            catFood));
        txns.Add(T(D(2026, 2, 15), 650m,    expense, "Grab + BTS",                  catTravel));
        txns.Add(T(D(2026, 2, 18), 1_800m,  expense, "ซื้อของ Makro",               catFood));
        txns.Add(T(D(2026, 2, 20), 880m,    expense, "เสื้อผ้า H&M",                catShop));
        txns.Add(T(D(2026, 2, 22), 500m,    expense, "ยาแก้ปวดหัว",                 catHealth));
        txns.Add(T(D(2026, 2, 25), 1_550m,  expense, "ซื้อของ Lotus's",             catFood));
        txns.Add(T(D(2026, 2, 26), 450m,    expense, "บัตรหนัง",                    catEntert));
        txns.Add(T(D(2026, 2, 28), 2_152m,  expense, "ค่าไฟ + น้ำ",                catOtherEx));

        // ── March 2026 (income 58,000 | expenses 38,580 — เพิ่มขึ้น) ────────
        txns.Add(T(D(2026, 3, 1),  55_000m, income,  "เงินเดือน มีนาคม",            catSalary));
        txns.Add(T(D(2026, 3, 3),  3_000m,  income,  "Freelance งานเว็บ",           catFreelance));
        txns.Add(T(D(2026, 3, 1),  12_000m, expense, "ค่าเช่าอพาร์ตเมนต์",          catHousing));
        txns.Add(T(D(2026, 3, 2),  95m,     expense, "กาแฟ Cafe Amazon",             catFood));
        txns.Add(T(D(2026, 3, 3),  180m,    expense, "กาแฟ Starbucks",              catFood));
        txns.Add(T(D(2026, 3, 5),  1_600m,  expense, "ซื้อของ Big C",               catFood));
        txns.Add(T(D(2026, 3, 7),  279m,    expense, "Netflix รายเดือน",             catEntert));
        txns.Add(T(D(2026, 3, 8),  580m,    expense, "Grab ไปทำงาน",                catTravel));
        txns.Add(T(D(2026, 3, 10), 1_200m,  expense, "ร้านอาหาร shabu",             catFood));
        txns.Add(T(D(2026, 3, 12), 2_100m,  expense, "ช้อปปิ้ง Shopee",             catShop));
        txns.Add(T(D(2026, 3, 14), 350m,    expense, "ยาและวิตามิน",                catHealth));
        txns.Add(T(D(2026, 3, 15), 2_000m,  expense, "ซื้อของ Makro",               catFood));
        txns.Add(T(D(2026, 3, 17), 680m,    expense, "ดูหนัง SF + ป็อปคอร์น",       catEntert));
        txns.Add(T(D(2026, 3, 18), 280m,    expense, "กาแฟ Cafe Amazon",             catFood));
        txns.Add(T(D(2026, 3, 20), 1_500m,  expense, "เสื้อผ้า Zara sale",          catShop));
        txns.Add(T(D(2026, 3, 22), 750m,    expense, "Grab ทั้งสัปดาห์",             catTravel));
        txns.Add(T(D(2026, 3, 25), 1_800m,  expense, "ซื้อของ Lotus's",             catFood));
        txns.Add(T(D(2026, 3, 27), 450m,    expense, "Spotify + YouTube Premium",    catEntert));
        txns.Add(T(D(2026, 3, 28), 450m,    expense, "หนังสือ Clean Code",           catEdu));
        txns.Add(T(D(2026, 3, 31), 2_278m,  expense, "ค่าไฟ + น้ำ",                catOtherEx));

        // ── April 2026 (income 58,000 | expenses 42,400 — trend ชัด) ─────────
        txns.Add(T(D(2026, 4, 1),  55_000m, income,  "เงินเดือน เมษายน",            catSalary));
        txns.Add(T(D(2026, 4, 5),  3_000m,  income,  "Freelance ออกแบบ logo",       catFreelance));
        txns.Add(T(D(2026, 4, 1),  12_000m, expense, "ค่าเช่าอพาร์ตเมนต์",          catHousing));
        txns.Add(T(D(2026, 4, 2),  95m,     expense, "กาแฟ Cafe Amazon",             catFood));
        txns.Add(T(D(2026, 4, 3),  200m,    expense, "กาแฟ Starbucks",              catFood));
        txns.Add(T(D(2026, 4, 5),  1_850m,  expense, "ซื้อของ Big C",               catFood));
        txns.Add(T(D(2026, 4, 7),  279m,    expense, "Netflix รายเดือน",             catEntert));
        txns.Add(T(D(2026, 4, 8),  650m,    expense, "Grab ไปทำงาน",                catTravel));
        txns.Add(T(D(2026, 4, 10), 1_400m,  expense, "สงกรานต์ อาหารงานบ้าน",       catFood));
        txns.Add(T(D(2026, 4, 12), 3_800m,  expense, "ช้อปปิ้ง เสื้อสงกรานต์ + ของ",catShop));
        txns.Add(T(D(2026, 4, 13), 2_200m,  expense, "อาหาร งานสงกรานต์",           catFood));
        txns.Add(T(D(2026, 4, 14), 980m,    expense, "Grab + เรือ ช่วงสงกรานต์",    catTravel));
        txns.Add(T(D(2026, 4, 16), 650m,    expense, "ดูหนัง + ของกิน",             catEntert));
        txns.Add(T(D(2026, 4, 18), 120m,    expense, "กาแฟ ร้านแถวบ้าน",           catFood));
        txns.Add(T(D(2026, 4, 20), 2_200m,  expense, "ซื้อของ Makro",               catFood));
        txns.Add(T(D(2026, 4, 22), 850m,    expense, "ยา + ตรวจสุขภาพเบื้องต้น",   catHealth));
        txns.Add(T(D(2026, 4, 24), 1_950m,  expense, "ซื้อของ Lotus's",             catFood));
        txns.Add(T(D(2026, 4, 26), 450m,    expense, "Spotify + YouTube Premium",    catEntert));
        txns.Add(T(D(2026, 4, 28), 1_200m,  expense, "เสื้อผ้า Uniqlo",             catShop));
        txns.Add(T(D(2026, 4, 30), 2_322m,  expense, "ค่าไฟ + น้ำ",                catOtherEx));

        // ── May 2026 (18 วันแรก — AI insight window) ─────────────────────────
        // Pattern: อาหารสูงขึ้น, ช้อปปิ้งเกิน budget, anomaly ทันตกรรม
        txns.Add(T(D(2026, 5, 1),  55_000m, income,  "เงินเดือน พฤษภาคม",           catSalary));
        txns.Add(T(D(2026, 5, 1),  12_000m, expense, "ค่าเช่าอพาร์ตเมนต์",          catHousing));
        txns.Add(T(D(2026, 5, 2),  95m,     expense, "กาแฟ Cafe Amazon",             catFood));
        txns.Add(T(D(2026, 5, 2),  220m,    expense, "Grab ไปทำงาน",                catTravel));
        txns.Add(T(D(2026, 5, 3),  180m,    expense, "กาแฟ Starbucks",              catFood));
        // Anomaly: ค่าทันตกรรมสูงผิดปกติ (insight: anomaly)
        txns.Add(T(D(2026, 5, 4),  9_500m,  expense, "ทำฟัน อุดฟัน + ขูดหินปูน",   catHealth));
        txns.Add(T(D(2026, 5, 5),  1_950m,  expense, "ซื้อของ Big C",               catFood));
        txns.Add(T(D(2026, 5, 6),  2_200m,  income,  "ขายของเก่าออนไลน์",           catOtherIn));
        txns.Add(T(D(2026, 5, 7),  279m,    expense, "Netflix รายเดือน",             catEntert));
        txns.Add(T(D(2026, 5, 7),  850m,    expense, "ร้านอาหาร ชาบู",              catFood));
        // ช้อปปิ้งเกิน budget 2,500 (insight: overspending)
        txns.Add(T(D(2026, 5, 8),  1_890m,  expense, "Shopee เสื้อผ้า + รองเท้า",  catShop));
        txns.Add(T(D(2026, 5, 9),  450m,    expense, "กาแฟ หลายร้าน (สัปดาห์นี้)", catFood));
        txns.Add(T(D(2026, 5, 10), 750m,    expense, "Grab ทั้งสัปดาห์",             catTravel));
        txns.Add(T(D(2026, 5, 11), 2_100m,  expense, "ช้อปปิ้ง Lazada (ของบ้าน)",  catShop));
        txns.Add(T(D(2026, 5, 12), 680m,    expense, "ดูหนัง Major",                catEntert));
        txns.Add(T(D(2026, 5, 13), 1_600m,  expense, "ซื้อของ Makro",               catFood));
        txns.Add(T(D(2026, 5, 14), 120m,    expense, "กาแฟ ใกล้บ้าน",              catFood));
        txns.Add(T(D(2026, 5, 15), 380m,    expense, "ยาวิตามิน",                   catHealth));
        txns.Add(T(D(2026, 5, 15), 1_500m,  expense, "ร้านอาหาร เพื่อนมาเที่ยว",   catFood));
        txns.Add(T(D(2026, 5, 16), 320m,    expense, "Grab กลับบ้าน",               catTravel));
        txns.Add(T(D(2026, 5, 17), 1_800m,  expense, "ซื้อของ Lotus's",             catFood));
        txns.Add(T(D(2026, 5, 17), 450m,    expense, "Spotify + YouTube Premium",    catEntert));
        txns.Add(T(D(2026, 5, 18), 200m,    expense, "กาแฟ เช้าวันนี้",             catFood));

        db.Transactions.AddRange(txns);
        await db.SaveChangesAsync();

        logger.LogInformation(
            "Demo data seeded — {TxnCount} transactions, {CatCount} categories, {BudgetCount} budgets",
            txns.Count, 11, 7);
    }
}
