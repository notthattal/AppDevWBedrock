## Security Documentation

### API Key Management

- API keys are stored using environment variables
- They are never hardcoded anywhere

### Input Validation

- Input from users is sent as-is, but schema enforcement ensures only valid structured output is processed.
- Model is instructed via system prompt to always return a strict format.

### Data Handling

- User data is securely managed by AWS Cognito
- Data is never posted publicly on github and remains secured through the Amazon ecosystem

### Safety Filters

- OpenAI configures gpt to return safe responses
- AWS Bedrock calls are screened for toxic responses
- AWS Cloudwatch is used to monitor AWS Cognito
- All user interactions that interact with bedrock are logged and monitored

