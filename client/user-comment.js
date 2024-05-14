let auth0 = null; 
let comments = [];
const bookId = 3; 
let userId; 

const requestedScopes = ["profile", "email"];

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize Auth0 client
    auth0 = await createAuth0Client({
        domain: 'dev-kuqyvtmll4neav1r.us.auth0.com',
        client_id: 'HrdmVyQECTrP8Hy92golHqnoRy3mIIfA',
        redirect_uri: 'http://localhost:3000/user.html'
    });

    // Check authentication and set user ID
    const isAuthenticated = await auth0.isAuthenticated();
    if (isAuthenticated) {
        const user = await auth0.getUser();
        userId = user.sub; // or another unique identifier from the user object
        sessionStorage.setItem('userId', userId);
    }

    // Fetch and display comments
    await fetchComments();

    // Add event listener to comment form
    document.querySelector(".comment-form form").addEventListener("submit", async function(e) {
        e.preventDefault();
        const text = document.getElementById('commentText').value.trim();
        const id = document.getElementById('editCommentId').value;
        let method = id ? 'PUT' : 'POST';
        let endpoint = 'http://localhost:3000/api/comments';
        if (id) {
            endpoint += `/${id}`;
        }

        try {
            const accessToken = await getAccessTokenSilently({
                authorizationParams: {
                  audience: process.env.AUTH0_AUDIENCE,
                  scope: requestedScopes.join(" "),
                },
              });
            console.log('Retrieved Access Token:', accessToken);
            const response = await fetch(endpoint, {
                method: method,
                headers: { 'Content-Type': 'application/json',
                           'Authorization': `Bearer ${accessToken}` },
                body: JSON.stringify({ text, bookId, userId })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            document.getElementById('commentText').value = '';
            document.getElementById('editCommentId').value = '';
            await fetchComments(); // Reload comments
        } catch (error) {
            console.error('Error submitting comment:', error);
        }
    });

    // Add event listeners for delete and edit buttons
    document.querySelector(".comment-list").addEventListener("click", async function(e) {
        const id = parseInt(e.target.closest('li').dataset.id);
        if (e.target.matches(".remove-comment")) {
            await deleteComment(id);
        } else if (e.target.matches(".edit-comment")) {
            const commentToEdit = comments.find(comment => comment.id === id);
            editComment(commentToEdit);
        }
    });
});

async function fetchComments() {
    try {
        const response = await fetch(`http://localhost:3000/api/comments/book/${bookId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();

        if (!Array.isArray(data)) {
            console.error('Fetched data is not an array:', data);
            return; // Exit the function if data is not an array
        }

        comments = data;
        updateComments();
    } catch (error) {
        console.error('Error fetching comments:', error);
    }
}

function updateComments() {
    const html = comments.map(comment => `
        <li class="comment-item" data-id="${comment.id}">
            <span class="commentText">${comment.text}</span>
            <button class="edit-comment">Edit</button>
            <button class="remove-comment">Delete</button>
        </li>
    `).join("");
    document.querySelector(".comment-list").innerHTML = html;
}

async function deleteComment(id) {
    await fetch(`http://localhost:3000/api/comments/${id}`, { method: 'DELETE' });
    await fetchComments();
}

function editComment(comment) {
    document.getElementById('commentText').value = comment.text;
    document.getElementById('editCommentId').value = comment.id;
}
