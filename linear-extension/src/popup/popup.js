document.addEventListener('DOMContentLoaded', function() {
    const addSectionButton = document.getElementById('add-section');
    addSectionButton.addEventListener('click', function() {
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                function: addSectionToLinear
            });
        });
    });
});

function addSectionToLinear() {
    const section = document.createElement('div');
    section.className = 'custom-section';
    section.innerHTML = `
        <h2>Custom Section</h2>
        <p>This is a custom section added by the extension.</p>
    `;
    const issueDetail = document.querySelector('.issue-detail'); // Adjust selector as needed
    if (issueDetail) {
        issueDetail.appendChild(section);
    }
}