import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:intl/intl.dart';
import '../models/contract.dart';
import '../widgets/contract_form.dart';
import '../screens/login_screen.dart';

class ContractsScreen extends StatefulWidget {
  final String userEmail;
  final String name;

  const ContractsScreen({Key? key, this.userEmail = 'admin@google.com',this.name = "yu"}) : super(key: key);

  @override
  State<ContractsScreen> createState() => _ContractsScreenState();
}

class _ContractsScreenState extends State<ContractsScreen> {
  final List<Contract> _contracts = [];
  List<Map<String, dynamic>> _services = [];
  String _userName = '';
  String _userEmail = '';

  @override
  void initState() {
    super.initState();
    _fetchProperties();
    _fetchServices();
    _loadUserData();
  }

  Future<void> _loadUserData() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _userName = widget.name.isNotEmpty ? widget.name : (prefs.getString('user_name') ?? 'User');
      _userEmail = widget.userEmail.isNotEmpty ? widget.userEmail : (prefs.getString('user_email') ?? 'user@example.com');
    });
  }

  Future<void> _fetchServices() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('auth_token') ?? '';

      final response = await http.get(
        Uri.parse('https://qhrf1184-7226.inc1.devtunnels.ms/api/agent/all-services'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final servicesData = json.decode(response.body);
        if (servicesData is List) {
          setState(() {
            _services = servicesData.map((service) => {
              'id': service['serviceID'] as int,
              'name': service['serviceType'] as String,
              'description': service['description'] as String,
            }).toList();
          });
        }
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error fetching services: $e'), backgroundColor: Colors.red),
      );
    }
  }

  Future<void> _fetchProperties() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('auth_token') ?? '';

      final response = await http.get(
        Uri.parse('https://qhrf1184-7226.inc1.devtunnels.ms/api/agent/properties'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['data'] is List) {
          setState(() {
            _contracts.clear();
            for (var property in data['data']) {
              final services = (property['services'] as List)
                  .map((s) => s['serviceType'] as String)
                  .toList();

              final vendorDetails = (property['vendors'] as List).map((vendor) => {
                'id': vendor['vendorID'] as int,
                'name': vendor['name'] as String,
                'email': vendor['email'] as String,
              }).toList();

              _contracts.add(Contract(
                id: property['propertyID'].toString(),
                name: property['ownName'] ?? '',
                email: property['ownEmail'] ?? '',
                address: property['address'] ?? '',
                city: property['city'] ?? '',
                state: property['state'] ?? '',
                zipCode: property['pincode'] ?? '',
                services: services,
                date: DateFormat('dd/MM/yyyy').format(
                    DateTime.parse(property['createdAt'] ?? DateTime.now().toString())),
                endDate: property['projectEndingDate'] != null
                    ? DateFormat('dd/MM/yyyy').format(DateTime.parse(property['projectEndingDate']))
                    : null,
                vendorIds: vendorDetails.map((v) => v['id'] as int).toList(),
                vendorDetails: vendorDetails,
              ));
            }
          });
        }
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error fetching properties: $e'), backgroundColor: Colors.red),
      );
    }
  }

  void _addContract(Contract contract) {
    setState(() {
      _contracts.add(contract);
    });
    _fetchProperties();
  }

  void _updateContract(Contract oldContract, Contract newContract) {
    setState(() {
      final index = _contracts.indexWhere((c) => c.id == oldContract.id);
      if (index != -1) {
        _contracts[index] = newContract;
      }
    });
    _fetchProperties();
  }

  void _deleteContract(Contract contract) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('auth_token') ?? '';

      // Placeholder for DELETE endpoint (not implemented in backend yet)
      setState(() {
        _contracts.removeWhere((c) => c.id == contract.id);
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Property deleted successfully'), backgroundColor: Colors.green),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error deleting property: $e'), backgroundColor: Colors.red),
      );
    }
  }

  void _logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (context) => const LoginScreen()),
      (route) => false,
    );
  }

  void _confirmDeleteContract(Contract contract) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Delete Order'),
          content: const Text('Are you sure you want to delete this order? This action cannot be undone.'),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
            TextButton(
              onPressed: () {
                Navigator.pop(context);
                _deleteContract(contract);
              },
              style: TextButton.styleFrom(foregroundColor: Colors.red),
              child: const Text('Delete'),
            ),
          ],
        );
      },
    );
  }

  void _showPropertyDetails(Contract contract) {
    showDialog(
      context: context,
      builder: (BuildContext dialogContext) {
        return Dialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          child: Container(
            padding: const EdgeInsets.all(16),
            constraints: BoxConstraints(
              maxHeight: MediaQuery.of(dialogContext).size.height * 0.8,
              maxWidth: MediaQuery.of(dialogContext).size.width * 0.9,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Property Details', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                    IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
                  ],
                ),
                const SizedBox(height: 16),
                Expanded(
                  child: SingleChildScrollView(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildDetailRow('Property ID', contract.id),
                        _buildDetailRow('Owner Name', contract.name),
                        _buildDetailRow('Owner Email', contract.email),
                        _buildDetailRow('Address', contract.address),
                        _buildDetailRow('City', contract.city),
                        _buildDetailRow('State', contract.state),
                        _buildDetailRow('Pincode', contract.zipCode),
                        _buildDetailRow('Created At', contract.date),
                        _buildDetailRow('Project Ending Date', contract.endDate ?? 'Not set'),
                        const SizedBox(height: 16),
                        const Text('Services', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 8),
                        ...contract.services.map((service) => Padding(
                              padding: const EdgeInsets.only(bottom: 4),
                              child: Text('• $service'),
                            )),
                        if (contract.vendorDetails != null && contract.vendorDetails!.isNotEmpty) ...[
                          const SizedBox(height: 16),
                          const Text('Assigned Vendors', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 8),
                          ...contract.vendorDetails!.map((vendor) => Padding(
                                padding: const EdgeInsets.only(bottom: 4),
                                child: Text('• ${vendor['name']} (${vendor['email']})'),
                              )),
                        ],
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    TextButton(
                      onPressed: () => Navigator.pop(context),
                      child: const Text('Close'),
                    ),
                    const SizedBox(width: 16),
                    ElevatedButton(
                      onPressed: () {
                        Navigator.pop(context);
                        _showEditContractDialog(contract);
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF027DFF),
                      ),
                      child: const Text('Edit'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  void _showEditContractDialog(Contract contract) {
    showDialog(
      context: context,
      builder: (context) => ContractForm(
        existingContract: contract,
        onSave: (newContract) => _updateContract(contract, newContract),
        onDelete: _deleteContract,
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    String formattedValue = value;
    if (label == 'Project Ending Date' && value.isNotEmpty && value != 'Not set') {
      try {
        DateTime date = DateFormat("dd/MM/yyyy").parse(value);
        formattedValue = DateFormat('dd/MM/yyyy').format(date);
      } catch (e) {
        print('Failed to format date: $value, Error: $e');
      }
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text('$label:', style: const TextStyle(fontWeight: FontWeight.bold)),
          ),
          Expanded(child: Text(formattedValue)),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: Builder(
          builder: (context) => IconButton(
            icon: const Icon(Icons.menu, color: Color(0xFF027DFF)),
            onPressed: () => Scaffold.of(context).openDrawer(),
          ),
        ),
        title: const Text(
          'Orders',
          style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Color(0xFF027DFF)),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
      ),
      drawer: Drawer(
        child: Column(
          children: [
            UserAccountsDrawerHeader(
              decoration: const BoxDecoration(color: Color(0xFF027DFF)),
              accountName: Text(_userName), // Use the loaded name
              accountEmail: Text(_userEmail), // Use the loaded email
              currentAccountPicture: const CircleAvatar(
                backgroundColor: Colors.white,
                child: Icon(Icons.person, color: Color(0xFF027DFF), size: 40),
              ),
            ),
            const Divider(),
            ListTile(
              leading: const Icon(Icons.logout, color: Color(0xFF027DFF)),
              title: const Text('Logout'),
              onTap: _logout,
            ),
          ],
        ),
      ),
      body: _contracts.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text('No orders yet', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w500)),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () => showDialog(
                      context: context,
                      builder: (context) => ContractForm(onSave: _addContract),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF027DFF),
                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    child: const Text('+   Create New Order', style: TextStyle(color: Colors.white)),
                  ),
                ],
              ),
            )
          : Padding(
              padding: const EdgeInsets.all(16.0),
              child: ListView.builder(
                itemCount: _contracts.length,
                itemBuilder: (context, index) {
                  final contract = _contracts[index];
                  return Card(
                    margin: const EdgeInsets.only(bottom: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                      side: BorderSide(color: const Color(0xFF027DFF).withOpacity(0.3)),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            contract.name,
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            contract.services.join(', '), 
                            style: const TextStyle(color: Colors.grey),
                          ),
                          Text(
                            'Vendors: ${contract.vendorDetails?.map((v) => v['name']).join(', ') ?? ''}',
                            style: const TextStyle(color: Colors.grey),
                          ),
                          const SizedBox(height: 8),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                contract.endDate ?? contract.date, 
                                style: const TextStyle(color: Colors.grey)
                              ),
                              Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  IconButton(
                                    icon: const Icon(Icons.edit, color: Color(0xFF027DFF)),
                                    onPressed: () => showDialog(
                                      context: context,
                                      builder: (context) => ContractForm(
                                        existingContract: contract,
                                        onSave: (newContract) => _updateContract(contract, newContract),
                                        onDelete: _deleteContract,
                                      ),
                                    ),
                                    tooltip: 'Edit Order',
                                    constraints: const BoxConstraints(),
                                    padding: const EdgeInsets.all(8),
                                  ),
                                  IconButton(
                                    icon: const Icon(Icons.visibility, color: Color(0xFF027DFF)),
                                    onPressed: () => _showPropertyDetails(contract),
                                    tooltip: 'View Order',
                                    constraints: const BoxConstraints(),
                                    padding: const EdgeInsets.all(8),
                                  ),
                                  IconButton(
                                    icon: const Icon(Icons.delete, color: Colors.red),
                                    onPressed: () => _confirmDeleteContract(contract),
                                    tooltip: 'Delete Order',
                                    constraints: const BoxConstraints(),
                                    padding: const EdgeInsets.all(8),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
      floatingActionButton: _contracts.isNotEmpty
          ? FloatingActionButton(
              onPressed: () => showDialog(
                context: context,
                builder: (context) => ContractForm(onSave: _addContract),
              ),
              backgroundColor: const Color(0xFF027DFF),
              child: const Icon(Icons.add),
            )
          : null,
    );
  }
}