document.getElementById('checkEmail').addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (!tabs[0]) {
            showResult('Error: No active tab found', 'error');
            return;
        }

        const tabId = tabs[0].id;
        
        // Attempt to send message to content script
        chrome.tabs.sendMessage(tabId, {action: "getEmailText"}, function(response) {
            if (chrome.runtime.lastError) {
                console.log('Error:', chrome.runtime.lastError.message);
                // Fallback: Inject content script if not already present
                chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    files: ['content.js']
                }, () => {
                    if (chrome.runtime.lastError) {
                        showResult('Error: Could not inject content script - ' + chrome.runtime.lastError.message, 'error');
                        return;
                    }
                    // Retry sending message after injection
                    retryMessage(tabId);
                });
            } else if (response && response.emailText) {
                checkPhishing(response.emailText);
            } else {
                showResult('Error: Could not extract email text', 'error');
            }
        });
    });
});

function retryMessage(tabId) {
    setTimeout(() => {
        chrome.tabs.sendMessage(tabId, {action: "getEmailText"}, function(response) {
            if (chrome.runtime.lastError) {
                showResult('Error: Could not connect to content script after retry', 'error');
            } else if (response && response.emailText) {
                checkPhishing(response.emailText);
            } else {
                showResult('Error: No email text received after retry', 'error');
            }
        });
    }, 500); // Wait 500ms for script injection
}

// Modify the checkPhishing function in popup.js
function checkPhishing(emailText) {
    // Show extracted text
    const extractedTextContainer = document.getElementById('extractedTextContainer');
    const extractedText = document.getElementById('extractedText');
    extractedText.value = emailText;
    extractedTextContainer.style.display = 'block';
    
    // Show loading state
    showResult('Analyzing email...', 'loading');
    
    fetch('http://localhost:5000/predict', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({email_text: emailText})
    })
    .then(response => response.json())
// Update the checkPhishing function's then block
.then(data => {
    if (data.error) {
        showResult(`Error: ${data.error}`, 'error');
    } else {
        const message = `${data.prediction}\nConfidence: ${data.confidence.toFixed(2)}%\n` +
                       `Original length: ${data.original_length} chars\n` +
                       `Processed length: ${data.processed_length} chars`;
        showResult(message, data.prediction === 'Safe Email' ? 'safe' : 'phishing');
    }
})
    .catch(error => {
        showResult(`Error: ${error.message}`, 'error');
    });
}

// Add to the style section in popup.html


function showResult(message, className) {
    const resultDiv = document.getElementById('result');
    resultDiv.textContent = message;
    resultDiv.className = className;
}
// Add this to popup.js
document.getElementById('copyText').addEventListener('click', function() {
    const extractedText = document.getElementById('extractedText');
    extractedText.select();
    document.execCommand('copy');
    showResult('Text copied to clipboard!', 'safe');
    setTimeout(() => {
        const resultDiv = document.getElementById('result');
        resultDiv.textContent = '';
        resultDiv.className = '';
    }, 2000);
});