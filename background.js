chrome.contextMenus.create({
    id: "checkPhishing",
    title: "Check for Phishing",
    contexts: ["selection"]
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "checkPhishing") {
        chrome.tabs.sendMessage(tab.id, {action: "getEmailText"}, (response) => {
            if (response && response.emailText) {
                // You could add additional handling here if needed
            }
        });
    }
});