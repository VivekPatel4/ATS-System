using System.ComponentModel.DataAnnotations;

namespace testapi.models
{
    public class Property
    {
        [Key]
        public int PropertyID { get; set; }
        [Required]
        public int AgentID { get; set; }
        [Required]
        public string Address { get; set; }
        [Required]
        public string City { get; set; }
        [Required]
        public string State { get; set; }
        [Required]
        public string Pincode { get; set; }
        [Required]
        public string OwnName { get; set; }
        [Required, EmailAddress]
        public string OwnEmail { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public Agent Agent { get; set; }

        public DateTime? ProjectEndingDate { get; set; }

        public string Status { get; set; } = "New";
        public List<PropertyService> PropertyServices { get; set; } = new List<PropertyService>();
    }
}
