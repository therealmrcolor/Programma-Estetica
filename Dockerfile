# Usa un'immagine base Python ufficiale
FROM python:3.13-slim

# Imposta la directory di lavoro nell'immagine
WORKDIR /app

# Copia i file dei requisiti e installa le dipendenze
COPY requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copia il resto del codice dell'applicazione nella directory /app
COPY . .

# Crea la directory per il database se non esiste (opzionale, ma buona pratica)
# e assicurati che l'utente con cui gira l'app abbia i permessi
RUN mkdir -p /app/database && chown -R nobody:nogroup /app/database
# Se il tuo container gira con un utente specifico, usa quell'utente invece di nobody:nogroup

# Esponi la porta su cui l'applicazione ascolterà
EXPOSE 5123

# Comando per eseguire l'applicazione quando il container si avvia
# Nota: Non usiamo 'if __name__ == "__main__":' qui,
# Docker eseguirà direttamente il comando specificato.
# Se il tuo `app.py` ha il `serve(app, ...)` direttamente eseguibile,
# allora 'python app.py' va bene.
# Altrimenti, puoi usare waitress-serve direttamente.
CMD ["python", "app.py"]
# OPPURE (se non vuoi il `serve` in `if __name__ == '__main__':`)
# CMD ["waitress-serve", "--host=0.0.0.0", "--port=5123", "app:app"]