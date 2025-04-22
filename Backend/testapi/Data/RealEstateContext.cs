using Microsoft.EntityFrameworkCore;
using testapi.models;

namespace testapi.Data
{
    public class Testapi : DbContext
    {
        public Testapi(DbContextOptions<Testapi> options) : base(options)
        {
        }

        public DbSet<Admin> Admins { get; set; }
        public DbSet<Agent> Agents { get; set; }
        public DbSet<Vendor> Vendors { get; set; }
        public DbSet<Property> Properties { get; set; }
        public DbSet<Service> Services { get; set; }
        public DbSet<PropertyService> PropertyServices { get; set; }
        public DbSet<VendorService> VendorServices { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // VendorService configuration - Keep this as is
            //modelBuilder.Entity<VendorService>()
            //    .HasKey(vs => new { vs.VendorID, vs.ServiceID });
            //modelBuilder.Entity<VendorService>()
            //    .HasOne(vs => vs.Vendor)
            //    .WithMany(v => v.VendorServices)
            //    .HasForeignKey(vs => vs.VendorID)
            //    .OnDelete(DeleteBehavior.Cascade);
            //modelBuilder.Entity<VendorService>()
            //    .HasOne(vs => vs.Service)
            //    .WithMany(s => s.VendorServices)
            //    .HasForeignKey(vs => vs.ServiceID)
            //    .OnDelete(DeleteBehavior.Cascade);

            // PropertyService configuration - Modified to use PropertyServiceID as the primary key
            //modelBuilder.Entity<PropertyService>(entity =>
            //{
            //    entity.HasKey(ps => new { ps.PropertyID, ps.ServiceID, ps.VendorID });
            //    entity.HasOne(ps => ps.Property)
            //          .WithMany(p => p.PropertyServices)
            //          .HasForeignKey(ps => ps.PropertyID)
            //          .OnDelete(DeleteBehavior.Cascade);
            //    entity.HasOne(ps => ps.Service)
            //          .WithMany()
            //          .HasForeignKey(ps => ps.ServiceID)
            //          .OnDelete(DeleteBehavior.NoAction);
            //    entity.HasOne(ps => ps.Vendor)
            //          .WithMany()
            //          .HasForeignKey(ps => ps.VendorID)
            //          .OnDelete(DeleteBehavior.NoAction);
            //    entity.HasOne(ps => ps.Agent)
            //          .WithMany()
            //          .HasForeignKey(ps => ps.AssignedByAgentID)
            //          .OnDelete(DeleteBehavior.NoAction);
            //});
            modelBuilder.Entity<PropertyService>()
                .HasKey(ps => new { ps.PropertyID, ps.ServiceID, ps.VendorID });
            modelBuilder.Entity<VendorService>()
                .HasKey(vs => new { vs.VendorID, vs.ServiceID });
        }
    }
}