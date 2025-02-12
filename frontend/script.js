let setList = [];

function loadAvailableSongs() {
    fetch("/list_songs")
        .then(response => response.json())
        .then(data => {
            const songList = document.getElementById("songList");
            songList.innerHTML = "";
            data.forEach(song => {
                const div = document.createElement("div");
                div.className = "song-item";
                
                const input = document.createElement("input");
                input.type = "text";
                input.placeholder = "Enter key name";
                
                const button = document.createElement("button");
                button.textContent = "Add to Set List";
                button.onclick = () => addSongToSetList(song, input.value);
                
                div.appendChild(document.createTextNode(song + " "));
                div.appendChild(input);
                div.appendChild(button);
                songList.appendChild(div);
            });
        });
}

function addSongToSetList(song, keyName) {
    if (!keyName) {
        alert("Please enter a key name for this song.");
        return;
    }
    setList.push({ key: keyName, path: song, running: false });
    renderSetList();
}

function renderSetList() {
    const setListDiv = document.getElementById("setList");
    setListDiv.innerHTML = "";
    setList.forEach((item, index) => {
        const div = document.createElement("div");
        div.className = "setlist-item" + (item.running ? " running" : "");
        div.innerHTML = `
            <span>${item.key}</span>
            <button class="play-btn" onclick="startScript(${index})">Play</button>
            <button class="stop-btn" onclick="stopScript()">Stop</button>
            <button onclick="removeItem(${index})">Remove</button>
        `;
        setListDiv.appendChild(div);
    });
}

function startScript(index) {
    fetch("/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: setList[index].path })
    }).then(response => response.json()).then(data => {
        setList.forEach(item => item.running = false);
        setList[index].running = true;
        renderSetList();
    });
}

function stopScript() {
    fetch("/stop", { method: "POST" }).then(response => response.json()).then(data => {
        setList.forEach(item => item.running = false);
        renderSetList();
    });
}

function saveSetList() {
    const setListName = document.getElementById("setListName").value;
    if (!setListName) {
        alert("Please enter a name for the set list.");
        return;
    }

    fetch("/save_setlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: setListName, setlist: setList })
    }).then(response => response.json()).then(data => {
        alert(data.message);
        loadSetListNames();  // Refresh the dropdown list
    });
}

function loadSetList() {
    const selectedSetList = document.getElementById("setListDropdown").value;
    if (!selectedSetList) {
        alert("Please select a set list to load.");
        return;
    }

    fetch(`/load_setlist?name=${selectedSetList}`)
        .then(response => response.json())
        .then(data => {
            setList = data;
            renderSetList();
        });
}

function loadSetListNames() {
    fetch("/list_setlists")
        .then(response => response.json())
        .then(data => {
            const dropdown = document.getElementById("setListDropdown");
            dropdown.innerHTML = "";
            data.forEach(name => {
                const option = document.createElement("option");
                option.value = name;
                option.textContent = name;
                dropdown.appendChild(option);
            });
        });
}

// Load available set lists and songs on page load
window.onload = function () {
    loadSetListNames();
    loadAvailableSongs();
};

