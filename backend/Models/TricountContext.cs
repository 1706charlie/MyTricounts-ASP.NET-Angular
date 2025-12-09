using Microsoft.EntityFrameworkCore;
using TricountApp.Models.Entities;

namespace TricountApp.Models;

// "le modèle est cyclique" : on travaille en relations bidirectionnelles

public class TricountContext(DbContextOptions<TricountContext> options) : DbContext(options)
{
    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder) {
        base.OnConfiguring(optionsBuilder);
        optionsBuilder
            .LogTo(Console.WriteLine, LogLevel.Information)
            .EnableSensitiveDataLogging();
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder) {
        base.OnModelCreating(modelBuilder);

        // =========================================
        //  USER
        // =========================================
        modelBuilder.Entity<UserEntity>(entity => 
        {
            entity.HasIndex(u => u.Email).IsUnique();
            entity.HasIndex(u => u.Name).IsUnique();

            entity.HasData(
                new UserEntity {
                    Id = 1,
                    Email = "boverhaegen@epfc.eu",
                    Name = "Boris",
                    PasswordHash = "HTkZEykI+MO5KyZ67gObfqzHDJV1l9U9KxuMofK0gpY="
                },
                new UserEntity {
                    Id = 2,
                    Email = "bepenelle@epfc.eu",
                    Name = "Benoît",
                    PasswordHash = "HTkZEykI+MO5KyZ67gObfqzHDJV1l9U9KxuMofK0gpY="
                },
                new UserEntity {
                    Id = 3,
                    Email = "xapigeolet@epfc.eu",
                    Name = "Xavier",
                    PasswordHash = "HTkZEykI+MO5KyZ67gObfqzHDJV1l9U9KxuMofK0gpY="
                },
                new UserEntity {
                    Id = 4,
                    Email = "mamichel@epfc.eu",
                    Name = "Marc",
                    Iban = "BE12 1234 1234 1234",
                    PasswordHash = "HTkZEykI+MO5KyZ67gObfqzHDJV1l9U9KxuMofK0gpY="
                },
                new UserEntity {
                    Id = 5,
                    Email = "gedielman@epfc.eu",
                    Name = "Geoffrey",
                    Iban = "BE45 4567 4567 4567",
                    PasswordHash = "HTkZEykI+MO5KyZ67gObfqzHDJV1l9U9KxuMofK0gpY="
                },
                new UserEntity {
                    Id = 9,
                    Email = "admin@epfc.eu",
                    Name = "Admin",
                    PasswordHash = "HTkZEykI+MO5KyZ67gObfqzHDJV1l9U9KxuMofK0gpY=",
                    Role = Role.Admin
                }
            );
        });

        // =========================================
        //  TRICOUNT
        // =========================================
        modelBuilder.Entity<TricountEntity>(entity => 
        {
            entity.HasIndex(t => new { t.CreatorId, t.Title }).IsUnique(); // Titre unique PAR créateur

            // ONE-TO-MANY Creator -> Tricounts
            entity.HasOne(t => t.Creator)
                .WithMany(u => u.CreatedTricounts)
                .HasForeignKey(t => t.CreatorId)
                .OnDelete(DeleteBehavior.Restrict); // on interdit la suppression d'un user s'il a créé des tricounts.

            entity.HasData(
                new TricountEntity {
                    Id = 1,
                    Title = "Gers 2022",
                    CreatorId = 1,
                    CreatedAt = new DateTime(2024, 10, 10, 18, 42, 24, DateTimeKind.Utc)
                },
                new TricountEntity {
                    Id = 2,
                    Title = "Resto badminton",
                    CreatorId = 1,
                    CreatedAt = new DateTime(2024, 10, 10, 19, 25, 10, DateTimeKind.Utc)
                },
                new TricountEntity {
                    Id = 4,
                    Title = "Vacances",
                    Description = "A la mer du nord",
                    CreatorId = 1,
                    CreatedAt = new DateTime(2024, 10, 10, 19, 31, 09, DateTimeKind.Utc)
                }
            );
        });

        // =========================================
        //  MANY-TO-MANY User <-> Tricount  (via Participation)
        // =========================================
        modelBuilder.Entity<TricountEntity>()
            .HasMany(t => t.Participants)
            .WithMany(u => u.Tricounts)
            .UsingEntity<ParticipationEntity>(

                // (FK UserId)
                right => right
                    .HasOne(p => p.User)
                    .WithMany(u => u.Participations)
                    .HasForeignKey(p => p.UserId)
                    .OnDelete(DeleteBehavior.Cascade),

                // (FK TricountId)
                left => left
                    .HasOne(p => p.Tricount)
                    .WithMany(t => t.Participations)
                    .HasForeignKey(p => p.TricountId)
                    .OnDelete(DeleteBehavior.Cascade),

                join => {
                    join.ToTable("Participations");
                    join.HasKey(p => new { p.TricountId, p.UserId });

                    join.HasData(
                        new ParticipationEntity { TricountId = 1, UserId = 1 },
                        new ParticipationEntity { TricountId = 2, UserId = 1 },
                        new ParticipationEntity { TricountId = 2, UserId = 2 },
                        new ParticipationEntity { TricountId = 4, UserId = 1 },
                        new ParticipationEntity { TricountId = 4, UserId = 2 },
                        new ParticipationEntity { TricountId = 4, UserId = 3 },
                        new ParticipationEntity { TricountId = 4, UserId = 4 }
                    );
                }
            );

        // =========================================
        //  OPERATION
        // =========================================
        modelBuilder.Entity<OperationEntity>(entity => {

            // ONE-TO-MANY Tricount -> Operations
            entity.HasOne(o => o.Tricount)
                .WithMany(t => t.Operations)
                .HasForeignKey(o => o.TricountId)
                .OnDelete(DeleteBehavior.Cascade); // Si on supprime un tricount, on supprime ses opérations.

            // MANY-TO-ONE Operation -> Initiator
            entity.HasOne(o => o.Initiator)
                .WithMany(u => u.InitiatedOperations)
                .HasForeignKey(o => o.InitiatorId)
                .OnDelete(DeleteBehavior.Restrict); // On empêche la suppression d'un user s'il a initié des opérations.
                
            entity.HasData(
                new OperationEntity {
                    Id = 1,
                    Title = "Colruyt",
                    TricountId = 4,
                    Amount = 100.00m,
                    OperationDate = new DateOnly(2024, 10, 13),
                    InitiatorId = 2,
                    CreatedAt = new DateTime(2024, 10, 13, 19, 09, 18, DateTimeKind.Utc)
                },
                new OperationEntity {
                    Id = 2,
                    Title = "Plein essence",
                    TricountId = 4,
                    Amount = 75.00m,
                    OperationDate = new DateOnly(2024, 10, 13),
                    InitiatorId = 1,
                    CreatedAt = new DateTime(2024, 10, 13, 20, 10, 41, DateTimeKind.Utc)
                },
                new OperationEntity {
                    Id = 3,
                    Title = "Grosses courses LIDL",
                    TricountId = 4,
                    Amount = 212.47m,
                    OperationDate = new DateOnly(2024, 10, 13),
                    InitiatorId = 3,
                    CreatedAt = new DateTime(2024, 10, 13, 21, 23, 49, DateTimeKind.Utc)
                },
                new OperationEntity {
                    Id = 4,
                    Title = "Apéros",
                    TricountId = 4,
                    Amount = 31.90m,
                    OperationDate = new DateOnly(2024, 10, 13),
                    InitiatorId = 1,
                    CreatedAt = new DateTime(2024, 10, 13, 23, 51, 20, DateTimeKind.Utc)
                },
                new OperationEntity {
                    Id = 5,
                    Title = "Boucherie",
                    TricountId = 4,
                    Amount = 25.50m,
                    OperationDate = new DateOnly(2024, 10, 26),
                    InitiatorId = 2,
                    CreatedAt = new DateTime(2024, 10, 26, 09, 59, 56, DateTimeKind.Utc)
                },
                new OperationEntity {
                    Id = 6,
                    Title = "Loterie",
                    TricountId = 4,
                    Amount = 35.00m,
                    OperationDate = new DateOnly(2024, 10, 26),
                    InitiatorId = 1,
                    CreatedAt = new DateTime(2024, 10, 26, 10, 02, 24, DateTimeKind.Utc)
                }
            );
        });

        // ==========================
        // MANY-TO-MANY Operation <-> User (via Repartition) 
        // ==========================
        modelBuilder.Entity<OperationEntity>()
            .HasMany(left => left.Participants)
            .WithMany(right => right.Operations)
            .UsingEntity<RepartitionEntity>(

                // (FK UserId)
                right => right
                    .HasOne(r => r.User)
                    .WithMany(u => u.Repartitions)                    
                    .HasForeignKey(r => r.UserId)
                    .OnDelete(DeleteBehavior.Restrict),  // empêche de supprimer un User impliqué

                // (FK OperationId)
                left => left
                    .HasOne(r => r.Operation)
                    .WithMany(o => o.Repartitions)                      
                    .HasForeignKey(r => r.OperationId)
                    .OnDelete(DeleteBehavior.Cascade),  // si on supprime une opération, ses répartitions suivent

                join => {
                    join.ToTable("Repartitions");
                    join.HasKey(r => new { r.OperationId, r.UserId });

                    join.HasData(
                        new RepartitionEntity { OperationId = 1, UserId = 1, Weight = 1 },
                        new RepartitionEntity { OperationId = 1, UserId = 2, Weight = 1 },
                        new RepartitionEntity { OperationId = 2, UserId = 1, Weight = 1 },
                        new RepartitionEntity { OperationId = 2, UserId = 2, Weight = 1 },
                        new RepartitionEntity { OperationId = 3, UserId = 1, Weight = 2 },
                        new RepartitionEntity { OperationId = 3, UserId = 2, Weight = 1 },
                        new RepartitionEntity { OperationId = 3, UserId = 3, Weight = 1 },
                        new RepartitionEntity { OperationId = 4, UserId = 1, Weight = 1 },
                        new RepartitionEntity { OperationId = 4, UserId = 2, Weight = 2 },
                        new RepartitionEntity { OperationId = 4, UserId = 3, Weight = 3 },
                        new RepartitionEntity { OperationId = 5, UserId = 1, Weight = 2 },
                        new RepartitionEntity { OperationId = 5, UserId = 2, Weight = 1 },
                        new RepartitionEntity { OperationId = 5, UserId = 3, Weight = 1 },
                        new RepartitionEntity { OperationId = 6, UserId = 1, Weight = 1 },
                        new RepartitionEntity { OperationId = 6, UserId = 3, Weight = 1 }
                    );
                }
            );
    }

    public DbSet<UserEntity> Users => Set<UserEntity>();
    public DbSet<TricountEntity> Tricounts=> Set<TricountEntity>();
    public DbSet<ParticipationEntity> Participations => Set<ParticipationEntity>();
    public DbSet<OperationEntity> Operations => Set<OperationEntity>();
    public DbSet<RepartitionEntity> Repartitions => Set<RepartitionEntity>();
}
