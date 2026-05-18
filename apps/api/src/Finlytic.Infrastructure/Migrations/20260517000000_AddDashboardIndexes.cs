using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Finlytic.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddDashboardIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Speeds up GROUP BY type queries used in dashboard summary and trend APIs
            migrationBuilder.CreateIndex(
                name: "IX_Transactions_UserId_Type",
                table: "Transactions",
                columns: ["UserId", "Type"]);

            // Speeds up budget-vs-actual joins (lookup budgets by user + category)
            migrationBuilder.CreateIndex(
                name: "IX_Budgets_UserId_CategoryId",
                table: "Budgets",
                columns: ["UserId", "CategoryId"]);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Transactions_UserId_Type",
                table: "Transactions");

            migrationBuilder.DropIndex(
                name: "IX_Budgets_UserId_CategoryId",
                table: "Budgets");
        }
    }
}
