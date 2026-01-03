# Portfolio: Data-Driven & Scalable Architecture

A modern, high-performance portfolio website built with **Next.js 15** and **Supabase**. This project showcases a clean, data-driven design with robust backend management features including visitor analytics and internationalization.

![Project Preview](/og-image.jpg)

## 🔥 Key Features

- **Responsive & Aesthetic Design**: Built with pure **Tailwind CSS v4**, featuring smooth animations (`tailwindcss-animate`), dark mode support, and premium typography (`Gowun Dodum` & `Space Grotesk`).
- **Dynamic Content Management**: An Admin Dashboard allows for easy updates to:
  - **Profile Information**: Bio, role, avatar upload.
  - **Projects**: Auto-fetch project data from GitHub (readme, stars, language) or manual entry.
- **Visitor Analytics**: Custom-built, privacy-friendly visitor tracking system. View daily traffic trends directly from the Admin Dashboard.
- **Multilingual Support (i18n)**: Seamless English/Korean language toggling with persistent user preference.
- **Project Simulator**: Interactive "Project Simulator" floating acton button (concept).
- **GitHub Integration**: Automatically fetches and parses README content from linked repositories to display rich project details.

## 🛠 Tech Stack

- **Frontend**: [Next.js 15 (App Router)](https://nextjs.org/), [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/), Font Awesome
- **Backend & Database**: [Supabase](https://supabase.com/) (PostgreSQL, Auth, Storage)
- **Deployment**: Vercel (Recommended)

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- A Supabase project

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/my-portfolio.git
   cd my-portfolio
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Database Migration**
   Run the provided SQL scripts in your Supabase SQL Editor to set up tables (`profile`, `projects`, `daily_stats`) and Row Level Security (RLS) policies.
   - Run `schema.sql` (Base schema)
   - Run `migration.sql` (Additional columns)
   - Run `analytics_migration.sql` (Analytics table)

5. **Run the development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the site.

## 🛡 Admin Access

To access the admin dashboard, navigate to `/login` and sign in with your Supabase credentials.
- **Dashboard**: `/admin`
- **Edit Profile**: `/admin/profile`
- **Manage Projects**: `/admin/projects`

## 🌍 Internationalization

The project uses a lightweight, Context API-based i18n solution.
- Translations are stored in `utils/translations.ts`.
- Language state is managed via `context/LanguageContext.tsx`.

## 📊 Analytics

Visitor data is stored in the `daily_stats` table. The `incrementView` Server Action tracks page loads, and the `VisitorChart` component visualizes this data using `chart.js`.

## 📝 License

This project is open-source and available under the [MIT License](LICENSE).
