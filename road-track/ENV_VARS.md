# RoadTrack Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `BLOB_READ_WRITE_TOKEN` | Yes | Vercel Blob storage token for image uploads. Get from Vercel Dashboard > Storage > Blob |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Yes | VAPID public key for push notifications. Generate with: `npx web-push generate-vapid-keys` |
| `VAPID_PRIVATE_KEY` | Yes | VAPID private key for push notifications (server-side only, do NOT prefix with NEXT_PUBLIC_) |

## Getting the values

### BLOB_READ_WRITE_TOKEN
1. Go to https://vercel.com/dashboard
2. Click your project > Storage > Blob
3. Create a store or use existing
4. Copy the token from the "Connect" section

### VAPID Keys
Run this command to generate keys:
```bash
npx web-push generate-vapid-keys
```

Output will give you:
- Public Key → `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- Private Key → `VAPID_PRIVATE_KEY`

## Example .env.local

```
BLOB_READ_WRITE_TOKEN=vercel_blob_xxxxx
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BP4jiuuj0ByuR-ybDkyASTsl-NGrctGma5L4Fi6y2eUZqHg27CGjmyoWVeNCi8umpQJ7IV8XQyMxc_SFCtEdxDc
VAPID_PRIVATE_KEY=vKyzjkmJ5E1B-o9EIIC0Wl0xMWGg-hvTaYDPY-dPv7M
```

> **Note:** Only `NEXT_PUBLIC_VAPID_PUBLIC_KEY` should have the `NEXT_PUBLIC_` prefix. The private key and blob token must stay server-side.