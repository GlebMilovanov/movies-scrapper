class MoviesScrapper {
  constructor() {
    this.movies = [];
    console.log(this.movies);
  }

  async loadMovies() {
    let page = 1;
    let hasMovies = true;

    while (hasMovies) {
      const url = `https://us-central1-proxy-24e43.cloudfunctions.net/api?url=https://www.kinopoisk.ru/lists/movies/top250/?page=${page}`;
      const response = await fetch(url);
      const html = await response.text();
      const links = this._extractMovieLinks(html);
      if (links.length === 0) {
        hasMovies = false;
      } else {
        await this._loadMoviesFromLinks(links);
        page++;
      }
    }
  }

  async _loadMoviesFromLinks(links) {
    for (const link of links) {
      const url = `https://us-central1-proxy-24e43.cloudfunctions.net/api?url=${link}`;
      const response = await fetch(url);
      const html = await response.text();
      const movie = this._parseMovie(html);
      this.movies.push(movie);
    }
    const moviesWithUndefined = this.movies.filter((movie) =>
      Object.values(movie).includes(undefined)
    );

    console.log(moviesWithUndefined);
  }

  _extractMovieLinks(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const links = doc.querySelectorAll('[class^="styles_poster"]');

    return Array.from(links).map((link) => {
      const href = link.href.replace(
        /^http:\/\/127\.0\.0\.1:5500/,
        'https://www.kinopoisk.ru'
      );
      return href;
    });
  }

  _parseTitle(doc) {
    return doc
      .querySelector('[data-tid="75209b22"]')
      .textContent.replace(/\s+/g, ' ')
      .trim()
      .replace(/\s*\(\d+\)$/, '');
  }

  _parseDescription(doc) {
    return doc
      .querySelector('[data-tid="bbb11238"]')
      .textContent.replace(/\s+/g, ' ')
      .trim();
  }

  _parsePoster(doc) {
    let poster = null;

    try {
      let node = doc.evaluate(
        '//*[@id="__next"]/div[2]/div[2]/div[2]/div[2]/div/div[1]/div/div/div[1]/div/a/img',
        doc,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      ).singleNodeValue;
      if (node) {
        poster = node.src;
      }
    } catch (error) {
      console.log('Постер не найден по первому пути');
    }

    if (!poster) {
      try {
        let node = doc.evaluate(
          '//*[@id="__next"]/div[2]/div[2]/div[1]/div[2]/div/div[1]/div/div/div[1]/div/a/img',
          doc,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        ).singleNodeValue;
        if (node) {
          poster = node.src;
        }
      } catch (error) {
        console.log('Постер не найден по второму пути');
      }
    }

    return poster;
  }

  _parseYear(doc) {
    return parseInt(doc.querySelector('[data-tid="cfbe5a01"]').textContent);
  }
  /* need to fix */
  _parseCountry(doc) {
    return doc.evaluate(
      '//*[@id="__next"]/div[2]/div[2]/div[2]/div[2]/div/div[3]/div/div/div[2]/div[1]/div/div[2]/div[2]/a',
      doc,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    ).singleNodeValue?.textContent;
  }

  _parseGenres(doc) {
    const genres = [];

    const genreElements = doc.evaluate(
      '//*[@id="__next"]/div[2]/div[2]/div[2]/div[2]/div/div[3]/div/div/div[2]/div[1]/div/div[3]/div[2]/div/a',
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
  /* need to fix */
  _parseDirector(doc) {
    let director = null;

    try {
      let node = doc.evaluate(
        '//*[@id="__next"]/div[2]/div[2]/div[1]/div[2]/div/div[3]/div/div/div[2]/div[1]/div/div[5]/div[2]/a',
        doc,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      ).singleNodeValue;
      if (node) {
        director = node.textContent;
      }
    } catch (error) {
      console.error(error);
    }

    if (!director) {
      try {
        let node = doc.evaluate(
          '//*[@id="__next"]/div[2]/div[2]/div[2]/div[2]/div/div[3]/div/div/div[2]/div[1]/div/div[7]/div[2]/a',
          doc,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        ).singleNodeValue;
        if (node) {
          director = node.textContent;
        }
      } catch (error) {
        console.error(error);
      }
    }
  }

  _parseBudget(doc) {
    return doc.evaluate(
      '//*[@id="__next"]/div[2]/div[2]/div[2]/div[2]/div/div[3]/div/div/div[2]/div[1]/div/div[11]/div[2]/a',
      doc,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    ).singleNodeValue?.textContent;
  }

  _parseRating(doc) {
    return parseFloat(doc.querySelector('[data-tid="939058a8"]').textContent);
  }

  _parseMovie(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const id = '';

    const title = this._parseTitle(doc);

    const description = this._parseDescription(doc);

    const poster = this._parsePoster(doc);

    const year = this._parseYear(doc);

    const country = this._parseCountry(doc);

    const genres = this._parseGenres(doc);

    const director = this._parseDirector(doc);

    const budget = this._parseBudget(doc);

    const rating = this._parseRating(doc);

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
    };
  }
}

export default MoviesScrapper;
