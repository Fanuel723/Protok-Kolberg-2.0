# Protokół Kolberg 2.0 - Rewritten

## Opis Projektu

**Protokół Kolberg 2.0** to zaawansowana aplikacja internetowa typu PWA (Progressive Web App) przeznaczona do gromadzenia, analizy i wizualizacji danych na temat lokalnych legend, tajemniczych opowieści i niewyjaśnionych zjawisk. Aplikacja została przepisana od zera w celu zapewnienia stabilności, bezpieczeństwa i nowoczesnej architektury.

Główne moduły aplikacji to:
-   **ASPID:** Zautomatyzowany system do przesyłania i wstępnego przetwarzania plików (zdjęć, nagrań audio).
-   **MKP2:** Moduł komunikacyjny do przesyłania krótkich wiadomości tekstowych.
-   **IMWDP:** Interaktywny moduł mapy do wizualizacji danych geograficznych.
-   **Panel Analityczny:** Zabezpieczony panel administracyjny do zarządzania, kategoryzowania i weryfikowania zgłoszeń.

## Instalacja i Uruchomienie

### Wymagania
- Python 3.8+
- `pip` (manager pakietów Pythona)

### Kroki instalacyjne

1.  **Sklonuj repozytorium:**
    ```bash
    git clone <adres-repozytorium>
    cd <nazwa-katalogu>
    ```

2.  **Zainstaluj zależności:**
    ```bash
    pip install -r requirements.txt
    ```

3.  **Zainicjalizuj bazę danych (tylko przy pierwszym uruchomieniu!):**
    *   Ten skrypt tworzy plik `database.db` i konfiguruje niezbędne tabele. Uruchamiaj go tylko raz.
    ```bash
    python init_database.py
    ```

4.  **Uruchom aplikację:**
    ```bash
    python main.py
    ```
    Aplikacja będzie dostępna pod adresem `http://127.0.0.1:5000`.

## Konfiguracja API (Zmienne Środowiskowe)

Aby w pełni wykorzystać możliwości aplikacji, w szczególności automatyczną analizę AI, należy skonfigurować następujące zmienne środowiskowe. Można to zrobić, tworząc plik `.env` w głównym katalogu projektu i umieszczając w nim poniższe wpisy, lub eksportując je bezpośrednio w terminalu.

### Klucz API - Gemini (Analiza Tekstu)

-   **Zmienna:** `GEMINI_API_KEY`
-   **Opis:** Klucz dostępowy do Google Gemini API, używany do funkcji "Analizuj z AI" w panelu analityka.
-   **Przykład:**
    ```
    GEMINI_API_KEY="TWOJ_KLUCZ_API_GEMINI"
    ```

### Klucze API - Google Cloud (OCR i Transkrypcja)

-   **Zmienna:** `GOOGLE_APPLICATION_CREDENTIALS`
-   **Opis:** Ścieżka do pliku JSON z kluczem serwisowym Google Cloud. Ten klucz jest niezbędny do działania funkcji OCR (Vision API) oraz transkrypcji audio (Speech-to-Text API).
-   **Instrukcja:**
    1.  Przejdź do [Google Cloud Console](https://console.cloud.google.com/).
    2.  Wybierz swój projekt i przejdź do "IAM & Admin" > "Service Accounts".
    3.  Utwórz nowe konto serwisowe, nadaj mu rolę "Cloud Vision AI User" i "Cloud Speech-to-Text User".
    4.  Wygeneruj nowy klucz w formacie JSON i pobierz go na swój komputer.
-   **Przykład:**
    ```
    GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/gcloud-credentials.json"
    ```
    **Uwaga:** Jeśli ta zmienna nie zostanie ustawiona, funkcje OCR i transkrypcji zostaną bezpiecznie pominięte, a aplikacja będzie nadal działać.

### Dane Logowania Administratora

-   **Zmienne:** `ADMIN_USERNAME` i `ADMIN_PASSWORD`
-   **Opis:** Dane logowania do panelu analitycznego.
-   **Przykład:**
    ```
    ADMIN_USERNAME="admin"
    ADMIN_PASSWORD="super_secret_password"
    ```

Dzięki tej konfiguracji, wszystkie klucze i dane wrażliwe są bezpiecznie oddzielone od kodu aplikacji.
