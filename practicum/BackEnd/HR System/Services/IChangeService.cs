using HR_System.Models;

namespace HR_System.Services
{
    public interface IChangeService
    {
        Task<List<Change>> GetChangesBySystemIdAsync(string systemId);
        Task CreateChangeAsync(Change change);
    }
}