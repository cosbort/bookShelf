import requests
from typing import Optional, Dict
import logging

class BookAPI:
    GOOGLE_BOOKS_URL = "https://www.googleapis.com/books/v1/volumes"
    OPEN_LIBRARY_URL = "https://openlibrary.org/api/books"

    @staticmethod
    def fetch_book_info(isbn: str) -> Optional[Dict]:
        """
        Recupera le informazioni del libro usando prima Google Books API,
        se non trova risultati prova con Open Library
        """
        # Prova prima con Google Books
        try:
            params = {"q": f"isbn:{isbn}"}
            response = requests.get(BookAPI.GOOGLE_BOOKS_URL, params=params)
            response.raise_for_status()
            data = response.json()

            if data.get("totalItems", 0) > 0:
                book_info = data["items"][0]["volumeInfo"]
                return {
                    "title": book_info.get("title", ""),
                    "author": ", ".join(book_info.get("authors", [])),
                    "year_published": book_info.get("publishedDate", "")[:4],
                    "genre": ", ".join(book_info.get("categories", [])),
                    "cover_url": book_info.get("imageLinks", {}).get("thumbnail", ""),
                    "description": book_info.get("description", ""),
                }

        except Exception as e:
            logging.error(f"Errore nel recupero da Google Books: {str(e)}")

        # Se Google Books fallisce, prova con Open Library
        try:
            params = {"bibkeys": f"ISBN:{isbn}", "format": "json", "jscmd": "data"}
            response = requests.get(f"{BookAPI.OPEN_LIBRARY_URL}?bibkeys=ISBN:{isbn}&format=json&jscmd=data")
            response.raise_for_status()
            data = response.json()

            if data:
                book_info = data.get(f"ISBN:{isbn}", {})
                return {
                    "title": book_info.get("title", ""),
                    "author": ", ".join(author.get("name", "") for author in book_info.get("authors", [])),
                    "year_published": book_info.get("publish_date", "")[:4],
                    "genre": ", ".join(book_info.get("subjects", [])[:3]),
                    "cover_url": book_info.get("cover", {}).get("large", ""),
                    "description": book_info.get("description", ""),
                }

        except Exception as e:
            logging.error(f"Errore nel recupero da Open Library: {str(e)}")

        return None

    @staticmethod
    def download_cover_image(url: str) -> Optional[bytes]:
        """
        Scarica l'immagine della copertina dall'URL fornito
        """
        try:
            response = requests.get(url)
            response.raise_for_status()
            return response.content
        except Exception as e:
            logging.error(f"Errore nel download della copertina: {str(e)}")
            return None
