# SineLokal

A responsive Filipino film directory built with HTML, CSS, vanilla JavaScript, and Supabase.

## Features
- Public homepage, browse/search, film details, genre explorer modal
- Supabase email/password authentication
- Favorites saved per authenticated user
- Separate admin dashboard and film CRUD page
- Supabase SQL schema, role-based access, and Row Level Security policies
- Static-hosting compatible with Vercel and GitHub Pages

## 1. Supabase setup
1. Create a project at https://supabase.com.
2. Open SQL Editor and run `supabase/schema.sql`.
3. In Authentication > URL Configuration, set your Site URL to your deployed site URL. Add local and production URLs to Redirect URLs as needed.
4. Open `js/supabase-config.js` and replace the placeholder URL and anon key with your project's Project URL and anon/public key. Never put a `service_role` key in browser code.
5. For local development, use VS Code Live Server or `python3 -m http.server 8000` from the project folder.

## 2. Create the first admin
1. Register a normal account through `login.html`.
2. In Supabase SQL Editor, find that user's UUID in Authentication > Users.
3. Run this query, replacing the UUID:

```sql
update public.profiles
set role = 'admin'
where id = 'PASTE-AUTH-USER-UUID-HERE';
```

Only an existing project owner/admin should perform this step. Do not create a public admin-registration form.

## 3. Add films
- Admins can add/edit/delete films from `admin/movies.html`.
- Existing three sample films are provided in `js/movies.js` as a fallback for the public site. Supabase film records take priority when loaded.
- Add poster images to `assets/images/posters/` and use relative paths such as `assets/images/posters/way-back-home.jpg`.
- For a production deployment, seed your three sample records in Supabase if you want them manageable in the admin panel. SQL seed examples are included at the bottom of `supabase/schema.sql` as comments.

## 4. Hosting
### Vercel
Import the GitHub repository into Vercel. This is a static site; no build command is needed and the output directory is `.`. `vercel.json` is included.

### GitHub Pages
Push the folder to a repository and enable Pages for the branch/root folder. Since this project uses relative links, it works under a repository subpath. Ensure Supabase Auth redirect URLs include the GitHub Pages URL.

## Security notes
- Supabase anon/public key is intended for browser use when RLS is enabled.
- Never expose your Supabase service-role key.
- Admin authorization is enforced by RLS in addition to client-side page checks.
- User favorites are only readable/writable by their owner.
- Static pages cannot keep secrets; all sensitive permissions must be enforced in Supabase.
