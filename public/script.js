const validColors = ['#f5f5f5', '#FFCCE6', '#FFFF00', '#FFCCCC'];
const validObjects = [];
let xmlDoc;
let sessionId = new URLSearchParams(window.location.search).get('sessionId');

document.getElementById('xmlFile').addEventListener('change', function(event) {
    const uploadButton = document.getElementById('uploadButton');
    uploadButton.classList.remove('d-none');
});

document.getElementById('uploadButton').addEventListener('click', function(event) {
    const file = document.getElementById('xmlFile').files[0];
    if (file) {
        const formData = new FormData();
        formData.append('xmlFile', file);

        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            sessionId = data.sessionId;
            const url = new URL(window.location.href);
            url.searchParams.set('sessionId', sessionId);
            window.history.pushState({}, '', url);
            loadXML(`/xml/${sessionId}`);
        })
        .catch(error => console.error('Error uploading file:', error));
    }
});

function loadXML(url) {
    fetch(url)
    .then(response => response.text())
    .then(data => {
        const parser = new DOMParser();
        xmlDoc = parser.parseFromString(data, 'text/xml');
        processXML(xmlDoc);
    })
    .catch(error => console.error('Error loading XML:', error));
}

if (sessionId) {
    loadXML(`/xml/${sessionId}`);
}

function processXML(xmlDoc) {
    const diagrams = xmlDoc.getElementsByTagName('diagram');
    const tabsContainer = document.getElementById('diagramTabs');
    const tabContent = document.getElementById('diagramContent');

    tabsContainer.className = 'nav nav-pills';
    tabsContainer.innerHTML = '';
    tabContent.innerHTML = '';

    Array.from(diagrams).forEach((diagram, index) => {
        const tabId = `tab-${index}`;
        const tabPaneId = `tab-pane-${index}`;

        const tab = document.createElement('li');
        tab.className = 'nav-item';
        const tabLink = document.createElement('a');
        tabLink.className = `nav-link ${index === 0 ? 'active' : ''}`;
        tabLink.id = `${tabId}-tab`;
        tabLink.href = `#${tabPaneId}`;
        tabLink.setAttribute('data-bs-toggle', 'tab');
        tabLink.setAttribute('role', 'tab');
        tabLink.setAttribute('aria-controls', tabPaneId);
        tabLink.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
        tabLink.innerText = diagram.getAttribute('name');
        tab.appendChild(tabLink);
        tabsContainer.appendChild(tab);

        const tabPane = document.createElement('div');
        tabPane.className = `tab-pane fade ${index === 0 ? 'show active' : ''}`;
        tabPane.id = tabPaneId;
        tabPane.setAttribute('role', 'tabpanel');
        tabPane.setAttribute('aria-labelledby', `${tabId}-tab`);

        processDiagram(diagram, tabPane);
        tabContent.appendChild(tabPane);
    });
}

function processDiagram(diagram, tabPane) {
    const root = diagram.getElementsByTagName('root')[0];
    const mxCells = root.getElementsByTagName('mxCell');
    const objects = root.getElementsByTagName('object');

    processMxCells(mxCells, tabPane);
    processObjects(objects, tabPane);
}

function processMxCells(mxCells, tabPane) {
    Array.from(mxCells).forEach(cell => {
        const value = cell.getAttribute('value');
        const style = cell.getAttribute('style');
        if (value && isValidStyle(style)) {
            addAttributesIfMissing(cell);
            createTextareas(tabPane, cell, 'value', 'Oficial');
            createTextareas(tabPane, cell, 'value2', 'Revisor 1');
            createTextareas(tabPane, cell, 'value3', 'Revisor 2');
        }
    });
}

function processObjects(objects, tabPane) {
    Array.from(objects).forEach(object => {
        const label = object.getAttribute('label');
        const cell = object.getElementsByTagName('mxCell')[0];
        const style = cell.getAttribute('style');
        if (label && isValidStyle(style)) {
            addAttributesIfMissing(cell);
            createTextareas(tabPane, object, 'label', 'Oficial');
            createTextareas(tabPane, object, 'value2', 'Revisor 1');
            createTextareas(tabPane, object, 'value3', 'Revisor 2');
        }
    });
}

function isValidStyle(style) {
    if (!style) return false;
    const fillColorMatch = style.match(/fillColor=(#[0-9A-Fa-f]{6})/);
    const fillColor = fillColorMatch ? fillColorMatch[1] : null;
    return validColors.includes(fillColor);
}

function addAttributesIfMissing(cell) {
    if (!cell.getAttribute('value2')) {
        cell.setAttribute('value2', '');
    }
    if (!cell.getAttribute('value3')) {
        cell.setAttribute('value3', '');
    }
}

function createTextareas(tabPane, element, attributeName, label) {
    const attributeValue = element.getAttribute(attributeName) || '';
    const sanitizedValue = sanitizeTextContent(attributeValue);

    const div = document.createElement('div');
    div.className = 'mb-3';

    const textareaLabel = document.createElement('label');
    textareaLabel.className = 'form-label';
    textareaLabel.innerText = label;
    div.appendChild(textareaLabel);

    const textarea = document.createElement('textarea');
    textarea.className = 'form-control';
    textarea.id = element.getAttribute('id') + '-' + attributeName;
    textarea.value = sanitizedValue;
    div.appendChild(textarea);

    const saveButton = document.createElement('button');
    saveButton.className = 'btn btn-primary mt-3 mr-2';
    saveButton.innerText = 'Salvar';
    saveButton.addEventListener('click', () => saveChanges(element, attributeName, textarea.value));
    div.appendChild(saveButton);

    tabPane.appendChild(div);
}

function saveChanges(element, attributeName, newValue) {
    element.setAttribute(attributeName, newValue);
    showSaveModal();
    document.getElementById('downloadButton').classList.remove('d-none');
}

function showSaveModal() {
    const saveModal = new bootstrap.Modal(document.getElementById('saveModal'));
    saveModal.show();
    setTimeout(() => {
        saveModal.hide();
    }, 1500);
}

document.getElementById('downloadButton').addEventListener('click', () => {
    const serializer = new XMLSerializer();
    const xmlStr = serializer.serializeToString(xmlDoc);
    const blob = new Blob([xmlStr], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ProjetoEditado.xml';
    a.click();
    URL.revokeObjectURL(url);
});

function sanitizeTextContent(text) {
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/<br>/g, '\n');
    text = text.replace(/<p[^>]*>(.*?)<\/p>/gs, '$1\n');
    text = text.replace(/<div.*?>(.*?)<\/div>/g, '$1\n');
    text = text.replace(/[ \t]{2,}/g, ' ').replace(/[\r\n]{2,}/g, '\n');
    text = text.replace(/^\s*\n/, '');
    text = text.replace(/^\s+/gm, '');
    return text;
}

// Função para alternar entre os temas light e dark
const themeToggle = document.getElementById('themeToggle');
const themeIcon = themeToggle.querySelector('i');

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');

    themeIcon.className = isDarkMode ? 'fas fa-moon' : 'fas fa-sun';
    document.body.classList.toggle('bg-dark', isDarkMode);
    document.body.classList.toggle('text-light', isDarkMode);
});

const fontIncreaseBtn = document.getElementById('fontIncreaseBtn');
const fontDecreaseBtn = document.getElementById('fontDecreaseBtn');

let currentFontSize = 16;

fontIncreaseBtn.addEventListener('click', () => {
    currentFontSize += 2;
    document.body.style.fontSize = `${currentFontSize}px`;
    updateTextareaFontSize(currentFontSize);
});

fontDecreaseBtn.addEventListener('click', () => {
    if (currentFontSize > 10) {
        currentFontSize -= 2;
        document.body.style.fontSize = `${currentFontSize}px`;
        updateTextareaFontSize(currentFontSize);
    }
});

function updateTextareaFontSize(fontSize) {
    const textareas = document.querySelectorAll('textarea');
    textareas.forEach(textarea => {
        textarea.style.fontSize = `${fontSize}px`;
    });
}

document.getElementById('anoAtual').textContent = new Date().getFullYear();
