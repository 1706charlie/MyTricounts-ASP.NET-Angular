using AutoMapper;
using AutoMapper.EquivalencyExpression;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Text.Json;
using TricountApp.Models;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers()
    .AddJsonOptions(o =>
    {
        o.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower;
    });


// In production, the Angular files will be served from this directory (see: https://stackoverflow.com/a/55989907)
builder.Services.AddSpaStaticFiles(cfg => cfg.RootPath = "wwwroot/frontend");

builder.Services.AddDbContext<TricountContext>(opt => opt.UseNpgsql(
    builder.Configuration.GetConnectionString("prid-2526-f03")
));



// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Auto Mapper Configurations
builder.Services.AddScoped(provider => new MapperConfiguration(cfg => {
    cfg.AddProfile(new MappingProfile(provider.GetService<TricountContext>()!));
    // see: https://github.com/AutoMapper/AutoMapper.Collection
    cfg.AddCollectionMappers();
}).CreateMapper());


var key = Encoding.ASCII.GetBytes("my-super-secret-key my-super-secret-key");

builder.Services.AddAuthentication(x => {
    x.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    x.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(x => {
    // En dev, tu peux autoriser HTTP simple. Mets true en prod.
    x.RequireHttpsMetadata = false;
    x.SaveToken = true;
    x.TokenValidationParameters = new TokenValidationParameters {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = false,
        ValidateAudience = false,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});


var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment()) {
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Ensure database exists (applies HasData seeding)
using (var scope = app.Services.CreateScope()) {
    var context = scope.ServiceProvider.GetRequiredService<TricountContext>();
    if (app.Environment.IsDevelopment()) {
        context.Database.EnsureDeleted();
    }
    context.Database.EnsureCreated();
}

app.UseDefaultFiles();
app.UseStaticFiles();
app.UseSpaStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.UseSpa(spa => {});

app.Run();
