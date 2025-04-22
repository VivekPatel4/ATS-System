using MimeKit;
using MailKit.Net.Smtp;

namespace testapi.Services
{
    public class EmailService
    {
        private readonly IConfiguration _config;

        public EmailService(IConfiguration config)
        {
            _config = config;
        }

        public async Task SendInvitationEmail(string email, string role)
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress("Admin", _config["EmailSettings:SenderEmail"]));
            message.To.Add(new MailboxAddress("", email));
            message.Subject = "Invitation to Join as " + role;

            message.Body = new TextPart("plain")
            {
                Text = $"Hello,\n\nYou have been added as a {role} in the system. Please login at: https://yourapp.com/login\n\nThank You."
            };

            using var client = new SmtpClient();
            await client.ConnectAsync(_config["EmailSettings:SmtpServer"], 587, false);
            await client.AuthenticateAsync(_config["EmailSettings:SmtpUsername"], _config["EmailSettings:SmtpPassword"]);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);
        }
    }
}