const validColors = ['#f5f5f5', '#FFCCE6', '#FFFF00', '#FFCCCC'];
const validObjects = [];
let xmlDoc; // Define xmlDoc globalmente

document.getElementById('xmlFile').addEventListener('change', function(event) {
    const uploadButton = document.getElementById('uploadButton');
    uploadButton.classList.remove('d-none');
});

document.getElementById('uploadButton').addEventListener('click', function(event) {
    //event.preventDefault();
    const file = document.getElementById('xmlFile').files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const parser = new DOMParser();
            xmlDoc = parser.parseFromString(e.target.result, 'text/xml');
            processXML(xmlDoc);
        };
        reader.readAsText(file);
    }
});

function processXML(xmlDoc) {
    const diagrams = xmlDoc.getElementsByTagName('diagram');
    const tabsContainer = document.getElementById('diagramTabs');
    const tabContent = document.getElementById('diagramContent');

    // Clear existing tabs and content
    tabsContainer.className = 'nav nav-pills'
    tabsContainer.innerHTML = '';
    tabContent.innerHTML = '';

    Array.from(diagrams).forEach((diagram, index) => {
        const tabId = `tab-${index}`;
        const tabPaneId = `tab-pane-${index}`;

        // Create tab
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

        // Create tab content
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
    saveButton.className = 'btn btn btn-primary mt-3 mr-2';
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

/// Função para sanitizar o conteúdo dos textareas
function sanitizeTextContent(text) {
    // Substitui &nbsp; por um espaço
    text = text.replace(/&nbsp;/g, ' ');
    
    // Substitui <br> por uma nova linha
    text = text.replace(/<br>/g, '\n');
    
    // Extrai o conteúdo de <p> e adiciona uma nova linha no final
    text = text.replace(/<p[^>]*>(.*?)<\/p>/gs, '$1\n');
    
    // Extrai o conteúdo de <font> e adiciona uma nova linha no final
    text = text.replace(/<font[^>]*>(.*?)<\/font>/gs, '$1\n');
    
    // Extrai o conteúdo de <span> e adiciona uma nova linha no final
    text = text.replace(/<span[^>]*>(.*?)<\/span>/gs, '$1\n');
    
    // Extrai o conteúdo de <div> e adiciona uma nova linha no final
    text = text.replace(/<div[^>]*>(.*?)<\/div>/gs, '$1\n');
    
    // Extrai o conteúdo de <b> e adiciona uma nova linha no final
    text = text.replace(/<b[^>]*>(.*?)<\/b>/gs, '$1\n');
    
    // Extrai o conteúdo de <i> e adiciona uma nova linha no final
    text = text.replace(/<i[^>]*>(.*?)<\/i>/gs, '$1\n');
    
    // Extrai o conteúdo de <u> e adiciona uma nova linha no final
    text = text.replace(/<u[^>]*>(.*?)<\/u>/gs, '$1\n');
    
    // Extrai o conteúdo de <h1> e adiciona uma nova linha no final
    text = text.replace(/<h1[^>]*>(.*?)<\/h1>/gs, '$1\n');
    
    // Extrai o conteúdo de <h2> e adiciona uma nova linha no final
    text = text.replace(/<h2[^>]*>(.*?)<\/h2>/gs, '$1\n');
    
    // Extrai o conteúdo de <h3> e adiciona uma nova linha no final
    text = text.replace(/<h3[^>]*>(.*?)<\/h3>/gs, '$1\n');
    
    // Extrai o conteúdo de <h4> e adiciona uma nova linha no final
    text = text.replace(/<h4[^>]*>(.*?)<\/h4>/gs, '$1\n');
    
    // Extrai o conteúdo de <h5> e adiciona uma nova linha no final
    text = text.replace(/<h5[^>]*>(.*?)<\/h5>/gs, '$1\n');
    
    // Extrai o conteúdo de <h6> e adiciona uma nova linha no final
    text = text.replace(/<h6[^>]*>(.*?)<\/h6>/gs, '$1\n');
    
    // Extrai o conteúdo de <a> e adiciona uma nova linha no final
    text = text.replace(/<a[^>]*>(.*?)<\/a>/gs, '$1\n');
    
    // Extrai o conteúdo de <ul> e adiciona uma nova linha no final
    text = text.replace(/<ul[^>]*>(.*?)<\/ul>/gs, '$1\n');
    
    // Extrai o conteúdo de <ol> e adiciona uma nova linha no final
    text = text.replace(/<ol[^>]*>(.*?)<\/ol>/gs, '$1\n');
    
    // Extrai o conteúdo de <li> e adiciona um marcador e uma nova linha no final
    text = text.replace(/<li[^>]*>(.*?)<\/li>/gs, '- $1\n');
    
    // Remove quaisquer outras tags HTML
    text = text.replace(/<[a-z][\s\S]*?>/gi, '');
    
    // Remove espaços e tabulações excessivos e substitui múltiplas novas linhas por uma única nova linha
    text = text.replace(/[ \t]{2,}/g, ' ').replace(/[\r\n]{2,}/g, '\n');
    
    // Remove novas linhas no início do texto
    text = text.replace(/^\s*\n/, '');
    
    // Remove espaços no início de cada linha
    text = text.replace(/^\s+/gm, '');
    
    return text;
}


// Função para alternar entre os temas light e dark
const themeToggle = document.getElementById('themeToggle');
const themeIcon = themeToggle.querySelector('i');

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');

     // Altera o ícone do tema baseado no modo
     themeIcon.className = isDarkMode ? document.querySelector('#themeToggle svg').attributes[4].value = 'moon' : document.querySelector('#themeToggle svg').attributes[4].value = 'sun';

    // Aplica ou remove a classe 'bg-dark' e 'text-light' ao body para dark mode do Bootstrap
    document.body.classList.toggle('bg-dark', isDarkMode);
    document.body.classList.toggle('text-light', isDarkMode);
});

/// Função para aumentar e diminuir o tamanho da fonte
const fontIncreaseBtn = document.getElementById('fontIncreaseBtn');
const fontDecreaseBtn = document.getElementById('fontDecreaseBtn');

let currentFontSize = 16; // Tamanho base da fonte em pixels

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

// Função para atualizar o tamanho da fonte dos elementos textarea
function updateTextareaFontSize(fontSize) {
    const textareas = document.querySelectorAll('textarea');
    textareas.forEach(textarea => {
        textarea.style.fontSize = `${fontSize}px`;
    });
}



// Atualizar o ano atual no rodapé
document.getElementById('anoAtual').textContent = new Date().getFullYear();
