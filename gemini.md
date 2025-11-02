# Gemini Project Guide

This document provides an overview of the project setup, development process, and deployment workflow.

## Project Overview

This is a "Spooky Bingo" web application built with Vite, React, and TypeScript. It's designed to be a fun, interactive bingo game with a spooky Halloween theme.

## Local Development

To run the application locally, follow these steps:

1.  **Install dependencies:**
    ```bash
    npm install
    ```
2.  **Run the development server:**
    ```bash
    npm run dev
    ```
    This will start the Vite development server, and you can view the application at `http://localhost:5173` (or another port if 5173 is in use).

## Deployment

The application is automatically deployed to GitHub Pages whenever changes are pushed to the `main` branch.

### How it Works

1.  **GitHub Action:** A GitHub Action workflow is defined in `.github/workflows/deploy.yml`.
2.  **Trigger:** The workflow is triggered on every `push` to the `main` branch.
3.  **Build:** The action builds the application using `npm run build`. This creates a `dist` directory with the compiled, static assets.
4.  **Deploy:** The contents of the `dist` directory are then pushed to the `gh-pages` branch.
5.  **Live Site:** GitHub Pages is configured to serve the site from the `gh-pages` branch. The live site is available at [https://haaans.com/bingo/](https://haaans.com/bingo/).

### Important Configurations

-   **`vite.config.ts`:** The `base` property in this file is set to `/bingo/`. This is crucial for the application to work correctly when served from a subdirectory on GitHub Pages.

-   **`public` directory:** Static assets that need to be available at the root of the deployed site (like `symbols.svg` and the favicons) are placed in the `public` directory.
