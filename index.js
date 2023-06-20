import MoviesScrapper from "./MoviesScraper.js";

const scrapper = new MoviesScrapper();
window.scrapper = scrapper;



scrapper.loadMovies()
