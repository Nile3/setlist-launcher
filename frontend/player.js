let setList = [];

function loadEmergencySetList() {
    fetch("/load_setlist?name=emergency_setlist")
        .then(response => response.json())
        .then(data => {
            setList = data;
            renderSetList();
        })
        .catch(error => console.error("Error loading emergency set list:", error));
}

function renderSetList() {
    const setListDiv = document.getElementById("setList");
    setListDiv.innerHTML = "";
    setList.forEach((item, index) => {
        const div = document.createElement("div");
        div.className = "setlist-item";
        div.innerHTML = `
            <span>${item.key} - ${item.path}</span>
            <button onclick="startScript(${index})">Play</button>
            <button onclick="removeFromSetList(${index})">Remove</button>
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
        console.log("Playing:", data);
    });
}

function removeFromSetList(index) {
    setList.splice(index, 1);
    renderSetList();
}

window.onload = function () {
    loadEmergencySetList();
};

