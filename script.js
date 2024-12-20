const canvas = document.getElementById('whiteboard');
const ctx = canvas.getContext('2d');

// Set canvas dimensions
canvas.width = canvas.offsetWidth;
canvas.height = canvas.offsetHeight;

// State Variables
let isDrawing = false;
let tool = 'pen';
let lineWidth = 2;
let strokeColor = '#000000';
let startX, startY;
let snapshot; // Snapshot to save canvas state for shapes
let isLocked = false;


// Update line width and color
document.getElementById('line-width').addEventListener('change', (e) => {
    lineWidth = e.target.value;
});
document.getElementById('color-picker').addEventListener('change', (e) => {
    strokeColor = e.target.value; // Continue updating stroke color for drawing
    document.documentElement.style.setProperty('--selected-text-color', strokeColor); // Update global CSS variable for text
});


// Tool Selection
document.getElementById('pen').addEventListener('click', () => setTool('pen'));
document.getElementById('eraser').addEventListener('click', () => setTool('eraser'));
document.getElementById('line').addEventListener('click', () => setTool('line'));
document.getElementById('rectangle').addEventListener('click', () => setTool('rectangle'));
document.getElementById('circle').addEventListener('click', () => setTool('circle'));
document.getElementById('arrow').addEventListener('click', () => setTool('arrow'));
document.getElementById('ellipse').addEventListener('click', () => setTool('ellipse'));

function setTool(selectedTool) {
    tool = selectedTool;
    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';

    // Highlight the selected tool
    document.querySelectorAll('#toolbar button').forEach((button) => {
        button.classList.remove('selected-tool'); // Remove highlight from all tools
    });
    const selectedButton = document.getElementById(selectedTool);
    if (selectedButton) {
        selectedButton.classList.add('selected-tool'); // Highlight the current tool
    }
}

document.getElementById('lock-toggle').addEventListener('click', () => {
    isLocked = !isLocked;

    // Update button icon and title
    const lockButton = document.getElementById('lock-toggle');
    if (isLocked) {
        lockButton.innerHTML = '<i class="fas fa-lock"></i>';
        lockButton.title = 'Lock Drawing'; // Indicate canvas is locked

        // Disable all buttons except lock button
        const buttons = document.querySelectorAll('#toolbar button');
        buttons.forEach(button => {
            if (button !== lockButton) { // Exclude the lock button
                button.style.cursor = 'not-allowed';
                button.disabled = true; // Disable buttons when locked
            }
        });
    } else {
        lockButton.innerHTML = '<i class="fas fa-lock-open"></i>';
        lockButton.title = 'Unlock Drawing'; // Indicate canvas is unlocked

        // Enable all buttons except lock button
        const buttons = document.querySelectorAll('#toolbar button');
        buttons.forEach(button => {
            if (button !== lockButton) { // Exclude the lock button
                button.style.cursor = 'pointer'; // Default cursor
                button.disabled = false; // Enable buttons when unlocked
            }
        });
    }

    updateCanvasLockStyle(); // Apply lock state styling
});


function updateCanvasLockStyle() {
    if (isLocked) {
        canvas.style.opacity = '0.7'; // Dim the canvas when locked
        canvas.style.pointerEvents = 'none'; // Disable interaction with the canvas
    } else {
        canvas.style.opacity = '1'; // Restore normal opacity when unlocked
        canvas.style.pointerEvents = 'auto'; // Enable interaction with the canvas
    }
}



// Mouse Events
canvas.addEventListener('mousedown', (e) => {
    if (isLocked) return; // Prevent drawing when locked
    startDrawing(e);
});

canvas.addEventListener('mousemove', (e) => {
    if (isLocked) return; // Prevent drawing when locked
    draw(e);
});

canvas.addEventListener('mouseup', (e) => {
    if (isLocked) return; // Prevent drawing when locked
    stopDrawing(e);
});

canvas.addEventListener('mouseout', (e) => {
    if (isLocked) return; // Prevent drawing when locked
    stopDrawing(e);
});

// Initialize the lock state on page load
document.addEventListener('DOMContentLoaded', () => {
    updateCanvasLockStyle(); // Apply lock state styling on page load
});


// Drawing Logic
function startDrawing(e) {
    isDrawing = true;
    [startX, startY] = [e.offsetX, e.offsetY];
    snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);

    if (tool === 'pen' || tool === 'eraser') {
        ctx.beginPath();
        ctx.moveTo(startX, startY);
    } else if (tool === 'text') {
        createTextInputOnCanvas(e.offsetX, e.offsetY);
        isDrawing = false; // Prevent further drawing
    }
}


function draw(e) {
    if (!isDrawing || tool === 'text') return;

    ctx.putImageData(snapshot, 0, 0); // Restore canvas for shapes
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = strokeColor;
    ctx.fillStyle = strokeColor;

    if (tool === 'pen' || tool === 'eraser') {
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
    } else if (tool === 'line') {
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
    } else if (tool === 'rectangle') {
        ctx.strokeRect(startX, startY, e.offsetX - startX, e.offsetY - startY);
    } else if (tool === 'circle') {
        const radius = Math.sqrt((e.offsetX - startX) ** 2 + (e.offsetY - startY) ** 2);
        ctx.beginPath();
        ctx.arc(startX, startY, radius, 0, Math.PI * 2);
        ctx.stroke();
    } else if (tool === 'arrow') {
        drawArrow(startX, startY, e.offsetX, e.offsetY);
    } else if (tool === 'ellipse') {
        drawEllipse(startX, startY, e.offsetX, e.offsetY);
    }
}

function stopDrawing() {
    isDrawing = false;
    ctx.beginPath();
}

// Arrow Drawing Function
function drawArrow(x1, y1, x2, y2) {
    const headLength = 10; // Arrowhead size
    const angle = Math.atan2(y2 - y1, x2 - x1);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.lineTo(
        x2 - headLength * Math.cos(angle - Math.PI / 6),
        y2 - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(x2, y2);
    ctx.lineTo(
        x2 - headLength * Math.cos(angle + Math.PI / 6),
        y2 - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.stroke();
}

// Ellipse Drawing Function
function drawEllipse(x1, y1, x2, y2) {
    const radiusX = Math.abs(x2 - x1) / 2;
    const radiusY = Math.abs(y2 - y1) / 2;
    const centerX = (x1 + x2) / 2;
    const centerY = (y1 + y2) / 2;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
    ctx.stroke();
}



// Sticky Notes
document.getElementById('sticky').addEventListener('click', () => {
    const note = document.createElement('div');
    note.className = 'sticky-note';
    note.contentEditable = true;
    note.style.left = '100px';
    note.style.top = '100px';
    note.style.color = strokeColor; // Set initial text color

    // Add event listener to dynamically apply the selected color during editing
    note.addEventListener('input', () => {
        note.style.color = strokeColor; // Update the text color dynamically
    });

    document.getElementById('whiteboard-container').appendChild(note);

    // Enable drag functionality
    note.onmousedown = (e) => {
        let shiftX = e.clientX - note.offsetLeft;
        let shiftY = e.clientY - note.offsetTop;

        function moveAt(pageX, pageY) {
            note.style.left = pageX - shiftX + 'px';
            note.style.top = pageY - shiftY + 'px';
        }

        function onMouseMove(event) {
            moveAt(event.pageX, event.pageY);
        }

        document.addEventListener('mousemove', onMouseMove);
        note.onmouseup = () => {
            document.removeEventListener('mousemove', onMouseMove);
        };
    };

    note.ondragstart = () => false;

    // Add right-click delete feature
    note.addEventListener('contextmenu', (e) => {
        e.preventDefault(); // Prevent the default context menu from appearing
        if (confirm('Do you want to delete this sticky note?')) {
            note.remove(); // Remove the sticky note
        }
    });
});


// Dark Mode Toggle
// Toggle theme on button click
document.getElementById('theme-toggle').addEventListener('click', () => {
    const isDarkMode = document.body.classList.toggle('dark-mode');
    applyThemeStyles(isDarkMode);
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light'); // Save preference
});

// Apply the saved theme on page load
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme');
    const isDarkMode = savedTheme === 'dark';
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
    }
    applyThemeStyles(isDarkMode);
});

// Function to apply theme styles dynamically
function applyThemeStyles(isDarkMode) {
    if (isDarkMode) {
        // Apply dark mode styles
        document.body.style.backgroundColor = '#1e1e1e';
        document.body.style.color = '#ffffff';
        document.body.style.transition = 'background-color 0.3s, color 0.3s';
    } else {
        // Apply light mode styles
        document.body.style.backgroundColor = '#ffffff';
        document.body.style.color = '#000000';
        document.body.style.transition = 'background-color 0.3s, color 0.3s';
    }
}

// Text Tool Logic
document.getElementById('text').addEventListener('click', () => {
    const textBox = document.createElement('div');
    textBox.className = 'text-tool';
    textBox.contentEditable = true;

    // Initial styles for the text box
    textBox.style.position = 'absolute';
    textBox.style.left = '100px';
    textBox.style.top = '100px';
    textBox.style.width = '200px';
    textBox.style.height = '100px';
    textBox.style.border = '1px dashed gray';
    textBox.style.backgroundColor = 'white';
    textBox.style.font = '16px Arial';
    textBox.style.padding = '5px';
    textBox.style.overflowWrap = 'break-word';
    textBox.style.resize = 'both';
    textBox.style.overflow = 'hidden';
    textBox.style.cursor = 'move';

    textBox.style.color = strokeColor; // Set initial text color

    // Add event listener to dynamically apply the selected color during editing
    textBox.addEventListener('input', () => {
        textBox.style.color = strokeColor; // Update the text color dynamically
    });

    document.getElementById('whiteboard-container').appendChild(textBox);
    textBox.focus();

    // Dragging functionality
    textBox.addEventListener('mousedown', (e) => {
        if (e.target !== textBox || e.offsetX > parseInt(textBox.style.width) - 20) return; // Ignore resize handles
        const shiftX = e.clientX - textBox.offsetLeft;
        const shiftY = e.clientY - textBox.offsetTop;

        function moveAt(pageX, pageY) {
            textBox.style.left = `${pageX - shiftX}px`;
            textBox.style.top = `${pageY - shiftY}px`;
        }

        function onMouseMove(event) {
            moveAt(event.pageX, event.pageY);
        }

        document.addEventListener('mousemove', onMouseMove);

        document.addEventListener('mouseup', () => {
            document.removeEventListener('mousemove', onMouseMove);
        }, { once: true });
    });

    textBox.ondragstart = () => false; // Disable default drag behavior

    // Double-click to enable editing
    textBox.addEventListener('dblclick', () => {
        textBox.contentEditable = true;
        textBox.style.border = '1px dashed gray';
        textBox.focus();
    });

    // Blur event to stop editing
    textBox.addEventListener('blur', () => {
        textBox.contentEditable = false;
        textBox.style.border = 'none';
    });

    // Right-click to delete text box
    textBox.addEventListener('contextmenu', (e) => {
        e.preventDefault(); // Prevent default context menu
        if (confirm('Do you want to delete this text box?')) {
            textBox.remove(); // Remove the text box from the DOM
        }
    });
});

// Save text onto the canvas when user finishes editing
function saveTextToCanvas(textBox) {
    const text = textBox.innerText;
    const x = parseInt(textBox.style.left);
    const y = parseInt(textBox.style.top);
    const maxWidth = parseInt(textBox.style.width);

    if (!text.trim()) return; // Skip empty text

    ctx.font = '16px Arial';
    ctx.fillStyle = '#000'; // Default text color
    const lineHeight = 20; // Adjust line height
    const words = text.split(' ');
    let line = '';
    let yOffset = 0;

    words.forEach((word) => {
        const testLine = `${line}${word} `;
        const testWidth = ctx.measureText(testLine).width;

        if (testWidth > maxWidth && line) {
            ctx.fillText(line, x, y + yOffset);
            line = `${word} `;
            yOffset += lineHeight;
        } else {
            line = testLine;
        }
    });

    // Draw remaining text
    ctx.fillText(line, x, y + yOffset);
}



document.getElementById('download').addEventListener('click', () => {
    console.log("Download");

    // Clone the current document
    const cloneDocument = document.documentElement.cloneNode(true);

    // Handle external stylesheets
    const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
    const headClone = cloneDocument.querySelector('head');

    stylesheets.forEach((stylesheet) => {
        const newLink = document.createElement('link');
        newLink.rel = 'stylesheet';
        newLink.href = stylesheet.href;
        headClone.appendChild(newLink);
    });

    // Process all canvas elements
    const canvases = document.querySelectorAll('canvas');
    const clonedCanvases = cloneDocument.querySelectorAll('canvas');

    canvases.forEach((canvas, index) => {
        const dataURL = canvas.toDataURL(); // Get canvas content as a data URL
        const img = document.createElement('img'); // Create an image element
        img.src = dataURL; // Set the data URL as the image source

        // Replace the canvas in the cloned document with the image
        clonedCanvases[index].replaceWith(img);
    });

    // Handle sticky notes
    const stickyNotes = document.querySelectorAll('.sticky-note'); // Select all sticky notes
    const clonedStickyContainer = cloneDocument.querySelector('#whiteboard-container');

    stickyNotes.forEach((note) => {
        const clonedNote = document.createElement('div');
        clonedNote.className = 'sticky-note'; // Assign the sticky-note class
        clonedNote.style.cssText = note.style.cssText; // Copy styles from the original
        clonedNote.textContent = note.textContent; // Copy the text content
        clonedStickyContainer.appendChild(clonedNote); // Add it to the cloned container
    });

    // Ensure dynamically added text areas or elements are handled
    const textAreas = document.querySelectorAll('.text-tool');
    const clonedTextContainer = cloneDocument.querySelector('#whiteboard-container');

    textAreas.forEach((textArea) => {
        const clonedText = document.createElement('div');
        clonedText.className = 'text-tool';
        clonedText.style.cssText = textArea.style.cssText;
        clonedText.textContent = textArea.textContent;
        clonedTextContainer.appendChild(clonedText);
    });

    // Get the updated HTML content of the cloned document
    const pageContent = `<!DOCTYPE html>\n${cloneDocument.outerHTML}`;

    // Create a Blob object with the HTML content
    const blob = new Blob([pageContent], { type: 'text/html' });

    // Create a temporary anchor element for downloading
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'page_snapshot.html'; // Default filename for the download

    // Trigger the download
    a.click();

    // Clean up the object URL to free memory
    URL.revokeObjectURL(a.href);
});

// Select elements
const deleteButton = document.getElementById('delete');


// Clear function
deleteButton.addEventListener('click', () => {
    // Confirm before deleting
    const confirmDelete = confirm("Are you sure you want to clear the canvas?");
    if (!confirmDelete) return;

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dynamically select and remove all text tool elements
    document.querySelectorAll('.text-tool').forEach((textTool) => textTool.remove());

    // Dynamically select and remove all sticky notes
    document.querySelectorAll('.sticky-note').forEach((stickyNote) => stickyNote.remove());

    alert("Canvas cleared!");
});


// User logout function

let logout = document.getElementById('logout')

function userlogOut() {

    window.location.href = './logIn.html'
}


// Drawings
let drawings = JSON.parse(localStorage.getItem('drawings')) || [];

// Track the drawing being edited
let currentEditingId = null;

// Save the current drawing to localStorage
document.addEventListener("DOMContentLoaded", function () {
    // Generate unique IDs for drawings
    function generateId() {
        return Date.now();
    }

    // Save the current drawing
    function saveDrawing() {
        const canvas = document.getElementById('whiteboard');
        if (!canvas) {
            console.error("Canvas element not found!");
            return;
        }

        const drawingData = canvas.toDataURL();

        if (currentEditingId) {
            // Update existing drawing
            const drawingIndex = drawings.findIndex(drawing => drawing.id === currentEditingId);
            if (drawingIndex !== -1) {
                drawings[drawingIndex].data = drawingData;
                console.log("Updated drawing with ID:", currentEditingId);
            } else {
                console.error("No drawing found to update with ID:", currentEditingId);
            }
        } else {
            // Create a new drawing
            const newDrawing = {
                id: generateId(),
                title: 'My Drawing',
                data: drawingData,
            };
            drawings.push(newDrawing);
            console.log("New drawing saved:", newDrawing);
        }

        // Save updated drawings to localStorage
        try {
            localStorage.setItem('drawings', JSON.stringify(drawings));
        } catch (e) {
            console.error("Failed to save drawings:", e);
        }

        // Reset editing state
        currentEditingId = null;
        loadDrawings();
    }

    // Clear the canvas for a new drawing
    function newDrawing() {
        const canvas = document.getElementById('whiteboard');
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas
        currentEditingId = null; // Reset editing state
        console.log("Canvas cleared for a new drawing.");
    }

    // Attach event listeners to buttons
    document.getElementById('saveButton').onclick = saveDrawing;
    document.getElementById('newDrawingButton').onclick = newDrawing;

    // Initial load of drawings
    loadDrawings();
});

// Load Drawings
function loadDrawings() {
    const storedDrawings = localStorage.getItem('drawings');
    if (storedDrawings) {
        drawings = JSON.parse(storedDrawings);
    }
    displayDrawings(drawings);
}

// Display Drawings
function displayDrawings(drawings) {
    const drawingList = document.getElementById('drawingList');
    drawingList.innerHTML = '';

    drawings.forEach(drawing => {
        console.log(drawing);
        const listItem = document.createElement('li');
        // listItem.textContent = drawing.title;
        
        let img = document.createElement('img');
        img.src = drawing.data; // Set the source of the image to the drawing's data
        img.alt = 'Drawing'; // Set alt text for accessibility
        img.className = 'drawing-image'; // Add a class name to the image

        const editButton = document.createElement('button');
        editButton.textContent = 'Edit';
        img.id = 'edit-image'

        editButton.addEventListener('click', () => {
            loadDrawingForEdit(drawing.id);
        });

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        img.id = 'delete-image'

        deleteButton.addEventListener('click', () => {
            deleteDrawing(drawing.id);
        });
         
        listItem.appendChild(img)
        listItem.appendChild(editButton);
        listItem.appendChild(deleteButton);
        drawingList.appendChild(listItem);
    });
}

// Load Drawing for Editing
function loadDrawingForEdit(drawingId) {
    const drawingToEdit = drawings.find(drawing => drawing.id === drawingId);
    if (!drawingToEdit) {
        console.error("Drawing not found for ID:", drawingId);
        return;
    }

    const canvas = document.getElementById('whiteboard');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear existing content
        ctx.drawImage(img, 0, 0);
    };

    img.src = drawingToEdit.data;
    currentEditingId = drawingId; // Set the current editing ID
    console.log(`Loaded drawing with ID: ${drawingId}`);
}

// Delete Drawing
function deleteDrawing(drawingId) {
    const index = drawings.findIndex(drawing => drawing.id === drawingId);
    if (index !== -1) {
        drawings.splice(index, 1);
        localStorage.setItem('drawings', JSON.stringify(drawings));
        loadDrawings();
    }
}

// Initial Load
loadDrawings();
