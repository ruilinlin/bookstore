// Event listener for sorting
document.getElementById('sortSelect').addEventListener('change', function() {
  const sortValue = this.value;
  fetchSortedBooks(sortValue);
});

async function fetchSortedBooks(sortValue) {
  // Replace with your API endpoint and sorting logic
  const response = await fetch(`http://localhost:3000/api/books?sort=${sortValue}`);
  const books = await response.json();
  updateBooksDisplay(books);
}

// Event listener for searching
document.querySelector('.searchbar').addEventListener('click', function() {
  const searchTerm = document.getElementById('searchInput').value;
  fetchSearchedBooks(searchTerm);
});

async function fetchSearchedBooks(searchTerm) {
  // Replace with your API endpoint and search logic
  const response = await fetch(`http://localhost:3000/api/books?search=${searchTerm}`);
  const books = await response.json();
  updateBooksDisplay(books);
}

// Update books display
function updateBooksDisplay(books) {
  // Update the HTML to display books
  // This is where you would dynamically update the content based on the fetched data
}

// Example function to initialize your page with default book data
async function initialize() {
  const defaultBooks = await fetch('http://localhost:3000/api/books');
  updateBooksDisplay(defaultBooks);
}

document.addEventListener('DOMContentLoaded', initialize);
