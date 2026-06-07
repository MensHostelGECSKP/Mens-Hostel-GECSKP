// Helper script to get Google Drive API Refresh Token
const readline = require('readline');
const { google } = require('googleapis');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log('================================================================');
console.log('Google Drive API Refresh Token Generator');
console.log('================================================================');
console.log('Instructions:');
console.log('1. Go to Google Cloud Console (https://console.cloud.google.com)');
console.log('2. Create a Project, enable "Google Drive API"');
console.log('3. Configure OAuth Consent Screen (External/Internal, add your email)');
console.log('4. Create Credentials -> OAuth Client ID (Web Application or Desktop)');
console.log('   - For Desktop: Redirect URIs are automatically handled.');
console.log('   - For Web App: Add "https://developers.google.com/oauthplayground"');
console.log('     as Authorized Redirect URI.');
console.log('================================================================\n');

rl.question('Enter Client ID: ', (clientId) => {
  rl.question('Enter Client Secret: ', (clientSecret) => {
    rl.question('Enter Redirect URI (default: https://developers.google.com/oauthplayground): ', (redirectUriInput) => {
      const redirectUri = redirectUriInput.trim() || 'https://developers.google.com/oauthplayground';
      
      const oauth2Client = new google.auth.OAuth2(
        clientId.trim(),
        clientSecret.trim(),
        redirectUri
      );

      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/drive'],
        prompt: 'consent', // Forces refresh token generation
      });

      console.log('\n----------------------------------------------------------------');
      console.log('1. Open this URL in your browser to authorize access:');
      console.log(authUrl);
      console.log('----------------------------------------------------------------\n');

      rl.question('2. Enter the Authorization Code (from the browser/redirect page): ', async (rawCode) => {
        try {
          let code = rawCode.trim();

          // Handle if user pasted the full redirect URL containing '?code='
          if (code.includes('code=')) {
            const searchPart = code.includes('?') ? code.split('?')[1] : code;
            const params = new URLSearchParams(searchPart);
            code = params.get('code') || code;
          }

          // Decode URI component (e.g., %2F to /)
          code = decodeURIComponent(code);

          // Strip any trailing parameters if they were pasted raw
          if (code.includes('&')) {
            code = code.split('&')[0];
          }

          const { tokens } = await oauth2Client.getToken(code);
          console.log('\n================================================================');
          console.log('SUCCESS! Add these variables to your backend `.env` file:');
          console.log('================================================================');
          console.log(`MESS_BILL_STORAGE_PROVIDER=google-drive`);
          console.log(`GOOGLE_CLIENT_ID=${clientId.trim()}`);
          console.log(`GOOGLE_CLIENT_SECRET=${clientSecret.trim()}`);
          console.log(`GOOGLE_REDIRECT_URI=${redirectUri}`);
          console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
          console.log('================================================================');
          if (!tokens.refresh_token) {
            console.log('\nWARNING: Refresh token was not returned. This happens if authorization was already granted.');
            console.log('Please remove the app from your Google account permissions and run this script again.');
          }
        } catch (err) {
          console.error('\nError exchanging code for token:', err.message);
        } finally {
          rl.close();
        }
      });
    });
  });
});
