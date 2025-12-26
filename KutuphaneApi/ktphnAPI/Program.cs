using System;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.EntityFrameworkCore;
using ktphnAPI.Data;
using ktphnAPI.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using ktphnAPI.Utilities;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddHostedService<CezaHesaplaPeakService>(); // Ceza hesaplama background servisi

// Rate Limiting
builder.Services.AddRateLimiter(options =>
{
    // Global rate limit
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "anonymous",
            factory: partition => new FixedWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit = 100, // 100 istek
                Window = TimeSpan.FromMinutes(1) // 1 dakika içinde
            }));

    // Login endpoint için daha sıkı limit (brute force koruması)
    options.AddPolicy<string>("login", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "anonymous",
            factory: partition => new FixedWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit = 5, // 5 istek
                Window = TimeSpan.FromMinutes(1) // 1 dakika içinde
            }));

    // Register endpoint için limit
    options.AddPolicy<string>("register", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "anonymous",
            factory: partition => new FixedWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit = 3, // 3 istek
                Window = TimeSpan.FromMinutes(10) // 10 dakika içinde
            }));

    // Rate limit aşıldığında dönecek response
    options.OnRejected = async (context, cancellationToken) =>
    {
        context.HttpContext.Response.StatusCode = 429; // Too Many Requests
        await context.HttpContext.Response.WriteAsJsonAsync(new
        {
            success = false,
            mesaj = "Çok fazla istek gönderildi. Lütfen daha sonra tekrar deneyin."
        }, cancellationToken);
    };
});

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

// if (!string.IsNullOrEmpty(connectionString))
// {
//     builder.Services.AddDbContext<AppDbContext>(options =>
//         options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));
// }
Console.WriteLine($"Veritabanı Adresi: {connectionString}");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

var jwtSection = builder.Configuration.GetSection("Jwt");
var jwtKey = jwtSection.GetValue<string>("Key");
var jwtIssuer = jwtSection.GetValue<string>("Issuer");
var jwtAudience = jwtSection.GetValue<string>("Audience");

if (string.IsNullOrWhiteSpace(jwtKey))
{
    Console.WriteLine("UYARI: Jwt:Key tanımlı değil, kimlik doğrulama başarısız olur.");
}

var keyBytes = string.IsNullOrWhiteSpace(jwtKey) ? Array.Empty<byte>() : Encoding.UTF8.GetBytes(jwtKey);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
}).AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(keyBytes),
        ClockSkew = TimeSpan.FromMinutes(2)
    };
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("izinVer",
        policy =>
        {
            policy.AllowAnyOrigin()
                  .AllowAnyMethod()
                  .AllowAnyHeader();
        });
});

var app = builder.Build();

// NOT: Şifreler başarıyla hash'lendi - bir dahaki çalıştırmada bu kod kaldırılabilir
// using (var scope = app.Services.CreateScope())
// {
//     var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
//     await PasswordHasher.HashExistingPasswords(context);
// }

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    app.UseHttpsRedirection();
}

app.UseCors("izinVer");

app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run(); 