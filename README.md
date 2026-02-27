# Urban Lead Listener Backend

A lightweight Express backend that receives lead submissions, stores them in Supabase, and sends instant Gmail alerts.

## Endpoint
POST /listener

## Environment Variables
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- GMAIL_USER
- GMAIL_APP_PASSWORD
- ALERT_EMAIL

## Start
npm install  
npm start
