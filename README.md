# PHAETHON OS 📽️

A high-performance media storage client and video archive system inspired by the **Zenless Zone Zero (ZZZ)** aesthetic. Built for professional Proxies to manage their encrypted data and VHS archives.

> [!CAUTION]
> **DISCLAIMER**: This is a personal hobby project. There are **NO GUARANTEES** of stability, security, or data integrity. If you choose to deploy or use this system, you do so at your own risk and are expected to figure out the implementation details yourself. As an actively maintained project, breaking changes and architectural shifts occur frequently without prior notice.

## 📺 Overview
Phaethon OS is a specialized interface designed to bridge the gap between high-speed cloud storage and the gritty, high-tech world of New Eridu. It utilizes Next.js Parallel Routes and Layouts to provide a seamless "Operating System" experience without the overhead of traditional modaled interfaces.

## 🛠️ Technical Stack
- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router & Route Groups)
- **Deployment**: [Netlify](https://www.netlify.com/)
- **Database**: [Neon](https://neon.tech/) (Serverless PostgreSQL)
- **Auth**: [Neon Auth](https://neon.tech/docs/guides/auth-better-auth) (Managed Better Auth)
- **Storage**: [Cloudflare R2](https://developers.cloudflare.com/r2/) (Accessed via S3-Compatible API)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **State**: React Context & Zustand for HUD-wide synchronization
- **Animations**: [Framer Motion](https://www.framer.com/motion/) (Cinematic page transitions)

## ✨ Architecture & UI Philosophy

### 1. Page-Based Navigation
Unlike traditional single-page applications, Phaethon OS uses **Route-Based Pages** instead of modals. This allows for:
- **Cinematic Transitions**: Smooth slide-in data feeds for file details and system utilities.
- **Direct Linking**: Every data object and system tool has a unique URL for instant access.
- **Persistent HUD**: The Sidebar, Terminal, and Desk Notes are rendered in a shared `(os)` layout, ensuring they remain static and performant during center-panel transitions.

### 2. Seeding & Mock System
To facilitate local development and predictable testing, the system utilizes a centralized seed engine:
- **Path**: `src/lib/mocks/seed.ts`
- **Schema Alignment**: Mock data strictly follows the Drizzle ORM schema defined in `src/db/schema.ts`.
- **Easy Modification**: Developers can instantly modify "Hollow Data" records or "VHS Archives" by editing the centralized seed file, which then propagates to all UI components.

## 🚀 Getting Started

### Prerequisites
- [Bun](https://bun.sh/) runtime
- Neon Project (Singapore region recommended)
- Cloudflare R2 Bucket (with S3 credentials enabled)

### Installation
```bash
# Clone the repository
git clone https://github.com/username/phaethon-os.git

# Install dependencies
bun install

# Generate and push schema to Neon
bun db:generate
bun db:push

# Run local development
bun dev
```

### Configuration
Update your `.env.local` with your database and storage credentials:
```env
DATABASE_URL=postgresql://...
NEON_AUTH_URL=https://...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_ENDPOINT=...
SYSTEM_CAPACITY_BYTES=1099511627776 # 1TB
```

## 📜 Project Structure
- `/src/app/(os)`: The main OS shell and modular routes.
- `/src/components/phaethon`: ZZZ-themed HUD and interface components.
- `/src/db`: Drizzle schema and PostgreSQL migration definitions.
- `/src/lib/r2`: S3-compatible storage service logic.
- `/src/context`: Global system state (HUD synchronization).

---