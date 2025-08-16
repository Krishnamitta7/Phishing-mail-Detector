chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.action === "getEmailText") {
        let emailText = '';

        // Try specific selectors for common email clients
       // Update the selector list in content.js
const selectors = [
    '[aria-label="Message Body"]',  // Outlook Web
    '.ii.gt',                      // Gmail
    '.adn.ads',                    // Gmail alternative
    '.message-content',            // Generic
    '.email-body',                 // Generic
    '.message-body',               // Generic
    '.WordSection1',               // Outlook desktop
    'div[role="document"]',        // Outlook alternative
    'div[dir="ltr"]',              // Common direction div
    'div[aria-multiline="true"]',  // Rich text editors
    'div[contenteditable="true"]', // Editable content areas
    'p, div'                       // Fallback
];

        for (let selector of selectors) {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                const text = element.innerText.trim();
                if (text && text.length > 50) {
                    emailText += text + '\n';
                }
            });
            if (emailText) break; // Stop if we found content
        }

        // Fallback to body text if nothing specific found
        if (!emailText) {
            emailText = document.body.innerText.trim();
        }

        sendResponse({emailText: emailText || 'No email content found'});
    }
    return true; // Keep message channel open for async response
});