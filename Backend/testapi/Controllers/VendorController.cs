using System.IdentityModel.Tokens.Jwt;
using System.Net.Mail;
using System.Net;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.IdentityModel.Tokens;
using testapi.Data;
using testapi.models;


namespace testapi.Controllers
{
    [Route("api/vendor")]
    [ApiController]

    public class VendorController : ControllerBase
    {
        private readonly Testapi _context;
        private readonly IConfiguration _config;
        private readonly IMemoryCache _memoryCache;

        public VendorController(Testapi context, IConfiguration config, IMemoryCache memoryCache)
        {
            _context = context;
            _config = config;
            _memoryCache = memoryCache;
        }

        // ✅ 1️⃣ Vendor Login (JWT-based authentication)
        [AllowAnonymous]
        [HttpPost("login")]
        public IActionResult VendorLogin([FromBody] LoginRequest request)
        {
            var vendor = _context.Vendors.FirstOrDefault(v => v.Email == request.Email);

            if (vendor == null || !BCrypt.Net.BCrypt.Verify(request.Password, vendor.PasswordHash))
            {
                return Unauthorized(new { message = "Invalid credentials" });
            }

            // Create claims for the token
            var claims = new[]
            {
             new Claim(ClaimTypes.Email, vendor.Email),
             new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
             new Claim(ClaimTypes.Role, "Vendor")
            };

            // Create the signing key and credentials
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            // Create the JWT token
            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.Now.AddMinutes(60),
                signingCredentials: creds
            );

            // Serialize the token to a string
            var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

            // Return the token and other details
            return Ok(new
            {
                name=vendor.Name,
                Token = tokenString, // Use tokenString instead of token
                Email = vendor.Email,
                Role = "Vendor",
                ExpireIn = DateTime.UtcNow.AddMinutes(60) // Token expiration time
            });
        }

        // ✅ 1️⃣ Vendor Login With Email & Send OTP
        [AllowAnonymous]
        [HttpPost("login-with-otp")]
        public IActionResult VendorLoginWithOTP([FromBody] LoginWithOTPRequest request)
        {
            // ✅ Check if email exists in Vendor Table
            var vendor = _context.Vendors.FirstOrDefault(v => v.Email == request.Email);
            if (vendor == null)
            {
                return BadRequest(new { message = "Please contact admin" });
            }

            // ✅ Generate Random 6-Digit OTP
            Random random = new Random();
            int otp = random.Next(100000, 999999);

            // ✅ Save OTP in MemoryCache for 5 Minutes
            _memoryCache.Set(request.Email, otp, TimeSpan.FromMinutes(5));

            // ✅ Send OTP to Vendor Email
            SendOTPEmail(request.Email, otp);

            return Ok(new { message = "OTP has been sent to your email." });
        }


        // ✅ 1️⃣ Verify OTP
        [AllowAnonymous]
        [HttpPost("verify-otp")]
        public IActionResult VerifyOTP([FromBody] VerifyOTPRequest request)
        {
            // ✅ Check if OTP exists in MemoryCache
            if (!_memoryCache.TryGetValue(request.Email, out int cachedOTP))
            {
                return BadRequest(new { message = "OTP expired or invalid" });
            }

            // ✅ Compare OTP
            if (cachedOTP != request.OTP)
            {
                return Unauthorized(new { message = "Invalid OTP" });
            }

            // ✅ OTP Verified, remove from cache
            _memoryCache.Remove(request.Email);

            // ✅ Find Vendor by Email
            var vendor = _context.Vendors.FirstOrDefault(v => v.Email == request.Email);
            if (vendor == null)
            {
                return Unauthorized(new { message = "Vendor not found" });
            }

            // ✅ Create claims for JWT
            var claims = new[]
            {
        new Claim(ClaimTypes.Email, vendor.Email),
        new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        new Claim(ClaimTypes.Role, "Vendor")
    };

            // ✅ Generate JWT Token
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

            // ✅ Return success response with token
            return Ok(new
            {
                name=vendor.Name,
                Token = tokenString,
                Email = vendor.Email,
                Role = "Vendor",
                ExpireIn = DateTime.UtcNow.AddMinutes(60)
            });
        }


        // ✅ 2️⃣ View Assigned Properties & Agents
        [HttpGet("assigned-properties")]
        [Authorize(Roles = "Vendor")]
        public IActionResult GetAssignedProperties()
        {
            var vendorEmail = User.FindFirst(ClaimTypes.Email)?.Value;
            var vendor = _context.Vendors.FirstOrDefault(v => v.Email == vendorEmail);

            if (vendor == null)
            {
                return Unauthorized(new { message = "Unauthorized Vendor" });
            }

            var assignedProperties = _context.PropertyServices
                .Where(ps => ps.VendorID == vendor.VendorID)
                .Join(_context.Properties, ps => ps.PropertyID, p => p.PropertyID, (ps, p) => new
                {
                    p.PropertyID,
                    p.Address,
                    p.City,
                    p.State,
                    p.Pincode,
                    p.OwnName,
                    p.OwnEmail,
                    ps.ServiceID,
                    ps.AssignedAt,
                    Agent = _context.Agents.Where(a => a.AgentID == ps.AssignedByAgentID)
                                           .Select(a => new { a.AgentID, a.Name, a.Email })
                                           .FirstOrDefault()
                })
                .Join(_context.Services, ps => ps.ServiceID, s => s.ServiceID, (ps, s) => new
                {
                    ps.PropertyID,
                    ps.Address,
                    ps.City,
                    ps.State,
                    ps.Pincode,
                    ps.OwnName,
                    ps.OwnEmail,
                    ps.AssignedAt,
                    ServiceType = s.ServiceType,
                    ps.Agent
                })
                .ToList();

            return Ok(assignedProperties);
        }

        private void SendOTPEmail(string email, int otp)
        {
            // ✅ Create the SMTP client
            var smtpClient = new SmtpClient(_config["EmailSettings:SmtpServer"])
            {
                Port = 587,
                Credentials = new NetworkCredential(
                    _config["EmailSettings:SmtpUsername"],
                    _config["EmailSettings:SmtpPassword"]
                ),
                EnableSsl = true,
            };

            // ✅ Create the email message
            var mailMessage = new MailMessage
            {
                From = new MailAddress(_config["EmailSettings:SenderEmail"], "Real Estate System"),
                Subject = "Your OTP Code for Login",
                Body = $@"
                          <h2>Login OTP Code</h2>
                          <p>Your One-Time Password (OTP) is:</p>
                          <h1><strong>{otp}</strong></h1>
                          <p>Please enter this code to verify your login.</p>
                        <br/>
                          <p>Regards,<br/><strong>Real Estate Management</strong></p>",
                IsBodyHtml = true,
            };

            // ✅ Add recipient email
            mailMessage.To.Add(email);

            // ✅ Send the email
            smtpClient.Send(mailMessage);
        }
        public class LoginWithOTPRequest
        {
            public string Email { get; set; }
        }

        public class VerifyOTPRequest
        {
            public string Email { get; set; }
            public int OTP { get; set; }
        }
    }
}
