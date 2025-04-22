using System.ComponentModel.DataAnnotations;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using MailKit.Net.Smtp;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using MimeKit;
using testapi.Data;
using testapi.models;

namespace testapi.Controllers
{
    [Route("api/agent")]
    [ApiController]
    public class AgentController : ControllerBase
    {
        private readonly Testapi _context;
        private readonly IConfiguration _config;

        public AgentController(Testapi context, IConfiguration config)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _config = config ?? throw new ArgumentNullException(nameof(config));
        }

        // Login endpoint - No changes needed, works as expected
        [AllowAnonymous]
        [HttpPost("login")]
        public IActionResult AgentLogin([FromBody] LoginRequest request)
        {
            if (request == null || string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password))
            {
                return BadRequest(new { message = "Email and password are required." });
            }

            var agent = _context.Agents.FirstOrDefault(a => a.Email == request.Email);
            if (agent == null || !BCrypt.Net.BCrypt.Verify(request.Password, agent.PasswordHash))
            {
                return Unauthorized(new { message = "Invalid credentials" });
            }

            var claims = new[]
            {
                new Claim(ClaimTypes.Email, agent.Email),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(ClaimTypes.Role, "Agent")
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(60),
                signingCredentials: creds
            );

            var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

            return Ok(new
            {
                name=agent.Name,
                Token = tokenString,
                Email = agent.Email,
                Role = "Agent",
                ExpireIn = DateTime.UtcNow.AddMinutes(60)
            });
        }

        [HttpGet("services")]
        [Authorize(Roles = "Agent")]
        public async Task<IActionResult> GetServices()
        {
            var services = await _context.Services
                .Select(s => new { s.ServiceID, s.ServiceType, s.Description })
                .ToListAsync();
            return Ok(services);
        }

        //[HttpPost("vendors-by-services")]
        //[Authorize(Roles = "Agent")]
        //public async Task<IActionResult> GetVendorsByServices([FromBody] ServiceSelectionRequest request)
        //{
        //    var vendors = await _context.VendorServices
        //        .Where(vs => request.ServiceIds.Contains(vs.ServiceID)&&!vs.Vendor.IsDeleted)
        //        .Select(vs => new { vs.VendorID, vs.Vendor.Name, vs.Vendor.Email, vs.ServiceID, vs.Service.ServiceType })
        //        .Distinct()
        //        .ToListAsync();
        //    return Ok(vendors);
        //}

        [HttpPost("vendors-by-services")]
        [Authorize(Roles = "Agent")]
        public async Task<IActionResult> GetVendorsByServices([FromBody] ServiceSelectionRequest request)
        {
            var vendors = await _context.Vendors
                .Where(v => !v.IsDeleted)
                .Select(v => new
                {
                    vendorID = v.VendorID,
                    name = v.Name,
                    email = v.Email,
                    services = v.VendorServices
                        .Where(vs => request.ServiceIds.Contains(vs.ServiceID))
                        .Select(vs => new { serviceID = vs.ServiceID })
                        .ToList()
                })
                .Where(v => v.services.Any()) // Only include vendors that have matching services
                .ToListAsync();

            return Ok(vendors);
        }



        // Assuming this is your request model
        public class ServiceSelectionRequest
        {
            public List<int> ServiceIds { get; set; }
        }

        // Add Property endpoint - Fixed to avoid invalid column issue
        [HttpPost("add-property")]
        [Authorize(Roles = "Agent")]
        public async Task<IActionResult> AddProperty([FromBody] AddPropertyRequest request)
        {
            var agentEmail = User.FindFirst(ClaimTypes.Email)?.Value;
            var agent = await _context.Agents.FirstOrDefaultAsync(a => a.Email == agentEmail);
            if (agent == null)
            {
                return Unauthorized(new { message = "Unauthorized Agent" });
            }

            // Validate required fields
            if (string.IsNullOrEmpty(request.OwnName) || string.IsNullOrEmpty(request.OwnEmail) ||
                string.IsNullOrEmpty(request.Address) || string.IsNullOrEmpty(request.City) ||
                string.IsNullOrEmpty(request.State) || string.IsNullOrEmpty(request.Pincode) ||
                request.ServiceIds == null || !request.ServiceIds.Any() ||
                request.VendorIds == null || !request.VendorIds.Any())
            {
                return BadRequest(new { message = "All fields are required." });
            }

            // Validate email format
            if (!new EmailAddressAttribute().IsValid(request.OwnEmail))
            {
                return BadRequest(new { message = "Invalid email format" });
            }

            // Validate pincode format
            if (!System.Text.RegularExpressions.Regex.IsMatch(request.Pincode, @"^\d{5,6}$"))
            {
                return BadRequest(new { message = "Pincode must be 5 or 6 digits" });
            }

            // Validate project ending date
            if (request.ProjectEndingDate.HasValue && request.ProjectEndingDate < DateTime.UtcNow.Date)
            {
                return BadRequest(new { message = "Project ending date cannot be in the past" });
            }

            // Validate service IDs
            var invalidServiceIds = request.ServiceIds
                .Where(id => !_context.Services.Any(s => s.ServiceID == id))
                .ToList();
            if (invalidServiceIds.Any())
            {
                return BadRequest(new { message = $"Invalid Service IDs: {string.Join(", ", invalidServiceIds)}" });
            }

            // Validate vendor IDs
            var invalidVendorIds = request.VendorIds
                .Where(id => !_context.Vendors.Any(v => v.VendorID == id))
                .ToList();
            if (invalidVendorIds.Any())
            {
                return BadRequest(new { message = $"Invalid Vendor IDs: {string.Join(", ", invalidVendorIds)}" });
            }

            // Get all valid vendor-service combinations
            var validVendorServices = await _context.VendorServices
                .Where(vs => request.VendorIds.Contains(vs.VendorID) &&
                            request.ServiceIds.Contains(vs.ServiceID))
                .Select(vs => new { vs.VendorID, vs.ServiceID })
                .ToListAsync();

            // Check if all requested services are covered by at least one vendor
            var uncoveredServices = request.ServiceIds
                .Except(validVendorServices.Select(vs => vs.ServiceID).Distinct())
                .ToList();
            if (uncoveredServices.Any())
            {
                return BadRequest(new
                {
                    message = $"No vendors offer the following services: {string.Join(", ", uncoveredServices)}"
                });
            }

            // Check if all vendors offer at least one requested service
            var vendorsWithNoServices = request.VendorIds
                .Except(validVendorServices.Select(vs => vs.VendorID).Distinct())
                .ToList();
            if (vendorsWithNoServices.Any())
            {
                return BadRequest(new
                {
                    message = $"Vendors {string.Join(", ", vendorsWithNoServices)} don't offer any of the requested services."
                });
            }

            var property = new Property
            {
                AgentID = agent.AgentID,
                Address = request.Address,
                City = request.City,
                State = request.State,
                Pincode = request.Pincode,
                OwnName = request.OwnName,
                OwnEmail = request.OwnEmail,
                ProjectEndingDate = request.ProjectEndingDate,
                CreatedAt = DateTime.UtcNow
            };

            try
            {
                using var transaction = await _context.Database.BeginTransactionAsync();

                _context.Properties.Add(property);
                await _context.SaveChangesAsync();

                // Assign services to vendors (only valid combinations)
                foreach (var vs in validVendorServices)
                {
                    _context.PropertyServices.Add(new PropertyService
                    {
                        PropertyID = property.PropertyID,
                        ServiceID = vs.ServiceID,
                        VendorID = vs.VendorID,
                        AssignedByAgentID = agent.AgentID,
                        AssignedAt = DateTime.UtcNow
                    });
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                // Send notifications to vendors about their assigned services
                var serviceTypes = await _context.Services
                    .Where(s => request.ServiceIds.Contains(s.ServiceID))
                    .ToDictionaryAsync(s => s.ServiceID, s => s.ServiceType);

                foreach (var vendorId in request.VendorIds.Distinct())
                {
                    var vendor = await _context.Vendors.FindAsync(vendorId);
                    var vendorServices = validVendorServices
                        .Where(vs => vs.VendorID == vendorId)
                        .Select(vs => serviceTypes[vs.ServiceID])
                        .Distinct()
                        .ToList();

                    if (vendorServices.Any())
                    {
                        await SendVendorNotification(vendor.Email, agent.Name, property.Address, vendorServices);
                    }
                }

                // Prepare response with assigned services information
                var assignedServicesResponse = validVendorServices
                    .GroupBy(vs => vs.VendorID)
                    .ToDictionary(
                        g => g.Key,
                        g => g.Select(vs => new
                        {
                            ServiceID = vs.ServiceID,
                            ServiceType = serviceTypes[vs.ServiceID]
                        }).ToList()
                    );

                return Ok(new
                {
                    Message = "Property added successfully",
                    PropertyID = property.PropertyID,
                    SelectedServices = request.ServiceIds,
                    SelectedVendors = request.VendorIds,
                    ProjectEndingDate = property.ProjectEndingDate?.ToString("dd/MM/yyyy"),
                    AssignedServices = assignedServicesResponse
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Failed to add property",
                    error = ex.InnerException?.Message ?? ex.Message
                });
            }
        }








        // Get available services grouped by vendor - Fixed join issue
        [HttpGet("available-services")]
        [Authorize(Roles = "Agent")]
        public async Task<IActionResult> GetAvailableServices()
        {
            var services = await _context.VendorServices
                .Include(vs => vs.Vendor)
                .Include(vs => vs.Service)
                .GroupBy(vs => new { vs.Vendor.VendorID, vs.Vendor.Name })
                .Select(group => new
                {
                    VendorID = group.Key.VendorID,
                    VendorName = group.Key.Name,
                    Services = group.Select(vs => new
                    {
                        vs.Service.ServiceID,
                        vs.Service.ServiceType
                    }).Distinct().ToList()
                })
                .ToListAsync();

            return Ok(services);
        }

        [HttpGet("properties")]
        [Authorize(Roles = "Agent")]
        public async Task<IActionResult> GetProperties()
        {
            var agentEmail = User.FindFirst(ClaimTypes.Email)?.Value;
            var agent = await _context.Agents.FirstOrDefaultAsync(a => a.Email == agentEmail);
            if (agent == null)
            {
                return Unauthorized(new { message = "Unauthorized Agent" });
            }

            try
            {
                var properties = await _context.Properties
                    .Where(p => p.AgentID == agent.AgentID)
                    .Include(p => p.PropertyServices)
                    .ThenInclude(ps => ps.Service)
                    .Include(p => p.PropertyServices)
                    .ThenInclude(ps => ps.Vendor)
                    .Select(p => new
                    {
                        p.PropertyID,
                        p.OwnName,
                        p.OwnEmail,
                        p.Address,
                        p.City,
                        p.State,
                        p.Pincode,
                        p.CreatedAt,
                        p.ProjectEndingDate, // Add this line
                        Services = p.PropertyServices.Select(ps => new
                        {
                            ps.ServiceID,
                            ps.Service.ServiceType,
                            ps.Service.Description
                        }).Distinct().ToList(),
                        Vendors = p.PropertyServices.Select(ps => new
                        {
                            ps.VendorID,
                            ps.Vendor.Name,
                            ps.Vendor.Email
                        }).Distinct().ToList(),
                        AssignedAt = p.PropertyServices.Select(ps => ps.AssignedAt).FirstOrDefault()
                    })
                    .ToListAsync();

                return Ok(new
                {
                    Message = "Properties retrieved successfully",
                    Data = properties,
                    TotalCount = properties.Count
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving properties", error = ex.Message });
            }
        }

        //[HttpPut("edit-property/{propertyId}")]
        //[Authorize(Roles = "Agent")]
        //public async Task<IActionResult> EditProperty(int propertyId, [FromBody] EditPropertyRequest request)
        //{
        //    var agentEmail = User.FindFirst(ClaimTypes.Email)?.Value;
        //    var agent = await _context.Agents.FirstOrDefaultAsync(a => a.Email == agentEmail);
        //    if (agent == null)
        //    {
        //        return Unauthorized(new { message = "Unauthorized Agent" });
        //    }

        //    var property = await _context.Properties
        //        .Include(p => p.PropertyServices)
        //        .FirstOrDefaultAsync(p => p.PropertyID == propertyId && p.AgentID == agent.AgentID);

        //    if (property == null)
        //    {
        //        return NotFound(new { message = "Property not found or you don't have access" });
        //    }

        //    bool propertyDetailsChanged = false;
        //    if (!string.IsNullOrEmpty(request.OwnName) && request.OwnName != property.OwnName)
        //    {
        //        property.OwnName = request.OwnName;
        //        propertyDetailsChanged = true;
        //    }
        //    if (!string.IsNullOrEmpty(request.OwnEmail) && request.OwnEmail != property.OwnEmail)
        //    {
        //        property.OwnEmail = request.OwnEmail;
        //        propertyDetailsChanged = true;
        //    }
        //    if (!string.IsNullOrEmpty(request.Address) && request.Address != property.Address)
        //    {
        //        property.Address = request.Address;
        //        propertyDetailsChanged = true;
        //    }
        //    if (!string.IsNullOrEmpty(request.City) && request.City != property.City)
        //    {
        //        property.City = request.City;
        //        propertyDetailsChanged = true;
        //    }
        //    if (!string.IsNullOrEmpty(request.State) && request.State != property.State)
        //    {
        //        property.State = request.State;
        //        propertyDetailsChanged = true;
        //    }
        //    if (!string.IsNullOrEmpty(request.Pincode) && request.Pincode != property.Pincode)
        //    {
        //        property.Pincode = request.Pincode;
        //        propertyDetailsChanged = true;
        //    }
        //    if (request.ProjectEndingDate.HasValue && request.ProjectEndingDate != property.ProjectEndingDate)
        //    {
        //        property.ProjectEndingDate = request.ProjectEndingDate; // Add this line
        //        propertyDetailsChanged = true;
        //    }


        //    bool vendorsChanged = false;
        //    List<int> currentVendorIds = new List<int>();
        //    List<int> removedVendors = new List<int>();

        //    if (request.VendorIds != null && request.VendorIds.Any())
        //    {
        //        if (!request.VendorIds.Any())
        //        {
        //            return BadRequest(new { message = "At least one vendor must be selected" });
        //        }

        //        var currentPropertyServices = await _context.PropertyServices
        //            .Where(ps => ps.PropertyID == propertyId)
        //            .Include(ps => ps.Vendor)
        //            .ToListAsync();

        //        currentVendorIds = currentPropertyServices.Select(ps => ps.VendorID).Distinct().ToList();
        //        var currentServiceIds = currentPropertyServices.Select(ps => ps.ServiceID).Distinct().ToList();

        //        var invalidVendorIds = request.VendorIds
        //            .Where(id => !_context.Vendors.Any(v => v.VendorID == id))
        //            .ToList();
        //        if (invalidVendorIds.Any())
        //        {
        //            return BadRequest(new { message = $"Invalid Vendor IDs: {string.Join(", ", invalidVendorIds)}" });
        //        }

        //        var vendorServices = await _context.VendorServices
        //            .Where(vs => request.VendorIds.Contains(vs.VendorID) && currentServiceIds.Contains(vs.ServiceID))
        //            .ToListAsync();

        //        if (vendorServices.Count != currentServiceIds.Count * request.VendorIds.Count)
        //        {
        //            return BadRequest(new { message = "Some vendors don’t offer the required services." });
        //        }

        //        vendorsChanged = !currentVendorIds.OrderBy(x => x).SequenceEqual(request.VendorIds.OrderBy(x => x));
        //    }

        //    try
        //    {
        //        var services = await _context.Services
        //            .Where(s => _context.PropertyServices
        //                .Where(ps => ps.PropertyID == propertyId)
        //                .Select(ps => ps.ServiceID)
        //                .Contains(s.ServiceID))
        //            .Select(s => s.ServiceType)
        //            .ToListAsync();

        //        if (request.VendorIds != null && vendorsChanged)
        //        {
        //            var currentPropertyServices = await _context.PropertyServices
        //                .Where(ps => ps.PropertyID == propertyId)
        //                .Include(ps => ps.Vendor)
        //                .ToListAsync();

        //            // This is now redundant since we already have it above, but keeping for clarity
        //            currentVendorIds = currentPropertyServices.Select(ps => ps.VendorID).Distinct().ToList();
        //            var currentServiceIds = currentPropertyServices.Select(ps => ps.ServiceID).Distinct().ToList();

        //            var vendorsToRemove = currentVendorIds.Except(request.VendorIds).ToList();
        //            removedVendors = vendorsToRemove; // Store for response

        //            foreach (var vendorId in vendorsToRemove)
        //            {
        //                var vendor = await _context.Vendors.FindAsync(vendorId);
        //                await SendVendorCancellationNotification(vendor.Email, agent.Name, property.Address, services);

        //                var servicesToRemove = currentPropertyServices.Where(ps => ps.VendorID == vendorId);
        //                _context.PropertyServices.RemoveRange(servicesToRemove);
        //            }

        //            var newVendorIds = request.VendorIds.Except(currentVendorIds).ToList();
        //            foreach (var vendorId in newVendorIds)
        //            {
        //                var vendor = await _context.Vendors.FindAsync(vendorId);
        //                await SendVendorNotification(vendor.Email, agent.Name, property.Address, services);

        //                foreach (var serviceId in currentServiceIds)
        //                {
        //                    _context.PropertyServices.Add(new PropertyService
        //                    {
        //                        PropertyID = propertyId,
        //                        ServiceID = serviceId,
        //                        VendorID = vendorId,
        //                        AssignedByAgentID = agent.AgentID,
        //                        AssignedAt = DateTime.UtcNow
        //                    });
        //                }
        //            }
        //        }

        //        if (propertyDetailsChanged || vendorsChanged)
        //        {
        //            await _context.SaveChangesAsync();
        //        }

        //        return Ok(new
        //        {
        //            Message = "Property updated successfully",
        //            PropertyID = propertyId,
        //            UpdatedDetails = propertyDetailsChanged,
        //            UpdatedVendors = vendorsChanged,
        //            NewVendors = request.VendorIds != null && vendorsChanged ? request.VendorIds : null,
        //            RemovedVendors = request.VendorIds != null && vendorsChanged ? removedVendors : null,
        //            ProjectEndingDate = property.ProjectEndingDate // Add this line
        //        });
        //    }
        //    catch (Exception ex)
        //    {
        //        return StatusCode(500, new { message = "Failed to update property", error = ex.Message });
        //    }
        //}

        [HttpPut("edit-property/{propertyId}")]
        [Authorize(Roles = "Agent")]
        public async Task<IActionResult> EditProperty([FromRoute] int propertyId, [FromBody] EditPropertyRequest request)
        {
            var agentEmail = User.FindFirst(ClaimTypes.Email)?.Value;
            var agent = await _context.Agents.FirstOrDefaultAsync(a => a.Email == agentEmail);
            if (agent == null)
            {
                return Unauthorized(new { message = "Unauthorized Agent" });
            }

            var property = await _context.Properties
                .Include(p => p.PropertyServices)
                .FirstOrDefaultAsync(p => p.PropertyID == propertyId && p.AgentID == agent.AgentID);

            if (property == null)
            {
                return NotFound(new { message = "Property not found or you don't have access" });
            }

            bool propertyDetailsChanged = false;
            if (!string.IsNullOrEmpty(request.OwnName) && request.OwnName != property.OwnName)
            {
                property.OwnName = request.OwnName;
                propertyDetailsChanged = true;
            }
            if (!string.IsNullOrEmpty(request.OwnEmail) && request.OwnEmail != property.OwnEmail)
            {
                if (!new EmailAddressAttribute().IsValid(request.OwnEmail))
                    return BadRequest(new { message = "Invalid email format" });
                property.OwnEmail = request.OwnEmail;
                propertyDetailsChanged = true;
            }
            if (!string.IsNullOrEmpty(request.Address) && request.Address != property.Address)
            {
                property.Address = request.Address;
                propertyDetailsChanged = true;
            }
            if (!string.IsNullOrEmpty(request.City) && request.City != property.City)
            {
                property.City = request.City;
                propertyDetailsChanged = true;
            }
            if (!string.IsNullOrEmpty(request.State) && request.State != property.State)
            {
                property.State = request.State;
                propertyDetailsChanged = true;
            }
            if (!string.IsNullOrEmpty(request.Pincode) && request.Pincode != property.Pincode)
            {
                if (!System.Text.RegularExpressions.Regex.IsMatch(request.Pincode, @"^\d{5,6}$"))
                    return BadRequest(new { message = "Pincode must be 5 or 6 digits" });
                property.Pincode = request.Pincode;
                propertyDetailsChanged = true;
            }
            if (request.ProjectEndingDate.HasValue && request.ProjectEndingDate != property.ProjectEndingDate)
            {
                if (request.ProjectEndingDate < DateTime.UtcNow.Date)
                    return BadRequest(new { message = "Project ending date cannot be in the past" });
                property.ProjectEndingDate = request.ProjectEndingDate;
                propertyDetailsChanged = true;
            }

            bool servicesChanged = false;
            bool vendorsChanged = false;
            var currentPropertyServices = await _context.PropertyServices
                .Where(ps => ps.PropertyID == propertyId)
                .ToListAsync();
            var currentServiceIds = currentPropertyServices.Select(ps => ps.ServiceID).Distinct().ToList();
            var currentVendorIds = currentPropertyServices.Select(ps => ps.VendorID).Distinct().ToList();
            List<int> removedVendors = new List<int>();

            if (request.ServiceIds != null && request.ServiceIds.Any())
            {
                var invalidServiceIds = request.ServiceIds
                    .Where(id => !_context.Services.Any(s => s.ServiceID == id))
                    .ToList();
                if (invalidServiceIds.Any())
                {
                    return BadRequest(new { message = $"Invalid Service IDs: {string.Join(", ", invalidServiceIds)}" });
                }
                servicesChanged = !currentServiceIds.OrderBy(x => x).SequenceEqual(request.ServiceIds.OrderBy(x => x));
            }

            if (request.VendorIds != null && request.VendorIds.Any())
            {
                var invalidVendorIds = request.VendorIds
                    .Where(id => !_context.Vendors.Any(v => v.VendorID == id))
                    .ToList();
                if (invalidVendorIds.Any())
                {
                    return BadRequest(new { message = $"Invalid Vendor IDs: {string.Join(", ", invalidVendorIds)}" });
                }

                var updatedServiceIds = request.ServiceIds ?? currentServiceIds;

                // NEW VALIDATION LOGIC - Check if vendors offer at least one requested service
                var validVendorServices = await _context.VendorServices
                    .Where(vs => request.VendorIds.Contains(vs.VendorID) &&
                                updatedServiceIds.Contains(vs.ServiceID))
                    .ToListAsync();

                var vendorsWithNoValidServices = request.VendorIds
                    .Except(validVendorServices.Select(vs => vs.VendorID).Distinct())
                    .ToList();

                if (vendorsWithNoValidServices.Any())
                {
                    return BadRequest(new
                    {
                        message = $"Vendors {string.Join(", ", vendorsWithNoValidServices)} don't offer any of the requested services."
                    });
                }

                vendorsChanged = !currentVendorIds.OrderBy(x => x).SequenceEqual(request.VendorIds.OrderBy(x => x));
            }

            try
            {
                using var transaction = await _context.Database.BeginTransactionAsync();

                var services = await _context.Services
                    .Where(s => currentServiceIds.Contains(s.ServiceID))
                    .Select(s => s.ServiceType)
                    .ToListAsync();

                if ((request.ServiceIds != null && servicesChanged) || (request.VendorIds != null && vendorsChanged))
                {
                    _context.PropertyServices.RemoveRange(currentPropertyServices);

                    var updatedServiceIds = request.ServiceIds ?? currentServiceIds;
                    var updatedVendorIds = request.VendorIds ?? currentVendorIds;

                    var vendorsToRemove = currentVendorIds.Except(updatedVendorIds).ToList();
                    removedVendors = vendorsToRemove;
                    foreach (var vendorId in vendorsToRemove)
                    {
                        var vendor = await _context.Vendors.FindAsync(vendorId);
                        await SendVendorCancellationNotification(vendor.Email, agent.Name, property.Address, services);
                    }

                    var newVendorIds = updatedVendorIds.Except(currentVendorIds).ToList();
                    foreach (var vendorId in newVendorIds)
                    {
                        var vendor = await _context.Vendors.FindAsync(vendorId);
                        await SendVendorNotification(vendor.Email, agent.Name, property.Address, services);
                    }

                    // Only assign services that vendors actually offer
                    var validAssignments = await _context.VendorServices
                        .Where(vs => updatedVendorIds.Contains(vs.VendorID) &&
                                    updatedServiceIds.Contains(vs.ServiceID))
                        .ToListAsync();

                    foreach (var validAssignment in validAssignments)
                    {
                        _context.PropertyServices.Add(new PropertyService
                        {
                            PropertyID = propertyId,
                            ServiceID = validAssignment.ServiceID,
                            VendorID = validAssignment.VendorID,
                            AssignedByAgentID = agent.AgentID,
                            AssignedAt = DateTime.UtcNow
                        });
                    }
                }

                if (propertyDetailsChanged || servicesChanged || vendorsChanged)
                {
                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();
                }

                var finalServiceIds = request.ServiceIds ?? currentServiceIds;
                var finalVendorIds = request.VendorIds ?? currentVendorIds;

                return Ok(new
                {
                    Message = "Property updated successfully",
                    PropertyID = propertyId,
                    UpdatedDetails = propertyDetailsChanged,
                    UpdatedServices = servicesChanged,
                    UpdatedVendors = vendorsChanged,
                    NewServices = servicesChanged ? request.ServiceIds : null,
                    NewVendors = vendorsChanged ? request.VendorIds : null,
                    RemovedVendors = vendorsChanged ? removedVendors : null,
                    ProjectEndingDate = property.ProjectEndingDate?.ToString("dd/MM/yyyy"),
                    CurrentServices = finalServiceIds,
                    CurrentVendors = finalVendorIds
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to update property", error = ex.Message });
            }
        }






        // SendVendorNotification - Added error handling
        private async Task SendVendorNotification(string vendorEmail, string agentName, string address, List<string> services)
        {
            try
            {
                var message = new MimeMessage();
                message.From.Add(new MailboxAddress("Real Estate App", _config["EmailSettings:SenderEmail"]));
                message.To.Add(new MailboxAddress("", vendorEmail));
                message.Subject = "New Service Request Assigned";

                // Join services into a comma-separated string for the email body
                string servicesList = string.Join(", ", services);
                message.Body = new TextPart("plain")
                {
                    Text = $"Hello,\n\nAgent {agentName} has assigned you a service request for: {servicesList} at {address}.\nPlease check your dashboard for details.\n\nThank You."
                };

                using var client = new SmtpClient();
                await client.ConnectAsync(_config["EmailSettings:SmtpServer"], 587, false);
                await client.AuthenticateAsync(_config["EmailSettings:SmtpUsername"], _config["EmailSettings:SmtpPassword"]);
                await client.SendAsync(message);
                await client.DisconnectAsync(true);
            }
            catch (Exception ex)
            {
                // Log the error (consider using a logging framework like Serilog or ILogger)
                Console.WriteLine($"Failed to send notification email to {vendorEmail}: {ex.Message}");
                throw new Exception($"Failed to send notification email to {vendorEmail}: {ex.Message}");
            }
        }

        private async Task SendVendorCancellationNotification(string vendorEmail, string agentName, string address, List<string> services)
        {
            try
            {
                var message = new MimeMessage();
                message.From.Add(new MailboxAddress("Real Estate App", _config["EmailSettings:SenderEmail"]));
                message.To.Add(new MailboxAddress("", vendorEmail));
                message.Subject = "Service Request Cancellation";

                string servicesList = string.Join(", ", services);
                message.Body = new TextPart("plain")
                {
                    Text = $"Hello,\n\nAgent {agentName} has cancelled your service request for: {servicesList} at {address}.\nPlease check your dashboard for details.\n\nThank You."
                };

                using var client = new SmtpClient();
                await client.ConnectAsync(_config["EmailSettings:SmtpServer"], 587, false);
                await client.AuthenticateAsync(_config["EmailSettings:SmtpUsername"], _config["EmailSettings:SmtpPassword"]);
                await client.SendAsync(message);
                await client.DisconnectAsync(true);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to send cancellation email to {vendorEmail}: {ex.Message}");
                throw new Exception($"Failed to send cancellation email to {vendorEmail}: {ex.Message}");
            }
        }
    }
    // Request Models - Enhanced with validation attributes
    public class AddPropertyRequest
    {
        public string OwnName { get; set; }
        public string OwnEmail { get; set; }
        public string Address { get; set; }
        public string City { get; set; }
        public string State { get; set; }
        public string Pincode { get; set; }
        public List<int> ServiceIds { get; set; }
        public List<int> VendorIds { get; set; }

        public DateTime? ProjectEndingDate { get; set; }
    }


    public class ServiceSelectionRequest
    {
        public List<int> ServiceIds { get; set; }
    }

    public class LoginRequest
    {
        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Invalid email format")]
        public string Email { get; set; }

        [Required(ErrorMessage = "Password is required")]
        public string Password { get; set; }
    }
    public class EditPropertyRequest
    {
        public DateTime? ProjectEndingDate { get; set; }
        public string? OwnName { get; set; }
        public string? OwnEmail { get; set; }
        public string? Address { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }
        public string? Pincode { get; set; }
        public List<int>? ServiceIds { get; set; }
        public List<int>? VendorIds { get; set; } // Optional - only update vendors if provided
    }
}