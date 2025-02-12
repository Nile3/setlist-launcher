from flask import Flask, request, jsonify, send_from_directory
import subprocess
import os
import signal
import json

app = Flask(__name__)

SETLIST_DIR = "setlists/"  # Directory for storing set lists
PERFORMANCE_DIR = "/home/hr/.snet/singing_shows/all_songs/"
AVAILABLE_SONGS_FILE = "available_songs.json"

# Ensure directories exist
os.makedirs(SETLIST_DIR, exist_ok=True)

running_process = None  # Initialize the global variable

def stop_script():
    global running_process
    if running_process:
        os.killpg(os.getpgid(running_process.pid), signal.SIGTERM)
        running_process = None
    return jsonify({"message": "All scripts stopped"})

@app.route("/setlist", methods=["GET", "POST"])
def manage_setlist():
    if request.method == "POST":
        setlist = request.json.get("setlist", [])
        save_setlist(setlist)
        return jsonify({"message": "Set list saved"})
    else:
        return jsonify(load_setlist())

@app.route("/list_songs", methods=["GET"])
def list_songs():
    """Returns only the filenames of the allowed songs from available_songs.json"""
    if os.path.exists(AVAILABLE_SONGS_FILE):
        with open(AVAILABLE_SONGS_FILE, "r") as f:
            songs = json.load(f)
    else:
        songs = []
    
    valid_songs = [song for song in songs if os.path.exists(os.path.join(PERFORMANCE_DIR, song))]
    return jsonify(valid_songs)

@app.route("/start", methods=["POST"])
def start_script():
    """Starts the selected song, ensuring it runs from PERFORMANCE_DIR"""
    global running_process
    stop_script()
    
    song_filename = request.json.get("path")
    if not song_filename:
        return jsonify({"error": "No song selected"}), 400
    
    full_script_path = os.path.join(PERFORMANCE_DIR, song_filename)
    
    if not os.path.exists(full_script_path):
        return jsonify({"error": "Song file not found"}), 404
    
    running_process = subprocess.Popen(
        ["bash", full_script_path],
        cwd=PERFORMANCE_DIR,
        preexec_fn=os.setsid
    )
    
    return jsonify({"message": f"Playing {song_filename}", "pid": running_process.pid})

@app.route("/stop", methods=["POST"])
def stop_running_script():
    return stop_script()

@app.route("/save_setlist", methods=["POST"])
def save_named_setlist():
    data = request.json
    setlist_name = data.get("name")
    setlist_content = data.get("setlist", [])

    if not setlist_name:
        return jsonify({"error": "Missing set list name"}), 400

    file_path = os.path.join(SETLIST_DIR, f"{setlist_name}.json")
    with open(file_path, "w") as f:
        json.dump(setlist_content, f)

    return jsonify({"message": f"Set list '{setlist_name}' saved."})

@app.route("/delete_setlist", methods=["POST"])
def delete_setlist():
    """Deletes a selected set list."""
    setlist_name = request.json.get("name")
    if not setlist_name:
        return jsonify({"error": "Set list name required"}), 400

    file_path = os.path.join(SETLIST_DIR, f"{setlist_name}.json")
    if os.path.exists(file_path):
        os.remove(file_path)
        return jsonify({"message": f"Set list '{setlist_name}' deleted."})
    else:
        return jsonify({"error": "Set list not found"}), 404

@app.route("/load_setlist", methods=["GET"])
def load_named_setlist():
    setlist_name = request.args.get("name")
    if not setlist_name:
        return jsonify({"error": "Missing set list name"}), 400

    file_path = os.path.join(SETLIST_DIR, f"{setlist_name}.json")
    if not os.path.exists(file_path):
        return jsonify({"error": "Set list not found"}), 404

    with open(file_path, "r") as f:
        setlist_content = json.load(f)

    return jsonify(setlist_content)

@app.route("/list_setlists", methods=["GET"])
def list_setlists():
    setlists = [f.replace(".json", "") for f in os.listdir(SETLIST_DIR) if f.endswith(".json")]
    return jsonify(setlists)

@app.route("/")
def serve_creator():
    return send_from_directory("../frontend", "creator.html")

@app.route("/player")
def serve_player():
    return send_from_directory("../frontend", "player.html")

@app.route("/<path:path>")
def serve_static(path):
    return send_from_directory("../frontend", path)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)

