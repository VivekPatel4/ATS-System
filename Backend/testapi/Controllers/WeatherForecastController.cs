using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;

namespace testapi.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class WeatherForecastController(IConfiguration configuration) : ControllerBase
    {
        

        [HttpGet]
        public IEnumerable<String> Get()
        {
            var claims = new[]
            {
                new Claim(ClaimTypes.Name, "vivek.patel"),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(ClaimTypes.Role, "admin")
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(configuration["Jwt:Key"]));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: configuration["Jwt:Issuer"],
                audience: configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.Now.AddMinutes(60),
                signingCredentials: creds
                );

            return new string[] { new JwtSecurityTokenHandler().WriteToken(token) };
        }

        [HttpGet("{id}")]
        [Authorize(Roles = "admin")]
        public string Get(int id)
        {
            return "value";
        }
    }
}
