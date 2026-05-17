using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Finlytic.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;

namespace Finlytic.IntegrationTests;

public sealed class WebAppFactory : WebApplicationFactory<Program>
{
    internal const string JwtSecret = "test-secret-key-minimum-32-characters!!";
    internal static readonly Guid TestUserId = Guid.NewGuid();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureServices(services =>
        {
            // Swap PostgreSQL → InMemory
            var descriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
            if (descriptor is not null) services.Remove(descriptor);
            services.AddDbContext<AppDbContext>(opt =>
                opt.UseInMemoryDatabase("IntegrationTestDb"));

            // Override JWT validation params AFTER Program.cs registers them
            // (ConfigureAppConfiguration fires before Program.cs captures jwtSecret,
            //  so PostConfigure is the reliable way to override at options level)
            var testKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(JwtSecret));
            services.PostConfigure<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme, opt =>
            {
                opt.TokenValidationParameters.IssuerSigningKey = testKey;
                opt.TokenValidationParameters.ValidIssuer      = "test";
                opt.TokenValidationParameters.ValidAudience    = "test";
            });
        });
    }

    internal string MakeToken()
    {
        var key   = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(JwtSecret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            issuer: "test", audience: "test",
            claims: [new Claim(JwtRegisteredClaimNames.Sub, TestUserId.ToString())],
            expires: DateTime.UtcNow.AddHours(1),
            signingCredentials: creds);
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
