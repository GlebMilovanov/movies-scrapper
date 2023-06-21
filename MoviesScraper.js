class MoviesScrapper {
  constructor() {
    this._movies = [];
    this._url = 'https://us-central1-proxy-24e43.cloudfunctions.net/api?url=';
  }

  async loadMovies() {
    const groupSize = 10;

    let page = 1;
    let hasMovies = true;

    while (hasMovies) {
      const link = `https://www.kinopoisk.ru/lists/movies/top250/?page=${page}`;
      const html = await this._fetchMoviesHTML(link);
      const links = this._extractMovieLinks(html);

      if (links.length === 0) {
        hasMovies = false;
      } else {
        const linkGroups = this._splitIntoGroups(links, groupSize);
        await Promise.all(
          linkGroups.map(this._loadMoviesFromLinks.bind(this))
        );

        page++;
      }
    }
  }

  _splitIntoGroups(array, groupSize) {
    const groups = [];
    for (let i = 0; i < array.length; i += groupSize) {
      const group = array.slice(i, i + groupSize);
      groups.push(group);
    }

    return groups;
  }

  async _loadMoviesFromLinks(links) {
    const movies = await Promise.all(
      links.map(async (link) => {
        const html = await this._fetchMoviesHTML(link);
        const movie = this._parseMovie(html);
        return movie;
      })
    );

    this._movies.push(...movies);
  }

  async _fetchMoviesHTML(link) {
    const response = await fetch(`${this._url}${link}`);
    const html = await response.text();
    return html;
  }

  _extractMovieLinks(html) {
    const doc = this._parseHTMLDocument(html);
    const links = doc.querySelectorAll('[class^="styles_poster"]');
    const href = Array.from(links).map((link) => {
      return link.href.replace(
        /^http:\/\/127\.0\.0\.1:5500/,
        'https://www.kinopoisk.ru'
      );
    });
    return href;
  }

  _parseHTMLDocument(html) {
    const parser = new DOMParser();
    return parser.parseFromString(html, 'text/html');
  }

  async _loadMoviesFromLinks(links) {
    for (const link of links) {
      const html = await this._fetchMoviesHTML(link);
      const movie = this._parseMovie(html);
      this._movies.push(movie);
    }
  }

  _findElementByXPath(doc, xpath) {
    const element = doc.evaluate(
      xpath,
      doc,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    ).singleNodeValue;

    return element;
  }

  _getIdFromHref(href) {
    const start = href.indexOf('/film/') + 6;
    const end = href.indexOf('/', start);
    const id = href.substring(start, end);

    return id;
  }

  _parseId(doc) {
    const xpath = '//a[contains(@class, "film-rating-value")]';
    const ratingLinkHref = this._findElementByXPath(doc, xpath).href;
    const filmId = parseInt(this._getIdFromHref(ratingLinkHref));

    return filmId;
  }

  _parseTitle(doc) {
    const titleElement = doc.querySelector('[data-tid="75209b22"]');
    const title = titleElement.textContent
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\s*\(\d+\)$/, '');

    return title;
  }

  _parseDescription(doc) {
    const descriptionElement = doc.querySelector('[data-tid="bbb11238"]');
    const description = descriptionElement.textContent
      .replace(/\s+/g, ' ')
      .trim();

    return description;
  }

  _parsePoster(doc) {
    const xpath = '//img[contains(@class, "film-poster")]';
    const posterElement = this._findElementByXPath(doc, xpath);
    const poster = posterElement.src;

    return poster;
  }

  _parseYear(doc) {
    const yearElement = doc.querySelector('[data-tid="cfbe5a01"]');
    const year = parseInt(yearElement.textContent);

    return year;
  }

  _parseCountry(doc) {
    const xpath = '//div[contains(div, "Страна")]/div/a';
    const countryElement = this._findElementByXPath(doc, xpath);
    const country = countryElement.textContent;

    return country;
  }

  _parseGenres(doc) {
    const genres = [];
    const xpath = '//div[contains(div, "Жанр")]/div/div/a';

    const genreElements = doc.evaluate(
      xpath,
      doc,
      null,
      XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
      null
    );

    for (let i = 0; i < genreElements.snapshotLength; i++) {
      const genre = genreElements.snapshotItem(i);
      genres.push(genre.textContent);
    }

    return genres;
  }

  _parseDirector(doc) {
    const xpath = '//div[contains(div, "Режиссер")]/div/a';
    const directorElement = this._findElementByXPath(doc, xpath);
    const director = directorElement.textContent;

    return director;
  }

  _parseBudget(doc) {
    const xpath = '//div[contains(div, "Бюджет")]/div/a';
    const budgetElement = this._findElementByXPath(doc, xpath);
    const budget = budgetElement?.textContent;

    return budget;
  }

  _parseRating(doc) {
    const ratingElement = doc.querySelector('[data-tid="939058a8"]');
    const rating = parseFloat(ratingElement.textContent);

    return rating;
  }

  _parseDuration(doc) {
    const xpath = '//div[contains(text(), "мин.")]';
    const durationElement = this._findElementByXPath(doc, xpath);
    const minutes = parseInt(durationElement.textContent);

    return minutes;
  }

  _parseMovie(html) {
    const doc = this._parseHTMLDocument(html);

    const id = this._parseId(doc);

    const title = this._parseTitle(doc);

    const description = this._parseDescription(doc);

    const poster = this._parsePoster(doc);

    const year = this._parseYear(doc);

    const country = this._parseCountry(doc);

    const genres = this._parseGenres(doc);

    const director = this._parseDirector(doc);

    const budget = this._parseBudget(doc);

    const rating = this._parseRating(doc);

    const duration = this._parseDuration(doc);

    return {
      id,
      title,
      description,
      poster,
      year,
      country,
      genres,
      director,
      budget,
      rating,
      duration,
    };
  }

  findMovie(query) {
    const searchTerm = query.toLowerCase();
    const matchedMovies = this._movies.filter(
      ({ title, description }) =>
        title.toLowerCase().includes(searchTerm) ||
        description.toLowerCase().includes(searchTerm)
    );

    return matchedMovies;
  }

  getMovie(id) {
    return this._movies.find((movie) => movie.id === id);
  }

  getMoviesByYear(year) {
    return this._movies.filter((movie) => movie.year === year);
  }

  getRandomMovie(genre = null) {
    let movies = this._movies;

    if (genre) {
      const lowercaseGenre = genre.toLowerCase();
      movies = this._movies.filter((movie) =>
        movie.genres.includes(lowercaseGenre)
      );
    }

    const randomIndex = Math.floor(Math.random() * movies.length);
    return movies[randomIndex];
  }

  searchMoviesByDuration(minDuration, maxDuration) {
    const filteredMovies = this._movies.filter((movie) => {
      const { duration } = movie;
      return duration >= minDuration && duration <= maxDuration;
    });

    return filteredMovies;
  }
}

export default MoviesScrapper;
