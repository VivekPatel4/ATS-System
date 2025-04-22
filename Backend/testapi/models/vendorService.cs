using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace testapi.models
{
    public class VendorService
    {
        [Key]
        public int VendorID { get; set; }

       
        public Vendor Vendor { get; set; }
        [Key]
        public int ServiceID { get; set; }
       
        public Service Service { get; set; }
    }
}
