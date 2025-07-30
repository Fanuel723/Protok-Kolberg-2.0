# Przewodnik Wdrożenia Protokół Kolberg 2.0 PWA

Ten przewodnik zawiera szczegółowe instrukcje dotyczące wdrożenia aplikacji Protokół Kolberg 2.0 PWA na popularnych platformach hostingowych. Aplikacja składa się z dwóch głównych części: frontendu (PWA) i backendu (Flask API).

## 1. Struktura Projektu

Po przygotowaniu do wdrożenia, struktura projektu powinna wyglądać następująco:

```
protokol_kolberg_deployment/
├── frontend/             # Pliki statyczne PWA (HTML, CSS, JS, manifest, icons, sw.js)
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   ├── pwa-enhanced.js
│   ├── ui-enhanced.js
│   ├── map-enhanced.js
│   ├── ui-components.css
│   ├── manifest.json
│   ├── sw.js
│   ├── offline.html
│   └── assets/
│       └── icons/        # Ikony PWA
├── backend/              # Aplikacja Flask (Python)
│   ├── main.py
│   └── requirements.txt
└── docs/                 # Dokumentacja (ten przewodnik)
    └── deployment_guide.md
```

## 2. Wdrożenie Frontendu (PWA) na GitHub Pages

GitHub Pages to usługa hostingowa oferowana przez GitHub, która pozwala na hostowanie statycznych stron internetowych bezpośrednio z repozytorium GitHub. Jest to idealne rozwiązanie dla aplikacji PWA, ponieważ są one w dużej mierze statyczne i korzystają z Service Workerów do obsługi offline.

### Wymagania Wstępne:

1.  **Konto GitHub:** Upewnij się, że masz aktywne konto GitHub.
2.  **Repozytorium Git:** Twój kod frontendu musi znajdować się w repozytorium Git (np. GitHub).

### Kroki Wdrożenia:

#### Krok 1: Utwórz Repozytorium GitHub

1.  Zaloguj się do swojego konta GitHub.
2.  Utwórz nowe, **publiczne** repozytorium (np. `kolberg-pwa`). Nazwa repozytorium będzie częścią URL Twojej strony.

#### Krok 2: Prześlij Pliki Frontendu do Repozytorium

1.  Przejdź do katalogu `frontend` w swoim lokalnym projekcie:

    ```bash
    cd protokol_kolberg_deployment/frontend
    ```

2.  Zainicjuj lokalne repozytorium Git (jeśli jeszcze tego nie zrobiłeś):

    ```bash
    git init
    ```

3.  Dodaj wszystkie pliki do śledzenia:

    ```bash
    git add .
    ```

4.  Zatwierdź zmiany:

    ```bash
    git commit -m "Initial commit of Kolberg PWA frontend"
    ```

5.  Dodaj zdalne repozytorium GitHub:

    ```bash
    git remote add origin https://github.com/<nazwa_uzytkownika>/kolberg-pwa.git
    ```
    (Zastąp `<nazwa_uzytkownika>` swoją nazwą użytkownika GitHub i `kolberg-pwa` nazwą swojego repozytorium).

6.  Wypchnij pliki na GitHub:

    ```bash
    git push -u origin main
    ```

#### Krok 3: Skonfiguruj GitHub Pages

1.  Na GitHub, przejdź do swojego repozytorium (`kolberg-pwa`).
2.  Kliknij zakładkę **"Settings"**.
3.  W lewym menu bocznym kliknij **"Pages"**.
4.  W sekcji "Build and deployment" -> "Source", wybierz gałąź, z której chcesz wdrożyć (zazwyczaj `main` lub `master`).
5.  Upewnij się, że katalog źródłowy jest ustawiony na `/ (root)`. Jeśli Twoje pliki frontendu znajdują się w podkatalogu, musisz to odpowiednio skonfigurować.
6.  Kliknij **"Save"**.

GitHub Pages automatycznie zbuduje i wdroży Twoją aplikację. Proces ten może potrwać kilka minut. Po zakończeniu, URL Twojej aplikacji będzie widoczny w sekcji "Pages" i będzie wyglądał podobnie do:

`https://<nazwa_uzytkownika>.github.io/<nazwa_repozytorium>/`

### Konfiguracja PWA na GitHub Pages

GitHub Pages obsługuje pliki `manifest.json` i `sw.js` (Service Worker). Upewnij się, że ścieżki do tych plików w `index.html` i `manifest.json` są poprawne i względne do katalogu głównego aplikacji (np. `/manifest.json`, `/sw.js`).

## 3. Wdrożenie Backendu (Flask API) na Render.com

Render.com to platforma do hostowania aplikacji webowych, API, baz danych i innych usług. Jest to dobre rozwiązanie dla aplikacji Flask, ponieważ oferuje łatwe wdrożenie i skalowanie.

### Wymagania Wstępne:

1.  **Konto Render.com:** Zarejestruj się na Render.com.
2.  **Repozytorium Git:** Twój kod backendu musi znajdować się w repozytorium Git (np. GitHub, GitLab, Bitbucket).

### Kroki Wdrożenia:

#### Krok 1: Przygotuj Pliki Backendu

Upewnij się, że Twój plik `main.py` zawiera logikę uruchamiającą serwer Flask (np. `app.run(host=\'0.0.0.0\', port=os.environ.get(\'PORT\', 5000))`).

Upewnij się, że plik `requirements.txt` zawiera wszystkie zależności Pythona, w tym `gunicorn` (Render używa Gunicorn do uruchamiania aplikacji Python).

```
Flask==2.3.3
Flask-CORS==4.0.0
requests==2.31.0
python-dotenv==1.0.0
Pillow==10.0.1
gunicorn==21.2.0
MarkupSafe==2.1.3
itsdangerous==2.1.2
click==8.1.7
blinker==1.6.3
```

#### Krok 2: Utwórz Nową Usługę Webową na Render.com

1.  Zaloguj się do swojego panelu Render.com.
2.  Kliknij **"New"** -> **"Web Service"**.
3.  Połącz swoje konto Git i wybierz repozytorium zawierające kod backendu (katalog `backend`).
4.  Skonfiguruj usługę:
    -   **Name:** `kolberg-backend` (lub inna nazwa)
    -   **Region:** Wybierz najbliższy region.
    -   **Branch:** `main` (lub inna gałąź)
    -   **Root Directory:** `/backend` (ścieżka do katalogu z plikami backendu w repozytorium)
    -   **Runtime:** `Python 3`
    -   **Build Command:** `pip install -r requirements.txt`
    -   **Start Command:** `gunicorn main:app` (gdzie `main` to nazwa pliku Pythona, a `app` to instancja Flask aplikacji w tym pliku)

5.  Kliknij **"Create Web Service"**.

Render automatycznie zbuduje i wdroży Twoją aplikację. Możesz monitorować postęp wdrożenia w logach.

### Konfiguracja Zmiennych Środowiskowych (Opcjonalnie)

Jeśli Twoja aplikacja Flask używa zmiennych środowiskowych (np. dla kluczy API), możesz je skonfigurować w panelu Render.com w sekcji **"Environment"** dla Twojej usługi webowej.

### Skalowanie i Monitorowanie

Render.com oferuje opcje skalowania (ręcznego i automatycznego) oraz monitorowania logów i metryk Twojej aplikacji.

## 4. Połączenie Frontendu z Backendem

Po wdrożeniu frontendu i backendu, musisz zaktualizować frontend, aby wskazywał na URL wdrożonego backendu.

1.  **Uzyskaj URL Backendu:** Po wdrożeniu backendu na Render.com, otrzymasz publiczny URL (np. `https://kolberg-backend.onrender.com`).
2.  **Zaktualizuj `app.js`:** Otwórz plik `app.js` w katalogu `frontend` i zmień zmienną `this.apiBase` na URL Twojego wdrożonego backendu:

    ```javascript
    class ProtocolKolbergApp {
        constructor() {
            this.apiBase = \'https://kolberg-backend.onrender.com/api\'; // Zaktualizuj na swój URL backendu
            // ...
        }
        // ...
    }
    ```

3.  **Ponowne Wdrożenie Frontendu:** Po zmianie w `app.js`, musisz ponownie wdrożyć frontend na GitHub Pages. Wystarczy, że zatwierdzisz i wypchniesz zmiany do swojego repozytorium GitHub, a GitHub Pages automatycznie zaktualizuje Twoją stronę.

Teraz Twój frontend PWA będzie komunikował się z wdrożonym backendem.

## 5. Dalsze Kroki i Optymalizacje

-   **Wdrożenie Google Maps API Key:** Aby w pełni wykorzystać funkcjonalność mapy, musisz uzyskać klucz API Google Maps i zintegrować go z aplikacją. Zazwyczaj odbywa się to poprzez dodanie skryptu Google Maps API z Twoim kluczem do `index.html`.
-   **Integracja z Prawdziwymi Usługami AI:** Zastąp mockowane odpowiedzi w backendzie rzeczywistymi wywołaniami do Gemini Pro, Perplexity API lub innych usług AI.
-   **Powiadomienia Push:** Skonfiguruj powiadomienia push, aby użytkownicy mogli otrzymywać aktualizacje nawet wtedy, gdy aplikacja jest zamknięta. Wymaga to konfiguracji po stronie backendu (wysyłanie powiadomień) i frontendu (subskrypcja powiadomień).
-   **Monitorowanie i Logowanie:** Skonfiguruj narzędzia do monitorowania i logowania, aby śledzić wydajność i błędy wdrożonej aplikacji.
-   **Custom Domain:** Skonfiguruj własną domenę dla frontendu i backendu, aby aplikacja była dostępna pod bardziej przyjaznym adresem.

Ten przewodnik powinien stanowić solidną podstawę do wdrożenia Twojej aplikacji Protokół Kolberg 2.0 PWA. Pamiętaj, aby zawsze odnosić się do oficjalnej dokumentacji GitHub Pages i Render.com w przypadku pytań lub problemów. Powodzenia w podróży przez Krainy Wiedźmina!

