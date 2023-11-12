# CleanEr

This repository contains a prototype implementation for CleanEr, a generic framework that is used on
top of existing data cleaning systems and that assists users in identifying the impact of potential
cleaning errors on query results, and in deciding accordingly whether and how to proceed with the
cleaning.

You can find screenshots of the different views under `screenshots/`, and watch [a video](demonstration_video.mp4) that demonstrates
our framework and its key features.

# Instructions

1. Build the Python implementation of the algorithms by running `poetry build` from `impl/`.
2. Install the dependencies of the Flask server by running `poetry install --no-root` from
   `flask-app/`.
3. Start the Flask server by running `poetry run flask --app ./flask_app/app.py run` from
   `flask-app/`.
4. Install the dependencies of the Node.js server by running `npm install` from `react-app/`.
5. Start the Node.js server by running `npm run dev` from `react-app/`.

