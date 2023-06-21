import MoviesScrapper from './MoviesScraper.js';

const scrapper = new MoviesScrapper();
window.scrapper = scrapper;

window.scrapper.loadMovies();
