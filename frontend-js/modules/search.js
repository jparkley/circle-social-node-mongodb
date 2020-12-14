import axios from 'axios';
import DOMPurify from 'dompurify';

export default class Search {
  // Select DOM elements and keep track of any useful data
  constructor() {
    this.injectHTML();
    this.searchIcon = document.querySelector('.header-search-icon');
    this.overlayDiv = document.querySelector('.search-overlay');
    this.closeIcon = document.querySelector('.close-live-search');
    this.searchField = document.querySelector('#live-search-field');
    this.resultArea = document.querySelector('.live-search-results'); // live-search-results--visible
    this.loaderIcon = document.querySelector('.circle-loader');
    this.typingWaitTimer;
    this.previousValue = ''; // Previous search input value
    this.events();
  }

  // Events to respond to
  events() {
    this.searchField.addEventListener('keyup', event => this.keyPressHandler())
    this.closeIcon.addEventListener('click', event => this.closeSearchOverlay())
    this.searchIcon.addEventListener('click', event => {
      event.preventDefault();
      this.openSearchOverlay();
    })
  }

  //*** Methods ***//
  keyPressHandler() {
    let value = this.searchField.value;

    if (value == '') {
      clearTimeout(this.typingWaitTimer);
      this.hideLoaderIcon();
      this.hideResultsArea();
    }

    if (value != '' && value != this.previousValue) {
      clearTimeout(this.typingWaitTimer);
      this.showLoaderIcon();
      this.hideResultsArea();
      this.typingWaitTimer = setTimeout(() => this.sendRequest(), 750);
    }
    this.previousValue = value;
  }

  sendRequest() {
    axios.post('/search', {searchTerm: this.searchField.value}).then(response => {
      this.renderResultsToHTML(response.data);
    }).catch(() => {
      alert('axios failed')
    });
  }

  renderResultsToHTML(posts) {
    if (posts.length) {
      this.resultArea.innerHTML = DOMPurify.sanitize(`
        <div class="list-group shadow-sm">
          <div class="list-group-item active"><strong>Search Results</strong> (${posts.length > 1 ? `${posts.length} items found` : '1 item found' })</div>
            ${posts.map(post => {
              let postDate = new Date(post.createdDate);
              return `
              <a href="/post/${post._id}" class="list-group-item list-group-item-action">
                <img class="avatar-tiny" src="${post.author.avatar}"> <strong>${post.title}</strong>
                <span class="text-muted small">by ${post.author.username} on ${postDate.getMonth() + 1}/${postDate.getDate()}/${postDate.getFullYear()}</span>
              </a>
              `
            }).join('')}
        </div>
      `)
    } else {
        this.resultArea.innerHTML = `<p class="alert alert-danger text-center shadow-sm">Sorry, we could not find any results for that search.</p>`
    }
    this.hideLoaderIcon();
    this.showResultsArea();

  }

  hideLoaderIcon() {
    this.loaderIcon.classList.remove('circle-loader--visible');
  }

  showLoaderIcon() {
    this.loaderIcon.classList.add('circle-loader--visible');
  }

  hideResultsArea() {
    this.resultArea.classList.remove('live-search-results--visible');
  }

  showResultsArea() {
    this.resultArea.classList.add('live-search-results--visible')
  }

  openSearchOverlay() {
    this.overlayDiv.classList.add('search-overlay--visible')

    // Because the Div was hidden before this just ran,
    // let's give the browser sometime to process next using setTimeout
    setTimeout(()=> this.searchField.focus(),50);
  }

  closeSearchOverlay() {
    this.overlayDiv.classList.remove('search-overlay--visible')
  }

  injectHTML() {
      document.body.insertAdjacentHTML('beforeend', `  <!-- search feature begins -->
  <div class="search-overlay">
    <div class="search-overlay-top shadow-sm">
      <div class="container container--narrow">
        <label for="live-search-field" class="search-overlay-icon"><i class="fas fa-search"></i></label>
        <input type="text" id="live-search-field" class="live-search-field" placeholder="What are you interested in?">
        <span class="close-live-search"><i class="fas fa-times-circle"></i></span>
      </div>
    </div>

    <div class="search-overlay-bottom">
      <div class="container container--narrow py-3">
        <div class="circle-loader"></div>
        <div class="live-search-results"></div>
      </div>
    </div>
  </div>
  <!-- search feature end -->`)
  }
}
