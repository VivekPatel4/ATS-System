using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using testapi.Data;
using testapi.models;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Text;
using testapi.Services;
using System.ComponentModel.DataAnnotations;
using Microsoft.SqlServer.Server;

namespace testapi.Controllers
{
    
    [Route("api/admin")]
    [ApiController]
    public class AdminController : ControllerBase
    {
        private readonly Testapi _context;
        private readonly IConfiguration _conficonfiguration;
        private readonly EmailService _emailService;

        public AdminController(Testapi context, IConfiguration configuration, EmailService emailService)
        {
            _context = context;
            _conficonfiguration = configuration;
            _emailService = emailService;
        }

        [HttpPost("register")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Register([FromBody] Adminreg adminRequest)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new { message = "Invalid input data", errors = ModelState });
                }

                if (_context.Admins.Any(a => a.Email == adminRequest.Email))
                {
                    return BadRequest(new { message = "Email already exists!" });
                }

                var admin = new Admin
                {
                    Name = adminRequest.Name,
                    Email = adminRequest.Email,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(adminRequest.PasswordHash),
                    CreatedAt = DateTime.UtcNow
                };

                _context.Admins.Add(admin);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Admin registered successfully!",
                    adminId = admin.AdminID
                });
            }
            catch (DbUpdateException ex)
            {
                var innerException = ex.InnerException?.Message ?? "No inner exception";
                return StatusCode(500, new
                {
                    message = "Failed to register admin",
                    error = ex.Message,
                    innerError = innerException
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "An error occurred while registering admin",
                    error = ex.Message
                });
            }
        }

        [HttpGet("admins")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetAllAdmins()
        {
            try
            {
                var admins = await _context.Admins
                    .Select(a => new
                    {
                        a.AdminID,  // Assuming you have an AdminID property
                        a.Name,
                        a.Email,
                        a.CreatedAt  // Assuming you have a CreatedAt property
                    })
                    .ToListAsync();

                return Ok(new
                {
                    message = "Admins retrieved successfully",
                    totalCount = admins.Count,
                    data = admins
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Error retrieving admins",
                    error = ex.Message
                });
            }
        }

        [HttpGet("soft-admins")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> softGetAllAdmins()
        {
            try
            {
                var admins = await _context.Admins
                    .Where(a => !a.IsDeleted) // Exclude soft-deleted admins
                    .Select(a => new
                    {
                        a.AdminID,
                        a.Name,
                        a.Email,
                        a.CreatedAt
                    })
                    .ToListAsync();

                return Ok(new
                {
                    message = "Admins retrieved successfully",
                    totalCount = admins.Count,
                    data = admins
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving admins", error = ex.Message });
            }
        }

        // GET: Retrieve single admin by ID
        [HttpGet("admin/{adminId}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetAdminById(int adminId)
        {
            try
            {
                var admin = await _context.Admins
                    .Where(a => a.AdminID == adminId)
                    .Select(a => new
                    {
                        a.AdminID,
                        a.Name,
                        a.Email,
                        a.CreatedAt
                    })
                    .FirstOrDefaultAsync();

                if (admin == null)
                {
                    return NotFound(new { message = "Admin not found" });
                }

                return Ok(new
                {
                    message = "Admin retrieved successfully",
                    data = admin
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Error retrieving admin",
                    error = ex.Message
                });
            }
        }

        [HttpDelete("admin/{adminId}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> DeleteAdmin(int adminId)
        {
            try
            {
                // Prevent deleting the last admin or current user (optional security measure)
                var adminCount = await _context.Admins.CountAsync();
                if (adminCount <= 1)
                {
                    return BadRequest(new { message = "Cannot delete the last admin" });
                }

                var admin = await _context.Admins
                    .FirstOrDefaultAsync(a => a.AdminID == adminId);

                if (admin == null)
                {
                    return NotFound(new { message = "Admin not found" });
                }

                // Optional: Check if this is the current user
                var currentUserEmail = User.FindFirst(ClaimTypes.Email)?.Value;
                if (admin.Email == currentUserEmail)
                {
                    return BadRequest(new { message = "Cannot delete your own account" });
                }

                _context.Admins.Remove(admin);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Admin deleted successfully",
                    adminId = adminId
                });
            }
            catch (Exception ex)
            {
                var innerException = ex.InnerException?.Message ?? "No inner exception";
                return StatusCode(500, new
                {
                    message = "Error deleting admin",
                    error = ex.Message,
                    innerError = innerException
                });
            }
        }

        [HttpDelete("soft-delete-admin/{adminId}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> softDeleteAdmin(int adminId)
        {
            try
            {
                var adminCount = await _context.Admins.CountAsync(a => !a.IsDeleted);
                if (adminCount <= 1)
                {
                    return BadRequest(new { message = "Cannot delete the last admin" });
                }

                var admin = await _context.Admins
                    .FirstOrDefaultAsync(a => a.AdminID == adminId && !a.IsDeleted);

                if (admin == null)
                {
                    return NotFound(new { message = "Admin not found or already deleted" });
                }

                var currentUserEmail = User.FindFirst(ClaimTypes.Email)?.Value;
                if (admin.Email == currentUserEmail)
                {
                    return BadRequest(new { message = "Cannot delete your own account" });
                }

                admin.IsDeleted = true; // Soft delete
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Admin soft deleted successfully",
                    adminId = adminId
                });
            }
            catch (Exception ex)
            {
                var innerException = ex.InnerException?.Message ?? "No inner exception";
                return StatusCode(500, new
                {
                    message = "Error soft deleting admin",
                    error = ex.Message,
                    innerError = innerException
                });
            }
        }

        [HttpPost("login")]
        [AllowAnonymous]
        public IActionResult AdminLogin([FromBody] LoginRequest request)
        {
            var admin = _context.Admins.FirstOrDefault(a => a.Email == request.Email);

            if (admin == null || !BCrypt.Net.BCrypt.Verify(request.Password, admin.PasswordHash))
            {
                return Unauthorized(new { message = "Invalid credentials" });
            }

            var claims = new[]
            {
                new Claim(ClaimTypes.Email, admin.Email),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(ClaimTypes.Role, "admin")
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_conficonfiguration["Jwt:Key"]));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _conficonfiguration["Jwt:Issuer"],
                audience: _conficonfiguration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.Now.AddMinutes(60),
                signingCredentials: creds
            );

            var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

            return Ok(new
            {
                AccessToken = tokenString,
                Name = admin.Name,
                Email = admin.Email,
                Role = "Admin",
                ExpireIn = DateTime.UtcNow.AddMinutes(60) // Token expiration time
            });
        }

        [HttpPost("add-vendor")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> AddVendor([FromBody] VendorRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new { message = "Invalid input data." });
                }

                if (await _context.Vendors.AnyAsync(v => v.Email == request.Email))
                {
                    return BadRequest(new { message = "Vendor already exists." });
                }

                // Validate ServiceIds
                if (request.ServiceIds == null || !request.ServiceIds.Any())
                {
                    return BadRequest(new { message = "No service IDs provided." });
                }

                // Check for invalid ServiceIds
                var invalidServiceIds = request.ServiceIds
                    .Where(id => !_context.Services.Any(s => s.ServiceID == id))
                    .ToList();

                if (invalidServiceIds.Any())
                {
                    return BadRequest(new { message = "Invalid service IDs provided.", invalidServiceIds });
                }

                // Create and save the vendor
                var vendor = new Vendor
                {
                    Name = request.Name,
                    Email = request.Email,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.PasswordHash),
                    CreatedAt = DateTime.UtcNow
                };

                await _context.Vendors.AddAsync(vendor);
                await _context.SaveChangesAsync(); // Save vendor to generate VendorID

                // Explicitly add VendorService entries
                foreach (var serviceId in request.ServiceIds)
                {
                    var vendorService = new VendorService
                    {
                        VendorID = vendor.VendorID,
                        ServiceID = serviceId
                    };
                    await _context.VendorServices.AddAsync(vendorService);
                }
                await _context.SaveChangesAsync(); // Save VendorServices

                await _emailService.SendInvitationEmail(request.Email, "Vendor");
                return Ok(new
                {
                    message = "Vendor added & invitation sent.",
                    vendorId = vendor.VendorID,
                    selectedServices = request.ServiceIds
                });
            }
            catch (Exception ex)
            {
                var innerExceptionMessage = ex.InnerException != null ? ex.InnerException.Message : "No inner exception";
                return StatusCode(500, new { message = "An error occurred while adding the vendor.", error = ex.Message, innerError = innerExceptionMessage });
            }
        }


        // ✅ Add Agent
        [HttpPost("add-agent")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> AddAgent([FromBody] AddUserRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new { message = "Invalid input data." });
                }

                if (await _context.Agents.AnyAsync(a => a.Email == request.Email))
                {
                    return BadRequest(new { message = "Agent already exists." });
                }

                var agent = new Agent
                {
                    Name = request.Name,
                    Email = request.Email,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                    CreatedAt = DateTime.UtcNow
                };

                await _context.Agents.AddAsync(agent);
                await _context.SaveChangesAsync();

                await _emailService.SendInvitationEmail(request.Email, "Agent");
                return Ok(new { message = "Agent added & invitation sent." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while adding the agent.", error = ex.Message });
            }
        }

       

        [HttpPost("add-service")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> AddService([FromBody] ServiceRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new { message = "Invalid input data." });
                }

                // Check if service type already exists (optional, remove if not needed)
                if (await _context.Services.AnyAsync(s => s.ServiceType == request.ServiceType))
                {
                    return BadRequest(new { message = "Service type already exists." });
                }

                var service = new Service
                {
                    ServiceType = request.ServiceType,
                    Description = request.Description,
                    CreatedAt = DateTime.UtcNow
                };

                await _context.Services.AddAsync(service);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Service added successfully.",
                    serviceId = service.ServiceID,
                    serviceType = service.ServiceType
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while adding the service.", error = ex.Message });
            }
        }

        [HttpGet("services")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetAllServices()
        {
            try
            {
                var services = await _context.Services
                    .Select(s => new
                    {
                        s.ServiceID,
                        s.ServiceType,
                        s.Description,
                        s.CreatedAt
                    })
                    .ToListAsync();

                return Ok(services);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving services", error = ex.Message });
            }
        }

        [HttpGet("soft-services")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> softGetAllServices()
        {
            try
            {
                var services = await _context.Services
                    .Where(s => !s.IsDeleted) // Exclude soft-deleted services
                    .Select(s => new
                    {
                        s.ServiceID,
                        s.ServiceType,
                        s.Description,
                        s.CreatedAt
                    })
                    .ToListAsync();

                return Ok(services);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving services", error = ex.Message });
            }
        }

        // Add these methods inside your AdminController class

        [HttpGet("agents")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetAgents()
        {
            try
            {
                var agents = await _context.Agents
                    .Select(a => new
                    {
                        a.AgentID,
                        a.Name,
                        a.Email,
                        a.CreatedAt
                    })
                    .ToListAsync();

                return Ok(new
                {
                    message = "Agents retrieved successfully",
                    data = agents,
                    totalCount = agents.Count
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Error retrieving agents",
                    error = ex.Message
                });
            }
        }

        [HttpGet("soft-agents")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> softGetAgents()
        {
            try
            {
                var agents = await _context.Agents
                    .Where(a => !a.IsDeleted) // Exclude soft-deleted agents
                    .Select(a => new
                    {
                        a.AgentID,
                        a.Name,
                        a.Email,
                        a.CreatedAt
                    })
                    .ToListAsync();

                return Ok(new
                {
                    message = "Agents retrieved successfully",
                    data = agents,
                    totalCount = agents.Count
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving agents", error = ex.Message });
            }
        }

        [HttpGet("vendors")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetVendors()
        {
            try
            {
                var vendors = await _context.Vendors
                    .Include(v => v.VendorServices)
                    .ThenInclude(vs => vs.Service)
                    .ToListAsync();

                // Log or debug the VendorServices count
                foreach (var vendor in vendors)
                {
                    Console.WriteLine($"Vendor {vendor.VendorID} has {vendor.VendorServices.Count} services.");
                }

                var result = vendors.Select(v => new
                {
                    v.VendorID,
                    v.Name,
                    v.Email,
                    v.CreatedAt,
                    Services = v.VendorServices.Select(vs => new
                    {
                        vs.ServiceID,
                        vs.Service.ServiceType,
                        vs.Service.Description
                    })
                }).ToList();

                return Ok(new
                {
                    message = "Vendors retrieved successfully",
                    data = result,
                    totalCount = result.Count
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving vendors", error = ex.Message });
            }
        }

        [HttpGet("soft-vendors")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> softGetVendors()
        {
            try
            {
                var vendors = await _context.Vendors
                    .Where(v => !v.IsDeleted) // Exclude soft-deleted vendors
                    .Include(v => v.VendorServices)
                    .ThenInclude(vs => vs.Service)
                    .ToListAsync();

                var result = vendors.Select(v => new
                {
                    v.VendorID,
                    v.Name,
                    v.Email,
                    v.CreatedAt,
                    Services = v.VendorServices.Select(vs => new
                    {
                        vs.ServiceID,
                        vs.Service.ServiceType,
                        vs.Service.Description
                    })
                }).ToList();

                return Ok(new
                {
                    message = "Vendors retrieved successfully",
                    data = result,
                    totalCount = result.Count
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving vendors", error = ex.Message });
            }
        }

        [HttpPut("edit-vendor/{vendorId}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> EditVendor(int vendorId, [FromBody] UpdateVendorRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new { message = "Invalid input data." });
                }

                // Find the existing vendor
                var vendor = await _context.Vendors
                    .Include(v => v.VendorServices)
                    .FirstOrDefaultAsync(v => v.VendorID == vendorId);

                if (vendor == null)
                {
                    return NotFound(new { message = "Vendor not found." });
                }

                // Check if the updated email is already taken by another vendor
                if (await _context.Vendors.AnyAsync(v => v.Email == request.Email && v.VendorID != vendorId))
                {
                    return BadRequest(new { message = "Email already exists for another vendor." });
                }

                // Update vendor details
                vendor.Name = request.Name;
                vendor.Email = request.Email;
               

                // Validate ServiceIds if provided
                if (request.ServiceIds != null)
                {
                    var invalidServiceIds = request.ServiceIds
                        .Where(id => !_context.Services.Any(s => s.ServiceID == id))
                        .ToList();

                    if (invalidServiceIds.Any())
                    {
                        return BadRequest(new { message = "Invalid service IDs provided.", invalidServiceIds });
                    }

                    // Remove existing VendorServices
                    _context.VendorServices.RemoveRange(vendor.VendorServices);

                    // Add new VendorServices
                    vendor.VendorServices = request.ServiceIds
                        .Select(id => new VendorService { VendorID = vendor.VendorID, ServiceID = id })
                        .ToList();
                }

                // Save changes
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Vendor updated successfully.",
                    vendorId = vendor.VendorID,
                    selectedServices = request.ServiceIds ?? vendor.VendorServices.Select(vs => vs.ServiceID).ToList()
                });
            }
            catch (Exception ex)
            {
                var innerExceptionMessage = ex.InnerException != null ? ex.InnerException.Message : "No inner exception";
                return StatusCode(500, new { message = "An error occurred while updating the vendor.", error = ex.Message, innerError = innerExceptionMessage });
            }
        }

        // NEW: Edit Agent
        [HttpPut("edit-agent/{agentId}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> EditAgent(int agentId, [FromBody] UpdateAgentRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new { message = "Invalid input data." });
                }

                // Find the existing agent
                var agent = await _context.Agents.FirstOrDefaultAsync(a => a.AgentID == agentId);

                if (agent == null)
                {
                    return NotFound(new { message = "Agent not found." });
                }

                // Check if the updated email is already taken by another agent
                if (await _context.Agents.AnyAsync(a => a.Email == request.Email && a.AgentID != agentId))
                {
                    return BadRequest(new { message = "Email already exists for another agent." });
                }

                // Update agent details
                agent.Name = request.Name;
                agent.Email = request.Email;
               

                // Save changes
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Agent updated successfully.",
                    agentId = agent.AgentID
                });
            }
            catch (Exception ex)
            {
                var innerExceptionMessage = ex.InnerException != null ? ex.InnerException.Message : "No inner exception";
                return StatusCode(500, new { message = "An error occurred while updating the agent.", error = ex.Message, innerError = innerExceptionMessage });
            }
        }

        [HttpGet("vendor/{vendorId}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetVendorById(int vendorId)
        {
            try
            {
                var vendor = await _context.Vendors
                    .Include(v => v.VendorServices)
                    .ThenInclude(vs => vs.Service)
                    .FirstOrDefaultAsync(v => v.VendorID == vendorId);

                if (vendor == null)
                {
                    return NotFound(new { message = "Vendor not found." });
                }

                var result = new
                {
                    vendor.VendorID,
                    vendor.Name,
                    vendor.Email,
                    vendor.CreatedAt,
                    Services = vendor.VendorServices.Select(vs => new
                    {
                        vs.ServiceID,
                        vs.Service.ServiceType,
                        vs.Service.Description
                    }).ToList()
                };

                return Ok(new
                {
                    message = "Vendor retrieved successfully.",
                    data = result
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving vendor", error = ex.Message });
            }
        }

        // NEW: Get Agent by ID
        [HttpGet("agent/{agentId}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetAgentById(int agentId)
        {
            try
            {
                var agent = await _context.Agents
                    .FirstOrDefaultAsync(a => a.AgentID == agentId);

                if (agent == null)
                {
                    return NotFound(new { message = "Agent not found." });
                }

                var result = new
                {
                    agent.AgentID,
                    agent.Name,
                    agent.Email,
                    agent.CreatedAt
                };

                return Ok(new
                {
                    message = "Agent retrieved successfully.",
                    data = result
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving agent", error = ex.Message });
            }
        }

        // Add these DELETE endpoints inside your AdminController class

        [HttpDelete("delete-vendor/{vendorId}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> DeleteVendor(int vendorId)
        {
            try
            {
                var vendor = await _context.Vendors
                    .Include(v => v.VendorServices)
                    .FirstOrDefaultAsync(v => v.VendorID == vendorId);

                if (vendor == null)
                {
                    return NotFound(new { message = "Vendor not found." });
                }

                // Remove associated VendorServices first
                if (vendor.VendorServices.Any())
                {
                    _context.VendorServices.RemoveRange(vendor.VendorServices);
                }

                // Remove the vendor
                _context.Vendors.Remove(vendor);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Vendor deleted successfully.",
                    vendorId = vendorId
                });
            }
            catch (Exception ex)
            {
                var innerExceptionMessage = ex.InnerException != null ? ex.InnerException.Message : "No inner exception";
                return StatusCode(500, new
                {
                    message = "Error deleting vendor",
                    error = ex.Message,
                    innerError = innerExceptionMessage
                });
            }
        }

        [HttpDelete("soft-delete-vendor/{vendorId}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> softDeleteVendor(int vendorId)
        {
            try
            {
                var vendor = await _context.Vendors
                    .FirstOrDefaultAsync(v => v.VendorID == vendorId && !v.IsDeleted);

                if (vendor == null)
                {
                    return NotFound(new { message = "Vendor not found or already deleted" });
                }

                vendor.IsDeleted = true; // Soft delete
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Vendor soft deleted successfully",
                    vendorId = vendorId
                });
            }
            catch (Exception ex)
            {
                var innerException = ex.InnerException?.Message ?? "No inner exception";
                return StatusCode(500, new
                {
                    message = "Error soft deleting vendor",
                    error = ex.Message,
                    innerError = innerException
                });
            }
        }

        [HttpDelete("delete-agent/{agentId}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> DeleteAgent(int agentId)
        {
            try
            {
                var agent = await _context.Agents
                    .FirstOrDefaultAsync(a => a.AgentID == agentId);

                if (agent == null)
                {
                    return NotFound(new { message = "Agent not found." });
                }

                _context.Agents.Remove(agent);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Agent deleted successfully.",
                    agentId = agentId
                });
            }
            catch (Exception ex)
            {
                var innerExceptionMessage = ex.InnerException != null ? ex.InnerException.Message : "No inner exception";
                return StatusCode(500, new
                {
                    message = "Error deleting agent",
                    error = ex.Message,
                    innerError = innerExceptionMessage
                });
            }
        }

        [HttpDelete("soft-delete-agent/{agentId}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> softDeleteAgent(int agentId)
        {
            try
            {
                var agent = await _context.Agents
                    .FirstOrDefaultAsync(a => a.AgentID == agentId && !a.IsDeleted);

                if (agent == null)
                {
                    return NotFound(new { message = "Agent not found or already deleted" });
                }

                agent.IsDeleted = true; // Soft delete
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Agent soft deleted successfully",
                    agentId = agentId
                });
            }
            catch (Exception ex)
            {
                var innerException = ex.InnerException?.Message ?? "No inner exception";
                return StatusCode(500, new
                {
                    message = "Error soft deleting agent",
                    error = ex.Message,
                    innerError = innerException
                });
            }
        }

        [HttpDelete("delete-service/{serviceId}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> DeleteService(int serviceId)
        {
            try
            {
                var service = await _context.Services
                    .FirstOrDefaultAsync(s => s.ServiceID == serviceId);

                if (service == null)
                {
                    return NotFound(new { message = "Service not found." });
                }

                // Check if the service is associated with any vendors
                var vendorServices = await _context.VendorServices
                    .Where(vs => vs.ServiceID == serviceId)
                    .ToListAsync();

                if (vendorServices.Any())
                {
                    return BadRequest(new
                    {
                        message = "Cannot delete service as it is associated with vendors.",
                        vendorCount = vendorServices.Count
                    });
                }

                _context.Services.Remove(service);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Service deleted successfully.",
                    serviceId = serviceId
                });
            }
            catch (Exception ex)
            {
                var innerExceptionMessage = ex.InnerException != null ? ex.InnerException.Message : "No inner exception";
                return StatusCode(500, new
                {
                    message = "Error deleting service",
                    error = ex.Message,
                    innerError = innerExceptionMessage
                });
            }
        }

        [HttpDelete("soft-delete-service/{serviceId}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> softDeleteService(int serviceId)
        {
            try
            {
                var service = await _context.Services
                    .FirstOrDefaultAsync(s => s.ServiceID == serviceId && !s.IsDeleted);

                if (service == null)
                {
                    return NotFound(new { message = "Service not found or already deleted" });
                }

                var vendorServices = await _context.VendorServices
                    .Where(vs => vs.ServiceID == serviceId)
                    .ToListAsync();

                if (vendorServices.Any())
                {
                    return BadRequest(new
                    {
                        message = "Cannot delete service as it is associated with vendors",
                        vendorCount = vendorServices.Count
                    });
                }

                service.IsDeleted = true; // Soft delete
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Service soft deleted successfully",
                    serviceId = serviceId
                });
            }
            catch (Exception ex)
            {
                var innerException = ex.InnerException?.Message ?? "No inner exception";
                return StatusCode(500, new
                {
                    message = "Error soft deleting service",
                    error = ex.Message,
                    innerError = innerException
                });
            }
        }

        //[HttpGet("all-assigned-properties")]
        //[Authorize(Roles = "admin")]
        //public async Task<IActionResult> GetAllAssignedProperties()
        //{
        //    try
        //    {
        //        var allAssignedProperties = await _context.PropertyServices
        //            .Join(_context.Properties,
        //                ps => ps.PropertyID,
        //                p => p.PropertyID,
        //                (ps, p) => new
        //                {
        //                    p.PropertyID,
        //                    p.Address,
        //                    p.City,
        //                    p.State,
        //                    p.Pincode,
        //                    p.OwnName,
        //                    p.OwnEmail,
        //                    ps.ServiceID,
        //                    ps.VendorID,
        //                    ps.AssignedAt,
        //                    AssignedByAgentID = ps.AssignedByAgentID
        //                })
        //            .Join(_context.Services,
        //                ps => ps.ServiceID,
        //                s => s.ServiceID,
        //                (ps, s) => new
        //                {
        //                    ps.PropertyID,
        //                    ps.Address,
        //                    ps.City,
        //                    ps.State,
        //                    ps.Pincode,
        //                    ps.OwnName,
        //                    ps.OwnEmail,
        //                    ps.AssignedAt,
        //                    ps.VendorID,
        //                    ServiceType = s.ServiceType,
        //                    ps.AssignedByAgentID
        //                })
        //            .Join(_context.Vendors,
        //                ps => ps.VendorID,
        //                v => v.VendorID,
        //                (ps, v) => new
        //                {
        //                    ps.PropertyID,
        //                    ps.Address,
        //                    ps.City,
        //                    ps.State,
        //                    ps.Pincode,
        //                    ps.OwnName,
        //                    ps.OwnEmail,
        //                    ps.AssignedAt,
        //                    ps.ServiceType,
        //                    Vendor = new { v.VendorID, v.Name, v.Email },
        //                    ps.AssignedByAgentID
        //                })
        //            .Join(_context.Agents,
        //                ps => ps.AssignedByAgentID,
        //                a => a.AgentID,
        //                (ps, a) => new
        //                {
        //                    ps.PropertyID,
        //                    ps.Address,
        //                    ps.City,
        //                    ps.State,
        //                    ps.Pincode,
        //                    ps.OwnName,
        //                    ps.OwnEmail,
        //                    ps.AssignedAt,
        //                    ps.ServiceType,
        //                    ps.Vendor,
        //                    Agent = new { a.AgentID, a.Name, a.Email }
        //                })
        //            .ToListAsync();

        //        return Ok(new
        //        {
        //            message = "All assigned properties retrieved successfully",
        //            totalCount = allAssignedProperties.Count,
        //            data = allAssignedProperties
        //        });
        //    }
        //    catch (Exception ex)
        //    {
        //        return StatusCode(500, new
        //        {
        //            message = "Error retrieving assigned properties",
        //            error = ex.Message
        //        });
        //    }
        //}

        [HttpGet("all-assigned-properties")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetAllAssignedProperties()
        {
            try
            {
                var allAssignedProperties = await _context.PropertyServices
                    .Join(_context.Properties,
                        ps => ps.PropertyID,
                        p => p.PropertyID,
                        (ps, p) => new
                        {
                            p.PropertyID,
                            p.Address,
                            p.City,
                            p.State,
                            p.Pincode,
                            p.OwnName,
                            p.OwnEmail,
                            p.Status, // Include Status
                            ps.ServiceID,
                            ps.VendorID,
                            ps.AssignedAt,
                            AssignedByAgentID = ps.AssignedByAgentID
                        })
                    .Join(_context.Services,
                        ps => ps.ServiceID,
                        s => s.ServiceID,
                        (ps, s) => new
                        {
                            ps.PropertyID,
                            ps.Address,
                            ps.City,
                            ps.State,
                            ps.Pincode,
                            ps.OwnName,
                            ps.OwnEmail,
                            ps.Status, // Include Status
                            ps.AssignedAt,
                            ps.VendorID,
                            ServiceType = s.ServiceType,
                            ps.AssignedByAgentID
                        })
                    .Join(_context.Vendors,
                        ps => ps.VendorID,
                        v => v.VendorID,
                        (ps, v) => new
                        {
                            ps.PropertyID,
                            ps.Address,
                            ps.City,
                            ps.State,
                            ps.Pincode,
                            ps.OwnName,
                            ps.OwnEmail,
                            ps.Status, // Include Status
                            ps.AssignedAt,
                            ps.ServiceType,
                            Vendor = new { v.VendorID, v.Name, v.Email },
                            ps.AssignedByAgentID
                        })
                    .Join(_context.Agents,
                        ps => ps.AssignedByAgentID,
                        a => a.AgentID,
                        (ps, a) => new
                        {
                            ps.PropertyID,
                            ps.Address,
                            ps.City,
                            ps.State,
                            ps.Pincode,
                            ps.OwnName,
                            ps.OwnEmail,
                            ps.Status, // Include Status
                            ps.AssignedAt,
                            ps.ServiceType,
                            ps.Vendor,
                            Agent = new { a.AgentID, a.Name, a.Email }
                        })
                    .ToListAsync();

                return Ok(new
                {
                    message = "All assigned properties retrieved successfully",
                    totalCount = allAssignedProperties.Count,
                    data = allAssignedProperties
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving assigned properties", error = ex.Message });
            }
        }

        [HttpPut("update-property-status/{propertyId}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> UpdatePropertyStatus(int propertyId, [FromBody] UpdatePropertyStatusRequest request)
        {
            try
            {
                // Define valid statuses
                var validStatuses = new List<string> { "New", "Cancelled", "Invoiced", "Paid" };
                if (!validStatuses.Contains(request.Status))
                {
                    return BadRequest(new { message = $"Invalid status. Valid statuses are: {string.Join(", ", validStatuses)}" });
                }

                var property = await _context.Properties
                    .FirstOrDefaultAsync(p => p.PropertyID == propertyId);

                if (property == null)
                {
                    return NotFound(new { message = "Property not found" });
                }

                // Update the status
                property.Status = request.Status;
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Property status updated successfully",
                    PropertyID = property.PropertyID,
                    NewStatus = property.Status
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error updating property status", error = ex.Message });
            }
        }

        // Request model for updating status
        public class UpdatePropertyStatusRequest
        {
            [Required]
            public string Status { get; set; }
        }

        // Replacing the original GetDashboard with the new dashboard-stats endpoint
        //[HttpGet("dashboard-stats")]
        //[Authorize(Roles = "admin")]
        //public async Task<IActionResult> GetDashboardStats()
        //{
        //    try
        //    {
        //        // Get all assignments
        //        var assignments = await _context.PropertyServices
        //            .Join(_context.Properties,
        //                ps => ps.PropertyID,
        //                p => p.PropertyID,
        //                (ps, p) => new
        //                {
        //                    p.PropertyID,
        //                    p.Address,
        //                    p.City,
        //                    p.State,
        //                    p.Pincode,
        //                    p.OwnName,
        //                    p.OwnEmail,
        //                    p.Status,
        //                    ps.ServiceID,
        //                    ps.VendorID,
        //                    ps.AssignedAt,
        //                    AssignedByAgentID = ps.AssignedByAgentID
        //                })
        //            .Join(_context.Services,
        //                ps => ps.ServiceID,
        //                s => s.ServiceID,
        //                (ps, s) => new
        //                {
        //                    ps.PropertyID,
        //                    ps.Address,
        //                    ps.City,
        //                    ps.State,
        //                    ps.Pincode,
        //                    ps.OwnName,
        //                    ps.Status,
        //                    ps.OwnEmail,
        //                    ps.AssignedAt,
        //                    ps.VendorID,
        //                    ServiceType = s.ServiceType,
        //                    ps.AssignedByAgentID
        //                })
        //            .Join(_context.Vendors,
        //                ps => ps.VendorID,
        //                v => v.VendorID,
        //                (ps, v) => new
        //                {
        //                    ps.PropertyID,
        //                    ps.Address,
        //                    ps.City,
        //                    ps.State,
        //                    ps.Pincode,
        //                    ps.OwnName,
        //                    ps.Status,
        //                    ps.OwnEmail,
        //                    ps.AssignedAt,
        //                    ps.ServiceType,
        //                    Vendor = new { v.VendorID, v.Name, v.Email },
        //                    ps.AssignedByAgentID
        //                })
        //            .Join(_context.Agents,
        //                ps => ps.AssignedByAgentID,
        //                a => a.AgentID,
        //                (ps, a) => new
        //                {
        //                    ps.PropertyID,
        //                    ps.Address,
        //                    ps.City,
        //                    ps.State,
        //                    ps.Pincode,
        //                    ps.OwnName,
        //                    ps.Status,
        //                    ps.OwnEmail,
        //                    ps.AssignedAt,
        //                    ps.ServiceType,
        //                    ps.Vendor,
        //                    Agent = new { a.AgentID, a.Name, a.Email }
        //                })
        //            .ToListAsync();

        //        // Get total counts of all registered entities
        //        var totalVendors = await _context.Vendors.CountAsync();
        //        var totalAgents = await _context.Agents.CountAsync();
        //        var totalServices = await _context.Services.CountAsync();

        //        // Calculate assignment-based statistics
        //        var totalAssignments = assignments.Count;
        //        var activeCities = assignments.Select(a => a.City).Distinct().ToList();
        //        var serviceTypes = await _context.Services
        //            .Select(s => s.ServiceType)
        //            .Distinct()
        //            .ToListAsync();


        //        var statusBreakdown = assignments
        //    .GroupBy(a => a.Status)
        //    .Select(g => new { Status = g.Key, Count = g.Count() })
        //    .ToList();

        //        // Get completed assignments count
        //        var completedAssignments = assignments.Count(a => a.AssignedAt < DateTime.UtcNow); // Assuming completed if assigned in past

        //        // Get 5 most recent assignments
        //        var recentAssignments = assignments
        //            .OrderByDescending(a => a.AssignedAt)
        //            .Take(5)
        //            .Select(a => new
        //            {
        //                a.PropertyID,
        //                a.Address,
        //                a.City,
        //                a.State,
        //                a.Pincode,
        //                a.OwnName,
        //                a.Status,
        //                a.OwnEmail,
        //                a.AssignedAt,
        //                a.ServiceType,
        //                Vendor = new { a.Vendor.VendorID, a.Vendor.Name, a.Vendor.Email },
        //                Agent = new { a.Agent.AgentID, a.Agent.Name, a.Agent.Email }
        //            })
        //            .ToList();

        //        var dashboardStats = new
        //        {
        //            totalAssignments,
        //            completedAssignments,
        //            totalVendors,
        //            totalAgents,
        //            totalServices, // Added total services
        //            activeCities,
        //            statusBreakdown,
        //            serviceTypes,
        //            recentAssignments
        //        };

        //        return Ok(new
        //        {
        //            message = "Dashboard statistics retrieved successfully",
        //            data = dashboardStats
        //        });
        //    }
        //    catch (Exception ex)
        //    {
        //        return StatusCode(500, new
        //        {
        //            message = "Error retrieving dashboard statistics",
        //            error = ex.Message
        //        });
        //    }
        //}

        [HttpGet("dashboard-stats")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetDashboardStats()
        {
            try
            {
                // Get all assignments, filtering out soft-deleted vendors and agents
                var assignments = await _context.PropertyServices
                    .Join(_context.Properties,
                        ps => ps.PropertyID,
                        p => p.PropertyID,
                        (ps, p) => new
                        {
                            p.PropertyID,
                            p.Address,
                            p.City,
                            p.State,
                            p.Pincode,
                            p.OwnName,
                            p.OwnEmail,
                            p.Status,
                            ps.ServiceID,
                            ps.VendorID,
                            ps.AssignedAt,
                            AssignedByAgentID = ps.AssignedByAgentID
                        })
                    .Join(_context.Services.Where(s => !s.IsDeleted), // Filter out deleted services
                        ps => ps.ServiceID,
                        s => s.ServiceID,
                        (ps, s) => new
                        {
                            ps.PropertyID,
                            ps.Address,
                            ps.City,
                            ps.State,
                            ps.Pincode,
                            ps.OwnName,
                            ps.Status,
                            ps.OwnEmail,
                            ps.AssignedAt,
                            ps.VendorID,
                            ServiceType = s.ServiceType,
                            ps.AssignedByAgentID
                        })
                    .Join(_context.Vendors.Where(v => !v.IsDeleted), // Filter out deleted vendors
                        ps => ps.VendorID,
                        v => v.VendorID,
                        (ps, v) => new
                        {
                            ps.PropertyID,
                            ps.Address,
                            ps.City,
                            ps.State,
                            ps.Pincode,
                            ps.OwnName,
                            ps.Status,
                            ps.OwnEmail,
                            ps.AssignedAt,
                            ps.ServiceType,
                            Vendor = new { v.VendorID, v.Name, v.Email },
                            ps.AssignedByAgentID
                        })
                    .Join(_context.Agents.Where(a => !a.IsDeleted), // Filter out deleted agents
                        ps => ps.AssignedByAgentID,
                        a => a.AgentID,
                        (ps, a) => new
                        {
                            ps.PropertyID,
                            ps.Address,
                            ps.City,
                            ps.State,
                            ps.Pincode,
                            ps.OwnName,
                            ps.Status,
                            ps.OwnEmail,
                            ps.AssignedAt,
                            ps.ServiceType,
                            ps.Vendor,
                            Agent = new { a.AgentID, a.Name, a.Email }
                        })
                    .ToListAsync();

                // Get total counts of active (non-deleted) entities
                var totalVendors = await _context.Vendors.CountAsync(v => !v.IsDeleted);
                var totalAgents = await _context.Agents.CountAsync(a => !a.IsDeleted);
                var totalServices = await _context.Services.CountAsync(s => !s.IsDeleted);

                // Calculate assignment-based statistics
                var totalAssignments = assignments.Count;
                var activeCities = assignments.Select(a => a.City).Distinct().ToList();
                var serviceTypes = await _context.Services
                    .Where(s => !s.IsDeleted) // Filter out deleted services
                    .Select(s => s.ServiceType)
                    .Distinct()
                    .ToListAsync();

                var statusBreakdown = assignments
                    .GroupBy(a => a.Status)
                    .Select(g => new { Status = g.Key, Count = g.Count() })
                    .ToList();

                // Get completed assignments count (assuming completed if assigned in the past)
                var completedAssignments = assignments.Count(a => a.AssignedAt < DateTime.UtcNow);

                // Get 5 most recent assignments
                var recentAssignments = assignments
                    .OrderByDescending(a => a.AssignedAt)
                    .Take(5)
                    .Select(a => new
                    {
                        a.PropertyID,
                        a.Address,
                        a.City,
                        a.State,
                        a.Pincode,
                        a.OwnName,
                        a.Status,
                        a.OwnEmail,
                        a.AssignedAt,
                        a.ServiceType,
                        Vendor = new { a.Vendor.VendorID, a.Vendor.Name, a.Vendor.Email },
                        Agent = new { a.Agent.AgentID, a.Agent.Name, a.Agent.Email }
                    })
                    .ToList();

                var dashboardStats = new
                {
                    totalAssignments,
                    completedAssignments,
                    totalVendors,
                    totalAgents,
                    totalServices,
                    activeCities,
                    statusBreakdown,
                    serviceTypes,
                    recentAssignments
                };

                return Ok(new
                {
                    message = "Dashboard statistics retrieved successfully",
                    data = dashboardStats
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Error retrieving dashboard statistics",
                    error = ex.Message
                });
            }
        }
        public class ServiceRequest
        {
            public string ServiceType { get; set; }
            public string Description { get; set; }
        }
        public class VendorRequest
        {
            public string Name { get; set; }
            public string Email { get; set; }
            public string PasswordHash { get; set; }
            public List<int> ServiceIds { get; set; }  // For multiple service selection
        }

        public class UpdateVendorRequest
        {
            public string Name { get; set; }
            public string Email { get; set; }
            public List<int> ServiceIds { get; set; }
        }

        // For Agent updates (without Password)
        public class UpdateAgentRequest
        {
            public string Name { get; set; }
            public string Email { get; set; }
        }

        public class Adminreg
        {
            public int AdminID { get; set; }
            [Required]
            public string Name { get; set; }
            [Required, EmailAddress]
            public string Email { get; set; }
            [Required]
            public string PasswordHash { get; set; }
            public DateTime CreatedAt { get; set; } = DateTime.Now;
        }
    }
}