# Surprise Fashion Sphere

Nigerian fashion shop for bags, footwear, headwear, autogele, clothing and accessories.

## Colours

- Warm cream `#F7F0E6` — page background
- Deep wine `#762D46` — headings, buttons, navigation accent, footer
- Terracotta `#C98261` — small accents

The homepage follows `homepage-reference.png` in the project root. Live shop photographs are in `frontend/public/images/`.

## Run it locally

From this folder, install once:

```bash
npm install
npm install --prefix backend
npm install --prefix frontend
```

Copy `backend/.env.example` to `backend/.env` if you do not already have one.

Set `MONGO_URI` to your MongoDB connection string. The API can start without MongoDB, but catalogue data then comes from a temporary seed fallback. Newsletter signup and the contact form only save when MongoDB is connected.

Start both apps:

```bash
npm run dev
```

- Shop: http://localhost:5174
- API health: http://localhost:5050/api/health
- Homepage data: http://localhost:5050/api/homepage

Ports 5000 and 5173 may already be used by other local projects, so this shop uses **5050** and **5174**.

## Deploy on Vercel

The live shopfront is at `https://surprisesphere.vercel.app`.

This repo supports both Vercel Root Directory settings:

- **Root Directory = `frontend`** (current live setup): uses `frontend/vercel.json` and `frontend/api/index.js`.
- **Root Directory = repository root**: uses the root `vercel.json` and `api/index.js`.

In Vercel Environment Variables set when ready:

- `CLIENT_URL=https://surprisesphere.vercel.app,http://localhost:5174`
- `MONGO_URI` for MongoDB Atlas
- `NODE_ENV=production`

Leave `VITE_API_URL` empty so the browser calls same-origin `/api/...`.

Until MongoDB is connected, the API serves the temporary seed catalogue so the homepage and listing pages can load.

### Backend only

```bash
cd backend
npm run dev
```

### Seed MongoDB catalogue

With MongoDB running and `MONGO_URI` set:

```bash
cd backend
npm run seed
```

## API overview

- `GET /api/health`
- `GET /api/homepage`
- `GET /api/homepage/banners`
- `GET /api/homepage/featured-products`
- `GET /api/homepage/featured-categories`
- `GET /api/products`
- `GET /api/products/best-sellers`
- `GET /api/products/new-arrivals`
- `GET /api/products/featured`
- `GET /api/products/:idOrSlug`
- `GET /api/categories`
- `GET /api/categories/:slugOrId`
- `GET /api/categories/:slugOrId/products`

Frontend aliases still work:

- `/api/collections/best-sellers`
- `/api/collections/new-arrivals`
- `/api/shop`
- `/api/shop/:slug`

Listing endpoints use pagination with no fixed total product quota.

## Still needed from the business

- Working MongoDB connection (`MONGO_URI`)
- WhatsApp and TikTok URLs (`frontend/.env`)
- Public phone, email and address
- Paystack, Cloudinary and JWT secrets when those stages start

Do not put real secrets in the frontend.
