using System.ComponentModel.DataAnnotations;

namespace testapi.models
{
    public class Admin
    {
        [Key]
        public int AdminID { get; set; }
        [Required]
        public string Name { get; set; }
        [Required, EmailAddress]
        public string Email { get; set; }
        [Required]
        public string PasswordHash { get; set; }

        public bool IsDeleted { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}
