# Gestione Sequenze - Applicazione Flask

Un'applicazione web per la gestione di sequenze di produzione con database SQLite e interfaccia web responsiva.

## 🚀 Avvio con Docker

### Prerequisiti
- Docker Desktop installato e funzionante
- Porta 5123 disponibile sul sistema

### Istruzioni per l'avvio

#### 1. Clona o scarica il progetto
```bash
git clone <repository-url>
cd "Programma singore"
```

#### 2. Costruisci l'immagine Docker
```bash
docker build -t flaskapp_image .
```

#### 3. Avvia il container
```bash
docker run -d -p 5123:5123 --name flaskapp_container flaskapp_image
```

#### 4. Accedi all'applicazione
- **Locale**: http://localhost:5123
- **Da altri PC nella rete**: http://[IP_DEL_TUO_PC]:5123

### Comandi utili Docker

#### Verifica se il container è in esecuzione
```bash
docker ps
```

#### Ferma il container
```bash
docker stop flaskapp_container
```

#### Riavvia il container
```bash
docker start flaskapp_container
```

#### Rimuovi il container (se non serve più)
```bash
docker stop flaskapp_container
docker rm flaskapp_container
```

#### Visualizza i log del container
```bash
docker logs flaskapp_container
```

#### Ricostruisci completamente (dopo modifiche al codice)
```bash
docker stop flaskapp_container
docker rm flaskapp_container
docker build -t flaskapp_image .
docker run -d -p 5123:5123 --name flaskapp_container flaskapp_image
```

### 🌐 Accesso da altri dispositivi nella rete

#### Su Windows
1. Trova l'IP del PC con `ipconfig` nel Command Prompt
2. Cerca la sezione "Wireless LAN adapter Wi-Fi" o "Ethernet adapter"
3. Da altri dispositivi: http://[IP_WINDOWS]:5123

#### Su macOS
1. Trova l'IP del Mac con `ifconfig | grep "inet " | grep -v "127.0.0.1"`
2. Da altri dispositivi: http://[IP_MAC]:5123

#### Su Linux
1. Trova l'IP con `ip addr show` o `hostname -I`
2. Da altri dispositivi: http://[IP_LINUX]:5123

### 🔧 Risoluzione problemi comuni

#### Il container non si avvia
- Verifica che Docker Desktop sia in esecuzione
- Controlla che la porta 5123 non sia già in uso: `netstat -an | grep 5123`

#### Non riesco ad accedere da altri PC
- Verifica che il firewall permetta connessioni sulla porta 5123
- Assicurati che tutti i dispositivi siano sulla stessa rete locale
- Su Windows, controlla le impostazioni di rete nelle opzioni di Docker Desktop

#### Modifiche al codice non si riflettono
- Devi ricostruire l'immagine Docker con il comando di ricostruzione completa sopra

### 📁 Struttura del progetto

```
Programma singore/
├── app.py                 # Server Flask principale
├── Dockerfile            # Configurazione Docker
├── requirements.txt      # Dipendenze Python
├── database/             # Database SQLite (creato automaticamente)
├── static/              # File CSS e JavaScript
│   ├── style.css
│   ├── script.js
│   └── sequence.js
└── templates/           # Template HTML
    ├── index.html
    └── sequence.html
```

### 🎯 Funzionalità dell'applicazione

- **Inserimento dati**: Pagina principale per aggiungere nuovi elementi
- **Gestione sequenze**: 7 sequenze separate (SEQ 1-7)
- **Modifica elementi**: Possibilità di modificare tutti i campi, incluso il numero di sequenza
- **Eliminazione**: Rimozione singola o svuotamento completo sequenze
- **Ordinamento**: Gli elementi con "REINTEGRO" appaiono sempre per primi
- **Responsive**: Interfaccia ottimizzata per desktop e dispositivi mobili

### 🏗️ Tecnologie utilizzate

- **Backend**: Python Flask + Waitress WSGI server
- **Database**: SQLite
- **Frontend**: HTML5, CSS3, JavaScript vanilla
- **Containerizzazione**: Docker

---

**Nota**: Il database viene creato automaticamente al primo avvio e i dati persistono finché il container non viene rimosso.
