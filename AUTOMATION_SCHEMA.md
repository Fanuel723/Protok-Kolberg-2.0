# Protokół Kolberg 2.0 - Schemat Automatyzacji z Użyciem Narzędzi Google i n8n

## 1. Wprowadzenie

Ten dokument opisuje architekturę systemu automatyzacji, który odtwarza kluczowe funkcjonalności aplikacji PWA "Protokół Kolberg 2.0" przy użyciu darmowych, gotowych narzędzi: **Google Suite (Dysk, Formularze, Arkusze, My Maps)** oraz platformy do automatyzacji **n8n**.

Celem jest stworzenie w pełni zautomatyzowanego przepływu pracy, który jest elastyczny, skalowalny i nie wymaga utrzymywania dedykowanej aplikacji frontendowej.

## 2. Architektura Rozwiązania

System składa się z trzech głównych komponentów, które odpowiadają modułom oryginalnej aplikacji PWA:

*   **ASPID (Przetwarzanie Danych):** Realizowane przez połączenie Dysku Google, n8n (z OCR i walidacją AI) oraz Arkuszy Google.
*   **MKP2 (Komunikacja):** Realizowane przez Formularze Google, n8n i Arkusze Google.
*   **IMWDP (Wizualizacja Danych):** Realizowane przez Google My Maps zasilane danymi z Arkuszy Google.

![Diagram Architektury](https://i.imgur.com/your-diagram-image.png)  <-- *Placeholder dla diagramu*

---

### Moduł 1: ASPID - Zautomatyzowany System Pozyskiwania i Indeksowania Danych z Walidacją AI

Ten moduł automatyzuje proces przetwarzania dokumentów (np. skanów manuskryptów) od momentu ich dodania na Dysk Google aż po zapis przetworzonych danych w arkuszu.

**Przepływ pracy:**

1.  **Input (Wejście):** Użytkownik dodaje plik (obraz lub PDF) do dedykowanego folderu na **Dysku Google** (np. "Dokumenty do Analizy").
2.  **Trigger (Wyzwalacz n8n):** n8n monitoruje folder na Dysku Google i automatycznie uruchamia przepływ pracy po dodaniu nowego pliku.
3.  **Processing (Przetwarzanie w n8n):**
    *   **Krok 1: OCR:** n8n pobiera plik i używa wbudowanego węzła OCR lub zewnętrznego API do ekstrakcji tekstu.
    *   **Krok 2: Walidacja AI:** Wyodrębniony tekst jest przesyłany do modelu AI (np. OpenAI GPT lub darmowego, self-hosted) z zapytaniem o analizę (np. "Streszcz ten tekst", "Skategoryzuj ten dokument", "Wyodrębnij kluczowe postacie i miejsca").
    *   **Krok 3: Zapis danych:** n8n zapisuje wyniki w nowym wierszu w **Arkuszu Google** o nazwie "Baza Danych ASPID". Arkusz zawiera kolumny: `Nazwa Pliku`, `Data Dodania`, `Wyodrębniony Tekst (OCR)`, `Wynik Analizy AI`, `Link do Pliku na Dysku`.
4.  **Output (Wyjście):** Ustrukturyzowane, przeanalizowane dane są dostępne w Arkuszu Google, gotowe do dalszego wykorzystania.

---

### Moduł 2: MKP2 - Moduł Komunikacyjny

Ten moduł zastępuje symulator komunikacji, umożliwiając asynchroniczne przesyłanie wiadomości lub logów za pomocą prostego formularza.

**Przepływ pracy:**

1.  **Input (Wejście):** Użytkownik wypełnia **Formularz Google** o nazwie "Log Komunikacyjny", który zawiera pole na wiadomość.
2.  **Trigger (Wyzwalacz n8n):** n8n jest skonfigurowany tak, aby uruchamiać przepływ pracy po każdej nowej odpowiedzi w formularzu.
3.  **Processing (Przetwarzanie w n8n):**
    *   **Krok 1: Przechwycenie danych:** n8n pobiera treść wiadomości i sygnaturę czasową z odpowiedzi formularza.
    *   **Krok 2: Zapis danych:** n8n zapisuje te informacje w nowym wierszu w **Arkuszu Google** o nazwie "Logi Komunikacyjne MKP2". Arkusz zawiera kolumny: `Data`, `Wiadomość`.
4.  **Output (Wyjście):** Wszystkie wiadomości są centralnie logowane i archiwizowane w Arkuszu Google.

---

### Moduł 3: IMWDP - Interaktywny Moduł Wizualizacji Danych Przestrzennych

Ten moduł nie wymaga aktywnej automatyzacji w n8n, a opiera się na natywnej integracji Arkuszy Google z Google My Maps.

**Przepływ pracy:**

1.  **Input (Wejście):** W Arkuszu Google (np. w "Baza Danych ASPID") znajduje się kolumna z danymi geoprzestrzennymi (np. `Lokalizacja`, `Współrzędne GPS`). Dane te mogą być dodawane ręcznie lub wyodrębniane przez AI w module ASPID.
2.  **Processing (Przetwarzanie):**
    *   Użytkownik tworzy nową mapę w **Google My Maps**.
    *   Wybiera opcję "Importuj" i wskazuje Arkusz Google "Baza Danych ASPID" jako źródło danych.
    *   Mapuje kolumny z arkusza na znaczniki na mapie (np. używając kolumny `Lokalizacja` do umieszczania pinezek i kolumny `Wynik Analizy AI` jako opisu znacznika).
3.  **Output (Wyjście):** Interaktywna mapa z wizualizacją danych, którą można udostępniać za pomocą linku lub osadzić na stronie internetowej. Mapa jest automatycznie aktualizowana po ponownym zaimportowaniu danych z arkusza.

## 3. Konfiguracja Przepływów Pracy

Aby zaimportować i uruchomić dostarczone przepływy pracy n8n (`.json`), należy najpierw skonfigurować odpowiednie poświadczenia (Credentials) w n8n oraz zastąpić wartości-placeholdery w plikach JSON.

### a. Wymagane Poświadczenia w n8n

Przed importem przepływów, upewnij się, że w Twojej instancji n8n skonfigurowano następujące poświadczenia:
1.  **Google Account:** Połączenie OAuth2 z Twoim kontem Google, z uprawnieniami do Google Drive i Google Sheets. Zapisz ID tych poświadczeń.
2.  **OpenAI Account:** Połączenie z Twoim kontem OpenAI, używające klucza API. Zapisz ID tych poświadczeń.

### b. Konfiguracja `n8n_workflow_data_processing_ai.json`

Otwórz plik i zastąp następujące placeholdery:
*   `YOUR_GOOGLE_CREDENTIALS_ID`: Wstaw ID poświadczeń Google z n8n.
*   `YOUR_OPENAI_CREDENTIALS_ID`: Wstaw ID poświadczeń OpenAI z n8n.
*   `YOUR_GOOGLE_DRIVE_FOLDER_ID`: Wstaw ID folderu z paska adresu w przeglądarce, gdy jesteś w tym folderze na Dysku Google.
*   `YOUR_GOOGLE_SHEET_ID`: Wstaw ID Arkusza Google, który ma przechowywać wyniki. Znajdziesz je w URL-u arkusza (np. `.../spreadsheets/d/THIS_IS_THE_ID/...`).

### c. Konfiguracja `n8n_workflow_communication_log.json`

Otwórz plik i zastąp następujące placeholdery:
*   `YOUR_GOOGLE_CREDENTIALS_ID`: Wstaw ID poświadczeń Google z n8n.
*   `YOUR_GOOGLE_FORM_ID`: Wstaw ID Formularza Google, które znajdziesz w jego URL-u.
*   `YOUR_GOOGLE_SHEET_ID_FOR_LOGS`: Wstaw ID Arkusza Google dla logów komunikacyjnych.
*   `YOUR_QUESTION_ID_FROM_FORM`: Wstaw unikalne ID pytania z Twojego formularza. Aby je znaleźć, w n8n po pierwszym uruchomieniu przepływu, sprawdź dane wyjściowe z węzła "On New Form Submission". Zobaczysz tam strukturę odpowiedzi, która zawiera ID każdego pytania.

## 4. Podsumowanie

Przedstawiony schemat automatyzacji pozwala na odtworzenie wszystkich kluczowych funkcjonalności aplikacji PWA w sposób bezkosztowy (przy założeniu darmowych limitów użycia narzędzi) i wysoce elastyczny. Eliminuje potrzebę utrzymywania kodu frontendowego i backendowego, przenosząc całą logikę do konfigurowalnych przepływów pracy w n8n i sprawdzonych narzędzi Google. Po prawidłowej konfiguracji, system będzie działał w pełni autonomicznie.