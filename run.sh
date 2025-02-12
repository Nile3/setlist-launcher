#!/bin/bash

# Navigate to backend directory
cd /home/hr/nile/setListLauncher/backend

# Activate virtual environment if needed
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start Flask server
python3 app.py

