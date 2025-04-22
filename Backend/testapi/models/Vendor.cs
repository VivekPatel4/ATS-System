using System.ComponentModel.DataAnnotations;

namespace testapi.models
{
    public class Vendor
    {
      
        [Key]
        public int VendorID { get; set; }
        [Required]
        public string Name { get; set; }
        [Required, EmailAddress]
        public string Email { get; set; }
        [Required]
        public string PasswordHash { get; set; }

        //public string ServiceType { get; set; }
        public bool IsDeleted { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public List<VendorService> VendorServices { get; set; } = new List<VendorService>();
        public List<PropertyService> PropertyServices { get; set; } = new List<PropertyService>();
    }
}
