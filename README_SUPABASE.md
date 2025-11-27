# Supabase Setup Instructions

## CRITICAL STEP: Create the Database Table

The error you are seeing (`Could not find the table 'public.reports'`) means the database table does not exist yet. You **MUST** run the following SQL code in your Supabase Dashboard.

1.  Go to [Supabase Dashboard](https://supabase.com/dashboard).
2.  Select your project.
3.  Click on the **SQL Editor** icon (left sidebar, looks like a terminal `>_`).
4.  Click **New Query**.
5.  **Copy and Paste** the code below into the editor and click **RUN**.

```sql
-- Copy the contents of src/lib/schema.sql
-- It is too long to display here fully, but it includes tables for:
-- auth_accounts, profiles, malaria_patients, leptospirosis_patients, analyses, reports, etc.

-- 1. Open src/lib/schema.sql
-- 2. Copy all content
-- 3. Paste into Supabase SQL Editor
-- 4. Run
```

6.  **Restart your app**: Stop the terminal (Ctrl+C) and run `npm run dev` again.

