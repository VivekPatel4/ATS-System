import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/contract.dart';
import 'package:intl/intl.dart';

class ContractForm extends StatefulWidget {
  final Function(Contract) onSave;
  final Contract? existingContract;
  final Function(Contract)? onDelete;

  const ContractForm({
    Key? key,
    required this.onSave,
    this.existingContract,
    this.onDelete,
  }) : super(key: key);

  @override
  State<ContractForm> createState() => _ContractFormState();
}

class _ContractFormState extends State<ContractForm> {
  final _formKey = GlobalKey<FormState>();
  int _currentStep = 0;
  DateTime? _endDate;
  late TextEditingController _endDateController;

  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _addressController = TextEditingController();
  final TextEditingController _cityController = TextEditingController();
  final TextEditingController _stateController = TextEditingController();
  final TextEditingController _zipController = TextEditingController();

  List<Map<String, dynamic>> _services = [];
  List<Map<String, dynamic>> _vendors = [];
  List<Map<String, dynamic>> _availableVendors = [];
  final Map<String, bool> _selectedServices = {};
  final Map<int, int> _selectedVendors = {};

  @override
  void initState() {
    super.initState();
    _endDateController = TextEditingController();
    _fetchServicesAndVendors();
    _initializeForm();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _addressController.dispose();
    _cityController.dispose();
    _stateController.dispose();
    _zipController.dispose();
    _endDateController.dispose();
    super.dispose();
  }

  Future<void> _fetchServicesAndVendors() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('auth_token') ?? '';

      // Fetch services
      final servicesResponse = await http.get(
        Uri.parse('https://qhrf1184-7226.inc1.devtunnels.ms/api/agent/services'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (servicesResponse.statusCode == 200) {
        final servicesData = json.decode(servicesResponse.body);
        if (servicesData is List) {
          setState(() {
            _services = servicesData.map((service) => {
              'id': service['serviceID'] as int,
              'name': service['serviceType'] as String,
              'description': service['description'] as String,
            }).toList();

            // Initialize all services as unselected initially
            for (var service in _services) {
              _selectedServices[service['name']] = false;
            }

            // If editing, pre-select existing services and map vendors
            if (widget.existingContract != null) {
              for (var service in _services) {
                final serviceName = service['name'].toString().toLowerCase();
                final serviceIndex = widget.existingContract!.services
                    .indexWhere((s) => s.toLowerCase() == serviceName);
                
                if (serviceIndex != -1) {
                  _selectedServices[service['name']] = true;
                  
                  // Map vendor to service
                  if (widget.existingContract!.vendorDetails != null &&
                      serviceIndex < widget.existingContract!.vendorDetails!.length) {
                    _selectedVendors[service['id']] = 
                        widget.existingContract!.vendorDetails![serviceIndex]['id'];
                  }
                }
              }
            }
          });
        }
      }

      // Fetch vendors
      final vendorsResponse = await http.get(
        Uri.parse('https://qhrf1184-7226.inc1.devtunnels.ms/api/agent/available-services'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (vendorsResponse.statusCode == 200) {
        final vendorsData = json.decode(vendorsResponse.body);
        if (vendorsData is List) {
          setState(() {
            _vendors = vendorsData.map((vendor) => {
              'id': vendor['vendorID'] as int,
              'name': vendor['vendorName'] as String,
              'email': vendor['email'] ?? '',
              'services': (vendor['services'] as List).map((s) => s['serviceID'] as int).toList(),
            }).toList();
          });
        }
      }

      // If editing, fetch available vendors for pre-selected services
      if (widget.existingContract != null) {
        await _fetchAvailableVendors();
      }
    } catch (e) {
      print('Error in _fetchServicesAndVendors: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error fetching data: $e'), backgroundColor: Colors.red),
      );
    }
  }

  Future<void> _fetchAvailableVendors() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('auth_token') ?? '';

      final selectedServiceIds = _services
          .where((s) => _selectedServices[s['name']] == true)
          .map((s) => s['id'] as int)
          .toList();

      if (selectedServiceIds.isEmpty) {
        setState(() {
          _availableVendors = [];
        });
        return;
      }

      final response = await http.post(
        Uri.parse('https://qhrf1184-7226.inc1.devtunnels.ms/api/agent/vendors-by-services'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode({'serviceIds': selectedServiceIds}),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data is List) {
          setState(() {
            _availableVendors = data.map((vendor) {
              int vendorId = vendor['vendorID'] as int;
              return {
                'id': vendorId,
                'name': vendor['name'] as String,
                'email': vendor['email'] as String,
                'services': (vendor['services'] as List)
                    .map((s) => s['serviceID'] as int)
                    .toList(),
                'selected': _selectedVendors.containsValue(vendorId),
              };
            }).toList();

            // Update available vendors with existing contract data
            if (widget.existingContract?.vendorDetails != null) {
              for (var vendorDetail in widget.existingContract!.vendorDetails!) {
                final index = _availableVendors.indexWhere((v) => v['id'] == vendorDetail['id']);
                if (index != -1) {
                  _availableVendors[index]['selected'] = true;
                }
              }
            }
          });
        }
      }
    } catch (e) {
      print('Error in _fetchAvailableVendors: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error fetching vendors: $e'), backgroundColor: Colors.red),
      );
    }
  }

  void _initializeForm() {
    if (widget.existingContract != null) {
      final contract = widget.existingContract!;
      _nameController.text = contract.name;
      _emailController.text = contract.email;
      _addressController.text = contract.address;
      _cityController.text = contract.city;
      _stateController.text = contract.state;
      _zipController.text = contract.zipCode;

      // Initialize selected services and vendors
      for (var service in contract.services) {
        _selectedServices[service] = true;
      }

      // Map vendors to their respective services
      if (contract.vendorDetails != null && contract.vendorDetails!.isNotEmpty) {
        for (var i = 0; i < contract.services.length; i++) {
          if (i < contract.vendorDetails!.length) {
            final serviceId = _services.firstWhere(
              (s) => s['name'].toString().toLowerCase() == contract.services[i].toLowerCase(),
              orElse: () => {'id': -1},
            )['id'];
            
            if (serviceId != -1) {
              _selectedVendors[serviceId] = contract.vendorDetails![i]['id'];
            }
          }
        }
      }

      if (contract.endDate != null && contract.endDate!.isNotEmpty) {
        try {
          _endDate = DateFormat('dd/MM/yyyy').parse(contract.endDate!);
          _endDateController.text = contract.endDate!;
        } catch (e) {
          _endDateController.text = contract.endDate!;
        }
      }
    }
  }

  Future<void> _submitForm() async {
    if (_formKey.currentState!.validate()) {
      final selectedServices = _services
          .where((s) => _selectedServices[s['name']] == true)
          .map((s) => s['name'] as String)
          .toList();

      if (selectedServices.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Please select at least one service'), backgroundColor: Colors.red),
        );
        return;
      }

      final selectedServiceIds = _services
          .where((s) => _selectedServices[s['name']] == true)
          .map((s) => s['id'] as int)
          .toList();

      final selectedVendorIds = _selectedVendors.values.toList();

      if (selectedVendorIds.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Please select at least one vendor'), backgroundColor: Colors.red),
        );
        return;
      }

      final contract = Contract(
        id: widget.existingContract?.id ?? DateTime.now().millisecondsSinceEpoch.toString(),
        name: _nameController.text,
        email: _emailController.text,
        services: selectedServices,
        date: DateFormat('dd/MM/yyyy').format(DateTime.now()),
        endDate: _endDate != null ? DateFormat('dd/MM/yyyy').format(_endDate!) : null,
        address: _addressController.text,
        city: _cityController.text,
        state: _stateController.text,
        zipCode: _zipController.text,
        vendorIds: selectedVendorIds,
        vendorDetails: _availableVendors
            .where((v) => v['selected'] == true)
            .map((v) => {'id': v['id'], 'name': v['name'], 'email': v['email']})
            .toList(),
      );

      try {
        final prefs = await SharedPreferences.getInstance();
        final token = prefs.getString('auth_token') ?? '';

        final Map<String, dynamic> requestBody = {
          'ownName': contract.name,
          'ownEmail': contract.email,
          'address': contract.address,
          'city': contract.city,
          'state': contract.state,
          'pincode': contract.zipCode,
          'serviceIds': selectedServiceIds,
          'vendorIds': selectedVendorIds,
          'projectEndingDate': _endDate?.toUtc().toIso8601String(),
        };

        final uri = widget.existingContract == null
            ? Uri.parse('https://qhrf1184-7226.inc1.devtunnels.ms/api/agent/add-property')
            : Uri.parse('https://qhrf1184-7226.inc1.devtunnels.ms/api/agent/edit-property/${contract.id}');

        final method = widget.existingContract == null ? http.post : http.put;

        final response = await method(
          uri,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer $token',
          },
          body: json.encode(requestBody),
        );

        if (response.statusCode == 200 || response.statusCode == 201) {
          widget.onSave(contract);
          Navigator.pop(context);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(widget.existingContract == null
                  ? 'Property created successfully'
                  : 'Property updated successfully'),
              backgroundColor: Colors.green,
            ),
          );
        } else {
          throw Exception('Failed to save property: ${response.body}');
        }
      } catch (e) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error saving property: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  void _showDeleteConfirmation() {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Delete Order'),
          content: const Text('Are you sure you want to delete this order? This action cannot be undone.'),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            TextButton(
              onPressed: () {
                Navigator.pop(context);
                if (widget.onDelete != null && widget.existingContract != null) {
                  widget.onDelete!(widget.existingContract!);
                  Navigator.pop(context);
                }
              },
              style: TextButton.styleFrom(foregroundColor: Colors.red),
              child: const Text('Delete'),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Container(
        width: MediaQuery.of(context).size.width * 0.9,
        height: MediaQuery.of(context).size.height * 0.8,
        padding: const EdgeInsets.all(16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                  widget.existingContract == null ? 'Add Property' : 'Edit Property',
                      style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                          ),
                        IconButton(
                          icon: const Icon(Icons.close),
                          onPressed: () => Navigator.pop(context),
                        ),
                      ],
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.grey.withOpacity(0.1),
                    spreadRadius: 1,
                    blurRadius: 4,
                    offset: const Offset(0, 2),
                    ),
                  ],
                ),
              child: Row(
                  children: [
                    Expanded(
                    child: InkWell(
                      onTap: () => setState(() => _currentStep = 0),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        decoration: BoxDecoration(
                          color: _currentStep == 0 ? const Color(0xFF027DFF) : Colors.transparent,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Center(
                          child: Text(
                            'Property Details',
                            style: TextStyle(
                              color: _currentStep == 0 ? Colors.white : Colors.black87,
                              fontWeight: FontWeight.w500,
                            ),
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                    child: InkWell(
                      onTap: () {
                        if (_formKey.currentState!.validate()) {
                          setState(() => _currentStep = 1);
                        }
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        decoration: BoxDecoration(
                          color: _currentStep == 1 ? const Color(0xFF027DFF) : Colors.transparent,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Center(
                          child: Text(
                            'Property Services',
                            style: TextStyle(
                              color: _currentStep == 1 ? Colors.white : Colors.black87,
                              fontWeight: FontWeight.w500,
                            ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
            ),
            const SizedBox(height: 16),
            Expanded(
              child: SingleChildScrollView(
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                if (_currentStep == 0) ...[
                        const Text('Property Details',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 16),
                  TextFormField(
                    controller: _nameController,
                    decoration: InputDecoration(
                            labelText: 'Owner Name',
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8),
                    ),
                          ),
                          validator: (value) => value?.isEmpty ?? true ? 'Please enter owner name' : null,
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _emailController,
                    decoration: InputDecoration(
                            labelText: 'Owner Email',
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                          validator: (value) => value?.isEmpty ?? true ? 'Please enter owner email' : null,
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _addressController,
                    decoration: InputDecoration(
                            labelText: 'Address',
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8),
                    ),
                          ),
                          validator: (value) => value?.isEmpty ?? true ? 'Please enter address' : null,
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                              child: TextFormField(
                              controller: _cityController,
                              decoration: InputDecoration(
                                  labelText: 'City',
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(8),
                              ),
                            ),
                                validator: (value) => value?.isEmpty ?? true ? 'Please enter city' : null,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                              child: TextFormField(
                              controller: _stateController,
                              decoration: InputDecoration(
                                  labelText: 'State',
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(8),
                              ),
                            ),
                                validator: (value) => value?.isEmpty ?? true ? 'Please enter state' : null,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _zipController,
                    decoration: InputDecoration(
                            labelText: 'ZIP Code',
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8),
                    ),
                          ),
                          validator: (value) => value?.isEmpty ?? true ? 'Please enter ZIP code' : null,
                  ),
                  const SizedBox(height: 24),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.end,
                          children: [
                            ElevatedButton(
                      onPressed: () {
                        if (_formKey.currentState!.validate()) {
                                  setState(() => _currentStep = 1);
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF027DFF),
                        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                              child: const Text('Continue'),
                            ),
                          ],
                  ),
                ],
                if (_currentStep == 1) ...[
                        const Text('Property Services',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 16),
                        // Selected Services Section
                        if (_selectedServices.values.contains(true)) ...[
                          const Text('Selected Services',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w500,
                              color: Colors.grey,
                            ),
                          ),
                          const SizedBox(height: 12),
                          Wrap(
                            spacing: 12,
                            runSpacing: 12,
                            children: _services.where((service) => 
                              _selectedServices[service['name']] == true
                            ).map((service) {
                              return InkWell(
                                onTap: () async {
                                  await _fetchAvailableVendors();
                                  if (mounted) {
                                    _showServiceDetails(service).then((selectedVendor) {
                                      if (selectedVendor == null) {
                                        // Don't unselect the service if vendor selection is cancelled
                                        return;
                                      }
                                    });
                                  }
                                },
                                child: Container(
                                  width: MediaQuery.of(context).size.width * 0.4,
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF027DFF).withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(
                                      color: const Color(0xFF027DFF),
                                      width: 2,
                                    ),
                                  ),
                                  padding: const EdgeInsets.all(16),
                                  child: Column(
                                    mainAxisSize: MainAxisSize.min,
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        children: [
                                          const Icon(
                                            Icons.check_circle,
                                            color: Color(0xFF027DFF),
                                            size: 20,
                                          ),
                                          const SizedBox(width: 8),
                                          Expanded(
                                            child: Text(
                                              service['name'].toString().toLowerCase(),
                                              style: const TextStyle(
                                                fontSize: 14,
                                                color: Color(0xFF027DFF),
                                                fontWeight: FontWeight.w500,
                                              ),
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                          ),
                                          const Icon(
                                            Icons.edit,
                                            color: Color(0xFF027DFF),
                                            size: 16,
                                          ),
                                        ],
                                      ),
                                      if (_selectedVendors.containsKey(service['id'])) ...[
                                        const SizedBox(height: 8),
                                        Row(
                                          children: [
                                            const Icon(Icons.person_outline, size: 14, color: Colors.grey),
                                            const SizedBox(width: 4),
                                            Expanded(
                                              child: Text(
                                                _availableVendors
                                                    .firstWhere((v) => v['id'] == _selectedVendors[service['id']])['name'],
                                                style: TextStyle(
                                                  fontSize: 12,
                                                  color: Colors.grey.shade600,
                                                ),
                                                overflow: TextOverflow.ellipsis,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ],
                                  ),
                                ),
                              );
                            }).toList(),
                          ),
                          const SizedBox(height: 24),
                          const Text('Available Services',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w500,
                              color: Colors.grey,
                            ),
                          ),
                          const SizedBox(height: 12),
                        ],
                        Container(
                          width: double.infinity,
                          child: SingleChildScrollView(
                            child: Wrap(
                              spacing: 12,
                              runSpacing: 12,
                              children: List.generate(
                                (_services.where((service) => 
                                  _selectedServices[service['name']] != true
                                ).length / 2).ceil(),
                                (rowIndex) {
                                  final availableServices = _services.where((service) => 
                                    _selectedServices[service['name']] != true
                                  ).toList();
                                  final startIndex = rowIndex * 2;
                                  return Row(
                                    children: [
                                      for (var i = startIndex; i < startIndex + 2 && i < availableServices.length; i++)
                                        Expanded(
                                          child: Container(
                                            margin: EdgeInsets.only(
                                              right: i % 2 == 0 ? 6 : 0,
                                              left: i % 2 == 1 ? 6 : 0,
                        ),
                        child: InkWell(
                          onTap: () async {
                            setState(() {
                                                  _selectedServices[availableServices[i]['name']] = true;
                            });
                            
                              await _fetchAvailableVendors();
                              if (mounted) {
                                                  _showServiceDetails(availableServices[i]).then((selectedVendor) {
                                  if (selectedVendor == null) {
                                    setState(() {
                                                        _selectedServices[availableServices[i]['name']] = false;
                                    });
                                  }
                                });
                                                }
                                              },
                                              child: Container(
                                                decoration: BoxDecoration(
                                                  color: Colors.white,
                                                  borderRadius: BorderRadius.circular(12),
                                                  border: Border.all(
                                                    color: Colors.grey.shade200,
                                                    width: 1,
                                                  ),
                                                ),
                                                padding: const EdgeInsets.all(16),
                                                child: Row(
                              children: [
                                                    Icon(
                                                      Icons.circle_outlined,
                                                      color: Colors.grey.shade400,
                                                      size: 20,
                                                    ),
                                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Text(
                                                        availableServices[i]['name'].toString().toLowerCase(),
                                        style: TextStyle(
                                                          fontSize: 14,
                                                          color: Colors.black87,
                                          fontWeight: FontWeight.w500,
                                        ),
                                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                  ],
                                ),
                                              ),
                                            ),
                                          ),
                                        ),
                                      if (startIndex + 1 >= availableServices.length)
                                        Expanded(child: Container()),
                                    ],
                                  );
                                },
                            ),
                          ),
                        ),
                  ),
                        const SizedBox(height: 24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      TextButton(
                        onPressed: () => setState(() => _currentStep = 0),
                        child: const Text('Back'),
                      ),
                      ElevatedButton(
                        onPressed: _submitForm,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF027DFF),
                          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(8),
                        ),
                              ),
                              child: Text(widget.existingContract == null ? 'Create' : 'Update'),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<int?> _showServiceDetails(Map<String, dynamic> service) async {
    await _fetchAvailableVendors();
    
    final serviceVendors = _availableVendors
        .where((vendor) => (vendor['services'] as List<int>).contains(service['id']))
        .toList();

    if (serviceVendors.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('No vendors available for this service'),
          backgroundColor: Colors.red,
        ),
      );
      return null;
    }

    return showDialog<int?>(
      context: context,
      builder: (BuildContext context) {
        return Dialog(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            child: Container(
            padding: const EdgeInsets.all(20),
              constraints: BoxConstraints(
                maxHeight: MediaQuery.of(context).size.height * 0.7,
              maxWidth: MediaQuery.of(context).size.width * 0.9,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Select Vendor',
                          style: const TextStyle(
                              fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                          const SizedBox(height: 4),
                  Text(
                            'For ${service['name']} Service',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey[600],
                    ),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                  ),
                  const SizedBox(height: 16),
                const Divider(),
                const SizedBox(height: 16),
                Expanded(
                  child: ListView.builder(
                    itemCount: serviceVendors.length,
                    itemBuilder: (context, index) {
                      final vendor = serviceVendors[index];
                      final isSelected = _selectedVendors[service['id']] == vendor['id'];
                          return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                            decoration: BoxDecoration(
                          border: Border.all(
                            color: isSelected ? const Color(0xFF027DFF) : Colors.grey.shade200,
                            width: isSelected ? 2 : 1,
                          ),
                          borderRadius: BorderRadius.circular(12),
                          color: isSelected ? const Color(0xFF027DFF).withOpacity(0.1) : Colors.white,
                        ),
                        child: InkWell(
                          onTap: () {
                                setState(() {
                              _selectedVendors[service['id']] = vendor['id'];
                            });
                            Navigator.pop(context, vendor['id']);
                          },
                          borderRadius: BorderRadius.circular(12),
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Row(
                              children: [
                                Container(
                                  width: 40,
                                  height: 40,
                                  decoration: BoxDecoration(
                                    color: isSelected ? const Color(0xFF027DFF) : Colors.grey.shade100,
                                    shape: BoxShape.circle,
                                  ),
                                  child: Icon(
                                    Icons.person,
                                    color: isSelected ? Colors.white : Colors.grey,
                                  ),
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                        vendor['name'],
                                    style: TextStyle(
                                          fontSize: 16,
                                          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                                          color: isSelected ? const Color(0xFF027DFF) : Colors.black87,
                                    ),
                                  ),
                                      const SizedBox(height: 4),
                                  Text(
                                        vendor['email'],
                                    style: TextStyle(
                                          fontSize: 14,
                                      color: Colors.grey[600],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                                Icon(
                                  isSelected ? Icons.check_circle : Icons.circle_outlined,
                                  color: isSelected ? const Color(0xFF027DFF) : Colors.grey,
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}