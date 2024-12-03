import requests
from typing import Optional, Dict
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class BookAPI:
    GOOGLE_BOOKS_URL = "https://www.googleapis.com/books/v1/volumes"
    OPEN_LIBRARY_URL = "https://openlibrary.org/api/books"

    @staticmethod
    def fetch_book_info(isbn: str) -> Optional[Dict]:
        """
        Recupera le informazioni del libro usando prima Google Books API,
        se non trova risultati prova con Open Library
        """
        logger.debug(f"Cercando informazioni per ISBN: {isbn}")
        
        # Prova prima con Google Books
        try:
            params = {"q": f"isbn:{isbn}"}
            logger.debug(f"Chiamata API Google Books con parametri: {params}")
            response = requests.get(BookAPI.GOOGLE_BOOKS_URL, params=params)
            response.raise_for_status()
            data = response.json()
            logger.debug(f"Risposta Google Books: {data}")

            if data.get("totalItems", 0) > 0:
                book_info = data["items"][0]["volumeInfo"]
                result = {
                    "title": book_info.get("title", ""),
                    "author": ", ".join(book_info.get("authors", [])),
                    "year_published": book_info.get("publishedDate", "")[:4],
                    "genre": ", ".join(book_info.get("categories", [])),
                    "cover_url": book_info.get("imageLinks", {}).get("thumbnail", ""),
                    "description": book_info.get("description", ""),
                }
                logger.debug(f"Informazioni libro trovate: {result}")
                return result

        except Exception as e:
            logger.error(f"Errore nel recupero da Google Books: {str(e)}")

        # Se Google Books fallisce, prova con Open Library
        try:
            logger.debug("Tentativo con Open Library")
            params = {"bibkeys": f"ISBN:{isbn}", "format": "json", "jscmd": "data"}
            response = requests.get(f"{BookAPI.OPEN_LIBRARY_URL}?bibkeys=ISBN:{isbn}&format=json&jscmd=data")
            response.raise_for_status()
            data = response.json()
            logger.debug(f"Risposta Open Library: {data}")

            if data:
                book_info = data.get(f"ISBN:{isbn}", {})
                result = {
                    "title": book_info.get("title", ""),
                    "author": ", ".join(author.get("name", "") for author in book_info.get("authors", [])),
                    "year_published": book_info.get("publish_date", "")[:4],
                    "genre": ", ".join(book_info.get("subjects", [])[:3]),
                    "cover_url": book_info.get("cover", {}).get("large", ""),
                    "description": book_info.get("description", ""),
                }
                logger.debug(f"Informazioni libro trovate da Open Library: {result}")
                return result

        except Exception as e:
            logger.error(f"Errore nel recupero da Open Library: {str(e)}")

        logger.warning("Nessuna informazione trovata per questo ISBN")
        return None

    @staticmethod
    def download_cover_image(url: str) -> Optional[bytes]:
        """
        Scarica l'immagine della copertina dall'URL fornito
        """
        try:
            logger.debug(f"Tentativo di download copertina da: {url}")
            response = requests.get(url)
            response.raise_for_status()
            logger.debug("Download copertina completato con successo")
            return response.content
        except Exception as e:
            logger.error(f"Errore nel download della copertina: {str(e)}")
            return None
