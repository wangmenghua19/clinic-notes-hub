#!/usr/bin/env bash
# Exit on error
set -o errexit

# Install Python dependencies
pip install -r backend/requirements.txt

# Build Frontend
npm install
npm run build

# Move Frontend build to Backend expected location
# We need to make sure the 'dist' folder is where FastAPI expects it
# In main.py we check for "../dist" or "static/dist"
# Let's move it to backend/dist so it is near main.py (which is in backend/app)
# If main.py is in backend/app/main.py, then os.path.dirname(__file__) is backend/app
# So "../dist" resolves to backend/dist.
rm -rf backend/dist
mv dist backend/dist
