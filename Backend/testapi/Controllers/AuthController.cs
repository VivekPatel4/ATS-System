using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using testapi.Data;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Text;
using Google.Apis.Auth;
using Microsoft.Extensions.Logging;
using System.ComponentModel.DataAnnotations;

namespace testapi.Controllers
{
    [Route("api/auth")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly Testapi _context;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AuthController> _logger;

        public AuthController(
            Testapi context,
            IConfiguration configuration,
            ILogger<AuthController> logger)
        {
            _context = context;
            _configuration = configuration;
            _logger = logger;
        }

        [HttpGet("validate-token")]
        [Authorize] // Requires a valid JWT token
        public async Task<IActionResult> ValidateToken()
        {
            try
            {
                // Get the token from Authorization header
                var token = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
                if (string.IsNullOrEmpty(token))
                {
                    _logger.LogWarning("Validate token attempt with no token provided");
                    return Unauthorized(new { message = "No token provided" });
                }

                _logger.LogInformation("Validating token");

                // Get user claims from the current principal
                var userEmail = User.FindFirst(ClaimTypes.Email)?.Value;
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
                var userName = User.FindFirst(ClaimTypes.Name)?.Value;

                if (string.IsNullOrEmpty(userEmail) || string.IsNullOrEmpty(userRole))
                {
                    _logger.LogWarning("Token missing required claims");
                    return Unauthorized(new { message = "Invalid token claims" });
                }

                // Verify user exists based on role
                object user = null;
                switch (userRole.ToLower())
                {
                    case "admin":
                        user = await _context.Admins.FirstOrDefaultAsync(a => a.Email == userEmail);
                        break;
                    case "vendor":
                        user = await _context.Vendors.FirstOrDefaultAsync(v => v.Email == userEmail);
                        break;
                    default:
                        _logger.LogWarning("Unknown role in token: {Role}", userRole);
                        return Unauthorized(new { message = "Invalid user role" });
                }

                if (user == null)
                {
                    _logger.LogWarning("User not found for email: {Email}", userEmail);
                    return Unauthorized(new { message = "User not found" });
                }

                _logger.LogInformation("Token validated successfully for {Email}", userEmail);

                return Ok(new
                {
                    Name = userName,
                    Email = userEmail,
                    Role = userRole,
                    ExpireIn = GetTokenExpiration(token)
                });
            }
            catch (SecurityTokenException ex)
            {
                _logger.LogWarning("Invalid or expired token: {Error}", ex.Message);
                return Unauthorized(new { message = "Invalid or expired token" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating token");
                return StatusCode(500, new
                {
                    message = "Error validating token",
                    error = ex.Message
                });
            }
        }

        private DateTime? GetTokenExpiration(string token)
        {
            try
            {
                var handler = new JwtSecurityTokenHandler();
                var jwtToken = handler.ReadJwtToken(token);
                return jwtToken.ValidTo;
            }
            catch
            {
                return null;
            }
        }

        [HttpPost("admin/google-login")]
        [AllowAnonymous]
        public async Task<IActionResult> GoogleLoginAdmin([FromBody] GoogleLoginRequest request)
        {
            try
            {
                if (string.IsNullOrEmpty(request.Credential))
                {
                    _logger.LogWarning("Google login attempt with empty credential for admin");
                    return BadRequest(new { message = "Google credential is required" });
                }

                _logger.LogInformation("Attempting Google login for admin");

                var payload = await ValidateGoogleToken(request.Credential);
                if (payload == null)
                {
                    _logger.LogWarning("Google token validation failed for admin");
                    return BadRequest(new { message = "Invalid or expired Google token" });
                }

                _logger.LogInformation("Google token validated successfully for email: {Email}", payload.Email);

                var admin = await _context.Admins
                    .FirstOrDefaultAsync(a => a.Email == payload.Email);

                if (admin == null)
                {
                    _logger.LogWarning("No admin found with email: {Email}", payload.Email);
                    return Unauthorized(new { message = "No admin account found with this email" });
                }

                var token = GenerateJwtToken(admin.Email, "admin", admin.Name);

                _logger.LogInformation("Admin login successful for: {Email}", admin.Email);

                return Ok(new
                {
                    AccessToken = token,
                    Name = admin.Name,
                    Email = admin.Email,
                    Role = "Admin",
                    ExpireIn = DateTime.UtcNow.AddMinutes(60)
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during admin Google login");
                return StatusCode(500, new
                {
                    message = "Error during Google login",
                    error = ex.Message
                });
            }
        }

        [HttpPost("vendor/google-login")]
        [AllowAnonymous]
        public async Task<IActionResult> GoogleLoginVendor([FromBody] GoogleLoginRequest request)
        {
            try
            {
                if (string.IsNullOrEmpty(request.Credential))
                {
                    _logger.LogWarning("Google login attempt with empty credential for vendor");
                    return BadRequest(new { message = "Google credential is required" });
                }

                _logger.LogInformation("Attempting Google login for vendor");

                var payload = await ValidateGoogleToken(request.Credential);
                if (payload == null)
                {
                    _logger.LogWarning("Google token validation failed for vendor");
                    return BadRequest(new { message = "Invalid or expired Google token" });
                }

                _logger.LogInformation("Google token validated successfully for email: {Email}", payload.Email);

                var vendor = await _context.Vendors
                    .FirstOrDefaultAsync(v => v.Email == payload.Email);

                if (vendor == null)
                {
                    _logger.LogWarning("No vendor found with email: {Email}", payload.Email);
                    return Unauthorized(new { message = "No vendor account found with this email" });
                }

                var token = GenerateJwtToken(vendor.Email, "vendor", vendor.Name);

                _logger.LogInformation("Vendor login successful for: {Email}", vendor.Email);

                return Ok(new
                {
                    AccessToken = token,
                    Name = vendor.Name,
                    Email = vendor.Email,
                    Role = "Vendor",
                    ExpireIn = DateTime.UtcNow.AddMinutes(60)
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during vendor Google login");
                return StatusCode(500, new
                {
                    message = "Error during Google login",
                    error = ex.Message
                });
            }
        }

        [HttpPost("agent/google-login")]
        [AllowAnonymous]
        public async Task<IActionResult> GoogleLoginAgent([FromBody] GoogleLoginRequest request)
        {
            try
            {
                if (string.IsNullOrEmpty(request.Credential))
                {
                    _logger.LogWarning("Google login attempt with empty credential for vendor");
                    return BadRequest(new { message = "Google credential is required" });
                }

                _logger.LogInformation("Attempting Google login for vendor");

                var payload = await ValidateGoogleToken(request.Credential);
                if (payload == null)
                {
                    _logger.LogWarning("Google token validation failed for vendor");
                    return BadRequest(new { message = "Invalid or expired Google token" });
                }

                _logger.LogInformation("Google token validated successfully for email: {Email}", payload.Email);

                var agent = await _context.Agents
                    .FirstOrDefaultAsync(v => v.Email == payload.Email);

                if (agent == null)
                {
                    _logger.LogWarning("No vendor found with email: {Email}", payload.Email);
                    return Unauthorized(new { message = "No vendor account found with this email" });
                }

                var token = GenerateJwtToken(agent.Email, "vendor", agent.Name);

                _logger.LogInformation("Vendor login successful for: {Email}", agent.Email);

                return Ok(new
                {
                    AccessToken = token,
                    Name = agent.Name,
                    Email = agent.Email,
                    Role = "Agent",
                    ExpireIn = DateTime.UtcNow.AddMinutes(60)
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during vendor Google login");
                return StatusCode(500, new
                {
                    message = "Error during Google login",
                    error = ex.Message
                });
            }
        }
        private async Task<GoogleJsonWebSignature.Payload> ValidateGoogleToken(string token)
        {
            try
            {
                var clientId = _configuration["Google:ClientId"];
                if (string.IsNullOrEmpty(clientId))
                {
                    _logger.LogError("Google Client ID is not configured in appsettings.json");
                    throw new InvalidOperationException("Google Client ID is not configured");
                }

                var settings = new GoogleJsonWebSignature.ValidationSettings
                {
                    Audience = new[] { clientId },
                    ForceGoogleCertRefresh = true
                };

                var payload = await GoogleJsonWebSignature.ValidateAsync(token, settings);

                if (!payload.EmailVerified)
                {
                    _logger.LogWarning("Google token email not verified");
                    return null;
                }

                return payload;
            }
            catch (InvalidJwtException ex)
            {
                _logger.LogWarning("Invalid Google JWT token: {Error}", ex.Message);
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating Google token");
                return null;
            }
        }

        private string GenerateJwtToken(string email, string role, string name)
        {
            var claims = new[]
            {
                new Claim(ClaimTypes.Email, email),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(ClaimTypes.Role, role),
                new Claim(ClaimTypes.Name, name)
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.Now.AddMinutes(60),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public class GoogleLoginRequest
        {
            [Required]
            public string Credential { get; set; }
        }

        public class LoginRequest
        {
            [Required, EmailAddress]
            public string Email { get; set; }
            [Required]
            public string Password { get; set; }
        }
    }
}