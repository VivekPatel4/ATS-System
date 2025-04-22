using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace testapi.models
{
    public class PropertyService
    {
        public int PropertyID { get; set; }

        public int VendorID { get; set; }

        public int ServiceID { get; set; }

        public int AssignedByAgentID { get; set; }

        public DateTime AssignedAt { get; set; }

        [ForeignKey("PropertyID")]
        public Property Property { get; set; }

        [ForeignKey("VendorID")]
        public Vendor Vendor { get; set; }

        [ForeignKey("ServiceID")]
        public Service Service { get; set; }

        [ForeignKey("AssignedByAgentID")]
        public Agent Agent { get; set; }
    }
}