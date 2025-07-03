# WhereWeAre

A modern web application for discovering and sharing memories of cultural sites in Chemnitz, Germany. Built with Next.js, TypeScript, and MongoDB.

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.x or higher
- **npm** or **yarn**
- **MongoDB** database (local or MongoDB Atlas)
- **GitHub OAuth App** (for authentication)
- **Google OAuth App** (for authentication)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/EshwariK/chemnitz-explorer.git
   cd chemnitz-explorer
   ```
   
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Set up environment variables**

   Create a `.env.local` file in the root directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017/chemnitz-explorer

   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-key-here

   GITHUB_ID=your-github-client-id
   GITHUB_SECRET=your-github-client-secret

   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

4. **Set up the database**

   Run the database setup script to create collections and seed initial data:
   ```bash
   node scripts/import.mjs
   ```

5. **Build the Application**
   ```bash
   npm run build
   ```

5. **Start the Application**
   ```bash
   npm start
   ```

6. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Project Structure

```
chemnitz-explorer/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── cultural-sites/       # Cultural sites API
│   │   ├── memories/             # Memories API
│   │   └── user/                 # User-related API
│   ├── dashboard/                # Dashboard page
│   ├── favorites/                # Favorites page
│   ├── map/                      # Main map page
│   ├── memory-map/               # Memory map page
│   ├── profile/                  # User profile page
│   ├── login/                    # Login page
│   ├── docs/                     # API documentation page
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home page
│   └── globals.css               # Global styles
├── components/                   # Reusable React components
│   ├── ui/                       # shadcn/ui components
│   ├── auth-provider.tsx         # Authentication context
│   ├── header.tsx                # Navigation header
│   ├── footer.tsx                # Footer component
│   ├── interactive-map.tsx       # Main map component
│   ├── memory-creator.tsx        # Memory creation form
│   ├── memory-map.tsx            # Memory-specific map
│   ├── site-details-modal.tsx    # Site information modal
│   └── ...                       # Other components
├── lib/                          # Utility libraries and services
│   ├── auth-options.ts           # NextAuth configuration
│   ├── mongodb.ts                # Database connection
│   ├── cultural-sites-service.ts # Cultural sites business logic
│   ├── memory-service.ts         # Memory business logic
│   ├── user-service.ts           # User business logic
│   └── utils.ts                  # Utility functions
├── hooks/                        # Custom React hooks
│   ├── use-favorites.ts          # Favorites management
│   └── use-geolocation.ts        # Geolocation utilities
├── types/                        # TypeScript type definitions
│   └── next-auth.d.ts            # NextAuth type extensions
├── public/                       # Static assets
│   ├── images/                   # Image assets
│   └── ...                       # Other static files
├── scripts/                      # Database and utility scripts
│   ├── db.mjs                    # Database setup
│   ├── fetchData.mjs             # Data fetching utilities
│   ├── import.mjs                # Data import script
|   └── transformData.mjs         # Data transformation script
```

**Built with ❤️ for the Chemnitz community**
