class Contract {
  final String id;
  final String name;
  final String email;
  final List<String> services;
  final String date;
  final String? endDate;
  final String address;
  final String city;
  final String state;
  final String zipCode;
  final List<int> vendorIds;
  final List<Map<String, dynamic>>? vendorDetails;

  Contract({
    required this.id,
    required this.name,
    required this.email,
    required this.services,
    required this.date,
    this.endDate,
    required this.address,
    required this.city,
    required this.state,
    required this.zipCode,
    required this.vendorIds,
    this.vendorDetails,
  });
}