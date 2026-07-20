namespace HR_System.Services
{
    public class BusinessValidationException : Exception
    {
        public BusinessValidationException(string message)
            : base(message)
        {
        }
    }
}