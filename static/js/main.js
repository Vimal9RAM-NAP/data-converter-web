const dataInput = document.getElementById('data-input');
const dataOutput = document.getElementById('data-output');
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');

const sourceFormat = document.getElementById('source-format');
const targetFormat = document.getElementById('target-format');

const statChars = document.getElementById('stat-chars');
const statLines = document.getElementById('stat-lines');
const statSize = document.getElementById('stat-size');

const errorBanner = document.getElementById('error-banner');
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');

// File Upload & Drag-and-Drop handling
fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
        dataInput.value = evt.target.result;
        updateStats();
        processConversion();
    };
    reader.readAsText(file);
});

['dragenter', 'dragover'].forEach(eName => {
    dropZone.addEventListener(eName, (e) => {
        e.preventDefault();
        dropZone.classList.add('dropzone-active');
    });
});

['dragleave', 'drop'].forEach(eName => {
    dropZone.addEventListener(eName, (e) => {
        e.preventDefault();
        dropZone.classList.remove('dropzone-active');
    });
});

dropZone.addEventListener('drop', (e) => {
    if (e.dataTransfer.files.length > 0) {
        fileInput.files = e.dataTransfer.files;
        fileInput.dispatchEvent(new Event('change'));
    }
});

// Live Stats Updates
dataInput.addEventListener('input', () => {
    updateStats();
    processConversion();
});

function updateStats() {
    const val = dataInput.value;
    statChars.innerText = val.length;
    statLines.innerText = val ? val.split('\n').length : 0;
    
    const bytes = new Blob([val]).size;
    if (bytes < 1024) statSize.innerText = `${bytes} B`;
    else statSize.innerText = `${(bytes / 1024).toFixed(2)} KB`;
}

function clearAll() {
    dataInput.value = '';
    dataOutput.value = '';
    errorBanner.classList.add('hidden');
    setStatus('Ready', 'zinc');
    updateStats();
}

function setStatus(text, color) {
    statusText.innerText = text;
    statusDot.className = `w-2 h-2 rounded-full bg-${color}-500`;
}

function loadSample(type) {
    const samples = {
        json: `[\n  { "id": 1, "name": "Vimal", "role": "Developer", "status": "Active" },\n  { "id": 2, "name": "Alex", "role": "Designer", "status": "Pending" }\n]`,
        csv: `id,name,role,status\n1,Vimal,Developer,Active\n2,Alex,Designer,Pending`,
        yaml: `users:\n  - id: 1\n    name: Vimal\n    role: Developer\n  - id: 2\n    name: Alex\n    role: Designer`,
        xml: `<users>\n  <user id="1">\n    <name>Vimal</name>\n    <role>Developer</role>\n  </user>\n</users>`
    };

    if (samples[type]) {
        dataInput.value = samples[type];
        sourceFormat.value = type;
        updateStats();
        processConversion();
    }
}