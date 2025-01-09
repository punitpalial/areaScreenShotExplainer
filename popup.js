document.getElementById("selectBtn").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(tab.id, { action: "startSelection" });
});

// Listen for the capture result
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "captureComplete") {
    document.getElementById("result").textContent = "Analyzing with Gemini...";

    // Send to background script for API call
    chrome.runtime.sendMessage(
      {
        action: "analyzeImage",
        screenshot: request.screenshot,
      },
      (response) => {
        document.getElementById("result").textContent = response;
      }
    );
  }
});
