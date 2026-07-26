namespace HR_System.Services
{
    public class BusinessValidationException : Exception
    {
        public int? AffectedCount { get; }

        public BusinessValidationException(string message)
            : base(message)
        {
        }

        public BusinessValidationException(string message, int affectedCount)
            : base(message)
        {
            AffectedCount = affectedCount;
        }
    }
}