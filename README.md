# SineLokal

SineLokal is a web-based directory for discovering Filipino films available on YouTube. I built this project using HTML, CSS, JavaScript, and Supabase. The goal is to make it easier for users to browse Filipino movies, view their details, and save their favorites.

## Features

- Homepage with featured Filipino films
- Browse and search movies by title and genre
- Movie details page with links to YouTube
- Genre explorer
- User registration and login using Supabase Authentication
- Favorites feature for logged-in users
- Admin dashboard for managing movie records
- Supabase database with Row Level Security (RLS)
- Responsive layout for desktop, tablet, and mobile screens

## Technologies Used

- **HTML** — page structure
- **CSS** — styling and responsive layouts
- **JavaScript** — page interactions and functionality
- **Supabase** — database and user authentication
- **Vercel** — website hosting

## Getting Started

### 1. Clone the repository

Clone the repository to your computer:

```bash
git clone https://github.com/475f88x1v/SineLokal.git
cd SineLokal
```

You can also download the repository as a ZIP file from GitHub.

### 2. Set up Supabase

SineLokal uses Supabase to store movie records, user profiles, and favorites.

1. Create a project at [Supabase](https://supabase.com).
2. Open the SQL Editor in your Supabase dashboard.
3. Run the SQL script in `supabase/schema.sql` to set up the database tables and policies.
4. Go to Authentication settings and configure your Site URL and Redirect URLs.
5. Open `js/supabase-config.js` and replace the placeholder values with your Supabase Project URL and publishable key (or legacy `anon` key).

Do not use your Supabase `service_role` key or secret key in frontend JavaScript.

### 3. Run the website locally

Open the project folder in VS Code and run it using the Live Server extension.

You can also use Python's built-in web server from the project folder:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

Some features, such as login and favorites, require a properly configured Supabase project.

## Setting Up an Admin Account

To access the admin features:

1. Register an account through the website.
2. Open your Supabase dashboard and go to **Authentication → Users**.
3. Find your account and copy its user UUID.
4. Open the SQL Editor and run the query below, replacing the placeholder with your actual UUID.

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE id = 'PASTE-AUTH-USER-UUID-HERE';
```

Only a project owner or an authorized administrator should perform this step. Do not allow users to assign themselves the admin role.

## Managing Movies

The admin page is available at `admin/movies.html`. Admin users can add, edit, and delete movie records from there.

A few sample movies are included in `js/movies.js` as fallback data for browsing. When Supabase returns movie records, those records take priority over the local samples.

For movie posters, you can place image files inside `assets/images/posters/` and use their relative paths in the database. For example:

```text
assets/images/posters/way-back-home.jpg
```

If you want to manage the sample movies through the admin dashboard, add those records to your Supabase `movies` table. Sample SQL statements may be available in the comments at the bottom of `supabase/schema.sql`.

## Deployment

### Deploying with Vercel

SineLokal is a static website, so it does not require a separate build process.

1. Push the project to GitHub.
2. Open [Vercel](https://vercel.com) and import the repository.
3. Set the framework preset to **Other**, if prompted.
4. Use the project root as the root directory.
5. Check the settings in `vercel.json` before deploying.
6. Click **Deploy**.

After deployment, configure the correct production URL in your Supabase Authentication settings. Test the login, registration, favorites, movie browsing, and admin features on the live website.

## Project Status

SineLokal is a student web development project. Some features depend on the Supabase database and authentication settings being configured correctly.

## Notes

SineLokal serves as a directory for discovering Filipino films available on YouTube. The films and other third-party materials featured on the website belong to their respective owners.
