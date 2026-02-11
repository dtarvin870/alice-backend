# Deploying 'Alice' to AdaptedProducts.com

You CANNOT just copy main folders. You must follow this 2-part process because the Frontend needs to be "compiled" and the Backend needs to be "installed".

---

## PART 1: The Backend (The Brain)
*You must do this first so the app has a database to talk to.*

1.  **Prepare the Files**:
    *   Go to your `backend` folder on your computer.
    *   Select ONLY these files:
        *   `server.js`
        *   `database.js`
        *   `routes.js`
        *   `package.json`
        *   `pharmacy.db`
        *   `uploads` (folder)
    *   **STOP**: Do NOT copy `node_modules`.

2.  **Upload to GoDaddy**:
    *   Log in to **cPanel**.
    *   Look for **"Setup Node.js App"** (under Software).
    *   Click **Create Application**.
    *   **Node.js Version**: Select the latest available (e.g., 18 or 20).
    *   **Application Mode**: Production.
    *   **Application Root**: `alice-api` (This creates a folder for you).
    *   **Application URL**: `alice-api` (This makes it accessible at `adaptedproducts.com/alice-api`).
    *   **Application Startup File**: `server.js`.
    *   Click **CREATE**.

3.  **Install Dependencies**:
    *   Now, use the File Manager in cPanel to upload the files you prepared in Step 1 into the `alice-api` folder.
    *   Go back to the "Setup Node.js App" page.
    *   Click the **"Run NPM Install"** button. (This downloads the missing library files).
    *   Click **Restart Application**.

---

## PART 2: The Frontend (The Face)
*This is the visual part of the website.*

1.  **Build the Project**:
    *   In your VS Code terminal (on your computer), run this command:
        ```bash
        cd frontend
        npm run build
        ```
    *   This will create a new folder called `dist` inside your `frontend` folder.

2.  **Upload to GoDaddy**:
    *   Use File Manager or FTP.
    *   Go to `public_html`.
    *   Create a folder named `alice`.
    *   Open the `dist` folder on your computer.
    *   **Select ALL files inside `dist`** (you should see `index.html`, an `assets` folder, etc.).
    *   Drag and drop them into the `public_html/alice` folder on the server.

3.  **Final Fix**:
    *   Inside `public_html/alice` on the server, create a file named `.htaccess`.
    *   Edit it and paste this code (this fixes page refreshing):
        ```apache
        <IfModule mod_rewrite.c>
          RewriteEngine On
          RewriteBase /alice/
          RewriteRule ^index\.html$ - [L]
          RewriteCond %{REQUEST_FILENAME} !-f
          RewriteCond %{REQUEST_FILENAME} !-d
          RewriteRule . /alice/index.html [L]
        </IfModule>
        ```

## You are done!
- Visit **adaptedproducts.com/alice** to see your app.
