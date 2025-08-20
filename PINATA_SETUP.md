# Pinata IPFS Setup Guide

This guide will help you set up Pinata for document storage in your Fort Worth DAO platform.

## 1. Create a Pinata Account

1. Go to [pinata.cloud](https://pinata.cloud)
2. Sign up for a free account
3. Complete email verification

## 2. Generate API Keys

1. Log in to your Pinata dashboard
2. Navigate to the **Keys** page (or visit [app.pinata.cloud/developers/api-keys](https://app.pinata.cloud/developers/api-keys))
3. Click **"New Key"** button in the top right
4. For development, select **Admin** privileges (you can scope this down later)
5. Give your key a name (e.g., "FW DAO Documents")
6. Click **"Create Key"**
7. **IMPORTANT**: Copy the JWT token immediately - it's only shown once!

## 3. Get Your Gateway URL

1. In your Pinata dashboard, go to **Gateways** (or visit [app.pinata.cloud/gateways](https://app.pinata.cloud/gateways))
2. You'll see your automatically generated gateway domain
3. It will look like: `aquamarine-casual-tarantula-177.mypinata.cloud`
4. Copy this domain (without https://)

## 4. Configure Environment Variables

Add these variables to your `.env.local` file:

```bash
# Pinata IPFS Configuration
PINATA_JWT=your_jwt_token_here
NEXT_PUBLIC_GATEWAY_URL=your-gateway-domain.mypinata.cloud
```

### Example:
```bash
PINATA_JWT=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiIxMjM0NTY3OC05YWJjLWRlZi0...
NEXT_PUBLIC_GATEWAY_URL=aquamarine-casual-tarantula-177.mypinata.cloud
```

## 5. Test Your Configuration

1. Restart your development server: `npm run dev`
2. Navigate to `/documents` in your application
3. Try uploading a test file using either:
   - Drag and drop a file onto the page
   - Click "Upload Document" and select a file
4. Fill out the document metadata (name, description, category, tags)
5. Click "Upload Document"
6. If you see authentication errors, double-check your JWT token

### Upload Process
The system now uses a **server-side upload approach**:
- Files are converted to base64 on the client
- Sent securely to `/api/documents/server-upload`
- Server handles Pinata upload and database storage
- No client-side Pinata SDK required

## 6. Verify Upload

1. After a successful upload, go to your Pinata dashboard
2. Check the **Files** section to see your uploaded documents
3. Documents should appear in the "Private" network by default

## Troubleshooting

### "Authentication Failed" Error
- Verify your `PINATA_JWT` is correct and hasn't expired
- Make sure there are no extra spaces or quotes around the JWT
- Regenerate your API key if needed

### "Gateway not found" Error
- Check your `NEXT_PUBLIC_GATEWAY_URL` format
- Don't include `https://` in the gateway URL
- The format should be: `your-domain.mypinata.cloud`

### Files not appearing
- Check the Pinata dashboard under Files > Private
- Verify your API key has the necessary permissions
- Look at the browser network tab for detailed error messages

## Security Notes

- Keep your JWT token secure and never commit it to version control
- For production, consider using scoped API keys with minimal permissions
- Private files are only accessible with proper authentication
- Consider implementing access controls based on your DAO membership

## Next Steps

Once Pinata is configured:
1. Test document uploads and downloads
2. Configure categories and metadata as needed
3. Set up any custom access controls
4. Monitor usage and storage limits

For more advanced configuration, see the [Pinata documentation](https://docs.pinata.cloud).