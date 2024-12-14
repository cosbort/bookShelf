from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
from flask_sqlalchemy import SQLAlchemy
from werkzeug.utils import secure_filename
from PIL import Image
import os
from book_api import BookAPI
import uuid
from io import BytesIO
import logging

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your_secret_key_here'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///library.db'
app.config['UPLOAD_FOLDER'] = 'static/covers'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

db = SQLAlchemy(app)

class Book(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    author = db.Column(db.String(200), nullable=False)
    isbn = db.Column(db.String(20), unique=True)
    cover_image = db.Column(db.String(300))
    year_published = db.Column(db.Integer)
    genre = db.Column(db.String(100))
    
    # Campi di lettura
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    reading_status = db.Column(db.String(50))  # Es. "In corso", "Completato", "Non iniziato"
    
    # Note di lettura
    personal_notes = db.Column(db.Text)
    rating = db.Column(db.Integer)  # Valutazione da 1 a 5

    def __repr__(self):
        return f'<Book {self.title}>'

@app.route('/')
def index():
    books = Book.query.all()
    return render_template('index.html', books=books)

@app.route('/fetch_book_info/<isbn>')
def fetch_book_info(isbn):
    app.logger.debug(f"Ricevuta richiesta per ISBN: {isbn}")
    book_info = BookAPI.fetch_book_info(isbn)
    if not book_info:
        app.logger.warning(f"Nessuna informazione trovata per ISBN: {isbn}")
        flash(f'Nessuna informazione trovata per il codice ISBN: {isbn}. Verifica che il codice sia corretto.', 'warning')
        return jsonify({"error": "Libro non trovato"}), 404
    app.logger.debug(f"Informazioni libro trovate: {book_info}")
    flash('Informazioni libro recuperate con successo!', 'success')
    return jsonify(book_info)

@app.route('/fetch_book_info_by_title/<title>')
def fetch_book_info_by_title(title):
    app.logger.debug(f"Ricevuta richiesta per titolo: {title}")
    book_info = BookAPI.fetch_book_info_by_title(title)
    if not book_info:
        app.logger.warning(f"Nessuna informazione trovata per il titolo: {title}")
        flash(f'Nessuna informazione trovata per il titolo: {title}', 'warning')
        return jsonify({"error": "Libro non trovato"}), 404
    app.logger.debug(f"Informazioni libro trovate: {book_info}")
    flash('Informazioni libro recuperate con successo!', 'success')
    return jsonify(book_info)

@app.route('/add_book', methods=['GET', 'POST'])
def add_book():
    if request.method == 'POST':
        isbn = request.form.get('isbn', '')
        cover_filename = None

        # Se è stato fornito un ISBN, prova a recuperare le informazioni online
        if isbn:
            book_info = BookAPI.fetch_book_info(isbn)
            if book_info and book_info.get('cover_url'):
                # Scarica la copertina
                cover_data = BookAPI.download_cover_image(book_info['cover_url'])
                if cover_data:
                    # Genera un nome file univoco per la copertina
                    cover_filename = f"{uuid.uuid4()}.jpg"
                    cover_path = os.path.join(app.config['UPLOAD_FOLDER'], cover_filename)
                    
                    # Salva e ridimensiona l'immagine
                    with Image.open(BytesIO(cover_data)) as img:
                        img.thumbnail((300, 300))
                        img.save(cover_path, 'JPEG')

        # Se non c'è una copertina da API, usa quella caricata dall'utente
        if not cover_filename:
            cover = request.files.get('cover')
            if cover and cover.filename:
                filename = secure_filename(cover.filename)
                cover_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                cover.save(cover_path)
                
                with Image.open(cover_path) as img:
                    img.thumbnail((300, 300))
                    img.save(cover_path)
                
                cover_filename = filename

        # Creazione nuovo libro
        new_book = Book(
            title=request.form['title'],
            author=request.form['author'],
            isbn=isbn,
            cover_image=cover_filename,
            year_published=request.form.get('year_published', type=int),
            genre=request.form.get('genre', ''),
            start_date=request.form.get('start_date'),
            end_date=request.form.get('end_date'),
            reading_status=request.form.get('reading_status', ''),
            personal_notes=request.form.get('personal_notes', ''),
            rating=request.form.get('rating', type=int)
        )
        
        db.session.add(new_book)
        db.session.commit()
        
        flash('Libro aggiunto con successo!', 'success')
        return redirect(url_for('index'))
    
    return render_template('add_book.html')

@app.route('/book/<int:book_id>')
def book_detail(book_id):
    book = Book.query.get_or_404(book_id)
    return render_template('book_detail.html', book=book)

@app.route('/edit_book/<int:book_id>', methods=['GET', 'POST'])
def edit_book(book_id):
    book = Book.query.get_or_404(book_id)
    
    if request.method == 'POST':
        # Logica di aggiornamento libro
        book.title = request.form['title']
        book.author = request.form['author']
        # Aggiungi altri campi da aggiornare
        
        db.session.commit()
        flash('Libro aggiornato con successo!', 'success')
        return redirect(url_for('book_detail', book_id=book.id))
    
    return render_template('edit_book.html', book=book)

@app.route('/delete_book/<int:book_id>', methods=['POST'])
def delete_book(book_id):
    book = Book.query.get_or_404(book_id)
    db.session.delete(book)
    db.session.commit()
    flash('Libro eliminato con successo!', 'success')
    return redirect(url_for('index'))

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
