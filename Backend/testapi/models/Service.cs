namespace testapi.models
{
    public class Service
    {
        public int ServiceID { get; set; }
        public string ServiceType { get; set; }
        public string Description { get; set; }
        public DateTime CreatedAt { get; set; }

        public bool IsDeleted { get; set; } = false;
        public List<PropertyService> PropertyServices { get; set; }
        public List<VendorService> VendorServices { get; set; } // Add this line
    }

}
