# 🏍️ TerraRider — trylinqr

A full-stack **Next.js 14 (App Router)** monorepo for an adventure-gear e-commerce store + event registration portal.
Frontend + backend live in a single Next.js app — pages under `src/app/*`, API routes under `src/app/api/*`.

---

## 🧱 Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 14 (App Router) |
| Frontend | React 18, Tailwind CSS, Framer Motion, react-hot-toast |
| State | Redux Toolkit + RTK Query |
| Backend | Next.js Route Handlers (Node runtime) |
| Database | MongoDB + Mongoose |
| Auth | JWT (httpOnly cookies) + bcrypt |
| Tickets | qrcode (server-generated QR for event tickets) |

---

## 🚀 Getting started

```bash
cd trylinqr

# 1. install
npm install

# 2. seed sample data (categories, products, events, demo users)
npm run seed

# 3. run dev server
npm run dev    # http://localhost:3000  (auto-falls back to :3001 if taken)
```

### Demo accounts (from seed)
| Role | Email | Password |
|---|---|---|
| Admin | `admin@trylinqr.com` | `admin123` |
| User | `rider@trylinqr.com` | `user12345` |

---

## 🗂️ Project structure

```
trylinqr/
├── package.json
├── next.config.js
├── tailwind.config.js
├── .env.local                 # MongoDB URI, JWT secrets
├── scripts/seed.js            # `npm run seed`
└── src/
    ├── app/
    │   ├── layout.jsx         # Root layout + Redux provider
    │   ├── globals.css
    │   ├── (public)/          # Storefront layout group
    │   │   ├── page.jsx       # Home
    │   │   ├── shop/page.jsx
    │   │   ├── shop/[slug]/page.jsx
    │   │   ├── cart/page.jsx
    │   │   ├── checkout/page.jsx
    │   │   ├── events/page.jsx
    │   │   ├── events/[slug]/page.jsx
    │   │   ├── about/page.jsx
    │   │   └── contact/page.jsx
    │   ├── (auth)/login + register
    │   ├── dashboard/         # User dashboard (orders, tickets)
    │   ├── admin/             # Admin panel (gated by role)
    │   └── api/               # All REST endpoints
    ├── components/
    │   ├── common/ (Navbar, Footer)
    │   ├── shop/ (ProductCard)
    │   ├── events/ (EventCard)
    │   └── admin/ (Sidebar)
    ├── lib/
    │   ├── db.js              # Cached Mongoose connection
    │   ├── auth.js            # JWT helpers + cookie helpers
    │   ├── apiUtils.js
    │   ├── qr.js
    │   └── models/            # User, Product, Category, Order, Event, Registration, Review
    └── store/
        ├── index.js           # configureStore
        ├── api.js             # RTK Query endpoints
        ├── cartSlice.js       # localStorage-persisted cart
        └── Provider.jsx
```

---

## 🛣️ API Routes

| Method | Path | Auth |
|---|---|---|
| GET | `/api/health` | public |
| POST | `/api/auth/register` | public |
| POST | `/api/auth/login` | public |
| POST | `/api/auth/logout` | public |
| GET | `/api/auth/me` | optional |
| POST | `/api/auth/refresh` | refresh cookie |
| GET / POST | `/api/products` | public / admin |
| GET / PUT / DELETE | `/api/products/[slug]` | public / admin / admin |
| GET / POST | `/api/categories` | public / admin |
| GET / POST | `/api/events` | public / admin |
| GET / PUT / DELETE | `/api/events/[slug]` | public / admin / admin |
| POST | `/api/registrations` | optional (works for guests) |
| GET | `/api/registrations/my` | user |
| GET / PUT / DELETE | `/api/registrations/[id]` | user (own) / admin |
| POST | `/api/orders` | user |
| GET | `/api/orders/my` | user |
| GET / PUT | `/api/orders/[id]` | user(own)/admin |
| GET | `/api/orders` | admin |
| GET | `/api/admin/stats` | admin |
| GET | `/api/admin/users` | admin |
| PUT / DELETE | `/api/admin/users/[id]` | admin |
| GET / POST | `/api/reviews` | public / user |

---

## 🛍️ Feature highlights

**E-Commerce**
- Product catalogue with text search, category/price filters, sort
- Product detail with image gallery, sizes, specifications, ratings
- Cart with `localStorage` persistence + Redux sync
- Checkout with shipping address + COD / Razorpay (stub) payment
- Order tracking with status timeline

**Events**
- 3 registration types: **Individual**, **Group**, **Visitor** — each with tailored form fields
- Dynamic group-size handling that requests member info inline
- Server-generated **QR code tickets** (base64 PNG, embedded in `Registration.qrCode`)
- "My Tickets" page renders the QR for entry scanning

**Admin panel**
- Stats dashboard (revenue, low-stock alerts, recent orders)
- Product CRUD + on-the-fly category creation
- Event CRUD (capacity/pricing per registration type)
- Orders list with inline status updates
- Registrations list per event
- Users list with role + ban toggle

**Auth & security**
- JWT access token (15m) + refresh token (7d) — httpOnly, sameSite=lax cookies
- bcrypt password hashing
- Role middleware: `user` / `admin` / `eventManager`
- API uses Mongoose schema validation; never trusts client-side role

---

## 🔐 Environment

`.env.local` (already populated for dev — **rotate before deploy**):

```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
# Optional integrations:
CLOUDINARY_CLOUD_NAME=
EMAIL_HOST=
RAZORPAY_KEY_ID=
```

---

## ⚠️ Security note

The MongoDB URI was committed to `.env.local` for local dev. Before deployment:
1. **Rotate the MongoDB password** in Atlas
2. Generate strong random JWT secrets (`openssl rand -hex 32`)
3. Ensure `.env.local` stays in `.gitignore` (it is)
4. Use the hosting provider's environment-variable store (Vercel/Railway)

---

## 🧪 Quick verification

```bash
curl http://localhost:3000/api/health
# → { "status":"ok", "db":"connected", ... }
```

Then visit:
- `http://localhost:3000/` — storefront
- `http://localhost:3000/shop` — product catalogue
- `http://localhost:3000/events` — events list
- `http://localhost:3000/login` — sign in as admin to access `/admin`

---

## 🚀 Deploy

- **Frontend + API** → Vercel (zero-config Next.js)
- **MongoDB** → MongoDB Atlas (already used)
- Add env vars in Vercel dashboard, push the repo, done.

## 📜 License
Private project (trylinqr).
