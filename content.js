let startX,
  startY,
  endX,
  endY,
  isSelecting = false;
let selectionDiv;
let startSelection = false;

document.addEventListener("keydown", (keyPressed) => {
  if (keyPressed.key === "Alt") {
    startSelection = true;
    // chrome.runtime.sendMessage({ action: "startSelection" });
  }
});

document.addEventListener("keyup", (keyPressed) => {
  if (keyPressed.key === "Alt") {
    startSelection = false;
  }
});

// Add a mouse event listener to start selection
document.addEventListener("mousedown", (e) => {
  if (e.button !== 0 || !startSelection) return; // Left-click only
  isSelecting = true;

  // Start coordinates
  startX = e.pageX;
  startY = e.pageY;

  // Create the selection overlay
  selectionDiv = document.createElement("div");
  selectionDiv.style.position = "absolute";
  selectionDiv.style.border = "2px dashed #000";
  selectionDiv.style.background = "rgba(0, 0, 0, 0.3)";
  selectionDiv.style.zIndex = "9999";
  document.body.appendChild(selectionDiv);

  selectionDiv.style.left = `${startX}px`;
  selectionDiv.style.top = `${startY}px`;
});

// Adjust selection rectangle size dynamically
document.addEventListener("mousemove", (e) => {
  if (!isSelecting) return;

  endX = e.pageX;
  endY = e.pageY;

  // Calculate width and height of the selection box
  const width = Math.abs(endX - startX);
  const height = Math.abs(endY - startY);

  selectionDiv.style.width = `${width}px`;
  selectionDiv.style.height = `${height}px`;

  // Adjust position based on direction of drag
  selectionDiv.style.left = `${Math.min(startX, endX)}px`;
  selectionDiv.style.top = `${Math.min(startY, endY)}px`;
});

// Finalize selection and capture the image
document.addEventListener("mouseup", async (e) => {
  if (!isSelecting) return;

  isSelecting = false;

  // Remove the selection rectangle
  if (selectionDiv) {
    document.body.removeChild(selectionDiv);
    selectionDiv = null;
  }

  // Capture the visible tab
  chrome.runtime.sendMessage({ action: "captureVisibleTab" }, (dataUrl) => {
    if (!dataUrl) {
      console.error("Failed to capture tab.");
      return;
    }

    // Get selection dimensions
    const cropX = Math.min(startX, endX);
    const cropY = Math.min(startY, endY);
    const cropWidth = Math.abs(endX - startX);
    const cropHeight = Math.abs(endY - startY);

    // Crop the image
    cropImage(dataUrl, cropX, cropY, cropWidth, cropHeight);
  });
});

// Function to crop the captured image
function cropImage(dataUrl, x, y, width, height) {
  const img = new Image();
  img.src = dataUrl;

  img.onload = () => {
    const scaleFactor = window.devicePixelRatio; // Account for DPI scaling
    const canvas = document.createElement("canvas");
    canvas.width = width * scaleFactor;
    canvas.height = height * scaleFactor;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(
      img,
      x * scaleFactor,
      y * scaleFactor,
      width * scaleFactor,
      height * scaleFactor,
      0,
      0,
      width * scaleFactor,
      height * scaleFactor
    );

    // Get the cropped image as a new data URL
    const croppedDataUrl = canvas.toDataURL("image/png");
    // console.log("Cropped Image URL:", croppedDataUrl);

    // Optionally, send the cropped image to the background script or save it
    chrome.runtime.sendMessage(
      {
        action: "saveCroppedImage",
        dataUrl: croppedDataUrl,
      },
      (responseText) => {
        console.log("Response received:", responseText);
      }
    );
  };
}

// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   if (message.action === "responseReceived") {
//     console.log("Response received:", message.text);
//   }
// });
