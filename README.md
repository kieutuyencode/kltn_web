# KLTN Web

A Next.js frontend for event ticketing and management, with wallet connection, organizer dashboards, and ticket purchase flows.

## Features

- **Event Discovery**: Browse events, view event detail pages with showtimes and ticket types
- **Ticket Purchase**: Buy tickets and view ticket details; payment history for buyers
- **Organizer Dashboard**: Create events (multi-step form with rich text), manage events, view summary, orders, check-in, and payment history
- **Account**: Personal info, change password, email verification, forgot password, sign up / sign in
- **Wallet**: Connect wallet via Reown AppKit (formerly WalletConnect) with SIWE (Sign-In with Ethereum)
- **Rich Text Editor**: Tiptap-based editor for event descriptions (headings, lists, blockquote, code, images, links, formatting)

## Technology Stack

- **Framework**: Next.js 16 (App Router), React 19
- **Styling**: Tailwind CSS 4, SCSS
- **UI**: Radix UI primitives, shadcn-style components (CVA, clsx, tailwind-merge)
- **Wallet**: Reown AppKit, ethers.js, SIWE
- **Data**: TanStack React Query, TanStack Table, Axios
- **Forms**: React Hook Form, Zod
- **State**: Zustand
- **Editor**: Tiptap (starter-kit, lists, blockquote, code, image, highlight, text-align, etc.)
- **Other**: date-fns, react-day-picker, Recharts, Lucide icons, Sonner (toast)

## Getting Started

### Prerequisites

- **Node.js** 18 or later
- **npm** or **yarn**

### Installation

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd kltn_web
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment variables:**

   - Copy the example environment file:

   ```bash
   cp .env.example .env
   ```

   - Edit `.env` and set:

   ```env
   NEXT_PUBLIC_REOWN_PROJECT_ID=your_reown_project_id
   ```

   Get a project ID from [Reown (WalletConnect) Cloud](https://cloud.reown.com/).

4. **Run the development server:**

   ```bash
   npm run dev
   ```

5. **Open in browser:**

   Navigate to [http://localhost:3000](http://localhost:3000).

## Usage

- **Development**: `npm run dev`
- **Production build**: `npm run build`
- **Production start**: `npm run start`

## Project Structure

```
kltn_web/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (main)/                   # Main app: home, events, tickets, organizer, account
│   │   │   ├── page.tsx              # Home
│   │   │   ├── events/[slug]/        # Event detail
│   │   │   ├── ticket/               # My tickets, ticket detail, payment history
│   │   │   ├── organizer/            # Create event, manage list, payment history
│   │   │   ├── account/              # Profile, change password
│   │   │   └── components/           # Header, sidebar, sign-in/up, carousel, etc.
│   │   ├── (organizer)/              # Organizer event management
│   │   │   └── manage-events/[id]/   # Summary, check-in, orders, payment history, edit
│   │   ├── simple/                   # Tiptap simple editor demo
│   │   ├── components/               # AppKit provider, Query provider
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── api/                          # API client (auth, user, event, wallet)
│   ├── components/                   # Shared components
│   │   ├── ui/                       # shadcn-style UI components
│   │   ├── tiptap-*/                 # Tiptap editor, nodes, toolbar, icons
│   │   ├── event.tsx
│   │   └── image-upload.tsx
│   ├── constants/                    # Env, blockchain config
│   ├── hooks/                        # Custom hooks (tiptap, mobile, etc.)
│   ├── lib/                          # Tiptap utilities
│   ├── stores/                       # Zustand (e.g. auth)
│   ├── styles/                       # SCSS variables, keyframes
│   ├── types/                        # TypeScript types
│   └── utils/                        # Axios, file, SIWE, blockchain helpers
├── public/
├── .env.example
├── package.json
└── README.md
```

## Configuration

### Environment Variables

| Variable                       | Description                                                  |
| ------------------------------ | ------------------------------------------------------------ |
| `NEXT_PUBLIC_REOWN_PROJECT_ID` | Reown (WalletConnect) Cloud project ID for wallet connection |

Ensure the backend API base URL is configured in your API client (e.g. in `src/utils/axios.util.ts` or `src/constants/env.ts`) if you use a separate backend.

## License

This project is licensed under the MIT License.
