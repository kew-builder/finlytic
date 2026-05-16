using Finlytic.Domain.Entities;

namespace Finlytic.Application.Common.Interfaces;

public interface ITokenService
{
    string GenerateAccessToken(User user);
    string GenerateRefreshToken();
}
