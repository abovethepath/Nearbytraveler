@echo off
echo Creating .env file for Nearby Traveler...
echo.

echo # Production Environment Configuration > .env
echo # Database Configuration >> .env
echo DATABASE_URL=postgresql://neondb_owner:npg_uWU3fisHqz7y@ep-rough-resonance-adddiumz.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require >> .env
echo. >> .env
echo # AI Services (you'll need to add your own API keys) >> .env
echo OPENAI_API_KEY=your_openai_api_key_here >> .env
echo ANTHROPIC_API_KEY=your_anthropic_api_key_here >> .env
echo PERPLEXITY_API_KEY=your_perplexity_api_key_here >> .env
echo. >> .env
echo # Email Services (you'll need to add your own API key) >> .env
echo SENDGRID_API_KEY=your_sendgrid_api_key_here >> .env
echo. >> .env
echo # Weather API (you'll need to add your own API key) >> .env
echo WEATHER_API_KEY=your_weather_api_key_here >> .env
echo. >> .env
echo # Security >> .env
echo SESSION_SECRET=your_very_long_random_session_secret_here >> .env
echo NODE_ENV=development >> .env
echo. >> .env
echo # Business Features >> .env
echo BUSINESS_MONTHLY_PRICE_CENTS=4900 >> .env
echo. >> .env
echo # Server Configuration >> .env
echo PORT=5000 >> .env
echo. >> .env
echo # Optional: Facebook Auth (if using) >> .env
echo VITE_FACEBOOK_APP_ID=your_facebook_app_id_here >> .env
echo. >> .env
echo # Optional: Stripe (if using payments) >> .env
echo STRIPE_SECRET_KEY=your_stripe_secret_key_here >> .env
echo STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here >> .env
echo. >> .env
echo # Optional: Webhook URLs >> .env
echo WEBHOOK_URL=your_webhook_url_here >> .env

echo.
echo .env file created successfully!
echo.
echo IMPORTANT: You need to edit the .env file and replace the "your_*_here" values with your actual API keys.
echo.
echo The DATABASE_URL is already correct with your Neon database.
echo.
echo After editing, you can run: npm run dev
echo.
pause
