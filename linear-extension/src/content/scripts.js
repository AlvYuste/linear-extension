document.addEventListener('DOMContentLoaded', function() {
    const issueDetailContainer = document.querySelector('.issue-detail'); // Adjust the selector based on the actual structure of the Linear issue detail page

    if (issueDetailContainer) {
        // Create a new section for additional information
        const additionalSection = document.createElement('div');
        additionalSection.className = 'custom-section';
        additionalSection.innerHTML = `
            <h2>Additional Information</h2>
            <p>This section can be used to display custom information related to the issue.</p>
        `;

        // Append the new section to the issue detail container
        issueDetailContainer.appendChild(additionalSection);

        // Create another section for notes
        const notesSection = document.createElement('div');
        notesSection.className = 'notes-section';
        notesSection.innerHTML = `
            <h2>Notes</h2>
            <textarea placeholder="Add your notes here..."></textarea>
        `;

        // Append the notes section to the issue detail container
        issueDetailContainer.appendChild(notesSection);
    }
});