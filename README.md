
# Herbie Documentation

This repository contains the documentation for the Herbie project. The documentation is built using Docusaurus and deployed to GitHub Pages.

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (version 14.x or higher)
- npm (version 6.x or higher)

## Setup Instructions

1. **Clone the Repository**

   Clone this repository to your local machine:

   ```bash
   git clone https://github.com/HrithikMani/herbie.git
   cd herbie
   ```

2. **Install Dependencies**

   Install the necessary npm packages, including `cross-env` and `gh-pages`:

   ```bash
   npm install
   npm install --save-dev cross-env gh-pages
   ```

3. **Build the Project**

   Build the Docusaurus site:

   ```bash
   npm run build
   ```

4. **Serve the Build Locally (Optional)**

   To test the build locally before deploying, use the following command:

   ```bash
   npm run serve
   ```

   This will start a local server at `http://localhost:3000` where you can preview the site.

5. **Deploy to GitHub Pages**

   Deploy the site to GitHub Pages:

   ```bash
   npm run deploy
   ```

   The deploy command uses `cross-env` to set environment variables and `gh-pages` to push the build to the `gh-pages` branch of the repository.

## Troubleshooting

### 'cross-env' is not recognized

If you encounter an error stating that `cross-env` is not recognized, ensure it is installed correctly:

```bash
npm install --save-dev cross-env
```

### 'gh-pages' is not recognized

If you encounter an error stating that `gh-pages` is not recognized, ensure it is installed correctly:

```bash
npm install --save-dev gh-pages
```

## Repository Structure

- **`docs/`**: Contains the markdown files for the documentation.
- **`docusaurus.config.js`**: The configuration file for Docusaurus.
- **`sidebars.js`**: Defines the sidebar structure for the documentation.

## Customization

You can customize the sidebar, theme, and other settings by editing the `docusaurus.config.js` and `sidebars.js` files.

## License

This project is licensed under the MIT License.
